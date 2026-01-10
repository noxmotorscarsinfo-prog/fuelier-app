# 📋 Plan Detallado de Sistema de Testing - Fuelier App

## 🎯 Objetivo
Crear un sistema de testing completo que verifique todas las funcionalidades de la aplicación Fuelier, incluyendo frontend (React), backend (Supabase Edge Functions), base de datos (PostgreSQL), y flujos end-to-end.

---

## 📦 1. Configuración Inicial del Entorno de Testing

### 1.1 Dependencias Necesarias

```json
{
  "devDependencies": {
    // Testing Framework
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "@vitest/ui": "^1.1.0",
    "vitest": "^1.1.0",
    "jsdom": "^23.0.1",
    
    // E2E Testing
    "@playwright/test": "^1.40.1",
    
    // API Testing
    "supertest": "^6.3.3",
    
    // Code Coverage
    "@vitest/coverage-v8": "^1.1.0",
    
    // Mocking
    "msw": "^2.0.11",
    "vitest-fetch-mock": "^0.2.2",
    
    // Supabase Testing
    "@supabase/supabase-js": "^2.39.0",
    
    // Utilities
    "faker-js": "^1.0.0",
    "@faker-js/faker": "^8.3.1"
  }
}
```

### 1.2 Archivos de Configuración

**vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**playwright.config.ts**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 🧪 2. Categorías de Testing

### 2.1 Unit Tests (Pruebas Unitarias)

#### 2.1.1 Utils - Cálculos de Macros
**Archivo:** `src/utils/__tests__/macroCalculations.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { calculateBMR, calculateTDEE, calculateMacros } from '../macroCalculations';

describe('Macro Calculations', () => {
  describe('calculateBMR', () => {
    it('should calculate BMR for male correctly (Mifflin-St Jeor)', () => {
      const bmr = calculateBMR(80, 180, 30, 'male');
      expect(bmr).toBeCloseTo(1850, 0);
    });

    it('should calculate BMR for female correctly', () => {
      const bmr = calculateBMR(60, 165, 25, 'female');
      expect(bmr).toBeCloseTo(1350, 0);
    });

    it('should handle edge cases (min/max weight)', () => {
      const bmrMin = calculateBMR(20, 150, 18, 'female');
      const bmrMax = calculateBMR(300, 200, 40, 'male');
      expect(bmrMin).toBeGreaterThan(0);
      expect(bmrMax).toBeGreaterThan(0);
    });
  });

  describe('calculateTDEE', () => {
    it('should apply correct activity multiplier', () => {
      const bmr = 1800;
      const tdee = calculateTDEE(bmr, 3, 'moderate');
      expect(tdee).toBeGreaterThan(bmr);
    });
  });

  describe('calculateMacros', () => {
    it('should distribute macros correctly for weight loss', () => {
      const macros = calculateMacros(2000, 'moderate_loss', 80);
      expect(macros.calories).toBe(2000);
      expect(macros.protein + macros.carbs + macros.fat).toBeCloseTo(2000 / 4, 50);
    });

    it('should prioritize protein for muscle gain', () => {
      const macros = calculateMacros(2500, 'moderate_gain', 80);
      expect(macros.protein).toBeGreaterThanOrEqual(80 * 1.8);
    });
  });
});
```

#### 2.1.2 Utils - Sistema Adaptativo
**Archivo:** `src/utils/__tests__/adaptiveSystem.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { analyzeProgress, detectMetabolicAdaptation } from '../adaptiveSystem';

describe('Adaptive System', () => {
  it('should detect weight loss plateau', () => {
    const logs = [
      { date: '2024-01-01', weight: 80, isSaved: true },
      { date: '2024-01-08', weight: 80, isSaved: true },
      { date: '2024-01-15', weight: 80.1, isSaved: true },
      { date: '2024-01-22', weight: 79.9, isSaved: true },
    ];
    
    const adaptation = detectMetabolicAdaptation(logs as any, 'moderate_loss');
    expect(adaptation).toBe(true);
  });

  it('should recommend calorie adjustment', () => {
    const analysis = analyzeProgress(mockLogs, mockUser);
    expect(analysis.recommendation).toBeDefined();
    expect(analysis.adjustmentNeeded).toBe(true);
  });
});
```

