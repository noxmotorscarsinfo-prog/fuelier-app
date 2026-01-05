# 🧪 GUÍA DE PRUEBA - Sistema Adaptativo Fuelier

## 🎯 OBJETIVO
Probar todas las funcionalidades del sistema adaptativo para verificar que funciona al 100%.

---

## 📋 CHECKLIST DE PRUEBAS

### ✅ **FASE 1: Onboarding (OPCIONAL - El antiguo funciona)**
El nuevo onboarding unificado está disponible pero no se usa por defecto. El flujo antiguo funciona perfecto.

Para probar el nuevo:
1. Comentar el flujo antiguo en `App.tsx` (líneas 808-840)
2. Descomentar el nuevo onboarding
3. Registrarse con datos realistas

---

### ✅ **FASE 2: Seguimiento de Peso** (CRÍTICO)

#### Paso 1: Abrir Dashboard
1. Iniciar sesión con tu cuenta
2. Verás el Dashboard principal

#### Paso 2: Abrir Tracking de Peso
1. Buscar botón **verde "Peso"** en la barra superior (al lado de "Calendario")
2. Click en "Peso"
3. Debería abrir modal de **WeightTracking**

#### Paso 3: Registrar Peso
1. En el modal, click "Registrar Peso"
2. Ingresar peso actual (ejemplo: 75.5 kg)
3. Click "Guardar"
4. Debería aparecer en el historial

#### ✅ **Verificación:**
- [ ] Modal se abre correctamente
- [ ] Puede registrar peso
- [ ] Aparece en historial
- [ ] Se cierra al hacer click "Cerrar"

---

### ✅ **FASE 3: Análisis Semanal Automático** (CRÍTICO)

#### Preparación de Datos:
Para probar el sistema necesitas datos de al menos 7 días. Hay dos opciones:

**OPCIÓN A: Crear datos manualmente (lento)**
1. Registra comidas durante 7 días
2. Registra peso cada día
3. Espera hasta domingo 23:59

**OPCIÓN B: Inyectar datos de prueba (RÁPIDO)** ⭐ RECOMENDADO

1. Abre la consola del navegador (F12)
2. Copia y pega este script:

