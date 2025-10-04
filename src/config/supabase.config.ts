/**
 * 🚀 Supabase Configuration for Souk El-Sayarat
 * Professional full-stack configuration using Supabase Cloud
 * Documentation: https://supabase.com/docs
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Supabase Configuration - with fallbacks for debugging
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zgnwfnfehdwehuycbcsz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbndmbmZlaGR3ZWh1eWNiY3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDMxMDAsImV4cCI6MjA3NTA3OTEwMH0.4nYLZq-ZkvoidVwL6RM24xMvXDCVbYBVaYSS3mD-uc0';
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug logging
console.log('🔍 Environment check:');
console.log('- VITE_SUPABASE_URL from env:', import.meta.env.VITE_SUPABASE_URL);
console.log('- VITE_SUPABASE_ANON_KEY from env:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('- Using supabaseUrl:', supabaseUrl);

// Validate environment variables
const validateConfig = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing critical Supabase configuration');
    console.error('Please check your environment variables:');
    console.error('- VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
    console.error('Available env vars:', Object.keys(import.meta.env));
    return false;
  }
  return true;
};

// Initialize Supabase Client (Public)
export const supabase: SupabaseClient<Database> = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'x-application-name': 'souk-el-sayarat',
      },
    },
  }
);

// Initialize Supabase Admin Client (Server-side operations)
export const supabaseAdmin: SupabaseClient<Database> = supabaseServiceKey
  ? createClient(supabaseUrl!, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'x-application-name': 'souk-el-sayarat-admin',
        },
      },
    })
  : supabase;

// Configuration object
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  serviceKey: supabaseServiceKey,
  
  // Database Tables
  tables: {
    users: 'users',
    profiles: 'profiles',
    vendors: 'vendors',
    products: 'products',
    orders: 'orders',
    order_items: 'order_items',
    car_listings: 'car_listings',
    vendor_applications: 'vendor_applications',
    reviews: 'reviews',
    favorites: 'favorites',
    notifications: 'notifications',
    chat_rooms: 'chat_rooms',
    chat_messages: 'chat_messages',
    categories: 'categories',
    subcategories: 'subcategories',
    analytics_events: 'analytics_events',
  },

  // Storage Buckets
  buckets: {
    productImages: 'product-images',
    vendorDocuments: 'vendor-documents',
    carImages: 'car-images',
    userAvatars: 'user-avatars',
    vendorLogos: 'vendor-logos',
    chatAttachments: 'chat-attachments',
  },

  // Edge Functions
  functions: {
    processPayment: 'process-payment',
    sendNotification: 'send-notification',
    generateReport: 'generate-report',
    aiSearch: 'ai-search',
    imageProcessing: 'image-processing',
    emailService: 'email-service',
  },

  // Realtime Channels
  channels: {
    orders: 'orders',
    chat: 'chat',
    notifications: 'notifications',
    analytics: 'analytics',
  },
};

// Helper functions
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

export const getTableName = (table: keyof typeof supabaseConfig.tables): string => {
  return supabaseConfig.tables[table];
};

export const getBucketName = (bucket: keyof typeof supabaseConfig.buckets): string => {
  return supabaseConfig.buckets[bucket];
};

export const getFunctionName = (func: keyof typeof supabaseConfig.functions): string => {
  return supabaseConfig.functions[func];
};

// Log configuration status
if (validateConfig()) {
  console.log('✅ Supabase client configured successfully');
  console.log('🌐 URL:', supabaseUrl);
  console.log('🔑 Auth configured:', !!supabaseAnonKey);
  console.log('👑 Admin configured:', !!supabaseServiceKey);
} else {
  console.warn('⚠️ Supabase configuration incomplete');
}

// Export default configuration
export default {
  client: supabase,
  admin: supabaseAdmin,
  config: supabaseConfig,
  isConfigured: isSupabaseConfigured,
  getTableName,
  getBucketName,
  getFunctionName,
};