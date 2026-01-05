# 📋 Plan de Implementación Completo - Panel de Administración

## 🎯 Objetivo
Crear un panel de administración totalmente funcional que permita gestionar toda la aplicación Fuelier desde un solo lugar, incluyendo ingredientes, platos, usuarios, reportes y estadísticas.

---

## ✅ Estado Actual

### ✅ Implementado (100%)
- **Gestión de Ingredientes Base**
  - ✅ CRUD completo (Crear, Leer, Actualizar, Eliminar)
  - ✅ Búsqueda y filtrado por categorías
  - ✅ Categorización inteligente (Carnes, Pescados, Lácteos, Legumbres, etc.)
  - ✅ Sincronización con localStorage
  - ✅ Interfaz moderna con estadísticas

### ❌ Pendiente (0%)
- **Gestión de Platos Base** (Próximamente)
- **Gestión de Usuarios**
- **Gestión de Bug Reports**
- **Dashboard de Estadísticas**
- **Gestión de Platos Personalizados de Usuarios**
- **Gestión de Ingredientes Personalizados de Usuarios**

---

## 📦 Datos Disponibles en la App

### 1. **Ingredientes** (✅ Ya implementado)
- **Base de Datos:** `src/app/data/ingredients.ts`
- **Almacenamiento:** `localStorage.getItem('baseIngredients')`
- **Estructura:**
```typescript
interface Ingredient {
  id: string;
  name: string;
  calories: number; // por 100g
  protein: number;  // por 100g
  carbs: number;    // por 100g
  fat: number;      // por 100g
  isCustom?: boolean;
}
```

### 2. **Platos Base** (❌ Pendiente)
- **Base de Datos:** `src/app/data/mealsGenerator.ts` (200 platos generados)
- **Almacenamiento:** Solo en código, NO en localStorage
- **Estructura:**
```typescript
interface Meal {
  id: string;
  name: string;
  type: MealType | MealType[];
  variant?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  baseQuantity: number;
  isCustom?: boolean;
  isFavorite?: boolean;
  detailedIngredients?: MealIngredient[];
  ingredientReferences?: MealIngredientReference[];
  preparationSteps?: string[];
  tips?: string[];
}
```

### 3. **Platos Personalizados de Usuarios** (❌ Pendiente)
- **Almacenamiento:** `localStorage.getItem('customMeals_${userEmail}')`
- **Funcionalidad:** Cada usuario puede crear sus propios platos
- **Necesidad Admin:** Ver todos los platos personalizados de todos los usuarios

### 4. **Ingredientes Personalizados de Usuarios** (❌ Pendiente)
- **Almacenamiento:** En `user.customIngredients[]`
- **Funcionalidad:** Cada usuario puede crear sus propios ingredientes
- **Necesidad Admin:** Ver todos los ingredientes personalizados de todos los usuarios

### 5. **Usuarios** (❌ Pendiente)
- **Almacenamiento:** `localStorage.getItem('dietUser')` (solo 1 usuario actualmente)
- **Estructura Completa:**
```typescript
interface User {
  // Datos básicos
  email: string;
  name: string;
  sex: 'male' | 'female';
  age: number;
  birthdate?: string;
  weight: number;
  height: number;
  
  // Composición corporal
  bodyFatPercentage?: number;
  leanBodyMass?: number;
  
  // Actividad física
  trainingFrequency: number;
  trainingIntensity?: 'light' | 'moderate' | 'intense';
  trainingType?: 'strength' | 'cardio' | 'mixed' | 'hiit' | 'crossfit';
  lifestyleActivity?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  
  // Objetivos
  goal: 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain';
  mealsPerDay: number;
  goals: MacroGoals;
  mealDistribution?: MealDistribution;
  
  // Historial
  weeklyProgress?: WeeklyProgressRecord[];
  metabolicAdaptation?: {...};
  
  // Preferencias
  preferences: {...};
  customIngredients?: Ingredient[];
  favoriteIngredientIds?: string[];
  isAdmin?: boolean;
}
```

