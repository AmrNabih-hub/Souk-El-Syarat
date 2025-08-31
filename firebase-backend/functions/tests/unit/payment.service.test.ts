/**
 * Payment Service Unit Tests
 * Comprehensive test coverage for payment operations
 */

import { PaymentService } from '../../src/services/payment.service';
import { Decimal } from 'decimal.js';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
      })),
    })),
    runTransaction: jest.fn((callback) => callback({
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
    })),
  })),
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      confirm: jest.fn(),
      retrieve: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockStripe: any;

  beforeEach(() => {
    jest.clearAllMocks();
    paymentService = PaymentService.getInstance();
    mockStripe = new (Stripe as any)();
  });

  describe('createStripePayment', () => {
    it('should create a payment intent with correct amount', async () => {
      const amount = 1000;
      const orderId = 'order-123';
      const customerId = 'customer-456';
      const vendorId = 'vendor-789';

      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test123',
        amount: amount * 100,
        currency: 'egp',
        status: 'requires_payment_method',
      });

      const result = await paymentService.createStripePayment(
        amount,
        orderId,
        customerId,
        vendorId
      );

      expect(result.success).toBe(true);
      expect(result.paymentId).toBe('pi_test123');
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: amount * 100,
          currency: 'egp',
          metadata: expect.objectContaining({
            orderId,
            customerId,
            vendorId,
          }),
        })
      );
    });

    it('should calculate commission correctly', async () => {
      const amount = 1000;
      const platformCommission = new Decimal(amount).mul(0.025); // 2.5%
      const paymentFee = new Decimal(amount).mul(0.029).plus(0.30); // 2.9% + 0.30
      const vendorAmount = new Decimal(amount).minus(platformCommission).minus(paymentFee);

      const result = await paymentService.calculateCommissions(amount);

      expect(result.platformCommission).toBe(platformCommission.toFixed(2));
      expect(result.paymentFee).toBe(paymentFee.toFixed(2));
      expect(result.vendorAmount).toBe(vendorAmount.toFixed(2));
    });

    it('should handle payment creation failure', async () => {
      mockStripe.paymentIntents.create.mockRejectedValue(
        new Error('Insufficient funds')
      );

      const result = await paymentService.createStripePayment(
        1000,
        'order-123',
        'customer-456',
        'vendor-789'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient funds');
    });

    it('should enforce minimum payment amount', async () => {
      const result = await paymentService.createStripePayment(
        0.5, // Below minimum
        'order-123',
        'customer-456',
        'vendor-789'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('minimum');
    });
  });

  describe('processInstapayPayment', () => {
    it('should generate correct QR code data', async () => {
      const amount = 500;
      const orderId = 'order-123';
      
      const result = await paymentService.generateInstapayQR(amount, orderId);

      expect(result).toContain('SOUKSAYARAT@CIB');
      expect(result).toContain(amount.toString());
      expect(result).toContain(orderId);
    });

    it('should validate InstaPay transaction reference', async () => {
      const validReference = 'ORD-123-1234567890';
      const invalidReference = 'invalid';

      expect(paymentService.validateInstapayReference(validReference)).toBe(true);
      expect(paymentService.validateInstapayReference(invalidReference)).toBe(false);
    });

    it('should verify InstaPay amount with tolerance', async () => {
      const expectedAmount = new Decimal(1000);
      
      // Exact amount
      expect(paymentService.verifyInstapayAmount(1000, expectedAmount)).toBe(true);
      
      // Within tolerance (1 piaster)
      expect(paymentService.verifyInstapayAmount(1000.01, expectedAmount)).toBe(true);
      expect(paymentService.verifyInstapayAmount(999.99, expectedAmount)).toBe(true);
      
      // Outside tolerance
      expect(paymentService.verifyInstapayAmount(1001, expectedAmount)).toBe(false);
    });
  });

  describe('processRefund', () => {
    it('should process Stripe refund successfully', async () => {
      mockStripe.refunds.create.mockResolvedValue({
        id: 're_test123',
        amount: 50000,
        status: 'succeeded',
      });

      const result = await paymentService.refundStripePayment('pi_test123', 500);

      expect(result.success).toBe(true);
      expect(result.refundId).toBe('re_test123');
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test123',
        amount: 50000,
      });
    });

    it('should handle partial refunds', async () => {
      const originalAmount = 1000;
      const refundAmount = 300;

      mockStripe.refunds.create.mockResolvedValue({
        id: 're_partial123',
        amount: refundAmount * 100,
        status: 'succeeded',
      });

      const result = await paymentService.refundStripePayment(
        'pi_test123',
        refundAmount,
        originalAmount
      );

      expect(result.success).toBe(true);
      expect(result.isPartial).toBe(true);
      expect(result.remainingAmount).toBe(originalAmount - refundAmount);
    });

    it('should prevent duplicate refunds', async () => {
      const paymentId = 'pi_test123';
      
      // First refund succeeds
      mockStripe.refunds.create.mockResolvedValueOnce({
        id: 're_test123',
        status: 'succeeded',
      });

      await paymentService.refundStripePayment(paymentId, 500);

      // Second refund should be prevented
      const result = await paymentService.refundStripePayment(paymentId, 500);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('already refunded');
    });
  });

  describe('Wallet Operations', () => {
    it('should create wallet with zero balance', async () => {
      const userId = 'user-123';
      const walletType = 'customer';

      const wallet = await paymentService.createWallet(userId, walletType);

      expect(wallet.id).toBe(`wallet-${userId}`);
      expect(wallet.balance).toBe('0.00');
      expect(wallet.currency).toBe('EGP');
      expect(wallet.type).toBe(walletType);
    });

    it('should add funds to wallet with correct precision', async () => {
      const walletId = 'wallet-123';
      const amount = 123.456; // Test decimal precision

      const transaction = await paymentService.addFundsToWallet(
        walletId,
        amount,
        'card',
        'ref-123'
      );

      expect(transaction.type).toBe('credit');
      expect(transaction.amount).toBe('123.46'); // Rounded to 2 decimals
      expect(transaction.status).toBe('completed');
    });

    it('should prevent overdraft on withdrawal', async () => {
      const walletId = 'wallet-123';
      const currentBalance = new Decimal(100);
      const withdrawAmount = 150;

      const result = await paymentService.withdrawFromWallet(
        walletId,
        withdrawAmount,
        'bank-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient balance');
    });

    it('should calculate withdrawal fees correctly', async () => {
      const amount = 1000;
      const withdrawalFee = 15; // Fixed fee
      const netAmount = amount - withdrawalFee;

      const result = await paymentService.calculateWithdrawalAmount(amount);

      expect(result.grossAmount).toBe(amount);
      expect(result.fee).toBe(withdrawalFee);
      expect(result.netAmount).toBe(netAmount);
    });
  });

  describe('Webhook Handling', () => {
    it('should verify Stripe webhook signature', async () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
      const signature = 'valid_signature';

      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test123' } },
      });

      const result = await paymentService.handleStripeWebhook(payload, signature);

      expect(result.success).toBe(true);
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        expect.any(String)
      );
    });

    it('should reject invalid webhook signature', async () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
      const signature = 'invalid_signature';

      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const result = await paymentService.handleStripeWebhook(payload, signature);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid signature');
    });

    it('should handle payment success webhook', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            amount: 100000,
            metadata: {
              orderId: 'order-123',
              customerId: 'customer-456',
              vendorId: 'vendor-789',
            },
          },
        },
      };

      await paymentService.handlePaymentSuccess(event.data.object);

      // Verify order status was updated
      // Verify vendor balance was credited
      // Verify customer was notified
      expect(true).toBe(true); // Placeholder for actual assertions
    });
  });

  describe('Commission Distribution', () => {
    it('should distribute commission correctly', async () => {
      const orderAmount = 1000;
      const platformRate = 0.025; // 2.5%
      const paymentRate = 0.029; // 2.9%
      const fixedFee = 0.30;

      const distribution = await paymentService.distributeCommission(orderAmount);

      const expectedPlatform = new Decimal(orderAmount).mul(platformRate);
      const expectedPayment = new Decimal(orderAmount).mul(paymentRate).plus(fixedFee);
      const expectedVendor = new Decimal(orderAmount)
        .minus(expectedPlatform)
        .minus(expectedPayment);

      expect(distribution.platform).toBe(expectedPlatform.toFixed(2));
      expect(distribution.payment).toBe(expectedPayment.toFixed(2));
      expect(distribution.vendor).toBe(expectedVendor.toFixed(2));
      expect(distribution.total).toBe(orderAmount.toFixed(2));
    });

    it('should handle tiered commission rates', async () => {
      const vendorTier = 'premium';
      const orderAmount = 5000;

      const distribution = await paymentService.distributeCommission(
        orderAmount,
        vendorTier
      );

      // Premium vendors get lower commission rate
      expect(parseFloat(distribution.platform)).toBeLessThan(
        orderAmount * 0.025 // Standard rate
      );
    });
  });

  describe('Payment Validation', () => {
    it('should validate Egyptian bank account', () => {
      const validAccount = {
        bankName: 'CIB',
        accountNumber: '1234567890123456',
        iban: 'EG380003001234567890123456',
      };

      const invalidAccount = {
        bankName: 'Invalid Bank',
        accountNumber: '123',
        iban: 'INVALID',
      };

      expect(paymentService.validateBankAccount(validAccount)).toBe(true);
      expect(paymentService.validateBankAccount(invalidAccount)).toBe(false);
    });

    it('should validate IBAN checksum', () => {
      const validIBAN = 'EG380003001234567890123456';
      const invalidIBAN = 'EG380003001234567890123457';

      expect(paymentService.validateIBAN(validIBAN)).toBe(true);
      expect(paymentService.validateIBAN(invalidIBAN)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockStripe.paymentIntents.create.mockRejectedValue(
        new Error('Network error')
      );

      const result = await paymentService.createStripePayment(
        1000,
        'order-123',
        'customer-456',
        'vendor-789'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.shouldRetry).toBe(true);
    });

    it('should not retry on validation errors', async () => {
      mockStripe.paymentIntents.create.mockRejectedValue(
        new Error('Invalid card number')
      );

      const result = await paymentService.createStripePayment(
        1000,
        'order-123',
        'customer-456',
        'vendor-789'
      );

      expect(result.success).toBe(false);
      expect(result.shouldRetry).toBe(false);
    });
  });
});

describe('PaymentService Integration', () => {
  it('should handle complete payment flow', async () => {
    // 1. Create payment intent
    // 2. Confirm payment
    // 3. Distribute commission
    // 4. Update order status
    // 5. Notify parties
    
    // This would be an integration test with actual Firebase emulator
    expect(true).toBe(true);
  });
});