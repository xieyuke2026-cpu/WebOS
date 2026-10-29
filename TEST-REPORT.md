# TEST REPORT — WebOS 1.0.0 (2026-10-29)

## 自动化测试 (Vitest) — 18/18 通过
命令 `npm test`: vfs 7, terminal 3, window 2, calc 5, backup 1. 覆盖: 文件 CRUD/复制/移动/重命名/回收站恢复/非法路径/路径逃逸/序列化往返/搜索/tree; 终端与 VFS 同数据 (mkdir/cd/echo>/cat/whoami/未知命令/help); 窗口创建/聚焦/最小化/最大化/关闭/边界 clamp; 计算器优先级/括号/除零/拒绝代码注入; 备份校验.

## 构建 — 通过
`npm run build` (tsc -b 0 报错 + vite build): dist/index.html 0.47kB, JS 35.16kB (gzip 12.14kB), CSS 4.48kB. 资源引用为相对路径 ./assets/..., 适配 GitHub Pages 子路径 /WebOS/.

## DOM 烟雾测试 (jsdom, 真实构建产物) — 通过
脚本 tests/jsdom-smoke.mjs 加载 dist 的实际 JS 并模拟点击:
- topbar 渲染: true; Dock 按钮: 9; 时钟有文本
- 点击「文件」: 打开 1 个窗口, 内含 welcome.md
- 点击「终端」: 窗口数变为 2
此前尝试用本机 Chromium 做真浏览器测试: /opt/meta-chromium 启动被 Hatch WebGL domain policy 拦截, puppeteer chrome 下载被网络出口拦截 — 因此真浏览器点击实测标记为「未验证」, 不冒充通过; 上线后以 GitHub Pages 线上访问复核.

## 未验证项
- iPad Safari 真机手感/软键盘 (需 Ryan 在 iPad 上打开 Pages 地址实测)
- Service Worker 离线 (需 https 线上环境复核)