```javascript
// SCRIPT DE PRUEBA - Sistema Adaptativo Fuelier
console.log('🧪 Iniciando script de prueba...');

// 1. Obtener usuario actual
let user = JSON.parse(localStorage.getItem('dietUser'));
if (!user) {
  console.error('❌ No hay usuario. Primero registrate!');
  throw new Error('No user found');
}

console.log('✅ Usuario cargado:', user.name);

// 2. Crear registros semanales falsos (últimas 3 semanas)
const weeklyProgress = [];
const today = new Date();

for (let week = 0; week < 3; week++) {
  const weekStartDate = new Date(today.getTime() - (week * 7 + 7) * 24 * 60 * 60 * 1000);
  const weekEndDate = new Date(today.getTime() - week * 7 * 24 * 60 * 60 * 1000);
  
  // Simular pérdida de peso (si el objetivo es perder)
  const weightLoss = user.goal.includes('loss') ? -0.4 : 
                     user.goal.includes('gain') ? 0.3 : 0.1;
  
  const startWeight = user.weight + (weightLoss * (week + 1));
  const endWeight = user.weight + (weightLoss * week);
  
  weeklyProgress.push({
    weekStartDate: weekStartDate.toISOString().split('T')[0],
    weekNumber: 3 - week,
    startWeight: Math.round(startWeight * 10) / 10,
    endWeight: Math.round(endWeight * 10) / 10,
    weightChange: Math.round((endWeight - startWeight) * 10) / 10,
    averageWeight: Math.round(((startWeight + endWeight) / 2) * 10) / 10,
    daysLogged: 6,
    averageCalories: user.goals.calories - 50,
    targetCalories: user.goals.calories,
    calorieAdherence: 95,
    averageProtein: user.goals.protein - 5,
    averageCarbs: user.goals.carbs - 10,
    averageFat: user.goals.fat - 2,
    workoutsDone: user.trainingFrequency || 3,
    workoutsPlanned: user.trainingFrequency || 3,
    workoutAdherence: 100,
    weeklyAnalysis: {
      trend: user.goal.includes('loss') ? 'losing_moderate' : 
             user.goal.includes('gain') ? 'gaining_moderate' : 'maintaining',
      isOnTrack: true,
      needsAdjustment: false,
      adjustmentRecommendation: 'Vas según el plan',
      adjustmentAmount: 0
    }
  });
}

// 3. Actualizar usuario con datos
user.weeklyProgress = weeklyProgress;
localStorage.setItem('dietUser', JSON.stringify(user));

console.log('✅ Datos de prueba creados!');
console.log('📊 Registros semanales:', weeklyProgress);

// 4. Crear dailyLogs de los últimos 7 días
const dailyLogs = [];
for (let day = 0; day < 7; day++) {
  const date = new Date(today.getTime() - day * 24 * 60 * 60 * 1000);
  dailyLogs.push({
    date: date.toISOString().split('T')[0],
    breakfast: {
      id: 'test-breakfast',
      name: 'Avena con frutas',
      type: 'breakfast',
      calories: user.goals.calories * 0.25,
      protein: user.goals.protein * 0.25,
      carbs: user.goals.carbs * 0.25,
      fat: user.goals.fat * 0.25,
      ingredients: [],
      baseQuantity: 100
    },
    lunch: {
      id: 'test-lunch',
      name: 'Pollo con arroz',
      type: 'lunch',
      calories: user.goals.calories * 0.35,
      protein: user.goals.protein * 0.35,
      carbs: user.goals.carbs * 0.35,
      fat: user.goals.fat * 0.35,
      ingredients: [],
      baseQuantity: 100
    },
    snack: {
      id: 'test-snack',
      name: 'Yogurt con nueces',
      type: 'snack',
      calories: user.goals.calories * 0.15,
      protein: user.goals.protein * 0.15,
      carbs: user.goals.carbs * 0.15,
      fat: user.goals.fat * 0.15,
      ingredients: [],
      baseQuantity: 100
    },
    dinner: {
      id: 'test-dinner',
      name: 'Salmón con verduras',
      type: 'dinner',
      calories: user.goals.calories * 0.25,
      protein: user.goals.protein * 0.25,
      carbs: user.goals.carbs * 0.25,
      fat: user.goals.fat * 0.25,
      ingredients: [],
      baseQuantity: 100
    },
    weight: user.weight - (day * 0.1),
    isSaved: true
  });
}

localStorage.setItem('dietLogs', JSON.stringify(dailyLogs));
console.log('✅ Logs diarios creados!');
console.log('📅 Días registrados:', dailyLogs.length);

console.log('\n🎉 ¡DATOS DE PRUEBA LISTOS!');
console.log('📝 Ahora recarga la página (F5) para ver los cambios');
```

3. Recarga la página (F5)
4. Abre "Peso" y deberías ver datos históricos

---

### ✅ **FASE 4: Forzar Análisis Semanal** (CRÍTICO)

Una vez tengas datos, puedes forzar el análisis sin esperar a domingo 23:59:

**OPCIÓN A: Cambiar hora del sistema**
1. Cambia la hora de tu computadora a domingo 23:59
2. Espera 1 minuto
3. Debería aparecer notificación

**OPCIÓN B: Forzar manualmente (RÁPIDO)** ⭐ RECOMENDADO

1. Abre consola (F12)
2. Ejecuta:

```javascript
// Importar funciones del sistema adaptativo
const { analyzeProgress, applyAutomaticAdjustment, detectMetabolicAdaptation } = await import('./utils/adaptiveSystem.ts');

// Obtener usuario
const user = JSON.parse(localStorage.getItem('dietUser'));

console.log('📊 ANÁLISIS DE PROGRESO:');
console.log('========================');

// 1. Analizar progreso
const analysis = analyzeProgress(user);
console.log('\n🔍 Análisis:', analysis);

// 2. Detectar metabolismo
const metabolicStatus = detectMetabolicAdaptation(user);
console.log('\n⚠️ Estado Metabólico:', metabolicStatus);

// 3. Aplicar ajuste si necesario
if (analysis.needsAdjustment) {
  const newGoals = applyAutomaticAdjustment(user, analysis);
  console.log('\n✨ Nuevos Macros:', newGoals);
  
  // Actualizar usuario
  user.goals = newGoals;
  localStorage.setItem('dietUser', JSON.stringify(user));
  
  console.log('✅ Macros actualizados! Recarga la página.');
} else {
  console.log('✅ No necesita ajuste - Vas según el plan!');
}
```

---

### ✅ **FASE 5: Verificar Notificaciones**

