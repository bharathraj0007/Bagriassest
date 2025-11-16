#!/usr/bin/env node

// Test script to verify Supabase connection
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  console.log('\nPlease update .env.local with:');
  console.log('VITE_SUPABASE_URL=https://your-project-id.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

console.log('🔗 Testing Supabase Connection...');
console.log('================================');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase.from('profiles').select('count').single();

    if (error) {
      console.error('❌ Basic connection failed:', error.message);
      return false;
    }
    console.log('✅ Basic connection successful');

    // Test crops table
    console.log('2. Testing crops table...');
    const { data: crops, error: cropsError } = await supabase
      .from('crops')
      .select('count')
      .single();

    if (cropsError) {
      console.error('❌ Crops table test failed:', cropsError.message);
      return false;
    }
    console.log(`✅ Crops table accessible (${crops?.count || 0} crops found)`);

    // Test recommendations table
    console.log('3. Testing recommendations table...');
    const { data: recommendations, error: recError } = await supabase
      .from('recommendations')
      .select('count')
      .single();

    if (recError) {
      console.error('❌ Recommendations table test failed:', recError.message);
      return false;
    }
    console.log(`✅ Recommendations table accessible (${recommendations?.count || 0} recommendations found)`);

    // Test price predictions table
    console.log('4. Testing price_predictions table...');
    const { data: pricePreds, error: priceError } = await supabase
      .from('price_predictions')
      .select('count')
      .single();

    if (priceError) {
      console.error('❌ Price predictions table test failed:', priceError.message);
      return false;
    }
    console.log(`✅ Price predictions table accessible (${pricePreds?.count || 0} predictions found)`);

    // Test advanced tables
    console.log('5. Testing enhanced tables...');

    // Test price_history table
    const { error: priceHistoryError } = await supabase
      .from('price_history')
      .select('count')
      .single();

    if (priceHistoryError) {
      console.log('⚠️  Price history table may not exist yet');
    } else {
      console.log('✅ Price history table accessible');
    }

    // Test system_logs table
    const { error: logsError } = await supabase
      .from('system_logs')
      .select('count')
      .single();

    if (logsError) {
      console.log('⚠️  System logs table may not exist yet');
    } else {
      console.log('✅ System logs table accessible');
    }

    console.log('');
    console.log('🎉 All tests passed! Supabase connection is working correctly.');
    console.log('');
    console.log('📊 Database Summary:');
    console.log(`   - Profiles: ${data?.count || 0} users`);
    console.log(`   - Crops: ${crops?.count || 0} crops`);
    console.log(`   - Recommendations: ${recommendations?.count || 0} recommendations`);
    console.log(`   - Price Predictions: ${pricePreds?.count || 0} predictions`);

    return true;

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

async function testFunctions() {
  console.log('6. Testing Supabase Functions...');

  const testUrls = [
    `${supabaseUrl}/functions/v1/crop-recommendation`,
    `${supabaseUrl}/functions/v1/price-prediction`,
    `${supabaseUrl}/functions/v1/weather-data`
  ];

  for (const url of testUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✅ ${url.split('/').pop()} function is accessible`);
      } else {
        console.log(`⚠️  ${url.split('/').pop()} function returned ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${url.split('/').pop()} function error: ${error.message}`);
    }
  }
}

// Run tests
async function main() {
  const connectionTest = await testConnection();
  if (connectionTest) {
    await testFunctions();
  }

  console.log('\n🔗 To test the application:');
  console.log('   1. Start development server: npm run dev');
  console.log('   2. Open browser to: http://localhost:5173');
  console.log('   3. Test user registration and features');
}

main().catch(console.error);