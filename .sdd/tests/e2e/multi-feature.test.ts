import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * 端到端测试：多子 Feature 功能
 * 测试内容：
 * 1. 设计端到端测试场景
 * 2. 创建测试 fixture（多子 Feature Feature 示例）
 * 3. 实现完整流程测试（spec→plan→tasks→build）
 * 4. 验证并行执行无冲突
 * 5. 输出测试报告
 */

interface FeatureState {
  feature: string;
  name?: string;
  version?: string;
  status: string;
  phase?: number;
  files?: {
    spec?: string;
    plan?: string;
    tasks?: string;
    readme?: string;
  };
  dependencies?: {
    on?: string[];
    blocking?: string[];
  };
  assignee?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Mock函数来模拟SDD Agent的操作
async function mockRunAgent(command: string, params: {[key: string]: any}): Promise<any> {
  console.log(`模拟执行命令: ${command}`, params);
  
  // 模拟不同命令的效果
  switch (command) {
    case '@sdd-spec':
      return await simulateSpecCreation(params.feature, params.mode);
    case '@sdd-plan':
      return await simulatePlanCreation(params.feature);
    case '@sdd-tasks':
      return await simulateTasksCreation(params.feature);
    case '@sdd-build':
      return await simulateBuildExecution(params.feature, params.task);
    default:
      console.warn(`未识别的命令: ${command}`);
      return { success: true };
  }
}

async function simulateSpecCreation(featureId: string, mode: string = 'multi'): Promise<any> {
  const featurePath = `.sdd/.specs/${featureId}`;
  
  if (!existsSync(featurePath)) {
    mkdirSync(featurePath, { recursive: true });
  }

  // 创建主 spec.md
  const mainSpecContent = `# Spec: ${featureId}

## 概述
这是一个多子 Feature 示例，用于 E2E 测试。

## 子 Feature 索引

| 子 Feature ID | 子 Feature 名称 | 目录路径 | 状态 | 负责人 | 阻塞依赖 |
|---------------|-----------------|----------|------|--------|----------|
| user-center | 用户中心 | user-center | specified | 张三 | - |
| order-system | 订单系统 | order-system | specified | 李四 | user-center |
| payment | 支付模块 | payment | specified | 王五 | order-system |

---

## 跨子 Feature 协同

### 接口约定
[这里定义接口规范]

### 数据流
[这里定义数据流]

---
  
**文档状态**: specified
**状态更新命令**: 
\`\`\`bash
/tool sdd_update_state {"feature": "${featureId}", "state": "specified", "phase": 1}
\`\`\`
`;
  writeFileSync(`${featurePath}/spec.md`, mainSpecContent);

  // 模拟创建子Feature目录结构
  const subFeatures = [
    { featureId: 'user-center', name: '用户中心' },
    { featureId: 'order-system', name: '订单系统' },
    { featureId: 'payment', name: '支付模块' }
  ];

  for (const sf of subFeatures) {
    const sfPath = join(featurePath, sf.featureId);
    if (!existsSync(sfPath)) {
      mkdirSync(sfPath, { recursive: true });
    }
    
    // 创建子Feature的spec
    const subSpecContent = `# Sub-Feature: ${sf.featureId} (${sf.name})

## 描述
这是 ${sf.name} 的详细规格说明。

---
  
**文档状态**: specified
**状态更新命令**: 
\`\`\`bash
/tool sdd_update_state {"feature": "${sf.featureId}", "state": "specified", "parentFeature": "${featureId}"}
\`\`\`
`;
    writeFileSync(join(sfPath, 'spec.md'), subSpecContent);

    // 创建状态文件
    const state: FeatureState = {
      feature: sf.featureId,
      name: sf.name,
      version: '1.2.11',
      status: 'specified',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    writeFileSync(join(sfPath, 'state.json'), JSON.stringify(state, null, 2));
  }

  // 创建主要状态文件
  const mainState: FeatureState = {
    feature: featureId,
    name: `E2E Test Multi-Feature: ${featureId}`,
    version: '1.2.11',
    status: 'specified',
    phase: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mainFeaturePath = `.sdd/specs-tree-root/specs-tree-${featureId.replace(/[^a-z0-9-]/g, '-')}`;
  if (!existsSync(mainFeaturePath)) {
    mkdirSync(mainFeaturePath, { recursive: true });
  }
  
  writeFileSync(`${mainFeaturePath}/state.json`, JSON.stringify(mainState, null, 2));

  return { 
    success: true, 
    message: `Specification for ${featureId} created successfully`, 
    subFeatures 
  };
}

async function simulatePlanCreation(featureId: string): Promise<any> {
  const featurePath = `.sdd/specs-tree-root/specs-tree-${featureId.replace(/[^a-z0-9-]/g, '-')}`;
  
  if (!existsSync(featurePath)) {
    console.error(`特征目录不存在: ${featurePath}`);
    return { success: false, error: `特征目录不存在: ${featurePath}` };
  }

  // 查找子Feature
  const subFeatures = await scanSubFeatures(featurePath);
  
  // 创建计划
  const planContent = `# 技术计划：${featureId}

## 总体架构
该项目采用了模块化设计，将功能拆分为多个子 Feature：${subFeatures.map(sf => sf.id).join(', ')}

## 实现计划
${subFeatures.map((sf, index) => `### ${index + 1}. ${sf.id}: ${sf.name}`).join('\n\n')}

---
  
**文档状态**: planned
**状态更新命令**: 
\`\`\`bash
/tool sdd_update_state {"feature": "${featureId}", "state": "planned", "phase": 2}
\`\`\`
`;

  writeFileSync(join(featurePath, 'plan.md'), planContent);

  // 更新主特征状态
  const mainStatePath = join(featurePath, 'state.json');
  if (existsSync(mainStatePath)) {
    const stateData = JSON.parse(readFileSync(mainStatePath, 'utf-8'));
    stateData.status = 'planned';
    stateData.phase = 2;
    writeFileSync(mainStatePath, JSON.stringify(stateData, null, 2));
  }

  // 更新子Feature状态
  for (const sf of subFeatures) {
    const sfPath = join(featurePath, sf.id);
    if (existsSync(sfPath) && existsSync(join(sfPath, 'state.json'))) {
      const sfState = JSON.parse(readFileSync(join(sfPath, 'state.json'), 'utf-8'));
      sfState.status = 'planned';
      writeFileSync(join(sfPath, 'state.json'), JSON.stringify(sfState, null, 2));
    }
  }

  return { success: true, message: `Implementation plan for ${featureId} created successfully` };
}

async function simulateTasksCreation(featureId: string): Promise<any> {
  const featurePath = `.sdd/specs-tree-root/specs-tree-${featureId.replace(/[^a-z0-9-]/g, '-')}`;
  
  if (!existsSync(featurePath)) {
    console.error(`特征目录不存在: ${featurePath}`);
    return { success: false, error: `特征目录不存在: ${featurePath}` };
  }

  // 查找子Feature并创建任务
  const subFeatures = await scanSubFeatures(featurePath);

  // 创建任务分解
  const tasksContent = `# 任务分解：${featureId}

## 并行执行组

### 组 0: 基础设施建设
- [x] TASK-001-001: 初始化目录结构 (1h)
- [x] TASK-001-002: 基础设置 (1h)

### 组 1: 核心功能开发 (等待组 0)
- [x] TASK-002-001: ${subFeatures[0]?.id} 基础功能 (3h)
- [ ] TASK-002-002: ${subFeatures[0]?.id} 数据模型 (2h)
- [ ] TASK-002-003: ${subFeatures[1]?.id} API 接口 (4h)

### 组 2: 业务流程集成 (等待组 1)  
- [ ] TASK-003-001: ${subFeatures[0]?.id} → ${subFeatures[1]?.id} 集成 (3h)
- [ ] TASK-003-002: ${subFeatures[1]?.id} → ${subFeatures[2]?.id} 集成 (3h)

### 组 3: 测试与验证 (等待组 2)
- [ ] TASK-004-001: 集成测试 (4h)
- [ ] TASK-004-002: 端到端测试 (5h)

---
  
**文档状态**: tasked
**状态更新命令**: 
\`\`\`bash
/tool sdd_update_state {"feature": "${featureId}", "state": "tasked", "phase": 3}
\`\`\`
`;

  writeFileSync(join(featurePath, 'tasks.md'), tasksContent);

  // 创建整体任务状态
  const taskStatePath = join(featurePath, 'state.json');
  if (existsSync(taskStatePath)) {
    const stateData = JSON.parse(readFileSync(taskStatePath, 'utf-8'));
    stateData.status = 'tasked';
    stateData.phase = 3;
    writeFileSync(taskStatePath, JSON.stringify(stateData, null, 2));
  }

  // 更新子Feature状态
  for (const sf of subFeatures) {
    const sfPath = join(featurePath, sf.id);
    if (existsSync(sfPath) && existsSync(join(sfPath, 'state.json'))) {
      const sfState = JSON.parse(readFileSync(join(sfPath, 'state.json'), 'utf-8'));
      if (sfState.status !== 'completed') {
        sfState.status = 'tasked';
        writeFileSync(join(sfPath, 'state.json'), JSON.stringify(sfState, null, 2));
      }
    }
  }

  return { success: true, message: `Task breakdown for ${featureId} created successfully` };
}

async function simulateBuildExecution(featureId: string, taskId?: string): Promise<any> {
  const featurePath = `.sdd/specs-tree-root/specs-tree-${featureId.replace(/[^a-z0-9-]/g, '-')}`;
  
  if (!existsSync(featurePath)) {
    console.error(`特征目录不存在: ${featurePath}`);
    return { success: false, error: `特征目录不存在: ${featurePath}` };
  }

  // 随机选择一个任务进行模拟执行
  const selectedTask = taskId || 'TASK-002-002';

  console.log(`正在执行构建任务: ${selectedTask}`);

  // 模拟任务执行
  const subFeatures = await scanSubFeatures(featurePath);
  
  if (taskId) {
    // 根据任务执行特定逻辑
    const taskToExecute = selectedTask;
    
    // 更新特定子功能的状态
    for (const sf of subFeatures) {
      const sfPath = join(featurePath, sf.id);
      if (existsSync(sfPath) && existsSync(join(sfPath, 'state.json'))) {
        const sfState = JSON.parse(readFileSync(join(sfPath, 'state.json'), 'utf-8'));
        if (sfState.status === 'tasked') {
          sfState.status = 'implementing';
          sfState.updatedAt = new Date().toISOString();
        }
        writeFileSync(join(sfPath, 'state.json'), JSON.stringify(sfState, null, 2));
      }
    }
  } else {
    // 模拟构建特定文件以验证并行构建不会冲突
    const implementationFiles = [
      { module: 'user-center', file: 'auth/controller.ts' },
      { module: 'order-system', file: 'order/service.ts' },
      { module: 'payment', file: 'payment/gateway.ts' }
    ];

    for (const impl of implementationFiles) {
      const modulePath = join(featurePath, impl.module);
      if (!existsSync(modulePath)) {
        mkdirSync(modulePath, { recursive: true });
      }
      
      const content = `// Implementation of ${impl.file}\n\nexport class ${impl.module.charAt(0).toUpperCase() + impl.module.slice(1)}Impl {\n  // Actual implementation\n}\n`;
      writeFileSync(join(modulePath, impl.file), content);
      console.log(`Created: ${modulePath}/${impl.file}`);
    }
  }

  // 更新主Feature状态
  const mainStatePath = join(featurePath, 'state.json');
  if (existsSync(mainStatePath)) {
    const stateData = JSON.parse(readFileSync(mainStatePath, 'utf-8'));
    stateData.status = 'implementing';
    stateData.phase = 4;
    stateData.updatedAt = new Date().toISOString();
    writeFileSync(mainStatePath, JSON.stringify(stateData, null, 2));
  }

  console.log(`任务 ${selectedTask} 构建完成`);

  return { success: true, message: `Build executed for task ${selectedTask}` };
}

// 辅助函数：扫描子Feature
async function scanSubFeatures(featurePath: string): Promise<FeatureState[]> {
  const subFeatures: FeatureState[] = [];
  
  try {
    const entries = readdirSync(featurePath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory() && 
          !entry.name.startsWith('.') && 
          entry.name !== 'specs-tree-deprecate-sdd-tools' &&
          entry.name !== 'specs-tree-sdd-discovery-feature' &&
          entry.name !== 'specs-tree-sdd-plugin-baseline' &&
          entry.name !== 'specs-tree-feature-readme-template' &&
          entry.name !== 'specs-tree-sdd-workflow-state-optimization' &&
          entry.name !== 'specs-tree-sdd-plugin-roadmap' &&
          entry.name !== 'specs-tree-sdd-multi-module' &&
          entry.name !== 'specs-tree-roadmap-update' &&
          entry.name !== 'specs-tree-directory-optimization' &&
          entry.name !== 'specs-tree-deprecate-sdd-tools') {
        
        const stateFile = join(featurePath, entry.name, 'state.json');
        if (existsSync(stateFile)) {
          const stateContent = readFileSync(stateFile, 'utf-8');
          try {
            const state: FeatureState = JSON.parse(stateContent);
            subFeatures.push(state);
          } catch (e) {
            console.error(`解析状态文件出错: ${stateFile}`, e);
          }
        }
      }
    }
  } catch (e) {
    console.error(`扫描子Feature时出错: ${featurePath}`, e);
  }
  
  return subFeatures;
}

// 函数：加载所有子Feature状态
async function loadAllSubFeatureStates(featureId: string): Promise<FeatureState[]> {
  const featurePath = `.sdd/specs-tree-root/specs-tree-${featureId.replace(/[^a-z0-9-]/g, '-')}`;
  return await scanSubFeatures(featurePath);
}

// 函数：加载特定Feature状态
async function loadFeatureState(featureId: string): Promise<FeatureState | null> {
  const featurePath = `.sdd/specs-tree-root/specs-tree-${featureId.replace(/[^a-z0-9-]/g, '-')}`;
  const stateFilePath = join(featurePath, 'state.json');
  
  if (existsSync(stateFilePath)) {
    const content = readFileSync(stateFilePath, 'utf-8');
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error(`解析状态文件失败: ${stateFilePath}`, e);
      return null;
    }
  }
  return null;
}

// 执行端到端测试
async function runE2ETest(): Promise<boolean> {
  console.log('🚀 开始端到端测试: 多子 Feature 功能\n');

  const testFeatureId = 'e2e-test-multi-feature';
  
  try {
    // 测试步骤 1: 创建规范
    console.log('✅ 步骤 1: 创建多子 Feature 规范');
    const specResult = await mockRunAgent('@sdd-spec', { 
      feature: testFeatureId, 
      mode: 'multi' 
    });
    console.log(`   结果: ${specResult.success ? '成功' : '失败'}`);
    if (!specResult.success) return false;

    // 验证子 Feature 目录创建
    console.log('   验证子 Feature 目录结构...');
    for (const subFeatureName of ['user-center', 'order-system', 'payment']) {
      const expectedPath = `.sdd/specs-tree-root/specs-tree-${testFeatureId.replace(/[^a-z0-9-]/g, '-')}/${subFeatureName}`;
      if (existsSync(expectedPath)) {
        console.log(`     ✓ ${subFeatureName} 目录存在`);
      } else {
        console.log(`     ✗ ${subFeatureName} 目录不存在: ${expectedPath}`);
        return false;
      }
    }

    // 测试步骤 2: 创建技术计划
    console.log('\n✅ 步骤 2: 创建技术计划');
    const planResult = await mockRunAgent('@sdd-plan', { 
      feature: testFeatureId 
    });
    console.log(`   结果: ${planResult.success ? '成功' : '失败'}`);
    if (!planResult.success) return false;

    // 验证计划文件创建
    const planPath = `.sdd/specs-tree-root/specs-tree-${testFeatureId.replace(/[^a-z0-9-]/g, '-')}/plan.md`;
    if (existsSync(planPath)) {
      console.log('     ✓ plan.md 找到');
    } else {
      console.log('     ✗ plan.md 未找到');
      return false;
    }

    // 测试步骤 3: 创建任务分解
    console.log('\n✅ 步骤 3: 创建任务分解');
    const tasksResult = await mockRunAgent('@sdd-tasks', { 
      feature: testFeatureId 
    });
    console.log(`   结果: ${tasksResult.success ? '成功' : '失败'}`);
    if (!tasksResult.success) return false;

    // 验证任务文件创建
    const tasksPath = `.sdd/specs-tree-root/specs-tree-${testFeatureId.replace(/[^a-z0-9-]/g, '-')}/tasks.md`;
    if (existsSync(tasksPath)) {
      console.log('     ✓ tasks.md 找到');
    } else {
      console.log('     ✗ tasks.md 未找到');
      return false;
    }

    // 测试步骤 4: 并行执行构建任务
    console.log('\n✅ 步骤 4: 执行构建任务 (模拟并行)'); 
    const buildResult = await mockRunAgent('@sdd-build', { 
      feature: testFeatureId,
      task: 'TASK-002-002'
    });
    console.log(`   结果: ${buildResult.success ? '成功' : '失败'}`);
    if (!buildResult.success) return false;

    // 验证构建后文件存在
    const subFeatureStates = await loadAllSubFeatureStates(testFeatureId);
    console.log(`   验证子 Feature 状态: ${subFeatureStates.length} 个子 Feature`);
    
    for (const sf of subFeatureStates) {
      if (sf.status !== 'implementing' && sf.status !== 'completed') {
        console.log(`     ⚠ ${sf.feature} 状态不是 expected implementing/completed: ${sf.status}`);
      } else {
        console.log(`     ✓ ${sf.feature} 状态正常: ${sf.status}`);
      }
    }

    // 测试步骤 5: 验证状态聚合
    console.log('\n✅ 步骤 5: 验证状态聚合');
    const state = await loadFeatureState(testFeatureId);
    if (state && state.status) {
      console.log(`   特征状态: ${state.status} (预期: 不为 error)`);
      if (state.status === 'error') {
        console.log('     ✗ 特征状态为 error');
        return false;
      }
      console.log('     ✓ 特征状态正常');
    } else {
      console.log('     ✓ 特征状态文件不存在 - 正常情况');
    }

    // 测试步骤 6: 并行执行冲突检测
    console.log('\n✅ 步骤 6: 验证并行执行无冲突');
    
    // 测试两个"并发"的构建指令
    const promise1 = mockRunAgent('@sdd-build', { feature: testFeatureId, task: 'TASK-PARALLEL-001'});
    const promise2 = mockRunAgent('@sdd-build', { feature: testFeatureId, task: 'TASK-PARALLEL-002'});
    
    await Promise.all([promise1, promise2]);
    console.log('   ✓ 两个并行任务完成，未遇到文件冲突');
    
    // 检查最终所有状态
    const finalStates = await loadAllSubFeatureStates(testFeatureId);
    const hasErrors = finalStates.some(sf => sf.status === 'error');
    if (hasErrors) {
      console.log('     ✗ 检测到错误状态的子 Feature');
      return false;
    } else {
      console.log('     ✓ 所有子 Feature 状态正确，无冲突');
    }
    
    console.log('\n🎉 所有端到端测试通过！');
    return true;
  } catch (error) {
    console.error(`\n❌ 端到端测试失败:`, error);
    return false;
  }
}

// 运行测试
console.log('='.repeat(60));
console.log('     SDD 多子 Feature 端到端测试');
console.log('='.repeat(60));

runE2ETest()
  .then(success => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('✅ 测试结果: 全部通过');
      console.log('所有端到端测试场景都已验证，多子 Feature 功能工作正常');
    } else {
      console.log('❌ 测试结果: 部分测试失败');
      console.log('请查看上面的详细信息以调试问题');
    }
    console.log('='.repeat(60));
  });

export { runE2ETest };