
import { describe,it,expect } from 'vitest';
import { genProfile, computeUsage } from '../src/core/sysinfo';
describe('sysinfo',()=>{
  it('profile has plausible specs',()=>{ const p=genProfile(()=>0.5); expect(p.cores).toBeGreaterThanOrEqual(8); expect(p.ramGB).toBeGreaterThanOrEqual(8); expect(p.storageGB).toBeGreaterThanOrEqual(128); expect(p.cpu.length).toBeGreaterThan(3); expect(p.gpu.length).toBeGreaterThan(3); });
  it('usage stays in range and grows with windows',()=>{ const p=genProfile(()=>0.5); const u1=computeUsage(p,{windows:1,vfsBytes:1000,tick:1}); const u5=computeUsage(p,{windows:5,vfsBytes:1000,tick:1}); expect(u1.cpuPct).toBeLessThanOrEqual(96); expect(u5.cpuPct).toBeGreaterThan(u1.cpuPct); expect(u5.ramUsedGB).toBeGreaterThan(u1.ramUsedGB); expect(u1.storageUsedGB).toBeGreaterThan(3); expect(u1.storagePct).toBeLessThan(10); });
});
