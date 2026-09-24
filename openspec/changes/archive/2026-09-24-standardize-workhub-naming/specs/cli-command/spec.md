# Spec Delta

## MODIFIED Requirements

### Requirement: 仅提供 `workhub` 命令

安装 WorkHub npm 包后，用户必须（MUST）能通过 `workhub` 调用 CLI；包提供的可执行入口、帮助和面向用户的后续操作提示必须（MUST）使用 `workhub`。

#### Scenario: 全局安装后调用
- **WHEN** 用户全局安装 npm 包并运行 `workhub --help`
- **THEN** 命令可执行，帮助用法显示 `workhub`，且现有子命令可通过该入口调用

#### Scenario: 安装包入口
- **WHEN** 用户在干净的 npm 全局前缀安装包
- **THEN** 该包创建 `workhub` 命令包装器

#### Scenario: 运行后续操作提示
- **WHEN** CLI 提示用户执行 install 或 init
- **THEN** 面向用户的命令示例使用 `workhub install` 或 `workhub init`
