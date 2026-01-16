import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// ==========================================
// RATE LIMITING
// ==========================================
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuración de rate limiting
const RATE_LIMIT_CONFIG = {
  // Endpoints de autenticación (más restrictivos)
  auth: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 requests por minuto
  // Endpoints generales
  general: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests por minuto
  // Endpoints de escritura
  write: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 requests por minuto
};

function getClientIP(c: any): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() 
    || c.req.header('x-real-ip') 
    || 'unknown';
}

function isRateLimited(key: string, config: { maxRequests: number; windowMs: number }): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return false;
  }
  
  if (entry.count >= config.maxRequests) {
    return true;
  }
  
  entry.count++;
  return false;
}

// Middleware de rate limiting
function rateLimitMiddleware(type: 'auth' | 'general' | 'write') {
  return async (c: any, next: any) => {
    const ip = getClientIP(c);
    const key = `${type}:${ip}`;
    const config = RATE_LIMIT_CONFIG[type];
    
    if (isRateLimited(key, config)) {
      return c.json(
        { 
          error: 'Too many requests', 
          message: 'Por favor, espera un momento antes de intentar de nuevo.',
          retryAfter: Math.ceil(config.windowMs / 1000)
        }, 
        429
      );
    }
    
    await next();
  };
}

// Limpieza periódica del store (cada 5 minutos)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Función para generar UUID v4
function generateUUID(): string {
  return crypto.randomUUID();
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

app.use('*', logger((message) => console.log(`[HONO LOG] ${message}`)));

app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// HEALTH CHECK
const healthHandler = (c: any) => {
  return c.json({ 
    status: "ok", 
    version: "sql-architecture-v4-auth-fixed", 
    timestamp: new Date().toISOString(),
    endpoints: [
      "POST /user",
      "POST /daily-logs",
      "POST /saved-diets",
      "POST /custom-meals",
      "DELETE /custom-meals/{id}", // Added DELETE endpoint
      "GET /global-meals",
      "GET /custom-ingredients"
    ]
  });
};

app.get("/health", healthHandler);
app.get("/make-server-b0e879f0/health", healthHandler);

// Test endpoint sin middleware
app.get("/make-server-b0e879f0/test", (c) => {
  return c.json({ status: "working", message: "Test endpoint without auth" });
});

// Test endpoint para generar token de prueba (temporal)
app.post("/make-server-b0e879f0/test-login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: "Email and password required" }, 400);
    }
    
    // Usar cliente con anon key para hacer login
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await userSupabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error || !data.session) {
      console.log('Login error:', error?.message);
      return c.json({ error: error?.message || "Login failed" }, 401);
    }
    
    return c.json({
      message: "Login successful",
      access_token: data.session.access_token,
      user: {
        id: data.user?.id,
        email: data.user?.email
      },
      expires_at: data.session.expires_at
    });
  } catch (error) {
    console.error('Test login error:', error);
    return c.json({ error: "Login failed", details: String(error) }, 500);
  }
});

// Helper para extraer user ID del JWT token de Supabase Auth
async function getUserIdFromToken(c: any): Promise<string | null> {
  try {
    const authHeader = c.req.header('Authorization');
    console.log(`[AUTH] Authorization header: ${authHeader ? 'PRESENT' : 'MISSING'}`);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`[AUTH] Invalid auth header format`);
      return null;
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log(`[AUTH] Token extracted: ${token.substring(0, 20)}...`);
    
    try {
      // Verificar formato JWT básico
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('[AUTH] Invalid JWT format - must have 3 parts');
        return null;
      }
      
      // Decodificar header para verificar algoritmo
      try {
        const headerBase64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
        const headerJson = decodeURIComponent(
          atob(headerBase64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const header = JSON.parse(headerJson);
        console.log(`[AUTH] Token algorithm: ${header.alg}`);
        
        // Detectar tokens ES256 (OAuth providers) y sugerir re-login
        if (header.alg === 'ES256') {
          console.log('[AUTH] ⚠️  ES256 token detected (OAuth provider)');
          console.log('[AUTH] ⚠️  For best compatibility, please sign out and sign in with email/password');
          console.log('[AUTH] ⚠️  Attempting validation with Supabase Auth...');
        }
        
        // Soportar HS256 (email/password) y ES256 (OAuth)
        if (header.alg !== 'HS256' && header.alg !== 'ES256') {
          console.log(`[AUTH] ❌ Unsupported algorithm: ${header.alg}`);
          console.log('[AUTH] ❌ Only HS256 and ES256 are supported');
          return null;
        }
      } catch (headerError) {
        console.log('[AUTH] Could not decode token header:', headerError);
      }
      
      // ✅ SOLUCIÓN MEJORADA: Validar con Supabase Auth para soportar ambos algoritmos
      // Esto funciona para HS256 (email/password) y ES256 (OAuth)
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: authData, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !authData.user) {
        console.log('[AUTH] ❌ Token validation failed:', authError?.message || 'No user data');
        
        // Intentar decode manual como fallback (solo para HS256)
        try {
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          
          // Verificar expiración
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp < now) {
            const expiredDate = new Date(payload.exp * 1000);
            console.log(`[AUTH] ❌ Token expired at: ${expiredDate.toISOString()}`);
            return null;
          }
          
          if (payload.sub) {
            console.log('[AUTH] ⚠️  Using manual decode fallback for user:', payload.sub);
            return payload.sub;
          }
        } catch (fallbackError) {
          console.log('[AUTH] ❌ Fallback decode also failed:', fallbackError);
        }
        
        return null;
      }
      
      // Validación exitosa
      const userId = authData.user.id;
      console.log(`[AUTH] ✅ Token validated via Supabase Auth`);
      console.log(`[AUTH] ✅ User ID: ${userId}`);
      console.log(`[AUTH] ✅ Email: ${authData.user.email}`);
      
      return userId;
      
    } catch (error) {
      console.log('[AUTH] ❌ Exception during token validation:', error);
      return null;
    }
    
  } catch (error) {
    console.log('[AUTH] ❌ Fatal exception:', error);
    return null;
  }
}

