/**
 * Tree State Validator
 * Validates tree structure consistency and state integrity
 * 
 * Updated for v3.0.0: phase (8 values) + status (5 values) two-field model.
 * Added combined constraint validation (completed only at validated, merged needs mergedInto).
 */

import { scanTreeStructure, FeatureTreeNode, isParentFeature } from './tree-scanner';
import { StateLoader } from './state-loader';
import {
  StateV3_0_0,
  Phase,
  FeatureStatus,
  PhaseHistoryEntry,
  validateStateV3,
  VALID_PHASES,
  VALID_STATUSES,
} from './schema-v3.0.0';
import { TreeStructureError, ErrorCode } from '../errors';
import * as path from 'path';

// ============================================================================
// Interfaces
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  autoFixed: string[];
  state: StateV3_0_0;
}

export interface TreeValidationResult {
  valid: boolean;
  errors: TreeValidationError[];
  warnings: TreeValidationWarning[];
}

export interface TreeValidationError {
  code: string;
  message: string;
  path: string;
  severity: 'error';
}

export interface TreeValidationWarning {
  code: string;
  message: string;
  path: string;
  severity: 'warning';
}

// ============================================================================
// Phase/Status inference helpers
// ============================================================================

/**
 * Infer a Phase from a numeric or string value.
 * Used during auto-repair for migration from old schemas.
 */
function inferPhase(value: unknown): Phase {
  if (typeof value === 'string' && VALID_PHASES.includes(value as Phase)) {
    return value as Phase;
  }
  // Try mapping old numeric phases (1-6 from v2.x) to new phases
  if (typeof value === 'number') {
    const numPhaseMap: Record<number, Phase> = {
      0: 'registered',
      1: 'specified',   // v2.x phase 1 = specified
      2: 'planned',
      3: 'tasked',
      4: 'builded',     // v2.x phase 4 = building → builded
      5: 'reviewed',
      6: 'validated',
    };
    if (numPhaseMap[value]) return numPhaseMap[value];
  }
  return 'registered';
}

/**
 * Infer a FeatureStatus from an arbitrary value.
 */
function inferStatus(value: unknown): FeatureStatus {
  if (typeof value === 'string' && VALID_STATUSES.includes(value as FeatureStatus)) {
    return value as FeatureStatus;
  }
  // Map old v2.x WorkflowStatus values to FeatureStatus
  if (typeof value === 'string') {
    const oldToNew: Record<string, FeatureStatus> = {
      'specified': 'tracked',
      'planned': 'tracked',
      'tasked': 'tracked',
      'building': 'tracked',
      'reviewed': 'tracked',
      'validated': 'tracked',
      'drafting': 'tracked',
      'discovered': 'tracked',
    };
    if (oldToNew[value]) return oldToNew[value];
  }
  return 'tracked';
}

// ============================================================================
// TreeStateValidator class
// ============================================================================

export class TreeStateValidator {
  private stateLoader: StateLoader;

  constructor(stateLoader: StateLoader) {
    this.stateLoader = stateLoader;
  }