#### Probar notificación de ajuste:
```javascript
// Simular notificación de ajuste
window.dispatchEvent(new CustomEvent('show-adaptive-notification', {
  detail: {
    type: 'adjustment',
    title: '🎯 Ajuste Automático Aplicado',
    message: 'Estás perdiendo 0.3kg/semana más de lo esperado. Aumentaremos tus calorías.',
    newGoals: {
      calories: 2200,
      protein: 165,
      carbs: 220,
      fat: 70
    },
    warnings: ['Pérdida muy rápida puede causar pérdida de masa muscular']
  }
}));
```

#### Probar notificación de metabolismo adaptado:
```javascript
window.dispatchEvent(new CustomEvent('show-adaptive-notification', {
  detail: {
    type: 'metabolic_adaptation',
    title: '⚠️ Metabolismo Adaptado Detectado',
    message: 'Diet Break: Toma 2 semanas en mantenimiento para recuperar antes de continuar',
    warnings: [
      'Nivel de adaptación: MODERATE',
      'Consulta la sección de Progreso para más detalles'
    ]
  }
}));
```

#### Probar notificación de "on track":
```javascript
window.dispatchEvent(new CustomEvent('show-adaptive-notification', {
  detail: {
    type: 'on_track',
    title: '✅ ¡Vas Según el Plan!',
    message: '¡Vas perfectamente según el plan!',
    warnings: ['Sigue así, tus resultados son consistentes con tu objetivo']
  }
}));
```

---

## 🎯 **CHECKLIST FINAL**

### Sistema de Peso:
- [ ] Botón "Peso" visible en Dashboard
- [ ] Modal se abre correctamente
- [ ] Puede registrar peso
- [ ] Gráfica se muestra con datos
- [ ] Estadísticas se calculan correctamente
- [ ] Detecta "ON TRACK" vs "NECESITA AJUSTE"

### Sistema Adaptativo:
- [ ] Genera registros semanales
- [ ] Analiza progreso correctamente
- [ ] Detecta si va según el plan
- [ ] Ajusta macros cuando es necesario
- [ ] Detecta metabolismo adaptado
- [ ] Guarda cambios en localStorage

### Notificaciones:
- [ ] Aparecen correctamente
- [ ] Diseño se ve bien
- [ ] Muestran macros nuevos
- [ ] Muestran advertencias
- [ ] Botón "Entendido" cierra modal

---

## 🐛 **PROBLEMAS COMUNES**

### "No hay datos suficientes"
**Solución:** Ejecuta el script de datos de prueba (OPCIÓN B)

### "El botón Peso no aparece"
**Solución:** Verifica que Dashboard.tsx tenga el botón integrado

### "El análisis no se ejecuta"
**Solución:** Fuerza el análisis manualmente con el script

### "Errores en consola"
**Solución:** 
1. Abre consola (F12)
2. Busca el error específico
3. Verifica imports en archivos modificados

---

## 📊 **RESULTADOS ESPERADOS**

### Con datos correctos deberías ver:

1. **En WeightTracking:**
   - Gráfica con puntos de las últimas semanas
   - Tendencia (perdiendo/ganando/manteniendo)
   - Alert verde "Vas según el plan" o naranja "Necesita ajuste"
   - Estadísticas: cambio total, promedio semanal

2. **Después del análisis semanal:**
   - Notificación elegante con uno de los 3 tipos
   - Nuevos macros (si aplica)
   - Advertencias/consejos
   - Usuario actualizado en localStorage

3. **En localStorage:**
   ```javascript
   // Ver datos:
   JSON.parse(localStorage.getItem('dietUser')).weeklyProgress
   JSON.parse(localStorage.getItem('dietUser')).goals
   ```

---

## ✅ **PRUEBA EXITOSA SI:**

- ✅ Puedes abrir modal de peso
- ✅ Ves gráfica con datos
- ✅ Sistema detecta si va on track
- ✅ Análisis genera recomendaciones
- ✅ Macros se ajustan automáticamente
- ✅ Notificaciones aparecen correctamente
- ✅ Todo se guarda en localStorage

---

## 🚀 **SIGUIENTE NIVEL:**

Una vez verificado que todo funciona:

1. Usa la app normalmente durante 2-3 semanas
2. Registra peso cada semana
3. El sistema se ajustará automáticamente cada domingo
4. Revisa tus tendencias en "Peso"

---

**¿TODO FUNCIONANDO? ¡FELICIDADES! 🎉**
Ahora tienes la app de dietista más profesional del mundo basada en ciencia real.
