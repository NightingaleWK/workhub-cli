# 验证与发布状态

更新：2026-09-24。旧记录保留在 [0.1.0 验证快照](history/validation-0.1.0.md)，不能将其“未提交、未发布、21 项测试”等描述用于当前版本。

## 发布状态

| 对象 | 当前证据 |
|---|---|
| GitHub | 公开 MIT 仓库，main 持续提交推送 |
| 0.1.1 | npm 已发布，公开安装后 install/init/check 验证通过 |
| 0.1.2 | npm 已发布，公开安装后的版本、install/init/check 验证通过 |
| npm latest | 发布后通过 npm view 实测为 0.1.2 |

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

## 未验收边界

- 0.1.2 已完成宿主机隔离公开安装验证，不等于用户 VM 的交互验收。
- 用户在 Hyper-V 中手工测试；0.1.1 截图中的旧框和缺依赖错误不能当作新版本验收。
- 尚未在另一条真实 Codex 对话中完成整项业务接续验证。
- 其他操作系统、全部 Node 小版本和所有 Trellis 安装渠道未全面验证。
- archive、operations 自动化及全量 Markdown 链接审计不是 wk 当前能力。

## 重现

```powershell
npm ci
npm run check
npm run build
npm test
npm pack --dry-run
```

公共运行记录见 [GitHub Actions](https://github.com/NightingaleWK/workhub-cli/actions)。实验使用临时根目录、WK_CONFIG_PATH 和 npm_config_prefix，不修改正式工作区。临时文件可能被清理，历史路径仅供追踪，不是永久交付链接。
