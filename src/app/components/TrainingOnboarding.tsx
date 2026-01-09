import { useState, useEffect, useRef } from 'react';
import { Dumbbell, Plus, Trash2, Check, Search, X } from 'lucide-react';
import { muscleCategories, searchAllExercises, ExerciseData, saveCustomExercise } from '../data/exerciseDatabase';

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

interface TrainingOnboardingProps {
  onComplete: (trainingDays: number, weekPlan: DayPlan[]) => void;
}

export function TrainingOnboarding({ onComplete }: TrainingOnboardingProps) {
  const [step, setStep] = useState(1);
  const [trainingDays, setTrainingDays] = useState(3);
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>([]);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentExercises, setCurrentExercises] = useState<Exercise[]>([]);
  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: 3,
    reps: '8-12',
    restTime: 90,
    category: 'todos'
  });

  // Estados para autocompletado
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState<ExerciseData[]>([]);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Estados para crear ejercicio personalizado
  const [showCreateExerciseModal, setShowCreateExerciseModal] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [customExerciseCategory, setCustomExerciseCategory] = useState('pecho');

  // Generar nombres de días numéricos basado en la cantidad de días
  const getDayNames = (numDays: number) => {
    return Array.from({ length: numDays }, (_, i) => `Día ${i + 1}`);
  };

  // Efecto para búsqueda de ejercicios con autocompletado
  useEffect(() => {
    if (newExercise.name.length >= 2) {
      const results = searchAllExercises(newExercise.name, newExercise.category);
      setAutocompleteResults(results);
      setShowAutocomplete(results.length > 0);
    } else {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
    }
  }, [newExercise.name, newExercise.category]);

  // Cerrar autocompletado al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDaysSelection = (days: number) => {
    setTrainingDays(days);
    // Inicializar plan de la semana basado en los días seleccionados
    const plan: DayPlan[] = [];
    for (let i = 0; i < days; i++) {
      plan.push({
        dayName: getDayNames(days)[i],
        exercises: []
      });
    }
    setWeekPlan(plan);
    setStep(2);
  };

  const handleSelectExerciseFromAutocomplete = (exercise: ExerciseData) => {
    // Preseleccionar el ejercicio en el formulario (nombre + categoría)
    setNewExercise({
      ...newExercise,
      name: exercise.name,
      category: exercise.category
    });
    setShowAutocomplete(false);
  };

  const handleAddExercise = () => {
    if (!newExercise.name.trim()) return;

    const exercise: Exercise = {
      id: Date.now().toString(),
      name: newExercise.name,
      sets: newExercise.sets,
      reps: newExercise.reps,
      restTime: newExercise.restTime,
      category: newExercise.category
    };

    setCurrentExercises([...currentExercises, exercise]);
    setNewExercise({
      name: '',
      sets: 3,
      reps: '8-12',
      restTime: 90,
      category: 'todos'
    });
  };

  const handleRemoveExercise = (id: string) => {
    setCurrentExercises(currentExercises.filter(ex => ex.id !== id));
  };

  const handleSaveDay = () => {
    const updatedPlan = [...weekPlan];
    updatedPlan[currentDayIndex] = {
      ...updatedPlan[currentDayIndex],
      exercises: currentExercises
    };
    setWeekPlan(updatedPlan);

    if (currentDayIndex < trainingDays - 1) {
      // Siguiente día
      setCurrentDayIndex(currentDayIndex + 1);
      setCurrentExercises([]);
    } else {
      // Completar onboarding
      onComplete(trainingDays, updatedPlan);
    }
  };

  // Crear ejercicio personalizado
  const handleCreateCustomExercise = () => {
    if (!customExerciseName.trim()) return;

    // Guardar ejercicio personalizado en localStorage
    const savedExercise = saveCustomExercise(customExerciseName, customExerciseCategory);
    
    // Preseleccionar el ejercicio recién creado
    setNewExercise({
      ...newExercise,
      name: savedExercise.name,
      category: savedExercise.category
    });

    // Cerrar modal y resetear
    setShowCreateExerciseModal(false);
    setCustomExerciseName('');
    setCustomExerciseCategory('pecho');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-3 sm:p-6">
      <div className="max-w-3xl w-full">
        {step === 1 && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-8 md:p-12">
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6">
                <Dumbbell className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-800 mb-2 sm:mb-3 px-2">
                ¡Configuremos tu Entrenamiento! 💪
              </h1>
              <p className="text-sm sm:text-base text-neutral-600 px-4">
                Cuéntanos cuántos días a la semana quieres entrenar
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
              {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                <button
                  key={days}
                  onClick={() => handleDaysSelection(days)}
                  className="group relative bg-gradient-to-br from-neutral-50 to-neutral-100 hover:from-emerald-50 hover:to-teal-50 border-2 border-neutral-200 hover:border-emerald-500 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 transition-all hover:scale-105 active:scale-95"
                >
                  <div className="text-3xl sm:text-4xl font-bold text-neutral-800 group-hover:text-emerald-600 mb-0.5 sm:mb-1">
                    {days}
                  </div>
                  <div className="text-xs sm:text-sm text-neutral-600 group-hover:text-emerald-700">
                    {days === 1 ? 'día' : 'días'}
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                💡 <strong>Consejo:</strong> Para principiantes recomendamos 3-4 días. Para avanzados 5-6 días.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-12 max-h-[95vh] overflow-y-auto">
            <div className="mb-5 sm:mb-8">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-neutral-800">
                    {weekPlan[currentDayIndex]?.dayName}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-600">
                    Día {currentDayIndex + 1} de {trainingDays}
                  </p>
                </div>
                <div className="text-xs sm:text-sm text-neutral-500 font-medium">
                  {currentExercises.length} ejercicio{currentExercises.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="h-1.5 sm:h-2 bg-neutral-200 rounded-full overflow-hidden mb-5 sm:mb-8">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300"
                  style={{ width: `${((currentDayIndex + 1) / trainingDays) * 100}%` }}
                />
              </div>
            </div>

            {/* Lista de ejercicios */}
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 max-h-48 sm:max-h-64 overflow-y-auto">
              {currentExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="bg-neutral-50 border border-neutral-200 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm sm:text-base text-neutral-800 truncate">{exercise.name}</div>
                    <div className="text-xs sm:text-sm text-neutral-600 leading-tight">
                      {exercise.sets} series × {exercise.reps} reps · {exercise.restTime}s
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveExercise(exercise.id)}
                    className="text-red-600 hover:bg-red-50 p-1.5 sm:p-2 rounded-lg transition-all active:scale-95 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {currentExercises.length === 0 && (
                <div className="text-center py-6 sm:py-8 text-neutral-400 text-sm sm:text-base">
                  Añade ejercicios para este día
                </div>
              )}
            </div>

            {/* Formulario para añadir ejercicio */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
              <h3 className="font-semibold text-sm sm:text-base text-neutral-800 mb-3 sm:mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                Añadir Ejercicio
              </h3>

              <div className="space-y-3 sm:space-y-4">
                {/* Selector de Categoría / Grupo Muscular */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
                    🎯 Categoría / Grupo Muscular
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 sm:gap-2">
                    <button
                      onClick={() => setNewExercise({ ...newExercise, category: 'todos' })}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all active:scale-95 ${
                        newExercise.category === 'todos'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-white border border-neutral-300 text-neutral-700 hover:border-emerald-400'
                      }`}
                    >
                      Todos
                    </button>
                    {muscleCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setNewExercise({ ...newExercise, category: cat.id })}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all active:scale-95 ${
                          newExercise.category === cat.id
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white border border-neutral-300 text-neutral-700 hover:border-emerald-400'
                        }`}
                      >
                        <span className="block text-xs sm:text-sm mb-0.5">{cat.icon}</span>
                        <span className="block leading-tight">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input de nombre con autocompletado */}
                <div className="relative" ref={autocompleteRef}>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
                    <Search className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                    Nombre del ejercicio
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newExercise.name}
                      onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                      onFocus={() => newExercise.name.length >= 2 && setShowAutocomplete(true)}
                      placeholder="Ej: Press de banca, Sentadilla..."
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border border-neutral-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    />
                    {newExercise.name && (
                      <button
                        onClick={() => {
                          setNewExercise({ ...newExercise, name: '' });
                          setShowAutocomplete(false);
                        }}
                        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                      >
                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown de autocompletado */}
                  {showAutocomplete && autocompleteResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 sm:mt-2 bg-white border border-neutral-200 rounded-lg sm:rounded-xl shadow-lg max-h-48 sm:max-h-64 overflow-y-auto">
                      {autocompleteResults.map((exercise) => (
                        <button
                          key={exercise.id}
                          onClick={() => handleSelectExerciseFromAutocomplete(exercise)}
                          className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-emerald-50 transition-all border-b border-neutral-100 last:border-b-0"
                        >
                          <div className="font-medium text-sm sm:text-base text-neutral-800">{exercise.name}</div>
                          <div className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 sm:mt-1">
                            {muscleCategories.find(c => c.id === exercise.category)?.name || exercise.category}
                            {exercise.equipment && ` · ${exercise.equipment}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Botón para crear ejercicio personalizado */}
                  <button
                    onClick={() => setShowCreateExerciseModal(true)}
                    className="mt-2 w-full bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 px-3 sm:px-4 py-2 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
                  >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Crear ejercicio personalizado
                  </button>
                </div>

                {/* Series y Reps en grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
                      Series
                    </label>
                    <input
                      type="number"
                      value={newExercise.sets}
                      onChange={(e) => setNewExercise({ ...newExercise, sets: parseInt(e.target.value) || 1 })}
                      min="1"
                      max="10"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border border-neutral-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
                      Repeticiones
                    </label>
                    <input
                      type="text"
                      value={newExercise.reps}
                      onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                      placeholder="8-12"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border border-neutral-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Descanso */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
                    Descanso (segundos)
                  </label>
                  <div className="flex gap-1.5 sm:gap-2">
                    {[60, 90, 120, 180].map((time) => (
                      <button
                        key={time}
                        onClick={() => setNewExercise({ ...newExercise, restTime: time })}
                        className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all active:scale-95 ${
                          newExercise.restTime === time
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white border border-neutral-300 text-neutral-700 hover:border-emerald-400'
                        }`}
                      >
                        {time}s
                      </button>
                    ))}
                    <input
                      type="number"
                      value={newExercise.restTime}
                      onChange={(e) => setNewExercise({ ...newExercise, restTime: parseInt(e.target.value) || 60 })}
                      min="30"
                      max="300"
                      step="15"
                      className="w-16 sm:w-24 px-2 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border border-neutral-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddExercise}
                disabled={!newExercise.name.trim()}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-neutral-300 disabled:to-neutral-400 text-white font-semibold py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-3 sm:mt-4 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Añadir Ejercicio
              </button>
            </div>

            {/* Botones de navegación */}
            <div className="flex gap-2 sm:gap-4">
              {currentDayIndex > 0 && (
                <button
                  onClick={() => {
                    setCurrentDayIndex(currentDayIndex - 1);
                    setCurrentExercises(weekPlan[currentDayIndex - 1].exercises);
                  }}
                  className="flex-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all active:scale-95 text-sm sm:text-base"
                >
                  Anterior
                </button>
              )}
              <button
                onClick={handleSaveDay}
                disabled={currentExercises.length === 0}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-neutral-300 disabled:to-neutral-400 text-white font-semibold py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {currentDayIndex < trainingDays - 1 ? (
                  <>Siguiente Día</>
                ) : (
                  <>
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    Completar
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Modal Crear Ejercicio Personalizado */}
        {showCreateExerciseModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-800">
                  Crear Ejercicio Personalizado
                </h2>
                <button
                  onClick={() => {
                    setShowCreateExerciseModal(false);
                    setCustomExerciseName('');
                    setCustomExerciseCategory('pecho');
                  }}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nombre del ejercicio */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Nombre del ejercicio
                  </label>
                  <input
                    type="text"
                    value={customExerciseName}
                    onChange={(e) => setCustomExerciseName(e.target.value)}
                    placeholder="Ej: Mi ejercicio personalizado"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-neutral-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                    autoFocus
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Grupo Muscular
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {muscleCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCustomExerciseCategory(cat.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                          customExerciseCategory === cat.id
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        <span className="block text-sm mb-0.5">{cat.icon}</span>
                        <span className="block leading-tight">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowCreateExerciseModal(false);
                      setCustomExerciseName('');
                      setCustomExerciseCategory('pecho');
                    }}
                    className="flex-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold py-3 rounded-xl transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateCustomExercise}
                    disabled={!customExerciseName.trim()}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-neutral-300 disabled:to-neutral-400 text-white font-semibold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Crear
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}