import { JSDOM } from 'jsdom';
import fs from 'fs';
const html = fs.readFileSync('/home/hatch/workspace/webos/dist/index.html','utf8');
const jsFile = fs.readdirSync('/home/hatch/workspace/webos/dist/assets').find(f=>f.endsWith('.js'));
const js = fs.readFileSync('/home/hatch/workspace/webos/dist/assets/'+jsFile,'utf8');
const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', pretendToBeVisual:true });
const { window } = dom;
// minimal stubs
window.matchMedia = window.matchMedia || ((q)=>({matches:false, media:q, addEventListener(){}, removeEventListener(){}}));
window.indexedDB = undefined; // force fallback path; our code catches
try { window.eval(js); } catch(e){ console.log('EVAL ERROR', e.message); }
await new Promise(r=>setTimeout(r,600));
const doc = window.document;
console.log('topbar:', !!doc.querySelector('.topbar'));
console.log('dock buttons:', doc.querySelectorAll('.dock button').length);
console.log('clock text len:', (doc.querySelector('#clock')?.textContent||'').length);
// click files app
const btn = doc.querySelector('.dock button[data-app="files"]');
btn.dispatchEvent(new window.MouseEvent('click',{bubbles:true}));
await new Promise(r=>setTimeout(r,300));
console.log('windows after files click:', doc.querySelectorAll('.win').length);
console.log('files win contains welcome.md:', doc.querySelector('.win')?.textContent.includes('welcome.md'));
const termBtn = doc.querySelector('.dock button[data-app="terminal"]');
termBtn.dispatchEvent(new window.MouseEvent('click',{bubbles:true}));
await new Promise(r=>setTimeout(r,300));
console.log('windows after terminal click:', doc.querySelectorAll('.win').length);
console.log('SMOKE DONE'); process.exit(0);
