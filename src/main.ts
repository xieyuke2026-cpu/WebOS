
import './style.css';
import { VFS } from './core/vfs';
import { WindowManager } from './core/window';
import { evaluate } from './core/calc';
import { execCommand, type TermState } from './core/terminal';
import { validateBackup, makeBackup } from './core/backup';
import { renderMarkdown } from './core/markdown';
import type { DeskItem } from './core/desktop';
import { genProfile, computeUsage } from './core/sysinfo';
import type { SysProfile } from './core/sysinfo';
function getProfile():SysProfile{ try{ const s=JSON.parse(localStorage.getItem('webos-sysprofile')||'null'); if(s&&s.cpu) return s; }catch{} const pr=genProfile(); try{ localStorage.setItem('webos-sysprofile', JSON.stringify(pr)); }catch{} return pr; }
function sysUsage(tick:number){ return computeUsage(getProfile(), {windows: wm.wins.length, vfsBytes: vfs.totalSize(), tick}); }
import { seedItems, visibleItems, addShortcut, hideItem, unhideAll, renameItem, retargetItem, removeItem, removeAppItems, isCoreApp, appItem, LONG_PRESS_MS } from './core/desktop';
const DOCK_IDS=['files','editor','terminal','notes','calendar','settings','tasks','store'];
import { idbSave, idbLoad } from './core/idb';
import type { Settings, Note, CalEvent } from './types';

const $=(s:string,el:ParentNode=document)=>el.querySelector(s) as HTMLElement|null;
function esc(s:string){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function uid(){ return Math.random().toString(36).slice(2,9)+Date.now().toString(36); }

interface AppDef{ id:string; name:string; icon:string; desc:string; version:string; caps:string[]; render:(body:HTMLElement,ctx:any)=>void; }
let vfs=new VFS();
let settings:Settings={theme:'system',wallpaper:'moss',fontScale:1,dockPosition:'bottom',desktopIcons:true};
let notes:Note[]=[{id:uid(),title:'欢迎便笺',body:'WebOS 便笺会自动保存，刷新后恢复。',tags:['welcome'],updatedAt:Date.now()}];
let events:CalEvent[]=[];
let todos:import('./types').TodoItem[]=[];
let installed=new Set<string>();
const wm=new WindowManager();
let termState:TermState={cwd:'/home/user'};
const appEl=document.getElementById('app')!;

async function persist(){ try{ const data=JSON.stringify({vfs:vfs.serialize(),settings,notes,events,todos,installed:[...installed],wins:wm.wins}); await idbSave('webos-state-v1',data);}catch{} }
async function restore(){ try{ const raw=await idbLoad('webos-state-v1'); if(!raw) return; const d=JSON.parse(raw); if(d.vfs) vfs=VFS.deserialize(d.vfs); if(d.settings) settings=d.settings; if(d.notes) notes=d.notes; if(d.events) events=d.events; if(d.todos) todos=d.todos; if(d.installed) d.installed.forEach((x:string)=>installed.add(x)); }catch{} }
function toast(msg:string){ const t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),3200); }
function notify(msg:string){ toast(msg); const n=JSON.parse(localStorage.getItem('webos-notifs')||'[]'); n.unshift({msg,at:Date.now()}); localStorage.setItem('webos-notifs',JSON.stringify(n.slice(0,30))); }
export const WALLPAPERS:{id:string;name:string;cls?:string;url?:string}[]=[
 {id:'moss',name:'苔光花园',cls:'wp-moss'}, {id:'default',name:'深蓝渐变'}, {id:'sunset',name:'日落渐变',cls:'wp-sunset'}, {id:'forest',name:'森林渐变',cls:'wp-forest'},
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
interface Acct{ name:string; passHash?:string }
function hashPw(s:string){ let h=5381; for(let i=0;i<s.length;i++) h=((h<<5)+h+s.charCodeAt(i))|0; return 'h'+(h>>>0).toString(16); }
function getAcct():Acct{ try{ const a=JSON.parse(localStorage.getItem('webos-account')||'null'); if(a&&a.name) return a; }catch{} return {name:'Ryan'}; }
function setAcct(a:Acct){ localStorage.setItem('webos-account', JSON.stringify(a)); }
function isLoggedIn(){ return localStorage.getItem('webos-loggedin')==='1'; }
function showBoot(){ const b=document.createElement('div'); b.className='boot'; b.innerHTML='<div class="logo">W</div><div style="font-size:22px;font-weight:600">WebOS</div><div class="barwrap"><div class="bar"></div></div><div style="opacity:.75;font-size:13px">正在启动系统…</div>'; document.body.appendChild(b); }
function showLogin(){ if(document.querySelector('.login')) return; const d=document.createElement('div'); d.className='login'; document.body.appendChild(d);
  const drawLogin=(err='')=>{ const acct=getAcct(); d.innerHTML=`<div class="card"><div class="avatar">${esc(acct.name.slice(0,1).toUpperCase()||'W')}</div><h2 style="margin:6px 0">${esc(acct.name)}</h2><p class="muted">模拟账户 · 本机登录, 不连接真实服务</p><input type="password" data-a="pw" placeholder="密码${acct.passHash?'':' (尚未设置密码: 任意输入或留空)'}"><p class="muted" data-a="err" style="color:#dc2626;min-height:18px">${esc(err)}</p><div class="row" style="justify-content:center"><button class="btn primary" data-a="go">登录</button><button class="btn" data-a="guest">访客进入</button><button class="btn" data-a="reg">注册新账户</button></div></div>`;
    const enter=(mode:string)=>{ localStorage.setItem('webos-loggedin','1'); toast('欢迎, '+getAcct().name+(mode==='guest'?' (访客模式)':'')); d.remove(); };
    d.querySelector('[data-a="go"]')!.addEventListener('click',()=>{ const pw=(d.querySelector('[data-a="pw"]') as HTMLInputElement).value; const acct2=getAcct(); if(acct2.passHash && hashPw(pw)!==acct2.passHash){ drawLogin('密码不正确, 请重试 (或用访客进入)'); return; } enter('user'); });
    d.querySelector('[data-a="guest"]')!.addEventListener('click',()=>enter('guest'));
    d.querySelector('[data-a="reg"]')!.addEventListener('click',()=>drawRegister());
    (d.querySelector('[data-a="pw"]') as HTMLInputElement).addEventListener('keydown',(e)=>{ if(e.key==='Enter') (d.querySelector('[data-a="go"]') as HTMLElement).click(); });
    (d.querySelector('[data-a="pw"]') as HTMLInputElement).focus(); };
  const drawRegister=(err='')=>{ d.innerHTML=`<div class="card"><div class="avatar">+</div><h2 style="margin:6px 0">注册模拟账户</h2><p class="muted">账户只保存在这台设备的浏览器里, 密码仅存本机哈希, 不上传。</p><input data-a="rn" placeholder="用户名" style="margin-bottom:8px"><input type="password" data-a="rp" placeholder="设置密码" style="margin-bottom:8px"><input type="password" data-a="rp2" placeholder="再输入一次密码"><p class="muted" style="color:#dc2626;min-height:18px">${esc(err)}</p><div class="row" style="justify-content:center"><button class="btn primary" data-a="do">注册并登录</button><button class="btn" data-a="back">返回登录</button></div></div>`;
    d.querySelector('[data-a="back"]')!.addEventListener('click',()=>drawLogin());
    d.querySelector('[data-a="do"]')!.addEventListener('click',()=>{ const name=(d.querySelector('[data-a="rn"]') as HTMLInputElement).value.trim(); const pw=(d.querySelector('[data-a="rp"]') as HTMLInputElement).value; const pw2=(d.querySelector('[data-a="rp2"]') as HTMLInputElement).value; if(!name) return drawRegister('用户名不能为空'); if(pw.length<3) return drawRegister('密码至少 3 位 (模拟账户, 别用真实密码)'); if(pw!==pw2) return drawRegister('两次密码不一致'); setAcct({name, passHash:hashPw(pw)}); localStorage.setItem('webos-loggedin','1'); toast('注册成功, 欢迎 '+name); d.remove(); const ab=$('#acctBtn'); if(ab) ab.textContent='👤 '+name; });
    (d.querySelector('[data-a="rn"]') as HTMLInputElement).focus(); };
  drawLogin(); }
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
 {id:'clock',name:'时钟',icon:'🕐',desc:'本地时钟、世界时钟、秒表与倒计时',version:'1.2.0',caps:[],render:renderClock},
 {id:'todo',name:'待办',icon:'✅',desc:'待办清单, 自动保存, 可导出到文件',version:'1.2.0',caps:['storage'],render:renderTodo},
 {id:'paint',name:'画板',icon:'🎨',desc:'SVG 画板, 作品可保存到虚拟文件系统',version:'1.2.0',caps:['vfs.write'],render:renderPaint},
 {id:'music',name:'音乐',icon:'🎵',desc:'WebAudio 合成钢琴, 可弹奏与播放旋律',version:'1.2.0',caps:[],render:renderMusic},
 {id:'snake',name:'贪吃蛇',icon:'🐍',desc:'经典贪吃蛇小游戏, 支持触控按钮',version:'1.2.0',caps:[],render:renderSnake},
 {id:'websearch',name:'WebSearch',icon:'🧭',desc:'模拟浏览器: 模拟搜索与模拟站点 (不联网, 不请求真实网站)',version:'1.5.0',caps:[],render:renderWebSearch},
 {id:'weather',name:'天气',icon:'🌤️',desc:'天气界面演示 (本地模拟数据, 未连接天气服务)',version:'1.2.0',caps:[],render:renderWeather},
 {id:'store',name:'应用中心',icon:'🛍️',desc:'已安装应用目录，可安装/卸载扩展应用',version:'1.0.0',caps:[],render:renderStore},
];
APPS.forEach(a=>installed.add(a.id));

