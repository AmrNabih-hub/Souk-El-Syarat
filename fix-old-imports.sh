#!/bin/bash

# Fix all old AWS Amplify and Firebase imports to use Appwrite

echo "🔧 Fixing old AWS/Amplify imports..."
echo ""

# Backup old auth.service.ts
cp src/services/auth.service.ts src/services/auth.service.ts.backup

# Update auth.service.ts to just re-export Appwrite service
cat > src/services/auth.service.ts << 'EOF'
/**
 * Auth Service - Now uses Appwrite
 * This file maintains backward compatibility by re-exporting Appwrite auth
 */

export { AppwriteAuthService as AuthService } from './appwrite-auth.service';
export { AppwriteAuthService as default } from './appwrite-auth.service';
EOF

echo "✅ auth.service.ts updated"

# Fix AuthContext.tsx
cat > src/contexts/AuthContext.tsx << 'EOF'
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AppwriteAuthService } from '@/services/appwrite-auth.service';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, displayName: string) => Promise<User>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🔐 Initializing auth...');
        const currentUser = await AppwriteAuthService.getCurrentUser();
        
        if (mounted) {
          setUser(currentUser);
          console.log('✅ Auth initialized:', currentUser ? 'Logged in' : 'Guest');
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Set up auth state listener
    const unsubscribe = AppwriteAuthService.onAuthStateChange((newUser) => {
      if (mounted) {
        setUser(newUser);
        console.log('🔄 Auth state changed:', newUser ? 'Logged in' : 'Logged out');
      }
    });

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const user = await AppwriteAuthService.signIn(email, password);
      setUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string): Promise<User> => {
    setLoading(true);
    try {
      const user = await AppwriteAuthService.signUp(email, password, displayName);
      setUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await AppwriteAuthService.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<User> => {
    if (!user) {
      throw new Error('No user logged in');
    }
    
    setLoading(true);
    try {
      const updatedUser = await AppwriteAuthService.updateProfile(user.id, updates);
      setUser(updatedUser);
      return updatedUser;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
EOF

echo "✅ AuthContext.tsx updated"

# Fix advanced-security.service.ts to not use crypto-js
cat > src/services/advanced-security.service.ts << 'EOF'
/**
 * Advanced Security Service
 * Provides security utilities without external crypto dependencies
 */

import { logger } from '@/utils/logger';

export class AdvancedSecurityService {
  /**
   * Generate a secure random token
   */
  static generateToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hash a string using Web Crypto API
   */
  static async hashString(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate security token
   */
  static validateToken(token: string): boolean {
    // Basic validation
    return token && token.length >= 16 && /^[a-f0-9]+$/.test(token);
  }

  /**
   * Generate CSRF token
   */
  static generateCSRFToken(): string {
    return this.generateToken(32);
  }

  /**
   * Sanitize input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Check password strength
   */
  static checkPasswordStrength(password: string): {
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (password.length < 8) feedback.push('Password should be at least 8 characters');
    if (!/[a-z]/.test(password)) feedback.push('Add lowercase letters');
    if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
    if (!/[0-9]/.test(password)) feedback.push('Add numbers');
    if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('Add special characters');

    return { score, feedback };
  }
}

export default AdvancedSecurityService;
EOF

echo "✅ advanced-security.service.ts updated"

# Update any other files that import from old services
echo ""
echo "🔍 Checking for other old imports..."

# Find and list files with aws-amplify imports (excluding node_modules and backups)
grep -r "from ['\"]aws-amplify" src/ --exclude="*.backup" 2>/dev/null || echo "  No other aws-amplify imports found"
grep -r "from ['\"]@aws-amplify" src/ --exclude="*.backup" 2>/dev/null || echo "  No other @aws-amplify imports found"
grep -r "from ['\"]crypto-js" src/ --exclude="*.backup" --exclude="advanced-security.service.ts" 2>/dev/null || echo "  No other crypto-js imports found"

echo ""
echo "✅ Import fixes complete!"
echo ""
echo "🧹 Cleaning up..."

# Clear Vite cache
rm -rf node_modules/.vite
rm -rf .vite

echo "✅ Cache cleared"
echo ""
echo "✨ All fixes applied!"
echo ""
echo "🚀 Try running: npm run dev"
echo ""
