# Trellis 接入说明与验证

2026-09-24，本机 Trellis 0.6.17，Python 3，Windows。

在临时目录执行官方 `init --codex --yes --user wk-test --no-monorepo` 成功，生成 .trellis、.agents、.codex 和 AGENTS.md；没有自动生成 Git 仓库。wk install 会读取全局 `git config --global user.name`，或在交互界面要求填写，并把结果保存到 WorkHub `.wk/config.json`；wk init 创建新空间时将该值传给 `--user`，不再写死开发者名称。

任务创建接口是 `.trellis/scripts/task.py create`，要求非空标题和 description，支持 `--slug`、`--no-start`。使用 --no-start 避免 wk 改变全局共享的当前任务。Trellis 自己初始化的 bootstrap 指针保持原样。

任务目录前缀由 Trellis 的当前日期生成，task.json 的 id 使用传入 slug。因此 wk 用工作编号作 slug，创建后读取 task.json 定位实际目录，再登记 taskPath。手动选择未来或历史工作日期不修改 Trellis 自己的审计时间。

Windows npm 的 trellis.ps1 指向 `node_modules/@mindfoldhq/trellis/bin/trellis.js`。wk 先在 PATH 各目录下寻找该正式入口，找不到时通过 npm root --global 查询全局包目录；再用当前 node 加参数数组执行，避免拼接 cmd.exe 命令导致含空格/特殊字符路径出错。

初始化时 Trellis 会提示 hooks 需要用户配置。wk 保留提示对应的配置边界，不修改全局 Codex 配置，不将 hooks 提示误认为初始化失败。

AGENTS.md 的 TRELLIS 区块不修改；wk 在其后追加自己的管理区块。后续若 wk 区块改变，须先处理差异，不能直接覆盖人工内容。

真实验证覆盖 trellis、work+trellis、code+trellis、work+code+trellis，以及跨年度新工作复用既有 Trellis/代码仓库。各任务均生成正式 task.json、目录映射和交接文件，检查通过。

## 0.1.2 引入的自动安装流程

install 中依赖缺失时，用户同意后执行 npm install -g @mindfoldhq/trellis@latest；非交互需 --install-trellis，--yes 本身不授权。已有安装不升级，dry-run 不安装，拒绝或失败则不继续写入根配置。

安装后重新发现入口并执行 --version；init 再检查 --codex、--no-monorepo、--user 和 Python。仅有版本结果不等于全部接口兼容。安装器不自动安装 Python。

真实自动安装使用临时 npm prefix 验证，得到 0.6.17；latest 将来可变化，不能承诺所有未来版本兼容。关联已有 Trellis 仓库不会重新执行 init -u，因此不会替换其已有开发者身份。
