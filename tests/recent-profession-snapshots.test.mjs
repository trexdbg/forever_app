import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const snapshots=JSON.parse(file('data/recipes-forever-70425-snapshots.json'));
const archive=JSON.parse(file('data/recipes-forever-early-archive.json'));
const recent=snapshots.recipes, old=new Map(archive.recipes.map(r=>[r.spell_id,r]));

test('44 build-pinned documentary snapshots, 99 exact reagent edges and 12 plan links',()=>{
 assert.equal(snapshots.observed_build,'1.60.1.70425');
 assert.equal(recent.length,44);assert.equal(snapshots.counts.recipes,44);
 assert.equal(new Set(recent.map(r=>r.spell_id)).size,44);
 assert.equal(recent.filter(r=>r.profession_id===202).length,30);
 assert.equal(recent.filter(r=>r.profession_id===129).length,14);
 assert.equal(recent.flatMap(r=>r.ingredients).length,99);
 assert.equal(recent.flatMap(r=>r.book_item_ids).length,12);
 assert.equal(recent.filter(r=>r.learning_skill_reported!==null).length,15);
 assert.equal(recent.filter(r=>old.get(r.spell_id).outputs[0].reported_client_output_quantity===null).length,14);
 for(const source of snapshots.sources){assert.match(source.html_sha256,/^[a-f0-9]{64}$/);assert.equal(source.observed_build,snapshots.observed_build);}
 assert.equal(snapshots.sources.reduce((n,s)=>n+s.selected_recipes,0),44);
});

test('every property keeps the page/build provenance; calculated green and live unknowns remain explicit',()=>{
 for(const r of recent){
  assert.equal(r.evidence_level,'documented_forever');assert.equal(r.evidence_kind,'forever_community_page');
  assert.equal(r.observed_build,'1.60.1.70425');assert.equal(r.observed_at,'2026-10-17');
  assert.ok(snapshots.sources.some(s=>s.source_url===r.source_url));
  assert.equal(r.evidence_url,r.source_url+'#r-'+r.spell_id);assert.ok(r.evidence_note);
  assert.equal(r.name_fr,null);assert.equal(r.availability_in_game,null);
  assert.equal(r.output.player_level_required,null);assert.equal(r.output.verified_live_yield,null);
  assert.ok(Number.isSafeInteger(r.output.quantity_reported)&&r.output.quantity_reported>0);
  assert.equal(r.green_threshold_status,'source_calculated_midpoint_not_independently_extracted');
  assert.equal(r.skill_green_reported,Math.ceil((r.skill_yellow_reported+r.skill_grey_reported)/2));
  assert.ok(r.skill_yellow_reported>=1&&r.skill_yellow_reported<=150);
  assert.equal(r.profession_id,old.get(r.spell_id).profession_id);
  assert.equal(r.output.item_id,old.get(r.spell_id).outputs[0].item_id);
  for(const i of r.ingredients){assert.ok(Number.isSafeInteger(i.item_id)&&i.item_id>0);assert.ok(Number.isSafeInteger(i.quantity)&&i.quantity>0);}
  assert.deepEqual(r.ingredients.map(i=>[i.item_id,i.quantity]),old.get(r.spell_id).ingredients.map(i=>[i.item_id,i.quantity]));
  assert.equal(r.vendor_references,undefined);
 }
});

test('Copper Tube research conflict and original archive stay intact beside separate documentary quantities',()=>{
 const preview=JSON.parse(file('data/crafting-chains-beta.json')).recipes.find(r=>r.spell_id===3924);
 assert.equal(preview.output_quantity,null);assert.equal(preview.output_quantity_status,'conflicting_sources');
 assert.equal(recent.find(r=>r.spell_id===3924).output.quantity_reported,1);
 assert.equal(old.get(3931).outputs[0].reported_client_output_quantity,null);
 assert.equal(recent.find(r=>r.spell_id===3931).output.quantity_reported,2);
 assert.equal(old.get(3931).learning_skill_required,null);
 assert.equal(recent.find(r=>r.spell_id===1266893).learning_skill_reported,25);
});

async function renderer(lang,mode='ok'){
 class Element{
  constructor(){this.children=[];this.events={};this.dataset={};this.value='';this._text='';}
  append(n){this.children.push(n);}replaceChildren(...children){this.children=children;this._text='';}
  set textContent(s){this._text=String(s);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join(' ');}
  addEventListener(e,fn){this.events[e]=fn;}setAttribute(k,v){this[k]=v;}scrollIntoView(){}
 }
 const els=new Map(),get=id=>{if(!els.has(id))els.set(id,new Element());return els.get(id);};
 get('early-recipe-profession').value='all';get('early-recipe-change').value='all';
 const calls=[];
 runInNewContext(file('assets/recipes-early.js'),{document:{documentElement:{lang},getElementById:get,createElement:()=>new Element()},window:{},
  fetch:async url=>{calls.push(url);if(url.includes('70425')){
   if(mode==='offline')throw Error('offline');
   const db=structuredClone(snapshots);
   if(mode==='invalid'){db.recipes=[{spell_id:3931,profession_id:202,evidence_level:'documented_forever',observed_build:db.observed_build}];}
   if(mode==='wrong-profession')db.recipes.forEach(s=>s.profession_id=171);
   return {ok:true,json:async()=>db};
  }return {ok:true,json:async()=>structuredClone(archive)};}});
 assert.equal(calls.length,0,'No eager data loading before opening the archive');
 get('early-recipes').open=true;get('early-recipes').events.toggle();
 await new Promise(resolve=>setImmediate(resolve));
 return {get,calls,walk:el=>[el,...el.children.flatMap(child=>walk(child))]};
 function walk(el){return [el,...el.children.flatMap(walk)];}
}

for(const lang of ['fr','en'])test(`${lang}: actual renderer exposes a separate recent snapshot and preserves historical unknowns`,async()=>{
 const {get,calls,walk}=await renderer(lang);
 assert.equal(calls.length,2);
 const search=get('early-recipe-search');search.value='3931';search.events.input();
 const detail=get('early-recipe-detail'),panel=walk(detail).find(el=>el.className==='early-current-snapshot');
 assert.ok(panel);assert.match(panel.textContent,/1\.60\.1\.70425/);assert.match(panel.textContent,/×2/);
 assert.ok(panel.textContent.includes(lang==='en'?'Green (source calculation)':'Vert (calcul de la source)'));
 assert.ok(walk(panel).some(el=>el.href===recent.find(r=>r.spell_id===3931).evidence_url));
 assert.ok(detail.textContent.includes(lang==='en'?'Quantity unknown':'Quantité inconnue'),'Historical quantity stays unknown below the recent panel');
 search.value='1266893';search.events.input();
 assert.match(get('early-recipe-detail').textContent,/25/);
});

for(const mode of ['offline','invalid','wrong-profession'])test(`optional snapshot ${mode} never disables the archive or attaches the wrong profession`,async()=>{
 const {get,walk}=await renderer('fr',mode),search=get('early-recipe-search');search.value='3931';search.events.input();
 const detail=get('early-recipe-detail');assert.match(detail.textContent,/Coarse Dynamite/);
 assert.ok(!walk(detail).some(el=>el.className==='early-current-snapshot'));
});

test('both language pages invalidate the modified renderer cache',()=>{
 for(const path of ['metiers/index.html','en/metiers/index.html'])assert.match(file(path),/recipes-early\.js\?v=20261017-snapshots-1/);
});
