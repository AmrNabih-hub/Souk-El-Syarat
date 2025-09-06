/**
 * Comprehensive State Management Service
 * Manages all user states based on workflow responses and application state changes
 */

import { AuthService } from './auth.service';
import { RealtimeService } from './realtime.service';
import { EnhancedWorkflowService, WorkflowState, WorkflowResponse } from './enhanced-workflow.service';
import { PushNotificationService } from './push-notification.service';

export interface UserState {
  userId: string;
  role: 'customer' | 'vendor' | 'admin';
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  permissions: string[];
  workflowStates: {
    [workflowType: string]: WorkflowState;
  };
  lastActivity: Date;
  preferences: UserPreferences;
  notifications: UserNotification[];
  sessionData: SessionData;
}

export interface UserPreferences {
  language: 'ar' | 'en';
  theme: 'light' | 'dark';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    dataSharing: boolean;
    analytics: boolean;
  };
  ui: {
    sidebarCollapsed: boolean;
    dashboardLayout: 'grid' | 'list';
    itemsPerPage: number;
  };
}

export interface UserNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'workflow';
  title: string;
  message: string;
  data: any;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: string;
  data: any;
}

export interface SessionData {
  currentPage: string;
  lastWorkflowId?: string;
  pendingActions: PendingAction[];
  temporaryData: { [key: string]: any };
  sessionStartTime: Date;
  lastInteraction: Date;
}

