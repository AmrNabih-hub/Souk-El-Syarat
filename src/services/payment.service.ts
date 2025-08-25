import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import toast from 'react-hot-toast';

export interface PaymentMethod {
  id: string;
  type: 'cash_on_delivery' | 'bank_transfer' | 'installment';
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  available: boolean;
  processingTime: string;
  processingTimeAr: string;
  fees: number;
  icon: string;
}

export interface PaymentDetails {
  method: PaymentMethod;
  amount: number;
  currency: 'EGP';
  installmentPlan?: {
    months: number;
    monthlyAmount: number;
    interestRate: number;
    totalAmount: number;
  };
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    accountHolder: string;
  };
  codDetails?: {
    deliveryAddress: string;
    contactPhone: string;
    preferredTimeSlot: string;
    specialInstructions?: string;
  };
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  carId: string;
  amount: number;
  currency: 'EGP';
  status: 'pending' | 'processing' | 'confirmed' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  completedAt?: Date;
  notes?: string;
  trackingInfo?: {
    deliveryStatus: 'scheduled' | 'in_transit' | 'delivered' | 'failed';
    estimatedDelivery?: Date;
    actualDelivery?: Date;
    deliveryAgent?: {
      name: string;
      phone: string;
      location?: { lat: number; lng: number };
    };
  };
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  carId: string;
  carDetails: {
    title: string;
    make: string;
    model: string;
    year: number;
    price: number;
    images: string[];
  };
  quantity: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'confirmed' | 'completed' | 'failed';
  deliveryAddress: {
    street: string;
    city: string;
    governorate: string;
    postalCode?: string;
    coordinates?: { lat: number; lng: number };
  };
  contactInfo: {
    phone: string;
    email: string;
    alternatePhone?: string;
  };
  paymentTransaction?: PaymentTransaction;
  timeline: Array<{
    status: string;
    timestamp: Date;
    description: string;
    descriptionAr: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentService {
  
  // Available payment methods
  static getPaymentMethods(): PaymentMethod[] {
    return [
      {
        id: 'cod',
        type: 'cash_on_delivery',
        name: 'Cash on Delivery',
        nameAr: 'الدفع عند الاستلام',
        description: 'Pay in cash when the car is delivered to you',
        descriptionAr: 'ادفع نقداً عند تسليم السيارة إليك',
        available: true,
        processingTime: '1-3 business days',
        processingTimeAr: '1-3 أيام عمل',
        fees: 0,
        icon: '💰'
      },
      {
        id: 'bank_transfer',
        type: 'bank_transfer',
        name: 'Bank Transfer',
        nameAr: 'تحويل بنكي',
        description: 'Transfer money directly to seller\'s bank account',
        descriptionAr: 'حوّل المال مباشرة إلى حساب البائع البنكي',
        available: true,
        processingTime: '2-5 business days',
        processingTimeAr: '2-5 أيام عمل',
        fees: 25,
        icon: '🏦'
      },
      {
        id: 'installment_6',
        type: 'installment',
        name: '6-Month Installment',
        nameAr: 'تقسيط 6 أشهر',
        description: 'Pay in 6 monthly installments with low interest',
        descriptionAr: 'ادفع على 6 أقساط شهرية بفائدة منخفضة',
        available: true,
        processingTime: 'Immediate approval',
        processingTimeAr: 'موافقة فورية',
        fees: 0,
        icon: '📅'
      },
      {
        id: 'installment_12',
        type: 'installment',
        name: '12-Month Installment',
        nameAr: 'تقسيط 12 شهر',
        description: 'Pay in 12 monthly installments with competitive rates',
        descriptionAr: 'ادفع على 12 قسط شهري بأسعار تنافسية',
        available: true,
        processingTime: 'Immediate approval',
        processingTimeAr: 'موافقة فورية',
        fees: 0,
        icon: '📆'
      }
    ];
  }

  // Calculate installment details
  static calculateInstallment(
    amount: number, 
    months: number, 
    interestRate: number = 0.08
  ): { monthlyAmount: number; totalAmount: number; interestAmount: number } {
    const monthlyInterestRate = interestRate / 12;
    const monthlyAmount = amount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, months)) /
      (Math.pow(1 + monthlyInterestRate, months) - 1);
    const totalAmount = monthlyAmount * months;
    const interestAmount = totalAmount - amount;

    return {
      monthlyAmount: Math.round(monthlyAmount),
      totalAmount: Math.round(totalAmount),
      interestAmount: Math.round(interestAmount)
    };
  }

  // Create payment transaction
  static async createPaymentTransaction(
    orderId: string,
    paymentDetails: PaymentDetails,
    buyerId: string,
    sellerId: string,
    carId: string
  ): Promise<PaymentTransaction> {
    try {
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const transaction: PaymentTransaction = {
        id: transactionId,
        orderId,
        buyerId,
        sellerId,
        carId,
        amount: paymentDetails.amount,
        currency: 'EGP',
        status: 'pending',
        paymentMethod: paymentDetails.method,
        paymentDetails,
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: `Payment via ${paymentDetails.method.nameAr}`
      };

      // If Cash on Delivery, add tracking info
      if (paymentDetails.method.type === 'cash_on_delivery') {
        transaction.trackingInfo = {
          deliveryStatus: 'scheduled',
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        };
        transaction.status = 'processing';
      }

      await setDoc(doc(db, 'payment_transactions', transactionId), {
        ...transaction,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(transaction.trackingInfo?.estimatedDelivery && {
          trackingInfo: {
            ...transaction.trackingInfo,
            estimatedDelivery: Timestamp.fromDate(transaction.trackingInfo.estimatedDelivery)
          }
        })
      });

      console.log('Payment transaction created:', transactionId);
      return transaction;
    } catch (error) {
      console.error('Error creating payment transaction:', error);
      throw new Error('فشل في إنشاء معاملة الدفع');
    }
  }

  // Create order with payment
  static async createOrder(orderData: {
    buyerId: string;
    sellerId: string;
    carId: string;
    carDetails: Order['carDetails'];
    deliveryAddress: Order['deliveryAddress'];
    contactInfo: Order['contactInfo'];
    paymentDetails: PaymentDetails;
  }): Promise<Order> {
    try {
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create payment transaction
      const paymentTransaction = await this.createPaymentTransaction(
        orderId,
        orderData.paymentDetails,
        orderData.buyerId,
        orderData.sellerId,
        orderData.carId
      );

      const order: Order = {
        id: orderId,
        buyerId: orderData.buyerId,
        sellerId: orderData.sellerId,
        carId: orderData.carId,
        carDetails: orderData.carDetails,
        quantity: 1, // Cars are typically sold individually
        totalAmount: orderData.paymentDetails.amount,
        status: 'pending',
        paymentStatus: 'pending',
        deliveryAddress: orderData.deliveryAddress,
        contactInfo: orderData.contactInfo,
        paymentTransaction,
        timeline: [
          {
            status: 'pending',
            timestamp: new Date(),
            description: 'Order created and awaiting confirmation',
            descriptionAr: 'تم إنشاء الطلب وفي انتظار التأكيد'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'orders', orderId), {
        ...order,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        timeline: order.timeline.map(item => ({
          ...item,
          timestamp: serverTimestamp()
        }))
      });

      // Send notification to seller
      await this.notifySeller(orderData.sellerId, order);

      console.log('Order created successfully:', orderId);
      toast.success('تم إنشاء الطلب بنجاح!');
      
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('فشل في إنشاء الطلب');
    }
  }

  // Update order status
  static async updateOrderStatus(
    orderId: string, 
    status: Order['status'], 
    notes?: string
  ): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }

      const currentOrder = orderDoc.data() as Order;
      
      // Add timeline entry
      const timelineEntry = {
        status,
        timestamp: new Date(),
        description: this.getStatusDescription(status, 'en'),
        descriptionAr: this.getStatusDescription(status, 'ar')
      };

      await updateDoc(orderRef, {
        status,
        updatedAt: serverTimestamp(),
        timeline: [...currentOrder.timeline, {
          ...timelineEntry,
          timestamp: serverTimestamp()
        }],
        ...(notes && { notes })
      });

      // Update payment transaction status if needed
      if (currentOrder.paymentTransaction) {
        await this.updatePaymentStatus(currentOrder.paymentTransaction.id, status);
      }

      console.log('Order status updated:', orderId, status);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('فشل في تحديث حالة الطلب');
    }
  }

  // Update payment status
  static async updatePaymentStatus(
    transactionId: string, 
    orderStatus: Order['status']
  ): Promise<void> {
    try {
      let paymentStatus: PaymentTransaction['status'] = 'pending';
      
      switch (orderStatus) {
        case 'confirmed':
          paymentStatus = 'confirmed';
          break;
        case 'delivered':
          paymentStatus = 'completed';
          break;
        case 'cancelled':
          paymentStatus = 'cancelled';
          break;
        default:
          paymentStatus = 'processing';
      }

      await updateDoc(doc(db, 'payment_transactions', transactionId), {
        status: paymentStatus,
        updatedAt: serverTimestamp(),
        ...(paymentStatus === 'confirmed' && { confirmedAt: serverTimestamp() }),
        ...(paymentStatus === 'completed' && { completedAt: serverTimestamp() })
      });

      console.log('Payment status updated:', transactionId, paymentStatus);
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  }

  // Get orders for user
  static async getUserOrders(userId: string, role: 'buyer' | 'seller'): Promise<Order[]> {
    try {
      const field = role === 'buyer' ? 'buyerId' : 'sellerId';
      const q = query(
        collection(db, 'orders'),
        where(field, '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          timeline: data.timeline?.map((item: any) => ({
            ...item,
            timestamp: item.timestamp?.toDate() || new Date()
          })) || []
        } as Order);
      });

      return orders;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  }

  // Get payment transaction
  static async getPaymentTransaction(transactionId: string): Promise<PaymentTransaction | null> {
    try {
      const doc_ref = await getDoc(doc(db, 'payment_transactions', transactionId));
      
      if (!doc_ref.exists()) {
        return null;
      }

      const data = doc_ref.data();
      return {
        ...data,
        id: doc_ref.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        confirmedAt: data.confirmedAt?.toDate(),
        completedAt: data.completedAt?.toDate()
      } as PaymentTransaction;
    } catch (error) {
      console.error('Error fetching payment transaction:', error);
      return null;
    }
  }

  // Process Cash on Delivery confirmation
  static async confirmCashOnDelivery(orderId: string, deliveryCode: string): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }

      const order = orderDoc.data() as Order;
      
      // Verify delivery code (in real implementation, this would be validated)
      if (!deliveryCode || deliveryCode.length < 4) {
        throw new Error('كود التسليم غير صحيح');
      }

      // Update order status to delivered
      await this.updateOrderStatus(orderId, 'delivered', 'Cash payment confirmed on delivery');

      // Update tracking info
      if (order.paymentTransaction) {
        await updateDoc(doc(db, 'payment_transactions', order.paymentTransaction.id), {
          'trackingInfo.deliveryStatus': 'delivered',
          'trackingInfo.actualDelivery': serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      toast.success('تم تأكيد الدفع عند الاستلام بنجاح!');
    } catch (error) {
      console.error('Error confirming cash on delivery:', error);
      throw error;
    }
  }

  // Notify seller about new order
  private static async notifySeller(sellerId: string, order: Order): Promise<void> {
    try {
      // In a real implementation, this would send push notification, email, SMS
      const notification = {
        id: `notif_${Date.now()}`,
        userId: sellerId,
        type: 'new_order',
        title: 'طلب جديد!',
        titleEn: 'New Order!',
        message: `طلب جديد لسيارة ${order.carDetails.title}`,
        messageEn: `New order for ${order.carDetails.title}`,
        orderId: order.id,
        read: false,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'notifications', notification.id), notification);
      console.log('Seller notified about new order:', sellerId);
    } catch (error) {
      console.error('Error notifying seller:', error);
    }
  }

  // Get status description
  private static getStatusDescription(status: Order['status'], language: 'ar' | 'en'): string {
    const descriptions = {
      pending: { ar: 'في انتظار التأكيد', en: 'Pending confirmation' },
      confirmed: { ar: 'تم تأكيد الطلب', en: 'Order confirmed' },
      processing: { ar: 'جاري التجهيز', en: 'Processing' },
      shipped: { ar: 'تم الشحن', en: 'Shipped' },
      delivered: { ar: 'تم التسليم', en: 'Delivered' },
      cancelled: { ar: 'تم الإلغاء', en: 'Cancelled' }
    };

    return descriptions[status]?.[language] || status;
  }

  // Format currency
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Validate Egyptian phone number
  static validateEgyptianPhone(phone: string): boolean {
    const phoneRegex = /^(010|011|012|015)\d{8}$/;
    return phoneRegex.test(phone.replace(/[\s-+]/g, ''));
  }

  // Generate delivery tracking code
  static generateDeliveryCode(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }
}

export default PaymentService;