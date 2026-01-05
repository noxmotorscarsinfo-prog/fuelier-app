import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

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

// ===== USER ENDPOINTS =====

// Get user by email
app.get("/make-server-b0e879f0/user/:email", async (c) => {
  try {
    const email = c.req.param("email");
    const user = await kv.get(`user:${email}`);
    
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    
    return c.json(user);
  } catch (error) {
    console.error("Error getting user:", error);
    return c.json({ error: "Failed to get user" }, 500);
  }
});

// Save/update user
app.post("/make-server-b0e879f0/user", async (c) => {
  try {
    const user = await c.req.json();
    
    if (!user.email) {
      return c.json({ error: "Email is required" }, 400);
    }
    
    await kv.set(`user:${user.email}`, user);
    
    return c.json({ success: true, user });
  } catch (error) {
    console.error("Error saving user:", error);
    return c.json({ error: "Failed to save user" }, 500);
  }
});

// ===== DAILY LOGS ENDPOINTS =====

// Get all daily logs for a user
app.get("/make-server-b0e879f0/daily-logs/:email", async (c) => {
  try {
    const email = c.req.param("email");
    const logs = await kv.get(`dailyLogs:${email}`);
    
    return c.json(logs || []);
  } catch (error) {
    console.error("Error getting daily logs:", error);
    return c.json({ error: "Failed to get daily logs" }, 500);
  }
});

// Save daily logs for a user
app.post("/make-server-b0e879f0/daily-logs", async (c) => {
  try {
    const { email, logs } = await c.req.json();
    
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }
    
    await kv.set(`dailyLogs:${email}`, logs);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error saving daily logs:", error);
    return c.json({ error: "Failed to save daily logs" }, 500);
  }
});

// ===== SAVED DIETS ENDPOINTS =====

// Get saved diets for a user
app.get("/make-server-b0e879f0/saved-diets/:email", async (c) => {
  try {
    const email = c.req.param("email");
    const diets = await kv.get(`savedDiets:${email}`);
    
    return c.json(diets || []);
  } catch (error) {
    console.error("Error getting saved diets:", error);
    return c.json({ error: "Failed to get saved diets" }, 500);
  }
});

// Save diets for a user
app.post("/make-server-b0e879f0/saved-diets", async (c) => {
  try {
    const { email, diets } = await c.req.json();
    
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }
    
    await kv.set(`savedDiets:${email}`, diets);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error saving diets:", error);
    return c.json({ error: "Failed to save diets" }, 500);
  }
});

// ===== FAVORITE MEALS ENDPOINTS =====

// Get favorite meal IDs for a user
app.get("/make-server-b0e879f0/favorite-meals/:email", async (c) => {
  try {
    const email = c.req.param("email");
    const favorites = await kv.get(`favoriteMeals:${email}`);
    
    return c.json(favorites || []);
  } catch (error) {
    console.error("Error getting favorite meals:", error);
    return c.json({ error: "Failed to get favorite meals" }, 500);
  }
});

// Save favorite meal IDs for a user
app.post("/make-server-b0e879f0/favorite-meals", async (c) => {
  try {
    const { email, favorites } = await c.req.json();
    
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }
    
    await kv.set(`favoriteMeals:${email}`, favorites);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error saving favorite meals:", error);
    return c.json({ error: "Failed to save favorite meals" }, 500);
  }
});

// ===== BUG REPORTS ENDPOINTS =====

// Get all bug reports (admin only)
app.get("/make-server-b0e879f0/bug-reports", async (c) => {
  try {
    const reports = await kv.get("bugReports");
    
    return c.json(reports || []);
  } catch (error) {
    console.error("Error getting bug reports:", error);
    return c.json({ error: "Failed to get bug reports" }, 500);
  }
});

// Save bug reports
app.post("/make-server-b0e879f0/bug-reports", async (c) => {
  try {
    const { reports } = await c.req.json();
    await kv.set("bugReports", reports);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error saving bug reports:", error);
    return c.json({ error: "Failed to save bug reports" }, 500);
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

Deno.serve(app.fetch);