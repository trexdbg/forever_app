import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {resolve,dirname,join} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(join(root,p),"utf8");
const db=JSON.parse(read("data/dungeons-forever.json"));
const source=id=>"https://wowsrc.com/loot/"+id+"/";
const site="https://foreveroth.com";
const esc=s=>String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
const decode=s=>s.replaceAll("&amp;","&").replaceAll("&quot;",'"').replaceAll("&#39;","'");
const tables=[
 {id:"city-of-dalaran",fr:"guides/cite-dalaran-boss-loot/",en:"en/guides/city-of-dalaran-boss-loot/",doc:18,unverified:8},
 {id:"ruins-of-lordaeron",fr:"guides/ruines-lordaeron-boss-loot/",en:"en/guides/ruins-of-lordaeron-boss-loot/",doc:15,unverified:7},
 {id:"hall-of-thanes",fr:"guides/salle-des-thanes-boss-loot/",en:"en/guides/hall-of-thanes-boss-loot/",doc:12,unverified:0},
 {id:"excavation-site-wetlands",fr:"guides/excavations-paluns-boss-loot/",en:"en/guides/wetlands-excavation-boss-loot/",doc:9,unverified:2}
];
const checkedBoss=[
 {n:0,fr:"guides/boss-forever-city-of-dalaran-atrexis-the-grave-knight/",en:"en/guides/forever-boss-city-of-dalaran-atrexis-the-grave-knight/"},
 {n:1,fr:"guides/boss-forever-city-of-dalaran-lyn-the-unheeded/",en:"en/guides/forever-boss-city-of-dalaran-lyn-the-unheeded/"},
 {n:2,fr:"guides/boss-forever-city-of-dalaran-arcane-anomaly/",en:"en/guides/forever-boss-city-of-dalaran-arcane-anomaly/"},
 {n:7,fr:"guides/boss-forever-city-of-dalaran-archmage-s-shade/",en:"en/guides/forever-boss-city-of-dalaran-archmage-s-shade/"}
];

function checkSeo(html,{lang,path,fr,en}){
 const desc=decode(html.match(/<meta name="description" content="([^"]+)">/)?.[1]||"");
 assert.ok(desc.length>=90&&desc.length<=185,path+" SEO description");
 assert.match(desc,/Forever/,path+" identity");
 assert.ok(html.includes('<html lang="'+lang+'"'),path+" lang");
 assert.ok(html.includes('rel="canonical" href="'+site+"/"+path+'"'),path+" canonical");
 for(const [lc,counterpart] of [["fr",fr],["en",en]])
  assert.ok(html.includes('hreflang="'+lc+'" href="'+site+"/"+counterpart+'"'),path+" missing reciprocal hreflang "+lc);
 const json=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]||"null");
 const graph=json["@graph"]||[json];
 const article=graph.find(x=>x["@type"]==="Article");
 assert.ok(article,path+" article structured data");
 assert.equal(decode(article.description),desc,path+" JSON-LD description mismatch");
 const updated=path.includes("archmage-s-shade")||path.includes("city-of-dalaran-boss-loot")||path.includes("cite-dalaran-boss-loot");
 const expectedDate=updated?"2026-10-22":"2026-10-16";
 assert.equal(article.dateModified,expectedDate,path+" editorial recency");
 assert.equal(article.inLanguage,lang,path+" schema language");
 const web=graph.find(x=>x["@type"]==="WebPage");
 if(web)assert.equal(decode(web.description),desc,path+" WebPage description mismatch");
 assert.ok(html.includes(lang==="fr"?(updated?"22 octobre 2026":"16 octobre 2026"):(updated?"22 October 2026":"16 October 2026")),path+" review date");
 return desc;
}

