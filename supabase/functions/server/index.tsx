import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// ==========================================
// DEBUG ENDPOINTS
// ==========================================

// ✅ NUEVO: Endpoint de diagnóstico para verificar la tabla users
app.get("/make-server-b0e879f0/debug/check-user/:email", async (c) => {
  try {
    const email = c.req.param("email");
    console.log('[DEBUG] Checking user:', email);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Intentar obtener el usuario
    const { data, error } = await supabase
      .from('users')
      .select('email, name, id')
      .eq('email', email)
      .single();
    
    return c.json({
      email: email,
      found: !!data,
      error: error ? {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      } : null,
      data: data ? { email: data.email, name: data.name, id: data.id } : null,
      config: {
        hasServiceKey: !!supabaseServiceKey,
        supabaseUrl: supabaseUrl
      }
    });
  } catch (error) {
    return c.json({
      error: "Exception occurred",
      message: error.message,
      stack: error.stack
    }, 500);
  }
});

// ✅ NUEVO: Ping simple sin autenticación para verificar que el servidor funciona
app.get("/make-server-b0e879f0/ping", async (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "Server is running"
  });
});

// Endpoint de verificación de versión y salud
app.get("/make-server-b0e879f0/health", (c) => {
  return c.json({ 
    status: "ok", 
    version: "sql-architecture-v1",
    timestamp: new Date().toISOString(),
    config: {
      hasSupabaseUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!supabaseServiceKey,
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING'
    },
    endpoints: [
      "POST /user",
      "POST /daily-logs",
      "POST /saved-diets",
      "POST /custom-meals"
    ]
  });
});

// DEBUG: Test POST para verificar que el servidor puede recibir requests
app.post("/make-server-b0e879f0/test-post", async (c) => {
  console.log('[SERVER] TEST POST received');
  const body = await c.req.json().catch(() => ({}));
  console.log('[SERVER] TEST POST body:', body);
  return c.json({ 
    status: "success",
    received: body,
    timestamp: new Date().toISOString()
  });
});

// Helper para obtener ID de usuario por email
async function getUserIdByEmail(supabase: any, email: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();
  
  if (error || !data) return null;
  return data.id;
}

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.post("/make-server-b0e879f0/auth/signup", async (c) => {
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

// POST /auth/signin - Login
app.post("/make-server-b0e879f0/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ error: "Email and password required" }, 400);

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return c.json({ error: error.message }, 401);
    if (!data.session) return c.json({ error: "Failed to create session" }, 500);

    return c.json({ 
      success: true, 
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: { id: data.user.id, email: data.user.email }
    });
  } catch (error) {
    return c.json({ error: "Failed to sign in" }, 500);
  }
});

// GET /auth/session - Validate session
app.get("/make-server-b0e879f0/auth/session", async (c) => {
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

// POST /auth/refresh - Refresh access token
app.post("/make-server-b0e879f0/auth/refresh", async (c) => {
  try {
    const { refresh_token } = await c.req.json();
    if (!refresh_token) return c.json({ error: "Refresh token required" }, 400);

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error) return c.json({ error: error.message }, 401);
    if (!data.session) return c.json({ error: "Failed to refresh session" }, 500);

    return c.json({
      success: true,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: { id: data.user.id, email: data.user.email }
    });
  } catch (error) {
    return c.json({ error: "Failed to refresh token" }, 500);
  }
});

app.post("/make-server-b0e879f0/auth/signout", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ error: "No authorization header" }, 401);

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    await supabase.auth.admin.signOut(token);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to sign out" }, 500);
  }
});

// ==========================================
// USER ROUTES (Table: users)
// ==========================================

app.get("/make-server-b0e879f0/user/:email", async (c) => {
  try {
    console.log('[SERVER] GET /user/:email - Starting request');
    const email = c.req.param("email");
    console.log('[SERVER] Looking for user with email:', email);
    
    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[SERVER] Using SERVICE_ROLE_KEY to query users table');
    
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    
    if (error) {
      console.log('[SERVER] Supabase error:', error);
      if (error.code === 'PGRST116') {
        console.log('[SERVER] User not found (404)');
        return c.json({ error: "User not found" }, 404);
      }
      console.error('[SERVER] Database error:', error);
      return c.json({ error: "Database error", details: error.message }, 500);
    }
    
    if (!data) {
      console.log('[SERVER] No data returned - User not found');
      return c.json({ error: "User not found" }, 404);
    }
    
    console.log('[SERVER] User found successfully:', email);
    
    // Map DB snake_case -> Frontend camelCase
    const user = {
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
      isAdmin: data.is_admin
    };
    
    return c.json(user);
  } catch (error) {
    console.error('[SERVER] Exception in GET /user/:email:', error);
    return c.json({ error: "Failed to get user", details: error.message }, 500);
  }
});

