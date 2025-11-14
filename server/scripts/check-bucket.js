import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function checkBucket() {
  console.log('🔍 Checking Supabase buckets...\n');
  console.log('Looking for bucket:', process.env.SUPABASE_BUCKET);
  console.log('');

  const { data, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log('📋 Found buckets:');
  data.forEach((bucket) => {
    const match = bucket.name === process.env.SUPABASE_BUCKET ? '✅' : '  ';
    console.log(`${match} ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
  });

  const bucketExists = data.some(
    (bucket) => bucket.name === process.env.SUPABASE_BUCKET
  );

  console.log('');
  if (bucketExists) {
    console.log('✅ Bucket found!');
  } else {
    console.log('❌ Bucket NOT found!');
    console.log('Expected:', process.env.SUPABASE_BUCKET);
    console.log('Available:', data.map(b => b.name).join(', '));
  }
}

checkBucket();