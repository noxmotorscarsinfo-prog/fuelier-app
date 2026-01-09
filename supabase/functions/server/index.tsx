import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

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

// Health check endpoint
app.get("/make-server-b0e879f0/health", (c) => {
  return c.json({ status: "ok" });
});

// ===== AUTHENTICATION ENDPOINTS =====

// Sign up - Create new user
app.post("/make-server-b0e879f0/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    console.log(`[POST /auth/signup] Attempting signup for: ${email}`);
    
    if (!email || !password || !name) {
      console.error('[POST /auth/signup] Missing required fields');
      return c.json({ error: "Email, password and name are required" }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log(`[POST /auth/signup] Creating user in Supabase Auth...`);
    
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email since we don't have email server configured
      user_metadata: { name }
    });

    if (error) {
      console.error("[POST /auth/signup] Error creating user in Supabase Auth:", error);
      console.error("[POST /auth/signup] Error details:", JSON.stringify(error, null, 2));
      return c.json({ error: error.message }, 400);
    }

    if (!data.user) {
      console.error('[POST /auth/signup] No user returned from Supabase');
      return c.json({ error: "Failed to create user" }, 500);
    }

    console.log(`[POST /auth/signup] User created successfully: ${email}`);
    
    return c.json({ 
      success: true, 
      user: {
        id: data.user.id,
        email: data.user.email,
        name
      }
    });
  } catch (error) {
    console.error("[POST /auth/signup] Error in signup:", error);
    console.error("[POST /auth/signup] Error details:", JSON.stringify(error, null, 2));
    return c.json({ error: "Failed to sign up", details: error.message }, 500);
  }
});

