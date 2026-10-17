#!/usr/bin/env node
/* Local Chromium/CDP trainer-atlas smoke tests for the public FR/EN routes.
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
 const path=lang==="fr"?"/metiers/":"/en/metiers/";
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
  await cmd("Page.navigate",{url:base+path});
  let state={};
  for(let i=0;i<100;i++){
   state=await evaluate('(()=>({results:document.querySelector("#npc-results")?.children.length||0,map:!!document.querySelector("#npc-map-canvas")?.getContext("2d"),title:document.querySelector("main h1")?.textContent||""}))()');
   if(state.results>0&&state.map&&state.title)break;
   await delay(160);
  }
  assert(state.results>0&&state.map,lang+" "+width+" trainer list or interactive map not loaded "+JSON.stringify(state));
  assert(state.title.includes(lang==="fr"?"Maîtres de métiers":"Profession trainers"),lang+" "+width+" heading absent");
  const layout=await evaluate('(()=>{const main=document.querySelector("main"),panel=document.querySelector("#prof-trainers"),map=document.querySelector("#npc-map-canvas"),input=document.querySelector("#npc-search");const top=panel.getBoundingClientRect().top;input.focus();return {first:main.firstElementChild===panel,sections:main.querySelectorAll(":scope > section").length,legacy:[".page-hero","#craft-beta","#alchemy-beta","#early-recipes","#early-recipe-section","#alchemy-beta-section","#craft-beta-section"].some(x=>!!main.querySelector(x)),right:panel.getBoundingClientRect().right,windowWidth:innerWidth,top,focus:document.activeElement===input,canvasFocus:map.tabIndex===0,context:!!map.getContext("2d")}})()');
  assert(layout.first&&layout.sections===1&&!layout.legacy,lang+" "+width+" page contains retired sections "+JSON.stringify(layout));
  assert(layout.right<=layout.windowWidth+2&&layout.focus&&layout.canvasFocus&&layout.context,lang+" "+width+" trainer page layout or accessibility failed "+JSON.stringify(layout));
  if(width===375)assert(layout.top>=0&&layout.top<260,lang+" mobile atlas starts too low "+layout.top);
  const prefix=lang+"-"+width;
  const capture=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await writeFile(resolve(output,prefix+"-trainers.png"),Buffer.from(capture.data,"base64"));
  const type=await evaluate('(()=>{const field=document.querySelector("#npc-type");field.value="weapon";field.dispatchEvent(new Event("change",{bubbles:true}));return field.value})()');
  assert(type==="weapon",lang+" "+width+" weapon masters filter is not usable");
  let weapon={};
  for(let i=0;i<40;i++){
   weapon=await evaluate('(()=>({results:document.querySelector("#npc-results")?.children.length||0,selected:document.querySelector("#npc-type")?.value,canvas:!!document.querySelector("#npc-map-canvas")}))()');
   if(weapon.results>0&&weapon.selected==="weapon")break;
   await delay(120);
  }
  assert(weapon.results>0&&weapon.canvas,lang+" "+width+" weapon masters did not render "+JSON.stringify(weapon));
  await evaluate('document.querySelector("#npc-map-canvas").scrollIntoView({behavior:"instant",block:"center"})');await delay(200);
  const mapScreenshot=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await writeFile(resolve(output,prefix+"-weapons-map.png"),Buffer.from(mapScreenshot.data,"base64"));
  console.log(JSON.stringify({lang,width,height,trainers:state.results,weaponResults:weapon.results,map:true,layout,captures:[prefix+"-trainers.png",prefix+"-weapons-map.png"]}));
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
 console.log("PASS: 4 real-browser FR/EN × desktop/mobile trainer-atlas runs and 8 screenshots.");
}catch(err){console.error("FAIL: trainer atlas browser smoke:",err);process.exitCode=1}
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
