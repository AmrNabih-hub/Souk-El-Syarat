declare module 'aws-amplify' {
  export const Amplify: any;
  export const Auth: any;
  export const Hub: any;
  // Preserve backward compatibility for DataStore imports from aws-amplify
  export const DataStore: any;
  export default Amplify;
}

declare module '@aws-amplify/datastore' {
  export const DataStore: any;
}

// Make model classes available globally to avoid missing-import errors in services
declare global {
  var User: any;
  var Vendor: any;
  var Product: any;
  var Order: any;
  var AnalyticsEvent: any;
  var BusinessMetrics: any;
  var RealTimeStats: any;
  var SystemMetrics: any;
}

declare module '@aws-amplify/api' {
  export interface GraphQLResult<T = any> {
    data?: T;
  }
  export interface GraphqlSubscriptionResult<T = any> {
    data?: T;
  }
}

declare module '@aws-amplify/api-graphql' {
  export interface GraphQLResult<T = any> {
    data?: T;
  }
  export interface GraphqlSubscriptionResult<T = any> {
    data?: T;
  }
}
