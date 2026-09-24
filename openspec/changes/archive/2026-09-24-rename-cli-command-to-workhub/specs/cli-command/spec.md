# Spec Delta

## Purpose

此能力规定 WorkHub npm 包在全局安装后只提供 `workhub` 命令，并让帮助和提示使用同一名称；命令更名后继续读取原有工作配置与登记数据。

## ADDED Requirements

### Requirement: 仅提供 `workhub` 命令

安装 WorkHub npm 包后，用户必须（MUST）能通过 `workhub` 调用现有 CLI；该包不得（MUST NOT）提供 `wk` 可执行别名。帮助和面向用户的后续操作提示必须（MUST）使用 `workhub`。

#### Scenario: 全局安装后调用
- **WHEN** 用户全局安装包含本变更的 npm 包并运行 `workhub --help`
- **THEN** 命令可执行，帮助用法显示 `workhub`，且现有子命令可通过该入口调用

#### Scenario: 安装包不提供旧入口
- **WHEN** 用户在干净的 npm 全局前缀安装包含本变更的包
- **THEN** 该包只创建 `workhub` 命令包装器，不创建 `wk` 包装器

#### Scenario: 运行后续操作提示
- **WHEN** CLI 提示用户执行 install 或 init
- **THEN** 面向用户的命令示例使用 `workhub install` 或 `workhub init`

### Requirement: 命令更名不迁移工作数据

`workhub` 必须（MUST）继续读取既有本机指针、工作根配置和登记，不得因命令更名要求用户迁移 `.wk` 数据目录或修改 `WK_CONFIG_PATH`。

#### Scenario: 新命令读取旧配置
- **WHEN** 用户已用旧命令配置工作根，并在升级包后调用 `workhub list`
- **THEN** CLI 使用原有本机指针和工作根配置，读取原有登记
