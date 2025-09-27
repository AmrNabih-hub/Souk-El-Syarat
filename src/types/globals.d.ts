declare global {
  interface Window {
    NotificationPermission: NotificationPermission;
  }

  type NotificationPermission = 'default' | 'denied' | 'granted';

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

export {};
