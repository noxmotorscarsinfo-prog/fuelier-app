# 🔬 SISTEMA FISIOLÓGICO COMPLETO - FUELIER

## 📋 RESUMEN EJECUTIVO

Fuelier ahora implementa un **sistema de nutrición adaptativo basado en fisiología real**, no en conteo manual de calorías. Este documento detalla todos los fundamentos científicos implementados en la app.

---

## ✅ PILARES IMPLEMENTADOS

### 1. 📊 DATOS ANTROPOMÉTRICOS (Base Científica)

#### Campos Implementados en `User`:
- **Edad, Sexo, Peso, Altura** → Cálculo de TMB (Tasa Metabólica Basal)
- **% de Grasa Corporal** (`bodyFatPercentage`) → Cálculo preciso de masa magra
- **Masa Magra** (`leanBodyMass`) → Calculada automáticamente o ingresada manualmente

#### Fórmulas Utilizadas:
1. **Mifflin-St Jeor** (Estándar):
   ```
   Hombres: TMB = (10 × peso) + (6.25 × altura) - (5 × edad) + 5
   Mujeres: TMB = (10 × peso) + (6.25 × altura) - (5 × edad) - 161
   ```

2. **Katch-McArdle** (Preciso con % grasa):
   ```
   TMB = 370 + (21.6 × masa magra en kg)
   ```
   ✅ **Ventaja**: Independiente del sexo, más preciso porque usa masa muscular real

#### Prioridad de Cálculo:
```
Si tiene bodyFatPercentage o leanBodyMass:
  → Usar Katch-McArdle (MÁS PRECISO)
Sino:
  → Usar Mifflin-St Jeor (Estándar)
```

**Archivo**: `/src/app/utils/advancedMacroCalculations.ts` → `calculateBMRAdvanced()`

---

### 2. 🚶‍♂️ FACTOR DE ACTIVIDAD (El Multiplicador Crítico)

#### A) NEAT - Actividad No Asociada al Ejercicio

**Campos Implementados**:
- `lifestyleActivity`: sedentary | lightly_active | moderately_active | very_active | extremely_active
- `occupation`: desk_job | standing_job | walking_job | physical_job
- `dailySteps`: número (pasos diarios del smartwatch)

**Factores NEAT**:
| Pasos Diarios | Ocupación | Factor NEAT |
|---------------|-----------|-------------|
| < 3,000 | Desk Job | 1.2 (Sedentario) |
| 3,000 - 5,000 | Standing Job | 1.3 (Ligeramente activo) |
| 5,000 - 8,000 | Walking Job | 1.4-1.5 (Moderadamente activo) |
| 8,000 - 12,000 | Physical Job | 1.5-1.6 (Muy activo) |
| > 12,000 | - | 1.6+ (Extremadamente activo) |

**⚠️ CRÍTICO**: Un oficinista sedentario puede necesitar **500-800 kcal menos** que un repartidor del mismo peso.

#### B) Ejercicio (Adicional al NEAT)

**Campos Implementados**:
- `trainingFrequency`: 0-7 días por semana
- `trainingIntensity`: light | moderate | intense
- `trainingType`: strength | cardio | mixed | hiit | crossfit
- `trainingTimePreference`: morning | afternoon | evening

**Boost de Ejercicio** (sobre el NEAT):
| Frecuencia | Boost Adicional |
|------------|-----------------|
| 0 días | +0% |
| 1-2 días | +5% |
| 3 días | +10% |
| 4 días | +15% |
| 5 días | +20% |
| 6 días | +25% |
| 7 días | +30% |

**Fórmula Final**:
```
TDEE = TMB × (NEAT Factor) × (1 + Exercise Boost)
```

**Ejemplo Real**:
```
Usuario: Oficinista, entrena 4 días/semana
TMB: 1,600 kcal
NEAT: 1.2 (sedentario)
Ejercicio: +15%
TDEE = 1,600 × 1.2 × 1.15 = 2,208 kcal
```

**Archivo**: `/src/app/utils/advancedMacroCalculations.ts` → `calculateActivityFactorAdvanced()`

---

