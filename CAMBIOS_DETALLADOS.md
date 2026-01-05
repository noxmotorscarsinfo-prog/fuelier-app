# Cambios Detallados para Settings.tsx

## CAMBIO 1: Eliminar selector duplicado de Goal del Perfil Físico

**Ubicación:** Líneas 357-374

**Eliminar este bloque completo:**
```typescript
            {/* Goal */}
            <div>
              <label className="block text-sm text-neutral-600 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                Objetivo: {goal === 'rapid_loss' ? 'Perder peso rápidamente' : goal === 'moderate_loss' ? 'Perder peso moderadamente' : goal === 'maintenance' ? 'Mantener peso' : goal === 'moderate_gain' ? 'Ganar músculo moderadamente' : 'Ganar músculo rápidamente'}
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain')}
                className="w-full h-10 bg-neutral-50 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="rapid_loss">Perder peso rápidamente</option>
                <option value="moderate_loss">Perder peso moderadamente</option>
                <option value="maintenance">Mantener peso</option>
                <option value="moderate_gain">Ganar músculo moderadamente</option>
                <option value="rapid_gain">Ganar músculo rápidamente</option>
              </select>
            </div>
```

**Resultado:** Después de la línea 355 (cierre del `</div>` de Training Frequency), debe venir directamente el cierre del contenedor principal (`</div>`) en línea 375, seguido de `{hasProfileChanges && (` en línea 377.

---

## CAMBIO 2: Agregar funciones handler para interrelación de macros

**Ubicación:** Después de la línea 84 (después de `handleResetProfile`)

**Agregar estas funciones:**
```typescript
  // Handlers para macros personalizados interrelacionados
  const handleCaloriesChange = (newCalories: number) => {
    // Calcular las calorías actuales desde los macros
    const currentTotalCalories = (customProtein * 4) + (customCarbs * 4) + (customFat * 9);
    
    // Si las calorías actuales son 0, inicializar con distribución estándar
    if (currentTotalCalories === 0) {
      const protein = Math.round(weight * 2);
      const fat = Math.round((newCalories * 0.25) / 9);
      const carbs = Math.round((newCalories - (protein * 4) - (fat * 9)) / 4);
      
      setCustomCalories(newCalories);
      setCustomProtein(protein);
      setCustomFat(fat);
      setCustomCarbs(carbs);
      return;
    }
    
    // Calcular el factor de escala
    const scaleFactor = newCalories / currentTotalCalories;
    
    // Ajustar todos los macros proporcionalmente
    setCustomCalories(newCalories);
    setCustomProtein(Math.round(customProtein * scaleFactor));
    setCustomCarbs(Math.round(customCarbs * scaleFactor));
    setCustomFat(Math.round(customFat * scaleFactor));
  };

  const handleProteinChange = (newProtein: number) => {
    setCustomProtein(newProtein);
    // Recalcular calorías automáticamente
    const newCalories = (newProtein * 4) + (customCarbs * 4) + (customFat * 9);
    setCustomCalories(newCalories);
  };

  const handleCarbsChange = (newCarbs: number) => {
    setCustomCarbs(newCarbs);
    // Recalcular calorías automáticamente
    const newCalories = (customProtein * 4) + (newCarbs * 4) + (customFat * 9);
    setCustomCalories(newCalories);
  };

  const handleFatChange = (newFat: number) => {
    setCustomFat(newFat);
    // Recalcular calorías automáticamente
    const newCalories = (customProtein * 4) + (customCarbs * 4) + (newFat * 9);
    setCustomCalories(newCalories);
  };
```

---

## CAMBIO 3: Actualizar onChange de sliders de macros

### 3.1 Slider de Calorías (línea 667)
**Buscar:**
```typescript
                  onChange={(e) => setCustomCalories(Number(e.target.value))}
```

**Reemplazar con:**
```typescript
                  onChange={(e) => handleCaloriesChange(Number(e.target.value))}
```

### 3.2 Slider de Proteína (línea 692)
**Buscar:**
```typescript
                  onChange={(e) => setCustomProtein(Number(e.target.value))}
```

**Reemplazar con:**
```typescript
                  onChange={(e) => handleProteinChange(Number(e.target.value))}
```

