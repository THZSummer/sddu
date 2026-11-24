# ADR-027: 根 docs/ 为项目私有资产——产品边界之外，无需处理（能力丢失排查 B5）

## 状态
PROPOSED（2026-11-24 用户拍板：B5——非问题，无需处理）

## 背景
能力丢失排查（capability-loss-audit.md B5）暴露的欠账：plan §5.1 树对根 `docs/`（16 文件：dsh/×6、research/×4、state-schema-v2.0.0、split-principles、permission-audit-report、migration 系列 ×4、FULLSTACK-E2E-GUIDE）只写「归类见清单」——指向尚未产出的 carrier-inventory.md（FR-004 交付物），去向悬置。

## 决策
**非问题，无需处理——根 docs/ 是项目私有资产，不在 sddu 产品边界内**：

1. **这些是早期为开发 sddu 框架所做的调研文档**（竞品分析 ×4、dsh 适配论证 ×6、状态 schema 设计稿、迁移工具清单等），**与交付给用户的 sddu 产品没有任何关系**——它们服务的是「开发这个框架的项目」，不是「框架本身」；
2. **仓库即项目，项目有自己的 docs 天经地义**——正如用户自己项目里加一些别的 docs-xxx，sddu 框架无权干涉；同理，sddu 产品也无权干涉宿主项目（本仓库）自有的文档目录。产品不触碰、不清理、不迁移 `.git` 之外的项目私有内容（与「workspace 绝不触碰」铁律同构的项目级版本）；
3. **无需处理**——不删除、不归档、不蒸馏、不进 carrier-inventory：16 个文件原地保留，随项目自生自灭（项目未来想清理是项目自己的事，与本 feature 无关）。

## 与相邻裁决的关系

与 ADR-024/025（dev-guide / opencode-operator 降级为项目私有 skill）共同构成完整的项目/产品边界：

| 资产 | 性质 | 载体 |
|------|------|------|
| sddu-product-template/ + 索引 | **产品**（分发物） | 模板树 |
| .agents/skills/{dev-guide, opencode-operator} | 项目私有 skill | 仓库 .agents/skills/ |
| 根 docs/（调研/论证/历史资产 ×16） | 项目私有文档 | 仓库 docs/ |
| .sddu/workspace/ | 项目 dogfooding 工作空间 | 仓库 .sddu/workspace/ |

**边界判据**：一个文件是否属产品 = 它是否在 `sddu-project-template/` 内（或索引落位）；仓库内其余一切为本项目私有，产品决策对其无管辖权。

## 对既有设计的修订
- **plan §5.1 树 docs/ 行**：注释由「归类见清单」改为「项目私有资产，不在产品范围（ADR-027）」。
- **FR-004 覆盖范围收窄**：其「文档集（README/docs/.sddu/docs）」三项就此全部闭环——README = ADR-013（入本体）；根 docs/ = 本 ADR（产品边界外）；`.sddu/docs/migration×27` = 既有拍板（P-018 删除）。carrier-inventory 产出时文档集无需再评估。
- **FR-005 确认制**：根 docs/ 不属「可删/可合并」候选，不进确认流程。

## 后果
- 正面：欠账消除（docs/ 去向从「见不存在的清单」变为「明确无需处理」）；产品/项目边界第四块拼图落位；FR-004 评估面进一步缩小（剩余：模板/脚本集计数勾稽）。
- 负面：仓库根保留 16 个过期文档（对仓库访客观感略糟）——已判定可接受：项目私有，项目自己决定何时清理。
- 不可逆性：无——纯边界判定固化。
