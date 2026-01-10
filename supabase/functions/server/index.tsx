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

app.get("/make-server-b0e879f0/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/make-server-b0e879f0/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const email = body.email;
    const password = body.password;
    const name = body.name;
    
    console.log("SIGNUP - Email:", email);
    
    if (!email || !password || !name) {
      console.error("SIGNUP - Missing fields");
      return c.json({ error: "Missing required fields" }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // PASO 1: Verificar si el usuario existe en Auth
    console.log("SIGNUP - Step 1: Checking if user exists in Auth...");
    const listResult = await supabase.auth.admin.listUsers();
    const authUsers = listResult.data?.users || [];
    const existingAuthUser = authUsers.find(u => u.email === email);
    
    if (existingAuthUser) {
      console.log("SIGNUP - User found in Auth, ID:", existingAuthUser.id);
      
      // PASO 2: Verificar si existe en la tabla users
      console.log("SIGNUP - Step 2: Checking if user exists in users table...");
      const dbResult = await supabase
        .from('users')
        .select('id, email')
        .eq('id', existingAuthUser.id)
        .maybeSingle();
      
      const dbUser = dbResult.data;
      
      if (dbUser) {
        // Usuario existe en Auth Y en la tabla users → Es un duplicado real
        console.log("SIGNUP - User exists in both Auth and users table");
        return c.json({ 
          error: "Email already registered", 
          code: "email_exists" 
        }, 409);
      } else {
        // Usuario existe en Auth pero NO en users → Usuario huérfano (signup fallido)
        console.log("SIGNUP - Orphan user found (in Auth but not in users table)");
        console.log("SIGNUP - Deleting orphan user from Auth...");
        
        await supabase.auth.admin.deleteUser(existingAuthUser.id);
        console.log("SIGNUP - Orphan user deleted, will create fresh user");
      }
    }
    
    // PASO 3: Crear usuario en Supabase Auth
    console.log("SIGNUP - Step 3: Creating user in Supabase Auth...");
    const createResult = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { name: name }
    });

    const authData = createResult.data;
    const authError = createResult.error;

    if (authError) {
      console.error("SIGNUP - Auth error:", authError.message);
      const msg = authError.message || "";
      
      // Detectar contraseña débil
      if (msg.includes('password') || msg.includes('Password')) {
        return c.json({ error: "Password too weak", code: "weak_password" }, 400);
      }
      
      return c.json({ error: msg }, 400);
    }

    if (!authData.user) {
      console.error("SIGNUP - No user returned");
      return c.json({ error: "Failed to create user" }, 500);
    }

    console.log("SIGNUP - User created, ID:", authData.user.id);
    
    // PASO 4: Testing login to get token
    console.log("SIGNUP - Step 4: Testing login to get token...");
    const testSupabase = createClient(supabaseUrl, supabaseAnonKey);
    const loginResult = await testSupabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    const loginData = loginResult.data;
    const loginError = loginResult.error;
    
    if (loginError || !loginData.session) {
      console.error('SIGNUP - Login test failed:', loginError?.message);
      console.error('SIGNUP - Deleting user...');
      await supabase.auth.admin.deleteUser(authData.user.id);
      return c.json({ error: "Account creation failed", code: "login_test_failed" }, 500);
    }
    
    console.log("SIGNUP - SUCCESS! Returning token");
    
    return c.json({ 
      success: true, 
      access_token: loginData.session.access_token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name
      }
    });
  } catch (error) {
    console.error("SIGNUP - Exception:", error);
    return c.json({ error: "Failed to sign up" }, 500);
  }
});

app.post("/make-server-b0e879f0/auth/signin", async (c) => {
  try {
    const body = await c.req.json();
    const email = body.email;
    const password = body.password;
    
    console.log("SIGNIN - Email:", email);
    
    if (!email || !password) {
      console.error("SIGNIN - Missing fields");
      return c.json({ error: "Email and password required" }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log("SIGNIN - Attempting signin...");
    const result = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    const data = result.data;
    const error = result.error;

    if (error) {
      console.error("SIGNIN - Error:", error.message, "Code:", error.code);
      
      if (error.code === 'invalid_credentials') {
        const diagSupabase = createClient(supabaseUrl, supabaseServiceKey);
        const listResult = await diagSupabase.auth.admin.listUsers();
        const allUsers = listResult.data;
        const userExists = allUsers?.users?.find(u => u.email === email);
        
        if (!userExists) {
          console.log("SIGNIN - User not found in database");
          return c.json({ error: "User not found", code: "user_not_found" }, 401);
        } else {
          console.log("SIGNIN - User exists but wrong password");
          return c.json({ error: "Wrong password", code: "wrong_password" }, 401);
        }
      }
      
      return c.json({ error: error.message }, 401);
    }

    if (!data.session) {
      console.error("SIGNIN - No session created");
      return c.json({ error: "Failed to create session" }, 500);
    }
    
    console.log("SIGNIN - SUCCESS! User ID:", data.user.id);

    return c.json({ 
      success: true,
      access_token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });
  } catch (error) {
    console.error("SIGNIN - Exception:", error);
    return c.json({ error: "Failed to sign in" }, 500);
  }
});

app.get("/make-server-b0e879f0/auth/session", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: "No authorization header" }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // ✅ CORREGIDO: Crear cliente con el token en los headers
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    const result = await supabase.auth.getUser();
    const data = result.data;
    const error = result.error;

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
    console.error("SESSION - Exception:", error);
    return c.json({ error: "Failed to get session" }, 500);
  }
});

