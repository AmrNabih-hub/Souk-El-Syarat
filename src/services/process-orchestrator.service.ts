import { db } from './firebase';

import { OrderService } from './order.service';

import { MessagingService } from './messaging.service';

export interface ProcessEvent {
  id: string;
  type:
    | 'vendor_application'
    | 'product_submission'
    | 'order_placed'
    | 'payment_completed'
    | 'user_registered';
  entityId: string;
  entityType: 'vendor' | 'product' | 'order' | 'user';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  triggeredBy: string;
  data: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type:
    | 'notification'
    | 'status_update'
    | 'analytics'
    | 'messaging'
    | 'validation'
    | 'external_api';
  config: Record<string, any>;
  dependencies?: string[];
  retryConfig?: {
    maxRetries: number;
    delayMs: number;
  };
}

export interface Workflow {
  id: string;
  name: string;
  triggerEvent: ProcessEvent['type'];
  steps: WorkflowStep[];
  active: boolean;
}

export class ProcessOrchestratorService {
  private static instance: ProcessOrchestratorService;
  private listeners: Map<string, () => void> = new Map();
  private workflows: Map<string, Workflow> = new Map();

  private constructor() {
    this.initializeWorkflows();
    this.startListening();
  }

  static getInstance(): ProcessOrchestratorService {
    if (!ProcessOrchestratorService.instance) {
      ProcessOrchestratorService.instance = new ProcessOrchestratorService();
    }
    return ProcessOrchestratorService.instance;
  }

