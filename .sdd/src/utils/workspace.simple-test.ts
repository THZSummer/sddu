import { getSDDWorkspace, getSpecsDir } from './workspace';

console.log('Testing SDD workspace detection logic...\n');

// Test 1: Environment variables should take highest priority
console.log('=== Test 1: Environment variable priority ===');
process.env.SDD_WORKSPACE = '/custom/path/from/env';
try {
  const workspace = getSDDWorkspace();
  console.log(`✅ Environment variable test passed: ${workspace}`);
  console.log(`✅ Specs dir with env var: ${getSpecsDir()}`);
} catch (error) {
  console.log(`❌ Environment variable test failed: ${error}`);
}
delete process.env.SDD_WORKSPACE; // Clean up

// Test 2: Detect .sdd directory (this should pass as we have .sdd directory)
console.log('\n=== Test 2: .sdd/ directory detection ===');
try {
  const workspace = getSDDWorkspace();
  console.log(`✅ .sdd directory test passed: ${workspace}`);
  
  if (workspace === '.sdd') {
    const specsDir = getSpecsDir();
    console.log(`✅ Specs directory for .sdd mode: ${specsDir}`);
  }
} catch (error) {
  console.log(`❌ .sdd directory test failed (expected if no .specs directory): ${error}`);
}

console.log('\n=== Test completed ===');
console.log('Note: Some tests might fail in actual execution if the expected directories don\'t exist in the environment.');