// Sign in - Login user
app.post("/make-server-b0e879f0/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error("Error signing in:", error);
      return c.json({ error: error.message }, 401);
    }

    if (!data.session) {
      return c.json({ error: "Failed to create session" }, 500);
    }

    return c.json({ 
      success: true,
      access_token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });
  } catch (error) {
    console.error("Error in signin:", error);
    return c.json({ error: "Failed to sign in" }, 500);
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

// Get user by email
app.get("/make-server-b0e879f0/user/:email", async (c) => {
  try {
    const email = c.req.param("email");
    console.log(`[GET /user/:email] Fetching user: ${email}`);
    console.log(`[GET /user/:email] Attempting kv.get for key: user:${email}`);
    
    let user;
    try {
      user = await kv.get(`user:${email}`);
      console.log(`[GET /user/:email] kv.get result:`, user ? 'User data found' : 'null');
    } catch (kvError) {
      console.error(`[GET /user/:email] Error from kv.get:`, kvError);
      console.error(`[GET /user/:email] Error message:`, kvError.message);
      
      // If it's a JWT error, treat it as "user not found" instead of server error
      // This happens when the user is new and doesn't exist in the database yet
      if (kvError.message && kvError.message.includes('JWT')) {
        console.log(`[GET /user/:email] JWT error detected, treating as user not found: ${email}`);
        return c.json({ error: "User not found" }, 404);
      }
      
      throw kvError;
    }
    
    if (!user) {
      console.log(`[GET /user/:email] User not found: ${email}`);
      return c.json({ error: "User not found" }, 404);
    }
    
    console.log(`[GET /user/:email] User found: ${email}`);
    return c.json(user);
  } catch (error) {
    console.error("[GET /user/:email] Error getting user:", error);
    console.error("[GET /user/:email] Error message:", error?.message);
    
    // One more check for JWT errors in the outer catch
    if (error?.message && error.message.includes('JWT')) {
      console.log(`[GET /user/:email] JWT error in outer catch, treating as user not found: ${email}`);
      return c.json({ error: "User not found" }, 404);
    }
    
    return c.json({ error: "Failed to get user", details: error?.message }, 500);
  }
});

// Save/update user
app.post("/make-server-b0e879f0/user", async (c) => {
  try {
    const user = await c.req.json();
    
    if (!user.email) {
      return c.json({ error: "Email is required" }, 400);
    }
    
    console.log(`[POST /user] Saving user: ${user.email}`);
    
    try {
      await kv.set(`user:${user.email}`, user);
      console.log(`[POST /user] User saved successfully: ${user.email}`);
    } catch (kvError) {
      console.error(`[POST /user] KV error:`, kvError.message);
      if (kvError.message && kvError.message.includes('JWT')) {
        console.error(`[POST /user] JWT error detected while saving user`);
        return c.json({ error: "Database authentication error", details: kvError.message }, 500);
      }
      throw kvError;
    }
    
    return c.json({ success: true, user });
  } catch (error) {
    console.error("[POST /user] Error saving user:", error.message);
    return c.json({ error: "Failed to save user", details: error.message }, 500);
  }
});

// ===== DAILY LOGS ENDPOINTS =====

// Get all daily logs for a user
app.get("/make-server-b0e879f0/daily-logs/:email", async (c) => {
  try {
    const email = c.req.param("email");
    console.log(`[GET /daily-logs/:email] Fetching logs for: ${email}`);
    
    let logs;
    try {
      logs = await kv.get(`dailyLogs:${email}`);
    } catch (kvError) {
      console.error(`[GET /daily-logs/:email] KV error:`, kvError.message);
      // If JWT error, return empty array instead of failing
      if (kvError.message && kvError.message.includes('JWT')) {
        console.log(`[GET /daily-logs/:email] JWT error, returning empty array`);
        return c.json([]);
      }
      throw kvError;
    }
    
    return c.json(logs || []);
  } catch (error) {
    console.error("[GET /daily-logs/:email] Error getting daily logs:", error.message);
    // Return empty array instead of error to allow app to function
    return c.json([]);
  }
});

// Save daily logs for a user
app.post("/make-server-b0e879f0/daily-logs", async (c) => {
  try {
    const { email, logs } = await c.req.json();
    
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }
    
    console.log(`[POST /daily-logs] Saving logs for: ${email}`);
    
    try {
      await kv.set(`dailyLogs:${email}`, logs);
      console.log(`[POST /daily-logs] Logs saved successfully`);
    } catch (kvError) {
      console.error(`[POST /daily-logs] KV error:`, kvError.message);
      if (kvError.message && kvError.message.includes('JWT')) {
        console.error(`[POST /daily-logs] JWT error detected`);
        return c.json({ error: "Database authentication error", details: kvError.message }, 500);
      }
      throw kvError;
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error("[POST /daily-logs] Error saving daily logs:", error.message);
    return c.json({ error: "Failed to save daily logs", details: error.message }, 500);
  }
});

// ===== SAVED DIETS ENDPOINTS =====

// Get saved diets for a user
app.get("/make-server-b0e879f0/saved-diets/:email", async (c) => {
  try {
    const email = c.req.param("email");
    console.log(`[GET /saved-diets/:email] Fetching diets for: ${email}`);
    
    let diets;
    try {
      diets = await kv.get(`savedDiets:${email}`);
    } catch (kvError) {
      console.error(`[GET /saved-diets/:email] KV error:`, kvError.message);
      // If JWT error, return empty array
      if (kvError.message && kvError.message.includes('JWT')) {
        console.log(`[GET /saved-diets/:email] JWT error, returning empty array`);
        return c.json([]);
      }
      throw kvError;
    }
    
    return c.json(diets || []);
  } catch (error) {
    console.error("[GET /saved-diets/:email] Error getting saved diets:", error.message);
    return c.json([]);
  }
});

// Save diets for a user
app.post("/make-server-b0e879f0/saved-diets", async (c) => {
  try {
    const { email, diets } = await c.req.json();
    
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }
    
    console.log(`[POST /saved-diets] Saving diets for: ${email}`);
    
    try {
      await kv.set(`savedDiets:${email}`, diets);
      console.log(`[POST /saved-diets] Diets saved successfully`);
    } catch (kvError) {
      console.error(`[POST /saved-diets] KV error:`, kvError.message);
      if (kvError.message && kvError.message.includes('JWT')) {
        console.error(`[POST /saved-diets] JWT error detected`);
        return c.json({ error: "Database authentication error", details: kvError.message }, 500);
      }
      throw kvError;
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error("[POST /saved-diets] Error saving diets:", error.message);
    return c.json({ error: "Failed to save diets", details: error.message }, 500);
  }
});

// ===== FAVORITE MEALS ENDPOINTS =====

// Get favorite meal IDs for a user
app.get("/make-server-b0e879f0/favorite-meals/:email", async (c) => {
  try {
    const email = c.req.param("email");
    console.log(`[GET /favorite-meals/:email] Fetching favorites for: ${email}`);
    
    let favorites;
    try {
      favorites = await kv.get(`favoriteMeals:${email}`);
    } catch (kvError) {
      console.error(`[GET /favorite-meals/:email] KV error:`, kvError.message);
      // If JWT error, return empty array
      if (kvError.message && kvError.message.includes('JWT')) {
        console.log(`[GET /favorite-meals/:email] JWT error, returning empty array`);
        return c.json([]);
      }
      throw kvError;
    }
    
    return c.json(favorites || []);
  } catch (error) {
    console.error("[GET /favorite-meals/:email] Error getting favorite meals:", error.message);
    return c.json([]);
  }
});

// Save favorite meal IDs for a user
app.post("/make-server-b0e879f0/favorite-meals", async (c) => {
  try {
    const { email, favorites } = await c.req.json();
    
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }
    
    console.log(`[POST /favorite-meals] Saving favorites for: ${email}`);
    
    try {
      await kv.set(`favoriteMeals:${email}`, favorites);
      console.log(`[POST /favorite-meals] Favorites saved successfully`);
    } catch (kvError) {
      console.error(`[POST /favorite-meals] KV error:`, kvError.message);
      if (kvError.message && kvError.message.includes('JWT')) {
        console.error(`[POST /favorite-meals] JWT error detected`);
        return c.json({ error: "Database authentication error", details: kvError.message }, 500);
      }
      throw kvError;
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error("[POST /favorite-meals] Error saving favorite meals:", error.message);
    return c.json({ error: "Failed to save favorite meals", details: error.message }, 500);
  }
});

// ===== BUG REPORTS ENDPOINTS =====

// Get all bug reports (admin only)
app.get("/make-server-b0e879f0/bug-reports", async (c) => {
  try {
    console.log('[GET /bug-reports] Fetching bug reports');
    const reports = await kv.get("bugReports");
    console.log(`[GET /bug-reports] Found ${reports?.length || 0} reports`);
    
    return c.json(reports || []);
  } catch (error) {
    console.error("[GET /bug-reports] Error getting bug reports:", error);
    console.error("[GET /bug-reports] Error details:", JSON.stringify(error, null, 2));
    return c.json({ error: "Failed to get bug reports", details: error.message }, 500);
  }
});

// Save bug reports
app.post("/make-server-b0e879f0/bug-reports", async (c) => {
  try {
    const { reports } = await c.req.json();
    console.log(`[POST /bug-reports] Saving ${reports?.length || 0} bug reports`);
    
    if (!Array.isArray(reports)) {
      console.error('[POST /bug-reports] Invalid data: reports is not an array');
      return c.json({ error: "Reports must be an array" }, 400);
    }
    
    await kv.set("bugReports", reports);
    console.log(`[POST /bug-reports] Successfully saved ${reports.length} reports`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("[POST /bug-reports] Error saving bug reports:", error);
    console.error("[POST /bug-reports] Error details:", JSON.stringify(error, null, 2));
    return c.json({ error: "Failed to save bug reports", details: error.message }, 500);
  }
});

// ===== GLOBAL MEALS ENDPOINTS (ADMIN) =====

// Get all global meals
app.get("/make-server-b0e879f0/global-meals", async (c) => {
  try {
    const meals = await kv.get("global-meals");
    
    if (!meals) {
      return c.json([]);
    }
    
    return c.json(meals);
  } catch (error) {
    console.error("Error getting global meals:", error);
    return c.json({ error: "Failed to get global meals" }, 500);
  }
});

// Save global meals
app.post("/make-server-b0e879f0/global-meals", async (c) => {
  try {
    const { meals } = await c.req.json();
    await kv.set("global-meals", meals);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error saving global meals:", error);
    return c.json({ error: "Failed to save global meals" }, 500);
  }
});

// ===== GLOBAL INGREDIENTS ENDPOINTS (ADMIN) =====

// Get all global ingredients
app.get("/make-server-b0e879f0/global-ingredients", async (c) => {
  try {
    const ingredients = await kv.get("global-ingredients");
    
    if (!ingredients) {
      return c.json([]);
    }
    
    return c.json(ingredients);
  } catch (error) {
    console.error("Error getting global ingredients:", error);
    return c.json({ error: "Failed to get global ingredients" }, 500);
  }
});

// Save global ingredients
app.post("/make-server-b0e879f0/global-ingredients", async (c) => {
  try {
    const { ingredients } = await c.req.json();
    await kv.set("global-ingredients", ingredients);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error saving global ingredients:", error);
    return c.json({ error: "Failed to save global ingredients" }, 500);
  }
});

// ===== TRAINING COMPLETED ENDPOINTS =====

// Get completed workouts for a user
app.get("/make-server-b0e879f0/training-completed/:email", async (c) => {
  try {
    const email = c.req.param("email");
    console.log(`[GET /training-completed] Request for email: ${email}`);
    
    if (!email) {
      console.log('[GET /training-completed] No email provided, returning empty array');
      return c.json([], 200);
    }
    
    const key = `trainingCompleted:${email}`;
    console.log(`[GET /training-completed] Fetching key: ${key}`);
    
    const completedWorkouts = await kv.get(key);
    console.log(`[GET /training-completed] Retrieved data:`, completedWorkouts ? 'Data found' : 'No data');
    
    // Si no existe o es null, retornar array vacío
    if (!completedWorkouts) {
      console.log('[GET /training-completed] No data found, returning empty array');
      return c.json([], 200);
    }
    
    // Si no es un array, retornar array vacío
    if (!Array.isArray(completedWorkouts)) {
      console.log('[GET /training-completed] Data is not an array, returning empty array');
      return c.json([], 200);
    }
    
    return c.json(completedWorkouts, 200);
  } catch (error) {
    console.error("[GET /training-completed] Error:", error);
    // En caso de error, retornar array vacío para no romper la UI
    return c.json([], 200);
  }
});

// Save completed workouts for a user
app.post("/make-server-b0e879f0/training-completed", async (c) => {
  try {
    const { email, completedWorkouts } = await c.req.json();
    console.log(`[POST /training-completed] Saving workouts for ${email}, count: ${completedWorkouts?.length || 0}`);
    
    if (!email || !completedWorkouts) {
      console.error('[POST /training-completed] Missing required fields');
      return c.json({ error: "Email and completedWorkouts are required" }, 400);
    }
    
    if (!Array.isArray(completedWorkouts)) {
      console.error('[POST /training-completed] completedWorkouts must be an array');
      return c.json({ error: "completedWorkouts must be an array" }, 400);
    }
    
    const key = `trainingCompleted:${email}`;
    console.log(`[POST /training-completed] Saving to key: ${key}`);
    
    await kv.set(key, completedWorkouts);
    console.log(`[POST /training-completed] ✓ Successfully saved ${completedWorkouts.length} completed workouts`);
    
    return c.json({ success: true, message: `Saved ${completedWorkouts.length} completed workouts` }, 200);
  } catch (error) {
    console.error("[POST /training-completed] Error:", error);
    return c.json({ error: `Failed to save completed workouts: ${error.message}` }, 500);
  }
});

// ===== TRAINING PLAN ENDPOINTS =====

// Get training plan for a user
app.get("/make-server-b0e879f0/training-plan/:email", async (c) => {
  try {
    const email = c.req.param("email");
    console.log(`[GET /training-plan] Request for email: ${email}`);
    
    if (!email) {
      console.log('[GET /training-plan] No email provided');
      return c.json({ error: "Email is required" }, 400);
    }
    
    const key = `trainingPlan:${email}`;
    console.log(`[GET /training-plan] Fetching key: ${key}`);
    
    const trainingPlan = await kv.get(key);
    console.log(`[GET /training-plan] Retrieved data:`, trainingPlan ? 'Data found' : 'No data');
    
    // Si no existe o es null, retornar null con status 404
    if (!trainingPlan) {
      console.log('[GET /training-plan] No data found, returning 404');
      return c.json({ error: "Training plan not found" }, 404);
    }
    
    return c.json(trainingPlan, 200);
  } catch (error) {
    console.error("[GET /training-plan] Error:", error);
    return c.json({ error: "Failed to get training plan" }, 500);
  }
});

// Save training plan for a user
app.post("/make-server-b0e879f0/training-plan", async (c) => {
  try {
    const { email, weekPlan } = await c.req.json();
    console.log(`[POST /training-plan] Saving plan for ${email}, days: ${weekPlan?.length || 0}`);
    
    if (!email || !weekPlan) {
      console.error('[POST /training-plan] Missing required fields');
      return c.json({ error: "Email and weekPlan are required" }, 400);
    }
    
    if (!Array.isArray(weekPlan)) {
      console.error('[POST /training-plan] weekPlan must be an array');
      return c.json({ error: "weekPlan must be an array" }, 400);
    }
    
    const key = `trainingPlan:${email}`;
    console.log(`[POST /training-plan] Saving to key: ${key}`);
    
    await kv.set(key, weekPlan);
    console.log(`[POST /training-plan] ✓ Successfully saved training plan with ${weekPlan.length} days`);
    
    return c.json({ success: true, message: `Training plan saved with ${weekPlan.length} days` }, 200);
  } catch (error) {
    console.error("[POST /training-plan] Error:", error);
    return c.json({ error: `Failed to save training plan: ${error.message}` }, 500);
  }
});

Deno.serve(app.fetch);