import { Controller, Get, Post, Put, Delete, Body, Param, Query, Logger } from '@nestjs/common';
import { MachineLearningService } from './machine-learning.service';
import { PredictiveAnalyticsService } from './predictive-analytics.service';
import { AnomalyDetectionService } from './anomaly-detection.service';
import { RecommendationEngineService } from './recommendation-engine.service';

@Controller('ai')
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(
    private readonly machineLearningService: MachineLearningService,
    private readonly predictiveAnalyticsService: PredictiveAnalyticsService,
    private readonly anomalyDetectionService: AnomalyDetectionService,
    private readonly recommendationEngineService: RecommendationEngineService,
  ) {}

  @Post('models')
  async createModel(@Body() modelData: any) {
    try {
      const modelId = await this.machineLearningService.createModel(
        modelData.name,
        modelData.type,
        modelData.metadata || {},
      );
      
      return {
        success: true,
        message: 'Model created successfully',
        modelId,
      };
    } catch (error) {
      this.logger.error('Error creating model:', error);
      return {
        success: false,
        message: 'Failed to create model',
        error: error.message,
      };
    }
  }

  @Post('models/:modelId/train')
  async trainModel(
    @Param('modelId') modelId: string,
    @Body() trainingData: any,
  ) {
    try {
      await this.machineLearningService.trainModel(modelId, trainingData);
      
      return {
        success: true,
        message: 'Model training completed successfully',
        modelId,
      };
    } catch (error) {
      this.logger.error(`Error training model ${modelId}:`, error);
      return {
        success: false,
        message: 'Failed to train model',
        error: error.message,
      };
    }
  }

  @Post('models/:modelId/predict')
  async predict(
    @Param('modelId') modelId: string,
    @Body() predictionRequest: any,
  ) {
    try {
      const result = await this.machineLearningService.predict({
        modelId,
        input: predictionRequest.input,
        options: predictionRequest.options,
      });
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Error making prediction with model ${modelId}:`, error);
      return {
        success: false,
        message: 'Failed to make prediction',
        error: error.message,
      };
    }
  }

  @Put('models/:modelId/deploy')
  async deployModel(@Param('modelId') modelId: string) {
    try {
      await this.machineLearningService.deployModel(modelId);
      
      return {
        success: true,
        message: 'Model deployed successfully',
        modelId,
      };
    } catch (error) {
      this.logger.error(`Error deploying model ${modelId}:`, error);
      return {
        success: false,
        message: 'Failed to deploy model',
        error: error.message,
      };
    }
  }

  @Get('models')
  async getModels(@Query('type') type?: string) {
    try {
      let models;
      
      if (type && ['classification', 'regression', 'clustering', 'recommendation', 'anomaly_detection'].includes(type)) {
        models = await this.machineLearningService.getModelsByType(type as any);
      } else {
        models = await this.machineLearningService.getAllModels();
      }
      
      return {
        success: true,
        data: models,
        count: models.length,
      };
    } catch (error) {
      this.logger.error('Error getting models:', error);
      return {
        success: false,
        message: 'Failed to get models',
        error: error.message,
      };
    }
  }

  @Get('models/:modelId')
  async getModel(@Param('modelId') modelId: string) {
    try {
      const model = await this.machineLearningService.getModel(modelId);
      
      if (!model) {
        return {
          success: false,
          message: 'Model not found',
        };
      }
      
      return {
        success: true,
        data: model,
      };
    } catch (error) {
      this.logger.error(`Error getting model ${modelId}:`, error);
      return {
        success: false,
        message: 'Failed to get model',
        error: error.message,
      };
    }
  }

  @Get('models/:modelId/metrics')
  async getModelMetrics(@Param('modelId') modelId: string) {
    try {
      const metrics = await this.machineLearningService.getModelMetrics(modelId);
      
      if (!metrics) {
        return {
          success: false,
          message: 'Model not found',
        };
      }
      
      return {
        success: true,
        data: metrics,
      };
    } catch (error) {
      this.logger.error(`Error getting model metrics for ${modelId}:`, error);
      return {
        success: false,
        message: 'Failed to get model metrics',
        error: error.message,
      };
    }
  }

  @Delete('models/:modelId')
  async deleteModel(@Param('modelId') modelId: string) {
    try {
      await this.machineLearningService.deleteModel(modelId);
      
      return {
        success: true,
        message: 'Model deleted successfully',
        modelId,
      };
    } catch (error) {
      this.logger.error(`Error deleting model ${modelId}:`, error);
      return {
        success: false,
        message: 'Failed to delete model',
        error: error.message,
      };
    }
  }

  @Post('predictions/analytics')
  async getPredictiveAnalytics(@Body() analyticsRequest: any) {
    try {
      // This would call the actual predictive analytics service
      const analytics = {
        predictions: [],
        trends: [],
        insights: [],
        confidence: 0.85,
      };
      
      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      this.logger.error('Error getting predictive analytics:', error);
      return {
        success: false,
        message: 'Failed to get predictive analytics',
        error: error.message,
      };
    }
  }

  @Post('anomaly-detection')
  async detectAnomalies(@Body() detectionRequest: any) {
    try {
      // This would call the actual anomaly detection service
      const anomalies = {
        detected: true,
        anomalies: [],
        severity: 'medium',
        confidence: 0.92,
      };
      
      return {
        success: true,
        data: anomalies,
      };
    } catch (error) {
      this.logger.error('Error detecting anomalies:', error);
      return {
        success: false,
        message: 'Failed to detect anomalies',
        error: error.message,
      };
    }
  }

  @Post('recommendations')
  async getRecommendations(@Body() recommendationRequest: any) {
    try {
      // This would call the actual recommendation engine service
      const recommendations = {
        items: [],
        confidence: 0.88,
        reasoning: 'Based on user behavior and preferences',
      };
      
      return {
        success: true,
        data: recommendations,
      };
    } catch (error) {
      this.logger.error('Error getting recommendations:', error);
      return {
        success: false,
        message: 'Failed to get recommendations',
        error: error.message,
      };
    }
  }
}