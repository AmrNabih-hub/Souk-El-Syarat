import { doc, collection, addDoc, updateDoc, onSnapshot, query, where, orderBy, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase.config';
import NotificationService from './notification.service';

export interface OrderStatus {
  status: 'confirmed' | 'processing' | 'ready' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  timestamp: Date;
  location?: string;
  notes?: string;
  updatedBy?: string;
}

export interface OrderTracking {
  id: string;
  orderId: string;
  userId: string;
  itemType: 'car' | 'service' | 'part';
  itemName: string;
  currentStatus: OrderStatus['status'];
  statusHistory: OrderStatus[];
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  trackingNumber?: string;
  vendorId?: string;
  vendorName?: string;
  shippingAddress?: string;
  contactPhone?: string;
  paymentMethod: 'cod' | 'bank' | 'installment';
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingTracking {
  id: string;
  bookingId: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  providerId: string;
  providerName: string;
  currentStatus: 'confirmed' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  statusHistory: {
    status: BookingTracking['currentStatus'];
    timestamp: Date;
    notes?: string;
  }[];
  appointmentDate: Date;
  appointmentTime: string;
  duration: string;
  location: string;
  customerNotes?: string;
  providerNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

class OrderTrackingService {
  private static instance: OrderTrackingService;
  private notificationService = NotificationService.getInstance();

  static getInstance(): OrderTrackingService {
    if (!OrderTrackingService.instance) {
      OrderTrackingService.instance = new OrderTrackingService();
    }
    return OrderTrackingService.instance;
  }

  // Create order tracking record
  async createOrderTracking(orderData: Omit<OrderTracking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const trackingData = {
        ...orderData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        statusHistory: orderData.statusHistory.map(status => ({
          ...status,
          timestamp: Timestamp.fromDate(status.timestamp)
        })),
        estimatedDelivery: orderData.estimatedDelivery ? Timestamp.fromDate(orderData.estimatedDelivery) : null
      };

      const docRef = await addDoc(collection(db, 'orderTracking'), trackingData);
      
      // Send confirmation notification
      const notification = NotificationService.createOrderConfirmationNotification(
        orderData.userId,
        orderData.orderId,
        orderData.itemName,
        orderData.totalAmount
      );
      
      await this.notificationService.sendNotification(notification);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating order tracking:', error);
      throw error;
    }
  }

  // Create booking tracking record
  async createBookingTracking(bookingData: Omit<BookingTracking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const trackingData = {
        ...bookingData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        appointmentDate: Timestamp.fromDate(bookingData.appointmentDate),
        statusHistory: bookingData.statusHistory.map(status => ({
          ...status,
          timestamp: Timestamp.fromDate(status.timestamp)
        }))
      };

      const docRef = await addDoc(collection(db, 'bookingTracking'), trackingData);
      
      // Send confirmation notification
      const notification = NotificationService.createBookingConfirmationNotification(
        bookingData.userId,
        bookingData.bookingId,
        bookingData.serviceName,
        bookingData.appointmentDate.toLocaleDateString('ar-EG'),
        bookingData.appointmentTime
      );
      
      await this.notificationService.sendNotification(notification);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating booking tracking:', error);
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus['status'],
    notes?: string,
    location?: string,
    updatedBy?: string
  ): Promise<void> {
    try {
      const q = query(
        collection(db, 'orderTracking'),
        where('orderId', '==', orderId)
      );

      const snapshot = await q.get();
      if (snapshot.empty) {
        throw new Error('Order tracking not found');
      }

      const trackingDoc = snapshot.docs[0];
      const currentData = trackingDoc.data() as any;

      const newStatusEntry: OrderStatus = {
        status: newStatus,
        timestamp: new Date(),
        notes,
        location,
        updatedBy
      };

      const updatedStatusHistory = [
        ...currentData.statusHistory.map((s: any) => ({
          ...s,
          timestamp: s.timestamp.toDate()
        })),
        newStatusEntry
      ];

      await updateDoc(trackingDoc.ref, {
        currentStatus: newStatus,
        statusHistory: updatedStatusHistory.map(status => ({
          ...status,
          timestamp: Timestamp.fromDate(status.timestamp)
        })),
        updatedAt: Timestamp.now(),
        ...(newStatus === 'delivered' && { actualDelivery: Timestamp.now() })
      });

      // Send status update notification
      const notification = NotificationService.createOrderStatusUpdateNotification(
        currentData.userId,
        orderId,
        newStatus,
        currentData.itemName
      );
      
      await this.notificationService.sendNotification(notification);

    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Update booking status
  async updateBookingStatus(
    bookingId: string,
    newStatus: BookingTracking['currentStatus'],
    notes?: string
  ): Promise<void> {
    try {
      const q = query(
        collection(db, 'bookingTracking'),
        where('bookingId', '==', bookingId)
      );

      const snapshot = await q.get();
      if (snapshot.empty) {
        throw new Error('Booking tracking not found');
      }

      const trackingDoc = snapshot.docs[0];
      const currentData = trackingDoc.data() as any;

      const newStatusEntry = {
        status: newStatus,
        timestamp: new Date(),
        notes
      };

      const updatedStatusHistory = [
        ...currentData.statusHistory.map((s: any) => ({
          ...s,
          timestamp: s.timestamp.toDate()
        })),
        newStatusEntry
      ];

      await updateDoc(trackingDoc.ref, {
        currentStatus: newStatus,
        statusHistory: updatedStatusHistory.map(status => ({
          ...status,
          timestamp: Timestamp.fromDate(status.timestamp)
        })),
        updatedAt: Timestamp.now()
      });

    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }

  // Real-time order tracking subscription
  subscribeToOrderTracking(userId: string, callback: (orders: OrderTracking[]) => void) {
    const q = query(
      collection(db, 'orderTracking'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const orders: OrderTracking[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          orderId: data.orderId,
          userId: data.userId,
          itemType: data.itemType,
          itemName: data.itemName,
          currentStatus: data.currentStatus,
          statusHistory: data.statusHistory?.map((s: any) => ({
            ...s,
            timestamp: s.timestamp?.toDate() || new Date()
          })) || [],
          estimatedDelivery: data.estimatedDelivery?.toDate(),
          actualDelivery: data.actualDelivery?.toDate(),
          trackingNumber: data.trackingNumber,
          vendorId: data.vendorId,
          vendorName: data.vendorName,
          shippingAddress: data.shippingAddress,
          contactPhone: data.contactPhone,
          paymentMethod: data.paymentMethod,
          totalAmount: data.totalAmount,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });

      callback(orders);
    });
  }

  // Real-time booking tracking subscription
  subscribeToBookingTracking(userId: string, callback: (bookings: BookingTracking[]) => void) {
    const q = query(
      collection(db, 'bookingTracking'),
      where('userId', '==', userId),
      orderBy('appointmentDate', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const bookings: BookingTracking[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          bookingId: data.bookingId,
          userId: data.userId,
          serviceId: data.serviceId,
          serviceName: data.serviceName,
          providerId: data.providerId,
          providerName: data.providerName,
          currentStatus: data.currentStatus,
          statusHistory: data.statusHistory?.map((s: any) => ({
            ...s,
            timestamp: s.timestamp?.toDate() || new Date()
          })) || [],
          appointmentDate: data.appointmentDate?.toDate() || new Date(),
          appointmentTime: data.appointmentTime,
          duration: data.duration,
          location: data.location,
          customerNotes: data.customerNotes,
          providerNotes: data.providerNotes,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });

      callback(bookings);
    });
  }

  // Get order tracking by order ID
  async getOrderTrackingByOrderId(orderId: string): Promise<OrderTracking | null> {
    try {
      const q = query(
        collection(db, 'orderTracking'),
        where('orderId', '==', orderId)
      );

      const snapshot = await q.get();
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        orderId: data.orderId,
        userId: data.userId,
        itemType: data.itemType,
        itemName: data.itemName,
        currentStatus: data.currentStatus,
        statusHistory: data.statusHistory?.map((s: any) => ({
          ...s,
          timestamp: s.timestamp?.toDate() || new Date()
        })) || [],
        estimatedDelivery: data.estimatedDelivery?.toDate(),
        actualDelivery: data.actualDelivery?.toDate(),
        trackingNumber: data.trackingNumber,
        vendorId: data.vendorId,
        vendorName: data.vendorName,
        shippingAddress: data.shippingAddress,
        contactPhone: data.contactPhone,
        paymentMethod: data.paymentMethod,
        totalAmount: data.totalAmount,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Error getting order tracking:', error);
      return null;
    }
  }

  // Get booking tracking by booking ID
  async getBookingTrackingByBookingId(bookingId: string): Promise<BookingTracking | null> {
    try {
      const q = query(
        collection(db, 'bookingTracking'),
        where('bookingId', '==', bookingId)
      );

      const snapshot = await q.get();
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        bookingId: data.bookingId,
        userId: data.userId,
        serviceId: data.serviceId,
        serviceName: data.serviceName,
        providerId: data.providerId,
        providerName: data.providerName,
        currentStatus: data.currentStatus,
        statusHistory: data.statusHistory?.map((s: any) => ({
          ...s,
          timestamp: s.timestamp?.toDate() || new Date()
        })) || [],
        appointmentDate: data.appointmentDate?.toDate() || new Date(),
        appointmentTime: data.appointmentTime,
        duration: data.duration,
        location: data.location,
        customerNotes: data.customerNotes,
        providerNotes: data.providerNotes,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Error getting booking tracking:', error);
      return null;
    }
  }

  // Generate estimated delivery date
  static generateEstimatedDelivery(itemType: 'car' | 'service' | 'part', location?: string): Date {
    const now = new Date();
    let daysToAdd = 3; // Default 3 days

    switch (itemType) {
      case 'car':
        daysToAdd = 7; // Cars need more time for paperwork
        break;
      case 'service':
        daysToAdd = 1; // Services are usually same day or next day
        break;
      case 'part':
        daysToAdd = location === 'استلام من المتجر' ? 1 : 3; // Pickup vs delivery
        break;
    }

    // Add weekend consideration
    const deliveryDate = new Date(now);
    deliveryDate.setDate(now.getDate() + daysToAdd);

    // Skip Friday if it falls on delivery date
    if (deliveryDate.getDay() === 5) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
    }

    return deliveryDate;
  }

  // Get status display text
  static getStatusDisplayText(status: OrderStatus['status'], language: 'ar' | 'en' = 'ar'): string {
    const statusTexts = {
      ar: {
        confirmed: 'تم تأكيد الطلب',
        processing: 'جاري التجهيز',
        ready: 'جاهز للاستلام',
        shipped: 'تم الشحن',
        out_for_delivery: 'في الطريق إليك',
        delivered: 'تم التوصيل',
        cancelled: 'تم الإلغاء'
      },
      en: {
        confirmed: 'Order Confirmed',
        processing: 'Processing',
        ready: 'Ready for Pickup',
        shipped: 'Shipped',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
      }
    };

    return statusTexts[language][status] || status;
  }

  // Get booking status display text
  static getBookingStatusDisplayText(status: BookingTracking['currentStatus'], language: 'ar' | 'en' = 'ar'): string {
    const statusTexts = {
      ar: {
        confirmed: 'تم تأكيد الحجز',
        scheduled: 'تم جدولة الموعد',
        in_progress: 'جاري تنفيذ الخدمة',
        completed: 'تم الانتهاء',
        cancelled: 'تم الإلغاء'
      },
      en: {
        confirmed: 'Booking Confirmed',
        scheduled: 'Appointment Scheduled',
        in_progress: 'Service in Progress',
        completed: 'Completed',
        cancelled: 'Cancelled'
      }
    };

    return statusTexts[language][status] || status;
  }

  // Schedule booking reminders
  async scheduleBookingReminder(bookingId: string, appointmentDate: Date): Promise<void> {
    // Schedule reminder 24 hours before appointment
    const reminderDate = new Date(appointmentDate);
    reminderDate.setHours(reminderDate.getHours() - 24);

    // In a real application, you would use a job scheduler or cloud function
    // For now, we'll simulate with setTimeout for near-future appointments
    const msUntilReminder = reminderDate.getTime() - Date.now();
    
    if (msUntilReminder > 0 && msUntilReminder < 24 * 60 * 60 * 1000) { // Within 24 hours
      setTimeout(async () => {
        try {
          const booking = await this.getBookingTrackingByBookingId(bookingId);
          if (booking && booking.currentStatus === 'confirmed') {
            const notification = NotificationService.createBookingReminderNotification(
              booking.userId,
              bookingId,
              booking.serviceName
            );
            
            await this.notificationService.sendNotification(notification);
          }
        } catch (error) {
          console.error('Error sending booking reminder:', error);
        }
      }, msUntilReminder);
    }
  }
}

export default OrderTrackingService;