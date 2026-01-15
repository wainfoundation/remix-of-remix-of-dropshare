/**
 * Test Supabase Storage Upload
 * Run this to verify storage is working correctly
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zgbzubmazzxjylgdpdqi.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'your-anon-key-here';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testStorage() {
  console.log('🧪 Testing Supabase Storage...\n');

  // Test 1: List buckets
  console.log('1️⃣ Checking buckets...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.error('❌ Error listing buckets:', bucketsError);
    return;
  }
  
  console.log('✅ Buckets found:', buckets.map(b => b.name).join(', '));
  
  const uploadsBucket = buckets.find(b => b.name === 'uploads');
  if (!uploadsBucket) {
    console.error('❌ "uploads" bucket not found!');
    console.log('📝 Run the storage migration first:');
    console.log('   supabase/migrations/20260115_setup_storage.sql');
    return;
  }
  
  console.log('✅ "uploads" bucket exists');
  console.log('   Public:', uploadsBucket.public);
  console.log('');

  // Test 2: Upload test file
  console.log('2️⃣ Testing file upload...');
  const testContent = 'DropShare Storage Test - ' + new Date().toISOString();
  const testFile = new Blob([testContent], { type: 'text/plain' });
  const testPath = `test/${Date.now()}-test.txt`;

  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(testPath, testFile);

  if (uploadError) {
    console.error('❌ Upload failed:', uploadError);
    return;
  }

  console.log('✅ Test file uploaded:', testPath);
  console.log('');

  // Test 3: Get public URL
  console.log('3️⃣ Testing public URL...');
  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(testPath);

  console.log('✅ Public URL:', publicUrl);
  console.log('');

  // Test 4: Download file
  console.log('4️⃣ Testing file download...');
  const { data: downloadData, error: downloadError } = await supabase.storage
    .from('uploads')
    .download(testPath);

  if (downloadError) {
    console.error('❌ Download failed:', downloadError);
    return;
  }

  const downloadedText = await downloadData.text();
  console.log('✅ Downloaded content:', downloadedText);
  console.log('');

  // Test 5: Delete test file
  console.log('5️⃣ Cleaning up test file...');
  const { error: deleteError } = await supabase.storage
    .from('uploads')
    .remove([testPath]);

  if (deleteError) {
    console.error('❌ Delete failed:', deleteError);
    return;
  }

  console.log('✅ Test file deleted');
  console.log('');

  console.log('🎉 All tests passed! Storage is working correctly.');
  console.log('');
  console.log('📊 Summary:');
  console.log('   ✅ Storage bucket exists');
  console.log('   ✅ Can upload files');
  console.log('   ✅ Can get public URLs');
  console.log('   ✅ Can download files');
  console.log('   ✅ Can delete files');
  console.log('');
  console.log('🚀 Your app is ready to handle uploads!');
}

testStorage().catch(console.error);
