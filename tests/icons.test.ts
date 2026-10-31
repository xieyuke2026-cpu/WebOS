
import { describe,it,expect } from 'vitest';
import { svgIcon, appIcon, fileIcon, ICON_NAMES } from '../src/core/icons';
const APPS=['files','editor','terminal','notes','calendar','settings','tasks','store','calc','clock','todo','paint','music','snake','weather','websearch','photos','reader','typing','convert','pomodoro','passwords','decider','ledger','habits'];
describe('svg icons',()=>{
  it('every app has an svg icon',()=>{ for(const id of APPS) expect(appIcon(id), id).toContain('<svg'); });
  it('ui + file icons exist and use currentColor stroke',()=>{ for(const n of ['home','desktop','trash','search','lock','bell','user']) expect(svgIcon(n)).toContain('currentColor'); for(const k of ['file','folder','image','text','audio'] as const) expect(fileIcon(k)).toContain('<svg'); expect(ICON_NAMES.length).toBeGreaterThanOrEqual(30); });
});
