# 源码审查总结 - SDD→SDDU 引用清理

**审查完成时间**: 2026-04-08  
**审查人**: SDD Review Agent  
**状态**: ✅ 审查完成，待修复

---

## 审查结果

### 发现的问题总数
- 🔴 **高优先级**: 7 个源码文件需要修改
- 🟡 **中优先级**: 4 个测试文件建议更新
- 🟢 **低优先级**: 构建产物（自动更新）

---

## 必须修改的文件清单

### 配置文件 (2 个)
1. **`/opencode.json`**
   - 修改 plugin 引用：`opencode-sdd-plugin` → `opencode-sddu-plugin`
   - 修改所有 agent 名称：`sdd-*` → `sddu-*` (约 20 处)

2. **`/src/templates/config/opencode.json.hbs`**
   - 修改所有 agent 名称：`sdd-*` → `sddu-*` (约 20 处)

### 源码文件 (5 个)
3. **`/src/index.ts`**
   - 第 1 行注释：`SDD Plugin` → `SDDU Plugin`

4. **`/src/types.ts`**
   - 第 100 行：`interface SddConfig` → `interface SdduConfig`

5. **`/src/state/machine.ts`**
   - 第 17 行：`type SddPhase` → `type SdduPhase`

6. **`/src/commands/sdd-migrate-schema.ts`**
   - 重命名文件：`sdd-migrate-schema.ts` → `sddu-migrate-schema.ts`
   - 第 33 行：`class SddMigrateSchemaCommand` → `class SdduMigrateSchemaCommand`
   - 更新所有引用

7. **`/src/agents/registry.ts`**
   - 第 166 行：过滤条件添加 `sddu-` 支持

---

## 修改步骤

1. **备份当前代码**
   ```bash
   git checkout -b feature/sddu-source-code-cleanup
   ```

2. **逐个修改文件**
   - 按上述清单逐个修改 7 个文件
   - 使用 IDE 全局搜索确认所有引用已更新

3. **编译验证**
   ```bash
   npm run clean
   npm run build
   ```

4. **运行测试**
   ```bash
   npm test
   ```

5. **提交修改**
   ```bash
   git add -A
   git commit -m "refactor: 全面清理 SDD→SDDU 引用 (7 个源码文件)"
   ```

---

## 详细审查报告

完整审查报告：`source-code-review.md`

---

## 下一步

运行以下命令开始技术规划：
```bash
@SDDU-plan 插件改名 SDDU
```

或手动更新状态：
```bash
/tool sdd_update_state {"feature": "specs-tree-plugin-rename-sddu", "state": "specified"}
```
