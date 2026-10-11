/* Run manually with: node scripts/check-item-locales.mjs
 * Local quality gate: no scheduled GitHub Actions minutes required.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";
import vm from "node:vm";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const source=readFileSync(resolve(root,"assets/item-locale.js"),"utf8");
function load(lang){
 const ctx={window:{},document:{documentElement:{lang}}};
 vm.runInNewContext(source,ctx,{filename:"assets/item-locale.js"});
 return ctx.window.ForeverItemLocale;
}
const fr=load("fr"),en=load("en");
const sample={id:13404,name:"Mask of the Unforgiven",name_fr:"Masque du non-pardonné",source_status:"classic_reference",origin:"Stratholme · The Unforgiven",url:"https://www.wowhead.com/classic/item=13404"};
assert.equal(fr.name(sample),"Masque du Condamné","French name must come from ID 13404");
assert.equal(en.name(sample),"Mask of the Unforgiven");
assert.equal(fr.origin(sample.origin),"Stratholme · Le Condamné");
assert.equal(en.origin("Stratholme · Le Condamné"),"Stratholme · The Unforgiven");
assert.equal(fr.record(sample).id,13404);
const beta={...sample,source_status:"forever_beta_observed",name_fr:"Nom officiel Forever"};
assert.equal(fr.name(beta),"Nom officiel Forever","Do not overwrite distinct Forever names");
const paths=["data/bis.json","data/items.json","data/items-forever.json","data/items-classic-cache.json","data/items-forever-cache.json","data/bis-niveaux-classic.json","data/bis-niveaux-forever-observed.json"];
let total=0;
for(const path of paths){
 const data=JSON.parse(readFileSync(resolve(root,path),"utf8"));
 for(const item of data.items||[]){
  assert.ok(Number.isSafeInteger(item.id)&&item.id>0,path+": missing numeric item ID");
  for(const key of ["url","source_url"]){
   if(typeof item[key]!=="string")continue;
   const match=/(?:item[=/]|item:)(\d{3,})\b/.exec(item[key]);
   if(match)assert.equal(Number(match[1]),item.id,path+": URL mismatch for item "+item.id);
  }
  total++;
 }
}
console.log("Item locale / references: OK ("+total+" catalogued entries, FR+EN, ID 13404).");
