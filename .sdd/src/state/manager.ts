/**
 * 状态管理器 - 统一管理SDD工作流的状态
 * 更新路径：.specs/[feature]/state.json -> .sdd/.specs/[feature]/state.json
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { getSpecsDir } from '../utils/workspace';
import { StateV1_2_11, createInitialState, validateState } from './schema';
import { FeatureStatus } from './types';

export interface SubFeatureScanResult {
  id: string;
  path: string;
  hasStateFile: boolean;
  state?: StateV1_2_11;
  error?: string;
}

/**
 * 状态管理器类
 */
export class StateManager {
  private specsDir: string;

  constructor() {
    this.specsDir = getSpecsDir();
  }

  private getStatePath(feature: string): string {
    const specsDir = this.specsDir.endsWith('.specs') ? this.specsDir : `${this.specsDir}/.specs`;
    return join(specsDir, feature, 'state.json');
  }

  public load(feature: string): StateV1_2_11 | null {
    const statePath = this.getStatePath(feature);
    
    try {
      if (!existsSync(statePath)) return null;

      const rawData = readFileSync(statePath, 'utf-8');
      const stateData: StateV1_2_11 = JSON.parse(rawData);

      const validationResult = validateState(stateData);
      if (!validationResult.valid) {
        throw new Error(`Invalid state schema: ${validationResult.errors.join(', ')}`);
      }

      return stateData;
    } catch (error) {
      console.error(`Error loading state for feature ${feature}:`, error);
      return null;
    }
  }

  public save(state: StateV1_2_11): void {
    const statePath = this.getStatePath(state.feature);
    const dir = dirname(statePath);
    
    mkdirSync(dir, { recursive: true });
    state.updatedAt = new Date().toISOString();
    
    const validationResult = validateState(state);
    if (!validationResult.valid) {
      throw new Error(`Invalid state schema: ${validationResult.errors.join(', ')}`);
    }
    
    writeFileSync(statePath, JSON.stringify(state, null, 2));
  }

  public initialize(feature: string, name?: string): StateV1_2_11 {
    const state = createInitialState(feature, name);
    const statePath = this.getStatePath(feature);
    const dir = dirname(statePath);
    mkdirSync(dir, { recursive: true });
    this.save(state);
    return state;
  }

  public updateStatus(feature: string, status: FeatureStatus, additionalData?: Partial<StateV1_2_11>): void {
    let state = this.load(feature);
    if (!state) state = this.initialize(feature);
    
    state.status = status;
    state.updatedAt = new Date().toISOString();
    
    if (additionalData) Object.assign(state, additionalData);
    this.save(state);
  }

  public getStatus(feature: string): FeatureStatus | null {
    const state = this.load(feature);
    return state ? state.status : null;
  }

  public hasState(feature: string): boolean {
    return existsSync(this.getStatePath(feature));
  }

  public scanSubFeatures(parentFeature: string): SubFeatureScanResult[] {
    const parentDir = join(this.specsDir.endsWith('.specs') ? this.specsDir : `${this.specsDir}/.specs`, parentFeature);
    if (!existsSync(parentDir)) {
      console.warn(`Parent feature directory does not exist: ${parentDir}`);
      return [];
    }
    
    try {
      const entries = readdirSync(parentDir, { withFileTypes: true });
      const results: SubFeatureScanResult[] = [];
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subFeatureId = entry.name;
          const subFeaturePath = join(parentDir, subFeatureId);
          const subFeatureStatePath = join(subFeaturePath, 'state.json');
          const hasStateFile = existsSync(subFeatureStatePath);
          
          const result: SubFeatureScanResult = {
            id: subFeatureId,
            path: subFeaturePath,
            hasStateFile
          };
          
          if (hasStateFile) {
            try {
              const rawData = readFileSync(subFeatureStatePath, 'utf-8');
              const stateData: StateV1_2_11 = JSON.parse(rawData);
              
              const validationResult = validateState(stateData);
              if (validationResult.valid) {
                result.state = stateData;
              } else {
                result.error = `Invalid state schema: ${validationResult.errors.join(', ')}`;
              }
            } catch (error) {
              result.error = `Error loading state file: ${error instanceof Error ? error.message : String(error)}`;
            }
          }
          
          results.push(result);
        }
      }
      
      return results;
    } catch (error) {
      console.error(`Error scanning sub-features for ${parentFeature}:`, error);
      return [];
    }
  }
}