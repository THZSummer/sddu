---
name: opencode-operator
description: "当 LLM Agent 或用户需要程序化操作 opencode 时加载--包括非交互式任务执行（opencode run）、无头 HTTP 服务器（opencode serve）、ACP 协议通信、会话/Agent/Skill/Plugin/MCP 管理和 GitHub CI/CD 集成。不负责 opencode 配置文件编辑（走 customize-opencode）。"
---

# opencode-operator

## 接口

阅读本章节即可使用本 Skill，无需阅读后续路径细节。

### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `intent` | string | ✅ | 操作意图描述，如"跑一次代码审查"、"启动无头服务器"、"列出可用模型" |
| `mode` | enum | ❌ | 操作模式：`cli`(默认) / `serve` / `acp` / `github`。根据 intent 自动推导 |
| `project_dir` | string | ❌ | 目标项目目录，默认当前工作目录 |
| `agent` | string | ❌ | 指定 Agent 名称（如 `build`、`sddu`、`sddu-spec`） |
| `model` | string | ❌ | 指定模型，格式 `provider/model-id` |

### 返回值

**成功**：返回可执行的命令序列或 HTTP API 调用方案，Agent 直接执行或输出给用户。

**异常**：

| 情况 | 处理 |
|------|------|
| opencode 未安装 | 提示安装命令 |
| serve 端口被占用 | 建议换端口 `--port <n>` |
| Agent 名称不存在 | 提示 `opencode agent list` 查看 |
| 模型不可用 | 提示 `opencode models` 查看 |

### 调用示例

```
用户："帮我在 src/ 上跑一次代码审查"
-> opencode run --agent build --auto --dir . "审查 src/ 目录的代码质量"

用户："启动一个无头服务器让我通过 API 调用"
-> opencode serve --port 4096 --hostname 127.0.0.1
-> 返回 API 端点列表

用户："列出当前项目有哪些 Agent"
-> opencode agent list
```

---

## 操作路径

根据操作意图选择路径。单次任务用 run，长期运行用 serve，进程间通信用 acp，CI/CD 用 github。

### 路径 1: opencode run（单次任务）

最常用的非交互式入口。执行一条消息，返回结果，退出。

**基本用法**：
```bash
# 自然语言任务
opencode run --auto "解释 src/index.ts 的架构"

# JSON 事件流输出（适合 Agent 解析）
opencode run --format json --auto "重构 auth 模块"

# 指定 Agent + 模型
opencode run --agent sddu --model deepseek/deepseek-v4-pro --auto "@sddu 状态"

# 带文件附件
opencode run --auto -f screenshot.png "分析这张架构图"

# 在指定目录运行
opencode run --auto --dir /path/to/project "修复 lint 错误"

# 继续上次会话
opencode run -c --auto "继续刚才的重构"

# 连接到已有 serve 实例（避免冷启动）
opencode run --attach http://localhost:4096 --auto "修复 lint 错误"

# 执行斜杠命令而非自然语言
opencode run --command compact
```

**关键 flags**：

| Flag | 类型 | 说明 |
|------|------|------|
| `--format json` | string | 输出原始 JSON 事件流，Agent 解析用 |
| `--auto` | boolean | 自动批准权限，无人值守必需 |
| `--agent` | string | 指定 Agent |
| `--model` | string | 指定模型（provider/model 格式） |
| `--attach` | string | 连接到 serve 实例 |
| `--dir` | string | 指定工作目录 |
| `--command` | string | 执行斜杠命令 |
| `-f/--file` | array | 附件文件 |
| `-c/--continue` | boolean | 继续上次会话 |
| `-s/--session` | string | 指定 session ID |
| `--variant` | string | 模型变体（推理强度：high/max/minimal） |
| `--thinking` | boolean | 显示思考过程 |
| `-i/--interactive` | boolean | 交互式分屏模式 |

### 路径 2: opencode serve（HTTP API）

启动无头 HTTP 服务器，暴露完整 REST API。适合长期运行、多会话管理、外部系统集成。

**启动服务器**：
```bash
# 基本启动（随机端口）
opencode serve

# 指定端口和主机
opencode serve --port 4096 --hostname 127.0.0.1

# 启用 mDNS 服务发现
opencode serve --mdns

# 设置 CORS
opencode serve --cors example.com another.com

# 启动并打开 Web 界面
opencode web
```

**认证**：
```bash
export OPENCODE_SERVER_PASSWORD=secret
export OPENCODE_SERVER_USERNAME=myuser  # 可选，默认 opencode
```

**核心 API 端点**：

