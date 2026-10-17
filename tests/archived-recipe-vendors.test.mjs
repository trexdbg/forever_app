import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {linkDocumentedVendors, missingDocumentedVendors, verifyCatalogueRevision} from '../scripts/link-archived-recipe-vendors.mjs';

const read = name => JSON.parse(readFileSync(new URL('../data/' + name, import.meta.url), 'utf8'));
const archive = read('recipes-forever-early-archive.json'), npcs = read('npcs.json');
const options = {revision:'2d6579def2edde2ec865f57ec4ffc00a9150d606', linkedAt:'2026-10-17'};
const added = archive.recipes.flatMap(r => r.vendor_references.filter(v => v.linked_at === options.linkedAt).map(v => ({r,v})));

test('citation commit must contain exactly the working catalogue before any write', () => {
  const cwd=fileURLToPath(new URL('..',import.meta.url));
  const revision=execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim();
  const raw=readFileSync(new URL('../data/npcs.json',import.meta.url),'utf8');
  verifyCatalogueRevision(revision,raw,cwd);
  assert.throws(()=>verifyCatalogueRevision(revision,raw+'\n',cwd),/differs/);
  assert.throws(()=>verifyCatalogueRevision('0'.repeat(40),raw,cwd),/unavailable/);
});

test('NPC-only changes run the cross-catalogue gate and both localized pages bust the data loader cache', () => {
  const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
  assert.match(read('.github/workflows/early-forever-recipes.yml'),/'data\/npcs.json'/);
  assert.match(read('assets/recipes-early.js'),/recipes-forever-early-archive\.json\?v=20261017-vendors-1/);
  for(const path of ['metiers/index.html','en/metiers/index.html'])assert.match(read(path),/recipes-early\.js\?v=20261017-vendors-1/);
});

test('275 new exact book/vendor links enrich 166 recipes across seven professions', () => {
  assert.equal(added.length,275);
  assert.equal(new Set(added.map(({r}) => r.spell_id)).size,166);
  assert.equal(new Set(added.map(({v}) => v.recipe_item_id)).size,166);
  assert.equal(new Set(added.map(({v}) => v.name_en)).size,14);
  const counts = {};
  for (const {r} of added) counts[r.profession_en] = (counts[r.profession_en] ?? 0) + 1;
  assert.deepEqual(counts,{Cooking:1,Enchanting:12,Alchemy:10,Blacksmithing:61,Leatherworking:96,Tailoring:84,Engineering:11});
  assert.equal(archive.recipes.filter(r => r.vendor_references.length).length,226);
  assert.equal(archive.counts.vendor_reference_edges,436);
  assert.equal(archive.counts.documented_forever_vendor_edges,300);
});

test('new links carry the exact original sale provenance, never live stock or invented NPC IDs', () => {
  for (const {r,v} of added) {
    assert.ok(r.book_item_ids.includes(v.recipe_item_id));
    assert.equal(v.item_id,v.recipe_item_id);
    const sellers = npcs.npcs.filter(n => n.role === 'merchant' && n.name === v.name_en && n.zone.id === v.zone && n.offers.map(Number).includes(v.item_id));
    assert.equal(sellers.length,1);
    const npc = sellers[0], claim = npc.offer_details[String(v.item_id)];
    assert.equal(v.npc_id,Number.isSafeInteger(npc.id) && npc.id > 0 ? npc.id : null);
    assert.equal(v.name_fr,npc.name_fr ?? null);
    for (const field of ['evidence_level','source_url','evidence_url','observed_at','observed_build','evidence_kind','evidence_note']) {
      assert.ok(v[field]);
      assert.equal(v[field],claim[field]);
    }
    assert.equal(v.evidence_level,'documented_forever');
    assert.equal(v.stock_status,'unknown_for_forever');
    assert.equal(v.source_catalogue_url,`https://github.com/trexdbg/forever_app/blob/${options.revision}/data/npcs.json`);
    assert.equal(v.price,undefined);
    assert.equal(v.coordinates,undefined);
    assert.equal(r.sources.evidence_level,'datamined');
    assert.equal(r.sources.availability_in_game,null);
    assert.equal(r.learning_skill_required,null);
    assert.ok(r.outputs.every(o => o.verified_live_yield === null));
  }
});

test('old 161 references including 136 Classic fallbacks are preserved byte-for-value', () => {
  const original = archive.recipes.map(r => [r.spell_id,r.vendor_references.filter(v => !v.linked_at)]);
  assert.equal(original.flatMap(([,vs]) => vs).length,161);
  assert.equal(original.flatMap(([,vs]) => vs).filter(v => v.evidence_level === 'classic_reference').length,136);
  assert.equal(createHash('sha256').update(JSON.stringify(original)).digest('hex'),'246b985fbce9b75d63c858ba8c20c55f9deb550e71b3bbb5c2d9480b29820967');
});