#### 2.1.3 Utils - Intelligent Meal Scaling
**Archivo:** `src/utils/__tests__/intelligentMealScaling.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { scaleToExactTarget } from '../intelligentMealScaling';

describe('Intelligent Meal Scaling', () => {
  it('should scale meal to exact target macros', () => {
    const meal = {
      id: '1',
      name: 'Test Meal',
      type: 'breakfast',
      calories: 500,
      protein: 30,
      carbs: 50,
      fat: 15,
      ingredients: []
    };

    const target = { calories: 600, protein: 36, carbs: 60, fat: 18 };
    const scaled = scaleToExactTarget(meal, target);

    expect(scaled.calories).toBeCloseTo(600, 1);
    expect(scaled.protein).toBeCloseTo(36, 1);
  });

  it('should handle zero values gracefully', () => {
    const meal = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const result = scaleToExactTarget(meal as any, { calories: 500, protein: 30, carbs: 50, fat: 15 });
    expect(result).toBeDefined();
  });
});
```

### 2.2 Integration Tests (Pruebas de Integración)

#### 2.2.1 API Integration
**Archivo:** `src/tests/integration/api.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as api from '../../app/utils/api';
import { createClient } from '@supabase/supabase-js';

describe('API Integration Tests', () => {
  let testUser: any;
  let supabase: any;

  beforeAll(async () => {
    // Setup: Crear usuario de prueba
    supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_SERVICE_KEY
    );

    testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test User'
    };
  });

  afterAll(async () => {
    // Cleanup: Eliminar usuario de prueba
    if (testUser.id) {
      await supabase.auth.admin.deleteUser(testUser.id);
    }
  });

  describe('Authentication', () => {
    it('should sign up a new user', async () => {
      const result = await api.signUp(
        testUser.email,
        testUser.password,
        testUser.name
      );
      expect(result.success).toBe(true);
      expect(result.user?.id).toBeDefined();
      testUser.id = result.user?.id;
    });

    it('should prevent duplicate signups', async () => {
      const result = await api.signUp(
        testUser.email,
        testUser.password,
        testUser.name
      );
      expect(result.error).toContain('already registered');
    });

    it('should sign in with correct credentials', async () => {
      const result = await api.signIn(testUser.email, testUser.password);
      expect(result.success).toBe(true);
      expect(result.access_token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const result = await api.signIn(testUser.email, 'WrongPassword');
      expect(result.success).toBe(false);
    });
  });

  describe('User Profile', () => {
    it('should save user profile', async () => {
      const userData = {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        sex: 'male',
        age: 30,
        weight: 80,
        height: 180,
        // ... resto de campos
      };

      const success = await api.saveUser(userData as any);
      expect(success).toBe(true);
    });

    it('should retrieve user profile', async () => {
      const user = await api.getUser(testUser.email);
      expect(user).toBeDefined();
      expect(user?.email).toBe(testUser.email);
      expect(user?.id).toBe(testUser.id);
    });
  });

  describe('Daily Logs', () => {
    it('should save daily logs', async () => {
      const logs = [{
        date: '2024-01-01',
        breakfast: null,
        lunch: null,
        snack: null,
        dinner: null,
        extraFoods: [],
        complementaryMeals: [],
        isSaved: true,
        weight: 80
      }];

      const success = await api.saveDailyLogs(testUser.email, logs);
      expect(success).toBe(true);
    });

    it('should retrieve daily logs', async () => {
      const logs = await api.getDailyLogs(testUser.email);
      expect(logs).toBeDefined();
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should handle concurrent saves (race condition)', async () => {
      const promises = Array(10).fill(null).map((_, i) => 
        api.saveDailyLogs(testUser.email, [{
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          isSaved: true
        }] as any)
      );

      const results = await Promise.all(promises);
      expect(results.every(r => r === true)).toBe(true);
    });
  });
});
```

