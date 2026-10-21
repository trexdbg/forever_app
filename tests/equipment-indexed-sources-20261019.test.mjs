import test from "node:test";
import {BASELINE as current} from "./helpers/catalogue-baseline.mjs";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const json=p=>JSON.parse(read(p));
const index=json("data/item-acquisition-index.json");
const leveling=json("data/bis-niveaux-classic.json").items;
const known=["items.json","items-classic-cache.json","items-forever.json","items-forever-cache.json","bis-niveaux-forever-observed.json"].flatMap(name=>json("data/"+name).items);
const knownIDs=new Set(known.map(i=>i.id));
const indexed=new Map(index.items.map(x=>[x.id,x.sources]));
const allIDs=new Set([...knownIDs,...leveling.map(x=>x.id)]);
const indexWithProof=[...allIDs].filter(id=>indexed.get(id)?.some(s=>s.evidence_level!=="unverified"));

test("classic curated leveling equipment makes 53 additional item IDs searchable without relabeling them Forever",()=>{
 assert.equal(leveling.length,75);
 assert.equal(leveling.filter(x=>!knownIDs.has(x.id)).length,53);
 assert.equal(new Set(leveling.map(x=>x.id)).size,75);
 for(const item of leveling){
  assert.equal(item.source_status,"classic_curated_leveling");
  assert.match(item.source_url,/^https:\/\//);
  assert.ok(Number.isSafeInteger(item.id)&&item.id>0);
  assert.ok(["common","uncommon","rare","epic","legendary"].includes(item.quality));
  assert.ok(Number.isInteger(item.requiredLevel)&&item.requiredLevel>=0&&item.requiredLevel<=60);
  assert.ok(typeof item.slot==="string"&&item.slot);
 }
});
test("common ID index links existing catalogues to 132 sourced results; not by translated or approximate name",()=>{
 assert.equal(index.totals.unique_items,current.index.uniqueItems);
 assert.equal(index.totals.relations,current.index.relations);
 assert.equal(indexWithProof.length,current.index.itemIdsWithEvidenceInEquipment);
 const example=indexed.get(270227);
 assert.ok(example.some(s=>s.kind==="boss"&&s.name_en==="Faldrim Anvilmar"&&s.evidence_level==="documented_forever"));
 assert.ok(indexed.get(5198).some(s=>s.kind==="boss"&&s.name_en==="Cookie"&&s.evidence_level==="classic_reference"));
 assert.ok(indexed.get(273085)?.every(s=>s.evidence_level==="unverified")||!indexed.has(273085));
});
test("inline source hints render only evidence-labelled local links with no fabricated percentage",()=>{
 const js=read("assets/items-v3.js");
 assert.match(js,/sourceIndex=new Map\(db\.items\.map/);
 assert.match(js,/function indexedSources\(item\)/);
 assert.match(js,/Object\.hasOwn\(evidenceRank,source\.evidence_level\)/);
 assert.match(js,/source\.href/);
 assert.match(js,/function updateOriginHint\(cell,item\)/);
 assert.match(js,/originCell\.className="item-catalogue-origin"/);
 assert.match(js,/refreshOriginHints\(\)/);
 assert.match(js,/loadAcquisitionIndex\(\)\.then\(/);
 assert.match(js,/if\(search\.value\.trim\(\)&&!expandedRow\)render\(\)/);
 assert.match(js,/if\(curated\.length\)return/);
 assert.match(js,/sourceRank=\{boss:0,rare:1,recipe:2,merchant:3\}/);
 assert.ok(js.includes("sourceRate(s)"),"Sourced Classic and community estimates must share a labelled formatter");
 const segment=js.split("const status=s.evidence_level===")[1].split("function updateOriginHint")[0];
 assert.ok(!segment.includes("classic_drop_chance_percent"),"Indexed hints must not add invented loot percentages");
});
test("the new Classic batch is loaded after editorial data and before archive, never promoted to a beta item",()=>{
 const js=read("assets/items-v3.js");
 assert.match(js,/bis-niveaux-classic\.json\?v=20261019-source-index/);
 assert.match(js,/i\.source_status==="classic_curated_leveling"/);
 assert.match(js,/function sourceType\(item\)/);
 assert.ok(js.indexOf("Array.isArray(catalog.items)")<js.indexOf("Array.isArray(leveling.items)"));
 assert.ok(js.indexOf("Array.isArray(leveling.items)")<js.indexOf("Array.isArray(archive.items)"));
 for(const path of ["equipements/index.html","en/equipements/index.html"]){
  const html=read(path);
  assert.ok(html.includes("items-v3.js?v=20261019-rare-patrol"));
  assert.ok(html.includes("item-catalogue.css?v=20261019-source-hints"));
 }
 assert.match(read("assets/item-catalogue.css"),/item-catalogue-origin .item-acquisition-inline/);
});
