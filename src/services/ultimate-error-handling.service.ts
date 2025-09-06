/**
 * 🛡️ Ultimate Error Handling Service
 * Professional error handling with comprehensive logging and recovery
 */

export interface ErrorContext {
  component: string
  action: string
  userId?: string
  sessionId: string
  timestamp: Date
  userAgent: string
  url: string
  stack?: string
  metadata?: Record<string, any>
}

export interface ErrorSeverity {
  level: 'low' | 'medium' | 'high' | 'critical'
  impact: 'cosmetic' | 'functional' | 'data_loss' | 'security' | 'system'
  recovery: 'automatic' | 'user_action' | 'admin_action' | 'developer_action'
}

export interface ErrorAction {
  type: 'retry' | 'fallback' | 'redirect' | 'notify' | 'log' | 'report'
  config: Record<string, any>
  priority: number
}

export interface ErrorRecovery {
  strategy: 'retry' | 'fallback' | 'graceful_degradation' | 'user_notification'
  maxAttempts: number
  backoffMs: number
  fallbackAction?: () => void
}

export class UltimateErrorHandlingService {
  private static instance: UltimateErrorHandlingService
  private errorQueue: Array<{ error: Error; context: ErrorContext; severity: ErrorSeverity }> = []
  private isProcessing = false
  private retryAttempts = new Map<string, number>()
  private maxRetries = 3
  private errorHistory: Array<{ error: Error; context: ErrorContext; timestamp: Date }> = []
  private maxHistorySize = 1000

  private constructor() {
    this.startErrorProcessing()
  }

  static getInstance(): UltimateErrorHandlingService {
    if (!UltimateErrorHandlingService.instance) {
      UltimateErrorHandlingService.instance = new UltimateErrorHandlingService()
    }
    return UltimateErrorHandlingService.instance
  }

  /**
   * 🚨 Handle error with comprehensive context
   */
  handleError(
    error: Error, 
    context: Partial<ErrorContext> = {},
    severity: Partial<ErrorSeverity> = {}
  ): void {
    const fullContext: ErrorContext = {
      component: 'unknown',
      action: 'unknown',
      sessionId: this.generateSessionId(),
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    }

    const fullSeverity: ErrorSeverity = {
      level: 'medium',
      impact: 'functional',
      recovery: 'user_action',
      ...severity
    }

    console.error('🚨 Error handled:', {
      error: error.message,
      context: fullContext,
      severity: fullSeverity
    })

    // Add to error queue
    this.errorQueue.push({ error, context: fullContext, severity: fullSeverity })

    // Add to history
    this.addToHistory(error, fullContext)

    // Process error
    this.processError(error, fullContext, fullSeverity)

    // Notify monitoring services
    this.notifyMonitoringServices(error, fullContext, fullSeverity)
  }

  /**
   * 🔄 Process error with recovery strategies
   */
  private async processError(
    error: Error, 
    context: ErrorContext, 
    severity: ErrorSeverity
  ): Promise<void> {
    try {
      // Determine recovery strategy
      const recovery = this.determineRecoveryStrategy(error, context, severity)
      
      // Execute recovery strategy
      await this.executeRecoveryStrategy(recovery, error, context)

      // Log error for analysis
      await this.logError(error, context, severity)

    } catch (processingError) {
      console.error('❌ Error processing failed:', processingError)
    }
  }

  /**
   * 🎯 Determine recovery strategy
   */
  private determineRecoveryStrategy(
    error: Error, 
    context: ErrorContext, 
    severity: ErrorSeverity
  ): ErrorRecovery {
    const errorKey = `${context.component}-${context.action}`
    const attempts = this.retryAttempts.get(errorKey) || 0

    // Critical errors - immediate user notification
    if (severity.level === 'critical') {
      return {
        strategy: 'user_notification',
        maxAttempts: 0,
        backoffMs: 0,
        fallbackAction: () => this.showCriticalErrorNotification(error, context)
      }
    }

    // High severity - retry with fallback
    if (severity.level === 'high' && attempts < this.maxRetries) {
      return {
        strategy: 'retry',
        maxAttempts: this.maxRetries,
        backoffMs: 1000 * Math.pow(2, attempts),
        fallbackAction: () => this.showErrorNotification(error, context)
      }
    }

    // Medium severity - graceful degradation
    if (severity.level === 'medium') {
      return {
        strategy: 'graceful_degradation',
        maxAttempts: 1,
        backoffMs: 500,
        fallbackAction: () => this.showWarningNotification(error, context)
      }
    }

    // Low severity - silent retry
    return {
      strategy: 'retry',
      maxAttempts: 2,
      backoffMs: 1000,
      fallbackAction: () => this.logSilently(error, context)
    }
  }

