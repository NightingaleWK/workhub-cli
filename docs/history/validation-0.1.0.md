> 历史快照：以下描述只代表当时的计划或验证结果，不是当前操作说明。当前行为以 [README](../../README.md)、[开发状态](../development-plan.md) 和 [验证状态](../validation.md) 为准。

# 0.1.0 验证与交接

日期：2026-09-24。

## 已完成

- TypeScript CLI 与 npm bin 入口；install/init/list/show/check。
- 交互输入、日期默认、多选、复用已有仓库、工作区冲突处理及执行预览。
- 根配置、独立 Git 仓库、登记、年度索引、入口模板与交接。
- Trellis 正式初始化和任务创建，不更改共享当前任务。
- AI 参数模式、JSON、退出码、dry-run、锁、失败日志与安全重试。
- 本地 npm 包已生成，未发布到公共 npm，未全局安装到用户环境。

## 验证结果

| 验证 | 结果 |
|---|---|
| TypeScript 编译及 noEmit 检查 | 通过 |
| Vitest / Node 26.3.0 | 21/21 通过 |
| Vitest / Node 22.23.3 | 21/21 通过 |
| npm 安装时依赖审计 | 0 vulnerabilities（安装时快照） |
| 七种非空组件组合 | 三种无 Trellis 组合由自动测试覆盖；四种 Trellis 组合真实执行通过 |
| Trellis 0.6.17 正式接口 | 初始化、任务创建、目录映射和交接均通过 |
| 已有 Trellis 和代码复用 | 创建 2027 年新工作，复用原仓库，通过 |
| Windows TTY 交互 | 中文名、代号、默认日期、多选、确认及完成输出通过 |
| npm pack | 成功；包包含 dist、README 和 agents 模板 |
| 隔离前缀安装 | 成功，安装后的 wk.cmd 可调用 |
| 脱离源码目录运行 | 从临时目录执行安装后的 CLI，三组件初始化与 check 通过 |

首轮测试曾有一项超过默认 5 秒超时；调整 Windows Git 行为测试的预算为 30 秒后通过，未删除或跳过测试。交互验证发现默认日期回车被空值校验拦截，已修复，并通过实际 TTY 再次确认。

## 证据位置

以下为本机临时验收目录，可能被系统清理；它们不是正式业务目录：

- Trellis 初始接口探测：`C:\Users\<用户名>\AppData\Local\Temp\wk-trellis-probe-844cd7b15795469ba6f970d8b334f626`
- 多组合与复用验收：`C:\Users\<用户名>\AppData\Local\Temp\wk-integration-ec90d945a0354ec6a34bb831573d51bd\WorkHub 中文`
- TTY 验收：`C:\Users\<用户名>\AppData\Local\Temp\wk-interactive-session-hub`
- 安装包验收：`C:\Users\<用户名>\AppData\Local\Temp\wk-package-5b65311f2cf44649b157032f38bf15cd`

自动测试可用 `npm run build` 后 `npm test` 重跑，测试数据隔离在临时目录；源码、模板和安装包是正式交付内容。

## 实际边界

- 首版没有 archive 命令，不执行归档搬移或 operations 内容提炼。
- 未创建用户正式 WorkHub，未修改用户真实根指针或 FreeFileSync。
- 源码仓库已 git init，所有新增内容尚未提交，未推送。
- 尚未在另一条真实 Codex 对话中做业务接续验收；当前完成的是入口文件、目录映射与交接存在性及内容核对。
- 未覆盖所有 Node 小版本；实测 22.23.3 和 26.3.0，最低版本声明受依赖要求约束。
- Windows 已实测，其他系统尚未完整验证；全量 Markdown 引用审计和模板升级不在首版范围。

## 下一步

用户可从本地 tgz 安装 wk，再运行 wk install 选择正式根目录，使用一个真实工作试点。正式运行前不需要再生成代码；但需要用户在 VS Code 和 Codex 项目中选好目录，以 Trellis 为主，并验证新对话恢复。
