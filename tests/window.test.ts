
import { describe,it,expect } from 'vitest'; import { WindowManager } from '../src/core/window';
describe('window manager',()=>{ it('create/focus/min/max/close',()=>{ const wm=new WindowManager(); const a=wm.create('files','Files',1200,800); const b=wm.create('calc','Calc',1200,800); expect(wm.wins.length).toBe(2); wm.focus(a.id); expect(wm.active()?.id).toBe(a.id); wm.minimize(a.id); expect(wm.get(a.id)?.minimized).toBe(true); wm.toggleMax(b.id,1200,800); expect(wm.get(b.id)?.maximized).toBe(true); wm.toggleMax(b.id,1200,800); expect(wm.get(b.id)?.maximized).toBe(false); wm.close(a.id); expect(wm.wins.length).toBe(1); });
 it('findByApp supports single-instance focus',()=>{ const wm=new WindowManager(); const a=wm.create('files','Files'); wm.create('calc','Calc'); expect(wm.findByApp('files')?.id).toBe(a.id); expect(wm.findByApp('notes')).toBeUndefined(); });
 it('clamp keeps window reachable',()=>{ const wm=new WindowManager(); const w=wm.create('x','X'); w.x=99999; w.y=-50; wm.clamp(w,800,600); expect(w.x).toBeLessThan(800); expect(w.y).toBeGreaterThanOrEqual(0); });
});