### 3.3 Slider de Carbohidratos (línea 717)
**Buscar:**
```typescript
                  onChange={(e) => setCustomCarbs(Number(e.target.value))}
```

**Reemplazar con:**
```typescript
                  onChange={(e) => handleCarbsChange(Number(e.target.value))}
```

### 3.4 Slider de Grasas (línea 742)
**Buscar:**
```typescript
                  onChange={(e) => setCustomFat(Number(e.target.value))}
```

**Reemplazar con:**
```typescript
                  onChange={(e) => handleFatChange(Number(e.target.value))}
```

---

## CAMBIO 4: Hacer que botones de objetivos apliquen cambios automáticamente

### 4.1 Crear función para aplicar objetivo (después de las funciones handler del CAMBIO 2)

**Agregar:**
```typescript
  // Función para aplicar un objetivo y actualizar macros automáticamente
  const handleApplyGoal = (newGoal: 'rapid_loss' | 'moderate_loss' | 'maintenance' | 'moderate_gain' | 'rapid_gain') => {
    // Actualizar el goal
    setGoal(newGoal);
    
    // Crear usuario temporal con el nuevo goal
    const tempUser: User = {
      ...user,
      weight,
      height,
      age,
      goal: newGoal,
      trainingFrequency
    };
    
    // Recalcular macros con el nuevo objetivo
    const newMacros = calculateMacros(tempUser);
    
    // Aplicar cambios inmediatamente
    onUpdateProfile(weight, height, trainingFrequency, { autoSaveDays, timezone }, age, newGoal);
    onUpdateGoals(newMacros);
    
    // Actualizar también los valores custom para que se reflejen en el modo personalizado
    setCustomCalories(newMacros.calories);
    setCustomProtein(newMacros.protein);
    setCustomCarbs(newMacros.carbs);
    setCustomFat(newMacros.fat);
    
    // Mostrar mensaje de éxito
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
```

### 4.2 Actualizar botones de objetivos

**Botón Pérdida Rápida (línea ~492):**
```typescript
// ANTES:
onClick={() => setGoal('rapid_loss')}

// DESPUÉS:
onClick={() => handleApplyGoal('rapid_loss')}
```

**Botón Pérdida Moderada (línea ~517):**
```typescript
// ANTES:
onClick={() => setGoal('moderate_loss')}

// DESPUÉS:
onClick={() => handleApplyGoal('moderate_loss')}
```

**Botón Mantenimiento (línea ~542):**
```typescript
// ANTES:
onClick={() => setGoal('maintenance')}

// DESPUÉS:
onClick={() => handleApplyGoal('maintenance')}
```

**Botón Ganancia Moderada (línea ~567):**
```typescript
// ANTES:
onClick={() => setGoal('moderate_gain')}

// DESPUÉS:
onClick={() => handleApplyGoal('moderate_gain')}
```

**Botón Ganancia Rápida (línea ~592):**
```typescript
// ANTES:
onClick={() => setGoal('rapid_gain')}

// DESPUÉS:
onClick={() => handleApplyGoal('rapid_gain')}
```

---

## RESUMEN DE LOS CAMBIOS

1. ✅ **Eliminar selector duplicado** → Se quita del Perfil Físico, solo queda en Objetivos Nutricionales
2. ✅ **Funciones handler** → Los macros ahora están interrelacionados correctamente:
   - Cambiar calorías → ajusta macros proporcionalmente
   - Cambiar un macro → recalcula calorías automáticamente
3. ✅ **Sliders actualizados** → Usan las nuevas funciones handler
4. ✅ **Botones de objetivo** → Aplican cambios automáticamente sin necesidad de guardar manualmente

## LÓGICA DE INTERRELACIÓN

**Fórmula de calorías:**
```
Calorías = (Proteína × 4) + (Carbohidratos × 4) + (Grasas × 9)
```

**Comportamiento:**
- Si mueves el slider de **Calorías** → Los macros se ajustan proporcionalmente
- Si mueves el slider de **Proteína/Carbs/Grasas** → Las calorías se recalculan automáticamente
- Los 5 botones de objetivos ahora aplican los cambios instantáneamente
