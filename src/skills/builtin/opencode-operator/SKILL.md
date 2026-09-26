---
name: opencode-operator
description: "当 LLM Agent 或用户需要程序化操作 opencode 时加载--包括非交互式任务执行（opencode run）、无头 HTTP 服务器（opencode serve）、ACP 协议通信、会话/Agent/Skill/Plugin/MCP 管理和 GitHub CI/CD 集成，以及查询/巡检当前运行中的 opencode serve 进程和会话。不负责 opencode 配置文件编辑（走 customize-opencode）。"
---

# opencode-operator

> **依赖初始化（自动）**：`scripts/serve-api.cjs` 依赖 Commander（唯一 npm 依赖，零子依赖）。本技能内置 `scripts/init.cjs`，SDDU 安装/同步时**自动执行 `npm install`** 完成依赖初始化，开箱即用。仅当环境异常时需手动在 `scripts/` 下执行 `npm install`。

## 接口

阅读本章节即可使用本 Skill，无需阅读后续路径细节。

> **命令自发现**（始终优先于本文件的静态表格）：
> - serve-api 子命令：`node scripts/serve-api.cjs help`（顶层命令清单）；`help <command>` 或 `<command> --help`（单命令参数/示例/说明）；`--version` 查看版本
> - 未知命令/参数会报错并给出近似建议（如 `sessons` → `sessions`）；退出码：0 成功 / 1 运行时错误 / 2 用法错误
> - opencode CLI 命令：`opencode --help`（列出全部顶层命令）；`opencode <command> --help` 查看子命令与参数详情

### v2-only（v5.0+）

本工具**只使用 opencode v2 API**（`/api/*`），不再兼容 v1 端点。opencode 官方 v2 文档见 `opencode.ai/v2/docs/`。`serve-api.cjs` 通过 **`/doc` OpenAPI 运行时自探测**（`detect` 子命令可见）校验 v2 端点可用性：

- **会话链路**：`/api/session` 创建 + `/api/session/{id}/prompt` 发送
- **完成检测**：v2 `/wait` 端点（精确等待 idle；服务端未实现时回退 v2 消息数轮询）
- **中止**：v2 `/interrupt`
- **响应解析**：v2 `{data:...}` 包裹 / 204 无体
- **多形态请求体**：prompt 尝试 `{text}` → `{prompt:{text}}`；revert/fork 尝试 `{before}` → `{messageID}`（小版本草稿差异）
- 需要 v2 端点而服务器缺失时**明确报错**并引导升级 opencode；输出的 `via` 字段标注实际链路
- **注意**：`diff` 端点当前仅 v1 提供（v2 无），故 v2-only 下 `diff` 报错不可用；`fork`/`stats` 本就依赖 v2 端点，服务端未实现时同样报错
- **version 字段**：v1 `/global/health` 才带 version，v2 `/api/health` 只有 `{healthy:true}`——故 `status`/`detect` 的 version 可能显示 `unknown`（v2 API 限制）

### 一 server 多项目（v2 location）

opencode v2 的 `location` 使**会话目录独立于 serve 启动目录**——同一 serve 可并发服务多个项目的会话，各自解析各自的配置/模型（实测：serve 在 ~ 启动，会话 location=B 时 agent 的 `pwd` 即为 B）。用法：

```bash
node scripts/serve-api.cjs start --port 4096            # 在 ~ 启动（中立目录，serve 无 --dir）
node scripts/serve-api.cjs submit --port 4096 --dir /home/usb/wks/gomoku --message "实现五子棋"
node scripts/serve-api.cjs send   --port 4096 --dir /home/usb/wks/sddu   --message "审查 src/"
node scripts/serve-api.cjs attach --port 4096 --dir /home/usb/wks/gomoku # TUI 打开指定项目
```

- `submit`/`send`/`run` 的 `--dir` = 会话/运行项目目录（v2 `location.directory`；`run --dir` 与官方 `opencode run --dir` 对齐）；`attach --dir` = TUI 打开的项目（官方语义）
- `start`/`restart`/`stop` **无** `--dir`：serve 工作目录恒为**家目录 ~**（多项目场景用固定中立目录，避免 cwd 歧义；会话目录由 v2 location 独立指定）
- `--dir`（v2 location）是 v2 能力：服务器缺 v2 会话端点时明确报错引导升级 opencode
- 非 git 目录的 location 归入 `global` 项目；多项目会话可见于 `sessions` 列表（含 directory 字段）

### 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|:--:|------|
| `intent` | string | ✅ | 操作意图描述，如"跑一次代码审查"、"启动无头服务器" |
| `mode` | enum | ❌ | 操作模式，根据 intent 自动推导。见下表 |
| `project_dir` | string | ❌ | 目标项目目录，默认当前工作目录 |
| `agent` | string | ❌ | 指定 Agent（如 `build`、`sddu`）。用 `opencode agent list` 查看可用值 |
| `model` | string | ❌ | 指定模型，格式 `provider/model-id`（v2 支持 `#variant` 推理强度变体）。用 `opencode models` 查看可用值 |

**mode 选项**：

