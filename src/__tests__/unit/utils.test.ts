/**
 * Utility Functions Unit Tests
 * Tests helper functions and utilities
 */

import { describe, it, expect } from 'vitest';

describe('Utility Functions', () => {
  describe('String Utils', () => {
    it('should truncate long strings', () => {
      const truncate = (str: string, maxLength: number) => {
        return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
      };

      expect(truncate('Short', 10)).toBe('Short');
      expect(truncate('This is a very long string', 10)).toBe('This is a ...');
    });

    it('should capitalize first letter', () => {
      const capitalize = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
      };

      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('test')).toBe('Test');
    });

    it('should convert to slug', () => {
      const toSlug = (str: string) => {
        return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      };

      expect(toSlug('Hello World')).toBe('hello-world');
      expect(toSlug('Test Product 123')).toBe('test-product-123');
    });
  });

  describe('Number Utils', () => {
    it('should format large numbers', () => {
      const formatNumber = (num: number) => {
        return num.toLocaleString('en-US');
      };

      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should calculate percentage', () => {
      const calculatePercentage = (value: number, total: number) => {
        return total > 0 ? (value / total) * 100 : 0;
      };

      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(50, 200)).toBe(25);
      expect(calculatePercentage(10, 0)).toBe(0);
    });

    it('should round to decimals', () => {
      const roundTo = (num: number, decimals: number) => {
        return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
      };

      expect(roundTo(3.14159, 2)).toBe(3.14);
      expect(roundTo(2.5555, 1)).toBe(2.6);
    });
  });

  describe('Array Utils', () => {
    it('should remove duplicates', () => {
      const removeDuplicates = <T,>(arr: T[]) => {
        return [...new Set(arr)];
      };

      expect(removeDuplicates([1, 2, 2, 3, 3, 4])).toEqual([1, 2, 3, 4]);
      expect(removeDuplicates(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should chunk array', () => {
      const chunk = <T,>(arr: T[], size: number) => {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
          chunks.push(arr.slice(i, i + size));
        }
        return chunks;
      };

      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunk(['a', 'b', 'c'], 2)).toEqual([['a', 'b'], ['c']]);
    });

    it('should shuffle array', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = [...arr].sort(() => Math.random() - 0.5);
      
      // Should have same length
      expect(shuffled.length).toBe(arr.length);
      // Should have same elements
      expect(shuffled.sort()).toEqual(arr.sort());
    });
  });

  describe('Object Utils', () => {
    it('should deep clone object', () => {
      const deepClone = <T,>(obj: T): T => {
        return JSON.parse(JSON.stringify(obj));
      };

      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original); // Different reference
    });

    it('should merge objects', () => {
      const merge = <T extends object>(target: T, source: Partial<T>): T => {
        return { ...target, ...source };
      };

      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      
      const merged = merge(obj1, obj2 as any);
      expect(merged.b).toBe(3); // Source overwrites
    });

    it('should pick properties', () => {
      const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
        const result = {} as Pick<T, K>;
        keys.forEach(key => {
          result[key] = obj[key];
        });
        return result;
      };

      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const picked = pick(obj, ['a', 'c']);
      
      expect(picked).toEqual({ a: 1, c: 3 });
      expect(picked).not.toHaveProperty('b');
    });
  });

  describe('Validation Utils', () => {
    it('should validate URL format', () => {
      const isValidUrl = (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://test.com/path')).toBe(true);
      expect(isValidUrl('invalid-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(true);
    });

    it('should validate hex color codes', () => {
      const isValidHexColor = (color: string) => {
        return /^#[0-9A-F]{6}$/i.test(color);
      };

      expect(isValidHexColor('#f59e0b')).toBe(true);
      expect(isValidHexColor('#FFFFFF')).toBe(true);
      expect(isValidHexColor('#fff')).toBe(false); // Wrong length
      expect(isValidHexColor('f59e0b')).toBe(false); // Missing #
    });
  });

  describe('Formatting Utils', () => {
    it('should format file size', () => {
      const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
      };

      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format phone number for display', () => {
      const formatPhone = (phone: string) => {
        // Egyptian format: 0101 234 5678
        if (phone.length === 11 && phone.startsWith('0')) {
          return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
        }
        return phone;
      };

      expect(formatPhone('01012345678')).toBe('0101 234 5678');
      expect(formatPhone('123')).toBe('123');
    });
  });

  describe('Error Handling Utils', () => {
    it('should extract error message', () => {
      const getErrorMessage = (error: unknown): string => {
        if (error instanceof Error) return error.message;
        if (typeof error === 'string') return error;
        return 'Unknown error occurred';
      };

      expect(getErrorMessage(new Error('Test error'))).toBe('Test error');
      expect(getErrorMessage('String error')).toBe('String error');
      expect(getErrorMessage(null)).toBe('Unknown error occurred');
    });

    it('should retry failed operations', async () => {
      const retry = async <T,>(
        fn: () => Promise<T>,
        maxAttempts: number = 3
      ): Promise<T> => {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            return await fn();
          } catch (error) {
            if (attempt === maxAttempts) throw error;
          }
        }
        throw new Error('Max attempts reached');
      };

      let attempts = 0;
      const flaky = async () => {
        attempts++;
        if (attempts < 2) throw new Error('Fail');
        return 'success';
      };

      const result = await retry(flaky, 3);
      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });
  });

  describe('Cache Utils', () => {
    it('should cache function results', () => {
      const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
        const cache = new Map();
        return ((...args: any[]) => {
          const key = JSON.stringify(args);
          if (cache.has(key)) return cache.get(key);
          const result = fn(...args);
          cache.set(key, result);
          return result;
        }) as T;
      };

      let callCount = 0;
      const expensiveFunction = (n: number) => {
        callCount++;
        return n * 2;
      };

      const memoized = memoize(expensiveFunction);
      
      expect(memoized(5)).toBe(10);
      expect(memoized(5)).toBe(10); // Cached
      expect(callCount).toBe(1); // Only called once
    });
  });
});
