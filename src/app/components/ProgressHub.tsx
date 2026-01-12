import { useState } from 'react';
import { User, DailyLog } from '../types';
import { X, Calendar, Scale, TrendingUp, LayoutGrid, LayoutList, ChevronLeft, ChevronRight, Flame, Beef, Wheat, Droplet } from 'lucide-react';
import WeightTrackingContent from './WeightTrackingContent';
import WeeklyProgressWidget from './WeeklyProgressWidget';

interface ProgressHubProps {
  user: User;
  dailyLogs: DailyLog[];
  onUpdateWeight: (weight: number, date: string) => void;
  onClose: () => void;
  onSelectDate?: (date: string) => void;
  initialTab?: TabType;
}

type TabType = 'calendar' | 'weight';
type CalendarViewMode = 'month' | 'week';

export default function ProgressHub({ 
  user, 
  dailyLogs, 
  onUpdateWeight, 
  onClose,
  onSelectDate,
  initialTab = 'calendar'
}: ProgressHubProps) {
  // TODOS LOS HOOKS AL PRINCIPIO - NUNCA DEBEN SER CONDICIONALES
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayLog, setSelectedDayLog] = useState<DailyLog | null>(null);

  // Calcular total de macros del día
  const getDayTotals = (log: DailyLog) => {
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    const meals = [log.breakfast, log.lunch, log.snack, log.dinner];
    meals.forEach(meal => {
      if (meal) {
        totals.calories += meal.calories || 0;
        totals.protein += meal.protein || 0;
        totals.carbs += meal.carbs || 0;
        totals.fat += meal.fat || 0;
      }
    });

    if (log.extraFoods && log.extraFoods.length > 0) {
      log.extraFoods.forEach(extra => {
        totals.calories += extra.calories || 0;
        totals.protein += extra.protein || 0;
        totals.carbs += extra.carbs || 0;
        totals.fat += extra.fat || 0;
      });
    }

    return totals;
  };

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      day: '2-digit', 
      month: 'short' 
    });
  };

  // Funciones para el calendario completo
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

  const getWeekDays = (date: Date) => {
    const days = [];
    const currentDay = date.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay;
    
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(date);
      weekDay.setDate(date.getDate() + diff + i);
      days.push(weekDay);
    }
    return days;
  };

  const getLogForDate = (day: number | null) => {
    if (!day) return null;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dailyLogs.find(log => log.date === dateString && log.isSaved);
  };

  const getLogForFullDate = (date: Date) => {
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return dailyLogs.find(log => log.date === dateString && log.isSaved);
  };

  const calculateScore = (log: DailyLog) => {
    const totals = getDayTotals(log);
    // Evitar división por cero si goals son 0
    const caloriesScore = user.goals.calories > 0 
      ? Math.min((totals.calories / user.goals.calories) * 100, 100) 
      : 0;
    const proteinScore = user.goals.protein > 0 
      ? Math.min((totals.protein / user.goals.protein) * 100, 100) 
      : 0;
    const carbsScore = user.goals.carbs > 0 
      ? Math.min((totals.carbs / user.goals.carbs) * 100, 100) 
      : 0;
    const fatScore = user.goals.fat > 0 
      ? Math.min((totals.fat / user.goals.fat) * 100, 100) 
      : 0;
    return Math.round((caloriesScore + proteinScore + carbsScore + fatScore) / 4);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-50';
    if (score >= 70) return 'bg-emerald-50';
    if (score >= 50) return 'bg-yellow-50';
    if (score >= 30) return 'bg-orange-50';
    return 'bg-red-50';
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

  const isTodayFullDate = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
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

  const formatMonthYear = () => {
    return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  const formatWeekRange = () => {
    const weekDays = getWeekDays(currentDate);
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    return `${firstDay.getDate()} ${firstDay.toLocaleDateString('es-ES', { month: 'short' })} - ${lastDay.getDate()} ${lastDay.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`;
  };

  // Calcular datos para el render
  const days = getDaysInMonth(currentDate);
  const weekDays = getWeekDays(currentDate);
  const weekDayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Centro de Progreso</h2>
                <p className="text-emerald-100 text-sm">Historial y seguimiento completo</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'calendar'
                  ? 'bg-white text-emerald-600 shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Calendario
            </button>
            <button
              onClick={() => setActiveTab('weight')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'weight'
                  ? 'bg-white text-emerald-600 shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Scale className="w-5 h-5" />
              Peso
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'calendar' && (
            <div className="p-6">
              {/* Toggle View Mode */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setViewMode('month')}
                  className={`flex-1 py-2 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    viewMode === 'month'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Vista Mensual
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`flex-1 py-2 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    viewMode === 'week'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <LayoutList className="w-4 h-4" />
                  Vista Semanal
                </button>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between bg-neutral-100 rounded-2xl p-4 mb-6">
                <button
                  onClick={viewMode === 'month' ? previousMonth : previousWeek}
                  className="p-2 hover:bg-white rounded-xl transition-all"
                >
                  <ChevronLeft className="w-5 h-5 text-neutral-600" />
                </button>
                <h3 className="font-bold text-neutral-800 capitalize">
                  {viewMode === 'month' ? formatMonthYear() : formatWeekRange()}
                </h3>
                <button
                  onClick={viewMode === 'month' ? nextMonth : nextWeek}
                  className="p-2 hover:bg-white rounded-xl transition-all"
                >
                  <ChevronRight className="w-5 h-5 text-neutral-600" />
                </button>
              </div>

              {/* MONTH VIEW */}
              {viewMode === 'month' && (
                <div>
                  {/* Week Day Headers */}
                  <div className="grid grid-cols-7 gap-2 mb-3">
                    {weekDayLabels.map((day) => (
                      <div key={day} className="text-center text-sm font-bold text-neutral-600 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2 mb-6">
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
                          onClick={() => log && setSelectedDayLog(log)}
                          disabled={!log}
                          className={`aspect-square rounded-xl p-2 transition-all border-2 ${
                            log
                              ? `${getScoreBgColor(score)} border-emerald-200 hover:border-emerald-400 cursor-pointer hover:scale-105 shadow-sm`
                              : 'bg-neutral-50 border-neutral-200 cursor-not-allowed opacity-40'
                          } ${
                            today ? 'ring-2 ring-emerald-500' : ''
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center h-full">
                            <span className={`text-base font-bold ${log ? 'text-neutral-800' : 'text-neutral-400'}`}>
                              {day}
                            </span>
                            {log && (
                              <>
                                <div className={`w-2 h-2 rounded-full mt-1 ${getScoreColor(score)}`} />
                                {log.weight && (
                                  <span className="text-xs text-blue-600 font-semibold mt-0.5">{log.weight}kg</span>
                                )}
                              </>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="bg-neutral-50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-neutral-700 mb-2">Puntuación de Macros:</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-neutral-600">≥90%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-neutral-600">≥70%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-neutral-600">≥50%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-neutral-600">≥30%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-neutral-600">&lt;30%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* WEEK VIEW */}
              {viewMode === 'week' && (
                <div className="space-y-3">
                  {weekDays.map((date, index) => {
                    const log = getLogForFullDate(date);
                    const score = log ? calculateScore(log) : 0;
                    const totals = log ? getDayTotals(log) : null;
                    const today = isTodayFullDate(date);

                    return (
                      <div
                        key={index}
                        className={`bg-white rounded-2xl p-4 border-2 transition-all ${
                          log ? 'border-emerald-200 hover:border-emerald-400 hover:shadow-lg cursor-pointer' : 'border-neutral-200 opacity-60'
                        } ${today ? 'ring-2 ring-emerald-500' : ''}`}
                        onClick={() => log && setSelectedDayLog(log)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`text-center ${log ? 'bg-emerald-50' : 'bg-neutral-50'} rounded-xl p-3 min-w-[60px]`}>
                              <p className="text-xs text-neutral-600 font-medium uppercase">
                                {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                              </p>
                              <p className={`text-2xl font-bold ${log ? 'text-emerald-600' : 'text-neutral-400'}`}>
                                {date.getDate()}
                              </p>
                            </div>
                            
                            {log && (
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={`w-2 h-2 rounded-full ${getScoreColor(score)}`} />
                                  <span className="text-lg font-bold text-neutral-800">
                                    {score}%
                                  </span>
                                </div>
                                {log.weight && (
                                  <p className="text-xs text-blue-600 font-semibold">Peso: {log.weight} kg</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {log && totals && (
                          <div className="grid grid-cols-4 gap-2">
                            <div className="bg-emerald-50 rounded-lg p-2 text-center">
                              <Flame className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                              <p className="text-sm font-bold text-neutral-800">{Math.round(totals.calories)}</p>
                              <p className="text-xs text-neutral-500">kcal</p>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-2 text-center">
                              <Beef className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                              <p className="text-sm font-bold text-neutral-800">{Math.round(totals.protein)}g</p>
                              <p className="text-xs text-neutral-500">Prot</p>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-2 text-center">
                              <Wheat className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                              <p className="text-sm font-bold text-neutral-800">{Math.round(totals.carbs)}g</p>
                              <p className="text-xs text-neutral-500">Carb</p>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-2 text-center">
                              <Droplet className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                              <p className="text-sm font-bold text-neutral-800">{Math.round(totals.fat)}g</p>
                              <p className="text-xs text-neutral-500">Gras</p>
                            </div>
                          </div>
                        )}

                        {!log && (
                          <div className="text-center py-4">
                            <p className="text-neutral-500 text-sm">Sin datos</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'weight' && (
            <WeightTrackingContent
              user={user}
              onUpdateWeight={(weight, date) => {
                onUpdateWeight(weight, date);
              }}
              standalone={false}
            />
          )}
        </div>
      </div>

      {/* Modal de Detalle de Día */}
      {selectedDayLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setSelectedDayLog(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold capitalize">{formatDate(selectedDayLog.date)}</h3>
                  {selectedDayLog.weight && (
                    <p className="text-emerald-100 text-sm mt-1">Peso: {selectedDayLog.weight} kg</p>
                  )}
                </div>
                <button onClick={() => setSelectedDayLog(null)} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
              {/* Resumen de Macros */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 mb-6">
                <h4 className="font-bold text-neutral-800 mb-3">Resumen del Día</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl p-3 text-center">
                    <Flame className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <p className="text-lg font-bold text-neutral-800">{Math.round(getDayTotals(selectedDayLog).calories)}</p>
                    <p className="text-xs text-neutral-500">kcal</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center">
                    <Beef className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <p className="text-lg font-bold text-neutral-800">{Math.round(getDayTotals(selectedDayLog).protein)}g</p>
                    <p className="text-xs text-neutral-500">Proteína</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center">
                    <Wheat className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                    <p className="text-lg font-bold text-neutral-800">{Math.round(getDayTotals(selectedDayLog).carbs)}g</p>
                    <p className="text-xs text-neutral-500">Carbos</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center">
                    <Droplet className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                    <p className="text-lg font-bold text-neutral-800">{Math.round(getDayTotals(selectedDayLog).fat)}g</p>
                    <p className="text-xs text-neutral-500">Grasas</p>
                  </div>
                </div>
              </div>

              {/* Comidas */}
              <div className="space-y-3">
                {selectedDayLog.breakfast && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
                    <h5 className="font-bold text-neutral-800 mb-2">🌅 Desayuno</h5>
                    <p className="text-neutral-700 font-medium">{selectedDayLog.breakfast.name}</p>
                    <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
                      <span className="text-neutral-600">{selectedDayLog.breakfast.calories} kcal</span>
                      <span className="text-neutral-600">{selectedDayLog.breakfast.protein}g P</span>
                      <span className="text-neutral-600">{selectedDayLog.breakfast.carbs}g C</span>
                      <span className="text-neutral-600">{selectedDayLog.breakfast.fat}g G</span>
                    </div>
                  </div>
                )}

                {selectedDayLog.lunch && (
                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4">
                    <h5 className="font-bold text-neutral-800 mb-2">☀️ Comida</h5>
                    <p className="text-neutral-700 font-medium">{selectedDayLog.lunch.name}</p>
                    <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
                      <span className="text-neutral-600">{selectedDayLog.lunch.calories} kcal</span>
                      <span className="text-neutral-600">{selectedDayLog.lunch.protein}g P</span>
                      <span className="text-neutral-600">{selectedDayLog.lunch.carbs}g C</span>
                      <span className="text-neutral-600">{selectedDayLog.lunch.fat}g G</span>
                    </div>
                  </div>
                )}

                {selectedDayLog.snack && (
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4">
                    <h5 className="font-bold text-neutral-800 mb-2">🍎 Merienda</h5>
                    <p className="text-neutral-700 font-medium">{selectedDayLog.snack.name}</p>
                    <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
                      <span className="text-neutral-600">{selectedDayLog.snack.calories} kcal</span>
                      <span className="text-neutral-600">{selectedDayLog.snack.protein}g P</span>
                      <span className="text-neutral-600">{selectedDayLog.snack.carbs}g C</span>
                      <span className="text-neutral-600">{selectedDayLog.snack.fat}g G</span>
                    </div>
                  </div>
                )}

                {selectedDayLog.dinner && (
                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4">
                    <h5 className="font-bold text-neutral-800 mb-2">🌙 Cena</h5>
                    <p className="text-neutral-700 font-medium">{selectedDayLog.dinner.name}</p>
                    <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
                      <span className="text-neutral-600">{selectedDayLog.dinner.calories} kcal</span>
                      <span className="text-neutral-600">{selectedDayLog.dinner.protein}g P</span>
                      <span className="text-neutral-600">{selectedDayLog.dinner.carbs}g C</span>
                      <span className="text-neutral-600">{selectedDayLog.dinner.fat}g G</span>
                    </div>
                  </div>
                )}

                {selectedDayLog.extraFoods && selectedDayLog.extraFoods.length > 0 && (
                  <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4">
                    <h5 className="font-bold text-neutral-800 mb-2">➕ Extras</h5>
                    {selectedDayLog.extraFoods.map((extra, idx) => (
                      <div key={idx} className="mb-2 last:mb-0">
                        <p className="text-neutral-700 font-medium">{extra.name}</p>
                        <div className="grid grid-cols-4 gap-2 mt-1 text-xs">
                          <span className="text-neutral-600">{extra.calories} kcal</span>
                          <span className="text-neutral-600">{extra.protein}g P</span>
                          <span className="text-neutral-600">{extra.carbs}g C</span>
                          <span className="text-neutral-600">{extra.fat}g G</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
