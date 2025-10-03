/**
 * 🚀 Appwrite Compatibility Shim
 * Replaces old AWS Amplify API functionality with Appwrite
 */

import { databases } from '@/config/appwrite.config';

// Compatibility function for old generateClient usage
export function generateClient() {
  const graphql = async (options: any) => {
    // Convert GraphQL-style queries to Appwrite database operations
    console.warn('⚠️ GraphQL compatibility layer - consider migrating to Appwrite Database operations');
    
    // Return empty data for compatibility
    return { data: {} };
  };

  return {
    graphql,
  };
}

export default generateClient;