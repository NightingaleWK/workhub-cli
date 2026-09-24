# workhub-cli

Windows 优先的 WorkHub 初始化与登记工具，命令名为 `wk`。日常在 SSD 工作；Trellis、业务知识、代码分离；VS Code 工作区由用户手动创建。

源码：[NightingaleWK/workhub-cli](https://github.com/NightingaleWK/workhub-cli)。许可证：[MIT](LICENSE)。版本记录见 [CHANGELOG.md](CHANGELOG.md)。

## 安装与第一次使用

需要 Node.js >=22.12（推荐受支持 LTS）和 Git。选择 Trellis 组件时，另外需要官方 npm 安装的 `@mindfoldhq/trellis` 和 Python 3。

当前版本 0.1.0，源码公开，尚未发布 npm；不要把 npm 上可能存在的同名包当成本项目。可以克隆源码后本地打包安装：

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
npm install -g .\workhub-cli-0.1.0.tgz
wk --version
wk install
wk init
```

或者开发调试使用 `npm link`。安装 npm 包与 `wk install` 不同：前者安装命令，后者配置工作根目录。

`wk install` 默认目录为当前用户主目录下的 WorkHub，例如 `C:\Users\<用户名>\WorkHub`。回车接受默认值，也可输入 `D:\WorkHub`。工具不自动识别或保证磁盘是 SSD。

`wk init` 询问中文名、英文代号、日期（默认本地今天）和 work/trellis/code 多选。选中代码或 Trellis 后可以新建或关联已有仓库。最后展示执行计划并确认。

初始化不自动提交、推送、创建远程或设置应用里的项目。新仓库尚无提交，请按实际工作需要自行提交。分类目录不建总仓库。

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

AI 调用示例：

```powershell
wk init --name "环保尾气上传程序逆向分析" --slug exhaust-analysis --date 2026-09-24 --components work,trellis,code --yes --json
wk init --name "尾气后续排查" --slug exhaust-followup --components work,trellis,code --trellis-existing trellis/exhaust-analysis --code-existing code/exhaust-analysis --yes --json
wk show 20260924-exhaust-analysis --json
```

`--components` 至少一项。复用路径必须相对于根目录，并处于对应 trellis/code 分类内且是独立 Git 仓库。

非交互写入必须传 `--yes`，缺少必要参数直接报错。JSON 输出适合程序读取；没有 TTY 时普通输出也使用 JSON。dry-run 不写文件，仅验证可构造的计划；外部 Git/Trellis/Python 的运行预检查在执行阶段完成。

退出码：0 成功；1 执行/检查错误；2 参数或配置格式错误；3 冲突；130 取消。

## 创建的内容

```text
<root>
├─ .wk/config.json
├─ .wk/runs/                         # 执行与恢复日志
├─ trellis/<slug>/                   # 选择时正式初始化
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

work/code/Trellis 只创建选中项；公共分类目录由 install 建立。work 内包含 README、材料/分析/实施/证据/交付目录。只有未启用 Trellis 的 work 才生成简要交接文件。

工作编号使用创建日期；工作目录年份也按创建日期。英文代号使用小写字母、数字和连字符；中文工作名必须是合法 Windows 文件名。

同名工作区冲突时使用 `--workspace-name "中文名-日期.code-workspace"` 或交互选择备用名称。工具只登记预期位置，`check` 的“工作区待创建”是提示而不是失败。

## Trellis 与 AI

已验证 Trellis 0.6.17，使用其正式接口：

```text
trellis init --codex --yes --user wk-user --no-monorepo
python .trellis/scripts/task.py create <标题> --slug <工作编号> --description <说明> --no-start
```

wk 不安装/升级全局 Trellis，不启用全局 hooks，也不自动切换当前任务。Trellis 可能生成 bootstrap 任务，这是它自身行为。

保留 Trellis 原 AGENTS.md，追加 `WK:START v1` 到 `WK:END` 区块；已有区块被人工修改时停止并报告冲突，不覆盖。

正式任务中生成 `wk-context.md`（目录映射）和 `wk-handoff.md`（交接入口）。Trellis 文件夹日期前缀由其自身按当前日期生成，不等于用户输入的工作日期；登记保留准确 taskPath，不猜路径。

在 Codex 本地项目中选择 Trellis 为主，其余相关目录为附加目录。可以在同一个对话中分析、编码和整理文档。新对话提供工作编号，按 AGENTS.md 阅读任务入口。

开始业务工作前补齐目标、范围、验收条件和开发规范。wk 初始化完成不代表业务已完成，也不代表应用项目已配置。

## 配置与恢复

本机指针：`%LOCALAPPDATA%\workhub-cli\config.json`；非 Windows 回退到用户 `.config`。测试可用 `WK_CONFIG_PATH` 指定隔离文件。Python 可通过 `WK_PYTHON` 指定可执行文件路径。

工作登记保存根目录相对路径。换设备恢复目录后，用 `wk install --root <恢复位置>` 注册。已有文件保留，旧根不会自动搬迁。

写操作使用 `.wk/write.lock`，异常残留锁不会自动删除。确认没有 wk 进程工作后，检查锁信息再手动移走它。失败日志位于 `.wk/runs/<工作编号>.json`；使用完全相同的 init 参数重试。已有目录没有对应恢复记录时，必须明确复用或更换代号。

失败不会删除用户材料。某些外部步骤可能已完成，因此保留目录和日志供诊断，不宣称所有失败都能自动回滚。目录、登记或模板被人工改变导致冲突时需要先核对。

备份请用 FreeFileSync，包括 `.git`、`.wk`、登记和重要未跟踪附件。不要只备份 Git 跟踪文件。

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

详见 `docs/development-plan.md`、`docs/trellis-integration.md`、`docs/validation.md`。