  /**
   * ⚡ Execute recovery strategy
   */
  private async executeRecoveryStrategy(
    recovery: ErrorRecovery, 
    error: Error, 
    context: ErrorContext
  ): Promise<void> {
    const errorKey = `${context.component}-${context.action}`

    try {
      switch (recovery.strategy) {
        case 'retry':
          if (recovery.maxAttempts > 0) {
            await this.retryWithBackoff(error, context, recovery)
          }
          break

        case 'fallback':
          if (recovery.fallbackAction) {
            recovery.fallbackAction()
          }
          break

        case 'graceful_degradation':
          await this.gracefulDegradation(error, context)
          break

        case 'user_notification':
          if (recovery.fallbackAction) {
            recovery.fallbackAction()
          }
          break

        default:
          this.logSilently(error, context)
      }
    } catch (recoveryError) {
      console.error('❌ Recovery strategy failed:', recoveryError)
      this.logSilently(error, context)
    }
  }

  /**
   * 🔄 Retry with exponential backoff
   */
  private async retryWithBackoff(
    error: Error, 
    context: ErrorContext, 
    recovery: ErrorRecovery
  ): Promise<void> {
    const errorKey = `${context.component}-${context.action}`
    const attempts = this.retryAttempts.get(errorKey) || 0

    if (attempts >= recovery.maxAttempts) {
      if (recovery.fallbackAction) {
        recovery.fallbackAction()
      }
      return
    }

    this.retryAttempts.set(errorKey, attempts + 1)

    setTimeout(async () => {
      try {
        // Attempt to retry the operation
        await this.retryOperation(error, context)
        this.retryAttempts.delete(errorKey)
      } catch (retryError) {
        await this.retryWithBackoff(error, context, recovery)
      }
    }, recovery.backoffMs)
  }

  /**
   * 🔄 Retry operation (to be implemented by specific services)
   */
  private async retryOperation(error: Error, context: ErrorContext): Promise<void> {
    // This would be implemented by specific services
    // For now, we'll just log the retry attempt
    console.log(`🔄 Retrying operation: ${context.component}.${context.action}`)
  }

  /**
   * 🎭 Graceful degradation
   */
  private async gracefulDegradation(error: Error, context: ErrorContext): Promise<void> {
    console.log(`🎭 Graceful degradation for: ${context.component}.${context.action}`)
    
    // Implement graceful degradation based on component
    switch (context.component) {
      case 'ProductList':
        this.showFallbackProductList()
        break
      case 'UserProfile':
        this.showFallbackUserProfile()
        break
      case 'CartPage':
        this.showFallbackCart()
        break
      default:
        this.showGenericFallback()
    }
  }

