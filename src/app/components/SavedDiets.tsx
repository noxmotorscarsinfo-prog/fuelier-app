import { SavedDiet, User } from '../types';
import { X, Star, Flame, Beef, Wheat, Droplet, ArrowLeft, Trash2, Check } from 'lucide-react';
import { useState } from 'react';

interface SavedDietsProps {
  user: User;
  savedDiets: SavedDiet[];
  onClose: () => void;
  onApplyDiet: (diet: SavedDiet) => void;
  onDeleteDiet: (dietId: string) => void;
  onToggleFavorite: (dietId: string) => void;
}

export default function SavedDiets({
  user,
  savedDiets,
  onClose,
  onApplyDiet,
  onDeleteDiet,
  onToggleFavorite
}: SavedDietsProps) {
  const [selectedDiet, setSelectedDiet] = useState<SavedDiet | null>(null);

  const getMealEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      breakfast: '🌅',
      lunch: '🍽️',
      snack: '🍎',
      dinner: '🌙'
    };
    return emojis[type] || '🍴';
  };

  const getMealLabel = (type: string) => {
    const labels: Record<string, string> = {
      breakfast: 'Desayuno',
      lunch: 'Comida',
      snack: 'Merienda',
      dinner: 'Cena'
    };
    return labels[type] || type;
  };

  const calculateMacroScore = (diet: SavedDiet) => {
    const goals = user.goals;
    
    const caloriesDiff = Math.abs(diet.totalCalories - goals.calories);
    const proteinDiff = Math.abs(diet.totalProtein - goals.protein);
    const carbsDiff = Math.abs(diet.totalCarbs - goals.carbs);
    const fatDiff = Math.abs(diet.totalFat - goals.fat);
    
    const caloriesScore = Math.max(0, 100 - (caloriesDiff / goals.calories) * 100);
    const proteinScore = Math.max(0, 100 - (proteinDiff / goals.protein) * 100);
    const carbsScore = Math.max(0, 100 - (carbsDiff / goals.carbs) * 100);
    const fatScore = Math.max(0, 100 - (fatDiff / goals.fat) * 100);
    
    return Math.round((caloriesScore + proteinScore + carbsScore + fatScore) / 4);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    if (score >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'bg-amber-50 border-amber-200';
    if (score >= 30) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  if (selectedDiet) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-t-3xl">
            <div className="flex justify-between items-start mb-4">
              <button
                onClick={() => setSelectedDiet(null)}
                className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => onToggleFavorite(selectedDiet.id)}
                  className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all"
                >
                  <Star className={`w-5 h-5 ${selectedDiet.isFavorite ? 'fill-yellow-300 text-yellow-300' : ''}`} />
                </button>
                <button
                  onClick={() => {
                    if (confirm('¿Eliminar esta dieta guardada?')) {
                      onDeleteDiet(selectedDiet.id);
                      setSelectedDiet(null);
                    }
                  }}
                  className="bg-white/20 p-2 rounded-xl hover:bg-red-500 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <h2 className="text-2xl mb-2">{selectedDiet.name}</h2>
            {selectedDiet.description && (
              <p className="text-emerald-100 text-sm">{selectedDiet.description}</p>
            )}
            <p className="text-emerald-100 text-sm mt-2">
              Creada el {new Date(selectedDiet.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Resumen de Macros */}
            <div className="bg-neutral-50 rounded-2xl p-4">
              <h3 className="text-sm text-neutral-600 mb-3">Resumen Nutricional</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <Flame className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-lg text-emerald-600 font-semibold">{selectedDiet.totalCalories}</p>
                  <p className="text-xs text-neutral-500">kcal</p>
                </div>
                <div className="text-center">
                  <Beef className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg text-blue-600 font-semibold">{selectedDiet.totalProtein}g</p>
                  <p className="text-xs text-neutral-500">Proteína</p>
                </div>
                <div className="text-center">
                  <Wheat className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-lg text-amber-600 font-semibold">{selectedDiet.totalCarbs}g</p>
                  <p className="text-xs text-neutral-500">Carbos</p>
                </div>
                <div className="text-center">
                  <Droplet className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                  <p className="text-lg text-orange-600 font-semibold">{selectedDiet.totalFat}g</p>
                  <p className="text-xs text-neutral-500">Grasas</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            {selectedDiet.tags && selectedDiet.tags.length > 0 && (
              <div>
                <h3 className="text-sm text-neutral-600 mb-2">Etiquetas</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDiet.tags.map(tag => (
                    <span key={tag} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Comidas */}
            <div className="space-y-3">
              <h3 className="text-sm text-neutral-600">Comidas del Día</h3>
              
              {['breakfast', 'lunch', 'snack', 'dinner'].map(mealType => {
                const meal = selectedDiet[mealType as keyof SavedDiet];
                if (!meal || typeof meal === 'string' || typeof meal === 'number' || typeof meal === 'boolean' || Array.isArray(meal)) return null;
                
                return (
                  <div key={mealType} className="bg-white border border-neutral-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getMealEmoji(mealType)}</span>
                      <div className="flex-1">
                        <p className="text-xs text-emerald-600 uppercase tracking-wide mb-1">
                          {getMealLabel(mealType)}
                        </p>
                        <h4 className="text-neutral-800 font-medium">{meal.name}</h4>
                        {meal.variant && <p className="text-sm text-neutral-500">{meal.variant}</p>}
                        
                        <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                          <div>
                            <p className="text-sm text-emerald-600 font-medium">{meal.calories}</p>
                            <p className="text-xs text-neutral-400">kcal</p>
                          </div>
                          <div>
                            <p className="text-sm text-blue-600 font-medium">{meal.protein}g</p>
                            <p className="text-xs text-neutral-400">Prot</p>
                          </div>
                          <div>
                            <p className="text-sm text-amber-600 font-medium">{meal.carbs}g</p>
                            <p className="text-xs text-neutral-400">Carb</p>
                          </div>
                          <div>
                            <p className="text-sm text-orange-600 font-medium">{meal.fat}g</p>
                            <p className="text-xs text-neutral-400">Grasa</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botón Aplicar */}
            <button
              onClick={() => {
                onApplyDiet(selectedDiet);
                setSelectedDiet(null);
                onClose();
              }}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-4 rounded-2xl hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Check className="w-5 h-5" />
              <span className="font-medium">Aplicar Esta Dieta a Hoy</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-t-3xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl mb-2">Mis Dietas Guardadas</h2>
              <p className="text-emerald-100 text-sm">
                Días completos que te han funcionado bien
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {savedDiets.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-neutral-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Star className="w-10 h-10 text-neutral-400" />
              </div>
              <h3 className="text-xl text-neutral-800 mb-2">Sin dietas guardadas</h3>
              <p className="text-neutral-500 text-sm max-w-md mx-auto">
                Cuando tengas un día que te guste mucho, guárdalo desde el menú del calendario para poder reutilizarlo fácilmente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedDiets
                .sort((a, b) => {
                  if (a.isFavorite && !b.isFavorite) return -1;
                  if (!a.isFavorite && b.isFavorite) return 1;
                  return new Date(b.date).getTime() - new Date(a.date).getTime();
                })
                .map(diet => {
                  const score = calculateMacroScore(diet);
                  return (
                    <div
                      key={diet.id}
                      onClick={() => setSelectedDiet(diet)}
                      className="bg-white border border-neutral-200 rounded-2xl p-4 hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-neutral-800 font-medium group-hover:text-emerald-600 transition-colors">
                              {diet.name}
                            </h3>
                            {diet.isFavorite && (
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            )}
                          </div>
                          {diet.description && (
                            <p className="text-sm text-neutral-500 mb-2">{diet.description}</p>
                          )}
                          <p className="text-xs text-neutral-400">
                            {new Date(diet.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full border ${getScoreBgColor(score)}`}>
                          <p className={`text-sm font-semibold ${getScoreColor(score)}`}>
                            {score}%
                          </p>
                        </div>
                      </div>

                      {/* Macros Summary */}
                      <div className="grid grid-cols-4 gap-2 text-center bg-neutral-50 rounded-xl p-3">
                        <div>
                          <p className="text-sm text-emerald-600 font-medium">{diet.totalCalories}</p>
                          <p className="text-xs text-neutral-400">kcal</p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-600 font-medium">{diet.totalProtein}g</p>
                          <p className="text-xs text-neutral-400">Prot</p>
                        </div>
                        <div>
                          <p className="text-sm text-amber-600 font-medium">{diet.totalCarbs}g</p>
                          <p className="text-xs text-neutral-400">Carb</p>
                        </div>
                        <div>
                          <p className="text-sm text-orange-600 font-medium">{diet.totalFat}g</p>
                          <p className="text-xs text-neutral-400">Grasa</p>
                        </div>
                      </div>

                      {/* Tags */}
                      {diet.tags && diet.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {diet.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-xs">
                              {tag}
                            </span>
                          ))}
                          {diet.tags.length > 3 && (
                            <span className="text-xs text-neutral-400 px-2 py-1">
                              +{diet.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