### 6. **Bug Reports** (❌ Pendiente)
- **Almacenamiento:** `localStorage.getItem('bugReports')`
- **Estructura:**
```typescript
interface BugReport {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  title: string;
  description: string;
  category: 'bug' | 'feature' | 'improvement' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
}
```

### 7. **Daily Logs** (❌ Pendiente - solo para estadísticas)
- **Almacenamiento:** `localStorage.getItem('dietLogs')`
- **Uso:** Ver historial de comidas de todos los usuarios

### 8. **Saved Diets** (❌ Pendiente - solo para estadísticas)
- **Almacenamiento:** `localStorage.getItem('savedDiets')`
- **Uso:** Ver plantillas de dietas guardadas

---

## 🏗️ Implementación Requerida

### **FASE 1: Gestión de Platos Base** 🔥 PRIORIDAD ALTA

#### Funcionalidades necesarias:
1. **Listar Platos Base** (200 platos del generador)
   - Vista de grid con cards
   - Búsqueda por nombre
   - Filtro por tipo (breakfast, lunch, snack, dinner)
   - Filtro por rango calórico
   - Filtro por macros (alto en proteína, bajo en carbos, etc.)
   - Paginación (20 platos por página)

2. **Ver Detalle de Plato**
   - Nombre
   - Tipo(s) de comida
   - Macros (calorías, proteína, carbos, grasas)
   - Lista de ingredientes
   - Cantidad base (baseQuantity)
   - Referencias a ingredientes (si existen)

3. **Editar Plato Base**
   - Modificar nombre
   - Modificar tipo(s)
   - Modificar macros manualmente
   - Modificar ingredientes
   - Modificar cantidad base

4. **Crear Plato Base Nuevo**
   - Formulario completo
   - Selección de ingredientes de la base de datos
   - Cálculo automático de macros basado en ingredientes
   - Validaciones

5. **Eliminar Plato Base**
   - Confirmación de eliminación
   - Advertencia si está siendo usado por usuarios

6. **Estadísticas de Platos**
   - Total de platos por tipo
   - Platos más usados (cruzar con dailyLogs)
   - Platos menos usados
   - Distribución calórica promedio

#### Implementación técnica:
```typescript
// Nuevo archivo: src/app/data/mealsManager.ts
export function getBaseMeals(): Meal[] {
  const stored = localStorage.getItem('baseMeals');
  if (stored) {
    return JSON.parse(stored);
  }
  // Primera vez: cargar los 200 platos generados
  const generated = getGeneratedMeals();
  localStorage.setItem('baseMeals', JSON.stringify(generated));
  return generated;
}

export function updateBaseMeal(id: string, meal: Meal): void {
  const meals = getBaseMeals();
  const index = meals.findIndex(m => m.id === id);
  if (index !== -1) {
    meals[index] = meal;
    localStorage.setItem('baseMeals', JSON.stringify(meals));
  }
}

export function addBaseMeal(meal: Meal): void {
  const meals = getBaseMeals();
  meals.push(meal);
  localStorage.setItem('baseMeals', JSON.stringify(meals));
}

export function deleteBaseMeal(id: string): void {
  const meals = getBaseMeals();
  const filtered = meals.filter(m => m.id !== id);
  localStorage.setItem('baseMeals', JSON.stringify(filtered));
}
```

---

### **FASE 2: Gestión de Bug Reports** 🐛 PRIORIDAD MEDIA

#### Funcionalidades necesarias:
1. **Listar Bug Reports**
   - Vista de lista/tabla
   - Filtro por estado (pending, in-progress, resolved, closed)
   - Filtro por prioridad (low, medium, high)
   - Filtro por categoría (bug, feature, improvement, other)
   - Búsqueda por título/descripción
   - Ordenar por fecha (más recientes primero)

