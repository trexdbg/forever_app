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
// Official frFR Classic item headings verified on 2026-10-19:
 // https://www.wowhead.com/classic/fr/item=12590/trucidante
 // https://www.wowhead.com/classic/fr/item=13965/plaque-de-blackhand
// Correct by numeric ID (not by English string): preserve Classic EN and separate Forever source labels.
for (const [id, english, french] of [
  [12590, "Felstriker", "Trucidante"],
  [13965, "Blackhand's Breadth", "Plaque de Blackhand"]
]) {
  const item={id,name:english,name_fr:"Traduction française obsolète",source_status:"classic_reference"};
  assert.equal(fr.name(item),french,"Official Classic frFR item heading mismatch for ID "+id);
  assert.equal(en.name(item),english,"Classic English name changed for ID "+id);
  assert.equal(fr.record(item).name_fr,french,"Equipment and BiS must use the shared localized name "+id);
  assert.equal(fr.resolved(item).verified,true,"Official Classic translation should be verified for "+id);
  assert.equal(fr.resolved(item).indicative,false,"Official Classic translation cannot be indicative for "+id);
  assert.ok(fr.aliases(item).includes(english),"English item search alias missing for "+id);
  const forever={...item,source_status:"forever_beta_observed",name_fr:"Nom propre au client Forever"};
  assert.equal(fr.name(forever),"Nom propre au client Forever","Do not overwrite a distinct Forever localization for "+id);
  assert.equal(fr.resolved(forever).verified,false,"Classic FR is not proof of an official Forever name for "+id);
  assert.equal(en.name(forever),english);
}
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
// More reviewed Classic level 1-30 gear: names must not regress to English.
for(const [id,english,french] of [[5243,"Firebelcher","Crache-feu"],[6220,"Meteor Shard","Eclat de météore"],[6910,"Leech Pants","Pantalon de sangsue"],[9446,"Electrocutioner Leg","Jambe de l'électrocuteur"],[9454,"Acidic Walkers","Brodequins acides"]]){
 const item={id,name:english,source_status:"classic_curated_leveling"};
 assert.equal(fr.name(item),french,"Classic FR regression "+id);
 assert.equal(en.name(item),english);
 assert.equal(fr.resolved(item).verified,true);
}
// Source-reviewed item names (Classic frFR) shared across dungeon loot, BiS,
// the main equipment table and homepage search results.
for(const [id,english,french] of [
 [14150,"Robe of Evocation","Robe d'évocation"],
 [1156,"Lavishly Jeweled Ring","Anneau somptueux"],
 [6463,"Deep Fathom Ring","Anneau des grandes profondeurs"],
 [14147,"Cavedweller Bracers","Brassards cavernicoles"],
 [9449,"Manual Crowd Pummeler","Roueur manuel"],
 [6904,"Bite of Serra'kis","Morsure de Serra'kis"],
 [6691,"Swinetusk Shank","Surin de brochepourceau"]
]){
 const item={id,name:english,name_fr:"Traduction obsolète",source_status:"classic_curated_leveling"};
 assert.equal(fr.name(item),french,"Published Classic French name regression: "+id);
 assert.equal(en.name(item),english);
 assert.equal(fr.resolved(item).verified,true);
 assert.ok(fr.aliases(item).includes(french),"Search alias missing for "+id);
}
// WoWhead Classic frFR item-ID regression coverage (October 2026).
for(const [id,english,french] of [
 [6630,"Seedcloud Buckler","Targe de Seedcloud"],
 [12996,"Band of Purification","Anneau de purification"],
 [1314,"Ghoul Fingers","Doigts de goule"]
]){
 const sample={id,name:english,name_fr:"Ancienne traduction non officielle",source_status:"classic_reference"};
 assert.equal(fr.name(sample),french,"Classic French name missing: "+id);
 assert.equal(en.name(sample),english);
 assert.equal(fr.resolved(sample).verified,true);
 assert.ok(fr.aliases(sample).includes(french));
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
const unresolvedForeverNames=new Set(["Plans: Arcane Recycler"]);
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
assert.equal(missingDungeonIds,1,"Unexpected unresolved dungeon reference count (2026-10-13 baseline)");
assert.ok(knownDungeonIds>=204,"Documented dungeon coverage regressed");
assert.ok(canonicalMatches>=15,"Not enough canonical ID/name comparisons");
// Source-checked Classic item name (Wowhead Classic item 3188), shared by rares and equipment.
const coral={id:3188,name:"Coral Claymore",name_fr:"Épée à deux mains de corail",source_status:"classic_reference"};
assert.equal(fr.name(coral),"Claymore des coraux","Classic FR item 3188 must not use a literal translation");
assert.equal(en.name(coral),"Coral Claymore","Classic EN item 3188 must remain canonical");
assert.equal(fr.name({id:5202,name:"Corsair's Overshirt",name_fr:"Surchemise de corsaire",source_status:"classic_reference"}),"Casaque de corsaire");
assert.equal(fr.name({id:6318,name:"Odo's Ley Staff",name_fr:"Bâton tellurique d'Odo",source_status:"classic_reference"}),"Bâton d'Odo");
assert.equal(fr.name({id:6324,name:"Robes of Arugal",source_status:"classic_reference"}),"Robe d'Arugal");
assert.equal(fr.name({id:6909,name:"Strike of the Hydra",source_status:"classic_reference"}),"Frappe de l'Hydre");
assert.equal(en.name({id:6909,name:"Strike of the Hydra",source_status:"classic_reference"}),"Strike of the Hydra");
// Official Classic frFR translations for quest-starting rare loot, distinct from Forever gameplay proof.
for(const [id,english,french] of [
  [4854,"Demon Scarred Cloak","Cape griffée par les démons"],
  [5179,"Moss-twined Heart","Cœur moussu"]
]){
  const classic={id,name:english,source_status:"classic_reference"};
  assert.equal(fr.name(classic),french,"Classic frFR localization missing for "+id);
  assert.equal(en.name(classic),english);
  assert.equal(fr.resolved(classic).verified,true);
  const forever={id,name:english,source_status:"forever_beta_community",name_fr:french};
  assert.equal(fr.name(forever),french,"Documented Forever item should retain separately sourced Classic localization");
  assert.equal(en.name(forever),english);
  assert.equal(fr.resolved(forever).verified,false,"Classic translation does not verify Forever gameplay/localization");
}
// Forever item stats may differ from Classic. French item names are ID-based Classic frFR only.
for(const [id,english,french] of [
 [18610,"Keen Machete","Machette effilée"],
 [18612,"Bloody Chain Boots","Bottes en mailles sanglantes"],
 [1965,"White Wolf Gloves","Gants du loup blanc"]
]){
 const classic={id,name:english,source_status:"classic_reference"};
 assert.equal(fr.name(classic),french,"Classic frFR translation mismatch "+id);
 assert.equal(en.name(classic),english,"Classic English name mismatch "+id);
 assert.equal(fr.resolved(classic).verified,true);
 const forever={id,name:english,name_fr:french,source_status:"forever_beta_community"};
 assert.equal(fr.name(forever),french,"Forever referenced item should retain Classic FR localization "+id);
 assert.equal(en.name(forever),english);
 assert.equal(fr.resolved(forever).verified,false,"Classic translation alone must not verify Forever "+id);
}
// Cross-module Classic names are evidence of localization only, not current Forever drops.
for(const [id,english,french] of [
 [18611,"Gnarlpine Leggings","Jambières de Pin-tordu"],
 [10553,"Foreman Vest","Gilet de contremaître"]
]){
 const classic={id,name:english,source_status:"classic_reference"};
 assert.equal(fr.name(classic),french,"Classic frFR item-name regression "+id);
 assert.equal(en.name(classic),english);
 assert.equal(fr.resolved(classic).verified,true);
 const forever={id,name:english,name_fr:french,source_status:"forever_beta_community"};
 assert.equal(fr.name(forever),french);
 assert.equal(en.name(forever),english);
 assert.equal(fr.resolved(forever).verified,false,"Classic FR string is not an official Forever localization "+id);
}
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
// Rare NPC names are keyed by verified Classic French localizations, never guessed from English.
for(const [english,french] of [["Lord Sakrasis","Seigneur Sakrasis"],["Azshir the Sleepless","Azshir le Sans-sommeil"],["Blind Hunter","Chasseur aveugle"],["Sewer Beast","Bête des égouts"]]){
 const npc=rareCatalog.rares.find(row=>row.name?.en===english);
 assert.ok(npc,"Missing source-checked rare "+english);
 assert.equal(npc.name.fr,french,"Untranslated Classic rare NPC "+english);
}
// Regression: verified item names must match in rare source data and the shared FR/EN renderer.
for(const [id,english,french] of [[6180,"Slarkskin","Peau de Slark"],[3018,"Hide of Lupos","Peau de Lupos"],[3227,"Nightbane Staff","Bâton plaie-de-nuit"],[5425,"Runescale Girdle","Ceinturon en écailles runiques"],[5423,"Boahn's Fang","Croc de Boahn"],[5183,"Pulsating Hydra Heart","Coeur d'hydre palpitant"],[6628,"Raven's Claws","Serres du corbeau"],[6179,"Privateer's Cape","Cape de corsaire"]]){
 const record={id,name:english,name_fr:english,source_status:"classic_reference"};
 assert.equal(fr.name(record),french,"Incorrect Classic French item name for "+id);
 assert.equal(en.name(record),english,"Incorrect Classic English item name for "+id);
 const rareDrop=rareCatalog.rares.flatMap(row=>row.loot||[]).find(item=>Number(item.item_id)===id);
 assert.ok(rareDrop,"Missing rare drop reference for item "+id);
 assert.equal(rareDrop.name.en,english,"Rare English ID mismatch: "+id);
 assert.equal(rareDrop.name.fr,french,"Rare French ID mismatch: "+id);
}
const coralRare=rareCatalog.rares.flatMap(row=>row.loot||[]).find(item=>Number(item.item_id)===3188);
assert.equal(coralRare?.name?.fr,"Claymore des coraux","Rare loot French name must match Classic item 3188");
// Forever client references can use /items/ID-slug, not only Wowhead item=ID.
for(const [url,id] of [["https://www.60.tools/items/284400-foremans-helm",284400],
  ["https://www.wowhead.com/forever/item=285347",285347],
   ["https://wowforever.wclbox.com/en/wupin/285272",285272]]){
 const m=/(?:item=|\/items?\/|\/wupin\/)(\d+)/.exec(url);
 assert.ok(m && Number(m[1])===id,"Rare source URL must resolve the intended exact item ID");
}
for(const rare of rareCatalog.rares||[]){
 for(const drop of rare.loot||[]){
  assert.ok(Number.isSafeInteger(Number(drop.item_id))&&Number(drop.item_id)>0,"Rare loot is missing an item ID: "+rare.name.en);
  const known=canonical.get(Number(drop.item_id));
  if(known)assert.equal(drop.name.en,known,"Rare item ID / English-name mismatch: "+drop.item_id);
  if(drop.item_source_url){const m=/(?:item=|\/items?\/|\/wupin\/)(\d+)/.exec(drop.item_source_url);assert.ok(m,"Invalid rare item link: "+drop.item_source_url);assert.equal(Number(m[1]),Number(drop.item_id),"Rare item link does not match its ID: "+drop.item_id);}
 }
}
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
