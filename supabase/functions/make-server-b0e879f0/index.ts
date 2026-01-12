import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

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
    version: "sql-architecture-v3-complete", 
    timestamp: new Date().toISOString(),
    endpoints: [
      "POST /user",
      "POST /daily-logs",
      "POST /saved-diets",
      "POST /custom-meals",
      "GET /global-meals", // Added
      "GET /custom-ingredients" // Added
    ]
  });
};

app.get("/health", healthHandler);
app.get("/make-server-b0e879f0/health", healthHandler);

// Helper para extraer user ID del JWT token de Supabase Auth
async function getUserIdFromToken(c: any, supabase: any): Promise<string | null> {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    
    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data?.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

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

const basePath = "/make-server-b0e879f0";
const authBasePath = `${basePath}/auth`;

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.post(`${authBasePath}/signup`, async (c) => {
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

app.post(`${authBasePath}/signin`, async (c) => {
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
app.post(`${authBasePath}/admin-login`, async (c) => {
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    
    if (error || !data) return c.json({ error: "User not found" }, 404);
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

app.post(`${basePath}/user`, async (c) => {
  try {
    const user = await c.req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // CRÍTICO: Obtener ID del usuario de múltiples fuentes (en orden de prioridad)
    // 1. ID enviado directamente en el body
    // 2. ID extraído del JWT token de autenticación
    // 3. ID buscado en la tabla users por email (para usuarios existentes)
    let userId = user.id;
    if (!userId) {
      userId = await getUserIdFromToken(c, supabase);
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

app.get(`${basePath}/daily-logs/:email`, async (c) => {
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

app.post(`${basePath}/daily-logs`, async (c) => {
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

app.get(`${basePath}/custom-meals/:email`, async (c) => {
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
    return c.json(data || []);
  } catch (error) {
    return c.json([], 200);
  }
});

app.post(`${basePath}/custom-meals`, async (c) => {
  try {
    const { email, meals } = await c.req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json({ error: "User not found" }, 404);

    const dbMeals = meals.map((meal: any) => {
      // Normalize type -> meal_types array
      const mealTypes = Array.isArray(meal.type) ? meal.type : (meal.type ? [meal.type] : []);

      // Normalize macros (support both meal.calories or meal.macros)
      const calories = Math.round(Number(meal.calories ?? meal.macros?.calories ?? 0));
      const protein = Math.round(Number(meal.protein ?? meal.macros?.protein ?? 0));
      const carbs = Math.round(Number(meal.carbs ?? meal.macros?.carbs ?? 0));
      const fat = Math.round(Number(meal.fat ?? meal.macros?.fat ?? 0));

      return {
        id: meal.id,
        user_id: userId,
        name: meal.name,
        meal_types: mealTypes,
        variant: meal.variant || null,
        calories,
        protein,
        carbs,
        fat,
        ingredients: meal.ingredients || [],
        detailed_ingredients: meal.detailedIngredients || null,
        base_quantity: Math.round(Number(meal.baseQuantity ?? 100)),
        preparation_steps: meal.preparationSteps || [],
        tips: meal.tips || [],
        is_favorite: meal.isFavorite || false,
        updated_at: new Date().toISOString()
      };
    });

    const { error } = await supabase
      .from('custom_meals')
      .upsert(dbMeals, { onConflict: 'id' });

    if (error) throw error;
    return c.json({ success: true });
  } catch (error) {
    console.error('[POST /custom-meals] Error:', error);
    return c.json({ error: "Failed to save custom meals" }, 500);
  }
});

// ==========================================
// SAVED DIETS
// ==========================================

app.get(`${basePath}/saved-diets/:email`, async (c) => {
  try {
    const email = c.req.param("email");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json([]);
    const { data } = await supabase.from('saved_diets').select('*').eq('user_id', userId);
    return c.json(data || []);
  } catch (error) { return c.json([], 200); }
});

app.post(`${basePath}/saved-diets`, async (c) => {
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

app.get(`${basePath}/favorite-meals/:email`, async (c) => {
  try {
    const email = c.req.param("email");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data } = await supabase.from('users').select('favorite_meal_ids').eq('email', email).single();
    return c.json(data?.favorite_meal_ids || []);
  } catch (error) { return c.json([], 200); }
});

app.post(`${basePath}/favorite-meals`, async (c) => {
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

app.get(`${basePath}/training-plan/:email`, async (c) => {
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

app.post(`${basePath}/training-plan`, async (c) => {
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

app.post(`${basePath}/global-meals`, async (c) => {
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
    const formatted = (data || []).map((ing: any) => ({
      id: ing.id,
      name: ing.name,
      category: ing.category,
      // Formato para Ingredient (types.ts)
      calories: ing.calories_per_100g,
      protein: ing.protein_per_100g,
      carbs: ing.carbs_per_100g,
      fat: ing.fat_per_100g,
      // Formato para DBIngredient (ingredientsDatabase.ts)
      caloriesPer100g: ing.calories_per_100g,
      proteinPer100g: ing.protein_per_100g,
      carbsPer100g: ing.carbs_per_100g,
      fatPer100g: ing.fat_per_100g
    }));
    
    return c.json(formatted);
  } catch (error) {
    console.error('[GET /global-ingredients] Error:', error);
    return c.json([], 200);
  }
});

app.post(`${basePath}/global-ingredients`, async (c) => {
  try {
    const { ingredients } = await c.req.json();
    if (!Array.isArray(ingredients)) {
      return c.json({ error: 'Invalid payload - ingredients must be array' }, 400);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const dbIngredients = ingredients.map((ing: any) => ({
      id: ing.id,
      name: ing.name,
      category: ing.category || 'otros',
      calories_per_100g: ing.caloriesPer100g || ing.calories_per_100g,
      protein_per_100g: ing.proteinPer100g || ing.protein_per_100g,
      carbs_per_100g: ing.carbsPer100g || ing.carbs_per_100g,
      fat_per_100g: ing.fatPer100g || ing.fat_per_100g,
      updated_at: new Date().toISOString()
    }));
    
    const { error } = await supabase
      .from('base_ingredients')
      .upsert(dbIngredients, { onConflict: 'id' });
    
    if (error) throw error;
    return c.json({ success: true });
  } catch (error) {
    console.error('[POST /global-ingredients] Error:', error);
    return c.json({ error: 'Failed to save global ingredients' }, 500);
  }
});

// Custom Ingredients
app.get(`${basePath}/custom-ingredients/:email`, async (c) => {
  // Intentar leer si hay tabla, si no devolver vacío
  try {
    const email = c.req.param("email");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json([]);
    // Si existe tabla 'custom_ingredients', úsala:
    const { data, error } = await supabase.from('custom_ingredients').select('*').eq('user_id', userId);
    if (!error && data) return c.json(data);
    return c.json([]);
  } catch { return c.json([]); }
});
app.post(`${basePath}/custom-ingredients`, async (c) => {
  try {
    const { email, ingredients } = await c.req.json();
    if (!email || !Array.isArray(ingredients)) {
      return c.json({ error: 'Invalid payload - email and ingredients array required' }, 400);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json({ error: "User not found" }, 404);

    const dbIngredients = ingredients.map((ing: any) => ({
      id: ing.id,
      user_id: userId,
      name: ing.name,
      category: ing.category || 'otros',
      calories_per_100g: ing.caloriesPer100g || ing.calories_per_100g || 0,
      protein_per_100g: ing.proteinPer100g || ing.protein_per_100g || 0,
      carbs_per_100g: ing.carbsPer100g || ing.carbs_per_100g || 0,
      fat_per_100g: ing.fatPer100g || ing.fat_per_100g || 0,
      is_custom: true,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('custom_ingredients')
      .upsert(dbIngredients, { onConflict: 'id' });

    if (error) throw error;
    return c.json({ success: true });
  } catch (error) {
    console.error('[POST /custom-ingredients] Error:', error);
    return c.json({ error: "Failed to save custom ingredients" }, 500);
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

app.post(`${basePath}/custom-exercises`, async (c) => {
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

app.post(`${basePath}/training-completed`, async (c) => {
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

app.post(`${basePath}/training-progress`, async (c) => {
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

app.post(`${basePath}/bug-reports`, async (c) => {
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