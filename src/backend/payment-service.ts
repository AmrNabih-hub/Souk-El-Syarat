/**
 * Payment Service Implementation
 * Handles all payment operations including Stripe, InstaPay, and Vodafone Cash
 */

import Stripe from 'stripe';
import axios from 'axios';
import crypto from 'crypto';
import { Decimal } from 'decimal.js';
import { db, functions } from '@/config/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  serverTimestamp,
  runTransaction 
} from 'firebase/firestore';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Payment service configuration
const PAYMENT_CONFIG = {
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    currency: 'egp',
  },
  instapay: {
    apiUrl: process.env.INSTAPAY_API_URL || 'https://api.instapay.eg/v1',
    apiKey: process.env.INSTAPAY_API_KEY!,
    merchantId: process.env.INSTAPAY_MERCHANT_ID!,
    ipa: 'SOUKSAYARAT@CIB',
  },
  vodafoneCash: {
    apiUrl: process.env.VODAFONE_CASH_API_URL || 'https://api.vodafone.com.eg/cash',
    apiKey: process.env.VODAFONE_CASH_API_KEY!,
    merchantCode: process.env.VODAFONE_CASH_MERCHANT_CODE!,
  },
  commission: {
    platform: 0.025, // 2.5% platform commission
    payment: 0.029, // 2.9% payment processing
    fixed: 0.30, // Fixed fee per transaction
  },
};

// Payment types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  paymentMethod: 'card' | 'instapay' | 'vodafone_cash' | 'bank_transfer' | 'cash';
  metadata: {
    orderId: string;
    customerId: string;
    vendorId: string;
    items: any[];
  };
  createdAt: Date;
  confirmedAt?: Date;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  status?: string;
  error?: string;
  requiresAction?: boolean;
  actionUrl?: string;
}

export interface RefundRequest {
  paymentId: string;
  amount: number;
  reason: string;
  items?: string[]; // Specific items to refund
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'credit' | 'debit' | 'refund' | 'withdrawal';
  amount: number;
  balance: number;
  description: string;
  reference?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

// Main Payment Service Class
export class PaymentService {
  private static instance: PaymentService;

  private constructor() {}

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  // ============================================
  // STRIPE CARD PAYMENTS
  // ============================================

  async createStripePaymentIntent(
    amount: number,
    orderId: string,
    customerId: string,
    vendorId: string,
    items: any[]
  ): Promise<PaymentResult> {
    try {
      // Calculate amounts with Decimal for precision
      const subtotal = new Decimal(amount);
      const platformFee = subtotal.mul(PAYMENT_CONFIG.commission.platform);
      const processingFee = subtotal.mul(PAYMENT_CONFIG.commission.payment).plus(PAYMENT_CONFIG.commission.fixed);
      const vendorAmount = subtotal.minus(platformFee).minus(processingFee);

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(subtotal.mul(100).toNumber()), // Convert to piasters
        currency: PAYMENT_CONFIG.stripe.currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          orderId,
          customerId,
          vendorId,
          platformFee: platformFee.toFixed(2),
          vendorAmount: vendorAmount.toFixed(2),
        },
        description: `Order #${orderId}`,
        statement_descriptor: 'SOUK ELSAYARAT',
        // Enable 3D Secure for Egyptian cards
        payment_method_options: {
          card: {
            request_three_d_secure: 'automatic',
          },
        },
      });

      // Store payment intent in database
      await this.storePaymentIntent({
        id: paymentIntent.id,
        amount: subtotal.toNumber(),
        currency: PAYMENT_CONFIG.stripe.currency,
        status: 'pending',
        paymentMethod: 'card',
        metadata: {
          orderId,
          customerId,
          vendorId,
          items,
        },
        createdAt: new Date(),
      });

