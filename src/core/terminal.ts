import { VFS } from './vfs'; import { normalizePath } from './path';
export interface TermState{ cwd:string; }
export function tokenize(line:string):string[]{ const out:string[]=[]; let cur=''; let q=false; for(let i=0;i<line.length;i++){ const c=line[i]; if(c==='"'){ q=!q; continue;} if(!q && /\s/.test(c)){ if(cur){out.push(cur);cur='';} continue;} cur+=c; } if(cur) out.push(cur); return out; }
export function execCommand(vfs:VFS, state:TermState, line:string):{output:string; state:TermState; clear?:boolean}{
  const parts=tokenize(line.trim()); if(!parts.length) return {output:'',state};
  const [cmd,...args]=parts;
  try{
    switch(cmd){
      case 'help': return {output:'help clear pwd ls cd mkdir touch cat echo cp mv rm tree date whoami write find stat',state};
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