export interface PendingAction {
  id: string;
  type: 'workflow_response' | 'approval' | 'confirmation' | 'payment' | 'verification';
  title: string;
  description: string;
  data: any;
  expiresAt: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export class ComprehensiveStateManagementService {
  private static instance: ComprehensiveStateManagementService;
  private userStates: Map<string, UserState> = new Map();
  private workflowService = EnhancedWorkflowService.getInstance();
  private stateChangeListeners: Map<string, (state: UserState) => void> = new Map();

  static getInstance(): ComprehensiveStateManagementService {
    if (!ComprehensiveStateManagementService.instance) {
      ComprehensiveStateManagementService.instance = new ComprehensiveStateManagementService();
    }
    return ComprehensiveStateManagementService.instance;
  }

  async initializeUserState(userId: string, role: 'customer' | 'vendor' | 'admin'): Promise<UserState> {
    const userState: UserState = {
      userId,
      role,
      status: 'active',
      permissions: this.getDefaultPermissions(role),
      workflowStates: {},
      lastActivity: new Date(),
      preferences: this.getDefaultPreferences(),
      notifications: [],
      sessionData: {
        currentPage: '/',
        sessionStartTime: new Date(),
        lastInteraction: new Date(),
        pendingActions: [],
        temporaryData: {}
      }
    };

    this.userStates.set(userId, userState);
    await this.broadcastStateChange(userId, userState);
    return userState;
  }

  async updateUserState(
    userId: string,
    updates: Partial<UserState>
  ): Promise<UserState | null> {
    const currentState = this.userStates.get(userId);
    if (!currentState) return null;

    const updatedState: UserState = {
      ...currentState,
      ...updates,
      lastActivity: new Date(),
      sessionData: {
        ...currentState.sessionData,
        lastInteraction: new Date()
      }
    };

    this.userStates.set(userId, updatedState);
    await this.broadcastStateChange(userId, updatedState);
    return updatedState;
  }

  async processWorkflowResponse(
    userId: string,
    workflowId: string,
    response: WorkflowResponse
  ): Promise<UserState | null> {
    const userState = this.userStates.get(userId);
    if (!userState) return null;

    // Update workflow state
    const workflow = this.workflowService.getWorkflow(workflowId);
    if (workflow) {
      userState.workflowStates[workflow.workflowType] = workflow;
    }

    // Process response based on type
    await this.processResponseByType(userId, response, userState);

    // Update user state
    userState.lastActivity = new Date();
    userState.sessionData.lastInteraction = new Date();

    // Remove completed pending actions
    userState.sessionData.pendingActions = userState.sessionData.pendingActions.filter(
      action => action.id !== response.id
    );

    this.userStates.set(userId, userState);
    await this.broadcastStateChange(userId, userState);

    return userState;
  }

  private async processResponseByType(
    userId: string,
    response: WorkflowResponse,
    userState: UserState
  ): Promise<void> {
    switch (response.responseType) {
      case 'approval':
        await this.processApprovalResponse(userId, response, userState);
        break;
      case 'rejection':
        await this.processRejectionResponse(userId, response, userState);
        break;
      case 'modification':
        await this.processModificationResponse(userId, response, userState);
        break;
      case 'confirmation':
        await this.processConfirmationResponse(userId, response, userState);
        break;
      case 'error':
        await this.processErrorResponse(userId, response, userState);
        break;
    }
  }

  private async processApprovalResponse(
    userId: string,
    response: WorkflowResponse,
    userState: UserState
  ): Promise<void> {
    // Handle approval responses
    if (response.data.workflowType === 'vendor_application') {
      // Vendor application approved
      userState.role = 'vendor';
      userState.status = 'active';
      userState.permissions = this.getDefaultPermissions('vendor');
      
      // Add notification
      this.addNotification(userState, {
        type: 'success',
        title: 'Application Approved',
        message: 'Your vendor application has been approved! You can now manage your products.',
        data: response.data,
        actions: [
          {
            id: 'view_dashboard',
            label: 'View Dashboard',
            type: 'primary',
            action: 'navigate',
            data: { path: '/vendor/dashboard' }
          }
        ]
      });

      // Update real-time presence
      await this.updateUserPresence(userId, 'vendor');
    } else if (response.data.workflowType === 'order') {
      // Order approved
      this.addNotification(userState, {
        type: 'success',
        title: 'Order Confirmed',
        message: 'Your order has been confirmed and is being processed.',
        data: response.data,
        actions: [
          {
            id: 'track_order',
            label: 'Track Order',
            type: 'primary',
            action: 'navigate',
            data: { path: '/orders' }
          }
        ]
      });
    }
  }

  private async processRejectionResponse(
    userId: string,
    response: WorkflowResponse,
    userState: UserState
  ): Promise<void> {
    // Handle rejection responses
    if (response.data.workflowType === 'vendor_application') {
      // Vendor application rejected
      this.addNotification(userState, {
        type: 'error',
        title: 'Application Rejected',
        message: response.message || 'Your vendor application has been rejected.',
        data: response.data,
        actions: [
          {
            id: 'reapply',
            label: 'Reapply',
            type: 'primary',
            action: 'navigate',
            data: { path: '/vendor/apply' }
          },
          {
            id: 'contact_support',
            label: 'Contact Support',
            type: 'secondary',
            action: 'navigate',
            data: { path: '/support' }
          }
        ]
      });
    } else if (response.data.workflowType === 'order') {
      // Order rejected
      this.addNotification(userState, {
        type: 'error',
        title: 'Order Rejected',
        message: response.message || 'Your order has been rejected.',
        data: response.data,
        actions: [
          {
            id: 'view_cart',
            label: 'View Cart',
            type: 'primary',
            action: 'navigate',
            data: { path: '/cart' }
          }
        ]
      });
    }
  }

  private async processModificationResponse(
    userId: string,
    response: WorkflowResponse,
    userState: UserState
  ): Promise<void> {
    // Handle modification responses
    this.addNotification(userState, {
      type: 'warning',
      title: 'Modification Required',
      message: response.message || 'Please make the requested modifications.',
      data: response.data,
      actions: [
        {
          id: 'make_modifications',
          label: 'Make Changes',
          type: 'primary',
          action: 'navigate',
          data: { path: response.data.redirectPath || '/' }
        }
      ]
    });
  }

  private async processConfirmationResponse(
    userId: string,
    response: WorkflowResponse,
    userState: UserState
  ): Promise<void> {
    // Handle confirmation responses
    this.addNotification(userState, {
      type: 'success',
      title: 'Confirmed',
      message: response.message || 'Your action has been confirmed.',
      data: response.data
    });
  }

  private async processErrorResponse(
    userId: string,
    response: WorkflowResponse,
    userState: UserState
  ): Promise<void> {
    // Handle error responses
    this.addNotification(userState, {
      type: 'error',
      title: 'Error',
      message: response.message || 'An error occurred while processing your request.',
      data: response.data,
      actions: [
        {
          id: 'retry',
          label: 'Retry',
          type: 'primary',
          action: 'retry',
          data: response.data
        },
        {
          id: 'contact_support',
          label: 'Contact Support',
          type: 'secondary',
          action: 'navigate',
          data: { path: '/support' }
        }
      ]
    });
  }

  private addNotification(userState: UserState, notification: Omit<UserNotification, 'id' | 'read' | 'createdAt'>): void {
    const newNotification: UserNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: new Date(),
      ...notification
    };

    userState.notifications.unshift(newNotification);
    
    // Keep only last 100 notifications
    if (userState.notifications.length > 100) {
      userState.notifications = userState.notifications.slice(0, 100);
    }
  }

