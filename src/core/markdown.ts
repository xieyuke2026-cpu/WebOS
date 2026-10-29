// Simple, safe Markdown subset renderer: input is HTML-escaped first, so raw HTML never passes through.
export function escapeHtml(s:string):string{ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function inline(s:string):string{
  let out=escapeHtml(s);
  out=out.replace(/`([^`]+)`/g,'<code>$1</code>');
  out=out.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  out=out.replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em>$2</em>');
  out=out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return out;
}
export function renderMarkdown(src:string):string{
  const lines=src.split('\n'); const html:string[]=[]; let i=0;
  while(i<lines.length){
    const line=lines[i];
    if(/^```/.test(line)){ const buf:string[]=[]; i++; while(i<lines.length && !/^```/.test(lines[i])){ buf.push(lines[i]); i++; } i++; html.push('<pre><code>'+escapeHtml(buf.join('\n'))+'</code></pre>'); continue; }
    const h=line.match(/^(#{1,6})\s+(.*)$/); if(h){ const lvl=h[1].length; html.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`); i++; continue; }
    if(/^\s*(-{3,}|\*{3,})\s*$/.test(line)){ html.push('<hr>'); i++; continue; }
    if(/^>\s?/.test(line)){ const buf:string[]=[]; while(i<lines.length && /^>\s?/.test(lines[i])){ buf.push(inline(lines[i].replace(/^>\s?/,''))); i++; } html.push('<blockquote>'+buf.join('<br>')+'</blockquote>'); continue; }
    if(/^\s*[-*]\s+/.test(line)){ const items:string[]=[]; while(i<lines.length && /^\s*[-*]\s+/.test(lines[i])){ items.push('<li>'+inline(lines[i].replace(/^\s*[-*]\s+/,''))+'</li>'); i++; } html.push('<ul>'+items.join('')+'</ul>'); continue; }
    if(/^\s*\d+[.)]\s+/.test(line)){ const items:string[]=[]; while(i<lines.length && /^\s*\d+[.)]\s+/.test(lines[i])){ items.push('<li>'+inline(lines[i].replace(/^\s*\d+[.)]\s+/,''))+'</li>'); i++; } html.push('<ol>'+items.join('')+'</ol>'); continue; }
    if(line.trim()===''){ i++; continue; }
    const buf:string[]=[]; while(i<lines.length && lines[i].trim()!=='' && !/^(#{1,6}\s|```|>\s?|\s*[-*]\s+|\s*\d+[.)]\s+)/.test(lines[i])){ buf.push(inline(lines[i])); i++; }
    html.push('<p>'+buf.join('<br>')+'</p>');
  }
  return html.join('\n');
}
