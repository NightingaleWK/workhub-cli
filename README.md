# workhub-cli

Windows 优先的 WorkHub 初始化与登记工具，命令名为 `wk`。日常在 SSD 工作；Trellis、业务知识、代码分离；VS Code 工作区由用户手动创建。

源码：[NightingaleWK/workhub-cli](https://github.com/NightingaleWK/workhub-cli)。许可证：[MIT](LICENSE)。版本记录见 [CHANGELOG.md](CHANGELOG.md)。

## 版本与文档范围

2026-09-24 核对：`0.1.2` 已发布，npm `latest` 为 `0.1.2`。已从公开 registry 隔离安装，并通过版本、install/init/check 验证。本文功能说明面向当前源码。

| 版本 | 已包含功能 |
|---|---|
| 0.1.1（已发布） | Trellis 必选、Git 用户名配置；旧版带边框预览，需提前手工安装 Trellis |
| 0.1.2（已发布） | 左侧流程线预览、返回修改、目录状态分组、经同意自动安装 Trellis |

升级前运行 `npm view workhub-cli dist-tags.latest` 核对可用版本；安装后运行 `wk --version`。

## 安装与第一次使用

需要 Node.js >=22.12（推荐受支持 LTS）、Git 和 Python 3。`wk install` 会检测 Trellis，未安装时询问是否执行 `npm install -g @mindfoldhq/trellis@latest`，同意后自动安装并验证。每项工作必须创建或关联 Trellis 管理空间，它作为 Codex 主目录，并在根目录保存 AGENTS.md。

从 npm 安装或升级当前公开版本：

```powershell
npm install -g workhub-cli@latest
wk install
wk init
```

也可以克隆源码后本地打包安装：

```powershell
git clone https://github.com/NightingaleWK/workhub-cli.git
cd workhub-cli
```

在源码目录：

```powershell
npm ci
npm run build
npm test
npm pack
npm install -g .\workhub-cli-0.1.2.tgz
wk --version
wk install
wk init
```

或者开发调试使用 `npm link`。安装 npm 包与 `wk install` 不同：前者安装命令，后者配置工作根目录。

`wk install` 默认目录为当前用户主目录下的 WorkHub，例如 `C:\Users\<用户名>\WorkHub`。回车接受默认值，也可输入 `D:\WorkHub`。随后读取全局 `git config --global user.name` 作为建议的开发者名称；这不是 GitHub 登录名，也不要求与 GitHub 用户名相同。读取不到时要求人工填写。该名称保存到 `.wk/config.json`，后续传给 `trellis init -u`。wk 不修改全局 Git 用户名，也不为新仓库设置 user.name/user.email。工具不自动识别或保证磁盘是 SSD。

`wk init` 询问中文名、英文代号、日期（默认本地今天）。Trellis 固定必选，多选菜单只包含 work 和 code，可以全部不选以创建仅有 Trellis 的工作。Trellis 始终可以新建或关联已有管理仓库；选择 code 时可以新建或关联代码仓库。最后展示执行计划并确认。

配置预览采用左侧流程线布局，显示目录的创建、保留或关联状态；install 同时显示 Git 用户名。选择“返回修改”会回到输入步骤并保留已有答案作为默认值，确认前不执行写入；Esc 可以取消。JSON 和 dry-run 输出保持结构化格式。

初始化不自动提交、推送、创建远程或设置应用里的项目。新仓库尚无提交，请按实际工作需要自行提交。分类目录不建总仓库。

非交互配置可以直接传 `--root`；它会使用全局 Git 用户名。没有全局用户名时，先执行：

```powershell
git config --global user.name "你的 Git 用户名"
```

或在交互式 `wk install` 中填写。

## 命令

```text
wk install                  配置 WorkHub
wk init                     交互创建工作
wk list                     列出工作
wk show <工作编号>          显示目录和入口
wk check [工作编号]         只读检查结构与索引
wk --help
```

所有命令支持 `--root <路径>` 和 `--json`。install/init 支持 `--yes` 和 `--dry-run`。默认从本机配置找根目录；`--root` 只针对本次调用，install 成功会注册新根。

缺少 Trellis 时，非交互配置必须显式授权全局安装：`wk install --yes --install-trellis`。`--yes` 本身不授权该安装；`--dry-run` 仅显示检测状态，不安装。拒绝安装、npm 失败或版本验证失败时，不继续写入 WorkHub；已成功安装的全局工具不会因后续配置失败被自动卸载。已存在的 Trellis 不自动升级，Python 仍需自行准备。

AI 调用示例：

```powershell
wk init --name "环保尾气上传程序逆向分析" --slug exhaust-analysis --date 2026-09-24 --components work,code --yes --json
wk init --name "尾气后续排查" --slug exhaust-followup --components work,code --trellis-existing trellis/exhaust-analysis --code-existing code/exhaust-analysis --yes --json
wk show 20260924-exhaust-analysis --json
```

`--components work,code` 选择可选组成部分，Trellis 始终包含。省略参数默认 work + Trellis；`--components none` 表示仅 Trellis。旧的显式包含 trellis 的写法仍支持。复用路径必须相对于根目录，并处于对应 trellis/code 分类内且是独立 Git 仓库。

非交互写入必须传 `--yes`，缺少必要参数直接报错。JSON 输出适合程序读取；没有 TTY 时普通输出也使用 JSON。dry-run 不写文件。install 的 dry-run 会读取 Git 用户名、检查目录及探测 Trellis，必要时调用 npm root --global；不会安装依赖。init 的 dry-run 检查计划、路径和登记，不执行完整依赖预检查。执行 init 时再检查 Trellis 接口和 Python。

退出码：0 成功；1 执行/检查错误；2 参数或配置格式错误；3 冲突；130 取消。

## 创建的内容

```text
<root>
├─ .wk/config.json
├─ .wk/runs/                         # 执行与恢复日志
├─ trellis/<slug>/                   # 必须正式初始化或关联已有空间
├─ knowledge/work/YYYY/YYYYMMDD-中文名/
├─ knowledge/archive/
├─ knowledge/operations/
├─ code/<slug>/
└─ navigation/                       # 独立 Git 仓库
   ├─ registry/works/<编号>.json     # 工作登记来源
   ├─ indexes/工作目录/YYYY.md       # 自动生成，请勿手工编辑
   ├─ templates/                    # 预留自定义模板目录
   └─ workspaces/                   # 不自动创建工作区文件
```

work/code 只创建选中项；Trellis 必须存在。公共分类目录由 install 建立，正式 Trellis 空间由 init 创建或关联。work 内包含 README、材料/分析/实施/证据/交付目录。任务交接统一放在 Trellis 正式任务中。

工作编号使用创建日期；工作目录年份也按创建日期。英文代号使用小写字母、数字和连字符；中文工作名必须是合法 Windows 文件名。

同名工作区冲突时使用 `--workspace-name "中文名-日期.code-workspace"` 或交互选择备用名称。工具只登记预期位置，`check` 的“工作区待创建”是提示而不是失败。

## Trellis 与 AI

已验证 Trellis 0.6.17，使用其正式接口：

```text
trellis init --codex --yes --user <Git用户名> --no-monorepo
python .trellis/scripts/task.py create <标题> --slug <工作编号> --description <说明> --no-start
```

wk install 仅在 Trellis 缺失且用户同意时安装全局 Trellis，不自动升级已有版本、不启用全局 hooks，也不自动切换当前任务。Trellis 可能生成 bootstrap 任务，这是它自身行为。

保留 Trellis 原 AGENTS.md，追加 `WK:START v1` 到 `WK:END` 区块；已有区块被人工修改时停止并报告冲突，不覆盖。

正式任务中生成 `wk-context.md`（目录映射）和 `wk-handoff.md`（交接入口）。Trellis 文件夹日期前缀由其自身按当前日期生成，不等于用户输入的工作日期；登记保留准确 taskPath，不猜路径。

在 Codex 本地项目中选择 Trellis 为主，其余相关目录为附加目录。可以在同一个对话中分析、编码和整理文档。新对话提供工作编号，按 AGENTS.md 阅读任务入口。

开始业务工作前补齐目标、范围、验收条件和开发规范。wk 初始化完成不代表业务已完成，也不代表应用项目已配置。

## 配置与恢复

本机指针：`%LOCALAPPDATA%\workhub-cli\config.json`；非 Windows 回退到用户 `.config`。测试可用 `WK_CONFIG_PATH` 指定隔离文件。Python 可通过 `WK_PYTHON` 指定可执行文件路径。

工作登记保存根目录相对路径。换设备恢复目录后，用 `wk install --root <恢复位置>` 注册。已有业务文件保留，旧根不会自动搬迁。重复 install 会保存本次确认的 gitUser 并重新登记本机根指针，不能理解为配置文件完全不变。当前重装默认建议来自全局 Git 配置，不自动沿用先前手工填写的名字。

根配置同时保存 schemaVersion、layoutVersion、templateVersion 和 gitUser。旧根配置缺少 gitUser 时，先重新执行 wk install；当前 init 不会自动补齐，也没有独立迁移命令。关联已有 Trellis 空间不会重新执行 init -u 或修改其已有开发者身份。

写操作使用 `.wk/write.lock`，异常残留锁不会自动删除。确认没有 wk 进程工作后，检查锁信息再手动移走它。init 的执行及失败日志位于 `.wk/runs/<工作编号>.json`（install 不生成同类任务日志）；使用完全相同的 init 参数重试。已有目录没有对应恢复记录时，必须明确复用或更换代号。

失败不会删除用户材料。某些外部步骤可能已完成，因此保留目录和日志供诊断，不宣称所有失败都能自动回滚。目录、登记或模板被人工改变导致冲突时需要先核对。

备份请用 FreeFileSync，包括 `.git`、`.wk`、登记和重要未跟踪附件。不要只备份 Git 跟踪文件。

## 旧工作兼容

旧版缺少 Trellis 的登记仍可通过 list/show 读取，但 check 报告缺少必需主目录；重复 init 会给出明确迁移提示，不静默升级、搬移或覆盖旧资料。新建工作缺少 Trellis/Python 依赖时，在创建项目目录前失败，不生成不完整的成功登记。wk install 在缺少 Trellis 时提供经用户同意的自动安装；wk init 本身仍不自动安装依赖。

## 当前限制

- archive、operations 提炼、追加组成部分、模板升级尚未实现。
- 内置模板随 npm 包分发；navigation/templates 当前仅预留，不自动加载自定义模板。
- Trellis 以官方 npm launcher 或 Unix PATH 可执行文件发现，未验证所有第三方安装方式。
- 首版每次只关联一个代码仓库；登记结构预留数组。
- Windows 已验证；其他操作系统未做完整交互验收。
- 指令阅读链和文件检查已验证，未在另一条真实 Codex 对话中执行完整业务接续验收。
- `check` 检查已知目录、入口和年度索引，不是全量 Markdown 链接审计工具。

## 开发

```powershell
npm run check
npm run build
npm test
npm pack
```

文档导航：

- [当前开发状态与后续计划](docs/development-plan.md)
- [CLI 行为约定](docs/cli-contract.md)
- [Trellis 接入说明](docs/trellis-integration.md)
- [验证与发布状态](docs/validation.md)
- [本次文档一致性审计](docs/documentation-audit.md)

历史快照在 docs/history 中；它们不作为当前使用规则。
