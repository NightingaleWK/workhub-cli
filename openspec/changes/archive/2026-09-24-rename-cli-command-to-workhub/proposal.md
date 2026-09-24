# Proposal

## Why

当前 npm 包提供的全局命令是 `wk`，而产品名称是 WorkHub。将唯一命令改为 `workhub`，使安装后的调用方式、帮助信息和用户文档一致，减少首次使用时的辨认成本。

## What Changes

- 将 npm 包的全局可执行入口由 `wk` 替换为 `workhub`，不保留 `wk` 别名。
- 将运行时提示、当前文档、测试和版本核对中的命令示例改为 `workhub`；保留历史记录原貌。
- 明确升级现有全局安装的步骤，隔离验证 Windows 命令包装器及 `--version`、`--help`、常用子命令，并核对旧 `wk` 包装器已移除。
- 命令改名不迁移 `.wk` 数据目录、`WK_CONFIG_PATH`、`WK_PYTHON`、既有任务文件名或登记格式。

## Capabilities

### New Capabilities

- `cli-command`: npm 安装后的唯一命令入口和帮助输出约定。

### Modified Capabilities

- `version-consistency`: 将版本输出契约中的命令改为 `workhub`。

## Impact

涉及 `package.json`、`package-lock.json`、`src/cli.ts` 及当前提示文本、打包与隔离安装验证、README、当前 CLI/发布文档和 OpenSpec 项目上下文。npm 包名仍为 `workhub-cli`；用户工作空间中的持久文件与配置路径保持原样。此阶段只形成方案，不修改正式全局安装，也不触发 npm 发布或版本号变更。
