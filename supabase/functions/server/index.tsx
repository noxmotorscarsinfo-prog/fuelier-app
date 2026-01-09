import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Supabase clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper to get user ID from auth token
const getUserIdFromToken = async (token: string): Promise<string | null> => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
};

// Health check endpoint
app.get("/make-server-b0e879f0/health", (c) => {
  return c.json({ status: "ok" });
});

// ===== AUTHENTICATION ENDPOINTS =====

// Sign up - Create new user in Auth AND in users table
app.post("/make-server-b0e879f0/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    console.log(`[POST /auth/signup] Attempting signup for: ${email}`);
    
    if (!email || !password || !name) {
      console.error('[POST /auth/signup] Missing required fields');
      return c.json({ error: "Email, password and name are required" }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First check if user already exists
    console.log(`[POST /auth/signup] Checking if user already exists...`);
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email === email);
    
    if (userExists) {
      console.log(`[POST /auth/signup] User already exists: ${email}`);
      return c.json({ 
        error: "Este correo ya está registrado. Por favor inicia sesión.",
        code: "email_exists"
      }, 409); // 409 Conflict
    }
    
    console.log(`[POST /auth/signup] Creating user in Supabase Auth...`);
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email since we don't have email server configured
      user_metadata: { name }
    });

    if (authError) {
      console.error("[POST /auth/signup] Error creating user in Supabase Auth:", authError);
      
      // Handle specific error cases
      if (authError.message?.includes('already been registered') || authError.code === 'email_exists') {
        return c.json({ 
          error: "Este correo ya está registrado. Por favor inicia sesión.",
          code: "email_exists"
        }, 409);
      }
      
      if (authError.message?.includes('password')) {
        return c.json({ 
          error: "La contraseña debe tener al menos 6 caracteres.",
          code: "weak_password"
        }, 400);
      }
      
      return c.json({ error: authError.message }, 400);
    }

    if (!authData.user) {
      console.error('[POST /auth/signup] No user returned from Supabase');
      return c.json({ error: "Failed to create user" }, 500);
    }

    console.log(`[POST /auth/signup] ✅ Auth user created successfully!`);
    console.log(`[POST /auth/signup] User ID: ${authData.user.id}`);
    console.log(`[POST /auth/signup] User email: ${authData.user.email}`);
    
    // === VERIFICATION STEP: Verify user was actually created ===
    console.log(`[POST /auth/signup] 🔍 VERIFICATION: Checking if user exists in auth.users...`);
    const { data: verifyUsers } = await supabase.auth.admin.listUsers();
    const createdUser = verifyUsers?.users?.find(u => u.email === email);
    
    if (!createdUser) {
      console.error('[POST /auth/signup] ❌ CRITICAL: User was NOT found after creation!');
      console.error('[POST /auth/signup] This should never happen - possible Supabase issue');
      return c.json({ 
        error: "User creation verification failed. Please try again.",
        code: "verification_failed"
      }, 500);
    }
    
    console.log(`[POST /auth/signup] ✅ User verified in auth.users table`);
    
    // === TEST LOGIN IMMEDIATELY ===
    console.log(`[POST /auth/signup] 🔐 VERIFICATION: Testing login with new credentials...`);
    const testSupabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: testLogin, error: testLoginError } = await testSupabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (testLoginError) {
      console.error('[POST /auth/signup] ❌ CRITICAL: Immediate login test FAILED!');
      console.error('[POST /auth/signup] Error:', testLoginError.message);
      console.error('[POST /auth/signup] User was created but cannot login - deleting account');
      
      // Delete the user since they can't login anyway
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return c.json({ 
        error: "Account was created but login failed. Please try again.",
        code: "login_test_failed"
      }, 500);
    }
    
    if (!testLogin.session) {
      console.error('[POST /auth/signup] ❌ CRITICAL: Login test succeeded but no session created');
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return c.json({ 
        error: "Account creation failed. Please try again.",
        code: "session_creation_failed"
      }, 500);
    }
    
    console.log(`[POST /auth/signup] ✅ Login test SUCCESSFUL!`);
    console.log(`[POST /auth/signup] 🎉 SIGNUP COMPLETE AND VERIFIED - User can now login`);
    console.log(`[POST /auth/signup] Note: User profile will be created after onboarding completion`);
    
    return c.json({ 
      success: true, 
      access_token: testLogin.session.access_token, // Retornar token para que el usuario quede logueado
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name
      }
    });
  } catch (error) {
    console.error("[POST /auth/signup] Error in signup:", error);
    return c.json({ error: "Failed to sign up", details: error.message }, 500);
  }
});

