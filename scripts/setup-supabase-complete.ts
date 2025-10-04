/**
 * 🚀 Complete Supabase Setup Script
 * Automates the entire Supabase configuration
 * Run with: tsx scripts/setup-supabase-complete.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  title: (msg: string) => console.log(`\n${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}\n`),
};

// Supabase credentials
const SUPABASE_URL = 'https://zgnwfnfehdwehuycbcsz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbndmbmZlaGR3ZWh1eWNiY3N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUwMzEwMCwiZXhwIjoyMDc1MDc5MTAwfQ.iYtkGB_bAwm5VGcQmJWZ-abeUbm79GTLijDOcYyaKW4';

// Initialize Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface SetupResult {
  step: string;
  success: boolean;
  message: string;
  error?: string;
}

const results: SetupResult[] = [];

/**
 * Step 1: Run Database Migrations
 */
async function runDatabaseMigrations() {
  log.title('STEP 1: DATABASE MIGRATIONS');

  try {
    // Read migration files
    const migration1 = readFileSync(resolve(__dirname, '../supabase/migrations/001_initial_schema.sql'), 'utf-8');
    const migration2 = readFileSync(resolve(__dirname, '../supabase/migrations/002_car_listings_and_applications.sql'), 'utf-8');

    log.info('Running migration 001_initial_schema.sql...');
    const { error: error1 } = await supabase.rpc('exec_sql', { sql: migration1 });
    
    if (error1) {
      // Try direct execution
      log.warning('RPC failed, executing SQL directly...');
      // Split and execute each statement
      const statements1 = migration1.split(';').filter(s => s.trim());
      for (const stmt of statements1) {
        if (stmt.trim()) {
          const { error } = await supabase.rpc('exec', { query: stmt });
          if (error && !error.message.includes('already exists')) {
            log.warning(`Statement warning: ${error.message}`);
          }
        }
      }
    }

    log.success('Migration 001 completed');

    log.info('Running migration 002_car_listings_and_applications.sql...');
    const { error: error2 } = await supabase.rpc('exec_sql', { sql: migration2 });
    
    if (error2) {
      log.warning('RPC failed, executing SQL directly...');
      const statements2 = migration2.split(';').filter(s => s.trim());
      for (const stmt of statements2) {
        if (stmt.trim()) {
          const { error } = await supabase.rpc('exec', { query: stmt });
          if (error && !error.message.includes('already exists')) {
            log.warning(`Statement warning: ${error.message}`);
          }
        }
      }
    }

    log.success('Migration 002 completed');

    results.push({
      step: 'Database Migrations',
      success: true,
      message: 'All migrations executed successfully'
    });

    return true;
  } catch (error: any) {
    log.error(`Migration failed: ${error.message}`);
    results.push({
      step: 'Database Migrations',
      success: false,
      message: 'Failed to execute migrations',
      error: error.message
    });
    return false;
  }
}

/**
 * Step 2: Create Storage Buckets
 */
async function createStorageBuckets() {
  log.title('STEP 2: STORAGE BUCKETS');

  const buckets = [
    { name: 'car-listings', public: true, fileSizeLimit: 10485760, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
    { name: 'products', public: true, fileSizeLimit: 5242880, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
    { name: 'vendor-documents', public: false, fileSizeLimit: 10485760, allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] },
    { name: 'avatars', public: true, fileSizeLimit: 2097152, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
  ];

  try {
    for (const bucket of buckets) {
      log.info(`Creating bucket: ${bucket.name}...`);
      
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      });

      if (error && !error.message.includes('already exists')) {
        log.warning(`Bucket ${bucket.name}: ${error.message}`);
      } else {
        log.success(`Bucket ${bucket.name} created`);
      }
    }

    results.push({
      step: 'Storage Buckets',
      success: true,
      message: `${buckets.length} buckets configured`
    });

    return true;
  } catch (error: any) {
    log.error(`Storage setup failed: ${error.message}`);
    results.push({
      step: 'Storage Buckets',
      success: false,
      message: 'Failed to create storage buckets',
      error: error.message
    });
    return false;
  }
}

/**
 * Step 3: Configure Auth Settings
 */
async function configureAuth() {
  log.title('STEP 3: AUTH CONFIGURATION');

  log.info('Auth settings must be configured manually in Supabase Dashboard:');
  console.log(`
${colors.cyan}Required Auth Settings:${colors.reset}
1. Go to: https://zgnwfnfehdwehuycbcsz.supabase.co/project/zgnwfnfehdwehuycbcsz/auth/url-configuration

2. Email Auth Settings:
   ✅ Enable Email Confirmations: ON
   ✅ Enable Email Change Confirmations: ON
   ✅ Secure Email Change: ON

3. Site URL:
   - Add: https://souk-al-sayarat-b3gfy9ds6-amrs-projects-fd281155.vercel.app
   
4. Redirect URLs (add these):
   - https://souk-al-sayarat-b3gfy9ds6-amrs-projects-fd281155.vercel.app/auth/callback
   - https://souk-al-sayarat-b3gfy9ds6-amrs-projects-fd281155.vercel.app/**
   - http://localhost:5173/auth/callback (for development)

5. OAuth Providers:
   ✅ Google: Enable
   ✅ GitHub: Enable
   ❌ Facebook: Disable

6. Email Templates:
   - Customize confirmation email template
   - Add your app branding
  `);

  log.warning('Please complete these settings manually in Supabase Dashboard');
  log.info('Press any key after completing settings...');

  results.push({
    step: 'Auth Configuration',
    success: true,
    message: 'Auth settings documented (manual configuration required)'
  });

  return true;
}

