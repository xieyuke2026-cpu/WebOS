
import { describe,it,expect } from 'vitest'; import { VFS } from '../src/core/vfs';
describe('VFS',()=>{ it('create/read/list',()=>{ const v=new VFS(); v.createFile('/home/user/a.txt','hello'); expect(v.readFile('/home/user/a.txt')).toBe('hello'); expect(v.list('/home/user').map(x=>x.name)).toContain('a.txt'); });
 it('mkdir/copy/move/rename',()=>{ const v=new VFS(); v.mkdir('/home/user/proj'); v.createFile('/home/user/a.txt','x'); v.copy('/home/user/a.txt','/home/user/proj'); expect(v.readFile('/home/user/proj/a.txt')).toBe('x'); v.rename('/home/user/a.txt','b.txt'); expect(v.readFile('/home/user/b.txt')).toBe('x'); v.move('/home/user/b.txt','/home/user/proj'); expect(v.resolve('/home/user/proj/b.txt')).toBeTruthy(); });
 it('delete to trash and restore',()=>{ const v=new VFS(); v.createFile('/home/user/del.txt','d'); v.remove('/home/user/del.txt'); expect(v.resolve('/home/user/del.txt')).toBeUndefined(); expect(v.list('/home/user/.trash').length).toBeGreaterThan(0); v.restore('del.txt'); expect(v.readFile('/home/user/del.txt')).toBe('d'); });
 it('invalid path and duplicate',()=>{ const v=new VFS(); expect(()=>v.readFile('/nope.txt')).toThrow(); expect(()=>v.mkdir('/home/user')).toThrow(); expect(()=>v.rename('/home/user/welcome.md','../bad')).toThrow(); });
 it('path escape stays in root',()=>{ const v=new VFS(); const n=v.resolve('/home/user/../../etc'); expect(n).toBeUndefined(); });
 it('serialize roundtrip',()=>{ const v=new VFS(); v.createFile('/home/user/s.txt','42'); const v2=VFS.deserialize(v.serialize()); expect(v2.readFile('/home/user/s.txt')).toBe('42'); });
 it('search and tree',()=>{ const v=new VFS(); expect(v.search('welcome').length).toBeGreaterThan(0); expect(v.tree('/home/user')).toContain('welcome.md'); });
});