#### 2.2.2 Database Constraints
**Archivo:** `src/tests/integration/database.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Database Constraints & RLS', () => {
  let supabase: any;

  beforeAll(() => {
    supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_SERVICE_KEY
    );
  });

  it('should enforce NOT NULL constraint on users.id', async () => {
    const { error } = await supabase.from('users').insert({
      email: 'test@test.com',
      name: 'Test',
      // id is missing
    });

    expect(error).toBeDefined();
    expect(error.message).toContain('null value');
  });

  it('should enforce UNIQUE constraint on users.email', async () => {
    const email = `unique-test-${Date.now()}@example.com`;
    
    await supabase.from('users').insert({
      id: crypto.randomUUID(),
      email,
      name: 'Test'
    });

    const { error } = await supabase.from('users').insert({
      id: crypto.randomUUID(),
      email, // duplicate
      name: 'Test 2'
    });

    expect(error).toBeDefined();
    expect(error.message).toContain('duplicate');
  });

  it('should enforce UNIQUE constraint on daily_logs (user_id, date)', async () => {
    const userId = crypto.randomUUID();
    const date = '2024-01-01';

    await supabase.from('daily_logs').insert({
      user_id: userId,
      date,
      is_saved: false
    });

    const { error } = await supabase.from('daily_logs').insert({
      user_id: userId,
      date, // duplicate
      is_saved: true
    });

    expect(error).toBeDefined();
  });

  it('should enforce foreign key constraint on daily_logs.user_id', async () => {
    const { error } = await supabase.from('daily_logs').insert({
      user_id: 'non-existent-uuid',
      date: '2024-01-01',
      is_saved: false
    });

    expect(error).toBeDefined();
    expect(error.message).toContain('foreign key');
  });
});
```

### 2.3 Component Tests (Pruebas de Componentes)

#### 2.3.1 Login Component
**Archivo:** `src/app/components/__tests__/LoginAuth.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginAuth from '../LoginAuth';

describe('LoginAuth Component', () => {
  const mockOnLogin = vi.fn();
  const mockOnAdminAccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form', () => {
    render(<LoginAuth onLogin={mockOnLogin} onAdminAccess={mockOnAdminAccess} />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should toggle between login and signup modes', async () => {
    render(<LoginAuth onLogin={mockOnLogin} onAdminAccess={mockOnAdminAccess} />);
    
    const toggleButton = screen.getByText(/don't have an account/i);
    await userEvent.click(toggleButton);
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    render(<LoginAuth onLogin={mockOnLogin} onAdminAccess={mockOnAdminAccess} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitButton);
    
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });

  it('should call onLogin on successful login', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({
      success: true,
      user: { email: 'test@test.com' }
    });
    
    vi.mock('../../utils/api', () => ({ signIn: mockSignIn }));
    
    render(<LoginAuth onLogin={mockOnLogin} onAdminAccess={mockOnAdminAccess} />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith('test@test.com');
    });
  });
});
```