test("eight bilingual dungeon hubs disclose each individual boss-item status and provide real navigation",()=>{
 let totalRows=0;
 for(const spec of tables){
  const dungeon=db.dungeons.find(x=>x.id===spec.id);
  assert.ok(dungeon,spec.id);
  assert.equal(dungeon.bosses.flatMap(b=>b.loot).filter(x=>x.evidence_level==="documented_forever").length,spec.doc);
  assert.equal(dungeon.bosses.flatMap(b=>b.loot).filter(x=>x.evidence_level==="unverified").length,spec.unverified);
  for(const lang of ["fr","en"]){
   const path=spec[lang],html=read(path+"index.html");
   checkSeo(html,{lang,path,fr:spec.fr,en:spec.en});
   const src=source(spec.id);
   assert.ok(html.includes(src),path+" exact dungeon-specific source");
   assert.ok(html.includes("geo-loot-summary"),path+" coverage summary");
   assert.ok(html.includes("geo-loot-evidence"),path+" per-boss notes");
   assert.ok(html.includes(spec.doc+" / "+(spec.doc+spec.unverified)),path+" overall documented coverage");
   const tbody=html.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1];
   assert.ok(tbody,path+" missing table");
   const rows=[...tbody.matchAll(/<tr><th scope="row">([\s\S]*?)<\/th><td>([\s\S]*?)<\/td><\/tr>/g)];
   assert.equal(rows.length,dungeon.bosses.length,path+" every boss visible");
   totalRows+=rows.length;
   for(const [i,boss] of dungeon.bosses.entries()){
    const row=rows[i][0],doc=boss.loot.filter(x=>x.evidence_level==="documented_forever").length;
    const pending=boss.loot.filter(x=>x.evidence_level==="unverified");
    assert.ok(row.includes(doc+" / "+boss.loot.length),path+" boss documentary count "+boss.name.en);
    assert.ok(row.includes("/"+(lang==="en"?"en/":"")+"donjons/?donjon="+spec.id+"&amp;boss="+(i+1)),
       path+" working boss deep link "+boss.name.en);
    if(pending.length){
     assert.ok(row.includes(lang==="fr"?"Attributions à vérifier":"Unverified boss drops"),path+" unresolved warning "+boss.name.en);
     for(const item of pending)assert.ok(row.includes(esc(lang==="fr"?item.fr:item.en)),path+" unresolved item listed: "+item.en);
    }else assert.ok(!row.includes("Attributions à vérifier :")&&!row.includes("Unverified boss drops:"),path+" false warning "+boss.name.en);
    if(!boss.loot.length)assert.ok(row.includes(lang==="fr"?"sans preuve d’absence":"does not establish that no loot exists"));
   }
   assert.ok(html.includes(lang==="fr"?"/donjons/":"/en/donjons/"),path+" dungeon tool link");
   for(const href of [...html.matchAll(/href="(\/(?:en\/)?guides\/[^"?#]+\/)(?:[?#][^"]*)?"/g)].map(x=>x[1]))
    assert.ok(existsSync(join(root,href.slice(1),"index.html")),path+" internal related guide 404 "+href);
  }
 }
 assert.equal(totalRows,46,"all 23 boss rows in both locales remain present");
});

test("four indexed Dalaran boss topics are consistent with the repaired source audit in both languages",()=>{
 const dungeon=db.dungeons.find(x=>x.id==="city-of-dalaran");
 for(const spec of checkedBoss){
  const boss=dungeon.bosses[spec.n],doc=boss.loot.filter(x=>x.evidence_level==="documented_forever").length;
  const pending=boss.loot.filter(x=>x.evidence_level==="unverified");
  for(const lang of ["fr","en"]){
   const path=spec[lang],html=read(path+"index.html");
   const meta=checkSeo(html,{lang,path,fr:spec.fr,en:spec.en});
   assert.ok(meta.includes(doc+" "),path+" documentary count in search snippet");
   assert.ok(meta.includes(pending.length+" "),path+" uncertain count in search snippet");
   assert.ok(html.includes("https://wowsrc.com/loot/city-of-dalaran/"),path+" direct reference");
   assert.ok(html.includes(lang==="fr"?"État de vérification des butins":"Boss-loot evidence checked"),path+" visible provenance section");
   assert.ok(html.includes(doc+" / "+boss.loot.length),path+" precise source coverage");
   assert.ok(html.includes("/"+(lang==="en"?"en/":"")+"donjons/?donjon=city-of-dalaran&amp;boss="+(spec.n+1)),path+" evidence deep link");
   assert.ok(html.includes(lang==="fr"?"/guides/cite-dalaran-boss-loot/":"/en/guides/city-of-dalaran-boss-loot/"),path+" hub navigation");
   for(const x of pending)assert.ok(html.includes(esc(lang==="fr"?x.fr:x.en)),path+" missing unverified item "+x.en);
  }
 }
});

test("editorial changes do not enable Forever quests or destroy Classic quest guides",()=>{
 for(const path of ["quetes/index.html","en/quetes/index.html"]){
  const html=read(path);assert.ok(html.length>1000);
 }
 assert.equal(db.dungeons.find(x=>x.id==="city-of-dalaran").bosses.length,8);
 assert.equal(db.dungeons.find(x=>x.id==="hall-of-thanes").bosses.length,4);
});
