# Trellis 接入说明

WorkHub 为每项工作创建或关联真实 Trellis 管理空间，并通过 `.trellis/scripts/task.py create` 建立正式任务。工作编号作为任务 slug，创建后读取 task.json 定位实际目录并登记 taskPath；Trellis 任务文件夹的日期由 Trellis 决定。

新空间通过 `trellis init --codex --yes --user <Git用户名> --no-monorepo` 初始化。用户名来自 WorkHub 根配置 `.workhub/config.json`。关联已有空间时不重新初始化身份。任务创建使用 `--no-start`，不切换共享的当前任务。

WorkHub 在 AGENTS.md 中追加 `WORKHUB:START v1` 至 `WORKHUB:END` 的受管区块，保留 Trellis 和人工内容。区块发生人工修改时，命令报告冲突。正式任务包含 `workhub-context.md` 和 `workhub-handoff.md`。

## 依赖发现与验证

WorkHub 优先在 PATH 的 npm 全局命令目录下查找官方 Trellis 启动文件，再通过 `npm root --global` 定位全局包。使用当前 Node.js 运行启动文件，不拼接 cmd.exe 命令。

`workhub install` 检测 Trellis；缺失时经用户同意执行 `npm install -g @mindfoldhq/trellis@latest`。非交互模式需 `--install-trellis`；`--yes` 本身不授权依赖安装。已有安装不自动升级，dry-run 不安装，拒绝或失败时不写入工作根配置。

安装后验证 `--version`。`workhub init` 还检查 `--codex`、`--no-monorepo`、`--user` 和 Python；可用 `WORKHUB_PYTHON` 指定 Python 可执行文件。Trellis hooks 的配置由用户自行管理。
