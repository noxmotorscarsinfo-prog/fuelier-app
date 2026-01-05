import { useState } from 'react';
import { Heart, X, AlertTriangle, Ban, Plus, Check } from 'lucide-react';

interface PreferencesModalProps {
  likes: string[];
  dislikes: string[];
  intolerances: string[];
  allergies: string[];
  onSave: (preferences: { likes: string[]; dislikes: string[]; intolerances: string[]; allergies: string[] }) => void;
  onClose: () => void;
}

export default function PreferencesModal({ 
  likes: initialLikes, 
  dislikes: initialDislikes, 
  intolerances: initialIntolerances, 
  allergies: initialAllergies,
  onSave,
  onClose 
}: PreferencesModalProps) {
  const [activeTab, setActiveTab] = useState<'likes' | 'dislikes' | 'intolerances' | 'allergies'>('likes');
  const [likes, setLikes] = useState<string[]>(initialLikes);
  const [dislikes, setDislikes] = useState<string[]>(initialDislikes);
  const [intolerances, setIntolerances] = useState<string[]>(initialIntolerances);
  const [allergies, setAllergies] = useState<string[]>(initialAllergies);
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

  const handleSave = () => {
    onSave({ likes, dislikes, intolerances, allergies });
  };

  const tabs = [
    { key: 'likes' as const, label: 'Me gusta', icon: Heart, color: 'emerald' },
    { key: 'dislikes' as const, label: 'No me gusta', icon: X, color: 'red' },
    { key: 'intolerances' as const, label: 'Intolerancias', icon: AlertTriangle, color: 'amber' },
    { key: 'allergies' as const, label: 'Alergias', icon: Ban, color: 'orange' }
  ];

  const currentTab = tabs.find(t => t.key === activeTab)!;
  const CurrentIcon = currentTab.icon;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`bg-gradient-to-r from-${currentTab.color}-500 to-${currentTab.color}-600 text-white p-6`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl mb-1">Preferencias Alimenticias</h2>
              <p className={`text-${currentTab.color}-100 text-sm`}>
                Ayúdanos a conocer tus gustos y necesidades
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 px-3 py-2 rounded-lg transition-all text-sm ${
                    activeTab === tab.key
                      ? 'bg-white text-neutral-800 font-semibold'
                      : `bg-white/20 text-${tab.color}-100 hover:bg-white/30`
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Custom input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Agregar {currentTab.label.toLowerCase()}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
                placeholder={`Ej: ${activeTab === 'likes' ? 'Salmón' : activeTab === 'dislikes' ? 'Cebolla' : activeTab === 'intolerances' ? 'Lactosa' : 'Nueces'}`}
                className="flex-1 px-4 py-2 rounded-xl border-2 border-neutral-200 focus:border-emerald-500 focus:outline-none"
              />
              <button
                onClick={addCustomItem}
                className={`bg-gradient-to-r from-${currentTab.color}-500 to-${currentTab.color}-600 text-white px-4 py-2 rounded-xl hover:from-${currentTab.color}-600 hover:to-${currentTab.color}-700 transition-all`}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Opciones comunes */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Opciones comunes
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {commonFoods[activeTab].map((item) => {
                const isSelected = getCurrentList().includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleItem(item)}
                    className={`px-4 py-3 rounded-xl text-sm transition-all border-2 text-left ${
                      isSelected
                        ? `border-${currentTab.color}-500 bg-${currentTab.color}-50`
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <Check className={`w-4 h-4 text-${currentTab.color}-600`} />
                      )}
                      <span className={isSelected ? `text-${currentTab.color}-700 font-medium` : 'text-neutral-700'}>
                        {item}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Items personalizados */}
          {getCurrentList().filter(item => !commonFoods[activeTab].includes(item)).length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Personalizados
              </label>
              <div className="flex flex-wrap gap-2">
                {getCurrentList()
                  .filter(item => !commonFoods[activeTab].includes(item))
                  .map((item) => (
                    <button
                      key={item}
                      onClick={() => toggleItem(item)}
                      className={`px-4 py-2 rounded-xl text-sm transition-all border-2 bg-${currentTab.color}-50 border-${currentTab.color}-500 text-${currentTab.color}-700 font-medium flex items-center gap-2 hover:bg-${currentTab.color}-100`}
                    >
                      <span>{item}</span>
                      <X className="w-3 h-3" />
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Contador */}
          <div className={`bg-${currentTab.color}-50 border border-${currentTab.color}-200 rounded-xl p-4 flex items-center gap-3`}>
            <CurrentIcon className={`w-6 h-6 text-${currentTab.color}-600`} />
            <div>
              <p className={`text-sm text-${currentTab.color}-700`}>
                {getCurrentList().length === 0 
                  ? `No has seleccionado ningún ${currentTab.label.toLowerCase()}` 
                  : `${getCurrentList().length} ${currentTab.label.toLowerCase()} seleccionado${getCurrentList().length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 p-4 bg-neutral-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-neutral-200 text-neutral-700 py-3 rounded-xl hover:bg-neutral-300 transition-all font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 bg-gradient-to-r from-${currentTab.color}-500 to-${currentTab.color}-600 text-white py-3 rounded-xl hover:from-${currentTab.color}-600 hover:to-${currentTab.color}-700 transition-all font-medium`}
          >
            Guardar Preferencias
          </button>
        </div>
      </div>
    </div>
  );
}
