import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dumbbell, 
  Flame,
  Check,
  Circle,
  Calendar,
  TrendingUp,
  Plus,
  X,
  Trophy,
  Target,
  Zap,
  Edit2,
  ChevronRight,
  Timer,
  Pause,
  Play,
  Trash2,
  Save,
  Clock,
  List
} from 'lucide-react';
import * as api from '../utils/api';
import EditFullTrainingPlan from './EditFullTrainingPlan';
import { muscleCategories } from '../data/exerciseDatabase';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restTime: number;
  category?: string;
}

interface DayPlan {
  dayName: string;
  exercises: Exercise[];
}

interface CompletedWorkout {
  date: string;
  dayPlanIndex: number;
  dayPlanName: string;
  exerciseReps?: { [exerciseId: string]: number[] };
  exerciseWeights?: { [exerciseId: string]: number[] };
}

interface TrainingDashboardNewProps {
  user: any;
  trainingDays: number;
  weekPlan: DayPlan[];
}

export function TrainingDashboardNew({ 
  user, 
  trainingDays, 
  weekPlan
}: TrainingDashboardNewProps) {
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [showDaySelector, setShowDaySelector] = useState(false);
  const [selectedDayToTrain, setSelectedDayToTrain] = useState<number | null>(null);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(true);
  const [exerciseReps, setExerciseReps] = useState<{ [exerciseId: string]: number[] }>({});
  const [exerciseWeights, setExerciseWeights] = useState<{ [exerciseId: string]: number[] }>({});
  
  // Estados para cronómetro de descanso
  const [activeRestTimer, setActiveRestTimer] = useState<string | null>(null);
  const [restTimeRemaining, setRestTimeRemaining] = useState<number>(0);
  const [isRestPaused, setIsRestPaused] = useState(false);
  const [showRestModal, setShowRestModal] = useState(false);
  const [currentRestExerciseTime, setCurrentRestExerciseTime] = useState<number>(0);
  const [completedRests, setCompletedRests] = useState<{ [key: string]: boolean }>({});

  // Estados para edición de ejercicios del día actual
  const [showEditWorkoutModal, setShowEditWorkoutModal] = useState(false);
  const [tempDayExercises, setTempDayExercises] = useState<Exercise[]>([]);
  
  // Estado local del plan de entrenamiento que puede ser modificado
  const [localWeekPlan, setLocalWeekPlan] = useState<DayPlan[]>(weekPlan);
  
  // Estado para mostrar la página de edición completa
  const [showFullEditPage, setShowFullEditPage] = useState(false);

  // Sincronizar con weekPlan cuando cambia (prop)
  useEffect(() => {
    // Solo actualizar si el prop tiene datos válidos Y es diferente del actual
    if (weekPlan && weekPlan.length > 0) {
      // Comparar si realmente cambió (evitar loops infinitos)
      const isDifferent = JSON.stringify(localWeekPlan) !== JSON.stringify(weekPlan);
      if (isDifferent) {
        console.log('[TrainingDashboard] ✅ Recibido weekPlan del Dashboard:', weekPlan.length, 'días');
        setLocalWeekPlan(weekPlan);
      }
    }
  }, [weekPlan, localWeekPlan]);

  // OPTIMIZADO: Solo cargar desde Supabase si el prop weekPlan está vacío
  useEffect(() => {
    const loadSavedPlan = async () => {
      // Si ya tenemos datos del prop, no cargar de nuevo
      if (weekPlan && weekPlan.length > 0) {
        console.log('[TrainingDashboard] ⏭️ Usando plan del Dashboard, no recargando desde Supabase');
        return;
      }
      
      try {
        console.log('[TrainingDashboard] 🔄 Plan vacío, cargando desde Supabase...');
        const savedPlan = await api.getTrainingPlan(user.email);
        
        if (savedPlan && Array.isArray(savedPlan) && savedPlan.length > 0) {
          // NUEVO: Validar estructura de datos
          const isValidPlan = savedPlan.every(day => 
            day && 
            typeof day === 'object' && 
            'dayName' in day && 
            'exercises' in day && 
            Array.isArray(day.exercises)
          );
          
          if (isValidPlan) {
            console.log('[TrainingDashboard] ✓ Plan cargado y validado desde Supabase:', savedPlan.length, 'días');
            setLocalWeekPlan(savedPlan);
          } else {
            console.warn('[TrainingDashboard] ⚠️ Plan guardado tiene estructura inválida');
          }
        } else {
          console.log('[TrainingDashboard] ℹ️ No hay plan guardado en Supabase');
        }
      } catch (error) {
        console.error('[TrainingDashboard] ❌ Error cargando plan:', error);
      }
    };
    
    loadSavedPlan();
  }, [user.email, weekPlan]); // Agregar weekPlan como dependencia

  // Calcular inicio de la semana actual (Lunes)
  const getWeekStart = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    // Usar formato local en lugar de UTC
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const day = String(monday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calcular final de la semana actual (Domingo)
  const getWeekEnd = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + diff);
    sunday.setHours(23, 59, 59, 999);
    // Usar formato local en lugar de UTC
    const year = sunday.getFullYear();
    const month = String(sunday.getMonth() + 1).padStart(2, '0');
    const day = String(sunday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart());

  // NUEVO: Auto-guardar progreso de ejercicios cada 5 segundos
  useEffect(() => {
    if (!selectedDayToTrain || Object.keys(exerciseReps).length === 0) return;
    
    const saveProgress = async () => {
      try {
        const todayDate = new Date().toISOString().split('T')[0];
        
        const progressData = {
          dayIndex: selectedDayToTrain,
          exerciseReps,
          exerciseWeights,
          timestamp: new Date().toISOString()
        };
        
        // ✅ Guardar en Supabase (sin localStorage)
        await api.saveTrainingProgress(user.email, todayDate, progressData);
        
        console.log('💾 Auto-guardando progreso de entrenamiento en Supabase...');
      } catch (error) {
        console.error('Error auto-guardando progreso:', error);
      }
    };
    
    // Auto-guardar cada 5 segundos
    const interval = setInterval(saveProgress, 5000);
    
    return () => clearInterval(interval);
  }, [exerciseReps, exerciseWeights, selectedDayToTrain, user.email]);
  
  // NUEVO: Cargar progreso guardado al seleccionar un día
  useEffect(() => {
    if (selectedDayToTrain === null) return;
    
    const loadProgress = async () => {
      try {
        const todayDate = new Date().toISOString().split('T')[0];
        
        // ✅ Cargar desde Supabase (sin localStorage)
        const savedProgress = await api.getTrainingProgress(user.email, todayDate);
        
        if (savedProgress) {
          const { dayIndex, exerciseReps: savedReps, exerciseWeights: savedWeights } = savedProgress;
          
          // Solo cargar si es el mismo día
          if (dayIndex === selectedDayToTrain) {
            setExerciseReps(savedReps || {});
            setExerciseWeights(savedWeights || {});
            console.log('✅ Progreso de entrenamiento restaurado desde Supabase');
          }
        }
      } catch (error) {
        console.error('Error cargando progreso:', error);
      }
    };
    
    loadProgress();
  }, [selectedDayToTrain, user.email]);

  // Cargar entrenamientos completados de Supabase
  useEffect(() => {
    const loadCompletedWorkouts = async () => {
      setIsLoadingWorkouts(true);
      try {
        const workouts = await api.getCompletedWorkouts(user.email);
        const weekStart = getWeekStart();
        const weekEnd = getWeekEnd();
        const thisWeekWorkouts = workouts.filter((w: CompletedWorkout) => 
          w.date >= weekStart && w.date <= weekEnd
        );
        console.log('[TrainingDashboard] 📅 Semana:', weekStart, '-', weekEnd, '| Completados esta semana:', thisWeekWorkouts.length);
        setCompletedWorkouts(thisWeekWorkouts);
      } catch (error) {
        console.error('Error loading completed workouts:', error);
        setCompletedWorkouts([]);
      } finally {
        setIsLoadingWorkouts(false);
      }
    };

    loadCompletedWorkouts();
  }, [user.email]);

  // Guardar entrenamientos completados en Supabase
  const saveCompletedWorkouts = async (workouts: CompletedWorkout[]) => {
    setCompletedWorkouts(workouts);
    try {
      await api.saveCompletedWorkouts(user.email, workouts);
    } catch (error) {
      console.error('Error saving completed workouts:', error);
    }
  };

  // Verificar si un día del plan ya se completó esta semana
  const isDayPlanCompletedThisWeek = (dayPlanIndex: number) => {
    return completedWorkouts.some(w => w.dayPlanIndex === dayPlanIndex);
  };

  // Verificar si una fecha específica tiene un entrenamiento completado
  const isDateCompleted = (dateStr: string) => {
    return completedWorkouts.some(w => w.date === dateStr);
  };

  // Obtener el entrenamiento completado de una fecha específica
  const getWorkoutForDate = (dateStr: string) => {
    return completedWorkouts.find(w => w.date === dateStr);
  };

  // Obtener entrenamientos completados esta semana
  const workoutsThisWeek = completedWorkouts.length;
  const workoutsRemaining = trainingDays - workoutsThisWeek;

  // Calcular racha
  const calculateStreak = () => {
    return workoutsThisWeek;
  };

  const currentStreak = calculateStreak();

  // Función para obtener los grupos musculares de un día
  const getMuscleGroups = (exercises: Exercise[]): string => {
    if (exercises.length === 0) return '';
    
    // Contar ejercicios por categoría
    const categoryCount: { [key: string]: number } = {};
    exercises.forEach(ex => {
      const cat = ex.category || 'otros';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    
    // Ordenar por cantidad de ejercicios (más repetidos primero)
    const sortedCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);
    
    // Obtener nombres legibles de las categorías
    const categoryNames = sortedCategories
      .slice(0, 3) // Máximo 3 grupos musculares
      .map(catId => {
        const found = muscleCategories.find(mc => mc.id === catId);
        return found ? found.name : catId;
      });
    
    return categoryNames.join(' + ');
  };

  // Obtener el siguiente día del plan que toca entrenar
  // Usar useMemo para recalcular cuando cambien completedWorkouts o localWeekPlan
  const nextDayPlanIndex = useMemo(() => {
    // Obtener qué días del plan ya se completaron esta semana
    const completedDayPlanIndices = completedWorkouts.map(w => w.dayPlanIndex);
    
    console.log('[TrainingDashboard] 🔍 Calculando siguiente día...');
    console.log('[TrainingDashboard] 📊 completedWorkouts:', completedWorkouts);
    console.log('[TrainingDashboard] 📋 completedDayPlanIndices:', JSON.stringify(completedDayPlanIndices));
    console.log('[TrainingDashboard] 📅 localWeekPlan length:', localWeekPlan.length);
    
    // Buscar el primer día del plan que no se ha completado
    for (let i = 0; i < localWeekPlan.length; i++) {
      if (!completedDayPlanIndices.includes(i)) {
        console.log(`[TrainingDashboard] ✅ Siguiente día encontrado: ${i} (Día ${i + 1})`);
        return i;
      }
    }
    
    // Si todos están completados, volver al primero
    console.log('[TrainingDashboard] 🔄 Todos completados, volviendo al Día 1');
    return 0;
  }, [completedWorkouts, localWeekPlan]);

  // Log para debugging - solo cuando cambia el siguiente día a entrenar
  useEffect(() => {
    if (completedWorkouts.length > 0) {
      const completedDays = completedWorkouts.map(w => `Día ${w.dayPlanIndex + 1}`).join(', ');
      console.log(`[TrainingDashboard] ✅ Días completados: ${completedDays} | ➡️ Siguiente: Día ${nextDayPlanIndex + 1}`);
    } else {
      console.log(`[TrainingDashboard] ➡️ Ningún día completado | Siguiente: Día ${nextDayPlanIndex + 1}`);
    }
  }, [nextDayPlanIndex, completedWorkouts]);

  // Obtener día de la semana actual (0 = Domingo, 1 = Lunes, etc.)
  const getCurrentDayOfWeek = () => {
    const today = new Date();
    const day = today.getDay();
    // Convertir a formato Lunes = 0, Martes = 1, ..., Domingo = 6
    return day === 0 ? 6 : day - 1;
  };

  // Días de la semana
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  
  // Obtener fecha para cada día de la semana (números)
  const getWeekDates = () => {
    const weekStart = new Date(currentWeekStart);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return date.getDate();
    });
  };

  // Obtener fechas completas en formato YYYY-MM-DD para cada día
  const getWeekFullDates = () => {
    const weekStart = new Date(currentWeekStart);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      // Usar formato local en lugar de UTC
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });
  };

  const weekDates = getWeekDates();
  const weekFullDates = getWeekFullDates();
  const currentDayIndex = getCurrentDayOfWeek();

  // Obtener días visibles centrados en hoy
  // Desktop: 5 días (2 antes, hoy, 2 después)
  // Mobile: Todos los días de la semana (7 días)
  const getVisibleDaysIndices = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    
    if (isMobile) {
      // Mobile: Mostrar toda la semana (7 días)
      return [0, 1, 2, 3, 4, 5, 6];
    } else {
      // Desktop: Mostrar 5 días centrados en hoy (2 antes, hoy, 2 después)
      const startIndex = Math.max(0, currentDayIndex - 2);
      const endIndex = Math.min(6, startIndex + 4);
      return Array.from({ length: endIndex - startIndex + 1 }, (_, i) => startIndex + i);
    }
  };

  const [visibleDaysIndices, setVisibleDaysIndices] = useState(getVisibleDaysIndices());

  // Actualizar días visibles cuando cambia el tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      setVisibleDaysIndices(getVisibleDaysIndices());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentDayIndex]);

  // Mapear días de la semana a planes (si hay menos de 7 planes, algunos días estarán sin plan)
  const getDayPlanIndex = (dayIndex: number) => {
    // Si hay planes configurados, mapear circularmente
    if (localWeekPlan.length === 0) return null;
    return dayIndex % localWeekPlan.length;
  };

  // Entrenar un día específico
  const handleStartWorkout = (dayIndex: number) => {
    setSelectedDayToTrain(dayIndex);
    setShowDaySelector(false);
    
    // Inicializar arrays de reps para cada ejercicio
    const initialReps: { [exerciseId: string]: number[] } = {};
    localWeekPlan[dayIndex].exercises.forEach(exercise => {
      initialReps[exercise.id] = Array(exercise.sets).fill(0);
    });
    setExerciseReps(initialReps);

    // Inicializar arrays de pesos para cada ejercicio
    const initialWeights: { [exerciseId: string]: number[] } = {};
    localWeekPlan[dayIndex].exercises.forEach(exercise => {
      initialWeights[exercise.id] = Array(exercise.sets).fill(0);
    });
    setExerciseWeights(initialWeights);
  };

  // Actualizar repeticiones de un ejercicio en una serie específica
  const updateExerciseReps = (exerciseId: string, setIndex: number, reps: number) => {
    setExerciseReps(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((r, i) => i === setIndex ? reps : r)
    }));
  };

  // Actualizar pesos de un ejercicio en una serie específica
  const updateExerciseWeights = (exerciseId: string, setIndex: number, weight: number) => {
    setExerciseWeights(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((w, i) => i === setIndex ? weight : w)
    }));
  };

  // Verificar si todas las series tienen repeticiones registradas
  const allSetsCompleted = () => {
    if (selectedDayToTrain === null) return false;
    
    const currentExercises = localWeekPlan[selectedDayToTrain].exercises;
    return currentExercises.every(exercise => {
      const reps = exerciseReps[exercise.id] || [];
      return reps.every(r => r > 0);
    });
  };

  // Marcar entrenamiento como completado
  const handleCompleteWorkout = async () => {
    if (selectedDayToTrain === null) return;

    if (!allSetsCompleted()) {
      alert('⚠️ Por favor, registra las repeticiones de todas las series antes de marcar como completado.');
      return;
    }

    // Usar fecha local en lugar de UTC
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    const newWorkout: CompletedWorkout = {
      date: today,
      dayPlanIndex: selectedDayToTrain,
      dayPlanName: localWeekPlan[selectedDayToTrain].dayName,
      exerciseReps: exerciseReps,
      exerciseWeights: exerciseWeights
    };

    const updatedWorkouts = [...completedWorkouts, newWorkout];
    saveCompletedWorkouts(updatedWorkouts);
    
    // ✅ Limpiar progreso guardado en Supabase ya que el entrenamiento se completó
    await api.deleteTrainingProgress(user.email, today);
    console.log('✅ Progreso guardado eliminado de Supabase tras completar entrenamiento');
    
    setShowCompletedModal(true);
    setTimeout(() => {
      setShowCompletedModal(false);
      setSelectedDayToTrain(null);
      setExerciseReps({});
      setExerciseWeights({});
    }, 2000);
  };

  // Verificar si estamos en una nueva semana
  useEffect(() => {
    const weekStart = getWeekStart();
    if (weekStart !== currentWeekStart) {
      setCurrentWeekStart(weekStart);
    }
  }, []);

  // Efecto para el cronómetro de descanso
  useEffect(() => {
    if (!activeRestTimer || isRestPaused || restTimeRemaining <= 0) return;

    const interval = setInterval(() => {
      setRestTimeRemaining(prev => {
        if (prev <= 1) {
          playRestCompleteNotification();
          setActiveRestTimer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRestTimer, isRestPaused, restTimeRemaining]);

  // Función para reproducir notificación cuando termina el descanso
  const playRestCompleteNotification = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    alert('⏰ ¡Descanso completado! Es hora de la siguiente serie.');
  };

  // Pausar/reanudar cronómetro
  const toggleRestPause = () => {
    setIsRestPaused(prev => !prev);
  };

  // Cancelar cronómetro y marcar como completado
  const cancelRestTimer = () => {
    if (activeRestTimer) {
      setCompletedRests(prev => ({
        ...prev,
        [activeRestTimer]: true
      }));
    }
    
    setActiveRestTimer(null);
    setRestTimeRemaining(0);
    setIsRestPaused(false);
    setShowRestModal(false);
  };

  // Formatear tiempo para mostrar (mm:ss)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Si está en modo edición completa, mostrar la página de edición
  if (showFullEditPage) {
    return (
      <EditFullTrainingPlan
        weekPlan={localWeekPlan}
        onSave={async (newPlan) => {
          setLocalWeekPlan(newPlan);
          await api.saveTrainingPlan(user.email, newPlan);
        }}
        onBack={() => setShowFullEditPage(false)}
      />
    );
  }

  return (
    <div className="px-4 pt-4 pb-8 space-y-4 bg-neutral-50">
      {/* Vista: Sin entrenamiento seleccionado */}
      {selectedDayToTrain === null && (
        <>
          {/* DÍAS DE LA SEMANA */}
          <div className="mb-4">
            {/* Días visibles centrados en hoy */}
            {/* Vista MÓVIL: Grid completo de 7 días */}
            <div className="sm:hidden px-3">
              <div className="grid grid-cols-7 gap-1.5">
                {visibleDaysIndices.map((dayIndex) => {
                    const isToday = dayIndex === currentDayIndex;
                    const fullDate = weekFullDates[dayIndex];
                    const isCompleted = isDateCompleted(fullDate);
                    const completedWorkout = getWorkoutForDate(fullDate);
                    const dateNumber = weekDates[dayIndex];
                    const dayName = weekDays[dayIndex];
                    
                    // Para HOY, mostrar el siguiente plan que toca
                    const displayPlanIndex = isToday ? nextDayPlanIndex : null;
                    const todayPlan = isToday && displayPlanIndex !== null ? localWeekPlan[displayPlanIndex] : null;

                    return (
                      <div
                        key={dayIndex}
                        className="flex flex-col"
                      >
                        <div className={`
                          rounded-lg transition-all duration-300 overflow-hidden
                          ${isToday ? 'ring-2 ring-emerald-500 shadow-lg' : ''}
                          ${isCompleted 
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md' 
                            : 'bg-white border border-neutral-200 shadow-sm'
                          }
                        `}>
                          {/* Contenido del día */}
                          <div className="p-2">
                            {/* Nombre del día */}
                            <div className={`text-[8px] font-bold uppercase text-center mb-1 ${
                              isCompleted ? 'text-emerald-100' : isToday ? 'text-emerald-700' : 'text-neutral-500'
                            }`}>
                              {dayName.slice(0, 1)}
                            </div>
                            
                            {/* Número del día */}
                            <div className="text-center mb-1.5">
                              <div className={`text-xl font-bold ${
                                isCompleted ? 'text-white' : isToday ? 'text-emerald-600' : 'text-neutral-800'
                              }`}>
                                {dateNumber}
                              </div>
                            </div>

                            {/* Indicador de estado */}
                            <div className="flex justify-center">
                              {isCompleted ? (
                                <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-md flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                                </div>
                              ) : isToday ? (
                                <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-md flex items-center justify-center shadow-sm">
                                  <Dumbbell className="w-3.5 h-3.5 text-white" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-neutral-100 rounded-md flex items-center justify-center">
                                  <Circle className="w-2.5 h-2.5 text-neutral-400" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
            </div>

            {/* Vista DESKTOP: Grid centrado */}
            <div className="hidden sm:block p-6 md:p-8">
              <div className="flex justify-center">
                <div className="flex gap-4 md:gap-5">
                  {visibleDaysIndices.map((dayIndex) => {
                    const isToday = dayIndex === currentDayIndex;
                    const fullDate = weekFullDates[dayIndex];
                    const isCompleted = isDateCompleted(fullDate);
                    const completedWorkout = getWorkoutForDate(fullDate);
                    const dateNumber = weekDates[dayIndex];
                    const dayName = weekDays[dayIndex];
                    
                    // Para HOY, mostrar el siguiente plan que toca
                    const displayPlanIndex = isToday ? nextDayPlanIndex : null;
                    const todayPlan = isToday && displayPlanIndex !== null ? localWeekPlan[displayPlanIndex] : null;

                    return (
                      <div
                        key={dayIndex}
                        className="flex-shrink-0 w-36 md:w-40"
                      >
                        <div className={`
                          rounded-3xl transition-all duration-300 overflow-hidden
                          ${isToday ? 'ring-3 ring-emerald-500 shadow-2xl scale-105' : ''}
                          ${isCompleted 
                            ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white shadow-xl' 
                            : 'bg-white border-2 border-neutral-200 shadow-md hover:shadow-lg'
                          }
                        `}>
                          {/* Header del día */}
                          <div className="p-6">
                            {/* Nombre del día */}
                            <div className={`text-xs md:text-sm font-bold uppercase tracking-wider text-center mb-3 ${
                              isCompleted ? 'text-emerald-100' : isToday ? 'text-emerald-700' : 'text-neutral-500'
                            }`}>
                              {dayName}
                            </div>
                            
                            {/* Número del día */}
                            <div className="text-center mb-4">
                              <div className={`text-5xl md:text-6xl font-bold ${
                                isCompleted ? 'text-white' : isToday ? 'text-emerald-600' : 'text-neutral-800'
                              }`}>
                                {dateNumber}
                              </div>
                            </div>

                            {/* Indicador de estado */}
                            <div className="flex flex-col items-center gap-3">
                              {isCompleted ? (
                                <>
                                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                    <Check className="w-8 h-8 text-white stroke-[2.5]" />
                                  </div>
                                  <div className="text-center">
                                    <span className="text-sm font-bold text-white block mb-1">
                                      Completado
                                    </span>
                                    <span className="text-xs font-medium text-emerald-100">
                                      {completedWorkout?.dayPlanName}
                                    </span>
                                  </div>
                                </>
                              ) : isToday ? (
                                <>
                                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Dumbbell className="w-8 h-8 text-white" />
                                  </div>
                                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                                    HOY
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center">
                                    <Circle className="w-6 h-6 text-neutral-400" />
                                  </div>
                                  <span className="text-xs font-medium text-neutral-400">
                                    Pendiente
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Botón de Iniciar Entrenamiento */}
            {(() => {
              const todayFullDate = weekFullDates[currentDayIndex];
              const isTodayCompleted = isDateCompleted(todayFullDate);
              const displayPlanIndex = nextDayPlanIndex;
              const todayPlan = displayPlanIndex !== null && localWeekPlan[displayPlanIndex];
              
              if (!isTodayCompleted && todayPlan) {
                return (
                  <div className="px-4 sm:px-6 md:px-8 pt-6 pb-4">
                    <div className="max-w-4xl mx-auto">
                      <button
                        onClick={() => handleStartWorkout(displayPlanIndex)}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg"
                      >
                        <Play className="w-5 h-5 sm:w-6 sm:h-6" />
                        Iniciar Entrenamiento
                      </button>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Sección de Entrenamiento de Hoy */}
            {(() => {
              const todayFullDate = weekFullDates[currentDayIndex];
              const isTodayCompleted = isDateCompleted(todayFullDate);
              const displayPlanIndex = nextDayPlanIndex;
              const todayPlan = displayPlanIndex !== null && localWeekPlan[displayPlanIndex];
              
              if (isTodayCompleted) {
                return (
                  <div className="border-t border-neutral-200 bg-gradient-to-br from-emerald-50 to-teal-50 px-4 sm:px-6 md:px-8 py-4 sm:py-5">
                    <div className="flex items-center justify-between max-w-3xl mx-auto">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <Check className="w-7 h-7 text-white stroke-[2.5]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-emerald-800">¡Entrenamiento completado!</h3>
                          <p className="text-sm text-emerald-600">Excelente trabajo hoy 🎉</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('¿Reiniciar el entrenamiento de hoy?')) {
                            const updatedWorkouts = completedWorkouts.filter(w => w.date !== todayFullDate);
                            saveCompletedWorkouts(updatedWorkouts);
                          }
                        }}
                        className="bg-white hover:bg-neutral-50 text-emerald-700 border-2 border-emerald-300 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                      >
                        <Target className="w-4 h-4" />
                        <span className="hidden sm:inline">Reiniciar</span>
                      </button>
                    </div>
                  </div>
                );
              } else if (todayPlan) {
                return (
                  <div className="border-t border-neutral-200 bg-neutral-50 px-4 sm:px-6 md:px-8 py-5 sm:py-6">
                    <div className="max-w-4xl mx-auto">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Dumbbell className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-0.5">Entrenamiento de hoy</p>
                            <h3 className="text-xl font-bold text-neutral-800">{todayPlan.dayName}</h3>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setTempDayExercises([...todayPlan.exercises]);
                            setSelectedDayToTrain(displayPlanIndex);
                            setShowEditWorkoutModal(true);
                          }}
                          className="bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Editar</span>
                        </button>
                      </div>

                      {/* Lista de ejercicios */}
                      <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200">
                        <p className="text-sm font-bold text-neutral-600 mb-3">{todayPlan.exercises.length} ejercicios:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {todayPlan.exercises.map((ex, idx) => (
                            <div key={ex.id} className="flex items-center gap-2.5 bg-neutral-50 rounded-lg px-3 py-2.5">
                              <span className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-sm font-medium text-neutral-800 truncate flex-1">{ex.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <div className="bg-white rounded-3xl shadow-lg border border-neutral-200 overflow-hidden">
            {/* MI PLAN DE ENTRENAMIENTO SEMANAL - Header */}
            <div className="bg-gradient-to-r from-neutral-800 to-neutral-900 text-white p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-xl">
                  <List className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Mi Plan de Entrenamiento</h2>
                  <p className="text-neutral-300 text-sm">{localWeekPlan.length} días · {localWeekPlan.reduce((acc, day) => acc + day.exercises.length, 0)} ejercicios totales</p>
                </div>
              </div>
            </div>

            {/* Contenido del plan */}
            <div className="p-5 sm:p-6 md:p-8">
              {/* Vista previa compacta de los días */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {localWeekPlan.slice(0, 4).map((day, index) => {
                  const isCompleted = isDayPlanCompletedThisWeek(index);
                  
                  return (
                    <div
                      key={index}
                      className={`border-2 rounded-xl p-3 sm:p-4 transition-all ${
                        isCompleted
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-neutral-50 border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white text-neutral-700 border-2 border-neutral-200'
                        }`}>
                          {isCompleted ? <Check className="w-5 h-5 sm:w-6 sm:h-6" /> : index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-neutral-800 truncate">
                            {day.dayName}{getMuscleGroups(day.exercises) && `: ${getMuscleGroups(day.exercises)}`}
                          </h3>
                          <p className="text-xs text-neutral-500">
                            {day.exercises.length} ejercicio{day.exercises.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {isCompleted && (
                          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Si hay más de 4 días, mostrar indicador */}
              {localWeekPlan.length > 4 && (
                <div className="text-center mb-5">
                  <p className="text-sm text-neutral-500">
                    + {localWeekPlan.length - 4} día{localWeekPlan.length - 4 !== 1 ? 's' : ''} más
                  </p>
                </div>
              )}

              {/* Botón de Ver/Editar Plan */}
              <button
                onClick={() => setShowFullEditPage(true)}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg"
              >
                <Edit2 className="w-5 h-5 sm:w-6 sm:h-6" />
                Ver y Editar Plan Completo
              </button>
            </div>
          </div>
        </>
      )}

      {/* Vista: Entrenamiento activo */}
      {selectedDayToTrain !== null && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white p-4 sm:p-5 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-white/20 p-2.5 sm:p-3 rounded-xl backdrop-blur-sm">
                  <Dumbbell className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-0.5">
                    {localWeekPlan[selectedDayToTrain].dayName}
                  </h1>
                  <p className="text-emerald-100 text-xs sm:text-sm">
                    {localWeekPlan[selectedDayToTrain].exercises.length} ejercicios · {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedDayToTrain(null)}
                  className="flex-1 sm:flex-none bg-white/20 hover:bg-white/30 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all font-medium text-xs sm:text-sm active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCompleteWorkout}
                  className="flex-1 sm:flex-none bg-white text-emerald-600 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold hover:bg-emerald-50 transition-all shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm active:scale-95"
                >
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Marcar como Completado</span>
                  <span className="sm:hidden">Completar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Ejercicios */}
          <div className="p-4 sm:p-5 md:p-6 space-y-3">
            {localWeekPlan[selectedDayToTrain].exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 sm:p-4 hover:shadow-md hover:border-emerald-300 transition-all"
              >
                <div className="flex items-start gap-2 sm:gap-3 mb-3">
                  <div className="bg-emerald-100 text-emerald-700 font-bold rounded-lg w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 text-sm sm:text-base">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-neutral-800 mb-2 break-words">
                      {exercise.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-neutral-600 mb-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-[10px] sm:text-xs font-medium text-neutral-500">Series:</span>
                        <span className="bg-emerald-100 text-emerald-700 font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-xs sm:text-sm">
                          {exercise.sets}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-[10px] sm:text-xs font-medium text-neutral-500">Reps objetivo:</span>
                        <span className="bg-blue-100 text-blue-700 font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-xs sm:text-sm">
                          {exercise.reps}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-[10px] sm:text-xs font-medium text-neutral-500">Descanso:</span>
                        <span className="bg-orange-100 text-orange-700 font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-xs sm:text-sm">
                          {exercise.restTime}s
                        </span>
                      </div>
                    </div>

                    {/* Inputs de repeticiones y pesos por serie */}
                    <div className="bg-white rounded-lg p-2.5 sm:p-3 border border-neutral-200">
                      <p className="text-xs font-semibold text-neutral-700 mb-3">Registra cada serie:</p>
                      <div className="space-y-3">
                        {Array.from({ length: exercise.sets }).map((_, setIndex) => {
                          const restKey = `${exercise.id}-${setIndex}`;
                          const isRestCompleted = completedRests[restKey];
                          
                          return (
                            <div key={setIndex} className="space-y-2">
                              <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                                <div className="bg-emerald-100 text-emerald-700 font-bold rounded-lg w-8 h-8 flex items-center justify-center shrink-0 text-xs">
                                  {setIndex + 1}
                                </div>
                                
                                <div className="flex-1">
                                  <label className="block text-[10px] text-neutral-500 mb-1 font-medium">
                                    Reps
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="999"
                                    value={exerciseReps[exercise.id]?.[setIndex] || ''}
                                    onChange={(e) => updateExerciseReps(exercise.id, setIndex, parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                    className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg text-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white"
                                  />
                                </div>
                                
                                <div className="flex-1">
                                  <label className="block text-[10px] text-neutral-500 mb-1 font-medium">
                                    Peso (kg)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="999"
                                    step="0.5"
                                    value={exerciseWeights[exercise.id]?.[setIndex] || ''}
                                    onChange={(e) => updateExerciseWeights(exercise.id, setIndex, parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    className="w-full px-2 py-1.5 border border-neutral-300 rounded-lg text-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
                                  />
                                </div>
                              </div>

                              {isRestCompleted ? (
                                <div className="w-full bg-emerald-500 text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                                  <Check className="w-4 h-4" />
                                  Descanso Completado
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActiveRestTimer(restKey);
                                    setRestTimeRemaining(exercise.restTime);
                                    setIsRestPaused(false);
                                    setCurrentRestExerciseTime(exercise.restTime);
                                    setShowRestModal(true);
                                  }}
                                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                >
                                  <Timer className="w-4 h-4" />
                                  Iniciar Descanso ({exercise.restTime}s)
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {!allSetsCompleted() && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                <div className="bg-amber-100 p-1.5 rounded-lg shrink-0">
                  <Zap className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-amber-900 mb-0.5">
                    Registra todas las repeticiones
                  </p>
                  <p className="text-xs text-amber-700">
                    Completa los campos de repeticiones antes de marcar el entrenamiento como completado
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Selector de Día */}
      {showDaySelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 p-4 sm:p-6 flex items-center justify-between rounded-t-2xl sm:rounded-t-3xl">
              <h2 className="text-lg sm:text-2xl font-bold text-neutral-800">
                Selecciona tu entrenamiento
              </h2>
              <button
                onClick={() => setShowDaySelector(false)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors p-1.5 sm:p-2 hover:bg-neutral-100 rounded-lg active:scale-95"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3">
              {localWeekPlan.map((day, index) => {
                const isCompleted = isDayPlanCompletedThisWeek(index);
                return (
                  <button
                    key={index}
                    onClick={() => !isCompleted && handleStartWorkout(index)}
                    disabled={isCompleted}
                    className={`w-full text-left border-2 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all ${
                      isCompleted
                        ? 'bg-emerald-50 border-emerald-300 opacity-60 cursor-not-allowed'
                        : 'bg-white border-neutral-200 hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-md active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {isCompleted ? <Check className="w-6 h-6 sm:w-7 sm:h-7" /> : index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-lg font-bold text-neutral-800 mb-0.5 sm:mb-1 truncate">
                            {day.dayName}{getMuscleGroups(day.exercises) && `: ${getMuscleGroups(day.exercises)}`}
                          </h3>
                          <p className="text-xs sm:text-sm text-neutral-500">
                            {day.exercises.length} ejercicios
                          </p>
                        </div>
                      </div>
                      {isCompleted ? (
                        <span className="text-emerald-600 font-bold text-xs sm:text-sm bg-emerald-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full whitespace-nowrap">
                          ✓ Hecho
                        </span>
                      ) : (
                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Completado */}
      {showCompletedModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-8 sm:p-12 text-center max-w-md w-full">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6 shadow-xl">
              <Trophy className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-2 sm:mb-3">
              ¡Entrenamiento Completado! 💪
            </h2>
            <p className="text-neutral-600 text-base sm:text-lg mb-2">
              Has completado <span className="font-bold text-emerald-600">{workoutsThisWeek} de {trainingDays}</span> entrenamientos esta semana
            </p>
            {workoutsThisWeek === trainingDays && (
              <p className="text-emerald-600 font-bold text-lg sm:text-xl mt-4">
                🎉 ¡Semana completa!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal de Descanso */}
      {showRestModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 flex flex-col items-center justify-center z-[100] p-4">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-8 sm:mb-12 shadow-2xl animate-pulse">
            <Timer className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-2 text-center">
            Descansando
          </h1>
          <p className="text-white/80 text-base sm:text-xl mb-8 sm:mb-12 text-center">
            Recupera energía para la siguiente serie
          </p>

          <div className="mb-8 sm:mb-12 text-center">
            <div className="text-8xl sm:text-9xl md:text-[12rem] font-bold text-white mb-6 tabular-nums tracking-tight">
              {formatTime(restTimeRemaining)}
            </div>
            
            <div className="w-72 sm:w-96 md:w-[32rem] h-4 sm:h-6 bg-white/20 rounded-full overflow-hidden mx-auto">
              <div 
                className="h-full bg-white transition-all duration-1000 ease-linear shadow-lg"
                style={{ width: `${(restTimeRemaining / currentRestExerciseTime) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button
              onClick={toggleRestPause}
              className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 sm:px-8 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl"
            >
              {isRestPaused ? (
                <>
                  <Play className="w-6 h-6 sm:w-7 sm:h-7" />
                  Reanudar
                </>
              ) : (
                <>
                  <Pause className="w-6 h-6 sm:w-7 sm:h-7" />
                  Pausar
                </>
              )}
            </button>
            
            <button
              onClick={cancelRestTimer}
              className="flex-1 bg-white text-orange-600 hover:bg-orange-50 px-6 sm:px-8 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg transition-all active:scale-95 shadow-xl"
            >
              Saltar Descanso
            </button>
          </div>

          <p className="text-white/60 text-xs sm:text-sm mt-6 text-center">
            Presiona "Saltar Descanso" para continuar antes de tiempo
          </p>
        </div>
      )}

      {/* Modal de Edición de Entrenamiento */}
      {showEditWorkoutModal && selectedDayToTrain !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl sm:text-2xl font-bold">Editar Entrenamiento</h2>
                <button
                  onClick={() => {
                    setShowEditWorkoutModal(false);
                    setSelectedDayToTrain(null);
                  }}
                  className="text-white/80 hover:text-white p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-emerald-100 text-sm">
                {localWeekPlan[selectedDayToTrain].dayName} · {tempDayExercises.length} ejercicios
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
              {tempDayExercises.map((exercise, index) => (
                <div key={exercise.id} className="bg-neutral-50 border-2 border-neutral-200 rounded-xl p-4 hover:border-emerald-300 transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-emerald-100 text-emerald-700 font-bold rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">Ejercicio</label>
                        <input
                          type="text"
                          value={exercise.name}
                          onChange={(e) => {
                            const newExercises = [...tempDayExercises];
                            newExercises[index] = { ...newExercises[index], name: e.target.value };
                            setTempDayExercises(newExercises);
                          }}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-sm"
                          placeholder="Nombre del ejercicio"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">Series</label>
                          <input
                            type="number"
                            min="1"
                            value={exercise.sets}
                            onChange={(e) => {
                              const newExercises = [...tempDayExercises];
                              newExercises[index] = { ...newExercises[index], sets: parseInt(e.target.value) || 1 };
                              setTempDayExercises(newExercises);
                            }}
                            className="w-full px-2 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-center font-bold text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">Reps</label>
                          <input
                            type="text"
                            value={exercise.reps}
                            onChange={(e) => {
                              const newExercises = [...tempDayExercises];
                              newExercises[index] = { ...newExercises[index], reps: e.target.value };
                              setTempDayExercises(newExercises);
                            }}
                            className="w-full px-2 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center font-bold text-sm"
                            placeholder="8-10"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">Desc. (s)</label>
                          <input
                            type="number"
                            min="0"
                            value={exercise.restTime}
                            onChange={(e) => {
                              const newExercises = [...tempDayExercises];
                              newExercises[index] = { ...newExercises[index], restTime: parseInt(e.target.value) || 60 };
                              setTempDayExercises(newExercises);
                            }}
                            className="w-full px-2 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-center font-bold text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        // NUEVO: Confirmación antes de eliminar
                        if (confirm('¿Estás seguro de que quieres eliminar este ejercicio?')) {
                          const newExercises = tempDayExercises.filter((_, i) => i !== index);
                          setTempDayExercises(newExercises);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => {
                  const newExercise: Exercise = {
                    id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: 'Nuevo Ejercicio',
                    sets: 3,
                    reps: '8-12',
                    restTime: 60
                  };
                  setTempDayExercises([...tempDayExercises, newExercise]);
                }}
                className="w-full border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 rounded-xl p-4 transition-all flex items-center justify-center gap-2 font-medium"
              >
                <Plus className="w-5 h-5" />
                Agregar Ejercicio
              </button>
            </div>

            <div className="border-t border-neutral-200 p-5 sm:p-6 bg-neutral-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    if (selectedDayToTrain !== null) {
                      const newPlan = [...localWeekPlan];
                      newPlan[selectedDayToTrain] = {
                        ...newPlan[selectedDayToTrain],
                        exercises: tempDayExercises
                      };
                      setLocalWeekPlan(newPlan);
                      
                      const initialReps: { [exerciseId: string]: number[] } = {};
                      tempDayExercises.forEach(exercise => {
                        initialReps[exercise.id] = Array(exercise.sets).fill(0);
                      });
                      setExerciseReps(initialReps);

                      const initialWeights: { [exerciseId: string]: number[] } = {};
                      tempDayExercises.forEach(exercise => {
                        initialWeights[exercise.id] = Array(exercise.sets).fill(0);
                      });
                      setExerciseWeights(initialWeights);
                      
                      setShowEditWorkoutModal(false);
                      setSelectedDayToTrain(null);
                      alert('✓ Cambios guardados solo para el entrenamiento de hoy');
                    }
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                >
                  <Clock className="w-5 h-5" />
                  Guardar Solo Hoy
                </button>
                
                <button
                  onClick={async () => {
                    if (selectedDayToTrain !== null) {
                      try {
                        const newPlan = [...localWeekPlan];
                        newPlan[selectedDayToTrain] = {
                          ...newPlan[selectedDayToTrain],
                          exercises: tempDayExercises
                        };
                        setLocalWeekPlan(newPlan);
                        
                        const initialReps: { [exerciseId: string]: number[] } = {};
                        tempDayExercises.forEach(exercise => {
                          initialReps[exercise.id] = Array(exercise.sets).fill(0);
                        });
                        setExerciseReps(initialReps);

                        const initialWeights: { [exerciseId: string]: number[] } = {};
                        tempDayExercises.forEach(exercise => {
                          initialWeights[exercise.id] = Array(exercise.sets).fill(0);
                        });
                        setExerciseWeights(initialWeights);
                        
                        await api.saveTrainingPlan(user.email, newPlan);
                        
                        setShowEditWorkoutModal(false);
                        setSelectedDayToTrain(null);
                        alert('✓ Cambios guardados permanentemente');
                      } catch (error) {
                        console.error('Error guardando cambios:', error);
                        alert('❌ Error al guardar los cambios.');
                      }
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                >
                  <Save className="w-5 h-5" />
                  Guardar Permanente
                </button>
              </div>
              <p className="text-xs text-neutral-500 mt-3 text-center">
                <span className="font-semibold">Solo Hoy:</span> Para esta sesión · <span className="font-semibold">Permanente:</span> Actualiza tu plan
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