### 3. 🎯 OBJETIVOS ESPECÍFICOS (Déficit/Superávit Correcto)

#### Porcentajes Implementados (Según Ciencia):

| Objetivo | Ajuste Calórico | Pérdida/Ganancia Esperada |
|----------|----------------|---------------------------|
| **Pérdida Rápida** | -20% | 0.8-1.0 kg/semana |
| **Pérdida Moderada** | -15% | 0.5-0.7 kg/semana ✅ RECOMENDADO |
| **Mantenimiento** | 0% | ±0.2 kg/semana |
| **Ganancia Limpia** | +10% | 0.2-0.4 kg/mes ✅ RECOMENDADO |
| **Ganancia Muscular** | +15% | 0.4-0.6 kg/mes |

**⚠️ ADVERTENCIAS**:
- Déficit > 25% → Pérdida de músculo + fatiga
- Superávit > 20% → Ganancia de grasa innecesaria

**Archivo**: `/src/app/utils/macroCalculations.ts` → `calculateTargetCalories()`

---

### 4. 🥩 REPARTO DE MACRONUTRIENTES (Basado en Masa Magra)

#### A) PROTEÍNA (Prioridad #1)

**Cálculo Avanzado**:
```
Si tiene masa magra:
  En déficit: 2.4g × masa magra
  En superávit: 2.0g × masa magra
  Mantenimiento: 2.2g × masa magra

Si NO tiene masa magra (fallback):
  En déficit: 2.0-2.2g × peso total
  En superávit: 1.8-2.0g × peso total
```

**Rango Científico**: 1.6g - 2.2g por kg de peso corporal ✅

**¿Por qué más en déficit?**
→ Preservar músculo cuando el cuerpo está en catabolismo

**Archivo**: `/src/app/utils/advancedMacroCalculations.ts` → `calculateMacrosAdvanced()`

#### B) GRASAS (Prioridad #2 - Salud Hormonal)

**Porcentajes por Objetivo**:
| Objetivo | Hombres | Mujeres |
|----------|---------|---------|
| Déficit | 25% | 30% |
| Superávit | 28% | 30% |
| Mantenimiento | 25% | 28% |

**Rango Científico**: 0.8g - 1.2g por kg de peso ✅

**⚠️ CRÍTICO para mujeres**:
- Grasas < 20% → Problemas de ciclo menstrual
- Grasas < 15% → Amenorrea (pérdida del período)

**Mínimo Saludable**: 40g/día (nunca bajar)

#### C) CARBOHIDRATOS (Resto de Calorías)

**Fórmula**:
```
Calorías restantes = Calorías objetivo - (Proteína × 4) - (Grasas × 9)
Carbohidratos = Calorías restantes / 4
```

**Mínimo Saludable**: 100g/día (función cerebral)

**Ajuste por Actividad**:
- Entrenamiento intenso (5+ días) → Más carbos
- Sedentario → Menos carbos, más grasas

**Archivo**: `/src/app/utils/advancedMacroCalculations.ts` → `calculateMacrosAdvanced()`

---

### 5. 🧠 HISTORIAL METABÓLICO (Metabolismo Adaptado)

#### Campos Implementados:

```typescript
previousDietHistory: {
  hadRestrictiveDiet: boolean;        // ¿Dieta < 1200 kcal?
  monthsInRestriction: number;        // ¿Cuánto tiempo?
  weightRegained: boolean;            // ¿Efecto rebote?
  lastDietEndDate: string;            // Fecha de fin
}

metabolicAdaptation: {
  isAdapted: boolean;                 // ¿Detectado?
  adaptationLevel: 'none' | 'mild' | 'moderate' | 'severe';
  recommendedPhase: 'reverse_diet' | 'maintenance' | 'cut' | 'bulk';
}
```

#### Detección Automática (4 Flags):

1. **Peso Estancado** → 2+ semanas sin cambio en déficit
2. **Energía Cayendo** → Progresivamente más días de baja energía
3. **Hambre Aumentando** → Hambre creciente a pesar de comer "bien"
4. **Rendimiento Bajando** → Performance en el gym empeorando

