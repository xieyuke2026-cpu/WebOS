# ENVIRONMENT — 检查于 2026-10-29 (Asia/Shanghai)

- 工作目录: /home/hatch, 项目目录: ~/workspace/webos (检查时不存在, 新建, 未覆盖任何文件)
- Node.js: v24.22.1, npm/npx: 10.9.4, Git: 2.43.0
- 操作系统/环境: Linux VM (Muse 云端环境), 可用 shell, 可写 home
- 浏览器/测试: 环境有 headless Chromium (此前 Hacker World 项目实测过), 本项目用 Vitest 做单元测试, 构建后用本地 http server + headless 检查
- 子 Agent: 环境支持 subagent.spawn 多 Agent 委派; 本项目按角色分工顺序执行 + 独立 QA 测试阶段 (见 ROADMAP), 未假装并行 Agent 的结果
- Git/GitHub: GitHub 连接器已连接, 身份 xieyuke2026-cpu; 目标仓库 xieyuke2026-cpu/WebOS 存在 (2026-10-29 创建, 仅 Initial commit 701713c, main 分支); 通过 snapshot push_files 上传 (限制: UTF-8 文本, 无二进制/删除, workflow 文件可能受 App 权限限制, 若被拒会在交付时说明手动步骤)
- 可复用代码: ~/workspace/hacker-world 是另一个 Vite+TS 项目, 仅参考其 package 配置, WebOS 代码全部新写
- IndexedDB: 浏览器 API, Node 测试环境不可用, 因此持久层做了 localStorage 降级, 纯逻辑在 Node 下可测