function openApp(appId:string, arg?:any){
  const app=APPS.find(a=>a.id===appId); if(!app) return;
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
  el.innerHTML=`<div class="win-head"><div class="tls"><button class="tl tclose" data-a="close" aria-label="关闭">×</button><button class="tl tmin" data-a="min" aria-label="最小化">−</button><button class="tl tmax" data-a="max" aria-label="最大化">+</button></div><b class="win-title">${esc(app.name)}</b><span class="win-sp"></span></div><div class="win-body"></div><div class="rz-e"></div><div class="rz-s"></div><div class="rz-se"></div>`;
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
  syncWins();
}
function syncWins(){ const ta=$('#topApp'); if(ta){ const aw=wm.active(); const an=aw? APPS.find(a=>a.id===aw.appId)?.name : ''; ta.textContent=an||'桌面'; } for(const w of wm.wins){ const el=document.querySelector(`[data-win="${w.id}"]`) as HTMLElement; if(el){ el.style.zIndex=String(w.z); el.style.left=w.x+'px'; el.style.top=w.y+'px'; el.style.width=w.w+'px'; el.style.height=w.h+'px'; el.classList.toggle('minimized',!!w.minimized); el.classList.toggle('active', wm.active()?.id===w.id); } } syncDock(); }
function syncDock(){ const dock=$('.dock'); if(!dock) return; dock.querySelectorAll('button').forEach(b=>{ const id=(b as HTMLElement).dataset.app; b.classList.toggle('running', wm.wins.some(w=>w.appId===id)); }); }

// ---- Apps ----
let lastFilesPath='/home/user';
function refreshFilesWin(){ const w=wm.findByApp('files'); if(!w) return; const app=APPS.find(a=>a.id==='files'); if(app) renderWindow(w,app,{path:lastFilesPath}); }
function renderFiles(body:HTMLElement,ctx:any){
  let cwd=ctx.arg?.path||'/home/user'; let sel=''; let view='list';
  const PLACES=[{p:'/home/user',n:'个人主页',i:'🏠'},{p:'/home/user/Desktop',n:'桌面',i:'🖥️'},{p:'/home/user/Documents',n:'文稿',i:'📄'},{p:'/home/user/.trash',n:'回收站',i:'🗑️'}];
  const labelFor=(acc:string,pt:string)=> acc==='/home/user'?'主页':acc==='/home/user/Desktop'?'桌面':acc==='/home/user/Documents'?'文稿':acc==='/home/user/.trash'?'回收站':pt;
  const crumbs=(pp:string)=>{ if(pp==='/') return `<button class="crumb" data-crumb="/">根目录</button>`; const parts=pp.split('/').filter(Boolean); let acc=''; return `<button class="crumb" data-crumb="/">根目录</button>`+parts.map(pt=>{ acc+='/'+pt; return ` <span class="muted">›</span> <button class="crumb" data-crumb="${esc(acc)}">${esc(labelFor(acc,pt))}</button>`; }).join(''); };
  const joinP=(name:string)=> (cwd.replace(/\/$/,'')+'/'+name);
  const draw=()=>{ lastFilesPath=cwd; const inTrash=cwd==='/home/user/.trash'; let items:any[]=[]; let err=''; try{ items=vfs.list(cwd); }catch(e:any){ err=e.message; }
    body.innerHTML=`<div class="finder"><aside class="fside"><div class="fside-t">个人收藏</div>${PLACES.map(pl=>`<button class="fplace ${cwd===pl.p?'on':''}" data-place="${pl.p}">${pl.i} ${pl.n}</button>`).join('')}<div class="fside-t">位置</div><button class="fplace ${cwd==='/'?'on':''}" data-place="/">🗂 根目录</button><button class="fplace ${cwd==='/home'?'on':''}" data-place="/home">🏠 home</button></aside>
    <div class="fmain"><div class="fbar"><button class="btn" data-a="up">← 上级</button><div class="crumbs">${crumbs(cwd)}</div><input placeholder="搜索文件" data-a="q" class="fsearch"><span class="seg"><button data-a="vlist">☰ 列表</button><button data-a="vgrid">▦ 网格</button></span></div>
    <div class="row" style="margin:8px 0"><button class="btn" data-a="newfile">＋ 新建文件</button><button class="btn" data-a="newdir">＋ 新建文件夹</button><label class="btn">导入<input type="file" hidden data-a="import"></label><span class="muted">${items.length} 个项目${inTrash?' · 恢复后回到个人主页':''}${cwd==='/home/user/Desktop'?' · 这里的文件会显示在桌面上':''}</span></div>
    ${err?`<p class="muted">${esc(err)}</p>`:''}
    <div class="fhead"><span>名称</span><span>大小</span><span>类型</span><span>操作</span></div>
    <div class="flist">${items.map(n=>`<div class="frow ${sel===n.name?'on':''}" data-row="${esc(n.name)}"><span class="fname">${n.type==='dir'?'📁':'📄'} ${esc(n.name)}</span><span class="muted">${n.type==='file'?n.content.length+' B':'—'}</span><span class="muted">${n.type==='dir'?'文件夹':'文件'}</span><span class="fops">${inTrash?`<button class="btn" data-restore="${esc(n.name)}">恢复</button><button class="btn" data-purge="${esc(n.name)}">彻底删除</button>`:`<button class="btn" data-open="${esc(n.name)}">打开</button><button class="btn" data-rename="${esc(n.name)}">重命名</button><button class="btn" data-del="${esc(n.name)}">删除</button>${n.type==='file'?`<button class="btn" data-exp="${esc(n.name)}">导出</button>`:''}`}</span></div>`).join('')||'<p class="muted" style="padding:10px">此文件夹为空</p>'}</div></div></div>`;
    const after=()=>{ persist(); draw(); renderDeskIcons(); };
    const openName=(name:string)=>{ const node=vfs.resolve(joinP(name)); if(!node) return; if(node.type==='dir'){ cwd=vfs.pathOf(node); sel=''; draw(); } else openApp('editor',{path:vfs.pathOf(node)}); };
    body.querySelectorAll('[data-place]').forEach(b=>b.addEventListener('click',()=>{ cwd=(b as HTMLElement).dataset.place!; sel=''; draw(); }));
    body.querySelectorAll('[data-crumb]').forEach(b=>b.addEventListener('click',()=>{ cwd=(b as HTMLElement).dataset.crumb!; sel=''; draw(); }));
    body.querySelector('[data-a="up"]')!.addEventListener('click',()=>{ cwd=cwd==='/'?'/':cwd.slice(0,cwd.lastIndexOf('/'))||'/'; sel=''; draw(); });
    body.querySelector('[data-a="newfile"]')!.addEventListener('click',()=>{ const n=prompt('文件名'); if(n){ try{vfs.createFile(joinP(n),''); after();}catch(e:any){alert(e.message)} } });
    body.querySelector('[data-a="newdir"]')!.addEventListener('click',()=>{ const n=prompt('文件夹名'); if(n){ try{vfs.mkdir(joinP(n)); after();}catch(e:any){alert(e.message)} } });
    body.querySelectorAll('[data-row]').forEach(r=>{ r.addEventListener('click',(e)=>{ if((e.target as HTMLElement).closest('button')) return; sel=(r as HTMLElement).dataset.row!; draw(); }); r.addEventListener('dblclick',()=>{ if(!inTrash) openName((r as HTMLElement).dataset.row!); }); });
    body.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openName((b as HTMLElement).dataset.open!)));
    body.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{ try{ vfs.remove(joinP((b as HTMLElement).dataset.del!)); after(); }catch(e:any){alert(e.message)} }));
    body.querySelectorAll('[data-restore]').forEach(b=>b.addEventListener('click',()=>{ try{ vfs.restore((b as HTMLElement).dataset.restore!); after(); }catch(e:any){alert(e.message)} }));
    body.querySelectorAll('[data-purge]').forEach(b=>b.addEventListener('click',()=>{ if(confirm('永久删除? 此操作不可恢复')){ try{ vfs.remove(joinP((b as HTMLElement).dataset.purge!),'/',false); after(); }catch(e:any){alert(e.message)} } }));
    body.querySelectorAll('[data-rename]').forEach(b=>b.addEventListener('click',()=>{ const old=(b as HTMLElement).dataset.rename!; const nn=prompt('新名称',old); if(nn){ try{vfs.rename(joinP(old),nn); after();}catch(e:any){alert(e.message)} } }));
    body.querySelectorAll('[data-exp]').forEach(b=>b.addEventListener('click',()=>{ const name=(b as HTMLElement).dataset.exp!; try{ download(name, vfs.readFile(joinP(name))); }catch(e:any){alert(e.message)} }));
    const imp=body.querySelector('[data-a="import"]') as HTMLInputElement; imp.addEventListener('change',async()=>{ const f=imp.files?.[0]; if(!f) return; if(f.size>2*1024*1024){alert('文件过大（>2MB）');return;} const txt=await f.text(); vfs.createFile(joinP(f.name),txt); after(); });
    const q=body.querySelector('[data-a="q"]') as HTMLInputElement; q.addEventListener('input',()=>{ const fl=body.querySelector('.flist'); if(!fl) return; if(!q.value){ draw(); return; } const res=vfs.search(q.value); fl.innerHTML=res.map(n=>`<div class="frow"><span class="fname">${n.type==='dir'?'📁':'📄'} ${esc(vfs.pathOf(n))}</span><span></span><span></span><span class="fops"><button class="btn" data-jump="${esc(vfs.pathOf(n))}" data-t="${n.type}">前往</button></span></div>`).join('')||'<p class="muted" style="padding:10px">无结果</p>'; fl.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>{ const pth=(b as HTMLElement).dataset.jump!; if((b as HTMLElement).dataset.t==='dir'){ cwd=pth; draw(); } else openApp('editor',{path:pth}); })); });
    const vl=body.querySelector('[data-a="vlist"]') as HTMLElement; const vg=body.querySelector('[data-a="vgrid"]') as HTMLElement;
    if(vl&&vg){ vl.classList.toggle('on',view==='list'); vg.classList.toggle('on',view==='grid');
      vl.addEventListener('click',()=>{ view='list'; draw(); }); vg.addEventListener('click',()=>{ view='grid'; draw(); });
      if(view==='grid'){ const fh=body.querySelector('.fhead') as HTMLElement; if(fh) fh.style.display='none'; const fl=body.querySelector('.flist'); if(fl){ fl.className='fgrid'; fl.innerHTML=items.map(n=>`<button class="ftile ${sel===n.name?'on':''}" data-row="${esc(n.name)}"><span>${n.type==='dir'?'📁':'📄'}</span>${esc(n.name)}</button>`).join('')||'<p class="muted">此文件夹为空</p>'; fl.querySelectorAll('[data-row]').forEach(r=>{ r.addEventListener('click',()=>{ sel=(r as HTMLElement).dataset.row!; draw(); }); r.addEventListener('dblclick',()=>{ if(!inTrash) openName((r as HTMLElement).dataset.row!); }); }); } } }
  }; draw();
}

