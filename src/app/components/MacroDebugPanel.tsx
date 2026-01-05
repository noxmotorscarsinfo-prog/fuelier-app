/**
 * Panel de debug para validar que los macros se distribuyen correctamente
 * SOLO PARA DESARROLLO - Se puede eliminar en producción
 */

import { User } from '../types';
import { validateDailyMacroDistribution } from '../utils/macroValidation';
import { getMealGoals, getAllMealGoals, getActiveMealTypes } from '../utils/mealDistribution'; // NUEVO: Importar getAllMealGoals y getActiveMealTypes
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface MacroDebugPanelProps {
  user: User;
}

export default function MacroDebugPanel({ user }: MacroDebugPanelProps) {
  const validation = validateDailyMacroDistribution(user);
  
  const mealTypes: Array<'breakfast' | 'lunch' | 'snack' | 'dinner'> = ['breakfast', 'lunch', 'snack', 'dinner'];
  
  return (
    <div className=\"bg-white rounded-2xl p-6 shadow-sm border border-neutral-200\">
      <h3 className=\"text-lg font-semibold mb-4 flex items-center gap-2\">
        <Info className=\"w-5 h-5 text-blue-600\" />
        Debug: Validación de Macros
      </h3>
      
      {/* Estado de validación */}
      <div className={`p-4 rounded-xl mb-4 ${validation.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className=\"flex items-center gap-2 mb-2\">
          {validation.isValid ? (
            <>
              <CheckCircle className=\"w-5 h-5 text-green-600\" />
              <span className=\"text-green-800 font-semibold\">✅ Distribución correcta</span>
            </>
          ) : (
            <>
              <AlertTriangle className=\"w-5 h-5 text-red-600\" />
              <span className=\"text-red-800 font-semibold\">❌ Errores detectados</span>
            </>
          )}
        </div>
        
        {!validation.isValid && (
          <ul className=\"text-sm text-red-700 ml-7 space-y-1\">
            {validation.errors.map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Tabla de distribución por comida */}
      <div className=\"mb-4\">
        <h4 className=\"text-sm font-semibold text-neutral-700 mb-2\">Distribución por comida:</h4>
        <div className=\"overflow-x-auto\">
          <table className=\"w-full text-xs\">
            <thead>
              <tr className=\"bg-neutral-100\">
                <th className=\"p-2 text-left\">Comida</th>
                <th className=\"p-2 text-right\">Calorías</th>
                <th className=\"p-2 text-right\">Proteína</th>
                <th className=\"p-2 text-right\">Carbos</th>
                <th className=\"p-2 text-right\">Grasas</th>
              </tr>
            </thead>
            <tbody>
              {mealTypes.map(type => {
                const goals = getMealGoals(user, type);
                const names = {
                  breakfast: 'Desayuno',
                  lunch: 'Comida',
                  snack: 'Merienda',
                  dinner: 'Cena'
                };
                
                return (
                  <tr key={type} className=\"border-b border-neutral-100\">
                    <td className=\"p-2\">{names[type]}</td>
                    <td className=\"p-2 text-right\">{goals.calories} kcal</td>
                    <td className=\"p-2 text-right\">{goals.protein}g</td>
                    <td className=\"p-2 text-right\">{goals.carbs}g</td>
                    <td className=\"p-2 text-right\">{goals.fat}g</td>
                  </tr>
                );
              })}
              <tr className=\"bg-neutral-50 font-semibold\">
                <td className=\"p-2\">TOTAL</td>
                <td className=\"p-2 text-right\">{validation.totals.calories}</td>
                <td className=\"p-2 text-right\">{validation.totals.protein}g</td>
                <td className=\"p-2 text-right\">{validation.totals.carbs}g</td>
                <td className=\"p-2 text-right\">{validation.totals.fat}g</td>
              </tr>
              <tr className=\"bg-emerald-50 font-semibold\">
                <td className=\"p-2\">ESPERADO</td>
                <td className=\"p-2 text-right\">{validation.expected.calories}</td>
                <td className=\"p-2 text-right\">{validation.expected.protein}g</td>
                <td className=\"p-2 text-right\">{validation.expected.carbs}g</td>
                <td className=\"p-2 text-right\">{validation.expected.fat}g</td>
              </tr>
              <tr className={`font-semibold ${validation.isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                <td className=\"p-2\">DIFERENCIA</td>
                <td className=\"p-2 text-right\">{validation.differences.calories > 0 ? '+' : ''}{validation.differences.calories}</td>
                <td className=\"p-2 text-right\">{validation.differences.protein > 0 ? '+' : ''}{validation.differences.protein}g</td>
                <td className=\"p-2 text-right\">{validation.differences.carbs > 0 ? '+' : ''}{validation.differences.carbs}g</td>
                <td className=\"p-2 text-right\">{validation.differences.fat > 0 ? '+' : ''}{validation.differences.fat}g</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Información adicional */}
      <div className=\"bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800\">
        <p className=\"font-semibold mb-1\">ℹ️ Información:</p>
        <ul className=\"space-y-1 ml-4\">
          <li>• La distribución ahora es PROPORCIONAL al % de calorías de cada comida</li>
          <li>• Esto garantiza que la suma exacta = objetivo diario</li>
          <li>• Tolerancia permitida: ±2% por redondeos</li>
        </ul>
      </div>
    </div>
  );
}