
import { describe,it,expect } from 'vitest';
import { cmpVer, VERSIONS, LATEST_VERSION } from '../src/core/version';
describe('version',()=>{
  it('compares versions numerically',()=>{ expect(cmpVer('1.5.0','1.6.0')).toBeLessThan(0); expect(cmpVer('1.6.0','1.6.0')).toBe(0); expect(cmpVer('1.10.0','1.9.0')).toBeGreaterThan(0); });
  it('latest matches first log entry',()=>{ expect(VERSIONS[0].v).toBe(LATEST_VERSION); expect(VERSIONS.length).toBeGreaterThanOrEqual(7); });
});