function download(name:string,content:string,mime='text/plain'){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type:mime})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); }
function renderEditor(body:HTMLElement,ctx:any){
  let path=ctx.arg?.path||''; let dirty=false; let autoT:any=null;
  body.innerHTML=`<div class="ed-wrap"><aside class="ed-side"><b>文件</b><ul class="list" data-a="flist" style="margin-top:8px"></ul><button class="btn" data-a="refresh" style="width:100%">刷新列表</button></aside><div class="ed-main"><div class="row"><input data-a="path" placeholder="文件名, 如 /home/user/文档.md" value="${esc(path)}" style="flex:1;min-width:140px"><button class="btn" data-a="new">新建</button><button class="btn primary" data-a="save">保存 Ctrl+S</button><button class="btn" data-a="saveas">另存为</button><button class="btn" data-a="exp">导出</button></div><div class="row" style="margin:6px 0"><label><input type="checkbox" data-a="md" style="width:auto"> Markdown 预览</label><label><input type="checkbox" data-a="autosave" style="width:auto"> 自动保存</label><input data-a="find" placeholder="在文档中搜索" style="flex:1;min-width:120px"><span class="muted" data-a="findres"></span></div><div class="ed-edit"><textarea data-a="ta" placeholder="在此输入文本 / Markdown... (# 标题, **粗体**, - 列表)"></textarea><div class="md-preview" data-a="prev" style="display:none"></div></div><p class="muted" data-a="st"></p></div></div>`;
  const ta=body.querySelector('[data-a="ta"]') as HTMLTextAreaElement; const st=body.querySelector('[data-a="st"]')!; const pathInp=body.querySelector('[data-a="path"]') as HTMLInputElement; const prev=body.querySelector('[data-a="prev"]') as HTMLElement;
  const updPrev=()=>{ if((body.querySelector('[data-a="md"]') as HTMLInputElement).checked){ prev.style.display='block'; prev.innerHTML=renderMarkdown(ta.value); } else prev.style.display='none'; };
  const fileList=()=>{ const files=vfs.search('').filter(n=>n.type==='file');
    const groups:{t:string;test:(p2:string)=>boolean}[]=[{t:'桌面',test:p2=>p2.startsWith('/home/user/Desktop/')},{t:'文稿',test:p2=>p2.startsWith('/home/user/Documents/')},{t:'个人主页',test:p2=>p2.startsWith('/home/user/')&&!p2.startsWith('/home/user/Desktop/')&&!p2.startsWith('/home/user/Documents/')},{t:'其他',test:()=>true}];
    const used=new Set<string>(); let html='';
    for(const g of groups){ const fs2=files.filter(n=>{ const pp=vfs.pathOf(n); return !used.has(pp)&&g.test(pp); }); fs2.forEach(n=>used.add(vfs.pathOf(n))); if(fs2.length) html+=`<li class="ed-group">${g.t}</li>`+fs2.map(n=>`<li style="padding:2px 6px"><button class="btn ed-file" data-f="${esc(vfs.pathOf(n))}">${esc(n.name)}</button></li>`).join(''); }
    (body.querySelector('[data-a="flist"]')!).innerHTML=html||'<li class="muted">暂无文件</li>'; body.querySelectorAll('[data-f]').forEach(b=>b.addEventListener('click',()=>load((b as HTMLElement).dataset.f!))); };
  const load=(p2:string)=>{ if(dirty && !confirm('当前文件有未保存修改, 仍要打开 '+p2+' ?')) return; try{ ta.value=vfs.readFile(p2); path=p2; pathInp.value=p2; dirty=false; st.textContent='已打开 '+p2; updPrev(); }catch(e:any){ alert(e.message); } };
  const save=(quiet=false)=>{ const p2=pathInp.value.trim()||path; if(!p2){ showSavePanel(); return; } try{ vfs.writeFile(p2,ta.value); path=p2; dirty=false; st.textContent='已保存 '+p2+' · '+new Date().toLocaleTimeString(); persist(); fileList(); renderDeskIcons(); refreshFilesWin(); if(!quiet) toast('已保存'); }catch(e:any){ alert(e.message); } };
  const showSavePanel=()=>{ body.querySelector('.savepanel')?.remove(); const dirs=vfs.dirs(); let loc=path? (path.slice(0,path.lastIndexOf('/'))||'/') : '/home/user'; if(!dirs.includes(loc)) loc='/home/user'; const name0=(pathInp.value.trim().split('/').pop())||'未命名.md';
    const panel=document.createElement('div'); panel.className='savepanel';
    panel.innerHTML=`<div class="sp-card"><h3>储存文档</h3><label>名称<input data-sp="name" value="${esc(name0)}" style="width:100%;margin-top:4px"></label><div class="sp-loc">${dirs.map(d=>{ const depth=d.split('/').filter(Boolean).length; const lbl=d==='/home/user'?'🏠 个人主页':d==='/home/user/Desktop'?'🖥️ 桌面':d==='/home/user/Documents'?'📄 文稿':'📁 '+(d.split('/').pop()||'根目录'); return `<button data-loc="${esc(d)}" class="${d===loc?'on':''}" style="padding-left:${10+Math.max(0,depth-2)*16}px">${lbl} <span class="muted">${esc(d)}</span></button>`; }).join('')}</div><div class="row"><button class="btn" data-sp="newdir">在此新建文件夹</button><span style="flex:1"></span><button class="btn" data-sp="cancel">取消</button><button class="btn primary" data-sp="ok">储存</button></div><p class="muted" data-sp="hint">${loc==='/home/user/Desktop'?'存在「桌面」的文件会同时显示在桌面上':''}</p></div>`;
    body.appendChild(panel);
    panel.querySelectorAll('[data-loc]').forEach(b=>b.addEventListener('click',()=>{ loc=(b as HTMLElement).dataset.loc!; panel.querySelectorAll('[data-loc]').forEach(x=>x.classList.toggle('on',(x as HTMLElement).dataset.loc===loc)); (panel.querySelector('[data-sp="hint"]')!).textContent=loc==='/home/user/Desktop'?'存在「桌面」的文件会同时显示在桌面上':''; }));
    panel.querySelector('[data-sp="newdir"]')!.addEventListener('click',()=>{ const n=prompt('文件夹名'); if(!n) return; try{ vfs.mkdir((loc==='/'?'':loc)+'/'+n); persist(); panel.remove(); showSavePanel(); }catch(e:any){ alert(e.message); } });
    panel.querySelector('[data-sp="cancel"]')!.addEventListener('click',()=>panel.remove());
    panel.querySelector('[data-sp="ok"]')!.addEventListener('click',()=>{ const nm=(panel.querySelector('[data-sp="name"]') as HTMLInputElement).value.trim(); if(!nm){ alert('请输入文件名'); return; } pathInp.value=(loc==='/'?'':loc)+'/'+nm; panel.remove(); save(); });
    (panel.querySelector('[data-sp="name"]') as HTMLInputElement).focus(); };
  if(path) load(path); fileList(); updPrev();
  ta.addEventListener('input',()=>{ dirty=true; st.textContent='未保存的修改 * · '+ta.value.length+' 字'; updPrev(); if((body.querySelector('[data-a="autosave"]') as HTMLInputElement).checked && (pathInp.value.trim()||path)){ clearTimeout(autoT); autoT=setTimeout(()=>save(true),900); } });
  body.querySelector('[data-a="save"]')!.addEventListener('click',()=>save());
  body.querySelector('[data-a="saveas"]')!.addEventListener('click',()=>showSavePanel());
  body.querySelector('[data-a="new"]')!.addEventListener('click',()=>{ if(dirty && !confirm('有未保存修改, 仍要新建?')) return; ta.value=''; path=''; pathInp.value='/home/user/未命名.md'; dirty=false; st.textContent='新文件: 在文件名框确认路径后点保存'; ta.focus(); updPrev(); });
  body.querySelector('[data-a="refresh"]')!.addEventListener('click',fileList);
  body.querySelector('[data-a="exp"]')!.addEventListener('click',()=>download((pathInp.value.trim()||path).split('/').pop()||'untitled.txt',ta.value));
  (body.querySelector('[data-a="md"]') as HTMLInputElement).addEventListener('change',updPrev);
  body.querySelector('[data-a="find"]')!.addEventListener('input',(e)=>{ const q=(e.target as HTMLInputElement).value; (body.querySelector('[data-a="findres"]')!).textContent=q? (ta.value.split(q).length-1)+' 处匹配':''; });
  body.addEventListener('keydown',(e)=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='s'){ e.preventDefault(); save(); } });
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
function deleteAccount(){ if(!confirm('注销账户? 将删除本机保存的模拟账户与密码, 需要重新注册才能登录。文件与数据会保留 (如需全清请用「格式化」)。')) return; localStorage.removeItem('webos-account'); localStorage.removeItem('webos-loggedin'); toast('账户已注销'); showLogin(); }
function formatSystem(){ if(!confirm('格式化 WebOS? 将清空全部虚拟文件、便笺、日历、待办、设置、桌面布局与账户, 恢复出厂状态。')) return; if(!confirm('再次确认: 此操作不可恢复, 确定格式化?')) return;
  vfs=new VFS(); settings={theme:'system',wallpaper:'moss',fontScale:1,dockPosition:'bottom',desktopIcons:true}; notes=[{id:uid(),title:'欢迎便笺',body:'WebOS 便笺会自动保存，刷新后恢复。',tags:['welcome'],updatedAt:Date.now()}]; events=[]; todos=[]; installed=new Set(APPS.map(a=>a.id)); desk={items:seedItems(APPS),pos:{}}; saveDesk();
  for(const k of ['webos-account','webos-loggedin','webos-notifs','webos-sysprofile']) localStorage.removeItem(k);
  persist(); toast('已格式化, 正在重启…'); setTimeout(()=>location.reload(),600); }
