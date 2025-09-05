/**
 * Firebase Functions for Email Services
 * Handles all email notifications and communications
 */

import { onCall, onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as nodemailer from 'nodemailer';
import * as logger from 'firebase-functions/logger';

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const auth = getAuth();

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password',
  },
};

const transporter = nodemailer.createTransporter(emailConfig);

// Email templates
const emailTemplates = {
  welcome: {
    subject: (name: string, language: string) => 
      language === 'ar' ? `مرحباً ${name} - مرحباً بك في سوق السيارات` : `Welcome ${name} - Welcome to Souk El-Syarat`,
    html: (name: string, language: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${language === 'ar' ? 'مرحباً بك في سوق السيارات' : 'Welcome to Souk El-Syarat'}</h2>
        <p>${language === 'ar' ? `مرحباً ${name}،` : `Hello ${name},`}</p>
        <p>${language === 'ar' ? 'نحن سعداء لانضمامك إلى منصتنا. يمكنك الآن استكشاف آلاف السيارات والمنتجات المتاحة.' : 'We are excited to have you join our platform. You can now explore thousands of cars and products available.'}</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${language === 'ar' ? 'الخطوات التالية:' : 'Next Steps:'}</h3>
          <ul>
            <li>${language === 'ar' ? 'اكمل ملفك الشخصي' : 'Complete your profile'}</li>
            <li>${language === 'ar' ? 'استكشف المنتجات' : 'Explore products'}</li>
            <li>${language === 'ar' ? 'ابدأ التسوق' : 'Start shopping'}</li>
          </ul>
        </div>
        <p>${language === 'ar' ? 'شكراً لاختيارك سوق السيارات!' : 'Thank you for choosing Souk El-Syarat!'}</p>
      </div>
    `
  },

  orderConfirmation: {
    subject: (orderId: string, language: string) => 
      language === 'ar' ? `تأكيد الطلب #${orderId}` : `Order Confirmation #${orderId}`,
    html: (order: any, language: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${language === 'ar' ? 'تأكيد الطلب' : 'Order Confirmation'}</h2>
        <p>${language === 'ar' ? `مرحباً ${order.customerName}،` : `Hello ${order.customerName},`}</p>
        <p>${language === 'ar' ? 'تم تأكيد طلبك بنجاح. إليك تفاصيل طلبك:' : 'Your order has been confirmed successfully. Here are your order details:'}</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}</h3>
          <p><strong>${language === 'ar' ? 'رقم الطلب:' : 'Order Number:'}</strong> #${order.id}</p>
          <p><strong>${language === 'ar' ? 'التاريخ:' : 'Date:'}</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>${language === 'ar' ? 'المجموع:' : 'Total:'}</strong> EGP ${order.total.toLocaleString()}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${language === 'ar' ? 'عناصر الطلب' : 'Order Items'}</h3>
          ${order.items.map((item: any) => `
            <div style="border-bottom: 1px solid #e5e7eb; padding: 10px 0;">
              <p><strong>${item.name}</strong></p>
              <p>${language === 'ar' ? 'الكمية:' : 'Quantity:'} ${item.quantity} | ${language === 'ar' ? 'السعر:' : 'Price:'} EGP ${item.price.toLocaleString()}</p>
            </div>
          `).join('')}
        </div>

        <p>${language === 'ar' ? 'سنقوم بإرسال تحديثات حول حالة طلبك عبر البريد الإلكتروني.' : 'We will send you updates about your order status via email.'}</p>
      </div>
    `
  },

  orderStatusUpdate: {
    subject: (orderId: string, status: string, language: string) => 
      language === 'ar' ? `تحديث حالة الطلب #${orderId}` : `Order Status Update #${orderId}`,
    html: (order: any, status: string, language: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${language === 'ar' ? 'تحديث حالة الطلب' : 'Order Status Update'}</h2>
        <p>${language === 'ar' ? `مرحباً ${order.customerName}،` : `Hello ${order.customerName},`}</p>
        <p>${language === 'ar' ? 'تم تحديث حالة طلبك:' : 'Your order status has been updated:'}</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${language === 'ar' ? 'حالة الطلب الجديدة' : 'New Order Status'}</h3>
          <p><strong>${language === 'ar' ? 'رقم الطلب:' : 'Order Number:'}</strong> #${order.id}</p>
          <p><strong>${language === 'ar' ? 'الحالة:' : 'Status:'}</strong> ${getStatusText(status, language)}</p>
          <p><strong>${language === 'ar' ? 'التاريخ:' : 'Date:'}</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <p>${language === 'ar' ? 'يمكنك تتبع طلبك من خلال حسابك الشخصي.' : 'You can track your order through your personal account.'}</p>
      </div>
    `
  },

  vendorApplication: {
    subject: (businessName: string, language: string) => 
      language === 'ar' ? `طلب انضمام ${businessName}` : `Vendor Application from ${businessName}`,
    html: (application: any, language: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${language === 'ar' ? 'طلب انضمام تاجر جديد' : 'New Vendor Application'}</h2>
        <p>${language === 'ar' ? 'تم استلام طلب انضمام تاجر جديد:' : 'A new vendor application has been received:'}</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${language === 'ar' ? 'تفاصيل الطلب' : 'Application Details'}</h3>
          <p><strong>${language === 'ar' ? 'اسم الشركة:' : 'Business Name:'}</strong> ${application.businessName}</p>
          <p><strong>${language === 'ar' ? 'نوع النشاط:' : 'Business Type:'}</strong> ${application.businessType}</p>
          <p><strong>${language === 'ar' ? 'الشخص المسؤول:' : 'Contact Person:'}</strong> ${application.contactPerson}</p>
          <p><strong>${language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</strong> ${application.email}</p>
          <p><strong>${language === 'ar' ? 'رقم الهاتف:' : 'Phone:'}</strong> ${application.phoneNumber}</p>
          <p><strong>${language === 'ar' ? 'التاريخ:' : 'Date:'}</strong> ${new Date(application.submittedAt).toLocaleDateString()}</p>
        </div>

        <p>${language === 'ar' ? 'يرجى مراجعة الطلب والرد عليه في أقرب وقت ممكن.' : 'Please review the application and respond as soon as possible.'}</p>
      </div>
    `
  },

  vendorApplicationStatus: {
    subject: (businessName: string, status: string, language: string) => 
      language === 'ar' ? `حالة طلب الانضمام - ${businessName}` : `Vendor Application Status - ${businessName}`,
    html: (application: any, status: string, language: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${language === 'ar' ? 'حالة طلب الانضمام' : 'Vendor Application Status'}</h2>
        <p>${language === 'ar' ? `مرحباً ${application.contactPerson}،` : `Hello ${application.contactPerson},`}</p>
        <p>${language === 'ar' ? 'تم تحديث حالة طلب انضمامك:' : 'Your vendor application status has been updated:'}</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${language === 'ar' ? 'حالة الطلب' : 'Application Status'}</h3>
          <p><strong>${language === 'ar' ? 'اسم الشركة:' : 'Business Name:'}</strong> ${application.businessName}</p>
          <p><strong>${language === 'ar' ? 'الحالة:' : 'Status:'}</strong> ${getApplicationStatusText(status, language)}</p>
          <p><strong>${language === 'ar' ? 'التاريخ:' : 'Date:'}</strong> ${new Date().toLocaleDateString()}</p>
          ${application.reviewNotes ? `<p><strong>${language === 'ar' ? 'ملاحظات:' : 'Notes:'}</strong> ${application.reviewNotes}</p>` : ''}
        </div>

        ${status === 'approved' ? `
          <p>${language === 'ar' ? 'مبروك! تم قبول طلبك. يمكنك الآن تسجيل الدخول إلى لوحة تحكم التاجر وبدء إضافة منتجاتك.' : 'Congratulations! Your application has been approved. You can now log in to the vendor dashboard and start adding your products.'}</p>
        ` : status === 'rejected' ? `
          <p>${language === 'ar' ? 'نأسف لإبلاغك بأن طلبك لم يتم قبوله في هذا الوقت. يمكنك إعادة التقديم بعد 30 يوم.' : 'We regret to inform you that your application was not approved at this time. You can reapply after 30 days.'}</p>
        ` : ''}
      </div>
    `
  },

  passwordReset: {
    subject: (language: string) => 
      language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Password Reset',
    html: (resetLink: string, language: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Password Reset'}</h2>
        <p>${language === 'ar' ? 'تم طلب إعادة تعيين كلمة المرور لحسابك.' : 'A password reset has been requested for your account.'}</p>
        <p>${language === 'ar' ? 'انقر على الرابط أدناه لإعادة تعيين كلمة المرور:' : 'Click the link below to reset your password:'}</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            ${language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
          </a>
        </div>

        <p>${language === 'ar' ? 'إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني.' : 'If you did not request a password reset, you can ignore this email.'}</p>
        <p>${language === 'ar' ? 'هذا الرابط صالح لمدة 24 ساعة.' : 'This link is valid for 24 hours.'}</p>
      </div>
    `
  }
};

// Helper functions
function getStatusText(status: string, language: string): string {
  const statusMap: Record<string, { ar: string; en: string }> = {
    pending: { ar: 'قيد الانتظار', en: 'Pending' },
    confirmed: { ar: 'مؤكد', en: 'Confirmed' },
    processing: { ar: 'قيد المعالجة', en: 'Processing' },
    shipped: { ar: 'تم الشحن', en: 'Shipped' },
    delivered: { ar: 'تم التسليم', en: 'Delivered' },
    cancelled: { ar: 'ملغي', en: 'Cancelled' }
  };
  return statusMap[status]?.[language] || status;
}

function getApplicationStatusText(status: string, language: string): string {
  const statusMap: Record<string, { ar: string; en: string }> = {
    pending: { ar: 'قيد المراجعة', en: 'Under Review' },
    approved: { ar: 'مقبول', en: 'Approved' },
    rejected: { ar: 'مرفوض', en: 'Rejected' }
  };
  return statusMap[status]?.[ar] || status;
}

// Email sending function
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@soukelsyarat.com',
      to,
      subject,
      html,
    });
    logger.info(`Email sent successfully to ${to}`);
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
}

