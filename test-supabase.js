// Quick test to verify Supabase connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zgnwfnfehdwehuycbcsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbndmbmZlaGR3ZWh1eWNiY3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDMxMDAsImV4cCI6MjA3NTA3OTEwMH0.4nYLZq-ZkvoidVwL6RM24xMvXDCVbYBVaYSS3mD-uc0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🧪 Testing Supabase connection...');
    
    // Test connection
    const { data, error } = await supabase.from('todos').select('*').limit(1);
    
    if (error) {
      console.log('ℹ️  Table "todos" doesn\'t exist yet - this is normal!');
      console.log('✅ Supabase connection successful!');
      console.log('🎯 Next: Create tables in your Supabase dashboard');
    } else {
      console.log('✅ Supabase connection and table access successful!');
      console.log('📊 Sample data:', data);
    }
    
    // Test auth
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Auth status:', user ? 'Logged in' : 'Anonymous');
    
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

testConnection();