import { useState } from 'react';
import { DailyLog, User } from '../types';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Flame, Beef, Wheat, Droplet, Scale, LayoutGrid, LayoutList, X } from 'lucide-react';

interface CalendarViewProps {
  dailyLogs: DailyLog[];
  onBack: () => void;
  onCopyDay: (date: string) => void;
  user: User;
}

type ViewMode = 'month' | 'week';

export default function CalendarView({ dailyLogs, onBack, onCopyDay, user }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DailyLog | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [showDayDetail, setShowDayDetail] = useState(false);

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

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-50';
    if (score >= 70) return 'bg-emerald-50';
    if (score >= 50) return 'bg-yellow-50';
    if (score >= 30) return 'bg-orange-50';
    return 'bg-red-50';
  };

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days = [];
    for (let i = 0; i < adjustedStartDay; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  // Get week days (current week)
  const getWeekDays = (date: Date) => {
    const days = [];
    const currentDay = date.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay; // Adjust to start on Monday
    
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(date);
      weekDay.setDate(date.getDate() + diff + i);
      days.push(weekDay);
    }
    return days;
  };

  const getLogForDate = (day: number | null, month?: number, year?: number) => {
    if (!day) return null;
    
    const targetYear = year ?? currentDate.getFullYear();
    const targetMonth = month ?? currentDate.getMonth();
    const dateString = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return dailyLogs.find(log => log.date === dateString);
  };

  const getLogForFullDate = (date: Date) => {
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return dailyLogs.find(log => log.date === dateString);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('es-ES', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatWeekRange = (date: Date) => {
    const weekDays = getWeekDays(date);
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    
    return `${firstDay.getDate()} ${firstDay.toLocaleDateString('es-ES', { month: 'short' })} - ${lastDay.getDate()} ${lastDay.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`;
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

  const isToday = (day: number | null, month?: number, year?: number) => {
    if (!day) return false;
    const today = new Date();
    const targetMonth = month ?? currentDate.getMonth();
    const targetYear = year ?? currentDate.getFullYear();
    
    return (
      day === today.getDate() &&
      targetMonth === today.getMonth() &&
      targetYear === today.getFullYear()
    );
  };

  const isTodayFullDate = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleDayClick = (log: DailyLog | null) => {
    if (log) {
      setSelectedDay(log);
      setShowDayDetail(true);
    }
  };

  const closeDayDetail = () => {
    setShowDayDetail(false);
    setSelectedDay(null);
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = getWeekDays(currentDate);
  const weekDayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-6 pt-12 pb-8 sticky top-0 z-20 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl hover:bg-white/30 transition-all hover:scale-105 active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold mb-1">Calendario</h1>
                <p className="text-emerald-100">{dailyLogs.length} días registrados</p>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 bg-white/10 backdrop-blur-sm p-1 rounded-2xl">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-xl transition-all font-semibold flex items-center gap-2 ${
                  viewMode === 'month'
                    ? 'bg-white text-emerald-600 shadow-lg'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Mes
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-xl transition-all font-semibold flex items-center gap-2 ${
                  viewMode === 'week'
                    ? 'bg-white text-emerald-600 shadow-lg'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                Semana
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <button
              onClick={viewMode === 'month' ? previousMonth : previousWeek}
              className="p-2 hover:bg-white/20 rounded-xl transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold capitalize">
              {viewMode === 'month' ? formatMonthYear(currentDate) : formatWeekRange(currentDate)}
            </h2>
            <button
              onClick={viewMode === 'month' ? nextMonth : nextWeek}
              className="p-2 hover:bg-white/20 rounded-xl transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* MONTH VIEW */}
        {viewMode === 'month' && (
          <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-emerald-100">
            {/* Week Day Headers */}
            <div className="grid grid-cols-7 gap-3 mb-4">
              {weekDayLabels.map((day) => (
                <div key={day} className="text-center font-bold text-neutral-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-3">
              {days.map((day, index) => {
                const log = getLogForDate(day);
                const score = log ? calculateScore(log) : 0;
                const today = isToday(day);

                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(log)}
                    disabled={!log}
                    className={`aspect-square rounded-2xl p-3 transition-all border-2 ${
                      log
                        ? `${getScoreBgColor(score)} border-emerald-200 hover:border-emerald-400 cursor-pointer hover:scale-105 shadow-md hover:shadow-xl`
                        : 'bg-neutral-50 border-neutral-200 cursor-not-allowed opacity-50'
                    } ${
                      today ? 'ring-4 ring-emerald-500 ring-offset-2' : ''
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className={`text-xl font-bold mb-1 ${log ? 'text-neutral-800' : 'text-neutral-400'}`}>
                        {day}
                      </span>
                      {log && (
                        <>
                          <div className={`w-3 h-3 rounded-full mb-1 ${getScoreColor(score)}`} />
                          <span className={`text-xs font-bold ${getScoreTextColor(score)}`}>
                            {score}%
                          </span>
                          {log.weight && (
                            <div className="flex items-center gap-1 mt-1">
                              <Scale className="w-3 h-3 text-blue-600" />
                              <span className="text-xs text-blue-600 font-semibold">{log.weight}kg</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-8 pt-6 border-t-2 border-neutral-200">
              <p className="text-sm font-bold text-neutral-700 mb-3">Puntuación de Macros:</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 shadow-md" />
                  <span className="text-neutral-700 font-medium">90-100% Excelente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-md" />
                  <span className="text-neutral-700 font-medium">70-89% Bueno</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-md" />
                  <span className="text-neutral-700 font-medium">50-69% Regular</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500 shadow-md" />
                  <span className="text-neutral-700 font-medium">30-49% Bajo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500 shadow-md" />
                  <span className="text-neutral-700 font-medium">&lt;30% Muy Bajo</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WEEK VIEW */}
        {viewMode === 'week' && (
          <div className="space-y-4">
            {weekDays.map((date, index) => {
              const log = getLogForFullDate(date);
              const score = log ? calculateScore(log) : 0;
              const totals = log ? calculateTotals(log) : null;
              const today = isTodayFullDate(date);

              return (
                <div
                  key={index}
                  className={`bg-white rounded-3xl p-6 shadow-xl border-2 transition-all ${
                    log ? 'border-emerald-200 hover:border-emerald-400 hover:shadow-2xl' : 'border-neutral-200 opacity-60'
                  } ${today ? 'ring-4 ring-emerald-500 ring-offset-4' : ''}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`text-center ${log ? 'bg-emerald-50' : 'bg-neutral-50'} rounded-2xl p-4 min-w-[80px]`}>
                        <p className="text-xs text-neutral-600 font-medium uppercase mb-1">
                          {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                        </p>
                        <p className={`text-3xl font-bold ${log ? 'text-emerald-600' : 'text-neutral-400'}`}>
                          {date.getDate()}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {date.toLocaleDateString('es-ES', { month: 'short' })}
                        </p>
                      </div>
                      
                      {log && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${getScoreColor(score)}`} />
                            <span className={`text-2xl font-bold ${getScoreTextColor(score)}`}>
                              {score}%
                            </span>
                          </div>
                          <p className="text-sm text-neutral-500">
                            {getMealCount(log)}/4 comidas
                          </p>
                        </div>
                      )}
                    </div>

                    {log && (
                      <button
                        onClick={() => handleDayClick(log)}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all font-bold shadow-lg"
                      >
                        Ver Detalle
                      </button>
                    )}
                  </div>

                  {log && totals && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl p-4 text-center">
                        <Flame className="w-6 h-6 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{totals.calories}</p>
                        <p className="text-xs opacity-80">kcal</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl p-4 text-center">
                        <Beef className="w-6 h-6 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{totals.protein}g</p>
                        <p className="text-xs opacity-80">Proteína</p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl p-4 text-center">
                        <Wheat className="w-6 h-6 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{totals.carbs}g</p>
                        <p className="text-xs opacity-80">Carbos</p>
                      </div>
                      <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-2xl p-4 text-center">
                        <Droplet className="w-6 h-6 mx-auto mb-2 opacity-80" />
                        <p className="text-2xl font-bold">{totals.fat}g</p>
                        <p className="text-xs opacity-80">Grasas</p>
                      </div>
                      {log.weight && (
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-2xl p-4 text-center">
                          <Scale className="w-6 h-6 mx-auto mb-2 opacity-80" />
                          <p className="text-2xl font-bold">{log.weight}</p>
                          <p className="text-xs opacity-80">kg</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!log && (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
                      <p className="text-neutral-500 text-sm">Sin datos registrados</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Day Detail Modal */}
      {showDayDetail && selectedDay && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-3xl z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold capitalize">
                  {formatFullDate(selectedDay)}
                </h3>
                <button
                  onClick={closeDayDetail}
                  className="bg-white/20 backdrop-blur-sm p-2 rounded-xl hover:bg-white/30 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-emerald-100">
                {getMealCount(selectedDay)} comidas registradas
              </p>
            </div>

            <div className="p-6">
              {/* Score */}
              <div className={`rounded-2xl p-6 mb-6 ${getScoreBgColor(calculateScore(selectedDay))} border-2 ${getScoreColor(calculateScore(selectedDay)).replace('bg-', 'border-')}`}>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-neutral-700">Puntuación Global</span>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${getScoreColor(calculateScore(selectedDay))}`} />
                    <span className={`text-4xl font-bold ${getScoreTextColor(calculateScore(selectedDay))}`}>
                      {calculateScore(selectedDay)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Weight */}
              {selectedDay.weight && (
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl p-6 mb-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                        <Scale className="w-6 h-6" />
                      </div>
                      <span className="text-lg font-semibold">Peso registrado</span>
                    </div>
                    <span className="text-4xl font-bold">{selectedDay.weight} kg</span>
                  </div>
                </div>
              )}

              {/* Macros Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {(() => {
                  const totals = calculateTotals(selectedDay);
                  return (
                    <>
                      <div className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl p-4 text-center shadow-lg">
                        <Flame className="w-8 h-8 mx-auto mb-2 opacity-80" />
                        <p className="text-3xl font-bold">{totals.calories}</p>
                        <p className="text-sm opacity-80">kcal</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl p-4 text-center shadow-lg">
                        <Beef className="w-8 h-8 mx-auto mb-2 opacity-80" />
                        <p className="text-3xl font-bold">{totals.protein}g</p>
                        <p className="text-sm opacity-80">Proteína</p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl p-4 text-center shadow-lg">
                        <Wheat className="w-8 h-8 mx-auto mb-2 opacity-80" />
                        <p className="text-3xl font-bold">{totals.carbs}g</p>
                        <p className="text-sm opacity-80">Carbos</p>
                      </div>
                      <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-2xl p-4 text-center shadow-lg">
                        <Droplet className="w-8 h-8 mx-auto mb-2 opacity-80" />
                        <p className="text-3xl font-bold">{totals.fat}g</p>
                        <p className="text-sm opacity-80">Grasas</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Meals */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-neutral-800 mb-3">Menú del Día</h4>
                
                {selectedDay.breakfast && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border-2 border-amber-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-amber-700 font-bold uppercase flex items-center gap-2">
                        <span className="text-2xl">🌅</span> Desayuno
                      </span>
                      <span className="text-lg text-neutral-800 font-bold">{selectedDay.breakfast.calories} kcal</span>
                    </div>
                    <p className="font-semibold text-neutral-800 mb-2">{selectedDay.breakfast.name}</p>
                    {selectedDay.breakfast.variant && (
                      <p className="text-sm text-neutral-600 mb-2">{selectedDay.breakfast.variant}</p>
                    )}
                    <div className="flex gap-4 text-sm font-medium text-neutral-700">
                      <span>🥩 {selectedDay.breakfast.protein}g</span>
                      <span>🌾 {selectedDay.breakfast.carbs}g</span>
                      <span>💧 {selectedDay.breakfast.fat}g</span>
                    </div>
                  </div>
                )}

                {selectedDay.lunch && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border-2 border-emerald-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-emerald-700 font-bold uppercase flex items-center gap-2">
                        <span className="text-2xl">🍽️</span> Comida
                      </span>
                      <span className="text-lg text-neutral-800 font-bold">{selectedDay.lunch.calories} kcal</span>
                    </div>
                    <p className="font-semibold text-neutral-800 mb-2">{selectedDay.lunch.name}</p>
                    {selectedDay.lunch.variant && (
                      <p className="text-sm text-neutral-600 mb-2">{selectedDay.lunch.variant}</p>
                    )}
                    <div className="flex gap-4 text-sm font-medium text-neutral-700">
                      <span>🥩 {selectedDay.lunch.protein}g</span>
                      <span>🌾 {selectedDay.lunch.carbs}g</span>
                      <span>💧 {selectedDay.lunch.fat}g</span>
                    </div>
                  </div>
                )}

                {selectedDay.snack && (
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-5 border-2 border-pink-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-pink-700 font-bold uppercase flex items-center gap-2">
                        <span className="text-2xl">🍎</span> Merienda
                      </span>
                      <span className="text-lg text-neutral-800 font-bold">{selectedDay.snack.calories} kcal</span>
                    </div>
                    <p className="font-semibold text-neutral-800 mb-2">{selectedDay.snack.name}</p>
                    {selectedDay.snack.variant && (
                      <p className="text-sm text-neutral-600 mb-2">{selectedDay.snack.variant}</p>
                    )}
                    <div className="flex gap-4 text-sm font-medium text-neutral-700">
                      <span>🥩 {selectedDay.snack.protein}g</span>
                      <span>🌾 {selectedDay.snack.carbs}g</span>
                      <span>💧 {selectedDay.snack.fat}g</span>
                    </div>
                  </div>
                )}

                {selectedDay.dinner && (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border-2 border-indigo-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-indigo-700 font-bold uppercase flex items-center gap-2">
                        <span className="text-2xl">🌙</span> Cena
                      </span>
                      <span className="text-lg text-neutral-800 font-bold">{selectedDay.dinner.calories} kcal</span>
                    </div>
                    <p className="font-semibold text-neutral-800 mb-2">{selectedDay.dinner.name}</p>
                    {selectedDay.dinner.variant && (
                      <p className="text-sm text-neutral-600 mb-2">{selectedDay.dinner.variant}</p>
                    )}
                    <div className="flex gap-4 text-sm font-medium text-neutral-700">
                      <span>🥩 {selectedDay.dinner.protein}g</span>
                      <span>🌾 {selectedDay.dinner.carbs}g</span>
                      <span>💧 {selectedDay.dinner.fat}g</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Copy Day Button */}
              {selectedDay.date !== new Date().toISOString().split('T')[0] && (
                <button
                  onClick={() => {
                    onCopyDay(selectedDay.date);
                    closeDayDetail();
                  }}
                  className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all font-bold shadow-lg text-lg"
                >
                  Copiar a Hoy
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
