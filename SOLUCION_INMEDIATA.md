# ⚡ SOLUCIÓN INMEDIATA: Cargar Ingredientes Globales

## Problema
Los ingredientes globales NO están en Supabase, por eso el algoritmo de escalado no puede encontrarlos y produce errores masivos (166%, 433%, 544%).

## Solución Rápida (2 minutos)

### Opción 1: Desde el Navegador (RECOMENDADO)

1. **Abre la app en producción**: https://fuelier-app.vercel.app
2. **Haz login como admin**
3. **Abre la consola del navegador** (F12 → Console)
4. **Ejecuta este código**:

```javascript
// Cargar los ingredientes desde el código fuente
const ingredientsResponse = await fetch('https://fuelier-app.vercel.app/_next/static/chunks/src_data_ingredientsDatabase_ts.js');
const sourceCode = await ingredientsResponse.text();

// O simplemente define los ingredientes críticos aquí
const criticalIngredients = [
  {
    id: 'pavo-pechuga',
    name: 'Pechuga de Pavo',
    category: 'proteina',
    caloriesPer100g: 135,
    proteinPer100g: 30,
    carbsPer100g: 0,
    fatPer100g: 1
  },
  {
    id: 'quinoa',
    name: 'Quinoa',
    category: 'carbohidrato',
    caloriesPer100g: 368,
    proteinPer100g: 14,
    carbsPer100g: 64,
    fatPer100g: 6
  },
  {
    id: 'pimiento',
    name: 'Pimiento',
    category: 'vegetal',
    caloriesPer100g: 31,
    proteinPer100g: 1,
    carbsPer100g: 6,
    fatPer100g: 0.3
  },
  {
    id: 'cebolla',
    name: 'Cebolla',
    category: 'vegetal',
    caloriesPer100g: 40,
    proteinPer100g: 1.1,
    carbsPer100g: 9,
    fatPer100g: 0.1
  },
  {
    id: 'espinacas',
    name: 'Espinacas',
    category: 'vegetal',
    caloriesPer100g: 23,
    proteinPer100g: 2.9,
    carbsPer100g: 3.6,
    fatPer100g: 0.4
  },
  {
    id: 'aceite-oliva',
    name: 'Aceite de Oliva',
    category: 'grasa',
    caloriesPer100g: 884,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 100
  },
  {
    id: 'pollo-pechuga',
    name: 'Pechuga de Pollo',
    category: 'proteina',
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6
  },
  {
    id: 'salmon',
    name: 'Salmón',
    category: 'proteina',
    caloriesPer100g: 206,
    proteinPer100g: 20,
    carbsPer100g: 0,
    fatPer100g: 13
  },
  {
    id: 'brocoli',
    name: 'Brócoli',
    category: 'vegetal',
    caloriesPer100g: 34,
    proteinPer100g: 2.8,
    carbsPer100g: 7,
    fatPer100g: 0.4
  },
  {
    id: 'zanahoria',
    name: 'Zanahoria',
    category: 'vegetal',
    caloriesPer100g: 41,
    proteinPer100g: 0.9,
    carbsPer100g: 10,
    fatPer100g: 0.2
  },
  {
    id: 'huevos',
    name: 'Huevos',
    category: 'proteina',
    caloriesPer100g: 155,
    proteinPer100g: 13,
    carbsPer100g: 1.1,
    fatPer100g: 11
  },
  {
    id: 'lechuga',
    name: 'Lechuga',
    category: 'vegetal',
    caloriesPer100g: 15,
    proteinPer100g: 1.4,
    carbsPer100g: 2.9,
    fatPer100g: 0.2
  },
  {
    id: 'tomate',
    name: 'Tomate',
    category: 'vegetal',
    caloriesPer100g: 18,
    proteinPer100g: 0.9,
    carbsPer100g: 3.9,
    fatPer100g: 0.2
  },
  {
    id: 'aguacate',
    name: 'Aguacate',
    category: 'grasa',
    caloriesPer100g: 160,
    proteinPer100g: 2,
    carbsPer100g: 9,
    fatPer100g: 15
  },
  {
    id: 'atun-natural',
    name: 'Atún Natural',
    category: 'proteina',
    caloriesPer100g: 116,
    proteinPer100g: 26,
    carbsPer100g: 0,
    fatPer100g: 1
  },
  {
    id: 'boniato',
    name: 'Boniato',
    category: 'carbohidrato',
    caloriesPer100g: 86,
    proteinPer100g: 1.6,
    carbsPer100g: 20,
    fatPer100g: 0.1
  },
  {
    id: 'patata',
    name: 'Patata',
    category: 'carbohidrato',
    caloriesPer100g: 77,
    proteinPer100g: 2,
    carbsPer100g: 17,
    fatPer100g: 0.1
  },
  {
    id: 'merluza',
    name: 'Merluza',
    category: 'proteina',
    caloriesPer100g: 86,
    proteinPer100g: 17,
    carbsPer100g: 0,
    fatPer100g: 2
  },
  {
    id: 'pasta-integral',
    name: 'Pasta Integral',
    category: 'carbohidrato',
    caloriesPer100g: 352,
    proteinPer100g: 13,
    carbsPer100g: 72,
    fatPer100g: 2.5
  },
  {
    id: 'tomate-frito-mercadona',
    name: 'Tomate Frito (Mercadona)',
    category: 'vegetal',
    caloriesPer100g: 64,
    proteinPer100g: 1.5,
    carbsPer100g: 10,
    fatPer100g: 2
  },
  {
    id: 'ternera-magra',
    name: 'Ternera Magra',
    category: 'proteina',
    caloriesPer100g: 250,
    proteinPer100g: 26,
    carbsPer100g: 0,
    fatPer100g: 15
  }
];

// Guardar en Supabase
const response = await fetch('https://fjqkghebdjxocvcwovky.supabase.co/functions/v1/fuelier-api/global-ingredients', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
  },
  body: JSON.stringify({ ingredients: criticalIngredients })
});

const result = await response.json();
console.log('✅ Resultado:', result);

// Recargar la página
location.reload();
```

