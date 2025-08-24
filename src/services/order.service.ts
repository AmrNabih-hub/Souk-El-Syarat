import {
  collection,
  doc,
  updateDoc,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  runTransaction,
} from 'firebase/firestore';

import { NotificationService } from './notification.service';

export type OrderStatus = 
  | 'pending' // Order placed, waiting for vendor confirmation
  | 'confirmed' // Vendor confirmed the order
  | 'payment_pending' // Waiting for payment
  | 'paid' // Payment completed
  | 'processing' // Order being prepared
  | 'shipped' // Order shipped
  | 'delivered' // Order delivered
  | 'cancelled' // Order cancelled
  | 'refunded' // Order refunded
  | 'disputed'; // Order under dispute

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'disputed';

export type PaymentMethod =
  | 'cash_on_delivery'
  | 'bank_transfer'
  | 'credit_card'
  | 'mobile_wallet'
  | 'installment';

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  vendorId: string;
  specifications?: Record<string, any>;
  notes?: string;
}

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  governorate: string;
  postalCode?: string;
  landmark?: string;
  instructions?: string;
}

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  transactionId?: string;
  paymentDetails?: Record<string, any>;
  paidAt?: Date;
  refundedAt?: Date;
}

export interface OrderTracking {
  status: OrderStatus;
  timestamp: Date;
  location?: string;
  notes?: string;
  updatedBy: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;

  // Order Items
  items: OrderItem[];
  totalAmount: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;

  // Status & Tracking
  status: OrderStatus;
  tracking: OrderTracking[];

  // Shipping
  shippingAddress: ShippingAddress;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  shippingProvider?: string;
  trackingNumber?: string;

  // Payment
  payment: PaymentInfo;

  // Vendor Information
  vendorId: string;
  vendorName: string;

