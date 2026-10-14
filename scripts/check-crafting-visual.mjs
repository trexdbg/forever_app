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
 for(let i=0;i<100;i++){
  if(chrome.exitCode!==null)throw Error("Chrome process exited");
  try{port=Number((await readFile(resolve(profile,"DevToolsActivePort"),"utf8")).split("\n")[0]);if(port)break}catch{}
  await delay(100);
 }
 assert(port,"Chrome debug port missing");
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
  await evaluate('document.querySelector("#npc-map-canvas").scrollIntoView({behavior:"instant",block:"center"});');await delay(300);
  const mapCapture=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await writeFile(resolve(output,prefix+"-map.png"),Buffer.from(mapCapture.data,"base64"));
  console.log(JSON.stringify({lang,width,height,selected:item,recipes:state.count,layout,filteredReopen:reopened,map:true,landing,captures:[prefix+"-craft.png",prefix+"-detail.png",prefix+"-map.png"]}));
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
 console.log("PASS: 4 real-browser FR/EN × desktop/mobile runs and 12 screenshot files.");
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
