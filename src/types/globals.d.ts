declare global {
  interface Window {
    NotificationPermission: NotificationPermission;
  }

  type NotificationPermission = 'default' | 'denied' | 'granted';

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      VITE_FIREBASE_API_KEY?: string;
      VITE_FIREBASE_AUTH_DOMAIN?: string;
      VITE_FIREBASE_PROJECT_ID?: string;
      VITE_FIREBASE_STORAGE_BUCKET?: string;
      VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
      VITE_FIREBASE_APP_ID?: string;
      VITE_FIREBASE_MEASUREMENT_ID?: string;
      VITE_ELASTICSEARCH_URL?: string;
      VITE_ELASTICSEARCH_API_KEY?: string;
    }
    
    interface Timeout {}
    interface Timer {}
  }
}

export {};