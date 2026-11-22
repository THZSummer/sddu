# ADR-006: 零构建、纯复制——取消构建阶段，安装 = 直接复制源文件

## 状态
PROPOSED（2026-11-23 用户拍板）

## 背景
统一安装范式（ADR-004：单入口 + .sddu 二分）与零 TS（ADR-005）落定后，审视遗留的「构建」环节：build-agents（渲染 11 agents）、build-dsh-skills（拼接 11 SKILL.md）、package.cjs（npm 插件包）、install.json（版本/哈希清单）。逐项检验发现构建已无对象：

1. **无渲染对象**：单入口是纯指令 md，阶段指令/契约由 LLM 运行期直接读取——代码从不渲染任何模板（`.hbs` 的 Handlebars 变量从未被代码求值，占位符只是文档约定）；
2. **无产物树**：.sddu 内容全是现成 md 文件（sddu.md + modules/{stages,contracts}），源即产物，`dist/` 没有存在意义；
3. **无清单需求**：install.json 的版本/哈希完整性校验是自我加压的技术栈（SDDU 未市场分发，无完整性对抗场景）；版本号由 sddu.md 头部承载即可。

## 决策
1. **取消构建阶段**：不新建任何构建脚本；build-agents / build-dsh-skills / package.cjs(+test) 随零构建范式退役；`npm run build` 取消。
2. **安装 = 纯复制**：安装器（install/install.{sh,ps1}）直接从仓库 `src/` 复制——`src/methodology/ + .sddu.md` → `.sddu/.sddu/`；`src/adapters/SKILL.md` → `.agents/skills/sddu/`；指针按 `--platform` 写入。无 dist/、无渲染、无中间产物。
3. **文件格式归一为 md**：入口 `entry.md.hbs` → `SKILL.md`；契约 `.md.hbs` → `.md`（占位符保留为文档约定，语义由契约头声明）。
4. **版本承载**：sddu.md 头部版本字段为唯一版本源；check-essence-sync 顺带断言各载体引用的版本一致（如需）。
5. **保留的唯一"脚本"**：`check-essence-sync.cjs`（开发期校验，不产任何物，非构建）与安装复制器。

## 对既有设计的修订
- **ADR-007 深化（2026-11-23）**：安装源从「三锚点散取」（src/methodology + .sddu.md + adapters/SKILL.md，2026-11-23 模块化后为 modules/<业务>/）深化为「整棵 `sddu-project-template/` 模板目录复制」——源路径 = 安装后路径，安装器不再持有任何路径映射知识。
- ADR-004：sddu 树中 install.json 移除；「投影/渲染」表述坍缩为「复制」；NFR-006 更强——新增平台连构建都不用跑，复制一个入口 md 即完成。
- plan v3.2 的「build.cjs 合一构建链」方案作废（本 ADR 取代）：合一不如取消。

## 后果
- 正面：仓库形态 = md 源 + 一个校验脚本 + 一对复制器；分发链路最短（源 = 产物）；「全 md、没有代码」的设计思路在工程层面兑现。
- 负面：失去构建期集中变更点（如未来需要对 sddu 文件做批量转换，须重新引入构建——届时按 ADR-001 演进路径评估）；复制器与源结构强耦合（源目录变动需同步安装器，缓解：ADR-007 后安装器仅做 `cp -r sddu-project-template/.`，无路径映射知识，源结构变动自动随之）。
