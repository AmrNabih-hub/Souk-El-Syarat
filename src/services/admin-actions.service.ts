/**
 * Admin Actions Service
 * Handles all admin approval/rejection actions
 * Professional implementation with full workflow
 */

import { supabase } from '@/config/supabase.config';
import { EmailNotificationService } from './email-notification.service';

export interface ApproveVendorData {
  applicationId: string;
  adminId: string;
  adminNotes?: string;
}

export interface RejectVendorData {
  applicationId: string;
  adminId: string;
  reason: string;
  adminNotes?: string;
}

export interface ApproveCarListingData {
  listingId: string;
  adminId: string;
  adminNotes?: string;
}

export interface RejectCarListingData {
  listingId: string;
  adminId: string;
  reason: string;
  adminNotes?: string;
}

export class AdminActionsService {
  /**
   * Approve vendor application
   * - Updates status to 'approved'
   * - Triggers: User role upgrade, vendor record creation
   * - Sends: Email and in-app notification
   */
  static async approveVendorApplication(data: ApproveVendorData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[AdminActions] Approving vendor application:', data.applicationId);

      // Get application details
      const { data: application, error: fetchError } = await supabase
        .from('vendor_applications')
        .select(`
          *,
          users!inner(id, email, profiles(display_name))
        `)
        .eq('id', data.applicationId)
        .single();

      if (fetchError || !application) {
        console.error('[AdminActions] Application not found:', fetchError);
        return { success: false, error: 'Application not found' };
      }

      // Update application status
      const { error: updateError } = await supabase
        .from('vendor_applications')
        .update({
          status: 'approved',
          reviewed_by: data.adminId,
          admin_notes: data.adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.applicationId);

      if (updateError) {
        console.error('[AdminActions] Error updating application:', updateError);
        return { success: false, error: updateError.message };
      }

      // Log admin action
      await this.logAdminAction({
        adminId: data.adminId,
        action: 'approve_vendor_application',
        targetType: 'vendor_application',
        targetId: data.applicationId,
        details: { company_name: application.company_name, notes: data.adminNotes }
      });

      // Send email notification (async, don't wait)
      EmailNotificationService.notifyUserVendorApproved({
        userName: application.users.profiles?.display_name || application.users.email,
        userEmail: application.users.email,
        companyName: application.company_name
      }).catch(err => console.error('[AdminActions] Email error:', err));

      console.log('[AdminActions] ✅ Vendor application approved successfully');
      
      // Note: User role upgrade and notification are handled by database trigger
      return { success: true };

    } catch (error: any) {
      console.error('[AdminActions] Error approving vendor:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject vendor application
   * - Updates status to 'rejected'
   * - Stores rejection reason
   * - Sends: Email and in-app notification
   * - User stays as customer
   */
  static async rejectVendorApplication(data: RejectVendorData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[AdminActions] Rejecting vendor application:', data.applicationId);

      // Get application details
      const { data: application, error: fetchError } = await supabase
        .from('vendor_applications')
        .select(`
          *,
          users!inner(id, email, profiles(display_name))
        `)
        .eq('id', data.applicationId)
        .single();

      if (fetchError || !application) {
        return { success: false, error: 'Application not found' };
      }

      // Update application status
      const { error: updateError } = await supabase
        .from('vendor_applications')
        .update({
          status: 'rejected',
          rejection_reason: data.reason,
          reviewed_by: data.adminId,
          admin_notes: data.adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.applicationId);

      if (updateError) {
        console.error('[AdminActions] Error updating application:', updateError);
        return { success: false, error: updateError.message };
      }

      // Log admin action
      await this.logAdminAction({
        adminId: data.adminId,
        action: 'reject_vendor_application',
        targetType: 'vendor_application',
        targetId: data.applicationId,
        details: { 
          company_name: application.company_name, 
          reason: data.reason,
          notes: data.adminNotes 
        }
      });

      // Send email notification (async)
      EmailNotificationService.notifyUserVendorRejected({
        userName: application.users.profiles?.display_name || application.users.email,
        userEmail: application.users.email,
        companyName: application.company_name,
        reason: data.reason
      }).catch(err => console.error('[AdminActions] Email error:', err));

      console.log('[AdminActions] ✅ Vendor application rejected');
      
      // Note: Notification is handled by database trigger
      return { success: true };

    } catch (error: any) {
      console.error('[AdminActions] Error rejecting vendor:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Approve car listing
   * - Updates status to 'approved'
   * - Car becomes visible in marketplace
   * - Sends: Email and in-app notification
   */
  static async approveCarListing(data: ApproveCarListingData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[AdminActions] Approving car listing:', data.listingId);

      // Get listing details
      const { data: listing, error: fetchError } = await supabase
        .from('car_listings')
        .select(`
          *,
          users!car_listings_customer_id_fkey(id, email, profiles(display_name))
        `)
        .eq('id', data.listingId)
        .single();

      if (fetchError || !listing) {
        return { success: false, error: 'Listing not found' };
      }

      // Update listing status
      const { error: updateError } = await supabase
        .from('car_listings')
        .update({
          status: 'approved',
          reviewed_by: data.adminId,
          admin_notes: data.adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.listingId);

      if (updateError) {
        console.error('[AdminActions] Error updating listing:', updateError);
        return { success: false, error: updateError.message };
      }

      // Log admin action
      await this.logAdminAction({
        adminId: data.adminId,
        action: 'approve_car_listing',
        targetType: 'car_listing',
        targetId: data.listingId,
        details: { 
          title: listing.title,
          price: listing.price,
          notes: data.adminNotes 
        }
      });

      // Send email notification (async)
      EmailNotificationService.notifyUserCarApproved({
        userName: listing.users.profiles?.display_name || listing.users.email,
        userEmail: listing.users.email,
        carTitle: listing.title,
        price: listing.price
      }).catch(err => console.error('[AdminActions] Email error:', err));

      console.log('[AdminActions] ✅ Car listing approved');
      
      return { success: true };

    } catch (error: any) {
      console.error('[AdminActions] Error approving car listing:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject car listing
   * - Updates status to 'rejected'
   * - Stores rejection reason
   * - Sends: Email and in-app notification
   * - User can resubmit
   */
  static async rejectCarListing(data: RejectCarListingData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[AdminActions] Rejecting car listing:', data.listingId);

      // Get listing details
      const { data: listing, error: fetchError } = await supabase
        .from('car_listings')
        .select(`
          *,
          users!car_listings_customer_id_fkey(id, email, profiles(display_name))
        `)
        .eq('id', data.listingId)
        .single();

      if (fetchError || !listing) {
        return { success: false, error: 'Listing not found' };
      }

      // Update listing status
      const { error: updateError } = await supabase
        .from('car_listings')
        .update({
          status: 'rejected',
          rejection_reason: data.reason,
          reviewed_by: data.adminId,
          admin_notes: data.adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.listingId);

      if (updateError) {
        console.error('[AdminActions] Error updating listing:', updateError);
        return { success: false, error: updateError.message };
      }

      // Log admin action
      await this.logAdminAction({
        adminId: data.adminId,
        action: 'reject_car_listing',
        targetType: 'car_listing',
        targetId: data.listingId,
        details: { 
          title: listing.title,
          reason: data.reason,
          notes: data.adminNotes 
        }
      });

      // Send email notification (async)
      EmailNotificationService.notifyUserCarRejected({
        userName: listing.users.profiles?.display_name || listing.users.email,
        userEmail: listing.users.email,
        carTitle: listing.title,
        reason: data.reason
      }).catch(err => console.error('[AdminActions] Email error:', err));

      console.log('[AdminActions] ✅ Car listing rejected');
      
      return { success: true };

    } catch (error: any) {
      console.error('[AdminActions] Error rejecting car listing:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log admin action for audit trail
   */
  private static async logAdminAction(data: {
    adminId: string;
    action: string;
    targetType: string;
    targetId: string;
    details?: any;
  }): Promise<void> {
    try {
      await supabase.from('admin_logs').insert({
        admin_id: data.adminId,
        action_type: data.action,
        target_type: data.targetType,
        target_id: data.targetId,
        details: data.details || {},
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('[AdminActions] Error logging action:', error);
      // Don't throw - logging failure shouldn't break the main action
    }
  }

  /**
   * Get pending vendor applications for admin review
   */
  static async getPendingVendorApplications(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('vendor_applications')
        .select(`
          *,
          users!inner(
            id,
            email,
            profiles(display_name, avatar_url)
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[AdminActions] Error fetching applications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[AdminActions] Error:', error);
      return [];
    }
  }

  /**
   * Get pending car listings for admin review
   */
  static async getPendingCarListings(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('car_listings')
        .select(`
          *,
          users!car_listings_customer_id_fkey(
            id,
            email,
            profiles(display_name, avatar_url)
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[AdminActions] Error fetching listings:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[AdminActions] Error:', error);
      return [];
    }
  }
}