// Get user language preference
async function getUserLanguage(userId: string): Promise<string> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      return userData?.preferences?.language || 'ar';
    }
    return 'ar';
  } catch (error) {
    logger.error('Error getting user language:', error);
    return 'ar';
  }
}

// Cloud Functions

// Send welcome email when user registers
export const sendWelcomeEmail = onDocumentCreated(
  {
    document: 'users/{userId}',
    region: 'us-central1',
  },
  async (event) => {
    const userData = event.data?.data();
    if (!userData) return;

    try {
      const language = userData.preferences?.language || 'ar';
      const template = emailTemplates.welcome;
      
      await sendEmail(
        userData.email,
        template.subject(userData.displayName || userData.name, language),
        template.html(userData.displayName || userData.name, language)
      );
    } catch (error) {
      logger.error('Error sending welcome email:', error);
    }
  }
);

// Send order confirmation email
export const sendOrderConfirmationEmail = onDocumentCreated(
  {
    document: 'orders/{orderId}',
    region: 'us-central1',
  },
  async (event) => {
    const orderData = event.data?.data();
    if (!orderData) return;

    try {
      const language = await getUserLanguage(orderData.customerId);
      const template = emailTemplates.orderConfirmation;
      
      await sendEmail(
        orderData.customerEmail,
        template.subject(orderData.id, language),
        template.html(orderData, language)
      );
    } catch (error) {
      logger.error('Error sending order confirmation email:', error);
    }
  }
);

