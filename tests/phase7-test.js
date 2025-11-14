import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const API_URL = 'http://localhost:5000/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};

let testResults = [];
let accessToken = '';
let documentId = '';

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

console.log('\n🧪 Running Phase 7 Tests\n');

// Setup
const testUser = {
  email: `test${Date.now()}@example.com`,
  password: 'Test123456',
  name: 'Test User',
};

await test('Setup: Register and login', async () => {
  await axios.post(`${API_URL}/auth/register`, testUser);
  const loginResponse = await axios.post(`${API_URL}/auth/login`, {
    email: testUser.email,
    password: testUser.password,
  });
  accessToken = loginResponse.data.data.accessToken;
});

// Test document upload (Note: This requires a test PDF file)
await test('Can upload PDF document', async () => {
  // Create a minimal PDF buffer for testing
  const testPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n178\n%%EOF');
  
  const form = new FormData();
  form.append('file', testPdfBuffer, {
    filename: 'test.pdf',
    contentType: 'application/pdf',
  });

  const response = await axios.post(`${API_URL}/documents/upload`, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status !== 201) throw new Error('Upload failed');
  documentId = response.data.data.document.id;
});

await test('Can get all documents', async () => {
  const response = await axios.get(`${API_URL}/documents`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status !== 200) throw new Error('Get documents failed');
  if (!Array.isArray(response.data.data.documents)) {
    throw new Error('Documents not returned as array');
  }
});

await test('Can get document statistics', async () => {
  const response = await axios.get(`${API_URL}/documents/stats`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status !== 200) throw new Error('Get stats failed');
  if (!response.data.data.stats) throw new Error('Stats not returned');
});

if (documentId) {
  await test('Can get single document', async () => {
    const response = await axios.get(`${API_URL}/documents/${documentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.status !== 200) throw new Error('Get document failed');
  });

  await test('Can update document', async () => {
    const response = await axios.put(
      `${API_URL}/documents/${documentId}`,
      { originalName: 'Updated Name.pdf', tags: ['test', 'demo'] },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (response.status !== 200) throw new Error('Update failed');
  });

  await test('Can delete document', async () => {
    const response = await axios.delete(`${API_URL}/documents/${documentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.status !== 200) throw new Error('Delete failed');
  });
}

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
  console.log('❌ Some tests failed.\n');
  process.exit(1);
} else {
  console.log('✅ All tests passed! Phase 7 complete.\n');
  process.exit(0);
}