test('join is complete, deterministic, non-mutating and idempotent', () => {
  assert.deepEqual(missingDocumentedVendors(archive,npcs,options),[]);
  const before = structuredClone(archive);
  assert.deepEqual(linkDocumentedVendors(archive,npcs,options).archive,archive);
  assert.deepEqual(archive,before);
  for (const r of archive.recipes) {
    const keys = r.vendor_references.map(v => JSON.stringify([v.name_en,v.zone,v.recipe_item_id]));
    assert.equal(new Set(keys).size,keys.length);
  }
});

const fixture = () => {
  const {r,v} = added[0];
  const npc = structuredClone(npcs.npcs.find(n => n.name === v.name_en && n.zone.id === v.zone));
  const recipe = {...structuredClone(r), vendor_references:[]};
  return {a:{recipes:[recipe],counts:{}}, n:{npcs:[npc]}, npc, recipe, id:v.item_id};
};

test('same name, unrelated output, offer without proof, and Classic-only claim never establish a sale', () => {
  for (const mutate of [
    f => f.recipe.book_item_ids.splice(0),
    f => f.npc.offers = [],
    f => delete f.npc.offer_details[String(f.id)],
    f => f.npc.offer_details[String(f.id)].evidence_level = 'classic_reference',
    f => delete f.npc.offer_details[String(f.id)].verification_status,
  ]) {
    const f = fixture(); mutate(f);
    assert.deepEqual(missingDocumentedVendors(f.a,f.n,options),[]);
  }
});

test('incomplete claimed Forever proof is rejected, never silently promoted', () => {
  for (const field of ['source_url','evidence_url','observed_at','observed_build','evidence_kind','evidence_note']) {
    const f = fixture(); delete f.npc.offer_details[String(f.id)][field];
    assert.throws(() => missingDocumentedVendors(f.a,f.n,options),/Incomplete documentary/);
  }
  assert.throws(() => missingDocumentedVendors(archive,npcs,{...options,revision:'main'}),/commit SHA/);
});

test('a duplicate input merchant cannot create duplicate links; unknown identity remains null', () => {
  const f = fixture(); f.npc.id = null; f.n.npcs.push(structuredClone(f.npc));
  const result = missingDocumentedVendors(f.a,f.n,options);
  assert.equal(result.length,1);
  assert.equal(result[0].vendor.npc_id,null);
});

// Execute the production renderer with its existing lazy-load event, not a copy
// of its rendering logic. Layout/browser QA is outside this data-only change.
for (const lang of ['fr','en']) test(`${lang}: real lazy renderer searches new merchants and shows source badges and links`, async () => {
  class Element {
    constructor(tag='div') { this.tagName=tag; this.children=[]; this.events={}; this.dataset={}; this.value=''; this._text=''; }
    append(child) { this.children.push(child); }
    replaceChildren(...children) { this.children=children; this._text=''; }
    set textContent(text) { this._text=String(text); this.children=[]; }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(' '); }
    addEventListener(event,fn) { this.events[event]=fn; }
    setAttribute(name,value) { this[name]=value; }
    scrollIntoView() {}
  }
  const elements = new Map();
  const get = id => { if (!elements.has(id)) elements.set(id,new Element()); return elements.get(id); };
  get('early-recipe-profession').value='all'; get('early-recipe-change').value='all';
  const walk = el => [el,...el.children.flatMap(walk)];
  runInNewContext(readFileSync(new URL('../assets/recipes-early.js',import.meta.url),'utf8'),{
    document:{documentElement:{lang}, getElementById:get, createElement:tag => new Element(tag)},
    window:{}, fetch:async () => ({ok:true,json:async () => structuredClone(archive)}),
  });
  get('early-recipes').open=true; get('early-recipes').events.toggle();
  await new Promise(resolve => setImmediate(resolve));
  for (const id of [276964,253932]) {
    const recipe = archive.recipes.find(r => r.book_item_ids.includes(id));
    assert.ok(recipe);
    const search=get('early-recipe-search'); search.value=String(recipe.spell_id); search.events.input();
    const detail=get('early-recipe-detail');
    assert.equal(detail.children[0].textContent,recipe.name_en);
    for (const v of recipe.vendor_references) {
      assert.match(detail.textContent,new RegExp(v.name_en));
      assert.ok(walk(detail).some(el => el.href === `/${lang === 'en' ? 'en/' : ''}marchands/?q=${encodeURIComponent(v.name_en)}`));
      assert.ok(walk(detail).some(el => el.href === v.evidence_url));
    }
    assert.ok(detail.textContent.includes(lang === 'en' ? 'Forever · documented' : 'Forever · documenté'));
  }
  const search=get('early-recipe-search'); search.value='Vayn Moongaze'; search.events.input();
  assert.ok(get('early-recipe-results').children.length>0);
  assert.match(get('early-recipe-count').textContent,/48 recipes|48 recettes/);
});
