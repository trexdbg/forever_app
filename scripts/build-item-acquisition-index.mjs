#!/usr/bin/env node
/**
 * Build a read-only cross-catalogue item acquisition index.
 * Every relation is inherited from a specific public ForEveroth dataset:
 * this is a navigation index, NOT an independent verification of a drop or sale.
 * No external fetch, sync or publication.
 */
import {readFileSync,writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

const read=path=>JSON.parse(readFileSync(new URL("../data/"+path,import.meta.url),"utf8"));
const nonempty=v=>typeof v==="string"&&v.trim().length>0;
const validSource=v=>typeof v==="string"&&/^https:\/\/[^\s/]+\//.test(v);
const int=v=>{const n=Number(v);return Number.isSafeInteger(n)&&n>0?n:null};
const word=v=>typeof v==="string"?v:(v?.en||v?.fr||"");
const label=(v,lang)=>typeof v==="string"?v:(v?.[lang]||v?.en||v?.fr||"");
const link=(base,params)=>base+"?"+Object.entries(params).map(([key,value])=>encodeURIComponent(key)+"="+encodeURIComponent(String(value))).join("&");
const ORDER={documented_forever:0,datamined:1,classic_reference:2,unverified:3};

export function buildAcquisitionIndex({npcs,rares,dungeons,crafting,alchemy}) {
 const byId=new Map(),seen=new Set();
 const add=(id,source)=>{
  const key=int(id);if(!key||!nonempty(source.name_en)||!nonempty(source.href))return;
  const identity=[key,source.kind,source.href,source.name_en].join("|");
  if(seen.has(identity))return;
  seen.add(identity);
  if(!byId.has(key))byId.set(key,[]);
  byId.get(key).push(source);
 };
 for(const npc of npcs.npcs||[]){
  if(npc.role!=="merchant")continue;
  for(const id of npc.offers||[]){
   const detail=npc.offer_details?.[String(id)];
   const documented=detail?.verification_status==="forever_documented" && validSource(detail?.source);
   add(id,{
    kind:"merchant",name_fr:npc.name,name_en:npc.name,
    href:link("/marchands/",{q:npc.name}),
    evidence_level:documented?"documented_forever":"classic_reference",
    source_status:documented?"forever_documented_offer":"classic_catalogue_offer",
    reference_url:validSource(detail?.source)?detail.source:(validSource(npc.source)?npc.source:null)
   });
  }
 }
 for(const rare of rares.rares||[]){
  for(const loot of rare.loot||[]){
   const documented=loot.source_version==="forever_beta" && loot.evidence_level==="documented_forever" && validSource(loot.evidence_url) && validSource(loot.source_url) && nonempty(loot.observed_at) && nonempty(loot.observed_build) && nonempty(loot.evidence_kind) && nonempty(loot.evidence_note);
   add(loot.item_id||loot.id,{
    kind:"rare",name_fr:label(rare.name,"fr"),name_en:label(rare.name,"en"),
    href:link("/rare/",{zone:rare.zone,q:label(rare.name,"en"),level:"all"}),
    evidence_level:documented?"documented_forever":(loot.source_version==="classic_reference"?"classic_reference":"unverified"),
    source_status:documented?"forever_beta_rare_loot":(loot.source_version==="classic_reference"?"classic_rare_loot_reference":"rare_loot_without_individual_forever_proof"),
    reference_url:validSource(loot.source_url)?loot.source_url:(validSource(rare.source)?rare.source:null)
   });
  }
 }
 for(const dungeon of dungeons.dungeons||[]){
  (dungeon.bosses||[]).forEach((boss,index)=>{
   for(const loot of boss.loot||[]){
    const classic=loot.source_status==="classic_loot_reference";
    add(loot.id,{
     kind:"boss",name_fr:label(boss.name,"fr"),name_en:label(boss.name,"en"),
     context_fr:label(dungeon.name,"fr"),context_en:label(dungeon.name,"en"),
     href:link("/donjons/",{donjon:dungeon.id,boss:index+1}),
     evidence_level:classic?"classic_reference":"documented_forever",
     source_status:loot.source_status||"unverified",
     reference_url:validSource(loot.statsSource)?loot.statsSource:(validSource(loot.itemUrl)?loot.itemUrl:(validSource(dungeon.source)?dungeon.source:null))
    });
   }
  });
 }
 for(const [name,db,query] of [
  ["Engineering",crafting,"craft"],["Alchemy",alchemy,"alchemy"]
 ]){
  for(const recipe of db.recipes||[]){
   const status=recipe.evidence_level==="confirmed_in_game"?"confirmed_in_game":recipe.evidence_level==="datamined"?"datamined":recipe.evidence_level==="documented_forever"?"documented_forever":"unverified";
   add(recipe.output_item_id,{
    kind:"recipe",name_fr:name==="Engineering"?"Ingénierie":"Alchimie",name_en:name,
    href:link("/metiers/",{[query]:recipe.output_item_id}),
    evidence_level:status,source_status:"forever_beta_recipe_index",
    reference_url:validSource(recipe.evidence_url)?recipe.evidence_url:(validSource(recipe.source_url)?recipe.source_url:null)
   });
  }
 }
 const items=[...byId].sort((a,b)=>a[0]-b[0]).map(([id,sources])=>({
  id,sources:sources.sort((a,b)=>(ORDER[a.evidence_level]??4)-(ORDER[b.evidence_level]??4)||a.kind.localeCompare(b.kind)||a.name_en.localeCompare(b.name_en))
 }));
 const by_kind={};const by_evidence={};
 for(const item of items)for(const s of item.sources){
  by_kind[s.kind]=(by_kind[s.kind]||0)+1;
  by_evidence[s.evidence_level]=(by_evidence[s.evidence_level]||0)+1;
 }
 return {
  schema_version:1,updated_at:"2026-10-15",
  scope:"Read-only relations inherited from ForEveroth merchant, rare, dungeon and opt-in beta recipe catalogues. Source links may identify only an item or guide, not prove sale, drop, availability, rates or live crafting.",
  provenance_policy:"Forever documented relations are labelled documentary only; all Classic relations stay Classic. Each relationship preserves its originating status. The links are navigation aids, not new source audits.",
  totals:{unique_items:items.length,relations:items.reduce((n,row)=>n+row.sources.length,0),by_kind,by_evidence},
  items
 };
}
const serialize=value=>JSON.stringify(value,null,2)+"\n";
export function buildFromFiles(){
 return buildAcquisitionIndex({
  npcs:read("npcs.json"),rares:read("rares.json"),dungeons:read("dungeons-forever.json"),
  crafting:read("crafting-chains-beta.json"),alchemy:read("alchemy-chains-beta.json")
 });
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const expected=serialize(buildFromFiles());
 const dest=new URL("../data/item-acquisition-index.json",import.meta.url);
 if(process.argv.includes("--write"))writeFileSync(dest,expected);
 else if(process.argv.includes("--check")){
  const existing=readFileSync(dest,"utf8");
  if(existing!==expected){console.error("Acquisition index is stale. Run node scripts/build-item-acquisition-index.mjs --write");process.exitCode=1}
  else console.log("Acquisition index OK",JSON.parse(existing).totals);
 }else console.log(expected);
}