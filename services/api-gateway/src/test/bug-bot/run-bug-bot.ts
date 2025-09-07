import { NestFactory } from '@nestjs/core';
import { TestModule } from '../test.module';
import { BugBotService } from './bug-bot.service';

async function runBugBot() {
  console.log('🐛 Starting Bug Bot Monitoring...');
  
  try {
    const app = await NestFactory.createApplicationContext(TestModule);
    const bugBotService = app.get(BugBotService);
    
    const config = {
      enabled: true,
      checkInterval: 5000, // 5 seconds
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      maxResponseTime: 1000, // 1 second
      maxConcurrentRequests: 10,
      securityChecks: true,
      performanceChecks: true,
      dataIntegrityChecks: true
    };
    
    console.log('🔍 Starting Bug Bot monitoring...');
    await bugBotService.startMonitoring(config);
    
    // Run for 30 seconds
    console.log('⏱️  Running for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log('🛑 Stopping Bug Bot monitoring...');
    await bugBotService.stopMonitoring();
    
    const bugs = bugBotService.getBugReports();
    const report = bugBotService.generateBugReport();
    
    console.log('📊 Bug Report:');
    console.log(report);
    
    await app.close();
    
    console.log(`\n✅ Bug Bot completed. Found ${bugs.length} issues.`);
    
  } catch (error) {
    console.error('❌ Bug Bot failed:', error);
    process.exit(1);
  }
}

runBugBot();