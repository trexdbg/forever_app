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
// Audited low-level Classic names from Classic frFR item pages.
for(const [id,english,french] of [[1155,"Rod of the Sleepwalker","Bâtonnet du somnanbule"],[3748,"Feline Mantle","Mantelet félin"],[5198,"Cookie's Stirring Rod","Bâton à touiller de Macaron"],[6321,"Silverlaine's Family Seal","Sceau de la famille d'Argelaine"],[6469,"Venomstrike","Frappe-venin"],[10410,"Leggings of the Fang","Jambières du Croc"],[14145,"Cursed Felblade","Lame corrompue maudite"],[14149,"Subterranean Cape","Cape souterraine"]]){
 assert.equal(fr.name({id,name:english,source_status:"classic_curated_leveling"}),french,"Classic frFR regression: "+id);
 assert.equal(en.name({id,name:english,source_status:"classic_curated_leveling"}),english);
}
for(const [id,english,french] of [[270228,"Golemheart Stave","Canne cœur-de-golem"],[270229,"Treads of the Protector Golem","Bottines du golem protecteur"],[270260,"Direhammer Leggings","Jambières de Dirgehammer"],[271098,"Golemguard Chest","Plastron de garde golem"]]){
 const item={id,name:english,source_status:"forever_beta_observed",name_fr:"Traduction éditoriale obsolète"};
 assert.equal(fr.name(item),french,"Forever official name mismatch: "+id);
 assert.equal(en.name(item),english);
 assert.equal(fr.resolved(item).verified,true);
}
const untranslatedBeta={id:273030,name:"Ring of Power Regulation",name_fr:"Anneau de régulation de puissance",source_status:"forever_beta_observed"};
assert.equal(fr.name(untranslatedBeta),"Ring of Power Regulation","Non-localized Wowhead Forever items must remain English");
assert.equal(fr.resolved(untranslatedBeta).translation_missing,true);
const newBeta={id:271095,name:"Fang of Magmatus",source_status:"forever_beta_observed"};
assert.equal(fr.name(newBeta),"Croc de Magmatus");
assert.equal(en.name(newBeta),"Fang of Magmatus");
assert.equal(fr.resolved(newBeta).verified,true,"Confirmed Wowhead Forever FR localization must be authoritative");
assert.equal(fr.name({id:250486,name:"Sterling Silver Shoulders",source_status:"forever_beta_wowhead"}),"Sterling Silver Shoulders","No invented French label for undocumented beta name");
assert.equal(fr.resolved({id:250486,name:"Sterling Silver Shoulders",source_status:"forever_beta_wowhead"}).translation_missing,true);
assert.ok(fr.aliases({id:250486,name:"Sterling Silver Shoulders",source_status:"forever_beta_wowhead"}).includes("Épaulières en argent sterling"),"Search can still find French editorial aliases");
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
   if(Number(drop.id)>=240000)assert.ok(String(drop.source_status||"").startsWith("forever_beta_"),"Forever-only item incorrectly marked Classic: "+drop.id);
   const sample={id:drop.id,name:drop.en,name_fr:drop.fr,source_status:drop.source_status==="classic_loot_reference"?"classic_reference":"forever_beta_community"};
   const official=fr.resolved(sample).verified;
   const expectedFr=Number(drop.id)>=200000&&!official?drop.en:drop.fr;
   assert.equal(fr.name(sample),expectedFr,"Dungeon FR naming mismatch for item "+drop.id);
   assert.equal(en.name(sample),drop.en,"Dungeon EN naming mismatch for item "+drop.id);
   if(fr.resolved(sample).verified)officialChecked++;
   dungeonChecked++;
  }
 }
}
assert.ok(dungeonChecked>=90,"Dungeon item coverage fell unexpectedly");
assert.ok(officialChecked>=24,"Confirmed Forever localization count regressed");
const staleForever={id:270227,name:"Ephemeral Choker",name_fr:"Collier éphémère",source_status:"forever_beta_observed"};
assert.equal(fr.name(staleForever),"Sautoir éphémère","Never show previous literal name for official Forever item 270227");
assert.equal(en.name(staleForever),"Ephemeral Choker");
assert.equal(fr.resolved(staleForever).verified,true);
const bracers={id:271096,name:"Aetherwisp Bracers",name_fr:"Brassards du feu follet d’éther",source_status:"forever_beta_community"};
assert.equal(fr.name(bracers),"Brassards brindecieux");
// Extended deterministic QA without external HTTP or scheduled Actions.
const canonical=new Map();
for(const file of ["data/items-classic-cache.json","data/items-forever-cache.json"]){
 const db=JSON.parse(readFileSync(resolve(root,file),"utf8"));
 for(const row of db.items||[])if(row.id&&row.name){
  const previous=canonical.get(Number(row.id));
  if(previous)assert.equal(previous,row.name,"Conflicting English item names for ID "+row.id);
  canonical.set(Number(row.id),row.name);
 }
}
let knownDungeonIds=0,missingDungeonIds=0,canonicalMatches=0;
// These recipes have vendor sources; boss attribution requires independent confirmation.
const unverifiedBossRecipes=new Set([252820,252822]);
const checkedDungeons=new Set(["ragefire-chasm","wailing-caverns","the-deadmines","shadowfang-keep","blackfathom-deeps","the-stockade","gnomeregan","razorfen-kraul","scarlet-monastery-graveyard","city-of-dalaran"]);
const unresolvedForeverNames=new Set(["Plans: Arcane Recycler","Titan Relic (quest)"]);
for(const dungeon of dungeonData.dungeons||[]){
 for(const boss of dungeon.bosses||[]){
  for(const drop of boss.loot||[]){
   if(!drop.id){
    missingDungeonIds++;
    assert.ok(!checkedDungeons.has(dungeon.id),"Missing linked loot ID in reviewed dungeon "+dungeon.id+": "+drop.en);
    assert.ok(unresolvedForeverNames.has(drop.en),"Unrecognized unresolved dungeon drop: "+drop.en);
    assert.ok(["not_confirmed","faction_variant_unresolved"].includes(drop.item_id_status),"Unresolved item must be explicitly marked as uncertain");
    if(drop.item_id_candidates)assert.ok(drop.item_id_candidates.every(Number.isSafeInteger),"Non-numeric item ID candidate");
    assert.ok(!drop.itemUrl,"Unknown item ID must not have guessed URL");
    continue;
   }
   const id=Number(drop.id);
   assert.ok(Number.isSafeInteger(id)&&id>0,"Invalid dungeon item ID "+id);
   assert.ok(!unverifiedBossRecipes.has(id),"Unverified boss recipe placement: "+id);
   const known=canonical.get(id);
   if(known){assert.equal(drop.en,known,"English item name does not match ID "+id);canonicalMatches++;}
   assert.ok(typeof drop.itemUrl==="string","Missing item URL "+id);
   const url=new URL(drop.itemUrl);
   assert.equal(url.protocol,"https:","Invalid item link");
   assert.ok(["www.wowhead.com","foreverchanges.pro"].includes(url.hostname),"Unexpected item source "+url.hostname);
   const match=/(?:item=|\/item\/)(\d+)/.exec(drop.itemUrl);
   assert.ok(match,"Item number missing in link "+drop.itemUrl);
   assert.equal(Number(match[1]),id,"Dungeon item URL mismatch "+id);
   if(id>=240000){
    assert.ok(String(drop.source_status||"").startsWith("forever_beta_"),"Forever-only item incorrectly marked Classic "+id);
    assert.ok(drop.itemUrl.includes("/forever/")||drop.itemUrl.includes("foreverchanges.pro"),"Forever-only ID linked to Classic "+id);
   }
   knownDungeonIds++;
  }
 }
}
assert.equal(missingDungeonIds,2,"Unexpected unresolved dungeon reference count");
assert.ok(knownDungeonIds>=204,"Documented dungeon coverage regressed");
assert.ok(canonicalMatches>=15,"Not enough canonical ID/name comparisons");
assert.equal(fr.name({id:5202,name:"Corsair's Overshirt",name_fr:"Surchemise de corsaire",source_status:"classic_reference"}),"Casaque de corsaire");
assert.equal(fr.name({id:6318,name:"Odo's Ley Staff",name_fr:"Bâton tellurique d'Odo",source_status:"classic_reference"}),"Bâton d'Odo");
assert.equal(fr.name({id:6324,name:"Robes of Arugal",source_status:"classic_reference"}),"Robe d'Arugal");
assert.equal(fr.name({id:6909,name:"Strike of the Hydra",source_status:"classic_reference"}),"Frappe de l'Hydre");
assert.equal(en.name({id:6909,name:"Strike of the Hydra",source_status:"classic_reference"}),"Strike of the Hydra");
const unresolvedRare=(JSON.parse(readFileSync(resolve(root,"data/rares.json"),"utf8")).rares||[])
 .flatMap(row=>row.loot||[]).filter(i=>!i.item_id);
