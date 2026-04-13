import * as fs from 'fs';
import * as path from 'path';
import { scanTreeStructure } from './tree-scanner';
import { StateV2_1_0 } from './schema-v2.0.0';

interface CachedState {
  state: StateV2_1_0;
  timestamp: number;  // Unix timestamp in milliseconds
}

export class StateLoader {
  private cache: Map<string, CachedState> = new Map();
  private cacheExpiryMs: number = 3000; // 3 seconds
  private readonly specRootDir: string;

  constructor(specRootDir: string = '.sddu/specs-tree-root') {
    this.specRootDir = specRootDir;
  }

  /**
   * Loads all distributed states using the tree scanner
   * Returns a Map where keys are feature paths and values are their states
   */
  public async loadAll(): Promise<Map<string, StateV2_1_0>> {
    const result = new Map<string, StateV2_1_0>();
    const scanResult = scanTreeStructure(this.specRootDir);
    const flatMap = scanResult.flatMap;

    for (const [featurePath, _] of flatMap) {
      // Extract the expected state file path for this feature
      const stateFilePath = path.join(featurePath, 'state.json');
      
      if (fs.existsSync(stateFilePath)) {
        try {
          const stateData = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
          
          // Verify the state against our schema
          if (this.validateState(stateData)) {
            result.set(featurePath, stateData);
            
            // Update cache
            this.cache.set(featurePath, {
              state: stateData,
              timestamp: Date.now()
            });
          } else {
            console.warn(`Invalid state found at ${stateFilePath}, skipping`);
            // Still add to cache but with an error state to avoid repeated validations
            this.cache.set(featurePath, {
              state: null,  // Mark as invalid/missing
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.error(`Error loading state from ${stateFilePath}: ${error.message}`);
          this.cache.set(featurePath, {
            state: null,  // Mark as invalid/missing
            timestamp: Date.now()
          });
        }
      } else {
        // State file doesn't exist, cache this info as well
        this.cache.set(featurePath, {
          state: null,  // Mark as missing
          timestamp: Date.now()
        });
      }
    }

    return result;
  }

  /**
   * Gets the state for a specific feature
   * Uses cache with 3-second expiry
   */
  public async get(featurePath: string): Promise<StateV2_1_0 | null> {
    // Check cache first
    const cached = this.cache.get(featurePath);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiryMs) {
      return cached.state;
    }

    // Cache expired or not available, load fresh
    const stateFilePath = path.join(featurePath, 'state.json');
    
    if (!fs.existsSync(stateFilePath)) {
      this.cache.set(featurePath, {
        state: null,
        timestamp: Date.now()
      });
      return null;
    }

    try {
      const stateData = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
      
      if (this.validateState(stateData)) {
        this.cache.set(featurePath, {
          state: stateData,
          timestamp: Date.now()
        });
        return stateData;
      } else {
        console.warn(`Invalid state found at ${stateFilePath}`);
        this.cache.set(featurePath, {
          state: null,
          timestamp: Date.now()
        });
        return null;
      }
    } catch (error) {
      console.error(`Error loading state from ${stateFilePath}: ${error.message}`);
      this.cache.set(featurePath, {
        state: null,
        timestamp: Date.now()
      });
      return null;
    }
  }

  /**
   * Sets the state for a specific feature
   * Updates cache and writes to the distributed file
   */
  public async set(featurePath: string, state: StateV2_1_0): Promise<boolean> {
    if (!this.validateState(state)) {
      console.error(`Invalid state provided for ${featurePath}`);
      return false;
    }

    // Ensure the directory exists
    const stateFilePath = path.join(featurePath, 'state.json');
    const dirPath = path.dirname(stateFilePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    try {
      // Write the new state to file
      fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
      
      // Update cache
      this.cache.set(featurePath, {
        state,
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      console.error(`Error writing state to ${stateFilePath}: ${error.message}`);
      return false;
    }
  }

  /**
   * Creates a new state for a given feature if it doesn't already exist
   */
  public async create(featurePath: string, initialState: StateV2_1_0): Promise<boolean> {
    if (!this.validateState(initialState)) {
      console.error(`Invalid initial state provided for ${featurePath}`);
      return false;
    }

    const stateFilePath = path.join(featurePath, 'state.json');

    // Check if a state file already exists
    if (fs.existsSync(stateFilePath)) {
      console.error(`State file already exists at ${stateFilePath}`);
      return false;
    }

    // Ensure the directory exists
    const dirPath = path.dirname(stateFilePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    try {
      // Write the new state to file
      fs.writeFileSync(stateFilePath, JSON.stringify(initialState, null, 2));
      
      // Update cache
      this.cache.set(featurePath, {
        state: initialState,
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      console.error(`Error creating state at ${stateFilePath}: ${error.message}`);
      return false;
    }
  }

  /**
   * Validates state against expected schema
   */
  private validateState(state: any): state is StateV2_1_0 {
    // Basic check for required fields
    return (
      state &&
      typeof state === 'object' &&
      typeof state.feature === 'string' &&
      state.version === 'v2.1.0' // Assuming we want v2.1.0 format for tree structure
    );
  }

  /**
   * Clears cache to force re-loading
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Gets the scan tree structure for the root director
   */
  public getTreeStructure(): ReturnType<typeof scanTreeStructure> {
    return scanTreeStructure(this.specRootDir);
  }
}