#### 2.3.2 Dashboard Component
**Archivo:** `src/app/components/__tests__/Dashboard.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../Dashboard';

describe('Dashboard Component', () => {
  const mockUser = {
    email: 'test@test.com',
    name: 'Test User',
    goals: { calories: 2000, protein: 150, carbs: 200, fat: 65 }
  };

  const mockCurrentLog = {
    date: '2024-01-01',
    breakfast: null,
    lunch: null,
    snack: null,
    dinner: null,
    extraFoods: [],
    isSaved: false
  };

  it('should display user name and goals', () => {
    render(
      <Dashboard 
        user={mockUser as any}
        currentLog={mockCurrentLog as any}
        onSelectMealType={vi.fn()}
        onOpenCalendar={vi.fn()}
        onOpenSettings={vi.fn()}
        onSaveDay={vi.fn()}
        onAddExtraFood={vi.fn()}
      />
    );

    expect(screen.getByText(/test user/i)).toBeInTheDocument();
    expect(screen.getByText(/2000/)).toBeInTheDocument(); // calories
  });

  it('should show progress bars for macros', () => {
    render(<Dashboard {...defaultProps} />);
    
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBe(4); // calories, protein, carbs, fat
  });

  it('should enable save button when day has meals', () => {
    const logWithMeals = {
      ...mockCurrentLog,
      breakfast: { id: '1', name: 'Meal', calories: 500 }
    };

    render(<Dashboard {...defaultProps} currentLog={logWithMeals as any} />);
    
    const saveButton = screen.getByRole('button', { name: /save day/i });
    expect(saveButton).not.toBeDisabled();
  });
});
```

### 2.4 End-to-End Tests (Pruebas E2E con Playwright)

#### 2.4.1 User Flow Completo
**Archivo:** `e2e/user-journey.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Complete User Journey', () => {
  const testEmail = `e2e-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  test('should complete full onboarding and create first meal plan', async ({ page }) => {
    // 1. Signup
    await page.goto('/');
    await page.click('text=Sign Up');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="name"]', 'E2E Test User');
    await page.click('button:has-text("Create Account")');

    // 2. Onboarding - Sex
    await expect(page.locator('text=What is your biological sex?')).toBeVisible();
    await page.click('button:has-text("Male")');

    // 3. Onboarding - Age
    await expect(page.locator('text=How old are you?')).toBeVisible();
    await page.fill('input[type="number"]', '30');
    await page.click('button:has-text("Continue")');

    // 4. Onboarding - Weight
    await page.fill('input[placeholder*="weight"]', '80');
    await page.click('button:has-text("Continue")');

    // 5. Onboarding - Height
    await page.fill('input[placeholder*="height"]', '180');
    await page.click('button:has-text("Continue")');

    // 6. Onboarding - Activity
    await page.click('button:has-text("Moderate")');
    await page.click('button:has-text("Continue")');

    // 7. Goals Summary - Verify macro calculation
    await expect(page.locator('text=Your Daily Targets')).toBeVisible();
    await expect(page.locator('text=/\\d+ kcal/')).toBeVisible();
    await page.click('button:has-text("Continue")');

    // 8. Meal Distribution
    await page.click('button:has-text("4 meals")');
    await page.click('button:has-text("Continue")');

    // 9. Food Preferences
    await page.click('button:has-text("Continue")'); // Skip preferences

    // 10. Dashboard - Verify arrival
    await expect(page.locator('text=Welcome')).toBeVisible();
    await expect(page.locator('text=E2E Test User')).toBeVisible();

    // 11. Select Breakfast
    await page.click('button:has-text("Breakfast")');
    await expect(page.locator('text=Choose your breakfast')).toBeVisible();

    // 12. Select a meal
    await page.click('.meal-card >> nth=0');
    await expect(page.locator('text=Confirm Selection')).toBeVisible();
    await page.click('button:has-text("Confirm")');

    // 13. Verify meal appears in dashboard
    await expect(page.locator('.meal-selected')).toBeVisible();

    // 14. Complete all meals
    await page.click('button:has-text("Lunch")');
    await page.click('.meal-card >> nth=0');
    await page.click('button:has-text("Confirm")');

    await page.click('button:has-text("Snack")');
    await page.click('.meal-card >> nth=0');
    await page.click('button:has-text("Confirm")');

    await page.click('button:has-text("Dinner")');
    await page.click('.meal-card >> nth=0');
    await page.click('button:has-text("Confirm")');

    // 15. Save day
    await page.click('button:has-text("Save Day")');
    await expect(page.locator('text=Day Completed')).toBeVisible();

    // 16. Verify in calendar
    await page.click('button:has-text("Close")');
    await page.click('button[aria-label="Open Calendar"]');
    await expect(page.locator('.calendar-day-saved')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Try to login with invalid credentials
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');

    // Verify error message
    await expect(page.locator('text=/invalid credentials/i')).toBeVisible();
  });
});
```

#### 2.4.2 Performance Tests
**Archivo:** `e2e/performance.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load dashboard within 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    // Login steps...
    await page.waitForSelector('text=Welcome');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });

  test('should handle 100 daily logs without lag', async ({ page, context }) => {
    // Generate 100 logs via API
    // ...
    
    await page.goto('/calendar');
    
    // Measure time to render
    const startTime = Date.now();
    await page.waitForSelector('.calendar-grid');
    const renderTime = Date.now() - startTime;
    
    expect(renderTime).toBeLessThan(500);
  });
});
```

---

## 🔍 3. Testing de Edge Functions (Supabase)

### 3.1 Edge Function Unit Tests
**Archivo:** `supabase/functions/make-server-b0e879f0/tests/index.test.ts`

```typescript
import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import app from "../index.ts";

