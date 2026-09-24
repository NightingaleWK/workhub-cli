# 版本与发布核对

本项目每完成一项 OpenSpec 工作就提交并推送 Git。包版本、GitHub 标签和 npm 发布是三个独立的发布决定；Codex 应主动提醒维护者，由维护者选择是否进入发布步骤。

| 对象 | 权威来源 | 何时变化 |
|---|---|---|
| 当前源码包版本 | `package.json` 的 `version`；`package-lock.json` 与之同步，`workhub --version` 从包清单读取 | 维护者选定发布里程碑后 |
| GitHub 发布标签 | 远端 Git 标签 `v<包版本>` | 维护者同意为已验证的提交打标签后 |
| npm 已发布版本 | npm registry 的包元数据和 `dist-tags` | 维护者明确同意发包且发布成功后 |

普通功能提交不要求新增标签或改包版本。`CHANGELOG.md` 的“未发布”段落累积后续变化；历史版本条目和带日期的验证记录不追随新版本改写。

## 日常检查

先构建，再执行只读一致性检查：

```powershell
npm run check
npm run build
npm run check:version
npm test
```

`check:version` 比较包清单、锁文件顶层与根包版本、构建后的 CLI 输出；它不检查或创建 Git 标签，也不访问 npm registry。普通提交即使位于最新发布标签之后，也应通过该检查。

## 决定发布里程碑时

1. 查看从上一个发布标签以来的提交、未发布变更、OpenSpec 完成状态和测试证据，由维护者决定新包版本及是否打标签、发包。不得因 Git 已推送就推断 npm 已发布。
2. 若维护者决定更新包版本，在干净的工作树中使用 `npm version <新版本号> --no-git-tag-version` 同步包清单和锁文件；检查实际差异。该命令不创建 Git 标签。
3. 运行上面的检查、`npm pack --dry-run`，并在隔离目录安装新打包文件核对 `workhub --version` 与包清单，确认包只提供 `workhub` 命令。将“未发布”条目整理到对应版本标题，记录验证结论。
4. 拟使用的标签名为 `v<package.json.version>`。创建前只读检查本地和远端是否已有同名标签，并核对拟发布的目标提交：

   ```powershell
   $version = node -p "require('./package.json').version"
   $tag = "v$version"
   git rev-parse HEAD
   git tag --list $tag
   git ls-remote --tags origin "refs/tags/$tag" "refs/tags/$tag^{}"
   ```

   若同名标签已存在，用 `git rev-list -n 1 $tag` 查看本地目标提交；带 `^{}` 的远端结果是注释标签对应的提交。两者与拟发布的 HEAD 不一致时停止，不覆盖或强制推送。
5. 维护者确认版本和标签后，提交发布变更并推送，再创建和推送所批准的标签；推送后重新读取远端标签，确认目标提交。没有批准标签时只提交和推送普通 Git 变更。
6. 只有维护者明确同意 npm 发包后才执行发布。发布前运行 `npm view workhub-cli dist-tags.latest` 和目标版本查询，避免重复版本；发布成功后再次查询 registry，并从公开包隔离安装验证。Git 标签、提交或上传开始都不能代替这项确认。

上述步骤是发布核对清单，不会由普通 CI 自动打标签或发包。若某项检查失败，应修复并重新验证后再继续。
