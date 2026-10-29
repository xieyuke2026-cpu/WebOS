
import { describe,it,expect } from 'vitest'; import { VFS } from '../src/core/vfs'; import { execCommand } from '../src/core/terminal';
describe('terminal',()=>{ it('ls/pwd/cd and file ops share VFS',()=>{ const v=new VFS(); let s={cwd:'/home/user'}; let r=execCommand(v,s,'mkdir work'); s=r.state; r=execCommand(v,s,'cd work'); s=r.state; expect(s.cwd).toBe('/home/user/work'); r=execCommand(v,s,'echo hello > a.txt'); expect(v.readFile('/home/user/work/a.txt')).toBe('hello'); r=execCommand(v,s,'cat a.txt'); expect(r.output).toBe('hello'); r=execCommand(v,s,'whoami'); expect(r.output).toBe('user'); });
 it('unknown command',()=>{ const v=new VFS(); expect(execCommand(v,{cwd:'/'},'foobar').output).toContain('command not found'); });
 it('help lists commands',()=>{ const v=new VFS(); const o=execCommand(v,{cwd:'/'},'help').output; expect(o).toContain('mkdir'); expect(o).toContain('文件与目录'); expect(o).toContain('系统'); });
 it('help for single command',()=>{ const v=new VFS(); expect(execCommand(v,{cwd:'/'},'help ls').output).toContain('列出目录'); expect(execCommand(v,{cwd:'/'},'help nope').output).toContain('没有这个命令'); });
});
