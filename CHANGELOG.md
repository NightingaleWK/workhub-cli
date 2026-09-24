# 变更记录

## 未发布

- 规定每项 OpenSpec 工作完成后主动提供发布决策提醒；版本号更新、GitHub 标签和 npm 发包仍由维护者决定。
- 记录单人维护的 OpenSpec 流程、Git 同步和由维护者决定 npm 发布的规则；移除 Hyper-V 交互验收待办。
- 根据当前实现和发布状态修正文档；过时的计划与验证记录保留在 docs/history。


## 0.1.2 — 2026-09-24

- 将 init 预览按工作身份、带说明的 Trellis/work/code 目标目录、管理操作和手动创建的 VS Code 工作区分组；长路径与标签分行显示。

- `wk install` 检测 Trellis；缺失时在获得同意后提供全局安装 `@mindfoldhq/trellis@latest`。
- 为自动化提供显式的 `--install-trellis` 参数；验证安装后的启动入口，并在全局命令目录尚未加入 PATH 时查找 npm 全局包。

- 将带边框的执行计划改为左侧流程线和分组配置详情。
- 确认前显示 Git 用户名及目录的实际创建、保留或关联状态。
- install/init 在写入文件前允许返回修改输入，并将先前答案保留为默认值。

## 0.1.1 — 2026-09-24

- 首次发布到 npm registry。
- 修复回车接受检测到的 Git 用户名，并使测试不受本机 Git 配置影响。

- 每项工作都必须有 Trellis 作为 Codex 主目录和 AGENTS.md 入口；只有 work/code 可选。
- 统一 CLI/API 组成部分请求；CLI 未指定时默认选择 work + Trellis，并支持用 `--components none` 创建仅含 Trellis 的工作。
- 对缺少 Trellis 的旧登记给出提示，不擅自迁移或覆盖文件。
- install 时读取全局 Git 用户名，并传给每个新空间的 `trellis init -u`。

- 修复 Windows 8.3 短路径比较，使 GitHub 托管运行器路径与 Git 输出的长路径正确识别为同一仓库。
- 增加 Windows 文件系统短路径别名回归测试，并让 CI 矩阵中的两个任务独立运行。

## 0.1.0 — 2026-09-24

- 首版 Windows 优先的 WorkHub CLI，包含 install、init、list、show、check 命令。
- 提供中文交互提示和非交互 JSON 模式。
- 分离 work、code、Trellis 仓库，并支持关联已有仓库。
- 提供工作登记、自动生成的年度索引、AI 入口指令和任务交接文件。
- 提供路径范围检查、写锁、执行日志和中断恢复。
- 在隔离工作空间中验证与官方 Trellis 0.6.17 的集成。
- 采用 MIT 开源许可证。

归档自动化、operations 知识编写和 npm registry 发布均不属于 0.1.0 的范围。
