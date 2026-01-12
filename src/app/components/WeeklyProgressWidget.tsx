import { DailyLog, MacroGoals } from '../types';

interface WeeklyProgressWidgetProps {
  last7Days: Array<{
    date: string;
    dayName: string;
    dayNumber: number;
    isToday: boolean;
    log: DailyLog | null;
  }>;
  goals: MacroGoals;
}

export default function WeeklyProgressWidget({ last7Days, goals }: WeeklyProgressWidgetProps) {
  // Calcular puntuación de un día
  const calculateDayScore = (log: DailyLog) => {
    const meals = [log.breakfast, log.lunch, log.snack, log.dinner];
    const dayTotals = meals.reduce(
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
    
    // Agregar extras si existen
    if (log.extraFoods && log.extraFoods.length > 0) {
      log.extraFoods.forEach(extra => {
        dayTotals.calories += extra.calories || 0;
        dayTotals.protein += extra.protein || 0;
        dayTotals.carbs += extra.carbs || 0;
        dayTotals.fat += extra.fat || 0;
      });
    }
    
    // Evitar división por cero si goals son 0
    const caloriesScore = goals.calories > 0 
      ? Math.min((dayTotals.calories / goals.calories) * 100, 100) 
      : 0;
    const proteinScore = goals.protein > 0 
      ? Math.min((dayTotals.protein / goals.protein) * 100, 100) 
      : 0;
    const carbsScore = goals.carbs > 0 
      ? Math.min((dayTotals.carbs / goals.carbs) * 100, 100) 
      : 0;
    const fatScore = goals.fat > 0 
      ? Math.min((dayTotals.fat / goals.fat) * 100, 100) 
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

  const getScoreBorderColor = (score: number) => {
    if (score >= 90) return 'border-green-500';
    if (score >= 70) return 'border-emerald-500';
    if (score >= 50) return 'border-yellow-500';
    if (score >= 30) return 'border-orange-500';
    return 'border-red-500';
  };

  return (
    <div className="grid grid-cols-7 gap-1">
      {last7Days.map((day) => {
        const score = day.log ? calculateDayScore(day.log) : 0;
        const hasData = day.log && (day.log.breakfast || day.log.lunch || day.log.snack || day.log.dinner);
        
        return (
          <div
            key={day.date}
            className={`text-center p-1 rounded-lg transition-all ${
              day.isToday 
                ? 'bg-emerald-600 text-white' 
                : hasData 
                  ? 'bg-white border ' + getScoreBorderColor(score)
                  : 'bg-neutral-100 border border-neutral-200'
            }`}
          >
            <p className={`text-xs ${day.isToday ? 'text-emerald-200' : 'text-neutral-400'}`}>
              {day.dayName.substring(0, 1)}
            </p>
            <p className={`text-sm font-semibold ${day.isToday ? 'text-white' : 'text-neutral-800'}`}>
              {day.dayNumber}
            </p>
            {hasData && !day.isToday && (
              <div className={`w-4 h-4 rounded-full ${getScoreColor(score)} mx-auto mt-0.5 flex items-center justify-center text-white text-xs`}>
                {score}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
