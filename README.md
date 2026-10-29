# WebOS

浏览器虚拟操作系统 — 纯静态、零后端、IndexedDB 持久化, 适配 iPad 与桌面.

## 运行
```bash
npm install
npm run dev      # 开发
npm test         # 单元测试
npm run build    # 构建到 dist/ (相对路径, 适配 GitHub Pages 子路径)
```

## 功能
桌面/Dock/启动器/全局搜索/通知/右键菜单 · 窗口拖拽/缩放/最小化/最大化 · 虚拟文件系统 (IndexedDB, 回收站, 导入导出) · 文件管理器 · 文本编辑器 · 终端 (连接同一 VFS) · 计算器 (安全解析器) · 便笺 · 本地日历 · 设置 (主题/壁纸/备份恢复) · 任务管理器 · 应用中心

文档: docs/ARCHITECTURE.md · docs/USER_GUIDE.md · docs/ACCEPTANCE.md
