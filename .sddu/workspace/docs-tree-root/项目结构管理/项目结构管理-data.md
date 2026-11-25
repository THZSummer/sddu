# 项目结构管理 — state.json Schema 演进

> ⚠️ **代码扫描校正**: 版本号为 Feature 规范中的设计版本。实际源码文件对应关系：`schema-v1.2.5.ts`（v1.0 优化版）、`schema-v2.0.0.ts`（v2.0 正式版）、`schema-v3.0.0.ts`（v3.0 当前版）。

## v1.0 → v1.2.5（原始模型 → 优化版）

单 Feature 维度，仅含基础字段：

```json
{
  "version": "1.0.0",
  "status": "active",
  "phase": 0
}
```

- **局限**：无树形结构、无嵌套、无依赖管理
- **状态管理**：集中式全局 state.json，所有 Feature 共用一个文件
- **代码实现**：`src/state/schema-v1.2.5.ts` — 在原始模型基础上经过多次增量修补

---

## v2.0（分布式状态引入）

`specs-tree-tree-structure-optimization`（FR-TREE-001）引入：

```json
{
  "version": "2.0.0",
  "status": "active",
  "phase": 0,
  "depth": 0,
  "childrens": [],
  "dependencies": []
}
```

- **分布式状态**：每个 Feature 独立维护 `state.json`
- **childrens 数组**：记录子 Feature 列表，支持状态聚合
- **depth 字段**：标记嵌套深度（根=0，每层+1）
- **父级轻量化**：父 Feature 具有 `isParent` 标记，禁止进入 tasks 及后续阶段

---

## v2.1（完整树形结构）

`specs-tree-tree-structure-optimization-v2`（FR-TREE-002）增强：

```json
{
  "version": "2.1.0",
  "status": "active",
  "phase": 0,
  "depth": 0,
  "childrens": [
    {
      "name": "specs-tree-sub-feature",
      "status": "active",
      "phase": 0,
      "depth": 1
    }
  ],
  "phaseHistory": [
    { "phase": 0, "timestamp": "2026-04-15T10:00:00Z" }
  ],
  "dependencies": [
    {
      "target": "specs-tree-other-feature",
      "type": "blocking"
    }
  ],
  "isParent": false
}
```

新增字段：
- **phaseHistory**：阶段变更时间线，记录每次 phase 跳转的时间戳
- **dependencies 增强**：支持 `blocking` / `optional` 依赖类型
- **TreeStateValidator**：自动校验缺失字段，运行时修复兼容 v2.0

---

## v3.0（phase + status 双字段隔离）

`specs-tree-sddu-status-enhancement`（FR-STATUS-001）引入：

```json
{
  "version": "3.0.0",
  "phase": "speced",
  "status": "active",
  "depth": 0,
  "childrens": [],
  "phaseHistory": [],
  "dependencies": [],
  "isParent": false,
  "workflow": "sddu"
}
```

- **phase 字段**：字符串化枚举（`discoveryed` → `speced` → `planed` → `tasksed` → `builded` → `reviewed` → `validated`），脱离数字索引
- **status 字段**：独立管理生命周期（`active` / `completed` / `terminated` / `paused` / `tracked`）
- **phase + status 相互独立**：phase 描述工作流进度，status 描述生命周期状态
- **workflow 字段**：标识工作流类型（`sddu` / `sdd`），支持多工作流共存
