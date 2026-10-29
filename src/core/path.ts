export function normalizePath(p:string):string{ if(!p||p.trim()==='') return '/'; const parts=p.replace(/\\/g,'/').split('/').filter(Boolean); const out:string[]=[]; for(const s of parts){ if(s==='.') continue; if(s==='..'){ out.pop(); } else out.push(s); } return '/'+out.join('/'); }
export function joinPath(base:string, rel:string):string{ if(rel.startsWith('/')) return normalizePath(rel); return normalizePath(base.replace(/\/$/,'')+'/'+rel); }
export function dirname(p:string):string{ const n=normalizePath(p); if(n==='/') return '/'; const i=n.lastIndexOf('/'); return i===0?'/':n.slice(0,i); }
export function basename(p:string):string{ const n=normalizePath(p); if(n==='/') return '/'; return n.slice(n.lastIndexOf('/')+1); }
export function isValidName(name:string):boolean{ return !!name && !name.includes('/') && !name.includes('\\') && name!=='.' && name!=='..' && name.trim()===name && name.length<=120; }
