/**
 * 🚗 Enhanced Car Listing Service
 * Improved version with error handling, validation, and Supabase integration
 */

import { supabase } from '@/config/supabase.config';
import { handleError } from '@/utils/error-handler';
import { validateCarYear, validateMileage, validatePrice, validateEgyptianPhone } from '@/utils/validation-helpers';
import type { CarListingData } from './car-listing.service';

interface CarListingRecord {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: 'automatic' | 'manual';
  fuel_type: string;
  color: string;
  condition: 'excellent' | 'very_good' | 'good' | 'fair' | 'needs_work';
  asking_price: number;
  description: string;
  features: string[];
  seller_name: string;
  phone_number: string;
  whatsapp_number?: string;
  location: {
    governorate: string;
    city: string;
    area: string;
  };
  has_ownership_papers: boolean;
  has_service_history: boolean;
  has_insurance: boolean;
  negotiable: boolean;
  available_for_inspection: boolean;
  urgent_sale: boolean;
  status: 'pending' | 'approved' | 'rejected';
  images: string[];
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_comments?: string;
  product_id?: string;
}

class EnhancedCarListingService {
  /**
   * Submit car listing with validation
   */
  async submitListing(
    userId: string,
    listingData: CarListingData,
    images: File[]
  ): Promise<{ success: boolean; listingId?: string; error?: string }> {
    try {
      // Validate inputs
      const validation = this.validateListingData(listingData);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // Validate images
      if (images.length < 3) {
        return { success: false, error: 'At least 3 images are required' };
      }

      if (images.length > 10) {
        return { success: false, error: 'Maximum 10 images allowed' };
      }

      // Upload images to Supabase Storage
      const imageUrls = await this.uploadImages(userId, images);
      if (!imageUrls || imageUrls.length === 0) {
        return { success: false, error: 'Failed to upload images' };
      }

      // Insert car listing into database
      const { data, error } = await supabase
        .from('car_listings')
        .insert({
          user_id: userId,
          make: listingData.make,
          model: listingData.model,
          year: listingData.year,
          mileage: listingData.mileage,
          transmission: listingData.transmission,
          fuel_type: listingData.fuelType,
          color: listingData.color,
          condition: listingData.condition,
          asking_price: listingData.askingPrice,
          description: listingData.description,
          features: listingData.features,
          seller_name: listingData.sellerName,
          phone_number: listingData.phoneNumber,
          whatsapp_number: listingData.whatsappNumber,
          location: listingData.location,
          has_ownership_papers: listingData.hasOwnershipPapers,
          has_service_history: listingData.hasServiceHistory,
          has_insurance: listingData.hasInsurance,
          negotiable: listingData.negotiable,
          available_for_inspection: listingData.availableForInspection,
          urgent_sale: listingData.urgentSale,
          agreed_to_terms: listingData.agreeToTerms,
          images: imageUrls,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        handleError(error, { context: 'submitListing' });
        return { success: false, error: 'Failed to submit listing' };
      }

      // Send notification to admin (via Supabase Edge Function)
      await this.notifyAdmin(data.id, listingData);

      return { success: true, listingId: data.id };
    } catch (error) {
      handleError(error, { context: 'submitListing' });
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get user's car listings
   */
  async getUserListings(userId: string): Promise<CarListingRecord[]> {
    try {
      const { data, error } = await supabase
        .from('car_listings')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

      if (error) {
        handleError(error, { context: 'getUserListings' });
        return [];
      }

      return data || [];
    } catch (error) {
      handleError(error, { context: 'getUserListings' });
      return [];
    }
  }

  /**
   * Get pending listings for admin
   */
  async getPendingListings(): Promise<CarListingRecord[]> {
    try {
      const { data, error } = await supabase
        .from('car_listings')
        .select('*')
        .eq('status', 'pending')
        .order('submitted_at', { ascending: true });

      if (error) {
        handleError(error, { context: 'getPendingListings' });
        return [];
      }

      return data || [];
    } catch (error) {
      handleError(error, { context: 'getPendingListings' });
      return [];
    }
  }

  /**
   * Approve listing (admin only)
   */
  async approveListing(
    listingId: string,
    adminId: string,
    comments?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('car_listings')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
          review_comments: comments,
        })
        .eq('id', listingId);

      if (error) {
        handleError(error, { context: 'approveListing' });
        return { success: false, error: 'Failed to approve listing' };
      }

      // Log admin action
      await this.logAdminAction(adminId, 'approve_car_listing', listingId);

      // Send notification to seller
      await this.notifySellerApproval(listingId);

      return { success: true };
    } catch (error) {
      handleError(error, { context: 'approveListing' });
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Reject listing (admin only)
   */
  async rejectListing(
    listingId: string,
    adminId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('car_listings')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
          review_comments: reason,
        })
        .eq('id', listingId);

      if (error) {
        handleError(error, { context: 'rejectListing' });
        return { success: false, error: 'Failed to reject listing' };
      }

      // Log admin action
      await this.logAdminAction(adminId, 'reject_car_listing', listingId);

      // Send notification to seller
      await this.notifySellerRejection(listingId, reason);

      return { success: true };
    } catch (error) {
      handleError(error, { context: 'rejectListing' });
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Upload images to Supabase Storage
   */
  private async uploadImages(userId: string, images: File[]): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      try {
        const file = images[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}_${i}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('car-listings')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.error(`Failed to upload image ${i}:`, error);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('car-listings')
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
      } catch (error) {
        console.error(`Error uploading image ${i}:`, error);
      }
    }