// Send order status update email
export const sendOrderStatusUpdateEmail = onDocumentUpdated(
  {
    document: 'orders/{orderId}',
    region: 'us-central1',
  },
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    
    if (!beforeData || !afterData) return;
    
    // Only send email if status changed
    if (beforeData.status === afterData.status) return;

    try {
      const language = await getUserLanguage(afterData.customerId);
      const template = emailTemplates.orderStatusUpdate;
      
      await sendEmail(
        afterData.customerEmail,
        template.subject(afterData.id, afterData.status, language),
        template.html(afterData, afterData.status, language)
      );
    } catch (error) {
      logger.error('Error sending order status update email:', error);
    }
  }
);

// Send vendor application notification to admin
export const sendVendorApplicationEmail = onDocumentCreated(
  {
    document: 'vendor_applications/{applicationId}',
    region: 'us-central1',
  },
  async (event) => {
    const applicationData = event.data?.data();
    if (!applicationData) return;

    try {
      const language = 'ar'; // Admin emails in Arabic
      const template = emailTemplates.vendorApplication;
      
      // Send to admin email
      await sendEmail(
        process.env.ADMIN_EMAIL || 'admin@soukelsyarat.com',
        template.subject(applicationData.businessName, language),
        template.html(applicationData, language)
      );
    } catch (error) {
      logger.error('Error sending vendor application email:', error);
    }
  }
);