assert.equal(unresolvedRare.length,0,"All rare drops must have item IDs");
const rareDataset=JSON.parse(readFileSync(resolve(root,"data/rares.json"),"utf8"));
const duskstalker=rareDataset.rares.find(r=>r.name?.en==="Duskstalker");
const hide=duskstalker?.loot?.find(i=>i.name?.en==="Duskstalker's Hide");
assert.equal(hide?.item_id,284165,"Duskstalker's Hide Forever ID mismatch");
assert.equal(hide?.source_version,"forever_beta","Duskstalker's Hide is new Forever, not Classic");
assert.equal(hide?.item_source_url,"https://www.wowhead.com/forever/item=284165");
assert.equal(fr.name({id:7686,name:"Ironspine's Eye",name_fr:"Œil d'Ironspine",source_status:"classic_reference"}),"Oeil d'Echine-de-fer");
assert.equal(fr.name({id:7688,name:"Ironspine's Ribcage",source_status:"classic_reference"}),"Thorax d'Echine-de-fer");
assert.equal(fr.name({id:4448,name:"Husk of Naraxis",source_status:"classic_reference"}),"Carcasse de Naraxis");
assert.equal(fr.name({id:273106,name:"Blueprint: Greenhouse",name_fr:"Plan : serre",source_status:"forever_beta_wowhead"}),"Blueprint: Greenhouse","No unverified French label for beta recipe");
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
console.log("Item locale / references: OK ("+total+" catalogued entries, "+knownDungeonIds+" dungeon items with ID, "+missingDungeonIds+" pending, "+canonicalMatches+" canonical names, "+rareIconMatches+" rare icon checks, FR+EN).");