Deno.test("GET /health should return OK", async () => {
  const request = new Request("http://localhost/make-server-b0e879f0/health");
  const response = await app.fetch(request);
  
  assertEquals(response.status, 200);
  const data = await response.json();
  assertEquals(data.status, "ok");
});

Deno.test("POST /auth/signup should create user", async () => {
  const body = {
    email: `test-${Date.now()}@example.com`,
    password: "TestPassword123!",
    name: "Test User"
  };

  const request = new Request("http://localhost/make-server-b0e879f0/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const response = await app.fetch(request);
  assertEquals(response.status, 200);
  
  const data = await response.json();
  assertExists(data.user.id);
  assertExists(data.access_token);
});

Deno.test("POST /daily-logs should save logs", async () => {
  // ... test implementation
});
```

---

## 📊 4. Estructura de Directorios de Testing

```
fuelier/
├── src/
│   ├── tests/
│   │   ├── setup.ts                    # Configuración global de tests
│   │   ├── mocks/
│   │   │   ├── handlers.ts             # MSW handlers
│   │   │   ├── mockData.ts             # Datos de prueba
│   │   │   └── supabaseMock.ts         # Mock de Supabase client
│   │   ├── integration/
│   │   │   ├── api.test.ts
│   │   │   ├── database.test.ts
│   │   │   └── auth.test.ts
│   │   └── utils/
│   │       └── testHelpers.ts
│   ├── app/
│   │   ├── components/
│   │   │   └── __tests__/              # Tests de componentes
│   │   │       ├── LoginAuth.test.tsx
│   │   │       ├── Dashboard.test.tsx
│   │   │       ├── MealSelection.test.tsx
│   │   │       └── CalendarView.test.tsx
│   │   └── utils/
│   │       └── __tests__/              # Tests de utilidades
│   │           ├── macroCalculations.test.ts
│   │           ├── adaptiveSystem.test.ts
│   │           └── intelligentMealScaling.test.ts
├── e2e/
│   ├── user-journey.spec.ts
│   ├── admin-panel.spec.ts
│   ├── performance.spec.ts
│   └── fixtures/
│       └── testData.ts
├── supabase/
│   └── functions/
│       └── make-server-b0e879f0/
│           └── tests/
│               ├── index.test.ts
│               ├── auth.test.ts
│               └── dailyLogs.test.ts
└── coverage/                           # Reportes de cobertura
```

---

## 🎯 5. Plan de Ejecución por Fases

### Fase 1: Setup (1-2 días)
- [ ] Instalar dependencias de testing
- [ ] Configurar Vitest y Playwright
- [ ] Crear archivos de configuración
- [ ] Setup de MSW para mocking
- [ ] Crear helpers y utilities de testing

### Fase 2: Unit Tests (3-4 días)
- [ ] Tests de cálculos de macros
- [ ] Tests de sistema adaptativo
- [ ] Tests de scaling de comidas
- [ ] Tests de utilidades varias
- [ ] Objetivo: 80%+ cobertura en utils/

### Fase 3: Component Tests (4-5 días)
- [ ] Tests de componentes de onboarding (7 componentes)
- [ ] Tests de Dashboard y MealSelection
- [ ] Tests de CalendarView
- [ ] Tests de Settings y componentes de admin
- [ ] Objetivo: 70%+ cobertura en componentes críticos

### Fase 4: Integration Tests (3-4 días)
- [ ] Tests de API (auth, user, logs, diets)
- [ ] Tests de constraints de BD
- [ ] Tests de RLS policies
- [ ] Tests de edge functions
- [ ] Objetivo: Validar todos los endpoints

### Fase 5: E2E Tests (3-4 días)
- [ ] User journey completo (signup → onboarding → dashboard → save day)
- [ ] Admin panel flows
- [ ] Error handling scenarios
- [ ] Performance benchmarks
- [ ] Objetivo: Cubrir 5+ user flows críticos

### Fase 6: CI/CD Integration (1-2 días)
- [ ] GitHub Actions workflow
- [ ] Pre-commit hooks con tests
- [ ] Coverage reports en PRs
- [ ] Automated testing en deploy

---

## 🚀 6. Scripts NPM

Agregar a `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:all": "npm run test:run && npm run test:e2e",
    "test:watch": "vitest --watch"
  }
}
```

---

## 📈 7. Métricas de Éxito

### Coverage Goals
- **Utils:** 85%+ cobertura
- **Components:** 70%+ cobertura
- **API/Integration:** 90%+ cobertura
- **E2E:** 5+ flujos críticos cubiertos

### Performance Targets
- Dashboard load: < 2s
- Meal selection render: < 300ms
- Calendar with 365 days: < 500ms
- API response time: < 200ms

### Test Execution Time
- Unit tests: < 30s
- Integration tests: < 2min
- E2E tests: < 5min
- Total suite: < 8min

---

## 🔧 8. Casos de Test Críticos Prioritarios

### 8.1 CRÍTICO - User ID Bug (Ya corregido, necesita test)
```typescript
test('should include user.id from Supabase Auth in signup', async () => {
  const result = await api.signUp(email, password, name);
  expect(result.user.id).toBeDefined();
  expect(result.user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/); // UUID format
});

