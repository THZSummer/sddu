import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync, statSync } from 'fs';

/**
 * 子 Feature 元数据接口
 */
export interface SubFeatureMeta {
  id: string;
  name: string;
  status: string;
  assignee?: string;
  dir: string;
}

/**
 * 检测 Feature 模式（单模块 vs 多子 Feature）
 * 
 * @param featurePath Feature 的根目录路径
 * @returns 'single' - 单模块模式, 'multi' - 多子 Feature 模式
 */
export async function detectFeatureMode(featurePath: string): Promise<'single' | 'multi'> {
  const subFeaturesPath = path.join(featurePath, 'sub-features');
  
  try {
    // 检查是否有 sub-features 目录
    const dirExists = await pathExists(subFeaturesPath);
    
    if (dirExists) {
      // 检查 sub-features 目录下有没有非隐藏的子目录
      const items = await fs.readdir(subFeaturesPath);
      const subDirectories = items.filter(item => {
        const itemPath = path.join(subFeaturesPath, item);
        const stat = statSync(itemPath);  // 使用同步 fs.statSync
        return stat.isDirectory() && !item.startsWith('.');
      });

      if (subDirectories.length > 0) {
        return 'multi';
      }
    }
  } catch (error) {
    // 如果 sub-features 目录不存在或其他错误，认为是单模块模式
  }

  return 'single';
}

/**
 * 创建子 Feature 目录结构
 * 
 * @param featurePath Feature 的根目录路径
 * @param subFeatureId 子 Feature ID
 * @param name 子 Feature 名称
 * @returns 子 Feature 目录路径
 */
