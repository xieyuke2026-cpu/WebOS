import { VFS } from './vfs'; import { normalizePath } from './path';
export interface TermState{ cwd:string; }
export function tokenize(line:string):string[]{ const out:string[]=[]; let cur=''; let q=false; for(let i=0;i<line.length;i++){ const c=line[i]; if(c==='"'){ q=!q; continue;} if(!q && /\s/.test(c)){ if(cur){out.push(cur);cur='';} continue;} cur+=c; } if(cur) out.push(cur); return out; }
export const HELP_DETAIL:Record<string,string> = {
  help:'help [命令] — 显示帮助; 带命令名时显示该命令用法', clear:'clear — 清空终端输出', pwd:'pwd — 显示当前目录',
  ls:'ls [路径] — 列出目录内容, 文件夹带 / 后缀', cd:'cd <路径> — 切换目录, 支持相对路径和 ..', mkdir:'mkdir <名> — 新建文件夹',
  touch:'touch <名> — 新建空文件 (已存在则不覆盖)', cat:'cat <文件> — 显示文件内容', echo:'echo <文本> > <文件> — 把文本写入文件; 不带 > 时直接输出',
  write:'write <文件> <文本> — 把文本写入文件', cp:'cp <源> <目标目录> — 复制文件或文件夹', mv:'mv <源> <目标目录> — 移动文件或文件夹',
  rm:'rm <路径> — 永久删除 (不进回收站)', tree:'tree [路径] — 树形显示目录', date:'date — 显示当前日期时间', whoami:'whoami — 显示当前用户',
  find:'find <关键词> — 按文件名和内容搜索', stat:'stat <路径> — 显示文件详情 (大小/时间)',
};
export const HELP_TEXT = [
  'WebOS Terminal — 命令帮助 (help <命令> 查看单个命令用法)',
  '',
  '文件与目录:',
  '  ls [路径]        列出目录内容',
  '  cd <路径>        切换目录 (支持 .. 和相对路径)',
  '  pwd              显示当前目录',
  '  cat <文件>       查看文件内容',
  '  mkdir <名>       新建文件夹',
  '  touch <名>       新建空文件',
  '  echo <文本> > <文件>  写入文本到文件',
  '  write <文件> <文本>   写入文本到文件',
  '  cp <源> <目标目录>    复制',
  '  mv <源> <目标目录>    移动',
  '  rm <路径>        永久删除 (不进回收站)',
  '  tree [路径]      树形显示目录',
  '  find <关键词>    按名称和内容搜索',
  '  stat <路径>      文件详情',
  '',
  '系统:',
  '  date             当前日期时间',
  '  whoami           当前用户',
  '  clear            清空终端',
  '  help [命令]      本帮助',
  '',
  '提示: 终端与文件管理器共用同一份虚拟文件系统, 在任一处修改, 另一处立即可见。',
].join('\n');
export function execCommand(vfs:VFS, state:TermState, line:string):{output:string; state:TermState; clear?:boolean}{
  const parts=tokenize(line.trim()); if(!parts.length) return {output:'',state};
  const [cmd,...args]=parts;
  try{
    switch(cmd){
      case 'help': { if(args[0]){ const h=HELP_DETAIL[args[0]]; return {output: h? h : '没有这个命令: '+args[0]+' (输入 help 查看全部)', state}; } return {output:HELP_TEXT,state}; }
      case 'clear': return {output:'',state,clear:true};
      case 'pwd': return {output:state.cwd,state};
      case 'ls': { const p=args[0]||state.cwd; const items=vfs.list(p,state.cwd); return {output: items.map(n=> n.type==='dir'? n.name+'/': n.name).join('  ')||'(empty)',state}; }
      case 'cd': { const target=args[0]||'/home/user'; const n=vfs.resolve(target,state.cwd); if(!n) throw new Error('No such directory: '+target); if(n.type!=='dir') throw new Error('Not a directory: '+target); return {output:'',state:{cwd:vfs.pathOf(n)}}; }
      case 'mkdir': if(!args[0]) throw new Error('mkdir: missing operand'); vfs.mkdir(args[0],state.cwd); return {output:'',state};
      case 'touch': if(!args[0]) throw new Error('touch: missing operand'); if(!vfs.resolve(args[0],state.cwd)) vfs.createFile(args[0],'',state.cwd); return {output:'',state};
      case 'cat': if(!args[0]) throw new Error('cat: missing operand'); return {output:vfs.readFile(args[0],state.cwd),state};
      case 'echo': { const idx=args.indexOf('>'); if(idx>=0){ const file=args[idx+1]; if(!file) throw new Error('echo: missing file'); vfs.writeFile(file, args.slice(0,idx).join(' '), state.cwd); return {output:'',state}; } return {output:args.join(' '),state}; }
      case 'write': if(args.length<2) throw new Error('write <file> <text>'); vfs.writeFile(args[0], args.slice(1).join(' '), state.cwd); return {output:'',state};
      case 'cp': if(args.length<2) throw new Error('cp <src> <dstDir>'); vfs.copy(args[0],args[1],state.cwd); return {output:'',state};
      case 'mv': if(args.length<2) throw new Error('mv <src> <dstDir>'); vfs.move(args[0],args[1],state.cwd); return {output:'',state};
      case 'rm': if(!args[0]) throw new Error('rm: missing operand'); vfs.remove(args[0],state.cwd,false); return {output:'',state};
      case 'tree': return {output:vfs.tree(args[0]||state.cwd,state.cwd),state};
      case 'date': return {output:new Date().toString(),state};
      case 'whoami': return {output:'user',state};
      case 'find': if(!args[0]) throw new Error('find <query>'); return {output:vfs.search(args[0]).map(n=>vfs.pathOf(n)).join('\n')||'(no results)',state};
      case 'stat': if(!args[0]) throw new Error('stat <path>'); { const s=vfs.stat(args[0],state.cwd); return {output: JSON.stringify(s,null,2),state}; }
      default: return {output:'command not found: '+cmd+' (type help)',state};
    }
  }catch(e:any){ return {output:'Error: '+(e.message||String(e)),state}; }
}
