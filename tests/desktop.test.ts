
import { describe,it,expect } from 'vitest';
import { seedItems, addShortcut, hideItem, unhideAll, renameItem, removeItem, removeAppItems, visibleItems, isCoreApp, LONG_PRESS_MS, magScale, DEFAULT_MAG } from '../src/core/desktop';
const apps=[{id:'files',name:'文件',icon:'📁'},{id:'snake',name:'贪吃蛇',icon:'🐍'}];
describe('desktop items',()=>{
  it('long press threshold is shorter than Edge (~500ms)',()=>{ expect(LONG_PRESS_MS).toBeLessThan(500); expect(LONG_PRESS_MS).toBeGreaterThanOrEqual(250); });
  it('seed and visible',()=>{ const items=seedItems(apps); expect(items.length).toBe(2); expect(visibleItems(items).length).toBe(2); });
  it('shortcut add + dedupe',()=>{ let items=seedItems(apps); items=addShortcut(items, items[1], 'sc:1'); expect(items.length).toBe(3); expect(items[2].name).toBe('贪吃蛇 快捷方式'); items=addShortcut(items, items[1], 'sc:2'); expect(items.length).toBe(3); });
  it('hide and unhide',()=>{ let items=seedItems(apps); items=hideItem(items,'app:snake'); expect(visibleItems(items).length).toBe(1); items=unhideAll(items); expect(visibleItems(items).length).toBe(2); });
  it('rename and remove',()=>{ let items=seedItems(apps); items=renameItem(items,'app:snake','小蛇'); expect(items[1].name).toBe('小蛇'); items=removeItem(items,'app:snake'); expect(items.length).toBe(1); });
  it('uninstall removes app and its shortcuts but not file shortcuts',()=>{ let items=seedItems(apps); items=addShortcut(items, items[1], 'sc:1'); items=[...items, {key:'file:/home/user/a.txt',kind:'file',ref:'/home/user/a.txt',name:'a.txt',icon:'📄'}]; items=addShortcut(items, items[3], 'sc:2'); const after=removeAppItems(items,'snake'); expect(after.some(i=>i.ref==='snake')).toBe(false); expect(after.some(i=>i.key==='sc:2')).toBe(true); });
  it('core apps cannot be uninstalled',()=>{ expect(isCoreApp('files')).toBe(true); expect(isCoreApp('settings')).toBe(true); expect(isCoreApp('store')).toBe(true); expect(isCoreApp('snake')).toBe(false); });
});

describe('dock magnification',()=>{
  it('peaks at max under the pointer and falls to 1 at range edge',()=>{ expect(magScale(0,DEFAULT_MAG)).toBeCloseTo(1.22,2); expect(magScale(56,DEFAULT_MAG)).toBe(1); expect(magScale(30,DEFAULT_MAG)).toBeLessThan(1.22); expect(magScale(240,DEFAULT_MAG)).toBe(1); });
  it('respects off switch and smaller max',()=>{ expect(magScale(0,{...DEFAULT_MAG,on:false})).toBe(1); expect(magScale(0,{...DEFAULT_MAG,max:1.15})).toBeCloseTo(1.15,2); });
  it('higher sensitivity widens the strong zone',()=>{ const lo=magScale(50,{...DEFAULT_MAG,sens:0.4}); const hi=magScale(50,{...DEFAULT_MAG,sens:1.6}); expect(hi).toBeGreaterThan(lo); });
});
