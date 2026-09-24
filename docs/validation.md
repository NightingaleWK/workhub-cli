# 验证与发布状态

记录日期：2026-09-24。下表是当日验证与发布快照，不代表此后 npm 的实时状态；当前源码包版本以 [package.json](../package.json) 为准，npm 当前公开版本应运行 `npm view workhub-cli dist-tags.latest` 查询。旧记录保留在 [0.1.0 验证快照](history/validation-0.1.0.md)，不能将其“未提交、未发布、21 项测试”等描述用于当前版本。

## 发布状态

| 对象 | 当前证据 |
|---|---|
| GitHub | 公开 MIT 仓库，main 持续提交推送 |
| 0.1.1 | npm 已发布，公开安装后 install/init/check 验证通过 |
| 0.1.2 | npm 已发布，公开安装后的版本、install/init/check 验证通过 |
| 2026-09-24 npm latest | 当日发布后通过 npm view 实测为 0.1.2 |

标签存在、上传开始或网页认证完成都不单独等于发布成功。需要 npm publish 成功、registry 元数据及公开安装验证。已有 tgz 不会随之后的 README 编辑自动变化。

## 验证结果

| 检查 | 结果与边界 |
|---|---|
| 编译和类型检查 | 0.1.2 发布前通过 |
| 自动测试 | 2 个文件、32 项通过；本机 Windows Node 26.3.0 |
| Trellis 必选 | 核心/参数调用归一化；旧无入口工作报迁移需求 |
| Git 用户名 | 读取、人工输入、默认回车、新空间身份传递已验证 |
| install 交互 | PowerShell TTY 返回修改正常，返回前没有根目录写入 |
| init 预览 | 用户中文长名称案例的分组输出检查通过；未覆盖所有终端字体和宽度 |
| 正式 Trellis | 0.6.17，初始化、任务创建、四种组合及跨年复用通过 |
| 自动安装 | 临时 npm prefix，隐藏原全局入口，安装 latest 并核对 0.6.17 成功 |
| 依赖异常分支 | 已安装、同意、拒绝、npm 失败和安装后找不到：5 项流程测试通过 |
| 0.1.2 包内容 | 含 LICENSE、模板、dist/preview.js 和 dist/dependencies.js |
| GitHub CI | 配置 Windows Node 22/24；具体结论以对应提交的 Actions 运行记录为准 |

核心测试对 Trellis 使用 fixture；真实接口与全局安装是独立隔离实验，不能混为一谈。Git 配置测试也使用临时全局配置文件。

## 2026-09-24 版本一致性变更验证

本次运行 `npm run check`、`npm run build`、`npm run check:version`、`npm test` 和 `npm pack --dry-run --json` 均通过；自动测试为 3 个文件、36 项通过。打包预览包含 LICENSE、`templates/agents.md`、`dist/cli.js` 和包清单。归档前 `openspec validate centralize-version-metadata --strict` 通过；归档后主规格和归档变更的严格验证也通过。所修改文档的本地链接均存在，`git diff --check` 无空白错误。

另在系统临时目录执行 `npm pack` 和隔离的 `npm install --prefix ... --ignore-scripts`，已安装包的清单版本与 `wk --version` 均为 `0.1.2`；未修改正式全局安装。只读核对历史标签发现 `v0.1.2` 指向早于本次工作的提交，故本次不复用该标签。此次验证没有修改包版本、创建标签或发布 npm；这些动作由维护者另行决定。

## 2026-09-24 命令改名验证

当前源码将 npm 可执行入口由 `wk` 改为唯一的 `workhub`。本地 `npm pack --dry-run --json` 和实际打包包含 LICENSE、README、`templates/agents.md` 与 `dist/cli.js`；最终本地 tarball 的 SHA-256 为 `C4F1B0DCE1DF0669FEB2FA49F651BDD3E55CDAC5FD66321F65E0A3871AB8AF57`。在系统临时目录使用独立 npm 前缀安装该 tarball 后，仅生成 `workhub`、`workhub.cmd`、`workhub.ps1`，未生成 `wk` 包装器；`--help` 显示 `Usage: workhub`，`--version` 输出源码包版本 `0.1.2`。通过临时 `WK_CONFIG_PATH` 读取旧格式根配置，`list --json` 与 `check --json` 均返回成功。此 tarball 是本地源码构建，不等于 npm 已发布的同版本包。

最终源码运行 `npm run check`、`npm run build`、`npm run check:version`、`npm test` 和 `openspec validate rename-cli-command-to-workhub --strict` 均通过；测试为 4 个文件、38 项。同步并归档后，`openspec validate --specs --strict` 的 2 项主规格和 `openspec validate --archived --strict` 的 2 项归档变更均通过。

全局升级前，`Get-Command wk -All` 仅指向 npm 全局前缀下的三个旧包装器，内容均指向 `node_modules/workhub-cli/dist/cli.js`；全局安装版本为 `0.1.2`，未发现 `workhub` 命令。用上述本地 tarball 执行 `npm install --global --ignore-scripts` 后，PATH 中只可解析到 `workhub` 的三个包装器，旧 `wk` 包装器已由 npm 移除，无需手工删除。`workhub --version` 输出 `0.1.2`，`workhub list --json` 成功读取原有本机配置并返回 1 项登记；未对原有工作空间写入。原已安装版本为 `0.1.2`，npm registry 可查询到该版本的公开 tarball；若需回退，应先核对回退包与命令入口，本地构建与公开同版本的内容不同。本次全局安装不代表 npm 发布。

## 未验收边界

- 交互使用体验由维护者自行手动验证，不列为本项目的代理验收待办；现有自动和隔离安装验证不代表维护者的手动结论。
- 尚未在另一条真实 Codex 对话中完成整项业务接续验证。
- 其他操作系统、全部 Node 小版本和所有 Trellis 安装渠道未全面验证。
- archive、operations 自动化及全量 Markdown 链接审计不是 workhub 当前能力。

## 重现

```powershell
npm ci
npm run check
npm run build
npm test
npm pack --dry-run
```

公共运行记录见 [GitHub Actions](https://github.com/NightingaleWK/workhub-cli/actions)。实验使用临时根目录、WK_CONFIG_PATH 和 npm_config_prefix，不修改正式工作区。临时文件可能被清理，历史路径仅供追踪，不是永久交付链接。
