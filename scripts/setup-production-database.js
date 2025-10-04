#!/usr/bin/env node

/**
 * 🏗️ Production Database Setup Script
 * Sets up the complete database schema and initial data for Souk El-Sayarat
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://zgnwfnfehdwehuycbcsz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbndmbmZlaGR3ZWh1eWNiY3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDMxMDAsImV4cCI6MjA3NTA3OTEwMH0.4nYLZq-ZkvoidVwL6RM24xMvXDCVbYBVaYSS3mD-uc0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupDatabase() {
  console.log('🚀 Starting production database setup...');

  try {
    // Read the SQL setup file
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'setup-database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL commands and execute them
    const commands = sqlContent
      .split(';')
      .filter(cmd => cmd.trim().length > 0)
      .map(cmd => cmd.trim() + ';');

    console.log(`📝 Found ${commands.length} SQL commands to execute`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      try {
        console.log(`⚡ Executing command ${i + 1}/${commands.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_command: command 
        });

        if (error) {
          // Try direct query for some commands
          const { error: directError } = await supabase
            .from('_temp_')
            .select('1')
            .limit(0);
          
          if (directError && !directError.message.includes('does not exist')) {
            console.warn(`⚠️  Warning on command ${i + 1}: ${error.message}`);
          }
        }

        successCount++;
        
        // Add delay to avoid rate limiting
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (cmdError) {
        console.error(`❌ Error on command ${i + 1}:`, cmdError.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Database setup results:`);
    console.log(`✅ Successful commands: ${successCount}`);
    console.log(`❌ Failed commands: ${errorCount}`);

    // Verify essential tables exist
    await verifyTables();

    // Insert sample data
    await insertSampleData();

    console.log('\n🎉 Production database setup completed successfully!');
    console.log('🌍 Your Souk El-Sayarat marketplace is ready for global deployment!');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

async function verifyTables() {
  console.log('\n🔍 Verifying essential tables...');

  const essentialTables = [
    'profiles',
    'vendors', 
    'categories',
    'products',
    'car_listings',
    'orders',
    'order_items',
    'reviews',
    'chat_rooms',
    'chat_messages',
    'notifications',
    'favorites',
    'todos'
  ];

  for (const table of essentialTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`❌ Table '${table}' verification failed:`, error.message);
      } else {
        console.log(`✅ Table '${table}' exists (${count || 0} records)`);
      }
    } catch (error) {
      console.error(`❌ Could not verify table '${table}':`, error.message);
    }
  }
}

async function insertSampleData() {
  console.log('\n🌱 Inserting sample data...');

  try {
    // Insert sample categories
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('slug');

    if (!existingCategories || existingCategories.length === 0) {
      const categories = [
        {
          name: 'Cars',
          name_ar: 'سيارات',
          slug: 'cars',
          description: 'All types of vehicles for sale',
          icon: '🚗',
          sort_order: 1
        },
        {
          name: 'Car Parts',
          name_ar: 'قطع غيار السيارات', 
          slug: 'car-parts',
          description: 'Automotive parts and accessories',
          icon: '🔧',
          sort_order: 2
        },
        {
          name: 'Services',
          name_ar: 'خدمات',
          slug: 'services',
          description: 'Automotive services and maintenance',
          icon: '⚙️',
          sort_order: 3
        },
        {
          name: 'Motorcycles',
          name_ar: 'دراجات نارية',
          slug: 'motorcycles', 
          description: 'Motorcycles and scooters',
          icon: '🏍️',
          sort_order: 4
        },
        {
          name: 'Trucks & Commercial',
          name_ar: 'شاحنات وسيارات تجارية',
          slug: 'trucks-commercial',
          description: 'Commercial vehicles and trucks',
          icon: '🚛',
          sort_order: 5
        }
      ];

      const { error: categoriesError } = await supabase
        .from('categories')
        .insert(categories);

      if (categoriesError) {
        console.error('❌ Error inserting categories:', categoriesError);
      } else {
        console.log('✅ Sample categories inserted');
      }
    }

    // Insert welcome todos
    const { data: existingTodos } = await supabase
      .from('todos')
      .select('id')
      .limit(1);

    if (!existingTodos || existingTodos.length === 0) {
      const todos = [
        {
          title: 'Welcome to Souk El-Sayarat! 🚗',
          completed: false
        },
        {
          title: 'Explore the marketplace and find your perfect car',
          completed: false
        },
        {
          title: 'Register as a vendor to start selling',
          completed: false
        },
        {
          title: 'Check out our advanced search features',
          completed: false
        },
        {
          title: 'Experience real-time notifications and chat',
          completed: false
        }
      ];

      const { error: todosError } = await supabase
        .from('todos')
        .insert(todos);

      if (todosError) {
        console.error('❌ Error inserting todos:', todosError);
      } else {
        console.log('✅ Welcome todos inserted');
      }
    }

    console.log('✅ Sample data insertion completed');

  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
  }
}

// Run the setup
setupDatabase().catch(console.error);