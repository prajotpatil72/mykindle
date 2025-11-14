import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

let testResults = [];
let browser;
let page;

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log('\n🧪 Running Phase 4 E2E Tests\n');
console.log(`${colors.blue}Starting browser...${colors.reset}\n`);

try {
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage();

  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'Test123456';
  const testName = 'Test User';

  // Test 1: Landing page loads
  await test('Landing page loads correctly', async () => {
    await page.goto(BASE_URL);
    const title = await page.textContent('h1');
    if (!title.includes('PDF Reader')) {
      throw new Error('Landing page title not found');
    }
  });

  // Test 2: Navigate to register
  await test('Can navigate to register page', async () => {
    await page.click('text=Get Started');
    await page.waitForURL(`${BASE_URL}/register`);
    const heading = await page.textContent('h1');
    if (!heading.includes('Create Account')) {
      throw new Error('Register page not loaded');
    }
  });

  // Test 3: Registration form validation
  await test('Registration form shows validation errors', async () => {
    await page.click('button[type="submit"]');
    await sleep(500);
    const errors = await page.locator('.error-message').count();
    if (errors === 0) {
      throw new Error('No validation errors shown');
    }
  });

  // Test 4: Successful registration
  await test('User can register successfully', async () => {
    await page.fill('input[name="name"]', testName);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/library`, { timeout: 5000 });
  });

  // Test 5: User is logged in and sees library
  await test('User sees library page after registration', async () => {
    const welcomeText = await page.textContent('.user-menu');
    if (!welcomeText.includes('Welcome')) {
      throw new Error('Welcome message not found');
    }
  });

  // Test 6: Logout works
  await test('User can logout', async () => {
    await page.click('text=Logout');
    await page.waitForURL(`${BASE_URL}/login`);
  });

  // Test 7: Navigate to login
  await test('Can navigate to login page', async () => {
    const heading = await page.textContent('h1');
    if (!heading.includes('Welcome Back')) {
      throw new Error('Login page not loaded');
    }
  });

  // Test 8: Login with wrong credentials
  await test('Login fails with wrong password', async () => {
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'WrongPassword123');
    await page.click('button[type="submit"]');
    await sleep(1000);
    const errorAlert = await page.locator('.alert-error').count();
    if (errorAlert === 0) {
      throw new Error('No error message shown for wrong password');
    }
  });

  // Test 9: Successful login
  await test('User can login with correct credentials', async () => {
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/library`, { timeout: 5000 });
  });

  // Test 10: Protected route works
  await test('Library page shows user info', async () => {
    const welcomeText = await page.textContent('.user-menu');
    if (!welcomeText.includes(testName)) {
      throw new Error('User name not shown in library');
    }
  });

  // Test 11: Direct navigation to protected route when not logged in
  await test('Protected route redirects to login when not authenticated', async () => {
    await page.click('text=Logout');
    await page.waitForURL(`${BASE_URL}/login`);
    await page.goto(`${BASE_URL}/library`);
    await page.waitForURL(`${BASE_URL}/login`);
  });

  // Test 12: Forgot password page
  await test('Can navigate to forgot password page', async () => {
    await page.click('text=Forgot password?');
    await page.waitForURL(`${BASE_URL}/forgot-password`);
    const heading = await page.textContent('h1');
    if (!heading.includes('Forgot Password')) {
      throw new Error('Forgot password page not loaded');
    }
  });

  // Test 13: Forgot password form works
  await test('Can submit forgot password request', async () => {
    await page.fill('input[name="email"]', testEmail);
    await page.click('button[type="submit"]');
    await sleep(1000);
    const successAlert = await page.locator('.alert-success').count();
    if (successAlert === 0) {
      throw new Error('No success message shown');
    }
  });

  // Test 14: Navigation links work
  await test('Can navigate between auth pages', async () => {
    await page.click('text=Sign In');
    await page.waitForURL(`${BASE_URL}/login`);
    await page.click('text=Sign Up');
    await page.waitForURL(`${BASE_URL}/register`);
  });

  // Test 15: Token persistence
  await test('Login persists after page reload', async () => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/library`);
    
    // Reload page
    await page.reload();
    await sleep(1000);
    
    // Should still be on library page
    const url = page.url();
    if (!url.includes('/library')) {
      throw new Error('User not persisted after reload');
    }
  });

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
    console.log('✅ All tests passed! Phase 4 setup is complete.\n');
    process.exit(0);
  }
} catch (error) {
  console.error('Test suite error:', error);
  process.exit(1);
} finally {
  if (browser) {
    await browser.close();
  }
}