**Clasificación**:
- 0 flags = Sin adaptación ✅
- 1 flag = Adaptación leve → 1-2 semanas en mantenimiento
- 2 flags = Adaptación moderada → Reverse diet 2-4 semanas
- 3-4 flags = Adaptación severa → Reverse diet OBLIGATORIO 4-8 semanas

**¿Qué es un "Reverse Diet"?**
→ Aumentar calorías gradualmente (+50-100 kcal/semana) para restaurar el metabolismo antes de volver a déficit.

**Archivo**: `/src/app/utils/progressAnalysis.ts` → `detectMetabolicAdaptation()`

---

### 6. 📈 SISTEMA DE TRACKING Y ADAPTACIÓN

#### A) Progreso Semanal (`WeeklyProgressRecord`)

**Datos Recopilados**:
```typescript
{
  // Mediciones físicas
  startWeight, endWeight, weightChange, averageWeight
  startBodyFat, endBodyFat, bodyFatChange
  
  // Adherencia nutricional
  daysLogged, averageCalories, targetCalories, calorieAdherence
  averageProtein, averageCarbs, averageFat
  
  // Feedback subjetivo
  energyLevels: ['low', 'normal', 'high'][]     // 7 días
  hungerLevels: ['very_hungry', 'hungry', 'satisfied', 'full'][]
  workoutQuality: ['poor', 'ok', 'good', 'excellent'][]
  
  // Análisis automático
  weeklyAnalysis: {
    trend, isOnTrack, needsAdjustment, adjustmentRecommendation, adjustmentAmount
  }
}
```

**Archivo**: `/src/app/types.ts` líneas 208-266

#### B) Feedback Diario (`DailyFeedback`)

**Datos Capturados**:
```typescript
{
  // Energía (3 momentos del día)
  morningEnergy, afternoonEnergy, eveningEnergy
  
  // Hambre
  wakeUpHunger, betweenMealsHunger, beforeBedHunger
  
  // Rendimiento
  trainedToday, workoutQuality, workoutType, workoutDuration
  
  // Estado general
  mood, stressLevel, sleepQuality, sleepHours
  
  // Digestión
  digestiveComfort, mealsSkipped, reasonsSkipped
}
```

**Archivo**: `/src/app/types.ts` líneas 268-298

#### C) Análisis y Ajuste Automático

**Cada 1-2 semanas, el sistema**:
1. Compara peso actual vs. esperado
2. Analiza adherencia nutricional
3. Revisa feedback subjetivo (energía, hambre, rendimiento)
4. **Sugiere ajuste automático** de calorías si es necesario

**Ejemplos de Ajustes**:
```
En déficit, peso estancado 2 semanas → -100 kcal/día
En déficit, perdiendo muy rápido (>1kg/semana) → +100 kcal/día
En superávit, no ganando peso → +150 kcal/día
En superávit, ganando muy rápido → -100 kcal/día
```

**Archivo**: `/src/app/utils/progressAnalysis.ts` → `analyzeWeeklyProgress()` y `suggestCalorieAdjustment()`

---

## 🎯 FLUJO COMPLETO DEL SISTEMA

### Fase 1: ONBOARDING (Recopilación de Datos)

```
1. Sexo, Edad
2. Peso, Altura
3. [NUEVO] % Grasa Corporal (opcional pero recomendado)
4. Actividad Diaria (NEAT):
   - Ocupación (desk_job, standing_job, etc.)
   - Pasos diarios (si tiene smartwatch)
5. Frecuencia de Entrenamiento (0-7 días)
6. [NUEVO] Tipo e Intensidad de Entrenamiento
7. Objetivo (pérdida/mantenimiento/ganancia)
8. [NUEVO] Historial de Dietas Previas
9. Distribución de Comidas (25-35-10-30 o personalizada)
10. Preferencias Alimenticias
```

### Fase 2: CÁLCULO INICIAL

