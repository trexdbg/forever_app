import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const src=read("assets/npcs.js");
const npcs=JSON.parse(read("data/npcs.json")).npcs.filter(n=>n.role==="trainer");
function functionSource(name,next){
 const at=src.indexOf("function "+name+"(");
 const end=src.indexOf("\nfunction "+next+"(",at);
 assert.ok(at>0&&end>at,"expected isolated helper "+name);
 return src.slice(at,end);
}
const trainerByName=name=>{
 const record=npcs.find(n=>n.name===name);
 assert.ok(record,"trainer data "+name);
 return record;
};

test("NPC share links round-trip known identities, not user searches or client-only data",()=>{
 const source=functionSource("trainerLink","renderTrainerDetail");
 assert.doesNotMatch(source,/localStorage|sessionStorage|navigator|document\.cookie|page_location/);
 for(const [name,en,kind] of [
  ["Woo Ping",true,"weapon"],
  ["Jandi",false,"profession"],
  ["Bixi Wobblebonk",false,"weapon"]
 ]){
  const n=trainerByName(name);
  assert.equal(n.trainer_kind==="weapon"?"weapon":"profession",kind);
  const result=vm.runInNewContext(source+"\ntrainerLink(n)",{
   n,en,URL,location:{origin:"https://foreveroth.com"},
   store:{db:{zone_maps:JSON.parse(read("data/npcs.json")).zone_maps}},
   trainerType:v=>v.trainer_kind==="weapon"?"weapon":"profession",
  });
  const link=new URL(result);
  assert.equal(link.origin,"https://foreveroth.com");
  assert.equal(link.pathname,en?"/en/metiers/":"/metiers/");
  assert.equal(link.hash,"#prof-trainers");
  assert.equal(link.searchParams.get("type"),kind);
  assert.equal(link.searchParams.get("q"),name);
  assert.equal(link.searchParams.get("zone"),n.zone.id);
  if(["alliance","horde"].includes(n.faction))assert.equal(link.searchParams.get("faction"),n.faction);
  assert.deepEqual([...link.searchParams.keys()].sort(),["faction","q","type","zone"]);
 }
 assert.match(src,/share\.addEventListener\("click",async\(\)=>/);
 assert.match(src,/await navigator\.clipboard\.writeText\(url\)/);
});

test("reset clears intersecting trainer filters and old deep links but preserves analytics opt-out",()=>{
 const source=functionSource("resetTrainerFilters","refresh");
 const controls={q:{value:"Woo Ping",focused:false,focus(){this.focused=true}},
  type:{value:"weapon"},trade:{value:"Forge"},weapon:{value:"Staves"},
  aff:{value:"alliance"},zone:{value:"stormwind"},rank:{value:"Expert"}};
 const location={href:"https://foreveroth.com/en/metiers/?q=Woo+Ping&type=weapon&faction=alliance&zone=stormwind&profession=Forge&weapon=Staves&rank=Expert&fo_dev=off#prof-trainers"};
 let resulting,refresh=0,visibility=0;
 vm.runInNewContext(source+"\nresetTrainerFilters()",{
  ...controls,store:{mode:"trainer"},URL,location,
  history:{replaceState(_a,_b,path){resulting=path}},
  updateFilterVisibility(){visibility++},refresh(){refresh++}
 });
 assert.deepEqual(Object.fromEntries(Object.entries(controls).map(([k,v])=>[k,v.value])),
  {q:"",type:"profession",trade:"all",weapon:"all",aff:"all",zone:"all",rank:"all"});
 assert.equal(controls.q.focused,true);
 assert.equal(refresh,1);
 assert.equal(visibility,1);
 assert.equal(resulting,"/en/metiers/?fo_dev=off#prof-trainers");
 const noOp=vm.runInNewContext(source+"\nresetTrainerFilters()",{
  ...controls,store:{mode:"merchant"},URL,location,
  history:{replaceState(){throw Error("merchant must not reset")}},
  updateFilterVisibility(){throw Error("merchant must not reset")},
  refresh(){throw Error("merchant must not reset")}
 });
 assert.equal(noOp,undefined);
});

test("reset visibility depends on active selections and stays hidden by default",()=>{
 const source=functionSource("syncTrainerReset","resetTrainerFilters");
 const reset={hidden:false};
 const q={value:""},type={value:"profession"},trade={value:"all"},
  weapon={value:"all"},aff={value:"all"},zone={value:"all"},rank={value:"all"};
 const context={q,type,trade,weapon,aff,zone,rank,
  store:{mode:"trainer"},"$":id=>id==="npc-trainer-reset"?reset:null};
 vm.runInNewContext(source+"\nsyncTrainerReset()",context);
 assert.equal(reset.hidden,true);
 zone.value="stormwind";
 vm.runInNewContext(source+"\nsyncTrainerReset()",context);
 assert.equal(reset.hidden,false);
 q.value="Jandi";zone.value="all";
 vm.runInNewContext(source+"\nsyncTrainerReset()",context);
 assert.equal(reset.hidden,false);
});

test("both locales load new assets, reset only trainer filters and retain quest navigation",()=>{
 for(const path of ["metiers/index.html","en/metiers/index.html"]){
  const html=read(path);
  assert.equal((html.match(/id="npc-trainer-reset"/g)||[]).length,1,path);
  assert.match(html,/<button type="button" id="npc-trainer-reset" hidden>/);
  assert.match(html,/npcs\.js\?v=20261124-trainer-reset-share1/);
  assert.match(html,/trainer-quick\.css\?v=20261124-trainer-reset-share1/);
  assert.match(html,/id="npc-map-canvas"/);
  assert.match(html,/id="npc-favorites"/);
 }
 const analytics=read("assets/analytics.js");
 assert.ok(analytics.includes('"npc-trainer-reset", "npc-share-trainer"'));
 assert.match(read("assets/common.js"),/analytics\.js\?v=20261124-trainer-reset-share1/);
 assert.match(src,/if\(store\.mode==="trainer"\)\$\("npc-trainer-reset"\)\?\.addEventListener\("click",resetTrainerFilters\)/);
 assert.match(src,/syncMerchantUX\(\);syncTrainerReset\(\)/);
 assert.match(read("assets/trainer-quick.css"),/\.npc-trainer-reset-row button\[hidden\]/);
});