function renderSettings(body:HTMLElement){
  let sec='account';
  const draw=()=>{
    const acct=getAcct(); const prof=getProfile(); const u=sysUsage(0);
    const nav:[string,string][]=[['account','👤 账户'],['appearance','🎨 外观'],['storage','💾 储存与备份'],['system','🖥 系统信息'],['danger','⚠️ 维护']];
    let main='';
    if(sec==='account') main=`<h3>账户 (模拟)</h3><div class="row"><div class="avatar" style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700">${esc(acct.name.slice(0,1).toUpperCase()||'W')}</div><div style="flex:1;min-width:160px"><input data-a="acctname" value="${esc(acct.name)}" aria-label="显示名"></div><button class="btn" data-a="acctsave">保存名称</button><button class="btn" data-a="logout">退出登录</button></div><div class="row" style="margin-top:8px"><input type="password" data-a="acctpw" placeholder="设置/修改登录密码 (模拟, 仅存本机哈希)" style="flex:1;min-width:180px"><button class="btn" data-a="acctpwbtn">保存密码</button></div><p class="muted">本机模拟账户 (WebOS ID), 不连接真实服务, 不上传数据。锁屏后: 已设密码需输入该密码, 未设密码任意输入可登录, 也可访客进入。注销账户在「维护」页。</p>`;
    if(sec==='appearance') main=`<h3>外观</h3><div class="row"><label>主题 <select data-a="theme"><option value="light">浅色</option><option value="dark">深色</option><option value="system">跟随系统</option></select></label><label>字体缩放 <select data-a="fs"><option value="0.9">小</option><option value="1">标准</option><option value="1.15">大</option></select></label><label>Dock 位置 <select data-a="dock"><option value="bottom">底部</option><option value="left">左侧</option></select></label></div><label style="display:block;margin-top:10px">壁纸 <select data-a="wp">${WALLPAPERS.map(w=>`<option value="${w.id}">${w.name}</option>`).join('')}</select></label><div class="wpgrid" style="margin-top:8px">${WALLPAPERS.map(w=>`<button data-wp="${w.id}" class="${settings.wallpaper===w.id?'sel':''}" style="background:${w.url? 'url('+w.url+') center/cover' : w.cls==='wp-moss'?'linear-gradient(160deg,#1d3b2a,#65a30d)':w.cls==='wp-sunset'?'linear-gradient(160deg,#7c2d12,#db2777)':w.cls==='wp-forest'?'linear-gradient(160deg,#14532d,#16a34a)':w.cls==='wp-slate'?'linear-gradient(160deg,#0f172a,#334155)':w.cls==='wp-rose'?'linear-gradient(160deg,#881337,#e11d48)':w.cls==='wp-violet'?'linear-gradient(160deg,#2e1065,#7c3aed)':w.cls==='wp-teal'?'linear-gradient(160deg,#042f2e,#0d9488)':'linear-gradient(160deg,#1e3a8a,#2563eb)'}">${w.name}</button>`).join('')}</div>`;
    if(sec==='storage') main=`<h3>储存与备份</h3><p>虚拟文件总大小: ${vfs.totalSize()} 字节 · 文件节点: ${vfs.nodes.size} · 便笺: ${notes.length} · 日历事件: ${events.length} · 待办: ${todos.length}</p><p>储存空间 (模拟总量): ${u.storageUsedGB.toFixed(2)} / ${prof.storageGB} GB 已用 (${u.storagePct}%)</p><div class="sysbar" style="max-width:420px"><i style="width:${Math.min(100,u.storagePct)}%"></i></div><div class="row" style="margin-top:10px"><button class="btn primary" data-a="backup">导出完整备份 JSON</button><label class="btn">恢复备份<input type="file" hidden data-a="restore" accept=".json"></label><button class="btn" data-a="reset">恢复默认设置</button></div><p class="muted">备份包含虚拟文件、设置、便笺、日历、待办。恢复前会先校验格式, 失败不会覆盖现有数据。</p>`;
    if(sec==='system') main=`<h3>系统信息 (虚拟硬件 · 模拟)</h3><ul class="list"><li><span>芯片 CPU</span><b>${prof.cpu} · ${prof.cores} 核</b></li><li><span>图形 GPU</span><b>${prof.gpu}</b></li><li><span>内存</span><b>${prof.ramGB} GB (当前模拟占用 ${u.ramUsedGB.toFixed(1)} GB)</b></li><li><span>储存</span><b>${prof.storageGB} GB (已用 ${u.storageUsedGB.toFixed(2)} GB)</b></li><li><span>系统</span><b>WebOS 1.5.0 · 默认风格 极光玻璃</b></li></ul><p class="muted">以上为本机生成的虚拟硬件档案, 储存在本地; 实时占用曲线请看「任务管理器」。CPU/GPU/内存占用为模拟值, 储存已用量 = 系统保留 3.2 GB + 你的虚拟文件大小。</p><h3 style="margin-top:14px">快捷键</h3><p class="muted">Ctrl/Cmd+K 全局搜索 · Ctrl/Cmd+, 打开设置 · 编辑器 Ctrl/Cmd+S 保存 · Esc 关闭菜单 · 桌面: 单击选中, 双击打开, 长按 0.32 秒打开项目菜单。</p>`;
    if(sec==='danger') main=`<h3>维护</h3><div class="dangerbox"><b>注销账户</b><p class="muted">删除本机保存的模拟账户与密码, 退出到登录页, 之后需要重新注册。文件与数据保留。</p><button class="btn" data-a="delacct">注销账户</button></div><div class="dangerbox"><b>格式化</b><p class="muted">清空全部虚拟文件、便笺、日历、待办、设置、桌面布局与账户, 恢复出厂状态。此操作不可恢复。</p><button class="btn danger" data-a="format">格式化 WebOS</button></div>`;
    body.innerHTML=`<div class="setwrap"><aside class="setnav"><div class="setprofile"><div class="avatar" style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:700">${esc(acct.name.slice(0,1).toUpperCase()||'W')}</div><div style="min-width:0"><b>${esc(acct.name)}</b><div class="muted" style="font-size:12px">WebOS ID (模拟)</div></div></div>${nav.map(n=>`<button class="setitem ${sec===n[0]?'on':''}" data-sec="${n[0]}">${n[1]}</button>`).join('')}</aside><div class="setpane">${main}</div></div>`;
    body.querySelectorAll('[data-sec]').forEach(b=>b.addEventListener('click',()=>{ sec=(b as HTMLElement).dataset.sec!; draw(); }));
    if(sec==='account'){
      body.querySelector('[data-a="acctsave"]')!.addEventListener('click',()=>{ const v=(body.querySelector('[data-a="acctname"]') as HTMLInputElement).value.trim(); if(v){ setAcct({...getAcct(), name:v}); toast('账户名称已更新'); const ab=$('#acctBtn'); if(ab) ab.textContent='👤 '+v; draw(); } });
      body.querySelector('[data-a="logout"]')!.addEventListener('click',()=>logout());
      body.querySelector('[data-a="acctpwbtn"]')!.addEventListener('click',()=>{ const v=(body.querySelector('[data-a="acctpw"]') as HTMLInputElement).value; if(v.length<3){ alert('密码至少 3 位'); return; } const a=getAcct(); a.passHash=hashPw(v); setAcct(a); toast('登录密码已保存 (本机模拟)'); });
    }
    if(sec==='appearance'){
      const th=body.querySelector('[data-a="theme"]') as HTMLSelectElement; th.value=settings.theme; th.addEventListener('change',()=>{settings.theme=th.value as any; applyTheme(); persist();});
      const wp=body.querySelector('[data-a="wp"]') as HTMLSelectElement; wp.value=settings.wallpaper; wp.addEventListener('change',()=>{settings.wallpaper=wp.value; applyTheme(); persist();});
      const fs=body.querySelector('[data-a="fs"]') as HTMLSelectElement; fs.value=String(settings.fontScale); fs.addEventListener('change',()=>{settings.fontScale=parseFloat(fs.value); applyTheme(); persist();});
      const dk=body.querySelector('[data-a="dock"]') as HTMLSelectElement; dk.value=settings.dockPosition; dk.addEventListener('change',()=>{settings.dockPosition=dk.value as any; applyTheme(); persist();});
      body.querySelectorAll('[data-wp]').forEach(b=>b.addEventListener('click',()=>{ settings.wallpaper=(b as HTMLElement).dataset.wp!; applyTheme(); persist(); draw(); }));
    }
    if(sec==='storage'){
      body.querySelector('[data-a="backup"]')!.addEventListener('click',()=>{ const bk=makeBackup({vfs:vfs.serialize(),settings,notes,events,todos}); download('webos-backup.json',JSON.stringify(bk,null,2),'application/json'); });
      const rs=body.querySelector('[data-a="restore"]') as HTMLInputElement; rs.addEventListener('change',async()=>{ const f=rs.files?.[0]; if(!f) return; try{ const txt=await f.text(); const obj=JSON.parse(txt); if(!validateBackup(obj)) throw new Error('备份格式无效或过大'); if(!confirm('恢复将覆盖当前数据, 确定继续?')) return; vfs=VFS.deserialize(obj.vfs); settings=obj.settings; notes=obj.notes; events=obj.events; if(obj.todos) todos=obj.todos; applyTheme(); persist(); toast('恢复成功'); draw(); }catch(e:any){ alert('恢复失败, 原数据未改动: '+e.message); } });
      body.querySelector('[data-a="reset"]')!.addEventListener('click',()=>{ if(confirm('恢复默认设置?')){ settings={theme:'system',wallpaper:'moss',fontScale:1,dockPosition:'bottom',desktopIcons:true}; applyTheme(); persist(); draw(); } });
    }
    if(sec==='danger'){
      body.querySelector('[data-a="delacct"]')!.addEventListener('click',()=>deleteAccount());
      body.querySelector('[data-a="format"]')!.addEventListener('click',()=>formatSystem());
    }
  }; draw();
}

function renderTasks(body:HTMLElement,ctx:any){ let tick=0; const draw=()=>{ const u=sysUsage(tick); const p=getProfile(); const bar=(label:string,val:string,pct:number)=>`<div class="sysrow"><span>${label}</span><div class="sysbar"><i style="width:${Math.min(100,Math.max(0,pct))}%"></i></div><b>${val}</b></div>`;
    body.innerHTML=`<h3 style="margin:2px 0 8px">系统资源 <span class="muted" style="font-weight:400">(模拟数据, 随打开窗口数变化)</span></h3><div class="sysbox">${bar('CPU · '+p.cpu+' ('+p.cores+' 核)', u.cpuPct+'%', u.cpuPct)}${bar('内存', u.ramUsedGB.toFixed(1)+' / '+p.ramGB+' GB', u.ramPct)}${bar('GPU · '+p.gpu, u.gpuPct+'%', u.gpuPct)}${bar('储存', u.storageUsedGB.toFixed(2)+' / '+p.storageGB+' GB', u.storagePct)}</div><h3 style="margin:14px 0 8px">运行中的窗口</h3>`+(wm.wins.length? `<ul class="list">${wm.wins.map(w=>`<li><b>${esc(w.title)}</b><span class="muted">${w.appId} · ${w.minimized?'最小化':'可见'} · ${w.w}x${w.h}</span><button class="btn" data-f="${w.id}">切换到</button><button class="btn" data-c="${w.id}">关闭</button></li>`).join('')}</ul>`:'<p>当前没有运行中的应用。</p>');
    body.querySelectorAll('[data-f]').forEach(b=>b.addEventListener('click',()=>{ wm.focus((b as HTMLElement).dataset.f!); syncWins(); }));
    body.querySelectorAll('[data-c]').forEach(b=>b.addEventListener('click',()=>{ const id=(b as HTMLElement).dataset.c!; wm.close(id); document.querySelector(`[data-win="${id}"]`)?.remove(); syncDock(); draw(); }));
  }; draw(); const iv=setInterval(()=>{ if(!document.body.contains(body)){ clearInterval(iv); return; } tick++; draw(); },2000); }

