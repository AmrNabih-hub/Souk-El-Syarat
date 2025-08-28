/**
 * Workflow Orchestrator Service
 * Manages complex business workflows with real-time synchronization
 */

import { db, realtimeDb } from '@/config/firebase.config';
import { 
  collection, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp,
  onSnapshot,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { ref, set, onValue, push } from 'firebase/database';
import { authService } from './auth.service';
import { realtimeService } from './realtime.service';
import { syncService } from './sync.service';
import { securityService } from './security.service';
import toast from 'react-hot-toast';

interface WorkflowStep {
  id: string;
  name: string;
  actor: 'customer' | 'vendor' | 'admin' | 'system';
  action: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: Date;
  metadata?: any;
}

interface WorkflowInstance {
  id: string;
  type: WorkflowType;
  currentStep: string;
  steps: WorkflowStep[];
  participants: {
    customer?: string;
    vendor?: string;
    admin?: string;
  };
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

type WorkflowType = 
  | 'order_placement'
  | 'vendor_onboarding'
  | 'product_listing'
  | 'inventory_update'
  | 'payment_processing'
  | 'dispute_resolution'
  | 'return_refund'
  | 'customer_support';

class WorkflowOrchestratorService {
  private static instance: WorkflowOrchestratorService;
  private workflows: Map<string, WorkflowInstance> = new Map();
  private listeners: Map<string, Function> = new Map();

  private constructor() {
    this.initializeWorkflowListeners();
  }

  static getInstance(): WorkflowOrchestratorService {
    if (!WorkflowOrchestratorService.instance) {
      WorkflowOrchestratorService.instance = new WorkflowOrchestratorService();
    }
    return WorkflowOrchestratorService.instance;
  }

  private initializeWorkflowListeners() {
    // Listen to all workflow updates
    const workflowsRef = ref(realtimeDb, 'workflows');
    onValue(workflowsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        Object.entries(data).forEach(([id, workflow]) => {
          this.workflows.set(id, workflow as WorkflowInstance);
          this.notifyListeners(id, workflow as WorkflowInstance);
        });
      }
    });
  }

  /**
   * Start a new workflow instance
   */
  async startWorkflow(
    type: WorkflowType,
    participants: WorkflowInstance['participants'],
    initialData?: any
  ): Promise<string> {
    try {
      const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const steps = this.generateWorkflowSteps(type, initialData);
      
      const workflow: WorkflowInstance = {
        id: workflowId,
        type,
        currentStep: steps[0].id,
        steps,
        participants,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to Firestore
      await addDoc(collection(db, 'workflows'), workflow);

      // Save to Realtime DB for instant updates
      await set(ref(realtimeDb, `workflows/${workflowId}`), workflow);

      // Notify participants
      this.notifyParticipants(workflow);

      // Start execution
      this.executeWorkflow(workflowId);

      return workflowId;
    } catch (error) {
      console.error('Error starting workflow:', error);
      throw error;
    }
  }

  /**
   * Generate workflow steps based on type
   */
  private generateWorkflowSteps(type: WorkflowType, data?: any): WorkflowStep[] {
    const workflows = {
      order_placement: [
        { id: 'validate_cart', name: 'Validate Cart', actor: 'system', action: 'validate_cart_items' },
        { id: 'check_inventory', name: 'Check Inventory', actor: 'system', action: 'verify_stock_availability' },
        { id: 'reserve_items', name: 'Reserve Items', actor: 'system', action: 'reserve_inventory' },
        { id: 'create_order', name: 'Create Order', actor: 'system', action: 'generate_order' },
        { id: 'notify_vendor', name: 'Notify Vendor', actor: 'system', action: 'send_vendor_notification' },
        { id: 'vendor_confirm', name: 'Vendor Confirmation', actor: 'vendor', action: 'confirm_order' },
        { id: 'process_payment', name: 'Process Payment', actor: 'system', action: 'handle_cod_payment' },
        { id: 'update_inventory', name: 'Update Inventory', actor: 'system', action: 'deduct_stock' },
        { id: 'generate_invoice', name: 'Generate Invoice', actor: 'system', action: 'create_invoice' },
        { id: 'send_confirmation', name: 'Send Confirmation', actor: 'system', action: 'email_confirmation' },
        { id: 'track_delivery', name: 'Track Delivery', actor: 'system', action: 'initiate_tracking' }
      ],
      vendor_onboarding: [
        { id: 'submit_application', name: 'Submit Application', actor: 'vendor', action: 'fill_application' },
        { id: 'verify_documents', name: 'Verify Documents', actor: 'admin', action: 'review_documents' },
        { id: 'background_check', name: 'Background Check', actor: 'system', action: 'run_verification' },
        { id: 'approve_vendor', name: 'Approve Vendor', actor: 'admin', action: 'final_approval' },
        { id: 'setup_store', name: 'Setup Store', actor: 'system', action: 'create_vendor_profile' },
        { id: 'training_complete', name: 'Complete Training', actor: 'vendor', action: 'finish_onboarding' }
      ],
      product_listing: [
        { id: 'create_draft', name: 'Create Draft', actor: 'vendor', action: 'draft_product' },
        { id: 'upload_images', name: 'Upload Images', actor: 'vendor', action: 'add_media' },
        { id: 'set_pricing', name: 'Set Pricing', actor: 'vendor', action: 'configure_price' },
        { id: 'review_listing', name: 'Review Listing', actor: 'admin', action: 'approve_product' },
        { id: 'publish_product', name: 'Publish Product', actor: 'system', action: 'make_live' },
        { id: 'index_search', name: 'Index for Search', actor: 'system', action: 'update_search_index' }
      ],
      inventory_update: [
        { id: 'check_levels', name: 'Check Levels', actor: 'system', action: 'monitor_stock' },
        { id: 'generate_alert', name: 'Generate Alert', actor: 'system', action: 'low_stock_alert' },
        { id: 'vendor_review', name: 'Vendor Review', actor: 'vendor', action: 'review_alert' },
        { id: 'restock_decision', name: 'Restock Decision', actor: 'vendor', action: 'decide_restock' },
        { id: 'update_quantity', name: 'Update Quantity', actor: 'vendor', action: 'add_stock' },
        { id: 'sync_inventory', name: 'Sync Inventory', actor: 'system', action: 'propagate_changes' }
      ],
      dispute_resolution: [
        { id: 'raise_dispute', name: 'Raise Dispute', actor: 'customer', action: 'submit_complaint' },
        { id: 'vendor_response', name: 'Vendor Response', actor: 'vendor', action: 'provide_response' },
        { id: 'admin_review', name: 'Admin Review', actor: 'admin', action: 'investigate_issue' },
        { id: 'resolution_proposal', name: 'Propose Resolution', actor: 'admin', action: 'suggest_solution' },
        { id: 'accept_resolution', name: 'Accept Resolution', actor: 'customer', action: 'confirm_resolution' },
        { id: 'implement_resolution', name: 'Implement', actor: 'system', action: 'execute_resolution' }
      ]
    };

    const template = workflows[type] || [];
    return template.map(step => ({
      ...step,
      status: 'pending' as const,
      timestamp: new Date()
    }));
  }

  /**
   * Execute workflow steps
   */
  private async executeWorkflow(workflowId: string) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    for (const step of workflow.steps) {
      if (step.status === 'completed') continue;

      // Update step status
      step.status = 'in_progress';
      await this.updateWorkflowStep(workflowId, step.id, step);

      // Execute based on actor
      if (step.actor === 'system') {
        await this.executeSystemStep(workflow, step);
      } else {
        // Wait for human action
        await this.waitForHumanAction(workflow, step);
      }

      // Mark as completed
      step.status = 'completed';
      await this.updateWorkflowStep(workflowId, step.id, step);
    }

    // Complete workflow
    workflow.status = 'completed';
    await this.updateWorkflow(workflowId, workflow);
  }

  /**
   * Execute system automated steps
   */
  private async executeSystemStep(workflow: WorkflowInstance, step: WorkflowStep) {
    switch (step.action) {
      case 'validate_cart_items':
        // Validate all cart items are available
        const cartValid = await this.validateCart(workflow.participants.customer!);
        if (!cartValid) {
          throw new Error('Cart validation failed');
        }
        break;

      case 'verify_stock_availability':
        // Check stock levels
        const stockAvailable = await this.checkStock(workflow.participants.customer!);
        if (!stockAvailable) {
          throw new Error('Insufficient stock');
        }
        break;

      case 'reserve_inventory':
        // Reserve items for order
        await this.reserveInventory(workflow.participants.customer!);
        break;

      case 'send_vendor_notification':
        // Notify vendor of new order
        await this.notifyVendor(workflow.participants.vendor!);
        break;

      case 'handle_cod_payment':
        // Process Cash on Delivery
        await this.processCOD(workflow);
        break;

      case 'deduct_stock':
        // Update inventory levels
        await this.updateInventoryLevels(workflow);
        break;

      case 'create_invoice':
        // Generate invoice
        await this.generateInvoice(workflow);
        break;

      case 'email_confirmation':
        // Send confirmation emails
        await this.sendConfirmationEmails(workflow);
        break;

      case 'initiate_tracking':
        // Start delivery tracking
        await this.startDeliveryTracking(workflow);
        break;

      default:
        console.log(`Executing system step: ${step.action}`);
    }
  }

  /**
   * Wait for human action
   */
  private async waitForHumanAction(workflow: WorkflowInstance, step: WorkflowStep): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        const updatedWorkflow = this.workflows.get(workflow.id);
        const updatedStep = updatedWorkflow?.steps.find(s => s.id === step.id);
        
        if (updatedStep?.status === 'completed') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);

      // Timeout after 24 hours
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 24 * 60 * 60 * 1000);
    });
  }

  /**
   * Update workflow step
   */
  private async updateWorkflowStep(workflowId: string, stepId: string, step: WorkflowStep) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    const stepIndex = workflow.steps.findIndex(s => s.id === stepId);
    if (stepIndex !== -1) {
      workflow.steps[stepIndex] = step;
      workflow.updatedAt = new Date();
      
      // Update in Realtime DB
      await set(ref(realtimeDb, `workflows/${workflowId}`), workflow);
      
      // Update in Firestore
      const workflowQuery = query(collection(db, 'workflows'), where('id', '==', workflowId));
      const snapshot = await getDocs(workflowQuery);
      if (!snapshot.empty) {
        await updateDoc(snapshot.docs[0].ref, {
          steps: workflow.steps,
          updatedAt: serverTimestamp()
        });
      }
    }
  }

  /**
   * Update entire workflow
   */
  private async updateWorkflow(workflowId: string, workflow: WorkflowInstance) {
    // Update in Realtime DB
    await set(ref(realtimeDb, `workflows/${workflowId}`), workflow);
    
    // Update in Firestore
    const workflowQuery = query(collection(db, 'workflows'), where('id', '==', workflowId));
    const snapshot = await getDocs(workflowQuery);
    if (!snapshot.empty) {
      await updateDoc(snapshot.docs[0].ref, workflow);
    }
  }

  /**
   * Notify workflow participants
   */
  private async notifyParticipants(workflow: WorkflowInstance) {
    const notifications = [];
    
    if (workflow.participants.customer) {
      notifications.push(
        realtimeService.sendNotification(workflow.participants.customer, {
          type: 'workflow',
          title: 'Process Started',
          message: `Your ${workflow.type.replace('_', ' ')} is being processed`,
          data: { workflowId: workflow.id }
        })
      );
    }
    
    if (workflow.participants.vendor) {
      notifications.push(
        realtimeService.sendNotification(workflow.participants.vendor, {
          type: 'workflow',
          title: 'Action Required',
          message: `New ${workflow.type.replace('_', ' ')} requires your attention`,
          data: { workflowId: workflow.id }
        })
      );
    }
    
    if (workflow.participants.admin) {
      notifications.push(
        realtimeService.sendNotification(workflow.participants.admin, {
          type: 'workflow',
          title: 'Admin Action',
          message: `${workflow.type.replace('_', ' ')} needs review`,
          data: { workflowId: workflow.id }
        })
      );
    }
    
    await Promise.all(notifications);
  }

  /**
   * Helper methods for workflow steps
   */
  private async validateCart(customerId: string): Promise<boolean> {
    // Implementation for cart validation
    return true;
  }

  private async checkStock(customerId: string): Promise<boolean> {
    // Implementation for stock checking
    return true;
  }

  private async reserveInventory(customerId: string): Promise<void> {
    // Implementation for inventory reservation
  }

  private async notifyVendor(vendorId: string): Promise<void> {
    // Implementation for vendor notification
  }

  private async processCOD(workflow: WorkflowInstance): Promise<void> {
    // Implementation for COD processing
  }

  private async updateInventoryLevels(workflow: WorkflowInstance): Promise<void> {
    // Implementation for inventory update
  }

  private async generateInvoice(workflow: WorkflowInstance): Promise<void> {
    // Implementation for invoice generation
  }

  private async sendConfirmationEmails(workflow: WorkflowInstance): Promise<void> {
    // Implementation for email sending
  }

  private async startDeliveryTracking(workflow: WorkflowInstance): Promise<void> {
    // Implementation for delivery tracking
  }

  /**
   * Subscribe to workflow updates
   */
  subscribeToWorkflow(workflowId: string, callback: (workflow: WorkflowInstance) => void): () => void {
    this.listeners.set(`${workflowId}_${Date.now()}`, callback);
    
    return () => {
      // Unsubscribe logic
    };
  }

  /**
   * Notify listeners of workflow changes
   */
  private notifyListeners(workflowId: string, workflow: WorkflowInstance) {
    this.listeners.forEach((callback, key) => {
      if (key.startsWith(workflowId)) {
        callback(workflow);
      }
    });
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(workflowId: string): WorkflowInstance | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Cancel workflow
   */
  async cancelWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (workflow && workflow.status === 'active') {
      workflow.status = 'cancelled';
      await this.updateWorkflow(workflowId, workflow);
    }
  }
}

export const workflowOrchestrator = WorkflowOrchestratorService.getInstance();