  /**
   * Initialize all business process workflows
   */
  private initializeWorkflows(): void {
    // Vendor Application Workflow
    this.workflows.set('vendor_application_workflow', {
      id: 'vendor_application_workflow',
      name: 'Vendor Application Process',
      triggerEvent: 'vendor_application',
      active: true,
      steps: [
        {
          id: 'notify_admin',
          name: 'Notify Admin of New Application',
          type: 'notification',
          config: {
            recipients: ['admin'],
            template: 'vendor_application_submitted',
            priority: 'high',
          },
        },
        {
          id: 'notify_vendor',
          name: 'Confirm Receipt to Vendor',
          type: 'notification',
          config: {
            recipients: ['applicant'],
            template: 'vendor_application_received',
            priority: 'medium',
          },
        },
        {
          id: 'track_analytics',
          name: 'Track Application Analytics',
          type: 'analytics',
          config: {
            event: 'vendor_application_submitted',
            metrics: ['total_applications', 'pending_applications'],
          },
        },
        {
          id: 'create_support_conversation',
          name: 'Create Support Conversation',
          type: 'messaging',
          config: {
            type: 'admin_vendor',
            title: 'Vendor Application Support',
          },
        },
      ],
    });

    // Product Submission Workflow
    this.workflows.set('product_submission_workflow', {
      id: 'product_submission_workflow',
      name: 'Product Submission Process',
      triggerEvent: 'product_submission',
      active: true,
      steps: [
        {
          id: 'validate_product',
          name: 'Validate Product Data',
          type: 'validation',
          config: {
            rules: ['required_fields', 'image_quality', 'description_length'],
          },
        },
        {
          id: 'notify_vendor',
          name: 'Notify Vendor of Submission',
          type: 'notification',
          config: {
            recipients: ['vendor'],
            template: 'product_submitted',
            priority: 'low',
          },
        },
        {
          id: 'notify_admin',
          name: 'Notify Admin for Review',
          type: 'notification',
          config: {
            recipients: ['admin'],
            template: 'product_needs_review',
            priority: 'medium',
          },
        },
        {
          id: 'track_submission',
          name: 'Track Submission Analytics',
          type: 'analytics',
          config: {
            event: 'product_submitted',
            metrics: ['products_pending_review'],
          },
        },
      ],
    });

    // Order Placement Workflow
    this.workflows.set('order_placement_workflow', {
      id: 'order_placement_workflow',
      name: 'Order Placement Process',
      triggerEvent: 'order_placed',
      active: true,
      steps: [
        {
          id: 'notify_vendor',
          name: 'Notify Vendor of New Order',
          type: 'notification',
          config: {
            recipients: ['vendor'],
            template: 'order_placed',
            priority: 'high',
          },
        },
        {
          id: 'notify_customer',
          name: 'Confirm Order to Customer',
          type: 'notification',
          config: {
            recipients: ['customer'],
            template: 'order_confirmation',
            priority: 'medium',
          },
        },
        {
          id: 'create_order_conversation',
          name: 'Create Order Support Conversation',
          type: 'messaging',
          config: {
            type: 'vendor_customer',
            title: 'Order Communication',
          },
        },
        {
          id: 'track_order_analytics',
          name: 'Track Order Analytics',
          type: 'analytics',
          config: {
            event: 'order_placed',
            metrics: ['total_orders', 'pending_orders', 'revenue'],
          },
        },
        {
          id: 'update_inventory',
          name: 'Update Product Inventory',
          type: 'status_update',
          config: {
            entity: 'product',
            action: 'decrease_inventory',
          },
        },
      ],
    });

    // Payment Completion Workflow
    this.workflows.set('payment_completion_workflow', {
      id: 'payment_completion_workflow',
      name: 'Payment Completion Process',
      triggerEvent: 'payment_completed',
      active: true,
      steps: [
        {
          id: 'update_order_status',
          name: 'Update Order Status to Paid',
          type: 'status_update',
          config: {
            entity: 'order',
            status: 'paid',
          },
        },
        {
          id: 'notify_vendor',
          name: 'Notify Vendor of Payment',
          type: 'notification',
          config: {
            recipients: ['vendor'],
            template: 'payment_received',
            priority: 'high',
          },
        },
        {
          id: 'notify_customer',
          name: 'Confirm Payment to Customer',
          type: 'notification',
          config: {
            recipients: ['customer'],
            template: 'payment_completed',
            priority: 'medium',
          },
        },
        {
          id: 'track_payment_analytics',
          name: 'Track Payment Analytics',
          type: 'analytics',
          config: {
            event: 'payment_completed',
            metrics: ['total_revenue', 'successful_payments'],
          },
        },
        {
          id: 'send_order_message',
          name: 'Send Order Update Message',
          type: 'messaging',
          config: {
            messageType: 'order_update',
            content: 'Payment has been confirmed. Your order is being processed.',
          },
        },
      ],
    });

    // User Registration Workflow
    this.workflows.set('user_registration_workflow', {
      id: 'user_registration_workflow',
      name: 'User Registration Process',
      triggerEvent: 'user_registered',
      active: true,
      steps: [
        {
          id: 'send_welcome_notification',
          name: 'Send Welcome Notification',
          type: 'notification',
          config: {
            recipients: ['user'],
            template: 'welcome_message',
            priority: 'medium',
          },
        },
        {
          id: 'track_user_analytics',
          name: 'Track User Registration',
          type: 'analytics',
          config: {
            event: 'user_registered',
            metrics: ['total_users', 'new_registrations'],
          },
        },
        {
          id: 'create_welcome_conversation',
          name: 'Create Welcome Support Conversation',
          type: 'messaging',
          config: {
            type: 'customer_support',
            title: 'Welcome to Souk El-Sayarat',
            initialMessage: 'Welcome! How can we help you get started?',
          },
        },
      ],
    });
  }

  /**
   * Start listening to all relevant collections for process triggers
   */
  private startListening(): void {
    this.listenToVendorApplications();
    this.listenToProductSubmissions();
    this.listenToOrders();
    this.listenToPayments();
    this.listenToUserRegistrations();
  }

