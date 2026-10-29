# KNOWN ISSUES

- 窗口布局刷新后不自动重开窗口 (状态已保存 wins, 但首版选择不自动重开以避免弹窗惊吓; 数据/文件/便笺/日历均恢复).
- 编辑器为单文档 + 路径打开, 标签页以多窗口代替 (可同时开多个编辑器窗口).
- Service Worker 在本地 file:// 下不生效, 需 http(s) 访问 (GitHub Pages 满足).
- GitHub Pages 需仓库 Settings 手动启用 (owner 操作), workflow 文件推送可能受 GitHub App workflow 权限限制.
