/**
 * Comprehensive Use Case Simulation Runner
 * Runs all user workflows, authentication flows, and real-time synchronization tests
 */

import UseCaseSimulationService from './src/services/use-case-simulation.service.js';

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runComprehensiveSimulation() {
  try {
    log('🚀 Starting Comprehensive Use Case Simulation', 'magenta');
    log('===============================================', 'magenta');
    
    // Initialize simulation service
    const simulationService = UseCaseSimulationService.getInstance();
    await simulationService.initialize();
    
    // Run comprehensive simulation
    const results = await simulationService.runComprehensiveSimulation();
    
    // Display results
    displaySimulationResults(results);
    
    // Generate detailed report
    generateDetailedReport(results);
    
  } catch (error) {
    log(`❌ Simulation failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

function displaySimulationResults(results) {
  log('\n📊 SIMULATION RESULTS', 'cyan');
  log('====================', 'cyan');
  
  const totalScenarios = results.length;
  const successfulScenarios = results.filter(r => r.success).length;
  const failedScenarios = results.filter(r => !r.success).length;
  const totalSteps = results.reduce((sum, r) => sum + r.steps.length, 0);
  const successfulSteps = results.reduce((sum, r) => 
    sum + r.steps.filter(s => s.success).length, 0);
  const realTimeEvents = results.reduce((sum, r) => sum + r.realTimeEvents.length, 0);
  const averageExecutionTime = results.reduce((sum, r) => sum + r.totalTime, 0) / results.length;
  
  log(`\n📈 OVERALL STATISTICS:`, 'blue');
  log(`Total Scenarios: ${totalScenarios}`, 'white');
  log(`Successful Scenarios: ${successfulScenarios}`, 'green');
  log(`Failed Scenarios: ${failedScenarios}`, failedScenarios > 0 ? 'red' : 'green');
  log(`Success Rate: ${((successfulScenarios / totalScenarios) * 100).toFixed(1)}%`, 'white');
  log(`Total Steps: ${totalSteps}`, 'white');
  log(`Successful Steps: ${successfulSteps}`, 'green');
  log(`Step Success Rate: ${((successfulSteps / totalSteps) * 100).toFixed(1)}%`, 'white');
  log(`Real-time Events: ${realTimeEvents}`, 'cyan');
  log(`Average Execution Time: ${averageExecutionTime.toFixed(0)}ms`, 'yellow');
  
  log(`\n📋 SCENARIO DETAILS:`, 'blue');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const statusColor = result.success ? 'green' : 'red';
    
    log(`\n${index + 1}. ${status} ${result.scenarioName}`, statusColor);
    log(`   Execution Time: ${result.totalTime}ms`, 'white');
    log(`   Steps: ${result.steps.length}`, 'white');
    log(`   Real-time Events: ${result.realTimeEvents.length}`, 'cyan');
    
    if (result.errors.length > 0) {
      log(`   Errors:`, 'red');
      result.errors.forEach(error => {
        log(`     - ${error}`, 'red');
      });
    }
    
    // Show step details
    result.steps.forEach(step => {
      const stepStatus = step.success ? '✅' : '❌';
      const stepColor = step.success ? 'green' : 'red';
      const realTimeIndicator = step.realTimeSync ? ' 🔄' : '';
      
      log(`     ${stepStatus} ${step.stepName}${realTimeIndicator}`, stepColor);
      if (!step.success) {
        log(`       ${step.result}`, 'red');
      }
    });
  });
}

function generateDetailedReport(results) {
  log('\n📄 DETAILED REPORT', 'magenta');
  log('==================', 'magenta');
  
  // Group results by user type
  const customerResults = results.filter(r => r.scenarioName.includes('Customer'));
  const vendorResults = results.filter(r => r.scenarioName.includes('Vendor'));
  const adminResults = results.filter(r => r.scenarioName.includes('Admin'));
  
  log(`\n👤 CUSTOMER WORKFLOWS:`, 'blue');
  log(`Scenarios: ${customerResults.length}`, 'white');
  log(`Success Rate: ${((customerResults.filter(r => r.success).length / customerResults.length) * 100).toFixed(1)}%`, 'white');
  
  log(`\n🏪 VENDOR WORKFLOWS:`, 'blue');
  log(`Scenarios: ${vendorResults.length}`, 'white');
  log(`Success Rate: ${((vendorResults.filter(r => r.success).length / vendorResults.length) * 100).toFixed(1)}%`, 'white');
  
  log(`\n👨‍💼 ADMIN WORKFLOWS:`, 'blue');
  log(`Scenarios: ${adminResults.length}`, 'white');
  log(`Success Rate: ${((adminResults.filter(r => r.success).length / adminResults.length) * 100).toFixed(1)}%`, 'white');
  
  // Real-time features analysis
  log(`\n🔄 REAL-TIME FEATURES ANALYSIS:`, 'cyan');
  const realTimeScenarios = results.filter(r => r.realTimeEvents.length > 0);
  log(`Scenarios with Real-time Features: ${realTimeScenarios.length}/${results.length}`, 'white');
  
  const totalRealTimeEvents = results.reduce((sum, r) => sum + r.realTimeEvents.length, 0);
  log(`Total Real-time Events: ${totalRealTimeEvents}`, 'cyan');
  
  // Authentication analysis
  log(`\n🔐 AUTHENTICATION ANALYSIS:`, 'yellow');
  const authSteps = results.reduce((sum, r) => 
    sum + r.steps.filter(s => s.stepName.includes('Authenticate')).length, 0);
  const successfulAuthSteps = results.reduce((sum, r) => 
    sum + r.steps.filter(s => s.stepName.includes('Authenticate') && s.success).length, 0);
  
  log(`Authentication Steps: ${authSteps}`, 'white');
  log(`Successful Authentications: ${successfulAuthSteps}`, 'green');
  log(`Authentication Success Rate: ${((successfulAuthSteps / authSteps) * 100).toFixed(1)}%`, 'white');
  
  // Performance analysis
  log(`\n⚡ PERFORMANCE ANALYSIS:`, 'green');
  const fastScenarios = results.filter(r => r.totalTime < 5000).length;
  const mediumScenarios = results.filter(r => r.totalTime >= 5000 && r.totalTime < 10000).length;
  const slowScenarios = results.filter(r => r.totalTime >= 10000).length;
  
  log(`Fast Scenarios (<5s): ${fastScenarios}`, 'green');
  log(`Medium Scenarios (5-10s): ${mediumScenarios}`, 'yellow');
  log(`Slow Scenarios (>10s): ${slowScenarios}`, 'red');
  
  // Error analysis
  log(`\n❌ ERROR ANALYSIS:`, 'red');
  const scenariosWithErrors = results.filter(r => r.errors.length > 0);
  log(`Scenarios with Errors: ${scenariosWithErrors.length}`, 'white');
  
  if (scenariosWithErrors.length > 0) {
    log(`Error Details:`, 'red');
    scenariosWithErrors.forEach(result => {
      log(`  ${result.scenarioName}:`, 'red');
      result.errors.forEach(error => {
        log(`    - ${error}`, 'red');
      });
    });
  }
  
  // Final assessment
  log(`\n🎯 FINAL ASSESSMENT:`, 'magenta');
  const overallSuccessRate = ((successfulScenarios / totalScenarios) * 100);
  
  if (overallSuccessRate >= 95) {
    log(`✅ EXCELLENT: ${overallSuccessRate.toFixed(1)}% success rate`, 'green');
    log(`🚀 READY FOR PRODUCTION`, 'green');
  } else if (overallSuccessRate >= 90) {
    log(`✅ GOOD: ${overallSuccessRate.toFixed(1)}% success rate`, 'yellow');
    log(`⚠️ MINOR ISSUES TO ADDRESS`, 'yellow');
  } else if (overallSuccessRate >= 80) {
    log(`⚠️ FAIR: ${overallSuccessRate.toFixed(1)}% success rate`, 'yellow');
    log(`🔧 ISSUES NEED ATTENTION`, 'yellow');
  } else {
    log(`❌ POOR: ${overallSuccessRate.toFixed(1)}% success rate`, 'red');
    log(`🚨 MAJOR ISSUES TO FIX`, 'red');
  }
  
  log(`\n📊 PRODUCTION READINESS: ${overallSuccessRate.toFixed(1)}%`, 'cyan');
}

// Run the simulation
runComprehensiveSimulation().catch(console.error);