function renderStore(body:HTMLElement){ const all=APPS; body.innerHTML=`<ul class="list">${all.map(a=>`<li><span style="font-size:22px">${a.icon}</span><div style="flex:1"><b>${esc(a.name)}</b> <span class="muted">v${a.version}</span><br><span class="muted">${esc(a.desc)} · 能力：${a.caps.join(', ')||'无'}</span></div>${installed.has(a.id)?`<button class="btn" data-open="${a.id}">打开</button>${!isCoreApp(a.id)?`<button class="btn" data-un="${a.id}">卸载</button>`:`<span class="muted">系统应用</span>`}`:`<button class="btn primary" data-in="${a.id}">安装</button>`}</li>`).join('')}</ul><p class="muted">首版应用包来自本地目录，不联网下载；架构预留了清单/能力字段供扩展。</p>`;
  body.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openApp((b as HTMLElement).dataset.open!)));
  body.querySelectorAll('[data-in]').forEach(b=>b.addEventListener('click',()=>{ const nid=(b as HTMLElement).dataset.in!; installed.add(nid); if(!desk.items.some(i=>i.kind==='app'&&i.ref===nid)){ const na=APPS.find(a=>a.id===nid); if(na) desk.items=[...desk.items, appItem(na)]; saveDesk(); } persist(); renderStore(body); renderDeskIcons(); toast('安装成功'); }));
  body.querySelectorAll('[data-un]').forEach(b=>b.addEventListener('click',()=>{ uninstallApp((b as HTMLElement).dataset.un!); renderStore(body); }));
}


