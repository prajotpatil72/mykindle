import axios from 'axios';
import mongoose from 'mongoose';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const API_URL = 'http://localhost:5000';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

let testResults = [];

const test = async (name, fn) => {
  try {
    await fn();
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    testResults.push({ name, status: 'PASS' });
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    testResults.push({ name, status: 'FAIL', error: error.message });
  }
};

console.log('\n🧪 Running Phase 1 & 2 Integration Tests\n');

// Test 1: Server Health Check
await test('Server is running and responding', async () => {
  const response = await axios.get(`${API_URL}/health`);
  if (response.status !== 200) throw new Error('Server not responding');
  if (response.data.status !== 'success') throw new Error('Health check failed');
});

// Test 2: MongoDB Connection
await test('MongoDB connection is established', async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB not connected');
  }
});

// Test 3: MongoDB Database Exists
await test('MongoDB database exists', async () => {
  const db = mongoose.connection.db;
  const dbName = db.databaseName;
  if (!dbName) throw new Error('Database name not found');
  console.log(`    Database name: ${dbName}`);
});

// Test 4: Supabase Connection
await test('Supabase connection is working', async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`Supabase error: ${error.message}`);
});

// Test 5: Supabase Bucket Exists
await test('Supabase PDF bucket exists', async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(error.message);
  const bucketExists = data.some(
    (bucket) => bucket.name === process.env.SUPABASE_BUCKET
  );
  if (!bucketExists) throw new Error('PDF bucket not found');
});

// Test 6: Environment Variables
await test('All required environment variables are set', async () => {
  const required = [
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'SUPABASE_URL',
    'SUPABASE_KEY',
    'SUPABASE_BUCKET',
    'CLIENT_URL',
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing variables: ${missing.join(', ')}`);
  }
});

// Test 7: CORS Configuration
await test('CORS is properly configured', async () => {
  const response = await axios.options(`${API_URL}/health`);
  const corsHeader = response.headers['access-control-allow-origin'];
  if (!corsHeader) throw new Error('CORS headers not set');
});

// Test 8: 404 Handler
await test('404 handler works correctly', async () => {
  try {
    await axios.get(`${API_URL}/nonexistent-route`);
    throw new Error('Should have thrown 404');
  } catch (error) {
    if (error.response?.status !== 404) {
      throw new Error('404 handler not working');
    }
  }
});

// Cleanup
await mongoose.connection.close();

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Test Summary\n');
const passed = testResults.filter((t) => t.status === 'PASS').length;
const failed = testResults.filter((t) => t.status === 'FAIL').length;
console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
console.log(`Total: ${testResults.length}`);
console.log('='.repeat(50) + '\n');

if (failed > 0) {
  console.log('❌ Some tests failed. Please check the errors above.\n');
  process.exit(1);
} else {
  console.log('✅ All tests passed! Phase 1 & 2 setup is complete.\n');
  process.exit(0);
}