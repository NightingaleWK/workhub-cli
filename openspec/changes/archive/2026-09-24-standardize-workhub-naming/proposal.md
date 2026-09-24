# Proposal

## Why

项目仍在开发阶段，运行时标识与项目名不一致，增加了使用、测试和维护成本。统一以 `workhub` 命名，使当前实现和文档从一开始遵循同一约定。

## What Changes

- 工作根配置、执行日志和写锁使用 `.workhub`；环境变量使用 `WORKHUB_CONFIG_PATH` 与 `WORKHUB_PYTHON`。
- 正式任务入口使用 `workhub-context.md` 与 `workhub-handoff.md`，代理指令区块及生成内容使用 `WORKHUB` 标识。
- CLI、模板、测试、规格和当前文档仅描述统一后的行为；清理不适用的仓库内存档与说明。
- 包名和可执行命令均保持 `workhub-cli` 与 `workhub`；真实 GitHub 账号、许可证署名及依赖校验串保持原值。

## Capabilities

### New Capabilities

- `workspace-naming`: 规定工作根、环境变量、生成任务文件和代理指令的名称。

### Modified Capabilities

- `cli-command`: 将命令与配置读取要求更新为当前统一命名约定。

## Impact

影响 `src`、`templates`、测试、OpenSpec 规格、README、开发与验证文档、CHANGELOG。工作数据只在隔离临时目录验证；不修改仓库外的用户工作空间。无新增依赖，不修改包版本、Git 标签或已发布包。
