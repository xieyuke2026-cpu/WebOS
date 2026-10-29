# DECISIONS

- 原生 TypeScript + Vite, 不引入框架: 减少依赖, 构建产物小, 适合 GitHub Pages 子路径 (base './').
- VFS 用节点 Map + parentId 树模型而非嵌套对象: 移动/复制/回收站只需改 parentId, 序列化简单.
- 单一状态快照持久化 (VFS+设置+便笺+日历) 到 IndexedDB: 保证备份/恢复与日常持久化用同一格式, 避免多套存储不一致.
- PWA 用手写最小 Service Worker (public/sw.js, 网络优先+缓存兜底), 不引入 workbox.
- 删除默认进回收站 (.trash 目录), 终端 rm 为永久删除并在 help/文档中说明区别.