| 值 | 命令 | 适用场景 | 时长参考 |
|:--|:--|:--|:--|
| `cli`（默认） | `opencode run` | 单次任务：代码审查、bug 修复、问答 | <5min 单次；5-30min 用 `-c` 续接 |
| `serve` | `opencode serve` | 长期运行、多会话、需进度监控 | >30min |
| `acp` | `opencode acp` | 进程间 stdin/stdout 通信 | 任意 |
| `github` | `opencode github` | CI/CD 自动化 | 触发式 |

> 不确定时用 `cli`。任务超 5 分钟需 `-c` 续接或改用 `serve`。详见 [长流程编排](#长流程编排)。

### 返回值

**成功**：返回可执行的命令或 API 调用方案。长流程（>5 分钟）额外返回续接策略。

**异常**：

| 情况 | 处理 |
|------|------|
| opencode 未安装 | 提示安装命令 |
| serve 端口被占用 | 建议换端口 `--port <n>` |
| Agent 名称不存在 | 提示 `opencode agent list` 查看 |
| 模型不可用 | 提示 `opencode models` 查看 |

### 调用示例

```
# 简单任务（< 5 分钟）
用户："帮我在 src/ 上跑一次代码审查"
-> opencode run --agent build --auto --dir . "审查 src/ 目录"

# 长流程任务（5-30 分钟，需续接）
用户："用 SDDU 跑完 todo-app 的全流程"
-> opencode run --auto --dir /project --agent sddu "todo-app"
-> （超时后续接）opencode run -c --auto --dir /project "继续执行"

# 长期运行非阻塞（> 30 分钟，提交后去做别的）
用户："启动服务器跑个长任务，我先去忙别的"
-> node scripts/serve-api.cjs start --port 4096
-> node scripts/serve-api.cjs submit --port 4096 --message "任务" --agent build
-> （随时）node scripts/serve-api.cjs status --port 4096 --session <sid>
-> （完成）node scripts/serve-api.cjs result --port 4096 --session <sid>
-> （太慢）node scripts/serve-api.cjs abort --port 4096 --session <sid>
-> （用完）node scripts/serve-api.cjs stop --port 4096

# 无值守精准预授权（v2，取代 --auto 全量放行）
用户："无人值守跑重构，只允许改 src/ 和跑 git 命令"
-> node scripts/serve-api.cjs submit --port 4096 --message "重构" \
     --allow "edit:src/**" --allow "shell:git *"
-> （--allow 依赖 v2 permissions；服务器不支持时明确报错）

# 会话检查点回滚（v2，失败回退到上一阶段）
-> node scripts/serve-api.cjs revert --port 4096 --session <sid> --action stage   # 自动选中最后一条用户消息
-> node scripts/serve-api.cjs revert --port 4096 --session <sid> --action commit  # 提交回滚
-> node scripts/serve-api.cjs revert --port 4096 --session <sid> --action clear   # 取消暂存

# 探测服务器 API 面（调试 v2 端点可用性）
-> node scripts/serve-api.cjs detect --port 4096

# 查询类
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

> **长流程提示**：任务预计超过 5 分钟时，`opencode run` 可能被 shell 超时中断。使用 `-c` 续接或改用 `opencode serve`。详见 [长流程编排](#长流程编排) 章节。

### 路径 2: opencode serve（HTTP API）

启动无头 HTTP 服务器，适合长期运行、多会话管理、外部系统集成。

**通过脚本操作（推荐）**：

阻塞模式（提交后等待完成）：
```bash
# 一键模式：启动 -> 执行任务 -> 关闭
node scripts/serve-api.cjs run --message "审查代码" --agent build --dir . --port 4096
```

非阻塞模式（提交后去做别的，随时回来看进度）：
```bash
# 1. 启动 serve（一次性）
node scripts/serve-api.cjs start --port 4096

# （可选）巡检当前有哪些 serve 在跑
node scripts/serve-api.cjs ps

# 2. 提交任务，立即返回 sessionId
node scripts/serve-api.cjs submit --port 4096 --message "审查代码" --agent build
# -> { sessionId: "abc-123", status: "submitted" }

# 3. 去做别的事情...

# 4. 随时查看进度
node scripts/serve-api.cjs status --port 4096 --session abc-123
# -> { status: "running", messageCount: 5 }

# 5. 完成后取结果
node scripts/serve-api.cjs result --port 4096 --session abc-123
# -> { status: "completed", messages: [...] }

# 6. 太慢可以中止
node scripts/serve-api.cjs abort --port 4096 --session abc-123

# 7. 全部用完关闭 serve
node scripts/serve-api.cjs stop --port 4096
```

> 不推荐直接 curl 调用 HTTP API。脚本封装了会话创建、消息发送、轮询、进程管理等确定性逻辑。如需查看完整 API 规范，访问运行中 serve 的 `/doc` 端点。

**认证**（可选）：
```bash
export OPENCODE_SERVER_PASSWORD=secret
```

**TUI 附加**：
```bash
opencode attach http://localhost:4096
```

> serve 不会自动退出。用 `scripts/serve-api.cjs stop --port 4096` 或 `lsof -ti:4096 | xargs kill` 关闭。

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

## 长流程编排

任务预计超过 5 分钟时（多阶段 workflow、批量重构），需特殊策略应对 shell 超时和进度不可见问题。

### 策略选择

| 预计时长 | 推荐策略 | 原因 |
|:--|:--|:--|
| < 5 分钟 | `opencode run --auto` | 单次完成，最简单 |
| 5-30 分钟 | `opencode run -c` 分段续接 | 绕过超时，自动恢复上下文 |
| > 30 分钟 | `scripts/serve-api.cjs` 非阻塞模式 | 提交即走，随时查进度 |

### `-c` 续接模式

`opencode run` 被超时中断后，`-c` 续接最后一次会话，保留完整上下文：

```bash
# 第一次调用（可能超时）
opencode run --auto --dir <project> --agent sddu "启动多阶段任务"

# 超时后续接（可多次）
opencode run -c --auto --dir <project> "继续执行"
```

**关键点**：
- `-c` 继续最后一次会话，保留完整对话历史和上下文
- 多次 `-c` 之间，Agent 的中间产物已持久化到磁盘（文件、state.json 等）
- 续接时如不确定进度，先检查项目产物文件再决定提示词

### 进度监控

| 场景 | 方法 | 示例 |
|:--|:--|:--|
| serve 非阻塞任务 | 脚本 status 命令 | `node scripts/serve-api.cjs status --port 4096 --session <sid>` |
| serve 实时事件流 | SSE 端点 | `curl -N http://localhost:4096/event` |
| serve 全局巡检 | 脚本 ps 命令 | `node scripts/serve-api.cjs ps` |
| `opencode run` 阻塞任务 | 读项目状态文件 | `cat <project>/.sddu/specs-tree-root/*/state.json \| jq .phase` |
| `opencode run` 阻塞任务 | 检查产物文件 | `ls <output_dir>/` 看文件增长 |
| `opencode run` 需事件流 | `--format json` 管道 | `opencode run --format json --auto "..." \| jq .type` |

### serve 长流程示例

```bash
# 一条龙：启动 serve -> 提交任务 -> 轮询 -> 取结果 -> 自动关闭
node scripts/serve-api.cjs run --message "执行多阶段任务" --agent sddu --dir . --port 4096
# stdout JSON: { sessionId, status, messages, duration }
# stderr 实时进度: [12.5s] status: running

# 或组合模式（需并行多会话时）
node scripts/serve-api.cjs start --port 4096
node scripts/serve-api.cjs send --port 4096 --message "任务1" --agent build
node scripts/serve-api.cjs send --port 4096 --message "任务2" --agent build
node scripts/serve-api.cjs stop --port 4096
```

---

## CLI 命令速查

> **查看所有 CLI 命令**：`opencode --help`（列出全部顶层命令，始终是最新清单，优先于本章节静态表格）；`opencode <command> --help` 查看某命令的子命令与参数详情。

### 会话管理

| 命令 | 用途 |
|------|------|
| `opencode session list` | 列出所有会话 |
| `opencode session delete <id>` | 删除会话 |
| `opencode export [sessionID]` | 导出会话为 JSON |
| `opencode import <file>` | 从 JSON 导入会话 |
| `opencode stats [--days N] [--models]` | Token 用量和费用统计 |

### 模型与供应商

| 命令 | 用途 |
|------|------|
| `opencode models [provider] [--refresh]` | 列出可用模型（可过滤/刷新） |
| `opencode providers list` | 列出已配置的供应商 |
| `opencode providers login\|logout <id>` | 登录/退出供应商 |

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

### 其他

| 命令 | 用途 |
|------|------|
| `opencode plugin <module> [--global]` | 安装插件（可选全局） |
| `opencode debug` | 诊断和故障排除 |
| `opencode upgrade [version]` | 升级到最新或指定版本 |
| `opencode uninstall` | 卸载 opencode |

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
# 查看当前配置
opencode debug

# 查看当前项目的 Agent 列表
opencode agent list

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

### 模式 2: serve 多会话并行

```bash
# 启动服务器
node scripts/serve-api.cjs start --port 4096

# 并行提交多个任务
node scripts/serve-api.cjs send --port 4096 --message "审查 auth/" &
node scripts/serve-api.cjs send --port 4096 --message "审查 payment/" &
wait

# 关闭服务器
node scripts/serve-api.cjs stop --port 4096
```

### 模式 3: 外部 Agent 通过脚本驱动 opencode

```bash
# openclaw / Claude Code / 其他 Agent 调用
node scripts/serve-api.cjs run --message "重构 auth 模块" --agent build --dir /project
# -> 解析 stdout JSON 获取结果，继续编排
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

### 模式 6: 多阶段长流程（分段续接）

适合 SDDU 7 阶段 workflow 等预计 20-30 分钟的任务：

```bash
# 第一轮：启动（可能超时）
opencode run --auto --dir /path/to/project --agent sddu "project-name"

# 检查进度
cat /path/to/project/.sddu/specs-tree-root/*/state.json | jq .phase
# -> "discovered"

# 第二轮：续接
opencode run -c --auto --dir /path/to/project "继续执行"

# 再检查
cat /path/to/project/.sddu/specs-tree-root/*/state.json | jq .phase
# -> "specified"

# 重复直到完成
opencode run -c --auto --dir /path/to/project "继续"
# -> {"phase": "validated", "status": "completed"}
```

### 模式 7: 服务巡检 / 僵尸进程清理

```bash
# 发现所有运行中的 serve 进程加健康探测
node scripts/serve-api.cjs ps
# -> [{ pid: "12345", port: 4096, health: "alive", ... }, { pid: "12346", port: 4097, health: "down", ... }]

# 对 down 或不再需要的进程清理
node scripts/serve-api.cjs stop --port 4097

# 复核清理结果
node scripts/serve-api.cjs ps
```

### 模式 8: 会话清理

> 会话数据全局共享，端口号只决定连哪个 serve 进程不隔离数据，任意端口可查/删全局会话。

```bash
# 列出所有会话，找到废弃/僵尸会话
node scripts/serve-api.cjs sessions --port 4096
# -> [ { "id": "abc-123", "title": "...", "agent": "build" }, ... ]

# 删除指定会话（不可逆）
node scripts/serve-api.cjs rm --port 4096 --session abc-123
# -> { "deleted": true, "sessionId": "abc-123", "response": true }

# 复核确认已删除
node scripts/serve-api.cjs sessions --port 4096
```

---

## 脚本

| 脚本 | 路径 | 用途 |
|------|------|------|
| serve-api.cjs | scripts/serve-api.cjs | 封装 opencode serve HTTP API（**Agent 接口**，v2-only）。**21 个子命令**：**阻塞** `run`（一条龙）、`send`（阻塞等待）；**非阻塞** `start`、`submit`（提交即返回）、`status`（查进度）、`result`（取结果）、`abort`（中止，v2 interrupt）、`stop`（关闭）、`wait`（阻塞等 idle）；**进程运维** `restart`（杀旧重启+日志/PID 落盘，原 server/restart.cjs）、`attach`（TUI 附加，原 server/attach.cjs，需 TTY）；**只读巡检** `ps`（进程+健康探测）、`sessions`（列会话，**全局**）、`rm`（删会话）、`detect`（**API 面自探测**）、`skills`（列 Skills）、`stats`（会话统计）；**v2 会话治理** `revert`（检查点 stage/commit/clear）、`fork`（分叉）、`compact`（压缩上下文）、`diff`（文件变更，**v2 无端点→报错**）。`start`/`restart` 均在 **~ 启动**、落盘日志与 PID 至 `~/.opencode/logs/`。通用参数 `--port`（默认 4096）、`--hostname`、`--timeout`/`--interval`、`--allow`（可重复，`"action:resource"` 预授权规则）。零依赖，stdout JSON，stderr 进度。**标准 CLI 行为**：每命令 `--help`/`help <cmd>`、未知命令/参数报错+近似建议、类型校验、退出码 0/1/2、`--version`——不看文档即可自如使用。 |
| cli 依赖 | scripts/package.json + node_modules/ | **Commander v15**（唯一 npm 依赖，零子依赖，整包随 Skill 目录分发）。新环境若无 node_modules，在 scripts/ 下执行 `npm install` 即可。 |

> **融合说明（v4.3）**：原 `scripts/server/` 三个人用运维脚本已融入统一 CLI——`restart`（原 restart.cjs）、`attach`（原 attach.cjs）、`stop` 功能原已重合。`attach` 为交互式命令（需 TTY、接管终端、不输出 JSON），其余命令人机通用：`--help` 给人看，stdout JSON 给 Agent 解析。注意：原脚本默认端口 14096，CLI 统一默认 4096，沿用旧端口需显式 `--port 14096`。

---

## 参考文档

拓展 `serve-api.cjs` 新能力时，先通过以下来源确认可用 API。

| 来源 | 地址 | 用途 |
|------|------|------|
| v2 API 参考（权威） | https://opencode.ai/v2/docs/api/ | 136 operations / 245 schemas，OpenAPI 3.1 |
| v2 官方客户端 | https://opencode.ai/v2/docs/build/client/ | `@opencode/client`（类型化）+ `@opencode/client/service`（`Service.ensure()` 免端口管理）|
| v2 插件指南 | https://opencode.ai/v2/docs/build/plugins/ | transforms/hooks/RPC/storage/自定义 websearch provider |
| v2 插件迁移指南 | https://opencode.ai/v2/docs/build/plugins/migrate-v1 | V1 hook → V2 映射表；双栈写法（V1 对象式 ≥1.18.29） |
| v2 Skills 体系 | https://opencode.ai/v2/docs/skills | 发现源（含 `.claude/skills`、`.agents/skills` 兼容）+ **HTTP catalog 分发** |
| v2 CLI/配置 | https://opencode.ai/v2/docs/cli/ 、/v2/docs/config/ | `mini`/`service`/`api`/`pair` 新命令、配置字段重组 |
| v1 旧文档（存档） | https://opencode.ai/docs/server/ | 仅历史参考，v1 端点以本地 `/doc` 实测为准 |
| 运行时 OpenAPI 规范 | `GET http://主机:端口/doc` | **当前版本最权威**——本地二进制与 v2 文档可能不同步 |
| GitHub 仓库 | https://github.com/anomalyco/opencode | 源码、issue、release |

### 用 `/doc` 发现新端点

启动 serve 后用 `curl -s http://127.0.0.1:端口/doc` 取 OpenAPI 规范（**注意首访实测 ~25s**，需 30s+ 超时），再用 `node` 或 `jq` 解析 paths 列出所有端点，对照上方已封装端点找出缺口。

```bash
curl -s http://127.0.0.1:4097/doc | node -e "const d=JSON.parse(require('fs').readFileSync(0));console.log(Object.keys(d.paths).join('\n'))"
# 或直接用封装好的探测命令：
node scripts/serve-api.cjs detect --port 4097
```

### 已封装端点（v2-only）

`serve-api.cjs` 当前封装的 v2 端点（v1 端点一律不再使用）：

| 用途 | v2 端点 | serve-api 子命令 |
|------|---------|-----------------|
| 健康检查 | `GET /api/health`（仅 `{healthy:true}`，无 version） | `status` / `ps` / `detect` |
| OpenAPI 规范 | `GET /doc`（JSON，首访可能 >10s） | 全命令自探测 |
| 创建会话 | `POST /api/session` | `send` / `submit` / `run` |
| 列会话 | `GET /api/session`（cursor 分页，全局） | `sessions` |
| 删会话 | `DELETE /api/session/{id}`（204） | `rm` |
| 发消息 | `POST /api/session/{id}/prompt`（text/prompt.text 双形态） | `send` / `submit` / `run` |
| 消息列表 | `GET /api/session/{id}/message`（{data,cursor}，type 判别联合体） | `status` / `result` |
| 中止 | `POST /api/session/{id}/interrupt`（可 resume） | `abort` |
| 等待 idle | `POST /api/session/{id}/wait`（本地 1.18.32 未实现，503 → v2 消息数轮询回退） | `wait` / 内部完成检测 |
| 检查点回滚 | `POST /api/session/{id}/revert/{stage\|commit\|clear}` | `revert` |
| 分叉 | `POST /api/session/{id}/fork`（本地未实现） | `fork` |
| 压缩上下文 | `POST /api/session/{id}/compact` | `compact` |
| Skill 列表 | `GET /api/skill`（{location,data}） | `skills` |
| 会话统计 | `GET /api/experimental/session/stats`（本地未实现） | `stats` |
| 会话 diff | ❌ v2 无此端点（仅 v1 有）→ `diff` 命令报错不可用 | `diff` |

> v2 官方 API 共 136 operations（https://opencode.ai/v2/docs/api ），上表之外的常见端点（`/api/session/{id}/context`、`/api/event` SSE、`/api/fs/*`、`/api/model`、`/api/provider` 等）可按需扩展。

---

## v2 迁移备忘

opencode 官方已发布 v2（文档 `opencode.ai/v2/docs/`，npm 包 `@opencode/cli` 2.x，桌面/网页版）。本地 1.18.32 为混合过渡版（v1 全量 + v2 大部分端点）。本节速查迁移要点，避免踩坑。

### 版本现状判定（2026-09 实测）

| 事实 | 影响 |
|------|------|
| 1.18.32 = hybrid：v1 端点全存活 + `/api/*` v2 面大部分可用 | serve-api.cjs 已切 **v2-only**，只用 `/api/*`；v1 端点不再调用 |
| 本地 v2 与 v2 官方文档**不同步**（如健康端点本地 `/api/health`、文档 `/api/info`；prompt 本地要 `{prompt:{text}}`、文档 `{text}`） | **必须**以运行时 `/doc` 自探测为准，不可硬编码 v2 文档路径——serve-api.cjs 已内置 |
| v2 无会话 diff 端点（仅 v1 有） | `diff` 命令在 v2-only 下报错不可用 |
| **v1/v2 双 inbox**：v1 时代创建的会话，消息存在 v1 存储；v2 `/api/session/{id}/message` 对它们是**空投影**（实测 300 会话中仅 4 个 v2 可读；如 `ses_f266677c` 在 v1 端点有 522 条、v2 返回 0） | **v2-only 读不到历史 v1 会话的消息**；数据未丢，如需可用 `curl /session/{id}/message` 直读 v1 端点 |
| v2 `wait` 服务本地未实现（503 "not available yet"） | 完成检测自动回退 v2 消息数轮询 |
| v2 `/api/health` 无 version 字段（仅 v1 `/global/health` 有） | `status`/`detect` 的 version 可能显示 `unknown` |
| `@opencode/client@2.0.16` 对 1.18.32 仅部分兼容（list/create/SSE ✅；info/remove ❌） | 升级到 v2 服务端后再切换官方客户端 |
| V1 对象式插件 `server()` 导出 ≥1.18.29 支持 | 本地 1.18.32 **现在就能写双栈插件** |

### 配置字段映射（v1 → v2）

| v1 | v2 | 备注 |
|----|----|------|
| `provider` | `providers.*` | settings/headers/body/variants/modelID |
| `agent` | `agents` | markdown frontmatter 回归；`mode: primary\|subagent\|all`；内置无 `scout` |
| `permission` | `permissions` | **有序规则数组**，最后匹配胜出；`bash`→`shell`、`task`→`subagent`；新增 `skill`/`question`/`external_directory` |
| `mcp` 直挂 | `mcp.servers.<name>` | `enabled`→`disabled` |
| `instructions` | 不再加载 | 统一 `AGENTS.md` |
| `model` | `model`（`provider/model#variant`） | 根 model 不保留 variant；variant 可用于 run/session/agent/command |

新概念：`references`（外部目录/Git 仓库别名）、`skills`（额外发现源 + HTTP catalog）、`worktree.directory`、`experimental.policies`。

### v2 新命令速查（本地 1.18.32 部分可用，以 `--help` 实测为准）

```bash
opencode service status|restart|stop|start   # 共享后台服务生命周期（v2 架构核心）
opencode api get /api/session                # 带 service 发现+认证的 API 直调（未来可替代脚本 HTTP 层）
opencode pair                                # 一次性链接+二维码，网页版远程接入
opencode reload                              # 配置热重载（会话在下一步边界继续）
opencode mini                                # 极简交互界面
opencode session export <id> --sanitize      # 脱敏导出
```

### 双栈插件写法（V1+V2 同包，本地 ≥1.18.29 可用）

```ts
import { Plugin } from "@opencode/plugin"
export default {
  ...Plugin.define({
    id: "example",
    async setup(ctx) {
      // v2: transforms + hooks（ctx.tool.hook / ctx.session.hook / ctx.storage ...）
    },
  }),
  async server() {
    return { "tool.execute.before": async () => { /* v1 hook */ } }
  },
}
```

V1 调 `server()`，V2 读 `setup()`；两套 API 各自独立，不做翻译。V1 hook → V2 映射详见官方迁移指南（`/v2/docs/build/plugins/migrate-v1`）。

### 对 SDDU 的潜在机会（待评估）

- **Skills HTTP catalog**：`opencode.json` 的 `skills` 数组支持 HTTP URL（index.json + 版本化文件）——`sddu-skill-sync` 可进化为集中分发
- **自定义 websearch provider 插件**（`ctx.websearch.transform`）：可桥接豆包搜索进 opencode 原生 websearch
- **Console/Go 计划**：workspace 级策略下发 + $10/月 35+ 开源模型池（`opencode-go/<model>`）

---

## 边界

**本 Skill 负责**：
- opencode CLI 命令的构造和执行指引
- serve 模式通过 `scripts/serve-api.cjs` 脚本封装的调用方案
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
| v1.1 | 新增长流程编排章节（`-c` 续接模式 + 进度监控 + serve 长流程示例）+ 模式 6 多阶段续接实战 | 2026-07-24 | 实战优化 |
| v1.2 | 接口章节重写：mode 选项表 + agent/model 发现方式 + 长流程调用示例 + 续接策略返回 | 2026-07-24 | 接口完善 |
| v1.3 | 补全 serve 生命周期：停止服务器 3 种方式 + 典型交互流程 step 6 + 接口示例关闭 + CLI 速查精简 | 2026-07-24 | 生命周期完善 |
| v2.0 | 脚本化：新增 `scripts/serve-api.cjs` 封装 serve API；路径 2/长流程/常见模式全部改为脚本驱动，移除裸 curl 示例和 API 端点表 | 2026-07-24 | 脚本化重构 |
| v2.1 | 新增非阻塞工作流：`submit`/`status`/`result`/`abort` 4 个子命令；进度监控表增加 serve 非阻塞查询 | 2026-07-24 | 非阻塞支持 |
| v2.2 | 新增 `ps` 子命令巡检运行中的 serve 进程；SKILL.md 同步服务巡检模式 | 2026-07-26 | @sddu-fast |
| v2.3 | 新增参考文档章节（官方文档地址 + /doc 端点 + 已封装端点对照） | 2026-07-26 | @sddu-fast |
| v2.4 | 新增 sessions/rm 子命令管理 serve 会话 | 2026-07-26 | @sddu-fast |
| v2.5 | 微调 description 补充 serve 进程/会话巡检触发词 | 2026-07-26 | @sddu-fast |
| v2.6 | 接口章节加命令自发现提示（无参数运行查看 usage） | 2026-07-26 | @sddu-fast |
| v2.7 | CLI 命令速查章节加 opencode --help 自发现提示 | 2026-07-26 | @sddu-fast |
| v2.8 | 接口章节自发现提示扩展为全集块（serve-api + opencode CLI 并列） | 2026-07-26 | @sddu-fast |
| v2.9 | sessions 加 --grep/--limit/--full 参数 + 文档说明会话数据全局共享 | 2026-07-26 | @sddu-fast |
| v3.0 | sessions 默认 limit 从 20 改为 5 | 2026-07-26 | @sddu-fast |
| v3.1 | 新增人工运维脚本 `scripts/server/`（restart.cjs / stop.cjs / attach.cjs，人用，CJS 人类友好输出）；分层约定：server/ 人用 vs serve-api.cjs Agent 用 | 2026-08-12 | @sddu-fast |
| v4.0 | **v1/v2 双代兼容大版本**：① `/doc` OpenAPI 运行时自探测（detect 子命令）+ 会话链路 v2 优先（create/prompt v2，prompt 双形态 text→prompt.text）；② 完成检测 v2 wait 优先/消息数轮询回退，abort→interrupt 优先；③ 响应三态兼容（裸值/{data}/204）+ v2 消息视图排序归一化；④ 新增 8 个子命令：detect/wait/skills/stats/revert/fork/compact/diff；⑤ `--allow` 无值守精准预授权（v2 permissions Ruleset）；⑥ 新增「v2 迁移备忘」章节（配置字段映射/新命令速查/双栈插件/SDDU 机会）；⑦ 已封装端点表改双代对照。全部经 1.18.32 hybrid 实测（wait 503 回退、revert v2 驱动链路成功、ruleset array 形态接受） | 2026-09-26 | @sddu-fast |
| v4.1 | **标准 CLI 重构**：新增零依赖微框架 `lib/cli.cjs`（git 风格）；每个命令支持 `--help`/`-h` 与 `help <cmd>`（含参数表/示例/说明），顶层 `--version`；未知命令/参数报错+levenshtein 近似建议；严格参数校验（未知 flag 报错而非静默忽略、必填缺失明确提示、number 类型校验）；退出码标准化 0/1/2；--port 统一默认 4096（不再部分命令强制必填）；大端点（/doc、/api/skill、/session）GET 超时提升至 30s 并带退避重试（服务端惰性构建抖动实测修复）。Handler 逻辑零变更 | 2026-09-26 | @sddu-fast |
| v4.5.0 | **迁移为 SDDU 内置技能**：由用户级（`.sddu/skills/`）迁入框架级（`src/skills/`，随 SDDU 插件分发），保留原名 opencode-operator（业务本质是操作 opencode，不加 sddu- 前缀）。SKILL.md 新增「依赖安装」提示（Commander 依赖 node_modules 不进版本库，首次使用需在 scripts/ 下 `npm install`）。sync manifest 标记由 user 转 framework | 2026-09-26 | @sddu-fast |
| v4.5.1 | **start/restart/stop 移除 `--dir`（用户反馈"serve 还有默认 dir 很怪"）**：官方 `opencode serve` 实测无 `--dir`（用进程 cwd），故 SDDU 的 `start`/`restart` 同步移除 `--dir`——serve 工作目录恒为 cwd，日志/PID 落 `<cwd>/.opencode/logs/`；`stop` 移除 `--dir`，兜底改用**全局 `ps` 扫描**（扫 `opencode serve --port <port>`，不依赖 cwd，比原 pidfile 兜底更可靠）。`run`/`attach`/`send`/`submit` 的 `--dir` 保留（官方 run/attach 均有 --dir，send/submit 为 v2 location）。实测：start --no-wait 秒回后立即 stop，ps 兜底精确清理未绑端口进程 | 2026-09-26 | @sddu-fast |
| v5.0.0 | **v2-only 大版本（用户决策："不要兼容 v1，只用 v2 api，diff 报错"）**：彻底移除 v1 兼容层——createSession/sendPrompt/fetchMessages/sessions/rm/abort/healthCheck/probeHealthDirect 全部只用 v2 端点，v2 端点缺失时明确报错引导升级 opencode。**修复 sessions 显示 bug**：原 `if (surface.v1.session)` 优先用 v1 `/session`（只返回 serve 启动目录项目的会话），导致多项目会话"看似都归到一个启动项目"；改用 v2 `/api/session`（全局，含 location.directory）后正确显示所有项目。diff 因 v2 无端点而报错（用户决策：严格 v2-only）。version 因 v2 `/api/health` 无 version 字段显示 unknown。实测：sessions 跨项目正确显示（sddu/LGDL/tes/tmp） | 2026-09-26 | @sddu-fast |
| v5.0.1 | **sessions 摘要补 directory + `/doc` 超时提升**：① v2 会话目录在 `location.directory`（嵌套），非顶层 `directory` → 默认摘要改用 `(s.location && s.location.directory) || s.directory` 并补 `directory` 字段（此前仅 `--full` 有），多项目会话可一眼区分；② `/doc` 首访生成实测 ~25s，超过 getSurface 15s 超时 → 偶发"无 v2 端点"误报（v2-only 下致命），超时提到 30s | 2026-09-26 | @sddu-fast |
| v5.1.0 | **start/restart 默认启动目录改为家目录 ~（用户决策）**：多项目场景下 serve 启动用 cwd 有歧义（同一操作在不同目录跑出不同"默认项目"，attach/sessions 时易混淆），改用固定中立目录 ~——serve 恒在 ~ 启动，日志/PID 落 `~/.opencode/logs/`，无 location 的会话目录 → ~；会话目录由 v2 location 独立指定，不受影响。偏离官方 `opencode serve`（官方用 cwd）系有意为之 | 2026-09-26 | @sddu-fast |
| v5.1.1 | **sessions 摘要输出完整 session id**：原摘要 `String(s.id).slice(0,12)` 截断为 12 字符，用户从摘要复制该 id 传 `status/result/rm --session` 会报 `HTTP 404 SessionNotFoundError`（服务器需完整 id，不做前缀匹配）。改为输出完整 id，可直接复制使用 | 2026-09-26 | @sddu-fast |
| v5.1.2 | **文档补回「v1/v2 双 inbox」限制**：用户实测 v1 时代会话的消息在 v2 端点为空投影（`ses_f266677c` v1 端点 522 条、v2 返回 0；300 会话仅 4 个 v2 可读）。v2-only 决策下这些历史消息工具内不可读（数据未丢，可 curl v1 端点直读）。补回迁移备忘表说明避免再困惑（v5.0.0 改写该表时误删） | 2026-09-26 | @sddu-fast |
| v4.4.2 | **attach 默认逻辑回归官方 + stop pidfile 兜底**：① `attach --dir` 恢复默认当前目录（不传时等价官方 `opencode attach` 在 cwd 运行，始终拼 `--dir <cwd>`）；② `stop` 修复 start --no-wait 后立即 stop 的竞态——lsof/fuser 查不到未绑端口的新进程时，读 `<dir>/.opencode/logs/opencode-serve-<port>.pid` 按 PID 杀（带 isOpencodeServe 校验，防陈旧 pidfile 误杀 PID 复用进程）；stop 新增 `--dir` 定位 pidfile；restart 同步传 dir。实测：start --no-wait 秒回后立即 stop，pidfile 兜底精确清理无残留 | 2026-09-26 | @sddu-fast |
| v4.4.1 | **对齐官方 dir 默认行为（用户建议）**：`start`/`restart`/`attach`/`run` 的 `--dir` 移除硬编码默认值 `.`（help 不再显示 default: "."）。官方实测：`opencode serve` 本无 `--dir`（用进程 cwd）、`opencode attach --dir` 与 `opencode run --dir` 均无默认值。现在不带 --dir 时 serve 落在自然 cwd（等价官方），attach 仅在显式传 --dir 时才加该参数（官方默认由 opencode 自己决定）。示例同步清理 | 2026-09-26 | @sddu-fast |
| v4.4.0 | **一 server 多项目（v2 location）**：`submit`/`send` 新增 `--dir` 会话项目目录（v2 `location.directory`），`run` 的 --dir 同步传入。实测验证 1.18.32 hybrid 原生支持：同一 serve 上不同 location 会话拿到不同 projectID（`global` vs 仓库哈希）、各自解析各自 provider/model 配置（无配置目录解析出默认模型、sddu 解析出 deepseek），且 serve cwd=scripts 时 location=sddu 的会话 `pwd` 精确返回 `/home/usb/wks/sddu`——会话目录彻底独立于 serve 启动目录。v1 无此能力则明确报错。via 字段加 `+location` 标注 | 2026-09-26 | @sddu-fast |
| v4.3.2 | **健康检查体验优化（用户实测反馈）**：① `start`/`restart` 阻塞等待期间 stderr 每 3s 输出进度（含耗时与探测次数），消除 15-30s 黑盒等待的"疑似卡死"感；② 根治 `version: unknown`——冷启动早期 /api/health 先应答但无 version 字段，探测提前接受残缺响应；现改为**拿到带 version 的响应才算完全就绪**（超时兜底阈值后移至 26s/38s，实测 /global/health 完全就绪约 25s）。实测 restart 31.7s 全程进度可见、version 精确返回 | 2026-09-26 | @sddu-fast |
| v4.3.1 | **进程管理三 bug 修复（用户实测反馈）**：① `start` 加端口占用预检——已运行且健康则幂等返回 alreadyRunning（绝不重复 spawn），被占但不健康则报错引导 stop（实测实锤：opencode serve 端口被占时**不会失败退出而是滞留/衍生进程**，一条误启可产生 3+ 进程）；② `ps` 修复健康张冠李戴——同 (hostname,port) 只探测一次 + 多进程 conflict 标记与处置建议 + 经 /proc/<pid>/cwd 读真实工作目录（spawn 走 cwd 无 --dir 参数，命令行解析不到）；③ `start`/`restart` 新增 `--no-wait` 后台模式（0.8s 秒回 starting，人用不再阻塞 30-45s；默认仍阻塞至就绪保自动化确定性）；`restart` 杀残留失败时中止避免双进程；probeHealthDirect 优先取带 version 的响应。实测：幂等预检/conflict 检出/--no-wait 秒回+35s 后就绪 | 2026-09-26 | @sddu-fast |
| v4.3 | **运维脚本融入统一 CLI**：原 `scripts/server/` 三脚本（restart.cjs/stop.cjs/attach.cjs，v3.1 引入的人用运维层）删除，功能融入 serve-api.cjs——新增 `restart`（杀旧→detached 重启→30s 健康检查→日志/PID 落盘 `<dir>/.opencode/logs/`，无旧进程时兼容冷启动）与 `attach`（TUI 附加，TTY 守卫：非交互环境明确报错引导 Agent 改用 send/submit/result；退出码透传）命令；`stop` 原已重合；`start` 增强为同样落盘日志/PID。默认端口统一 4096（原 server/ 脚本默认 14096，沿用需显式 `--port 14096`）。killByPort 抽出供 stop/restart 复用；probeHealthDirect 直连健康端点（不依赖 /doc 自探测，冷启动更快）。实测：restart 28.3s 全链路（含落盘校验）、attach 守卫精确拦截 | 2026-09-26 | @sddu-fast |
| v4.2 | **Commander 框架迁移**：入口层由自建 lib/cli.cjs 换为 **Commander v15**（用户决策；唯一 npm 依赖、零子依赖，随 scripts/ 的 package.json+node_modules 整包分发）。行为与 v4.1 对齐：每命令 `--help`/`help <cmd>`、未知命令/参数自动建议（Commander 内置）、必填校验（requiredOption）、number 校验（InvalidArgumentError）、退出码 0/1/2（exitOverride+parseAsync 集中裁决，注意 exitOverride 不级联子命令需逐命令挂载）、无参数 help→stderr exit 1、`--version` 4.2.0。删除 lib/cli.cjs。附带：rm 的 DELETE 加 30s 超时+重试（服务端预热抖动实测：响应超时但服务端已执行，重试遇 404 属预期）。Handler 逻辑零变更 | 2026-09-26 | @sddu-fast |
