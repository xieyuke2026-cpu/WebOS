// Unified SVG icon set: single stroke style (1.8 width, round caps), currentColor.
const P:Record<string,string>={
files:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
editor:'<path d="M5 19l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L9 18l-4 1z"/><path d="M14.5 6.5l3 3"/>',
terminal:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3"/><path d="M12.5 15H17"/>',
notes:'<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/>',
calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="8.5" cy="14.5" r="0.7" fill="currentColor" stroke="none"/><circle cx="12" cy="14.5" r="0.7" fill="currentColor" stroke="none"/><circle cx="15.5" cy="14.5" r="0.7" fill="currentColor" stroke="none"/>',
settings:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"/>',
tasks:'<path d="M4 20h16"/><path d="M6.5 20v-6M11 20V6M15.5 20V9M20 20"/>',
store:'<path d="M5 8h14l-1.1 11.2A1.8 1.8 0 0 1 16.1 21H7.9a1.8 1.8 0 0 1-1.8-1.8L5 8z"/><path d="M8.5 10.5V6.5a3.5 3.5 0 0 1 7 0v4"/>',
calc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 7h7"/><circle cx="9" cy="11.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="12" cy="11.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="15" cy="11.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="9" cy="15.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="12" cy="15.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="15" cy="15.5" r="0.8" fill="currentColor" stroke="none"/>',
clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
todo:'<path d="M3.5 6l1.3 1.3L7.5 4.6"/><path d="M10.5 6H20"/><path d="M3.5 12l1.3 1.3 2.7-2.7"/><path d="M10.5 12H20"/><path d="M3.5 18l1.3 1.3 2.7-2.7"/><path d="M10.5 18H20"/>',
paint:'<circle cx="12" cy="12" r="8.5"/><circle cx="9" cy="9.8" r="0.9" fill="currentColor" stroke="none"/><circle cx="13.6" cy="8.3" r="0.9" fill="currentColor" stroke="none"/><circle cx="15.8" cy="12.4" r="0.9" fill="currentColor" stroke="none"/><path d="M12 20.5c-1.1 0-1.8-.8-1.8-1.7 0-1.2 1.1-1.8 2.3-1.8h1.6"/>',
music:'<path d="M9.5 18.5V6.2L19 4.2v11.3"/><circle cx="7.2" cy="18.5" r="2.4"/><circle cx="16.7" cy="15.5" r="2.4"/>',
snake:'<rect x="2.5" y="8" width="19" height="9" rx="4.5"/><path d="M7.5 11v3M6 12.5h3"/><circle cx="16.4" cy="11.6" r="0.8" fill="currentColor" stroke="none"/><circle cx="18.2" cy="14" r="0.8" fill="currentColor" stroke="none"/>',
weather:'<circle cx="8" cy="8" r="3"/><path d="M8 2.6v1.3M2.6 8h1.3M4.2 4.2l.9.9"/><path d="M9.5 20h7a3.9 3.9 0 0 0 .7-7.7A5.6 5.6 0 0 0 6.4 14 3.3 3.3 0 0 0 9.5 20z"/>',
websearch:'<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2.1 4.9-4.9 2.1 2.1-4.9z"/>',
photos:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.4"/><path d="M4 17.5l5-4 4 3 3-2.2 4 3.2"/>',
reader:'<path d="M12 6.2C10.2 4.8 8 4.2 4 4.2v13.6c4 0 6.2.6 8 2 1.8-1.4 4-2 8-2V4.2c-4 0-6.2.6-8 2z"/><path d="M12 6.2v13.6"/>',
typing:'<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.9M10 10h.9M14 10h.9M17.6 10h.9M6 14h.9M17.6 14h.9M9.2 14h5.6"/>',
convert:'<path d="M6.5 3.5L3 7l3.5 3.5"/><path d="M3 7h13.5"/><path d="M17.5 20.5L21 17l-3.5-3.5"/><path d="M21 17H7.5"/>',
file:'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/>',
folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
image:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.4"/><path d="M4 17.5l5-4 4 3 3-2.2 4 3.2"/>',
text:'<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/>',
audio:'<path d="M9.5 18.5V6.2L19 4.2v11.3"/><circle cx="7.2" cy="18.5" r="2.4"/><circle cx="16.7" cy="15.5" r="2.4"/>',
home:'<path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/>',
desktop:'<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M9 20.5h6M12 16.5v4"/>',
trash:'<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.9 13.5h9.2L17.5 7"/><path d="M10 11v6M14 11v6"/>',
search:'<circle cx="11" cy="11" r="6.5"/><path d="M15.8 15.8L20.5 20.5"/>',
lock:'<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/><circle cx="12" cy="15.2" r="1.1" fill="currentColor" stroke="none"/>',
bell:'<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 3h-15z"/><path d="M10.2 21a2 2 0 0 0 3.6 0"/>',
user:'<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7.2 7.2 0 0 1 14 0"/>',
};
export function svgIcon(name:string, size=24):string{ const inner=P[name]; if(!inner) return ''; return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`; }
export function appIcon(id:string, size=24):string{ return svgIcon(id, size); }
export function fileIcon(kind:'file'|'folder'|'image'|'text'|'audio', size=20):string{ return svgIcon(kind, size); }
export const ICON_NAMES=Object.keys(P);