app.post("/make-server-b0e879f0/auth/signout", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: "No authorization header" }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const result = await supabase.auth.admin.signOut(token);
    const error = result.error;

    if (error) {
      console.error("SIGNOUT - Error:", error);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("SIGNOUT - Exception:", error);
    return c.json({ error: "Failed to sign out" }, 500);
  }
});

app.get("/make-server-b0e879f0/user/:email", async (c) => {
  try {
    const email = c.req.param("email");
    console.log("GET USER - Email:", email);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const result = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    const data = result.data;
    const error = result.error;
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log("GET USER - Not found");
        return c.json({ error: "User not found" }, 404);
      }
      console.error("GET USER - Error:", error);
      return c.json({ error: "Failed to get user" }, 500);
    }
    
    if (!data) {
      return c.json({ error: "User not found" }, 404);
    }
    
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
    
    console.log("GET USER - SUCCESS");
    return c.json(user);
  } catch (error) {
    console.error("GET USER - Exception:", error);
    return c.json({ error: "Failed to get user" }, 500);
  }
});

app.post("/make-server-b0e879f0/user", async (c) => {
  try {
    const user = await c.req.json();
    console.log("SAVE USER - Email:", user.email);
    
    if (!user.email || !user.name || !user.sex) {
      console.error("SAVE USER - Missing fields");
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    // ✅ Verificar autenticación
    const authHeader = c.req.header('Authorization');
    console.log("SAVE USER - Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.error("SAVE USER - No authorization header");
      return c.json({ error: "No authorization header" }, 401);
    }
    
    const accessToken = authHeader.replace('Bearer ', '');
    console.log("SAVE USER - Token extracted, length:", accessToken.length);
    
    // ✅ CORREGIDO: Crear cliente con el token del usuario en los headers
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    });
    console.log("SAVE USER - Validating token...");
    
    // Ahora getUser() usará el token del header
    const { data: authData, error: authCheckError } = await supabaseAuth.auth.getUser();
    
    if (authCheckError || !authData.user) {
      console.error("SAVE USER - Invalid token. Error:", authCheckError?.message);
      console.error("SAVE USER - Auth data:", authData);
      return c.json({ 
        error: "Invalid or expired token", 
        details: authCheckError?.message 
      }, 401);
    }
    
    console.log("SAVE USER - ✅ Token valid! Authenticated user ID:", authData.user.id);
    console.log("SAVE USER - Authenticated user email:", authData.user.email);
    
    // Verificar que el email del usuario autenticado coincida con el que está guardando
    if (authData.user.email !== user.email) {
      console.error("SAVE USER - Email mismatch. Token:", authData.user.email, "Body:", user.email);
      return c.json({ error: "Email mismatch" }, 403);
    }
    
    console.log("SAVE USER - Auth verified, proceeding to save");
    
    // Usar SERVICE_ROLE_KEY para escribir en la base de datos
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const dbUser = {
      id: authData.user.id, // ✅ Usar el ID del usuario autenticado
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
    
    console.log("SAVE USER - Upserting to database...");
    const saveResult = await supabase
      .from('users')
      .upsert(dbUser, { onConflict: 'id' })
      .select()
      .single();
    
    const data = saveResult.data;
    const error = saveResult.error;
    
    if (error) {
      console.error("SAVE USER - Database error:", error);
      return c.json({ error: "Failed to save user", details: error.message }, 500);
    }
    
    console.log("SAVE USER - SUCCESS");
    
    return c.json({ success: true, user: user });
  } catch (error) {
    console.error("SAVE USER - Exception:", error);
    return c.json({ error: "Failed to save user" }, 500);
  }
});

Deno.serve(app.fetch);