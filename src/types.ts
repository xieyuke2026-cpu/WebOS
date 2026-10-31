export type NodeType='file'|'dir';
export interface VNode{ id:string; name:string; type:NodeType; parentId:string|null; content:string; createdAt:number; updatedAt:number; }
export interface WinState{ id:string; appId:string; title:string; x:number; y:number; w:number; h:number; z:number; minimized:boolean; maximized:boolean; prev?:{x:number;y:number;w:number;h:number}; }
export interface Settings{ theme:'light'|'dark'|'system'; wallpaper:string; fontScale:number; dockPosition:'bottom'|'left'; desktopIcons?:boolean; dockMag?:{on:boolean;max:number;range:number;sens:number}; }
export interface TodoItem{ id:string; text:string; done:boolean; createdAt:number; }
export interface Note{ id:string; title:string; body:string; tags:string[]; updatedAt:number; }
export interface CalEvent{ id:string; title:string; date:string; time:string; note:string; }
export interface BackupFile{ version:1; exportedAt:string; vfs:any; settings:Settings; notes:Note[]; events:CalEvent[]; todos?:TodoItem[]; }
