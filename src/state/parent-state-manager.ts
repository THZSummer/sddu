import * as fsPromises from 'fs/promises';
import * as path from 'path';
import {
  StateV3_0_0,
  ChildFeatureInfoV3,
  Phase,
  FeatureStatus,
  validateStateV3,
} from './schema-v3.0.0';
import { TreeStructureError, ErrorCode } from '../shared/errors';
import { StateLoader } from './state-loader';

/**
 * Manages parent feature states by updating their children arrays
 * based on discovered sub-features in the tree structure.
 *
 * Updated for v3.0.0: uses phase (Phase, string) + status (FeatureStatus, string)
 * instead of the old `status: WorkflowStatus` and `phase: number`.
 */
export class ParentStateManager {
  /**
   * Scans all child features under a parent directory and updates the parent's state
   * with the list of children and their information.
   */
  public async scanAndUpdateParentState(
    parentDir: string,
    stateLoader: StateLoader
  ): Promise<boolean> {
    try {
      let parentState = (await stateLoader.get(parentDir)) as
        | StateV3_0_0
        | null;

      if (!parentState) {
        throw new TreeStructureError(
          ErrorCode.STATE_FILE_NOT_FOUND,
          `Parent state file not found in ${parentDir}`
        );
      }

      // Ensure v3.0.0 version
      if (!(parentState as any).version || (parentState as any).version !== 'v3.0.0') {
        (parentState as any).version = 'v3.0.0';
      }

      // Find immediate children
      const childFeatures = await this.discoverChildFeatures(
        parentDir,
        stateLoader
      );

      // Build childrens array with new ChildFeatureInfoV3 type
      const childrens: ChildFeatureInfoV3[] = childFeatures.map((child) => ({
        path: child.featurePath,
        featureName: child.featureName,
        phase: child.state?.phase || ('registered' as Phase),
        status: child.state?.status || ('tracked' as FeatureStatus),
        lastModified: child.lastModified || new Date().toISOString(),
      }));

      // Update parent state
      const updatedParentState: StateV3_0_0 = {
        ...(parentState as StateV3_0_0),
        childrens,
        depth: 0, // Root node
      };

      // Validate against v3.0.0 schema
      if (!validateStateV3(updatedParentState)) {
        throw new TreeStructureError(
          ErrorCode.PARENT_STATE_UPDATE_FAILED,
          `Updated parent state is not valid for ${parentDir}`
        );
      }

      const success = await stateLoader.set(parentDir, updatedParentState);

      if (success) {
        console.log(
          `Successfully updated parent state in ${parentDir} with ${childrens.length} children`
        );
      } else {
        throw new TreeStructureError(
          ErrorCode.PARENT_STATE_UPDATE_FAILED,
          `Failed to save updated parent state in ${parentDir}`
        );
      }

      return success;
    } catch (error) {
      if (error instanceof TreeStructureError) {
        console.error(
          `Tree structure error updating parent state: ${error.message}`
        );
        throw error;
      } else {
        console.error(
          `Unexpected error while updating parent state in ${parentDir}:`,
          error
        );
        throw new TreeStructureError(
          ErrorCode.PARENT_STATE_UPDATE_FAILED,
          `Unexpected error updating parent state in ${parentDir}: ${(error as Error).message}`
        );
      }
    }
  }

  private async discoverChildFeatures(
    parentDir: string,
    stateLoader: StateLoader
  ): Promise<
    Array<{
      featurePath: string;
      featureName: string;
      state: StateV3_0_0 | null;
      lastModified: string;
    }>
  > {
    try {
      const treeStructure = await stateLoader.getTreeStructure();

      const parentNode = Array.from(treeStructure.flatMap.values()).find(
        (node) => node.path === parentDir
      );

      if (!parentNode) {
        console.warn(
          `Parent node not found in tree structure for path: ${parentDir}`
        );
        return [];
      }

      const childPromises = parentNode.children.map(async (childNode) => {
        const childState = (await stateLoader.get(
          childNode.path
        )) as StateV3_0_0 | null;

        let lastModifiedDate = new Date().toISOString();

        try {
          const statePath = path.join(childNode.path, 'state.json');
          let stats = null;
          try {
            stats = await fsPromises.stat(statePath);
          } catch {
            // File does not exist
          }
          if (stats) {
            lastModifiedDate = stats.mtime.toISOString();
          }
        } catch {
          console.warn(
            `Could not determine modification time for child ${childNode.path}`
          );
        }

        return {
          featurePath: childNode.path,
          featureName: childNode.featureName,
          state: childState,
          lastModified: lastModifiedDate,
        };
      });

      return await Promise.all(childPromises);
    } catch (error) {
      throw new TreeStructureError(
        ErrorCode.TREE_SCAN_FAILED,
        `Failed to discover child features in ${parentDir}: ${(error as Error).message}`
      );
    }
  }
}
