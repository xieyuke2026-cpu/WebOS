
import { describe,it,expect } from 'vitest'; import { validateBackup, makeBackup } from '../src/core/backup'; import { VFS } from '../src/core/vfs';
describe('backup',()=>{ it('validates good and rejects bad',()=>{ const v=new VFS(); const bk=makeBackup({vfs:v.serialize(),settings:{theme:'light',wallpaper:'default',fontScale:1,dockPosition:'bottom'},notes:[],events:[]}); expect(validateBackup(bk)).toBe(true); expect(validateBackup({version:99})).toBe(false); expect(validateBackup(null)).toBe(false); }); });
