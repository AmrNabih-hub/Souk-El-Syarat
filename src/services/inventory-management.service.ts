/**
 * Inventory Management Service
 * Complete inventory management with real-time updates and vendor controls
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  deleteDoc,
  increment
} from 'firebase/firestore';
import { 
  ref, 
  push, 
  set, 
  update, 
  get, 
  onValue, 
  off 
} from 'firebase/database';
import { db, realtimeDb } from '@/config/firebase.config';

export interface InventoryItem {
  id: string;
  vendorId: string;
  productId: string;
  productName: string;
  category: string;
  subcategory?: string;
  sku: string;
  barcode?: string;
  description: string;
  specifications: Record<string, any>;
  images: string[];
  pricing: {
    cost: number;
    sellingPrice: number;
    margin: number;
    currency: string;
  };
  inventory: {
    quantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    minimumStock: number;
    maximumStock: number;
    reorderPoint: number;
    reorderQuantity: number;
  };
  status: 'active' | 'inactive' | 'discontinued' | 'pending_approval';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalNotes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  tags: string[];
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
  };
  shipping: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    shippingClass: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastRestockedAt?: Date;
  lastSoldAt?: Date;
  totalSold: number;
  averageRating: number;
  reviewCount: number;
}

export interface InventoryTransaction {
  id: string;
  vendorId: string;
  productId: string;
  type: 'stock_in' | 'stock_out' | 'adjustment' | 'return' | 'damage' | 'transfer';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  reference?: string; // Order ID, PO number, etc.
  notes?: string;
  performedBy: string;
  performedAt: Date;
  cost?: number;
  location?: string;
}

export interface InventoryAlert {
  id: string;
  vendorId: string;
  productId: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'reorder' | 'expiry';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface InventoryStats {
  totalProducts: number;
  activeProducts: number;
  pendingApproval: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  totalQuantity: number;
  averageMargin: number;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
}

export class InventoryManagementService {
  private static instance: InventoryManagementService;
  private realTimeSubscriptions: Map<string, () => void> = new Map();

  static getInstance(): InventoryManagementService {
    if (!InventoryManagementService.instance) {
      InventoryManagementService.instance = new InventoryManagementService();
    }
    return InventoryManagementService.instance;
  }

  /**
   * Add product to inventory
   */
  async addProductToInventory(
    vendorId: string,
    productData: Omit<InventoryItem, 'id' | 'vendorId' | 'createdAt' | 'updatedAt' | 'totalSold' | 'averageRating' | 'reviewCount'>
  ): Promise<string> {
    try {
      const inventoryItem: InventoryItem = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        vendorId,
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date(),
        totalSold: 0,
        averageRating: 0,
        reviewCount: 0
      };

      // Store in Firestore
      const docRef = await addDoc(collection(db, 'inventory'), {
        ...inventoryItem,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Store in Realtime Database for real-time updates
      const realTimeRef = ref(realtimeDb, `inventory/${docRef.id}`);
      await set(realTimeRef, inventoryItem);

      // Create initial stock transaction
      await this.createInventoryTransaction({
        vendorId,
        productId: docRef.id,
        type: 'stock_in',
        quantity: inventoryItem.inventory.quantity,
        previousQuantity: 0,
        newQuantity: inventoryItem.inventory.quantity,
        reason: 'Initial stock',
        performedBy: vendorId,
        performedAt: new Date()
      });

      // Check for alerts
      await this.checkInventoryAlerts(docRef.id, inventoryItem);

      // Track analytics
      await this.trackInventoryEvent('product_added', {
        productId: docRef.id,
        vendorId,
        category: inventoryItem.category,
        quantity: inventoryItem.inventory.quantity
      });

      console.log(`✅ Product added to inventory: ${docRef.id}`);
      return docRef.id;

    } catch (error) {
      console.error('Error adding product to inventory:', error);
      throw error;
    }
  }

  /**
   * Update inventory item
   */
  async updateInventoryItem(
    productId: string,
    updates: Partial<InventoryItem>
  ): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      // Update in Firestore
      const docRef = doc(db, 'inventory', productId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });

      // Update in Realtime Database
      const realTimeRef = ref(realtimeDb, `inventory/${productId}`);
      await update(realTimeRef, {
        ...updateData,
        updatedAt: updateData.updatedAt.toISOString()
      });

      // Check for alerts if quantity changed
      if (updates.inventory) {
        await this.checkInventoryAlerts(productId, updates as InventoryItem);
      }

      console.log(`✅ Inventory item updated: ${productId}`);

    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  /**
   * Update stock quantity
   */
  async updateStockQuantity(
    productId: string,
    quantity: number,
    type: InventoryTransaction['type'],
    reason: string,
    performedBy: string,
    reference?: string
  ): Promise<void> {
    try {
      const inventoryItem = await this.getInventoryItem(productId);
      if (!inventoryItem) {
        throw new Error('Inventory item not found');
      }

      const previousQuantity = inventoryItem.inventory.quantity;
      const newQuantity = type === 'stock_in' 
        ? previousQuantity + quantity 
        : previousQuantity - quantity;

      // Update inventory
      await this.updateInventoryItem(productId, {
        inventory: {
          ...inventoryItem.inventory,
          quantity: newQuantity,
          availableQuantity: newQuantity - inventoryItem.inventory.reservedQuantity
        },
        lastRestockedAt: type === 'stock_in' ? new Date() : inventoryItem.lastRestockedAt
      });

      // Create transaction record
      await this.createInventoryTransaction({
        vendorId: inventoryItem.vendorId,
        productId,
        type,
        quantity,
        previousQuantity,
        newQuantity,
        reason,
        reference,
        performedBy,
        performedAt: new Date()
      });

      // Check for alerts
      await this.checkInventoryAlerts(productId, {
        ...inventoryItem,
        inventory: {
          ...inventoryItem.inventory,
          quantity: newQuantity
        }
      });

      console.log(`✅ Stock updated: ${productId} - ${type} ${quantity}`);

    } catch (error) {
      console.error('Error updating stock quantity:', error);
      throw error;
    }
  }

  /**
   * Get inventory item by ID
   */
  async getInventoryItem(productId: string): Promise<InventoryItem | null> {
    try {
      const docRef = doc(db, 'inventory', productId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          approvedAt: data.approvedAt?.toDate(),
          lastRestockedAt: data.lastRestockedAt?.toDate(),
          lastSoldAt: data.lastSoldAt?.toDate()
        } as InventoryItem;
      }

      return null;
    } catch (error) {
      console.error('Error getting inventory item:', error);
      throw error;
    }
  }

  /**
   * Get vendor inventory
   */
  async getVendorInventory(
    vendorId: string,
    options: {
      status?: InventoryItem['status'];
      category?: string;
      limit?: number;
      orderBy?: string;
    } = {}
  ): Promise<InventoryItem[]> {
    try {
      let q = query(
        collection(db, 'inventory'),
        where('vendorId', '==', vendorId)
      );

      if (options.status) {
        q = query(q, where('status', '==', options.status));
      }

      if (options.category) {
        q = query(q, where('category', '==', options.category));
      }

      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy, 'desc'));
      } else {
        q = query(q, orderBy('updatedAt', 'desc'));
      }

      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        approvedAt: doc.data().approvedAt?.toDate(),
        lastRestockedAt: doc.data().lastRestockedAt?.toDate(),
        lastSoldAt: doc.data().lastSoldAt?.toDate()
      })) as InventoryItem[];
    } catch (error) {
      console.error('Error getting vendor inventory:', error);
      throw error;
    }
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats(vendorId: string): Promise<InventoryStats> {
    try {
      const inventory = await this.getVendorInventory(vendorId);
      
      const stats: InventoryStats = {
        totalProducts: inventory.length,
        activeProducts: inventory.filter(item => item.status === 'active').length,
        pendingApproval: inventory.filter(item => item.approvalStatus === 'pending').length,
        lowStockItems: inventory.filter(item => 
          item.inventory.quantity <= item.inventory.reorderPoint
        ).length,
        outOfStockItems: inventory.filter(item => item.inventory.quantity === 0).length,
        totalValue: inventory.reduce((sum, item) => 
          sum + (item.inventory.quantity * item.pricing.cost), 0),
        totalQuantity: inventory.reduce((sum, item) => sum + item.inventory.quantity, 0),
        averageMargin: inventory.length > 0 
          ? inventory.reduce((sum, item) => sum + item.pricing.margin, 0) / inventory.length 
          : 0,
        topSellingProducts: inventory
          .sort((a, b) => b.totalSold - a.totalSold)
          .slice(0, 5)
          .map(item => ({
            productId: item.id,
            productName: item.productName,
            quantitySold: item.totalSold,
            revenue: item.totalSold * item.pricing.sellingPrice
          }))
      };

      return stats;
    } catch (error) {
      console.error('Error getting inventory stats:', error);
      throw error;
    }
  }

  /**
   * Get inventory alerts
   */
  async getInventoryAlerts(vendorId: string): Promise<InventoryAlert[]> {
    try {
      const q = query(
        collection(db, 'inventoryAlerts'),
        where('vendorId', '==', vendorId),
        where('isRead', '==', false),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        resolvedAt: doc.data().resolvedAt?.toDate()
      })) as InventoryAlert[];
    } catch (error) {
      console.error('Error getting inventory alerts:', error);
      throw error;
    }
  }

  /**
   * Subscribe to inventory updates
   */
  subscribeToInventoryUpdates(
    vendorId: string,
    callback: (inventory: InventoryItem[]) => void
  ): () => void {
    const realTimeRef = ref(realtimeDb, 'inventory');
    
    const unsubscribe = onValue(realTimeRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const inventory: InventoryItem[] = Object.values(data)
          .filter((item: any) => item.vendorId === vendorId)
          .map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
            approvedAt: item.approvedAt ? new Date(item.approvedAt) : undefined,
            lastRestockedAt: item.lastRestockedAt ? new Date(item.lastRestockedAt) : undefined,
            lastSoldAt: item.lastSoldAt ? new Date(item.lastSoldAt) : undefined
          }));
        callback(inventory);
      }
    });

    this.realTimeSubscriptions.set(`inventory_${vendorId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to inventory alerts
   */
  subscribeToInventoryAlerts(
    vendorId: string,
    callback: (alerts: InventoryAlert[]) => void
  ): () => void {
    const realTimeRef = ref(realtimeDb, `inventoryAlerts/${vendorId}`);
    
    const unsubscribe = onValue(realTimeRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const alerts: InventoryAlert[] = Object.values(data)
          .filter((alert: any) => !alert.isRead)
          .map((alert: any) => ({
            ...alert,
            createdAt: new Date(alert.createdAt),
            resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : undefined
          }));
        callback(alerts);
      }
    });

    this.realTimeSubscriptions.set(`alerts_${vendorId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Approve inventory item (admin only)
   */
  async approveInventoryItem(
    productId: string,
    approvedBy: string,
    notes?: string
  ): Promise<void> {
    try {
      await this.updateInventoryItem(productId, {
        approvalStatus: 'approved',
        approvedBy,
        approvedAt: new Date(),
        status: 'active',
        approvalNotes: notes
      });

      // Notify vendor
      await this.notifyVendorInventoryStatus(productId, 'approved', notes);

      console.log(`✅ Inventory item approved: ${productId}`);

    } catch (error) {
      console.error('Error approving inventory item:', error);
      throw error;
    }
  }

  /**
   * Reject inventory item (admin only)
   */
  async rejectInventoryItem(
    productId: string,
    rejectedBy: string,
    reason: string
  ): Promise<void> {
    try {
      await this.updateInventoryItem(productId, {
        approvalStatus: 'rejected',
        approvedBy: rejectedBy,
        approvedAt: new Date(),
        status: 'inactive',
        approvalNotes: reason
      });

      // Notify vendor
      await this.notifyVendorInventoryStatus(productId, 'rejected', reason);

      console.log(`✅ Inventory item rejected: ${productId}`);

    } catch (error) {
      console.error('Error rejecting inventory item:', error);
      throw error;
    }
  }

  // Private helper methods

  private async createInventoryTransaction(transaction: Omit<InventoryTransaction, 'id'>): Promise<void> {
    try {
      const transactionData: InventoryTransaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...transaction
      };

      await addDoc(collection(db, 'inventoryTransactions'), {
        ...transactionData,
        performedAt: serverTimestamp()
      });

      // Store in Realtime Database
      const realTimeRef = ref(realtimeDb, `inventoryTransactions/${transactionData.id}`);
      await set(realTimeRef, transactionData);

    } catch (error) {
      console.error('Error creating inventory transaction:', error);
    }
  }

  private async checkInventoryAlerts(productId: string, item: InventoryItem): Promise<void> {
    try {
      const alerts: InventoryAlert[] = [];

      // Low stock alert
      if (item.inventory.quantity <= item.inventory.reorderPoint && item.inventory.quantity > 0) {
        alerts.push({
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          vendorId: item.vendorId,
          productId,
          type: 'low_stock',
          message: `Low stock alert: ${item.productName} has ${item.inventory.quantity} units remaining`,
          severity: 'medium',
          isRead: false,
          createdAt: new Date()
        });
      }

      // Out of stock alert
      if (item.inventory.quantity === 0) {
        alerts.push({
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          vendorId: item.vendorId,
          productId,
          type: 'out_of_stock',
          message: `Out of stock: ${item.productName} is out of stock`,
          severity: 'high',
          isRead: false,
          createdAt: new Date()
        });
      }

      // Overstock alert
      if (item.inventory.quantity > item.inventory.maximumStock) {
        alerts.push({
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          vendorId: item.vendorId,
          productId,
          type: 'overstock',
          message: `Overstock alert: ${item.productName} has ${item.inventory.quantity} units (max: ${item.inventory.maximumStock})`,
          severity: 'low',
          isRead: false,
          createdAt: new Date()
        });
      }

      // Create alerts
      for (const alert of alerts) {
        await addDoc(collection(db, 'inventoryAlerts'), {
          ...alert,
          createdAt: serverTimestamp()
        });

        // Store in Realtime Database
        const realTimeRef = ref(realtimeDb, `inventoryAlerts/${item.vendorId}/${alert.id}`);
        await set(realTimeRef, alert);
      }

    } catch (error) {
      console.error('Error checking inventory alerts:', error);
    }
  }

  private async notifyVendorInventoryStatus(
    productId: string,
    status: 'approved' | 'rejected',
    message?: string
  ): Promise<void> {
    try {
      const item = await this.getInventoryItem(productId);
      if (!item) return;

      const notificationRef = ref(realtimeDb, `userNotifications/${item.vendorId}`);
      await push(notificationRef, {
        type: 'inventory_status_update',
        productId,
        status,
        message: message || `Your product ${item.productName} has been ${status}`,
        timestamp: new Date().toISOString(),
        read: false
      });

    } catch (error) {
      console.error('Error notifying vendor:', error);
    }
  }

  private async trackInventoryEvent(eventType: string, data: any): Promise<void> {
    try {
      const eventRef = ref(realtimeDb, `analytics/inventory/${eventType}_${Date.now()}`);
      await set(eventRef, {
        ...data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking inventory event:', error);
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.realTimeSubscriptions.forEach(unsubscribe => unsubscribe());
    this.realTimeSubscriptions.clear();
  }
}

export default InventoryManagementService;