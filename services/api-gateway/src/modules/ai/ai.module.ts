import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIController } from './ai.controller';
import { MachineLearningService } from './machine-learning.service';
import { PredictiveAnalyticsService } from './predictive-analytics.service';
import { AnomalyDetectionService } from './anomaly-detection.service';
import { RecommendationEngineService } from './recommendation-engine.service';
import { NaturalLanguageProcessingService } from './natural-language-processing.service';
import { ComputerVisionService } from './computer-vision.service';
import { AITrainingService } from './ai-training.service';
import { AIModelManagementService } from './ai-model-management.service';
import { AIPredictionService } from './ai-prediction.service';
import { AIInsightsService } from './ai-insights.service';

@Module({
  imports: [ConfigModule],
  controllers: [AIController],
  providers: [
    MachineLearningService,
    PredictiveAnalyticsService,
    AnomalyDetectionService,
    RecommendationEngineService,
    NaturalLanguageProcessingService,
    ComputerVisionService,
    AITrainingService,
    AIModelManagementService,
    AIPredictionService,
    AIInsightsService,
  ],
  exports: [
    MachineLearningService,
    PredictiveAnalyticsService,
    AnomalyDetectionService,
    RecommendationEngineService,
    NaturalLanguageProcessingService,
    ComputerVisionService,
    AITrainingService,
    AIModelManagementService,
    AIPredictionService,
    AIInsightsService,
  ],
})
export class AIModule {}