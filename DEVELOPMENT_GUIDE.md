# 🚀 Souk El-Syarat - Professional Development Guide

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Code Standards](#code-standards)
4. [Component Development](#component-development)
5. [State Management](#state-management)
6. [Error Handling](#error-handling)
7. [Testing Guidelines](#testing-guidelines)
8. [Security Best Practices](#security-best-practices)
9. [Performance Guidelines](#performance-guidelines)
10. [Deployment Process](#deployment-process)

## 🏗️ Architecture Overview

### **Clean Architecture Layers**

```
┌─────────────────────────────────────────────────┐
│                Presentation Layer                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ Components  │ │   Pages     │ │   Hooks     │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│               Application Layer                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │   Stores    │ │  Services   │ │    API      │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│              Infrastructure Layer                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │   Config    │ │  Security   │ │ Monitoring  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────┘
```

### **Key Principles**

- **Separation of Concerns**: Each layer has a single responsibility
- **Dependency Inversion**: Higher layers depend on abstractions
- **Error Boundaries**: Comprehensive error handling at every level
- **Type Safety**: Full TypeScript coverage with strict mode
- **Performance First**: Optimized for speed and memory usage

## 🛠️ Development Setup

### **Prerequisites**

```bash
# Node.js 18+ (LTS recommended)
node --version  # Should be 18.x or higher

# npm 9+
npm --version   # Should be 9.x or higher

# Git
git --version
```

### **Installation**

```bash
# Clone the repository
git clone https://github.com/your-org/souk-el-syarat.git
cd souk-el-syarat

# Install dependencies
npm ci

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### **Development Scripts**

```bash
# Development
npm run dev                 # Start development server
npm run dev:https          # Start with HTTPS (for PWA testing)

# Building
npm run build              # Production build
npm run build:analyze      # Build with bundle analysis
npm run preview           # Preview production build

# Code Quality
npm run lint              # Run ESLint
npm run lint:fix          # Fix ESLint issues
npm run format            # Format code with Prettier
npm run type-check        # TypeScript type checking

# Testing
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e          # End-to-end tests
npm run test:coverage     # Generate coverage report

# Database
npm run db:migrate        # Run database migrations
npm run db:seed           # Seed database with test data
npm run db:reset          # Reset database
```

## 📏 Code Standards

### **File Naming Conventions**

```
components/
├── ui/
│   ├── Button/
│   │   ├── Button.tsx          # PascalCase for components
│   │   ├── Button.test.tsx     # Test files
│   │   ├── Button.stories.tsx  # Storybook stories
│   │   └── index.ts            # Barrel exports
├── forms/
│   └── LoginForm.tsx
└── layout/
    └── Navbar.tsx

utils/
├── formatters.ts              # camelCase for utilities
├── validators.ts
└── helpers/
    ├── dateHelpers.ts
    └── stringHelpers.ts

types/
├── index.ts                   # Main type exports
├── api.types.ts              # API-specific types
└── component.types.ts        # Component prop types
```

### **Import Organization**

```typescript
// 1. React and external libraries
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

// 2. Internal utilities and types
import { ErrorHandler } from '@/lib/errors';
import { formatCurrency } from '@/utils/formatters';
import type { Product, User } from '@/types';

// 3. Components (from general to specific)
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/product/ProductCard';

// 4. Hooks and stores
import { useAuthStore } from '@/stores/authStore';
import { useProducts } from '@/hooks/useProducts';

// 5. Relative imports last
import './ComponentName.css';
```

### **TypeScript Guidelines**

```typescript
// ✅ Good: Explicit types for props
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  onClick: (event: MouseEvent) => void;
  children: ReactNode;
}

// ✅ Good: Generic constraints
interface ApiResponse<T extends Record<string, any>> {
  data: T;
  status: number;
  message: string;
}

// ✅ Good: Utility types
type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

// ❌ Bad: Any types
const handleSubmit = (data: any) => { /* ... */ };

// ✅ Good: Proper typing
const handleSubmit = (data: FormData) => { /* ... */ };
```

## 🧩 Component Development

### **Component Structure**

```typescript
/**
 * Professional Component Template
 * Description of what this component does
 */

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { ErrorHandler } from '@/lib/errors';

// Types
export interface ComponentProps {
  // Props definition
}

// Component implementation
export const Component = forwardRef<HTMLElement, ComponentProps>(
  ({ prop1, prop2, ...props }, ref) => {
    // Error boundary wrapper
    try {
      // Component logic
      
      return (
        <motion.div
          ref={ref}
          className={clsx(/* classes */)}
          {...props}
        >
          {/* JSX */}
        </motion.div>
      );
    } catch (error) {
      ErrorHandler.handle(error as Error, { component: 'ComponentName' });
      
      // Fallback UI
      return (
        <div className="error-fallback">
          Component failed to render
        </div>
      );
    }
  }
);

Component.displayName = 'Component';
export default Component;
```

### **Component Guidelines**

1. **Single Responsibility**: Each component should have one clear purpose
2. **Composition over Inheritance**: Use composition patterns
3. **Error Boundaries**: Wrap components in error boundaries
4. **Accessibility**: Include ARIA labels and keyboard navigation
5. **Performance**: Use React.memo for expensive components
6. **Testing**: Include comprehensive test coverage

### **Error Boundary Pattern**

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

const SafeComponent = () => (
  <ErrorBoundary
    fallback={<div>Something went wrong</div>}
    onError={(error, errorInfo) => {
      ErrorHandler.handle(error, { errorInfo });
    }}
  >
    <YourComponent />
  </ErrorBoundary>
);
```

## 🏪 State Management

### **Store Creation**

```typescript
import { createStore, StoreWithBase } from '@/lib/store/createStore';

interface MyStoreState {
  items: Item[];
  selectedItem: Item | null;
}

interface MyStoreActions {
  addItem: (item: Item) => void;
  selectItem: (id: string) => void;
  loadItems: () => Promise<void>;
}

const useMyStore = createStore<MyStoreState & MyStoreActions>(
  (set, get) => ({
    // Initial state
    items: [],
    selectedItem: null,

    // Actions
    addItem: (item) => {
      set((state) => {
        state.items.push(item);
      });
    },

    selectItem: (id) => {
      set((state) => {
        state.selectedItem = state.items.find(item => item.id === id) || null;
      });
    },

    loadItems: async () => {
      try {
        set((state) => state.setLoading(true));
        const items = await api.getItems();
        set((state) => {
          state.items = items;
          state.setLoading(false);
        });
      } catch (error) {
        set((state) => {
          state.setError(error.message);
          state.setLoading(false);
        });
      }
    },
  }),
  {
    name: 'my-store',
    persist: true,
    enableDevtools: true,
  }
);
```

### **Store Usage**

```typescript
const MyComponent = () => {
  const { 
    items, 
    selectedItem, 
    addItem, 
    selectItem,
    _isLoading,
    _error 
  } = useMyStore();

  // Subscribe to specific state changes
  const itemCount = useMyStore(state => state.items.length);

  if (_isLoading) return <LoadingSpinner />;
  if (_error) return <ErrorMessage message={_error} />;

  return (
    <div>
      {items.map(item => (
        <ItemCard 
          key={item.id}
          item={item}
          isSelected={selectedItem?.id === item.id}
          onSelect={() => selectItem(item.id)}
        />
      ))}
    </div>
  );
};
```

## ⚠️ Error Handling

### **Error Types**

```typescript
import { 
  NetworkError, 
  ValidationError, 
  AuthenticationError,
  BusinessLogicError 
} from '@/lib/errors';

// Network errors
throw new NetworkError(
  'FETCH_FAILED',
  'Failed to fetch data from API',
  'فشل في تحميل البيانات'
);

// Validation errors
throw new ValidationError(
  'INVALID_EMAIL',
  'Email format is invalid',
  'تنسيق البريد الإلكتروني غير صحيح'
);

// Authentication errors
throw new AuthenticationError(
  'TOKEN_EXPIRED',
  'Authentication token has expired',
  'انتهت صلاحية الجلسة'
);
```

### **Error Handling Patterns**

```typescript
// 1. Try-catch with error handling
const fetchData = async () => {
  try {
    const data = await api.getData();
    return data;
  } catch (error) {
    ErrorHandler.handle(error as Error, { context: 'fetchData' });
    throw error; // Re-throw if needed
  }
};

// 2. Error recovery
const fetchDataWithFallback = async () => {
  return ErrorRecovery.fallbackToCache(
    () => api.getData(),
    'user-data',
    defaultUserData
  );
};

// 3. Retry with exponential backoff
const robustFetch = async () => {
  return ErrorRecovery.retry(
    () => api.getData(),
    3, // max retries
    1000 // initial delay
  );
};
```

## 🧪 Testing Guidelines

### **Test Structure**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { TestWrapper } from '@/lib/testing/TestWrapper';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  // Setup and teardown
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Unit tests
  describe('Rendering', () => {
    it('should render correctly', () => {
      render(
        <TestWrapper>
          <MyComponent />
        </TestWrapper>
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle loading state', () => {
      render(
        <TestWrapper initialState={{ isLoading: true }}>
          <MyComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  // Interaction tests
  describe('Interactions', () => {
    it('should handle click events', async () => {
      const handleClick = vi.fn();
      
      render(
        <TestWrapper>
          <MyComponent onClick={handleClick} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(handleClick).toHaveBeenCalledTimes(1);
      });
    });
  });

  // Error handling tests
  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <MyComponent shouldThrowError />
        </TestWrapper>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(consoleError).toHaveBeenCalled();
      
      consoleError.mockRestore();
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('should be accessible', () => {
      render(
        <TestWrapper>
          <MyComponent />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toBeAccessible();
      expect(button).toHaveAttribute('aria-label');
    });
  });
});
```

### **Testing Best Practices**

1. **Test Behavior, Not Implementation**: Focus on what the component does
2. **Use Real User Interactions**: Test how users actually interact
3. **Mock External Dependencies**: Isolate the component under test
4. **Test Error States**: Ensure graceful error handling
5. **Accessibility Testing**: Verify components are accessible
6. **Performance Testing**: Check for memory leaks and performance issues

## 🔒 Security Best Practices

### **Input Validation**

```typescript
import { z } from 'zod';

// Define validation schemas
const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Use in components
const LoginForm = () => {
  const handleSubmit = (data: unknown) => {
    try {
      const validatedData = LoginSchema.parse(data);
      // Process validated data
    } catch (error) {
      // Handle validation errors
    }
  };
};
```

### **XSS Prevention**

```typescript
// ✅ Good: Use React's built-in escaping
const SafeComponent = ({ userInput }: { userInput: string }) => (
  <div>{userInput}</div> // React automatically escapes
);

// ❌ Bad: Direct HTML injection
const UnsafeComponent = ({ html }: { html: string }) => (
  <div dangerouslySetInnerHTML={{ __html: html }} />
);

// ✅ Good: Sanitize if HTML is needed
import DOMPurify from 'dompurify';

const SafeHTMLComponent = ({ html }: { html: string }) => (
  <div dangerouslySetInnerHTML={{ 
    __html: DOMPurify.sanitize(html) 
  }} />
);
```

### **Authentication & Authorization**

```typescript
// Protected route wrapper
const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: { 
  children: ReactNode;
  requiredRole?: UserRole;
}) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && !user?.roles.includes(requiredRole)) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};
```

## ⚡ Performance Guidelines

### **Component Optimization**

```typescript
// 1. Memoization
const ExpensiveComponent = React.memo(({ data }: { data: Data[] }) => {
  const processedData = useMemo(() => {
    return data.map(item => processItem(item));
  }, [data]);

  return <div>{/* Render processed data */}</div>;
});

// 2. Lazy loading
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

const App = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyComponent />
  </Suspense>
);

// 3. Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }: { items: Item[] }) => (
  <List
    height={600}
    itemCount={items.length}
    itemSize={50}
  >
    {({ index, style }) => (
      <div style={style}>
        <ItemComponent item={items[index]} />
      </div>
    )}
  </List>
);
```

### **Bundle Optimization**

```typescript
// 1. Tree shaking
import { debounce } from 'lodash-es'; // ✅ Good
import _ from 'lodash'; // ❌ Bad - imports entire library

// 2. Dynamic imports
const loadHeavyLibrary = async () => {
  const { heavyFunction } = await import('./heavyLibrary');
  return heavyFunction;
};

// 3. Code splitting by route
const HomePage = React.lazy(() => import('@/pages/HomePage'));
const ProductPage = React.lazy(() => import('@/pages/ProductPage'));
```

## 🚀 Deployment Process

### **Pre-deployment Checklist**

- [ ] All tests passing
- [ ] Code review completed
- [ ] Security scan passed
- [ ] Performance metrics acceptable
- [ ] Error handling tested
- [ ] Accessibility verified
- [ ] Mobile responsiveness confirmed
- [ ] SEO optimizations applied

### **Deployment Steps**

1. **Staging Deployment**
   ```bash
   npm run build:staging
   npm run deploy:staging
   npm run test:e2e:staging
   ```

2. **Production Deployment**
   ```bash
   npm run build:production
   npm run deploy:production
   npm run verify:production
   ```

3. **Post-deployment**
   ```bash
   npm run monitor:health
   npm run check:performance
   npm run verify:security
   ```

### **Rollback Procedure**

```bash
# Emergency rollback
npm run rollback:production

# Verify rollback
npm run verify:rollback
```

## 📚 Additional Resources

- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Testing Library Documentation](https://testing-library.com/docs/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Remember**: This is a living document. Update it as the project evolves and new patterns emerge.