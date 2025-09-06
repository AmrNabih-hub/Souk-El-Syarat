/**
 * Enhanced Workflow Service
 * Manages complete user workflows with state management and response handling
 */

import { AuthService } from './auth.service';
import { RealtimeService } from './realtime.service';
import { OrderService } from './order.service';
import { ProductService } from './product.service';
import { VendorApplicationService } from './vendor-application.service';
import { InventoryManagementService } from './inventory-management.service';
import { PushNotificationService } from './push-notification.service';

export interface WorkflowState {
  id: string;
  userId: string;
  workflowType: 'customer' | 'vendor' | 'admin';
  currentStep: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  data: any;
  responses: WorkflowResponse[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface WorkflowResponse {
  id: string;
  stepId: string;
  responseType: 'approval' | 'rejection' | 'modification' | 'confirmation' | 'error';
  data: any;
  message: string;
  respondedBy: string;
  respondedAt: Date;
  requiresAction: boolean;
  nextStep?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: 'user_action' | 'system_processing' | 'approval_required' | 'notification' | 'waiting';
  required: boolean;
  timeout?: number; // in milliseconds
  retryCount?: number;
  maxRetries?: number;
  nextSteps: {
    success: string;
    failure: string;
    timeout: string;
  };
  validations?: WorkflowValidation[];
  notifications?: WorkflowNotification[];
}

export interface WorkflowValidation {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  value?: any;
  message: string;
}

export interface WorkflowNotification {
  type: 'email' | 'push' | 'sms' | 'in_app';
  template: string;
  recipients: string[];
  data: any;
}

export class EnhancedWorkflowService {
  private static instance: EnhancedWorkflowService;
  private workflows: Map<string, WorkflowState> = new Map();
  private workflowDefinitions: Map<string, WorkflowStep[]> = new Map();

  static getInstance(): EnhancedWorkflowService {
    if (!EnhancedWorkflowService.instance) {
      EnhancedWorkflowService.instance = new EnhancedWorkflowService();
    }
    return EnhancedWorkflowService.instance;
  }

  constructor() {
    this.initializeWorkflowDefinitions();
  }

  private initializeWorkflowDefinitions(): void {
    // Customer Workflow
    this.workflowDefinitions.set('customer', [
      {
        id: 'browse_products',
        name: 'Browse Products',
        description: 'Customer browses available products',
        type: 'user_action',
        required: true,
        nextSteps: {
          success: 'add_to_cart',
          failure: 'browse_products',
          timeout: 'browse_products'
        },
        validations: [],
        notifications: []
      },
      {
        id: 'add_to_cart',
        name: 'Add to Cart',
        description: 'Customer adds products to shopping cart',
        type: 'user_action',
        required: true,
        nextSteps: {
          success: 'review_cart',
          failure: 'add_to_cart',
          timeout: 'add_to_cart'
        },
        validations: [
          {
            field: 'productId',
            type: 'required',
            message: 'Product ID is required'
          },
          {
            field: 'quantity',
            type: 'range',
            value: { min: 1, max: 100 },
            message: 'Quantity must be between 1 and 100'
          }
        ],
        notifications: []
      },
      {
        id: 'review_cart',
        name: 'Review Cart',
        description: 'Customer reviews cart contents and pricing',
        type: 'user_action',
        required: true,
        nextSteps: {
          success: 'checkout',
          failure: 'review_cart',
          timeout: 'review_cart'
        },
        validations: [],
        notifications: []
      },
      {
        id: 'checkout',
        name: 'Checkout Process',
        description: 'Customer proceeds to checkout',
        type: 'user_action',
        required: true,
        nextSteps: {
          success: 'payment_processing',
          failure: 'checkout',
          timeout: 'checkout'
        },
        validations: [
          {
            field: 'shippingAddress',
            type: 'required',
            message: 'Shipping address is required'
          },
          {
            field: 'paymentMethod',
            type: 'required',
            message: 'Payment method is required'
          }
        ],
        notifications: []
      },
      {
        id: 'payment_processing',
        name: 'Payment Processing',
        description: 'System processes payment',
        type: 'system_processing',
        required: true,
        timeout: 30000, // 30 seconds
        maxRetries: 3,
        nextSteps: {
          success: 'order_confirmation',
          failure: 'payment_failed',
          timeout: 'payment_timeout'
        },
        validations: [],
        notifications: [
          {
            type: 'email',
            template: 'payment_processing',
            recipients: ['customer'],
            data: {}
          }
        ]
      },
      {
        id: 'order_confirmation',
        name: 'Order Confirmation',
        description: 'Order is confirmed and created',
        type: 'system_processing',
        required: true,
        nextSteps: {
          success: 'order_tracking',
          failure: 'order_confirmation',
          timeout: 'order_confirmation'
        },
        validations: [],
        notifications: [
          {
            type: 'email',
            template: 'order_confirmation',
            recipients: ['customer', 'vendor'],
            data: {}
          },
          {
            type: 'push',
            template: 'order_confirmation',
            recipients: ['customer', 'vendor'],
            data: {}
          }
        ]
      },
      {
        id: 'order_tracking',
        name: 'Order Tracking',
        description: 'Customer can track order status',
        type: 'user_action',
        required: false,
        nextSteps: {
          success: 'order_tracking',
          failure: 'order_tracking',
          timeout: 'order_tracking'
        },
        validations: [],
        notifications: []
      }
    ]);

    // Vendor Application Workflow
    this.workflowDefinitions.set('vendor_application', [
      {
        id: 'start_application',
        name: 'Start Application',
        description: 'User starts vendor application process',
        type: 'user_action',
        required: true,
        nextSteps: {
          success: 'fill_business_info',
          failure: 'start_application',
          timeout: 'start_application'
        },
        validations: [],
        notifications: []
      },
      {
        id: 'fill_business_info',
        name: 'Fill Business Information',
        description: 'User fills in business details',
        type: 'user_action',
        required: true,
        nextSteps: {
          success: 'upload_documents',
          failure: 'fill_business_info',
          timeout: 'fill_business_info'
        },
        validations: [
          {
            field: 'businessName',
            type: 'required',
            message: 'Business name is required'
          },
          {
            field: 'businessType',
            type: 'required',
            message: 'Business type is required'
          },
          {
            field: 'taxId',
            type: 'required',
            message: 'Tax ID is required'
          }
        ],
        notifications: []
      },
      {
        id: 'upload_documents',
        name: 'Upload Documents',
        description: 'User uploads required business documents',
        type: 'user_action',
        required: true,
        nextSteps: {
          success: 'submit_application',
          failure: 'upload_documents',
          timeout: 'upload_documents'
        },
        validations: [
          {
            field: 'businessLicense',
            type: 'required',
            message: 'Business license is required'
          },
          {
            field: 'taxCertificate',
            type: 'required',
            message: 'Tax certificate is required'
          }
        ],
        notifications: []
      },
      {
        id: 'submit_application',
        name: 'Submit Application',
        description: 'User submits vendor application',
        type: 'user_action',
        required: true,
        nextSteps: {
          success: 'admin_review',
          failure: 'submit_application',
          timeout: 'submit_application'
        },
        validations: [],
        notifications: [
          {
            type: 'email',
            template: 'application_submitted',
            recipients: ['customer', 'admin'],
            data: {}
          },
          {
            type: 'push',
            template: 'application_submitted',
            recipients: ['admin'],
            data: {}
          }
        ]
      },
      {
        id: 'admin_review',
        name: 'Admin Review',
        description: 'Admin reviews vendor application',
        type: 'approval_required',
        required: true,
        timeout: 7 * 24 * 60 * 60 * 1000, // 7 days
        nextSteps: {
          success: 'application_approved',
          failure: 'application_rejected',
          timeout: 'application_timeout'
        },
        validations: [],
        notifications: [
          {
            type: 'email',
            template: 'application_under_review',
            recipients: ['customer'],
            data: {}
          }
        ]
      },
      {
        id: 'application_approved',
        name: 'Application Approved',
        description: 'Vendor application is approved',
        type: 'system_processing',
        required: true,
        nextSteps: {
          success: 'vendor_onboarding',
          failure: 'application_approved',
          timeout: 'application_approved'
        },
        validations: [],
        notifications: [
          {
            type: 'email',
            template: 'application_approved',
            recipients: ['customer'],
            data: {}
          },
          {
            type: 'push',
            template: 'application_approved',
            recipients: ['customer'],
            data: {}
          }
        ]
      },
      {
        id: 'application_rejected',
        name: 'Application Rejected',
        description: 'Vendor application is rejected',
        type: 'system_processing',
        required: true,
        nextSteps: {
          success: 'application_closed',
          failure: 'application_rejected',
          timeout: 'application_rejected'
        },
        validations: [],
        notifications: [
          {
            type: 'email',
            template: 'application_rejected',
            recipients: ['customer'],
            data: {}
          },
          {
            type: 'push',
            template: 'application_rejected',
            recipients: ['customer'],
            data: {}
          }
        ]
      },
      {
        id: 'vendor_onboarding',
        name: 'Vendor Onboarding',
        description: 'New vendor completes onboarding process',
        type: 'user_action',
        required: true,
        nextSteps: {
          success: 'vendor_active',
          failure: 'vendor_onboarding',
          timeout: 'vendor_onboarding'
        },
        validations: [],
        notifications: []
      },
      {
        id: 'vendor_active',
        name: 'Vendor Active',
        description: 'Vendor is active and can manage products',
        type: 'system_processing',
        required: true,
        nextSteps: {
          success: 'vendor_active',
          failure: 'vendor_active',
          timeout: 'vendor_active'
        },
        validations: [],
        notifications: [
          {
            type: 'email',
            template: 'vendor_welcome',
            recipients: ['customer'],
            data: {}
          }
        ]
      }
    ]);

    // Admin Workflow
    this.workflowDefinitions.set('admin', [
      {
        id: 'review_vendor_application',
        name: 'Review Vendor Application',
        description: 'Admin reviews pending vendor applications',
        type: 'approval_required',
        required: true,
        nextSteps: {
          success: 'approve_application',
          failure: 'reject_application',
          timeout: 'review_vendor_application'
        },
        validations: [],
        notifications: []
      },
      {
        id: 'approve_application',
        name: 'Approve Application',
        description: 'Admin approves vendor application',
        type: 'user_action',
        required: true,
        nextSteps: {
          success: 'application_approved',
          failure: 'approve_application',
          timeout: 'approve_application'
        },
        validations: [],
        notifications: [
          {
            type: 'email',
            template: 'application_approved',
            recipients: ['customer'],
            data: {}
          }
        ]
      },
      {
        id: 'reject_application',
        name: 'Reject Application',
        description: 'Admin rejects vendor application',
        type: 'user_action',
        required: true,
        nextSteps: {
          success: 'application_rejected',
          failure: 'reject_application',
          timeout: 'reject_application'
        },
        validations: [],
        notifications: [
          {
            type: 'email',
            template: 'application_rejected',
            recipients: ['customer'],
            data: {}
          }
        ]
      }
    ]);
  }

  async startWorkflow(
    userId: string,
    workflowType: 'customer' | 'vendor' | 'admin',
    initialData: any = {}
  ): Promise<WorkflowState> {
    const workflowId = `${workflowType}_${userId}_${Date.now()}`;
    const workflowSteps = this.workflowDefinitions.get(workflowType) || [];
    
    const workflow: WorkflowState = {
      id: workflowId,
      userId,
      workflowType,
      currentStep: workflowSteps[0]?.id || 'unknown',
      status: 'in_progress',
      data: initialData,
      responses: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workflows.set(workflowId, workflow);
    
    // Start the first step
    await this.executeStep(workflowId, workflowSteps[0], initialData);
    
    return workflow;
  }

  async executeStep(
    workflowId: string,
    step: WorkflowStep,
    stepData: any
  ): Promise<WorkflowState | null> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    try {
      // Validate step data
      const validationErrors = this.validateStepData(step, stepData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Execute step based on type
      let result: any;
      switch (step.type) {
        case 'user_action':
          result = await this.executeUserAction(workflow, step, stepData);
          break;
        case 'system_processing':
          result = await this.executeSystemProcessing(workflow, step, stepData);
          break;
        case 'approval_required':
          result = await this.executeApprovalRequired(workflow, step, stepData);
          break;
        case 'notification':
          result = await this.executeNotification(workflow, step, stepData);
          break;
        case 'waiting':
          result = await this.executeWaiting(workflow, step, stepData);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      // Update workflow state
      workflow.data = { ...workflow.data, ...result };
      workflow.currentStep = step.id;
      workflow.updatedAt = new Date();

      // Send notifications
      await this.sendNotifications(workflow, step);

      // Determine next step
      const nextStepId = this.determineNextStep(workflow, step, result);
      if (nextStepId) {
        const nextStep = this.workflowDefinitions.get(workflow.workflowType)?.find(s => s.id === nextStepId);
        if (nextStep) {
          workflow.currentStep = nextStepId;
          if (nextStep.type !== 'waiting' && nextStep.type !== 'approval_required') {
            await this.executeStep(workflowId, nextStep, workflow.data);
          }
        }
      }

      this.workflows.set(workflowId, workflow);
      return workflow;

    } catch (error) {
      workflow.status = 'failed';
      workflow.error = error.message;
      workflow.updatedAt = new Date();
      this.workflows.set(workflowId, workflow);
      return workflow;
    }
  }

  async respondToWorkflow(
    workflowId: string,
    stepId: string,
    response: WorkflowResponse
  ): Promise<WorkflowState | null> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    // Add response to workflow
    workflow.responses.push(response);
    workflow.updatedAt = new Date();

    // Find the current step
    const workflowSteps = this.workflowDefinitions.get(workflow.workflowType) || [];
    const currentStep = workflowSteps.find(s => s.id === stepId);
    if (!currentStep) return workflow;

    // Process response
    let nextStepId: string | null = null;
    switch (response.responseType) {
      case 'approval':
        nextStepId = currentStep.nextSteps.success;
        break;
      case 'rejection':
        nextStepId = currentStep.nextSteps.failure;
        break;
      case 'modification':
        // Stay on current step for modifications
        nextStepId = stepId;
        break;
      case 'confirmation':
        nextStepId = currentStep.nextSteps.success;
        break;
      case 'error':
        nextStepId = currentStep.nextSteps.failure;
        break;
    }

    if (nextStepId && nextStepId !== stepId) {
      const nextStep = workflowSteps.find(s => s.id === nextStepId);
      if (nextStep) {
        await this.executeStep(workflowId, nextStep, workflow.data);
      }
    }

    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  private validateStepData(step: WorkflowStep, data: any): string[] {
    const errors: string[] = [];
    
    if (!step.validations) return errors;

    for (const validation of step.validations) {
      const value = data[validation.field];
      
      switch (validation.type) {
        case 'required':
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            errors.push(validation.message);
          }
          break;
        case 'format':
          // Add format validation logic
          break;
        case 'range':
          if (validation.value && typeof value === 'number') {
            const { min, max } = validation.value;
            if (value < min || value > max) {
              errors.push(validation.message);
            }
          }
          break;
        case 'custom':
          // Add custom validation logic
          break;
      }
    }

    return errors;
  }

  private async executeUserAction(workflow: WorkflowState, step: WorkflowStep, data: any): Promise<any> {
    // User action execution logic
    return data;
  }

  private async executeSystemProcessing(workflow: WorkflowState, step: WorkflowStep, data: any): Promise<any> {
    // System processing logic
    return data;
  }

  private async executeApprovalRequired(workflow: WorkflowState, step: WorkflowStep, data: any): Promise<any> {
    // Approval required logic - workflow waits for admin response
    workflow.status = 'pending';
    return data;
  }

  private async executeNotification(workflow: WorkflowState, step: WorkflowStep, data: any): Promise<any> {
    // Notification execution logic
    return data;
  }

  private async executeWaiting(workflow: WorkflowState, step: WorkflowStep, data: any): Promise<any> {
    // Waiting logic
    return data;
  }

  private async sendNotifications(workflow: WorkflowState, step: WorkflowStep): Promise<void> {
    if (!step.notifications) return;

    for (const notification of step.notifications) {
      try {
        switch (notification.type) {
          case 'email':
            // Send email notification
            break;
          case 'push':
            await PushNotificationService.sendNotification(
              workflow.userId,
              notification.template,
              notification.data
            );
            break;
          case 'sms':
            // Send SMS notification
            break;
          case 'in_app':
            // Send in-app notification
            break;
        }
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }
  }

  private determineNextStep(workflow: WorkflowState, step: WorkflowStep, result: any): string | null {
    // Determine next step based on result
    return step.nextSteps.success;
  }

  getWorkflow(workflowId: string): WorkflowState | undefined {
    return this.workflows.get(workflowId);
  }

  getUserWorkflows(userId: string): WorkflowState[] {
    return Array.from(this.workflows.values()).filter(w => w.userId === userId);
  }

  getPendingWorkflows(): WorkflowState[] {
    return Array.from(this.workflows.values()).filter(w => w.status === 'pending');
  }

  async cancelWorkflow(workflowId: string): Promise<boolean> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    workflow.status = 'cancelled';
    workflow.updatedAt = new Date();
    this.workflows.set(workflowId, workflow);
    return true;
  }

  async completeWorkflow(workflowId: string): Promise<boolean> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    workflow.status = 'completed';
    workflow.completedAt = new Date();
    workflow.updatedAt = new Date();
    this.workflows.set(workflowId, workflow);
    return true;
  }
}

export default EnhancedWorkflowService;