  /**
   * Validates a new state object before creation/setting, and repairs common issues.
   * 
   * Updated for v3.0.0:
   *   - phase must be one of 8 valid Phase values
   *   - status must be one of 5 valid FeatureStatus values
   *   - Combined constraints: completed only at validated, merged needs mergedInto
   */
  public validateNewState(
    state: any,
    featurePath?: string
  ): { isValid: boolean; repairedState: StateV3_0_0; warnings: string[] } {
    const warnings: string[] = [];
    let repairedState = { ...state } as any;

    // --- Version — ensure v3.0.0 ---
    if (repairedState.version !== 'v3.0.0') {
      const oldVersion = repairedState.version;
      repairedState.version = 'v3.0.0' as const;
      if (oldVersion) {
        warnings.push(
          `Updated version from '${oldVersion}' to 'v3.0.0' at ${featurePath || 'unknown'}`
        );
      } else {
        warnings.push(
          `Added missing version field as 'v3.0.0' at ${featurePath || 'unknown'}`
        );
      }
    }

    // --- Feature ---
    if (!repairedState.feature || typeof repairedState.feature !== 'string') {
      repairedState.feature =
        state.feature ||
        (featurePath ? path.basename(featurePath) : 'unknown-feature');
      warnings.push(
        `Added/restored feature ID at ${featurePath || 'unknown'}`
      );
    }

    // --- Phase (must be one of 8 valid Phase values) ---
    if (!VALID_PHASES.includes(repairedState.phase as Phase)) {
      const inferred = inferPhase(state.phase ?? state.status ?? state.state);
      repairedState.phase = inferred;
      warnings.push(
        `Set phase to '${inferred}' (was '${state.phase}') at ${featurePath || 'unknown'}`
      );
    }

    // --- Status (must be one of 5 valid FeatureStatus values) ---
    if (!VALID_STATUSES.includes(repairedState.status as FeatureStatus)) {
      const inferred = inferStatus(
        repairedState.status ?? state.status ?? state.state
      );
      repairedState.status = inferred;
      warnings.push(
        `Set status to '${inferred}' (was '${state.status}') at ${featurePath || 'unknown'}`
      );
    }

    // --- Combined constraints ---
    if (
      repairedState.status === 'completed' &&
      repairedState.phase !== 'validated'
    ) {
      repairedState.status = 'tracked';
      warnings.push(
        `Fixed combined constraint: status='completed' only valid when phase='validated'. Set status to 'tracked' at ${featurePath || 'unknown'}`
      );
    }
    if (repairedState.status === 'merged') {
      if (
        !repairedState.merged ||
        typeof repairedState.merged !== 'object' ||
        typeof (repairedState.merged as any).mergedInto !== 'string' ||
        !(repairedState.merged as any).mergedInto
      ) {
        repairedState.status = 'tracked';
        warnings.push(
          `Fixed combined constraint: status='merged' requires merged.mergedInto field. Set status to 'tracked' at ${featurePath || 'unknown'}`
        );
      }
    }

    // --- Dependencies ---
    if (
      !repairedState.dependencies ||
      typeof repairedState.dependencies !== 'object'
    ) {
      repairedState.dependencies = {
        on: state.dependencies?.on ?? [],
        blocking: state.dependencies?.blocking ?? [],
      };
      warnings.push(
        `Added default empty dependencies object at ${featurePath || 'unknown'}`
      );
    } else {
      if (!Array.isArray(repairedState.dependencies.on)) {
        repairedState.dependencies.on = [];
        warnings.push(
          `Initialized on-dependencies as empty array at ${featurePath || 'unknown'}`
        );
      }
      if (!Array.isArray(repairedState.dependencies.blocking)) {
        repairedState.dependencies.blocking = [];
        warnings.push(
          `Initialized blocking-dependencies as empty array at ${featurePath || 'unknown'}`
        );
      }
    }

    // --- Files ---
    if (
      !repairedState.files ||
      typeof repairedState.files !== 'object' ||
      typeof repairedState.files.spec !== 'string'
    ) {
      const filename = repairedState.feature
        ? path.basename(repairedState.feature)
        : 'unnamed-feature';
      repairedState.files = {
        spec: state.files?.spec || `${filename}/spec.md`,
        ...(state.files || {}),
      };
      if (!repairedState.files.spec) {
        repairedState.files.spec = `${filename}/spec.md`;
      }
      warnings.push(
        `Added/restored files object with spec reference at ${featurePath || 'unknown'}`
      );
    }

    // --- Phase history ---
    if (!Array.isArray(repairedState.phaseHistory)) {
      repairedState.phaseHistory = state.phaseHistory && Array.isArray(state.phaseHistory)
        ? [...state.phaseHistory]
        : [];
      if (repairedState.phaseHistory.length === 0) {
        repairedState.phaseHistory = [
          {
            phase: repairedState.phase,
            timestamp: new Date().toISOString(),
            triggeredBy: 'TreeStateValidator.validateNewState',
          },
        ];
      }
      warnings.push(
        `Initialized phaseHistory at ${featurePath || 'unknown'}`
      );
    }

    // --- Depth ---
    if (typeof repairedState.depth !== 'number' || repairedState.depth < 0) {
      repairedState.depth = this.computeDepthFromFeature(
        repairedState.feature
      );
      warnings.push(
        `Computed and set depth to ${repairedState.depth} at ${featurePath || 'unknown'}`
      );
    }

    // Final validation against v3.0.0 schema
    const isValid = validateStateV3(repairedState);

    return {
      isValid,
      repairedState: repairedState as StateV3_0_0,
      warnings,
    };
  }

