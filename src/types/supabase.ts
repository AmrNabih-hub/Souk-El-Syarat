/**
 * 🗄️ Supabase Database Types for Souk El-Sayarat
 * Auto-generated types from Supabase schema
 * Run: npx supabase gen types typescript --project-id [PROJECT_ID] --schema public > src/types/supabase.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          email_verified: boolean
          phone: string | null
          phone_verified: boolean
          role: 'customer' | 'vendor' | 'admin'
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          email_verified?: boolean
          phone?: string | null
          phone_verified?: boolean
          role?: 'customer' | 'vendor' | 'admin'
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          email_verified?: boolean
          phone?: string | null
          phone_verified?: boolean
          role?: 'customer' | 'vendor' | 'admin'
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          bio: string | null
          address: Json | null
          preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          address?: Json | null
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          address?: Json | null
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      vendors: {
        Row: {
          id: string
          user_id: string
          business_name: string
          business_type: 'dealership' | 'parts_supplier' | 'service_center' | 'individual' | 'manufacturer' | 'distributor'
          description: string
          contact_person: string
          email: string
          phone_number: string
          whatsapp_number: string | null
          address: Json
          business_license: string | null
          tax_id: string | null
          website: string | null
          social_media: Json | null
          experience: string | null
          specializations: string[]
          expected_monthly_volume: string | null
          logo_url: string | null
          cover_image_url: string | null
          status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'active'
          rating: number
          total_reviews: number
          total_sales: number
          total_products: number
          is_verified: boolean
          approved_by: string | null
          approved_at: string | null
          rejected_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          business_type: 'dealership' | 'parts_supplier' | 'service_center' | 'individual' | 'manufacturer' | 'distributor'
          description: string
          contact_person: string
          email: string
          phone_number: string
          whatsapp_number?: string | null
          address: Json
          business_license?: string | null
          tax_id?: string | null
          website?: string | null
          social_media?: Json | null
          experience?: string | null
          specializations: string[]
          expected_monthly_volume?: string | null
          logo_url?: string | null
          cover_image_url?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'suspended' | 'active'
          rating?: number
          total_reviews?: number
          total_sales?: number
          total_products?: number
          is_verified?: boolean
          approved_by?: string | null
          approved_at?: string | null
          rejected_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          business_type?: 'dealership' | 'parts_supplier' | 'service_center' | 'individual' | 'manufacturer' | 'distributor'
          description?: string
          contact_person?: string
          email?: string
          phone_number?: string
          whatsapp_number?: string | null
          address?: Json
          business_license?: string | null
          tax_id?: string | null
          website?: string | null
          social_media?: Json | null
          experience?: string | null
          specializations?: string[]
          expected_monthly_volume?: string | null
          logo_url?: string | null
          cover_image_url?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'suspended' | 'active'
          rating?: number
          total_reviews?: number
          total_sales?: number
          total_products?: number
          is_verified?: boolean
          approved_by?: string | null
          approved_at?: string | null
          rejected_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          vendor_id: string
          title: string
          description: string
          category: string
          subcategory: string | null
          images: Json | null
          price: number
          original_price: number | null
          currency: string
          in_stock: boolean
          quantity: number
          specifications: Json | null
          features: string[] | null
          tags: string[] | null
          condition: 'new' | 'used' | 'refurbished'
          warranty: string | null
          car_details: Json | null
          status: 'draft' | 'active' | 'inactive' | 'sold'
          views: number
          favorites: number
          rating: number
          review_count: number
          seo_data: Json | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          title: string
          description: string
          category: string
          subcategory?: string | null
          images?: Json | null
          price: number
          original_price?: number | null
          currency?: string
          in_stock?: boolean
          quantity?: number
          specifications?: Json | null
          features?: string[] | null
          tags?: string[] | null
          condition?: 'new' | 'used' | 'refurbished'
          warranty?: string | null
          car_details?: Json | null
          status?: 'draft' | 'active' | 'inactive' | 'sold'
          views?: number
          favorites?: number
          rating?: number
          review_count?: number
          seo_data?: Json | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          title?: string
          description?: string
          category?: string
          subcategory?: string | null
          images?: Json | null
          price?: number
          original_price?: number | null
          currency?: string
          in_stock?: boolean
          quantity?: number
          specifications?: Json | null
          features?: string[] | null
          tags?: string[] | null
          condition?: 'new' | 'used' | 'refurbished'
          warranty?: string | null
          car_details?: Json | null
          status?: 'draft' | 'active' | 'inactive' | 'sold'
          views?: number
          favorites?: number
          rating?: number
          review_count?: number
          seo_data?: Json | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_id: string
          vendor_id: string
          status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method: string
          subtotal: number
          tax: number
          shipping: number
          total: number
          currency: string
          shipping_address: Json
          billing_address: Json | null
          notes: string | null
          tracking_number: string | null
          estimated_delivery: string | null
          delivered_at: string | null
          cancelled_at: string | null
          cancelled_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          vendor_id: string
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method: string
          subtotal: number
          tax: number
          shipping: number
          total: number
          currency?: string
          shipping_address: Json
          billing_address?: Json | null
          notes?: string | null
          tracking_number?: string | null
          estimated_delivery?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          vendor_id?: string
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_method?: string
          subtotal?: number
          tax?: number
          shipping?: number
          total?: number
          currency?: string
          shipping_address?: Json
          billing_address?: Json | null
          notes?: string | null
          tracking_number?: string | null
          estimated_delivery?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Add more tables as needed...
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'customer' | 'vendor' | 'admin'
      vendor_status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'active'
      product_condition: 'new' | 'used' | 'refurbished'
      order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
      payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}