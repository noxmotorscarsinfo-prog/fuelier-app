import { Loader2, Scale, TrendingUp, Calculator } from 'lucide-react';

interface RecalculatingModalProps {
  isVisible: boolean;
  currentWeight: number;
  newWeight: number;
}

export default function RecalculatingModal({ isVisible, currentWeight, newWeight }: RecalculatingModalProps) {
  if (!isVisible) return null;

  const weightDiff = newWeight - currentWeight;
  const isGaining = weightDiff > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header con gradiente animado */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-[length:200%_100%] animate-[gradient_3s_ease_infinite] text-white p-8 text-center">
          <div className="bg-white/20 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
            <Scale className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Recalculando Dieta</h2>
          <p className="text-white/90 text-sm">Ajustando tus macros al nuevo peso...</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Cambio de peso */}
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-neutral-600 mb-1">Peso anterior</p>
                <p className="text-2xl font-bold text-neutral-700">{currentWeight.toFixed(1)} kg</p>
              </div>
              <TrendingUp className={`w-6 h-6 ${isGaining ? 'text-blue-500 rotate-0' : 'text-emerald-500 rotate-180'}`} />
              <div className="text-right">
                <p className="text-xs text-neutral-600 mb-1">Peso nuevo</p>
                <p className="text-2xl font-bold text-emerald-600">{newWeight.toFixed(1)} kg</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-neutral-200 text-center">
              <p className="text-xs text-neutral-600 mb-1">Diferencia</p>
              <p className={`text-lg font-bold ${isGaining ? 'text-blue-600' : 'text-emerald-600'}`}>
                {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg
              </p>
            </div>
          </div>

          {/* Proceso de recálculo */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              </div>
              <span className="text-neutral-700">Actualizando peso en perfil...</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
              </div>
              <span className="text-neutral-700">Recalculando TMB y TDEE...</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Calculator className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-neutral-700">Ajustando macronutrientes...</span>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="bg-neutral-100 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-[progress_2s_ease-in-out_infinite]" style={{ width: '70%' }}></div>
          </div>

          <p className="text-xs text-center text-neutral-500">
            Esto tomará solo un momento...
          </p>
        </div>
      </div>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
