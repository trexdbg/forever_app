#!/usr/bin/env node
/* One-shot, offline GEO metadata normalizer. Never generates claims or invents external sources. */
import {readdirSync,readFileSync,writeFileSync,statSync,existsSync} from "node:fs";
import {join,relative,dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const base="https://foreveroth.com";
function paths(dir,out=[]){for(const x of readdirSync(dir)){const p=join(dir,x);if(statSync(p).isDirectory())paths(p,out);else if(x==="index.html")out.push(p)}return out}
const available=new Set();function walk(d){for(const x of readdirSync(d)){if(x===".git")continue;const p=join(d,x);if(statSync(p).isDirectory())walk(p);else available.add(relative(root,p).replace(/\\/g,"/"))}}walk(root);
const allowedExternal=/^(?:www\.)?(?:wowhead\.com|foreverchanges\.pro|wowforevertalents\.com|talentsforever\.com|warcrafttavern\.com|warcraftforever\.games|us\.forums\.blizzard\.com|github\.com)$/i;
function citationsOf(html,path){
  const sections=[...html.matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/gi)].map(x=>x[0]);
  const sourceSections=sections.filter(s=>/<h[23][^>]*>[^<]*(?:sources?|références|references|provenance|verification|vérification)/i.test(s));
  const corpus=sourceSections.length?sourceSections.join("\n"):html.match(/<main\b[\s\S]*?<\/main>/i)?.[0]||"";
  const found=[];
  for(const m of corpus.matchAll(/href=["']([^"']+)["']/gi)){
    const raw=m[1];try{const u=new URL(raw,base);
      if(u.origin===base){
        if(!u.pathname.startsWith("/data/")||!u.pathname.endsWith(".json")||!available.has(u.pathname.slice(1)))continue;
        // Cite the human-readable methodology page rather than an exposed dataset.
        found.push(base+(path.startsWith("en/")?"/en/sources/":"/sources/"));
        continue;
      }
      if(!allowedExternal.test(u.hostname)||u.pathname.endsWith(".json"))continue;
      found.push(u.href);
    }catch{}
  }
  if(!found.length){
    const guesses=[
      [/minage|mining|ore|thorium/i,"data/mining-points.json"],
      [/rare|rares/i,"data/rares.json"],
      [/pnj|vendor|marchand|trainer|master|maitre/i,"data/npcs.json"],
      [/profession|m[eé]tier|alchemy|cuisine|cooking|alchimie|first-aid|secourisme/i,"data/professions.json"],
      [/dungeon|donjon|boss/i,"data/dungeons-forever.json"],
      [/talent/i,"data/talents.json"]
    ];
    for(const [pattern,filepath] of guesses)if(pattern.test(path)&&available.has(filepath)){found.push(base+(path.startsWith("en/")?"/en/sources/":"/sources/"));break}
  }
  return [...new Set(found)].slice(0,12);
}
let scanned=0,addedCitation=0,addedMethodology=0,withoutSource=[];
for(const file of [...paths(join(root,"guides")),...paths(join(root,"en","guides"))]){
  const path=relative(root,file).replace(/\\/g,"/");
  if(path==="guides/index.html"||path==="en/guides/index.html")continue;
  let html=readFileSync(file,"utf8"),original=html;
  scanned++;
  const re=/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i;
  const match=html.match(re);
  if(match){try{const object=JSON.parse(match[1]);const article=(object["@graph"]||[object]).find(x=>x["@type"]==="Article");
    if(article&&(!Array.isArray(article.citation)||!article.citation.length)){
      const cites=citationsOf(html,path);
      if(cites.length){article.citation=cites;html=html.replace(match[1],JSON.stringify(object));addedCitation++}
      else withoutSource.push(path);
    }
  }catch{}}
  const en=path.startsWith("en/");
  if(!html.includes(en?"/en/sources/":"/sources/")){
    const nav=/(<nav class=["']geo-related["'][^>]*>[\s\S]*?)(<\/nav>)/i;
    if(nav.test(html)){html=html.replace(nav,(_,inside,end)=>inside+'<a href="'+(en?'/en/sources/':'/sources/')+'">'+(en?'Sources & reliability ↗':'Sources et fiabilité ↗')+'</a>'+end);addedMethodology++}
    else withoutSource.push(path+": no related navigation");
  }
  if(html!==original)writeFileSync(file,html,"utf8");
}
console.log(JSON.stringify({scanned,addedCitation,addedMethodology,unresolved:withoutSource},null,2));
