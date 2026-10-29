
import './style.css';
import { VFS } from './core/vfs';
import { WindowManager } from './core/window';
import { evaluate } from './core/calc';
import { execCommand, type TermState } from './core/terminal';
import { validateBackup, makeBackup } from './core/backup';
import { idbSave, idbLoad } from './core/idb';
import type { Settings, Note, CalEvent } from './types';

const $=(s:string,el:ParentNode=document)=>el.querySelector(s) as HTMLElement|null;
function esc(s:string){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function uid(){ return Math.random().toString(36).slice(2,9)+Date.now().toString(36); }

interface AppDef{ id:string; name:string; icon:string; desc:string; version:string; caps:string[]; render:(body:HTMLElement,ctx:any)=>void; }
let vfs=new VFS();
let settings:Settings={theme:'system',wallpaper:'default',fontScale:1,dockPosition:'bottom'};
let notes:Note[]=[{id:uid(),title:'欢迎便笺',body:'WebOS 便笺会自动保存，刷新后恢复。',tags:['welcome'],updatedAt:Date.now()}];
let events:CalEvent[]=[];
let installed=new Set<string>();
const wm=new WindowManager();
let termState:TermState={cwd:'/home/user'};
const appEl=document.getElementById('app')!;

async function persist(){ try{ const data=JSON.stringify({vfs:vfs.serialize(),settings,notes,events,installed:[...installed],wins:wm.wins}); await idbSave('webos-state-v1',data);}catch{} }
async function restore(){ try{ const raw=await idbLoad('webos-state-v1'); if(!raw) return; const d=JSON.parse(raw); if(d.vfs) vfs=VFS.deserialize(d.vfs); if(d.settings) settings=d.settings; if(d.notes) notes=d.notes; if(d.events) events=d.events; if(d.installed) d.installed.forEach((x:string)=>installed.add(x)); }catch{} }
function toast(msg:string){ const t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),3200); }
function notify(msg:string){ toast(msg); const n=JSON.parse(localStorage.getItem('webos-notifs')||'[]'); n.unshift({msg,at:Date.now()}); localStorage.setItem('webos-notifs',JSON.stringify(n.slice(0,30))); }
export const WALLPAPERS:{id:string;name:string;cls?:string;url?:string}[]=[
 {id:'default',name:'深蓝渐变'}, {id:'sunset',name:'日落渐变',cls:'wp-sunset'}, {id:'forest',name:'森林渐变',cls:'wp-forest'},
 {id:'slate',name:'石板渐变',cls:'wp-slate'}, {id:'rose',name:'玫瑰渐变',cls:'wp-rose'}, {id:'violet',name:'紫霞渐变',cls:'wp-violet'}, {id:'teal',name:'青碧渐变',cls:'wp-teal'},
 {id:'photo-lake',name:'阿尔卑斯湖 (图)',url:'https://picsum.photos/id/1018/1920/1080'},
 {id:'photo-river',name:'山间河流 (图)',url:'https://picsum.photos/id/1015/1920/1080'},
 {id:'photo-canyon',name:'峡谷 (图)',url:'https://picsum.photos/id/1016/1920/1080'},
 {id:'photo-snow',name:'雪山 (图)',url:'https://picsum.photos/id/1036/1920/1080'},
 {id:'photo-falls',name:'瀑布 (图)',url:'https://picsum.photos/id/1019/1920/1080'},
 {id:'photo-moon',name:'月夜 (图)',url:'https://picsum.photos/id/1044/1920/1080'},
 {id:'photo-nebula',name:'星云 (图)',url:'https://img.goodfon.com/wallpaper/nbig/6/5e/galaxy-stars-light-nebula.webp'},
 {id:'photo-sunrise',name:'山湖日出 (图)',url:'https://onlyhdwallpapers.com/mountain-lake-at-sunrise-154-thumbnail.jpg?v=1786348311'},
];
interface Acct{ name:string }
function getAcct():Acct{ try{ const a=JSON.parse(localStorage.getItem('webos-account')||'null'); if(a&&a.name) return a; }catch{} return {name:'Ryan'}; }
function setAcct(a:Acct){ localStorage.setItem('webos-account', JSON.stringify(a)); }
function isLoggedIn(){ return localStorage.getItem('webos-loggedin')==='1'; }
function showBoot(){ const b=document.createElement('div'); b.className='boot'; b.innerHTML='<div class="logo">W</div><div style="font-size:22px;font-weight:600">WebOS</div><div class="barwrap"><div class="bar"></div></div><div style="opacity:.75;font-size:13px">正在启动系统…</div>'; document.body.appendChild(b); }
function showLogin(){ if(document.querySelector('.login')) return; const acct=getAcct(); const d=document.createElement('div'); d.className='login'; d.innerHTML=`<div class="card"><div class="avatar">${esc(acct.name.slice(0,1).toUpperCase()||'W')}</div><h2 style="margin:6px 0">${esc(acct.name)}</h2><p class="muted">模拟账户 · 本机登录, 不连接真实服务</p><input type="password" data-a="pw" placeholder="密码 (模拟登录: 任意输入, 也可留空)"><div class="row" style="justify-content:center;margin-top:12px"><button class="btn primary" data-a="go">登录</button><button class="btn" data-a="guest">访客进入</button></div></div>`; document.body.appendChild(d); const enter=(mode:string)=>{ localStorage.setItem('webos-loggedin','1'); toast('欢迎, '+acct.name+(mode==='guest'?' (访客模式)':'')); d.remove(); }; d.querySelector('[data-a="go"]')!.addEventListener('click',()=>enter('user')); d.querySelector('[data-a="guest"]')!.addEventListener('click',()=>enter('guest')); (d.querySelector('[data-a="pw"]') as HTMLInputElement).addEventListener('keydown',(e)=>{ if(e.key==='Enter') enter('user'); }); (d.querySelector('[data-a="pw"]') as HTMLInputElement).focus(); }
function logout(){ localStorage.removeItem('webos-loggedin'); showLogin(); }
function applyTheme(){ const dark=settings.theme==='dark'||(settings.theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.dataset.theme=dark?'dark':'light'; document.documentElement.style.fontSize=(16*settings.fontScale)+'px'; const d=$('.desktop'); if(d){ const wp=WALLPAPERS.find(w=>w.id===settings.wallpaper)||WALLPAPERS[0]; d.className='desktop '+(wp.cls||''); d.style.backgroundImage=wp.url? 'url("'+wp.url+'")':''; } const dock=$('.dock'); if(dock) dock.classList.toggle('left',settings.dockPosition==='left'); }

const APPS:AppDef[]=[
 {id:'files',name:'文件',icon:'📁',desc:'浏览虚拟文件系统，创建/复制/移动/删除/恢复文件',version:'1.0.0',caps:['vfs.read','vfs.write'],render:renderFiles},
 {id:'editor',name:'编辑器',icon:'📝',desc:'多标签文本/Markdown 编辑器，带未保存提示',version:'1.0.0',caps:['vfs.read','vfs.write'],render:renderEditor},
 {id:'terminal',name:'终端',icon:'⌨️',desc:'连接虚拟文件系统的命令解释器',version:'1.0.0',caps:['vfs'],render:renderTerminal},
 {id:'calc',name:'计算器',icon:'🧮',desc:'安全表达式计算器（不用 eval）',version:'1.0.0',caps:[],render:renderCalc},
 {id:'notes',name:'便笺',icon:'📌',desc:'自动保存的便笺，支持搜索/标签/导出',version:'1.0.0',caps:['storage'],render:renderNotes},
 {id:'calendar',name:'日历',icon:'📅',desc:'本地日历（未连接外部账户）',version:'1.0.0',caps:['storage'],render:renderCalendar},
 {id:'settings',name:'设置',icon:'⚙️',desc:'主题、壁纸、备份恢复、存储信息',version:'1.0.0',caps:['settings'],render:renderSettings},
 {id:'tasks',name:'任务管理',icon:'📊',desc:'查看运行中的窗口并切换/关闭',version:'1.0.0',caps:[],render:renderTasks},
 {id:'store',name:'应用中心',icon:'🛍️',desc:'已安装应用目录，可安装/卸载扩展应用',version:'1.0.0',caps:[],render:renderStore},
];
APPS.forEach(a=>installed.add(a.id));
// extra installable app
const EXTRA:AppDef={id:'clock',name:'时钟',icon:'🕐',desc:'世界时钟小应用（可安装）',version:'1.0.0',caps:[],render:(b)=>{ b.innerHTML='<h2>时钟</h2><p style="font-size:32px" id="ck"></p>'; const f=()=>{ const e=b.querySelector('#ck'); if(e) e.textContent=new Date().toLocaleTimeString(); }; f(); setInterval(f,1000); }};

function openApp(appId:string, arg?:any){
  const app=[...APPS,EXTRA].find(a=>a.id===appId); if(!app) return;
  if(!installed.has(appId)){ toast('请先在应用中心安装 '+app.name); return; }
  const existing=wm.findByApp(appId);
  if(existing){ wm.focus(existing.id); syncWins(); const exEl=document.querySelector(`[data-win="${existing.id}"]`) as HTMLElement|null; if(exEl){ exEl.classList.remove('flash'); void exEl.offsetWidth; exEl.classList.add('flash'); if(arg?.path) renderWindow(existing,app,arg); } return; }
  const isSmall=innerWidth<700;
  const win=wm.create(appId,app.name,innerWidth,innerHeight);
  if(isSmall){ win.x=0; win.y=0; win.w=innerWidth; win.h=innerHeight-48; win.maximized=true; }
  renderWindow(win,app,arg); persist();
}
function renderWindow(win:any,app:AppDef,arg?:any){
  let el=document.querySelector(`[data-win="${win.id}"]`) as HTMLElement;
  if(!el){ el=document.createElement('section'); el.className='win'; el.dataset.win=win.id; $('.desktop')!.appendChild(el); }
  el.style.left=win.x+'px'; el.style.top=win.y+'px'; el.style.width=win.w+'px'; el.style.height=win.h+'px'; el.style.zIndex=String(win.z); el.classList.toggle('minimized',!!win.minimized);
  el.innerHTML=`<div class="win-head"><b>${esc(app.name)}</b><button data-a="min" aria-label="最小化">—</button><button data-a="max" aria-label="最大化">□</button><button data-a="close" aria-label="关闭">×</button></div><div class="win-body"></div><div class="rz-e"></div><div class="rz-s"></div><div class="rz-se"></div>`;
  const body=el.querySelector('.win-body') as HTMLElement;
  try{ app.render(body,{arg,openApp,refresh:()=>renderWindow(win,app,arg)}); }catch(e:any){ body.innerHTML='<p>应用出错：'+esc(e.message||String(e))+'</p>'; }
  const head=el.querySelector('.win-head') as HTMLElement;
  head.addEventListener('pointerdown',(ev)=>{ if((ev.target as HTMLElement).tagName==='BUTTON') return; wm.focus(win.id); syncWins(); document.body.classList.add('dragging'); const sx=ev.clientX-win.x, sy=ev.clientY-win.y; const mv=(e:PointerEvent)=>{ win.x=e.clientX-sx; win.y=e.clientY-sy; wm.clamp(win,innerWidth,innerHeight-48); el.style.left=win.x+'px'; el.style.top=win.y+'px'; }; const up=()=>{ removeEventListener('pointermove',mv); removeEventListener('pointerup',up); document.body.classList.remove('dragging'); persist(); }; addEventListener('pointermove',mv); addEventListener('pointerup',up); });
  el.addEventListener('pointerdown',()=>{ wm.focus(win.id); syncWins(); }, true);
  el.querySelector('[data-a="close"]')!.addEventListener('click',()=>{ wm.close(win.id); el.classList.add('closing'); setTimeout(()=>el.remove(),150); syncDock(); persist(); });
  el.querySelector('[data-a="min"]')!.addEventListener('click',()=>{ wm.minimize(win.id); syncWins(); });
  el.querySelector('[data-a="max"]')!.addEventListener('click',()=>{ wm.toggleMax(win.id,innerWidth,innerHeight-48); syncWins(); });
  const startResize=(ev:PointerEvent, mode:string)=>{ ev.stopPropagation(); ev.preventDefault(); wm.focus(win.id); syncWins(); document.body.classList.add('resizing'); const sw=win.w, sh=win.h, sx=ev.clientX, sy=ev.clientY; const mv=(e:PointerEvent)=>{ if(mode.includes('e')) win.w=Math.max(280, sw+e.clientX-sx); if(mode.includes('s')) win.h=Math.max(200, sh+e.clientY-sy); el.style.width=win.w+'px'; el.style.height=win.h+'px'; }; const up=()=>{ removeEventListener('pointermove',mv); removeEventListener('pointerup',up); document.body.classList.remove('resizing'); persist(); }; addEventListener('pointermove',mv); addEventListener('pointerup',up); };
  (el.querySelector('.rz-e') as HTMLElement).addEventListener('pointerdown',(e)=>startResize(e,'e'));
  (el.querySelector('.rz-s') as HTMLElement).addEventListener('pointerdown',(e)=>startResize(e,'s'));
  (el.querySelector('.rz-se') as HTMLElement).addEventListener('pointerdown',(e)=>startResize(e,'es'));
  head.addEventListener('dblclick',()=>{ wm.toggleMax(win.id,innerWidth,innerHeight-50); syncWins(); });
  syncDock();
}
function syncWins(){ for(const w of wm.wins){ const el=document.querySelector(`[data-win="${w.id}"]`) as HTMLElement; if(el){ el.style.zIndex=String(w.z); el.style.left=w.x+'px'; el.style.top=w.y+'px'; el.style.width=w.w+'px'; el.style.height=w.h+'px'; el.classList.toggle('minimized',!!w.minimized); el.classList.toggle('active', wm.active()?.id===w.id); } } syncDock(); }
function syncDock(){ const dock=$('.dock'); if(!dock) return; dock.querySelectorAll('button').forEach(b=>{ const id=(b as HTMLElement).dataset.app; b.classList.toggle('running', wm.wins.some(w=>w.appId===id)); }); }

// ---- Apps ----
function renderFiles(body:HTMLElement,ctx:any){
  let cwd=ctx.arg?.path||'/home/user';
  const draw=()=>{ let items:any[]=[]; let err=''; try{ items=vfs.list(cwd); }catch(e:any){ err=e.message; }
    body.innerHTML=`<div class="row"><button class="btn" data-a="up">↑ 上级</button><span>${esc(cwd)}</span><button class="btn" data-a="newfile">新建文件</button><button class="btn" data-a="newdir">新建文件夹</button><button class="btn" data-a="trash">回收站</button><label class="btn">导入<input type="file" hidden data-a="import"></label></div><p class="muted">${esc(err)}</p><input placeholder="搜索文件..." data-a="q" style="margin:8px 0"><ul class="list">${items.map(n=>`<li><span>${n.type==='dir'?'📁':'📄'}</span><b>${esc(n.name)}</b><span class="muted">${n.type} · ${n.type==='file'?n.content.length+' B':''} · ${new Date(n.updatedAt).toLocaleString()}</span><button class="btn" data-open="${esc(n.name)}">打开</button><button class="btn" data-rename="${esc(n.name)}">重命名</button><button class="btn" data-del="${esc(n.name)}">删除</button><button class="btn" data-exp="${esc(n.name)}">导出</button></li>`).join('')}</ul>`;
    body.querySelector('[data-a="up"]')!.addEventListener('click',()=>{ cwd=cwd==='/'?'/':cwd.slice(0,cwd.lastIndexOf('/'))||'/'; draw(); });
    body.querySelector('[data-a="newfile"]')!.addEventListener('click',()=>{ const n=prompt('文件名'); if(n){ try{vfs.createFile(cwd.replace(/\/$/,'')+'/'+n,''); persist(); draw();}catch(e:any){alert(e.message)} } });
    body.querySelector('[data-a="newdir"]')!.addEventListener('click',()=>{ const n=prompt('文件夹名'); if(n){ try{vfs.mkdir(cwd.replace(/\/$/,'')+'/'+n); persist(); draw();}catch(e:any){alert(e.message)} } });
    body.querySelector('[data-a="trash"]')!.addEventListener('click',()=>{ cwd='/home/user/.trash'; draw(); });
    body.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>{ const name=(b as HTMLElement).dataset.open!; const node=vfs.resolve(cwd.replace(/\/$/,'')+'/'+name); if(!node) return; if(node.type==='dir'){ cwd=vfs.pathOf(node); draw(); } else openApp('editor',{path:vfs.pathOf(node)}); }));
    body.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{ const name=(b as HTMLElement).dataset.del!; try{ if(cwd==='/home/user/.trash'){ if(confirm('恢复 '+name+' ?')) vfs.restore(name); else if(confirm('永久删除?')) vfs.remove(cwd+'/'+name,'/',false); } else vfs.remove(cwd.replace(/\/$/,'')+'/'+name); persist(); draw(); }catch(e:any){alert(e.message)} }));
    body.querySelectorAll('[data-rename]').forEach(b=>b.addEventListener('click',()=>{ const old=(b as HTMLElement).dataset.rename!; const nn=prompt('新名称',old); if(nn){ try{vfs.rename(cwd.replace(/\/$/,'')+'/'+old,nn); persist(); draw();}catch(e:any){alert(e.message)} } }));
    body.querySelectorAll('[data-exp]').forEach(b=>b.addEventListener('click',()=>{ const name=(b as HTMLElement).dataset.exp!; try{ const c=vfs.readFile(cwd.replace(/\/$/,'')+'/'+name); download(name,c); }catch(e:any){alert(e.message)} }));
    const imp=body.querySelector('[data-a="import"]') as HTMLInputElement; imp.addEventListener('change',async()=>{ const f=imp.files?.[0]; if(!f) return; if(f.size>2*1024*1024){alert('文件过大（>2MB）');return;} const txt=await f.text(); vfs.createFile(cwd.replace(/\/$/,'')+'/'+f.name,txt); persist(); draw(); });
    const q=body.querySelector('[data-a="q"]') as HTMLInputElement; q.addEventListener('input',()=>{ if(!q.value) return; const res=vfs.search(q.value); body.querySelector('.list')!.innerHTML=res.map(n=>`<li>${esc(vfs.pathOf(n))}</li>`).join(''); });
  }; draw();
}
function download(name:string,content:string,mime='text/plain'){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type:mime})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); }

