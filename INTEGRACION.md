# Guía de Integración con Google Sheets / Airtable

Esta aplicación está preparada para integrarse fácilmente con servicios externos como Google Sheets o Airtable utilizando Make (Integromat) o Zapier.

## Estructura de Datos

La aplicación maneja los siguientes datos que pueden exportarse:

### Usuario (User)
```json
{
  "email": "usuario@email.com",
  "name": "Nombre Usuario",
  "goals": {
    "calories": 2000,
    "protein": 150,
    "carbs": 200,
    "fat": 65
  },
  "createdAt": "2025-12-27T10:00:00.000Z"
}
```

### Registro Diario (DailyLog)
```json
{
  "date": "2025-12-27",
  "breakfast": {
    "id": "b1",
    "name": "2 Huevos + Cherry",
    "calories": 220,
    "protein": 16,
    "carbs": 8,
    "fat": 14
  },
  "lunch": { ... },
  "snack": { ... },
  "dinner": { ... }
}
```

## Integración con Make (Integromat)

### Opción 1: Webhook Manual
1. Crea un nuevo Scenario en Make
2. Añade un módulo "Webhooks > Custom Webhook"
3. Copia la URL del webhook
4. En la app, puedes añadir un botón "Exportar a Google Sheets" que envíe los datos vía fetch:

```javascript
const exportToMake = async (dailyLog) => {
  const webhookUrl = "TU_WEBHOOK_URL_DE_MAKE";
  
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dailyLog)
  });
};
```

5. En Make, conecta el webhook a Google Sheets o Airtable:
   - Webhooks → Google Sheets: Add a Row
   - Mapea los campos: fecha, calorías totales, proteínas, carbohidratos, grasas

### Opción 2: API de Make (Avanzado)
- Usa Make API para crear registros automáticamente
- Configura triggers por tiempo (ej: exportar cada noche a las 23:59)

## Integración con Zapier

### Configuración Básica
1. Crea un nuevo Zap
2. Trigger: Webhooks by Zapier > Catch Hook
3. Action: Google Sheets > Create Spreadsheet Row

### Estructura de la Hoja de Cálculo Sugerida

| Fecha | Usuario | Calorías | Proteínas | Carbohidratos | Grasas | Objetivo Cal | Objetivo Prot | Desayuno | Comida | Merienda | Cena |
|-------|---------|----------|-----------|---------------|---------|--------------|---------------|----------|---------|----------|------|
| 2025-12-27 | user@email.com | 1850 | 145 | 180 | 62 | 2000 | 150 | 2 Huevos + Cherry | Pollo + Arroz | Yogurt | Salmón |

## Código de Ejemplo para Exportación

```javascript
// Función para preparar datos de exportación
export const prepareExportData = (user, dailyLog) => {
  const calculateTotals = (log) => {
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

  const totals = calculateTotals(dailyLog);

  return {
    // Información básica
    fecha: dailyLog.date,
    usuario: user.email,
    
    // Totales del día
    calorias_totales: totals.calories,
    proteinas_totales: totals.protein,
    carbohidratos_totales: totals.carbs,
    grasas_totales: totals.fat,
    
    // Objetivos
    objetivo_calorias: user.goals.calories,
    objetivo_proteinas: user.goals.protein,
    objetivo_carbohidratos: user.goals.carbs,
    objetivo_grasas: user.goals.fat,
    
    // Porcentajes de cumplimiento
    cumplimiento_calorias: Math.round((totals.calories / user.goals.calories) * 100),
    cumplimiento_proteinas: Math.round((totals.protein / user.goals.protein) * 100),
    
    // Comidas individuales
    desayuno: dailyLog.breakfast?.name || "No registrado",
    desayuno_calorias: dailyLog.breakfast?.calories || 0,
    comida: dailyLog.lunch?.name || "No registrado",
    comida_calorias: dailyLog.lunch?.calories || 0,
    merienda: dailyLog.snack?.name || "No registrado",
    merienda_calorias: dailyLog.snack?.calories || 0,
    cena: dailyLog.dinner?.name || "No registrado",
    cena_calorias: dailyLog.dinner?.calories || 0,
  };
};

// Función para enviar a webhook
export const sendToWebhook = async (webhookUrl, data) => {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Error al enviar datos');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error };
  }
};
```

## Uso en la Aplicación

Para implementar la exportación, añade un componente de exportación:

```typescript
import { useState } from 'react';
import { Send } from 'lucide-react';

interface ExportButtonProps {
  user: User;
  dailyLog: DailyLog;
}

export function ExportButton({ user, dailyLog }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const handleExport = async () => {
    setExporting(true);
    
    const data = prepareExportData(user, dailyLog);
    const webhookUrl = "TU_WEBHOOK_URL"; // Configurar
    
    const result = await sendToWebhook(webhookUrl, data);
    
    setExporting(false);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };
  
  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
    >
      <Send className="w-4 h-4" />
      {exporting ? 'Exportando...' : 'Exportar a Google Sheets'}
      {success && <span>✓</span>}
    </button>
  );
}
```

## Configuración de Airtable

### Estructura de Base Sugerida

**Tabla: Registros Diarios**
- Fecha (Date)
- Usuario (Email)
- Calorías (Number)
- Proteínas (Number)
- Carbohidratos (Number)
- Grasas (Number)
- Objetivo Calorías (Number)
- Desayuno (Single line text)
- Comida (Single line text)
- Merienda (Single line text)
- Cena (Single line text)
- % Cumplimiento (Formula: `{Calorías} / {Objetivo Calorías} * 100`)

### API de Airtable
También puedes usar la API de Airtable directamente:

```javascript
const AIRTABLE_API_KEY = "TU_API_KEY";
const AIRTABLE_BASE_ID = "TU_BASE_ID";
const AIRTABLE_TABLE_NAME = "Registros Diarios";

const exportToAirtable = async (data) => {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
  
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      records: [{
        fields: data
      }]
    })
  });
};
```

## Automatizaciones Recomendadas

1. **Exportación Diaria Automática**: Configura un trigger diario a las 23:59
2. **Alertas de Objetivos**: Si no cumples objetivos, envía notificación por email
3. **Reportes Semanales**: Genera un resumen semanal en Google Docs/Sheets
4. **Sincronización con Apps de Fitness**: Integra con MyFitnessPal, Cronometer, etc.

## Seguridad

⚠️ **Importante**: 
- Nunca expongas tus API keys en el código del frontend
- Usa variables de entorno o un backend intermedio
- Considera usar Supabase Edge Functions para manejar las integraciones de forma segura

## Soporte

Para más información sobre integraciones:
- Make: https://www.make.com/en/help/webhooks
- Zapier: https://zapier.com/help/create/code-webhooks
- Airtable API: https://airtable.com/developers/web/api/introduction

