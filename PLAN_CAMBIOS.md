# Plan de Cambios para Settings.tsx

## Problema
Los macros personalizados no están interrelacionados correctamente:
- Calorías = (Proteína × 4) + (Carbohidratos × 4) + (Grasas × 9)
- Actualmente los sliders son independientes

## Cambios necesarios

### 1. Eliminar selector duplicado de "Goal"
**Ubicación:** Líneas 357-374 (bloque "Perfil Físico")
**Acción:** Eliminar todo el bloque `{/* Goal */}` y su `<div>` asociado

### 2. Agregar funciones handler (después de línea 84)
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

### 3. Actualizar sliders onChange (líneas ~667, 692, 717, 742)
- Línea 667: `onChange={(e) => handleCaloriesChange(Number(e.target.value))}`
- Línea 692: `onChange={(e) => handleProteinChange(Number(e.target.value))}`
- Línea 717: `onChange={(e) => handleCarbsChange(Number(e.target.value))}`
- Línea 742: `onChange={(e) => handleFatChange(Number(e.target.value))}`

### 4. Hacer que los botones de objetivo apliquen cambios automáticamente
- Los botones de objetivo (líneas 492, 517, 542, 567, 592) deben:
  1. Llamar a `setGoal()` 
  2. Recalcular macros automáticamente
  3. Aplicar los cambios con `onUpdateGoals()` y `onUpdateProfile()`

## Orden de ejecución
1. Eliminar selector duplicado
2. Agregar funciones handler
3. Actualizar sliders
4. Hacer que botones de objetivo apliquen cambios automáticamente