```python
# Pseudocódigo del sistema

if user.bodyFatPercentage exists:
    leanBodyMass = weight × (1 - bodyFat/100)
    BMR = 370 + (21.6 × leanBodyMass)  # Katch-McArdle
else:
    BMR = MifflinStJeor(sex, weight, height, age)

# NEAT + Exercise
if user.dailySteps:
    neatFactor = calculateFromSteps(dailySteps)
elif user.occupation:
    neatFactor = getOccupationFactor(occupation)
else:
    neatFactor = 1.2  # Sedentario por defecto

exerciseBoost = getExerciseBoost(trainingFrequency)
activityFactor = neatFactor × (1 + exerciseBoost)

TDEE = BMR × activityFactor

# Ajuste por objetivo
goalMultiplier = {
    'rapid_loss': 0.80,      # -20%
    'moderate_loss': 0.85,   # -15%
    'maintenance': 1.0,
    'moderate_gain': 1.10,   # +10%
    'rapid_gain': 1.15       # +15%
}

targetCalories = TDEE × goalMultiplier[user.goal]

# Ajuste por metabolismo adaptado (si detectado)
if user.metabolicAdaptation.isAdapted:
    if adaptationLevel == 'mild':
        targetCalories += 100
    elif adaptationLevel == 'moderate':
        targetCalories += 200
    elif adaptationLevel == 'severe':
        targetCalories += 300

# Calcular macros
if leanBodyMass:
    protein = leanBodyMass × proteinMultiplier  # 2.0-2.4g/kg
else:
    protein = weight × proteinMultiplier  # 1.8-2.2g/kg

fat = targetCalories × fatPercentage / 9
carbs = (targetCalories - protein×4 - fat×9) / 4
```

### Fase 3: USO DIARIO

```
1. Usuario registra comidas (desayuno, comida, merienda, cena)
2. Sistema calcula macros consumidos
3. [NUEVO] Al final del día: Solicita feedback rápido
   - ¿Cómo fue tu energía hoy?
   - ¿Llegaste con hambre a las comidas?
   - ¿Entrenaste? ¿Cómo te sentiste?
4. Datos se almacenan para análisis semanal
```

### Fase 4: ANÁLISIS SEMANAL (Automatizado)

```
Cada domingo (o día configurado):

1. Sistema analiza:
   - Cambio de peso vs. esperado
   - Adherencia nutricional (% días registrados)
   - Promedio de calorías vs. objetivo
   - Feedback subjetivo (energía, hambre, rendimiento)

2. Detecta flags de adaptación metabólica:
   - Peso estancado
   - Energía bajando
   - Hambre aumentando
   - Rendimiento cayendo

3. Genera recomendación:
   - "Todo va bien, continúa así" ✅
   - "Ajustar calorías +/- X kcal" ⚠️
   - "Metabolismo adaptado detectado → Reverse diet" 🚨

4. Usuario puede:
   - Aceptar ajuste automático
   - Rechazar y mantener plan actual
   - Ver explicación detallada
```

### Fase 5: ADAPTACIÓN CONTINUA

```
El sistema aprende del usuario:

1. Patrones de comida:
   - ¿Qué comidas salta más?
   - ¿Cuándo tiene más hambre?
   - ¿Qué distribución funciona mejor?

2. Respuesta metabólica:
   - ¿Pierde/gana peso según lo esperado?
   - ¿Cómo reacciona a ajustes calóricos?
   - ¿Necesita más/menos calorías de lo calculado?

3. Ajuste de distribución automático:
   - Si siempre salta desayuno → Reducir % desayuno
   - Si siempre excede en cena → Aumentar % cena
   - Si tiene hambre constante AM → Aumentar % desayuno
```

---

## 📊 MÉTRICAS DE ÉXITO DEL SISTEMA

### Indicadores de que el sistema funciona:

✅ **Progreso según lo esperado**:
- Pérdida de peso: 0.5-0.7 kg/semana (déficit moderado)
- Ganancia de peso: 0.2-0.4 kg/mes (superávit limpio)

✅ **Alta adherencia**:
- Usuario registra 6-7 días por semana
- No salta comidas frecuentemente
- Se mantiene cerca del objetivo calórico (±10%)

✅ **Feedback positivo**:
- Energía normal/alta la mayoría de días
- Hambre controlada (no "muriéndose de hambre")
- Rendimiento en el gym estable/mejorando

✅ **Sin adaptación metabólica**:
- Peso cambia según lo esperado
- No flags de metabolismo adaptado

