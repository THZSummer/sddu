# ADR-017: files 产物注册字段退役——目录即真相，产物存在性直查不注册（能力丢失排查 L4）

## 状态
PROPOSED（2026-11-24 用户拍板：L4 裁决 A——退役）

## 背景
能力丢失排查（capability-loss-audit.md L4）发现：原 state.json 的 `files{discovery/spec/plan/tasks/review/reviewReport/validation/validationReport}` 字段（产物路径注册）在 ADR-005 拍板的 state.md front-matter 字段契约中无位置——产物存在性检查（前置产物门禁、review/validate 完成后的字段回写联动）失去权威数据源。

## 决策
**files 注册字段退役，front-matter 不补**。产物存在性检查改为**目录约定直查**：

1. **目录即真相**——产物文件就在 Feature 目录内，且文件名是流程约定的（`discovery.md` / `spec.md` / `plan.md` / `tasks.md` / `build.md` / `review.md` / `validate.md` 及衍生报告）。检查前置产物 = 在 Feature 目录内查该文件是否存在，一步到位，无需注册副本。与 ADR-010「目录名即导航」共享同一设计哲学：**结构本身承载信息，不建副本**；
2. **注册即副本，副本即漂移源**——原 files 字段本质是「产物清单的状态化副本」：产物落盘后需回写注册（review/validate 模板的完成协议曾专设此步），一旦漏写即出现「文件在、注册不在」或反向漂移，维护成本为负收益；
3. **前置产物门禁语义保留，数据源换轨**——sddu.md 状态协议的「每 phase 必需产物表」（TASK-002 蒸馏底稿 A6 条）以**目录约定文件名**为判定依据，而非 files 字段；
4. **父特性差异化保留**——父特性只查 discovery/spec/plan 类产物的规则照蒸馏（底稿 A6），判定方式同为直查。

## 对既有设计的修订
- **模块迁移约束**：`sddu-review` / `sddu-validate` 模板自 src/templates/agents/ 迁入 modules/ 时，**删除「files 字段回写联动」段**（检查 `files.review` 是否记录、更新 `files.reviewReport` 等指令）——此为 MOVE+MODIFY 的显式修改点，列入 build 阶段任务（与 ADR-015 的 API 门禁段删除同批）。
- **TASK-002 底稿 A6**：前置产物表的判定依据明确为「目录约定文件名直查」。
- **ADR-005**：字段契约维持十字段（ADR-016 后）不变，本 ADR 确认不补 files。

## 后果
- 正面：消除注册副本与产物实体的漂移面；front-matter 保持最简；review/validate 完成协议更精炼（少一步回写）；与 L3 构成对照原则——**声明性信息（依赖）补载体，副本性信息（产物注册）删载体**。
- 负面：产物文件名不再自由（若用户自定义产物名，直查即失效）——已判定可接受：文件名本就是流程契约的一部分（契约模板即按约定名产出）。
- 不可逆性：低——如未来需要，front-matter 补字段即可恢复注册语义。
