import { NestFactory } from '@nestjs/core';
import { TestModule } from '../test.module';
import { AuthSimulationService } from './auth-simulation.service';

async function runSimulation() {
  console.log('🧪 Starting Auth Simulation Tests...');
  
  try {
    const app = await NestFactory.createApplicationContext(TestModule);
    const simulationService = app.get(AuthSimulationService);
    
    const config = {
      iterations: 5,
      delayBetweenRequests: 100,
      concurrentUsers: 3,
      testData: {
        validUsers: [
          { email: 'admin@soukel-syarat.com', password: 'admin123' }
        ],
        invalidUsers: [
          { email: 'invalid@example.com', password: 'wrongpassword' }
        ],
        newUsers: [
          { email: 'test1@example.com', password: 'password123', role: 'customer' as const },
          { email: 'test2@example.com', password: 'password123', role: 'vendor' as const }
        ]
      }
    };
    
    const results = await simulationService.runComprehensiveSimulation(config);
    const report = simulationService.generateTestReport(results);
    
    console.log('📊 Simulation Results:');
    console.log(report);
    
    await app.close();
    
    const successRate = (results.filter(r => r.success).length / results.length) * 100;
    console.log(`\n✅ Simulation completed with ${successRate.toFixed(2)}% success rate`);
    
  } catch (error) {
    console.error('❌ Simulation failed:', error);
    process.exit(1);
  }
}

runSimulation();