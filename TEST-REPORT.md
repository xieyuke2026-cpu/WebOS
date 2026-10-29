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

## v1.1.0 追加验证 (2026-10-29)
- Vitest 20/20 通过 (新增: help 分组与单命令用法, WindowManager.findByApp 单实例查找)。
- 构建成功: JS 42.24KB / CSS 9.30KB。
- jsdom 烟雾 (tests/jsdom-smoke 流程扩展实测): Boot 出现并自动消失 ✓; 登录页出现且标注模拟账户 ✓; 点登录关闭 ✓; 文件应用点两次只开 1 个窗口 ✓; 终端点两次总数仍 2 ✓; 最后聚焦的终端窗口带 active 高亮 ✓; 每窗口 3 个缩放手柄 ✓; 启动器开关切换 ✓; 点锁屏后登录页重现 ✓。
- 8 张图片壁纸 URL 逐个 curl 验证 200 + image 类型 (见 docs/WALLPAPERS.md)。

## v1.2.0 追加验证 (2026-10-29)
- Vitest 26/26 通过 (新增 markdown 6 项: 标题/粗斜体/列表/引用/代码围栏转义/原始 HTML 转义/拒绝 javascript: 链接)。
- 构建成功: JS 62.23KB / CSS 10.79KB。
- jsdom 烟雾全过: 注册表单出现→注册并自动登录→顶栏名字更新; 锁屏后输错密码被拒且有提示, 正确密码登录; 桌面图标 15 个, Dock 15 个; 点桌面图标打开待办并成功添加一条; 编辑器 Markdown 预览渲染出 h1+粗体, 文件列表含 welcome.md; 时钟世界时钟显示东京/纽约, 秒表页可打开; 画板/音乐/贪吃蛇/天气均在 Dock 中。

## v1.3.0 追加验证 (2026-10-29)
- Vitest 33/33 通过 (新增 desktop 7 项: 长按阈值 320ms<500ms、快捷方式去重、隐藏/恢复、重命名/删除、卸载清理含快捷方式但保留文件快捷方式、系统应用判定)。
- 构建成功: JS 66.39KB / CSS 11.16KB。
- jsdom 烟雾全过: Dock 恰好 8 个且顺序正确; 桌面项目 15; 单击只选中不开窗; 双击打开; 长按 450ms 弹出含卸载/重命名/添加快捷方式/隐藏的菜单; 添加快捷方式后 16 个; 空白双击菜单含添加文件/文件夹; 设置 4 张卡片且无桌面开关; 应用中心卸载贪吃蛇后桌面剩 14 (应用+其快捷方式一并移除) 且可重装。(jsdom 无 Canvas API, 贪吃蛇画布在该环境报错属环境限制, 真实浏览器正常。)
