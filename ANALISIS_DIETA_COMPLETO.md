# 📊 ANÁLISIS COMPLETO: SECCIÓN DE DIETA

**Fecha:** 12 de enero de 2026  
**Estado:** AUDITORÍA COMPLETA

## 🎯 Objetivo
Verificar que toda la sección de dieta es **REAL, FUNCIONAL y CONECTADA** correctamente con:
- ✅ Creación de platos (usuarios + admin)
- ✅ Creación de ingredientes  
- ✅ Selección de platos con macros
- ✅ Comidas extra (guardar + sumar macros)
- ✅ Calendario de progreso
- ✅ Persistencia en BD (Supabase)

---

## 📱 ARQUITECTURA DE COMPONENTES

### 1. **COMPONENTES PRINCIPALES**

| Componente | Archivo | Propósito | Estado |
|-----------|---------|----------|--------|
| Dashboard | `Dashboard.tsx` | Hub central de dieta/entrenamiento | ✅ Funcional |
| MealSelection | `MealSelection.tsx` | Selector de platos por tipo | ✅ Funcional |
| MealDetail | `MealDetail.tsx` | Vista detalle de plato seleccionado | ✅ Funcional |
| ExtraFood | `ExtraFood.tsx` | Agregar comidas extra (snacks, etc) | ⚠️ **REVISAR** |
| ComplementaryMealsWidget | `ComplementaryMealsWidget.tsx` | Widget de comidas recomendadas | ✅ Funcional |
| CreateMeal | `CreateMeal.tsx` | Crear plato personalizado (usuario) | ✅ Funcional (arreglado) |
| MyCustomMeals | `MyCustomMeals.tsx` | Gestor de platos personalizados | ⚠️ **REVISAR** |
| EditCustomMeal | `EditCustomMeal.tsx` | Editar plato personalizado | ✅ Funcional |
| AdminPanel | `AdminPanel.tsx` | Crear platos base (admin) | ✅ Funcional (arreglado) |
| SavedDiets | `SavedDiets.tsx` | Guardar/cargar plantillas de día | ⚠️ **REVISAR** |
| DailySummary | `DailySummary.tsx` | Resumen del día (macros finales) | ✅ Funcional |
| CalendarView | `CalendarView.tsx` | Calendario de progreso | ⚠️ **REVISAR** |

### 2. **FLUJO VISUAL EN APP.tsx**

```
LOGIN → DASHBOARD
  ├─ [Desayuno] → MealSelection → MealDetail → DailyLog.breakfast
  ├─ [Comida] → MealSelection → MealDetail → DailyLog.lunch
  ├─ [Merienda] → MealSelection → MealDetail → DailyLog.snack
  ├─ [Cena] → MealSelection → MealDetail → DailyLog.dinner
  ├─ [+ Comidas Extra] → ExtraFood → DailyLog.extraFoods
  ├─ [Crear Plato] → CreateMeal → saveCustomMeals()
  ├─ [Mis Platos] → MyCustomMeals → list + edit + delete
  ├─ [Guardar Dieta] → SavedDiets → saveSavedDiets()
  └─ [Resumen] → DailySummary + CalendarView
```

---

## 📚 FLUJO DE DATOS

### **NIVEL 1: ESTRUCTURA DE DATOS**

#### `DailyLog` (from types.ts)
```typescript
interface DailyLog {
  date: string;
  breakfast?: Meal;      // Plato seleccionado
  lunch?: Meal;
  snack?: Meal;
  dinner?: Meal;
  extraFoods?: ExtraFood[];        // ⭐ COMIDAS EXTRA
  complementaryMeals?: Meal[];     // Comidas recomendadas
  weight?: number;
  isSaved?: boolean;
}

interface ExtraFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
```

