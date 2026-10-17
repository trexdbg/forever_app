import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const source=read("assets/rares.js");
const data=JSON.parse(read("data/rares.json"));
const start=source.indexOf("const pointEvidence=");
const end=source.indexOf("const exactLevel=",start);
assert.ok(start>0&&end>start,"Point evidence helpers must remain available for regression testing");
const helpers=source.slice(start,end);
const api=locale=>runInNewContext(helpers+";({pointEvidence,pointLevel,pointLabel,pointSummary,hasForeverLocation,presenceLabel})",{
 T:(fr,en)=>locale==="en"?en:fr
});
const french=api("fr"),english=api("en");

test("a coordinate borrows neither a neighbour's Forever proof nor mismatched evidence",()=>{
 const rare={
  points:[[10,20],[30,40]],
  point_evidence:[
   {coordinates:[10,20],evidence_level:"unverified"},
   {coordinates:[30,40],evidence_level:"documented_forever",evidence_url:"https://example.org/rare"}
  ],
  reference:"classic_cmangos_not_forever_verified",seen_forever:false
 };
 assert.equal(french.pointLabel(rare,0),"Classic");
 assert.match(french.pointLabel(rare,1),/^Forever$/);
 assert.match(english.pointLabel(rare,1),/^Forever$/);
 assert.equal(french.hasForeverLocation(rare),true);
 assert.match(french.pointSummary(rare),/Emplacements/);
 assert.equal(french.pointEvidence({...rare,point_evidence:[rare.point_evidence[1],rare.point_evidence[0]]},0),null);
 assert.equal(english.pointLevel({...rare,point_evidence:[]},0),"unverified");
 assert.equal(french.pointLabel({...rare,point_evidence:[{coordinates:[10,20],evidence_level:"confirmed_in_game"}]},0),"Forever");
});

test("community-documented new Forever rares do not get a false Classic-only or gameplay-confirmed label",()=>{
 const scoped=data.rares.filter(r=>r.beta_level30_in_scope);
 const newForever=scoped.filter(r=>r.reference==="new_forever_community_documented_not_gameplay_confirmed");
 assert.equal(scoped.length,161);
 assert.equal(newForever.length,11);
 for(const rare of newForever){
  assert.equal(rare.seen_forever,false,rare.id);
  assert.match(french.presenceLabel(rare),/^Forever$/);
  assert.match(english.presenceLabel(rare),/^Forever$/);
 }
 const classic=scoped.find(r=>r.id==="462");
 assert.match(french.presenceLabel(classic),/Classic/);
 assert.equal(french.hasForeverLocation(classic),false);
});

test("all 345 scoped coordinates are labeled only from their matching individual evidence",()=>{
 const scoped=data.rares.filter(r=>r.beta_level30_in_scope);
 let documented=0,indicative=0;
 for(const rare of scoped){
  for(let i=0;i<rare.points.length;i++){
   const level=french.pointLevel(rare,i);
   if(["documented_forever","confirmed_in_game"].includes(level)){
    documented++;
    assert.match(english.pointLabel(rare,i),/Forever/);
    assert.ok(!english.pointLabel(rare,i).includes("verified in-game")||level==="confirmed_in_game"||english.pointLabel(rare,i).includes("not verified"),rare.id);
   }else{
    indicative++;
    assert.match(english.pointLabel(rare,i),/Classic/);
   }
  }
 }
 assert.equal(documented,36);
 assert.equal(indicative,309);
});

test("selected coordinate drives /way and source; both languages load the same evidence-aware asset",()=>{
 assert.match(source,/const p=r\.points\[pointIndex\],str="\/way "/);
 assert.match(source,/T\("Copier \/way","Copy \/way"\),"rare-copy"/);
 assert.match(source,/const chosenEvidence=pointEvidence\(r,pointIndex\)/);
 assert.match(source,/b\.setAttribute\("aria-pressed",String\(i===pointIndex\)\)/);
 assert.match(source,/const selectedPin=selected\?\.points\?\.\[pointIndex\]/);
 assert.match(source,/if\(hit\)choose\(hit\.r,hit\.index\)/);
 assert.doesNotMatch(source,/const p=r\.points\[0\],str="\/way "/);
 for(const path of ["rare/index.html","en/rare/index.html"]){
  const html=read(path);
  assert.ok(html.includes("/assets/rares.js?v=20261017-loot-icons-1"),path);
  assert.ok(html.includes("/assets/rares.css?v=20261017-loot-icons-1"),path);
 }
});
