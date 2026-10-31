// Desktop items model: apps, files, folders and shortcuts that live on the desktop.
export interface DeskItem{ key:string; kind:'app'|'file'|'folder'|'shortcut'; ref:string; name:string; icon:string; hidden?:boolean; }
export const LONG_PRESS_MS=320; // shorter than Edge browser's long-press / context detection (~500ms)
export const CORE_APPS=['files','settings','store'];
export function isCoreApp(id:string):boolean{ return CORE_APPS.includes(id); }
export interface AppLike{ id:string; name:string; icon:string; }
export function appItem(app:AppLike):DeskItem{ return {key:'app:'+app.id, kind:'app', ref:app.id, name:app.name, icon:app.icon}; }
export function seedItems(apps:AppLike[]):DeskItem[]{ return apps.map(appItem); }
export function visibleItems(items:DeskItem[]):DeskItem[]{ return items.filter(i=>!i.hidden); }
export function addShortcut(items:DeskItem[], target:DeskItem, newKey:string):DeskItem[]{
  const name=target.name+' 快捷方式';
  if(items.some(i=>i.kind==='shortcut'&&i.ref===target.ref&&i.name===name)) return items;
  return [...items, {key:newKey, kind:'shortcut', ref:target.ref, name, icon:target.icon}];
}
export function hideItem(items:DeskItem[], key:string):DeskItem[]{ return items.map(i=>i.key===key?{...i,hidden:true}:i); }
export function unhideAll(items:DeskItem[]):DeskItem[]{ return items.map(i=>({...i,hidden:false})); }
export function renameItem(items:DeskItem[], key:string, name:string):DeskItem[]{ return items.map(i=>i.key===key?{...i,name}:i); }
export function retargetItem(items:DeskItem[], key:string, ref:string, name:string):DeskItem[]{ return items.map(i=>i.key===key?{...i,ref,name}:i); }
export function removeItem(items:DeskItem[], key:string):DeskItem[]{ return items.filter(i=>i.key!==key); }
export function removeAppItems(items:DeskItem[], appId:string):DeskItem[]{
  // app shortcuts have ref === appId (no leading slash); file shortcuts have ref starting with '/'
  return items.filter(i=>!((i.kind==='app'&&i.ref===appId)||(i.kind==='shortcut'&&i.ref===appId)));
}

export interface MagCfg{ on:boolean; max:number; range:number; sens:number; }
export const DEFAULT_MAG:MagCfg={ on:true, max:1.22, range:56, sens:1 };
export function magScale(dist:number, cfg:MagCfg):number{ if(!cfg.on) return 1; const k=Math.max(0, 1 - Math.abs(dist)/cfg.range); const curved=Math.pow(k, 2 - Math.min(1.5, Math.max(0.2, cfg.sens))*0.7); return 1 + (cfg.max-1)*curved; }