#### `Meal` (from types.ts)
```typescript
interface Meal {
  id: string;
  name: string;
  type: MealType | MealType[];  // 'breakfast', 'lunch', 'snack', 'dinner'
  calories: number;             // ⭐ ENTERO (arreglado)
  protein: number;              // ⭐ ENTERO (arreglado)
  carbs: number;                // ⭐ ENTERO (arreglado)
  fat: number;                  // ⭐ ENTERO (arreglado)
  baseQuantity: number;
  ingredients?: string[];
  ingredientReferences?: MealIngredientReference[];
  detailedIngredients?: any;
  isCustom?: boolean;
  isFavorite?: boolean;
}
```

---

## 🔄 FLUJOS PRINCIPALES

### **FLUJO 1: USUARIO SELECCIONA PLATO**

```
1. Dashboard: Click [Desayuno]
   └─ onAddMeal('breakfast')
2. App.tsx: setSelectedMealType('breakfast')
3. App.tsx: setCurrentScreen('selection')
4. MealSelection monta
   └─ Carga globalMeals desde api.getGlobalMeals()
   └─ Carga customMeals desde api.getCustomMeals(email)
5. Usuario busca/filtra platos
6. Usuario selecciona plato
   └─ onSelectMeal(meal)
7. App.tsx: setSelectedMeal(meal)
8. App.tsx: setCurrentScreen('detail')
9. MealDetail monta
   └─ Muestra plato con macros
   └─ Opción de ajustar cantidad/porciones
10. Usuario click [Seleccionar]
    └─ handleSelectMeal()
11. App.tsx actualiza currentLog[mealType] = meal
12. App.tsx guarda en Supabase: saveDailyLogs()
13. App.tsx vuelve a Dashboard
```

**PUNTO CRÍTICO:** ¿Se actualiza currentLog correctamente en Supabase?

---

### **FLUJO 2: USUARIO AGREGA COMIDA EXTRA**

```
1. Dashboard: Click [+ Comidas Extra]
   └─ onAddExtraFood()
2. App.tsx: setShowExtraFood(true)
3. ExtraFood modal monta
   └─ currentLog.extraFoods (lectura)
4. Usuario ingresa:
   - Nombre: "Café con leche"
   - Calorías: 50
   - Proteína: 2
   - Carbohidratos: 6
   - Grasas: 1
5. Click [Agregar]
   └─ onAdd({ name, calories, protein, carbs, fat })
6. App.tsx maneja en handleAddExtraFood():
   └─ Si currentLog.extraFoods NO existe → crear []
   └─ Agregar comida al array
   └─ Actualizar currentLog
   └─ saveDailyLogs()
7. Modal cierra
8. Dashboard se re-renderiza con nuevos macros totales
```

**PUNTO CRÍTICO:** ¿Se suman macros de extraFoods al total del día?

---

### **FLUJO 3: USUARIO CREA PLATO PERSONALIZADO**

```
1. Dashboard/MealSelection: Click [+ Crear Plato]
   └─ onNavigateToCreateMeal()
2. App.tsx: setCurrentScreen('create-meal')
3. CreateMeal monta
   └─ Carga getBaseIngredients() ✅ ARREGLADO
   └─ Carga getCustomIngredients(email) ✅ ARREGLADO
4. Usuario:
   - Selecciona tipo de comida
   - Agrega ingredientes + cantidades
   - Sistema calcula macros automáticamente ✅ (enteros)
   - Agrega pasos de preparación (opcional)
   - Agrega tips (opcional)
5. Click [Guardar Plato]
   └─ handleSave()
   └─ Crea objeto Meal con macros ENTEROS
   └─ Carga existentes: api.getCustomMeals(email)
   └─ Guarda nuevos: api.saveCustomMeals(email, [...existing, newMeal])
6. Backend recibe POST /custom-meals
   └─ Redondea macros NUEVAMENTE ✅
   └─ Normaliza types
   └─ UPSERT en custom_meals table
7. Éxito: currentScreen = 'dashboard'
```

**PUNTO CRÍTICO:** ¿Se guarda en custom_meals? ¿Aparece en selección después?

---

### **FLUJO 4: ADMIN CREA PLATO BASE**