2. **Ver Detalle de Bug Report**
   - Toda la información del reporte
   - Información del usuario que lo reportó
   - Fecha de creación

3. **Cambiar Estado**
   - Actualizar estado: pending → in-progress → resolved → closed
   - Agregar notas/comentarios (opcional)

4. **Eliminar Bug Report**
   - Solo si está cerrado
   - Confirmación de eliminación

5. **Estadísticas**
   - Total de reportes por estado
   - Total por prioridad
   - Total por categoría
   - Tasa de resolución

#### Implementación técnica:
```typescript
// Actualizar AdminPanelNew.tsx
const [bugReports, setBugReports] = useState<BugReport[]>([]);

useEffect(() => {
  const stored = localStorage.getItem('bugReports');
  if (stored) {
    setBugReports(JSON.parse(stored));
  }
}, []);

const updateBugReportStatus = (id: string, status: BugReport['status']) => {
  const updated = bugReports.map(report =>
    report.id === id ? { ...report, status } : report
  );
  setBugReports(updated);
  localStorage.setItem('bugReports', JSON.stringify(updated));
};
```

---

### **FASE 3: Gestión de Usuarios** 👥 PRIORIDAD BAJA

#### Funcionalidades necesarias:
1. **Listar Usuarios** (Limitado en esta versión porque solo hay 1 usuario en localStorage)
   - Lista de usuarios (actualmente solo 1)
   - Búsqueda por email/nombre
   - Vista de cards con info básica

2. **Ver Perfil de Usuario**
   - Datos antropométricos
   - Objetivos y macros
   - Progreso semanal
   - Preferencias alimenticias
   - Ingredientes personalizados
   - Platos personalizados

3. **Editar Datos de Usuario** (⚠️ Cuidado: solo con permiso)
   - Modificar macros
   - Modificar preferencias
   - Activar/desactivar permisos de admin

4. **Ver Historial de Usuario**
   - Daily logs
   - Progreso de peso
   - Adherencia

5. **Eliminar Usuario** (⚠️ Muy peligroso)
   - Solo con confirmación múltiple

#### Implementación técnica:
```typescript
// Para multi-usuario en el futuro:
// localStorage.getItem('allUsers') → Array de User
// Actualmente solo existe 'dietUser' (un solo usuario)

const [users, setUsers] = useState<User[]>([]);

useEffect(() => {
  // Cargar usuario actual
  const currentUser = localStorage.getItem('dietUser');
  if (currentUser) {
    setUsers([JSON.parse(currentUser)]);
  }
  
  // Futuro: cargar todos los usuarios de una lista
  // const allUsers = localStorage.getItem('allUsers');
  // if (allUsers) {
  //   setUsers(JSON.parse(allUsers));
  // }
}, []);
```

---

### **FASE 4: Dashboard de Estadísticas** 📊 PRIORIDAD MEDIA

#### Funcionalidades necesarias:
1. **Estadísticas Generales**
   - Total de usuarios (actualmente 1)
   - Total de ingredientes base
   - Total de platos base
   - Total de bug reports

2. **Estadísticas de Uso**
   - Platos más usados (top 10)
   - Ingredientes más usados (top 10)
   - Tipos de comida más populares
   - Promedio de calorías consumidas

3. **Estadísticas de Progreso**
   - Promedio de adherencia de usuarios
   - Tasa de días guardados
   - Tasa de uso de platos personalizados vs base

4. **Gráficos**
   - Gráfico de barras: platos por tipo
   - Gráfico de línea: progreso de peso de usuarios
   - Gráfico circular: distribución de macros

---

### **FASE 5: Gestión de Platos Personalizados de Usuarios** 🍽️ PRIORIDAD BAJA

#### Funcionalidades necesarias:
1. **Ver Todos los Platos Personalizados**
   - De todos los usuarios
   - Filtrar por usuario

2. **Promover Plato a Base**
   - Convertir un plato personalizado en plato base
   - Modificar y limpiar datos si es necesario