  /**
   * Standardized validate method with ValidationResult format.
   * Validates a partial state object, auto-repairing common issues,
   * and checks against v3.0.0 schema including combined constraints.
   */
  public validate(state: Partial<StateV3_0_0>): ValidationResult {
    const warnings: string[] = [];
    const autoFixed: string[] = [];
    const errors: string[] = [];

    let repairedState = { ...state } as any;

    // 1. Version → v3.0.0
    if (repairedState.version !== 'v3.0.0') {
      const currentVersion = repairedState.version;
      repairedState.version = 'v3.0.0' as const;
      autoFixed.push('version');
      if (currentVersion) {
        warnings.push(
          `Updated version from '${currentVersion}' to 'v3.0.0'`
        );
      } else {
        warnings.push(`Added missing version as 'v3.0.0'`);
      }
    }

    // 2. Phase validation (must be one of 8 valid values)
    if (!VALID_PHASES.includes(repairedState.phase as Phase)) {
      const inferred = inferPhase(repairedState.phase ?? 0);
      repairedState.phase = inferred;
      autoFixed.push('phase');
      warnings.push(`Set phase to '${inferred}' (was invalid)`);
    }

    // 3. Status validation (must be one of 5 valid values)
    if (!VALID_STATUSES.includes(repairedState.status as FeatureStatus)) {
      const inferred = inferStatus(repairedState.status);
      repairedState.status = inferred;
      autoFixed.push('status');
      warnings.push(`Set status to '${inferred}' (was invalid)`);
    }

    // 4. Combined constraint: completed only at validated
    if (
      repairedState.status === 'completed' &&
      repairedState.phase !== 'validated'
    ) {
      errors.push(
        `Combined constraint violation: status='completed' is only valid when phase='validated'`
      );
    }

    // 5. Combined constraint: merged needs mergedInto
    if (repairedState.status === 'merged') {
      if (
        !repairedState.merged ||
        typeof repairedState.merged !== 'object' ||
        typeof (repairedState.merged as any).mergedInto !== 'string' ||
        !(repairedState.merged as any).mergedInto
      ) {
        errors.push(
          `Combined constraint violation: status='merged' requires merged.mergedInto field`
        );
      }
    }

    // 6. Depth
    if (
      repairedState.depth === undefined ||
      typeof repairedState.depth !== 'number'
    ) {
      if (repairedState.feature) {
        const computedDepth =
          this.computeDepthFromFeature(repairedState.feature);
        repairedState.depth = computedDepth;
        autoFixed.push('depth');
        warnings.push(
          `Computed and set depth to ${computedDepth} from feature path`
        );
      } else {
        repairedState.depth = 0;
        autoFixed.push('depth');
        warnings.push(`Set default depth to 0 (no feature path available)`);
      }
    }

    // 7. Phase history
    if (
      !Array.isArray(repairedState.phaseHistory) ||
      repairedState.phaseHistory.length === 0
    ) {
      const phase = (repairedState.phase as Phase) || 'registered';
      repairedState.phaseHistory = [
        {
          phase,
          timestamp: new Date().toISOString(),
          triggeredBy: 'TreeStateValidator.validate',
        },
      ];
      autoFixed.push('phaseHistory');
      warnings.push(`Added default phaseHistory entry for phase '${phase}'`);
    }

    // 8. Dependencies
    if (
      !repairedState.dependencies ||
      typeof repairedState.dependencies !== 'object'
    ) {
      repairedState.dependencies = { on: [], blocking: [] };
      autoFixed.push('dependencies');
      warnings.push(`Added default dependencies object with empty arrays`);
    } else {
      if (!Array.isArray(repairedState.dependencies.on)) {
        repairedState.dependencies.on = [];
        autoFixed.push('dependencies.on');
        warnings.push(`Initialized on-dependencies as empty array`);
      }
      if (!Array.isArray(repairedState.dependencies.blocking)) {
        repairedState.dependencies.blocking = [];
        autoFixed.push('dependencies.blocking');
        warnings.push(`Initialized blocking-dependencies as empty array`);
      }
    }

    // 9. Files
    if (
      !repairedState.files ||
      typeof repairedState.files !== 'object'
    ) {
      const filename = repairedState.feature
        ? path.basename(repairedState.feature)
        : 'unnamed-feature';
      repairedState.files = { spec: `${filename}/spec.md` };
      autoFixed.push('files');
      warnings.push(`Added default minimal files with spec reference`);
    } else if (!repairedState.files.spec) {
      const filename = repairedState.feature
        ? path.basename(repairedState.feature)
        : 'unnamed-feature';
      repairedState.files.spec = `${filename}/spec.md`;
      autoFixed.push('files.spec');
      warnings.push(`Added default spec file reference`);
    }

    // 10. Feature
    if (!repairedState.feature) {
      repairedState.feature = 'generated-feature-id';
      autoFixed.push('feature');
      errors.push(
        `No feature ID defined. Added placeholder — must set correct path.`
      );
    }

    const valid =
      errors.length === 0 && validateStateV3(repairedState);

    if (!valid && errors.length === 0) {
      errors.push('Final schema validation failed after all auto-repairs');
    }

    return {
      valid,
      errors,
      warnings,
      autoFixed,
      state: repairedState as StateV3_0_0,
    };
  }

