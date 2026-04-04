# Release Notes - Version 1.1.0

## Overview
This release introduces major improvements to the directory structure management in the SDD (Specification-Driven Development) plugin. We've reorganized the specs directory to use a more structured approach with the new `specs-tree-root` directory structure.

## Breaking Changes
- Previous `.sdd/.specs/` directory has been renamed to `.sdd/specs-tree-root/`
- All agent templates now reference the new `specs-tree-root/` path instead of `.specs/`
- Users migrating from older versions need to update their workflow accordingly

## New Features
- New `specs-tree-root` directory structure for improved specs organization
- Consistent path naming convention across all agent templates
- Enhanced maintainability and clarity in project organization

## Improvements
- Updated all 11 agent templates with new path references
- Improved core runtime compatibility with new directory structure
- Refined dependency management between features
- Enhanced state machine path configuration

## Files Modified
- `src/templates/agents/sdd.md.hbs` - Main entry point template
- `src/templates/agents/sdd-spec.md.hbs` - Spec writing agent template
- `src/templates/agents/sdd-plan.md.hbs` - Planning agent template
- `src/templates/agents/sdd-tasks.md.hbs` - Task decomposition agent template
- `src/templates/agents/sdd-build.md.hbs` - Build agent template
- `src/templates/agents/sdd-review.md.hbs` - Review agent template
- `src/templates/agents/sdd-validate.md.hbs` - Validation agent template
- `src/templates/agents/sdd-docs.md.hbs` - Documentation agent template
- `src/templates/agents/sdd-roadmap.md.hbs` - Roadmap agent template
- `src/templates/agents/sdd-help.md.hbs` - Help agent template
- `src/templates/subfeature-templates.ts` - Subfeature templates
- `src/state/machine.ts` - State machine configuration
- `src/state/schema-v1.2.5.ts` - Schema definitions
- `src/state/migrator.ts` - Migration logic
- `src/utils/subfeature-manager.ts` - Subfeature management
- `src/index.ts` - Plugin entry point
- And corresponding test files

## Migration Guide
To migrate from previous versions:
1. Move your existing specs from `.sdd/.specs/` to `.sdd/specs-tree-root/`
2. Update any custom scripts that referenced `.specs` paths
3. Verify all agents work correctly with the new path structure

## Known Issues
None critical. All tests are passing and functionality verified.

## Acknowledgements
Thanks to the team for contributing to this structural improvement of the SDD plugin.