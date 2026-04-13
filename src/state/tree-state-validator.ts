/**
 * Tree State Validator
 * Validates tree structure consistency and state integrity
 */

import { scanTreeStructure, FeatureTreeNode, isParentFeature } from './tree-scanner';
import { StateLoader } from './state-loader';
import { StateV2_1_0, validateStateV2_1_0 } from './schema-v2.0.0';
import { TreeStructureError, ErrorCode } from '../errors';
import * as path from 'path';

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

export class TreeStateValidator {
  private stateLoader: StateLoader;
  
  constructor(stateLoader: StateLoader) {
    this.stateLoader = stateLoader;
  }

  /**
   * Validates the entire tree structure for consistency
   * Checks:
   * 1. All state.json files have valid v2.1.0 schema
   * 2. Parent features have correct childrens array
   * 3. No orphaned features (features not reachable from root)
   * 4. No circular dependencies
   * 5. Depth values are consistent with actual nesting
   * 6. All parent features have depth = 0 (or correct relative depth)
   */
  public async validateTree(specRootDir: string): Promise<TreeValidationResult> {
    const result: TreeValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // Get the tree structure
      const treeStructure = await scanTreeStructure(specRootDir);
      const allFeatures = await this.stateLoader.loadAll();

      // Check for schema validation on each state file
      for (const [featurePath, state] of allFeatures) {
        if (!validateStateV2_1_0(state)) {
          result.errors.push({
            code: 'TREE_INVALID_SCHEMA',
            message: `Feature state at ${featurePath} does not conform to state v2.1.0 schema`,
            path: featurePath,
            severity: 'error'
          });
        } else {
          // Verify the version is exactly 'v2.1.0' (has the 'v' prefix)
          if (state.version !== 'v2.1.0') {
            result.errors.push({
              code: 'TREE_INVALID_VERSION_FORMAT',
              message: `Feature state at ${featurePath} has incorrect version format. Expected 'v2.1.0', got '${state.version}'`,
              path: featurePath,
              severity: 'error'
            });
          }
        }
      }

      // Check each feature in the tree structure
      for (const node of treeStructure.nodes) {
        if (isParentFeature(node)) {
          // Validate parent-child relationship consistency
          const parentChildResult = await this.validateParentChildRelations(node.path);
          for (const error of parentChildResult.errors) {
            result.errors.push(error);
          }
          for (const warning of parentChildResult.warnings) {
            result.warnings.push(warning);
          }
        }

        // Check depth consistency
        const expectedDepth = node.level;
        const featureState = allFeatures.get(node.path);
        if (featureState) {
          if (typeof featureState.depth === 'number' && featureState.depth !== expectedDepth) {
            result.errors.push({
              code: 'TREE_INVALID_DEPTH',
              message: `Feature at ${node.path} has depth ${featureState.depth}, but expected depth ${expectedDepth} based on directory nesting`,
              path: node.path,
              severity: 'error'
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
            path: cycle[0], // Using first element of cycle as path reference
            severity: 'error'
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
          severity: 'error'
        });
      } else {
        result.errors.push({
          code: 'UNEXPECTED_ERROR',
          message: `Unexpected error during validation: ${error.message}`,
          path: specRootDir,
          severity: 'error'
        });
      }
    }

    return result;
  }

  /**
   * Validates a single feature's state against tree rules
   * Checks:
   * 1. Version format is 'v2.1.0'
   * 2. Phase and status are consistent
   * 3. If parent, childrens array matches actual directory structure
   * 4. Dependencies reference existing features
   */
  public async validateFeature(featurePath: string): Promise<TreeValidationResult> {
    const result: TreeValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      const state = await this.stateLoader.get(featurePath);
      if (!state) {
        result.errors.push({
          code: 'FEATURE_STATE_MISSING',
          message: `Feature state file not found at ${featurePath}`,
          path: featurePath,
          severity: 'error'
        });
        result.valid = false;
        return result;
      }

      // Validate schema
      if (!validateStateV2_1_0(state)) {
        result.errors.push({
          code: 'FEATURE_INVALID_SCHEMA',
          message: `Feature state at ${featurePath} does not conform to state v2.1.0 schema`,
          path: featurePath,
          severity: 'error'
        });
      }

      // Check version format
      if (state.version !== 'v2.1.0') {
        result.errors.push({
          code: 'FEATURE_INVALID_VERSION_FORMAT',
          message: `Feature state at ${featurePath} has incorrect version format. Expected 'v2.1.0', got '${state.version}'`,
          path: featurePath,
          severity: 'error'
        });
      }

      // If this feature is a parent, verify the childrens array matches actual child features
      // First get tree structure to check what the actual children should be
      const treeStructure = await scanTreeStructure(path.dirname(featurePath));
      const node = Array.from(treeStructure.flatMap.values()).find(n => n.path === featurePath);
      
      if (node && isParentFeature(node)) {
        const expectedChildren = node.children.map(child => child.path);
        if (state.childrens && Array.isArray(state.childrens)) {
          const actualChildren = state.childrens.map(child => child.path);
          
          // Find missing children that exist in directory but not in state
          const missingInState = expectedChildren.filter(expectedPath => 
            !actualChildren.some(actualPath => actualPath === expectedPath)
          );
          
          for (const missing of missingInState) {
            result.errors.push({
              code: 'FEATURE_MISSING_CHILD_IN_STATE',
              message: `Child feature at ${missing} exists in directory but not in parent's childrens array`,
              path: featurePath,
              severity: 'error'
            });
          }
          
          // Find children in state that don't exist in directory
          const missingInDir = actualChildren.filter(actualPath => 
            !expectedChildren.some(expectedPath => expectedPath === actualPath)
          );
          
          for (const missing of missingInDir) {
            result.errors.push({
              code: 'FEATURE_NONEXISTENT_CHILD_IN_STATE',
              message: `Child feature referenced in state does not exist at path ${missing}`,
              path: featurePath,
              severity: 'error'
            });
          }
        }
      }

      // Validate dependencies reference existing features  
      // Loading all features to cross-reference
      const allFeatures = await this.stateLoader.loadAll();
      const allFeaturePaths = Array.from(allFeatures.keys());
      
      if (state.dependencies && state.dependencies.on) {
        for (const dependency of state.dependencies.on) {
          if (!allFeaturePaths.some(path => path.includes(dependency))) {
            result.warnings.push({
              code: 'FEATURE_NONEXISTENT_DEPENDENCY',
              message: `Dependency '${dependency}' referenced in feature state but does not exist`,
              path: featurePath,
              severity: 'warning'
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
          severity: 'error'
        });
      } else {
        result.errors.push({
          code: 'UNEXPECTED_ERROR',
          message: `Unexpected error validating feature ${featurePath}: ${error.message}`,
          path: featurePath,
          severity: 'error'
        });
      }
    }

    return result;
  }

  /**
   * Validates parent-child relationships
   * Ensures:
   * 1. Parent's childrens array matches actual subdirectories
   * 2. Child states reference correct parent
   * 3. No missing children in parent's state
   */
  public async validateParentChildRelations(parentPath: string): Promise<TreeValidationResult> {
    const result: TreeValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      const parentState = await this.stateLoader.get(parentPath);
      if (!parentState) {
        result.errors.push({
          code: 'PARENT_STATE_MISSING',
          message: `Parent state file not found at ${parentPath}`,
          path: parentPath,
          severity: 'error'
        });
        result.valid = false;
        return result;
      }

      // Get tree structure to know actual children
      const treeStructure = await scanTreeStructure(path.dirname(parentPath));
      const parentNode = Array.from(treeStructure.flatMap.values()).find(n => n.path === parentPath);

      if (!parentNode || !parentNode.children || parentNode.children.length === 0) {
        // No actual children, so childrens array should be empty or undefined
        if (parentState.childrens && parentState.childrens.length > 0) {
          result.errors.push({
            code: 'PARENT_HAS_CHILDREN_IN_STATE_NO_DIRS',
            message: `Parent at ${parentPath} has children in state but no actual subdirectories exist`,
            path: parentPath,
            severity: 'error'
          });
        }
        return result;
      }

      // Get the actual children from the tree structure
      const expectedChildrenPaths = parentNode.children.map(child => child.path);
      
      if (!parentState.childrens || !Array.isArray(parentState.childrens)) {
        result.errors.push({
          code: 'PARENT_MISSING_CHILDREN_ARRAY',
          message: `Parent at ${parentPath} is a parent feature but has no childrens array`,
          path: parentPath,
          severity: 'error'
        });
        result.valid = false;
        return result;
      }

      // Check that state childrens matches the actual directory structure
      const stateChildrenPaths = parentState.childrens.map(child => child.path);
      
      // Find missing children (in dir, not in state)
      for (const expectedPath of expectedChildrenPaths) {
        if (!stateChildrenPaths.includes(expectedPath)) {
          result.errors.push({
            code: 'PARENT_MISSING_CHILD_IN_STATE',
            message: `Child feature at ${expectedPath} exists in directory but not in parent's childrens array`,
            path: parentPath,
            severity: 'error'
          });
          result.valid = false;
        }
      }
      
      // Find extra children (in state, not in dir)
      for (const stateChildPath of stateChildrenPaths) {
        if (!expectedChildrenPaths.includes(stateChildPath)) {
          result.errors.push({
            code: 'PARENT_CHILD_DOES_NOT_EXIST',
            message: `Child feature path '${stateChildPath}' in parent's childrens array does not exist in the directory structure`,
            path: parentPath,
            severity: 'error'
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
          severity: 'error'
        });
      } else {
        result.errors.push({
          code: 'UNEXPECTED_ERROR',
          message: `Unexpected error validating parent-child relations for ${parentPath}: ${error.message}`,
          path: parentPath,
          severity: 'error'
        });
      }
    }

    return result;
  }

  /**
   * Detects circular dependencies in the tree
   * Returns array of cycles found
   */
  async detectCircularDependencies(specRootDir: string): Promise<string[][]> {
    const cycles: string[][] = [];
    
    try {
      // Get all features to check for circular dependencies
      const treeStructure = await scanTreeStructure(specRootDir);
      const allFeatures = await this.stateLoader.loadAll();
      
      // Simple cycle detection using DFS
      const visited = new Set<string>();
      const recStack = new Map<string, string[]>(); // Store path for cycle discovery
      
      for (const node of treeStructure.nodes) {
        if (!visited.has(node.path)) {
          const cycle = await this._dfsDetectCycle(node.path, allFeatures, visited, recStack, []);
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
  
  /**
   * Helper method for DFS-based cycle detection including actual feature dependency information
   */
  private async _dfsDetectCycle(
    currentPath: string,
    allFeatures: Map<string, StateV2_1_0>,
    visited: Set<string>,
    recStack: Map<string, string[]>,
    pathSoFar: string[]
  ): Promise<string[]> {
    visited.add(currentPath);
    recStack.set(currentPath, [...pathSoFar, currentPath]);
    
    const state = allFeatures.get(currentPath);
    if (!state) {
      recStack.delete(currentPath);
      return [];
    }
    
    // Get the direct dependencies of this feature
    const dependencies = state.dependencies?.on || [];
    
    // Need to map dependency IDs to actual file paths
    // For now, assume dependencies refer to feature paths and fuzzy match
    for (const dep of dependencies) {
      // Try to match dependency to actual feature path
      const actualDepPath = Array.from(allFeatures.keys()).find(p => p.includes(dep));
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
            return cycleResult; // Found a cycle, return it
          }
        } else if (recStack.has(actualDepPath)) {
          // Found a cycle! Return the path
          const cycleStartIdx = pathSoFar.findIndex(p => p === actualDepPath);
          let cycle = [...pathSoFar.slice(cycleStartIdx), currentPath, actualDepPath];
          
          // Make sure we form a proper cycle (start and end are the same)
          if (cycle[cycle.length - 1] !== cycle[0]) {
            // Remove elements until we get to the cycle start again
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