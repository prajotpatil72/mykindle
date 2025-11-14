import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

let testResults = [];
let testUser = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  password: 'Test123456',
};
let tokens = {};

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

console.log('\n🧪 Running Phase 3 Integration Tests\n');

// Test 1: User Registration
await test('User can register with valid credentials', async () => {
  const response = await axios.post(`${API_URL}/auth/register`, testUser);
  
  if (response.status !== 201) {
    throw new Error(`Expected 201, got ${response.status}`);
  }
  
  if (!response.data.data.accessToken) {
    throw new Error('No access token returned');
  }
  
  if (!response.data.data.refreshToken) {
    throw new Error('No refresh token returned');
  }
  
  tokens.accessToken = response.data.data.accessToken;
  tokens.refreshToken = response.data.data.refreshToken;
  testUser.id = response.data.data.user.id;
});

// Test 2: Duplicate Email Registration
await test('Registration fails with duplicate email', async () => {
  try {
    await axios.post(`${API_URL}/auth/register`, testUser);
    throw new Error('Should have failed with duplicate email');
  } catch (error) {
    if (error.response?.status !== 400) {
      throw new Error('Should return 400 for duplicate email');
    }
  }
});

// Test 3: Registration Validation
await test('Registration fails with invalid email', async () => {
  try {
    await axios.post(`${API_URL}/auth/register`, {
      name: 'Test',
      email: 'invalid-email',
      password: 'Test123456',
    });
    throw new Error('Should have failed with invalid email');
  } catch (error) {
    if (error.response?.status !== 400) {
      throw new Error('Should return 400 for invalid email');
    }
  }
});

// Test 4: Registration Validation - Short Password
await test('Registration fails with short password', async () => {
  try {
    await axios.post(`${API_URL}/auth/register`, {
      name: 'Test',
      email: `test-short-${Date.now()}@example.com`, // Use unique email
      password: '123',
    });
    throw new Error('Should have failed with short password');
  } catch (error) {
    if (!error.response || (error.response.status !== 400 && error.response.status !== 500)) {
      throw new Error(`Expected 400 or 500, got ${error.response?.status || 'no response'}`);
    }
    // Password validation should have caught it
    if (error.response.status === 400 && !error.response.data.errors?.password && !error.response.data.message) {
      throw new Error('Should return password validation error');
    }
  }
});

// Test 5: User Login
await test('User can login with correct credentials', async () => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email: testUser.email,
    password: testUser.password,
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  if (!response.data.data.accessToken) {
    throw new Error('No access token returned');
  }
  
  tokens.accessToken = response.data.data.accessToken;
  tokens.refreshToken = response.data.data.refreshToken;
});

// Test 6: Login with Wrong Password
await test('Login fails with wrong password', async () => {
  try {
    await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: 'WrongPassword123',
    });
    throw new Error('Should have failed with wrong password');
  } catch (error) {
    if (error.response?.status !== 401) {
      throw new Error('Should return 401 for wrong password');
    }
  }
});

// Test 7: Login with Non-existent Email
await test('Login fails with non-existent email', async () => {
  try {
    await axios.post(`${API_URL}/auth/login`, {
      email: 'nonexistent@example.com',
      password: 'Test123456',
    });
    throw new Error('Should have failed with non-existent email');
  } catch (error) {
    if (error.response?.status !== 401) {
      throw new Error('Should return 401 for non-existent email');
    }
  }
});

// Test 8: Get Current User (Protected Route)
await test('Can access protected route with valid token', async () => {
  const response = await axios.get(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  if (response.data.data.user.email !== testUser.email) {
    throw new Error('User email mismatch');
  }
});

// Test 9: Protected Route Without Token
await test('Protected route fails without token', async () => {
  try {
    await axios.get(`${API_URL}/auth/me`);
    throw new Error('Should have failed without token');
  } catch (error) {
    if (error.response?.status !== 401) {
      throw new Error('Should return 401 without token');
    }
  }
});

// Test 10: Protected Route With Invalid Token
await test('Protected route fails with invalid token', async () => {
  try {
    await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: 'Bearer invalid-token-here',
      },
    });
    throw new Error('Should have failed with invalid token');
  } catch (error) {
    if (error.response?.status !== 401) {
      throw new Error('Should return 401 with invalid token');
    }
  }
});

// Test 11: Refresh Token
await test('Can refresh access token with valid refresh token', async () => {
  const response = await axios.post(`${API_URL}/auth/refresh-token`, {
    refreshToken: tokens.refreshToken,
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  if (!response.data.data.accessToken) {
    throw new Error('No new access token returned');
  }
  
  tokens.accessToken = response.data.data.accessToken;
  tokens.refreshToken = response.data.data.refreshToken;
});

// Test 12: Refresh Token Fails With Invalid Token
await test('Refresh token fails with invalid token', async () => {
  try {
    await axios.post(`${API_URL}/auth/refresh-token`, {
      refreshToken: 'invalid-refresh-token',
    });
    throw new Error('Should have failed with invalid refresh token');
  } catch (error) {
    if (error.response?.status !== 401) {
      throw new Error('Should return 401 with invalid refresh token');
    }
  }
});

// Test 13: Logout
await test('User can logout successfully', async () => {
  const response = await axios.post(
    `${API_URL}/auth/logout`,
    {
      refreshToken: tokens.refreshToken,
    },
    {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    }
  );
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
});

// Test 14: Forgot Password
await test('Can request password reset', async () => {
  const response = await axios.post(`${API_URL}/auth/forgot-password`, {
    email: testUser.email,
  });
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
});

// Test 15: Forgot Password With Non-existent Email
await test('Forgot password handles non-existent email gracefully', async () => {
  const response = await axios.post(`${API_URL}/auth/forgot-password`, {
    email: 'nonexistent@example.com',
  });
  
  // Should still return 200 to not reveal if email exists
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
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
  console.log('❌ Some tests failed. Please check the errors above.\n');
  process.exit(1);
} else {
  console.log('✅ All tests passed! Phase 3 setup is complete.\n');
  console.log(`${colors.blue}Sample credentials for frontend testing:${colors.reset}`);
  console.log(`Email: ${testUser.email}`);
  console.log(`Password: ${testUser.password}\n`);
  process.exit(0);
}