// Helper para obtener ID de usuario por email (busca en tabla users)
async function getUserIdByEmail(supabase: any, email: string): Promise<string | null> {
  console.log(`[DEBUG] getUserIdByEmail("${email}") - Buscando en tabla users...`);
  
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();
  
  if (error) {
    console.log(`[DEBUG] Error buscando email "${email}" en tabla users:`, error.message);
    console.log(`[DEBUG] Código de error:`, error.code);
    
    // Si es PGRST116 (no encontrado), intentar buscar en otros lugares
    if (error.code === 'PGRST116') {
      console.log(`[DEBUG] Email "${email}" NO existe en tabla users`);
      
      // Debug: Listar algunos emails que SÍ existen
      console.log(`[DEBUG] Verificando qué emails SÍ existen en la tabla users...`);
      const { data: existingUsers, error: listError } = await supabase
        .from('users')
        .select('email')
        .limit(10);
        
      if (!listError && existingUsers) {
        console.log(`[DEBUG] Emails existentes en users:`, existingUsers.map(u => u.email));
      }
    }
    return null;
  }
  
  if (!data) {
    console.log(`[DEBUG] No se encontró data para email "${email}"`);
    return null;
  }
  
  console.log(`[DEBUG] ✅ Email "${email}" encontrado con ID: ${data.id}`);
  return data.id;
}

const basePath = "/make-server-b0e879f0";
const authBasePath = `${basePath}/auth`;

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

// Middleware para verificar autenticación
async function authMiddleware(c: any, next: any) {
  try {
    // Skip auth check for health endpoints
    const path = c.req.path;
    console.log(`[AUTH] Checking path: ${path}`);
    
    if (path === '/health' || path === '/make-server-b0e879f0/health' || path.includes('/health')) {
      console.log(`[AUTH] Skipping auth for health endpoint: ${path}`);
      await next();
      return;
    }
    
    const userId = await getUserIdFromToken(c);
    if (!userId) {
      console.log(`[AUTH] Authentication failed for path: ${path}`);
      return c.json({ error: 'Authentication required', message: 'Invalid or missing token' }, 401);
    }
    
    // Store user ID in context for later use
    c.set('userId', userId);
    console.log(`[AUTH] Authenticated user: ${userId} for path: ${path}`);
    await next();
  } catch (error) {
    console.error(`[AUTH] Authentication error: ${error}`);
    return c.json({ error: 'Authentication failed', message: 'Token validation error' }, 401);
  }
}

// ==========================================
// AUTHENTICATION ROUTES (con rate limiting estricto)
// ==========================================

app.post(`${authBasePath}/signup`, rateLimitMiddleware('auth'), async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;
    
    if (!email || !password || !name) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar duplicados
    const listResult = await supabase.auth.admin.listUsers();
    const existingAuthUser = listResult.data?.users?.find(u => u.email === email);
    
    if (existingAuthUser) {
      const dbResult = await supabase.from('users').select('id').eq('id', existingAuthUser.id).maybeSingle();
      if (dbResult.data) {
        return c.json({ error: "Email already registered", code: "email_exists" }, 409);
      } else {
        await supabase.auth.admin.deleteUser(existingAuthUser.id);
      }
    }
    
    // Crear en Auth
    const createResult = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (createResult.error) {
      const msg = createResult.error.message || "";
      if (msg.includes('password')) return c.json({ error: "Password too weak", code: "weak_password" }, 400);
      return c.json({ error: msg }, 400);
    }

    if (!createResult.data.user) return c.json({ error: "Failed to create user" }, 500);

    // Login test
    const testSupabase = createClient(supabaseUrl, supabaseAnonKey);
    const loginResult = await testSupabase.auth.signInWithPassword({ email, password });
    
    if (!loginResult.data.session) {
      await supabase.auth.admin.deleteUser(createResult.data.user.id);
      return c.json({ error: "Account creation failed", code: "login_test_failed" }, 500);
    }
    
    return c.json({ 
      success: true, 
      access_token: loginResult.data.session.access_token,
      user: {
        id: createResult.data.user.id,
        email: createResult.data.user.email,
        name: name
      }
    });
  } catch (error) {
    return c.json({ error: "Failed to sign up" }, 500);
  }
});

app.post(`${authBasePath}/signin`, rateLimitMiddleware('auth'), async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ error: "Email and password required" }, 400);

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    // MEJORA: Diagnóstico específico para errores de credenciales
    if (error) {
      // Detectar si es error de credenciales inválidas
      if (error.message?.includes('Invalid login') || error.message?.includes('invalid_credentials') || error.status === 400) {
        console.log(`[signin] 🔍 Diagnóstico: Verificando si usuario existe...`);
        const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: allUsers } = await adminSupabase.auth.admin.listUsers();
        const userExists = allUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        
        if (!userExists) {
          console.log(`[signin] ❌ Usuario NO existe: ${email}`);
          return c.json({ 
            error: "Esta cuenta no existe. Por favor, crea una cuenta primero.",
            code: "user_not_found"
          }, 401);
        } else {
          console.log(`[signin] ❌ Usuario existe pero contraseña incorrecta: ${email}`);
          return c.json({ 
            error: "Contraseña incorrecta. Verifica tu contraseña.",
            code: "wrong_password"
          }, 401);
        }
      }
      return c.json({ error: error.message }, 401);
    }
    if (!data.session) return c.json({ error: "Failed to create session" }, 500);

    return c.json({ 
      success: true, 
      access_token: data.session.access_token,
      user: { id: data.user.id, email: data.user.email }
    });
  } catch (error) {
    return c.json({ error: "Failed to sign in" }, 500);
  }
});

