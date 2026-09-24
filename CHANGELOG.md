# 变更记录

## 0.2.0 — 2026-09-24

- WorkHub 命令、工作根目录、环境变量、代理指令和任务入口统一使用 `workhub` 命名。
- CLI 版本从包清单读取，并通过本地和 CI 版本一致性检查。
- 完成的 OpenSpec 工作同步规格、验证、提交并推送；版本号、标签与 npm 发布由维护者决定。

## 0.1.2 — 2026-09-24

- init 预览按工作身份、Trellis/work/code 目标目录、管理操作和 VS Code 工作区分组。
- install 检测 Trellis；缺失时在获得同意后提供全局安装 `@mindfoldhq/trellis@latest`。
- 非交互安装依赖需显式 `--install-trellis`；安装后验证启动入口。
- install/init 在写入前允许返回修改输入，保留先前答案。

## 0.1.1 — 2026-09-24

- 每项工作必须有 Trellis 管理空间和 AGENTS.md 入口；work/code 可选。
- CLI 未指定组成部分时默认 work + Trellis，`--components none` 创建仅含 Trellis 的工作。
- install 读取全局 Git 用户名，创建新空间时传给 `trellis init -u`。
- 修复 Windows 短路径与 Git 长路径比较。

## 0.1.0 — 2026-09-24

- 提供 install、init、list、show、check 命令，以及中文交互提示和 JSON 模式。
- 分离 work、code、Trellis 仓库，支持工作登记、年度索引和正式任务入口。
- 提供路径边界检查、写锁、执行日志和中断恢复。
- 采用 MIT 许可证。
