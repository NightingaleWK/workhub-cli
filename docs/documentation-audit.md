# 文档一致性审计

日期：2026-09-24。范围：仓库 README、docs、CHANGELOG、AGENTS、CLI 源码和命令帮助。未批量修改桌面旧方案、已生成用户工作区文件或已发布 npm 包。

## 修正项

| 发现 | 处理 |
|---|---|
| 计划仍说 Trellis 可选、七种组合 | 当前计划改为 Trellis 必选、四种组合；旧计划移入 history |
| 文档写源码空目录、尚未提交 | 当前文档反映公开仓库与已实现状态 |
| 验证文档仍为 21 项且未发布 | 当前验证页改为 32 项及具体版本边界；原记录独立保留 |
| README 提前称 0.1.2 已公开 | 区分源码 0.1.2 与 registry latest 0.1.1、待认证状态 |
| 根配置描述遗漏 gitUser | 补充保存字段、全局 Git 建议来源、不修改 Git 本身 |
| 重装声称完全不覆盖配置 | 说明会更新确认的 gitUser 和根指针，业务文件保留 |
| Trellis 探测只提 PATH | 补充 npm root --global 回退与安装后验证 |
| 所有 dry-run 都不执行依赖命令 | 分别说明 install 的只读探测和 init 的计划检查 |
| 所有操作都有运行日志 | 明确仅 init 生成工作操作日志 |
| 引用不存在 cli-contract.md | 新增当前 CLI 约定并接入导航 |
| 规划源码目录被当作现状 | 列出真实 cli/common/core/trellis/dependencies/preview 文件 |

## 尚未改变的实现边界

重复 install 建议值仍来自全局 Git，旧根缺 gitUser 需重跑 install；关联旧 Trellis 不修改其身份。未实现 archive/迁移命令。此审计不为了让文档看似一致而把未实现能力写成完成。

## 文档维护规则

README 是当前使用入口；cli-contract 是行为边界；development-plan 是现状和后续；validation 是有证据的验证/发布状态；CHANGELOG 按版本记录；history 只用于追溯。发布认证完成后需要再次核对 registry，更新发布状态，不把准备发布当作已发布。

## 本次检查结果

已对照实际 CLI help 和源码核对参数。使用 Markdown AST 解析 10 份文档，检查 22 个链接、10 个表格和 16 个代码围栏；相对链接目标存在，未发现未闭合围栏。两份历史快照去掉新增说明后，与修改前 Git 原文完全一致。

本次仅改文档，不重跑代码测试；32 项通过来自 0.1.2 发布准备时的实际结果，不冒充本次新运行。桌面早期方案和旧 outputs 副本未同步覆盖，仓库文档是当前维护入口。
