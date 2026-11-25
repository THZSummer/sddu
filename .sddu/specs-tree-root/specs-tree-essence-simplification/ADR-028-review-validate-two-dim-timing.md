# ADR-028: review/validate 二维时序——策略文档与报告文档分离，纳入 sddu.md 蒸馏范围

## 状态
PROPOSED（2026-11-25 用户拍板：review/validate 策略设计须产出，且二维时序落到新 sddu.md）

## 背景
review / validate 两个阶段的产物存在**二维时序**（当前仅承载于旧路由 skill `sddu.md.hbs` §3 路由表 + §6.6 二维时序引导，v6 下 router 并入 sddu.md，此语义未进任何 ADR，属蒸馏遗漏）：

1. **策略文档**（review.md / validate.md）：Feature 级**固定产物，定义一次**——review.md 定义审查清单 C1~CN，validate.md 定义验证场景 V1~VN；
2. **报告文档**（review-report.md / validate-report.md）：**每轮执行独立产物**——build 完成后逐项填入审查/验证结果。

时序规则：
- **plan 完成后**即可路由 review/validate 产出**策略文档**（与 tasks 并行，属「逆向检验准备链」）；
- **build 完成后**才能触发**报告文档**（「正向建设链」与「逆向检验准备链」汇合后执行报告）。

## 决策
**二维时序作为框架工作流语义，全量蒸馏进 sddu.md 路由表 + 读取规则**：

1. **路由表承载二维时序**——sddu.md 路由表对 review/validate 的条目须标注：策略设计（产出 review.md/validate.md）不依赖 build、plan 完成后即可路由；报告执行（产出 review-report.md/validate-report.md）依赖 build 完成；
2. **读取规则承载二维时序引导**——phase = planned 时，操作建议须提示「正向建设链（tasks→build）与逆向检验准备链（review/validate 策略设计）可并行推进」；
3. **契约结构已具备**——plan §5.1 树 review/validate 各 2 契约（策略 + 报告）已就位，本 ADR 补齐的是**时序语义**（何时产出哪种文档），非新增契约；
4. **策略文档产时不推进 phase**——策略文档是 pre-build 产物，产出不触发 phase 迁移（phase 仍为 planned/tasked，reviewed/validated 需 build 完成后）。

## 对既有设计的修订
- **TASK-001（sddu.md 蒸馏）范围扩展**：路由表 + 读取规则须含「review/validate 二维时序」语义（底稿锚点 = `sddu.md.hbs` §3 路由表 + §6.6 二维时序引导）。
- **ADR-021 蒸馏清单**：本语义非状态机语义（不入 A1~A9），归入「路由/读取规则」组，与 ADR-026（标记/仪表盘）并列。
- 本 Feature 已按此产出 review.md（C1~CN，15 条）与 validate.md（V1~VN，11 条）策略文档。

## 后果
- 正面：二维时序不再散落于将被合并的旧 router，进入唯一权威 sddu.md；review/validate 的策略/报告分离语义在 v6 框架内显式固化；本 Feature 的审查/验证策略提前就位，build 完成后可直接执行。
- 负面：sddu.md 路由表/读取规则增加二维时序说明（极小篇幅）。
- 不可逆性：低——纯协议文本。