### Indicadores de que necesita ajuste:

⚠️ **Peso estancado 2+ semanas** (en déficit/superávit)
⚠️ **Energía constantemente baja**
⚠️ **Hambre insaciable**
⚠️ **Rendimiento en el gym cayendo**
⚠️ **Adherencia < 50%** (el plan no es sostenible)

---

## 🔧 ARCHIVOS CLAVE DEL SISTEMA

| Archivo | Función |
|---------|---------|
| `/src/app/types.ts` | Definición de todos los tipos (User, WeeklyProgressRecord, DailyFeedback, etc.) |
| `/src/app/utils/macroCalculations.ts` | Cálculos estándar (Mifflin-St Jeor, TDEE básico) |
| `/src/app/utils/advancedMacroCalculations.ts` | **NUEVO**: Cálculos avanzados (Katch-McArdle, NEAT, ajustes metabólicos) |
| `/src/app/utils/progressAnalysis.ts` | **NUEVO**: Análisis de progreso semanal, detección de adaptación metabólica |
| `/src/app/components/Dashboard.tsx` | Dashboard principal con tracking diario |
| `/src/app/components/MealSelection.tsx` | Selección de comidas con distribución personalizada |

---

## 🚀 PRÓXIMOS PASOS RECOMENDADOS

### Implementar Interfaz de Usuario:

1. **Pantalla de Feedback Diario** (al final del día):
   - "¿Cómo fue tu día hoy?" (energía, hambre, entrenamiento)
   - 30 segundos de feedback → Datos valiosos para análisis

2. **Dashboard de Progreso Semanal**:
   - Gráfica de peso (última 4 semanas)
   - Adherencia nutricional (%)
   - Tendencia (perdiendo/ganando según plan)
   - Alertas de adaptación metabólica

3. **Modal de Recomendaciones Automáticas**:
   ```
   🎯 Análisis Semanal - Semana #4
   
   📉 Peso: -0.6 kg (✅ Según lo planeado)
   📊 Adherencia: 85% (✅ Excelente)
   ⚡ Energía: Normal/Alta (✅)
   
   💡 Recomendación: Continúa con tu plan actual
   
   [Continuar] [Ver Detalles]
   ```

4. **Onboarding Mejorado**:
   - Agregar paso de % grasa corporal (con explicación de cómo medirlo)
   - Agregar paso de ocupación/pasos diarios
   - Agregar paso de historial de dietas previas

5. **Settings Avanzados**:
   - Editar composición corporal
   - Editar NEAT (ocupación, pasos)
   - Ver método de cálculo usado (Katch-McArdle vs Mifflin)
   - Ver breakdown de TDEE (BMR + NEAT + Ejercicio)

---

## 📚 REFERENCIAS CIENTÍFICAS

Este sistema está basado en:

1. **Mifflin MD et al. (1990)** - "A new predictive equation for resting energy expenditure in healthy individuals"
2. **Katch FI, McArdle WD (1973)** - "Prediction of body density from simple anthropometric measurements"
3. **Levine JA (2004)** - "Non-exercise activity thermogenesis (NEAT)" - Mayo Clinic Proceedings
4. **Helms ER et al. (2014)** - "Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation"
5. **Trexler ET et al. (2014)** - "Metabolic adaptation to weight loss: implications for the athlete"

---

## ✅ CONCLUSIÓN

Fuelier ahora tiene una **base científica sólida** que la diferencia de apps de "contar calorías":

❌ **Otras apps**: "Come 2000 kcal y listo"
✅ **Fuelier**: "Come 2000 kcal HOY, pero si en 2 semanas no pierdes peso, subiremos a 2100 kcal porque tu metabolismo se adaptó"

❌ **Otras apps**: "Divide las calorías en 4 comidas iguales"
✅ **Fuelier**: "Observamos que siempre tienes más hambre en la cena, vamos a aumentar el porcentaje ahí"

❌ **Otras apps**: Cálculo genérico sin considerar composición corporal
✅ **Fuelier**: Si tienes 80kg pero 15% grasa vs 30% grasa, te damos macros DIFERENTES

**Esto es producto serio.** 🎯
