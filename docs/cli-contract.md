# CLI 行为约定（当前源码）

使用入口见 [README](../README.md)，可安装版本见 [验证状态](validation.md)。

## install

1. 输入工作根目录，默认当前用户主目录下的 WorkHub。
2. 从全局 Git user.name 建议开发者名称，没有时要求输入；不是 GitHub 账号认证。
3. 检查目录和仓库边界，探测 Trellis。
4. 显示根目录、Git 用户、Trellis 状态以及目录创建/保留状态。确认或返回修改，Esc 取消。
5. 缺少 Trellis 时单独询问是否执行 `npm install -g @mindfoldhq/trellis@latest`，拒绝则终止。
6. 验证 Trellis 版本命令可执行，再建立公共目录、导航 Git、根配置和本机指针。

非交互全局安装需显式 `--install-trellis`；单独 --yes 不授权。已有版本不升级，Python 不自动安装。install 检查版本命令，init 才检查所需选项和 Python。

install 的 dry-run 允许 Git/npm 只读探测，不安装、不写入。没有全局 Git 用户名时非交互报错，目前没有 --git-user 参数。全局依赖安装先于 WorkHub 写锁；成功安装不会因为后续配置失败自动卸载。

## init

| 参数 | 行为 |
|---|---|
| 省略 --components | 交互默认 work；非交互 Trellis + work |
| --components work,code | Trellis + work + code |
| --components none 或 trellis | 仅 Trellis |
| --components code | Trellis + code |
| --trellis-existing | 关联已有独立 Trellis 仓库 |
| --code-existing | 关联已有独立代码仓库，需选 code |
| --workspace-name | 指定替代 .code-workspace 文件名 |

Trellis 始终包含。none 只单独使用；未知组件报错。关联路径相对 WorkHub，限于对应分类目录。日期默认为本地当天。

确认前不创建项目文件。返回修改保留之前答案；修改后重新计算编号、路径并检查冲突。确认后执行依赖预检查及有日志的初始化。init 的 dry-run 只验证计划，不执行完整运行环境检查。

新空间通过保存的 gitUser 执行 Trellis 初始化；旧根缺 gitUser 时先重跑 install。关联已有空间不重新初始化身份。任务创建使用 --no-start，不切换共享当前任务。

工作区只预留，不生成文件。新仓库没有首个自动提交，用户仍需有效 Git 提交身份。

## 查询检查与恢复

- list/show 读取登记，show 检查工作区文件是否存在。
- check 检查已知目录、独立 Git 根、业务 README、AGENTS 入口、任务文件及年度索引。
- 旧工作缺 Trellis 报错；缺工作区仅提示待创建。
- 相同参数 init 可恢复已知未完成操作；未知目标、参数不同或指令区块冲突时报错。
- 没有通用 repair/migrate/archive 命令，也不扫描所有 Markdown 链接。

## 输出

--json 使用 JSON；无 TTY 普通输出也为 JSON；交互模式使用中文提示。退出码：0 成功、1 执行或检查失败、2 参数/配置格式错误、3 冲突、130 取消。