  /**
   * 📢 Show critical error notification
   */
  private showCriticalErrorNotification(error: Error, context: ErrorContext): void {
    // Create critical error notification
    const notification = document.createElement('div')
    notification.className = 'fixed top-0 left-0 right-0 bg-red-600 text-white p-4 z-50'
    notification.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-bold">Critical Error</h3>
          <p>Something went wrong. Please refresh the page or contact support.</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
          ✕
        </button>
      </div>
    `
    document.body.appendChild(notification)

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove()
      }
    }, 10000)
  }

  /**
   * ⚠️ Show error notification
   */
  private showErrorNotification(error: Error, context: ErrorContext): void {
    // Create error notification
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-orange-500 text-white p-4 rounded-lg shadow-lg z-50'
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">⚠️</span>
        <div>
          <p class="font-medium">Error occurred</p>
          <p class="text-sm">Please try again or contact support if the problem persists.</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
          ✕
        </button>
      </div>
    `
    document.body.appendChild(notification)

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove()
      }
    }, 5000)
  }

  /**
   * ⚠️ Show warning notification
   */
  private showWarningNotification(error: Error, context: ErrorContext): void {
    // Create warning notification
    const notification = document.createElement('div')
    notification.className = 'fixed bottom-4 right-4 bg-yellow-500 text-white p-3 rounded-lg shadow-lg z-50'
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">⚠️</span>
        <span class="text-sm">Some features may not work as expected.</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
          ✕
        </button>
      </div>
    `
    document.body.appendChild(notification)

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove()
      }
    }, 3000)
  }

  /**
   * 🔇 Log silently
   */
  private logSilently(error: Error, context: ErrorContext): void {
    console.log(`🔇 Silent error logged: ${context.component}.${context.action}`)
  }

  /**
   * 📊 Log error for analysis
   */
  private async logError(
    error: Error, 
    context: ErrorContext, 
    severity: ErrorSeverity
  ): Promise<void> {
    try {
      const errorData = {
        id: this.generateErrorId(),
        message: error.message,
        stack: error.stack,
        context,
        severity,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }

      // Send to logging service
      await this.sendToLoggingService(errorData)

    } catch (logError) {
      console.error('❌ Failed to log error:', logError)
    }
  }

  /**
   * 📡 Notify monitoring services
   */
  private async notifyMonitoringServices(
    error: Error, 
    context: ErrorContext, 
    severity: ErrorSeverity
  ): Promise<void> {
    try {
      // Send to Sentry, LogRocket, or similar
      if (severity.level === 'critical' || severity.level === 'high') {
        await this.sendToMonitoringService(error, context, severity)
      }
    } catch (notifyError) {
      console.error('❌ Failed to notify monitoring services:', notifyError)
    }
  }

  /**
   * 📤 Send to logging service
   */
  private async sendToLoggingService(errorData: any): Promise<void> {
    // Implementation would send to logging service
    console.log('📤 Error sent to logging service:', errorData)
  }

  /**
   * 📤 Send to monitoring service
   */
  private async sendToMonitoringService(
    error: Error, 
    context: ErrorContext, 
    severity: ErrorSeverity
  ): Promise<void> {
    // Implementation would send to monitoring service
    console.log('📤 Error sent to monitoring service:', { error, context, severity })
  }

  /**
   * 📚 Add to error history
   */
  private addToHistory(error: Error, context: ErrorContext): void {
    this.errorHistory.push({ error, context, timestamp: new Date() })
    
    // Keep only last 1000 errors
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize)
    }
  }

  /**
   * 🔄 Start error processing
   */
  private startErrorProcessing(): void {
    if (this.isProcessing) return

    this.isProcessing = true
    
    setInterval(() => {
      this.processErrorQueue()
    }, 1000)
  }

  /**
   * 🔄 Process error queue
   */
  private async processErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return

    const errors = [...this.errorQueue]
    this.errorQueue = []

    for (const { error, context, severity } of errors) {
      await this.processError(error, context, severity)
    }
  }

  /**
   * 🎭 Fallback implementations
   */
  private showFallbackProductList(): void {
    console.log('🎭 Showing fallback product list')
    // Implementation would show fallback UI
  }

  private showFallbackUserProfile(): void {
    console.log('🎭 Showing fallback user profile')
    // Implementation would show fallback UI
  }

  private showFallbackCart(): void {
    console.log('🎭 Showing fallback cart')
    // Implementation would show fallback UI
  }

  private showGenericFallback(): void {
    console.log('🎭 Showing generic fallback')
    // Implementation would show generic fallback UI
  }

  /**
   * 🆔 Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 🆔 Generate error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 📊 Get error statistics
   */
  getErrorStatistics(): Record<string, any> {
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const recentErrors = this.errorHistory.filter(
      entry => entry.timestamp > last24Hours
    )

    const severityCounts = recentErrors.reduce((acc, entry) => {
      const severity = this.determineSeverity(entry.error)
      acc[severity] = (acc[severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalErrors: this.errorHistory.length,
      recentErrors: recentErrors.length,
      severityCounts,
      queueSize: this.errorQueue.length,
      isProcessing: this.isProcessing
    }
  }

  /**
   * 🎯 Determine error severity
   */
  private determineSeverity(error: Error): string {
    if (error.message.includes('critical') || error.message.includes('fatal')) {
      return 'critical'
    }
    if (error.message.includes('error') || error.message.includes('failed')) {
      return 'high'
    }
    if (error.message.includes('warning') || error.message.includes('caution')) {
      return 'medium'
    }
    return 'low'
  }
}

// Export singleton instance
export const ultimateErrorHandlingService = UltimateErrorHandlingService.getInstance()