```
1. Admin abre AdminPanel
2. Tab "Meals"
3. Click [+ Crear Plato Base]
4. Abre formulario inline:
   - Nombre
   - Selecciona ingredientes + cantidades
   - Sistema calcula macros (ENTEROS) ✅
5. Click [Guardar]
   └─ handleSaveMeal()
   └─ Crea Meal object
   └─ Carga existentes: api.getGlobalMeals()
   └─ Guarda nuevos: api.saveGlobalMeals([...existing, newMeal])
6. Backend recibe POST /global-meals ✅ IMPLEMENTADO
   └─ Redondea macros
   └─ Normaliza types
   └─ UPSERT en base_meals table
7. Éxito: Nuevo plato disponible para todos los usuarios
```

**PUNTO CRÍTICO:** ¿Aparece en MealSelection inmediatamente?

---

### **FLUJO 5: GUARDAR DÍA COMPLETO**

```
1. Dashboard: Click [Guardar Día]
   └─ onSaveDay()
2. App.tsx: handleSaveDay()
   └─ Calcula totales de macros:
      - breakfast: macros
      - lunch: macros
      - snack: macros
      - dinner: macros
      - extraFoods: sumar todos
      └─ TOTAL: Σ(todas las comidas)
   └─ currentLog.isSaved = true
   └─ saveDailyLogs(email, [currentLog])
3. Backend recibe POST /daily-logs
   └─ UPSERT en daily_logs table (user_id, date)
4. Éxito: Día guardado
5. CalendarView puede acceder a historial
```

**PUNTO CRÍTICO:** ¿Se suman correctamente extraFoods? ¿Se valida que macros están dentro de metas?

---

### **FLUJO 6: VER PROGRESO EN CALENDARIO**

```
1. Dashboard: Click [Histórico] o [Calendario]
   └─ onNavigateToHistory() o CalendarView
2. CalendarView monta
   └─ Carga dailyLogs desde App (parent)
3. Usuario ve:
   - Días guardados (color verde/checkmark)
   - Días no guardados (gris)
   - Hover: ver macros del día
4. Usuario selecciona día
   └─ Ver desglose: breakfast, lunch, snack, dinner, extra_foods
   └─ Ver si alcanzó objetivos
```

**PUNTO CRÍTICO:** ¿Se muestran extraFoods en historial?

---

## 🔴 PROBLEMAS IDENTIFICADOS

### **PROBLEMA 1: ExtraFood - No hay persistencia clara**
**Ubicación:** `src/app/components/ExtraFood.tsx`  
**Síntoma:** Al agregar comida extra, no se confirma que se guarde en BD  
**Causa probable:** `handleAddExtraFood()` en App.tsx NO está implementado correctamente  

**Verificación requerida:**
- [ ] ¿Existe `handleAddExtraFood` en App.tsx?
- [ ] ¿Actualiza correctamente `currentLog.extraFoods`?
- [ ] ¿Llama a `saveDailyLogs()` después?
- [ ] ¿Se reloading después de guardar?

---

### **PROBLEMA 2: Sumar macros de extraFoods**
**Ubicación:** `Dashboard.tsx` - Cálculo de totales  
**Síntoma:** No está claro si los extraFoods se suman al total  
**Causa probable:** Lógica de sumarización incompleta  

**Verificación requerida:**
- [ ] ¿Función `calculateTotalMacros()` suma extraFoods?
- [ ] ¿Se valida en Dashboard?
- [ ] ¿Se muestra contador?

---

### **PROBLEMA 3: Guardar dieta completa (SavedDiets)**
**Ubicación:** `SavedDiets.tsx`  
**Síntoma:** Feature existe pero no está claro si funciona end-to-end  
**Causa probable:** Implementación incompleta de guardado/carga  

**Verificación requerida:**
- [ ] ¿Carga dietas guardadas correctamente?
- [ ] ¿Puede restaurar un día guardado?
- [ ] ¿Se sobreescriben datos correctamente?

---

### **PROBLEMA 4: Calendario - No muestra extraFoods**
**Ubicación:** `CalendarView.tsx`  
**Síntoma:** Al ver histórico, no se ven comidas extra  
**Causa probable:** Schema de visualización no incluye extraFoods  

