import { sendEmail } from '@/utils/replitmail';
import { notificationService } from './notification.service';
import { useAuthStore } from '@/stores/authStore';

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
  documentsUploaded: string[];
  invoiceScreenshot?: string;
}

class VendorApplicationService {
  private applications: Map<string, VendorApplication> = new Map();
  private adminEmail = 'admin@soukel-syarat.com';

  // Submit vendor application
  async submitApplication(userId: string, applicationData: VendorApplicationData, documents?: File[], invoiceScreenshot?: File): Promise<string> {
    const applicationId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Handle file uploads (mock implementation)
    const documentsUploaded: string[] = [];
    let invoiceUrl: string | undefined;
    
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        // In a real implementation, upload to cloud storage
        const docUrl = `uploads/documents/${applicationId}/${doc.name}`;
        documentsUploaded.push(docUrl);
      }
    }
    
    if (invoiceScreenshot) {
      invoiceUrl = `uploads/invoices/${applicationId}/${invoiceScreenshot.name}`;
    }
    
    const application: VendorApplication = {
      id: applicationId,
      userId,
      applicationData,
      status: 'pending',
      submittedAt: new Date(),
      documentsUploaded,
      invoiceScreenshot: invoiceUrl,
    };

    this.applications.set(applicationId, application);

    // Send notification email to admin
    try {
      await sendEmail({
        to: this.adminEmail,
        subject: `🔔 طلب انضمام تاجر جديد - New Vendor Application: ${applicationData.businessName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
              <h1>طلب انضمام تاجر جديد</h1>
              <h2>New Vendor Application</h2>
            </div>
            
            <div style="padding: 20px; background-color: #f9f9f9;">
              <h3>تفاصيل الطلب - Application Details</h3>
              
              <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p><strong>🏢 اسم النشاط | Business Name:</strong> ${applicationData.businessName}</p>
                <p><strong>👤 الشخص المسؤول | Contact Person:</strong> ${applicationData.contactPerson}</p>
                <p><strong>📧 البريد الإلكتروني | Email:</strong> ${applicationData.email}</p>
                <p><strong>📱 رقم الهاتف | Phone:</strong> ${applicationData.phoneNumber}</p>
                <p><strong>🏷️ نوع النشاط | Business Type:</strong> ${applicationData.businessType}</p>
                <p><strong>💼 خطة الاشتراك | Subscription:</strong> ${applicationData.subscriptionPlan}</p>
                <p><strong>📍 المحافظة | Governorate:</strong> ${applicationData.address.governorate}</p>
                <p><strong>🎯 التخصصات | Specializations:</strong> ${applicationData.specializations.join(', ')}</p>
              </div>
              
              <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h4>📄 المستندات المرفقة | Attached Documents</h4>
                <p><strong>📋 رقم السجل التجاري | Business License:</strong> ${applicationData.businessLicense}</p>
                ${applicationData.taxId ? `<p><strong>🧾 الرقم الضريبي | Tax ID:</strong> ${applicationData.taxId}</p>` : ''}
                <p><strong>📁 عدد المستندات | Documents Count:</strong> ${documentsUploaded.length}</p>
                ${invoiceUrl ? '<p><strong>🧾 صورة الفاتورة | Invoice Screenshot:</strong> ✅ مرفقة</p>' : '<p><strong>🧾 صورة الفاتورة | Invoice Screenshot:</strong> ❌ غير مرفقة</p>'}
              </div>
              
              <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h4>📊 معلومات إضافية | Additional Information</h4>
                <p><strong>🎓 سنوات الخبرة | Experience:</strong> ${applicationData.experience}</p>
                <p><strong>💰 الحجم المتوقع | Expected Volume:</strong> ${applicationData.expectedMonthlyVolume}</p>
                <p><strong>🕐 تاريخ التقديم | Submitted At:</strong> ${application.submittedAt.toLocaleString('ar-EG')}</p>
              </div>
              
              <div style="background: #e3f2fd; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #2196f3;">
                <h4>📝 وصف النشاط | Business Description</h4>
                <p style="line-height: 1.6;">${applicationData.description}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 16px; color: #666;">
                  يرجى مراجعة الطلب في لوحة تحكم الإدارة<br>
                  Please review this application in the admin dashboard
                </p>
                <div style="margin: 20px 0;">
                  <a href="#" style="background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 0 10px;">✅ موافقة | Approve</a>
                  <a href="#" style="background: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 0 10px;">❌ رفض | Reject</a>
                </div>
              </div>
            </div>
            
            <div style="background: #333; color: white; padding: 15px; text-align: center;">
              <p style="margin: 0;">سوق السيارات - إدارة النظام | Souk El-Syarat - System Administration</p>
            </div>
          </div>
        `,
        text: `طلب انضمام تاجر جديد من ${applicationData.businessName} (${applicationData.contactPerson}). يرجى المراجعة في لوحة تحكم الإدارة.`
      });
      
      // Send internal notification to admin
      await notificationService.sendNotification('admin', {
        title: '🔔 طلب انضمام تاجر جديد',
        message: `تم تقديم طلب انضمام جديد من ${applicationData.businessName}`,
        type: 'vendor_application',
        data: { applicationId, businessName: applicationData.businessName }
      });
      
    } catch (error) {
      console.warn('Failed to send admin notification:', error);
    }

    // Send confirmation to applicant
    try {
      await sendEmail({
        to: applicationData.email,
        subject: 'تأكيد استلام طلب الانضمام - Application Received Confirmation',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
              <h1>شكراً لك!</h1>
              <h2>Thank You!</h2>
            </div>
            
            <div style="padding: 20px;" dir="rtl">
              <h3>عزيزي ${applicationData.contactPerson},</h3>
              <p>تم استلام طلب انضمامك كتاجر في سوق السيارات بنجاح.</p>
              
              <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4>تفاصيل طلبك:</h4>
                <p><strong>رقم الطلب:</strong> ${applicationId}</p>
                <p><strong>اسم النشاط:</strong> ${applicationData.businessName}</p>
                <p><strong>نوع النشاط:</strong> ${applicationData.businessType}</p>
                <p><strong>تاريخ التقديم:</strong> ${application.submittedAt.toLocaleString('ar-EG')}</p>
              </div>
              
              <h4>الخطوات التالية:</h4>
              <ul>
                <li>سيتم مراجعة طلبك من قبل فريق الإدارة</li>
                <li>قد تستغرق عملية المراجعة 3-5 أيام عمل</li>
                <li>سنتواصل معك عبر البريد الإلكتروني أو الهاتف</li>
                <li>يمكنك متابعة حالة طلبك من خلال حسابك</li>
              </ul>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>ملاحظة مهمة:</strong> تأكد من أن جميع المستندات المطلوبة مرفقة ومقروءة بوضوح لتسريع عملية المراجعة.</p>
              </div>
            </div>
            
            <hr style="margin: 30px 0;">
            
            <div style="padding: 20px;">
              <h3>Dear ${applicationData.contactPerson},</h3>
              <p>Your vendor application has been successfully received.</p>
              
              <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4>Application Details:</h4>
                <p><strong>Application ID:</strong> ${applicationId}</p>
                <p><strong>Business Name:</strong> ${applicationData.businessName}</p>
                <p><strong>Business Type:</strong> ${applicationData.businessType}</p>
                <p><strong>Submitted:</strong> ${application.submittedAt.toLocaleString()}</p>
              </div>
              
              <h4>Next Steps:</h4>
              <ul>
                <li>Your application will be reviewed by our admin team</li>
                <li>Review process may take 3-5 business days</li>
                <li>We will contact you via email or phone</li>
                <li>You can track your application status in your account</li>
              </ul>
            </div>
          </div>
        `,
        text: `شكراً لتقديم طلب الانضمام. رقم طلبك: ${applicationId}. سيتم المراجعة خلال 3-5 أيام عمل.`
      });
    } catch (error) {
      console.warn('Failed to send confirmation email:', error);
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

    // Update user role to vendor in auth store
    const { setUser, user } = useAuthStore.getState();
    if (user && user.id === application.userId) {
      setUser({ ...user, role: 'vendor' });
    }

    // Send approval email to vendor
    try {
      await sendEmail({
        to: application.applicationData.email,
        subject: '🎉 مبروك! تم قبول طلب انضمامك - Congratulations! Your Application is Approved',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 20px; text-align: center;">
              <h1>🎉 مبروك!</h1>
              <h2>🎉 Congratulations!</h2>
              <p style="font-size: 18px; margin: 10px 0;">تم قبول طلب انضمامك كتاجر</p>
              <p style="font-size: 16px;">Your vendor application has been approved!</p>
            </div>
            
            <div style="padding: 20px;" dir="rtl">
              <h3>عزيزي ${application.applicationData.contactPerson},</h3>
              <p style="font-size: 16px; line-height: 1.6;">
                نتشرف بإعلامك أنه تم قبول طلب انضمامك كتاجر في سوق السيارات بنجاح! 🚀
              </p>
              
              <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                <h4>🏢 تفاصيل نشاطك المعتمد:</h4>
                <p><strong>اسم النشاط:</strong> ${application.applicationData.businessName}</p>
                <p><strong>نوع النشاط:</strong> ${application.applicationData.businessType}</p>
                <p><strong>خطة الاشتراك:</strong> ${application.applicationData.subscriptionPlan}</p>
                <p><strong>التخصصات:</strong> ${application.applicationData.specializations.join(', ')}</p>
                ${comments ? `<p><strong>ملاحظات الإدارة:</strong> ${comments}</p>` : ''}
              </div>
              
              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4>🚀 الخطوات التالية - ابدأ رحلتك الآن!</h4>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                  <p>✅ <strong>1. ادخل إلى لوحة التاجر:</strong> يمكنك الآن الوصول إلى لوحة تحكم التاجر الخاصة بك</p>
                  <p>✅ <strong>2. أكمل ملفك التجاري:</strong> أضف شعار نشاطك وحدث معلوماتك</p>
                  <p>✅ <strong>3. ابدأ إضافة المنتجات:</strong> ارفع صور منتجاتك وأسعارها</p>
                  <p>✅ <strong>4. إدارة المتجر:</strong> راقب الطلبات والمبيعات</p>
                  <p>✅ <strong>5. استفد من كافة المزايا:</strong> أدوات التسويق والتحليلات</p>
                </div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="/vendor/dashboard" style="background: #4caf50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                  🏪 ادخل إلى لوحة التاجر
                </a>
              </div>
              
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px;">
                <h4>📞 هل تحتاج مساعدة؟</h4>
                <p>فريق الدعم في خدمتك:</p>
                <p>📧 البريد الإلكتروني: support@soukel-syarat.com</p>
                <p>📱 واتساب: +201234567890</p>
                <p>🕐 ساعات العمل: 9 صباحاً - 6 مساءً</p>
              </div>
            </div>
            
            <hr style="margin: 30px 0;">
            
            <div style="padding: 20px;">
              <h3>Dear ${application.applicationData.contactPerson},</h3>
              <p style="font-size: 16px; line-height: 1.6;">
                We are delighted to inform you that your vendor application has been approved! 🚀
              </p>
              
              <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                <h4>🏢 Your Approved Business Details:</h4>
                <p><strong>Business Name:</strong> ${application.applicationData.businessName}</p>
                <p><strong>Business Type:</strong> ${application.applicationData.businessType}</p>
                <p><strong>Subscription Plan:</strong> ${application.applicationData.subscriptionPlan}</p>
                <p><strong>Specializations:</strong> ${application.applicationData.specializations.join(', ')}</p>
                ${comments ? `<p><strong>Admin Notes:</strong> ${comments}</p>` : ''}
              </div>
              
              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4>🚀 Next Steps - Start Your Journey Now!</h4>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                  <p>✅ <strong>1. Access Vendor Dashboard:</strong> You can now access your vendor control panel</p>
                  <p>✅ <strong>2. Complete Your Profile:</strong> Add your business logo and update information</p>
                  <p>✅ <strong>3. Start Adding Products:</strong> Upload your products with images and prices</p>
                  <p>✅ <strong>4. Manage Your Store:</strong> Monitor orders and sales</p>
                  <p>✅ <strong>5. Enjoy All Features:</strong> Marketing tools and analytics</p>
                </div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="/vendor/dashboard" style="background: #4caf50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                  🏪 Access Vendor Dashboard
                </a>
              </div>
            </div>
            
            <div style="background: #333; color: white; padding: 20px; text-align: center;">
              <h3>مرحباً بك في عائلة سوق السيارات! 🎉</h3>
              <h4>Welcome to the Souk El-Syarat Family! 🎉</h4>
              <p style="margin: 10px 0;">نتطلع للعمل معك وتحقيق النجاح سوياً</p>
              <p style="margin: 0;">We look forward to working with you and achieving success together</p>
            </div>
          </div>
        `,
        text: `مبروك! تم قبول طلب انضمامك كتاجر في سوق السيارات. يمكنك الآن الدخول إلى لوحة التاجر وبدء إضافة منتجاتك. رقم الطلب: ${applicationId}`
      });
      
      // Send internal notification to vendor
      await notificationService.sendNotification(application.userId, {
        title: '🎉 تم قبول طلب انضمامك!',
        message: `مبروك! تم قبول طلب انضمامك كتاجر. يمكنك الآن الوصول إلى لوحة التاجر الخاصة بك.`,
        type: 'vendor_approved',
        data: { applicationId, businessName: application.applicationData.businessName }
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