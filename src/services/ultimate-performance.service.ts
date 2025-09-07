/**
 * ⚡ Ultimate Performance Service
 * Comprehensive performance optimization and monitoring
 */

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  threshold: number
  status: 'good' | 'warning' | 'critical'
}

export interface PerformanceConfig {
  enableMonitoring: boolean
  enableOptimization: boolean
  enableCaching: boolean
  enableLazyLoading: boolean
  enableCodeSplitting: boolean
  enableImageOptimization: boolean
  enableBundleOptimization: boolean
  enableMemoryOptimization: boolean
}

export interface BundleAnalysis {
  name: string
  size: number
  gzippedSize: number
  percentage: number
  type: 'core' | 'ui' | 'utility' | 'external'
  optimization: 'none' | 'basic' | 'advanced' | 'optimal'
}

export interface PerformanceReport {
  id: string
  timestamp: Date
  metrics: PerformanceMetric[]
  bundleAnalysis: BundleAnalysis[]
  recommendations: string[]
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

export class UltimatePerformanceService {
  private static instance: UltimatePerformanceService
  private config: PerformanceConfig
  private metrics: PerformanceMetric[] = []
  private bundleAnalysis: BundleAnalysis[] = []
  private isMonitoring = false
  private monitoringInterval: NodeJS.Timeout | null = null
  private performanceObserver: PerformanceObserver | null = null

  private constructor() {
    this.config = {
      enableMonitoring: true,
      enableOptimization: true,
      enableCaching: true,
      enableLazyLoading: true,
      enableCodeSplitting: true,
      enableImageOptimization: true,
      enableBundleOptimization: true,
      enableMemoryOptimization: true
    }
    
    this.initializePerformanceMonitoring()
  }

  static getInstance(): UltimatePerformanceService {
    if (!UltimatePerformanceService.instance) {
      UltimatePerformanceService.instance = new UltimatePerformanceService()
    }
    return UltimatePerformanceService.instance
  }

  /**
   * 🚀 Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if (!this.config.enableMonitoring) return

    console.log('⚡ Initializing performance monitoring...')

    // Monitor Core Web Vitals
    this.monitorCoreWebVitals()
    
    // Monitor resource loading
    this.monitorResourceLoading()
    
    // Monitor memory usage
    this.monitorMemoryUsage()
    
    // Monitor bundle size
    this.analyzeBundleSize()

    console.log('✅ Performance monitoring initialized')
  }

  /**
   * 📊 Monitor Core Web Vitals
   */
  private monitorCoreWebVitals(): void {
    // Monitor Largest Contentful Paint (LCP)
    this.observeLCP()
    
    // Monitor First Input Delay (FID)
    this.observeFID()
    
    // Monitor Cumulative Layout Shift (CLS)
    this.observeCLS()
    
    // Monitor First Contentful Paint (FCP)
    this.observeFCP()
  }

