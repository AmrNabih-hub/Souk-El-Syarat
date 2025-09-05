/**
 * Email Service for Souk El-Syarat
 * Handles email communications through Firebase Functions
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase.config';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  variables: string[];
}

export interface SendEmailData {
  to: string;
  subject: string;
  html: string;
  language?: 'ar' | 'en';
}

export interface PasswordResetData {
  email: string;
  resetLink: string;
}

export class EmailService {
  private static instance: EmailService;

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send custom email
   */
  async sendCustomEmail(data: SendEmailData): Promise<boolean> {
    try {
      const sendCustomEmail = httpsCallable(functions, 'sendCustomEmail');
      await sendCustomEmail(data);
      return true;
    } catch (error) {
      console.error('Error sending custom email:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetData): Promise<boolean> {
    try {
      const sendPasswordResetEmail = httpsCallable(functions, 'sendPasswordResetEmail');
      await sendPasswordResetEmail(data);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Test email functionality
   */
  async testEmail(to: string = 'test@example.com'): Promise<boolean> {
    try {
      const testEmail = httpsCallable(functions, 'testEmail');
      await testEmail({ to });
      return true;
    } catch (error) {
      console.error('Error testing email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(userId: string, userEmail: string, userName: string, language: 'ar' | 'en' = 'ar'): Promise<boolean> {
    try {
      const template = this.getWelcomeEmailTemplate(userName, language);
      return await this.sendCustomEmail({
        to: userEmail,
        subject: template.subject,
        html: template.html,
        language
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail(
    customerEmail: string,
    orderId: string,
    orderData: any,
    language: 'ar' | 'en' = 'ar'
  ): Promise<boolean> {
    try {
      const template = this.getOrderConfirmationTemplate(orderId, orderData, language);
      return await this.sendCustomEmail({
        to: customerEmail,
        subject: template.subject,
        html: template.html,
        language
      });
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      throw error;
    }
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdateEmail(
    customerEmail: string,
    orderId: string,
    orderData: any,
    newStatus: string,
    language: 'ar' | 'en' = 'ar'
  ): Promise<boolean> {
    try {
      const template = this.getOrderStatusUpdateTemplate(orderId, orderData, newStatus, language);
      return await this.sendCustomEmail({
        to: customerEmail,
        subject: template.subject,
        html: template.html,
        language
      });
    } catch (error) {
      console.error('Error sending order status update email:', error);
      throw error;
    }
  }

  /**
   * Send vendor application notification to admin
   */
  async sendVendorApplicationNotification(
    adminEmail: string,
    applicationData: any,
    language: 'ar' | 'en' = 'ar'
  ): Promise<boolean> {
    try {
      const template = this.getVendorApplicationTemplate(applicationData, language);
      return await this.sendCustomEmail({
        to: adminEmail,
        subject: template.subject,
        html: template.html,
        language
      });
    } catch (error) {
      console.error('Error sending vendor application notification:', error);
      throw error;
    }
  }

  /**
   * Send vendor application status update
   */
  async sendVendorApplicationStatusUpdate(
    vendorEmail: string,
    applicationData: any,
    status: string,
    language: 'ar' | 'en' = 'ar'
  ): Promise<boolean> {
    try {
      const template = this.getVendorApplicationStatusTemplate(applicationData, status, language);
      return await this.sendCustomEmail({
        to: vendorEmail,
        subject: template.subject,
        html: template.html,
        language
      });
    } catch (error) {
      console.error('Error sending vendor application status update:', error);
      throw error;
    }
  }

  // Email Templates

  private getWelcomeEmailTemplate(userName: string, language: 'ar' | 'en') {
    const subject = language === 'ar' 
      ? `مرحباً ${userName} - مرحباً بك في سوق السيارات`
      : `Welcome ${userName} - Welcome to Souk El-Syarat`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${language === 'ar' ? 'مرحباً بك في سوق السيارات' : 'Welcome to Souk El-Syarat'}</h2>
        <p>${language === 'ar' ? `مرحباً ${userName}،` : `Hello ${userName},`}</p>
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
    `;

    return { subject, html };
  }

  private getOrderConfirmationTemplate(orderId: string, orderData: any, language: 'ar' | 'en') {
    const subject = language === 'ar' 
      ? `تأكيد الطلب #${orderId}`
      : `Order Confirmation #${orderId}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${language === 'ar' ? 'تأكيد الطلب' : 'Order Confirmation'}</h2>
        <p>${language === 'ar' ? `مرحباً ${orderData.customerName}،` : `Hello ${orderData.customerName},`}</p>
        <p>${language === 'ar' ? 'تم تأكيد طلبك بنجاح. إليك تفاصيل طلبك:' : 'Your order has been confirmed successfully. Here are your order details:'}</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}</h3>
          <p><strong>${language === 'ar' ? 'رقم الطلب:' : 'Order Number:'}</strong> #${orderId}</p>
          <p><strong>${language === 'ar' ? 'التاريخ:' : 'Date:'}</strong> ${new Date(orderData.createdAt).toLocaleDateString()}</p>
          <p><strong>${language === 'ar' ? 'المجموع:' : 'Total:'}</strong> EGP ${orderData.total.toLocaleString()}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${language === 'ar' ? 'عناصر الطلب' : 'Order Items'}</h3>
          ${orderData.items.map((item: any) => `
            <div style="border-bottom: 1px solid #e5e7eb; padding: 10px 0;">
              <p><strong>${item.name}</strong></p>
              <p>${language === 'ar' ? 'الكمية:' : 'Quantity:'} ${item.quantity} | ${language === 'ar' ? 'السعر:' : 'Price:'} EGP ${item.price.toLocaleString()}</p>
            </div>
          `).join('')}
        </div>

        <p>${language === 'ar' ? 'سنقوم بإرسال تحديثات حول حالة طلبك عبر البريد الإلكتروني.' : 'We will send you updates about your order status via email.'}</p>
      </div>
    `;

    return { subject, html };
  }

  private getOrderStatusUpdateTemplate(orderId: string, orderData: any, newStatus: string, language: 'ar' | 'en') {
    const subject = language === 'ar' 
      ? `تحديث حالة الطلب #${orderId}`
      : `Order Status Update #${orderId}`;

    const statusText = this.getStatusText(newStatus, language);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${language === 'ar' ? 'تحديث حالة الطلب' : 'Order Status Update'}</h2>
        <p>${language === 'ar' ? `مرحباً ${orderData.customerName}،` : `Hello ${orderData.customerName},`}</p>
        <p>${language === 'ar' ? 'تم تحديث حالة طلبك:' : 'Your order status has been updated:'}</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${language === 'ar' ? 'حالة الطلب الجديدة' : 'New Order Status'}</h3>
          <p><strong>${language === 'ar' ? 'رقم الطلب:' : 'Order Number:'}</strong> #${orderId}</p>
          <p><strong>${language === 'ar' ? 'الحالة:' : 'Status:'}</strong> ${statusText}</p>
          <p><strong>${language === 'ar' ? 'التاريخ:' : 'Date:'}</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <p>${language === 'ar' ? 'يمكنك تتبع طلبك من خلال حسابك الشخصي.' : 'You can track your order through your personal account.'}</p>
      </div>
    `;

    return { subject, html };
  }

  private getVendorApplicationTemplate(applicationData: any, language: 'ar' | 'en') {
    const subject = language === 'ar' 
      ? `طلب انضمام ${applicationData.businessName}`
      : `Vendor Application from ${applicationData.businessName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${language === 'ar' ? 'طلب انضمام تاجر جديد' : 'New Vendor Application'}</h2>
        <p>${language === 'ar' ? 'تم استلام طلب انضمام تاجر جديد:' : 'A new vendor application has been received:'}</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${language === 'ar' ? 'تفاصيل الطلب' : 'Application Details'}</h3>
          <p><strong>${language === 'ar' ? 'اسم الشركة:' : 'Business Name:'}</strong> ${applicationData.businessName}</p>
          <p><strong>${language === 'ar' ? 'نوع النشاط:' : 'Business Type:'}</strong> ${applicationData.businessType}</p>
          <p><strong>${language === 'ar' ? 'الشخص المسؤول:' : 'Contact Person:'}</strong> ${applicationData.contactPerson}</p>
          <p><strong>${language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</strong> ${applicationData.email}</p>
          <p><strong>${language === 'ar' ? 'رقم الهاتف:' : 'Phone:'}</strong> ${applicationData.phoneNumber}</p>
          <p><strong>${language === 'ar' ? 'التاريخ:' : 'Date:'}</strong> ${new Date(applicationData.submittedAt).toLocaleDateString()}</p>
        </div>

        <p>${language === 'ar' ? 'يرجى مراجعة الطلب والرد عليه في أقرب وقت ممكن.' : 'Please review the application and respond as soon as possible.'}</p>
      </div>
    `;

    return { subject, html };
  }

  private getVendorApplicationStatusTemplate(applicationData: any, status: string, language: 'ar' | 'en') {
    const subject = language === 'ar' 
      ? `حالة طلب الانضمام - ${applicationData.businessName}`
      : `Vendor Application Status - ${applicationData.businessName}`;

    const statusText = this.getApplicationStatusText(status, language);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${language === 'ar' ? 'حالة طلب الانضمام' : 'Vendor Application Status'}</h2>
        <p>${language === 'ar' ? `مرحباً ${applicationData.contactPerson}،` : `Hello ${applicationData.contactPerson},`}</p>
        <p>${language === 'ar' ? 'تم تحديث حالة طلب انضمامك:' : 'Your vendor application status has been updated:'}</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${language === 'ar' ? 'حالة الطلب' : 'Application Status'}</h3>
          <p><strong>${language === 'ar' ? 'اسم الشركة:' : 'Business Name:'}</strong> ${applicationData.businessName}</p>
          <p><strong>${language === 'ar' ? 'الحالة:' : 'Status:'}</strong> ${statusText}</p>
          <p><strong>${language === 'ar' ? 'التاريخ:' : 'Date:'}</strong> ${new Date().toLocaleDateString()}</p>
          ${applicationData.reviewNotes ? `<p><strong>${language === 'ar' ? 'ملاحظات:' : 'Notes:'}</strong> ${applicationData.reviewNotes}</p>` : ''}
        </div>

        ${status === 'approved' ? `
          <p>${language === 'ar' ? 'مبروك! تم قبول طلبك. يمكنك الآن تسجيل الدخول إلى لوحة تحكم التاجر وبدء إضافة منتجاتك.' : 'Congratulations! Your application has been approved. You can now log in to the vendor dashboard and start adding your products.'}</p>
        ` : status === 'rejected' ? `
          <p>${language === 'ar' ? 'نأسف لإبلاغك بأن طلبك لم يتم قبوله في هذا الوقت. يمكنك إعادة التقديم بعد 30 يوم.' : 'We regret to inform you that your application was not approved at this time. You can reapply after 30 days.'}</p>
        ` : ''}
      </div>
    `;

    return { subject, html };
  }

  private getStatusText(status: string, language: 'ar' | 'en'): string {
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

  private getApplicationStatusText(status: string, language: 'ar' | 'en'): string {
    const statusMap: Record<string, { ar: string; en: string }> = {
      pending: { ar: 'قيد المراجعة', en: 'Under Review' },
      approved: { ar: 'مقبول', en: 'Approved' },
      rejected: { ar: 'مرفوض', en: 'Rejected' }
    };
    return statusMap[status]?.[language] || status;
  }
}

export default EmailService;