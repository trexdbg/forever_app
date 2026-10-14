#!/usr/bin/env node
/* Local Chromium/CDP screenshots and smoke tests of the actual FR/EN site routes.
   No browser dependencies beyond Chrome/Chromium and Node 22. */
import {createServer} from "node:http";
import {readFile,writeFile,mkdir,mkdtemp,rm,access} from "node:fs/promises";
import {spawn} from "node:child_process";
import {resolve,dirname,extname,sep} from "node:path";
import {tmpdir} from "node:os";
import {fileURLToPath} from "node:url";
import {setTimeout as delay} from "node:timers/promises";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const output=resolve(root,"artifacts/crafting-beta-visual");
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp"};
const assert=(ok,message)=>{if(!ok)throw Error(message)};
let chrome,server,socket,profile;
async function chromeBinary(){
 for(const path of [process.env.CHROME_BIN,"/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium"].filter(Boolean)){
  try{await access(path);return path}catch{}
 }
 throw Error("Chrome/Chromium unavailable");
}
async function localServer(){
 const srv=createServer(async(req,res)=>{
  try{
   const path=decodeURIComponent(new URL(req.url,"http://localhost").pathname).replace(/\/$/,"/index.html");
   const full=resolve(root,"."+path);
   if(!full.startsWith(root+sep)){res.writeHead(403).end();return}
   const body=await readFile(full);
   res.writeHead(200,{"Content-Type":mime[extname(full)]||"application/octet-stream","Cache-Control":"no-store"});
   res.end(body);
  }catch{res.writeHead(404).end("Missing local asset")}
 });
 await new Promise((done,fail)=>{srv.once("error",fail);srv.listen(0,"127.0.0.1",done)});
 return srv;
}
async function connect(bin){
 profile=await mkdtemp(resolve(tmpdir(),"foreveroth-chrome-"));
 chrome=spawn(bin,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
  "--remote-allow-origins=*","--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"],{stdio:"ignore"});
 let port=0;
 for(let i=0;i<300;i++){
  if(chrome.exitCode!==null)throw Error("Chrome process exited");
  try{port=Number((await readFile(resolve(profile,"DevToolsActivePort"),"utf8")).split("\n")[0]);if(port)break}catch{}
  await delay(100);
 }
 assert(port,"Chrome debug port missing after extended startup window");
 let version;
 for(let i=0;i<30;i++){
  try{const response=await fetch("http://127.0.0.1:"+port+"/json/version");if(response.ok){version=await response.json();break}}catch{}
  await delay(100);
 }
 assert(version?.webSocketDebuggerUrl,"Chrome websocket missing");
 socket=new WebSocket(version.webSocketDebuggerUrl);
 await new Promise((done,fail)=>{socket.addEventListener("open",done,{once:true});socket.addEventListener("error",fail,{once:true})});
 let next=0;const pending=new Map();
 socket.addEventListener("message",e=>{
  let msg;try{msg=JSON.parse(e.data)}catch{return}
  if(!msg.id)return;
  const p=pending.get(msg.id);if(!p)return;
  pending.delete(msg.id);msg.error?p.reject(Error(JSON.stringify(msg.error))):p.resolve(msg.result);
 });
 return (method,params={},sessionId)=>new Promise((done,fail)=>{
  const id=++next;pending.set(id,{resolve:done,reject:fail});
  const msg={id,method,params};if(sessionId)msg.sessionId=sessionId;
  socket.send(JSON.stringify(msg));
  setTimeout(()=>{if(pending.has(id)){pending.delete(id);fail(Error("CDP request timed out: "+method))}},15000).unref();
 });
}
async function caseRun(send,base,lang,width,height){
 const path=lang==="fr"?"/metiers/":"/en/metiers/",item=lang==="fr"?4371:4389;
 const target=await send("Target.createTarget",{url:"about:blank"});
 const {sessionId}=await send("Target.attachToTarget",{targetId:target.targetId,flatten:true});
 const cmd=(method,params={})=>send(method,params,sessionId);
 const evaluate=async expression=>{
  const result=await cmd("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error("Chrome JS exception "+JSON.stringify(result.exceptionDetails));
  return result.result?.value;
 };
 try{
  await cmd("Page.enable");
  await cmd("Runtime.enable");
  await cmd("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width===375});
  await cmd("Page.navigate",{url:base+path+"?craft="+item});
  let state={};
  for(let i=0;i<100;i++){
   state=await evaluate('(()=>({open:document.querySelector("#craft-beta")?.open,count:document.querySelectorAll("#craft-beta-list .craft-result").length,text:document.querySelector("#craft-beta-detail")?.textContent||"",map:!!document.querySelector("#npc-map-canvas")}))()');
   if(state.open&&state.count===8&&state.text.includes("#"+item)&&state.map)break;
   await delay(160);
  }
  assert(state.open&&state.count===8&&state.text.includes("#"+item),lang+" "+width+" deep link or recipe list did not load "+JSON.stringify(state));
  assert(state.map,lang+" "+width+" original trainers map is missing");
  const landing=await evaluate('(()=>{const box=document.querySelector("#craft-beta-detail").getBoundingClientRect();return {top:box.top,bottom:box.bottom}})()');
  if(width===375)assert(landing.top>=0&&landing.top<height,lang+" mobile deep-link detail is not visible at landing: "+JSON.stringify(landing));
  const layout=await evaluate('(()=>{const panel=document.querySelector("#craft-beta"),content=document.querySelector(".craft-beta-content"),detail=document.querySelector("#craft-beta-detail"),canvas=document.querySelector("#npc-map-canvas"),search=document.querySelector("#craft-beta-search");search.focus();return {width:innerWidth,panelRight:panel.getBoundingClientRect().right,contentRight:content.getBoundingClientRect().right,detailOverflow:detail.scrollWidth-detail.clientWidth,focus:document.activeElement===search,mapFocusable:canvas.tabIndex===0,mapContext:!!canvas.getContext("2d")}})()');
  assert(layout.panelRight<=layout.width+2&&layout.contentRight<=layout.width+2&&layout.detailOverflow<=2,lang+" "+width+" horizontal overflow: "+JSON.stringify(layout));
  assert(layout.focus,lang+" "+width+" search is not keyboard-focusable");
  assert(layout.mapFocusable&&layout.mapContext,lang+" "+width+" original map is not accessible");
  const reopened=await evaluate('(async()=>{const d=document.querySelector("#craft-beta"),field=document.querySelector("#craft-beta-search");field.value="4389";field.dispatchEvent(new Event("input",{bubbles:true}));const filtered=document.querySelectorAll("#craft-beta-list .craft-result").length;d.open=false;await new Promise(r=>setTimeout(r,120));d.open=true;await new Promise(r=>setTimeout(r,120));return {filtered,input:field.value,results:document.querySelectorAll("#craft-beta-list .craft-result").length,counter:document.querySelector("#craft-beta-count").textContent}})()');
  assert(reopened.filtered===1&&reopened.input===""&&reopened.results===8&&reopened.counter.startsWith("8 / 8"),lang+" "+width+" close/reopen defect persists: "+JSON.stringify(reopened));
  const prefix=lang+"-"+width;
  await evaluate('document.querySelector("#craft-beta").scrollIntoView({behavior:"instant",block:"start"});');await delay(250);
  const capture=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await writeFile(resolve(output,prefix+"-craft.png"),Buffer.from(capture.data,"base64"));
  await evaluate('document.querySelector("#craft-beta-detail").scrollIntoView({behavior:"instant",block:"start"});');await delay(220);
  const selected=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await writeFile(resolve(output,prefix+"-detail.png"),Buffer.from(selected.data,"base64"));
  const chain=lang==="fr"?[[2841,"2659"],[3576,"3304"],[2771,"Filon"]]:[[10558,"12584"],[3577,"3308"],[2776,"Gold Vein"]];
  for(const [id,proof] of chain){
   const result=await evaluate('(()=>{const button=[...document.querySelectorAll("#craft-beta-detail .craft-component")].find(x=>x.textContent.includes("#'+id+'"));if(!button)return {found:false};button.click();return {found:true,selected:new URLSearchParams(location.search).get("craft"),text:document.querySelector("#craft-beta-detail").textContent}})()');
   assert(result.found&&result.selected===String(id)&&result.text.includes(proof),lang+" "+width+" nested source path failed at "+id+": "+JSON.stringify(result));
  }
  await evaluate('document.querySelector("#craft-beta-detail").scrollIntoView({behavior:"instant",block:"start"});');await delay(260);
  const materials=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await writeFile(resolve(output,prefix+"-sources.png"),Buffer.from(materials.data,"base64"));
  await evaluate('document.querySelector("#npc-map-canvas").scrollIntoView({behavior:"instant",block:"center"});');await delay(300);
  const mapCapture=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await writeFile(resolve(output,prefix+"-map.png"),Buffer.from(mapCapture.data,"base64"));
  const aId=lang==="fr"?4596:247239;
  const alchemy=await evaluate('(async()=>{const section=document.querySelector("#alchemy-beta");if(!section)return {missing:true};section.open=true;await new Promise(r=>setTimeout(r,320));const count=document.querySelectorAll("#alchemy-list .craft-result").length;const target=[...document.querySelectorAll("#alchemy-list .craft-result")].find(x=>x.dataset.alchemy==="'+aId+'");if(!target)return {count,missingTarget:true};target.click();await new Promise(r=>setTimeout(r,120));const detail=document.querySelector("#alchemy-detail");const box=document.querySelector("#alchemy-beta").getBoundingClientRect();const field=document.querySelector("#alchemy-search");field.focus();return {count,selected:new URLSearchParams(location.search).get("alchemy"),detail:detail.textContent,excluded:[...document.querySelectorAll("#alchemy-list [data-alchemy]")].some(x=>["118","858"].includes(x.dataset.alchemy)),right:box.right,width:innerWidth,focus:document.activeElement===field,oldCraft:new URLSearchParams(location.search).get("craft")}})()');
  assert(alchemy.count===6&&!alchemy.excluded&&alchemy.selected===String(aId)&&alchemy.oldCraft===String(chain.at(-1)[0])&&alchemy.focus&&alchemy.right<=width+2,
   lang+" "+width+" alchemy preview/browser integrity failed "+JSON.stringify(alchemy));
  assert(alchemy.detail.includes(lang==="fr"?"Potion de soins décolorée mineure":"Lesser Discolored Healing Potion"),
   lang+" "+width+" alchemy direct item selection failed");
  await evaluate('document.querySelector("#alchemy-beta").scrollIntoView({behavior:"instant",block:"start"});');await delay(190);
  const alchemyCapture=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await writeFile(resolve(output,prefix+"-alchemy.png"),Buffer.from(alchemyCapture.data,"base64"));
  await evaluate('document.querySelector("#alchemy-detail").scrollIntoView({behavior:"instant",block:"start"});');await delay(160);
  const potionCapture=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await writeFile(resolve(output,prefix+"-alchemy-detail.png"),Buffer.from(potionCapture.data,"base64"));

  // Mission 06: inspect all three distinct acquisition modes with a real browser.
  const acquisitionCases=[
   [3371,lang==="fr"?"Vendeur précis non vérifié":"Individual vendor unverified"],
   [785,lang==="fr"?"Zones indicatives":"Indicative zones"],
   [730,lang==="fr"?"Butin / source d'obtention":"Loot / acquisition source"],
   [2447,lang==="fr"?"Pacifique fanée":"Wilted Peacebloom"],
   [3820,lang==="fr"?"pousse sous l’eau":"grows underwater"]
  ];
  for(const [id,needle] of acquisitionCases){
   const evidence=await evaluate('(async()=>{const u=new URL(location.href);u.searchParams.set("alchemy","'+id+'");history.pushState(null,"",u);dispatchEvent(new PopStateEvent("popstate"));await new Promise(r=>setTimeout(r,175));const d=document.querySelector("#alchemy-detail"),s=document.querySelector(".alchemy-acquisitions");return {selected:new URLSearchParams(location.search).get("alchemy"),craft:new URLSearchParams(location.search).get("craft"),text:d?.textContent||"",overflow:d.scrollWidth-d.clientWidth,sectionRight:s?.getBoundingClientRect().right,links:[...s.querySelectorAll("a")].map(a=>({href:a.href,rel:a.rel})),focusable:!!d.querySelector(".craft-back")}})()');
   assert(evidence.selected===String(id)&&evidence.craft===String(chain.at(-1)[0])&&
    evidence.text.includes(needle)&&evidence.overflow<=2&&evidence.sectionRight<=width+2&&
    evidence.focusable&&evidence.links.every(a=>a.href.startsWith("https://")&&a.rel.includes("noopener")),
    lang+" "+width+" acquisition "+id+" invalid "+JSON.stringify(evidence));
   if(id!==730)assert(evidence.links.length>0,lang+" "+width+" missing actual source link "+id);
   await evaluate('document.querySelector(".alchemy-acquisitions").scrollIntoView({behavior:"instant",block:"start"});');
   await delay(170);
   const png=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
   await writeFile(resolve(output,prefix+"-acquisition-"+id+".png"),Buffer.from(png.data,"base64"));
  }
  // Exercise direct URL navigation from a fresh page load, not only history/popstate.
  for(const [id,needle] of [[2447,lang==="fr"?"Pacifique fanée":"Wilted Peacebloom"],
                            [3820,lang==="fr"?"pousse sous l’eau":"grows underwater"]]){
   await cmd("Page.navigate",{url:base+path+"?craft="+item+"&alchemy="+id});
   let deep={};
   for(let attempt=0;attempt<50;attempt++){
    deep=await evaluate('(()=>{const e=document.querySelector("#alchemy-detail"),box=document.querySelector(".alchemy-acquisitions");return {open:document.querySelector("#alchemy-beta")?.open,selected:new URLSearchParams(location.search).get("alchemy"),craft:new URLSearchParams(location.search).get("craft"),text:e?.textContent||"",right:box?.getBoundingClientRect().right,overflow:e?e.scrollWidth-e.clientWidth:null}})()');
    if(deep.open&&deep.selected===String(id)&&deep.text.includes(needle))break;
    await delay(120);
   }
   assert(deep.open&&deep.selected===String(id)&&deep.craft===String(item)&&
     deep.text.includes(needle)&&deep.overflow<=2&&deep.right<=width+2,
     lang+" "+width+" direct acquisition link "+id+" failed "+JSON.stringify(deep));
  }
  console.log(JSON.stringify({lang,width,height,selected:item,recipes:state.count,layout,filteredReopen:reopened,map:true,landing,chain:chain.map(x=>x[0]),alchemy:{count:alchemy.count,selected:alchemy.selected,excluded:alchemy.excluded,focus:alchemy.focus},captures:[prefix+"-craft.png",prefix+"-detail.png",prefix+"-sources.png",prefix+"-map.png",prefix+"-alchemy.png",prefix+"-alchemy-detail.png"]}));
 }finally{await send("Target.closeTarget",{targetId:target.targetId}).catch(()=>{})}
}
try{
 await mkdir(output,{recursive:true});
 server=await localServer();
 const send=await connect(await chromeBinary());
 const base="http://127.0.0.1:"+server.address().port;
 for(const lang of ["fr","en"])for(const width of [1440,375]){
  await caseRun(send,base,lang,width,width===375?812:900);
 }
 console.log("PASS: 4 real-browser FR/EN × desktop/mobile runs and 44 screenshot files.");
}catch(err){console.error("FAIL: crafting preview browser smoke:",err);process.exitCode=1}
finally{
 try{socket?.close()}catch{}
 if(chrome&&chrome.exitCode===null){
  await new Promise(done=>{
   let finished=false;
   const settle=()=>{if(!finished){finished=true;done()}};
   chrome.once("close",settle);
   chrome.kill("SIGTERM");
   setTimeout(settle,3500);
  });
 }
 if(server)await new Promise(done=>server.close(done));
 // Chrome may still write its profile after SIGTERM. Cleanup is best effort:
 // a profile-rmdir race must not turn four passing browser checks into a red CI.
 if(profile){
  try{await rm(profile,{recursive:true,force:true,maxRetries:8,retryDelay:250})}
  catch(e){console.warn("Temporary Chrome profile cleanup skipped:",e.code)}
 }
}
