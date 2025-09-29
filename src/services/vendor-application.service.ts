import { sendEmail } from '@/utils/replitmail';

export interface VendorApplicationData {
  businessName: string;
  businessType: string;
  description: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  whatsappNumber?: string;
  address: {
    street: string;
    city: string;
    governorate: string;
    postalCode?: string;
  };
  businessLicense: string;
  taxId?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  experience: string;
  specializations: string[];
  expectedMonthlyVolume: string;
  subscriptionPlan: 'basic' | 'premium' | 'enterprise';
  documents: File[];
  instapayReceipt?: File;
  agreeToTerms: boolean;
}

export interface VendorApplication {
  id: string;
  userId: string;
  applicationData: VendorApplicationData;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewComments?: string;
}

class VendorApplicationService {
  private applications: Map<string, VendorApplication> = new Map();
  private adminEmail = 'admin@soukel-syarat.com';

  // Submit vendor application
  async submitApplication(userId: string, applicationData: VendorApplicationData): Promise<string> {
    const applicationId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const application: VendorApplication = {
      id: applicationId,
      userId,
      applicationData,
      status: 'pending',
      submittedAt: new Date(),
    };

    this.applications.set(applicationId, application);

    // Send notification email to admin
    try {
      await sendEmail({
        to: this.adminEmail,
        subject: `New Vendor Application - ${applicationData.businessName}`,
        html: `
          <h2>New Vendor Application Received</h2>
          <p><strong>Business Name:</strong> ${applicationData.businessName}</p>
          <p><strong>Contact Person:</strong> ${applicationData.contactPerson}</p>
          <p><strong>Email:</strong> ${applicationData.email}</p>
          <p><strong>Phone:</strong> ${applicationData.phoneNumber}</p>
          <p><strong>Business Type:</strong> ${applicationData.businessType}</p>
          <p><strong>Subscription Plan:</strong> ${applicationData.subscriptionPlan}</p>
          <p><strong>Submitted At:</strong> ${application.submittedAt.toLocaleString()}</p>
          
          <p>Please review the application in the admin dashboard.</p>
        `,
        text: `New vendor application from ${applicationData.businessName} (${applicationData.contactPerson}). Please review in admin dashboard.`
      });
    } catch (error) {
      console.warn('Failed to send admin notification:', error);
    }

    return applicationId;
  }

  // Get all applications (admin only)
  getAllApplications(): VendorApplication[] {
    return Array.from(this.applications.values()).sort((a, b) => 
      b.submittedAt.getTime() - a.submittedAt.getTime()
    );
  }

  // Get application by ID
  getApplication(applicationId: string): VendorApplication | undefined {
    return this.applications.get(applicationId);
  }

  // Get applications by user ID
  getUserApplications(userId: string): VendorApplication[] {
    return Array.from(this.applications.values())
      .filter(app => app.userId === userId)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  // Approve application
  async approveApplication(applicationId: string, reviewedBy: string, comments?: string): Promise<void> {
    const application = this.applications.get(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    application.status = 'approved';
    application.reviewedAt = new Date();
    application.reviewedBy = reviewedBy;
    application.reviewComments = comments;

    // Send approval email to vendor
    try {
      await sendEmail({
        to: application.applicationData.email,
        subject: 'تم قبول طلب انضمامك كتاجر - Vendor Application Approved',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>مبروك! تم قبول طلب انضمامك</h2>
            <p>عزيزي ${application.applicationData.contactPerson},</p>
            <p>نتشرف بإعلامك أنه تم قبول طلب انضمامك كتاجر في سوق السيارات.</p>
            <p><strong>اسم النشاط:</strong> ${application.applicationData.businessName}</p>
            <p><strong>نوع الاشتراك:</strong> ${application.applicationData.subscriptionPlan}</p>
            
            <h3>الخطوات التالية:</h3>
            <ul>
              <li>يمكنك الآن تسجيل الدخول إلى لوحة التاجر</li>
              <li>ابدأ في إضافة منتجاتك وخدماتك</li>
              <li>قم بتحديث ملفك التجاري</li>
              <li>استفد من جميع مزايا النظام</li>
            </ul>
            
            <p>مرحباً بك في عائلة سوق السيارات!</p>
            ${comments ? `<p><strong>ملاحظات:</strong> ${comments}</p>` : ''}
          </div>
          
          <hr style="margin: 20px 0;">
          
          <div style="font-family: Arial, sans-serif;">
            <h2>Congratulations! Your Application is Approved</h2>
            <p>Dear ${application.applicationData.contactPerson},</p>
            <p>We are pleased to inform you that your vendor application has been approved.</p>
            <p><strong>Business Name:</strong> ${application.applicationData.businessName}</p>
            <p><strong>Subscription Plan:</strong> ${application.applicationData.subscriptionPlan}</p>
            
            <h3>Next Steps:</h3>
            <ul>
              <li>You can now access your vendor dashboard</li>
              <li>Start adding your products and services</li>
              <li>Update your business profile</li>
              <li>Enjoy all system features</li>
            </ul>
            
            <p>Welcome to the Souk El-Syarat family!</p>
          </div>
        `,
        text: `مبروك! تم قبول طلب انضمامك كتاجر في سوق السيارات. يمكنك الآن الدخول إلى لوحة التاجر وبدء إضافة منتجاتك.`
      });
    } catch (error) {
      console.warn('Failed to send approval email:', error);
    }
  }

  // Reject application
  async rejectApplication(applicationId: string, reviewedBy: string, comments: string): Promise<void> {
    const application = this.applications.get(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    application.status = 'rejected';
    application.reviewedAt = new Date();
    application.reviewedBy = reviewedBy;
    application.reviewComments = comments;

    // Send rejection email to vendor
    try {
      await sendEmail({
        to: application.applicationData.email,
        subject: 'تحديث بخصوص طلب الانضمام - Application Update',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif;">
            <h2>تحديث بخصوص طلب انضمامك</h2>
            <p>عزيزي ${application.applicationData.contactPerson},</p>
            <p>نشكرك على اهتمامك بالانضمام إلى سوق السيارات.</p>
            <p>للأسف، لا يمكننا قبول طلبك في الوقت الحالي للأسباب التالية:</p>
            <p><strong>الأسباب:</strong> ${comments}</p>
            
            <p>يمكنك إعادة تقديم الطلب بعد معالجة هذه النقاط.</p>
            <p>نتطلع للعمل معك في المستقبل.</p>
          </div>
          
          <hr style="margin: 20px 0;">
          
          <div style="font-family: Arial, sans-serif;">
            <h2>Application Update</h2>
            <p>Dear ${application.applicationData.contactPerson},</p>
            <p>Thank you for your interest in joining Souk El-Syarat.</p>
            <p>Unfortunately, we cannot approve your application at this time for the following reasons:</p>
            <p><strong>Reason:</strong> ${comments}</p>
            
            <p>You may resubmit your application after addressing these points.</p>
            <p>We look forward to working with you in the future.</p>
          </div>
        `,
        text: `نشكرك على اهتمامك بالانضمام. للأسف لا يمكننا قبول طلبك حالياً. الأسباب: ${comments}`
      });
    } catch (error) {
      console.warn('Failed to send rejection email:', error);
    }
  }

  // Get application statistics
  getApplicationStats() {
    const applications = Array.from(this.applications.values());
    return {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      approved: applications.filter(app => app.status === 'approved').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
    };
  }
}

export const vendorApplicationService = new VendorApplicationService();