| 端点 | 方法 | 用途 |
|------|:--|------|
| `/global/health` | GET | 健康检查 + 版本 |
| `/project/current` | GET | 当前项目信息 |
| `/config` | GET/PATCH | 读取/修改配置 |
| `/config/providers` | GET | 列出模型供应商 |
| `/session` | POST | 创建会话 |
| `/session/:id` | GET/DELETE/PATCH | 查看/删除/修改会话 |
| `/session/:id/message` | POST | 发送消息并等待响应 |
| `/session/:id/message` | GET | 获取会话消息列表 |
| `/session/:id/prompt_async` | POST | 异步发送消息 |
| `/session/:id/command` | POST | 执行斜杠命令 |
| `/session/:id/abort` | POST | 中止当前执行 |
| `/session/:id/share` | POST | 分享会话 |
| `/file/content?path=` | GET | 读取文件内容 |
| `/find?pattern=` | GET | 全文搜索 |
| `/find/file` | GET | 按文件名搜索 |
| `/find/symbol` | GET | 按符号搜索 |
| `/agent` | GET | 列出所有 Agent |
| `/mcp` | GET/POST | 查询/管理 MCP 服务器 |
| `/event` | GET(SSE) | 实时事件流 |
| `/doc` | GET | OpenAPI 3.1 规范 |

**典型交互流程**：
```bash
# 1. 创建会话
SID=$(curl -s -X POST http://localhost:4096/session \
  -H "Content-Type: application/json" \
  -d '{"title":"refactor-task"}' | jq -r .id)

# 2. 发送消息
curl -s -X POST http://localhost:4096/session/$SID/message \
  -H "Content-Type: application/json" \
  -d '{"parts":[{"type":"text","text":"重构 auth 模块"}]}'

# 3. 获取回复
curl -s http://localhost:4096/session/$SID/message

# 4. 中止执行（如需要）
curl -s -X POST http://localhost:4096/session/$SID/abort

# 5. SSE 事件流（实时监听）
curl -N http://localhost:4096/event
```

**TUI 附加到 serve**：
```bash
opencode attach http://localhost:4096
```

### 路径 3: opencode acp（标准协议）

通过 stdin/stdout 的 nd-JSON 通信，符合 ACP（Agent Client Protocol）标准。适合进程间通信，无 HTTP 开销。

```bash
# 启动 ACP 服务器
opencode acp --cwd /path/to/project

# 外部进程通过 stdin 发送 nd-JSON 消息
echo '{"method":"initialize","params":{...}}' | opencode acp
```

### 路径 4: GitHub Agent（CI/CD）

将 opencode 集成到 GitHub Actions，实现 PR 审查、自动修复等 CI/CD 自动化。

```bash
# 安装 GitHub Agent
opencode github install

# 手动触发执行
opencode github run --event push

# 拉取 PR 分支后启动 opencode
opencode pr 42
```

---

## CLI 命令速查

### 会话管理

| 命令 | 用途 |
|------|------|
| `opencode session list` | 列出所有会话 |
| `opencode session delete <id>` | 删除会话 |
| `opencode export [sessionID]` | 导出会话为 JSON |
| `opencode import <file>` | 从 JSON 导入会话 |
| `opencode stats` | Token 用量和费用统计 |
| `opencode stats --days 7 --models` | 按天/模型查看用量 |

### 模型与供应商

| 命令 | 用途 |
|------|------|
| `opencode models` | 列出所有可用模型 |
| `opencode models anthropic` | 按供应商过滤 |
| `opencode models --refresh` | 刷新模型列表 |
| `opencode providers list` | 列出已配置的供应商 |
| `opencode providers login <id>` | 登录供应商 |
| `opencode providers logout <id>` | 退出登录 |

### Agent 管理

| 命令 | 用途 |
|------|------|
| `opencode agent list` | 列出所有 Agent |
| `opencode agent create` | 创建自定义 Agent |

### MCP 服务器管理

| 命令 | 用途 |
|------|------|
| `opencode mcp add` | 添加 MCP 服务器 |
| `opencode mcp list` | 列出已配置的 MCP 服务器 |
| `opencode mcp auth` | MCP 服务器认证 |
| `opencode mcp debug` | 调试 MCP 服务器 |

### 插件管理

| 命令 | 用途 |
|------|------|
| `opencode plugin <module>` | 安装插件 |
| `opencode plugin <module> --global` | 全局安装 |

### 其他

