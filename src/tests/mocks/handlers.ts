import { http, HttpResponse } from 'msw';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:54321/functions/v1/make-server-b0e879f0';

export const handlers = [
  // Auth - Sign Up
  http.post(`${API_BASE_URL}/auth/signup`, async ({ request }) => {
    const body = await request.json() as any;
    
    return HttpResponse.json({
      success: true,
      access_token: 'mock-access-token',
      user: {
        id: 'mock-user-id',
        email: body.email,
        name: body.name,
      },
    });
  }),

  // Auth - Sign In
  http.post(`${API_BASE_URL}/auth/signin`, async ({ request }) => {
    const body = await request.json() as any;

    if (body.email === 'error@test.com') {
      return HttpResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      access_token: 'mock-access-token',
      user: {
        id: 'mock-user-id',
        email: body.email,
      },
    });
  }),

  // Get User
  http.get(`${API_BASE_URL}/user/:email`, ({ params }) => {
    const { email } = params;

    if (email === 'notfound@test.com') {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      id: 'mock-user-id',
      email,
      name: 'Test User',
      sex: 'male',
      age: 30,
      weight: 80,
      height: 180,
      goals: {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 65,
      },
    });
  }),

  // Save User
  http.post(`${API_BASE_URL}/user`, async () => {
    return HttpResponse.json({ success: true });
  }),

  // Get Daily Logs
  http.get(`${API_BASE_URL}/daily-logs/:email`, () => {
    return HttpResponse.json([
      {
        date: '2024-01-01',
        breakfast: null,
        lunch: null,
        snack: null,
        dinner: null,
        extraFoods: [],
        complementaryMeals: [],
        is_saved: false,
      },
    ]);
  }),

  // Save Daily Logs
  http.post(`${API_BASE_URL}/daily-logs`, async () => {
    return HttpResponse.json({ success: true });
  }),

  // Get Saved Diets
  http.get(`${API_BASE_URL}/saved-diets/:email`, () => {
    return HttpResponse.json([]);
  }),

  // Save Diets
  http.post(`${API_BASE_URL}/saved-diets`, async () => {
    return HttpResponse.json({ success: true });
  }),

  // Favorite Meals
  http.get(`${API_BASE_URL}/favorite-meals/:email`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${API_BASE_URL}/favorite-meals`, async () => {
    return HttpResponse.json({ success: true });
  }),
];