  /**
   * 🎯 Observe Largest Contentful Paint
   */
  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        
        const lcp = lastEntry.startTime
        this.recordMetric('LCP', lcp, 'ms', 2500, 'good')
      })

      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (error) {
      console.error('❌ Failed to observe LCP:', error)
    }
  }

  /**
   * 🎯 Observe First Input Delay
   */
  private observeFID(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          const fid = entry.processingStart - entry.startTime
          this.recordMetric('FID', fid, 'ms', 100, 'good')
        })
      })

      observer.observe({ entryTypes: ['first-input'] })
    } catch (error) {
      console.error('❌ Failed to observe FID:', error)
    }
  }

  /**
   * 🎯 Observe Cumulative Layout Shift
   */
  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        
        this.recordMetric('CLS', clsValue, 'score', 0.1, 'good')
      })

      observer.observe({ entryTypes: ['layout-shift'] })
    } catch (error) {
      console.error('❌ Failed to observe CLS:', error)
    }
  }

  /**
   * 🎯 Observe First Contentful Paint
   */
  private observeFCP(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fcp = entries[0].startTime
        this.recordMetric('FCP', fcp, 'ms', 1800, 'good')
      })

      observer.observe({ entryTypes: ['paint'] })
    } catch (error) {
      console.error('❌ Failed to observe FCP:', error)
    }
  }

  /**
   * 📊 Monitor resource loading
   */
  private monitorResourceLoading(): void {
    if (!this.config.enableMonitoring) return

    window.addEventListener('load', () => {
      // Monitor page load time
      const loadTime = performance.now()
      this.recordMetric('Page Load Time', loadTime, 'ms', 3000, 'good')

      // Monitor resource loading
      const resources = performance.getEntriesByType('resource')
      resources.forEach((resource) => {
        const loadTime = resource.responseEnd - resource.startTime
        this.recordMetric(`Resource: ${resource.name}`, loadTime, 'ms', 1000, 'good')
      })
    })
  }

  /**
   * 🧠 Monitor memory usage
   */
  private monitorMemoryUsage(): void {
    if (!this.config.enableMemoryOptimization) return

    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usedMB = memory.usedJSHeapSize / 1024 / 1024
        const totalMB = memory.totalJSHeapSize / 1024 / 1024
        
        this.recordMetric('Memory Used', usedMB, 'MB', 50, 'good')
        this.recordMetric('Memory Total', totalMB, 'MB', 100, 'good')
      }
    }, 5000)
  }

  /**
   * 📦 Analyze bundle size
   */
  private analyzeBundleSize(): void {
    if (!this.config.enableBundleOptimization) return

    // Simulate bundle analysis
    this.bundleAnalysis = [
      {
        name: 'react',
        size: 45,
        gzippedSize: 15,
        percentage: 18,
        type: 'core',
        optimization: 'optimal'
      },
      {
        name: 'react-dom',
        size: 130,
        gzippedSize: 42,
        percentage: 52,
        type: 'core',
        optimization: 'optimal'
      },
      {
        name: 'framer-motion',
        size: 450,
        gzippedSize: 120,
        percentage: 180,
        type: 'ui',
        optimization: 'basic'
      },
      {
        name: 'firebase',
        size: 380,
        gzippedSize: 95,
        percentage: 152,
        type: 'external',
        optimization: 'basic'
      },
      {
        name: 'lodash',
        size: 70,
        gzippedSize: 25,
        percentage: 28,
        type: 'utility',
        optimization: 'advanced'
      }
    ]
  }

  /**
   * 📊 Record performance metric
   */
  private recordMetric(
    name: string, 
    value: number, 
    unit: string, 
    threshold: number, 
    status: 'good' | 'warning' | 'critical'
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      threshold,
      status: value <= threshold ? 'good' : value <= threshold * 1.5 ? 'warning' : 'critical'
    }

    this.metrics.push(metric)

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Log critical metrics
    if (metric.status === 'critical') {
      console.warn(`⚠️ Critical performance metric: ${name} = ${value}${unit} (threshold: ${threshold}${unit})`)
    }
  }

  /**
   * ⚡ Optimize performance
   */
  async optimizePerformance(): Promise<void> {
    if (!this.config.enableOptimization) return

    console.log('⚡ Starting performance optimization...')

    try {
      // Optimize images
      if (this.config.enableImageOptimization) {
        await this.optimizeImages()
      }

      // Optimize bundle
      if (this.config.enableBundleOptimization) {
        await this.optimizeBundle()
      }

      // Optimize memory
      if (this.config.enableMemoryOptimization) {
        await this.optimizeMemory()
      }

      // Enable caching
      if (this.config.enableCaching) {
        await this.enableCaching()
      }

      console.log('✅ Performance optimization completed')
    } catch (error) {
      console.error('❌ Performance optimization failed:', error)
    }
  }

  /**
   * 🖼️ Optimize images
   */
  private async optimizeImages(): Promise<void> {
    console.log('🖼️ Optimizing images...')

    const images = document.querySelectorAll('img')
    images.forEach((img) => {
      // Add loading="lazy" if not present
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy')
      }

      // Add decoding="async" if not present
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async')
      }

      // Optimize srcset if present
      if (img.hasAttribute('srcset')) {
        this.optimizeSrcset(img)
      }
    })
  }

  /**
   * 🖼️ Optimize srcset
   */
  private optimizeSrcset(img: HTMLImageElement): void {
    const srcset = img.getAttribute('srcset')
    if (!srcset) return

    // Parse and optimize srcset
    const sources = srcset.split(',').map(source => {
      const [url, descriptor] = source.trim().split(' ')
      return { url, descriptor }
    })

    // Sort by descriptor size
    sources.sort((a, b) => {
      const sizeA = parseInt(a.descriptor) || 0
      const sizeB = parseInt(b.descriptor) || 0
      return sizeA - sizeB
    })

    // Update srcset
    img.setAttribute('srcset', sources.map(s => `${s.url} ${s.descriptor}`).join(', '))
  }

  /**
   * 📦 Optimize bundle
   */
  private async optimizeBundle(): Promise<void> {
    console.log('📦 Optimizing bundle...')

    // Analyze current bundle
    const analysis = this.analyzeCurrentBundle()
    
    // Generate optimization recommendations
    const recommendations = this.generateBundleRecommendations(analysis)
    
    console.log('📦 Bundle optimization recommendations:', recommendations)
  }

  /**
   * 📦 Analyze current bundle
   */
  private analyzeCurrentBundle(): BundleAnalysis[] {
    // This would analyze the actual bundle in a real implementation
    return this.bundleAnalysis
  }

  /**
   * 💡 Generate bundle recommendations
   */
  private generateBundleRecommendations(analysis: BundleAnalysis[]): string[] {
    const recommendations: string[] = []

    analysis.forEach((bundle) => {
      if (bundle.optimization === 'none' || bundle.optimization === 'basic') {
        recommendations.push(`Optimize ${bundle.name}: ${bundle.size}KB -> target: ${bundle.size * 0.7}KB`)
      }
      
      if (bundle.percentage > 100) {
        recommendations.push(`Consider code splitting for ${bundle.name} (${bundle.percentage}% of bundle)`)
      }
    })

    return recommendations
  }

  /**
   * 🧠 Optimize memory
   */
  private async optimizeMemory(): Promise<void> {
    console.log('🧠 Optimizing memory...')

    // Clear unused caches
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName)
        const keys = await cache.keys()
        
        // Remove old entries
        const now = Date.now()
        for (const request of keys) {
          const response = await cache.match(request)
          if (response) {
            const date = response.headers.get('date')
            if (date) {
              const age = now - new Date(date).getTime()
              if (age > 24 * 60 * 60 * 1000) { // 24 hours
                await cache.delete(request)
              }
            }
          }
        }
      }
    }

    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc()
    }
  }

  /**
   * 💾 Enable caching
   */
  private async enableCaching(): Promise<void> {
    console.log('💾 Enabling caching...')

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('✅ Service Worker registered:', registration)
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error)
      }
    }
  }

  /**
   * 📊 Generate performance report
   */
  generatePerformanceReport(): PerformanceReport {
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const recentMetrics = this.metrics.filter(metric => metric.timestamp > last24Hours)
    
    // Calculate performance score
    const score = this.calculatePerformanceScore(recentMetrics)
    const grade = this.getPerformanceGrade(score)
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(recentMetrics)

    return {
      id: `report_${Date.now()}`,
      timestamp: now,
      metrics: recentMetrics,
      bundleAnalysis: this.bundleAnalysis,
      recommendations,
      score,
      grade
    }
  }

  /**
   * 📊 Calculate performance score
   */
  private calculatePerformanceScore(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0

    let score = 100
    
    metrics.forEach(metric => {
      if (metric.status === 'critical') {
        score -= 20
      } else if (metric.status === 'warning') {
        score -= 10
      }
    })

    return Math.max(0, score)
  }

  /**
   * 🎯 Get performance grade
   */
  private getPerformanceGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  /**
   * 💡 Generate recommendations
   */
  private generateRecommendations(metrics: PerformanceMetric[]): string[] {
    const recommendations: string[] = []

    const criticalMetrics = metrics.filter(m => m.status === 'critical')
    const warningMetrics = metrics.filter(m => m.status === 'warning')

    if (criticalMetrics.length > 0) {
      recommendations.push(`Fix ${criticalMetrics.length} critical performance issues`)
    }

    if (warningMetrics.length > 0) {
      recommendations.push(`Address ${warningMetrics.length} performance warnings`)
    }

    // Bundle optimization recommendations
    const largeBundles = this.bundleAnalysis.filter(b => b.percentage > 100)
    if (largeBundles.length > 0) {
      recommendations.push(`Optimize ${largeBundles.length} large bundles`)
    }

    // Memory optimization recommendations
    const memoryMetrics = metrics.filter(m => m.name.includes('Memory'))
    const highMemory = memoryMetrics.filter(m => m.status === 'critical' || m.status === 'warning')
    if (highMemory.length > 0) {
      recommendations.push('Optimize memory usage')
    }

    return recommendations
  }

  /**
   * 📊 Get performance statistics
   */
  getPerformanceStatistics(): Record<string, any> {
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const recentMetrics = this.metrics.filter(metric => metric.timestamp > last24Hours)
    
    const statusCounts = recentMetrics.reduce((acc, metric) => {
      acc[metric.status] = (acc[metric.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalBundleSize = this.bundleAnalysis.reduce((sum, bundle) => sum + bundle.size, 0)
    const totalGzippedSize = this.bundleAnalysis.reduce((sum, bundle) => sum + bundle.gzippedSize, 0)

    return {
      totalMetrics: this.metrics.length,
      recentMetrics: recentMetrics.length,
      statusCounts,
      totalBundleSize,
      totalGzippedSize,
      bundleCount: this.bundleAnalysis.length,
      isMonitoring: this.isMonitoring
    }
  }

  /**
   * 🔧 Update performance configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('🔧 Performance configuration updated')
  }
}

// Export singleton instance
export const ultimatePerformanceService = UltimatePerformanceService.getInstance()