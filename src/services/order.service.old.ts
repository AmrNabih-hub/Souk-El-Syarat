import { generateClient } from 'aws-amplify/api';
import amplifyConfig from '@/config/amplify.config';

// Initialize Amplify client for GraphQL operations
const client = generateClient();

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

/**
 * AWS Amplify Order Service
 * Complete migration from Firebase to AWS Amplify
 */
export class OrderService {
  /**
   * Create a new order
   */
  static async createOrder(orderData: any): Promise<string> {
    try {
      const result = await client.graphql({
        query: `
          mutation CreateOrder($input: CreateOrderInput!) {
            createOrder(input: $input) {
              id
            }
          }
        `,
        variables: {
          input: {
            ...orderData,
            status: 'pending',
            paymentStatus: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        }
      });

      return result.data.createOrder.id;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }

  /**
   * Get order by ID
   */
  static async getOrder(orderId: string): Promise<any> {
    try {
      const result = await client.graphql({
        query: `
          query GetOrder($id: ID!) {
            getOrder(id: $id) {
              id
              customerId
              vendorId
              status
              paymentStatus
              paymentMethod
              items {
                productId
                title
                price
                quantity
              }
              subtotal
              tax
              shipping
              total
              shippingAddress {
                street
                city
                state
                zipCode
                country
              }
              createdAt
              updatedAt
            }
          }
        `,
        variables: { id: orderId }
      });

      if (result.data.getOrder) {
        const order = result.data.getOrder;
        return {
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
        };
      }
      return null;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error getting order:', error);
      throw new Error('Failed to get order');
    }
  }

  /**
   * Update order status (extended to accept actorId and notes for audit)
   */
  static async updateOrderStatus(orderId: string, status: string, actorId?: string | null, notes?: string): Promise<void> {
    try {
      await client.graphql({
        query: `
          mutation UpdateOrder($input: UpdateOrderInput!) {
            updateOrder(input: $input) {
              id
            }
          }
        `,
        variables: {
          input: {
            id: orderId,
            status,
            metadata: notes ? { notes } : undefined,
            updatedAt: new Date().toISOString(),
            actorId: actorId || null,
          }
        }
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }

  /**
   * Get orders by customer
   */
  static async getOrdersByCustomer(customerId: string): Promise<any[]> {
    try {
      const result = await client.graphql({
        query: `
          query ListOrdersByCustomer($customerId: ID!) {
            listOrders(filter: { customerId: { eq: $customerId } }) {
              items {
                id
                status
                paymentStatus
                total
                createdAt
                updatedAt
              }
            }
          }
        `,
        variables: { customerId }
      });

      return result.data.listOrders.items.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error getting customer orders:', error);
      throw new Error('Failed to get customer orders');
    }
  }

  /**
   * Get orders by vendor
   */
  static async getOrdersByVendor(vendorId: string): Promise<any[]> {
    try {
      const result = await client.graphql({
        query: `
          query ListOrdersByVendor($vendorId: ID!) {
            listOrders(filter: { vendorId: { eq: $vendorId } }) {
              items {
                id
                customerId
                status
                paymentStatus
                total
                createdAt
                updatedAt
              }
            }
          }
        `,
        variables: { vendorId }
      });

      return result.data.listOrders.items.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error getting vendor orders:', error);
      throw new Error('Failed to get vendor orders');
    }
  }

  /**
   * Subscribe to all orders (admin)
   */
  static subscribeToAllOrders(listener: (orders: any[]) => void): () => void {
    // Placeholder: Implement using GraphQL subscriptions or PubSub later.
    const interval = setInterval(() => listener([]), 60000);
    return () => clearInterval(interval);
  }

  /**
   * Subscribe to vendor orders
   */
  static subscribeToVendorOrders(vendorId: string, listener: (orders: any[]) => void): () => void {
    // Placeholder implementation
    const interval = setInterval(() => listener([]), 60000);
    return () => clearInterval(interval);
  }

  /**
   * Subscribe to customer orders
   */
  static subscribeToCustomerOrders(customerId: string, listener: (orders: any[]) => void): () => void {
    const interval = setInterval(() => listener([]), 60000);
    return () => clearInterval(interval);
  }

  // Placeholder methods for compatibility - will be implemented as needed
  static async createOrderFromCart(cartId: string, paymentMethod: PaymentMethod): Promise<string> {
    // TODO: Implement cart to order conversion
    throw new Error('Method not implemented yet');
  }

  static async processPayment(orderId: string): Promise<void> {
    // TODO: Implement payment processing
    throw new Error('Method not implemented yet');
  }

  static async cancelOrder(orderId: string, reason: string): Promise<void> {
    await this.updateOrderStatus(orderId, 'cancelled');
  }

  static async markAsDelivered(orderId: string): Promise<void> {
    await this.updateOrderStatus(orderId, 'delivered');
  }
}