// Send vendor application status update
export const sendVendorApplicationStatusEmail = onDocumentUpdated(
  {
    document: 'vendor_applications/{applicationId}',
    region: 'us-central1',
  },
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    
    if (!beforeData || !afterData) return;
    
    // Only send email if status changed
    if (beforeData.status === afterData.status) return;

    try {
      const language = await getUserLanguage(afterData.userId);
      const template = emailTemplates.vendorApplicationStatus;
      
      await sendEmail(
        afterData.email,
        template.subject(afterData.businessName, afterData.status, language),
        template.html(afterData, afterData.status, language)
      );
    } catch (error) {
      logger.error('Error sending vendor application status email:', error);
    }
  }
);

// Send password reset email (HTTP callable)
export const sendPasswordResetEmail = onCall(
  {
    region: 'us-central1',
  },
  async (request) => {
    const { email, resetLink } = request.data;
    
    if (!email || !resetLink) {
      throw new Error('Email and reset link are required');
    }

    try {
      const language = 'ar'; // Default to Arabic
      const template = emailTemplates.passwordReset;
      
      await sendEmail(
        email,
        template.subject(language),
        template.html(resetLink, language)
      );
      
      return { success: true };
    } catch (error) {
      logger.error('Error sending password reset email:', error);
      throw error;
    }
  }
);

// Send custom email (HTTP callable)
export const sendCustomEmail = onCall(
  {
    region: 'us-central1',
  },
  async (request) => {
    const { to, subject, html, language = 'ar' } = request.data;
    
    if (!to || !subject || !html) {
      throw new Error('To, subject, and html are required');
    }

    try {
      await sendEmail(to, subject, html);
      return { success: true };
    } catch (error) {
      logger.error('Error sending custom email:', error);
      throw error;
    }
  }
);

// Test email function
export const testEmail = onRequest(
  {
    region: 'us-central1',
  },
  async (req, res) => {
    try {
      const { to = 'test@example.com' } = req.query;
      
      await sendEmail(
        to as string,
        'Test Email from Souk El-Syarat',
        '<h1>Test Email</h1><p>This is a test email from Souk El-Syarat.</p>'
      );
      
      res.json({ success: true, message: 'Test email sent successfully' });
    } catch (error) {
      logger.error('Error sending test email:', error);
      res.status(500).json({ error: 'Failed to send test email' });
    }
  }
);