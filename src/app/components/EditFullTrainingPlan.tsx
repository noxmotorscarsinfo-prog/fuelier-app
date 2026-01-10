import { useState } from 'react';
import { ArrowLeft, Edit2, Check, Plus, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restTime: number;
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
  const [localPlan, setLocalPlan] = useState<DayPlan[]>(() => {
    try {
      return JSON.parse(JSON.stringify(weekPlan));
    } catch (error) {
      console.error('Error al clonar weekPlan:', error);
      return weekPlan; // Fallback al original
    }
  });
  // Abrir el primer día por defecto
  const [expandedDays, setExpandedDays] = useState<{ [key: number]: boolean }>({ 0: true });
  const [isSaving, setIsSaving] = useState(false);

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

  const updateExercise = (dayIndex: number, exerciseIndex: number, field: keyof Exercise, value: any) => {
    const newPlan = [...localPlan];
    const updatedExercise = { ...newPlan[dayIndex].exercises[exerciseIndex], [field]: value };
    newPlan[dayIndex].exercises[exerciseIndex] = updatedExercise;
    setLocalPlan(newPlan);
  };

  const deleteExercise = (dayIndex: number, exerciseIndex: number) => {
    const newPlan = [...localPlan];
    newPlan[dayIndex].exercises = newPlan[dayIndex].exercises.filter((_, i) => i !== exerciseIndex);
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
    setLocalPlan(newPlan);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localPlan);
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
                {localPlan.length} días · {localPlan.reduce((acc, day) => acc + day.exercises.length, 0)} ejercicios totales
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
        <div className="space-y-4">
          {localPlan.map((day, dayIndex) => {
            const isExpanded = expandedDays[dayIndex];

            return (
              <div
                key={dayIndex}
                className="bg-white rounded-2xl shadow-md border-2 border-neutral-200 overflow-hidden transition-all hover:shadow-lg"
              >
                {/* Day Header */}
                <div className="bg-gradient-to-r from-neutral-100 to-neutral-50 border-b-2 border-neutral-200 p-4 sm:p-5">
                  <div className="flex items-center gap-3 sm:gap-4">
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
                        {day.exercises.length} ejercicio{day.exercises.length !== 1 ? 's' : ''}
                      </p>
                    </div>

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
