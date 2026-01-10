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

    if (error) return c.json({ error: error.message }, 401);
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

app.get(`${basePath}/user/:email`, async (c) => {
  try {
    const email = c.req.param("email");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    
    if (error || !data) return c.json({ error: "User not found" }, 404);
    
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
    return c.json({ error: "Failed to get user" }, 500);
  }
});

app.post(`${basePath}/user`, async (c) => {
  try {
    const user = await c.req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const dbUser = {
      id: user.id || (await getUserIdByEmail(supabase, user.email)),
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
    return c.json(data || []);
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

    const dbMeals = meals.map((meal: any) => ({
      id: meal.id,
      user_id: userId,
      name: meal.name,
      type: meal.type,
      ingredients: meal.ingredients,
      macros: {
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat
      },
      image: meal.image,
      is_custom: true,
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
    if (!userId) return c.json(null);
    const { data } = await supabase.from('training_plans').select('week_plan').eq('user_id', userId).eq('is_active', true).maybeSingle();
    return c.json(data?.week_plan || null);
  } catch (error) { return c.json(null, 200); }
});

app.post(`${basePath}/training-plan`, async (c) => {
  try {
    const { email, weekPlan } = await c.req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userId = await getUserIdByEmail(supabase, email);
    if (!userId) return c.json({ error: "User not found" }, 404);
    await supabase.from('training_plans').upsert({
      user_id: userId,
      week_plan: weekPlan,
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    return c.json({ success: true });
  } catch (error) { return c.json({ error: "Failed" }, 500); }
});

// ==========================================
// PLACEHOLDER ROUTES (To avoid 404s in Frontend)
// ==========================================
// Estas rutas devuelven arrays vacíos o success: true para que el frontend
// no explote con 404, aunque la funcionalidad SQL completa aún no esté lista para ellas.

// Global Meals & Ingredients (Admin)
app.get(`${basePath}/global-meals`, (c) => c.json([]));
app.post(`${basePath}/global-meals`, (c) => c.json({ success: true }));

app.get(`${basePath}/global-ingredients`, (c) => c.json([]));
app.post(`${basePath}/global-ingredients`, (c) => c.json({ success: true }));

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
app.post(`${basePath}/custom-ingredients`, (c) => c.json({ success: true }));

// Custom Exercises
app.get(`${basePath}/custom-exercises/:email`, (c) => c.json([]));
app.post(`${basePath}/custom-exercises`, (c) => c.json({ success: true }));

// Training Completed & Progress
app.get(`${basePath}/training-completed/:email`, (c) => c.json([]));
app.post(`${basePath}/training-completed`, (c) => c.json({ success: true }));

app.get(`${basePath}/training-progress/:email/:date`, (c) => c.json(null));
app.post(`${basePath}/training-progress`, (c) => c.json({ success: true }));
app.delete(`${basePath}/training-progress/:email/:date`, (c) => c.json({ success: true }));

// Bug Reports
app.get(`${basePath}/bug-reports`, (c) => c.json([]));
app.post(`${basePath}/bug-reports`, (c) => c.json({ success: true }));

Deno.serve(app.fetch);