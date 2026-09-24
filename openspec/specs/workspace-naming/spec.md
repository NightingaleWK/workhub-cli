# workspace-naming Specification

## Purpose
此能力规定 WorkHub 工作根的配置位置、运行记录、环境变量及 Trellis 任务入口的统一名称，确保生成内容和后续检查遵循相同目录与文件约定。

## Requirements

### Requirement: 使用 WorkHub 工作根目录

WorkHub 必须（MUST）将根配置保存于 `.workhub/config.json`，将写锁保存于 `.workhub/write.lock`，将执行记录保存于 `.workhub/runs/`，并按这些路径验证工作根。

#### Scenario: 初始化并检查工作根
- **WHEN** 用户在空目录运行 `workhub install`，随后运行 `workhub check`
- **THEN** 配置、写锁和执行记录路径均以 `.workhub` 为根，检查成功

### Requirement: 使用 WorkHub 环境变量

WorkHub 必须（MUST）使用 `WORKHUB_CONFIG_PATH` 指定本机指针文件，使用 `WORKHUB_PYTHON` 指定 Python 可执行文件。

#### Scenario: 隔离本机指针
- **WHEN** 用户设置 `WORKHUB_CONFIG_PATH` 并运行需要本机指针的命令
- **THEN** 命令读取或写入该变量指定的文件

#### Scenario: 指定 Python
- **WHEN** 用户设置 `WORKHUB_PYTHON` 并初始化 Trellis 工作空间
- **THEN** WorkHub 使用指定的 Python 可执行文件

### Requirement: 生成统一命名的 Trellis 任务入口

每项正式任务必须（MUST）包含 `workhub-context.md` 与 `workhub-handoff.md`；WorkHub 附加到 AGENTS.md 的受管区块必须（MUST）使用 `WORKHUB:START` 和 `WORKHUB:END` 标记，后续检查按这些名称确认文件与区块。

#### Scenario: 创建并检查正式任务
- **WHEN** 用户运行 `workhub init` 创建工作并运行 `workhub check`
- **THEN** Trellis 正式任务包含两个指定文件，受管指令区块存在，检查成功