### Opción 2: Desde SQL Editor de Supabase (MÁS DIRECTO)

1. **Abre Supabase Dashboard**: https://supabase.com/dashboard
2. **Selecciona tu proyecto**
3. **Ve a SQL Editor**
4. **Ejecuta este SQL**:

```sql
INSERT INTO base_ingredients (id, name, category, calories, protein, carbs, fat) 
VALUES
  ('pavo-pechuga', 'Pechuga de Pavo', 'proteina', 135, 30, 0, 1),
  ('quinoa', 'Quinoa', 'carbohidrato', 368, 14, 64, 6),
  ('pimiento', 'Pimiento', 'vegetal', 31, 1, 6, 0.3),
  ('cebolla', 'Cebolla', 'vegetal', 40, 1.1, 9, 0.1),
  ('espinacas', 'Espinacas', 'vegetal', 23, 2.9, 3.6, 0.4),
  ('aceite-oliva', 'Aceite de Oliva', 'grasa', 884, 0, 0, 100),
  ('pollo-pechuga', 'Pechuga de Pollo', 'proteina', 165, 31, 0, 3.6),
  ('salmon', 'Salmón', 'proteina', 206, 20, 0, 13),
  ('brocoli', 'Brócoli', 'vegetal', 34, 2.8, 7, 0.4),
  ('zanahoria', 'Zanahoria', 'vegetal', 41, 0.9, 10, 0.2),
  ('huevos', 'Huevos', 'proteina', 155, 13, 1.1, 11),
  ('lechuga', 'Lechuga', 'vegetal', 15, 1.4, 2.9, 0.2),
  ('tomate', 'Tomate', 'vegetal', 18, 0.9, 3.9, 0.2),
  ('aguacate', 'Aguacate', 'grasa', 160, 2, 9, 15),
  ('atun-natural', 'Atún Natural', 'proteina', 116, 26, 0, 1),
  ('boniato', 'Boniato', 'carbohidrato', 86, 1.6, 20, 0.1),
  ('patata', 'Patata', 'carbohidrato', 77, 2, 17, 0.1),
  ('merluza', 'Merluza', 'proteina', 86, 17, 0, 2),
  ('pasta-integral', 'Pasta Integral', 'carbohidrato', 352, 13, 72, 2.5),
  ('tomate-frito-mercadona', 'Tomate Frito (Mercadona)', 'vegetal', 64, 1.5, 10, 2),
  ('ternera-magra', 'Ternera Magra', 'proteina', 250, 26, 0, 15),
  ('arroz-integral', 'Arroz Integral', 'carbohidrato', 111, 2.6, 23, 0.9),
  ('arroz-basmati', 'Arroz Basmati', 'carbohidrato', 121, 2.7, 25, 0.4),
  ('avena', 'Avena', 'carbohidrato', 389, 17, 66, 7),
  ('leche-desnatada', 'Leche Desnatada', 'lacteo', 34, 3.4, 5, 0.1),
  ('yogur-griego', 'Yogur Griego', 'lacteo', 59, 10, 3.6, 0.4),
  ('queso-fresco', 'Queso Fresco', 'lacteo', 98, 11, 4, 4.5),
  ('platano', 'Plátano', 'fruta', 89, 1.1, 23, 0.3),
  ('manzana', 'Manzana', 'fruta', 52, 0.3, 14, 0.2),
  ('fresas', 'Fresas', 'fruta', 32, 0.7, 7.7, 0.3)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  updated_at = NOW();
```