3. **Eliminar Platos Spam/Duplicados**
   - Moderación de contenido

---

### **FASE 6: Gestión de Ingredientes Personalizados de Usuarios** 🥗 PRIORIDAD BAJA

#### Funcionalidades necesarias:
1. **Ver Todos los Ingredientes Personalizados**
   - De todos los usuarios
   - Filtrar por usuario

2. **Promover Ingrediente a Base**
   - Convertir un ingrediente personalizado en ingrediente base

3. **Eliminar Ingredientes Spam/Duplicados**
   - Moderación de contenido

---

## 🎨 Estructura de UI Propuesta

### Tabs Principales:
```
┌─────────────────────────────────────────────────────────────┐
│  [Dashboard] [Ingredientes] [Platos] [Usuarios] [Reportes]  │
└─────────────────────────────────────────────────────────────┘
```

### 1. Tab Dashboard
```
┌─────────────────────────────────────────────────┐
│  📊 ESTADÍSTICAS GENERALES                      │
│                                                 │
│  [60 Ingredientes] [200 Platos] [1 Usuario]    │
│  [5 Reportes]                                   │
│                                                 │
│  🔥 PLATOS MÁS USADOS                           │
│  1. Pollo con Arroz (45 veces)                  │
│  2. Ensalada César (32 veces)                   │
│  ...                                            │
│                                                 │
│  📈 GRÁFICOS                                    │
│  [Gráfico de barras]                            │
│  [Gráfico de línea]                             │
└─────────────────────────────────────────────────┘
```

### 2. Tab Ingredientes (✅ Ya implementado)
```
┌─────────────────────────────────────────────────┐
│  🥬 INGREDIENTES BASE                           │
│                                                 │
│  [Búsqueda] [Filtros] [+ Nuevo Ingrediente]    │
│                                                 │
│  Grid de ingredientes...                        │
└─────────────────────────────────────────────────┘
```

### 3. Tab Platos (❌ Próximamente)
```
┌─────────────────────────────────────────────────┐
│  🍽️ PLATOS BASE                                 │
│                                                 │
│  [Búsqueda] [Filtros] [+ Nuevo Plato]          │
│                                                 │
│  Sub-tabs:                                      │
│  [Base (200)] [Personalizados (X)]             │
│                                                 │
│  Grid de platos...                              │
└─────────────────────────────────────────────────┘
```

### 4. Tab Usuarios (❌ Próximamente)
```
┌─────────────────────────────────────────────────┐
│  👥 USUARIOS                                    │
│                                                 │
│  [Búsqueda] [Filtros]                           │
│                                                 │
│  Lista de usuarios...                           │
│  • admin@fuelier.com (Admin)                    │
│                                                 │
│  [Ver Perfil] [Ver Historial] [Editar]         │
└─────────────────────────────────────────────────┘
```

