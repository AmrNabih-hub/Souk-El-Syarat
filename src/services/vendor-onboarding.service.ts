/**
 * Vendor Onboarding Service
 * Complete workflow implementation with real-time updates
 */

import { 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { auth, db, storage, realtimeDb } from '@/config/firebase';
import { ref as rtRef, set, onValue, push, update } from 'firebase/database';
import {
  VendorSignupRequest,
  VendorApplicationForm,
  VendorApplicationStatus,
  ApplicationStep,
  ApplicationStatusType,
  VendorSubscriptionPlan,
  InstaPayTransaction,
  VendorApplicationRealtimeUpdate,
  FileUpload,
  VENDOR_SUBSCRIPTION_PLANS,
  SOUK_BUSINESS_DETAILS,
} from '@/api/contracts/vendor-onboarding';
import { EmailService } from './email.service';
import { NotificationService } from './notification.service';
import { apiClient } from '@/api/client';

class VendorOnboardingService {
  private static instance: VendorOnboardingService;
  private emailService: EmailService;
  private notificationService: NotificationService;
  private realtimeListeners: Map<string, () => void> = new Map();

  private constructor() {
    this.emailService = EmailService.getInstance();
    this.notificationService = NotificationService.getInstance();
  }

  static getInstance(): VendorOnboardingService {
    if (!VendorOnboardingService.instance) {
      VendorOnboardingService.instance = new VendorOnboardingService();
    }
    return VendorOnboardingService.instance;
  }

  // ============================================
  // STEP 1: VENDOR SIGNUP & EMAIL VERIFICATION
  // ============================================

  async signupVendor(data: VendorSignupRequest): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // Validate Egyptian phone number
      if (!this.validateEgyptianPhone(data.phone)) {
        throw new Error('Invalid Egyptian phone number');
      }

      // Validate National ID
      if (!this.validateEgyptianNationalId(data.nationalId)) {
        throw new Error('Invalid Egyptian National ID');
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = userCredential.user;

      // Create vendor profile in Firestore
      const vendorProfile = {
        userId: user.uid,
        email: data.email,
        firstName: data.firstName,
        firstNameAr: data.firstNameAr,
        lastName: data.lastName,
        lastNameAr: data.lastNameAr,
        phone: data.phone,
        nationalId: this.hashNationalId(data.nationalId), // Hash for security
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        role: 'vendor_pending',
        intendedBusinessType: data.intendedBusinessType,
        estimatedInventory: data.estimatedInventory,
        previousExperience: data.previousExperience,
        referralSource: data.referralSource,
        createdAt: serverTimestamp(),
        emailVerified: false,
        applicationStatus: 'email_verification_pending' as ApplicationStatusType,
      };

      await setDoc(doc(db, 'vendors', user.uid), vendorProfile);

      // Create application status document
      const applicationStatus: VendorApplicationStatus = {
        applicationId: `APP-${user.uid}-${Date.now()}`,
        vendorId: user.uid,
        currentStep: 'email_verification_pending',
        status: 'pending_verification',
        timeline: {
          signupStarted: new Date(),
          emailSent: new Date(),
        },
        communications: {
          emailsSent: [],
          smssSent: [],
          inAppNotifications: [],
        },
      };

      await setDoc(doc(db, 'vendor_applications', user.uid), applicationStatus);

      // Send verification email with custom template
      await this.sendVendorVerificationEmail(user, data);

      // Create real-time update for admin dashboard
      await this.createRealtimeUpdate({
        applicationId: applicationStatus.applicationId,
        updateType: 'vendor_action',
        timestamp: new Date(),
        data: {
          vendorAction: 'signup_completed',
          message: `New vendor signup: ${data.firstName} ${data.lastName}`,
        },
        adminNotification: {
          priority: 'medium',
          requiresAction: false,
        },
      });

      // Send admin notification
      await this.notifyAdminsOfNewSignup(data);

      return { success: true, userId: user.uid };
    } catch (error: any) {
      console.error('Vendor signup error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendVendorVerificationEmail(user: FirebaseUser, data: VendorSignupRequest) {
    // Send Firebase verification email
    await sendEmailVerification(user);

    // Send custom branded email
    await this.emailService.sendEmail({
      to: data.email,
      subject: 'Welcome to Souk El-Sayarat - Verify Your Email',
      template: 'vendor-welcome',
      data: {
        firstName: data.firstName,
        firstNameAr: data.firstNameAr,
        verificationLink: `${window.location.origin}/verify-email?uid=${user.uid}`,
        businessType: data.intendedBusinessType,
        nextSteps: [
          'Verify your email address',
          'Complete vendor application form',
          'Upload required documents',
          'Select subscription plan',
          'Submit payment proof',
        ],
      },
    });
  }

  // ============================================
  // STEP 2: GOOGLE SIGNIN & BECOME VENDOR
  // ============================================

  async signInWithGoogle(): Promise<{ success: boolean; user?: any; isNewUser?: boolean }> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in vendors collection
      const vendorDoc = await getDoc(doc(db, 'vendors', user.uid));
      
      if (!vendorDoc.exists()) {
        // New user - create basic profile
        await setDoc(doc(db, 'vendors', user.uid), {
          userId: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'customer',
          createdAt: serverTimestamp(),
          canBecomeVendor: true,
        });

        return { success: true, user, isNewUser: true };
      }

      return { success: true, user, isNewUser: false };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      return { success: false };
    }
  }

  async checkCanBecomeVendor(userId: string): Promise<boolean> {
    const vendorDoc = await getDoc(doc(db, 'vendors', userId));
    const data = vendorDoc.data();
    
    // Check if already a vendor or has pending application
    if (data?.role === 'vendor' || data?.applicationStatus === 'pending_review') {
      return false;
    }
    
    return true;
  }

  // ============================================
  // STEP 3: VENDOR APPLICATION FORM
  // ============================================

  async submitVendorApplication(
    userId: string,
    application: VendorApplicationForm
  ): Promise<{ success: boolean; applicationId?: string; error?: string }> {
    try {
      // Validate all required documents
      const documentValidation = this.validateEgyptianDocuments(application.legalDocuments);
      if (!documentValidation.valid) {
        throw new Error(documentValidation.error);
      }

      // Upload all documents to Firebase Storage
      const uploadedDocuments = await this.uploadDocuments(userId, application.legalDocuments);

      // Create complete application document
      const applicationDoc = {
        ...application,
        legalDocuments: uploadedDocuments,
        userId,
        submittedAt: serverTimestamp(),
        status: 'pending_payment' as ApplicationStatusType,
        applicationId: `APP-${userId}-${Date.now()}`,
      };

      // Save application
      await setDoc(doc(db, 'vendor_applications', userId), applicationDoc, { merge: true });

      // Update vendor profile
      await updateDoc(doc(db, 'vendors', userId), {
        applicationStatus: 'pending_payment',
        applicationSubmittedAt: serverTimestamp(),
        selectedPlan: application.subscriptionPlan.id,
      });

      // Create payment record
      await this.createPaymentRecord(userId, application);

      // Send confirmation email
      await this.sendApplicationReceivedEmail(userId, application);

      // Notify admins
      await this.notifyAdminsOfNewApplication(userId, application);

      // Create real-time update
      await this.createRealtimeUpdate({
        applicationId: applicationDoc.applicationId,
        updateType: 'vendor_action',
        timestamp: new Date(),
        data: {
          vendorAction: 'application_submitted',
          message: `Application submitted by ${application.businessInfo.businessName}`,
        },
        adminNotification: {
          priority: 'high',
          requiresAction: true,
          actionType: 'review_application',
          estimatedReviewTime: 30,
        },
      });

      return { success: true, applicationId: applicationDoc.applicationId };
    } catch (error: any) {
      console.error('Application submission error:', error);
      return { success: false, error: error.message };
    }
  }

  async uploadDocuments(
    userId: string,
    documents: any
  ): Promise<any> {
    const uploadedDocs: any = {};

    for (const [key, file] of Object.entries(documents)) {
      if (file && typeof file === 'object' && 'file' in (file as any)) {
        const fileData = file as any;
        const storageRef = ref(
          storage,
          `vendor-documents/${userId}/${key}/${fileData.fileName}`
        );

        const snapshot = await uploadBytes(storageRef, fileData.file);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        uploadedDocs[key] = {
          ...fileData,
          url: downloadUrl,
          uploadedAt: new Date(),
          status: 'uploaded',
        };
      }
    }

    return uploadedDocs;
  }

  // ============================================
  // STEP 4: PAYMENT VERIFICATION (INSTAPAY)
  // ============================================

  async verifyInstaPayPayment(
    userId: string,
    transactionData: InstaPayTransaction
  ): Promise<{ success: boolean; verified?: boolean }> {
    try {
      // Verify transaction details match our records
      const application = await getDoc(doc(db, 'vendor_applications', userId));
      const appData = application.data();

      if (!appData) {
        throw new Error('Application not found');
      }

      const expectedAmount = this.calculatePlanPrice(
        appData.subscriptionPlan,
        appData.paymentProof.paymentDuration
      );

      // Verify amount matches
      if (Math.abs(transactionData.amount - expectedAmount) > 1) {
        return { success: false, verified: false };
      }

      // Verify IPA matches our business IPA
      if (transactionData.receiver.ipa !== SOUK_BUSINESS_DETAILS.instapay.ipa) {
        return { success: false, verified: false };
      }

      // Update payment verification status
      await updateDoc(doc(db, 'vendor_applications', userId), {
        'paymentProof.verificationStatus': 'verified',
        'paymentProof.verifiedAt': serverTimestamp(),
        'status': 'pending_review',
      });

      // Notify admin of verified payment
      await this.createRealtimeUpdate({
        applicationId: appData.applicationId,
        updateType: 'payment_received',
        timestamp: new Date(),
        data: {
          paymentAmount: transactionData.amount,
          previousStatus: 'pending_payment',
          newStatus: 'pending_review',
        },
        adminNotification: {
          priority: 'high',
          requiresAction: true,
          actionType: 'review_application',
          estimatedReviewTime: 45,
        },
      });

      return { success: true, verified: true };
    } catch (error) {
      console.error('Payment verification error:', error);
      return { success: false, verified: false };
    }
  }

  // ============================================
  // STEP 5: ADMIN REVIEW & APPROVAL
  // ============================================

  async reviewApplication(
    adminId: string,
    vendorId: string,
    decision: 'approve' | 'reject' | 'request_more_info',
    notes?: string,
    conditions?: string[]
  ): Promise<{ success: boolean }> {
    try {
      const timestamp = new Date();
      
      // Update application status
      const newStatus: ApplicationStatusType = 
        decision === 'approve' ? 'approved' :
        decision === 'reject' ? 'rejected' :
        'additional_info_required';

      await updateDoc(doc(db, 'vendor_applications', vendorId), {
        'review.finalDecision': {
          decision,
          decidedBy: adminId,
          decidedAt: timestamp,
          reason: notes,
          conditions,
        },
        status: newStatus,
        reviewedAt: serverTimestamp(),
      });

      // Update vendor profile based on decision
      if (decision === 'approve') {
        await this.approveVendor(vendorId);
      } else if (decision === 'reject') {
        await this.rejectVendor(vendorId, notes || 'Application did not meet requirements');
      }

      // Send notification to vendor
      await this.sendDecisionEmail(vendorId, decision, notes, conditions);

      // Create real-time update
      await this.createRealtimeUpdate({
        applicationId: `APP-${vendorId}`,
        updateType: 'admin_action',
        timestamp,
        data: {
          adminAction: decision,
          previousStatus: 'pending_review',
          newStatus,
          message: notes,
        },
        vendorNotification: {
          type: decision === 'approve' ? 'success' : decision === 'reject' ? 'error' : 'warning',
          title: decision === 'approve' ? 'Application Approved!' : 
                 decision === 'reject' ? 'Application Rejected' : 
                 'Additional Information Required',
          message: notes || 'Please check your email for details',
          actionRequired: decision === 'request_more_info',
          actionUrl: decision === 'request_more_info' ? '/vendor/application' : undefined,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Review application error:', error);
      return { success: false };
    }
  }

  async approveVendor(vendorId: string) {
    // Update vendor role and activate dashboard
    await updateDoc(doc(db, 'vendors', vendorId), {
      role: 'vendor',
      status: 'active',
      approvedAt: serverTimestamp(),
      dashboardActivated: true,
      features: {
        products: true,
        orders: true,
        analytics: true,
        messages: true,
        promotions: true,
      },
    });

    // Create vendor dashboard
    await this.createVendorDashboard(vendorId);

    // Initialize vendor analytics
    await this.initializeVendorAnalytics(vendorId);

    // Setup payment account
    await this.setupVendorPaymentAccount(vendorId);
  }

  async rejectVendor(vendorId: string, reason: string) {
    await updateDoc(doc(db, 'vendors', vendorId), {
      applicationStatus: 'rejected',
      rejectedAt: serverTimestamp(),
      rejectionReason: reason,
      canReapply: true,
      reapplyAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
  }

  // ============================================
  // VENDOR DASHBOARD CREATION
  // ============================================

  async createVendorDashboard(vendorId: string) {
    // Create dashboard structure in Firestore
    const dashboardData = {
      vendorId,
      stats: {
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        averageRating: 0,
        pendingOrders: 0,
        processingOrders: 0,
        completedOrders: 0,
      },
      charts: {
        revenue: [],
        orders: [],
        visitors: [],
        conversion: [],
      },
      notifications: [],
      quickActions: [
        { id: 'add_product', label: 'Add Product', icon: 'plus', url: '/vendor/products/new' },
        { id: 'view_orders', label: 'View Orders', icon: 'shopping-cart', url: '/vendor/orders' },
        { id: 'analytics', label: 'Analytics', icon: 'chart', url: '/vendor/analytics' },
        { id: 'messages', label: 'Messages', icon: 'message', url: '/vendor/messages' },
      ],
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    };

    await setDoc(doc(db, 'vendor_dashboards', vendorId), dashboardData);

    // Setup real-time listeners for dashboard updates
    this.setupDashboardRealtimeListeners(vendorId);
  }

  setupDashboardRealtimeListeners(vendorId: string) {
    // Listen to orders collection for this vendor
    const ordersRef = rtRef(realtimeDb, `orders/${vendorId}`);
    onValue(ordersRef, (snapshot) => {
      const orders = snapshot.val();
      if (orders) {
        this.updateVendorDashboardStats(vendorId, { orders });
      }
    });

    // Listen to products collection
    const productsQuery = query(
      collection(db, 'products'),
      where('vendorId', '==', vendorId)
    );
    
    const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.updateVendorDashboardStats(vendorId, { products });
    });

    this.realtimeListeners.set(`dashboard-${vendorId}`, unsubscribe);
  }

  async updateVendorDashboardStats(vendorId: string, data: any) {
    // Update dashboard statistics in real-time
    const updates: any = {
      lastUpdated: serverTimestamp(),
    };

    if (data.orders) {
      const orderStats = this.calculateOrderStats(data.orders);
      updates['stats.totalOrders'] = orderStats.total;
      updates['stats.pendingOrders'] = orderStats.pending;
      updates['stats.totalRevenue'] = orderStats.revenue;
    }

    if (data.products) {
      updates['stats.totalProducts'] = data.products.length;
    }

    await updateDoc(doc(db, 'vendor_dashboards', vendorId), updates);
  }

  // ============================================
  // REAL-TIME UPDATES & SYNCHRONIZATION
  // ============================================

  async createRealtimeUpdate(update: VendorApplicationRealtimeUpdate) {
    // Save to Realtime Database for instant updates
    const updatesRef = rtRef(realtimeDb, 'application_updates');
    await push(updatesRef, update);

    // Also save to Firestore for persistence
    await setDoc(
      doc(collection(db, 'application_updates')),
      update
    );

    // Trigger admin dashboard refresh if needed
    if (update.adminNotification?.requiresAction) {
      await this.triggerAdminDashboardRefresh();
    }

    // Send push notification to vendor if needed
    if (update.vendorNotification) {
      await this.notificationService.sendPushNotification(
        update.applicationId.split('-')[1], // Extract userId
        update.vendorNotification.title,
        update.vendorNotification.message
      );
    }
  }

  async triggerAdminDashboardRefresh() {
    // Update admin dashboard refresh flag in Realtime Database
    const adminRef = rtRef(realtimeDb, 'admin/dashboard/refresh');
    await set(adminRef, {
      timestamp: Date.now(),
      hasNewApplications: true,
    });
  }

  subscribeToApplicationUpdates(
    applicationId: string,
    callback: (update: VendorApplicationRealtimeUpdate) => void
  ) {
    const updatesRef = rtRef(realtimeDb, `application_updates/${applicationId}`);
    
    const unsubscribe = onValue(updatesRef, (snapshot) => {
      const update = snapshot.val();
      if (update) {
        callback(update);
      }
    });

    return unsubscribe;
  }

  // ============================================
  // ADMIN DASHBOARD REAL-TIME OPERATIONS
  // ============================================

  subscribeToAdminDashboard(callback: (data: any) => void) {
    // Subscribe to all vendor applications
    const applicationsQuery = query(
      collection(db, 'vendor_applications'),
      where('status', 'in', ['pending_review', 'pending_payment', 'additional_info_required']),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribe = onSnapshot(applicationsQuery, async (snapshot) => {
      const applications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get vendor details for each application
      const enrichedApplications = await Promise.all(
        applications.map(async (app) => {
          const vendorDoc = await getDoc(doc(db, 'vendors', app.id));
          return {
            ...app,
            vendor: vendorDoc.data(),
          };
        })
      );

      // Calculate statistics
      const stats = {
        total: enrichedApplications.length,
        pendingReview: enrichedApplications.filter(a => a.status === 'pending_review').length,
        pendingPayment: enrichedApplications.filter(a => a.status === 'pending_payment').length,
        needsInfo: enrichedApplications.filter(a => a.status === 'additional_info_required').length,
      };

      callback({
        applications: enrichedApplications,
        stats,
        lastUpdated: new Date(),
      });
    });

    return unsubscribe;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  validateEgyptianPhone(phone: string): boolean {
    // Egyptian phone number format: +20 followed by 10 digits
    const egyptPhoneRegex = /^(\+20|0020|20)?1[0-2,5]\d{8}$/;
    return egyptPhoneRegex.test(phone.replace(/\s/g, ''));
  }

  validateEgyptianNationalId(nationalId: string): boolean {
    // Egyptian National ID is 14 digits
    const nationalIdRegex = /^\d{14}$/;
    if (!nationalIdRegex.test(nationalId)) return false;

    // Additional validation logic for Egyptian National ID
    // Century (1 for 1900s, 2 for 2000s)
    const century = parseInt(nationalId[0]);
    if (century !== 2 && century !== 3) return false;

    // Birth date validation
    const year = parseInt(nationalId.substring(1, 3));
    const month = parseInt(nationalId.substring(3, 5));
    const day = parseInt(nationalId.substring(5, 7));

    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    // Governorate code (21-88)
    const governorate = parseInt(nationalId.substring(7, 9));
    if (governorate < 1 || governorate > 88) return false;

    return true;
  }

  hashNationalId(nationalId: string): string {
    // Hash the national ID for security (keep last 4 digits visible)
    return `****-****-**${nationalId.slice(-4)}`;
  }

  validateEgyptianDocuments(documents: any): { valid: boolean; error?: string } {
    const required = ['nationalIdFront', 'nationalIdBack', 'taxCard'];
    
    for (const doc of required) {
      if (!documents[doc]) {
        return { valid: false, error: `Missing required document: ${doc}` };
      }
    }

    // Additional validation for business types
    if (documents.businessType === 'company' || documents.businessType === 'dealer') {
      if (!documents.commercialRegister) {
        return { valid: false, error: 'Commercial Register required for companies/dealers' };
      }
    }

    return { valid: true };
  }

  calculatePlanPrice(plan: VendorSubscriptionPlan, duration: string): number {
    switch (duration) {
      case 'monthly':
        return plan.pricing.monthly;
      case 'quarterly':
        return plan.pricing.quarterly;
      case 'semiAnnual':
        return plan.pricing.semiAnnual;
      case 'annual':
        return plan.pricing.annual;
      default:
        return plan.pricing.monthly;
    }
  }

  calculateOrderStats(orders: any): any {
    const stats = {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      revenue: 0,
    };

    Object.values(orders).forEach((order: any) => {
      stats.total++;
      if (order.status === 'pending') stats.pending++;
      if (order.status === 'processing') stats.processing++;
      if (order.status === 'completed') {
        stats.completed++;
        stats.revenue += order.total || 0;
      }
    });

    return stats;
  }

  async createPaymentRecord(userId: string, application: VendorApplicationForm) {
    const paymentRecord = {
      vendorId: userId,
      applicationId: application.paymentProof.transactionReference,
      plan: application.subscriptionPlan,
      amount: application.paymentProof.amount,
      currency: application.paymentProof.currency,
      method: application.paymentProof.paymentMethod,
      status: 'pending_verification',
      createdAt: serverTimestamp(),
    };

    await setDoc(
      doc(collection(db, 'vendor_payments')),
      paymentRecord
    );
  }

  async sendApplicationReceivedEmail(userId: string, application: VendorApplicationForm) {
    const vendorDoc = await getDoc(doc(db, 'vendors', userId));
    const vendorData = vendorDoc.data();

    await this.emailService.sendEmail({
      to: vendorData?.email,
      subject: 'Application Received - Souk El-Sayarat',
      template: 'application-received',
      data: {
        businessName: application.businessInfo.businessName,
        plan: application.subscriptionPlan.name,
        nextSteps: [
          'Your payment is being verified',
          'Admin will review your application within 24-48 hours',
          'You will receive an email with the decision',
        ],
      },
    });
  }

  async sendDecisionEmail(
    vendorId: string,
    decision: string,
    notes?: string,
    conditions?: string[]
  ) {
    const vendorDoc = await getDoc(doc(db, 'vendors', vendorId));
    const vendorData = vendorDoc.data();

    await this.emailService.sendEmail({
      to: vendorData?.email,
      subject: `Application ${decision === 'approve' ? 'Approved' : decision === 'reject' ? 'Rejected' : 'Needs More Information'} - Souk El-Sayarat`,
      template: `application-${decision}`,
      data: {
        vendorName: vendorData?.firstName,
        decision,
        notes,
        conditions,
        dashboardUrl: decision === 'approve' ? '/vendor/dashboard' : undefined,
      },
    });
  }

  async notifyAdminsOfNewSignup(data: VendorSignupRequest) {
    // Get all admin users
    const adminsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'admin')
    );
    
    const adminsSnapshot = await adminsQuery.get();
    
    // Send notification to each admin
    adminsSnapshot.forEach(async (adminDoc) => {
      const adminData = adminDoc.data();
      
      // Email notification
      await this.emailService.sendEmail({
        to: adminData.email,
        subject: 'New Vendor Signup - Action Required',
        template: 'admin-new-signup',
        data: {
          vendorName: `${data.firstName} ${data.lastName}`,
          vendorEmail: data.email,
          businessType: data.intendedBusinessType,
          dashboardUrl: '/admin/vendor-applications',
        },
      });

      // In-app notification
      await this.notificationService.createNotification({
        userId: adminDoc.id,
        type: 'vendor_signup',
        title: 'New Vendor Signup',
        message: `${data.firstName} ${data.lastName} has signed up as a vendor`,
        priority: 'medium',
        actionUrl: '/admin/vendor-applications',
      });
    });
  }

  async notifyAdminsOfNewApplication(userId: string, application: VendorApplicationForm) {
    const adminsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'admin')
    );
    
    const adminsSnapshot = await adminsQuery.get();
    
    adminsSnapshot.forEach(async (adminDoc) => {
      const adminData = adminDoc.data();
      
      await this.emailService.sendEmail({
        to: adminData.email,
        subject: 'New Vendor Application - Review Required',
        template: 'admin-new-application',
        data: {
          businessName: application.businessInfo.businessName,
          plan: application.subscriptionPlan.name,
          paymentAmount: application.paymentProof.amount,
          reviewUrl: `/admin/vendor-applications/${userId}`,
        },
      });
    });
  }

  async initializeVendorAnalytics(vendorId: string) {
    const analyticsData = {
      vendorId,
      metrics: {
        daily: {},
        weekly: {},
        monthly: {},
        yearly: {},
      },
      products: {
        views: 0,
        clicks: 0,
        favorites: 0,
        shares: 0,
      },
      customers: {
        total: 0,
        new: 0,
        returning: 0,
      },
      revenue: {
        total: 0,
        pending: 0,
        completed: 0,
      },
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'vendor_analytics', vendorId), analyticsData);
  }

  async setupVendorPaymentAccount(vendorId: string) {
    const application = await getDoc(doc(db, 'vendor_applications', vendorId));
    const appData = application.data();

    const paymentAccount = {
      vendorId,
      bankInfo: appData?.bankInfo,
      balance: 0,
      pendingBalance: 0,
      withdrawals: [],
      transactions: [],
      commissionRate: appData?.subscriptionPlan.features.commissionRate,
      transactionFee: appData?.subscriptionPlan.features.transactionFee,
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'vendor_payment_accounts', vendorId), paymentAccount);
  }

  // Cleanup listeners
  cleanup() {
    this.realtimeListeners.forEach(unsubscribe => unsubscribe());
    this.realtimeListeners.clear();
  }
}

export const vendorOnboardingService = VendorOnboardingService.getInstance();