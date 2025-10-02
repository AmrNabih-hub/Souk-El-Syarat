/**
 * Payment Service
 * Handles payment processing, InstaPay integration, and receipts
 */

import { logger } from '@/utils/logger';
import type { Order, PaymentMethod, PaymentReceipt } from '@/types';

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface InstapayPayment {
  accountNumber: string;
  accountName: string;
  amount: number;
  reference: string;
  receiptImage?: string;
}

export class PaymentService {
  private static instance: PaymentService;

  private constructor() {}

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Process Cash on Delivery payment
   */
  async processCODPayment(orderId: string, order: Order): Promise<PaymentReceipt> {
    logger.info('Processing COD payment', { orderId }, 'PAYMENT');

    const receipt: PaymentReceipt = {
      id: `receipt-${Date.now()}`,
      orderId,
      amount: order.totalAmount,
      currency: 'EGP',
      paymentMethod: 'COD',
      status: 'pending',
      createdAt: new Date().toISOString(),
      customerName: order.customerId, // Customer name from user lookup
      customerEmail: '', // Would fetch from user service
    };

    // Send confirmation email
    await this.sendPaymentConfirmation(receipt);

    return receipt;
  }

  /**
   * Process InstaPay payment
   */
  async processInstapayPayment(
    orderId: string,
    paymentData: InstapayPayment
  ): Promise<PaymentReceipt> {
    logger.info('Processing InstaPay payment', { orderId }, 'PAYMENT');

    // Validate InstaPay account
    if (!this.validateInstapayAccount(paymentData.accountNumber)) {
      throw new Error('Invalid InstaPay account number');
    }

    // Verify receipt image if provided
    if (paymentData.receiptImage) {
      const isValid = await this.verifyReceiptImage(paymentData.receiptImage);
      if (!isValid) {
        logger.warn('Invalid receipt image', { orderId }, 'PAYMENT');
      }
    }

    const receipt: PaymentReceipt = {
      id: `receipt-${Date.now()}`,
      orderId,
      amount: paymentData.amount,
      currency: 'EGP',
      paymentMethod: 'mobile_wallet', // InstaPay is a type of mobile wallet
      status: 'processing', // Awaiting verification
      createdAt: new Date().toISOString(),
      instapayReference: paymentData.reference,
      receiptUrl: paymentData.receiptImage,
    };

    // In production: Send to payment verification queue
    logger.info('InstaPay payment submitted for verification', { orderId }, 'PAYMENT');

    return receipt;
  }

  /**
   * Verify payment receipt
   */
  async verifyPayment(receiptId: string): Promise<boolean> {
    logger.info('Verifying payment', { receiptId }, 'PAYMENT');

    // In production: Call payment gateway API or manual verification
    if (import.meta.env.VITE_USE_MOCK_PAYMENTS === 'true') {
      return true; // Auto-approve in mock mode
    }

    // Real implementation would verify with InstaPay API
    // return await this.verifyWithInstapay(receiptId);

    return true;
  }

  /**
   * Generate payment receipt PDF
   */
  async generateReceipt(order: Order): Promise<string> {
    logger.info('Generating receipt', { orderId: order.id }, 'PAYMENT');

    const receiptHTML = this.buildReceiptHTML(order);

    // In production: Convert to PDF using library or service
    // return await this.convertToPDF(receiptHTML);

    // For now, return HTML
    return receiptHTML;
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(userId: string): Promise<PaymentReceipt[]> {
    logger.debug('Fetching payment history', { userId }, 'PAYMENT');

    // In production: Fetch from database
    // return await this.fetchFromDatabase(userId);

    return []; // Mock empty history
  }

  /**
   * Refund payment
   */
  async refundPayment(
    receiptId: string,
    amount: number,
    reason: string
  ): Promise<PaymentReceipt> {
    logger.info('Processing refund', { receiptId, amount, reason }, 'PAYMENT');

    // In production: Process refund through payment gateway
    // return await this.processRefundWithGateway(receiptId, amount);

    const refundReceipt: PaymentReceipt = {
      id: `refund-${Date.now()}`,
      orderId: receiptId,
      amount: -amount, // Negative for refund
      currency: 'EGP',
      paymentMethod: 'refund',
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    return refundReceipt;
  }

  /**
   * Calculate payment fees
   */
  calculatePaymentFees(amount: number, method: PaymentMethod): number {
    switch (method) {
      case 'COD':
        return 0; // No fees for COD
      case 'instapay':
        return amount * 0.01; // 1% fee
      case 'credit_card':
        return amount * 0.025; // 2.5% fee
      case 'mobile_wallet':
        return 0; // No fees
      default:
        return 0;
    }
  }

  /**
   * Validate payment method availability
   */
  isPaymentMethodAvailable(method: PaymentMethod): boolean {
    const availableMethods: PaymentMethod[] = ['COD', 'instapay'];
    
    // In production, check payment gateway status
    return availableMethods.includes(method);
  }

  // Private helper methods

  private validateInstapayAccount(accountNumber: string): boolean {
    // Egyptian mobile number format validation
    const pattern = /^01[0-2,5]{1}[0-9]{8}$/;
    return pattern.test(accountNumber);
  }

  private async verifyReceiptImage(imageUrl: string): Promise<boolean> {
    // In production: Use image recognition or manual verification
    logger.debug('Verifying receipt image', { imageUrl }, 'PAYMENT');
    return true;
  }

  private buildReceiptHTML(order: Order): string {
    return `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>إيصال الدفع - ${order.id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            direction: rtl;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #f59e0b;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .order-details {
            margin-bottom: 20px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .items-table th, .items-table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: right;
          }
          .total {
            font-size: 1.5em;
            font-weight: bold;
            text-align: right;
            color: #f59e0b;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>سوق السيارات</h1>
          <p>إيصال الدفع</p>
        </div>
        
        <div class="order-details">
          <p><strong>رقم الطلب:</strong> ${order.id}</p>
          <p><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
          <p><strong>العميل:</strong> ${order.customerId}</p>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>المنتج</th>
              <th>الكمية</th>
              <th>السعر</th>
              <th>المجموع</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.productSnapshot?.title || 'Product'}</td>
                <td>${item.quantity}</td>
                <td>${item.price} جنيه</td>
                <td>${item.price * item.quantity} جنيه</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total">
          <p>المجموع الكلي: ${order.totalAmount} جنيه مصري</p>
        </div>

        <p style="text-align: center; color: #666; font-size: 0.9em; margin-top: 30px;">
          شكراً لتعاملكم مع سوق السيارات
        </p>
      </body>
      </html>
    `;
  }

  private async sendPaymentConfirmation(receipt: PaymentReceipt): Promise<void> {
    logger.info('Sending payment confirmation', { receiptId: receipt.id }, 'PAYMENT');
    
    // In production: Send email via AWS SES or email service
    // await emailService.send({
    //   to: receipt.customerEmail,
    //   subject: 'تأكيد الدفع - سوق السيارات',
    //   html: this.buildConfirmationEmail(receipt),
    // });
  }
}

// Export singleton
export const paymentService = PaymentService.getInstance();
