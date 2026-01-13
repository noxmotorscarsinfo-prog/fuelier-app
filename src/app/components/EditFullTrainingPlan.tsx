import { useState } from 'react';
import { ArrowLeft, Edit2, Check, Plus, Trash2, Save, ChevronDown, ChevronUp, GripVertical, Calendar } from 'lucide-react';
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

interface EditFullTrainingPlanProps {
  weekPlan: DayPlan[];
  onSave: (newPlan: DayPlan[]) => Promise<void>;
  onBack: () => void;
}

export default function EditFullTrainingPlan({ weekPlan, onSave, onBack }: EditFullTrainingPlanProps) {
  const [localPlan, setLocalPlan] = useState<DayPlan[]>(JSON.parse(JSON.stringify(weekPlan)));
  // Abrir el primer día por defecto
  const [expandedDays, setExpandedDays] = useState<{ [key: number]: boolean }>({ 0: true });
  const [isSaving, setIsSaving] = useState(false);
  const [draggedDay, setDraggedDay] = useState<number | null>(null);

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

  const toggleDayExpanded = (index: number) => {
    setExpandedDays(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const updateDayName = (dayIndex: number, newName: string) => {
    const newPlan = [...localPlan];
    newPlan[dayIndex] = { ...newPlan[dayIndex], dayName: newName };
    setLocalPlan(newPlan);
  };

  // Función para actualizar automáticamente días vacíos a "Descanso"
  const autoUpdateRestDays = (plan: DayPlan[]) => {
    return plan.map(day => {
      if (day.exercises.length === 0 && !day.dayName.toLowerCase().includes('descanso')) {
        return { ...day, dayName: 'Descanso' };
      }
      return day;
    });
  };

  const updateExercise = (dayIndex: number, exerciseIndex: number, field: keyof Exercise, value: any) => {
    const newPlan = [...localPlan];
    const updatedExercise = { ...newPlan[dayIndex].exercises[exerciseIndex], [field]: value };
    newPlan[dayIndex].exercises[exerciseIndex] = updatedExercise;
    setLocalPlan(newPlan);
  };

  const deleteExercise = (dayIndex: number, exerciseIndex: number) => {
    const newPlan = [...localPlan];
    newPlan[dayIndex].exercises = newPlan[dayIndex].exercises.filter((_, i) => i !== exerciseIndex);
    
    // Si se eliminan todos los ejercicios, marcar como Descanso
    if (newPlan[dayIndex].exercises.length === 0 && !newPlan[dayIndex].dayName.toLowerCase().includes('descanso')) {
      newPlan[dayIndex].dayName = 'Descanso';
    }
    
    setLocalPlan(newPlan);
  };

  const addExercise = (dayIndex: number) => {
    const newExercise: Exercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Nuevo Ejercicio',
      sets: 3,
      reps: '8-12',
      restTime: 60
    };
    const newPlan = [...localPlan];
    newPlan[dayIndex].exercises = [...newPlan[dayIndex].exercises, newExercise];
    
    // Si el día era "Descanso" y ahora tiene ejercicios, cambiar el nombre
    if (newPlan[dayIndex].dayName.toLowerCase().includes('descanso') && newPlan[dayIndex].exercises.length > 0) {
      newPlan[dayIndex].dayName = `Día ${dayIndex + 1}`;
    }
    
    setLocalPlan(newPlan);
  };

  const addDay = () => {
    if (localPlan.length >= 7) {
      alert('⚠️ Máximo 7 días permitidos');
      return;
    }
    
    const newDay: DayPlan = {
      dayName: `Día ${localPlan.length + 1}`,
      exercises: []
    };
    
    setLocalPlan([...localPlan, newDay]);
    // Expandir el nuevo día automáticamente
    setExpandedDays(prev => ({ ...prev, [localPlan.length]: true }));
  };

  const deleteDay = (dayIndex: number) => {
    if (localPlan.length <= 1) {
      alert('⚠️ Debes tener al menos 1 día en tu plan');
      return;
    }
    
    if (confirm(`¿Eliminar "${localPlan[dayIndex].dayName}" y todos sus ejercicios?`)) {
      const newPlan = localPlan.filter((_, i) => i !== dayIndex);
      setLocalPlan(newPlan);
      // Limpiar estado de expansión
      const newExpandedDays: { [key: number]: boolean } = {};
      Object.keys(expandedDays).forEach(key => {
        const idx = parseInt(key);
        if (idx < dayIndex) {
          newExpandedDays[idx] = expandedDays[idx];
        } else if (idx > dayIndex) {
          newExpandedDays[idx - 1] = expandedDays[idx];
        }
      });
      setExpandedDays(newExpandedDays);
    }
  };

  const handleDragStart = (dayIndex: number) => {
    setDraggedDay(dayIndex);
  };

  const handleDragOver = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    if (draggedDay === null || draggedDay === dayIndex) return;
    
    const newPlan = [...localPlan];
    const draggedItem = newPlan[draggedDay];
    newPlan.splice(draggedDay, 1);
    newPlan.splice(dayIndex, 0, draggedItem);
    
    setLocalPlan(newPlan);
    setDraggedDay(dayIndex);
  };

  const handleDragEnd = () => {
    setDraggedDay(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Aplicar auto-actualización de días vacíos como "Descanso"
      const updatedPlan = autoUpdateRestDays(localPlan);
      await onSave(updatedPlan);
      alert('✓ Plan de entrenamiento guardado correctamente');
      onBack();
    } catch (error) {
      console.error('Error guardando el plan:', error);
      alert('❌ Error al guardar el plan. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header Sticky */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-neutral-800 to-neutral-900 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all font-medium text-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Volver</span>
            </button>
            
            <div className="flex-1 text-center">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Editar Plan Completo</h1>
              <p className="text-xs sm:text-sm text-neutral-300">
                {localPlan.length}/7 días · {localPlan.reduce((acc, day) => acc + day.exercises.length, 0)} ejercicios totales
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{isSaving ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Add Day Button */}
        {localPlan.length < 7 && (
          <div className="mb-4">
            <button
              onClick={addDay}
              className="w-full border-2 border-dashed border-emerald-400 hover:border-emerald-600 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-700 rounded-2xl p-5 transition-all flex items-center justify-center gap-3 font-bold text-base shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <Calendar className="w-6 h-6" />
              Agregar Día ({localPlan.length}/7)
            </button>
          </div>
        )}

        <div className="space-y-4">
          {localPlan.map((day, dayIndex) => {
            const isExpanded = expandedDays[dayIndex];
            const isDragging = draggedDay === dayIndex;

            return (
              <div
                key={dayIndex}
                draggable
                onDragStart={() => handleDragStart(dayIndex)}
                onDragOver={(e) => handleDragOver(e, dayIndex)}
                onDragEnd={handleDragEnd}
                className={`bg-white rounded-2xl shadow-md border-2 ${
                  isDragging ? 'border-emerald-500 opacity-50 scale-95' : 'border-neutral-200'
                } overflow-hidden transition-all hover:shadow-lg cursor-move`}
              >
                {/* Day Header */}
                <div className="bg-gradient-to-r from-neutral-100 to-neutral-50 border-b-2 border-neutral-200 p-4 sm:p-5">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-emerald-600 transition-colors">
                      <GripVertical className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
                      {dayIndex + 1}
                    </div>
                    
                    <div className="flex-1">
                      <input
                        type="text"
                        value={day.dayName}
                        onChange={(e) => updateDayName(dayIndex, e.target.value)}
                        className="w-full bg-transparent text-lg sm:text-xl font-bold text-neutral-800 border-0 border-b-2 border-transparent hover:border-emerald-300 focus:border-emerald-500 focus:outline-none px-2 py-1 transition-all"
                        placeholder="Nombre del día"
                      />
                      <p className="text-xs sm:text-sm text-neutral-500 px-2 mt-1">
                        {day.exercises.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                            Día de descanso
                          </span>
                        ) : (
                          <>
                            {day.exercises.length} ejercicio{day.exercises.length !== 1 ? 's' : ''} 
                            {getMuscleGroups(day.exercises) && ` · ${getMuscleGroups(day.exercises)}`}
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {localPlan.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDay(dayIndex);
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-300 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
                          title="Eliminar día"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => toggleDayExpanded(dayIndex)}
                        className="bg-white hover:bg-neutral-50 text-neutral-700 border-2 border-neutral-300 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
                        ) : (
                          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Exercises List (Expandable) */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-3">
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <div
                        key={exercise.id}
                        className="bg-neutral-50 border-2 border-neutral-200 rounded-xl p-3 sm:p-4 hover:border-emerald-300 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-emerald-100 text-emerald-700 font-bold rounded-lg w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 text-sm sm:text-base">
                            {exerciseIndex + 1}
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            {/* Exercise Name */}
                            <div>
                              <label className="block text-xs font-medium text-neutral-600 mb-1">
                                Ejercicio
                              </label>
                              <input
                                type="text"
                                value={exercise.name}
                                onChange={(e) => updateExercise(dayIndex, exerciseIndex, 'name', e.target.value)}
                                className="w-full px-3 py-2 border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-sm"
                                placeholder="Nombre del ejercicio"
                              />
                            </div>

                            {/* Sets, Reps, Rest */}
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">
                                  Series
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={exercise.sets}
                                  onChange={(e) => updateExercise(dayIndex, exerciseIndex, 'sets', parseInt(e.target.value) || 1)}
                                  className="w-full px-2 py-2 border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-center font-bold text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">
                                  Reps
                                </label>
                                <input
                                  type="text"
                                  value={exercise.reps}
                                  onChange={(e) => updateExercise(dayIndex, exerciseIndex, 'reps', e.target.value)}
                                  className="w-full px-2 py-2 border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center font-bold text-sm"
                                  placeholder="8-12"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">
                                  Desc. (s)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={exercise.restTime}
                                  onChange={(e) => updateExercise(dayIndex, exerciseIndex, 'restTime', parseInt(e.target.value) || 60)}
                                  className="w-full px-2 py-2 border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-center font-bold text-sm"
                                />
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar este ejercicio?')) {
                                deleteExercise(dayIndex, exerciseIndex);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all shrink-0"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Exercise Button */}
                    <button
                      onClick={() => addExercise(dayIndex)}
                      className="w-full border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 rounded-xl p-4 transition-all flex items-center justify-center gap-2 font-medium"
                    >
                      <Plus className="w-5 h-5" />
                      Agregar Ejercicio
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Save Button (Mobile Friendly) */}
        <div className="sticky bottom-0 mt-6 bg-white border-t-2 border-neutral-200 p-4 sm:p-5 rounded-t-2xl shadow-2xl">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg"
          >
            <Save className="w-5 h-5 sm:w-6 sm:h-6" />
            {isSaving ? 'Guardando cambios...' : 'Guardar Cambios'}
          </button>
          <p className="text-xs text-neutral-500 mt-3 text-center">
            Los cambios se guardarán permanentemente en tu plan de entrenamiento
          </p>
        </div>
      </div>
    </div>
  );
}