# ARCHITECTURE

分层: types.ts (共享类型) / core/path.ts (路径) / core/vfs.ts (虚拟文件系统, 纯逻辑可测) / core/calc.ts (安全解析器) / core/terminal.ts (命令解释器, 依赖 VFS 接口) / core/window.ts (窗口状态机, 纯逻辑) / core/backup.ts (备份校验) / core/idb.ts (IndexedDB 持久层, 失败降级 localStorage) / main.ts (Desktop Shell + 窗口 DOM 渲染 + 9 个应用的 render 函数, 每个应用只通过 ctx.openApp / vfs / 全局状态通信) / style.css (主题变量).

数据流: UI 操作 -> VFS/状态变更 -> persist() 序列化到 IndexedDB key webos-state-v1 -> 刷新时 restore() 重建. 备份 = 同一份状态的 JSON 导出, 恢复前 validateBackup() 校验版本/结构/大小, 失败不写入.

窗口: WindowManager 维护 z 序/最小化/最大化纯状态, DOM 层负责拖拽/缩放并回写, 小屏 (<700px) 新窗口默认全屏.

安全: 计算器用递归下降解析器, 不用 eval; 终端只操作 VFS, 不执行宿主机命令; 所有用户文本经 esc() 转义后才进 innerHTML 模板.
