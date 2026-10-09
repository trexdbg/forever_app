/* ForEveroth / Character equipment restrictions (WoW Classic level 60).
 * The BiS planner is not a free-form item catalogue: items must be wearable.
 * Mail for hunters/shamans and plate for warriors/paladins unlock at level 40;
 * the planner currently targets pre-raid level 60.
 */
(()=>{"use strict";
const ARMOR_SLOTS=new Set(["head","shoulders","chest","wrist","hands","waist","legs","feet"]);
const TYPES={cloth:"cloth",tissu:"cloth",leather:"leather",cuir:"leather",mail:"mail",maille:"mail",mailles:"mail",plate:"plate",plates:"plate",plaque:"plate",plaques:"plate"};
const ARMOR_BY_CLASS={
 guerrier:["cloth","leather","mail","plate"],paladin:["cloth","leather","mail","plate"],
 chasseur:["cloth","leather","mail"],chaman:["cloth","leather","mail"],
 voleur:["cloth","leather"],druide:["cloth","leather"],
 pretre:["cloth"],mage:["cloth"],demoniste:["cloth"]
};
const SLOT_LABELS={
 "Tête":"head","Épaules":"shoulders","Torse":"chest","Poignets":"wrist","Mains":"hands",
 "Taille":"waist","Jambes":"legs","Pieds":"feet",
 "Head":"head","Shoulder":"shoulders","Chest":"chest","Wrist":"wrist","Hands":"hands",
 "Waist":"waist","Legs":"legs","Feet":"feet"
};
const normalize=value=>typeof value==="string"?TYPES[value.trim().toLowerCase()]||null:null;
function armorType(item){
 if(!item)return null;
 for(const value of [item.armorType,item.armor_type,item.type,item.type_name,item.subtype]){
  const matched=normalize(value);if(matched)return matched;
 }
 const lines=Array.isArray(item.tooltip)?item.tooltip.slice(0,16):[];
 for(const line of lines){
  if(typeof line!=="string")continue;
  const match=/^(?:Head|Shoulder|Chest|Wrist|Hands|Waist|Legs|Feet|Tête|Épaules?|Torse|Poignets?|Mains?|Taille|Jambes?|Pieds?)\s+(Cloth|Leather|Mail|Plate|Tissu|Cuir|Mailles?|Plaques?)\s*$/i.exec(line.trim());
  if(match)return normalize(match[1]);
  const exact=normalize(line);if(exact)return exact;
 }
 return null;
}
function equipability(item,classId){
 const prof=ARMOR_BY_CLASS[classId];
 if(!prof||!item)return {allowed:false,reason:"invalid"};
 const slot=SLOT_LABELS[item.slot]||item.slot;
 if(ARMOR_SLOTS.has(slot)){
  const material=armorType(item);
  if(!material)return {allowed:false,reason:"unknown_armor"};
  if(!prof.includes(material))return {allowed:false,reason:"armor",material};
 }
 const lines=Array.isArray(item.tooltip)?item.tooltip:[];
 const onlyFor=lines.find(x=>typeof x==="string"&&/^(?:Classes?|Classe)\s*:/i.test(x.trim()));
 const aliases={
  guerrier:["guerrier","warrior"],paladin:["paladin"],chasseur:["chasseur","hunter"],
  voleur:["voleur","rogue"],pretre:["prêtre","pretre","priest"],chaman:["chaman","shaman"],
  mage:["mage"],demoniste:["demoniste","démoniste","warlock"],druide:["druide","druid"]
 };
 if(onlyFor){
  const allowed=onlyFor.split(":").slice(1).join(":").split(/[;,]/).map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(allowed.length&&!allowed.some(x=>aliases[classId].includes(x)))return {allowed:false,reason:"class"};
 }
 // WoW Classic Rogues cannot equip shields, wands or class relics.
 if(classId==="voleur"){
  const header=lines.filter(x=>typeof x==="string").slice(0,8).join(" ").toLowerCase();
  const types=[item.type,item.type_name,item.subtype].filter(x=>typeof x==="string").join(" ").toLowerCase();
  if(/\b(shield|bouclier|wand|baguette|idol|libram|totem|relic|relique)\b/.test(types+" "+header)
      ||/^(?:inv_shield_|inv_wand_)/.test(item.icon||""))
   return {allowed:false,reason:"weapon"};
 }
 return {allowed:true,reason:null};
}
const canEquip=(item,classId)=>equipability(item,classId).allowed;
window.ForeverEquipmentRules={ARMOR_BY_CLASS,armorType,equipability,canEquip};
})();