function renderClock(body:HTMLElement){
  body.innerHTML=`<div class="row"><button class="btn" data-tab="now">时钟</button><button class="btn" data-tab="world">世界时钟</button><button class="btn" data-tab="sw">秒表</button><button class="btn" data-tab="timer">倒计时</button></div><div data-a="pane" style="margin-top:14px"></div>`;
  const pane=body.querySelector('[data-a="pane"]') as HTMLElement; let iv:any=null; const clear=()=>{ if(iv){ clearInterval(iv); iv=null; } };
  const show=(tab:string)=>{ clear();
    if(tab==='now'){ pane.innerHTML=`<p style="font-size:42px;margin:10px 0" data-a="big"></p><p class="muted" data-a="date"></p>`; const f=()=>{ const n=new Date(); (pane.querySelector('[data-a="big"]')!).textContent=n.toLocaleTimeString(); (pane.querySelector('[data-a="date"]')!).textContent=n.toLocaleDateString()+' '+['周日','周一','周二','周三','周四','周五','周六'][n.getDay()]; }; f(); iv=setInterval(f,500); }
    if(tab==='world'){ const cities:[string,string][]=[['北京','Asia/Shanghai'],['东京','Asia/Tokyo'],['伦敦','Europe/London'],['纽约','America/New_York'],['洛杉矶','America/Los_Angeles'],['悉尼','Australia/Sydney']]; pane.innerHTML=cities.map(c=>`<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--border);padding:8px 0"><b>${c[0]}</b><span data-city="${c[1]}"></span></div>`).join(''); const f=()=>{ pane.querySelectorAll('[data-city]').forEach(el=>{ try{ el.textContent=new Date().toLocaleTimeString('zh-CN',{timeZone:(el as HTMLElement).dataset.city}); }catch{ el.textContent='—'; } }); }; f(); iv=setInterval(f,1000); }
    if(tab==='sw'){ let start=0, elapsed=0, run=false; const laps:string[]=[]; pane.innerHTML=`<p style="font-size:36px" data-a="disp">00:00.0</p><div class="row"><button class="btn primary" data-a="tg">开始</button><button class="btn" data-a="lap">计次</button><button class="btn" data-a="rst">重置</button></div><ul class="list" data-a="laps" style="margin-top:10px"></ul>`; const disp=pane.querySelector('[data-a="disp"]')!; const fmt=(ms:number)=>{ const m=Math.floor(ms/60000), s=Math.floor(ms/1000)%60, d=Math.floor(ms/100)%10; return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'.'+d; }; iv=setInterval(()=>{ if(run) disp.textContent=fmt(elapsed+Date.now()-start); },100);
      pane.querySelector('[data-a="tg"]')!.addEventListener('click',(e)=>{ if(!run){ start=Date.now(); run=true; (e.target as HTMLElement).textContent='暂停'; } else { elapsed+=Date.now()-start; run=false; (e.target as HTMLElement).textContent='继续'; } });
      pane.querySelector('[data-a="lap"]')!.addEventListener('click',()=>{ laps.unshift(fmt(elapsed+(run?Date.now()-start:0))); (pane.querySelector('[data-a="laps"]')!).innerHTML=laps.map((l,i)=>`<li>第 ${laps.length-i} 次 · ${l}</li>`).join(''); });
      pane.querySelector('[data-a="rst"]')!.addEventListener('click',()=>{ run=false; elapsed=0; laps.length=0; disp.textContent='00:00.0'; (pane.querySelector('[data-a="laps"]')!).innerHTML=''; (pane.querySelector('[data-a="tg"]') as HTMLElement).textContent='开始'; }); }
    if(tab==='timer'){ pane.innerHTML=`<div class="row"><input type="number" data-a="min" value="5" min="0" style="width:90px"> 分钟 <input type="number" data-a="sec" value="0" min="0" max="59" style="width:90px"> 秒</div><p style="font-size:36px" data-a="disp">05:00</p><div class="row"><button class="btn primary" data-a="tg">开始倒计时</button><button class="btn" data-a="rst">重置</button></div>`; let remain=300, run=false, last=0; const disp=pane.querySelector('[data-a="disp"]')!; const fmt=()=>{ disp.textContent=String(Math.floor(remain/60)).padStart(2,'0')+':'+String(remain%60).padStart(2,'0'); }; fmt();
      iv=setInterval(()=>{ if(!run) return; const now=Date.now(); if(now-last>=1000){ last=now; remain--; fmt(); if(remain<=0){ run=false; remain=0; fmt(); notify('倒计时结束!'); alert('⏰ 倒计时结束!'); (pane.querySelector('[data-a="tg"]') as HTMLElement).textContent='开始倒计时'; } } },200);
      pane.querySelector('[data-a="tg"]')!.addEventListener('click',(e)=>{ if(!run){ if(remain<=0){ remain=(parseInt((pane.querySelector('[data-a="min"]') as HTMLInputElement).value)||0)*60+(parseInt((pane.querySelector('[data-a="sec"]') as HTMLInputElement).value)||0); } last=Date.now(); run=true; (e.target as HTMLElement).textContent='暂停'; fmt(); } else { run=false; (e.target as HTMLElement).textContent='继续'; } });
      pane.querySelector('[data-a="rst"]')!.addEventListener('click',()=>{ run=false; remain=(parseInt((pane.querySelector('[data-a="min"]') as HTMLInputElement).value)||0)*60+(parseInt((pane.querySelector('[data-a="sec"]') as HTMLInputElement).value)||0); fmt(); (pane.querySelector('[data-a="tg"]') as HTMLElement).textContent='开始倒计时'; }); }
  };
  body.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>show((b as HTMLElement).dataset.tab!)));
  show('now');
}
function renderTodo(body:HTMLElement){
  const draw=(filter='all')=>{ const list=todos.filter(x=>filter==='all'||(filter==='open'?!x.done:x.done));
    body.innerHTML=`<div class="row"><input data-a="inp" placeholder="输入待办, 回车添加" style="flex:1"><button class="btn primary" data-a="add">添加</button></div><div class="row" style="margin:8px 0"><button class="btn" data-f="all">全部 ${todos.length}</button><button class="btn" data-f="open">未完成 ${todos.filter(x=>!x.done).length}</button><button class="btn" data-f="done">已完成</button><button class="btn" data-a="exp">导出到文件</button><button class="btn" data-a="clear">清除已完成</button></div><ul class="list">${list.map(x=>`<li><input type="checkbox" data-tg="${x.id}" ${x.done?'checked':''} style="width:auto"><span style="flex:1;${x.done?'text-decoration:line-through':''}">${esc(x.text)}</span><button class="btn" data-del="${x.id}">删除</button></li>`).join('')||'<li class="muted">暂无待办</li>'}</ul>`;
    const add=()=>{ const inp=body.querySelector('[data-a="inp"]') as HTMLInputElement; const v=inp.value.trim(); if(!v) return; todos.unshift({id:uid(),text:v,done:false,createdAt:Date.now()}); persist(); draw(filter); };
    body.querySelector('[data-a="add"]')!.addEventListener('click',add);
    (body.querySelector('[data-a="inp"]') as HTMLInputElement).addEventListener('keydown',(e)=>{ if(e.key==='Enter') add(); });
    body.querySelectorAll('[data-f]').forEach(b=>b.addEventListener('click',()=>draw((b as HTMLElement).dataset.f!)));
    body.querySelectorAll('[data-tg]').forEach(c=>c.addEventListener('change',()=>{ const x=todos.find(y=>y.id===(c as HTMLElement).dataset.tg); if(x){ x.done=(c as HTMLInputElement).checked; persist(); draw(filter); } }));
    body.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{ todos=todos.filter(y=>y.id!==(b as HTMLElement).dataset.del); persist(); draw(filter); }));
    body.querySelector('[data-a="clear"]')!.addEventListener('click',()=>{ todos=todos.filter(x=>!x.done); persist(); draw(filter); });
    body.querySelector('[data-a="exp"]')!.addEventListener('click',()=>{ const md='# 待办清单\n\n'+todos.map(x=>`- [${x.done?'x':' '}] ${x.text}`).join('\n'); vfs.writeFile('/home/user/todo.md',md); persist(); toast('已导出到 /home/user/todo.md'); });
  }; draw();
}
function renderPaint(body:HTMLElement){
  let color='#2563eb', width=4, drawing=false, cur:any=null; const paths:{d:string;c:string;w:number}[]=[];
  body.innerHTML=`<div class="row">${['#2563eb','#dc2626','#16a34a','#f59e0b','#7c3aed','#0f172a'].map(c=>`<button class="btn" data-c="${c}" style="background:${c};width:38px;min-width:38px" aria-label="颜色"></button>`).join('')}<label>粗细 <input type="range" data-a="w" min="1" max="16" value="4" style="width:110px"></label><button class="btn" data-a="undo">撤销</button><button class="btn" data-a="clear">清空</button><button class="btn primary" data-a="save">保存到文件</button><button class="btn" data-a="exp">导出 SVG</button></div><svg data-a="cv" style="width:100%;height:340px;background:#fff;border:1px solid var(--border);border-radius:10px;touch-action:none;margin-top:8px"></svg><p class="muted">在白色区域拖动绘画。作品以 SVG 文本保存进虚拟文件系统, 可在文件管理器里看到。</p>`;
  const svg=body.querySelector('[data-a="cv"]') as unknown as SVGSVGElement;
  const redraw=()=>{ svg.innerHTML=paths.map(p=>`<path d="${p.d}" stroke="${p.c}" stroke-width="${p.w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join(''); };
  const pt=(e:PointerEvent)=>{ const r=svg.getBoundingClientRect(); return {x:Math.round((e.clientX-r.left)/r.width*600), y:Math.round((e.clientY-r.top)/r.height*340)}; };
  svg.addEventListener('pointerdown',(e)=>{ drawing=true; const p0=pt(e); cur={d:`M ${p0.x} ${p0.y}`,c:color,w:width}; paths.push(cur); redraw(); });
  svg.addEventListener('pointermove',(e)=>{ if(!drawing||!cur) return; const p0=pt(e); cur.d+=` L ${p0.x} ${p0.y}`; redraw(); });
  addEventListener('pointerup',()=>{ drawing=false; cur=null; });
  svg.setAttribute('viewBox','0 0 600 340');
  body.querySelectorAll('[data-c]').forEach(b=>b.addEventListener('click',()=>{ color=(b as HTMLElement).dataset.c!; }));
  (body.querySelector('[data-a="w"]') as HTMLInputElement).addEventListener('input',(e)=>{ width=parseInt((e.target as HTMLInputElement).value)||4; });
  body.querySelector('[data-a="undo"]')!.addEventListener('click',()=>{ paths.pop(); redraw(); });
  body.querySelector('[data-a="clear"]')!.addEventListener('click',()=>{ paths.length=0; redraw(); });
  const svgText=()=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340" width="600" height="340"><rect width="600" height="340" fill="white"/>${paths.map(p=>`<path d="${p.d}" stroke="${p.c}" stroke-width="${p.w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`;
  body.querySelector('[data-a="save"]')!.addEventListener('click',()=>{ vfs.writeFile('/home/user/drawing.svg',svgText()); persist(); toast('已保存到 /home/user/drawing.svg'); });
  body.querySelector('[data-a="exp"]')!.addEventListener('click',()=>download('drawing.svg',svgText(),'image/svg+xml'));
}
function renderMusic(body:HTMLElement){
  let ctxA:AudioContext|null=null; const NOTES:[string,number][]=[['C4',261.63],['D4',293.66],['E4',329.63],['F4',349.23],['G4',392],['A4',440],['B4',493.88],['C5',523.25]];
  body.innerHTML=`<p class="muted">WebAudio 实时合成的声音, 不是录音文件。点琴键发声, 或播放演示旋律《小星星》。</p><div class="row">${NOTES.map(n=>`<button class="btn" data-n="${n[1]}" style="height:90px;min-width:46px">${n[0]}</button>`).join('')}</div><div class="row" style="margin-top:10px"><button class="btn primary" data-a="play">▶ 播放《小星星》</button><button class="btn" data-a="stop">停止</button></div>`;
  let timers:any[]=[]; const tone=(f:number,at=0,dur=0.35)=>{ try{ ctxA=ctxA||new AudioContext(); const o=ctxA.createOscillator(); const g=ctxA.createGain(); o.type='triangle'; o.frequency.value=f; g.gain.setValueAtTime(0.22,ctxA.currentTime+at); g.gain.exponentialRampToValueAtTime(0.001,ctxA.currentTime+at+dur); o.connect(g); g.connect(ctxA.destination); o.start(ctxA.currentTime+at); o.stop(ctxA.currentTime+at+dur+0.05); }catch{} };
  body.querySelectorAll('[data-n]').forEach(b=>b.addEventListener('click',()=>tone(parseFloat((b as HTMLElement).dataset.n!))));
  body.querySelector('[data-a="play"]')!.addEventListener('click',()=>{ const melody:[string,number][]=[['C4',1],['C4',1],['G4',1],['G4',1],['A4',1],['A4',1],['G4',2],['F4',1],['F4',1],['E4',1],['E4',1],['D4',1],['D4',1],['C4',2]]; let t=0; for(const [n,b] of melody){ const f=NOTES.find(x=>x[0]===n)![1]; const id=setTimeout(()=>tone(f,0,b*0.32),t*320); timers.push(id); t+=b; } });
  body.querySelector('[data-a="stop"]')!.addEventListener('click',()=>{ timers.forEach(clearTimeout); timers=[]; });
}
function renderSnake(body:HTMLElement){
  const N=15, CELL=20; let snake=[{x:7,y:7}], dir={x:1,y:0}, food={x:11,y:7}, score=0, iv:any=null, dead=false;
  body.innerHTML=`<div class="row"><button class="btn primary" data-a="start">开始 / 重新开始</button><span>得分: <b data-a="score">0</b></span><span class="muted">方向键 / WASD / 触控按钮</span></div><canvas data-a="cv" width="300" height="300" style="background:#0f172a;border-radius:10px;margin-top:8px;max-width:100%"></canvas><div class="row" style="justify-content:center;margin-top:6px"><button class="btn" data-d="0,-1">↑</button></div><div class="row" style="justify-content:center"><button class="btn" data-d="-1,0">←</button><button class="btn" data-d="0,1">↓</button><button class="btn" data-d="1,0">→</button></div>`;
  const cv=body.querySelector('[data-a="cv"]') as HTMLCanvasElement; const g=cv.getContext('2d')!;
  const draw=()=>{ g.fillStyle='#0f172a'; g.fillRect(0,0,300,300); g.fillStyle='#f43f5e'; g.fillRect(food.x*CELL+2,food.y*CELL+2,CELL-4,CELL-4); snake.forEach((s,i)=>{ g.fillStyle=i===0?'#4ade80':'#22c55e'; g.fillRect(s.x*CELL+1,s.y*CELL+1,CELL-2,CELL-2); }); if(dead){ g.fillStyle='#fff'; g.font='20px sans-serif'; g.fillText('游戏结束! 得分 '+score,70,150); } };
  const step=()=>{ const head={x:snake[0].x+dir.x, y:snake[0].y+dir.y}; if(head.x<0||head.y<0||head.x>=N||head.y>=N||snake.some(s=>s.x===head.x&&s.y===head.y)){ dead=true; if(iv) clearInterval(iv); draw(); return; } snake.unshift(head); if(head.x===food.x&&head.y===food.y){ score+=10; (body.querySelector('[data-a="score"]')!).textContent=String(score); do{ food={x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)}; }while(snake.some(s=>s.x===food.x&&s.y===food.y)); } else snake.pop(); draw(); };
  body.querySelector('[data-a="start"]')!.addEventListener('click',()=>{ snake=[{x:7,y:7}]; dir={x:1,y:0}; score=0; dead=false; (body.querySelector('[data-a="score"]')!).textContent='0'; if(iv) clearInterval(iv); iv=setInterval(step,140); draw(); cv.focus(); });
  body.querySelectorAll('[data-d]').forEach(b=>b.addEventListener('click',()=>{ const [x,y]=(b as HTMLElement).dataset.d!.split(',').map(Number); if(!(dir.x===-x&&dir.y===-y)) dir={x,y}; }));
  cv.tabIndex=0; cv.addEventListener('keydown',(e)=>{ const map:Record<string,[number,number]>={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]}; const m=map[e.key]; if(m){ e.preventDefault(); if(!(dir.x===-m[0]&&dir.y===-m[1])) dir={x:m[0],y:m[1]}; } });
  draw();
}
function renderWebSearch(body:HTMLElement){
  const SITES:Record<string,{t:string;d:string}>={ 'news.webos':{t:'WebOS 每日资讯',d:'模拟新闻站: 本地新闻、科技与生活资讯 (模拟内容)。'}, 'wiki.webos':{t:'WebOS 百科',d:'模拟百科: 收录 WebOS 系统与应用的词条 (模拟内容)。'}, 'video.webos':{t:'WebOS 视频',d:'模拟视频站: 演示与教程视频列表 (模拟内容, 不能播放)。'}, 'shop.webos':{t:'WebOS 商店',d:'模拟商店: 主题、壁纸与小工具 (模拟内容, 不能购买)。'} };
  let hist:string[]=['home']; let hi=0;
  const fakeResults=(q:string)=>{ const seeds=['入门指南','完整教程','常见问题解答','最新动态','深度评测','官方文档','社区讨论']; return seeds.slice(0,5).map((s,i)=>({ title:`${q} · ${s}`, url:`${['docs','wiki','news','help','blog'][i]}.webos/${encodeURIComponent(q)}-${i+1}`, snip:`这是关于「${q}」的模拟搜索结果第 ${i+1} 条。本浏览器为模拟浏览器, 不连接真实互联网, 内容由本地模板生成。` })); };
  const page=(url:string):string=>{
    if(url==='home') return `<div class="ws-home"><div class="ws-logo">Web<span>Search</span></div><form data-a="sform" class="ws-sbox"><input data-a="q" placeholder="搜索模拟网络…" aria-label="搜索"><button class="btn primary">搜索</button></form><div class="ws-sites">${Object.entries(SITES).map(([u,s])=>`<button data-site="${u}"><b>${s.t}</b><small>${u}</small></button>`).join('')}</div><p class="muted">模拟浏览器 · 不联网 · 结果与站点均为本地模拟内容</p></div>`;
    const site=SITES[url];
    if(site) return `<div class="ws-page"><span class="ws-badge">模拟站点</span><h2>${site.t}</h2><p class="muted">${url}</p><p>${site.d}</p><p>· 头条: WebOS 1.5 带来 macOS 式布局与模拟浏览器。</p><p>· 推荐: 在「桌面」位置储存文件, 打开文件即可在桌面找到它。</p><p>· 提示: 本站所有内容均为模拟, 不代表真实信息。</p></div>`;
    if(url.startsWith('search:')){ const q=url.slice(7); const rs=fakeResults(q); return `<div class="ws-results"><p class="muted">关于「${esc(q)}」的模拟结果 (约 ${rs.length*137} 条, 本地生成)</p>${rs.map(r=>`<div class="ws-r"><button data-open="${esc(r.url)}" class="ws-rt">${esc(r.title)}</button><div class="ws-url">${esc(r.url)}</div><p>${esc(r.snip)}</p></div>`).join('')}</div>`; }
    return `<div class="ws-page"><span class="ws-badge">模拟页面</span><h2>${esc(url)}</h2><p>这是一个模拟页面。本浏览器不会请求真实网站, 地址栏中的内容仅在本机模拟打开。</p><p>你可以通过搜索或访问 .webos 模拟站点来浏览演示内容。</p></div>`;
  };
  const draw=()=>{ const cur=hist[hi]; body.innerHTML=`<div class="ws-bar"><button class="btn" data-a="back" ${hi===0?'disabled':''}>←</button><button class="btn" data-a="fwd" ${hi>=hist.length-1?'disabled':''}>→</button><button class="btn" data-a="home">⌂</button><form data-a="aform" class="ws-addr"><input data-a="addr" value="${cur==='home'?'websearch://home':esc(cur)}" aria-label="地址栏"></form></div><div class="ws-view">${page(cur)}</div>`;
    const go=(u:string)=>{ hist=hist.slice(0,hi+1); hist.push(u); hi++; draw(); };
    body.querySelector('[data-a="back"]')!.addEventListener('click',()=>{ if(hi>0){ hi--; draw(); } });
    body.querySelector('[data-a="fwd"]')!.addEventListener('click',()=>{ if(hi<hist.length-1){ hi++; draw(); } });
    body.querySelector('[data-a="home"]')!.addEventListener('click',()=>go('home'));
    body.querySelector('[data-a="aform"]')!.addEventListener('submit',(e)=>{ e.preventDefault(); const v=(body.querySelector('[data-a="addr"]') as HTMLInputElement).value.trim().replace(/^websearch:\/\//,''); if(!v) return; if(SITES[v]||v==='home') go(v); else if(v.includes('.')) go(v); else go('search:'+v); });
    const sf=body.querySelector('[data-a="sform"]'); if(sf) sf.addEventListener('submit',(e)=>{ e.preventDefault(); const q=(body.querySelector('[data-a="q"]') as HTMLInputElement).value.trim(); if(q) go('search:'+q); });
    body.querySelectorAll('[data-site]').forEach(b=>b.addEventListener('click',()=>go((b as HTMLElement).dataset.site!)));
    body.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>go((b as HTMLElement).dataset.open!)));
  }; draw();
}
function renderWeather(body:HTMLElement){
  const CITIES=['北京','上海','广州','深圳','成都'];
  const draw=(city:string)=>{ const seedBase=city.split('').reduce((a,c)=>a+c.charCodeAt(0),0); const day=Math.floor(Date.now()/86400000); const conds=['晴','多云','晴','阴','小雨','多云','晴间多云']; const mk=(off:number)=>{ const s=seedBase+day+off*7; const cond=conds[Math.abs(s)%conds.length]; const hi=18+Math.abs(s*3)%14; const lo=hi-6-Math.abs(s)%4; return {cond,hi,lo}; };
    const today=mk(0); const days=['今天','明天','后天','第4天','第5天'].map((d,i)=>({d,...mk(i)}));
    body.innerHTML=`<div class="row">${CITIES.map(c=>`<button class="btn" data-city="${c}" ${c===city?'style="border-color:var(--accent)"':''}>${c}</button>`).join('')}</div><div style="text-align:center;padding:16px 0"><div style="font-size:44px">${today.cond==='小雨'?'🌧️':today.cond==='阴'?'☁️':today.cond==='多云'||today.cond==='晴间多云'?'⛅':'☀️'}</div><b style="font-size:22px">${city} · ${today.cond}</b><p style="font-size:30px;margin:6px">${today.lo}° ~ ${today.hi}°</p></div><ul class="list">${days.map(x=>`<li><span style="flex:1">${x.d}</span><span>${x.cond}</span><b>${x.lo}° ~ ${x.hi}°</b></li>`).join('')}</ul><p class="muted">演示数据: 由日期在本地生成的模拟天气, 未连接任何天气服务, 请勿据此安排出行。</p>`;
    body.querySelectorAll('[data-city]').forEach(b=>b.addEventListener('click',()=>draw((b as HTMLElement).dataset.city!))); };
  draw('北京');
}

function shell(){
  appEl.innerHTML=`<header class="topbar"><button id="launcherBtn" aria-label="启动器"> WebOS</button><b id="topApp" style="font-size:14px">桌面</b><button id="searchBtn">🔍 搜索 (Ctrl+K)</button><span style="flex:1"></span><span id="clock"></span><button id="acctBtn">👤</button><button id="lockBtn" aria-label="锁定">🔒</button><button id="notifBtn" aria-label="通知">🔔</button><button id="offline" class="muted" style="display:none">离线</button></header><main class="desktop"><div class="deskicons"></div><div class="dock">${DOCK_IDS.map(id=>APPS.find(a=>a.id===id)).filter(Boolean).map(a=>`<button data-app="${a!.id}"><span class="ic">${a!.icon}</span>${a!.name}<span class="dot"></span></button>`).join('')}</div></main>`;
  applyTheme();
  const clock=()=>{ const e=$('#clock'); if(e) e.textContent=new Date().toLocaleString(); }; clock(); setInterval(clock,1000);
  document.querySelectorAll('.dock button').forEach(b=>b.addEventListener('click',()=>openApp((b as HTMLElement).dataset.app!)));
  renderDeskIcons();
  const ab=$('#acctBtn'); if(ab){ ab.textContent='👤 '+getAcct().name; ab.addEventListener('click',()=>openApp('settings')); }
  const lk=$('#lockBtn'); if(lk) lk.addEventListener('click',()=>logout());
  $('#launcherBtn')!.addEventListener('click',(e)=>{ e.stopPropagation(); if(document.querySelector('.launcher')){ document.querySelectorAll('.launcher').forEach(x=>x.remove()); } else showLauncher(); });
  document.addEventListener('pointerdown',(e)=>{ const t=e.target as HTMLElement; if(!t.closest('.launcher,.searchbox,#launcherBtn,#searchBtn,.ctx')) document.querySelectorAll('.launcher,.searchbox').forEach(x=>x.remove()); });
  $('#searchBtn')!.addEventListener('click',showSearch);
  $('#notifBtn')!.addEventListener('click',()=>{ const n=JSON.parse(localStorage.getItem('webos-notifs')||'[]'); alert(n.length? n.map((x:any)=>new Date(x.at).toLocaleString()+' '+x.msg).join('\n'):'暂无通知'); });
  const desk=$('.desktop')!; desk.addEventListener('contextmenu',(e)=>{ e.preventDefault(); showCtx(e.clientX,e.clientY); });
  desk.addEventListener('dblclick',(e)=>{ const t=e.target as HTMLElement; if(!t.closest('.deskicon,.win,.dock,.launcher,.searchbox,.ctx')) showBlankMenu(e.clientX,e.clientY); });
  addEventListener('online',()=>{ ($('#offline') as HTMLElement).style.display='none'; });
  addEventListener('offline',()=>{ ($('#offline') as HTMLElement).style.display='inline'; toast('当前离线，WebOS 核心功能仍可使用'); });
  addEventListener('keydown',(e)=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); showSearch(); } if((e.metaKey||e.ctrlKey)&&e.key===','){ e.preventDefault(); openApp('settings'); } if(e.key==='Escape'){ document.querySelectorAll('.launcher,.searchbox,.ctx').forEach(x=>x.remove()); } });
}
interface DeskState{ items:DeskItem[]; pos:Record<string,{x:number;y:number}> }
function loadDesk():DeskState{ try{ const d=JSON.parse(localStorage.getItem('webos-deskitems-v2')||'null'); if(d&&Array.isArray(d.items)) return d; }catch{} return {items: seedItems(APPS.filter(a=>installed.has(a.id))), pos:{}}; }
let desk:DeskState=loadDesk();
function saveDesk(){ try{ localStorage.setItem('webos-deskitems-v2', JSON.stringify(desk)); }catch{} }
function deskPos(key:string, idx:number){ return desk.pos[key]||{x:14+(Math.floor(idx/5)*94), y:14+(idx%5)*98}; }
let selectedDeskKey='';
function closeCtx(){ document.querySelectorAll('.ctx').forEach(x=>x.remove()); }
function showCtxMenu(x:number, y:number, html:string){ closeCtx(); const c=document.createElement('div'); c.className='ctx'; c.style.left=Math.min(x,innerWidth-210)+'px'; c.style.top=Math.min(y,innerHeight-300)+'px'; c.innerHTML=html; document.body.appendChild(c); return c; }
function openDeskItem(item:DeskItem){
  if(item.kind==='app'){ openApp(item.ref); return; }
  if(item.kind==='shortcut' && !item.ref.startsWith('/')){ openApp(item.ref); return; }
  const node=vfs.resolve(item.ref);
  if(item.kind==='folder' || (node&&node.type==='dir')) openApp('files',{path:item.ref});
  else openApp('editor',{path:item.ref});
}
function handleDeskClick(item:DeskItem){ const now=Date.now(); const last=(handleDeskClick as any)._t||0; const lastKey=(handleDeskClick as any)._k||'';
  if(lastKey===item.key && now-last<350){ (handleDeskClick as any)._t=0; openDeskItem(item); return; }
  (handleDeskClick as any)._t=now; (handleDeskClick as any)._k=item.key; selectedDeskKey=item.key; renderDeskIcons(); }
