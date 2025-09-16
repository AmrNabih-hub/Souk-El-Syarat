/**
 * 🧪 QUICK SYSTEM TEST
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runQuickTest() {
  console.log('🧪 Running Quick System Test...\n');
  
  try {
    // Test TypeScript compilation
    console.log('🔍 Testing TypeScript compilation...');
    const { stdout: tscOutput } = await execAsync('npx tsc --noEmit --skipLibCheck');
    console.log('✅ TypeScript compilation: PASS');
    
    // Test build process
    console.log('🔍 Testing build process...');
    const { stdout: buildOutput } = await execAsync('npm run build');
    console.log('✅ Build process: PASS');
    
    // Test server health
    console.log('🔍 Testing server health...');
    const response = await fetch('http://localhost:8080/health');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server health: PASS');
      console.log(`   Status: ${data.status}`);
      console.log(`   Uptime: ${data.uptime}s`);
    } else {
      throw new Error(`Server health check failed: ${response.status}`);
    }
    
    console.log('\n🎉 All tests passed! System is healthy.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runQuickTest();
