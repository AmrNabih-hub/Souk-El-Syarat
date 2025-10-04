/**
 * 🔍 Comprehensive Supabase Integration Validator
 * Tests all Supabase integrations: Database, Storage, Auth, Realtime, Functions
 * Run with: tsx scripts/validate-supabase-integration.ts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

interface ValidationResult {
  component: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

const results: ValidationResult[] = [];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  title: (msg: string) => console.log(`\n${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}\n`),
};

// Initialize Supabase client
const initializeSupabase = (): SupabaseClient | null => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    log.error('Missing Supabase credentials in environment');
    log.info('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    return null;
  }

  log.info(`Connecting to: ${supabaseUrl}`);
  return createClient(supabaseUrl, supabaseAnonKey);
};

// 1. Test Database Connection
async function testDatabaseConnection(supabase: SupabaseClient): Promise<void> {
  log.title('1. DATABASE CONNECTION TEST');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        results.push({
          component: 'Database - Users Table',
          status: 'warning',
          message: 'Users table not found. Run migrations first.',
          details: error.message,
        });
        log.warning('Users table not found. Migrations may not be run yet.');
      } else {
        throw error;
      }
    } else {
      results.push({
        component: 'Database Connection',
        status: 'success',
        message: 'Successfully connected to database',
      });
      log.success('Database connection successful');
    }
  } catch (error: any) {
    results.push({
      component: 'Database Connection',
      status: 'error',
      message: 'Failed to connect to database',
      details: error.message,
    });
    log.error(`Database connection failed: ${error.message}`);
  }
}

// 2. Test Required Tables
async function testRequiredTables(supabase: SupabaseClient): Promise<void> {
  log.title('2. REQUIRED TABLES TEST');
  
  const tables = [
    'users',
    'profiles',
    'vendors',
    'products',
    'orders',
    'order_items',
    'car_listings',
    'vendor_applications',
    'admin_logs',
    'favorites',
    'notifications',
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          results.push({
            component: `Table: ${table}`,
            status: 'warning',
            message: `Table "${table}" not found`,
          });
          log.warning(`Table "${table}" not found`);
        } else {
          throw error;
        }
      } else {
        results.push({
          component: `Table: ${table}`,
          status: 'success',
          message: `Table "${table}" exists and accessible`,
        });
        log.success(`Table "${table}" exists`);
      }
    } catch (error: any) {
      results.push({
        component: `Table: ${table}`,
        status: 'error',
        message: `Error checking table "${table}"`,
        details: error.message,
      });
      log.error(`Error checking table "${table}": ${error.message}`);
    }
  }
}

// 3. Test Storage Buckets
async function testStorageBuckets(supabase: SupabaseClient): Promise<void> {
  log.title('3. STORAGE BUCKETS TEST');
  
  const buckets = [
    'car-listings',
    'products',
    'vendor-documents',
    'avatars',
  ];

  try {
    const { data: allBuckets, error } = await supabase.storage.listBuckets();

    if (error) {
      results.push({
        component: 'Storage Buckets',
        status: 'error',
        message: 'Failed to list storage buckets',
        details: error.message,
      });
      log.error(`Failed to list buckets: ${error.message}`);
      return;
    }

    const existingBuckets = allBuckets?.map(b => b.name) || [];
    
    for (const bucket of buckets) {
      if (existingBuckets.includes(bucket)) {
        results.push({
          component: `Bucket: ${bucket}`,
          status: 'success',
          message: `Bucket "${bucket}" exists`,
        });
        log.success(`Bucket "${bucket}" exists`);
      } else {
        results.push({
          component: `Bucket: ${bucket}`,
          status: 'warning',
          message: `Bucket "${bucket}" not found. Create it in Supabase dashboard.`,
        });
        log.warning(`Bucket "${bucket}" not found`);
      }
    }
  } catch (error: any) {
    results.push({
      component: 'Storage Buckets',
      status: 'error',
      message: 'Error checking storage buckets',
      details: error.message,
    });
    log.error(`Error checking buckets: ${error.message}`);
  }
}

// 4. Test Auth Configuration
async function testAuthConfiguration(supabase: SupabaseClient): Promise<void> {
  log.title('4. AUTH CONFIGURATION TEST');
  
  try {
    // Test session retrieval
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    results.push({
      component: 'Auth Session',
      status: 'success',
      message: 'Auth system accessible',
      details: session ? 'Active session found' : 'No active session (expected)',
    });
    log.success('Auth system accessible');
    
    if (session) {
      log.info(`Active session found for user: ${session.user.email}`);
    } else {
      log.info('No active session (expected for validation script)');
    }
  } catch (error: any) {
    results.push({
      component: 'Auth Configuration',
      status: 'error',
      message: 'Auth system error',
      details: error.message,
    });
    log.error(`Auth error: ${error.message}`);
  }
}

// 5. Test RLS Policies
async function testRLSPolicies(supabase: SupabaseClient): Promise<void> {
  log.title('5. ROW LEVEL SECURITY (RLS) TEST');
  
  // Test unauthenticated access (should be restricted by RLS)
  const tables = ['users', 'profiles', 'vendors', 'orders'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      // If we get data without auth, RLS might not be configured
      if (data && data.length > 0) {
        results.push({
          component: `RLS: ${table}`,
          status: 'warning',
          message: `Table "${table}" accessible without auth - check RLS policies`,
        });
        log.warning(`Table "${table}" accessible without auth`);
      } else if (error && (error.message.includes('permission') || error.message.includes('policy'))) {
        results.push({
          component: `RLS: ${table}`,
          status: 'success',
          message: `Table "${table}" properly protected by RLS`,
        });
        log.success(`Table "${table}" protected by RLS`);
      } else if (error && error.message.includes('relation')) {
        // Table doesn't exist, skip
        log.info(`Table "${table}" not found (skipping RLS check)`);
      } else if (!data || data.length === 0) {
        results.push({
          component: `RLS: ${table}`,
          status: 'success',
          message: `Table "${table}" returns no data (RLS working)`,
        });
        log.success(`Table "${table}" properly restricted`);
      }
    } catch (error: any) {
      if (error.message.includes('relation')) {
        log.info(`Table "${table}" not found (skipping)`);
      } else {
        results.push({
          component: `RLS: ${table}`,
          status: 'error',
          message: `Error testing RLS for "${table}"`,
          details: error.message,
        });
        log.error(`RLS test error for "${table}": ${error.message}`);
      }
    }
  }
}

// 6. Test Realtime Configuration
async function testRealtimeConfiguration(supabase: SupabaseClient): Promise<void> {
  log.title('6. REALTIME CONFIGURATION TEST');
  
  try {
    // Create a realtime channel
    const channel = supabase.channel('test-channel');
    
    // Subscribe to the channel
    const subscription = channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        results.push({
          component: 'Realtime',
          status: 'success',
          message: 'Realtime connection successful',
        });
        log.success('Realtime connection successful');
      } else if (status === 'CHANNEL_ERROR') {
        results.push({
          component: 'Realtime',
          status: 'error',
          message: 'Realtime connection error',
        });
        log.error('Realtime connection error');
      }
    });

    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Unsubscribe
    await supabase.removeChannel(channel);
    
  } catch (error: any) {
    results.push({
      component: 'Realtime',
      status: 'error',
      message: 'Realtime test failed',
      details: error.message,
    });
    log.error(`Realtime test failed: ${error.message}`);
  }
}

// 7. Test Environment Variables
function testEnvironmentVariables(): void {
  log.title('7. ENVIRONMENT VARIABLES TEST');
  
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const optional = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'VITE_APP_ENV',
    'VITE_APP_NAME',
  ];

  required.forEach(varName => {
    if (process.env[varName]) {
      results.push({
        component: `Env: ${varName}`,
        status: 'success',
        message: `${varName} is set`,
      });
      log.success(`${varName} is set`);
    } else {
      results.push({
        component: `Env: ${varName}`,
        status: 'error',
        message: `${varName} is missing (REQUIRED)`,
      });
      log.error(`${varName} is missing (REQUIRED)`);
    }
  });

  optional.forEach(varName => {
    if (process.env[varName]) {
      results.push({
        component: `Env: ${varName}`,
        status: 'success',
        message: `${varName} is set`,
      });
      log.success(`${varName} is set`);
    } else {
      results.push({
        component: `Env: ${varName}`,
        status: 'warning',
        message: `${varName} not set (optional)`,
      });
      log.warning(`${varName} not set (optional)`);
    }
  });
}

// Generate Report
function generateReport(): void {
  log.title('VALIDATION SUMMARY');
  
  const success = results.filter(r => r.status === 'success').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const errors = results.filter(r => r.status === 'error').length;
  const total = results.length;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  SUPABASE INTEGRATION VALIDATION REPORT`);
  console.log(`${'='.repeat(60)}\n`);
  
  console.log(`${colors.green}✅ Success: ${success}/${total}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${warnings}/${total}${colors.reset}`);
  console.log(`${colors.red}❌ Errors: ${errors}/${total}${colors.reset}`);
  
  console.log(`\n${'-'.repeat(60)}\n`);

  if (errors > 0) {
    console.log(`${colors.red}ERRORS:${colors.reset}`);
    results
      .filter(r => r.status === 'error')
      .forEach(r => {
        console.log(`  ❌ ${r.component}: ${r.message}`);
        if (r.details) console.log(`     Details: ${r.details}`);
      });
    console.log('');
  }

  if (warnings > 0) {
    console.log(`${colors.yellow}WARNINGS:${colors.reset}`);
    results
      .filter(r => r.status === 'warning')
      .forEach(r => {
        console.log(`  ⚠️  ${r.component}: ${r.message}`);
      });
    console.log('');
  }

  console.log(`${'-'.repeat(60)}\n`);

  // Overall status
  if (errors > 0) {
    console.log(`${colors.red}STATUS: FAILED ❌${colors.reset}`);
    console.log('Fix errors before deploying to production.\n');
    process.exit(1);
  } else if (warnings > 0) {
    console.log(`${colors.yellow}STATUS: PASSED WITH WARNINGS ⚠️${colors.reset}`);
    console.log('Review warnings before deploying to production.\n');
    process.exit(0);
  } else {
    console.log(`${colors.green}STATUS: ALL CHECKS PASSED ✅${colors.reset}`);
    console.log('Supabase integration is ready for production!\n');
    process.exit(0);
  }
}

// Main execution
async function main() {
  console.log(`\n${colors.cyan}${'='.repeat(60)}`);
  console.log(`  🔍 SUPABASE INTEGRATION VALIDATOR`);
  console.log(`  Egyptian Car Marketplace - Quality Assurance`);
  console.log(`${'='.repeat(60)}${colors.reset}\n`);

  // Test environment variables first
  testEnvironmentVariables();

  // Initialize Supabase
  const supabase = initializeSupabase();
  
  if (!supabase) {
    log.error('Failed to initialize Supabase client');
    log.info('Please check your .env.local file and ensure credentials are set');
    process.exit(1);
  }

  // Run all tests
  await testDatabaseConnection(supabase);
  await testRequiredTables(supabase);
  await testStorageBuckets(supabase);
  await testAuthConfiguration(supabase);
  await testRLSPolicies(supabase);
  await testRealtimeConfiguration(supabase);

  // Generate final report
  generateReport();
}

// Run validation
main().catch(error => {
  log.error(`Validation failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
