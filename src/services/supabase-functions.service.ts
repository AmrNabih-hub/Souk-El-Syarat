/**
 * ⚡ Supabase Edge Functions Service
 * Professional serverless functions service using Supabase Edge Functions
 * Documentation: https://supabase.com/docs/guides/functions
 */

import { supabase, supabaseConfig } from '@/config/supabase.config';
import type { FunctionsInvokeResponse, FunctionsResponseFailure } from '@supabase/supabase-js';

export interface FunctionResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerId: string;
  paymentMethod: string;
  metadata?: Record<string, any>;
}

export interface NotificationRequest {
  type: 'email' | 'sms' | 'push';
  recipient: string;
  subject?: string;
  message: string;
  template?: string;
  data?: Record<string, any>;
}

export interface ReportRequest {
  type: 'sales' | 'analytics' | 'inventory' | 'users';
  dateRange: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
  format?: 'json' | 'csv' | 'pdf';
}

export interface AISearchRequest {
  query: string;
  category?: string;
  filters?: Record<string, any>;
  limit?: number;
}

export interface ImageProcessingRequest {
  imageUrl: string;
  operations: {
    resize?: { width: number; height: number };
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
    watermark?: boolean;
  };
}

class SupabaseFunctionsService {
  /**
   * Generic function invocation
   */
  async invokeFunction<T = any>(
    functionName: keyof typeof supabaseConfig.functions,
    payload?: any,
    options?: {
      headers?: Record<string, string>;
      method?: 'POST' | 'GET' | 'PUT' | 'DELETE';
    }
  ): Promise<FunctionResponse<T>> {
    try {
      const funcName = supabaseConfig.functions[functionName];
      
      const response: FunctionsInvokeResponse<T> = await supabase.functions.invoke(funcName, {
        body: payload,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        method: options?.method || 'POST',
      });

      if (response.error) {
        console.error(`❌ Function ${funcName} error:`, response.error);
        return {
          data: null,
          error: response.error.message || 'Function execution failed',
          status: (response.error as FunctionsResponseFailure).status || 500,
        };
      }

      console.log(`✅ Function ${funcName} executed successfully`);
      return {
        data: response.data,
        error: null,
        status: 200,
      };
    } catch (error) {
      console.error(`❌ Function invocation error:`, error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }

  /**
   * Process payment
   */
  async processPayment(request: PaymentRequest): Promise<FunctionResponse<{
    paymentId: string;
    status: 'success' | 'failed' | 'pending';
    transactionId?: string;
    redirectUrl?: string;
  }>> {
    return this.invokeFunction('processPayment', request);
  }

  /**
   * Send notification
   */
  async sendNotification(request: NotificationRequest): Promise<FunctionResponse<{
    messageId: string;
    status: 'sent' | 'failed' | 'queued';
    details?: any;
  }>> {
    return this.invokeFunction('sendNotification', request);
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(requests: NotificationRequest[]): Promise<FunctionResponse<{
    successful: number;
    failed: number;
    results: Array<{ messageId?: string; error?: string }>;
  }>> {
    return this.invokeFunction('sendNotification', { 
      type: 'bulk',
      notifications: requests 
    });
  }

  /**
   * Generate report
   */
  async generateReport(request: ReportRequest): Promise<FunctionResponse<{
    reportId: string;
    downloadUrl?: string;
    data?: any;
    metadata: {
      recordCount: number;
      generatedAt: string;
      format: string;
    };
  }>> {
    return this.invokeFunction('generateReport', request);
  }

  /**
   * AI-powered search
   */
  async aiSearch(request: AISearchRequest): Promise<FunctionResponse<{
    results: Array<{
      id: string;
      title: string;
      description: string;
      category: string;
      score: number;
      metadata?: any;
    }>;
    query: string;
    totalResults: number;
    processingTime: number;
  }>> {
    return this.invokeFunction('aiSearch', request);
  }

  /**
   * Process and optimize images
   */
  async processImage(request: ImageProcessingRequest): Promise<FunctionResponse<{
    originalUrl: string;
    processedUrl: string;
    operations: any[];
    metadata: {
      originalSize: number;
      processedSize: number;
      compressionRatio: number;
    };
  }>> {
    return this.invokeFunction('imageProcessing', request);
  }

  /**
   * Send email with template
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    template: string,
    data?: Record<string, any>
  ): Promise<FunctionResponse<{ messageId: string }>> {
    return this.invokeFunction('emailService', {
      type: 'template',
      to: Array.isArray(to) ? to : [to],
      subject,
      template,
      data,
    });
  }

  /**
   * Send plain email
   */
  async sendPlainEmail(
    to: string | string[],
    subject: string,
    html: string,
    text?: string
  ): Promise<FunctionResponse<{ messageId: string }>> {
    return this.invokeFunction('emailService', {
      type: 'plain',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });
  }

  /**
   * Webhook handlers
   */
  async handlePaymentWebhook(payload: any): Promise<FunctionResponse<{ processed: boolean }>> {
    return this.invokeFunction('processPayment', {
      type: 'webhook',
      ...payload,
    });
  }

  /**
   * User analytics tracking
   */
  async trackAnalytics(
    userId: string,
    event: string,
    properties?: Record<string, any>
  ): Promise<FunctionResponse<{ tracked: boolean }>> {
    return this.invokeFunction('generateReport', {
      type: 'track',
      userId,
      event,
      properties,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Generate product recommendations
   */
  async getRecommendations(
    userId: string,
    options?: {
      category?: string;
      limit?: number;
      includeSimilar?: boolean;
    }
  ): Promise<FunctionResponse<{
    recommendations: Array<{
      productId: string;
      score: number;
      reason: string;
    }>;
  }>> {
    return this.invokeFunction('aiSearch', {
      type: 'recommendations',
      userId,
      ...options,
    });
  }

  /**
   * Validate vendor documents
   */
  async validateVendorDocuments(
    vendorId: string,
    documents: Array<{
      type: string;
      url: string;
      metadata?: any;
    }>
  ): Promise<FunctionResponse<{
    validationResults: Array<{
      documentId: string;
      isValid: boolean;
      confidence: number;
      issues?: string[];
    }>;
  }>> {
    return this.invokeFunction('imageProcessing', {
      type: 'document_validation',
      vendorId,
      documents,
    });
  }

  /**
   * Auto-categorize products
   */
  async categorizeProduct(
    title: string,
    description: string,
    images?: string[]
  ): Promise<FunctionResponse<{
    category: string;
    subcategory: string;
    confidence: number;
    suggestedTags: string[];
  }>> {
    return this.invokeFunction('aiSearch', {
      type: 'categorize',
      title,
      description,
      images,
    });
  }

  /**
   * Generate SEO data
   */
  async generateSEO(
    content: {
      title: string;
      description: string;
      category: string;
    }
  ): Promise<FunctionResponse<{
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    slug: string;
  }>> {
    return this.invokeFunction('aiSearch', {
      type: 'seo',
      ...content,
    });
  }

  /**
   * Detect fraud/spam
   */
  async detectFraud(
    data: {
      userId?: string;
      productId?: string;
      orderId?: string;
      content?: string;
      metadata?: any;
    }
  ): Promise<FunctionResponse<{
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    reasons: string[];
    recommendations: string[];
  }>> {
    return this.invokeFunction('aiSearch', {
      type: 'fraud_detection',
      ...data,
    });
  }

  /**
   * Inventory management
   */
  async updateInventory(
    productId: string,
    quantity: number,
    operation: 'add' | 'subtract' | 'set'
  ): Promise<FunctionResponse<{
    previousQuantity: number;
    newQuantity: number;
    lowStockAlert?: boolean;
  }>> {
    return this.invokeFunction('generateReport', {
      type: 'inventory_update',
      productId,
      quantity,
      operation,
    });
  }

  /**
   * Price optimization
   */
  async optimizePrice(
    productId: string,
    marketData?: {
      competitorPrices: number[];
      demandScore: number;
      seasonality: number;
    }
  ): Promise<FunctionResponse<{
    currentPrice: number;
    suggestedPrice: number;
    confidence: number;
    factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
  }>> {
    return this.invokeFunction('aiSearch', {
      type: 'price_optimization',
      productId,
      marketData,
    });
  }

  /**
   * Generate chat summary
   */
  async summarizeChat(
    chatId: string,
    messageCount?: number
  ): Promise<FunctionResponse<{
    summary: string;
    keyPoints: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    actionItems: string[];
  }>> {
    return this.invokeFunction('aiSearch', {
      type: 'chat_summary',
      chatId,
      messageCount,
    });
  }

  /**
   * Health check for functions
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const functions = Object.keys(supabaseConfig.functions) as Array<keyof typeof supabaseConfig.functions>;
    const results: Record<string, boolean> = {};

    await Promise.all(
      functions.map(async (funcName) => {
        try {
          const response = await this.invokeFunction(funcName, { type: 'health_check' });
          results[funcName] = response.error === null;
        } catch (error) {
          results[funcName] = false;
        }
      })
    );

    return results;
  }

  /**
   * Get function logs (requires admin privileges)
   */
  async getFunctionLogs(
    functionName: keyof typeof supabaseConfig.functions,
    options?: {
      limit?: number;
      since?: string;
      level?: 'error' | 'warn' | 'info' | 'debug';
    }
  ): Promise<FunctionResponse<Array<{
    timestamp: string;
    level: string;
    message: string;
    metadata?: any;
  }>>> {
    return this.invokeFunction(functionName, {
      type: 'get_logs',
      ...options,
    });
  }
}

// Export singleton instance
export const functionsService = new SupabaseFunctionsService();
export default functionsService;