export async function createSubFeature(
  featurePath: string,
  subFeatureId: string,
  name: string
): Promise<string> {
  const subFeaturesDir = path.join(featurePath, 'sub-features');
  
  // 确保 sub-features 父目录存在
  await fs.mkdir(subFeaturesDir, { recursive: true });
  
  // 创建子 Feature 目录
  const subFeatureDir = path.join(subFeaturesDir, subFeatureId);
  await fs.mkdir(subFeatureDir, { recursive: true });
  
  // 创建子 Feature 的基本文件
  const specContent = `# 子 Feature: ${name}\n\n## 概述\n\n[子 Feature 概述]\n\n## 需求规格\n\n[需求规格详细描述]\n\n## 实现计划\n\n[实现计划]\n\n## 任务分解\n\n[任务分解信息]\n`;
  await fs.writeFile(path.join(subFeatureDir, 'spec.md'), specContent);
  
  // 创建子 Feature 的 README
  const readmeContent = `# ${name}\n\n子 Feature: ${subFeatureId}\n\n## 快速导航\n\n- 📋 [Spec](spec.md) - 需求规格\n- 🏗️ [Plan](plan.md) - 技术规划\n- 📝 [Tasks](tasks.md) - 任务分解\n\n## 当前状态\n- 状态: [to-do]\n- 负责人: [未分配]\n`;
  await fs.writeFile(path.join(subFeatureDir, 'README.md'), readmeContent);
  
  // 创建初始状态文件
  const stateContent = JSON.stringify({
    id: subFeatureId,
    name: name,
    status: 'specified',
    assignee: '',
    dir: `sub-features/${subFeatureId}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, null, 2);
  await fs.writeFile(path.join(subFeatureDir, '.state.json'), stateContent);
  
  return subFeatureDir;
}

/**
 * 生成子 Feature 索引表
 * 
 * @param featurePath Feature 的根目录路径
 * @returns 子 Feature 索引表的 Markdown 内容
 */
export async function generateSubFeatureIndex(featurePath: string): Promise<string> {
  const subFeaturesPath = path.join(featurePath, 'sub-features');
  
  // 如果是单模块模式，则返回空索引
  const mode = await detectFeatureMode(featurePath);
  if (mode === 'single') {
    return '';
  }
  
  try {
    const subDirectories = await getSubFeatureDirectories(subFeaturesPath);
    
    if (subDirectories.length === 0) {
      return '';
    }
    
    // 为每个子目录生成索引条目
    const indexRows = await Promise.all(subDirectories.map(async (dir) => {
      const specPath = path.join(subFeaturesPath, dir, 'spec.md');
      let name = dir;
      
      try {
        const specContent = await fs.readFile(specPath, 'utf8');
        
        // 从 spec.md 中提取子 Feature 信息
        const titleMatch = specContent.match(/^#\s*子 Feature:\s*(.+)$/m);
        if (titleMatch) {
          name = titleMatch[1];
        }
        
        // 尝试从状态文件获取更多信息
        const statePath = path.join(subFeaturesPath, dir, '.state.json');
        let stateInfo = { status: 'unknown', assignee: '-' };
        
        try {
          const stateContent = await fs.readFile(statePath, 'utf8');
          const stateData = JSON.parse(stateContent);
          stateInfo = {
            status: stateData.status || 'unknown',
            assignee: stateData.assignee || '-'
          };
        } catch (error) {
          // 如果状态文件不存在或无效，则使用默认值
        }
        
        const dirPath = `sub-features/${dir}`;
        return `| ${dir} | ${name} | ${dirPath} | ${stateInfo.status} | ${stateInfo.assignee} | - |`;
      } catch (error) {
        // 如果 spec 文件不存在，仍然为这个子目录创建一个索引项，但使用默认值
        const dirPath = `sub-features/${dir}`;
        return `| ${dir} | ${name} | ${dirPath} | [spec missing] | - | - |`;
      }
    }));
    
    // 构建完整的索引表格
    const tableHeader = '| 子 Feature ID | 子 Feature 名称 | 目录路径 | 状态 | 负责人 | 阻塞依赖 |\n|---------------|-----------------|----------|------|--------|----------|';
    return [tableHeader, ...indexRows].join('\n');
  } catch (error) {
    // 如果出现错误（比如没有 sub-features 目录），返回空字符串
    return '';
  }
}

/**
 * 扫描子 Feature 目录，获取所有子 Feature 的元数据
 * 
 * @param featurePath Feature 的根目录路径
 * @returns 子 Feature 元数据数组
 */
export async function scanSubFeatures(featurePath: string): Promise<SubFeatureMeta[]> {
  const mode = await detectFeatureMode(featurePath);
  if (mode === 'single') {
    return []; // 单模块模式下没有子 Feature
  }
  
  const subFeaturesPath = path.join(featurePath, 'sub-features');
  
  try {
    const subDirectories = await getSubFeatureDirectories(subFeaturesPath);
    
    const subFeatures = await Promise.all(subDirectories.map(async (dir) => {
      const dirPath = `sub-features/${dir}`;
      const statePath = path.join(subFeaturesPath, dir, '.state.json');
      
      let stateData: Partial<SubFeatureMeta> = {
        id: dir,
        name: dir,
        status: 'uninit',
        dir: dirPath
      };
      
      try {
        const stateContent = await fs.readFile(statePath, 'utf8');
        stateData = JSON.parse(stateContent);
      } catch (error) {
        // 如果状态文件不存在，则尝试从 spec 文件中提取基本信息
        const specPath = path.join(subFeaturesPath, dir, 'spec.md');
        try {
          const specContent = await fs.readFile(specPath, 'utf8');
          const titleMatch = specContent.match(/^#\s*子 Feature:\s*(.+)$/m);
          if (titleMatch) {
            stateData = {
              ...stateData,
              id: dir,
              name: titleMatch[1],
              status: 'spec-missing'
            };
          }
        } catch (specError) {
          // spec 文件也不存在
          stateData = {
            id: dir,
            name: dir,
            status: 'not-initialized',
            dir: dirPath
          };
        }
      }
      
      // 确保返回的对象完整
      return {
        id: stateData.id || dir,
        name: stateData.name || dir,
        status: stateData.status || 'unknown',
        assignee: stateData.assignee,
        dir: stateData.dir || dirPath
      };
    }));
    
    return subFeatures;
  } catch (error) {
    // 如果无法扫描，返回空数组
    return [];
  }
}

/**
 * 验证子 Feature 文档的完整性
 * 
 * @param subFeature 子 Feature 元数据
 * @returns 包含验证结果的对象
 */
export function validateSubFeatureCompleteness(subFeature: SubFeatureMeta): {
  valid: boolean;
  missing: string[]
} {
  const featureDir = path.join(process.cwd(), 'specs-tree-root', subFeature.dir);
  const missing: string[] = [];

  try {
    // 检查必需的文件是否存在
    const requiredFiles = ['spec.md', 'plan.md', 'tasks.md', 'README.md'];
    
    for (const file of requiredFiles) {
      const fullPath = path.join(featureDir, file);
      if (!existsSync(fullPath)) {
        missing.push(file);
      }
    }
    
    // 检查子特征的状态文件
    const stateFile = path.join(featureDir, '.state.json');
    if (!existsSync(stateFile)) {
      missing.push('.state.json');
    }
    
    return {
      valid: missing.length === 0,
      missing: missing
    };
  } catch (error) {
    // 如果发生错误（访问文件系统问题），则认为有缺失
    return {
      valid: false,
      missing: ['[访问权限或系统错误]']
    };
  }
}

/**
 * 检查路径是否存在
 * 
 * @param filepath 路径
 * @returns 路径是否存在
 */
async function pathExists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 获取有效的子 Feature 目录列表
 * 
 * @param subFeaturesPath sub-features 目录路径
 * @returns 有效子目录名数组
 */
async function getSubFeatureDirectories(subFeaturesPath: string): Promise<string[]> {
  try {
    const items = await fs.readdir(subFeaturesPath);
    
    // 过滤出目录且不是以.开头的文件夹（如 .git）
    const validDirectories = [];
    for (const item of items) {
      if (item.startsWith('.')) continue;
      
      const itemPath = path.join(subFeaturesPath, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        validDirectories.push(item);
      }
    }
    
    return validDirectories;
  } catch (error) {
    return [];
  }
}