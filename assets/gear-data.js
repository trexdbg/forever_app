/* Forever Atlas equipment sources.
   Forever records: first-party local verified-by-reference snapshots of Wowhead beta item pages.
   Classic browsing: explicit WoWDB Classic 1.12 API, NOT Wow Forever stats. */
(()=>{"use strict";
const API="https://api.wowdb.assemblee-defias.fr/v1/classic/items";
const BASE="/";
const SLOT_CODES={
 head:"head",neck:"neck",shoulders:"shoulder",back:"back",chest:"chest",wrist:"wrist",
 hands:"hands",waist:"waist",legs:"legs",feet:"feet",finger1:"finger",finger2:"finger",
 trinket1:"trinket",trinket2:"trinket",mainhand:"one_hand,main_hand,two_hand",
 offhand:"one_hand,off_hand,held_in_off_hand",ranged:"ranged,thrown,relic"
};
const LABELS={
 "Tête":"head","Cou":"neck","Épaules":"shoulders","Dos":"back","Torse":"chest",
 "Poignets":"wrist","Mains":"hands","Taille":"waist","Jambes":"legs","Pieds":"feet",
 "Anneau 1":"finger1","Anneau 2":"finger2","Bijou 1":"trinket1","Bijou 2":"trinket2",
 "Main droite":"mainhand","Main gauche":"offhand","Distance / relique":"ranged",
 "Head":"head","Neck":"neck","Shoulders":"shoulders","Back":"back","Chest":"chest",
 "Wrists":"wrist","Hands":"hands","Waist":"waist","Legs":"legs","Feet":"feet",
 "Finger":"finger1","Ring":"finger1","Trinket":"trinket1",
 "Main hand":"mainhand","Off hand":"offhand","Ranged":"ranged"
};
const ALL_SLOTS=[...new Set(Object.values(SLOT_CODES))].join(",");
let foreverPromise;
function valid(row){return row&&Number.isInteger(row.id)&&row.id>0&&typeof row.name==="string"&&row.name.trim().length>0}
function compatible(itemSlot,chosen){
 const base=LABELS[itemSlot]||itemSlot;
 return base===chosen||(base==="finger1"&&chosen==="finger2")||(base==="finger2"&&chosen==="finger1")||(base==="trinket1"&&chosen==="trinket2")||(base==="trinket2"&&chosen==="trinket1");
}
function iconFromUrl(url){try{const u=new URL(url);if(u.hostname!=="wowdb.assemblee-defias.fr")return null;return u.pathname.split("/").pop().replace(/\.(webp|jpg|jpeg|png)$/i,"")}catch{return null}}
function normalizedClassic(i,slot){
 if(!valid(i)||i.internal===true||!i.slot)return null;
 let appSlot=slot&&slot!=="all"?slot:null;
 if(!appSlot){const codes=i.slot;
 if(codes==="finger")appSlot="finger1";
 else if(codes==="trinket")appSlot="trinket1";
 else if(["one_hand","main_hand","two_hand"].includes(codes))appSlot="mainhand";
 else if(["off_hand","held_in_off_hand"].includes(codes))appSlot="offhand";
 else if(["ranged","thrown","relic"].includes(codes))appSlot="ranged";
 else if(codes==="shoulder")appSlot="shoulders";
 else if(["head","neck","back","chest","wrist","hands","waist","legs","feet"].includes(codes))appSlot=codes;
 }
 if(!appSlot||!SLOT_CODES[appSlot])return null;
 const url=(typeof i.url==="string"&&i.url.startsWith("https://wowdb.assemblee-defias.fr/"))?i.url:"https://wowdb.assemblee-defias.fr/?id=classic:item:"+i.id;
 return {id:i.id,name:i.name,slot:appSlot,slot_name:i.slot_name||null,icon:typeof i.icon==="string"&&i.icon.startsWith("https://wowdb.assemblee-defias.fr/database-icons/")?i.icon:iconFromUrl(i.icon)||null,iconUrl:typeof i.icon==="string"?i.icon:null,origin:"WoWDB · Classic 1.12",quality:i.quality||"common",url,reference:"Classic 1.12",source_status:"classic_api",verified_forever:false,itemLevel:i.item_level??null,requiredLevel:i.required_level??null,tooltip:Array.isArray(i.tooltip)?i.tooltip.filter(s=>typeof s==="string").slice(0,44):[]};
}
function loadForever(){
 if(!foreverPromise)foreverPromise=Promise.all([
 fetch(BASE+"data/items-forever.json",{credentials:"omit"}).then(r=>{if(!r.ok)throw Error("Forever HTTP "+r.status);return r.json()}).catch(()=>({items:[]})),
 fetch(BASE+"data/items-forever-client.json",{credentials:"omit"}).then(r=>{if(!r.ok)throw Error("Forever client HTTP "+r.status);return r.json()}).catch(()=>({items:[]}))
 ]).then(([manual,client])=>{const merged=new Map();for(const i of [...(Array.isArray(client.items)?client.items:[]),...(Array.isArray(manual.items)?manual.items:[])])if(valid(i))merged.set(i.id,{...i,reference:i.reference||"Forever beta client",source_status:i.source_status||"forever_beta_client",verified_forever:false});return [...merged.values()]});
 return foreverPromise;
}
async function loadClassic({slot="all",query="",qualities=[],cursor=null,signal=null,limit=100}={}){
 const params=new URLSearchParams();
 params.set("slot",SLOT_CODES[slot]||ALL_SLOTS);
 params.set("limit",String(Math.max(1,Math.min(100,limit))));
 params.set("max_level","60");
 params.set("sort","-item_level");
 params.set("include_total","true");
 if(query&&query.trim())params.set("q",query.trim());
 if(Array.isArray(qualities)&&qualities.length)params.set("quality",qualities.join(","));
 if(cursor)params.set("cursor",cursor);
 const r=await fetch(API+"?"+params.toString(),{mode:"cors",credentials:"omit",signal:signal||undefined});
 if(!r.ok)throw Error("WoWDB HTTP "+r.status);
 const json=await r.json();
 if(json.object!=="list"||!Array.isArray(json.data))throw Error("Invalid Classic item response");
 const rows=json.data.map(i=>normalizedClassic(i,slot)).filter(Boolean);
 return {items:rows,cursor:typeof json.next_cursor==="string"?json.next_cursor:null,hasMore:!!json.has_more,count:Number.isInteger(json.total_count)?json.total_count:null};
}
async function itemById(id,signal){
 if(!Number.isInteger(id)||id<1)return null;
 const r=await fetch(API+"/"+id,{mode:"cors",credentials:"omit",signal:signal||undefined});
 if(!r.ok)throw Error("Classic item HTTP "+r.status);
 const j=await r.json();
 return normalizedClassic(j,"all");
}
window.ForeverGearData={SLOT_CODES,LABELS,compatible,loadForever,loadClassic,itemById,iconFromUrl};
})();