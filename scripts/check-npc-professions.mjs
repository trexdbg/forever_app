#!/usr/bin/env node
/** Offline, read-only merchant and profession relationship audit.
 * Unknown historical evidence is a warning, not a reason for deletion.
 */
import {readFileSync} from "node:fs";
import {resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {checkExplicitProvenance} from "./check-data-quality.mjs";

const obj=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const positive=x=>Number.isInteger(x)&&x>0;
const url=x=>typeof x==="string"&&/^https:\/\/[^\s/]+/.test(x);
const word=x=>typeof x==="string"&&!!x.trim();
const names=x=>obj(x)&&word(x.fr)&&word(x.en);
const pct=x=>typeof x==="number"&&Number.isFinite(x)&&x>=0&&x<=100;

export function auditNpcProfessions(npcData,professionData) {
 const issues=[], report=(severity,code,path,message)=>issues.push({severity,code,path,message});
 const error=(code,path,msg)=>report("error",code,path,msg),warn=(code,path,msg)=>report("warning",code,path,msg);
 const items=npcData?.items,npcs=npcData?.npcs,professions=professionData?.professions;
 if(!obj(items))error("ITEMS_NOT_OBJECT","data/npcs.json.items","Expected keyed item catalogue");
 if(!Array.isArray(npcs))error("NPCS_NOT_ARRAY","data/npcs.json.npcs","Expected NPC array");
 if(!Array.isArray(professions))error("PROFESSIONS_NOT_ARRAY","data/professions.json.professions","Expected profession array");
 if(!obj(items)||!Array.isArray(npcs)||!Array.isArray(professions))
   return {issues,errorCount:issues.filter(x=>x.severity==="error").length,warningCount:issues.filter(x=>x.severity==="warning").length,summary:{}};

 for(const [key,item] of Object.entries(items)) {
  const p="data/npcs.json.items."+key;
  if(!/^\d+$/.test(key)||!positive(item?.id)||String(item.id)!==key)error("ITEM_ID_MISMATCH",p,"Key must match positive item ID");
  if(!names(item?.name))error("ITEM_LOCALE_MISSING",p+".name","French and English names required");
  if(!Number.isFinite(item?.skill)||item.skill<0)error("ITEM_SKILL_INVALID",p+".skill","Invalid skill number");
  if(item.vendor_stock!=null&&(!Number.isInteger(item.vendor_stock)||item.vendor_stock<0))error("ITEM_STOCK_INVALID",p+".vendor_stock","Invalid stock");
  if(item.vendor_price_copper!=null&&(!Number.isInteger(item.vendor_price_copper)||item.vendor_price_copper<0))error("ITEM_PRICE_INVALID",p+".vendor_price_copper","Invalid price");
  checkExplicitProvenance(item,p,report);
 }

 const ids=new Map();
 let sales=0, foreverSales=0, classicSales=0;
 for(const [i,npc] of npcs.entries()) {
  const p="data/npcs.json.npcs["+i+"]";
  if(!obj(npc)||!word(npc.name)){error("NPC_NAME_INVALID",p,"NPC must have name");continue;}
  if(npc.id==null)warn("NPC_ID_UNKNOWN",p+".id",npc.name);
  else if(!positive(npc.id))error("NPC_ID_INVALID",p+".id",npc.name);
  else if(ids.has(npc.id))error("NPC_ID_DUPLICATE",p+".id",npc.name+" duplicates "+ids.get(npc.id));
  else ids.set(npc.id,npc.name);
  if(!obj(npc.zone)||!word(npc.zone.id)||!names(npc.zone))error("NPC_ZONE_INVALID",p+".zone",npc.name);
  if(npc.coordinates==null)warn("NPC_POSITION_UNKNOWN",p+".coordinates",npc.name);
  else if(!obj(npc.coordinates)||!pct(npc.coordinates.x)||!pct(npc.coordinates.y))error("NPC_COORDINATES_INVALID",p+".coordinates",npc.name);
  if(!url(npc.source))warn("NPC_SOURCE_MISSING",p+".source",npc.name);
  if(!["merchant","trainer"].includes(npc.role))error("NPC_ROLE_INVALID",p+".role",npc.name);
  if(!Array.isArray(npc.offers)){error("NPC_OFFERS_INVALID",p+".offers",npc.name);continue;}
  if(npc.role!=="merchant"&&npc.offers.length)error("TRAINER_VENDOR_OFFERS",p+".offers",npc.name);
  const offered=new Set();
  for(const raw of npc.offers) {
   sales++;
   const id=String(raw),q=p+".offers["+id+"]",entry=npc.offer_details?.[id];
   if(!/^\d+$/.test(id)||!positive(Number(id)))error("OFFER_ID_INVALID",q,npc.name);
   if(offered.has(id))error("OFFER_DUPLICATE",q,npc.name);
   offered.add(id);
   if(!Object.hasOwn(items,id))error("OFFER_ITEM_MISSING",q,npc.name+" => "+id);
   if(entry!==undefined&&!obj(entry)){error("OFFER_DETAIL_INVALID",q,"Expected object");continue;}
   if(entry?.verification_status==="forever_documented") {
    foreverSales++;
    if(entry.source_kind!=="forever_guide_named_vendor"||!url(entry.source)||!/\/forever\//.test(entry.source))
      error("FOREVER_OFFER_SOURCE_CONFLICT",q,"Forever status requires a Forever vendor source");
   } else {
    classicSales++;
    if(entry?.evidence_level==="confirmed_in_game")
      error("CLASSIC_SALE_CONFIRMED",q,"Unconfirmed vendor offer upgraded to in-game");
   }
   if(entry?.price!==undefined&&(!obj(entry.price)||!Number.isInteger(entry.price.amount)||entry.price.amount<0||!word(entry.price.currency)))
     error("OFFER_PRICE_INVALID",q+".price","Invalid amount or currency");
   if(entry?.restock_minutes!==undefined) {
    if(!Number.isFinite(entry.restock_minutes)||entry.restock_minutes<=0)error("RESTOCK_INVALID",q+".restock_minutes","Invalid restock duration");
    if(entry.evidence_level!=="confirmed_in_game")error("RESTOCK_UNVERIFIED",q+".restock_minutes","Exact game timer requires direct proof");
   }
   if(entry)checkExplicitProvenance(entry,p+".offer_details."+id,report);
  }
  if(npc.offer_details!==undefined&&!obj(npc.offer_details))error("OFFER_DETAILS_INVALID",p+".offer_details","Expected keyed object");
  for(const id of Object.keys(obj(npc.offer_details)?npc.offer_details:{}))
   if(!offered.has(id))error("ORPHAN_OFFER_DETAIL",p+".offer_details."+id,npc.name);
 }

 for(const [i,e] of (Array.isArray(npcData.evidence)?npcData.evidence:[]).entries()) {
  const p="data/npcs.json.evidence["+i+"]";
  if(!word(e.vendor_name)||!/^\d+$/.test(String(e.item)))error("WAIT_LINK_INVALID",p,"Missing vendor or item");
  else if(!npcs.some(n=>n.name===e.vendor_name&&n.offers.map(String).includes(String(e.item))))
   error("WAIT_LINK_BROKEN",p,"Report not linked to a vendor offer");
  if(e.min_minutes!==undefined||e.max_minutes!==undefined)
   if(!Number.isFinite(e.min_minutes)||!Number.isFinite(e.max_minutes)||e.min_minutes<0||e.min_minutes>e.max_minutes)
    error("WAIT_RANGE_INVALID",p,"Invalid waiting bounds");
  if(!url(e.url))warn("WAIT_SOURCE_UNKNOWN",p+".url","Historical report missing URL");
 }

 const profIds=new Set();
 let trainers=0,recipes=0;
 for(const [i,prof] of professions.entries()) {
  const p="data/professions.json.professions["+i+"]";
  if(!positive(prof.id)||profIds.has(prof.id))error("PROFESSION_ID_INVALID",p+".id","Duplicate or missing profession ID");
  profIds.add(prof.id);
  if(!word(prof.slug)||!names(prof.name))error("PROFESSION_LOCALE_MISSING",p+".name","FR/EN names and slug required");
  if(!Number.isInteger(prof.count)||prof.count<0)error("PROFESSION_TOTAL_INVALID",p+".count","Invalid snapshot total");
  if(!Array.isArray(prof.trainers))error("TRAINERS_NOT_ARRAY",p+".trainers","Expected trainers array");
  for(const [j,trainer] of (Array.isArray(prof.trainers)?prof.trainers:[]).entries()) {
   trainers++;
   if(!word(trainer.name)||!names(trainer.zone)||!word(trainer.tier)||!word(trainer.faction))
    error("TRAINER_INVALID",p+".trainers["+j+"]","Trainer name, bilingual zone, tier and faction required");
  }
  // Legacy prof.count is a client snapshot statistic, NOT a recipe list.
  if(prof.recipes!==undefined&&!Array.isArray(prof.recipes))error("RECIPES_NOT_ARRAY",p+".recipes","Expected recipe array");
  for(const [j,recipe] of (Array.isArray(prof.recipes)?prof.recipes:[]).entries()) {
   recipes++;
   const q=p+".recipes["+j+"]";
   if(!positive(recipe.id)||!names(recipe.name))error("RECIPE_INVALID",q,"Recipe ID and FR/EN names needed");
   if(!positive(recipe.output_item_id)||!Number.isInteger(recipe.output_quantity)||recipe.output_quantity<=0)
    error("RECIPE_OUTPUT_INVALID",q,"Produced item and positive output quantity required");
   if(!Array.isArray(recipe.components))error("RECIPE_COMPONENTS_INVALID",q+".components","Expected components list");
   for(const [k,c] of (Array.isArray(recipe.components)?recipe.components:[]).entries())
    if(!positive(c.id)||!Number.isInteger(c.quantity)||c.quantity<=0)
     error("RECIPE_COMPONENT_INVALID",q+".components["+k+"]","Positive component ID and quantity required");
   checkExplicitProvenance(recipe,q,report);
  }
 }
 return {issues,errorCount:issues.filter(x=>x.severity==="error").length,warningCount:issues.filter(x=>x.severity==="warning").length,
  summary:{npcs:npcs.length,knownNpcIds:ids.size,positionedNpcs:npcs.filter(n=>n.coordinates!=null).length,
   merchantOffers:sales,foreverDocumentedOffers:foreverSales,classicOrUnverifiedOffers:classicSales,
   distinctItems:Object.keys(items).length,recipeItems:Object.values(items).filter(x=>x.kind==="recipe").length,
   componentItems:Object.values(items).filter(x=>x.kind==="component").length,
   professions:professions.length,trainerDirectoryRows:trainers,detailedRecipes:recipes}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const root=resolve(dirname(fileURLToPath(import.meta.url)),".."), load=p=>JSON.parse(readFileSync(resolve(root,p),"utf8"));
 const r=auditNpcProfessions(load("data/npcs.json"),load("data/professions.json"));
 if(process.argv.includes("--json"))process.stdout.write(JSON.stringify(r,null,2)+"\n");
 else {
  process.stdout.write(JSON.stringify({summary:r.summary,errors:r.errorCount,warnings:r.warningCount},null,2)+"\n");
  for(const x of r.issues.filter(x=>x.severity==="error").slice(0,30))process.stdout.write(x.code+": "+x.path+": "+x.message+"\n");
 }
 if(r.errorCount)process.exitCode=1;
}