**Verificación requerida:**
- [ ] ¿Desglose de macros muestra extraFoods?
- [ ] ¿Se etiquetan claramente como "Comidas Extra"?

---

## ✅ TODO LIST DE VERIFICACIÓN

### **Tier 1: CRÍTICO**
- [ ] Crear comida personalizada (usuario) → GUARDAR → CARGAR en MealSelection
- [ ] Crear comida base (admin) → GUARDAR → CARGAR en MealSelection
- [ ] Agregar comida extra → GUARDAR en BD → SUMAR a macros del día
- [ ] Guardar día completo → PERSISTIR en calendar

### **Tier 2: IMPORTANTE**
- [ ] Macros mostrados sin decimales (usuario/admin)
- [ ] Editar comida personalizada → GUARDAR cambios
- [ ] Eliminar comida personalizada → REMOVER de BD
- [ ] Crear ingrediente personalizado → USAR en platos

### **Tier 3: NICE-TO-HAVE**
- [ ] Guardar dieta completa como plantilla
- [ ] Cargar plantilla → restaura día completo
- [ ] Favoritos de platos
- [ ] Historial de cambios

---

## 📊 MATRIZ DE ESTADO

```
Componente              | Funciona | Guarda | Carga | Suma Macros | Tests
------------------------|----------|--------|-------|-------------|-------
Dashboard              | ✅       | ✅     | ✅    | ⚠️         | ❌
MealSelection          | ✅       | ✅     | ✅    | ✅          | ❌
MealDetail             | ✅       | ✅     | ✅    | ✅          | ❌
CreateMeal             | ✅       | ✅     | ✅    | ✅          | ✅
ExtraFood              | ✅       | ❌     | ❌    | ❌          | ❌
MyCustomMeals          | ✅       | ⚠️     | ✅    | N/A         | ❌
AdminPanel             | ✅       | ✅     | ✅    | ✅          | ❌
SavedDiets             | ⚠️       | ⚠️     | ⚠️    | N/A         | ❌
CalendarView           | ✅       | ✅     | ✅    | ❌          | ❌
ComplementaryMeals     | ✅       | ❌     | ✅    | ❌          | ❌
DailySummary           | ✅       | ❌     | ✅    | ⚠️          | ❌
```

---

## 🎯 PRÓXIMOS PASOS

1. **Verificar ExtraFood completamente** → Revisar App.tsx handleAddExtraFood
2. **Verificar sumación de macros** → Asegurar totalMacros incluye extraFoods
3. **Verificar SavedDiets** → Test completo de guardar/cargar plantilla
4. **Verificar Calendario** → Asegurar que muestra extraFoods en desglose
5. **Crear tests e2e** → Para cada flujo principal

---

## 📝 NOTAS TÉCNICAS

**Base de datos (Supabase):**
- ✅ `daily_logs`: Almacena comidas por día
- ✅ `custom_meals`: Almacena platos de usuario
- ✅ `base_meals`: Almacena platos globales (admin)
- ✅ `custom_ingredients`: Almacena ingredientes de usuario
- ⚠️ `saved_diets`: Existe pero verificar uso

**API Endpoints:**
- ✅ `POST /daily-logs` - Guardar día
- ✅ `GET /daily-logs/{email}` - Cargar historial
- ✅ `POST /custom-meals` - Guardar plato personalizado
- ✅ `GET /custom-meals/{email}` - Cargar platos usuario
- ✅ `POST /global-meals` - Guardar plato admin (NUEVO)
- ✅ `GET /global-meals` - Cargar platos globales (NUEVO)
- ✅ `POST /saved-diets` - Guardar plantilla
- ✅ `GET /saved-diets/{email}` - Cargar plantillas

**Frontend State:**
- `App.tsx`: currentLog, dailyLogs, user
- `Dashboard.tsx`: selectedComplementaryMeals, macros totales
- `MealSelection.tsx`: globalMeals, customMeals
- `ExtraFood.tsx`: temporal, envía a App.tsx

---

**Status:** 🟡 **PARCIALMENTE VERIFICADO** - Necesita análisis detallado de ExtraFood y SavedDiets