app.post("/make-server-b0e879f0/user", async (c) => {
  try {
    console.log('[SERVER] POST /user - Starting request');
    console.log('[SERVER] Request headers:', Object.fromEntries(c.req.raw.headers.entries()));
    
    const user = await c.req.json();
    console.log('[SERVER] Received user data for email:', user.email);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[SERVER] Supabase client created with SERVICE_ROLE_KEY');
    console.log('[SERVER] SERVICE_ROLE_KEY present:', !!supabaseServiceKey);
    console.log('[SERVER] SUPABASE_URL:', supabaseUrl);
    
    // Map Frontend camelCase -> DB snake_case
    const dbUser = {
      id: user.id || (await getUserIdByEmail(supabase, user.email)), // Asegurar ID
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
      updated_at: new Date().toISOString()
    };
    
    console.log('[SERVER] Attempting upsert for user:', user.email, 'with id:', dbUser.id);
    const { data, error } = await supabase.from('users').upsert(dbUser, { onConflict: 'email' });
    
    if (error) {
      console.error("[SERVER] DB Error saving user:", error);
      console.error("[SERVER] Error code:", error.code);
      console.error("[SERVER] Error message:", error.message);
      console.error("[SERVER] Error details:", error.details);
      console.error("[SERVER] Error hint:", error.hint);
      return c.json({ error: error.message, code: error.code, details: error.details, hint: error.hint }, 500);
    }
    
    console.log('[SERVER] User saved successfully:', user.email);
    console.log('[SERVER] Returning success response');
    return c.json({ success: true, user });
  } catch (error) {
    console.error("[SERVER] Exception in POST /user:", error);
    console.error("[SERVER] Exception message:", error.message);
    console.error("[SERVER] Exception stack:", error.stack);
    return c.json({ error: "Failed to save user", details: error.message }, 500);
  }
});

// ==========================================
// DAILY LOGS ROUTES (Table: daily_logs)
// ==========================================

app.get("/make-server-b0e879f0/daily-logs/:email", async (c) => {
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

    // Transform DB snake_case -> Frontend types
    // Asumimos que la tabla guarda las comidas completas en columnas JSONB: breakfast, lunch, etc.
    return c.json(data || []);
  } catch (error) {
    console.error("Error fetching logs:", error);
    return c.json([], 200); 
  }
});