// Sign in - Login user
app.post("/make-server-b0e879f0/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    console.log(`[POST /auth/signin] ===== SIGNIN ATTEMPT =====`);
    console.log(`[POST /auth/signin] Email: ${email}`);
    
    if (!email || !password) {
      console.error(`[POST /auth/signin] ❌ Missing credentials`);
      return c.json({ error: "Email and password are required" }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log(`[POST /auth/signin] 🔐 Attempting to sign in with Supabase Auth...`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error(`[POST /auth/signin] ❌ Auth error:`, error.message);
      console.error(`[POST /auth/signin] Error code:`, error.code);
      console.error(`[POST /auth/signin] Error status:`, error.status);
      
      // === DIAGNÓSTICO AUTOMÁTICO ===
      if (error.code === 'invalid_credentials') {
        console.log(`[POST /auth/signin] 🔍 DIAGNÓSTICO: Verificando si el usuario existe...`);
        const diagSupabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: allUsers } = await diagSupabase.auth.admin.listUsers();
        const userExists = allUsers?.users?.find(u => u.email === email);
        
        if (!userExists) {
          console.error(`[POST /auth/signin] ❌ DIAGNÓSTICO: Usuario NO existe en auth.users`);
          console.error(`[POST /auth/signin] El usuario debe crear una cuenta primero`);
          return c.json({ 
            error: "Esta cuenta no existe. Por favor, crea una cuenta primero.",
            code: "user_not_found"
          }, 401);
        } else {
          console.error(`[POST /auth/signin] ❌ DIAGNÓSTICO: Usuario existe pero la contraseña es incorrecta`);
          console.error(`[POST /auth/signin] User ID: ${userExists.id}`);
          console.error(`[POST /auth/signin] Email confirmed: ${userExists.email_confirmed_at ? 'Sí' : 'No'}`);
          return c.json({ 
            error: "Contraseña incorrecta. Verifica tu contraseña.",
            code: "wrong_password"
          }, 401);
        }
      }
      
      return c.json({ error: error.message }, 401);
    }

    if (!data.session) {
      console.error(`[POST /auth/signin] ❌ No session created`);
      return c.json({ error: "Failed to create session" }, 500);
    }
    
    console.log(`[POST /auth/signin] ✅ Sign in successful: ${email}`);
    console.log(`[POST /auth/signin] Access token: ${data.session.access_token.substring(0, 20)}...`);

    return c.json({ 
      success: true,
      access_token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });
  } catch (error) {
    console.error("[POST /auth/signin] ❌ Unexpected error:", error);
    return c.json({ error: "Failed to sign in", details: error.message }, 500);
  }
});

// Get session - Validate token and get user
app.get("/make-server-b0e879f0/auth/session", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: "No authorization header" }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return c.json({ error: "Invalid token" }, 401);
    }

    return c.json({ 
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });
  } catch (error) {
    console.error("Error getting session:", error);
    return c.json({ error: "Failed to get session" }, 500);
  }
});

// Sign out
app.post("/make-server-b0e879f0/auth/signout", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: "No authorization header" }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      console.error("Error signing out:", error);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error in signout:", error);
    return c.json({ error: "Failed to sign out" }, 500);
  }
});

// ===== USER ENDPOINTS =====

