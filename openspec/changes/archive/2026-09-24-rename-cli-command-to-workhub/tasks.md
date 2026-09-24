# Tasks

## 1. 命令入口与提示

- [x] 1.1 将 npm `bin.wk` 替换为 `bin.workhub`，指向原 `dist/cli.js`，同步 `package-lock.json`；检查两份包清单的根包 `bin` 均只包含 `workhub`。
- [x] 1.2 将 Commander 程序名和当前运行时命令提示改为 `workhub`，保留数据路径和任务文件名；构建后运行 `node dist/cli.js --help`，核对 Usage 与子命令。
- [x] 1.3 增加 `workhub` 的帮助、版本和旧配置复用测试；在临时根目录与 `WK_CONFIG_PATH` 下运行相关测试，确认旧配置可由新命令读取。
- [x] 1.4 更新 README、CLI 行为约定及 OpenSpec 项目上下文中的当前命令说明；核对文档示例可执行，历史文档与持久标识保持原样。

## 2. 打包与全局命令迁移

- [x] 2.1 更新发布说明中的命令核对步骤；运行 `npm pack --dry-run` 与实际 `npm pack`，核对包内包含 `dist`、必需模板、README 和 LICENSE。
- [x] 2.2 在临时 npm 前缀安装本地打包文件，验证 Windows 下只生成 `workhub` 包装器；检查 `--help`、`--version`、`list`/`check` 的调用和退出码，记录来源和结果。
- [x] 2.3 隔离验证通过后核对现有全局命令来源与潜在同名冲突，再从已核对的本地包更新全局安装；验证 `workhub` 版本、原有配置的只读查询及本包旧 `wk` 包装器已消失。若有残留，确认归属后受控清理并复查，记录回退所需的原版本与包来源。

## 3. 集成检查与交付

- [x] 3.1 运行 `npm run check`、`npm run build`、`npm run check:version`、`npm test` 和 `openspec validate rename-cli-command-to-workhub --strict`；确认检查通过并审查 Git 差异不含用户数据或临时包。
- [x] 3.2 更新 CHANGELOG.md，按需同步并归档 OpenSpec；确认主规格、归档增量规格与实现一致，并通过归档任务校验。Git 提交推送和发布决策汇报按仓库交付约定继续执行。
