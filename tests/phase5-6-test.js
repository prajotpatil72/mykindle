import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};

let testResults = [];
let accessToken = '';

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

console.log('\n🧪 Running Phase 5 & 6 Tests\n');

// Setup: Create test user and login
const testUser = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  password: 'Test123456',
};

await test('Setup: Register test user', async () => {
  const response = await axios.post(`${API_URL}/auth/register`, testUser);
  accessToken = response.data.data.accessToken;
  if (!accessToken) throw new Error('No access token');
});

// Phase 5 Tests
await test('Can get user profile', async () => {
  const response = await axios.get(`${API_URL}/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status !== 200) throw new Error('Failed to get profile');
  if (!response.data.data.profile) throw new Error('No profile data');
});

await test('Can update profile name', async () => {
  const response = await axios.put(
    `${API_URL}/profile`,
    { name: 'Updated Name' },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (response.status !== 200) throw new Error('Failed to update profile');
  if (response.data.data.profile.name !== 'Updated Name') {
    throw new Error('Name not updated');
  }
});

await test('Can update theme preference', async () => {
  const response = await axios.put(
    `${API_URL}/profile`,
    { preferences: { theme: 'dark' } },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (response.status !== 200) throw new Error('Failed to update theme');
  if (response.data.data.profile.preferences.theme !== 'dark') {
    throw new Error('Theme not updated');
  }
});

await test('Can update default view preference', async () => {
  const response = await axios.put(
    `${API_URL}/profile`,
    { preferences: { defaultView: 'list' } },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (response.status !== 200) throw new Error('Failed to update view');
  if (response.data.data.profile.preferences.defaultView !== 'list') {
    throw new Error('View not updated');
  }
});

await test('Profile update validates theme values', async () => {
  try {
    await axios.put(
      `${API_URL}/profile`,
      { preferences: { theme: 'invalid' } },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    throw new Error('Should have failed with invalid theme');
  } catch (error) {
    if (error.response?.status !== 400) {
      throw new Error('Should return 400 for invalid theme');
    }
  }
});

await test('Can change password', async () => {
  const response = await axios.put(
    `${API_URL}/profile/password`,
    {
      oldPassword: testUser.password,
      newPassword: 'NewPassword123',
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (response.status !== 200) throw new Error('Failed to change password');
  testUser.password = 'NewPassword123';
});

await test('Password change fails with wrong old password', async () => {
  try {
    await axios.put(
      `${API_URL}/profile/password`,
      {
        oldPassword: 'WrongPassword',
        newPassword: 'NewPassword456',
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    throw new Error('Should have failed with wrong password');
  } catch (error) {
    if (error.response?.status !== 401) {
      throw new Error('Should return 401 for wrong password');
    }
  }
});

// Phase 6 Tests - Schema Validation
await test('Document schema exists', async () => {
  const Document = (await import('../server/src/models/Document.js')).default;
  if (!Document) throw new Error('Document model not found');
});

await test('Collection schema exists', async () => {
  const Collection = (await import('../server/src/models/Collection.js')).default;
  if (!Collection) throw new Error('Collection model not found');
});

await test('Tag schema exists', async () => {
  const Tag = (await import('../server/src/models/Tag.js')).default;
  if (!Tag) throw new Error('Tag model not found');
});

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
  console.log('✅ All tests passed! Phase 5 & 6 complete.\n');
  process.exit(0);
}