app.post("/make-server-b0e879f0/daily-logs", async (c) => {
  try {
    const { email, logs } = await c.req.json();
    console.log(`[SERVER] Recibida petición POST /daily-logs para ${email} con ${logs?.length} logs`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) {
      console.error(`[SERVER] User not found for email: ${email}`);
      return c.json({ error: "User not found" }, 404);
    }

    // Prepare batch upsert
    // Mapeamos el array de logs del frontend a filas de la base de datos
    const dbLogs = logs.map((log: any) => ({
      user_id: userId,
      date: log.date,
      breakfast: log.breakfast, // JSONB
      lunch: log.lunch,         // JSONB
      snack: log.snack,         // JSONB
      dinner: log.dinner,       // JSONB
      extra_foods: log.extraFoods, // JSONB
      complementary_meals: log.complementaryMeals, // JSONB
      is_saved: log.isSaved,
      weight: log.weight,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('daily_logs')
      .upsert(dbLogs, { onConflict: 'user_id, date' }); // Requiere índice único en (user_id, date)

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
// SAVED DIETS ROUTES (Table: saved_diets)
// ==========================================

app.get("/make-server-b0e879f0/saved-diets/:email", async (c) => {
  try {
    const email = c.req.param("email");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json([]);

    const { data, error } = await supabase
      .from('saved_diets')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return c.json(data || []);
  } catch (error) {
    return c.json([], 200);
  }
});

app.post("/make-server-b0e879f0/saved-diets", async (c) => {
  try {
    const { email, diets } = await c.req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json({ error: "User not found" }, 404);

    const dbDiets = diets.map((diet: any) => ({
      id: diet.id, // Si el frontend envía ID
      user_id: userId,
      name: diet.name,
      meals: diet.meals, // JSONB con todas las comidas de la dieta
      macros: diet.macros, // JSONB con info nutricional
      created_at: diet.createdAt || new Date().toISOString()
    }));

    const { error } = await supabase
      .from('saved_diets')
      .upsert(dbDiets, { onConflict: 'id' });

    if (error) throw error;
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to save diets" }, 500);
  }
});

// ==========================================
// CUSTOM MEALS ROUTES (Table: custom_meals)
// ==========================================

app.get("/make-server-b0e879f0/custom-meals/:email", async (c) => {
  try {
    const email = c.req.param("email");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json([]);

    const { data, error } = await supabase
      .from('custom_meals')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    
    // ✅ CRITICAL FIX: Mapear snake_case → camelCase
    const meals = (data || []).map((meal: any) => ({
      id: meal.id,
      name: meal.name,
      type: meal.type,
      calories: meal.macros?.calories || 0,
      protein: meal.macros?.protein || 0,
      carbs: meal.macros?.carbs || 0,
      fat: meal.macros?.fat || 0,
      ingredients: meal.ingredients || [],
      detailedIngredients: meal.detailed_ingredients || [],
      image: meal.image,
      isCustom: true, // ✅ FIX: Convertir is_custom → isCustom
      baseQuantity: meal.base_quantity || 1,
      portionMultiplier: meal.portion_multiplier || 1
    }));
    
    console.log(`[SERVER] Returning ${meals.length} custom meals for user with isCustom flag`);
    meals.forEach(meal => {
      console.log(`  - "${meal.name}" (type: ${meal.type}, isCustom: ${meal.isCustom})`);
    });
    
    return c.json(meals);
  } catch (error) {
    return c.json([], 200);
  }
});

app.post("/make-server-b0e879f0/custom-meals", async (c) => {
  try {
    const { email, meals } = await c.req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json({ error: "User not found" }, 404);

    const dbMeals = meals.map((meal: any) => ({
      id: meal.id,
      user_id: userId,
      name: meal.name,
      type: meal.type, // 'breakfast', 'lunch', etc.
      ingredients: meal.ingredients, // JSONB array
      detailed_ingredients: meal.detailedIngredients || [], // ✅ FIX: Guardar detailedIngredients
      macros: { // JSONB o columnas separadas, usando JSONB por flexibilidad ahora
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat
      },
      image: meal.image,
      is_custom: true,
      base_quantity: meal.baseQuantity || 1, // ✅ FIX: Guardar baseQuantity
      portion_multiplier: meal.portionMultiplier || 1, // ✅ FIX: Guardar portionMultiplier
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('custom_meals')
      .upsert(dbMeals, { onConflict: 'id' });

    if (error) throw error;
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to save custom meals" }, 500);
  }
});

// ==========================================
// TRAINING PLAN ROUTES (Table: training_plans)
// ==========================================

app.get("/make-server-b0e879f0/training-plan/:email", async (c) => {
  try {
    const email = c.req.param("email");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json(null);

    // Asumimos un plan activo por usuario
    const { data, error } = await supabase
      .from('training_plans')
      .select('week_plan')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return c.json(data?.week_plan || null);
  } catch (error) {
    return c.json(null, 200);
  }
});

app.post("/make-server-b0e879f0/training-plan", async (c) => {
  try {
    const { email, weekPlan } = await c.req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json({ error: "User not found" }, 404);

    const { error } = await supabase
      .from('training_plans')
      .upsert({
        user_id: userId,
        week_plan: weekPlan, // JSONB structure
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' }); // O manejo más complejo si quieres historial

    if (error) throw error;
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to save training plan" }, 500);
  }
});

// ==========================================
// FAVORITE MEALS (Uses users table array)
// ==========================================
// Nota: Mantenemos esto en la tabla users como array por simplicidad según schema anterior,
// pero podría moverse a tabla relacional 'user_favorite_meals' (user_id, meal_id).
// Por ahora, el endpoint sigue usando el array en users para no romper contrato.

app.get("/make-server-b0e879f0/favorite-meals/:email", async (c) => {
  try {
    const email = c.req.param("email");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data } = await supabase.from('users').select('favorite_meal_ids').eq('email', email).single();
    return c.json(data?.favorite_meal_ids || []);
  } catch (error) {
    return c.json([], 200);
  }
});

app.post("/make-server-b0e879f0/favorite-meals", async (c) => {
  try {
    const { email, favorites } = await c.req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('users')
      .update({ favorite_meal_ids: favorites })
      .eq('email', email);

    if (error) throw error;
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to save favorites" }, 500);
  }
});

// ==========================================
// GLOBAL MEALS ROUTES (Table: base_meals - Admin only)
// ==========================================

app.get("/make-server-b0e879f0/global-meals", async (c) => {
  try {
    console.log('[SERVER] GET /global-meals - Starting request');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[SERVER] Supabase client created with SERVICE_ROLE_KEY');
    
    const { data, error } = await supabase
      .from('base_meals') // ✅ FIX: Usar base_meals en lugar de global_meals
      .select('*');

    if (error) {
      console.error('[SERVER] Error fetching base meals:', error);
      console.error('[SERVER] Error code:', error.code);
      console.error('[SERVER] Error message:', error.message);
      console.error('[SERVER] Error details:', error.details);
      // Si la tabla no existe, retornar array vacío
      return c.json([]);
    }
    
    console.log(`[SERVER] Successfully fetched ${data?.length || 0} base meals from database`);
    
    // Mapear snake_case → camelCase
    const meals = (data || []).map((meal: any) => ({
      id: meal.id,
      name: meal.name,
      type: meal.type,
      calories: meal.macros?.calories || 0,
      protein: meal.macros?.protein || 0,
      carbs: meal.macros?.carbs || 0,
      fat: meal.macros?.fat || 0,
      ingredients: meal.ingredients || [],
      detailedIngredients: meal.detailed_ingredients || [],
      ingredientReferences: meal.ingredient_references || [],
      image: meal.image,
      category: meal.category,
      variant: meal.variant,
      isCustom: false,
      baseQuantity: meal.base_quantity || 1,
      portionMultiplier: meal.portion_multiplier || 1
    }));
    
    console.log(`[SERVER] Returning ${meals.length} base meals`);
    return c.json(meals);
  } catch (error) {
    console.error('[SERVER] Exception in global-meals endpoint:', error);
    console.error('[SERVER] Exception message:', error.message);
    console.error('[SERVER] Exception stack:', error.stack);
    return c.json([], 200);
  }
});

app.post("/make-server-b0e879f0/global-meals", async (c) => {
  try {
    const { meals } = await c.req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // TODO: Verificar que el usuario es admin
    
    const dbMeals = meals.map((meal: any) => ({
      id: meal.id,
      name: meal.name,
      type: meal.type,
      ingredients: meal.ingredients || [],
      detailed_ingredients: meal.detailedIngredients || [],
      ingredient_references: meal.ingredientReferences || [],
      macros: {
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat
      },
      image: meal.image,
      category: meal.category,
      variant: meal.variant,
      base_quantity: meal.baseQuantity || 1,
      portion_multiplier: meal.portionMultiplier || 1,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('base_meals') // ✅ FIX: Usar base_meals en lugar de global_meals
      .upsert(dbMeals, { onConflict: 'id' });

    if (error) {
      console.error('[SERVER] Error saving base meals:', error);
      throw error;
    }
    
    console.log(`[SERVER] Saved ${meals.length} base meals`);
    return c.json({ success: true });
  } catch (error) {
    console.error('[SERVER] Error in global-meals POST:', error);
    return c.json({ error: "Failed to save global meals" }, 500);
  }
});

// ==========================================
// GLOBAL INGREDIENTS ROUTES (Table: base_ingredients - Admin only)
// ==========================================

app.get("/make-server-b0e879f0/global-ingredients", async (c) => {
  try {
    console.log('[SERVER] GET /global-ingredients - Starting request');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[SERVER] Supabase client created with SERVICE_ROLE_KEY');
    
    const { data, error } = await supabase
      .from('base_ingredients') // ✅ FIX: Usar base_ingredients en lugar de global_ingredients
      .select('*');

    if (error) {
      console.error('[SERVER] Error fetching base ingredients:', error);
      console.error('[SERVER] Error code:', error.code);
      console.error('[SERVER] Error message:', error.message);
      console.error('[SERVER] Error details:', error.details);
      // Si la tabla no existe, retornar array vacío
      return c.json([]);
    }
    
    console.log(`[SERVER] Successfully fetched ${data?.length || 0} base ingredients from database`);
    
    // Mapear snake_case → camelCase si es necesario
    const ingredients = (data || []).map((ing: any) => ({
      id: ing.id,
      name: ing.name,
      calories: ing.calories,
      protein: ing.protein,
      carbs: ing.carbs,
      fat: ing.fat,
      category: ing.category,
      unit: ing.unit
    }));
    
    console.log(`[SERVER] Returning ${ingredients.length} base ingredients`);
    return c.json(ingredients);
  } catch (error) {
    console.error('[SERVER] Exception in global-ingredients endpoint:', error);
    console.error('[SERVER] Exception message:', error.message);
    console.error('[SERVER] Exception stack:', error.stack);
    return c.json([], 200);
  }
});

app.post("/make-server-b0e879f0/global-ingredients", async (c) => {
  try {
    const { ingredients } = await c.req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // TODO: Verificar que el usuario es admin
    
    const dbIngredients = ingredients.map((ing: any) => ({
      id: ing.id,
      name: ing.name,
      calories: ing.calories,
      protein: ing.protein,
      carbs: ing.carbs,
      fat: ing.fat,
      category: ing.category,
      unit: ing.unit,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('base_ingredients') // ✅ FIX: Usar base_ingredients en lugar de global_ingredients
      .upsert(dbIngredients, { onConflict: 'id' });

    if (error) {
      console.error('[SERVER] Error saving base ingredients:', error);
      throw error;
    }
    
    console.log(`[SERVER] Saved ${ingredients.length} base ingredients`);
    return c.json({ success: true });
  } catch (error) {
    console.error('[SERVER] Error in global-ingredients POST:', error);
    return c.json({ error: "Failed to save global ingredients" }, 500);
  }
});

Deno.serve(app.fetch);