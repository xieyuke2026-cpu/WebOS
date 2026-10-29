
import { describe,it,expect } from 'vitest'; import { renderMarkdown } from '../src/core/markdown';
describe('markdown',()=>{
  it('headings and paragraphs',()=>{ const h=renderMarkdown('# Title\n\nhello world'); expect(h).toContain('<h1>Title</h1>'); expect(h).toContain('<p>hello world</p>'); });
  it('bold italic code and link',()=>{ const h=renderMarkdown('**b** *i* `c` [x](https://example.com)'); expect(h).toContain('<strong>b</strong>'); expect(h).toContain('<em>i</em>'); expect(h).toContain('<code>c</code>'); expect(h).toContain('href="https://example.com"'); });
  it('lists and quote and hr',()=>{ const h=renderMarkdown('- a\n- b\n\n> q\n\n---'); expect(h).toContain('<ul><li>a</li><li>b</li></ul>'); expect(h).toContain('<blockquote>q</blockquote>'); expect(h).toContain('<hr>'); });
  it('code fence escapes html',()=>{ const h=renderMarkdown('```\n<script>alert(1)</script>\n```'); expect(h).toContain('&lt;script&gt;'); expect(h).not.toContain('<script>alert'); });
  it('raw html in text is escaped',()=>{ const h=renderMarkdown('a <img src=x onerror=alert(1)> b'); expect(h).not.toContain('<img'); expect(h).toContain('&lt;img'); });
  it('rejects javascript: links',()=>{ const h=renderMarkdown('[x](javascript:alert(1))'); expect(h).not.toContain('href="javascript:'); });
});
