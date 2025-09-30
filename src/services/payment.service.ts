/**
 * Payment Service
 * Handles COD orders and InstaPay subscription payments
 */

import { 
  CODOrder, 
  InstapayInvoice, 
  VendorSubscription, 
  VendorSubscriptionPlan,
  OrderTracking,
  PaymentSettings 
} from '@/types/payment';

export class PaymentService {
  private static baseURL = '/api/payments';

  /**
   * COD Orders Management
   */
  static async createCODOrder(orderData: Omit<CODOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<CODOrder> {
    try {
      // In development mode, simulate API call
      if (import.meta.env.DEV) {
        console.log('🛒 Creating COD Order:', orderData);
        
        const order: CODOrder = {
          ...orderData,
          id: `COD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Store in localStorage for development
        const existingOrders = JSON.parse(localStorage.getItem('cod_orders') || '[]');
        existingOrders.push(order);
        localStorage.setItem('cod_orders', JSON.stringify(existingOrders));
        
        return order;
      }

      // Production API call would go here
      const response = await fetch(`${this.baseURL}/cod/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create COD order');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating COD order:', error);
      throw new Error('Failed to create order. Please try again.');
    }
  }

  static async getCODOrder(orderId: string): Promise<CODOrder | null> {
    try {
      if (import.meta.env.DEV) {
        const orders = JSON.parse(localStorage.getItem('cod_orders') || '[]');
        return orders.find((order: CODOrder) => order.id === orderId) || null;
      }

      const response = await fetch(`${this.baseURL}/cod/orders/${orderId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch order');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching COD order:', error);
      throw new Error('Failed to fetch order details');
    }
  }

  static async updateCODOrderStatus(
    orderId: string, 
    status: CODOrder['status'],
    note?: string
  ): Promise<void> {
    try {
      if (import.meta.env.DEV) {
        const orders = JSON.parse(localStorage.getItem('cod_orders') || '[]');
        const orderIndex = orders.findIndex((order: CODOrder) => order.id === orderId);
        if (orderIndex !== -1) {
          orders[orderIndex].status = status;
          orders[orderIndex].updatedAt = new Date();
          localStorage.setItem('cod_orders', JSON.stringify(orders));
        }
        return;
      }

      const response = await fetch(`${this.baseURL}/cod/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, note }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }

  static async getOrderTracking(orderId: string): Promise<OrderTracking | null> {
    try {
      if (import.meta.env.DEV) {
        const order = await this.getCODOrder(orderId);
        if (!order) return null;

        return {
          orderId: order.id,
          status: order.status,
          timeline: [
            {
              status: 'pending',
              timestamp: order.createdAt,
              note: 'Order placed',
              updatedBy: 'system',
            },
          ],
          estimatedDelivery: order.estimatedDeliveryDate,
        };
      }

      const response = await fetch(`${this.baseURL}/cod/orders/${orderId}/tracking`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch tracking');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order tracking:', error);
      throw new Error('Failed to fetch tracking information');
    }
  }

  /**
   * InstaPay Subscription Management
   */
  static async submitInstapayInvoice(
    vendorId: string,
    subscriptionPlan: VendorSubscriptionPlan,
    amount: number,
    receiptFile: File
  ): Promise<InstapayInvoice> {
    try {
      if (import.meta.env.DEV) {
        console.log('📄 Submitting InstaPay Invoice:', {
          vendorId,
          subscriptionPlan,
          amount,
          receiptFile: receiptFile.name,
        });

        // Convert file to base64 for development storage
        const receiptBase64 = await this.fileToBase64(receiptFile);

        const invoice: InstapayInvoice = {
          id: `INST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          vendorId,
          subscriptionPlan,
          amount,
          currency: 'EGP',
          receiptImage: receiptBase64,
          submittedAt: new Date(),
          verificationStatus: 'pending',
        };

        // Store in localStorage for development
        const existingInvoices = JSON.parse(localStorage.getItem('instapay_invoices') || '[]');
        existingInvoices.push(invoice);
        localStorage.setItem('instapay_invoices', JSON.stringify(existingInvoices));

        await new Promise(resolve => setTimeout(resolve, 2000));
        return invoice;
      }

      // Production: Upload file and create invoice
      const formData = new FormData();
      formData.append('vendorId', vendorId);
      formData.append('subscriptionPlan', subscriptionPlan);
      formData.append('amount', amount.toString());
      formData.append('receiptImage', receiptFile);

      const response = await fetch(`${this.baseURL}/instapay/invoices`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit InstaPay invoice');
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting InstaPay invoice:', error);
      throw new Error('Failed to submit payment receipt. Please try again.');
    }
  }

  static async getInstapayInvoice(invoiceId: string): Promise<InstapayInvoice | null> {
    try {
      if (import.meta.env.DEV) {
        const invoices = JSON.parse(localStorage.getItem('instapay_invoices') || '[]');
        return invoices.find((invoice: InstapayInvoice) => invoice.id === invoiceId) || null;
      }

      const response = await fetch(`${this.baseURL}/instapay/invoices/${invoiceId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch invoice');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching InstaPay invoice:', error);
      throw new Error('Failed to fetch invoice details');
    }
  }

  static async verifyInstapayInvoice(
    invoiceId: string,
    status: 'verified' | 'rejected',
    notes?: string,
    adminId?: string
  ): Promise<void> {
    try {
      if (import.meta.env.DEV) {
        const invoices = JSON.parse(localStorage.getItem('instapay_invoices') || '[]');
        const invoiceIndex = invoices.findIndex((invoice: InstapayInvoice) => invoice.id === invoiceId);
        if (invoiceIndex !== -1) {
          invoices[invoiceIndex].verificationStatus = status;
          invoices[invoiceIndex].verificationNotes = notes;
          invoices[invoiceIndex].verifiedAt = new Date();
          invoices[invoiceIndex].verifiedBy = adminId || 'admin';
          localStorage.setItem('instapay_invoices', JSON.stringify(invoices));
        }
        return;
      }

      const response = await fetch(`${this.baseURL}/instapay/invoices/${invoiceId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes, adminId }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify invoice');
      }
    } catch (error) {
      console.error('Error verifying InstaPay invoice:', error);
      throw new Error('Failed to verify invoice');
    }
  }

  /**
   * Vendor Subscription Management
   */
  static async createVendorSubscription(
    vendorId: string,
    plan: VendorSubscriptionPlan,
    invoiceId: string
  ): Promise<VendorSubscription> {
    try {
      if (import.meta.env.DEV) {
        const subscription: VendorSubscription = {
          id: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          vendorId,
          plan,
          status: 'pending',
          autoRenew: true,
          paymentHistory: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const existingSubscriptions = JSON.parse(localStorage.getItem('vendor_subscriptions') || '[]');
        existingSubscriptions.push(subscription);
        localStorage.setItem('vendor_subscriptions', JSON.stringify(existingSubscriptions));

        return subscription;
      }

      const response = await fetch(`${this.baseURL}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vendorId, plan, invoiceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating vendor subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  static async getVendorSubscription(vendorId: string): Promise<VendorSubscription | null> {
    try {
      if (import.meta.env.DEV) {
        const subscriptions = JSON.parse(localStorage.getItem('vendor_subscriptions') || '[]');
        return subscriptions.find((sub: VendorSubscription) => sub.vendorId === vendorId) || null;
      }

      const response = await fetch(`${this.baseURL}/subscriptions/vendor/${vendorId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching vendor subscription:', error);
      throw new Error('Failed to fetch subscription details');
    }
  }

  /**
   * Payment Settings
   */
  static async getPaymentSettings(): Promise<PaymentSettings> {
    // Return default settings - these would normally come from admin configuration
    return {
      cod: {
        enabled: true,
        minimumOrderAmount: 100,
        maximumOrderAmount: 50000,
        deliveryFee: 50,
        freeDeliveryThreshold: 1000,
        supportedGovernorates: [
          'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية', 'القليوبية'
        ],
      },
      instapay: {
        enabled: true,
        soukElSyaratNumber: '01234567890',
        accountName: 'سوق السيارات - Souk El-Syarat',
        instructions: 'Send payment to the InstaPay number and upload the receipt screenshot.',
        instructionsAr: 'أرسل الدفع إلى رقم InstaPay وقم بإرفاق صورة الإيصال.',
      },
    };
  }

  /**
   * Utility Methods
   */
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  static formatCurrency(amount: number, currency: string = 'EGP'): string {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  }

  static calculateDeliveryFee(governorate: string): number {
    const lowCostGovernorates = ['القاهرة', 'الجيزة'];
    return lowCostGovernorates.includes(governorate) ? 30 : 50;
  }

  static estimateDeliveryDate(governorate: string): Date {
    const lowCostGovernorates = ['القاهرة', 'الجيزة'];
    const daysToAdd = lowCostGovernorates.includes(governorate) ? 1 : 3;
    return new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
  }
}

export default PaymentService;