#!/usr/bin/env node
/* Offline ForEveroth SEO/GEO audit: node scripts/audit-site.mjs [--strict] [--json]. No dependencies/network. */
import {readdirSync,statSync,readFileSync,existsSync} from "node:fs";
import {dirname,join,relative,resolve,sep} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const origin="https://foreveroth.com",errors=[],warnings=[],strict=process.argv.includes("--strict"),json=process.argv.includes("--json");
const issue=(level,code,path,detail)=>{(level==="error"?errors:warnings).push({code,path,detail})};
function allFiles(dir,out=[]){for(const name of readdirSync(dir)){if(name===".git"||name==="node_modules")continue;const full=join(dir,name);const st=statSync(full);if(st.isDirectory())allFiles(full,out);else if(st.isFile())out.push(relative(root,full).split(sep).join("/"))}return out}
const files=allFiles(root),known=new Set(files.map(x=>"/"+x)),html=files.filter(x=>x.endsWith(".html"));
const toFile=url=>decodeURIComponent(url.pathname).replace(/\/$/,"/index.html");
const textOf=s=>s.replace(/<script\b[\s\S]*?<\/script>/gi," ").replace(/<style\b[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&[^;]+;/g," ").replace(/\s+/g," ").trim();
const first=(s,re)=>(s.match(re)||[])[1]||"";
const sitemap=readFileSync(join(root,"sitemap.xml"),"utf8");
const locs=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].trim()),locSet=new Set();
for(const url of locs){if(locSet.has(url))issue("error","DUPLICATE_SITEMAP","sitemap.xml",url);locSet.add(url);
try{const u=new URL(url);if(u.origin!==origin)issue("error","WRONG_SITEMAP_HOST","sitemap.xml",url);else if(!known.has(toFile(u)))issue("error","SITEMAP_TARGET_MISSING","sitemap.xml",url)}
catch{issue("error","INVALID_SITEMAP_URL","sitemap.xml",url)}}
let sources=0,links=0,guides=0;
const titles=new Map();
for(const path of html){
const s=readFileSync(join(root,path),"utf8"),url=origin+"/"+path.replace(/index\.html$/,""),lang=path.startsWith("en/")?"en":"fr";
const redirect=/<meta\b[^>]*name=["']robots["'][^>]*content=["']noindex,follow["']/i.test(s)&&s.includes("location.replace");
if(redirect){
 const can=first(s,/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i);
 try{const target=new URL(can);if(target.origin!==origin||!known.has(toFile(target)))issue("error","BAD_REDIRECT_TARGET",path,can)}
 catch{issue("error","BAD_REDIRECT_TARGET",path,can)}
 if(locSet.has(url))issue("warning","REDIRECT_IN_SITEMAP",path,url);
 continue;
}
const actualLang=first(s,/<html\b[^>]*\blang=["']([^"']+)/i);
if(actualLang!==lang)issue("error","WRONG_LANGUAGE",path,actualLang||"missing");
const canonical=first(s,/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)/i);
if(canonical!==url)issue("error","CANONICAL_MISMATCH",path,canonical||"missing");
const title=first(s,/<title>([^<]+)<\/title>/i);
if(!title)issue("error","TITLE_MISSING",path,"No HTML title");
else{const t=textOf(title).toLowerCase();if(titles.has(t))issue("warning","DUPLICATE_TITLE",path,titles.get(t));else titles.set(t,path)}
if(!/<meta\b[^>]*\bname=["']description["']/i.test(s))issue("error","META_DESCRIPTION_MISSING",path,"Missing");
if(!/<meta\b[^>]*name=["']viewport["'][^>]*content=["'][^"']*width=device-width/i.test(s))
 issue("error","MOBILE_VIEWPORT_MISSING",path,"Mobile viewport meta is absent");
if(!/<main(?:\s|>)/i.test(s))
 issue("warning","MAIN_LANDMARK_MISSING",path,"No main landmark for keyboard/screen-reader navigation");

const h1=(s.match(/<h1(?:\s|>)/gi)||[]).length;if(h1!==1)issue("warning","H1_COUNT",path,String(h1));
const alternate=[...s.matchAll(/<link\b[^>]*\brel=["']alternate["'][^>]*\bhreflang=["']([^"']+)["'][^>]*\bhref=["']([^"']+)/gi)];
if(!alternate.some(m=>m[1]==="fr")||!alternate.some(m=>m[1]==="en"))issue("error","HREFLANG_MISSING",path,"FR/EN alternates missing");
for(const m of alternate){try{const target=new URL(m[2]);if(target.origin!==origin||!known.has(toFile(target)))issue("error","HREFLANG_TARGET_MISSING",path,m[2])}
catch{issue("error","HREFLANG_URL_INVALID",path,m[2])}}
const guide=(path.startsWith("guides/")||path.startsWith("en/guides/"))&&path!=="guides/index.html"&&path!=="en/guides/index.html";
if(guide&&s.includes('class="geo-table"')&&!s.includes('class="geo-table-scroll"'))
 issue("warning","MOBILE_TABLE_OVERFLOW_MISSING",path,"Table is not wrapped in a horizontally scrollable surface");

if(guide){guides++;const content=first(s,/(<main\b[\s\S]*?<\/main>)/i)||s,words=textOf(content).split(/\s+/).length;
if(words<180)issue("warning","THIN_GUIDE",path,String(words)+" words");
let hasArticle=false;for(const m of s.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{
const obj=JSON.parse(m[1]);for(const part of obj["@graph"]||[obj])if(part["@type"]==="Article"){hasArticle=true;if(Array.isArray(part.citation)&&part.citation.length)sources++;else issue("warning","ARTICLE_NO_CITATION",path,"No citation links")}}
catch(e){issue("error","BAD_JSON_LD",path,String(e).slice(0,90))}}
if(!hasArticle)issue("warning","ARTICLE_MISSING",path,"Structured data has no Article");
if(!s.includes("/sources/"))issue("warning","METHODOLOGY_LINK_MISSING",path,"No link to source methodology")}
for(const m of s.matchAll(/(?:href|src)=["']([^"']+)["']/gi)){const v=m[1];if(v.startsWith("#")||/^(?:data:|mailto:|tel:|javascript:)/i.test(v))continue;
try{const target=new URL(v,url);if(target.origin!==origin)continue;links++;if(!known.has(toFile(target)))issue("warning","BROKEN_INTERNAL_LINK",path,v)}
catch{issue("warning","INVALID_LINK",path,v)}}
if(!locSet.has(url))issue("warning","NOT_IN_SITEMAP",path,url)
}
const counts=a=>Object.entries(a.reduce((o,i)=>(o[i.code]=(o[i.code]||0)+1,o),{})).sort((a,b)=>b[1]-a[1]);
const report={stats:{files:files.length,pages:html.length,guides,sitemap:locs.length,linksChecked:links,articlesWithCitations:sources},errorCount:errors.length,warningCount:warnings.length,errorTypes:counts(errors),warningTypes:counts(warnings),errors,warnings};
if(json)console.log(JSON.stringify(report,null,2));
else{console.log("ForEveroth audit",JSON.stringify(report.stats),"errors:",errors.length,"warnings:",warnings.length);console.log("ERROR TYPES",JSON.stringify(report.errorTypes));console.log("WARNING TYPES",JSON.stringify(report.warningTypes));for(const x of [...errors,...warnings.slice(0,35)])console.log(x.code,x.path,x.detail);if(warnings.length>35)console.log("... more warnings in JSON report")}
if(strict&&errors.length)process.exitCode=1;
