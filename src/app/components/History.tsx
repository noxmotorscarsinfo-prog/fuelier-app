import { useState } from 'react';
import { DailyLog, User } from '../types';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Flame, Beef, Wheat, Droplet, Scale } from 'lucide-react';

interface HistoryProps {
  dailyLogs: DailyLog[];
  onBack: () => void;
  onCopyDay: (date: string) => void;
  user: User;
}

export default function History({ dailyLogs, onBack, onCopyDay, user }: HistoryProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DailyLog | null>(null);

  const calculateTotals = (log: DailyLog) => {
    const meals = [log.breakfast, log.lunch, log.snack, log.dinner];
    return meals.reduce(
      (acc, meal) => {
        if (meal) {
          acc.calories += meal.calories;
          acc.protein += meal.protein;
          acc.carbs += meal.carbs;
          acc.fat += meal.fat;
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const getMealCount = (log: DailyLog) => {
    return [log.breakfast, log.lunch, log.snack, log.dinner].filter(m => m !== null).length;
  };

  // Calculate macro score: percentage of goals achieved
  const calculateScore = (log: DailyLog) => {
    const totals = calculateTotals(log);
    const caloriesScore = Math.min((totals.calories / user.goals.calories) * 100, 100);
    const proteinScore = Math.min((totals.protein / user.goals.protein) * 100, 100);
    const carbsScore = Math.min((totals.carbs / user.goals.carbs) * 100, 100);
    const fatScore = Math.min((totals.fat / user.goals.fat) * 100, 100);
    
    return Math.round((caloriesScore + proteinScore + carbsScore + fatScore) / 4);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-emerald-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Adjust to start on Monday (0 = Monday)
    const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < adjustedStartDay; i++) {
      days.push(null);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  // Get log for specific date
  const getLogForDate = (day: number | null) => {
    if (!day) return null;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return dailyLogs.find(log => log.date === dateString);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('es-ES', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatFullDate = (log: DailyLog) => {
    const date = new Date(log.date);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-emerald-600 text-white px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl">Calendario</h1>
              <p className="text-emerald-100 text-sm">{dailyLogs.length} días registrados</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-200">
              {/* Month Navigator */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-neutral-100 rounded-xl transition-all"
                >
                  <ChevronLeft className="w-5 h-5 text-neutral-600" />
                </button>
                <h2 className="text-xl text-neutral-800 capitalize">{formatMonthYear(currentDate)}</h2>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-neutral-100 rounded-xl transition-all"
                >
                  <ChevronRight className="w-5 h-5 text-neutral-600" />
                </button>
              </div>

              {/* Week Days */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-sm text-neutral-500 font-medium py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  const log = getLogForDate(day);
                  const score = log ? calculateScore(log) : 0;
                  const mealCount = log ? getMealCount(log) : 0;
                  const today = isToday(day);

                  if (!day) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  return (
                    <button
                      key={day}
                      onClick={() => log && setSelectedDay(log)}
                      className={`aspect-square rounded-xl p-2 transition-all ${
                        log
                          ? 'bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 cursor-pointer'
                          : 'bg-neutral-50 border border-neutral-200'
                      } ${
                        today ? 'ring-2 ring-emerald-500' : ''
                      } ${
                        selectedDay?.date === log?.date ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className={`text-sm ${log ? 'text-neutral-800 font-semibold' : 'text-neutral-400'}`}>
                          {day}
                        </span>
                        {log && (
                          <>
                            <div className={`w-2 h-2 rounded-full mt-1 ${getScoreColor(score)}`} />
                            <span className={`text-xs mt-1 ${getScoreTextColor(score)}`}>
                              {score}%
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-neutral-200">
                <p className="text-xs text-neutral-500 mb-2">Puntuación de Macros:</p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-neutral-600">90-100% Excelente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-neutral-600">70-89% Bueno</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-neutral-600">50-69% Regular</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-neutral-600">30-49% Bajo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-neutral-600">&lt;30% Muy Bajo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Day Detail */}
          <div className="lg:col-span-5">
            {selectedDay ? (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg text-neutral-800 font-semibold capitalize">
                      {formatFullDate(selectedDay)}
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">
                      {getMealCount(selectedDay)} comidas registradas
                    </p>
                  </div>
                  {selectedDay.date !== new Date().toISOString().split('T')[0] && (
                    <button
                      onClick={() => onCopyDay(selectedDay.date)}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-all text-sm"
                    >
                      Copiar a hoy
                    </button>
                  )}
                </div>

                {/* Score */}
                <div className={`rounded-2xl p-4 mb-4 ${getScoreTextColor(calculateScore(selectedDay)).replace('text-', 'bg-').replace('-600', '-50')}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Puntuación Global</span>
                    <span className={`text-2xl font-bold ${getScoreTextColor(calculateScore(selectedDay))}`}>
                      {calculateScore(selectedDay)}%
                    </span>
                  </div>
                </div>

                {/* Peso del día */}
                {selectedDay.weight && (
                  <div className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Scale className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-neutral-600">Peso registrado</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">{selectedDay.weight} kg</span>
                    </div>
                  </div>
                )}

                {/* Macros Summary */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {(() => {
                    const totals = calculateTotals(selectedDay);
                    return (
                      <>
                        <div className="bg-emerald-50 rounded-xl p-3 text-center">
                          <Flame className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                          <p className="text-lg text-emerald-600 font-semibold">{totals.calories}</p>
                          <p className="text-xs text-neutral-500">kcal</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                          <Beef className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                          <p className="text-lg text-blue-600 font-semibold">{totals.protein}g</p>
                          <p className="text-xs text-neutral-500">Prot</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-3 text-center">
                          <Wheat className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                          <p className="text-lg text-amber-600 font-semibold">{totals.carbs}g</p>
                          <p className="text-xs text-neutral-500">Carb</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-3 text-center">
                          <Droplet className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                          <p className="text-lg text-orange-600 font-semibold">{totals.fat}g</p>
                          <p className="text-xs text-neutral-500">Grasa</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Meals */}
                <div className="space-y-3">
                  <h4 className="text-sm text-neutral-600 font-medium">Menú del Día</h4>
                  
                  {selectedDay.breakfast && (
                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-emerald-600 font-semibold uppercase">🌅 Desayuno</span>
                        <span className="text-sm text-neutral-800 font-medium">{selectedDay.breakfast.calories} kcal</span>
                      </div>
                      <p className="text-sm text-neutral-800">{selectedDay.breakfast.name}</p>
                      {selectedDay.breakfast.variant && (
                        <p className="text-xs text-neutral-500 mt-1">{selectedDay.breakfast.variant}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs text-neutral-600">
                        <span>P: {selectedDay.breakfast.protein}g</span>
                        <span>C: {selectedDay.breakfast.carbs}g</span>
                        <span>G: {selectedDay.breakfast.fat}g</span>
                      </div>
                    </div>
                  )}

                  {selectedDay.lunch && (
                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-emerald-600 font-semibold uppercase">🍽️ Comida</span>
                        <span className="text-sm text-neutral-800 font-medium">{selectedDay.lunch.calories} kcal</span>
                      </div>
                      <p className="text-sm text-neutral-800">{selectedDay.lunch.name}</p>
                      {selectedDay.lunch.variant && (
                        <p className="text-xs text-neutral-500 mt-1">{selectedDay.lunch.variant}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs text-neutral-600">
                        <span>P: {selectedDay.lunch.protein}g</span>
                        <span>C: {selectedDay.lunch.carbs}g</span>
                        <span>G: {selectedDay.lunch.fat}g</span>
                      </div>
                    </div>
                  )}

                  {selectedDay.snack && (
                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-emerald-600 font-semibold uppercase">🍎 Merienda</span>
                        <span className="text-sm text-neutral-800 font-medium">{selectedDay.snack.calories} kcal</span>
                      </div>
                      <p className="text-sm text-neutral-800">{selectedDay.snack.name}</p>
                      {selectedDay.snack.variant && (
                        <p className="text-xs text-neutral-500 mt-1">{selectedDay.snack.variant}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs text-neutral-600">
                        <span>P: {selectedDay.snack.protein}g</span>
                        <span>C: {selectedDay.snack.carbs}g</span>
                        <span>G: {selectedDay.snack.fat}g</span>
                      </div>
                    </div>
                  )}

                  {selectedDay.dinner && (
                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-emerald-600 font-semibold uppercase">🌙 Cena</span>
                        <span className="text-sm text-neutral-800 font-medium">{selectedDay.dinner.calories} kcal</span>
                      </div>
                      <p className="text-sm text-neutral-800">{selectedDay.dinner.name}</p>
                      {selectedDay.dinner.variant && (
                        <p className="text-xs text-neutral-500 mt-1">{selectedDay.dinner.variant}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs text-neutral-600">
                        <span>P: {selectedDay.dinner.protein}g</span>
                        <span>C: {selectedDay.dinner.carbs}g</span>
                        <span>G: {selectedDay.dinner.fat}g</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 shadow-sm border border-neutral-200 text-center">
                <CalendarIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-600">Selecciona un día en el calendario</p>
                <p className="text-sm text-neutral-400 mt-2">
                  Haz clic en cualquier día con datos para ver el menú completo
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}