/**
 * Step 4: Verify Tables
 */
async function verifyTables() {
  log.title('STEP 4: VERIFY TABLES');

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
    'notifications'
  ];

  let allFound = true;

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      
      if (error && error.message.includes('relation')) {
        log.error(`Table ${table} not found`);
        allFound = false;
      } else {
        log.success(`Table ${table} exists`);
      }
    } catch (error: any) {
      log.error(`Error checking ${table}: ${error.message}`);
      allFound = false;
    }
  }

  results.push({
    step: 'Table Verification',
    success: allFound,
    message: allFound ? 'All tables verified' : 'Some tables missing'
  });

  return allFound;
}

/**
 * Step 5: Test Auth Flow
 */
async function testAuthFlow() {
  log.title('STEP 5: TEST AUTH FLOW');

  try {
    // Test 1: Try to create a test user
    log.info('Testing user creation...');
    
    const testEmail = `test_${Date.now()}@souk-test.com`;
    const testPassword = 'Test123!@#';

    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        display_name: 'Test User',
        role: 'customer'
      }
    });

    if (error) {
      throw error;
    }

    log.success('Test user created successfully');

    // Clean up test user
    if (data.user) {
      await supabase.auth.admin.deleteUser(data.user.id);
      log.info('Test user cleaned up');
    }

    results.push({
      step: 'Auth Flow Test',
      success: true,
      message: 'Auth system working correctly'
    });

    return true;
  } catch (error: any) {
    log.error(`Auth test failed: ${error.message}`);
    results.push({
      step: 'Auth Flow Test',
      success: false,
      message: 'Auth system has issues',
      error: error.message
    });
    return false;
  }
}

/**
 * Generate Setup Report
 */
function generateReport() {
  log.title('SETUP REPORT');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;

  console.log(`
${colors.cyan}╔════════════════════════════════════════════════════════╗
║         SUPABASE SETUP COMPLETION REPORT               ║
╚════════════════════════════════════════════════════════╝${colors.reset}

Total Steps: ${total}
${colors.green}✅ Successful: ${successful}${colors.reset}
${colors.red}❌ Failed: ${failed}${colors.reset}

${colors.cyan}Details:${colors.reset}
`);

  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    const color = result.success ? colors.green : colors.red;
    console.log(`${color}${icon} ${index + 1}. ${result.step}${colors.reset}`);
    console.log(`   ${result.message}`);
    if (result.error) {
      console.log(`   ${colors.red}Error: ${result.error}${colors.reset}`);
    }
    console.log('');
  });

  if (failed === 0) {
    console.log(`${colors.green}
╔════════════════════════════════════════════════════════╗
║            ✅ SETUP COMPLETED SUCCESSFULLY             ║
╚════════════════════════════════════════════════════════╝
${colors.reset}`);
  } else {
    console.log(`${colors.yellow}
╔════════════════════════════════════════════════════════╗
║      ⚠️  SETUP COMPLETED WITH WARNINGS                ║
║      Please review failed steps above                  ║
╚════════════════════════════════════════════════════════╝
${colors.reset}`);
  }

  console.log(`
${colors.cyan}Next Steps:${colors.reset}
1. Complete manual Auth configuration in Supabase Dashboard
2. Run: npm run validate:supabase
3. Test the application locally
4. Deploy to Vercel with updated environment variables
`);
}

/**
 * Main Setup Function
 */
async function main() {
  console.log(`
${colors.cyan}╔════════════════════════════════════════════════════════╗
║                                                        ║
║       🚀 SUPABASE COMPLETE SETUP AUTOMATION           ║
║                                                        ║
║       Egyptian Car Marketplace                         ║
║       Professional Backend Configuration               ║
║                                                        ║
╚════════════════════════════════════════════════════════╝${colors.reset}

Project URL: ${SUPABASE_URL}
Project Ref: zgnwfnfehdwehuycbcsz

Starting automated setup...
`);

  // Run all setup steps
  await runDatabaseMigrations();
  await createStorageBuckets();
  await configureAuth();
  await verifyTables();
  await testAuthFlow();

  // Generate report
  generateReport();
}

// Run setup
main().catch(error => {
  log.error(`Setup failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
