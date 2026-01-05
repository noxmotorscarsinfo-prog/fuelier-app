import { useState } from 'react';
import { Heart, X, AlertTriangle, Ban, ChevronRight, Plus } from 'lucide-react';

interface FoodPreferencesProps {
  onComplete: (preferences: {
    likes: string[];
    dislikes: string[];
    intolerances: string[];
    allergies: string[];
  }) => void;
}

export default function FoodPreferences({ onComplete }: FoodPreferencesProps) {
  const [activeTab, setActiveTab] = useState<'likes' | 'dislikes' | 'intolerances' | 'allergies'>('likes');
  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [intolerances, setIntolerances] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');

  const commonFoods = {
    likes: [
      'Pollo', 'Pavo', 'Pescado', 'Huevos', 'Carne roja',
      'Arroz', 'Pasta', 'Pan', 'Avena', 'Quinoa',
      'Brócoli', 'Espinacas', 'Aguacate', 'Tomate', 'Lechuga',
      'Plátano', 'Manzana', 'Fresas', 'Yogurt', 'Queso'
    ],
    dislikes: [
      'Pescado', 'Mariscos', 'Hígado', 'Champiñones',
      'Espinacas', 'Brócoli', 'Coliflor', 'Berenjena',
      'Queso', 'Yogurt', 'Huevos', 'Aguacate'
    ],
    intolerances: [
      'Lactosa', 'Gluten', 'Fructosa', 'Histamina',
      'Sorbitol', 'Cafeína'
    ],
    allergies: [
      'Frutos secos', 'Cacahuetes', 'Mariscos', 'Pescado',
      'Huevos', 'Leche', 'Soja', 'Trigo', 'Sésamo'
    ]
  };

  const getCurrentList = () => {
    switch (activeTab) {
      case 'likes': return likes;
      case 'dislikes': return dislikes;
      case 'intolerances': return intolerances;
      case 'allergies': return allergies;
    }
  };

  const setCurrentList = (items: string[]) => {
    switch (activeTab) {
      case 'likes': setLikes(items); break;
      case 'dislikes': setDislikes(items); break;
      case 'intolerances': setIntolerances(items); break;
      case 'allergies': setAllergies(items); break;
    }
  };

  const toggleItem = (item: string) => {
    const currentList = getCurrentList();
    if (currentList.includes(item)) {
      setCurrentList(currentList.filter(i => i !== item));
    } else {
      setCurrentList([...currentList, item]);
    }
  };

  const addCustomItem = () => {
    if (customInput.trim()) {
      const currentList = getCurrentList();
      if (!currentList.includes(customInput.trim())) {
        setCurrentList([...currentList, customInput.trim()]);
      }
      setCustomInput('');
    }
  };

  const handleContinue = () => {
    onComplete({
      likes,
      dislikes,
      intolerances,
      allergies
    });
  };

  const tabs = [
    { key: 'likes' as const, label: 'Me gusta', icon: Heart, color: 'emerald' },
    { key: 'dislikes' as const, label: 'No me gusta', icon: X, color: 'red' },
    { key: 'intolerances' as const, label: 'Intolerancias', icon: AlertTriangle, color: 'amber' },
    { key: 'allergies' as const, label: 'Alergias', icon: Ban, color: 'orange' }
  ];

  const currentTab = tabs.find(t => t.key === activeTab)!;

  // Función helper para obtener las clases de color según el tab activo
  const getColorClasses = (isActive: boolean) => {
    switch (activeTab) {
      case 'likes':
        return {
          border: isActive ? 'border-emerald-500' : 'border-neutral-200',
          bg: isActive ? 'bg-emerald-50' : 'bg-white',
          iconColor: isActive ? 'text-emerald-600' : 'text-neutral-400',
          textColor: isActive ? 'text-emerald-700' : 'text-neutral-600',
          buttonBg: isActive ? 'bg-emerald-500' : 'bg-white',
          buttonText: isActive ? 'text-white' : 'text-neutral-700',
          buttonBorder: isActive ? 'border-emerald-600' : 'border-neutral-200',
          tagBg: 'bg-emerald-100',
          tagText: 'text-emerald-700',
          tagBorder: 'border-emerald-300',
          buttonHoverBg: 'bg-emerald-600',
          infoBg: 'bg-emerald-50',
          infoBorder: 'border-emerald-200',
          infoText: 'text-emerald-800'
        };
      case 'dislikes':
        return {
          border: isActive ? 'border-red-500' : 'border-neutral-200',
          bg: isActive ? 'bg-red-50' : 'bg-white',
          iconColor: isActive ? 'text-red-600' : 'text-neutral-400',
          textColor: isActive ? 'text-red-700' : 'text-neutral-600',
          buttonBg: isActive ? 'bg-red-500' : 'bg-white',
          buttonText: isActive ? 'text-white' : 'text-neutral-700',
          buttonBorder: isActive ? 'border-red-600' : 'border-neutral-200',
          tagBg: 'bg-red-100',
          tagText: 'text-red-700',
          tagBorder: 'border-red-300',
          buttonHoverBg: 'bg-red-600',
          infoBg: 'bg-red-50',
          infoBorder: 'border-red-200',
          infoText: 'text-red-800'
        };
      case 'intolerances':
        return {
          border: isActive ? 'border-amber-500' : 'border-neutral-200',
          bg: isActive ? 'bg-amber-50' : 'bg-white',
          iconColor: isActive ? 'text-amber-600' : 'text-neutral-400',
          textColor: isActive ? 'text-amber-700' : 'text-neutral-600',
          buttonBg: isActive ? 'bg-amber-500' : 'bg-white',
          buttonText: isActive ? 'text-white' : 'text-neutral-700',
          buttonBorder: isActive ? 'border-amber-600' : 'border-neutral-200',
          tagBg: 'bg-amber-100',
          tagText: 'text-amber-700',
          tagBorder: 'border-amber-300',
          buttonHoverBg: 'bg-amber-600',
          infoBg: 'bg-amber-50',
          infoBorder: 'border-amber-200',
          infoText: 'text-amber-800'
        };
      case 'allergies':
        return {
          border: isActive ? 'border-orange-500' : 'border-neutral-200',
          bg: isActive ? 'bg-orange-50' : 'bg-white',
          iconColor: isActive ? 'text-orange-600' : 'text-neutral-400',
          textColor: isActive ? 'text-orange-700' : 'text-neutral-600',
          buttonBg: isActive ? 'bg-orange-500' : 'bg-white',
          buttonText: isActive ? 'text-white' : 'text-neutral-700',
          buttonBorder: isActive ? 'border-orange-600' : 'border-neutral-200',
          tagBg: 'bg-orange-100',
          tagText: 'text-orange-700',
          tagBorder: 'border-orange-300',
          buttonHoverBg: 'bg-orange-600',
          infoBg: 'bg-orange-50',
          infoBorder: 'border-orange-200',
          infoText: 'text-orange-800'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl text-neutral-800 mb-3">Preferencias Alimenticias</h1>
          <p className="text-neutral-500">
            Ayúdanos a personalizar tus recomendaciones
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const colors = getColorClasses(isActive);
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`p-3 rounded-xl border-2 transition-all ${colors.border} ${colors.bg}`}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1 ${colors.iconColor}`} />
                <p className={`text-xs ${colors.textColor}`}>
                  {tab.label}
                </p>
              </button>
            );
          })}
        </div>

        {/* Info */}
        <div className={`${getColorClasses(true).infoBg} border ${getColorClasses(true).infoBorder} rounded-2xl p-4 mb-6`}>
          <p className={`text-sm ${getColorClasses(true).infoText}`}>
            {activeTab === 'likes' && '💚 Selecciona los alimentos que disfrutas comer'}
            {activeTab === 'dislikes' && '❌ Indica qué alimentos prefieres evitar'}
            {activeTab === 'intolerances' && '⚠️ Marca si tienes dificultades para digerir ciertos alimentos'}
            {activeTab === 'allergies' && '🚫 IMPORTANTE: Indica cualquier alergia alimentaria'}
          </p>
        </div>

        {/* Selected Items */}
        {getCurrentList().length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-neutral-600 mb-2">Seleccionados:</p>
            <div className="flex flex-wrap gap-2">
              {getCurrentList().map((item) => {
                const colors = getColorClasses(true);
                return (
                  <button
                    key={item}
                    onClick={() => toggleItem(item)}
                    className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${colors.tagBg} ${colors.tagText} border ${colors.tagBorder}`}
                  >
                    <span>{item}</span>
                    <X className="w-3 h-3" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Common Options */}
        <div className="mb-6">
          <p className="text-sm text-neutral-600 mb-3">Opciones comunes:</p>
          <div className="flex flex-wrap gap-2">
            {commonFoods[activeTab].map((food) => {
              const isSelected = getCurrentList().includes(food);
              const colors = getColorClasses(isSelected);
              return (
                <button
                  key={food}
                  onClick={() => toggleItem(food)}
                  className={`px-4 py-2 rounded-xl text-sm transition-all border-2 ${colors.buttonBg} ${colors.buttonText} ${colors.buttonBorder} ${!isSelected && 'hover:border-neutral-300'}`}
                >
                  {food}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Input */}
        <div className="mb-6">
          <p className="text-sm text-neutral-600 mb-2">¿No encuentras algo?</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomItem()}
              placeholder="Escribe aquí..."
              className="flex-1 px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <button
              onClick={addCustomItem}
              className={`px-4 py-3 ${getColorClasses(true).buttonBg} text-white rounded-xl hover:${getColorClasses(true).buttonHoverBg} transition-all`}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Skip/Continue Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleContinue}
            className="flex-1 bg-neutral-100 text-neutral-700 py-4 rounded-2xl hover:bg-neutral-200 transition-all"
          >
            Omitir
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <span>Finalizar</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}