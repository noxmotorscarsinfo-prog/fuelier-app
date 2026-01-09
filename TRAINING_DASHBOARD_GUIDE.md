# 💪 NUEVA SECCIÓN DE ENTRENAMIENTO - FUELIER

**Fecha:** 7 de Enero de 2026  
**Versión:** 0.0.3 - Training Dashboard  

---

## ✨ NUEVAS FUNCIONALIDADES

### 1. Segmented Control (Navegación Principal)

**Ubicación:** Dashboard principal (arriba del contenido)

**Características:**
- 🍽️ **Dieta** - Vista actual del sistema nutricional
- 💪 **Entrenamiento** - Nueva sección de registro de fuerza

**Diseño:**
- Segmented Control moderno con fondo gris
- Tab activo: Fondo blanco + texto verde esmeralda + sombra
- Tab inactivo: Texto gris + hover
- Iconos: UtensilsCrossed (Dieta) + Dumbbell (Entrenamiento)

---

### 2. Training Dashboard (Vista de Entrenamiento)

#### **A. Header con Stats**
- **Fondo:** Gradiente verde esmeralda
- **Info mostrada:**
  - Día de la semana actual
  - Progreso del día (% de series completadas)
  - 3 Stats rápidas:
    - ⏱️ Duración estimada (45min)
    - 🎯 Número de ejercicios
    - 🔥 Total de series

#### **B. Planificador de Semana**
- **Diseño:** Fila horizontal con 7 días (L, M, X, J, V, S, D)
- **Día actual:** Círculo sólido verde esmeralda con escala 110%
- **Días inactivos:** Fondo gris oscuro
- **Interacción:** Click para cambiar de día
- **Botón:** "Crear Rutina" (esquina superior derecha)

#### **C. Lista de Ejercicios**

Cada ejercicio incluye:

**Header del Ejercicio:**
- Icono de mancuerna con fondo verde semitransparente
- Nombre del ejercicio en negrita
- Grupo muscular en texto pequeño
- Icono de progresión (TrendingUp)

**Tabla de Series:**
```
┌─────────┬──────────────┬──────────────┬────┐
│  Serie  │  Peso (kg)   │    Reps      │ ✓  │
├─────────┼──────────────┼──────────────┼────┤
│    1    │   [input]    │   [input]    │ ✓  │
│  Anterior: 80kg x 8 (5 Ene)                │
├─────────┼──────────────┼──────────────┼────┤
│    2    │   [input]    │   [input]    │ ✓  │
│  Anterior: 80kg x 7 (5 Ene)                │
└─────────┴──────────────┴──────────────┴────┘
```

**Características de la Tabla:**
- **Header:** Fondo gris oscuro, texto pequeño uppercase
- **Filas completadas:** Fondo verde semitransparente
- **Inputs interactivos:**
  - Click en celda → Modo edición
  - Borde verde cuando está activo
  - Botones: ✓ (guardar) + ✗ (cancelar)
- **Registro anterior:** 
  - Fila debajo de cada serie
  - Icono de trofeo dorado
  - Texto: "Anterior: 80kg × 8 (5 Ene)"
  - **Objetivo:** Usuario debe SUPERAR su marca

#### **D. Botón Guardar Entrenamiento**
- **Ubicación:** Fijo en la parte inferior
- **Diseño:** 
  - Fondo gradiente verde esmeralda
  - Sombra grande
  - Icono de Save
  - Badge con progreso (3/9 series)
- **Estado:**
  - Activo: Verde brillante + hover
  - Deshabilitado: Gris + cursor not-allowed

---

## 🎨 PALETA DE COLORES

### Principales
- **Verde Esmeralda:** `#10b981` (emerald-500)
- **Verde Oscuro:** `#059669` (emerald-600)
- **Fondo Oscuro:** `#030712` (gray-950)
- **Tarjetas:** `#111827` (gray-900)
- **Bordes:** `#1f2937` (gray-800)

### Acentos
- **Amarillo (Trofeo):** `#eab308` (yellow-500)
- **Rojo (Sobre objetivo):** `#ef4444` (red-500)
- **Blanco:** `#ffffff`

---

## 📱 RESPONSIVE

### Desktop (md+)
- Segmented Control centrado
- Vista completa de todos los ejercicios
- Tabla con más espacio

### Mobile (<md)
- Segmented Control full-width
- Cards de ejercicios optimizadas
- Inputs más grandes para touch
- Botón fijo en la parte inferior con padding seguro

---

## 🔄 FLUJO DE USUARIO

### 1. Acceder a Entrenamiento
```
Dashboard → Click "Entrenamiento" (segmented control)
```

### 2. Registrar Serie
```
1. Usuario ve ejercicio "Press Banca"
2. Ve que el anterior fue: 80kg x 8
3. Click en celda "Peso" de Serie 1
4. Ingresa: 82.5 (superando marca)
5. Click en celda "Reps"
6. Ingresa: 8
7. Click ✓ para guardar
8. Serie se marca como completada (fondo verde)
```