  /**
   * Helper method to compute depth from feature path.
   */
  private computeDepthFromFeature(featurePath: string): number {
    const matches = featurePath.match(/specs-tree-/g);
    return matches ? matches.length - 1 : 0;
  }

  /**
   * Validates the entire tree structure for consistency.
   * Updated for v3.0.0 schema.
   */
  public async validateTree(specRootDir: string): Promise<TreeValidationResult> {
    const result: TreeValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    try {
      const treeStructure = await scanTreeStructure(specRootDir);
      const allFeatures = await this.stateLoader.loadAll();

      // Schema validation per feature
      for (const [featurePath, state] of allFeatures) {
        if (!validateStateV3(state)) {
          result.errors.push({
            code: 'TREE_INVALID_SCHEMA',
            message: `Feature state at ${featurePath} does not conform to state v3.0.0 schema`,
            path: featurePath,
            severity: 'error',
          });
        } else {
          // Verify version is exactly 'v3.0.0'
          if (state.version !== 'v3.0.0') {
            result.errors.push({
              code: 'TREE_INVALID_VERSION_FORMAT',
              message: `Feature state at ${featurePath} has incorrect version format. Expected 'v3.0.0', got '${state.version}'`,
              path: featurePath,
              severity: 'error',
            });
          }
          // Combined constraint: completed only at validated
          if (
            state.status === 'completed' &&
            state.phase !== 'validated'
          ) {
            result.errors.push({
              code: 'TREE_COMBINED_CONSTRAINT_VIOLATION',
              message: `Feature at ${featurePath}: status='completed' only valid when phase='validated'`,
              path: featurePath,
              severity: 'error',
            });
          }
          // Combined constraint: merged needs mergedInto
          if (
            state.status === 'merged' &&
            (!state.merged || !state.merged.mergedInto)
          ) {
            result.errors.push({
              code: 'TREE_COMBINED_CONSTRAINT_VIOLATION',
              message: `Feature at ${featurePath}: status='merged' requires merged.mergedInto field`,
              path: featurePath,
              severity: 'error',
            });
          }
        }
      }

      // Check each feature node
      for (const node of treeStructure.nodes) {
        if (isParentFeature(node)) {
          const parentChildResult = await this.validateParentChildRelations(
            node.path
          );
          for (const error of parentChildResult.errors) {
            result.errors.push(error);
          }
          for (const warning of parentChildResult.warnings) {
            result.warnings.push(warning);
          }
        }

        // Depth consistency check
        const expectedDepth = node.level;
        const featureState = allFeatures.get(node.path);
        if (featureState) {
          if (
            typeof featureState.depth === 'number' &&
            featureState.depth !== expectedDepth
          ) {
            result.errors.push({
              code: 'TREE_INVALID_DEPTH',
              message: `Feature at ${node.path} has depth ${featureState.depth}, but expected depth ${expectedDepth} based on directory nesting`,
              path: node.path,
              severity: 'error',
            });
          }
        }
      }

      // Detect circular dependencies
      const cycles = await this.detectCircularDependencies(specRootDir);
      if (cycles.length > 0) {
        for (const cycle of cycles) {
          result.errors.push({
            code: 'TREE_CYCLIC_DEPENDENCY',
            message: `Circular dependency detected: ${cycle.join(' -> ')}`,
            path: cycle[0],
            severity: 'error',
          });
        }
      }

      if (result.errors.length > 0) {
        result.valid = false;
      }
    } catch (error) {
      result.valid = false;
      if (error instanceof TreeStructureError) {
        result.errors.push({
          code: 'TREE_VALIDATION_ERROR',
          message: error.message,
          path: specRootDir,
          severity: 'error',
        });
      } else {
        result.errors.push({
          code: 'UNEXPECTED_ERROR',
          message: `Unexpected error during validation: ${(error as Error).message}`,
          path: specRootDir,
          severity: 'error',
        });
      }
    }

    return result;
  }

