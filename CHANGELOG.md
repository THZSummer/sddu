# Changelog

## [1.1.0] - 2026-04-01

### Added
- 新增 specs-tree-root 目录结构以优化 specs 管理
- 添加 11 个新的 specs-tree-* 模板用于功能开发

### Changed
- 将 `.sdd/.specs/` 目录更名为 `.sdd/specs-tree-root/` 
- 所有 Agent 模板中的路径引用从 `.specs/` 更新为 `specs-tree-root/`
- 更新主入口 Agent 模板 (sdd.md.hbs) 路径引用
- 更新规范编写 Agent 模板 (sdd-spec.md.hbs) 路径引用
- 更新技术规划 Agent 模板 (sdd-plan.md.hbs) 路径引用
- 更新任务分解 Agent 模板 (sdd-tasks.md.hbs) 路径引用
- 更新任务实现 Agent 模板 (sdd-build.md.hbs) 路径引用
- 更新代码审查 Agent 模板 (sdd-review.md.hbs) 路径引用
- 更新最终验证 Agent 模板 (sdd-validate.md.hbs) 路径引用
- 更新目录导航 Agent 模板 (sdd-docs.md.hbs) 路径引用
- 更新 Roadmap 规划 Agent 模板 (sdd-roadmap.md.hbs) 路径引用
- 更新帮助 Agent 模板 (sdd-help.md.hbs) 路径引用
- 更新子功能模板 (subfeature-templates.ts) 路径引用
- 更新核心运行时文件中的路径引用
- 更新测试文件以符合新路径结构

### Fixed
- 解决了旧路径引用导致的兼容性问题
- 修复了路径常量在状态机、Schema、迁移器等组件中的使用

### Deprecated
- 旧的 `.sdd/.specs/` 目录结构

### Security
- 改进了目录权限管理和访问控制结构