### 3. Guardar Entrenamiento
```
1. Usuario completa todas las series
2. Botón "Guardar Entrenamiento" se activa
3. Click en botón
4. Datos se guardan en Supabase
5. Mensaje de éxito
```

---

## 🗄️ ESTRUCTURA DE DATOS

### Types Agregados a `/src/app/types.ts`:

```typescript
// Serie de ejercicio
export interface ExerciseSet {
  setNumber: number;
  weight: number; // kg
  reps: number;
  completed: boolean;
  previousRecord?: {
    weight: number;
    reps: number;
    date: string;
  };
}

// Ejercicio
export interface Exercise {
  id: string;
  name: string;
  category: 'chest' | 'back' | 'shoulders' | 'legs' | 'arms' | 'core' | 'cardio' | 'other';
  muscleGroup: string;
  icon?: string;
  sets: ExerciseSet[];
  notes?: string;
  isCustom?: boolean;
}

// Sesión de entrenamiento
export interface WorkoutSession {
  id: string;
  date: string; // ISO date
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  name: string;
  exercises: Exercise[];
  completed: boolean;
  duration?: number; // minutos
  notes?: string;
  userEmail: string;
}

// Rutina semanal
export interface WeeklyRoutine {
  id: string;
  name: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  schedule: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
}

// Template de entrenamiento
export interface WorkoutTemplate {
  id: string;
  name: string;
  userEmail: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    category: string;
    sets: number;
    targetReps: string; // Ej: "8-12"
    notes?: string;
  }[];
  isGlobal?: boolean;
  createdBy?: string;
}
```

---

## 🚀 PRÓXIMAS FUNCIONALIDADES

### Fase 1 (Corto Plazo)
- [ ] Crear rutina semanal personalizada
- [ ] Selector de ejercicios con base de datos
- [ ] Gráficas de progresión por ejercicio
- [ ] Historial de entrenamientos

### Fase 2 (Medio Plazo)
- [ ] Templates predefinidos (PPL, Full Body, etc.)
- [ ] Calculadora de 1RM (máximo)
- [ ] Volumen semanal por grupo muscular
- [ ] Rest timer entre series

### Fase 3 (Largo Plazo)
- [ ] Video demos de ejercicios
- [ ] IA para sugerir progresión
- [ ] Sincronización con smartwatch
- [ ] Comparativas con otros usuarios

---

## 🔧 ARCHIVOS MODIFICADOS

### Nuevos:
- ✅ `/src/app/components/TrainingDashboard.tsx` - Componente principal de entrenamiento

### Modificados:
- ✅ `/src/app/components/Dashboard.tsx` - Agregado segmented control + navegación
- ✅ `/src/app/types.ts` - Agregados tipos de training system

---

## 💡 NOTAS TÉCNICAS

### Estado Local
```typescript
const [activeTab, setActiveTab] = useState<'diet' | 'training'>('diet');
```

### Renderizado Condicional
```typescript
{activeTab === 'training' ? (
  <TrainingDashboard ... />
) : (
  // Dashboard de dieta actual
)}
```

### Persistencia
- **Actual:** Datos hardcodeados en componente
- **Próximo:** Guardar en Supabase tabla `workout_sessions`

---

## ✅ CHECKLIST DE TESTING

### Navegación
- [ ] Click en "Entrenamiento" cambia la vista
- [ ] Click en "Dieta" vuelve al dashboard normal
- [ ] Tabs se muestran correctamente en desktop y mobile
- [ ] Animaciones de transición suaves

### Training Dashboard
- [ ] Se muestran los 3 ejercicios de ejemplo
- [ ] Planificador de semana muestra 7 días
- [ ] Día actual está resaltado
- [ ] Stats del header son correctos

### Registro de Series
- [ ] Click en celda activa modo edición
- [ ] Inputs aceptan números
- [ ] Botón ✓ guarda los valores
- [ ] Botón ✗ cancela edición
- [ ] Serie completada muestra fondo verde
- [ ] Check mark aparece al completar

### Progresión
- [ ] Registro anterior se muestra debajo de cada serie
- [ ] Formato correcto: "Anterior: 80kg × 8 (5 Ene)"
- [ ] Trofeo dorado visible

### Guardar
- [ ] Botón deshabilitado si no hay series completadas
- [ ] Botón activo si hay al menos 1 serie completada
- [ ] Click muestra mensaje de éxito
- [ ] Badge muestra progreso correcto (3/9)

---

## 📊 MÉTRICAS A MONITOREAR

### Engagement
- Usuarios que acceden a sección de entrenamiento
- Entrenamientos completados por semana
- Series promedio por entrenamiento
- Días de la semana más populares

### Progresión
- Ejercicios con mayor progresión de peso
- Usuarios que superan sus marcas
- Tiempo promedio por entrenamiento

---

**¡La sección de Entrenamiento está lista para transformar Fuelier en una app completa de fitness! 💪🏋️**

_Última actualización: 7 de Enero de 2026_
