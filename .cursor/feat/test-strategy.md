## 🎯 Functional Test Suite Strategy

### Current State Analysis
Your codebase has:
- **API Package**: Express server with `/assets` and `/balances` endpoints
- **Web App**: Next.js app with a swap interface using various hooks and components
- **Existing Testing**: Only unit tests for API (Jest), no E2E tests
- **Manual Process**: You test UI manually after functional changes

### Recommended Testing Architecture

#### 1. **API Testing Layer** (Priority: High)
```typescript
// packages/api/__tests__/e2e/api.e2e.test.ts
```
- **Tool**: Jest + Supertest
- **Coverage**:
  - Health check endpoints
  - Asset listing (`GET /api/v1/assets`)
  - Route finding (`POST /api/v1/assets/find-route`)
  - Balance checking endpoints
  - Connection status monitoring
  - Error scenarios (503 when service initializing)

#### 2. **UI Component Testing** (Priority: Medium)
```typescript
// apps/web/src/__tests__/components/
```
- **Tool**: Jest + React Testing Library
- **Coverage**:
  - SwapField component interactions
  - Token selection dialogs
  - Balance display and updates
  - Error state handling
  - Loading states

#### 3. **End-to-End Testing** (Priority: High)
For E2E testing, I recommend **Playwright** over Browser MCP because:

**Playwright Advantages**:
- Production-ready and battle-tested
- Better debugging capabilities
- CI/CD friendly
- Cross-browser testing
- Network interception for API mocking
- Visual regression testing
- Parallel test execution

**Browser MCP Limitations**:
- Requires MCP server setup
- Less mature for production testing
- Limited to browser automation via AI
- Not ideal for CI/CD pipelines

### Proposed Test Structure

```
swush-me-app/
├── packages/
│   └── api/
│       └── __tests__/
│           ├── unit/           # Existing unit tests
│           └── e2e/            # New E2E API tests
│               ├── setup.ts
│               ├── api.e2e.test.ts
│               └── scenarios/
├── apps/
│   └── web/
│       └── __tests__/
│           ├── components/     # Component tests
│           └── e2e/           # UI E2E tests
└── e2e/                       # Full stack E2E tests
    ├── playwright.config.ts
    ├── tests/
    │   ├── swap-flow.spec.ts
    │   ├── wallet-connection.spec.ts
    │   └── error-handling.spec.ts
    └── fixtures/
```

### Implementation Plan

#### Phase 1: API Testing (Week 1)
```bash
# Install dependencies
pnpm add -D supertest @types/supertest
```

Create API test suite:
```typescript
// packages/api/__tests__/e2e/api.e2e.test.ts
import request from 'supertest';
import { app } from '../../src/server';

describe('API E2E Tests', () => {
  describe('Assets Endpoints', () => {
    test('GET /api/v1/assets returns asset list', async () => {
      const response = await request(app)
        .get('/api/v1/assets')
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /api/v1/assets/find-route finds valid routes', async () => {
      const response = await request(app)
        .post('/api/v1/assets/find-route')
        .send({
          fromAsset: { id: 'dot' },
          toAsset: { id: 'usdt' },
          amountIn: '100'
        })
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('route');
    });
  });
});
```

#### Phase 2: E2E Testing with Playwright (Week 2)
```bash
# Install Playwright
pnpm create playwright
```

Create E2E test:
```typescript
// e2e/tests/swap-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Swap Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('complete swap flow', async ({ page }) => {
    // Connect wallet
    await page.click('text=Connect Wallet');
    await page.click('text=Talisman'); // or your wallet

    // Select tokens
    await page.click('[data-testid="input-token-select"]');
    await page.click('text=DOT');
    
    await page.click('[data-testid="output-token-select"]');
    await page.click('text=USDT');

    // Enter amount
    await page.fill('[data-testid="input-amount"]', '10');

    // Wait for route calculation
    await expect(page.locator('[data-testid="output-amount"]')).not.toBeEmpty();

    // Execute swap
    await page.click('text=Swap');
    await page.click('text=Confirm Swap');

    // Verify success
    await expect(page.locator('text=Swap successful')).toBeVisible();
  });
});
```

#### Phase 3: Continuous Testing Setup (Week 3)

**package.json scripts**:
```json
{
  "scripts": {
    "test:api": "pnpm --filter @swush/api test",
    "test:api:e2e": "pnpm --filter @swush/api test:e2e",
    "test:ui": "pnpm --filter @swush/web test",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "pnpm run test:api && pnpm run test:ui && pnpm run test:e2e"
  }
}
```

**GitHub Actions CI**:
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run API tests
        run: pnpm test:api:e2e
      
      - name: Start services
        run: |
          pnpm run dev &
          npx wait-on http://localhost:3000
      
      - name: Run E2E tests
        run: pnpm test:e2e
```

### Test Scenarios to Cover

1. **Happy Path**:
   - Connect wallet → Select tokens → Enter amount → View route → Execute swap → Verify success

2. **Error Scenarios**:
   - Insufficient balance
   - Network disconnection
   - API timeout
   - Invalid token pairs
   - Slippage exceeded

3. **Edge Cases**:
   - Very small amounts
   - Very large amounts
   - Rapid token switching
   - Multiple tabs/windows

### Monitoring & Reporting

1. **Test Reports**:
   ```typescript
   // playwright.config.ts
   export default defineConfig({
     reporter: [
       ['html', { open: 'never' }],
       ['json', { outputFile: 'test-results.json' }],
       ['junit', { outputFile: 'junit.xml' }]
     ],
   });
   ```

2. **Visual Regression**:
   ```typescript
   await expect(page).toHaveScreenshot('swap-interface.png');
   ```

3. **Performance Metrics**:
   ```typescript
   const metrics = await page.evaluate(() => performance.getEntriesByType('navigation'));
   expect(metrics[0].loadEventEnd).toBeLessThan(3000);
   ```

### Quick Start Commands

```bash
# 1. Set up Playwright
pnpm create playwright

# 2. Add test IDs to your components
# In your React components, add data-testid attributes

# 3. Create your first E2E test
mkdir -p e2e/tests
touch e2e/tests/swap-flow.spec.ts

# 4. Run tests
pnpm exec playwright test

# 5. Debug tests visually
pnpm exec playwright test --ui
```

### Why This Approach?

1. **Separation of Concerns**: API tests ensure backend stability, UI tests ensure frontend works
2. **Fast Feedback**: Component tests run quickly during development
3. **Confidence**: E2E tests verify the full user journey
4. **Maintainable**: Clear structure and good tooling support
5. **CI/CD Ready**: All tests can run in automated pipelines
