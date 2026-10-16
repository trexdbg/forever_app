#!/usr/bin/env node
/* Issue #51: PR-only local Chromium/CDP smoke for trainer waypoint display in FR/EN.
 * No remote website, no upload to a third-party service and no website deploy.
 */
import {createServer} from "node:http";
import {readFile,access,mkdtemp,rm,writeFile,mkdir} from "node:fs/promises";
import {resolve,dirname,extname,sep} from "node:path";
import {fileURLToPath} from "node:url";
import {spawn} from "node:child_process";
import {tmpdir} from "node:os";
import {setTimeout as delay} from "node:timers/promises";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const output=resolve(root,"artifacts/trainer-locations");
const mime={".html":"text/html; charset=utf-8",".json":"application/json",".css":"text/css",".js":"text/javascript",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".svg":"image/svg+xml"};
const assert=(x,msg)=>{if(!x)throw Error(msg)};
let chrome,server,socket,profile;
const chromeBinary=async()=>{
 for(const f of [process.env.CHROME_BIN,"/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium"].filter(Boolean))
   try{await access(f);return f}catch{}
 throw Error("Chrome unavailable");
};
async function startServer(){
 const http=createServer(async(req,res)=>{
   try{
    const p=decodeURIComponent(new URL(req.url,"http://localhost").pathname).replace(/\/$/,"/index.html");
    const full=resolve(root,"."+p);
    if(!full.startsWith(root+sep)){res.writeHead(403).end();return}
    const content=await readFile(full);
    res.writeHead(200,{"Content-Type":mime[extname(full)]||"application/octet-stream","Cache-Control":"no-store"});
    res.end(content);
   }catch{res.writeHead(404).end("Missing file")}
 });
 await new Promise((ok,bad)=>{http.once("error",bad);http.listen(0,"127.0.0.1",ok)});
 return http;
}
async function connect(){
 profile=await mkdtemp(resolve(tmpdir(),"foreveroth-trainers-"));
 chrome=spawn(await chromeBinary(),["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
  "--remote-allow-origins=*","--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"],{stdio:"ignore"});
 let port=0;
 for(let i=0;i<250;i++){
  if(chrome.exitCode!==null)throw Error("Chrome exited");
  try{port=Number((await readFile(resolve(profile,"DevToolsActivePort"),"utf8")).split("\n")[0]);if(port)break}catch{}
  await delay(100);
 }
 assert(port,"Chrome remote debugger unavailable");
 const version=await (await fetch("http://127.0.0.1:"+port+"/json/version")).json();
 socket=new WebSocket(version.webSocketDebuggerUrl);
 await new Promise((ok,bad)=>{socket.addEventListener("open",ok,{once:true});socket.addEventListener("error",bad,{once:true})});
 let i=0;const waiting=new Map();
 socket.addEventListener("message",event=>{
  let msg;try{msg=JSON.parse(event.data)}catch{return}
  if(!msg.id||!waiting.has(msg.id))return;
  const w=waiting.get(msg.id);waiting.delete(msg.id);
  msg.error?w.bad(Error(JSON.stringify(msg.error))):w.ok(msg.result);
 });
 return (method,params={},sessionId)=>new Promise((ok,bad)=>{
   const id=++i;waiting.set(id,{ok,bad});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));
   setTimeout(()=>{if(waiting.has(id)){waiting.delete(id);bad(Error("CDP timeout "+method))}},15000).unref();
 });
}
async function scenario(send,base,lang,width){
 const target=await send("Target.createTarget",{url:"about:blank"});
 const {sessionId}=await send("Target.attachToTarget",{targetId:target.targetId,flatten:true});
 const cmd=(method,params={})=>send(method,params,sessionId);
 const evaluate=async expression=>{
  const r=await cmd("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error("Browser script error "+JSON.stringify(r.exceptionDetails));
  return r.result?.value;
 };
 try{
  await cmd("Page.enable");await cmd("Runtime.enable");
  await cmd("Emulation.setDeviceMetricsOverride",{width,height:width===375?812:900,deviceScaleFactor:1,mobile:width===375});
  await cmd("Page.navigate",{url:base+(lang==="fr"?"/metiers/":"/en/metiers/")+"?q=Jandi"});
  let state={};
  for(let i=0;i<100;i++){
   state=await evaluate('(()=>{const c=document.querySelector(".npc-trainer-detail-xy"),d=document.querySelector("#npc-detail"),s=d?.querySelector(".npc-source a");return {name:d?.textContent||"",coords:c?.textContent||"",source:s?.href||"",pointText:d?.querySelector(".npc-datacaveat")?.textContent||"",pins:document.querySelector("#npc-map-canvas")?.getContext("2d")!=null,mapCopy:!!document.querySelector("#npc-map-copy-way"),right:d?.getBoundingClientRect().right,scrollWidth:document.documentElement?.scrollWidth||0,width:innerWidth}})()');
   if(state.name.includes("Jandi")&&state.coords&&(state.source||"").includes("herbalism"))break;
   await delay(150);
  }
  assert(state.name.includes("Jandi")&&state.coords.includes(lang==="fr"?"55,6":"55.6")&&state.coords.includes(lang==="fr"?"39,6":"39.6"),
    lang+"/"+width+": missing named waypoint "+JSON.stringify(state));
  assert(state.source==="https://www.wowhead.com/forever/guide/professions/herbalism/overview-leveling",
    lang+"/"+width+": incorrect waypoint citation "+JSON.stringify(state));
  assert(state.pointText.includes(lang==="fr"?"non confirmé en jeu":"not verified in-game"),
    lang+"/"+width+": false certainty "+JSON.stringify(state));
  assert(state.pins&&state.mapCopy&&state.right<=width+2&&state.scrollWidth<=width+2,
    lang+"/"+width+": mobile/desktop map or page overflow "+JSON.stringify(state));
  await evaluate('document.querySelector("#npc-detail").scrollIntoView({behavior:"instant",block:"start"})');
  await delay(150);
  const shot=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await writeFile(resolve(output,lang+"-"+width+"-jandi.png"),Buffer.from(shot.data,"base64"));
  // Existing Zephras guide waypoint is not overwritten or falsely promoted to gameplay.
  await cmd("Page.navigate",{url:base+(lang==="fr"?"/metiers/":"/en/metiers/")+"?q=Nyassa%20Swiftdraught"});
  let zephras={};
  for(let i=0;i<85;i++){
   zephras=await evaluate('(()=>{const d=document.querySelector("#npc-detail");return {text:d?.textContent||"",source:d?.querySelector(".npc-source a")?.href||"",caveat:d?.querySelector(".npc-datacaveat")?.textContent||""}})()');
   if(zephras.text.includes("Nyassa")&&zephras.caveat)break;
   await delay(150);
  }
  assert(zephras.text.includes("Nyassa")&&zephras.source.includes("zephras-isle-zone-overview")&&
     zephras.caveat.includes(lang==="fr"?"non confirmée en jeu":"not verified in-game")&&
     zephras.caveat.includes(lang==="fr"?"preuve individuelle":"individual proof"),
     lang+"/"+width+": Zephras regression "+JSON.stringify(zephras));
  console.log("PASS trainer waypoint Chromium",lang,width,"Jandi source and caution, Zephras preserved");
 }finally{await send("Target.closeTarget",{targetId:target.targetId}).catch(()=>{})}
}
try{
 await mkdir(output,{recursive:true});
 server=await startServer();
 const send=await connect(),base="http://127.0.0.1:"+server.address().port;
 for(const lang of ["fr","en"])for(const width of [1440,375])await scenario(send,base,lang,width);
 console.log("PASS four real-browser FR/EN desktop/mobile trainer runs");
}catch(err){console.error("FAIL trainer Chromium visual checks:",err);process.exitCode=1}
finally{
 try{socket?.close()}catch{}
 if(chrome&&chrome.exitCode===null){
  await new Promise(done=>{let settled=false;const finish=()=>{if(!settled){settled=true;done()}};chrome.once("close",finish);
   chrome.kill("SIGTERM");setTimeout(finish,3500)});
 }
 if(server)await new Promise(ok=>server.close(ok));
 if(profile)try{await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:150})}catch{}
}