function uninstallApp(appId:string){ if(isCoreApp(appId)){ toast('系统应用不可卸载'); return; } installed.delete(appId); for(const w of [...wm.wins].filter(w=>w.appId===appId)){ wm.close(w.id); document.querySelector(`[data-win="${w.id}"]`)?.remove(); } desk.items=removeAppItems(desk.items,appId); persist(); saveDesk(); syncDock(); renderDeskIcons(); const app=APPS.find(a=>a.id===appId); toast('已卸载 '+(app?app.name:appId)); }
function showItemMenu(item:DeskItem, x:number, y:number){
  const isApp=item.kind==='app'; const isSc=item.kind==='shortcut';
  const canUninstall=(isApp||(isSc&&!item.ref.startsWith('/'))) && !isCoreApp(isApp?item.ref:item.ref);
  let html=`<button data-m="open">打开</button>`;
  if(isSc) html+=`<button data-m="del">删除快捷方式</button>`;
  else if(isApp && canUninstall) html+=`<button data-m="uninstall">卸载</button>`;
  else if(isApp) html+=`<button data-m="sysapp">系统应用 (不可卸载)</button>`;
  html+=`<button data-m="rename">重命名</button><button data-m="shortcut">添加快捷方式</button>`;
  if(item.kind==='file'||item.kind==='folder') html+=`<button data-m="del">删除 (进回收站)</button>`;
  html+=`<button data-m="hide">在桌面上隐藏</button>`;
  const c=showCtxMenu(x,y,html);
  c.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ const m=(b as HTMLElement).dataset.m; closeCtx();
    if(m==='open') openDeskItem(item);
    if(m==='sysapp') toast('系统应用不可卸载');
    if(m==='uninstall') uninstallApp(item.ref);
    if(m==='del'){ if(isSc){ desk.items=removeItem(desk.items,item.key); } else { try{ vfs.remove(item.ref); persist(); }catch(e:any){ alert(e.message); return; } desk.items=removeItem(desk.items,item.key); } saveDesk(); renderDeskIcons(); }
    if(m==='rename'){ if(item.kind==='file'||item.kind==='folder'){ const nn=prompt('新名称', item.name); if(nn){ try{ const dir=item.ref.slice(0,item.ref.lastIndexOf('/'))||'/'; vfs.rename(item.ref, nn); desk.items=retargetItem(desk.items, item.key, (dir==='/'?'':dir)+'/'+nn, nn); }catch(e:any){ alert(e.message); return; } persist(); } } else { const nn=prompt('桌面上显示的名称', item.name); if(nn&&nn.trim()) desk.items=renameItem(desk.items, item.key, nn.trim()); } saveDesk(); renderDeskIcons(); }
    if(m==='shortcut'){ const before=desk.items.length; desk.items=addShortcut(desk.items, item, 'sc:'+uid()); if(desk.items.length===before) toast('已存在同名快捷方式'); else { const sc=desk.items[desk.items.length-1]; desk.pos[sc.key]={x:60,y:60}; toast('已添加快捷方式'); } saveDesk(); renderDeskIcons(); }
    if(m==='hide'){ desk.items=hideItem(desk.items,item.key); if(selectedDeskKey===item.key) selectedDeskKey=''; saveDesk(); renderDeskIcons(); toast('已在桌面隐藏 (双击桌面空白处可恢复)'); }
  }));
}
function showBlankMenu(x:number, y:number){
  const hiddenN=desk.items.filter(i=>i.hidden).length;
  const c=showCtxMenu(x,y,`<button data-m="newfile">添加文件</button><button data-m="newfolder">添加文件夹</button>${hiddenN?`<button data-m="unhide">恢复隐藏的项目 (${hiddenN})</button>`:''}<button data-m="wp">更换壁纸</button>`);
  c.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ const m=(b as HTMLElement).dataset.m; closeCtx();
    if(m==='wp'){ openApp('settings'); return; }
    if(m==='unhide'){ desk.items=unhideAll(desk.items); saveDesk(); renderDeskIcons(); return; }
    const isFile=m==='newfile'; const name=prompt(isFile?'文件名':'文件夹名', isFile?'新文件.txt':'新文件夹'); if(!name) return;
    try{ if(!vfs.resolve('/home/user/Desktop')) vfs.mkdir('/home/user/Desktop'); const path='/home/user/Desktop/'+name; if(vfs.resolve(path)){ toast('同名项目已存在'); return; }
      if(isFile) vfs.createFile(path,''); else vfs.mkdir(path); persist();
      desk.items=[...desk.items, {key:(isFile?'file:':'folder:')+path, kind:isFile?'file':'folder', ref:path, name, icon:isFile?'📄':'📁'}];
      desk.pos[(isFile?'file:':'folder:')+path]={x:Math.max(0,x-40), y:Math.max(0,y-60)}; saveDesk(); renderDeskIcons(); toast('已添加到桌面');
    }catch(e:any){ alert(e.message); }
  }));
}
function iconForFile(name:string){ const ext=name.split('.').pop()?.toLowerCase()||''; if(['png','jpg','jpeg','gif','svg','webp'].includes(ext)) return '🖼️'; if(['md','txt'].includes(ext)) return '📝'; if(['mp3','wav'].includes(ext)) return '🎵'; return '📄'; }
function syncDeskFromVfs(){ if(!vfs.resolve('/home/user/Desktop')) return; let changed=false;
  for(const n of vfs.list('/home/user/Desktop')){ const ref='/home/user/Desktop/'+n.name; const kind=n.type==='dir'?'folder':'file'; const ex=desk.items.find(i=>i.ref===ref&&(i.kind==='file'||i.kind==='folder')); if(!ex){ desk.items=[...desk.items,{key:kind+':'+ref,kind,ref,name:n.name,icon:n.type==='dir'?'📁':iconForFile(n.name)}]; changed=true; } else if(ex.name!==n.name){ ex.name=n.name; changed=true; } }
  const before=desk.items.length; desk.items=desk.items.filter(i=>!((i.kind==='file'||i.kind==='folder')&&i.ref.startsWith('/home/user/Desktop/')&&!vfs.resolve(i.ref))); if(desk.items.length!==before) changed=true;
  if(changed) saveDesk(); }
