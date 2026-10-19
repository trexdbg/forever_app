import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const data=JSON.parse(read("data/t0-set-bonuses-forever.json"));
const sets=data.sets;

test("all nine Forever T0 dungeon sets are documented with build-pinned sources",()=>{
 assert.equal(data.schema_version,1);
 assert.equal(data.publication_status,"forever_client_datamined_not_in_game");
 assert.deepEqual(sets.map(s=>s.id),[181,182,183,184,185,186,187,188,189]);
 assert.equal(new Set(sets.map(s=>s.name_en)).size,9);
 for(const set of sets){
  assert.equal(set.level,58);
  assert.equal(set.item_count,8);
  assert.equal(set.evidence_level,"datamined");
  assert.equal(set.source_url,`https://foreverdb.net/set/${set.id}`);
  assert.equal(set.evidence_url,set.source_url);
  assert.match(set.observed_at,new RegExp("^2026-10-[0-9]{2}$"));
  assert.match(set.observed_build,new RegExp("^1[.]60[.]1[.]7[0-9]{4}$"));
  assert.ok(set.evidence_kind&&set.evidence_note);
  assert.equal(set.pieces_en.length,8);
  assert.equal(new Set(set.pieces_en).size,8);
  assert.deepEqual([...new Set(set.bonuses.map(b=>b.pieces))],[2,3,4,5,6]);
  for(const b of set.bonuses){
   assert.ok(b.en&&b.fr,"FR/EN bonus missing: "+set.name_en);
   assert.ok(b.pieces>=2&&b.pieces<=6);
  }
 }
 assert.equal(new Set(sets.flatMap(s=>s.pieces_en)).size,72,"Pieces must belong to one set only");
});

test("known Forever overrides differ from Classic without silently replacing other stats",()=>{
 const shadow=sets.find(s=>s.id===184);
 assert.match(shadow.bonuses.find(b=>b.pieces===3).en,/30 attack power/i);
 assert.match(shadow.bonuses.find(b=>b.pieces===5).fr,/20 énergie/i);
 const wildheart=sets.find(s=>s.id===185);
 assert.equal(wildheart.bonuses.filter(b=>b.pieces===3).length,2,"Two different 3-piece bonuses");
 const valor=sets.find(s=>s.id===189);
 assert.match(valor.bonuses.find(b=>b.pieces===3).fr,/15 force/i);
 assert.ok(sets.every(s=>!s.bonuses.some(b=>b.pieces===8)),"Do not import Classic 8-piece bonuses");
});

test("compact catalogue and item tooltip expose the same curated set bonuses",()=>{
 const catalogue=read("assets/items-v3.js");
 const tooltip=read("assets/item-tooltips.js");
 const styles=read("assets/item-catalogue.css");
 assert.ok(catalogue.includes("item-t0-sets"));
 assert.ok(catalogue.includes('t0Root.addEventListener("toggle"'));
 assert.ok(catalogue.includes("t0-set-bonuses-forever.json"));
 assert.ok(catalogue.includes("en?bonus.en:bonus.fr"));
 assert.ok(tooltip.includes("function t0For(item)"));
 assert.ok(tooltip.includes("queueT0(item,currentToken)"));
 assert.ok(tooltip.includes("forever-item-tooltip__t0"));
 assert.ok(styles.includes("item-t0-sets__grid"));
});

test("all 72 T0 pieces link by Forever client ID to their exact ForeverDB item pages",()=>{
 const ids=sets.flatMap(set=>{
  assert.equal(set.piece_links_reviewed_at,"2026-10-18");
  assert.equal(set.pieces?.length,8);
  return set.pieces.map((piece,index)=>{
   assert.equal(piece.name_en,set.pieces_en[index]);
   assert.ok(Number.isSafeInteger(piece.id)&&piece.id>0);
   assert.equal(piece.url,"https://foreverdb.net/item/"+piece.id);
   return piece.id;
  });
 });
 assert.equal(ids.length,72);
 assert.equal(new Set(ids).size,72,"No T0 item may be assigned to multiple sets");
 assert.deepEqual([...ids].sort((a,b)=>a-b),Array.from({length:72},(_,i)=>16666+i));
 assert.equal(sets.find(s=>s.id===184).pieces[2].id,16710,"Shadowcraft Bracers confirmed on ForeverDB");
 assert.equal(sets.find(s=>s.id===181).pieces[0].id,16685,"Magister's Belt confirmed on ForeverDB");
 assert.equal(sets.find(s=>s.id===189).pieces[0].id,16736,"Belt of Valor confirmed on ForeverDB");
});

test("FR/EN equipment pages link T0 pieces without injecting unverified loot details",()=>{
 const js=read("assets/items-v3.js"),tooltip=read("assets/item-tooltips.js"),css=read("assets/item-catalogue.css");
 assert.match(js,/record\.url==="https:\/\/foreverdb\.net\/item\/"\+record\.id/);
 assert.match(js,/record\.name_en===name/);
 assert.match(js,/item-t0-sets__piece-link/);
 assert.match(tooltip,/set\.pieces\.some\(piece=>piece\.id===Number\(item\.id\)\)/);
 assert.match(css,/item-t0-sets__piece-link:focus-visible/);
 for(const path of ["equipements/index.html","en/equipements/index.html"]){
  const html=read(path);
  for(const asset of ["item-catalogue.css","item-tooltips.js","items-v3.js"]){
   const version=asset==="item-tooltips.js"?"20261018-t0-piece-links":"20261019-source-hints";
   assert.ok(html.includes(asset+"?v="+version),path+" "+asset);
  }
 }
});
