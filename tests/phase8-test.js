import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

let testResults = [];
let accessToken = '';
let documentIds = [];

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

console.log('\n🧪 Running Phase 8 Tests\n');
console.log(`${colors.blue}Setting up test user...${colors.reset}\n`);

// Setup: Create a unique test user
const testUser = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  password: 'Test123456',
};

await test('Setup: Register test user', async () => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, testUser);
    accessToken = response.data.data.accessToken;
    
    if (!accessToken) {
      throw new Error('No access token received from registration');
    }
  } catch (error) {
    // If registration fails, try to login
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    accessToken = loginResponse.data.data.accessToken;
    
    if (!accessToken) {
      throw new Error('No access token received');
    }
  }
});

// Verify token works
await test('Setup: Verify authentication', async () => {
  const response = await axios.get(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status !== 200) throw new Error('Auth verification failed');
});

// Test pagination
await test('Can get documents with pagination', async () => {
  const response = await axios.get(`${API_URL}/documents`, {
    params: { page: 1, limit: 10 },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status !== 200) throw new Error('Failed');
  if (!response.data.data.currentPage) throw new Error('No pagination data');
});

// Test search
await test('Can search documents by name', async () => {
  const response = await axios.get(`${API_URL}/documents`, {
    params: { search: 'test' },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status !== 200) throw new Error('Search failed');
});

// Test sorting
await test('Can sort documents by name', async () => {
  const response = await axios.get(`${API_URL}/documents`, {
    params: { sort: 'originalName' },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status !== 200) throw new Error('Sort failed');
});

// Test sorting by creation date
await test('Can sort documents by date', async () => {
  const response = await axios.get(`${API_URL}/documents`, {
    params: { sort: '-createdAt' },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status !== 200) throw new Error('Sort by date failed');
});

// Test sorting by file size
await test('Can sort documents by file size', async () => {
  const response = await axios.get(`${API_URL}/documents`, {
    params: { sort: '-fileSize' },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status !== 200) throw new Error('Sort by size failed');
});

// Test filtering by date
await test('Can filter documents by date range', async () => {
  const dateFrom = new Date('2024-01-01').toISOString();
  const response = await axios.get(`${API_URL}/documents`, {
    params: { dateFrom },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status !== 200) throw new Error('Date filter failed');
});

// Test filtering by size
await test('Can filter documents by file size', async () => {
  const response = await axios.get(`${API_URL}/documents`, {
    params: { minSize: 1000, maxSize: 10000000 },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status !== 200) throw new Error('Size filter failed');
});

// Test recent documents
await test('Can get recently opened documents', async () => {
  const response = await axios.get(`${API_URL}/documents/recent`, {
    params: { limit: 5 },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status !== 200) throw new Error('Get recent failed');
});

// Test enhanced stats
await test('Can get enhanced statistics', async () => {
  const response = await axios.get(`${API_URL}/documents/stats`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status !== 200) throw new Error('Get stats failed');
  const stats = response.data.data.stats;
  if (stats.totalDocuments === undefined) {
    throw new Error('Missing stats data');
  }
});

// Test text search endpoint
await test('Can use text search endpoint', async () => {
  const response = await axios.get(`${API_URL}/documents/search`, {
    params: { q: 'test', limit: 5 },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status !== 200) throw new Error('Text search failed');
});

// Test bulk operations validation
await test('Bulk delete validates input', async () => {
  try {
    await axios.post(
      `${API_URL}/documents/bulk-delete`,
      { documentIds: [] },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    throw new Error('Should have failed with empty array');
  } catch (error) {
    if (error.response?.status !== 400) {
      throw new Error('Should return 400 for empty array');
    }
  }
});

await test('Bulk update validates input', async () => {
  try {
    await axios.post(
      `${API_URL}/documents/bulk-update`,
      { documentIds: ['invalid'], updates: {} },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    throw new Error('Should have failed with empty updates');
  } catch (error) {
    if (error.response?.status !== 400) {
      throw new Error('Should return 400 for empty updates');
    }
  }
});

// Check if we have any documents to test bulk operations
const docsResponse = await axios.get(`${API_URL}/documents`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});

if (docsResponse.data.data.documents.length > 0) {
  documentIds = docsResponse.data.data.documents
    .slice(0, 2)
    .map((d) => d._id);

  await test('Can bulk update documents', async () => {
    const response = await axios.post(
      `${API_URL}/documents/bulk-update`,
      {
        documentIds,
        updates: { tags: ['test', 'bulk'] },
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (response.status !== 200) throw new Error('Bulk update failed');
  });

  await test('Can bulk move documents', async () => {
    const response = await axios.post(
      `${API_URL}/documents/bulk-move`,
      {
        documentIds,
        collectionId: null,
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (response.status !== 200) throw new Error('Bulk move failed');
  });
} else {
  console.log(`${colors.blue}ℹ${colors.reset} No documents found, skipping bulk operation tests`);
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
  console.log('✅ All tests passed! Phase 8 complete.\n');
  process.exit(0);
}