  private async updateUserPresence(userId: string, role: string): Promise<void> {
    try {
      const realtimeService = RealtimeService.getInstance();
      await realtimeService.setUserOnline(userId, `/${role}/dashboard`);
    } catch (error) {
      console.error('Failed to update user presence:', error);
    }
  }

  private getDefaultPermissions(role: 'customer' | 'vendor' | 'admin'): string[] {
    const permissions = {
      customer: [
        'browse_products',
        'add_to_cart',
        'place_orders',
        'track_orders',
        'manage_profile',
        'view_notifications'
      ],
      vendor: [
        'browse_products',
        'add_to_cart',
        'place_orders',
        'track_orders',
        'manage_profile',
        'view_notifications',
        'manage_products',
        'manage_inventory',
        'view_analytics',
        'handle_orders',
        'manage_vendor_profile'
      ],
      admin: [
        'browse_products',
        'add_to_cart',
        'place_orders',
        'track_orders',
        'manage_profile',
        'view_notifications',
        'manage_products',
        'manage_inventory',
        'view_analytics',
        'handle_orders',
        'manage_vendor_profile',
        'manage_users',
        'review_applications',
        'system_settings',
        'view_all_analytics',
        'manage_system'
      ]
    };

    return permissions[role] || [];
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      language: 'en',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        sms: false,
        inApp: true
      },
      privacy: {
        profileVisibility: 'public',
        dataSharing: true,
        analytics: true
      },
      ui: {
        sidebarCollapsed: false,
        dashboardLayout: 'grid',
        itemsPerPage: 20
      }
    };
  }

  async addPendingAction(userId: string, action: Omit<PendingAction, 'id'>): Promise<void> {
    const userState = this.userStates.get(userId);
    if (!userState) return;

    const pendingAction: PendingAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...action
    };

    userState.sessionData.pendingActions.push(pendingAction);
    this.userStates.set(userId, userState);
    await this.broadcastStateChange(userId, userState);
  }

  async removePendingAction(userId: string, actionId: string): Promise<void> {
    const userState = this.userStates.get(userId);
    if (!userState) return;

    userState.sessionData.pendingActions = userState.sessionData.pendingActions.filter(
      action => action.id !== actionId
    );

    this.userStates.set(userId, userState);
    await this.broadcastStateChange(userId, userState);
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    const userState = this.userStates.get(userId);
    if (!userState) return;

    const notification = userState.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.userStates.set(userId, userState);
      await this.broadcastStateChange(userId, userState);
    }
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    const userState = this.userStates.get(userId);
    if (!userState) return;

    userState.preferences = {
      ...userState.preferences,
      ...preferences
    };

    this.userStates.set(userId, userState);
    await this.broadcastStateChange(userId, userState);
  }

  getUserState(userId: string): UserState | undefined {
    return this.userStates.get(userId);
  }

  getAllUserStates(): UserState[] {
    return Array.from(this.userStates.values());
  }

  subscribeToStateChanges(userId: string, callback: (state: UserState) => void): () => void {
    this.stateChangeListeners.set(userId, callback);
    return () => {
      this.stateChangeListeners.delete(userId);
    };
  }

  private async broadcastStateChange(userId: string, state: UserState): Promise<void> {
    const listener = this.stateChangeListeners.get(userId);
    if (listener) {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    }

    // Broadcast to real-time service
    try {
      const realtimeService = RealtimeService.getInstance();
      await realtimeService.broadcastToUser(userId, 'state_changed', state);
    } catch (error) {
      console.error('Failed to broadcast state change:', error);
    }
  }

  async cleanupUserState(userId: string): Promise<void> {
    this.userStates.delete(userId);
    this.stateChangeListeners.delete(userId);
  }
}

export default ComprehensiveStateManagementService;