// Get user by email from users table
app.get("/make-server-b0e879f0/user/:email", async (c) => {
  try {
    const email = c.req.param("email");
    console.log(`[GET /user/:email] Fetching user from users table: ${email}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Query the users table directly
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      // If no user found, return 404
      if (error.code === 'PGRST116') {
        console.log(`[GET /user/:email] User not found in database: ${email}`);
        return c.json({ error: "User not found" }, 404);
      }
      console.error(`[GET /user/:email] Database error:`, error);
      return c.json({ error: "Failed to get user", details: error.message }, 500);
    }
    
    if (!data) {
      console.log(`[GET /user/:email] User not found: ${email}`);
      return c.json({ error: "User not found" }, 404);
    }
    
    console.log(`[GET /user/:email] User found in users table: ${email}`);
    
    // Transform database format to app format
    const user = {
      email: data.email,
      name: data.name,
      sex: data.sex,
      age: data.age,
      birthdate: data.birthdate,
      weight: parseFloat(data.weight),
      height: parseFloat(data.height),
      bodyFatPercentage: data.body_fat_percentage ? parseFloat(data.body_fat_percentage) : undefined,
      leanBodyMass: data.lean_body_mass ? parseFloat(data.lean_body_mass) : undefined,
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
        protein: parseFloat(data.target_protein),
        carbs: parseFloat(data.target_carbs),
        fat: parseFloat(data.target_fat)
      },
      selectedMacroOption: data.selected_macro_option,
      mealDistribution: data.meal_distribution,
      previousDietHistory: data.previous_diet_history,
      metabolicAdaptation: data.metabolic_adaptation,
      preferences: data.preferences || { likes: [], dislikes: [], allergies: [], intolerances: [], portionPreferences: {} },
      acceptedMealIds: data.accepted_meal_ids || [],
      rejectedMealIds: data.rejected_meal_ids || [],
      favoriteMealIds: data.favorite_meal_ids || [],
      favoriteIngredientIds: data.favorite_ingredient_ids || [],
      isAdmin: data.is_admin || false
    };
    
    return c.json(user);
  } catch (error) {
    console.error("[GET /user/:email] Error getting user:", error);
    return c.json({ error: "Failed to get user", details: error?.message }, 500);
  }
});

// Save/update user in users table
app.post("/make-server-b0e879f0/user", async (c) => {
  try {
    const user = await c.req.json();
    
    // ===== VALIDACIONES COMPLETAS =====
    
    // 1. Validar campos obligatorios
    if (!user.email) {
      return c.json({ error: "Email es requerido" }, 400);
    }
    
    if (!user.name || user.name.trim() === '') {
      return c.json({ error: "Nombre es requerido" }, 400);
    }
    
    if (!user.sex || !['male', 'female'].includes(user.sex)) {
      return c.json({ error: "Sexo debe ser 'male' o 'female'" }, 400);
    }
    
    // 2. Validar rangos numéricos
    if (user.age !== undefined && user.age !== null) {
      if (typeof user.age !== 'number' || user.age < 15 || user.age > 100) {
        return c.json({ error: "Edad debe estar entre 15 y 100 años" }, 400);
      }
    }
    
    if (user.weight !== undefined && user.weight !== null) {
      if (typeof user.weight !== 'number' || user.weight < 30 || user.weight > 300) {
        return c.json({ error: "Peso debe estar entre 30 y 300 kg" }, 400);
      }
    }
    
    if (user.height !== undefined && user.height !== null) {
      if (typeof user.height !== 'number' || user.height < 100 || user.height > 250) {
        return c.json({ error: "Altura debe estar entre 100 y 250 cm" }, 400);
      }
    }
    
    if (user.bodyFatPercentage !== undefined && user.bodyFatPercentage !== null) {
      if (typeof user.bodyFatPercentage !== 'number' || user.bodyFatPercentage < 3 || user.bodyFatPercentage > 60) {
        return c.json({ error: "Porcentaje de grasa debe estar entre 3% y 60%" }, 400);
      }
    }
    
    // 3. Validar macros si existen
    if (user.goals) {
      if (user.goals.calories !== undefined && (user.goals.calories < 800 || user.goals.calories > 6000)) {
        return c.json({ error: "Calorías deben estar entre 800 y 6000 kcal" }, 400);
      }
      
      if (user.goals.protein !== undefined && (user.goals.protein < 30 || user.goals.protein > 500)) {
        return c.json({ error: "Proteína debe estar entre 30g y 500g" }, 400);
      }
      
      if (user.goals.carbs !== undefined && (user.goals.carbs < 20 || user.goals.carbs > 800)) {
        return c.json({ error: "Carbohidratos deben estar entre 20g y 800g" }, 400);
      }
      
      if (user.goals.fat !== undefined && (user.goals.fat < 20 || user.goals.fat > 300)) {
        return c.json({ error: "Grasas deben estar entre 20g y 300g" }, 400);
      }
    }
    
    // 4. Validar distribución de comidas si existe
    if (user.mealDistribution) {
      const total = Object.values(user.mealDistribution).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
      if (Math.abs(total - 100) > 0.1) {
        return c.json({ error: "La distribución de comidas debe sumar 100%" }, 400);
      }
    }
    
    // ===== FIN VALIDACIONES =====
    
    console.log(`[POST /user] ✅ Validaciones pasadas, guardando usuario: ${user.email}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get auth user ID from email
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error(`[POST /user] Error getting auth users:`, authError);
      return c.json({ error: "Failed to get auth user", details: authError.message }, 500);
    }
    
    let authUser = authUsers.users.find(u => u.email === user.email);
    if (!authUser) {
      console.log(`[POST /user] Auth user not found for email: ${user.email}, creating...`);
      
      // Create auth user with a default password (user should change it later)
      const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: 'ChangeMe123!', // Default password - user should change it
        email_confirm: true,
        user_metadata: { name: user.name }
      });
      
      if (createError || !newAuthUser.user) {
        console.error(`[POST /user] Failed to create auth user:`, createError);
        return c.json({ error: "Failed to create auth user", details: createError?.message }, 500);
      }
      
      authUser = newAuthUser.user;
      console.log(`[POST /user] Auth user created successfully: ${authUser.id}`);
    } else {
      console.log(`[POST /user] Auth user found: ${authUser.id}`);
    }
    
    // Transform app format to database format
    const dbUser = {
      id: authUser.id,
      email: user.email,
      name: user.name,
      sex: user.sex,
      age: user.age,
      birthdate: user.birthdate,
      weight: user.weight,
      height: user.height,
      body_fat_percentage: user.bodyFatPercentage,
      lean_body_mass: user.leanBodyMass,
      training_frequency: user.trainingFrequency || 0,
      training_intensity: user.trainingIntensity,
      training_type: user.trainingType,
      training_time_preference: user.trainingTimePreference,
      lifestyle_activity: user.lifestyleActivity,
      occupation: user.occupation,
      daily_steps: user.dailySteps,
      goal: user.goal,
      meals_per_day: user.mealsPerDay || 4,
      target_calories: user.goals?.calories || 2000,
      target_protein: user.goals?.protein || 150,
      target_carbs: user.goals?.carbs || 200,
      target_fat: user.goals?.fat || 60,
      selected_macro_option: user.selectedMacroOption,
      meal_distribution: user.mealDistribution || { breakfast: 25, lunch: 30, snack: 15, dinner: 30 },
      previous_diet_history: user.previousDietHistory,
      metabolic_adaptation: user.metabolicAdaptation,
      preferences: user.preferences || { likes: [], dislikes: [], allergies: [], intolerances: [], portionPreferences: {} },
      accepted_meal_ids: user.acceptedMealIds || [],
      rejected_meal_ids: user.rejectedMealIds || [],
      favorite_meal_ids: user.favoriteMealIds || [],
      favorite_ingredient_ids: user.favoriteIngredientIds || [],
      is_admin: user.isAdmin || false,
      updated_at: new Date().toISOString()
    };
    
    // Upsert (insert or update)
    const { data, error } = await supabase
      .from('users')
      .upsert(dbUser, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) {
      console.error(`[POST /user] Database error:`, error);
      return c.json({ error: "Failed to save user", details: error.message }, 500);
    }
    
    console.log(`[POST /user] User saved successfully to users table: ${user.email} with ID: ${authUser.id}`);
    
    return c.json({ success: true, user });
  } catch (error) {
    console.error("[POST /user] Error saving user:", error.message);
    return c.json({ error: "Failed to save user", details: error.message }, 500);
  }
});

// ===== DAILY LOGS ENDPOINTS =====

