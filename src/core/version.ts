export interface VerInfo{ v:string; date:string; notes:string; }
export const LATEST_VERSION='1.8.0';
export const VERSIONS:VerInfo[]=[
 {v:'1.8.0', date:'2026-10-31', notes:'Dock 放大可调 (开关/倍数/范围/灵敏度) 且默认更收敛, 放大动画改平滑插值; 图标与拖动动画深度优化; WebSearch 允许打开真实网页 (iframe)。'},
 {v:'1.7.0', date:'2026-10-31', notes:'继续 mac 化: squircle 渐变图标、Dock 放大特效、顶栏菜单、Launchpad 启动器; 流畅性优化 (拖动帧同步/保存防抖/资源条定向更新); 新增极光玻璃动态壁纸。'},
 {v:'1.6.0', date:'2026-10-29', notes:'虚拟硬件可在设置中调节; 模拟站点扩充 (介绍/帮助/应用/开发者); 软件更新页支持版本日志、回退与升级; 新增相册、阅读器、打字练习、单位换算; 天气/音乐/贪吃蛇/便笺更新。'},
 {v:'1.5.0', date:'2026-10-29', notes:'macOS 式布局 (红绿灯/菜单栏/设置双栏); 虚拟 CPU/GPU/内存/储存与任务管理器资源面板; 注销账户与格式化; 模拟浏览器 WebSearch。'},
 {v:'1.4.0', date:'2026-10-29', notes:'默认风格极光玻璃、默认壁纸苔光花园; 桌面成为储存位置; 访达式文件; macOS 式保存面板。'},
 {v:'1.3.0', date:'2026-10-29', notes:'可卸载应用; 桌面单击选中/双击打开/长按菜单; 设置卡片布局; Dock 精简为 8 个应用。'},
 {v:'1.2.0', date:'2026-10-29', notes:'注册界面; 桌面可放置应用; 编辑器储存与 Markdown; 时钟、待办、画板、音乐、贪吃蛇、天气。'},
 {v:'1.1.0', date:'2026-10-29', notes:'终端帮助增强; 15 张壁纸; 玻璃拟态 UI; 启动/操作动画; 模拟账户与登录; 窗口问题修复。'},
 {v:'1.0.0', date:'2026-10-29', notes:'首个版本: 桌面外壳与窗口管理、虚拟文件系统、9 个内置应用、备份恢复、PWA。'},
];
export function cmpVer(a:string,b:string):number{ const pa=a.split('.').map(Number), pb=b.split('.').map(Number); for(let i=0;i<3;i++){ if(pa[i]!==pb[i]) return pa[i]-pb[i]; } return 0; }
