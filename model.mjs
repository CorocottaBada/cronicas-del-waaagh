export const troopClasses=['Infantería','Caballería','Carro','Máquina de guerra','Monstruo','Personaje'];
export const greenskins=['Goblin','Goblin nocturno','Goblin silvano','Orco','Orco salvaje','Orco negro','Agregado'];
export const results=['Victoria aplastante','Victoria','Empate','Derrota','Derrota aplastante'];
export const states=['Completo','Imprimado','Montado','Desmontado'];
export const resultLabel=r=>({'Masacre':'Victoria aplastante','Descalabro':'Derrota aplastante'}[r]||r);
export function stats(data,id){
 const battles=data.battles.filter(b=>!id||b.roster.some(r=>r.unitId===id));
 const counts=Object.fromEntries(results.map(r=>[r,battles.filter(b=>resultLabel(b.result)===r).length]));
 const mvp=battles.filter(b=>id?b.mvpUnitId===id:!!b.mvpUnitId).length;
 const points=data.scoring?battles.reduce((sum,b)=>sum+data.scoring[resultLabel(b.result)]+((id?b.mvpUnitId===id:!!b.mvpUnitId)?data.scoring.MVP:0),0):null;
 return {total:battles.length,wins:counts.Victoria+counts['Victoria aplastante'],draws:counts.Empate,losses:counts.Derrota+counts['Derrota aplastante'],counts,mvp,points};
}
export function validate(d){
 if(d?.schema!==1||!Array.isArray(d.units)||!Array.isArray(d.battles))throw Error('Formato de archivo incorrecto.');
 const ids=new Set();const text=(v,max=20000)=>typeof v==='string'&&v.length<=max;
 for(const u of d.units){if(!text(u.id,100)||!u.id||ids.has(u.id)||!text(u.name,200)||!u.name.trim()||!text(u.type,200)||(u.troopClass!==undefined&&u.troopClass!==''&&!troopClasses.includes(u.troopClass))||(u.greenskinType!==undefined&&u.greenskinType!==''&&!greenskins.includes(u.greenskinType))||(u.category!==undefined&&!text(u.category,100))||(u.state!==undefined&&!states.includes(u.state))||(u.equipment!==undefined&&!text(u.equipment,2000))||!text(u.lore)||!text(u.photo,3000000)||!Number.isInteger(u.quantity)||u.quantity<1)throw Error('Ficha de unidad no válida.');if(u.photo&&!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(u.photo))throw Error('Imagen no válida.');ids.add(u.id);}
 const bids=new Set();for(const b of d.battles){if(!text(b.id,100)||!b.id||bids.has(b.id)||!text(b.title,200)||!b.title.trim()||!text(b.date,10)||!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||!Number.isFinite(Date.parse(b.date))||new Date(b.date).toISOString().slice(0,10)!==b.date||!text(b.opponent,200)||!b.opponent.trim()||!text(b.army,200)||!b.army.trim()||!results.includes(resultLabel(b.result))||!Number.isInteger(b.points)||b.points<1||!text(b.notes)||(b.background!==undefined&&!text(b.background))||(b.photos!==undefined&&(!Array.isArray(b.photos)||b.photos.length>10||b.photos.some(p=>!text(p,3000000)||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p))))||!Array.isArray(b.roster)||!b.roster.length)throw Error('Ficha de batalla no válida.');bids.add(b.id);const seen=new Set();for(const r of b.roster){if(!ids.has(r.unitId)||seen.has(r.unitId)||!text(r.name,200)||!r.name.trim()||!Number.isInteger(r.quantity)||r.quantity<1||!Number.isInteger(r.points)||r.points<0||!text(r.equipment,2000))throw Error('Participación no válida o unidad repetida.');seen.add(r.unitId);}}
 if(d.scoring!==undefined&&d.scoring!==null){if(typeof d.scoring!=='object'||[...results,'MVP'].some(r=>!Number.isFinite(d.scoring[r])||!Number.isInteger(d.scoring[r])))throw Error('Baremo de puntuación no válido.');}
 for(const b of d.battles){if(b.mvpUnitId!==undefined&&b.mvpUnitId!==null&&b.mvpUnitId!==''&&(!ids.has(b.mvpUnitId)||!b.roster.some(r=>r.unitId===b.mvpUnitId)))throw Error('El MVP debe ser una unidad participante.');}
 return d;
}

export function unitRows(data,{search='',troopClass='',greenskinType='',sort='name',direction=1}={}){
 const q=search.toLocaleLowerCase('es');
 return data.units.filter(u=>(!troopClass||u.troopClass===troopClass)&&(!greenskinType||u.greenskinType===greenskinType)&&[u.name,u.type,u.troopClass,u.greenskinType].join(' ').toLocaleLowerCase('es').includes(q)).map(u=>{const s=stats(data,u.id);return {...u,total:s.total,VA:s.counts['Victoria aplastante'],V:s.counts.Victoria,E:s.counts.Empate,D:s.counts.Derrota,DA:s.counts['Derrota aplastante'],mvp:s.mvp,score:s.points};}).sort((a,b)=>compareRows(a,b,sort,direction));
}
export function compareRows(a,b,key,direction=1){const x=a[key],y=b[key];if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;return direction*(typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),'es',{numeric:true,sensitivity:'base'}));}
