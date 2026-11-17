import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const pages=[
 {path:'guides/lancement-wow-forever/index.html',lang:'fr',url:'https://foreveroth.com/guides/lancement-wow-forever/',link:'/guides/lancement-wow-forever/'},
 {path:'en/guides/wow-forever-launch/index.html',lang:'en',url:'https://foreveroth.com/en/guides/wow-forever-launch/',link:'/en/guides/wow-forever-launch/'}
];
for(const p of pages)test('post-launch getting-started guide '+p.lang+' is actionable and source-scoped',()=>{
 const html=read(p.path);
 assert.match(html,new RegExp('<html lang="'+p.lang+'"'));
 assert.ok(html.includes('rel="canonical" href="'+p.url+'"'));
 for(const alt of pages)assert.ok(html.includes('hreflang="'+alt.lang+'" href="'+alt.url+'"'));
 assert.match(html,/2026-11-17|17 novembre 2026|17 November 2026/);
 assert.match(html,/<strong>WoW Classic(?: routes)?<\/strong>/);
 for(const section of ["talents","metiers","donjons","rare","sources"]){
  assert.ok(html.includes('/'+(p.lang==='en'?'en/':'')+section+'/'),section);
 }
 assert.ok(html.includes('/'+(p.lang==='en'?'en/':'')+'talents/heritage/'));
 assert.match(html,/Blizzard/);
 assert.doesNotMatch(html,/Prepared before launch|préparé avant l’ouverture|Par où commencer le jour du lancement/);
 const json=JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);
 const article=json['@graph'].find(x=>x['@type']==='Article');
 assert.equal(article.datePublished,'2026-11-03');
 assert.equal(article.dateModified,'2026-11-17');
 assert.ok(article.citation.some(x=>x.includes('blizzard')));
 assert.equal(article.mainEntityOfPage['@id'],p.url+'#webpage');
});
test('pages are discoverable from guide library and sitemap with reciprocal alternates',()=>{
 const sitemap=read('sitemap.xml');
 for(const p of pages){
  assert.ok(sitemap.includes('<loc>'+p.url+'</loc>'));
  const index=read((p.lang==='en'?'en/':'')+'guides/index.html');
  assert.ok(index.includes('href="'+p.link+'"'));
  assert.equal(sitemap.split('<loc>'+p.url+'</loc>').length-1,1);
 }
 for(const other of pages)assert.ok(sitemap.includes('hreflang="'+other.lang+'" href="'+other.url+'"'));
});
