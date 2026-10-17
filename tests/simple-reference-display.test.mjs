import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('catalogue keeps one record per ID, prefers known Forever values and retains missing Classic properties',()=>{
 const source=read('assets/items-v3.js');
 const type=source.slice(source.indexOf('function sourceType(item)'),source.indexOf('const scopeLabels='));
 const precedence=source.slice(source.indexOf('function precedence(item)'),source.indexOf('const validImage='));
 const catalogue=source.slice(source.indexOf('function catalogItems()'),source.indexOf('function matchesBase(item)'));
 const items=runInNewContext(type+precedence+catalogue+';catalogItems()',{classic:[
  {id:10,source_status:'classic_reference',itemLevel:20,requiredLevel:15,tooltip:['Classic stat'],quality:'rare'},
  {id:20,source_status:'classic_reference',itemLevel:10,quality:'common'}
 ],local:[],observed:[],forever:[{id:10,source_status:'forever_beta_client',itemLevel:25,requiredLevel:null,tooltip:[],quality:'rare'}]});
 assert.equal(items.length,2);
 assert.equal(items.find(i=>i.id===10).itemLevel,25);
 assert.equal(items.find(i=>i.id===10).requiredLevel,15);
 assert.equal(items.find(i=>i.id===10).tooltip[0],'Classic stat');
 assert.equal(items.find(i=>i.id===20).source_status,'classic_reference');
 assert.match(source,/if\(status==="beta30"&&!betaLevel30\(item\)\)/,'Level-30 view includes Classic fallback items');
});

test('main FR/EN pages have no repeated evidence panels and keep functional controls',()=>{
 for(const prefix of ['','en/']){
  for(const route of ['metiers','marchands','rare','donjons']){
   const html=read(prefix+route+'/index.html');
   assert.doesNotMatch(html,/<(?:p|details)[^>]*class="(?:craft-beta-disclaimer|early-recipe-hint|atlas-detail|dg-sources)"/);
   assert.match(html,/20261017-clean-1/);
  }
  assert.match(read(prefix+'metiers/index.html'),/id="early-recipes"/);
  assert.match(read(prefix+'rare/index.html'),/id="rare-canvas"/);
  assert.match(read(prefix+'donjons/index.html'),/id="dg-map"/);
 }
});

test('unsupported boss/rare/item acquisition links are omitted without deleting source data',()=>{
 assert.match(read('assets/dungeons.js'),/filter\(it=>dropProof\(it\)!=="unverified"\)/);
 assert.match(read('assets/rares.js'),/r\.loot\.filter\(item=>item\.evidence_level!=="unverified"\)/);
 assert.match(read('assets/items-v3.js'),/filter\(s=>s\.evidence_level!=="unverified"\)/);
 const db=JSON.parse(read('data/dungeons-forever.json'));
 assert.equal(db.dungeons.flatMap(d=>d.bosses||[]).flatMap(b=>b.loot||[]).filter(i=>i.evidence_level==='unverified').length,25);
 assert.equal(JSON.parse(read('data/recipes-forever-early-archive.json')).recipes.length,649);
});
