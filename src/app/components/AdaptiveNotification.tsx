import { X, TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface AdaptiveNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  type: 'adjustment' | 'metabolic_adaptation' | 'on_track';
  title: string;
  message: string;
  newGoals?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  warnings?: string[];
}

export default function AdaptiveNotification({
  isVisible,
  onClose,
  type,
  title,
  message,
  newGoals,
  warnings
}: AdaptiveNotificationProps) {
  if (!isVisible) return null;

  const getColors = () => {
    switch (type) {
      case 'adjustment':
        return {
          bg: 'from-emerald-500 to-teal-600',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          warningBg: 'bg-amber-50',
          warningBorder: 'border-amber-300',
          warningText: 'text-amber-800'
        };
      case 'metabolic_adaptation':
        return {
          bg: 'from-amber-500 to-orange-600',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          warningBg: 'bg-red-50',
          warningBorder: 'border-red-300',
          warningText: 'text-red-800'
        };
      case 'on_track':
        return {
          bg: 'from-green-500 to-emerald-600',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          warningBg: 'bg-blue-50',
          warningBorder: 'border-blue-300',
          warningText: 'text-blue-800'
        };
    }
  };

  const colors = getColors();

  const getIcon = () => {
    switch (type) {
      case 'adjustment':
        return <TrendingUp className="w-6 h-6" />;
      case 'metabolic_adaptation':
        return <AlertCircle className="w-6 h-6" />;
      case 'on_track':
        return <CheckCircle className="w-6 h-6" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl transform transition-transform duration-300">
        {/* Header */}
        <div className={`bg-gradient-to-r ${colors.bg} text-white p-6`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`${colors.iconBg} p-3 rounded-2xl`}>
              <div className={colors.iconColor}>{getIcon()}</div>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-white/90">{message}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* New Goals */}
          {newGoals && (
            <div className="bg-neutral-50 rounded-2xl p-4">
              <h3 className="font-semibold text-neutral-800 mb-3">Nuevos Macros:</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 border border-neutral-200">
                  <p className="text-xs text-neutral-600 mb-1">Calorías</p>
                  <p className="text-xl font-bold text-emerald-600">{newGoals.calories}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-neutral-200">
                  <p className="text-xs text-neutral-600 mb-1">Proteína</p>
                  <p className="text-xl font-bold text-blue-600">{newGoals.protein}g</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-neutral-200">
                  <p className="text-xs text-neutral-600 mb-1">Carbos</p>
                  <p className="text-xl font-bold text-amber-600">{newGoals.carbs}g</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-neutral-200">
                  <p className="text-xs text-neutral-600 mb-1">Grasas</p>
                  <p className="text-xl font-bold text-rose-600">{newGoals.fat}g</p>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings && warnings.length > 0 && (
            <div className={`${colors.warningBg} border-2 ${colors.warningBorder} rounded-2xl p-4`}>
              <div className="flex items-start gap-2">
                <Info className={`w-5 h-5 ${colors.warningText} flex-shrink-0 mt-0.5`} />
                <div>
                  <p className={`text-sm font-semibold ${colors.warningText} mb-2`}>
                    Consideraciones:
                  </p>
                  <ul className={`text-xs ${colors.warningText} space-y-1`}>
                    {warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="mt-1">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={onClose}
            className={`w-full bg-gradient-to-r ${colors.bg} text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity`}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}