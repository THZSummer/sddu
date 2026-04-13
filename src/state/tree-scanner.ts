import * as fs from 'fs';
import * as path from 'path';

// Result type for tree scanning
export interface ScanResult {
  nodes: FeatureTreeNode[];
  flatMap: Map<string, FeatureTreeNode>;
}

// Tree node representation for features
export interface FeatureTreeNode {
  id: string;                    // Feature ID (extracted from path components like 'specs-tree-featurename')
  path: string;                  // Full file system path
  featureName: string;           // Cleaned feature name (without 'specs-tree-' prefix)
  level: number;                 // Nesting level (0 for top-level, 1+ for nested)
  children: FeatureTreeNode[];   // Direct child nodes
  parent?: string;              // Parent path if applicable
}

/**
 * Scans and returns the tree structure rooted at specRootDir
 * Identifies specs-tree-* directories recursively and creates a node map
 */
export function scanTreeStructure(specRootDir: string): ScanResult {
  const nodes: FeatureTreeNode[] = [];
  const flatMap: Map<string, FeatureTreeNode> = new Map();

  // Start scanning from the root directory
  const rootNodes = scanDirectoryRecursively(specRootDir, 0, undefined);
  
  // Collect all nodes and populate the flatMap
  for (const node of rootNodes) {
    collectNodes(node, nodes, flatMap);
  }

  return { nodes, flatMap };
}

/**
 * Recursive helper to scan a directory and return feature tree nodes
 */
function scanDirectoryRecursively(dir: string, level: number, parentPath?: string): FeatureTreeNode[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir);
  const featureNodeChildren: FeatureTreeNode[] = [];

  for (const entry of entries) {
    if (entry.startsWith('.sddu')) continue; // Skip sddu metadata directories
    if (entry.startsWith('.')) continue;     // Skip hidden directories
    
    const fullPath = path.join(dir, entry);
    const relPath = path.relative(process.cwd(), fullPath);

    // Check if this entry matches the specs-tree pattern
    if (entry.startsWith('specs-tree-')) {
      const featureName = entry.substring('specs-tree-'.length);
      
      // Create the feature node
      const featureNode: FeatureTreeNode = {
        id: entry,
        path: relPath,
        featureName,
        level,
        children: [],
        parent: parentPath
      };

      // Look for nested specs-tree-* subdirectories within this feature's directory
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          // Recursively scan subdirectories for nested features
          featureNode.children = scanDirectoryRecursively(fullPath, level + 1, fullPath);
        }
      } catch (error) {
        console.warn(`Failed to scan subdirectory ${fullPath}: ${error.message}`);
      }

      featureNodeChildren.push(featureNode);
    }
  }

  return featureNodeChildren;
}

/**
 * Helper function to traverse all nodes and populate the flatMap and nodes array
 */
function collectNodes(node: FeatureTreeNode, nodes: FeatureTreeNode[], flatMap: Map<string, FeatureTreeNode>): void {
  // Add current node to flatMap using its path as key
  flatMap.set(node.path, node);
  nodes.push(node);
  
  // Recursively process children
  for (const child of node.children) {
    collectNodes(child, nodes, flatMap);
  }
}

/**
 * Determines if a given node represents a parent feature (one that has children)
 */
export function isParentFeature(node: FeatureTreeNode): boolean {
  return node.children.length > 0;
}