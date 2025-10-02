/**
 * Analytics Service - Simplified for Appwrite
 */

export class AnalyticsService {
  static trackEvent(eventName: string, eventData?: any) {
    console.log('📊 Analytics Event:', eventName, eventData);
    // TODO: Integrate with analytics platform
  }

  static trackPageView(pageName: string) {
    console.log('📄 Page View:', pageName);
    // TODO: Integrate with analytics platform
  }

  static setUserId(userId: string) {
    console.log('👤 User ID set:', userId);
    // TODO: Integrate with analytics platform
  }

  static setUserProperties(properties: any) {
    console.log('👤 User Properties:', properties);
    // TODO: Integrate with analytics platform
  }
}

export default AnalyticsService;