      return {
        success: true,
        paymentId: paymentIntent.id,
        status: paymentIntent.status,
        requiresAction: paymentIntent.status === 'requires_action',
        actionUrl: paymentIntent.next_action?.redirect_to_url?.url,
      };
    } catch (error: any) {
      console.error('Stripe payment intent creation failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async confirmStripePayment(paymentIntentId: string): Promise<PaymentResult> {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

      // Update payment status in database
      await updateDoc(doc(db, 'payment_intents', paymentIntentId), {
        status: paymentIntent.status,
        confirmedAt: serverTimestamp(),
      });

      if (paymentIntent.status === 'succeeded') {
        // Process successful payment
        await this.processSuccessfulPayment(paymentIntentId);
      }

      return {
        success: paymentIntent.status === 'succeeded',
        paymentId: paymentIntent.id,
        status: paymentIntent.status,
      };
    } catch (error: any) {
      console.error('Stripe payment confirmation failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ============================================
  // INSTAPAY INTEGRATION
  // ============================================

  async createInstaPayTransaction(
    amount: number,
    orderId: string,
    customerId: string,
    vendorId: string
  ): Promise<PaymentResult> {
    try {
      // Generate unique reference
      const reference = `ORD-${orderId}-${Date.now()}`;
      
      // Create InstaPay request
      const response = await axios.post(
        `${PAYMENT_CONFIG.instapay.apiUrl}/transactions`,
        {
          amount: amount.toFixed(2),
          currency: 'EGP',
          reference,
          ipa: PAYMENT_CONFIG.instapay.ipa,
          description: `Order #${orderId}`,
          callbackUrl: `${process.env.APP_URL}/api/payments/instapay/callback`,
        },
        {
          headers: {
            'Authorization': `Bearer ${PAYMENT_CONFIG.instapay.apiKey}`,
            'X-Merchant-Id': PAYMENT_CONFIG.instapay.merchantId,
          },
        }
      );

      const transaction = response.data;

      // Generate QR code for payment
      const qrCode = await this.generateInstaPayQR({
        ipa: PAYMENT_CONFIG.instapay.ipa,
        amount: amount.toFixed(2),
        reference,
      });

      // Store transaction
      await setDoc(doc(db, 'instapay_transactions', reference), {
        transactionId: transaction.id,
        reference,
        amount,
        orderId,
        customerId,
        vendorId,
        status: 'pending',
        qrCode,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        createdAt: serverTimestamp(),
      });

      return {
        success: true,
        paymentId: reference,
        status: 'pending',
        actionUrl: qrCode, // QR code image URL
      };
    } catch (error: any) {
      console.error('InstaPay transaction creation failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verifyInstaPayTransaction(reference: string): Promise<PaymentResult> {
    try {
      // Get transaction from database
      const transactionDoc = await getDoc(doc(db, 'instapay_transactions', reference));
      
      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }

      const transaction = transactionDoc.data();

      // Check with InstaPay API
      const response = await axios.get(
        `${PAYMENT_CONFIG.instapay.apiUrl}/transactions/${transaction.transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${PAYMENT_CONFIG.instapay.apiKey}`,
            'X-Merchant-Id': PAYMENT_CONFIG.instapay.merchantId,
          },
        }
      );

      const status = response.data.status;

      // Update transaction status
      await updateDoc(doc(db, 'instapay_transactions', reference), {
        status,
        verifiedAt: serverTimestamp(),
      });

      if (status === 'completed') {
        await this.processSuccessfulPayment(reference);
      }

      return {
        success: status === 'completed',
        paymentId: reference,
        status,
      };
    } catch (error: any) {
      console.error('InstaPay verification failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async generateInstaPayQR(data: any): Promise<string> {
    // Generate QR code using a QR library
    // For now, return a placeholder
    const qrData = JSON.stringify(data);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
    return qrUrl;
  }

  // ============================================
  // VODAFONE CASH INTEGRATION
  // ============================================

  async createVodafoneCashPayment(
    amount: number,
    orderId: string,
    customerId: string,
    customerPhone: string
  ): Promise<PaymentResult> {
    try {
      // Create Vodafone Cash payment request
      const response = await axios.post(
        `${PAYMENT_CONFIG.vodafoneCash.apiUrl}/payments`,
        {
          amount: amount.toFixed(2),
          currency: 'EGP',
          orderId,
          customerPhone,
          merchantCode: PAYMENT_CONFIG.vodafoneCash.merchantCode,
          callbackUrl: `${process.env.APP_URL}/api/payments/vodafone/callback`,
        },
        {
          headers: {
            'Authorization': `Bearer ${PAYMENT_CONFIG.vodafoneCash.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const payment = response.data;

      // Store payment record
      await setDoc(doc(db, 'vodafone_payments', payment.referenceId), {
        paymentId: payment.id,
        referenceId: payment.referenceId,
        amount,
        orderId,
        customerId,
        customerPhone,
        status: 'pending',
        pin: payment.pin, // PIN for customer to confirm
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        createdAt: serverTimestamp(),
      });

      // Send SMS to customer with PIN
      await this.sendVodafoneCashSMS(customerPhone, payment.pin, amount);

      return {
        success: true,
        paymentId: payment.referenceId,
        status: 'pending',
        requiresAction: true,
      };
    } catch (error: any) {
      console.error('Vodafone Cash payment creation failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async sendVodafoneCashSMS(phone: string, pin: string, amount: number): Promise<void> {
    // Send SMS via SMS service
    // Implementation depends on SMS provider
    console.log(`Sending Vodafone Cash PIN ${pin} to ${phone} for amount ${amount}`);
  }

  // ============================================
  // REFUND PROCESSING
  // ============================================

  async processRefund(request: RefundRequest): Promise<PaymentResult> {
    try {
      // Get original payment
      const paymentDoc = await getDoc(doc(db, 'payments', request.paymentId));
      
      if (!paymentDoc.exists()) {
        throw new Error('Payment not found');
      }

      const payment = paymentDoc.data();
      let refundResult: any;

      // Process refund based on payment method
      switch (payment.method) {
        case 'card':
          refundResult = await this.refundStripePayment(payment.stripePaymentId, request.amount);
          break;
        
        case 'instapay':
          refundResult = await this.refundInstaPayTransaction(payment.reference, request.amount);
          break;
        
        case 'vodafone_cash':
          refundResult = await this.refundVodafoneCash(payment.referenceId, request.amount);
          break;
        
        default:
          throw new Error(`Refund not supported for payment method: ${payment.method}`);
      }

      // Store refund record
      await setDoc(doc(collection(db, 'refunds')), {
        paymentId: request.paymentId,
        amount: request.amount,
        reason: request.reason,
        items: request.items,
        status: refundResult.status,
        method: payment.method,
        processedAt: serverTimestamp(),
      });

      // Update order status
      if (payment.orderId) {
        await updateDoc(doc(db, 'orders', payment.orderId), {
          refundStatus: 'refunded',
          refundAmount: request.amount,
          refundedAt: serverTimestamp(),
        });
      }

      return {
        success: refundResult.success,
        paymentId: refundResult.id,
        status: 'refunded',
      };
    } catch (error: any) {
      console.error('Refund processing failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async refundStripePayment(paymentIntentId: string, amount: number): Promise<any> {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(amount * 100), // Convert to piasters
    });

    return {
      success: refund.status === 'succeeded',
      id: refund.id,
      status: refund.status,
    };
  }

  private async refundInstaPayTransaction(reference: string, amount: number): Promise<any> {
    // InstaPay refund API call
    const response = await axios.post(
      `${PAYMENT_CONFIG.instapay.apiUrl}/refunds`,
      {
        reference,
        amount: amount.toFixed(2),
        reason: 'Customer requested refund',
      },
      {
        headers: {
          'Authorization': `Bearer ${PAYMENT_CONFIG.instapay.apiKey}`,
          'X-Merchant-Id': PAYMENT_CONFIG.instapay.merchantId,
        },
      }
    );

    return {
      success: response.data.status === 'completed',
      id: response.data.refundId,
      status: response.data.status,
    };
  }

  private async refundVodafoneCash(referenceId: string, amount: number): Promise<any> {
    // Vodafone Cash refund API call
    const response = await axios.post(
      `${PAYMENT_CONFIG.vodafoneCash.apiUrl}/refunds`,
      {
        referenceId,
        amount: amount.toFixed(2),
        merchantCode: PAYMENT_CONFIG.vodafoneCash.merchantCode,
      },
      {
        headers: {
          'Authorization': `Bearer ${PAYMENT_CONFIG.vodafoneCash.apiKey}`,
        },
      }
    );

    return {
      success: response.data.status === 'success',
      id: response.data.refundId,
      status: response.data.status,
    };
  }

  // ============================================
  // WALLET SYSTEM
  // ============================================

  async createWallet(userId: string, type: 'customer' | 'vendor'): Promise<string> {
    const walletId = `wallet-${userId}`;
    
    await setDoc(doc(db, 'wallets', walletId), {
      id: walletId,
      userId,
      type,
      balance: '0.00',
      currency: 'EGP',
      status: 'active',
      transactions: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return walletId;
  }

  async addFundsToWallet(
    walletId: string,
    amount: number,
    paymentMethod: string,
    reference: string
  ): Promise<WalletTransaction> {
    return await runTransaction(db, async (transaction) => {
      const walletRef = doc(db, 'wallets', walletId);
      const walletDoc = await transaction.get(walletRef);
      
      if (!walletDoc.exists()) {
        throw new Error('Wallet not found');
      }

      const wallet = walletDoc.data();
      const currentBalance = new Decimal(wallet.balance);
      const addAmount = new Decimal(amount);
      const newBalance = currentBalance.plus(addAmount);

      // Create transaction record
      const walletTransaction: WalletTransaction = {
        id: `txn-${Date.now()}`,
        walletId,
        type: 'credit',
        amount: addAmount.toNumber(),
        balance: newBalance.toNumber(),
        description: `Added funds via ${paymentMethod}`,
        reference,
        status: 'completed',
        createdAt: new Date(),
      };

      // Update wallet balance
      transaction.update(walletRef, {
        balance: newBalance.toFixed(2),
        updatedAt: serverTimestamp(),
      });

      // Store transaction
      transaction.set(
        doc(collection(db, 'wallet_transactions')),
        walletTransaction
      );

      return walletTransaction;
    });
  }

  async withdrawFromWallet(
    walletId: string,
    amount: number,
    bankAccountId: string
  ): Promise<WalletTransaction> {
    return await runTransaction(db, async (transaction) => {
      const walletRef = doc(db, 'wallets', walletId);
      const walletDoc = await transaction.get(walletRef);
      
      if (!walletDoc.exists()) {
        throw new Error('Wallet not found');
      }

      const wallet = walletDoc.data();
      const currentBalance = new Decimal(wallet.balance);
      const withdrawAmount = new Decimal(amount);
      
      if (currentBalance.lessThan(withdrawAmount)) {
        throw new Error('Insufficient balance');
      }

      const newBalance = currentBalance.minus(withdrawAmount);

      // Create withdrawal record
      const withdrawal: WalletTransaction = {
        id: `wd-${Date.now()}`,
        walletId,
        type: 'withdrawal',
        amount: withdrawAmount.toNumber(),
        balance: newBalance.toNumber(),
        description: `Withdrawal to bank account`,
        reference: bankAccountId,
        status: 'pending',
        createdAt: new Date(),
      };

      // Update wallet balance
      transaction.update(walletRef, {
        balance: newBalance.toFixed(2),
        updatedAt: serverTimestamp(),
      });

      // Store withdrawal
      transaction.set(
        doc(collection(db, 'wallet_transactions')),
        withdrawal
      );

      // Process bank transfer (async)
      this.processBankTransfer(withdrawal.id, bankAccountId, amount);

      return withdrawal;
    });
  }

  private async processBankTransfer(
    withdrawalId: string,
    bankAccountId: string,
    amount: number
  ): Promise<void> {
    // Implement bank transfer via banking API
    // This would integrate with Egyptian banks
    console.log(`Processing bank transfer of ${amount} EGP to account ${bankAccountId}`);
  }

  // ============================================
  // WEBHOOK HANDLERS
  // ============================================

  async handleStripeWebhook(payload: any, signature: string): Promise<void> {
    try {
      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        PAYMENT_CONFIG.stripe.webhookSecret
      );

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        
        case 'charge.refunded':
          await this.handleRefundCompleted(event.data.object);
          break;
        
        default:
          console.log(`Unhandled webhook event: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook processing failed:', error);
      throw error;
    }
  }

  private async handlePaymentSuccess(paymentIntent: any): Promise<void> {
    await this.processSuccessfulPayment(paymentIntent.id);
  }

  private async handlePaymentFailure(paymentIntent: any): Promise<void> {
    await updateDoc(doc(db, 'payment_intents', paymentIntent.id), {
      status: 'failed',
      failedAt: serverTimestamp(),
      failureReason: paymentIntent.last_payment_error?.message,
    });
  }

  private async handleRefundCompleted(charge: any): Promise<void> {
    // Update refund status
    console.log('Refund completed:', charge.id);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async storePaymentIntent(intent: PaymentIntent): Promise<void> {
    await setDoc(doc(db, 'payment_intents', intent.id), intent);
  }

  private async processSuccessfulPayment(paymentId: string): Promise<void> {
    // Get payment details
    const paymentDoc = await getDoc(doc(db, 'payment_intents', paymentId));
    
    if (!paymentDoc.exists()) {
      throw new Error('Payment not found');
    }

    const payment = paymentDoc.data();

    // Update order status
    await updateDoc(doc(db, 'orders', payment.metadata.orderId), {
      paymentStatus: 'paid',
      paidAt: serverTimestamp(),
    });

    // Calculate and distribute commissions
    await this.distributeCommissions(payment);

    // Send confirmation emails
    await this.sendPaymentConfirmation(payment);
  }

  private async distributeCommissions(payment: any): Promise<void> {
    const amount = new Decimal(payment.amount);
    const platformCommission = amount.mul(PAYMENT_CONFIG.commission.platform);
    const vendorAmount = amount.minus(platformCommission);

    // Add to vendor balance
    await this.addFundsToWallet(
      `wallet-${payment.metadata.vendorId}`,
      vendorAmount.toNumber(),
      'order_payment',
      payment.metadata.orderId
    );

    // Record platform commission
    await setDoc(doc(collection(db, 'platform_commissions')), {
      orderId: payment.metadata.orderId,
      vendorId: payment.metadata.vendorId,
      amount: platformCommission.toFixed(2),
      createdAt: serverTimestamp(),
    });
  }

  private async sendPaymentConfirmation(payment: any): Promise<void> {
    // Send email confirmation
    console.log(`Sending payment confirmation for order ${payment.metadata.orderId}`);
  }
}

// Export singleton instance
export const paymentService = PaymentService.getInstance();