### 5. Tab Reportes (❌ Próximamente)
```
┌─────────────────────────────────────────────────┐
│  🐛 BUG REPORTS & FEATURES                      │
│                                                 │
│  [Estado] [Prioridad] [Categoría]               │
│                                                 │
│  Tabla de reportes:                             │
│  ID | Título | Usuario | Estado | Prioridad    │
│  1  | Bug XX | user@   | Pending| High         │
│  2  | Feat Y | admin@  | Done   | Medium       │
│                                                 │
│  [Ver] [Cambiar Estado] [Eliminar]              │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Plan de Desarrollo Recomendado

### Sprint 1 (Semana 1): Platos Base
- [ ] Crear `mealsManager.ts` con funciones CRUD
- [ ] Migrar platos generados a localStorage (primera vez)
- [ ] UI de listado de platos con búsqueda/filtros
- [ ] UI de detalle de plato
- [ ] UI de edición de plato
- [ ] UI de creación de plato
- [ ] Estadísticas de platos

### Sprint 2 (Semana 2): Bug Reports
- [ ] UI de listado de bug reports
- [ ] UI de detalle de bug report
- [ ] Cambio de estado
- [ ] Filtros y búsqueda
- [ ] Estadísticas

### Sprint 3 (Semana 3): Dashboard de Estadísticas
- [ ] Diseño del dashboard
- [ ] Estadísticas generales
- [ ] Top 10 platos/ingredientes
- [ ] Gráficos básicos

### Sprint 4 (Semana 4): Gestión de Usuarios
- [ ] Listado de usuarios
- [ ] Perfil de usuario
- [ ] Ver historial
- [ ] Edición básica

---

## 🔐 Seguridad y Permisos

### Acceso al Admin:
- ✅ Login exclusivo en `/loginfuelier123456789`
- ✅ Credenciales: `admin@fuelier.com` / `Fuelier2025!`
- ✅ Flag `user.isAdmin` en el objeto User

### Protecciones necesarias:
- Confirmar acciones destructivas (eliminar)
- No permitir eliminar ingredientes/platos en uso
- Backup automático antes de cambios masivos
- Log de acciones de admin (futuro)

---

## 📝 Notas Importantes

1. **LocalStorage vs Base de Datos Real:**
   - Actualmente todo está en localStorage
   - Para multi-usuario real, necesitarás Supabase u otra BD
   - Este plan asume migración futura a Supabase

2. **Multi-Usuario:**
   - La app actual solo soporta 1 usuario (dietUser)
   - Para multi-usuario, necesitas cambiar la arquitectura
   - Sugerencia: `allUsers[]` en localStorage o BD

3. **Sincronización:**
   - Al cambiar ingredientes/platos base, todos los usuarios se afectan
   - Cuidado con romper referencias en platos existentes

4. **Performance:**
   - Con 200 platos + ingredientes, localStorage es viable
   - Con crecimiento, migrar a indexedDB o BD real

---

## ✅ Checklist de Implementación

### Ingredientes
- [x] Listar
- [x] Crear
- [x] Editar
- [x] Eliminar
- [x] Búsqueda
- [x] Filtros
- [x] Estadísticas

### Platos Base
- [ ] Listar
- [ ] Crear
- [ ] Editar
- [ ] Eliminar
- [ ] Búsqueda
- [ ] Filtros por tipo
- [ ] Filtros por macros
- [ ] Estadísticas
- [ ] Ver ingredientes del plato
- [ ] Calcular macros automáticamente

### Bug Reports
- [ ] Listar
- [ ] Ver detalle
- [ ] Cambiar estado
- [ ] Filtrar por estado/prioridad
- [ ] Estadísticas
- [ ] Eliminar

### Usuarios
- [ ] Listar
- [ ] Ver perfil
- [ ] Ver historial
- [ ] Editar datos
- [ ] Estadísticas de uso

### Dashboard
- [ ] Estadísticas generales
- [ ] Top 10 platos
- [ ] Top 10 ingredientes
- [ ] Gráficos de uso
- [ ] Métricas de adherencia

---

## 🎯 Conclusión

El panel de administración actual tiene un **20% de completitud**. Se necesita:

**CRÍTICO (Hacer primero):**
1. ✅ Gestión de ingredientes (HECHO)
2. ❌ Gestión de platos base (PENDIENTE - PRIORIDAD #1)
3. ❌ Gestión de bug reports (PENDIENTE - PRIORIDAD #2)

**IMPORTANTE (Hacer después):**
4. ❌ Dashboard de estadísticas
5. ❌ Gestión de usuarios

**OPCIONAL (Hacer al final):**
6. ❌ Platos personalizados de usuarios
7. ❌ Ingredientes personalizados de usuarios

**Tiempo estimado total:** 4-6 semanas de desarrollo
**Prioridad 1 (Platos Base):** 1-2 semanas
**Prioridad 2 (Bug Reports):** 3-5 días
**Dashboard:** 1 semana
**Usuarios:** 3-5 días