  /**
   * Listen to vendor applications
   */
  private listenToVendorApplications(): void {
    const q = query(collection(db, 'vendor_applications'), where('status', '==', 'pending'));

    const unsubscribe = onSnapshot(q, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          this.triggerWorkflow('vendor_application', {
            id: change.doc.id,
            type: 'vendor_application',
            entityId: change.doc.id,
            entityType: 'vendor',
            status: 'pending',
            triggeredBy: data.userId,
            data: data,
            createdAt: new Date(),
          });
        }
      });
    });

    this.listeners.set('vendor_applications', unsubscribe);
  }

  /**
   * Listen to product submissions
   */
  private listenToProductSubmissions(): void {
    const q = query(collection(db, 'products'), where('status', '==', 'pending'));

    const unsubscribe = onSnapshot(q, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          this.triggerWorkflow('product_submission', {
            id: change.doc.id,
            type: 'product_submission',
            entityId: change.doc.id,
            entityType: 'product',
            status: 'pending',
            triggeredBy: data.vendorId,
            data: data,
            createdAt: new Date(),
          });
        }
      });
    });

    this.listeners.set('product_submissions', unsubscribe);
  }

  /**
   * Listen to orders
   */
  private listenToOrders(): void {
    const q = query(collection(db, 'orders'), where('status', '==', 'pending'));

    const unsubscribe = onSnapshot(q, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          this.triggerWorkflow('order_placed', {
            id: change.doc.id,
            type: 'order_placed',
            entityId: change.doc.id,
            entityType: 'order',
            status: 'pending',
            triggeredBy: data.customerId,
            data: data,
            createdAt: new Date(),
          });
        }
      });
    });

    this.listeners.set('orders', unsubscribe);
  }

  /**
   * Listen to payments
   */
  private listenToPayments(): void {
    const q = query(collection(db, 'orders'));

    const unsubscribe = onSnapshot(q, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'modified') {
          const data = change.doc.data();
          const previousData = change.doc.metadata.hasPendingWrites ? null : change.doc.data();

          // Check if payment status changed to completed
          if (
            data.payment?.status === 'completed' &&
            previousData?.payment?.status !== 'completed'
          ) {
            this.triggerWorkflow('payment_completed', {
              id: `${change.doc.id}_payment`,
              type: 'payment_completed',
              entityId: change.doc.id,
              entityType: 'order',
              status: 'pending',
              triggeredBy: data.customerId,
              data: data,
              createdAt: new Date(),
            });
          }
        }
      });
    });

    this.listeners.set('payments', unsubscribe);
  }

  /**
   * Listen to user registrations
   */
  private listenToUserRegistrations(): void {
    const q = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(q, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          this.triggerWorkflow('user_registered', {
            id: change.doc.id,
            type: 'user_registered',
            entityId: change.doc.id,
            entityType: 'user',
            status: 'pending',
            triggeredBy: change.doc.id,
            data: data,
            createdAt: new Date(),
          });
        }
      });
    });

    this.listeners.set('user_registrations', unsubscribe);
  }

  /**
   * Trigger a workflow based on an event
   */
  private async triggerWorkflow(
    eventType: ProcessEvent['type'],
    event: ProcessEvent
  ): Promise<void> {
    try {
      // Find matching workflows
      const matchingWorkflows = Array.from(this.workflows.values()).filter(
        workflow => workflow.triggerEvent === eventType && workflow.active
      );

      for (const workflow of matchingWorkflows) {
        await this.executeWorkflow(workflow, event);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          console.error('Error triggering workflow:', error);
      // Track error in analytics
      await AnalyticsService.trackMetric('error', 'workflow_trigger_error', 1, 'count', {
        eventType,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Execute a workflow
   */
  private async executeWorkflow(workflow: Workflow, event: ProcessEvent): Promise<void> {
    try {
      // if (process.env.NODE_ENV === 'development') console.log(`Executing workflow: ${workflow.name} for event: ${event.id}`);

      for (const step of workflow.steps) {
        await this.executeWorkflowStep(step, event, workflow);
      }

      // Track workflow completion
      await AnalyticsService.trackEvent({
        type: 'system_event',
        userId: event.triggeredBy,
        sessionId: 'system',
        action: 'workflow_completed',
        label: workflow.id,
        metadata: {
          workflowName: workflow.name,
          eventId: event.id,
          eventType: event.type,
        },
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          console.error(`Error executing workflow ${workflow.id}:`, error);

      // Track workflow error
      await AnalyticsService.trackMetric('error', 'workflow_execution_error', 1, 'count', {
        workflowId: workflow.id,
        eventId: event.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeWorkflowStep(
    step: WorkflowStep,
    event: ProcessEvent,
    workflow: Workflow
  ): Promise<void> {
    try {
      // if (process.env.NODE_ENV === 'development') console.log(`Executing step: ${step.name} in workflow: ${workflow.name}`);

      switch (step.type) {
        case 'notification':
          await this.executeNotificationStep(step, event);
        //           break;

        case 'status_update':
          await this.executeStatusUpdateStep(step, event);
        //           break;

        case 'analytics':
          await this.executeAnalyticsStep(step, event);
        //           break;

        case 'messaging':
          await this.executeMessagingStep(step, event);
        //           break;

        case 'validation':
          await this.executeValidationStep(step, event);
        //           break;

        case 'external_api':
          await this.executeExternalApiStep(step, event);
        //           break;

        default:
        // if (process.env.NODE_ENV === 'development') console.warn(`Unknown step type: ${step.type}`);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        if (process.env.NODE_ENV === 'development')
          console.error(`Error executing step ${step.id}:`, error);

      // Retry logic if configured
      if (step.retryConfig) {
        await this.retryStep(
          step,
          event,
          workflow,
          error instanceof Error ? error : new Error(String(error))
        );
      }

      throw error;
    }
  }

  /**
   * Execute notification step
   */
  private async executeNotificationStep(step: WorkflowStep, event: ProcessEvent): Promise<void> {
    const { recipients, template } = step.config;
    const language = 'ar'; // Default language, could be dynamic

    for (const recipient of recipients) {
      let userId: string;

      switch (recipient) {
        case 'admin':
          userId = 'admin_user_id'; // Should be configured
        //           break;
        case 'vendor':
          userId = event.data.vendorId || event.triggeredBy;
        //           break;
        case 'customer':
          userId = event.data.customerId || event.triggeredBy;
        //           break;
        case 'applicant':
        case 'user':
        default:
          userId = event.triggeredBy;
        //           break;
      }

      await NotificationService.sendTemplatedNotification(userId, template, language, {
        eventId: event.id,
        entityId: event.entityId,
        ...event.data,
      });
    }
  }

  /**
   * Execute status update step
   */
  private async executeStatusUpdateStep(step: WorkflowStep, event: ProcessEvent): Promise<void> {
    const { entity, status, action } = step.config;

    switch (entity) {
      case 'order':
        if (status) {
          await OrderService.updateOrderStatus(
            event.entityId,
            status,
            'system',
            `Status updated by workflow: ${step.name}`
          );
        }
      //         break;

      case 'product':
        if (action === 'decrease_inventory' && event.data.items) {
          // This would be handled by OrderService.createOrder
          // if (process.env.NODE_ENV === 'development') console.log('Inventory update handled by order creation');
        }
      //         break;

      default:
      // if (process.env.NODE_ENV === 'development') console.warn(`Unknown entity type for status update: ${entity}`);
    }
  }

  /**
   * Execute analytics step
   */
  private async executeAnalyticsStep(step: WorkflowStep, event: ProcessEvent): Promise<void> {
    const { event: analyticsEvent, metrics } = step.config;

    // Track the main event
    await AnalyticsService.trackEvent({
      type: 'system_event',
      userId: event.triggeredBy,
      sessionId: 'system',
      action: analyticsEvent,
      label: event.entityType,
      value: 1,
      metadata: event.data,
    });

    // Update metrics
    for (const metric of metrics) {
      await AnalyticsService.trackMetric('business', metric, 1, 'count', {
        eventType: event.type,
        entityType: event.entityType,
      });
    }
  }

  /**
   * Execute messaging step
   */
  private async executeMessagingStep(step: WorkflowStep, event: ProcessEvent): Promise<void> {
    const { type, title, initialMessage, messageType, content } = step.config;

    if (messageType === 'order_update' && event.entityType === 'order') {
      // Find existing conversation for the order
      const participants = [
        {
          userId: event.data.customerId,
          userName: event.data.customerName,
          role: 'customer' as const,
        },
        {
          userId: event.data.vendorId,
          userName: event.data.vendorName,
          role: 'vendor' as const,
        },
      ];

      const conversationId = await MessagingService.findOrCreateConversation(
        participants,
        'vendor_customer',
        event.entityId
      );

      await MessagingService.sendMessage({
        conversationId,
        senderId: 'system',
        senderName: 'System',
        senderRole: 'admin',
        type: 'system',
        content: content,
        metadata: {
          eventId: event.id,
          eventType: event.type,
        },
      });
    } else {
      // Create new conversation
      const participants = this.getParticipantsForConversation(event, type);

      await MessagingService.createConversation({
        type: type,
        title: title,
        participants,
        orderId: event.entityType === 'order' ? event.entityId : undefined,
        productId: event.entityType === 'product' ? event.entityId : undefined,
        initialMessage: initialMessage
          ? {
              content: initialMessage,
              type: 'text',
            }
          : undefined,
      });
    }
  }

  /**
   * Execute validation step
   */
  private async executeValidationStep(step: WorkflowStep, event: ProcessEvent): Promise<void> {
    const { rules } = step.config;

    // This would implement various validation rules
    // if (process.env.NODE_ENV === 'development') console.log(`Validating ${event.entityType} with rules:`, rules);

    // For now, just log - in a real implementation, this would validate data
    // and potentially update the entity status or create validation reports
  }

  /**
   * Execute external API step
   */
  private async executeExternalApiStep(step: WorkflowStep, _event: ProcessEvent): Promise<void> {
    // This would integrate with external APIs like payment gateways, shipping providers, etc.
    // if (process.env.NODE_ENV === 'development') console.log(`External API call for step: ${step.name}`);
  }

  /**
   * Retry a failed step
   */
  private async retryStep(
    step: WorkflowStep,
    event: ProcessEvent,
    workflow: Workflow,
    error: Error
  ): Promise<void> {
    const { maxRetries, delayMs } = step.retryConfig!;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // if (process.env.NODE_ENV === 'development') console.log(`Retrying step ${step.id}, attempt ${attempt}/${maxRetries}`);

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));

        await this.executeWorkflowStep(step, event, workflow);

        // if (process.env.NODE_ENV === 'development') console.log(`Step ${step.id} succeeded on retry attempt ${attempt}`);
        //         return;
      } catch (retryError) {
        if (process.env.NODE_ENV === 'development')
          if (process.env.NODE_ENV === 'development')
            console.error(`Retry attempt ${attempt} failed for step ${step.id}:`, retryError);

        if (attempt === maxRetries) {
          throw new Error(`Step ${step.id} failed after ${maxRetries} retries: ${error.message}`);
        }
      }
    }
  }

  /**
   * Get participants for conversation based on event and type
   */
  private getParticipantsForConversation(event: ProcessEvent, conversationType: string) {
    const participants = [];

    switch (conversationType) {
      case 'admin_vendor':
        participants.push(
          {
            userId: 'admin_user_id', // Should be configured
            userName: 'Admin',
            role: 'admin' as const,
          },
          {
            userId: event.triggeredBy,
            userName: event.data.businessName || event.data.displayName || 'User',
            role: 'vendor' as const,
          }
        );
      //         break;

      case 'vendor_customer':
        participants.push(
          {
            userId: event.data.vendorId,
            userName: event.data.vendorName,
            role: 'vendor' as const,
          },
          {
            userId: event.data.customerId,
            userName: event.data.customerName,
            role: 'customer' as const,
          }
        );
      //         break;

      case 'customer_support':
        participants.push(
          {
            userId: event.triggeredBy,
            userName: event.data.displayName || 'User',
            role: 'customer' as const,
          },
          {
            userId: 'support_user_id', // Should be configured
            userName: 'Support Team',
            role: 'admin' as const,
          }
        );
      //         break;
    }

    return participants;
  }

  /**
   * Stop all listeners
   */
  public stopListening(): void {
    this.listeners.forEach(unsubscribe => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  /**
   * Add custom workflow
   */
  public addWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  /**
   * Remove workflow
   */
  public removeWorkflow(workflowId: string): void {
    this.workflows.delete(workflowId);
  }

  /**
   * Get workflow by ID
   */
  public getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * List all workflows
   */
  public listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }
}
