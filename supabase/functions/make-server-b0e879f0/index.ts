import { Hono } from "npm:hono@4";
import { cors } from "npm:hono@4/cors";
import { logger } from "npm:hono@4/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

// Supabase clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Enable logger
app.use('*', logger(console.log));

// Enable CORS
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// Health check
app.get("/make-server-b0e879f0/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign up
app.post("/make-server-b0e879f0/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    console.log(`[signup] Creating user: ${email}`);
    
    if (!email || !password || !name) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email === email);
    
    if (userExists) {
      return c.json({ 
        error: "Email already registered",
        code: "email_exists"
      }, 409);
    }
    
    // Create user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      if (authError.message?.includes('already been registered')) {
        return c.json({ error: "Email already registered", code: "email_exists" }, 409);
      }
      if (authError.message?.includes('password')) {
        return c.json({ error: "Password too weak", code: "weak_password" }, 400);
      }
      return c.json({ error: authError.message }, 400);
    }

    if (!authData.user) {
      return c.json({ error: "Failed to create user" }, 500);
    }

    // Test login to get token
    const testSupabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: loginData, error: loginError } = await testSupabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (loginError || !loginData.session) {
      console.error('[signup] Login test failed, deleting user');
      await supabase.auth.admin.deleteUser(authData.user.id);
      return c.json({ error: "Account creation failed", code: "login_test_failed" }, 500);
    }
    
    console.log(`[signup] Success: ${email}`);
    
    return c.json({ 
      success: true, 
      access_token: loginData.session.access_token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name
      }
    });
  } catch (error: any) {
    console.error("[signup] Error:", error);
    return c.json({ error: "Failed to sign up", details: error.message }, 500);
  }
});

// Sign in
app.post("/make-server-b0e879f0/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    console.log(`[signin] Attempt: ${email}`);
    
    if (!email || !password) {
      return c.json({ error: "Email and password required" }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error(`[signin] Error: ${error.message}`);
      
      if (error.code === 'invalid_credentials') {
        const diagSupabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: allUsers } = await diagSupabase.auth.admin.listUsers();
        const userExists = allUsers?.users?.find(u => u.email === email);
        
        if (!userExists) {
          return c.json({ error: "User not found", code: "user_not_found" }, 401);
        } else {
          return c.json({ error: "Wrong password", code: "wrong_password" }, 401);
        }
      }
      
      return c.json({ error: error.message }, 401);
    }

    if (!data.session) {
      return c.json({ error: "Failed to create session" }, 500);
    }
    
    console.log(`[signin] Success: ${email}`);

    return c.json({ 
      success: true,
      access_token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });
  } catch (error: any) {
    console.error("[signin] Error:", error);
    return c.json({ error: "Failed to sign in", details: error.message }, 500);
  }
});

// Get session
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
  } catch (error: any) {
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
  } catch (error: any) {
    console.error("Error in signout:", error);
    return c.json({ error: "Failed to sign out" }, 500);
  }
});

// Get user
app.get("/make-server-b0e879f0/user/:email", async (c) => {
  try {
    const email = c.req.param("email");
    console.log(`[get user] ${email}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: "User not found" }, 404);
      }
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
    
    return c.json(user);
  } catch (error: any) {
    console.error("[get user] Error:", error);
    return c.json({ error: "Failed to get user" }, 500);
  }
});

// Save user
app.post("/make-server-b0e879f0/user", async (c) => {
  try {
    const user = await c.req.json();
    console.log(`[save user] ${user.email}`);
    
    if (!user.email || !user.name || !user.sex) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      return c.json({ error: "Failed to get auth user" }, 500);
    }
    
    const authUser = authUsers.users.find(u => u.email === user.email);
    if (!authUser) {
      return c.json({ error: "Auth user not found" }, 404);
    }
    
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
    
    const { data, error } = await supabase
      .from('users')
      .upsert(dbUser, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) {
      console.error(`[save user] Error:`, error);
      return c.json({ error: "Failed to save user" }, 500);
    }
    
    console.log(`[save user] Success: ${user.email}`);
    
    return c.json({ success: true, user });
  } catch (error: any) {
    console.error("[save user] Error:", error);
    return c.json({ error: "Failed to save user" }, 500);
  }
});

Deno.serve(app.fetch);
