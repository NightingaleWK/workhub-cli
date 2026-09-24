# 规格增量：版本一致性

## Purpose

此能力确保维护者只需在受控的发布步骤中维护包版本，CLI 显示的版本与包内容一致；项目检查能及早发现版本元数据分歧，同时不把普通 Git 提交误判为必须发布的新版本。

## ADDED Requirements

### Requirement: CLI 报告运行包的版本

`wk --version` 必须（MUST）输出当前运行包的包清单版本，不得依赖另一处手工维护的版本常量。

#### Scenario: 从源码构建运行
- **WHEN** 维护者构建源码并执行 `wk --version`
- **THEN** 输出与该源码根目录 `package.json` 的 `version` 完全一致

#### Scenario: 从打包文件安装运行
- **WHEN** 维护者从生成的 npm 包安装并执行 `wk --version`
- **THEN** 输出与安装包内 `package.json` 的 `version` 完全一致

### Requirement: 本地与 CI 检查包版本一致性

项目必须（MUST）提供可重复运行的检查，并在 CI 中运行；检查发现包清单、锁文件或构建后 CLI 输出的版本不一致时必须返回失败和可定位的说明。

#### Scenario: 版本一致
- **WHEN** 包清单、锁文件和构建后的 CLI 输出使用同一版本
- **THEN** 检查通过

#### Scenario: 锁文件遗漏更新
- **WHEN** `package-lock.json` 的根版本或根包版本与 `package.json` 不同
- **THEN** 检查失败并指出不一致的文件和值

#### Scenario: CLI 输出遗漏更新
- **WHEN** 构建后的 `wk --version` 与 `package.json` 不同
- **THEN** 检查失败并指出两个版本值

### Requirement: 普通提交与发布标签分离

普通 Git 提交必须（MUST）允许包版本和最新发布标签保持不变；仅在维护者选定发布里程碑后，发布核对步骤才必须验证拟创建的 `v<包版本>` 标签与目标提交及包版本一致。

#### Scenario: 完成一项普通 OpenSpec 工作
- **WHEN** 工作已验证、提交并推送，但维护者尚未决定发布里程碑
- **THEN** 版本一致性检查不因缺少新标签而失败，也不自动创建标签或发布 npm 包

#### Scenario: 准备创建发布标签
- **WHEN** 维护者明确要求为当前包版本创建发布标签
- **THEN** 发布核对步骤确认标签名对应包版本且目标提交正确，并在不一致时阻止继续
