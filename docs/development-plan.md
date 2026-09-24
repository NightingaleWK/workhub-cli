# 当前开发状态与后续计划

更新：2026-09-24。源码包版本以 [package.json](../package.json) 为准。使用说明见 [README](../README.md)。

## 固定规则

- 根目录默认当前用户主目录下的 WorkHub，支持自定义；不自动检测 SSD。
- 每项工作必须创建或关联 Trellis，作为 Codex 主目录和 AGENTS.md 入口。
- 只有 work/code 可选；合法组合共四种，包含仅 Trellis。所有代码都放 code。
- work 按创建年份组织；代码和 Trellis 跨年复用。
- 独立对象使用独立 Git，分类目录不建立父级总仓库。
- 工作区文件由用户创建，workhub 只登记中文名.code-workspace 的预期位置。
- 本项目源码持续提交和推送；workhub 创建的用户仓库不自动提交或推送，两者不同。
- 后续功能和行为变更使用 OpenSpec 的 spec-driven 流程；每项完成的变更同步/归档规格、验证、更新文档与变更记录后提交并推送。项目由一人维护，不默认设置额外评审关卡。
- Git 变更提交不等于 npm 发布；版本号与标签用于维护者选定的发布里程碑，npm 发布须由维护者决定。
- 每项 OpenSpec 工作完成并推送后，Codex 主动给出版本号、GitHub 标签和 npm 发包建议，列明当前状态与理由，由维护者回答是否执行；同一修订被拒后不重复提醒。

## 已实现范围

| 能力 | 当前状态 |
|---|---|
| install | 根目录、Git 开发者名称、公共目录、导航仓库、本机根指针 |
| Trellis 依赖 | 缺失时经同意 npm 全局安装 latest；已有版本不升级 |
| init | Trellis 必选，work/code 多选；支持关联现有仓库 |
| 预览 | 左侧流程线，目录状态分组，确认或返回修改 |
| 管理记录 | 正式 Trellis 任务、实际 taskPath、目录映射、交接、AGENTS 区块 |
| 导航 | 一工作一登记 JSON，年度 Markdown 索引 |
| 查询检查 | list/show/check；工作区待创建是提示，缺 Trellis 是错误 |
| 失败处理 | 路径校验、写锁、init 日志、相同参数重试，不删除用户资料 |
| 分发 | MIT、GitHub、npm；具体发布状态见验证文档 |

## 当前源码结构

```text
src/
  cli.ts           命令、交互与输出
  common.ts        路径、Git、配置、锁和文件工具
  core.ts          初始化、登记、索引与检查
  trellis.ts       官方初始化、任务及入口
  dependencies.ts npm 定位、安装和授权流程
  preview.ts       预览信息组织与渲染
templates/
  agents.md
tests/
  core.test.ts
  dependencies.test.ts
```

实际依赖版本由 package.json 和 lockfile 固定。

## 配置和数据

本机指针位于 `%LOCALAPPDATA%/workhub-cli/config.json`，可用 WORKHUB_CONFIG_PATH 隔离。根 `.workhub/config.json` 保存 schemaVersion、layoutVersion、templateVersion 和 gitUser。

install 读取全局 Git user.name 作为建议，交互可修改；不更改全局 Git 配置。重复 install 保存本次选择，不能说配置完全不变。新 Trellis 空间使用 gitUser，关联已有空间不重新设置开发者身份。

登记保存工作编号、名称、日期、组成部分、生命周期、工作区位置、requestHash 和实际 taskPath。未选 work 时省略它，未选 code 时是空数组。Trellis 必須存在。不要手工编造哈希或任务路径。

只有 init 使用工作执行日志；install 不生成同类日志。部分失败保留现场，不保证全部操作可事务回滚。

## 验证与后续

自动测试使用 fixture 隔离 Trellis 进程，真实外部接入和自动安装另行验证；各次测试数量与结果见 [验证状态](validation.md)，行为边界见 [CLI 约定](cli-contract.md)。

尚需开展：

1. AI 驱动归档：业务验收通过后再移动 work、更新索引和引用，代码不随之移动。
2. operations 关联、来源索引和模板受控升级。

archive 命令、自动 operations 提炼、自动 VS Code/Codex 项目配置、备份调度和生产部署均未实现。