function renderDeskIcons(){ syncDeskFromVfs(); const layer=$('.deskicons'); if(!layer) return; const vis=visibleItems(desk.items); layer.innerHTML=vis.map((it,i)=>{ const pp=deskPos(it.key,i); return `<button class="deskicon ${selectedDeskKey===it.key?'selected':''}" data-key="${esc(it.key)}"><span>${it.icon}</span>${esc(it.name)}${it.kind==='shortcut'?'<small>快捷方式</small>':''}</button>`; }).join('');
  layer.querySelectorAll('[data-key]').forEach(btn=>{ const el=btn as HTMLElement; const item=desk.items.find(x2=>x2.key===el.dataset.key); if(!item) return; el.style.left=(deskPos(item.key,0).x)+'px'; const idx=vis.indexOf(item); el.style.left=deskPos(item.key,idx).x+'px'; el.style.top=deskPos(item.key,idx).y+'px';
    let sx=0,sy=0,ox=0,oy=0,moved=false,longFired=false,timer:any=null;
    el.addEventListener('pointerdown',(e)=>{ sx=e.clientX; sy=e.clientY; ox=parseInt(el.style.left)||0; oy=parseInt(el.style.top)||0; moved=false; longFired=false; timer=setTimeout(()=>{ longFired=true; showItemMenu(item, e.clientX, e.clientY); }, LONG_PRESS_MS);
      const mv=(ev:PointerEvent)=>{ if(longFired) return; const dx=ev.clientX-sx, dy=ev.clientY-sy; if(Math.abs(dx)+Math.abs(dy)>6){ moved=true; clearTimeout(timer); } if(moved){ el.style.left=Math.max(0,ox+dx)+'px'; el.style.top=Math.max(0,oy+dy)+'px'; } };
      const up=()=>{ removeEventListener('pointermove',mv); removeEventListener('pointerup',up); clearTimeout(timer); if(moved){ desk.pos[item.key]={x:parseInt(el.style.left)||0, y:parseInt(el.style.top)||0}; saveDesk(); } else if(!longFired){ handleDeskClick(item); } };
      addEventListener('pointermove',mv); addEventListener('pointerup',up); });
  }); }
function showCtx(x:number,y:number){ showBlankMenu(x,y); }

function showLauncher(){ document.querySelectorAll('.launcher,.searchbox').forEach(e=>e.remove()); const d=document.createElement('div'); d.className='launcher'; d.innerHTML=`<div class="row" style="justify-content:space-between"><h3 style="margin:4px 0 10px">应用启动器</h3><button class="btn" data-a="x">✕ 关闭</button></div><div class="grid">${APPS.filter(a=>installed.has(a.id)).map(a=>`<button data-app="${a.id}"><div style="font-size:26px">${a.icon}</div>${a.name}</button>`).join('')}</div>`; $('.desktop')!.appendChild(d); d.querySelector('[data-a="x"]')!.addEventListener('click',()=>d.remove()); d.querySelectorAll('[data-app]').forEach(b=>b.addEventListener('click',()=>{ d.remove(); openApp((b as HTMLElement).dataset.app!); })); }
function showSearch(){ document.querySelectorAll('.launcher,.searchbox').forEach(e=>e.remove()); const d=document.createElement('div'); d.className='searchbox'; d.innerHTML=`<input placeholder="搜索应用、文件、便笺..." autofocus><ul class="list" style="margin-top:10px"></ul>`; $('.desktop')!.appendChild(d); const inp=d.querySelector('input')!; const list=d.querySelector('.list')!;
  inp.addEventListener('input',()=>{ const q=(inp as HTMLInputElement).value.trim(); if(!q){list.innerHTML='';return;} const apps=APPS.filter(a=>a.name.includes(q)).map(a=>`<li>应用：${esc(a.name)} <button class="btn" data-open="${a.id}">打开</button></li>`); const files=vfs.search(q).slice(0,8).map(n=>`<li>文件：${esc(vfs.pathOf(n))}</li>`); const ns=notes.filter(n=>n.title.includes(q)||n.body.includes(q)).map(n=>`<li>便笺：${esc(n.title)}</li>`); list.innerHTML=[...apps,...files,...ns].join('')||'<li>无结果</li>'; list.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>{ d.remove(); openApp((b as HTMLElement).dataset.open!); })); }); inp.focus(); }

(async()=>{ showBoot(); await restore(); try{ if(installed.has('websearch') && !desk.items.some(i=>i.kind==='app'&&i.ref==='websearch')){ const na=APPS.find(a=>a.id==='websearch'); if(na){ desk.items=[...desk.items, appItem(na)]; saveDesk(); } } }catch{} try{ if(!vfs.resolve('/home/user/Desktop')){ vfs.mkdir('/home/user/Desktop'); persist(); } }catch{} shell(); notify('WebOS 已启动'); if('serviceWorker' in navigator){ try{ await navigator.serviceWorker.register('./sw.js'); }catch{} } setTimeout(()=>{ const b=document.querySelector('.boot'); if(b){ b.classList.add('hide'); setTimeout(()=>b.remove(),500); } if(!isLoggedIn()) showLogin(); },1650); })();
