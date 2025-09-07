/**
 * 🔐 Ultimate Authentication Service
 * Professional authentication with comprehensive error handling and security
 */

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  AuthError
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/config/firebase.config'

export interface AuthUser {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  emailVerified: boolean
  role: 'customer' | 'vendor' | 'admin'
  createdAt: Date
  lastLoginAt: Date
  isActive: boolean
  preferences: {
    language: string
    theme: string
    notifications: boolean
  }
}

export interface AuthError {
  code: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  userMessage: string
  action: string
}

export interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  error: AuthError | null
  isInitialized: boolean
}

export class UltimateAuthService {
  private static instance: UltimateAuthService
  private authState: AuthState = {
    user: null,
    isLoading: true,
    error: null,
    isInitialized: false
  }
  private listeners: ((state: AuthState) => void)[] = []
  private retryAttempts = 0
  private maxRetries = 3
  private retryDelay = 1000

  private constructor() {
    this.initializeAuth()
  }

  static getInstance(): UltimateAuthService {
    if (!UltimateAuthService.instance) {
      UltimateAuthService.instance = new UltimateAuthService()
    }
    return UltimateAuthService.instance
  }

  /**
   * 🚀 Initialize authentication with error handling
   */
  private async initializeAuth(): Promise<void> {
    try {
      console.log('🔐 Initializing authentication...')
      
      onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            const user = await this.getUserProfile(firebaseUser.uid)
            this.updateAuthState({ user, isLoading: false, error: null })
          } else {
            this.updateAuthState({ user: null, isLoading: false, error: null })
          }
        } catch (error) {
          console.error('❌ Auth state change error:', error)
          this.updateAuthState({ 
            user: null, 
            isLoading: false, 
            error: this.handleAuthError(error as AuthError) 
          })
        }
      })

      this.updateAuthState({ isInitialized: true })
      console.log('✅ Authentication initialized successfully')
    } catch (error) {
      console.error('❌ Authentication initialization failed:', error)
      this.updateAuthState({ 
        user: null, 
        isLoading: false, 
        error: this.handleAuthError(error as AuthError),
        isInitialized: true 
      })
    }
  }

  /**
   * 📧 Sign up with email and password
   */
  async signUp(email: string, password: string, displayName: string, role: 'customer' | 'vendor' = 'customer'): Promise<AuthUser> {
    try {
      console.log('📧 Signing up user:', email)
      
      // Validate input
      this.validateEmail(email)
      this.validatePassword(password)
      this.validateDisplayName(displayName)

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Update display name
      await updateProfile(firebaseUser, { displayName })

      // Send email verification
      await sendEmailVerification(firebaseUser)

      // Create user profile in Firestore
      const userProfile: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName,
        photoURL: firebaseUser.photoURL || undefined,
        emailVerified: firebaseUser.emailVerified,
        role,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isActive: true,
        preferences: {
          language: 'en',
          theme: 'light',
          notifications: true
        }
      }

      await this.createUserProfile(userProfile)

      // Reset retry attempts on success
      this.retryAttempts = 0

      console.log('✅ User signed up successfully:', userProfile.uid)
      return userProfile

    } catch (error) {
      console.error('❌ Sign up failed:', error)
      const authError = this.handleAuthError(error as AuthError)
      this.updateAuthState({ error: authError })
      throw authError
    }
  }

  /**
   * 🔑 Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      console.log('🔑 Signing in user:', email)
      
      // Validate input
      this.validateEmail(email)
      this.validatePassword(password)

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Get user profile
      const userProfile = await this.getUserProfile(firebaseUser.uid)

      // Update last login time
      await this.updateLastLogin(firebaseUser.uid)

      // Reset retry attempts on success
      this.retryAttempts = 0

      console.log('✅ User signed in successfully:', userProfile.uid)
      return userProfile

    } catch (error) {
      console.error('❌ Sign in failed:', error)
      const authError = this.handleAuthError(error as AuthError)
      this.updateAuthState({ error: authError })
      throw authError
    }
  }

  /**
   * 🔐 Sign in with Google
   */
  async signInWithGoogle(): Promise<AuthUser> {
    try {
      console.log('🔐 Signing in with Google...')
      
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const firebaseUser = result.user

      // Check if user exists in Firestore
      let userProfile = await this.getUserProfile(firebaseUser.uid)
      
      if (!userProfile) {
        // Create new user profile
        userProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || 'Google User',
          photoURL: firebaseUser.photoURL || undefined,
          emailVerified: firebaseUser.emailVerified,
          role: 'customer',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          isActive: true,
          preferences: {
            language: 'en',
            theme: 'light',
            notifications: true
          }
        }

        await this.createUserProfile(userProfile)
      } else {
        // Update last login time
        await this.updateLastLogin(firebaseUser.uid)
      }

      console.log('✅ Google sign in successful:', userProfile.uid)
      return userProfile

    } catch (error) {
      console.error('❌ Google sign in failed:', error)
      const authError = this.handleAuthError(error as AuthError)
      this.updateAuthState({ error: authError })
      throw authError
    }
  }

  /**
   * 🚪 Sign out
   */
  async signOut(): Promise<void> {
    try {
      console.log('🚪 Signing out user...')
      
      await signOut(auth)
      this.updateAuthState({ user: null, error: null })
      
      console.log('✅ User signed out successfully')
    } catch (error) {
      console.error('❌ Sign out failed:', error)
      const authError = this.handleAuthError(error as AuthError)
      this.updateAuthState({ error: authError })
      throw authError
    }
  }

  /**
   * 🔄 Reset password
   */
  async resetPassword(email: string): Promise<void> {
    try {
      console.log('🔄 Resetting password for:', email)
      
      this.validateEmail(email)
      await sendPasswordResetEmail(auth, email)
      
      console.log('✅ Password reset email sent')
    } catch (error) {
      console.error('❌ Password reset failed:', error)
      const authError = this.handleAuthError(error as AuthError)
      throw authError
    }
  }

  /**
   * 👤 Get user profile
   */
  private async getUserProfile(uid: string): Promise<AuthUser> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found')
      }

      const userData = userDoc.data()
      return {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        emailVerified: userData.emailVerified,
        role: userData.role,
        createdAt: userData.createdAt.toDate(),
        lastLoginAt: userData.lastLoginAt.toDate(),
        isActive: userData.isActive,
        preferences: userData.preferences
      }
    } catch (error) {
      console.error('❌ Failed to get user profile:', error)
      throw new Error('Failed to load user profile')
    }
  }

  /**
   * 💾 Create user profile
   */
  private async createUserProfile(user: AuthUser): Promise<void> {
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...user,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      })
    } catch (error) {
      console.error('❌ Failed to create user profile:', error)
      throw new Error('Failed to create user profile')
    }
  }

  /**
   * 📅 Update last login time
   */
  private async updateLastLogin(uid: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        lastLoginAt: serverTimestamp()
      })
    } catch (error) {
      console.error('❌ Failed to update last login:', error)
      // Don't throw error for this non-critical operation
    }
  }

  /**
   * ✅ Validate email
   */
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }
  }

  /**
   * ✅ Validate password
   */
  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }
    
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new Error('Password must contain uppercase, lowercase, number, and special character')
    }
  }

  /**
   * ✅ Validate display name
   */
  private validateDisplayName(displayName: string): void {
    if (displayName.length < 2) {
      throw new Error('Display name must be at least 2 characters long')
    }
    
    if (displayName.length > 50) {
      throw new Error('Display name must be less than 50 characters')
    }
  }

  /**
   * 🚨 Handle authentication errors
   */
  private handleAuthError(error: any): AuthError {
    const errorCode = error.code || 'unknown'
    const errorMessage = error.message || 'An unknown error occurred'
    
    const errorMap: Record<string, AuthError> = {
      'auth/user-not-found': {
        code: errorCode,
        message: errorMessage,
        severity: 'medium',
        userMessage: 'No account found with this email address',
        action: 'Please check your email or sign up for a new account'
      },
      'auth/wrong-password': {
        code: errorCode,
        message: errorMessage,
        severity: 'medium',
        userMessage: 'Incorrect password',
        action: 'Please check your password and try again'
      },
      'auth/email-already-in-use': {
        code: errorCode,
        message: errorMessage,
        severity: 'medium',
        userMessage: 'An account with this email already exists',
        action: 'Please sign in or use a different email address'
      },
      'auth/weak-password': {
        code: errorCode,
        message: errorMessage,
        severity: 'medium',
        userMessage: 'Password is too weak',
        action: 'Please choose a stronger password'
      },
      'auth/invalid-email': {
        code: errorCode,
        message: errorMessage,
        severity: 'medium',
        userMessage: 'Invalid email address',
        action: 'Please enter a valid email address'
      },
      'auth/too-many-requests': {
        code: errorCode,
        message: errorMessage,
        severity: 'high',
        userMessage: 'Too many failed attempts',
        action: 'Please wait a moment before trying again'
      },
      'auth/network-request-failed': {
        code: errorCode,
        message: errorMessage,
        severity: 'high',
        userMessage: 'Network error',
        action: 'Please check your internet connection and try again'
      },
      'auth/user-disabled': {
        code: errorCode,
        message: errorMessage,
        severity: 'critical',
        userMessage: 'Account has been disabled',
        action: 'Please contact support for assistance'
      }
    }

    return errorMap[errorCode] || {
      code: errorCode,
      message: errorMessage,
      severity: 'high',
      userMessage: 'An error occurred during authentication',
      action: 'Please try again or contact support if the problem persists'
    }
  }

  /**
   * 📡 Update auth state
   */
  private updateAuthState(updates: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...updates }
    this.notifyListeners()
  }

  /**
   * 👂 Add auth state listener
   */
  addAuthStateListener(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * 📢 Notify listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.authState)
      } catch (error) {
        console.error('❌ Error in auth state listener:', error)
      }
    })
  }

  /**
   * 📊 Get current auth state
   */
  getAuthState(): AuthState {
    return { ...this.authState }
  }

  /**
   * 🔄 Retry with exponential backoff
   */
  private async retryWithBackoff<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++
        const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1)
        
        console.log(`🔄 Retrying operation in ${delay}ms (attempt ${this.retryAttempts}/${this.maxRetries})`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.retryWithBackoff(operation)
      } else {
        throw error
      }
    }
  }
}

// Export singleton instance
export const ultimateAuthService = UltimateAuthService.getInstance()