// Get all daily logs for a user from daily_logs table
app.get("/make-server-b0e879f0/daily-logs/:email", async (c) => {
  try {
    const email = c.req.param("email");
    console.log(`[GET /daily-logs/:email] Fetching logs from daily_logs table for: ${email}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First get user_id from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.log(`[GET /daily-logs/:email] User not found, returning empty array`);
      return c.json([]);
    }
    
    // Get logs for this user
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userData.id)
      .order('log_date', { ascending: false });
    
    if (error) {
      console.error(`[GET /daily-logs/:email] Database error:`, error);
      return c.json([]);
    }
    
    // Transform to app format
    const logs = (data || []).map(log => ({
      date: log.log_date,
      breakfast: log.breakfast,
      lunch: log.lunch,
      snack: log.snack,
      dinner: log.dinner,
      extraFoods: log.extra_foods || [],
      complementaryMeals: log.complementary_meals || [],
      weight: log.weight ? parseFloat(log.weight) : undefined,
      isSaved: log.is_saved || false,
      notes: log.notes
    }));
    
    console.log(`[GET /daily-logs/:email] Found ${logs.length} logs`);
    return c.json(logs);
  } catch (error) {
    console.error("[GET /daily-logs/:email] Error getting daily logs:", error.message);
    return c.json([]);
  }
});

// Save daily logs for a user to daily_logs table
app.post("/make-server-b0e879f0/daily-logs", async (c) => {
  try {
    const { email, logs } = await c.req.json();
    
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }
    
    console.log(`[POST /daily-logs] Saving ${logs?.length || 0} logs to daily_logs table for: ${email}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user_id from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.warn(`[POST /daily-logs] User not found in users table: ${email}. User profile needs to be saved first. Skipping save (will retry on next change).`);
      // Return success but don't save anything - this allows the frontend to continue
      // and the effect will retry when data changes again
      return c.json({ success: true, skipped: true, reason: "User profile not yet created" });
    }
    
    // Delete all existing logs for this user
    await supabase
      .from('daily_logs')
      .delete()
      .eq('user_id', userData.id);
    
    // Insert new logs
    if (logs && logs.length > 0) {
      const dbLogs = logs.map(log => ({
        user_id: userData.id,
        log_date: log.date,
        breakfast: log.breakfast,
        lunch: log.lunch,
        snack: log.snack,
        dinner: log.dinner,
        extra_foods: log.extraFoods || [],
        complementary_meals: log.complementaryMeals || [],
        weight: log.weight,
        is_saved: log.isSaved || false,
        notes: log.notes
      }));
      
      const { error } = await supabase
        .from('daily_logs')
        .insert(dbLogs);
      
      if (error) {
        console.error(`[POST /daily-logs] Database error:`, error);
        return c.json({ error: "Failed to save daily logs", details: error.message }, 500);
      }
    }
    
    console.log(`[POST /daily-logs] Logs saved successfully`);
    return c.json({ success: true });
  } catch (error) {
    console.error("[POST /daily-logs] Error saving daily logs:", error.message);
    return c.json({ error: "Failed to save daily logs", details: error.message }, 500);
  }
});

// ===== SAVED DIETS ENDPOINTS =====

// Get saved diets for a user from saved_diets table
app.get("/make-server-b0e879f0/saved-diets/:email", async (c) => {
  try {
    const email = c.req.param("email");
    console.log(`[GET /saved-diets/:email] Fetching diets from saved_diets table for: ${email}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user_id from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.log(`[GET /saved-diets/:email] User not found, returning empty array`);
      return c.json([]);
    }
    
    // Get diets for this user
    const { data, error } = await supabase
      .from('saved_diets')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`[GET /saved-diets/:email] Database error:`, error);
      return c.json([]);
    }
    
    // Transform to app format
    const diets = (data || []).map(diet => ({
      id: diet.id,
      name: diet.name,
      description: diet.description,
      breakfast: diet.breakfast,
      lunch: diet.lunch,
      snack: diet.snack,
      dinner: diet.dinner,
      totalCalories: parseFloat(diet.total_calories),
      totalProtein: parseFloat(diet.total_protein),
      totalCarbs: parseFloat(diet.total_carbs),
      totalFat: parseFloat(diet.total_fat),
      tags: diet.tags || [],
      isFavorite: diet.is_favorite || false
    }));
    
    console.log(`[GET /saved-diets/:email] Found ${diets.length} diets`);
    return c.json(diets);
  } catch (error) {
    console.error("[GET /saved-diets/:email] Error getting saved diets:", error.message);
    return c.json([]);
  }
});

// Save diets for a user to saved_diets table
app.post("/make-server-b0e879f0/saved-diets", async (c) => {
  try {
    const { email, diets } = await c.req.json();
    
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }
    
    console.log(`[POST /saved-diets] Saving ${diets?.length || 0} diets to saved_diets table for: ${email}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user_id from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.warn(`[POST /saved-diets] User not found in users table: ${email}. User profile needs to be saved first. Skipping save (will retry on next change).`);
      // Return success but don't save anything - this allows the frontend to continue
      // and the effect will retry when data changes again
      return c.json({ success: true, skipped: true, reason: "User profile not yet created" });
    }
    
    // Delete all existing diets for this user
    await supabase
      .from('saved_diets')
      .delete()
      .eq('user_id', userData.id);
    
    // Insert new diets
    if (diets && diets.length > 0) {
      const dbDiets = diets.map(diet => ({
        id: diet.id,
        user_id: userData.id,
        name: diet.name,
        description: diet.description,
        breakfast: diet.breakfast,
        lunch: diet.lunch,
        snack: diet.snack,
        dinner: diet.dinner,
        total_calories: diet.totalCalories || 0,
        total_protein: diet.totalProtein || 0,
        total_carbs: diet.totalCarbs || 0,
        total_fat: diet.totalFat || 0,
        tags: diet.tags || [],
        is_favorite: diet.isFavorite || false
      }));
      
      const { error } = await supabase
        .from('saved_diets')
        .insert(dbDiets);
      
      if (error) {
        console.error(`[POST /saved-diets] Database error:`, error);
        return c.json({ error: "Failed to save diets", details: error.message }, 500);
      }
    }
    
    console.log(`[POST /saved-diets] Diets saved successfully`);
    return c.json({ success: true });
  } catch (error) {
    console.error("[POST /saved-diets] Error saving diets:", error.message);
    return c.json({ error: "Failed to save diets", details: error.message }, 500);
  }
});

// ===== FAVORITE MEALS ENDPOINTS =====
// NOTE: Favorite meals are now stored in users.favorite_meal_ids array
// These endpoints are kept for compatibility but use the users table

