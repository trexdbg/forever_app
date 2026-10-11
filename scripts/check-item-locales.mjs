/* Run manually with: node scripts/check-item-locales.mjs
 * Local quality gate: no scheduled GitHub Actions minutes required.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";
import vm from "node:vm";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const source=readFileSync(resolve(root,"assets/item-locale.js"),"utf8");
function load(lang){
 const ctx={window:{},document:{documentElement:{lang}}};
 vm.runInNewContext(source,ctx,{filename:"assets/item-locale.js"});
 return ctx.window.ForeverItemLocale;
}
const fr=load("fr"),en=load("en");
const sample={id:13404,name:"Mask of the Unforgiven",name_fr:"Masque du non-pardonné",source_status:"classic_reference",origin:"Stratholme · The Unforgiven",url:"https://www.wowhead.com/classic/item=13404"};
assert.equal(fr.name(sample),"Masque du Condamné","French name must come from ID 13404");
assert.equal(en.name(sample),"Mask of the Unforgiven");
assert.equal(fr.origin(sample.origin),"Stratholme · Le Condamné");
assert.equal(en.origin("Stratholme · Le Condamné"),"Stratholme · The Unforgiven");
assert.equal(fr.record(sample).id,13404);
// Regression: official French Classic name for item 13098, not a literal word-by-word translation.
const painweaver={id:13098,name:"Painweaver Band",name_fr:"Anneau du tisseur de douleur",source_status:"classic_reference",icon:"inv_jewelry_ring_18",url:"https://www.wowhead.com/classic/item=13098"};
assert.equal(fr.name(painweaver),"Anneau de puissance mortelle","Classic ID 13098 must override a stale local name");
assert.equal(en.name(painweaver),"Painweaver Band");
assert.equal(fr.record(painweaver).id,13098);
assert.equal(fr.resolved(painweaver).indicative,false,"Classic reviewed translations should be authoritative");
const classicRogueItem={id:5191,name:"Cruel Barb",name_fr:"Barbelure cruelle",source_status:"classic_curated_leveling"};
assert.equal(fr.name(classicRogueItem),"Lame de cruauté","Rogue BiS ID 5191 must use published official FR");
assert.equal(en.name(classicRogueItem),"Cruel Barb");
assert.equal(fr.name({id:10399,name:"Blackened Defias Armor",source_status:"classic_reference"}),"Armure défias noircie");
assert.equal(fr.name({id:16712,name:"Shadowcraft Gloves",source_status:"classic_reference"}),"Gants Sombreruse");
const newBeta={id:271095,name:"Fang of Magmatus",source_status:"forever_beta_observed"};
assert.equal(fr.name(newBeta),"Croc de Magmatus");
assert.equal(en.name(newBeta),"Fang of Magmatus");
assert.equal(fr.resolved(newBeta).indicative,true,"New Forever translations must be labelled indicative");
assert.equal(fr.name({id:250486,name:"Sterling Silver Shoulders",source_status:"forever_beta_wowhead"}),"Épaulières en argent sterling");
const beta={...sample,source_status:"forever_beta_observed",name_fr:"Nom officiel Forever"};
assert.equal(fr.name(beta),"Nom officiel Forever","Do not overwrite distinct Forever names");
const paths=["data/bis.json","data/items.json","data/items-forever.json","data/items-classic-cache.json","data/items-forever-cache.json","data/bis-niveaux-classic.json","data/bis-niveaux-forever-observed.json"];
let total=0;
for(const path of paths){
 const data=JSON.parse(readFileSync(resolve(root,path),"utf8"));
 for(const item of data.items||[]){
  assert.ok(Number.isSafeInteger(item.id)&&item.id>0,path+": missing numeric item ID");
  for(const key of ["url","source_url"]){
   if(typeof item[key]!=="string")continue;
   const match=/(?:item[=/]|item:)(\d{3,})\b/.exec(item[key]);
   if(match)assert.equal(Number(match[1]),item.id,path+": URL mismatch for item "+item.id);
  }
  total++;
 }
}
// Check the item-name lookup against every bilingual dungeon drop; these sheets
// use Forever's own source data rather than an English word-for-word rendering.
const dungeonData=JSON.parse(readFileSync(resolve(root,"data/dungeons-forever.json"),"utf8"));
let dungeonChecked=0,officialChecked=0;
for(const dungeon of dungeonData.dungeons||[]){
 for(const boss of dungeon.bosses||[]){
  for(const drop of boss.loot||[]){
   if(!drop.id||!drop.en||!drop.fr)continue;
   const sample={id:drop.id,name:drop.en,name_fr:drop.fr,source_status:drop.source_status==="classic_loot_reference"?"classic_reference":"forever_beta_community"};
   assert.equal(fr.name(sample),drop.fr,"Dungeon FR naming mismatch for item "+drop.id);
   assert.equal(en.name(sample),drop.en,"Dungeon EN naming mismatch for item "+drop.id);
   if(fr.resolved(sample).verified)officialChecked++;
   dungeonChecked++;
  }
 }
}
assert.ok(dungeonChecked>=70,"Dungeon item coverage fell unexpectedly");
assert.ok(officialChecked>=19,"Confirmed Forever localization count regressed");
const staleForever={id:270227,name:"Ephemeral Choker",name_fr:"Collier éphémère",source_status:"forever_beta_observed"};
assert.equal(fr.name(staleForever),"Sautoir éphémère","Never show previous literal name for official Forever item 270227");
assert.equal(en.name(staleForever),"Ephemeral Choker");
assert.equal(fr.resolved(staleForever).verified,true);
const bracers={id:271096,name:"Aetherwisp Bracers",name_fr:"Brassards du feu follet d’éther",source_status:"forever_beta_community"};
assert.equal(fr.name(bracers),"Brassards brindecieux");
const iconCatalog=JSON.parse(readFileSync(resolve(root,"data/items-classic-cache.json"),"utf8"));
const catalogIconById=new Map((iconCatalog.items||[]).filter(i=>i.id&&i.icon).map(i=>[Number(i.id),i.icon]));
const rareCatalog=JSON.parse(readFileSync(resolve(root,"data/rares.json"),"utf8"));
let rareIconMatches=0;
for(const rare of rareCatalog.rares||[]){
 for(const drop of rare.loot||[]){
  const reference=catalogIconById.get(Number(drop.item_id));
  if(!reference||!drop.icon)continue;
  assert.equal(drop.icon,reference,"Rare drop icon does not match catalogue: "+drop.item_id);
  rareIconMatches++;
 }
}
assert.ok(rareIconMatches>0,"No rare loot icons checked");
console.log("Item locale / references: OK ("+total+" catalogued entries, "+dungeonChecked+" dungeon drops, "+rareIconMatches+" rare drop icons, FR+EN).");
