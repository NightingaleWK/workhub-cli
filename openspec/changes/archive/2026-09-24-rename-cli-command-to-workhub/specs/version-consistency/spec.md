# Spec Delta

## MODIFIED Requirements

### Requirement: CLI 报告运行包的版本

`workhub --version` 必须（MUST）输出当前运行包的包清单版本，不得依赖另一处手工维护的版本常量。

#### Scenario: 从源码构建运行
- **WHEN** 维护者构建源码并执行 `workhub --version`
- **THEN** 输出与该源码根目录 `package.json` 的 `version` 完全一致

#### Scenario: 从打包文件安装运行
- **WHEN** 维护者从生成的 npm 包安装并执行 `workhub --version`
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
- **WHEN** 构建后的 `workhub --version` 与 `package.json` 不同
- **THEN** 检查失败并指出两个版本值