function renderEditor(body:HTMLElement,ctx:any){
  let path=ctx.arg?.path||''; let dirty=false;
  body.innerHTML=`<div class="row"><input data-a="path" placeholder="/home/user/file.txt" value="${esc(path)}" style="flex:1"><button class="btn" data-a="open">打开</button><button class="btn primary" data-a="save">保存</button><button class="btn" data-a="exp">导出</button></div><div class="row" style="margin:8px 0"><input data-a="find" placeholder="在文档中搜索"><span class="muted" data-a="findres"></span></div><textarea data-a="ta" style="height:320px;font-family:ui-monospace,monospace" placeholder="在此输入文本 / Markdown..."></textarea><p class="muted" data-a="st"></p>`;
  const ta=body.querySelector('[data-a="ta"]') as HTMLTextAreaElement; const st=body.querySelector('[data-a="st"]')!;
  const load=(p:string)=>{ try{ ta.value=vfs.readFile(p); path=p; dirty=false; st.textContent='已打开 '+p; }catch(e:any){ alert(e.message); } };
  if(path) load(path);
  ta.addEventListener('input',()=>{ dirty=true; st.textContent='未保存的修改 *'; });
  body.querySelector('[data-a="open"]')!.addEventListener('click',()=>{ if(dirty && !confirm('有未保存修改，仍要打开其他文件？')) return; load((body.querySelector('[data-a="path"]') as HTMLInputElement).value); });
  body.querySelector('[data-a="save"]')!.addEventListener('click',()=>{ const p=(body.querySelector('[data-a="path"]') as HTMLInputElement).value||path; if(!p){alert('请输入文件路径');return;} vfs.writeFile(p,ta.value); path=p; dirty=false; st.textContent='已保存 '+new Date().toLocaleTimeString(); persist(); });
  body.querySelector('[data-a="exp"]')!.addEventListener('click',()=>download(path.split('/').pop()||'untitled.txt',ta.value));
  body.querySelector('[data-a="find"]')!.addEventListener('input',(e)=>{ const q=(e.target as HTMLInputElement).value; const res=body.querySelector('[data-a="findres"]')!; res.textContent=q? (ta.value.split(q).length-1)+' 处匹配':''; });
}
function renderTerminal(body:HTMLElement){
  body.innerHTML=`<div class="term" data-a="out">WebOS Terminal — 输入 help 查看命令。连接的是虚拟文件系统，不是真实系统 Shell。</div><div class="row" style="margin-top:8px"><span data-a="prompt"></span><input data-a="inp" style="flex:1" placeholder="ls / cat welcome.md / echo hi > a.txt"></div>`;
  const out=body.querySelector('[data-a="out"]')!; const inp=body.querySelector('[data-a="inp"]') as HTMLInputElement; const pr=body.querySelector('[data-a="prompt"]')!;
  const upd=()=>pr.textContent='user@webos:'+termState.cwd+'$';
  upd();
  inp.addEventListener('keydown',(e)=>{ if(e.key!=='Enter') return; const line=inp.value; inp.value=''; out.textContent+='\n'+termState.cwd+'$ '+line; const r=execCommand(vfs,termState,line); termState=r.state; if(r.clear) out.textContent=''; else if(r.output) out.textContent+='\n'+r.output; upd(); persist(); out.scrollTop=out.scrollHeight; });
  inp.focus();
}
function renderCalc(body:HTMLElement){
  body.innerHTML=`<input data-a="disp" placeholder="0" style="font-size:24px;text-align:right"><div class="calc-grid" style="margin-top:10px">${['7','8','9','/','4','5','6','*','1','2','3','-','0','.','(',')','+','%','C','='].map(k=>`<button class="btn" data-k="${k}">${k}</button>`).join('')}</div><p class="muted" data-a="err"></p>`;
  const disp=body.querySelector('[data-a="disp"]') as HTMLInputElement;
  const calc=()=>{ try{ disp.value=String(evaluate(disp.value)); (body.querySelector('[data-a="err"]')!).textContent=''; }catch(e:any){ (body.querySelector('[data-a="err"]')!).textContent=e.message; } };
  body.querySelectorAll('[data-k]').forEach(b=>b.addEventListener('click',()=>{ const k=(b as HTMLElement).dataset.k!; if(k==='=') calc(); else if(k==='C') disp.value=''; else disp.value+=k; }));
  disp.addEventListener('keydown',(e)=>{ if(e.key==='Enter') calc(); });
}
function renderNotes(body:HTMLElement,ctx:any){
  const draw=(q='')=>{ const list=notes.filter(n=>!q||n.title.toLowerCase().includes(q.toLowerCase())||n.body.includes(q)||n.tags.join(',').includes(q));
    body.innerHTML=`<div class="row"><button class="btn primary" data-a="new">新建便笺</button><input data-a="q" placeholder="搜索便笺/标签" value="${esc(q)}" style="flex:1"></div><ul class="list" style="margin-top:10px">${list.map(n=>`<li style="display:block"><b>${esc(n.title)}</b> <span class="muted">${n.tags.map(t=>'#'+esc(t)).join(' ')} · ${new Date(n.updatedAt).toLocaleString()}</span><textarea data-body="${n.id}" style="height:90px;margin-top:6px">${esc(n.body)}</textarea><div class="row"><button class="btn" data-del="${n.id}">删除</button><button class="btn" data-exp="${n.id}">导出</button></div></li>`).join('')}</ul>`;
    body.querySelector('[data-a="new"]')!.addEventListener('click',()=>{ notes.unshift({id:uid(),title:'未命名便笺',body:'',tags:[],updatedAt:Date.now()}); persist(); draw(q); });
    (body.querySelector('[data-a="q"]') as HTMLInputElement).addEventListener('input',(e)=>draw((e.target as HTMLInputElement).value));
    body.querySelectorAll('[data-body]').forEach(t=>t.addEventListener('input',()=>{ const n=notes.find(x=>x.id===(t as HTMLElement).dataset.body); if(n){ n.body=(t as HTMLTextAreaElement).value; n.updatedAt=Date.now(); persist(); } }));
    body.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{ notes=notes.filter(x=>x.id!==(b as HTMLElement).dataset.del); persist(); draw(q); }));
    body.querySelectorAll('[data-exp]').forEach(b=>b.addEventListener('click',()=>{ const n=notes.find(x=>x.id===(b as HTMLElement).dataset.exp); if(n) download(n.title+'.md',n.body); }));
  }; draw();
}
function renderCalendar(body:HTMLElement){
  let cur=new Date(); cur.setDate(1);
  const draw=()=>{ const y=cur.getFullYear(), m=cur.getMonth(); const first=new Date(y,m,1).getDay(); const days=new Date(y,m+1,0).getDate();
    let cells=''; for(let i=0;i<first;i++) cells+='<div></div>'; for(let d=1;d<=days;d++){ const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; const has=events.filter(e=>e.date===ds); cells+=`<button class="btn" data-day="${ds}" style="min-height:52px">${d}${has.length?'<br><small>'+has.length+' 件事</small>':''}</button>`; }
    body.innerHTML=`<div class="row"><button class="btn" data-a="prev">←</button><b>${y} 年 ${m+1} 月</b><button class="btn" data-a="next">→</button><button class="btn" data-a="today">今天</button><span class="muted">本地日历，未连接外部账户</span></div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:10px">${cells}</div><div data-a="detail" style="margin-top:12px"></div>`;
    body.querySelector('[data-a="prev"]')!.addEventListener('click',()=>{cur.setMonth(m-1);draw();});
    body.querySelector('[data-a="next"]')!.addEventListener('click',()=>{cur.setMonth(m+1);draw();});
    body.querySelector('[data-a="today"]')!.addEventListener('click',()=>{cur=new Date();cur.setDate(1);draw();});
    body.querySelectorAll('[data-day]').forEach(b=>b.addEventListener('click',()=>{ const ds=(b as HTMLElement).dataset.day!; const det=body.querySelector('[data-a="detail"]')!; const list=events.filter(e=>e.date===ds); det.innerHTML=`<h3>${ds}</h3><ul class="list">${list.map(e=>`<li>${esc(e.time)} ${esc(e.title)} <button class="btn" data-del="${e.id}">删除</button></li>`).join('')}</ul><div class="row"><input data-a="et" placeholder="事件标题"><input data-a="etime" type="time" value="09:00"><button class="btn primary" data-a="add">添加</button></div>`;
      det.querySelector('[data-a="add"]')!.addEventListener('click',()=>{ const t=(det.querySelector('[data-a="et"]') as HTMLInputElement).value; if(!t) return; events.push({id:uid(),title:t,date:ds,time:(det.querySelector('[data-a="etime"]') as HTMLInputElement).value,note:''}); persist(); draw(); });
      det.querySelectorAll('[data-del]').forEach(x=>x.addEventListener('click',()=>{ events=events.filter(e=>e.id!==(x as HTMLElement).dataset.del); persist(); draw(); }));
    }));
  }; draw();
}
function renderSettings(body:HTMLElement){
  body.innerHTML=`<h3>主题与外观</h3><div class="row"><label>主题 <select data-a="theme"><option value="light">浅色</option><option value="dark">深色</option><option value="system">跟随系统</option></select></label><label>壁纸 <select data-a="wp">${WALLPAPERS.map(w=>`<option value="${w.id}">${w.name}</option>`).join('')}</select></label><label>字体缩放 <select data-a="fs"><option value="0.9">小</option><option value="1">标准</option><option value="1.15">大</option></select></label><label>Dock <select data-a="dock"><option value="bottom">底部</option><option value="left">左侧</option></select></label></div>
  <h3>账户 (模拟)</h3><div class="row"><div class="avatar" style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700">${esc(getAcct().name.slice(0,1).toUpperCase()||'W')}</div><div style="flex:1;min-width:180px"><input data-a="acctname" value="${esc(getAcct().name)}" aria-label="显示名"></div><button class="btn" data-a="acctsave">保存名称</button><button class="btn" data-a="logout">退出登录</button></div><p class="muted">这是本机模拟账户, 不连接任何真实服务, 不上传数据。锁屏后用任意密码即可重新登录, 也可访客进入。</p>
  <h3>壁纸预览</h3><div class="wpgrid">${WALLPAPERS.map(w=>`<button data-wp="${w.id}" class="${settings.wallpaper===w.id?'sel':''}" style="background:${w.url? 'url('+w.url+') center/cover' : w.cls==='wp-sunset'?'linear-gradient(160deg,#7c2d12,#db2777)':w.cls==='wp-forest'?'linear-gradient(160deg,#14532d,#16a34a)':w.cls==='wp-slate'?'linear-gradient(160deg,#0f172a,#334155)':w.cls==='wp-rose'?'linear-gradient(160deg,#881337,#e11d48)':w.cls==='wp-violet'?'linear-gradient(160deg,#2e1065,#7c3aed)':w.cls==='wp-teal'?'linear-gradient(160deg,#042f2e,#0d9488)':'linear-gradient(160deg,#1e3a8a,#2563eb)'}">${w.name}</button>`).join('')}</div>
  <h3>存储</h3><p>虚拟文件总大小：${vfs.totalSize()} 字节 · 文件节点：${vfs.nodes.size} · 便笺：${notes.length} · 日历事件：${events.length}</p>
  <h3>备份与恢复</h3><div class="row"><button class="btn primary" data-a="backup">导出完整备份 JSON</button><label class="btn">恢复备份<input type="file" hidden data-a="restore" accept=".json"></label><button class="btn" data-a="reset">恢复默认设置</button></div>
  <h3>快捷键</h3><p class="muted">Ctrl/Cmd+K 全局搜索 · Ctrl/Cmd+, 设置 · Esc 关闭菜单/启动器</p>
  <h3>关于</h3><p>WebOS 1.1.0 — 浏览器虚拟操作系统，纯静态、零后端。数据保存在本机 IndexedDB，不会默认上传。</p>`;
  const th=body.querySelector('[data-a="theme"]') as HTMLSelectElement; th.value=settings.theme; th.addEventListener('change',()=>{settings.theme=th.value as any; applyTheme(); persist();});
  const wp=body.querySelector('[data-a="wp"]') as HTMLSelectElement; wp.value=settings.wallpaper; wp.addEventListener('change',()=>{settings.wallpaper=wp.value; applyTheme(); persist();});
  const fs=body.querySelector('[data-a="fs"]') as HTMLSelectElement; fs.value=String(settings.fontScale); fs.addEventListener('change',()=>{settings.fontScale=parseFloat(fs.value); applyTheme(); persist();});
  const dk=body.querySelector('[data-a="dock"]') as HTMLSelectElement; dk.value=settings.dockPosition; dk.addEventListener('change',()=>{settings.dockPosition=dk.value as any; applyTheme(); persist();});
  body.querySelector('[data-a="backup"]')!.addEventListener('click',()=>{ const bk=makeBackup({vfs:vfs.serialize(),settings,notes,events}); download('webos-backup.json',JSON.stringify(bk,null,2),'application/json'); });
  const rs=body.querySelector('[data-a="restore"]') as HTMLInputElement; rs.addEventListener('change',async()=>{ const f=rs.files?.[0]; if(!f) return; try{ const txt=await f.text(); const obj=JSON.parse(txt); if(!validateBackup(obj)) throw new Error('备份格式无效或过大'); if(!confirm('恢复将覆盖当前数据，确定继续？')) return; vfs=VFS.deserialize(obj.vfs); settings=obj.settings; notes=obj.notes; events=obj.events; applyTheme(); persist(); toast('恢复成功'); }catch(e:any){ alert('恢复失败，原数据未改动：'+e.message); } });
  body.querySelectorAll('[data-wp]').forEach(b=>b.addEventListener('click',()=>{ settings.wallpaper=(b as HTMLElement).dataset.wp!; applyTheme(); persist(); renderSettings(body); }));
  body.querySelector('[data-a="acctsave"]')!.addEventListener('click',()=>{ const v=(body.querySelector('[data-a="acctname"]') as HTMLInputElement).value.trim(); if(v){ setAcct({name:v}); toast('账户名称已更新 (下次锁屏/登录生效)'); } });
  body.querySelector('[data-a="logout"]')!.addEventListener('click',()=>logout());
  body.querySelector('[data-a="reset"]')!.addEventListener('click',()=>{ if(confirm('恢复默认设置？')){ settings={theme:'system',wallpaper:'default',fontScale:1,dockPosition:'bottom'}; applyTheme(); persist(); renderSettings(body); } });
}
function renderTasks(body:HTMLElement,ctx:any){ const draw=()=>{ body.innerHTML= wm.wins.length? `<ul class="list">${wm.wins.map(w=>`<li><b>${esc(w.title)}</b><span class="muted">${w.appId} · ${w.minimized?'最小化':'可见'} · ${w.w}x${w.h}</span><button class="btn" data-f="${w.id}">切换到</button><button class="btn" data-c="${w.id}">关闭</button></li>`).join('')}</ul>`:'<p>当前没有运行中的应用。</p>';
  body.querySelectorAll('[data-f]').forEach(b=>b.addEventListener('click',()=>{ wm.focus((b as HTMLElement).dataset.f!); syncWins(); }));
  body.querySelectorAll('[data-c]').forEach(b=>b.addEventListener('click',()=>{ const id=(b as HTMLElement).dataset.c!; wm.close(id); document.querySelector(`[data-win="${id}"]`)?.remove(); syncDock(); draw(); }));
 }; draw(); }
