import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const pages = [
  {file:'guides/lancement-wow-forever/index.html',lang:'fr',url:'https://foreveroth.com/guides/lancement-wow-forever/',expected:/5 novembre 2026 à 00 h/},
  {file:'en/guides/wow-forever-launch/index.html',lang:'en',url:'https://foreveroth.com/en/guides/wow-forever-launch/',expected:/November 4, 2026 at 3:00 p.m. PST/}
];
for (const page of pages) test('launch page '+page.lang+' states sourced time, valid markup and Classic limitations',()=>{
  const html=readFileSync(new URL('../'+page.file, import.meta.url),'utf8');
  assert.match(html, new RegExp('<html lang="'+page.lang+'"'));
  assert.ok(html.includes('rel="canonical" href="'+page.url+'"'));
  assert.match(html,page.expected);
  assert.match(html, /<strong>WoW Classic<\/strong>/);
  assert.match(html, /<a href="\/[^"]*quetes\//);
  assert.match(html, /<a href="\/[^"]*sources\//);
  assert.match(html, /<script type="application\/ld\+json">/);
  const data=JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);
  const article=data['@graph'].find(x=>x['@type']==='Article');
  assert.equal(article.datePublished,'2026-11-03');
  assert.ok(article.citation.some(x=>x.includes('blizzard')));
});
test('launch pages are discoverable and reciprocally linked',()=>{
  const sitemap=readFileSync(new URL('../sitemap.xml',import.meta.url),'utf8');
  const fr=readFileSync(new URL('../guides/index.html',import.meta.url),'utf8');
  const en=readFileSync(new URL('../en/guides/index.html',import.meta.url),'utf8');
  for (const p of pages){
    assert.ok(sitemap.includes('<loc>'+p.url+'</loc>'));
    assert.ok((p.lang==='fr'?fr:en).includes(p.url.replace('https://foreveroth.com','')));
  }
  for(const p of pages){
    const html=readFileSync(new URL('../'+p.file,import.meta.url),'utf8');
    for (const alt of pages) assert.ok(html.includes('hreflang="'+alt.lang+'" href="'+alt.url+'"'));
  }
});