test('should save user.id to users table', async () => {
  await api.signUp(email, password, name);
  const user = await api.getUser(email);
  expect(user.id).toBeDefined();
});
```

### 8.2 CRÍTICO - Daily Logs Persistence
```typescript
test('should persist daily logs to database', async () => {
  const logs = [{ date: '2024-01-01', isSaved: true, /* ... */ }];
  await api.saveDailyLogs(email, logs);
  
  // Verificar en DB directamente
  const { data } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', '2024-01-01');
  
  expect(data).toHaveLength(1);
  expect(data[0].is_saved).toBe(true);
});
```

### 8.3 Adaptive System Edge Cases
```typescript
test('should not adjust macros too frequently', async () => {
  // Test que el sistema no ajusta si ya ajustó hace menos de 7 días
});

test('should detect plateau correctly', async () => {
  // 4 semanas sin cambio de peso = plateau
});
```

---

## 🎓 9. Recursos y Documentación

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Docs](https://playwright.dev/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/getting-started/local-development)
- [MSW (API Mocking)](https://mswjs.io/)

---

## ✅ 10. Checklist Final

- [ ] Todos los tests pasan localmente
- [ ] Coverage > 70% global
- [ ] E2E tests cubren flujos críticos
- [ ] CI/CD configurado
- [ ] Tests ejecutan en < 8min
- [ ] Documentación de testing completa
- [ ] Mock data creado
- [ ] Performance benchmarks establecidos

---

**Estimación Total:** 15-20 días de trabajo
**Prioridad:** Alta (Esencial antes de escalar la aplicación)