| 命令 | 用途 |
|------|------|
| `opencode completion` | 生成 Shell 补全脚本 |
| `opencode debug` | 诊断和故障排除 |
| `opencode upgrade` | 升级到最新版本 |
| `opencode upgrade <version>` | 升级到指定版本 |
| `opencode uninstall` | 卸载 opencode |
| `opencode db path` | 查看数据库路径 |
| `opencode db <query>` | 执行数据库查询 |

---

## 配置管理

opencode 配置分两层：用户级（全局）和项目级（覆盖合并）。

### 配置文件位置

| 层级 | 路径 | 管控内容 |
|------|------|---------|
| 用户级 | `~/.config/opencode/opencode.json` | provider、mcp、model |
| 项目级 | `./opencode.json` 或 `.opencode/opencode.json` | agent、permission、plugin |
| 用户级 Agent | `~/.config/opencode/agents/<name>.md` | 全局 Agent prompt |
| 项目级 Agent | `.opencode/agents/<name>.md` | 项目 Agent prompt |
| 用户级 Skill | `~/.config/opencode/skills/<name>/SKILL.md` | 全局 Skill |
| 项目级 Skill | `.opencode/skills/<name>/SKILL.md` | 项目 Skill |

> 配置编辑（修改 opencode.json、创建 Agent/Skill 文件）走 `customize-opencode` Skill。本 Skill 只管运行时操作。

### 运行时配置查询

```bash
# 通过 API 查看当前配置
curl http://localhost:4096/config

# 查看当前项目的 Agent 列表
curl http://localhost:4096/agent

# 查看可用模型
opencode models
```

---

## 常见模式

### 模式 1: 脚本化代码任务

```bash
# 在 CI 中自动修复 lint
opencode run --format json --auto --dir . "修复所有 ESLint 错误" 2>/dev/null

# 批量给文件加注释
opencode run --auto "给 src/utils.ts 加上 JSDoc 注释"
```

### 模式 2: serve + 多会话管理

```bash
# 启动服务器
opencode serve --port 4096 &

# 创建多个并行会话
SID1=$(curl -s -X POST http://localhost:4096/session -d '{"title":"task-1"}' | jq -r .id)
SID2=$(curl -s -X POST http://localhost:4096/session -d '{"title":"task-2"}' | jq -r .id)

# 并行发送任务
curl -X POST http://localhost:4096/session/$SID1/message \
  -d '{"parts":[{"type":"text","text":"审查 auth/"}]}' &
curl -X POST http://localhost:4096/session/$SID2/message \
  -d '{"parts":[{"type":"text","text":"审查 payment/"}]}' &
```

### 模式 3: 外部 Agent 通过 HTTP 驱动 opencode

```
openclaw / Claude Code / 其他 Agent
  -> POST http://localhost:4096/session
  -> POST http://localhost:4096/session/:id/message
  -> GET  http://localhost:4096/session/:id/message
  -> 解析回复，继续编排
```

### 模式 4: 指定 SDDU Agent 执行专项任务

```bash
# 用 sddu-spec Agent 写需求
opencode run --agent sddu-spec --auto --format json "为用户认证功能写需求"

# 用 sddu-build Agent 构建
opencode run --agent sddu-build --auto --format json "构建 specs-tree-root/specs-tree-auth/"

# 用 build Agent 做代码审查
opencode run --agent build --auto "审查 src/ 目录"
```

### 模式 5: 会话导出与迁移

```bash
# 导出会话
opencode export <session-id> --sanitize > session.json

# 在另一台机器导入
opencode import session.json

# 分享会话（生成链接）
opencode run --share --auto "帮我分析这段代码"
```

---

## 边界

**本 Skill 负责**：
- opencode CLI 命令的构造和执行指引
- HTTP API（serve 模式）的端点说明和调用方案
- ACP 协议的使用指引
- GitHub Agent 的 CI/CD 集成
- 运行时会话管理（创建、查询、中止、导出）
- Agent/Model/MCP 的运行时查询

**本 Skill 不负责**：
- 编辑 `opencode.json` 配置文件 -> 走 `customize-opencode`
- 创建 Agent/Skill 定义文件 -> 走 `customize-opencode`
- 编写 Agent prompt 模板 -> 走 `customize-opencode`
- 管理 MCP 服务器配置 -> 走 `customize-opencode`

---

## 修订记录

| 版本 | 变更说明 | 日期 | 修订人 |
|------|---------|------|--------|
| v1.0 | 初始创建 - 覆盖 opencode CLI 4 条操作路径 + HTTP API 端点表 + CLI 速查 + 配置管理 + 5 种常见模式 | 2026-07-24 | sddu-skill-creator |