function renderStore(body:HTMLElement){ const all=[...APPS,EXTRA]; body.innerHTML=`<ul class="list">${all.map(a=>`<li><span style="font-size:22px">${a.icon}</span><div style="flex:1"><b>${esc(a.name)}</b> <span class="muted">v${a.version}</span><br><span class="muted">${esc(a.desc)} · 能力：${a.caps.join(', ')||'无'}</span></div>${installed.has(a.id)?`<button class="btn" data-open="${a.id}">打开</button>${a.id==='clock'?`<button class="btn" data-un="${a.id}">卸载</button>`:''}`:`<button class="btn primary" data-in="${a.id}">安装</button>`}</li>`).join('')}</ul><p class="muted">首版应用包来自本地目录，不联网下载；架构预留了清单/能力字段供扩展。</p>`;
  body.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openApp((b as HTMLElement).dataset.open!)));
  body.querySelectorAll('[data-in]').forEach(b=>b.addEventListener('click',()=>{ installed.add((b as HTMLElement).dataset.in!); persist(); renderStore(body); toast('安装成功'); }));
  body.querySelectorAll('[data-un]').forEach(b=>b.addEventListener('click',()=>{ installed.delete((b as HTMLElement).dataset.un!); persist(); renderStore(body); }));
}

function shell(){
  appEl.innerHTML=`<header class="topbar"><button id="launcherBtn" aria-label="启动器">⊞ WebOS</button><button id="searchBtn">🔍 搜索 (Ctrl+K)</button><span style="flex:1"></span><span id="clock"></span><button id="acctBtn">👤</button><button id="lockBtn" aria-label="锁定">🔒</button><button id="notifBtn" aria-label="通知">🔔</button><button id="offline" class="muted" style="display:none">离线</button></header><main class="desktop"><div class="dock">${APPS.map(a=>`<button data-app="${a.id}"><span class="ic">${a.icon}</span>${a.name}<span class="dot"></span></button>`).join('')}</div></main>`;
  applyTheme();
  const clock=()=>{ const e=$('#clock'); if(e) e.textContent=new Date().toLocaleString(); }; clock(); setInterval(clock,1000);
  document.querySelectorAll('.dock button').forEach(b=>b.addEventListener('click',()=>openApp((b as HTMLElement).dataset.app!)));
  const ab=$('#acctBtn'); if(ab){ ab.textContent='👤 '+getAcct().name; ab.addEventListener('click',()=>openApp('settings')); }
  const lk=$('#lockBtn'); if(lk) lk.addEventListener('click',()=>logout());
  $('#launcherBtn')!.addEventListener('click',(e)=>{ e.stopPropagation(); if(document.querySelector('.launcher')){ document.querySelectorAll('.launcher').forEach(x=>x.remove()); } else showLauncher(); });
  document.addEventListener('pointerdown',(e)=>{ const t=e.target as HTMLElement; if(!t.closest('.launcher,.searchbox,#launcherBtn,#searchBtn,.ctx')) document.querySelectorAll('.launcher,.searchbox').forEach(x=>x.remove()); });
  $('#searchBtn')!.addEventListener('click',showSearch);
  $('#notifBtn')!.addEventListener('click',()=>{ const n=JSON.parse(localStorage.getItem('webos-notifs')||'[]'); alert(n.length? n.map((x:any)=>new Date(x.at).toLocaleString()+' '+x.msg).join('\n'):'暂无通知'); });
  const desk=$('.desktop')!; desk.addEventListener('contextmenu',(e)=>{ e.preventDefault(); showCtx(e.clientX,e.clientY); });
  addEventListener('online',()=>{ ($('#offline') as HTMLElement).style.display='none'; });
  addEventListener('offline',()=>{ ($('#offline') as HTMLElement).style.display='inline'; toast('当前离线，WebOS 核心功能仍可使用'); });
  addEventListener('keydown',(e)=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); showSearch(); } if((e.metaKey||e.ctrlKey)&&e.key===','){ e.preventDefault(); openApp('settings'); } if(e.key==='Escape'){ document.querySelectorAll('.launcher,.searchbox,.ctx').forEach(x=>x.remove()); } });
}
function showCtx(x:number,y:number){ document.querySelectorAll('.ctx').forEach(e=>e.remove()); const c=document.createElement('div'); c.className='ctx'; c.style.left=Math.min(x,innerWidth-180)+'px'; c.style.top=Math.min(y,innerHeight-180)+'px'; c.innerHTML=`<button data-a="files">打开文件管理器</button><button data-a="new">新建文件 welcome-note.txt</button><button data-a="wp">切换壁纸</button><button data-a="settings">设置</button>`; document.body.appendChild(c); c.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ const a=(b as HTMLElement).dataset.a; c.remove(); if(a==='files') openApp('files'); if(a==='settings') openApp('settings'); if(a==='wp'){ settings.wallpaper=settings.wallpaper==='default'?'sunset':'default'; applyTheme(); persist(); } if(a==='new'){ vfs.createFile('/home/user/welcome-note.txt','Created from desktop menu'); persist(); toast('已创建文件'); } })); setTimeout(()=>addEventListener('click',()=>c.remove(),{once:true}),0); }
function showLauncher(){ document.querySelectorAll('.launcher,.searchbox').forEach(e=>e.remove()); const d=document.createElement('div'); d.className='launcher'; d.innerHTML=`<div class="row" style="justify-content:space-between"><h3 style="margin:4px 0 10px">应用启动器</h3><button class="btn" data-a="x">✕ 关闭</button></div><div class="grid">${APPS.filter(a=>installed.has(a.id)).map(a=>`<button data-app="${a.id}"><div style="font-size:26px">${a.icon}</div>${a.name}</button>`).join('')}</div>`; $('.desktop')!.appendChild(d); d.querySelector('[data-a="x"]')!.addEventListener('click',()=>d.remove()); d.querySelectorAll('[data-app]').forEach(b=>b.addEventListener('click',()=>{ d.remove(); openApp((b as HTMLElement).dataset.app!); })); }
function showSearch(){ document.querySelectorAll('.launcher,.searchbox').forEach(e=>e.remove()); const d=document.createElement('div'); d.className='searchbox'; d.innerHTML=`<input placeholder="搜索应用、文件、便笺..." autofocus><ul class="list" style="margin-top:10px"></ul>`; $('.desktop')!.appendChild(d); const inp=d.querySelector('input')!; const list=d.querySelector('.list')!;
  inp.addEventListener('input',()=>{ const q=(inp as HTMLInputElement).value.trim(); if(!q){list.innerHTML='';return;} const apps=APPS.filter(a=>a.name.includes(q)).map(a=>`<li>应用：${esc(a.name)} <button class="btn" data-open="${a.id}">打开</button></li>`); const files=vfs.search(q).slice(0,8).map(n=>`<li>文件：${esc(vfs.pathOf(n))}</li>`); const ns=notes.filter(n=>n.title.includes(q)||n.body.includes(q)).map(n=>`<li>便笺：${esc(n.title)}</li>`); list.innerHTML=[...apps,...files,...ns].join('')||'<li>无结果</li>'; list.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>{ d.remove(); openApp((b as HTMLElement).dataset.open!); })); }); inp.focus(); }

(async()=>{ showBoot(); await restore(); shell(); notify('WebOS 已启动'); if('serviceWorker' in navigator){ try{ await navigator.serviceWorker.register('./sw.js'); }catch{} } setTimeout(()=>{ const b=document.querySelector('.boot'); if(b){ b.classList.add('hide'); setTimeout(()=>b.remove(),500); } if(!isLoggedIn()) showLogin(); },1650); })();