app.get("/make-server-b0e879f0/favorite-meals/:email", async (c) => {
  try {
    const email = c.req.param("email");
    console.log(`[GET /favorite-meals/:email] Fetching favorites from users table for: ${email}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('users')
      .select('favorite_meal_ids')
      .eq('email', email)
      .single();
    
    if (error || !data) {
      return c.json([]);
    }
    
    return c.json(data.favorite_meal_ids || []);
  } catch (error) {
    console.error("[GET /favorite-meals/:email] Error getting favorite meals:", error.message);
    return c.json([]);
  }
});

app.post("/make-server-b0e879f0/favorite-meals", async (c) => {
  try {
    const { email, favorites } = await c.req.json();
    
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }
    
    console.log(`[POST /favorite-meals] Updating favorites in users table for: ${email}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First check if user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.warn(`[POST /favorite-meals] User not found in users table: ${email}. Skipping save (will retry on next change).`);
      return c.json({ success: true, skipped: true, reason: "User profile not yet created" });
    }
    
    const { error } = await supabase
      .from('users')
      .update({ favorite_meal_ids: favorites || [] })
      .eq('email', email);
    
    if (error) {
      console.error(`[POST /favorite-meals] Database error:`, error);
      return c.json({ error: "Failed to save favorites", details: error.message }, 500);
    }
    
    console.log(`[POST /favorite-meals] Favorites saved successfully`);
    return c.json({ success: true });
  } catch (error) {
    console.error("[POST /favorite-meals] Error saving favorite meals:", error.message);
    return c.json({ error: "Failed to save favorite meals", details: error.message }, 500);
  }
});

// ===== BUG REPORTS ENDPOINTS =====

// Get all bug reports from bug_reports table
app.get("/make-server-b0e879f0/bug-reports", async (c) => {
  try {
    console.log('[GET /bug-reports] Fetching bug reports from bug_reports table');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('bug_reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[GET /bug-reports] Database error:', error);
      return c.json({ error: "Failed to get bug reports", details: error.message }, 500);
    }
    
    // Transform to app format
    const reports = (data || []).map(report => ({
      id: report.id,
      userId: report.user_id,
      userEmail: report.user_email,
      userName: report.user_name,
      title: report.title,
      description: report.description,
      category: report.category,
      priority: report.priority,
      status: report.status,
      adminNotes: report.admin_notes,
      resolvedAt: report.resolved_at,
      createdAt: report.created_at
    }));
    
    console.log(`[GET /bug-reports] Found ${reports.length} reports`);
    return c.json(reports);
  } catch (error) {
    console.error("[GET /bug-reports] Error getting bug reports:", error);
    return c.json({ error: "Failed to get bug reports", details: error.message }, 500);
  }
});

// Save bug reports to bug_reports table
app.post("/make-server-b0e879f0/bug-reports", async (c) => {
  try {
    const { reports } = await c.req.json();
    console.log(`[POST /bug-reports] Saving ${reports?.length || 0} bug reports to bug_reports table`);
    
    if (!Array.isArray(reports)) {
      console.error('[POST /bug-reports] Invalid data: reports is not an array');
      return c.json({ error: "Reports must be an array" }, 400);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Delete all existing reports
    await supabase.from('bug_reports').delete().neq('id', '');
    
    // Insert new reports
    if (reports.length > 0) {
      const dbReports = reports.map(report => ({
        id: report.id,
        user_id: report.userId,
        user_email: report.userEmail,
        user_name: report.userName,
        title: report.title,
        description: report.description,
        category: report.category,
        priority: report.priority,
        status: report.status || 'pending',
        admin_notes: report.adminNotes,
        resolved_at: report.resolvedAt
      }));
      
      const { error } = await supabase
        .from('bug_reports')
        .insert(dbReports);
      
      if (error) {
        console.error('[POST /bug-reports] Database error:', error);
        return c.json({ error: "Failed to save bug reports", details: error.message }, 500);
      }
    }
    
    console.log(`[POST /bug-reports] Successfully saved ${reports.length} reports`);
    return c.json({ success: true });
  } catch (error) {
    console.error("[POST /bug-reports] Error saving bug reports:", error);
    return c.json({ error: "Failed to save bug reports", details: error.message }, 500);
  }
});

// ===== GLOBAL MEALS ENDPOINTS (ADMIN) =====

// Get all global meals from base_meals table
app.get("/make-server-b0e879f0/global-meals", async (c) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('base_meals')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error getting global meals:', error);
      return c.json({ error: "Failed to get global meals" }, 500);
    }
    
    // Transform to app format
    const meals = (data || []).map(meal => ({
      id: meal.id,
      name: meal.name,
      mealTypes: meal.meal_types,
      variant: meal.variant,
      calories: parseFloat(meal.calories),
      protein: parseFloat(meal.protein),
      carbs: parseFloat(meal.carbs),
      fat: parseFloat(meal.fat),
      baseQuantity: parseFloat(meal.base_quantity),
      ingredients: meal.ingredients || [],
      ingredientReferences: meal.ingredient_references,
      preparationSteps: meal.preparation_steps || [],
      tips: meal.tips || []
    }));
    
    return c.json(meals);
  } catch (error) {
    console.error("Error getting global meals:", error);
    return c.json({ error: "Failed to get global meals" }, 500);
  }
});

// Save global meals to base_meals table
app.post("/make-server-b0e879f0/global-meals", async (c) => {
  try {
    const { meals } = await c.req.json();
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Delete all existing base meals
    await supabase.from('base_meals').delete().neq('id', '');
    
    // Insert new meals
    if (meals && meals.length > 0) {
      const dbMeals = meals.map(meal => ({
        id: meal.id,
        name: meal.name,
        meal_types: meal.mealTypes,
        variant: meal.variant,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        base_quantity: meal.baseQuantity || 100,
        ingredients: meal.ingredients || [],
        ingredient_references: meal.ingredientReferences,
        preparation_steps: meal.preparationSteps || [],
        tips: meal.tips || []
      }));
      
      const { error } = await supabase
        .from('base_meals')
        .insert(dbMeals);
      
      if (error) {
        console.error('Error saving global meals:', error);
        return c.json({ error: "Failed to save global meals" }, 500);
      }
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error saving global meals:", error);
    return c.json({ error: "Failed to save global meals" }, 500);
  }
});

// ===== GLOBAL INGREDIENTS ENDPOINTS (ADMIN) =====

// Get all global ingredients from base_ingredients table
app.get("/make-server-b0e879f0/global-ingredients", async (c) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('base_ingredients')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error getting global ingredients:', error);
      return c.json({ error: "Failed to get global ingredients" }, 500);
    }
    
    // Transform to app format
    const ingredients = (data || []).map(ing => ({
      id: ing.id,
      name: ing.name,
      calories: parseFloat(ing.calories),
      protein: parseFloat(ing.protein),
      carbs: parseFloat(ing.carbs),
      fat: parseFloat(ing.fat),
      category: ing.category
    }));
    
    return c.json(ingredients);
  } catch (error) {
    console.error("Error getting global ingredients:", error);
    return c.json({ error: "Failed to get global ingredients" }, 500);
  }
});

