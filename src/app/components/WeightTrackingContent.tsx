import { useState, useEffect } from 'react';
import { User } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Scale, TrendingDown, TrendingUp, Minus, Calendar, Plus, X, Target, AlertCircle } from 'lucide-react';
import RecalculatingModal from './RecalculatingModal';

interface WeightTrackingContentProps {
  user: User;
  onUpdateWeight: (weight: number, date: string) => void;
  standalone?: boolean; // Si es true, muestra en modal completo, si no, solo contenido
}

export default function WeightTrackingContent({ user, onUpdateWeight, standalone = false }: WeightTrackingContentProps) {
  const [newWeight, setNewWeight] = useState<string>(user.weight.toString());
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [showRecalculating, setShowRecalculating] = useState(false);

  // Cerrar modal de recalcular automáticamente después de 2.5 segundos
  useEffect(() => {
    if (showRecalculating) {
      const timer = setTimeout(() => {
        setShowRecalculating(false);
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [showRecalculating]);

  // Obtener datos de peso históricos
  const getWeightHistory = () => {
    const history: { date: string; weight: number; week: number }[] = [];
    
    // Peso inicial
    history.push({
      date: new Date(Date.now() - (user.weeklyProgress?.length || 0) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      weight: user.weight,
      week: 0
    });

    // Pesos semanales
    if (user.weeklyProgress && user.weeklyProgress.length > 0) {
      user.weeklyProgress.forEach((record, index) => {
        history.push({
          date: record.weekStartDate,
          weight: record.endWeight,
          week: index + 1
        });
      });
    }

    return history;
  };

  const weightHistory = getWeightHistory();

  // Calcular estadísticas
  const getStats = () => {
    if (weightHistory.length < 2) {
      return {
        totalChange: 0,
        weeklyAverage: 0,
        trend: 'maintaining' as const,
        weeksTracking: 0
      };
    }

    const firstWeight = weightHistory[0].weight;
    const lastWeight = weightHistory[weightHistory.length - 1].weight;
    const totalChange = lastWeight - firstWeight;
    const weeksTracking = weightHistory.length - 1;
    const weeklyAverage = weeksTracking > 0 ? totalChange / weeksTracking : 0;

    let trend: 'losing_fast' | 'losing_moderate' | 'losing_slow' | 'maintaining' | 'gaining_slow' | 'gaining_moderate' | 'gaining_fast';
    
    if (weeklyAverage < -0.75) trend = 'losing_fast';
    else if (weeklyAverage < -0.3) trend = 'losing_moderate';
    else if (weeklyAverage < -0.1) trend = 'losing_slow';
    else if (weeklyAverage > 0.75) trend = 'gaining_fast';
    else if (weeklyAverage > 0.3) trend = 'gaining_moderate';
    else if (weeklyAverage > 0.1) trend = 'gaining_slow';
    else trend = 'maintaining';

    return {
      totalChange,
      weeklyAverage,
      trend,
      weeksTracking
    };
  };

  const stats = getStats();

  // Determinar si va según el plan
  const isOnTrack = () => {
    const { weeklyAverage } = stats;
    
    switch (user.goal) {
      case 'rapid_loss':
        return weeklyAverage >= -1.0 && weeklyAverage <= -0.75;
      case 'moderate_loss':
        return weeklyAverage >= -0.75 && weeklyAverage <= -0.5;
      case 'maintenance':
        return Math.abs(weeklyAverage) <= 0.15;
      case 'moderate_gain':
        return weeklyAverage >= 0.25 && weeklyAverage <= 0.5;
      case 'rapid_gain':
        return weeklyAverage >= 0.5 && weeklyAverage <= 0.75;
      default:
        return false;
    }
  };

  const onTrack = isOnTrack();
  
  // Determinar si hay suficiente historial para evaluar (más de 1 semana)
  const hasEnoughData = stats.weeksTracking > 1;

  // Manejar agregar nuevo peso
  const handleAddWeight = () => {
    const weight = parseFloat(newWeight);
    if (!isNaN(weight) && weight > 0) {
      const today = new Date().toISOString().split('T')[0];
      onUpdateWeight(weight, today);
      setShowAddWeight(false);
      setNewWeight(weight.toString());
      setShowRecalculating(true);
    }
  };

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  // Color según tendencia
  const getTrendColor = () => {
    if (user.goal.includes('loss')) {
      if (stats.trend.includes('losing')) return 'text-emerald-600';
      if (stats.trend.includes('gaining')) return 'text-red-600';
      return 'text-amber-600';
    } else if (user.goal.includes('gain')) {
      if (stats.trend.includes('gaining')) return 'text-emerald-600';
      if (stats.trend.includes('losing')) return 'text-red-600';
      return 'text-amber-600';
    } else {
      if (stats.trend === 'maintaining') return 'text-emerald-600';
      return 'text-amber-600';
    }
  };

  const getTrendIcon = () => {
    if (stats.trend.includes('losing')) return <TrendingDown className="w-5 h-5" />;
    if (stats.trend.includes('gaining')) return <TrendingUp className="w-5 h-5" />;
    return <Minus className="w-5 h-5" />;
  };

  const content = (
    <>
      {/* Quick Stats - Solo si NO está en standalone */}
      {!standalone && (
        <div className="grid grid-cols-3 gap-3 px-6 pt-6">
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
            <p className="text-xs text-emerald-700 mb-1">Peso Actual</p>
            <p className="text-2xl font-bold text-emerald-800">{user.weight} kg</p>
          </div>
          <div className="bg-teal-50 rounded-xl p-3 border border-teal-200">
            <p className="text-xs text-teal-700 mb-1">Cambio Total</p>
            <p className={`text-2xl font-bold ${stats.totalChange < 0 ? 'text-emerald-700' : stats.totalChange > 0 ? 'text-amber-700' : 'text-teal-800'}`}>
              {stats.totalChange > 0 ? '+' : ''}{stats.totalChange.toFixed(1)} kg
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
            <p className="text-xs text-blue-700 mb-1">Promedio Semanal</p>
            <p className="text-2xl font-bold text-blue-800">
              {stats.weeklyAverage > 0 ? '+' : ''}{stats.weeklyAverage.toFixed(2)} kg
            </p>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Status Alert */}
        {hasEnoughData ? (
          <div className={`rounded-2xl p-4 mb-6 border-2 ${
            onTrack 
              ? 'bg-emerald-50 border-emerald-300' 
              : 'bg-amber-50 border-amber-300'
          }`}>
            <div className="flex items-start gap-3">
              {onTrack ? (
                <Target className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={`font-semibold ${onTrack ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {onTrack ? '¡Vas según el plan! 🎯' : 'Ajuste necesario ⚠️'}
                </p>
                <p className={`text-sm ${onTrack ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {onTrack 
                    ? 'Tu peso está cambiando según lo esperado. ¡Sigue así!'
                    : 'Tu peso está cambiando a un ritmo diferente del objetivo. El sistema adaptará tus calorías para mantener un progreso saludable.'}
                </p>
              </div>
              <div className={`${getTrendColor()} flex items-center gap-1`}>
                {getTrendIcon()}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-4 mb-6 border-2 bg-blue-50 border-blue-300">
            <div className="flex items-start gap-3">
              <Target className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-blue-700">
                  El sistema adaptará tus calorías para mantener un progreso saludable.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        {weightHistory.length >= 2 ? (
          <div className="bg-neutral-50 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-neutral-800 mb-4">Gráfica de Progreso</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weightHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  domain={['dataMin - 2', 'dataMax + 2']}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '2px solid #10b981',
                    borderRadius: '12px',
                    padding: '8px 12px'
                  }}
                  labelFormatter={(label) => `Fecha: ${formatDate(label as string)}`}
                  formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Peso']}
                />
                <ReferenceLine 
                  y={weightHistory[0].weight} 
                  stroke="#9ca3af" 
                  strokeDasharray="3 3"
                  label={{ value: 'Inicio', position: 'right', fill: '#9ca3af' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-6 text-center">
            <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <p className="font-semibold text-blue-800 mb-2">Comienza tu seguimiento</p>
            <p className="text-sm text-blue-700">
              Registra tu peso semanalmente para ver tu progreso y permitir que el sistema se ajuste automáticamente.
            </p>
          </div>
        )}

        {/* Weight History Table */}
        {weightHistory.length > 0 && (
          <div className="bg-white border-2 border-neutral-200 rounded-2xl overflow-hidden">
            <div className="bg-neutral-100 px-4 py-3 border-b-2 border-neutral-200">
              <h3 className="font-semibold text-neutral-800">Historial de Pesos</h3>
            </div>
            <div className="divide-y divide-neutral-200 max-h-64 overflow-y-auto">
              {[...weightHistory].reverse().map((entry, index) => {
                const isFirst = index === 0;
                const prevEntry = index < weightHistory.length - 1 ? [...weightHistory].reverse()[index + 1] : null;
                const change = prevEntry ? entry.weight - prevEntry.weight : 0;

                return (
                  <div key={entry.date} className="px-4 py-3 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          isFirst ? 'bg-emerald-500' : 'bg-neutral-300'
                        }`} />
                        <div>
                          <p className="font-semibold text-neutral-800">
                            Semana {weightHistory.length - 1 - index}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {formatDate(entry.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-neutral-800">{entry.weight} kg</p>
                        {prevEntry && (
                          <p className={`text-xs ${
                            change < 0 ? 'text-emerald-600' : change > 0 ? 'text-red-600' : 'text-neutral-500'
                          }`}>
                            {change > 0 ? '+' : ''}{change.toFixed(1)} kg
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer - Botón para agregar peso */}
      <div className="border-t border-neutral-200 p-4 bg-neutral-50">
        {showAddWeight ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.1"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="Peso en kg"
                className="flex-1 px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-emerald-500 focus:outline-none transition-colors"
                autoFocus
              />
              <button
                onClick={handleAddWeight}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Guardar
              </button>
              <button
                onClick={() => setShowAddWeight(false)}
                className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 px-4 py-3 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-neutral-600 text-center">
              Registra tu peso en ayunas, al despertar, para mayor precisión
            </p>
          </div>
        ) : (
          <button
            onClick={() => setShowAddWeight(true)}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Registrar Peso
          </button>
        )}
      </div>

      {/* Modal de Recalculando */}
      {showRecalculating && (
        <RecalculatingModal 
          isVisible={showRecalculating}
          currentWeight={user.weight}
          newWeight={parseFloat(newWeight)}
        />
      )}
    </>
  );

  return content;
}