// Endpoint para validar credenciales de admin (credenciales en servidor, no en frontend)
app.post(`${authBasePath}/admin-login`, rateLimitMiddleware('auth'), async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ error: "Email and password required" }, 400);

    // Credenciales de admin SOLO en servidor (variables de entorno o hardcoded en backend)
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') ?? 'admin@fuelier.com';
    const ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD') ?? 'Fuelier2025!';

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      console.log(`[admin-login] ❌ Intento fallido de acceso admin: ${email}`);
      return c.json({ error: "Credenciales de administrador incorrectas", code: "invalid_admin" }, 401);
    }

    console.log(`[admin-login] ✅ Acceso admin exitoso: ${email}`);
    return c.json({ 
      success: true, 
      isAdmin: true,
      user: { email: ADMIN_EMAIL, name: 'Administrador' }
    });
  } catch (error) {
    return c.json({ error: "Failed to authenticate admin" }, 500);
  }
});

app.get(`${authBasePath}/session`, async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ error: "No authorization header" }, 401);

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) return c.json({ error: "Invalid token" }, 401);

    return c.json({ success: true, user: { id: data.user.id, email: data.user.email } });
  } catch (error) {
    return c.json({ error: "Failed to get session" }, 500);
  }
});

app.post(`${authBasePath}/signout`, async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ error: "No authorization header" }, 401);

    // El token JWT expira automáticamente - simplemente confirmamos el signout
    // No hay método admin.signOut en el cliente anon, así que retornamos éxito
    // El frontend debe limpiar el token localmente
    console.log('[signout] Token invalidado (expirará automáticamente)');

    return c.json({ success: true });
  } catch (error) {
    console.error('[signout] Error:', error);
    return c.json({ error: "Failed to sign out" }, 500);
  }
});

// ==========================================
// USER ROUTES (Table: users)
// ==========================================