  /**
   * Validates a single feature's state against tree rules.
   */
  public async validateFeature(
    featurePath: string
  ): Promise<TreeValidationResult> {
    const result: TreeValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    try {
      const state = await this.stateLoader.get(featurePath);
      if (!state) {
        result.errors.push({
          code: 'FEATURE_STATE_MISSING',
          message: `Feature state file not found at ${featurePath}`,
          path: featurePath,
          severity: 'error',
        });
        result.valid = false;
        return result;
      }

      // Validate schema
      if (!validateStateV3(state)) {
        result.errors.push({
          code: 'FEATURE_INVALID_SCHEMA',
          message: `Feature state at ${featurePath} does not conform to state v3.0.0 schema`,
          path: featurePath,
          severity: 'error',
        });
      }

      // Check version format
      if ((state as any).version !== 'v3.0.0') {
        result.errors.push({
          code: 'FEATURE_INVALID_VERSION_FORMAT',
          message: `Feature state at ${featurePath} has incorrect version format. Expected 'v3.0.0', got '${(state as any).version}'`,
          path: featurePath,
          severity: 'error',
        });
      }

      // Combined constraints
      if (
        (state as StateV3_0_0).status === 'completed' &&
        (state as StateV3_0_0).phase !== 'validated'
      ) {
        result.errors.push({
          code: 'FEATURE_COMBINED_CONSTRAINT',
          message: `Feature at ${featurePath}: status='completed' only valid when phase='validated'`,
          path: featurePath,
          severity: 'error',
        });
      }
      if (
        (state as StateV3_0_0).status === 'merged' &&
        (!(state as StateV3_0_0).merged ||
          !(state as StateV3_0_0).merged!.mergedInto)
      ) {
        result.errors.push({
          code: 'FEATURE_COMBINED_CONSTRAINT',
          message: `Feature at ${featurePath}: status='merged' requires merged.mergedInto field`,
          path: featurePath,
          severity: 'error',
        });
      }

      // Parent-children validation
      const treeStructure = await scanTreeStructure(
        path.dirname(featurePath)
      );
      const node = Array.from(treeStructure.flatMap.values()).find(
        (n) => n.path === featurePath
      );

      if (node && isParentFeature(node)) {
        const expectedChildren = node.children.map((child) => child.path);
        const stateChildrens = (state as StateV3_0_0).childrens;
        if (stateChildrens && Array.isArray(stateChildrens)) {
          const actualChildren = stateChildrens.map(
            (child) => child.path
          );

          const missingInState = expectedChildren.filter(
            (expectedPath) =>
              !actualChildren.some(
                (actualPath) => actualPath === expectedPath
              )
          );

          for (const missing of missingInState) {
            result.errors.push({
              code: 'FEATURE_MISSING_CHILD_IN_STATE',
              message: `Child feature at ${missing} exists in directory but not in parent's childrens array`,
              path: featurePath,
              severity: 'error',
            });
          }

          const missingInDir = actualChildren.filter(
            (actualPath) =>
              !expectedChildren.some(
                (expectedPath) => expectedPath === actualPath
              )
          );

          for (const missing of missingInDir) {
            result.errors.push({
              code: 'FEATURE_NONEXISTENT_CHILD_IN_STATE',
              message: `Child feature referenced in state does not exist at path ${missing}`,
              path: featurePath,
              severity: 'error',
            });
          }
        }
      }

      // Validate dependencies reference existing features
      const allFeatures = await this.stateLoader.loadAll();
      const allFeaturePaths = Array.from(allFeatures.keys());

      const deps = (state as StateV3_0_0).dependencies?.on;
      if (deps) {
        for (const dependency of deps) {
          if (!allFeaturePaths.some((p) => p.includes(dependency))) {
            result.warnings.push({
              code: 'FEATURE_NONEXISTENT_DEPENDENCY',
              message: `Dependency '${dependency}' referenced in feature state but does not exist`,
              path: featurePath,
              severity: 'warning',
            });
          }
        }
      }

      if (result.errors.length > 0) {
        result.valid = false;
      }
    } catch (error) {
      result.valid = false;
      if (error instanceof TreeStructureError) {
        result.errors.push({
          code: 'FEATURE_VALIDATION_ERROR',
          message: error.message,
          path: featurePath,
          severity: 'error',
        });
      } else {
        result.errors.push({
          code: 'UNEXPECTED_ERROR',
          message: `Unexpected error validating feature ${featurePath}: ${(error as Error).message}`,
          path: featurePath,
          severity: 'error',
        });
      }
    }

    return result;
  }