  // Metadata
  notes?: string;
  internalNotes?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface CreateOrderData {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Omit<OrderItem, 'title'>[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  notes?: string;
  shippingCost?: number;
  discountAmount?: number;
}

export class OrderService {
  private static COLLECTION_NAME = 'orders';
  private static COUNTERS_COLLECTION = 'counters';

  /**
   * Create a new order
   */
  static async createOrder(orderData: CreateOrderData): Promise<string> {
    try {
      return await runTransaction(db, async transaction => {
        // Get product details and calculate totals
        let totalAmount = 0;
        const enrichedItems: OrderItem[] = [];
        let vendorId = '';
        let vendorName = '';

        for (const item of orderData.items) {
          const productDoc = await transaction.get(doc(db, 'products', item.productId));
          if (!productDoc.exists()) {
            throw new Error(`Product ${item.productId} not found`);
          }

          const productData = productDoc.data();
          const itemTotal = productData.price * ((item as any)?.quantity);
          totalAmount += itemTotal;

          // Set vendor info (assuming all items are from the same vendor for now)
          if (!vendorId) {
            vendorId = productData.vendorId;
            const vendorDoc = await transaction.get(doc(db, 'vendors', vendorId));
            vendorName = vendorDoc.exists() ? vendorDoc.data().businessName : 'Unknown Vendor';
          }

          enrichedItems.push({
            ...(item as any),
            title: productData.title,
            price: productData.price,
            vendorId: productData.vendorId,
          });

          // Update product inventory
          transaction.update(doc(db, 'products', item.productId), {
            quantity: increment(-((item as any)?.quantity)),
            updatedAt: serverTimestamp(),
          });
        }

        // Calculate final amounts
        const shippingCost = orderData.shippingCost || 0;
        const discountAmount = orderData.discountAmount || 0;
        const taxAmount = totalAmount * 0.14; // 14% VAT in Egypt
        const finalAmount = totalAmount + shippingCost + taxAmount - discountAmount;

        // Generate order number
        const orderCounterDoc = doc(db, this.COUNTERS_COLLECTION, 'orders');
        const orderCounter = await transaction.get(orderCounterDoc);
        const orderNumber = (orderCounter.exists() ? orderCounter.data().count : 0) + 1;

        transaction.set(orderCounterDoc, { count: orderNumber }, { merge: true });

        // Create order
        const orderDoc = doc(collection(db, this.COLLECTION_NAME));
        const order: Omit<Order, 'id'> = {
          customerId: orderData.customerId,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          items: enrichedItems,
          totalAmount,
          shippingCost,
          taxAmount,
          discountAmount,
          finalAmount,
          currency: 'EGP',
          status: 'pending',
          tracking: [
            {
              status: 'pending',
              timestamp: new Date(),
              notes: 'Order placed',
              updatedBy: orderData.customerId,
            },
          ],
          shippingAddress: orderData.shippingAddress,
          payment: {
            method: orderData.paymentMethod,
            status: 'pending',
            amount: finalAmount,
            currency: 'EGP',
          },
          vendorId,
          vendorName,
          notes: orderData.notes,
          priority: 'medium',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        transaction.set(orderDoc, {
          ...order,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          tracking: [
            {
              ...order.tracking[0],
              timestamp: serverTimestamp(),
            },
          ],
        });

        return orderDoc.id;
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }

  /**
   * Update order status with real-time notifications
   */
  static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    updatedBy: string,
    notes?: string,
    location?: string
  ): Promise<void> {
    try {
      await runTransaction(db, async transaction => {
        const orderDoc = doc(db, this.COLLECTION_NAME, orderId);
        const orderSnapshot = await transaction.get(orderDoc);

        if (!orderSnapshot.exists()) {
          throw new Error('Order not found');
        }

        const orderData = orderSnapshot.data() as Order;

        // Add new tracking entry
        const newTracking: OrderTracking = {
          status: newStatus,
          timestamp: new Date(),
          location,
          notes,
          updatedBy,
        };

        const updatedTracking = [...orderData.tracking, newTracking];
        const updateData: Partial<Order> = {
          status: newStatus,
          tracking: updatedTracking,
          updatedAt: new Date(),
        };

        // Set specific timestamps based on status
        switch (newStatus) {
          case 'confirmed':
            updateData.confirmedAt = new Date();
//             break;
          case 'shipped':
            updateData.shippedAt = new Date();
//             break;
          case 'delivered':
            updateData.deliveredAt = new Date();
            updateData.actualDelivery = new Date();
//             break;
        }

        transaction.update(orderDoc, {
          ...updateData,
          updatedAt: serverTimestamp(),
          tracking: updatedTracking.map(t => ({
            ...t,
            timestamp: t.timestamp instanceof Date ? serverTimestamp() : t.timestamp,
          })),
        });

        // Send notifications based on status change
        await this.sendStatusUpdateNotifications(orderData, newStatus);
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    transactionId?: string,
    paymentDetails?: Record<string, any>
  ): Promise<void> {
    try {
      const orderDoc = doc(db, this.COLLECTION_NAME, orderId);
      const updateData: unknown = {
        'payment.status': paymentStatus,
        updatedAt: serverTimestamp(),
      };

      if (transactionId) {
        updateData['payment.transactionId'] = transactionId;
      }

      if (paymentDetails) {
        updateData['payment.paymentDetails'] = paymentDetails;
      }

      if (paymentStatus === 'completed') {
        updateData['payment.paidAt'] = serverTimestamp();
        // Auto-update order status to paid
        updateData.status = 'paid';
      }

      await updateDoc(orderDoc, updateData);

      // Send payment notification
      const orderSnapshot = await getDoc(orderDoc);
      if (orderSnapshot.exists()) {
        const orderData = orderSnapshot.data() as Order;
        await this.sendPaymentNotifications(orderData, paymentStatus);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error updating payment status:', error);
      throw new Error('Failed to update payment status');
    }
  }

  /**
   * Get order by ID
   */
  static async getOrder(orderId: string): Promise<Order | null> {
    try {
      const orderDoc = await getDoc(doc(db, this.COLLECTION_NAME, orderId));
      if (orderDoc.exists()) {
        const data = orderDoc.data();
        return {
          id: orderDoc.id,
          ...(data as any),
          createdAt: data.createdAt.toDate() || new Date(),
          updatedAt: data.updatedAt.toDate() || new Date(),
          confirmedAt: data.confirmedAt.toDate() || new Date() || null,
          shippedAt: data.shippedAt.toDate() || new Date() || null,
          deliveredAt: data.deliveredAt.toDate() || new Date() || null,
          estimatedDelivery: data.estimatedDelivery.toDate() || new Date() || null,
          actualDelivery: data.actualDelivery.toDate() || new Date() || null,
          tracking:
            data.tracking?.map((t: unknown) => ({
              ...t,
              timestamp: t.timestamp.toDate() || new Date(),
            })) || [],
          payment: {
            ...data.payment,
            paidAt: data.payment?.paidAt.toDate() || new Date() || null,
            refundedAt: data.payment?.refundedAt.toDate() || new Date() || null,
          },
        } as Order;
      }
      return null;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error getting order:', error);
      throw new Error('Failed to get order');
    }
  }

  /**
   * Get orders by customer with real-time updates
   */
  static subscribeToCustomerOrders(
    customerId: string,
    callback: (orders: Order[]) => void,
    limitCount: number = 20
  ): () => void {
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q, snapshot => {
      const orders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...(data as any),
          createdAt: data.createdAt.toDate() || new Date(),
          updatedAt: data.updatedAt.toDate() || new Date(),
          confirmedAt: data.confirmedAt.toDate() || new Date() || null,
          shippedAt: data.shippedAt.toDate() || new Date() || null,
          deliveredAt: data.deliveredAt.toDate() || new Date() || null,
          estimatedDelivery: data.estimatedDelivery.toDate() || new Date() || null,
          actualDelivery: data.actualDelivery.toDate() || new Date() || null,
          tracking:
            data.tracking?.map((t: unknown) => ({
              ...t,
              timestamp: t.timestamp.toDate() || new Date(),
            })) || [],
          payment: {
            ...data.payment,
            paidAt: data.payment?.paidAt.toDate() || new Date() || null,
            refundedAt: data.payment?.refundedAt.toDate() || new Date() || null,
          },
        } as Order;
      });
      callback(orders);
    });
  }

  /**
   * Get orders by vendor with real-time updates
   */
  static subscribeToVendorOrders(
    vendorId: string,
    callback: (orders: Order[]) => void,
    status?: OrderStatus,
    limitCount: number = 50
  ): () => void {
    let q = query(
      collection(db, this.COLLECTION_NAME),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (status) {
      q = query(
        collection(db, this.COLLECTION_NAME),
        where('vendorId', '==', vendorId),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }

    return onSnapshot(q, snapshot => {
      const orders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...(data as any),
          createdAt: data.createdAt.toDate() || new Date(),
          updatedAt: data.updatedAt.toDate() || new Date(),
          confirmedAt: data.confirmedAt.toDate() || new Date() || null,
          shippedAt: data.shippedAt.toDate() || new Date() || null,
          deliveredAt: data.deliveredAt.toDate() || new Date() || null,
          estimatedDelivery: data.estimatedDelivery.toDate() || new Date() || null,
          actualDelivery: data.actualDelivery.toDate() || new Date() || null,
          tracking:
            data.tracking?.map((t: unknown) => ({
              ...t,
              timestamp: t.timestamp.toDate() || new Date(),
            })) || [],
          payment: {
            ...data.payment,
            paidAt: data.payment?.paidAt.toDate() || new Date() || null,
            refundedAt: data.payment?.refundedAt.toDate() || new Date() || null,
          },
        } as Order;
      });
      callback(orders);
    });
  }

  /**
   * Get all orders for admin with real-time updates
   */
  static subscribeToAllOrders(
    callback: (orders: Order[]) => void,
    status?: OrderStatus,
    limitCount: number = 100
  ): () => void {
    let q = query(
      collection(db, this.COLLECTION_NAME),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (status) {
      q = query(
        collection(db, this.COLLECTION_NAME),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }

    return onSnapshot(q, snapshot => {
      const orders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...(data as any),
          createdAt: data.createdAt.toDate() || new Date(),
          updatedAt: data.updatedAt.toDate() || new Date(),
          confirmedAt: data.confirmedAt.toDate() || new Date() || null,
          shippedAt: data.shippedAt.toDate() || new Date() || null,
          deliveredAt: data.deliveredAt.toDate() || new Date() || null,
          estimatedDelivery: data.estimatedDelivery.toDate() || new Date() || null,
          actualDelivery: data.actualDelivery.toDate() || new Date() || null,
          tracking:
            data.tracking?.map((t: unknown) => ({
              ...t,
              timestamp: t.timestamp.toDate() || new Date(),
            })) || [],
          payment: {
            ...data.payment,
            paidAt: data.payment?.paidAt.toDate() || new Date() || null,
            refundedAt: data.payment?.refundedAt.toDate() || new Date() || null,
          },
        } as Order;
      });
      callback(orders);
    });
  }

  /**
   * Send status update notifications
   */
  private static async sendStatusUpdateNotifications(
    order: Order,
    newStatus: OrderStatus
  ): Promise<void> {
    try {
      const language = 'ar'; // Default to Arabic, can be made dynamic

      switch (newStatus) {
        case 'confirmed':
          await NotificationService.sendTemplatedNotification(
            order.customerId,
            'order_confirmed',
            language,
            { orderId: order.id, vendorName: order.vendorName }
          );
//           break;

        case 'shipped':
          await NotificationService.sendTemplatedNotification(
            order.customerId,
            'order_shipped',
            language,
            { orderId: order.id, trackingNumber: order.trackingNumber }
          );
//           break;

        case 'delivered':
          await NotificationService.sendTemplatedNotification(
            order.customerId,
            'order_delivered',
            language,
            { orderId: order.id }
          );
//           break;

        case 'pending':
          // Notify vendor of new order
          await NotificationService.sendTemplatedNotification(
            order.vendorId,
            'order_placed',
            language,
            { orderId: order.id, customerName: order.customerName, amount: order.finalAmount }
          );
//           break;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error sending status update notifications:', error);
    }
  }

  /**
   * Send payment notifications
   */
  private static async sendPaymentNotifications(
    order: Order,
    paymentStatus: PaymentStatus
  ): Promise<void> {
    try {
      const language = 'ar'; // Default to Arabic, can be made dynamic

      switch (paymentStatus) {
        case 'completed':
          await NotificationService.sendTemplatedNotification(
            order.customerId,
            'payment_completed',
            language,
            { orderId: order.id, amount: order.finalAmount }
          );
//           break;

        case 'failed':
          await NotificationService.sendTemplatedNotification(
            order.customerId,
            'payment_failed',
            language,
            { orderId: order.id }
          );
//           break;

        case 'pending':
          await NotificationService.sendTemplatedNotification(
            order.customerId,
            'payment_pending',
            language,
            { orderId: order.id, amount: order.finalAmount }
          );
//           break;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error sending payment notifications:', error);
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(orderId: string, cancelledBy: string, reason?: string): Promise<void> {
    try {
      await runTransaction(db, async transaction => {
        const orderDoc = doc(db, this.COLLECTION_NAME, orderId);
        const orderSnapshot = await transaction.get(orderDoc);

        if (!orderSnapshot.exists()) {
          throw new Error('Order not found');
        }

        const orderData = orderSnapshot.data() as Order;

        // Can only cancel pending or confirmed orders
        if (!['pending', 'confirmed', 'payment_pending'].includes(orderData.status)) {
          throw new Error('Order cannot be cancelled at this stage');
        }

        // Restore product inventory
        for (const item of orderData.items) {
          transaction.update(doc(db, 'products', item.productId), {
            quantity: increment(((item as any)?.quantity)),
            updatedAt: serverTimestamp(),
          });
        }

        // Update order status
        const newTracking: OrderTracking = {
          status: 'cancelled',
          timestamp: new Date(),
          notes: reason || 'Order cancelled',
          updatedBy: cancelledBy,
        };

        transaction.update(orderDoc, {
          status: 'cancelled',
          tracking: [...orderData.tracking, newTracking],
          updatedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error cancelling order:', error);
      throw new Error('Failed to cancel order');
    }
  }
}
