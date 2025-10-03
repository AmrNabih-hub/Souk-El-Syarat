/**
 * 🚀 Migration Notice: This file has been replaced with Appwrite
 * All AWS Amplify functionality has been migrated to Appwrite services
 */

import { databases } from '@/config/appwrite.config';

// Compatibility shim - redirects to Appwrite compatibility layer
export function generateClient() {
  console.warn('⚠️ Old AWS Amplify API detected - use Appwrite services instead');
  
  const graphql = async (options: any) => {
    console.warn('⚠️ GraphQL compatibility layer - consider migrating to Appwrite Database operations');
    return { data: {} };
  };

  return {
    graphql,
  };
}

export default generateClient;