  /**
   * Validates parent-child relationships.
   */
  public async validateParentChildRelations(
    parentPath: string
  ): Promise<TreeValidationResult> {
    const result: TreeValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    try {
      const parentState = await this.stateLoader.get(parentPath);
      if (!parentState) {
        result.errors.push({
          code: 'PARENT_STATE_MISSING',
          message: `Parent state file not found at ${parentPath}`,
          path: parentPath,
          severity: 'error',
        });
        result.valid = false;
        return result;
      }

      const treeStructure = await scanTreeStructure(
        path.dirname(parentPath)
      );
      const parentNode = Array.from(treeStructure.flatMap.values()).find(
        (n) => n.path === parentPath
      );

      if (
        !parentNode ||
        !parentNode.children ||
        parentNode.children.length === 0
      ) {
        const childrens = (parentState as StateV3_0_0).childrens;
        if (childrens && childrens.length > 0) {
          result.errors.push({
            code: 'PARENT_HAS_CHILDREN_IN_STATE_NO_DIRS',
            message: `Parent at ${parentPath} has children in state but no actual subdirectories exist`,
            path: parentPath,
            severity: 'error',
          });
        }
        return result;
      }

      const expectedChildrenPaths = parentNode.children.map(
        (child) => child.path
      );

      const childrens = (parentState as StateV3_0_0).childrens;
      if (!childrens || !Array.isArray(childrens)) {
        result.errors.push({
          code: 'PARENT_MISSING_CHILDREN_ARRAY',
          message: `Parent at ${parentPath} is a parent feature but has no childrens array`,
          path: parentPath,
          severity: 'error',
        });
        result.valid = false;
        return result;
      }

      const stateChildrenPaths = childrens.map((child) => child.path);

      for (const expectedPath of expectedChildrenPaths) {
        if (!stateChildrenPaths.includes(expectedPath)) {
          result.errors.push({
            code: 'PARENT_MISSING_CHILD_IN_STATE',
            message: `Child feature at ${expectedPath} exists in directory but not in parent's childrens array`,
            path: parentPath,
            severity: 'error',
          });
          result.valid = false;
        }
      }

      for (const stateChildPath of stateChildrenPaths) {
        if (!expectedChildrenPaths.includes(stateChildPath)) {
          result.errors.push({
            code: 'PARENT_CHILD_DOES_NOT_EXIST',
            message: `Child feature path '${stateChildPath}' in parent's childrens array does not exist in the directory structure`,
            path: parentPath,
            severity: 'error',
          });
          result.valid = false;
        }
      }
    } catch (error) {
      result.valid = false;
      if (error instanceof TreeStructureError) {
        result.errors.push({
          code: 'PARENT_CHILD_VALIDATION_ERROR',
          message: error.message,
          path: parentPath,
          severity: 'error',
        });
      } else {
        result.errors.push({
          code: 'UNEXPECTED_ERROR',
          message: `Unexpected error validating parent-child relations for ${parentPath}: ${(error as Error).message}`,
          path: parentPath,
          severity: 'error',
        });
      }
    }

    return result;
  }

