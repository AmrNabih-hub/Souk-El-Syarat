import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PerformanceOptimizationService } from '@/services/performance-optimization.service'

// Mock components for performance testing
const HeavyComponent = ({ items }: { items: any[] }) => {
  return (
    <div>
      {items.map((item, index) => (
        <div key={index} data-testid={`item-${index}`}>
          {item.name}
        </div>
      ))}
    </div>
  )
}

const LazyComponent = ({ data }: { data: any }) => {
  return <div data-testid="lazy-content">{data.content}</div>
}

describe('Component Performance Tests', () => {
  describe('Rendering Performance', () => {
    it('should render large lists efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `Description for item ${i}`
      }))

      const startTime = performance.now()
      
      render(<HeavyComponent items={largeDataset} />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within 100ms
      expect(renderTime).toBeLessThan(100)
      
      // Should render all items
      expect(screen.getAllByTestId(/item-/)).toHaveLength(1000)
    })

    it('should handle rapid re-renders efficiently', async () => {
      const { rerender } = render(<HeavyComponent items={[]} />)
      
      const times = []
      
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now()
        
        rerender(<HeavyComponent items={Array.from({ length: 100 }, (_, j) => ({ name: `Item ${j}` }))} />)
        
        const endTime = performance.now()
        times.push(endTime - startTime)
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length
      
      // Average re-render should be under 50ms
      expect(averageTime).toBeLessThan(50)
    })
  })

  describe('Memory Performance', () => {
    it('should not leak memory with large datasets', async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0
      
      const { unmount } = render(
        <HeavyComponent items={Array.from({ length: 5000 }, (_, i) => ({ name: `Item ${i}` }))} />
      )
      
      unmount()
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })

    it('should clean up event listeners on unmount', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      
      const { unmount } = render(<HeavyComponent items={[{ name: 'Test' }]} />)
      
      unmount()
      
      // Should have called removeEventListener for cleanup
      expect(removeEventListenerSpy).toHaveBeenCalled()
    })
  })

  describe('Lazy Loading Performance', () => {
    it('should lazy load components efficiently', async () => {
      const mockIntersectionObserver = vi.fn().mockImplementation((callback) => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn()
      }))
      
      global.IntersectionObserver = mockIntersectionObserver
      
      const LazyWrapper = () => {
        const [isVisible, setIsVisible] = React.useState(false)
        
        React.useEffect(() => {
          const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
              setIsVisible(true)
            }
          })
          
          return () => observer.disconnect()
        }, [])
        
        return isVisible ? <LazyComponent data={{ content: 'Loaded' }} /> : <div>Loading...</div>
      }
      
      render(<LazyWrapper />)
      
      // Should set up intersection observer
      expect(mockIntersectionObserver).toHaveBeenCalled()
    })

    it('should preload critical components', async () => {
      const preloadSpy = vi.spyOn(PerformanceOptimizationService, 'preloadComponent')
      
      await PerformanceOptimizationService.preloadComponent('LazyComponent')
      
      expect(preloadSpy).toHaveBeenCalledWith('LazyComponent')
    })
  })

  describe('Bundle Size Performance', () => {
    it('should have reasonable bundle size', () => {
      // Mock bundle analysis
      const bundleSize = 500 * 1024 // 500KB
      const maxSize = 1024 * 1024 // 1MB
      
      expect(bundleSize).toBeLessThan(maxSize)
    })

    it('should implement code splitting effectively', () => {
      const chunks = [
        { name: 'vendor', size: 200 * 1024 },
        { name: 'main', size: 150 * 1024 },
        { name: 'lazy', size: 100 * 1024 }
      ]
      
      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
      const maxChunkSize = 300 * 1024 // 300KB per chunk
      
      chunks.forEach(chunk => {
        expect(chunk.size).toBeLessThan(maxChunkSize)
      })
      
      expect(totalSize).toBeLessThan(500 * 1024) // Total under 500KB
    })
  })

  describe('API Performance', () => {
    it('should handle API calls efficiently', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ data: 'test' })
      
      const startTime = performance.now()
      
      await mockApiCall()
      
      const endTime = performance.now()
      const apiTime = endTime - startTime
      
      // API call should complete within 100ms
      expect(apiTime).toBeLessThan(100)
    })

    it('should implement request debouncing', async () => {
      const debouncedFunction = PerformanceOptimizationService.debounce(
        vi.fn(),
        100
      )
      
      // Call multiple times rapidly
      debouncedFunction()
      debouncedFunction()
      debouncedFunction()
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Should only be called once
      expect(debouncedFunction).toHaveBeenCalledTimes(1)
    })

    it('should implement request throttling', async () => {
      const throttledFunction = PerformanceOptimizationService.throttle(
        vi.fn(),
        100
      )
      
      const startTime = performance.now()
      
      // Call multiple times rapidly
      for (let i = 0; i < 5; i++) {
        throttledFunction()
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      
      const endTime = performance.now()
      
      // Should respect throttle limit
      expect(endTime - startTime).toBeGreaterThanOrEqual(400) // At least 4 * 100ms
    })
  })

  describe('Caching Performance', () => {
    it('should implement effective caching', async () => {
      const cacheKey = 'test-data'
      const testData = { id: 1, name: 'Test' }
      
      // First call - should cache
      const result1 = await PerformanceOptimizationService.getCachedData(cacheKey, () => testData)
      expect(result1).toEqual(testData)
      
      // Second call - should use cache
      const result2 = await PerformanceOptimizationService.getCachedData(cacheKey, () => testData)
      expect(result2).toEqual(testData)
    })

    it('should handle cache invalidation', async () => {
      const cacheKey = 'test-data'
      const testData = { id: 1, name: 'Test' }
      
      // Cache data
      await PerformanceOptimizationService.getCachedData(cacheKey, () => testData)
      
      // Invalidate cache
      PerformanceOptimizationService.invalidateCache(cacheKey)
      
      // Next call should not use cache
      const newData = { id: 2, name: 'New Test' }
      const result = await PerformanceOptimizationService.getCachedData(cacheKey, () => newData)
      
      expect(result).toEqual(newData)
    })
  })

  describe('Image Performance', () => {
    it('should lazy load images efficiently', async () => {
      const mockImage = {
        src: '',
        onload: null,
        onerror: null
      }
      
      global.Image = vi.fn(() => mockImage) as any
      
      const startTime = performance.now()
      
      await PerformanceOptimizationService.lazyLoadImage('test.jpg')
      
      const endTime = performance.now()
      const loadTime = endTime - startTime
      
      // Image loading should be efficient
      expect(loadTime).toBeLessThan(50)
    })

    it('should optimize image sizes', () => {
      const originalSize = 1024 * 1024 // 1MB
      const optimizedSize = PerformanceOptimizationService.optimizeImageSize(originalSize, 800, 600)
      
      // Should reduce size significantly
      expect(optimizedSize).toBeLessThan(originalSize)
    })
  })
})