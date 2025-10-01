// Real-time WebSocket Event Names
// Centralized constants to prevent typos and ensure consistency

export const REALTIME_EVENTS = {
  // Vendor Application Events
  VENDOR_APPLICATION: 'vendor_application',
  VENDOR_APPROVED: 'vendor_approved',
  VENDOR_REJECTED: 'vendor_rejected',
  
  // Used Car Listing Events (for future implementation)
  CAR_LISTING_CREATED: 'car_listing_created',
  CAR_LISTING_APPROVED: 'car_listing_approved',
  CAR_LISTING_REJECTED: 'car_listing_rejected',
  
  // Order Events
  ORDER_UPDATE: 'order_update',
  ORDER_CREATED: 'order_created',
  ORDER_COMPLETED: 'order_completed',
  
  // Product Events
  PRODUCT_UPDATE: 'product_update',
  PRODUCT_CREATED: 'product_created',
  
  // Admin Notifications
  ADMIN_NOTIFICATION: 'admin_notifications',
  
  // Vendor Dashboard Updates
  VENDOR_DASHBOARD_UPDATE: 'vendor_dashboard_update',
  VENDOR_STATUS_UPDATE: 'vendor_status_update',
  
  // Connection Events
  CONNECTION_STATUS: 'connection',
  CONNECTION_ERROR: 'error',
} as const;

export type RealtimeEventType = typeof REALTIME_EVENTS[keyof typeof REALTIME_EVENTS];
