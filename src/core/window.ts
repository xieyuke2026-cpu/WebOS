import type { WinState } from '../types';
export class WindowManager{
  wins:WinState[]=[]; private zTop=10; private seq=0;
  create(appId:string,title:string, vw=1200, vh=800):WinState{ this.seq++; const w=Math.min(720, Math.max(320, vw-80)); const h=Math.min(520, Math.max(260, vh-120)); const win:WinState={id:'win'+this.seq+'-'+Date.now(),appId,title,x:40+ (this.seq%6)*28, y:30+(this.seq%6)*24, w,h,z:++this.zTop,minimized:false,maximized:false}; this.wins.push(win); return win; }
  close(id:string){ this.wins=this.wins.filter(w=>w.id!==id); }
  get(id:string){ return this.wins.find(w=>w.id===id); }
  findByApp(appId:string){ return this.wins.find(w=>w.appId===appId); }
  focus(id:string){ const w=this.get(id); if(w){ w.z=++this.zTop; w.minimized=false; } return w; }
  minimize(id:string){ const w=this.get(id); if(w) w.minimized=true; }
  toggleMax(id:string, vw:number, vh:number){ const w=this.get(id); if(!w) return; if(!w.maximized){ w.prev={x:w.x,y:w.y,w:w.w,h:w.h}; w.x=0; w.y=0; w.w=vw; w.h=vh; w.maximized=true; } else if(w.prev){ Object.assign(w,w.prev); w.maximized=false; } }
  clamp(w:WinState, vw:number, vh:number){ w.w=Math.min(Math.max(w.w,280), vw); w.h=Math.min(Math.max(w.h,200), vh); w.x=Math.min(Math.max(w.x, -w.w+80), vw-60); w.y=Math.min(Math.max(w.y,0), vh-40); return w; }
  active(){ return [...this.wins].filter(w=>!w.minimized).sort((a,b)=>b.z-a.z)[0]; }
}