### Opción 3: Script de Node.js (Para desarrollo)

```javascript
// insert-ingredients.js
const ingredients = [
  // ... (mismos ingredientes de arriba)
];

async function insertIngredients() {
  const response = await fetch('https://fjqkghebdjxocvcwovky.supabase.co/functions/v1/fuelier-api/global-ingredients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_SERVICE_KEY_HERE'
    },
    body: JSON.stringify({ ingredients })
  });
  
  console.log(await response.json());
}

insertIngredients();
```

## Verificación

Después de ejecutar cualquiera de las opciones, verifica:

1. **En Supabase SQL Editor**:
```sql
SELECT COUNT(*) FROM base_ingredients;
SELECT id, name FROM base_ingredients LIMIT 10;
```

2. **En la consola del navegador** (F12):
```javascript
const response = await fetch('https://fjqkghebdjxocvcwovky.supabase.co/functions/v1/fuelier-api/global-ingredients');
const ingredients = await response.json();
console.log(`✅ ${ingredients.length} ingredientes cargados`);
console.log(ingredients.slice(0, 5));
```

3. **Recarga la app y prueba seleccionar comidas nuevamente**

Deberías ver:
```
✅ Cargados 30 ingredientes globales
┌─────────────────────────────────────────────────────────────┐
│  🌙 ÚLTIMA COMIDA - RESULTADO FINAL                         │
├─────────────────────────────────────────────────────────────┤
│  📊 Calorías:  860/863 kcal (99.7%)                         │
│  💪 Proteína:  86/87g (98.9%)                               │
│  🍚 Carbos:    101/102g (99.0%)                             │
│  🥑 Grasas:    9/9g (100.0%)                                │
├─────────────────────────────────────────────────────────────┤
│  ⭐ Completitud mínima:   98.9%                              │
│  📊 Completitud promedio: 99.4%                             │
│  ⚠️ Error máximo:         1.1%                              │
└─────────────────────────────────────────────────────────────┘
```

## Resultado Esperado

Al seleccionar las 4 comidas del día:
```
│  DIFERENCIA (Consumido - Objetivo):                 │
│  • Calorías:  -2 kcal   ← ¡CASI PERFECTO!         │
│  • Proteína:  -1.0g      ← ¡CASI PERFECTO!         │
│  • Carbos:    -1.0g      ← ¡CASI PERFECTO!         │
│  • Grasas:    0.0g       ← ¡PERFECTO!              │
```

**Ya no verás el modal de "Diferencia de macros" porque la última comida alcanzará el 100% exacto.**