  /**
   * Detects circular dependencies in the tree.
   */
  async detectCircularDependencies(
    specRootDir: string
  ): Promise<string[][]> {
    const cycles: string[][] = [];

    try {
      const treeStructure = await scanTreeStructure(specRootDir);
      const allFeatures = await this.stateLoader.loadAll();

      const visited = new Set<string>();
      const recStack = new Map<string, string[]>();

      for (const node of treeStructure.nodes) {
        if (!visited.has(node.path)) {
          const cycle = await this._dfsDetectCycle(
            node.path,
            allFeatures,
            visited,
            recStack,
            []
          );
          if (cycle.length > 0) {
            cycles.push(cycle);
          }
        }
      }
    } catch (error) {
      console.error('Error detecting circular dependencies:', error);
    }

    return cycles;
  }

  private async _dfsDetectCycle(
    currentPath: string,
    allFeatures: Map<string, unknown>,
    visited: Set<string>,
    recStack: Map<string, string[]>,
    pathSoFar: string[]
  ): Promise<string[]> {
    visited.add(currentPath);
    recStack.set(currentPath, [...pathSoFar, currentPath]);

    const state = allFeatures.get(currentPath) as any;
    if (!state) {
      recStack.delete(currentPath);
      return [];
    }

    const dependencies: string[] = state.dependencies?.on || [];

    for (const dep of dependencies) {
      const actualDepPath = Array.from(allFeatures.keys()).find((p) =>
        p.includes(dep)
      );
      if (actualDepPath) {
        if (!visited.has(actualDepPath)) {
          const cycleResult = await this._dfsDetectCycle(
            actualDepPath,
            allFeatures,
            visited,
            recStack,
            [...pathSoFar, currentPath]
          );

          if (cycleResult.length > 0) {
            recStack.delete(currentPath);
            return cycleResult;
          }
        } else if (recStack.has(actualDepPath)) {
          const cycleStartIdx = pathSoFar.findIndex(
            (p) => p === actualDepPath
          );
          let cycle = [
            ...pathSoFar.slice(cycleStartIdx),
            currentPath,
            actualDepPath,
          ];

          if (cycle[cycle.length - 1] !== cycle[0]) {
            cycle = cycle.slice(cycleStartIdx).concat(cycle[0]);
          }

          recStack.delete(currentPath);
          return cycle;
        }
      }
    }

    recStack.delete(currentPath);
    return [];
  }
}