app.get(`${basePath}/user/:email`, async (c) => {
  try {
    const email = c.req.param("email");
    console.log(`[DEBUG] GET /user/${email} - Iniciando consulta...`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log(`[DEBUG] Consultando tabla 'users' para email: ${email}`);
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    
    if (error) {
      console.log(`[DEBUG] Error en consulta users:`, error.code, error.message);
      if (error.code === 'PGRST116') {
        console.log(`[DEBUG] Usuario NO encontrado (PGRST116): ${email}`);
        return c.json({ error: "User not found" }, 404);
      } else {
        console.log(`[DEBUG] Error inesperado:`, error);
        return c.json({ error: "Database error", details: error.message }, 500);
      }
    }
    
    if (!data) {
      console.log(`[DEBUG] Data es null para email: ${email}`);
      return c.json({ error: "User not found" }, 404);
    }
    
    console.log(`[DEBUG] ✅ Usuario encontrado: ${email} -> ID: ${data.id}`);
    const user = {
      id: data.id, // CRÍTICO: Incluir el ID del usuario.
      email: data.email,
      name: data.name,
      sex: data.sex,
      age: data.age,
      birthdate: data.birthdate,
      weight: parseFloat(data.weight),
      height: parseFloat(data.height),
      bodyFatPercentage: data.body_fat_percentage,
      leanBodyMass: data.lean_body_mass,
      trainingFrequency: data.training_frequency,
      trainingIntensity: data.training_intensity,
      trainingType: data.training_type,
      trainingTimePreference: data.training_time_preference,
      lifestyleActivity: data.lifestyle_activity,
      occupation: data.occupation,
      dailySteps: data.daily_steps,
      goal: data.goal,
      mealsPerDay: data.meals_per_day,
      goals: {
        calories: data.target_calories,
        protein: data.target_protein,
        carbs: data.target_carbs,
        fat: data.target_fat
      },
      selectedMacroOption: data.selected_macro_option,
      mealDistribution: data.meal_distribution,
      previousDietHistory: data.previous_diet_history,
      metabolicAdaptation: data.metabolic_adaptation,
      preferences: data.preferences,
      acceptedMealIds: data.accepted_meal_ids || [],
      rejectedMealIds: data.rejected_meal_ids || [],
      favoriteMealIds: data.favorite_meal_ids || [], 
      favoriteIngredientIds: data.favorite_ingredient_ids || [],
      isAdmin: data.is_admin,
      trainingOnboarded: data.training_onboarded || false,
      trainingDays: data.training_days || null
    };
    
    return c.json(user);
  } catch (error) {
    return c.json({ error: "Failed to get user" }, 500);
  }
});

app.post(`${basePath}/user`, rateLimitMiddleware('write'), authMiddleware, async (c) => {
  try {
    const user = await c.req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // CRÍTICO: Obtener ID del usuario de múltiples fuentes (en orden de prioridad)
    // 1. ID enviado directamente en el body
    // 2. ID extraído del JWT token de autenticación
    // 3. ID buscado en la tabla users por email (para usuarios existentes)
    let userId = user.id;
    if (!userId) {
      userId = await getUserIdFromToken(c);
      console.log(`[POST /user] ID from JWT token: ${userId}`);
    }
    if (!userId) {
      userId = await getUserIdByEmail(supabase, user.email);
      console.log(`[POST /user] ID from DB lookup: ${userId}`);
    }
    
    if (!userId) {
      console.error(`[POST /user] ❌ No user ID found for email: ${user.email}`);
      return c.json({ error: "User ID not found. Please re-authenticate." }, 400);
    }
    
    const dbUser = {
      id: userId,
      email: user.email,
      name: user.name,
      sex: user.sex,
      age: user.age,
      birthdate: user.birthdate,
      weight: user.weight,
      height: user.height,
      body_fat_percentage: user.bodyFatPercentage,
      lean_body_mass: user.leanBodyMass,
      training_frequency: user.trainingFrequency,
      training_intensity: user.trainingIntensity,
      training_type: user.trainingType,
      training_time_preference: user.trainingTimePreference,
      lifestyle_activity: user.lifestyleActivity,
      occupation: user.occupation,
      daily_steps: user.dailySteps,
      goal: user.goal,
      meals_per_day: user.mealsPerDay,
      target_calories: user.goals?.calories,
      target_protein: user.goals?.protein,
      target_carbs: user.goals?.carbs,
      target_fat: user.goals?.fat,
      selected_macro_option: user.selectedMacroOption,
      meal_distribution: user.mealDistribution,
      previous_diet_history: user.previousDietHistory,
      metabolic_adaptation: user.metabolicAdaptation,
      preferences: user.preferences,
      accepted_meal_ids: user.acceptedMealIds,
      rejected_meal_ids: user.rejectedMealIds,
      favorite_meal_ids: user.favoriteMealIds,
      favorite_ingredient_ids: user.favoriteIngredientIds,
      is_admin: user.isAdmin,
      training_onboarded: user.trainingOnboarded || false,
      training_days: user.trainingDays || null,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase.from('users').upsert(dbUser, { onConflict: 'email' });
    
    if (error) {
      console.error("DB Error saving user:", error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ success: true, user });
  } catch (error) {
    return c.json({ error: "Failed to save user" }, 500);
  }
});

// ==========================================
// DAILY LOGS ROUTES
// ==========================================

app.get(`${basePath}/daily-logs/:email`, authMiddleware, async (c) => {
  try {
    const email = c.req.param("email");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json([]);

    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    
    // ✅ MAPEAR de snake_case a camelCase para el frontend
    const mappedLogs = (data || []).map((log: any) => ({
      date: log.date,
      breakfast: log.breakfast,
      lunch: log.lunch,
      snack: log.snack,
      dinner: log.dinner,
      extraFoods: log.extra_foods,
      complementaryMeals: log.complementary_meals,
      isSaved: log.is_saved,
      weight: log.weight
    }));
    
    return c.json(mappedLogs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    return c.json([], 200); 
  }
});

app.post(`${basePath}/daily-logs`, rateLimitMiddleware('write'), authMiddleware, async (c) => {
  try {
    const { email, logs } = await c.req.json();
    console.log(`[SERVER] POST /daily-logs for ${email}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) {
      return c.json({ error: "User not found" }, 404);
    }

    const dbLogs = logs.map((log: any) => ({
      user_id: userId,
      date: log.date,
      breakfast: log.breakfast,
      lunch: log.lunch,
      snack: log.snack,
      dinner: log.dinner,
      extra_foods: log.extraFoods,
      complementary_meals: log.complementaryMeals,
      is_saved: log.isSaved,
      weight: log.weight,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('daily_logs')
      .upsert(dbLogs, { onConflict: 'user_id, date' });

    if (error) {
      console.error("DB Error saving logs:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("SERVER ERROR in daily-logs:", error);
    return c.json({ error: "Failed to save logs" }, 500);
  }
});

// ==========================================
// CUSTOM MEALS ROUTES
// ==========================================

app.get(`${basePath}/custom-meals/:email`, authMiddleware, async (c) => {
  try {
    const email = c.req.param("email");
    console.log(`[DEBUG] GET /custom-meals/${email} - Iniciando consulta...`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const userId = await getUserIdByEmail(supabase, email);
    console.log(`[DEBUG] getUserIdByEmail("${email}") = ${userId || 'null'}`);
    
    if (!userId) {
      console.log(`[DEBUG] Usuario no encontrado para email: ${email}`);
      return c.json([]);
    }

    console.log(`[DEBUG] Consultando custom_meals para user_id: ${userId}`);
    const { data, error } = await supabase
      .from('custom_meals')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error(`[DEBUG] Error en consulta custom_meals:`, error);
      throw error;
    }
    
    console.log(`[DEBUG] Encontrados ${data?.length || 0} platos personalizados`);
    if (data && data.length > 0) {
      console.log(`[DEBUG] Platos encontrados:`);
      data.forEach((meal, i) => {
        console.log(`[DEBUG]   ${i + 1}. "${meal.name}" (tipos: ${JSON.stringify(meal.meal_types)})`);
      });
    }
    
    return c.json(data || []);
  } catch (error) {
    console.error(`[DEBUG] Error general en GET /custom-meals:`, error);
    return c.json([], 200);
  }
});

app.post(`${basePath}/custom-meals`, rateLimitMiddleware('write'), authMiddleware, async (c) => {
  try {
    const { email, meals } = await c.req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json({ error: "User not found" }, 404);

    const dbMeals = meals.map((meal: any) => {
      // Normalize type -> meal_types array
      const mealTypes = Array.isArray(meal.type) ? meal.type : (meal.type ? [meal.type] : ['lunch']);

      // Normalize macros (support both meal.calories or meal.macros)
      const calories = Math.round(Number(meal.calories ?? meal.macros?.calories ?? 0));
      const protein = Math.round(Number(meal.protein ?? meal.macros?.protein ?? 0));
      const carbs = Math.round(Number(meal.carbs ?? meal.macros?.carbs ?? 0));
      const fat = Math.round(Number(meal.fat ?? meal.macros?.fat ?? 0));

      // Generar UUID para el id si no es un UUID válido
      const mealId = meal.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(meal.id) 
        ? meal.id 
        : generateUUID();

      return {
        id: mealId,
        user_id: userId,
        name: meal.name || 'Plato sin nombre',
        meal_types: mealTypes,
        variant: meal.variant || null,
        calories,
        protein,
        carbs,
        fat,
        detailed_ingredients: meal.detailedIngredients || meal.detailed_ingredients || meal.ingredientReferences || [],
        base_quantity: Math.round(Number(meal.baseQuantity ?? 100)),
        preparation_steps: meal.preparationSteps || [],
        tips: meal.tips || [],
        is_favorite: meal.isFavorite || false,
        updated_at: new Date().toISOString()
      };
    });

    console.log('[POST /custom-meals] Saving meals:', JSON.stringify(dbMeals));

    const { data, error } = await supabase
      .from('custom_meals')
      .upsert(dbMeals, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('[POST /custom-meals] Supabase error:', error);
      return c.json({ error: error.message, code: error.code }, 500);
    }
    return c.json({ success: true, meals: data });
  } catch (error) {
    console.error('[POST /custom-meals] Error:', error);
    return c.json({ error: "Failed to save custom meals", details: String(error) }, 500);
  }
});

// DELETE endpoint para eliminar custom meals
app.delete(`${basePath}/custom-meals/:id`, authMiddleware, async (c) => {
  try {
    const mealId = c.req.param("id");
    console.log(`[DELETE /custom-meals] Deleting meal with ID: ${mealId}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('custom_meals')
      .delete()
      .eq('id', mealId)
      .select();

    if (error) {
      console.error(`[DELETE /custom-meals] Supabase error:`, error);
      return c.json({ error: error.message, code: error.code }, 500);
    }

    if (!data || data.length === 0) {
      console.log(`[DELETE /custom-meals] No meal found with ID: ${mealId}`);
      return c.json({ error: 'Custom meal not found' }, 404);
    }

    console.log(`[DELETE /custom-meals] Successfully deleted meal: ${mealId}`);
    return c.json({ success: true, deleted: data[0] });
  } catch (error) {
    console.error('[DELETE /custom-meals] Error:', error);
    return c.json({ error: "Failed to delete custom meal", details: String(error) }, 500);
  }
});

// ==========================================
// SAVED DIETS
// ==========================================

app.get(`${basePath}/saved-diets/:email`, authMiddleware, async (c) => {
  try {
    const email = c.req.param("email");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json([]);
    const { data } = await supabase.from('saved_diets').select('*').eq('user_id', userId);
    return c.json(data || []);
  } catch (error) { return c.json([], 200); }
});

app.post(`${basePath}/saved-diets`, rateLimitMiddleware('write'), authMiddleware, async (c) => {
  try {
    const { email, diets } = await c.req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json({ error: "User not found" }, 404);

    const dbDiets = diets.map((diet: any) => ({
      id: diet.id,
      user_id: userId,
      name: diet.name,
      meals: diet.meals,
      macros: diet.macros,
      created_at: diet.createdAt || new Date().toISOString()
    }));
    await supabase.from('saved_diets').upsert(dbDiets, { onConflict: 'id' });
    return c.json({ success: true });
  } catch (error) { return c.json({ error: "Failed" }, 500); }
});

// ==========================================
// FAVORITE MEALS
// ==========================================

app.get(`${basePath}/favorite-meals/:email`, authMiddleware, async (c) => {
  try {
    const email = c.req.param("email");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data } = await supabase.from('users').select('favorite_meal_ids').eq('email', email).single();
    return c.json(data?.favorite_meal_ids || []);
  } catch (error) { return c.json([], 200); }
});

app.post(`${basePath}/favorite-meals`, rateLimitMiddleware('write'), authMiddleware, async (c) => {
  try {
    const { email, favorites } = await c.req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase.from('users').update({ favorite_meal_ids: favorites }).eq('email', email);
    return c.json({ success: true });
  } catch (error) { return c.json({ error: "Failed" }, 500); }
});

// ==========================================
// TRAINING PLAN
// ==========================================

app.get(`${basePath}/training-plan/:email`, authMiddleware, async (c) => {
  try {
    const email = c.req.param("email");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userId = await getUserIdByEmail(supabase, email);
    
    if (!userId) {
      console.log(`[GET /training-plan] User not found for ${email}`);
      return c.json(null);
    }
    
    const { data, error } = await supabase.from('training_plans').select('week_plan').eq('user_id', userId).eq('is_active', true).maybeSingle();
    
    if (error) {
      console.error(`[GET /training-plan] DB Error: ${error.message}`);
    }

    if (!data) {
      console.log(`[GET /training-plan] No plan found for user ${userId}`);
      return c.json(null);
    }

    console.log(`[GET /training-plan] Returning plan with ${data.week_plan?.length || 0} days`);
    return c.json(data.week_plan || null);
  } catch (error) { 
    console.error(`[GET /training-plan] Exception: ${error}`);
    return c.json(null, 200); 
  }
});

app.post(`${basePath}/training-plan`, rateLimitMiddleware('write'), async (c) => {
  try {
    const { email, weekPlan } = await c.req.json();
    console.log(`[POST /training-plan] Recibido para ${email}. Plan size: ${weekPlan?.length}`);
    
    if (!weekPlan || !Array.isArray(weekPlan) || weekPlan.length === 0) {
      console.warn(`[POST /training-plan] ⚠️ Recibido plan vacío o inválido`);
      // Aún así permitimos guardar array vacío si es la intención, pero logueamos
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) {
      console.error(`[POST /training-plan] ❌ Usuario no encontrado para email: ${email}`);
      return c.json({ error: "User not found" }, 404);
    }

    const { error } = await supabase.from('training_plans').upsert({
      user_id: userId,
      week_plan: weekPlan,
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    if (error) {
      console.error(`[POST /training-plan] ❌ Error DB: ${error.message}`);
      throw error;
    }

    console.log(`[POST /training-plan] ✅ Guardado exitoso`);
    return c.json({ success: true });
  } catch (error) { 
    console.error(`[POST /training-plan] 💥 Excepción: ${error}`);
    return c.json({ error: "Failed" }, 500); 
  }
});

// ==========================================
// PLACEHOLDER ROUTES (To avoid 404s in Frontend)
// ==========================================
// Estas rutas devuelven arrays vacíos o success: true para que el frontend
// no explote con 404, aunque la funcionalidad SQL completa aún no esté lista para ellas.

// Global Meals & Ingredients (Admin)
app.get(`${basePath}/global-meals`, async (c) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.from('base_meals').select('*').order('name', { ascending: true });
    if (error) throw error;

    const formatted = (data || []).map((m: any) => {
      // Normalizar ingredientReferences: puede venir como {id, amount} o {ingredientId, amountInGrams}
      let normalizedRefs = undefined;
      if (m.ingredient_references && Array.isArray(m.ingredient_references)) {
        normalizedRefs = m.ingredient_references.map((ref: any) => ({
          ingredientId: ref.ingredientId || ref.id,
          amountInGrams: ref.amountInGrams || ref.amount
        }));
      }
      
      return {
        id: m.id,
        name: m.name,
        type: m.meal_types,
        variant: m.variant,
        calories: Math.round(Number(m.calories)),
        protein: Math.round(Number(m.protein)),
        carbs: Math.round(Number(m.carbs)),
        fat: Math.round(Number(m.fat)),
        baseQuantity: Math.round(Number(m.base_quantity)),
        ingredients: m.ingredients || [],
        ingredientReferences: normalizedRefs,
        preparationSteps: m.preparation_steps || undefined,
        tips: m.tips || undefined
      };
    });

    return c.json(formatted);
  } catch (error) {
    console.error('[GET /global-meals] Error:', error);
    return c.json([], 200);
  }
});

app.post(`${basePath}/global-meals`, rateLimitMiddleware('write'), async (c) => {
  try {
    const { meals } = await c.req.json();
    if (!Array.isArray(meals)) return c.json({ error: 'Invalid payload' }, 400);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const dbMeals = meals.map((meal: any) => {
      // Normalizar ingredientReferences al guardar
      let normalizedRefs = null;
      if (meal.ingredientReferences && Array.isArray(meal.ingredientReferences)) {
        normalizedRefs = meal.ingredientReferences.map((ref: any) => ({
          ingredientId: ref.ingredientId || ref.id,
          amountInGrams: ref.amountInGrams || ref.amount
        }));
      }
      
      return {
        id: meal.id,
        name: meal.name,
        meal_types: Array.isArray(meal.type) ? meal.type : (meal.type ? [meal.type] : []),
        variant: meal.variant || null,
        calories: Math.round(Number(meal.calories || (meal.macros?.calories ?? 0))),
        protein: Math.round(Number(meal.protein || (meal.macros?.protein ?? 0))),
        carbs: Math.round(Number(meal.carbs || (meal.macros?.carbs ?? 0))),
        fat: Math.round(Number(meal.fat || (meal.macros?.fat ?? 0))),
        base_quantity: Math.round(Number(meal.baseQuantity || 100)),
        ingredients: meal.ingredients || [],
        ingredient_references: normalizedRefs,
        preparation_steps: meal.preparationSteps || [],
        tips: meal.tips || [],
        updated_at: new Date().toISOString()
      };
    });

    const { error } = await supabase.from('base_meals').upsert(dbMeals, { onConflict: 'id' });
    if (error) throw error;

    return c.json({ success: true });
  } catch (error) {
    console.error('[POST /global-meals] Error:', error);
    return c.json({ error: 'Failed to save global meals' }, 500);
  }
});

// DELETE /global-meals/:id - Eliminar un plato específico
app.delete(`${basePath}/global-meals/:id`, async (c) => {
  try {
    const mealId = c.req.param('id');
    if (!mealId) return c.json({ error: 'Meal ID required' }, 400);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('base_meals')
      .delete()
      .eq('id', mealId);
    
    if (error) throw error;

    console.log(`[DELETE /global-meals/:id] Deleted meal: ${mealId}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('[DELETE /global-meals/:id] Error:', error);
    return c.json({ error: 'Failed to delete meal' }, 500);
  }
});

app.get(`${basePath}/global-ingredients`, async (c) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase
      .from('base_ingredients')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    
    // Formatear con AMBOS formatos para compatibilidad
    // Las columnas en DB son: calories, protein, carbs, fat
    const formatted = (data || []).map((ing: any) => ({
      id: ing.id,
      name: ing.name,
      category: ing.category,
      // Formato para Ingredient (types.ts)
      calories: ing.calories || 0,
      protein: ing.protein || 0,
      carbs: ing.carbs || 0,
      fat: ing.fat || 0,
      // Formato para DBIngredient (ingredientsDatabase.ts)
      caloriesPer100g: ing.calories || 0,
      proteinPer100g: ing.protein || 0,
      carbsPer100g: ing.carbs || 0,
      fatPer100g: ing.fat || 0
    }));
    
    return c.json(formatted);
  } catch (error) {
    console.error('[GET /global-ingredients] Error:', error);
    return c.json([], 200);
  }
});

app.post(`${basePath}/global-ingredients`, rateLimitMiddleware('write'), async (c) => {
  try {
    const { ingredients } = await c.req.json();
    if (!Array.isArray(ingredients)) {
      return c.json({ error: 'Invalid payload - ingredients must be array' }, 400);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Las columnas en la DB son: calories, protein, carbs, fat (NOT _per_100g)
    const dbIngredients = ingredients.map((ing: any) => ({
      id: ing.id,
      name: ing.name,
      category: ing.category || 'otros',
      calories: ing.caloriesPer100g || ing.calories_per_100g || ing.calories || 0,
      protein: ing.proteinPer100g || ing.protein_per_100g || ing.protein || 0,
      carbs: ing.carbsPer100g || ing.carbs_per_100g || ing.carbs || 0,
      fat: ing.fatPer100g || ing.fat_per_100g || ing.fat || 0,
      updated_at: new Date().toISOString()
    }));
    
    console.log('[POST /global-ingredients] Upserting:', dbIngredients.length, 'ingredients');
    
    const { error } = await supabase
      .from('base_ingredients')
      .upsert(dbIngredients, { onConflict: 'id' });
    
    if (error) {
      console.error('[POST /global-ingredients] Supabase error:', error);
      return c.json({ error: error.message, details: error.details, code: error.code }, 500);
    }
    return c.json({ success: true, count: dbIngredients.length });
  } catch (error) {
    console.error('[POST /global-ingredients] Error:', error);
    return c.json({ error: 'Failed to save global ingredients', details: String(error) }, 500);
  }
});

// Custom Ingredients
app.get(`${basePath}/custom-ingredients/:email`, authMiddleware, async (c) => {
  try {
    const email = c.req.param("email");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json([]);
    
    const { data, error } = await supabase
      .from('custom_ingredients')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('[GET /custom-ingredients] Error:', error);
      return c.json([]);
    }
    
    // Formatear con ambos formatos para compatibilidad
    const formatted = (data || []).map((ing: any) => ({
      id: ing.id,
      name: ing.name,
      category: ing.category || 'personalizado',
      // Formato types.ts
      calories: ing.calories || 0,
      protein: ing.protein || 0,
      carbs: ing.carbs || 0,
      fat: ing.fat || 0,
      // Formato ingredientsDatabase.ts
      caloriesPer100g: ing.calories || 0,
      proteinPer100g: ing.protein || 0,
      carbsPer100g: ing.carbs || 0,
      fatPer100g: ing.fat || 0,
      isCustom: true
    }));
    
    return c.json(formatted);
  } catch (error) {
    console.error('[GET /custom-ingredients] Error:', error);
    return c.json([]);
  }
});
app.post(`${basePath}/custom-ingredients`, rateLimitMiddleware('write'), async (c) => {
  try {
    const { email, ingredients } = await c.req.json();
    if (!email || !Array.isArray(ingredients)) {
      return c.json({ error: 'Invalid payload - email and ingredients array required' }, 400);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json({ error: "User not found" }, 404);

    // Las columnas en DB son: calories, protein, carbs, fat (NO _per_100g)
    // Generar UUID manualmente ya que el DEFAULT no funciona en producción
    const dbIngredients = ingredients.map((ing: any) => ({
      id: generateUUID(),
      user_id: userId,
      name: ing.name,
      calories: ing.caloriesPer100g || ing.calories_per_100g || ing.calories || 0,
      protein: ing.proteinPer100g || ing.protein_per_100g || ing.protein || 0,
      carbs: ing.carbsPer100g || ing.carbs_per_100g || ing.carbs || 0,
      fat: ing.fatPer100g || ing.fat_per_100g || ing.fat || 0
    }));

    console.log('[POST /custom-ingredients] Saving for user:', userId);
    console.log('[POST /custom-ingredients] Ingredients:', JSON.stringify(dbIngredients));

    const { data, error } = await supabase
      .from('custom_ingredients')
      .insert(dbIngredients)
      .select();

    if (error) {
      console.error('[POST /custom-ingredients] Supabase error:', error);
      if (error.code === '23505') {
        return c.json({ error: 'Ya existe un ingrediente con ese nombre' }, 400);
      }
      return c.json({ error: error.message }, 500);
    }
    return c.json({ success: true, ingredients: data });
  } catch (error) {
    console.error('[POST /custom-ingredients] Error:', error);
    return c.json({ error: "Failed to save custom ingredients", details: String(error) }, 500);
  }
});

// Custom Exercises
app.get(`${basePath}/custom-exercises/:email`, async (c) => {
  try {
    const email = c.req.param("email");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json([]);
    
    const { data } = await supabase.from('custom_exercises').select('*').eq('user_id', userId);
    
    const formatted = data?.map(e => ({
      id: e.id,
      name: e.name,
      muscleGroup: e.muscle_group,
      equipment: e.equipment,
      videoUrl: e.video_url,
      description: e.description,
      isCustom: true
    })) || [];
    
    return c.json(formatted);
  } catch (error) { return c.json([], 200); }
});

app.post(`${basePath}/custom-exercises`, rateLimitMiddleware('write'), async (c) => {
  try {
    const { email, exercises } = await c.req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json({ error: "User not found" }, 404);

    const dbExercises = exercises.map((e: any) => ({
      id: e.id,
      user_id: userId,
      name: e.name,
      muscle_group: e.muscleGroup,
      equipment: e.equipment || 'bodyweight',
      video_url: e.videoUrl || '',
      description: e.description || '',
      is_custom: true
    }));

    await supabase.from('custom_exercises').upsert(dbExercises, { onConflict: 'id' });
    return c.json({ success: true });
  } catch (error) { return c.json({ error: "Failed" }, 500); }
});

// ==========================================
// TRAINING COMPLETED ROUTES
// ==========================================

app.get(`${basePath}/training-completed/:email`, async (c) => {
  try {
    const email = c.req.param("email");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json([]);

    const { data, error } = await supabase
      .from('training_completed')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    
    console.log('🔍 [GET /training-completed] Raw data from Supabase:', JSON.stringify(data, null, 2));
    
    // Mapear snake_case a camelCase para el frontend
    // Asegurarnos de devolver un dayPlanIndex válido (0 por defecto) y un dayPlanName razonable
    const formattedData = data.map(item => ({
      date: item.date,
      dayPlanIndex: (item.day_plan_index !== null && item.day_plan_index !== undefined) ? item.day_plan_index : 0,
      dayPlanName: item.day_plan_name || (item.day_plan_index != null ? `Día ${item.day_plan_index + 1}` : null),
      exerciseReps: item.exercise_reps,
      exerciseWeights: item.exercise_weights
    }));
    
    console.log('🔍 [GET /training-completed] Formatted data:', JSON.stringify(formattedData, null, 2));

    return c.json(formattedData || []);
  } catch (error) {
    console.error("Error fetching completed training:", error);
    return c.json([], 200);
  }
});

app.post(`${basePath}/training-completed`, rateLimitMiddleware('write'), async (c) => {
  try {
    const { email, completedWorkouts } = await c.req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json({ error: "User not found" }, 404);

    if (!Array.isArray(completedWorkouts)) {
       return c.json({ error: "Invalid data format" }, 400);
    }

    const dbWorkouts = completedWorkouts.map((workout: any) => ({
      user_id: userId,
      date: workout.date,
      day_plan_index: workout.dayPlanIndex,
      day_plan_name: workout.dayPlanName,
      exercise_reps: workout.exerciseReps,
      exercise_weights: workout.exerciseWeights,
      updated_at: new Date().toISOString()
    }));

    // Upsert para actualizar si ya existe o insertar si es nuevo
    const { error } = await supabase
      .from('training_completed')
      .upsert(dbWorkouts, { onConflict: 'user_id, date' });

    if (error) {
      console.error("DB Error saving completed workouts:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Server Error saving completed workouts:", error);
    return c.json({ error: "Failed to save completed workouts" }, 500);
  }
});

// ==========================================
// TRAINING PROGRESS ROUTES
// ==========================================

app.get(`${basePath}/training-progress/:email/:date`, async (c) => {
  try {
    const email = c.req.param("email");
    const date = c.req.param("date");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json(null);

    const { data, error } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle();

    if (error) throw error;
    if (!data) return c.json(null);

    return c.json({
      dayIndex: data.day_index,
      exerciseReps: data.exercise_reps,
      exerciseWeights: data.exercise_weights,
      timestamp: data.updated_at
    });
  } catch (error) {
    return c.json(null);
  }
});

app.post(`${basePath}/training-progress`, rateLimitMiddleware('write'), async (c) => {
  try {
    const body = await c.req.json();
    const { email, date, dayIndex, exerciseReps, exerciseWeights } = body;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json({ error: "User not found" }, 404);

    const dbProgress = {
      user_id: userId,
      date: date,
      day_index: dayIndex,
      exercise_reps: exerciseReps,
      exercise_weights: exerciseWeights,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('training_progress')
      .upsert(dbProgress, { onConflict: 'user_id, date' });

    if (error) throw error;

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to save progress" }, 500);
  }
});

app.delete(`${basePath}/training-progress/:email/:date`, async (c) => {
  try {
    const email = c.req.param("email");
    const date = c.req.param("date");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userId = await getUserIdByEmail(supabase, email);
    
    if (userId) {
      await supabase
        .from('training_progress')
        .delete()
        .eq('user_id', userId)
        .eq('date', date);
    }
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete" }, 500);
  }
});

// Bug Reports
app.get(`${basePath}/bug-reports`, async (c) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase
      .from('bug_reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      // Si la tabla no existe, devolver array vacío
      console.log('[GET /bug-reports] Table may not exist:', error.message);
      return c.json([]);
    }
    
    return c.json(data || []);
  } catch (error) {
    console.error('[GET /bug-reports] Error:', error);
    return c.json([]);
  }
});

app.post(`${basePath}/bug-reports`, rateLimitMiddleware('write'), async (c) => {
  try {
    const report = await c.req.json();
    if (!report.title || !report.description) {
      return c.json({ error: 'Title and description are required' }, 400);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const dbReport = {
      id: report.id || `bug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: report.userId,
      user_email: report.userEmail,
      user_name: report.userName,
      title: report.title,
      description: report.description,
      category: report.category || 'bug',
      steps_to_reproduce: report.stepsToReproduce,
      expected_behavior: report.expectedBehavior,
      actual_behavior: report.actualBehavior,
      severity: report.severity || 'medium',
      status: report.status || 'open',
      created_at: report.createdAt || new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('bug_reports')
      .upsert(dbReport, { onConflict: 'id' });
    
    if (error) {
      console.error('[POST /bug-reports] DB Error:', error);
      // Si la tabla no existe, aún retornar éxito (graceful degradation)
      return c.json({ success: true, warning: 'Report logged but not persisted' });
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('[POST /bug-reports] Error:', error);
    return c.json({ error: 'Failed to save bug report' }, 500);
  }
});


// Start the server only if executed directly
if (import.meta.main) {
  Deno.serve(app.fetch);
}

export default app;