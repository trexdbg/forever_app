import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const src=read("assets/quests.js");
const linkAt=src.indexOf("function questStepLink(){");
const linkEnd=src.indexOf("\nconst project=",linkAt);
const handlerAt=src.indexOf('$("quest-share").addEventListener("click",async()=>{');
const handlerEnd=src.indexOf('\n$("quest-prev")',handlerAt);
assert.ok(linkAt>=0&&linkEnd>linkAt,"route link helper exists");
assert.ok(handlerAt>=0&&handlerEnd>handlerAt,"share click handler exists");
const helper=src.slice(linkAt,linkEnd);
const handler=src.slice(handlerAt,handlerEnd);

test("shared Classic route links reproduce only canonical faction, profile, actual race and step",()=>{
 assert.doesNotThrow(()=>new Script(src));
 const states=[
  {faction:"alliance",profile:"human",race:"human",index:0},
  {faction:"alliance",profile:"gnorf",race:"dwarf",index:11},
  {faction:"alliance",profile:"nelf",race:"nelf",index:31},
  {faction:"horde",profile:"trorc",race:"troll",index:15},
  {faction:"horde",profile:"undead",race:"undead",index:3}
 ];
 for(const lang of ["en","fr"])for(const s of states){
  const href=runInNewContext(helper+"\nquestStepLink()",{
   s,document:{documentElement:{lang}},location:{origin:"https://foreveroth.com"},
   URL
  });
  const url=new URL(href);
  assert.equal(url.origin,"https://foreveroth.com");
  assert.equal(url.pathname,lang==="en"?"/en/quetes/":"/quetes/");
  assert.equal(url.searchParams.get("faction"),s.faction);
  assert.equal(url.searchParams.get("race"),s.profile);
  assert.equal(url.searchParams.get("peuple"),s.race);
  assert.equal(url.searchParams.get("step"),String(s.index+1));
  assert.deepEqual([...url.searchParams.keys()].sort(),["faction","peuple","race","step"]);
 }
 assert.doesNotMatch(helper,/location\.search|new URL\(location\.href\)|localStorage|sessionStorage|quest-search|selected|waypoints|clipboard/);
});

async function runHandler(clipboard,s){
 const elements={
  "quest-share":{addEventListener(_event,fn){this.fn=fn}},
  "quest-share-fallback":{hidden:true,value:"",focused:false,selected:false,
   focus(){this.focused=true},select(){this.selected=true}},
  "quest-share-notice":{textContent:""}
 };
 const events=[],writes=[];
 const sandbox={s,URL,document:{documentElement:{lang:"en"}},
  location:{origin:"https://foreveroth.com"},
  navigator:{clipboard:clipboard?{writeText:async url=>{
   writes.push(url);if(clipboard==="fail")throw Error("Clipboard unavailable");
  }}:undefined},
  window:{ForEverothAnalytics:{track(...args){events.push(args)}}},
  QT:(_fr,en)=>en,
  "$":key=>elements[key]};
 runInNewContext(helper+"\n"+handler,sandbox);
 await elements["quest-share"].fn();
 return {elements,events,writes};
}
test("clipboard copy emits only fixed consent-managed analytics and shows success",async()=>{
 const x=await runHandler("ok",{faction:"alliance",profile:"human",race:"human",index:6,steps:[{}]});
 assert.equal(x.writes.length,1);
 assert.match(x.writes[0],/\/en\/quetes\/\?faction=alliance&race=human&peuple=human&step=7/);
 assert.equal(x.elements["quest-share-notice"].textContent,"Link copied ✓");
 assert.equal(x.elements["quest-share-fallback"].hidden,true);
 assert.equal(x.events.length,1);
 assert.deepEqual([...x.events[0]],[ "tool_interaction",{module_name:"quetes",control_name:"quest-share"}]);
 assert.doesNotMatch(handler,/item_id|searchParams|\$\("quest-search"\)|location\.search/);
});
test("clipboard failure offers a selectable URL instead of showing false success",async()=>{
 const x=await runHandler("fail",{faction:"horde",profile:"tauren",race:"tauren",index:12,steps:[{}]});
 assert.equal(x.writes.length,1);
 const box=x.elements["quest-share-fallback"];
 assert.equal(box.hidden,false);
 assert.equal(box.focused,true);
 assert.equal(box.selected,true);
 assert.equal(new URL(box.value).searchParams.get("step"),"13");
 assert.equal(x.elements["quest-share-notice"].textContent,"Select and copy the link below");
 const y=await runHandler(null,{faction:"alliance",profile:"nelf",race:"nelf",index:0,steps:[{}]});
 assert.equal(y.writes.length,0);
 assert.equal(y.elements["quest-share-fallback"].hidden,false);
 const unready=await runHandler("ok",{faction:"alliance",profile:"human",race:"human",index:0,steps:[]});
 assert.equal(unready.events.length,0);
 assert.equal(unready.writes.length,0);
});

test("both public Classic quest pages retain their routes and provide a disabled-until-ready action",()=>{
 for(const path of ["quetes/index.html","en/quetes/index.html"]){
  const html=read(path);
  assert.match(html,/WoW Classic only|WoW Classic uniquement|WoW Classic/);
  assert.match(html,/id="quest-share" disabled/);
  assert.match(html,/id="quest-share-fallback" readonly hidden/);
  assert.match(html,/id="quest-share-notice" role="status"/);
  assert.match(html,/quests\.js\?v=20261124-step-share1/);
  assert.match(html,/quest-sidebar\.css\?v=20261124-step-share1/);
  assert.match(html,/id="quest-next"/);
  assert.match(html,/id="quest-prev"/);
  assert.match(html,/id="quest-range"/);
  assert.match(html,/id="quest-canvas"/);
 }
 assert.match(src,/\$\("quest-share"\)\.disabled=false/);
 assert.match(read("assets/quest-sidebar.css"),/\#quest-share-fallback\[hidden\]/);
});
