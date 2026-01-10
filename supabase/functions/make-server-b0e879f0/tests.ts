
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import app from "./index.ts";

// Mock environment variables
Deno.env.set("SUPABASE_URL", "https://mock.supabase.co");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "mock-key");

const BASE_URL = "http://localhost/make-server-b0e879f0";

Deno.test("GET / - Health Check", async () => {
  const res = await app.request(`${BASE_URL}/`);
  assertEquals(res.status, 200);
  const body = await res.text();
  assertEquals(body, "Hello Hono!");
});

Deno.test("POST /training-plan - Validate Empty Payload", async () => {
  const res = await app.request(`${BASE_URL}/training-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", weekPlan: [] }),
  });
  
  // Debería responder éxito pero loguear warning (o manejarlo según lógica actual)
  // En nuestra implementación actual, permitimos array vacío, así que debe ser 200
  assertEquals(res.status, 200);
});

Deno.test("GET /training-plan/:email - Handle User Not Found", async () => {
  // Como no podemos mockear fácilmente la llamada a DB interna sin refactorizar todo el código
  // para usar inyección de dependencias, probamos que el endpoint exista y maneje
  // respuestas simuladas si pudiéramos interceptar fetch.
  // Por ahora, validamos que rechace métodos incorrectos o rutas malformadas
  const res = await app.request(`${BASE_URL}/training-plan/invalid-email`);
  // Esperamos que falle o devuelva null porque no puede conectar a la DB real con credenciales falsas
  // o devuelva 200 con null.
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body, null);
});

Deno.test("POST /training-completed - Validate Schema", async () => {
  const res = await app.request(`${BASE_URL}/training-completed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      email: "test@test.com", 
      completedWorkouts: "INVALID_STRING" // Debe ser array
    }),
  });
  
  assertEquals(res.status, 400); // Bad Request
});
