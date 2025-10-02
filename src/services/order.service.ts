/**
 * Order Service - Now uses Appwrite Database
 */

import { AppwriteDatabaseService } from './appwrite-database.service';
import { appwriteConfig } from '@/config/appwrite.config';

export class OrderService {
  static async createOrder(orderData: any) {
    return await AppwriteDatabaseService.createDocument(
      appwriteConfig.collections.orders,
      orderData
    );
  }

  static async getOrder(orderId: string) {
    return await AppwriteDatabaseService.getDocument(
      appwriteConfig.collections.orders,
      orderId
    );
  }

  static async updateOrder(orderId: string, updates: any) {
    return await AppwriteDatabaseService.updateDocument(
      appwriteConfig.collections.orders,
      orderId,
      updates
    );
  }

  static async getOrdersByCustomer(customerId: string) {
    return await AppwriteDatabaseService.queryDocuments(
      appwriteConfig.collections.orders,
      {
        equal: { customerId },
        orderBy: 'createdAt',
        orderDirection: 'desc'
      }
    );
  }

  static async updateOrderStatus(orderId: string, status: string) {
    return await this.updateOrder(orderId, { status });
  }
}

export default OrderService;
