# 验证状态

本页记录当前源码的验收方式。包版本以 [package.json](../package.json) 为准；npm 发布状态通过 `npm view workhub-cli dist-tags.latest` 查询。

## 本地检查

```powershell
npm run check
npm run build
npm run check:version
npm test
npm pack --dry-run --json
```

自动测试在临时目录隔离 Git 配置、WorkHub 根目录和 `WORKHUB_CONFIG_PATH`。核心测试用 fixture 隔离 Trellis 进程；实际 Trellis 接口需在独立临时根目录验收。打包检查需确认 LICENSE、`templates/agents.md`、`dist/cli.js` 和包清单在内。

## 0.2.0 发布验收

`npm run check`、`npm run build`、`npm run check:version` 和 `npm test` 均通过，自动测试为 4 个文件、38 项。`npm pack --dry-run --json` 包含 LICENSE、`templates/agents.md`、`dist/cli.js` 和包清单，包只声明 `workhub` 可执行入口。

使用当前源码生成 `workhub-cli-0.2.0.tgz`，在独立 npm 前缀安装后仅生成 `workhub` 的三个平台包装器。隔离安装的 `--version` 输出 `0.2.0`，帮助用法为 `workhub`；通过临时 `WORKHUB_CONFIG_PATH` 运行 `check --json` 成功。本节是发布前的本地验收结果，npm registry 验收将在发布后记录。

## 0.1.2 源码验收结果

`npm run check`、`npm run build`、`npm run check:version` 和 `npm test` 均通过；自动测试为 4 个文件、38 项。`npm pack --dry-run --json` 包含 LICENSE、`templates/agents.md`、`dist/cli.js` 和包清单。

从当前源码生成 tarball 后，在系统临时目录使用独立 npm 前缀安装。安装入口显示 `Usage: workhub`，`--version` 输出 `0.1.2`。设置临时 `WORKHUB_CONFIG_PATH` 与 Git 配置，运行 `workhub install`、仅 Trellis 的 `workhub init` 和 `workhub check` 均成功；生成 `.workhub/config.json`、执行记录、`workhub-context.md`、`workhub-handoff.md` 与 `WORKHUB` 指令区块。检查只提示 VS Code 工作区待手动创建。

同一 tarball 已安装到本机全局 npm 前缀；使用临时 `WORKHUB_CONFIG_PATH` 调用全局 `workhub --version` 和 `workhub check --json` 成功。真实用户工作空间未写入。

交互界面由维护者手动验证；自动测试不能代替该结论。其他操作系统与所有 Trellis 安装渠道未做完整验收。本地打包与隔离安装不代表 npm 发布。

公共 CI 记录见 [GitHub Actions](https://github.com/NightingaleWK/workhub-cli/actions)。