    return uploadedUrls;
  }

  /**
   * Validate listing data
   */
  private validateListingData(data: CarListingData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.make || data.make.length < 2) {
      errors.push('Invalid car make');
    }

    if (!data.model || data.model.length < 2) {
      errors.push('Invalid car model');
    }

    if (!validateCarYear(data.year)) {
      errors.push('Invalid year');
    }

    if (!validateMileage(data.mileage)) {
      errors.push('Invalid mileage');
    }

    if (!validatePrice(data.askingPrice)) {
      errors.push('Invalid price');
    }

    if (!validateEgyptianPhone(data.phoneNumber)) {
      errors.push('Invalid phone number');
    }

    if (!data.description || data.description.length < 20) {
      errors.push('Description must be at least 20 characters');
    }

    if (!data.hasOwnershipPapers) {
      errors.push('Ownership papers are required');
    }

    if (!data.agreeToTerms) {
      errors.push('You must agree to terms and conditions');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Notify admin (via edge function or direct notification)
   */
  private async notifyAdmin(listingId: string, data: CarListingData): Promise<void> {
    try {
      // Use Supabase Edge Function if available
      await supabase.functions.invoke('send-notification', {
        body: {
          type: 'new_car_listing',
          listingId,
          carInfo: `${data.make} ${data.model} ${data.year}`,
          sellerName: data.sellerName,
          price: data.askingPrice,
        },
      });
    } catch (error) {
      console.warn('Failed to send admin notification:', error);
    }
  }

  /**
   * Notify seller of approval
   */
  private async notifySellerApproval(listingId: string): Promise<void> {
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          type: 'car_listing_approved',
          listingId,
        },
      });
    } catch (error) {
      console.warn('Failed to send approval notification:', error);
    }
  }

  /**
   * Notify seller of rejection
   */
  private async notifySellerRejection(listingId: string, reason: string): Promise<void> {
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          type: 'car_listing_rejected',
          listingId,
          reason,
        },
      });
    } catch (error) {
      console.warn('Failed to send rejection notification:', error);
    }
  }

  /**
   * Log admin action
   */
  private async logAdminAction(
    adminId: string,
    action: string,
    targetId: string
  ): Promise<void> {
    try {
      await supabase.from('admin_logs').insert({
        admin_id: adminId,
        action,
        target_type: 'car_listing',
        target_id: targetId,
        details: {},
      });
    } catch (error) {
      console.warn('Failed to log admin action:', error);
    }
  }
}

export const enhancedCarListingService = new EnhancedCarListingService();
export default enhancedCarListingService;
