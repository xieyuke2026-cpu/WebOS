export function evaluate(expr:string):number{
  const tokens:(number|string)[]=[]; let i=0;
  while(i<expr.length){ const c=expr[i]; if(/\s/.test(c)){i++;continue;} if(/[0-9.]/.test(c)){ let j=i; while(j<expr.length&&/[0-9.]/.test(expr[j])) j++; const v=parseFloat(expr.slice(i,j)); if(isNaN(v)) throw new Error('Invalid number'); tokens.push(v); i=j; continue;} if('+-*/%()'.includes(c)){ tokens.push(c); i++; continue;} throw new Error('Invalid character: '+c); }
  let pos=0; const peek=()=>tokens[pos]; const next=()=>tokens[pos++];
  function parseExpr():number{ let v=parseTerm(); while(peek()==='+'||peek()==='-'){ const op=next(); const r=parseTerm(); v= op==='+'? v+r: v-r; } return v; }
  function parseTerm():number{ let v=parseFactor(); while(peek()==='*'||peek()==='/'||peek()==='%'){ const op=next(); const r=parseFactor(); if((op==='/'||op==='%')&&r===0) throw new Error('Division by zero'); v= op==='*'? v*r: op==='/'? v/r: v%r; } return v; }
  function parseFactor():number{ const t=next(); if(t==='('){ const v=parseExpr(); if(next()!==')') throw new Error('Missing )'); return v; } if(t==='-') return -parseFactor(); if(t==='+') return parseFactor(); if(typeof t==='number') return t; throw new Error('Unexpected token'); }
  const result=parseExpr(); if(pos<tokens.length) throw new Error('Trailing tokens'); return Math.round(result*1e10)/1e10;
}