// Save global ingredients to base_ingredients table
app.post("/make-server-b0e879f0/global-ingredients", async (c) => {
  try {
    const { ingredients } = await c.req.json();
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Delete all existing base ingredients
    await supabase.from('base_ingredients').delete().neq('id', '');
    
    // Insert new ingredients
    if (ingredients && ingredients.length > 0) {
      const dbIngredients = ingredients.map(ing => ({
        id: ing.id,
        name: ing.name,
        calories: ing.calories,
        protein: ing.protein,
        carbs: ing.carbs,
        fat: ing.fat,
        category: ing.category
      }));
      
      const { error } = await supabase
        .from('base_ingredients')
        .insert(dbIngredients);
      
      if (error) {
        console.error('Error saving global ingredients:', error);
        return c.json({ error: "Failed to save global ingredients" }, 500);
      }
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error saving global ingredients:", error);
    return c.json({ error: "Failed to save global ingredients" }, 500);
  }
});

// ===== TRAINING ENDPOINTS =====

// Get training data for user
app.get("/make-server-b0e879f0/training/:email", async (c) => {
  try {
    const email = c.req.param("email");
    console.log(`[GET /training] Fetching training data for: ${email}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user_id from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.log(`[GET /training] User not found: ${email}`);
      return c.json(null);
    }
    
    // Get training data from training_data table
    const { data, error } = await supabase
      .from('training_data')
      .select('training_config')
      .eq('user_id', userData.id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`[GET /training] No training data found for ${email}`);
        return c.json(null);
      }
      throw error;
    }
    
    console.log(`[GET /training] Training data found for ${email}`);
    return c.json(data.training_config);
  } catch (error) {
    console.error("[GET /training] Error:", error);
    return c.json({ error: "Failed to get training data", details: error.message }, 500);
  }
});

// Save training data for user
app.post("/make-server-b0e879f0/training", async (c) => {
  try {
    const { email, trainingData } = await c.req.json();
    console.log(`[POST /training] Saving training data for: ${email}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user_id from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.warn(`[POST /training] User not found: ${email}. Skipping save.`);
      return c.json({ success: true, skipped: true });
    }
    
    // Upsert training data
    const { error } = await supabase
      .from('training_data')
      .upsert({
        user_id: userData.id,
        training_config: trainingData
      }, {
        onConflict: 'user_id'
      });
    
    if (error) throw error;
    
    console.log(`[POST /training] Successfully saved training data for ${email}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("[POST /training] Error:", error);
    return c.json({ error: "Failed to save training data", details: error.message }, 500);
  }
});

// Get completed workouts for user
app.get("/make-server-b0e879f0/training-completed/:email", async (c) => {
  try {
    const email = c.req.param("email");
    console.log(`[GET /training-completed] Fetching completed workouts for: ${email}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user_id from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.log(`[GET /training-completed] User not found: ${email}`);
      return c.json([]);
    }
    
    // Get completed workouts from completed_workouts table
    const { data, error } = await supabase
      .from('completed_workouts')
      .select('*')
      .eq('user_id', userData.id)
      .order('workout_date', { ascending: false });
    
    if (error) {
      console.error(`[GET /training-completed] Database error:`, error);
      return c.json([]);
    }
    
    // Transform to app format
    const workouts = (data || []).map(workout => ({
      date: workout.workout_date,
      dayIndex: workout.day_index,
      exercises: workout.exercises_completed,
      duration: workout.duration_minutes,
      notes: workout.notes
    }));
    
    console.log(`[GET /training-completed] Found ${workouts.length} completed workouts for ${email}`);
    return c.json(workouts);
  } catch (error) {
    console.error("[GET /training-completed] Error:", error);
    return c.json({ error: "Failed to get completed workouts", details: error.message }, 500);
  }
});

// Save completed workouts for user
app.post("/make-server-b0e879f0/training-completed", async (c) => {
  try {
    const { email, completedWorkouts } = await c.req.json();
    console.log(`[POST /training-completed] Saving ${completedWorkouts?.length || 0} completed workouts for: ${email}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user_id from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.warn(`[POST /training-completed] User not found: ${email}. Skipping save.`);
      return c.json({ success: true, skipped: true });
    }
    
    // Delete existing completed workouts for this user
    await supabase
      .from('completed_workouts')
      .delete()
      .eq('user_id', userData.id);
    
    // Insert new completed workouts
    if (completedWorkouts && completedWorkouts.length > 0) {
      const dbWorkouts = completedWorkouts.map(workout => ({
        user_id: userData.id,
        workout_date: workout.date,
        day_index: workout.dayIndex,
        exercises_completed: workout.exercises,
        duration_minutes: workout.duration,
        notes: workout.notes
      }));
      
      const { error } = await supabase
        .from('completed_workouts')
        .insert(dbWorkouts);
      
      if (error) {
        console.error(`[POST /training-completed] Database error:`, error);
        return c.json({ error: "Failed to save completed workouts", details: error.message }, 500);
      }
    }
    
    console.log(`[POST /training-completed] Successfully saved completed workouts for ${email}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("[POST /training-completed] Error:", error);
    return c.json({ error: "Failed to save completed workouts", details: error.message }, 500);
  }
});

// Get training plan for user
app.get("/make-server-b0e879f0/training-plan/:email", async (c) => {
  try {
    const email = c.req.param("email");
    console.log(`[GET /training-plan] Fetching training plan for: ${email}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user_id from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.log(`[GET /training-plan] User not found: ${email}`);
      return c.json(null);
    }
    
    // Get training plan from training_plans table
    const { data, error } = await supabase
      .from('training_plans')
      .select('week_plan, plan_name')
      .eq('user_id', userData.id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`[GET /training-plan] No training plan found for ${email}`);
        return c.json(null);
      }
      throw error;
    }
    
    console.log(`[GET /training-plan] Training plan found for ${email}`);
    return c.json(data.week_plan);
  } catch (error) {
    console.error("[GET /training-plan] Error:", error);
    return c.json({ error: "Failed to get training plan", details: error.message }, 500);
  }
});

// Save training plan for user
app.post("/make-server-b0e879f0/training-plan", async (c) => {
  try {
    const { email, weekPlan } = await c.req.json();
    console.log(`[POST /training-plan] Saving training plan for: ${email}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user_id from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.warn(`[POST /training-plan] User not found: ${email}. Skipping save.`);
      return c.json({ success: true, skipped: true });
    }
    
    // Upsert training plan
    const { error } = await supabase
      .from('training_plans')
      .upsert({
        user_id: userData.id,
        week_plan: weekPlan,
        plan_name: 'Active Plan'
      }, {
        onConflict: 'user_id'
      });
    
    if (error) throw error;
    
    console.log(`[POST /training-plan] Successfully saved training plan for ${email}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("[POST /training-plan] Error:", error);
    return c.json({ error: "Failed to save training plan", details: error.message }, 500);
  }
});

// ===== CSV IMPORT ENDPOINTS =====

app.post("/make-server-b0e879f0/import-ingredients-csv", async (c) => {
  try {
    const { csvData } = await c.req.json();
    
    // Parse CSV (simple implementation)
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const ingredients = [];
    const errors = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim());
      const ingredient = {
        id: values[0] || `ing_${Date.now()}_${i}`,
        name: values[1],
        calories: parseFloat(values[2]) || 0,
        protein: parseFloat(values[3]) || 0,
        carbs: parseFloat(values[4]) || 0,
        fat: parseFloat(values[5]) || 0,
        category: values[6] || 'other'
      };
      
      if (!ingredient.name) {
        errors.push(`Line ${i + 1}: Missing name`);
        continue;
      }
      
      ingredients.push(ingredient);
    }
    
    // Save to database
    if (ingredients.length > 0) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { error } = await supabase.from('base_ingredients').insert(ingredients);
      
      if (error) {
        return c.json({ success: false, error: error.message }, 500);
      }
    }
    
    return c.json({ 
      success: true, 
      stats: { imported: ingredients.length, errors: errors.length },
      errors 
    });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post("/make-server-b0e879f0/import-meals-csv", async (c) => {
  try {
    const { csvData } = await c.req.json();
    
    // Similar to ingredients import
    return c.json({ success: true, stats: { imported: 0, errors: 0 }, errors: [] });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ===== CUSTOM MEALS ENDPOINTS =====

// Get custom meals for user
app.get("/make-server-b0e879f0/custom-meals/:email", async (c) => {
  try {
    const email = c.req.param('email');
    console.log(`[GET /custom-meals] Fetching custom meals for: ${email}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('custom_meals')
      .eq('email', email)
      .single();
    
    if (error || !userData) {
      console.log(`[GET /custom-meals] User not found: ${email}, returning empty array`);
      return c.json([]);
    }
    
    const customMeals = userData.custom_meals || [];
    console.log(`[GET /custom-meals] Found ${customMeals.length} custom meals`);
    return c.json(customMeals);
  } catch (error) {
    console.error("[GET /custom-meals] Error:", error.message);
    return c.json({ error: "Failed to fetch custom meals" }, 500);
  }
});

// Save custom meals for user
app.post("/make-server-b0e879f0/custom-meals", async (c) => {
  try {
    const { email, meals } = await c.req.json();
    console.log(`[POST /custom-meals] Saving ${meals?.length || 0} custom meals for: ${email}`);
    
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.warn(`[POST /custom-meals] User not found: ${email}. Skipping save.`);
      return c.json({ success: true, skipped: true });
    }
    
    const { error } = await supabase
      .from('users')
      .update({ custom_meals: meals || [] })
      .eq('email', email);
    
    if (error) {
      console.error(`[POST /custom-meals] Database error:`, error);
      return c.json({ error: "Failed to save custom meals" }, 500);
    }
    
    console.log(`[POST /custom-meals] Successfully saved ${meals?.length || 0} custom meals`);
    return c.json({ success: true });
  } catch (error) {
    console.error("[POST /custom-meals] Error:", error.message);
    return c.json({ error: "Failed to save custom meals" }, 500);
  }
});

// ===== CUSTOM EXERCISES ENDPOINTS =====

// Get custom exercises for user
app.get("/make-server-b0e879f0/custom-exercises/:email", async (c) => {
  try {
    const email = c.req.param('email');
    console.log(`[GET /custom-exercises] Fetching for: ${email}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('custom_exercises')
      .eq('email', email)
      .single();
    
    if (error || !userData) {
      console.log(`[GET /custom-exercises] User not found: ${email}, returning empty array`);
      return c.json([]);
    }
    
    const customExercises = userData.custom_exercises || [];
    console.log(`[GET /custom-exercises] Found ${customExercises.length} custom exercises`);
    return c.json(customExercises);
  } catch (error) {
    console.error("[GET /custom-exercises] Error:", error.message);
    return c.json({ error: "Failed to fetch custom exercises" }, 500);
  }
});

// Save custom exercises for user
app.post("/make-server-b0e879f0/custom-exercises", async (c) => {
  try {
    const { email, exercises } = await c.req.json();
    console.log(`[POST /custom-exercises] Saving ${exercises?.length || 0} for: ${email}`);
    
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.warn(`[POST /custom-exercises] User not found: ${email}. Skipping save.`);
      return c.json({ success: true, skipped: true });
    }
    
    const { error } = await supabase
      .from('users')
      .update({ custom_exercises: exercises || [] })
      .eq('email', email);
    
    if (error) {
      console.error(`[POST /custom-exercises] Database error:`, error);
      return c.json({ error: "Failed to save custom exercises" }, 500);
    }
    
    console.log(`[POST /custom-exercises] Successfully saved`);
    return c.json({ success: true });
  } catch (error) {
    console.error("[POST /custom-exercises] Error:", error.message);
    return c.json({ error: "Failed to save custom exercises" }, 500);
  }
});

// ===== TRAINING PROGRESS ENDPOINTS =====

// Get training progress for specific date
app.get("/make-server-b0e879f0/training-progress/:email/:date", async (c) => {
  try {
    const email = c.req.param('email');
    const date = c.req.param('date');
    console.log(`[GET /training-progress] Fetching for: ${email} on ${date}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_email', email)
      .eq('date', date)
      .single();
    
    if (error || !data) {
      console.log(`[GET /training-progress] No progress found for ${email} on ${date}`);
      return c.json(null);
    }
    
    console.log(`[GET /training-progress] Found progress for day ${data.day_index}`);
    return c.json({
      dayIndex: data.day_index,
      exerciseReps: data.exercise_reps,
      exerciseWeights: data.exercise_weights,
      timestamp: data.timestamp
    });
  } catch (error) {
    console.error("[GET /training-progress] Error:", error.message);
    return c.json({ error: "Failed to fetch training progress" }, 500);
  }
});

// Save training progress
app.post("/make-server-b0e879f0/training-progress", async (c) => {
  try {
    const { email, date, dayIndex, exerciseReps, exerciseWeights } = await c.req.json();
    console.log(`[POST /training-progress] Saving for: ${email} on ${date}`);
    
    if (!email || !date) {
      return c.json({ error: "Email and date are required" }, 400);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Upsert: insert or update if exists
    const { error } = await supabase
      .from('training_progress')
      .upsert({
        user_email: email,
        date: date,
        day_index: dayIndex,
        exercise_reps: exerciseReps,
        exercise_weights: exerciseWeights,
        timestamp: new Date().toISOString()
      }, {
        onConflict: 'user_email,date'
      });
    
    if (error) {
      console.error(`[POST /training-progress] Database error:`, error);
      return c.json({ error: "Failed to save training progress" }, 500);
    }
    
    console.log(`[POST /training-progress] Successfully saved`);
    return c.json({ success: true });
  } catch (error) {
    console.error("[POST /training-progress] Error:", error.message);
    return c.json({ error: "Failed to save training progress" }, 500);
  }
});

// Delete training progress (when workout completed)
app.delete("/make-server-b0e879f0/training-progress/:email/:date", async (c) => {
  try {
    const email = c.req.param('email');
    const date = c.req.param('date');
    console.log(`[DELETE /training-progress] Deleting for: ${email} on ${date}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('training_progress')
      .delete()
      .eq('user_email', email)
      .eq('date', date);
    
    if (error) {
      console.error(`[DELETE /training-progress] Database error:`, error);
      return c.json({ error: "Failed to delete training progress" }, 500);
    }
    
    console.log(`[DELETE /training-progress] Successfully deleted`);
    return c.json({ success: true });
  } catch (error) {
    console.error("[DELETE /training-progress] Error:", error.message);
    return c.json({ error: "Failed to delete training progress" }, 500);
  }
});

// ===== CUSTOM INGREDIENTS ENDPOINTS =====

// Get custom ingredients for user
app.get("/make-server-b0e879f0/custom-ingredients/:email", async (c) => {
  try {
    const email = c.req.param('email');
    console.log(`[GET /custom-ingredients] Fetching for: ${email}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('custom_ingredients')
      .eq('email', email)
      .single();
    
    if (error || !userData) {
      console.log(`[GET /custom-ingredients] User not found: ${email}, returning empty array`);
      return c.json([]);
    }
    
    const customIngredients = userData.custom_ingredients || [];
    console.log(`[GET /custom-ingredients] Found ${customIngredients.length} custom ingredients`);
    return c.json(customIngredients);
  } catch (error) {
    console.error("[GET /custom-ingredients] Error:", error.message);
    return c.json({ error: "Failed to fetch custom ingredients" }, 500);
  }
});

// Save custom ingredients for user
app.post("/make-server-b0e879f0/custom-ingredients", async (c) => {
  try {
    const { email, ingredients } = await c.req.json();
    console.log(`[POST /custom-ingredients] Saving ${ingredients?.length || 0} for: ${email}`);
    
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.warn(`[POST /custom-ingredients] User not found: ${email}. Skipping save.`);
      return c.json({ success: true, skipped: true });
    }
    
    const { error } = await supabase
      .from('users')
      .update({ custom_ingredients: ingredients || [] })
      .eq('email', email);
    
    if (error) {
      console.error(`[POST /custom-ingredients] Database error:`, error);
      return c.json({ error: "Failed to save custom ingredients" }, 500);
    }
    
    console.log(`[POST /custom-ingredients] Successfully saved`);
    return c.json({ success: true });
  } catch (error) {
    console.error("[POST /custom-ingredients] Error:", error.message);
    return c.json({ error: "Failed to save custom ingredients" }, 500);
  }
});

Deno.serve(app.fetch);