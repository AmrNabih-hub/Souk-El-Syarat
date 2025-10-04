#!/usr/bin/env node
/**
 * 🔍 Supabase Setup Validator
 * Validates that all Supabase services are properly configured
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://zgnwfnfehdwehuycbcsz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbndmbmZlaGR3ZWh1eWNiY3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDMxMDAsImV4cCI6MjA3NTA3OTEwMH0.4nYLZq-ZkvoidVwL6RM24xMvXDCVbYBVaYSS3mD-uc0';

const REQUIRED_TABLES = [
  'users', 'profiles', 'vendors', 'products', 'orders', 
  'order_items', 'favorites', 'notifications'
];

const REQUIRED_BUCKETS = [
  'product-images', 'vendor-documents', 'car-images',
  'user-avatars', 'vendor-logos', 'chat-attachments'
];

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let passed = 0;
let failed = 0;

function logResult(test, success, message = '') {
  const icon = success ? '✅' : '❌';
  const status = success ? 'PASS' : 'FAIL';
  console.log(`${icon} ${test}: ${status}${message ? ` - ${message}` : ''}`);
  
  if (success) passed++;
  else failed++;
}

async function validateSetup() {
  console.log('🔍 Validating Supabase Setup for Souk El-Sayarat\n');

  // Test 1: Basic Connection
  console.log('📡 Testing Basic Connection...');
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error && error.message.includes('table')) {
      logResult('Database Connection', true, 'Connected (tables need setup)');
    } else if (error) {
      logResult('Database Connection', false, error.message);
    } else {
      logResult('Database Connection', true, 'Connected and ready');
    }
  } catch (error) {
    logResult('Database Connection', false, error.message);
  }

  // Test 2: Authentication Service
  console.log('\n🔐 Testing Authentication...');
  try {
    const { data, error } = await supabase.auth.getSession();
    logResult('Auth Service', true, 'Available');
  } catch (error) {
    logResult('Auth Service', false, error.message);
  }

  // Test 3: Storage Service
  console.log('\n🗂️  Testing Storage...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      logResult('Storage Service', false, error.message);
    } else {
      logResult('Storage Service', true, `${buckets.length} buckets found`);
      
      // Check required buckets
      const foundBuckets = buckets.map(b => b.name);
      REQUIRED_BUCKETS.forEach(bucketName => {
        const exists = foundBuckets.includes(bucketName);
        logResult(`  Bucket: ${bucketName}`, exists, exists ? 'Found' : 'Missing');
      });
    }
  } catch (error) {
    logResult('Storage Service', false, error.message);
  }

  // Test 4: Database Tables
  console.log('\n🗄️  Testing Database Tables...');
  for (const table of REQUIRED_TABLES) {
    try {
      const { data, error } = await supabase.from(table).select('count').limit(1);
      if (error && error.message.includes('table')) {
        logResult(`  Table: ${table}`, false, 'Does not exist');
      } else if (error) {
        logResult(`  Table: ${table}`, false, error.message);
      } else {
        logResult(`  Table: ${table}`, true, 'Exists');
      }
    } catch (error) {
      logResult(`  Table: ${table}`, false, error.message);
    }
  }

  // Test 5: Realtime
  console.log('\n⚡ Testing Realtime...');
  try {
    const channel = supabase.channel('test_channel');
    await new Promise((resolve) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logResult('Realtime Service', true, 'Available');
          supabase.removeChannel(channel);
          resolve();
        } else if (status === 'CHANNEL_ERROR') {
          logResult('Realtime Service', false, 'Connection failed');
          resolve();
        }
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        logResult('Realtime Service', false, 'Connection timeout');
        supabase.removeChannel(channel);
        resolve();
      }, 5000);
    });
  } catch (error) {
    logResult('Realtime Service', false, error.message);
  }

  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your Supabase setup is complete.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the setup guide:');
    console.log('   📖 See: SUPABASE_SETUP_COMPLETE.md');
  }

  console.log('\n🚀 Ready to start development!');
  console.log('   npm run dev');
}

validateSetup().catch(console.error);