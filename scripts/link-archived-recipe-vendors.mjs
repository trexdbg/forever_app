import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';

const fields = ['source_url', 'evidence_url', 'observed_at', 'observed_build', 'evidence_kind', 'evidence_note'];
const https = value => typeof value === 'string' && /^https:\/\/[^\s/]+\//.test(value);
const positiveId = value => Number.isSafeInteger(Number(value)) && Number(value) > 0;
const key = vendor => JSON.stringify([vendor.name_en, vendor.zone, vendor.recipe_item_id]);

export function verifyCatalogueRevision(revision, workingContent, cwd = fileURLToPath(new URL('..', import.meta.url))) {
  if (!/^[a-f0-9]{40}$/.test(revision ?? '')) throw Error('A reviewed catalogue commit SHA is required');
  let pinned;
  try {
    pinned = execFileSync('git', ['show', `${revision}:data/npcs.json`], {cwd, encoding:'utf8', maxBuffer:10_000_000, stdio:['ignore','pipe','pipe']});
  } catch {
    throw Error('Reviewed catalogue revision unavailable locally; fetch that commit before linking');
  }
  if (pinned !== workingContent) throw Error('Working catalogue differs from the reviewed revision; review and cite the matching commit');
}

// This is a join of two existing claims, never an inference from a recipe name:
// archive spell -> exact book ID; explicit documentary merchant -> same book ID.
export function missingDocumentedVendors(archive, npcs, {revision, linkedAt}) {
  if (!/^[a-f0-9]{40}$/.test(revision ?? '')) throw Error('A reviewed catalogue commit SHA is required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(linkedAt ?? '')) throw Error('A real linking date is required');
  const additions = [];
  for (const recipe of archive.recipes) {
    const existing = new Set(recipe.vendor_references.map(key));
    for (const npc of npcs.npcs.filter(n => n.role === 'merchant')) {
      for (const rawId of recipe.book_item_ids) {
        const id = Number(rawId);
        if (!positiveId(id) || !(npc.offers ?? []).some(offered => Number(offered) === id)) continue;
        const claim = npc.offer_details?.[String(id)];
        if (claim?.verification_status !== 'forever_documented' || claim.evidence_level !== 'documented_forever') continue;
        const vendorKey = key({name_en:npc.name, zone:npc.zone.id, recipe_item_id:id});
        if (existing.has(vendorKey)) continue;
        if (fields.some(field => typeof claim[field] !== 'string' || !claim[field].trim()) ||
            !https(claim.source_url) || !https(claim.evidence_url) ||
            claim.evidence_kind !== 'forever_community_page' && claim.evidence_kind !== 'forever_official_page' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(claim.observed_at)) {
          throw Error(`Incomplete documentary sale provenance: ${npc.name} / ${id}`);
        }
        const vendor = {
          name_en:npc.name, name_fr:npc.name_fr ?? null,
          npc_id:positiveId(npc.id) ? Number(npc.id) : null,
          zone:npc.zone.id, item_id:id, recipe_item_id:id,
          evidence_level:'documented_forever',
          ...Object.fromEntries(fields.map(field => [field, claim[field]])),
          source_catalogue_url:`https://github.com/trexdbg/forever_app/blob/${revision}/data/npcs.json`,
          linked_at:linkedAt,
          stock_status:'unknown_for_forever',
        };
        additions.push({spell_id:recipe.spell_id, vendor});
        existing.add(vendorKey);
      }
    }
  }
  return additions;
}

export function linkDocumentedVendors(archive, npcs, options) {
  const result = structuredClone(archive);
  const additions = missingDocumentedVendors(archive, npcs, options);
  for (const {spell_id, vendor} of additions) {
    result.recipes.find(recipe => recipe.spell_id === spell_id).vendor_references.push(vendor);
  }
  const links = result.recipes.flatMap(recipe => recipe.vendor_references);
  result.counts.vendor_reference_edges = links.length;
  result.counts.documented_forever_vendor_edges = links.filter(v => v.evidence_level === 'documented_forever').length;
  if (additions.length) result.updated_at = options.linkedAt;
  return {archive:result, additions};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const read = name => JSON.parse(readFileSync(new URL('../data/' + name, import.meta.url), 'utf8'));
  const original = read('recipes-forever-early-archive.json');
  const options = {revision:process.argv.find(a => a.startsWith('--revision='))?.slice(11),
    linkedAt:process.argv.find(a => a.startsWith('--date='))?.slice(7)};
  verifyCatalogueRevision(options.revision, readFileSync(new URL('../data/npcs.json', import.meta.url), 'utf8'));
  const {archive, additions} = linkDocumentedVendors(original, read('npcs.json'), options);
  if (process.argv.includes('--write')) {
    writeFileSync(new URL('../data/recipes-forever-early-archive.json', import.meta.url), JSON.stringify(archive, null, 2) + '\n');
  } else if (additions.length || JSON.stringify(archive.counts) !== JSON.stringify(original.counts)) {
    console.error(`Archive vendor links are stale: ${additions.length} missing documentary links`);
    process.exitCode = 1;
  }
  console.log(JSON.stringify({added:additions.length, vendor_reference_edges:archive.counts.vendor_reference_edges,
    documented_forever_vendor_edges:archive.counts.documented_forever_vendor_edges}));
}
