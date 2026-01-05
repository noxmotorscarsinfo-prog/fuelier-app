import { User, DailyLog } from '../types';

/**
 * Prepara los datos del registro diario para exportación
 */
export const prepareExportData = (user: User, dailyLog: DailyLog) => {
  const calculateTotals = (log: DailyLog) => {
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
    nombre_usuario: user.name,
    
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
    
    // Porcentajes de cumplimiento (✅ FIX: Validación para evitar división por cero)
    cumplimiento_calorias: user.goals.calories > 0 ? Math.round((totals.calories / user.goals.calories) * 100) : 0,
    cumplimiento_proteinas: user.goals.protein > 0 ? Math.round((totals.protein / user.goals.protein) * 100) : 0,
    cumplimiento_carbohidratos: user.goals.carbs > 0 ? Math.round((totals.carbs / user.goals.carbs) * 100) : 0,
    cumplimiento_grasas: user.goals.fat > 0 ? Math.round((totals.fat / user.goals.fat) * 100) : 0,
    
    // Comidas individuales - Desayuno
    desayuno: dailyLog.breakfast?.name || 'No registrado',
    desayuno_calorias: dailyLog.breakfast?.calories || 0,
    desayuno_proteinas: dailyLog.breakfast?.protein || 0,
    desayuno_carbohidratos: dailyLog.breakfast?.carbs || 0,
    desayuno_grasas: dailyLog.breakfast?.fat || 0,
    
    // Comida
    comida: dailyLog.lunch?.name || 'No registrado',
    comida_calorias: dailyLog.lunch?.calories || 0,
    comida_proteinas: dailyLog.lunch?.protein || 0,
    comida_carbohidratos: dailyLog.lunch?.carbs || 0,
    comida_grasas: dailyLog.lunch?.fat || 0,
    
    // Merienda
    merienda: dailyLog.snack?.name || 'No registrado',
    merienda_calorias: dailyLog.snack?.calories || 0,
    merienda_proteinas: dailyLog.snack?.protein || 0,
    merienda_carbohidratos: dailyLog.snack?.carbs || 0,
    merienda_grasas: dailyLog.snack?.fat || 0,
    
    // Cena
    cena: dailyLog.dinner?.name || 'No registrado',
    cena_calorias: dailyLog.dinner?.calories || 0,
    cena_proteinas: dailyLog.dinner?.protein || 0,
    cena_carbohidratos: dailyLog.dinner?.carbs || 0,
    cena_grasas: dailyLog.dinner?.fat || 0,
    
    // Metadata
    timestamp: new Date().toISOString(),
  };
};

/**
 * Envía datos a un webhook (Make, Zapier, etc.)
 */
export const sendToWebhook = async (webhookUrl: string, data: any) => {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return { success: true, data: await response.json() };
  } catch (error) {
    console.error('Error sending to webhook:', error);
    return { success: false, error };
  }
};

/**
 * Exporta a Google Sheets vía Make/Zapier
 * 
 * @example
 * const webhookUrl = "https://hooks.make.com/...";
 * await exportToGoogleSheets(webhookUrl, user, dailyLog);
 */
export const exportToGoogleSheets = async (
  webhookUrl: string,
  user: User,
  dailyLog: DailyLog
) => {
  const data = prepareExportData(user, dailyLog);
  return await sendToWebhook(webhookUrl, data);
};

/**
 * Exporta a Airtable usando la API directa
 * 
 * NOTA: No uses esto en producción sin un backend intermedio
 * por seguridad (las API keys no deben estar en el frontend)
 */
export const exportToAirtable = async (
  apiKey: string,
  baseId: string,
  tableName: string,
  user: User,
  dailyLog: DailyLog
) => {
  const data = prepareExportData(user, dailyLog);
  const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [{
          fields: data
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Airtable API error! status: ${response.status}`);
    }
    
    return { success: true, data: await response.json() };
  } catch (error) {
    console.error('Error exporting to Airtable:', error);
    return { success: false, error };
  }
};

/**
 * Descarga los datos como archivo JSON
 */
export const downloadAsJSON = (user: User, dailyLog: DailyLog) => {
  const data = prepareExportData(user, dailyLog);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dieta-${dailyLog.date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Descarga los datos como archivo CSV
 */
export const downloadAsCSV = (user: User, dailyLog: DailyLog) => {
  const data = prepareExportData(user, dailyLog);
  
  // Crear encabezados CSV
  const headers = Object.keys(data).join(',');
  const values = Object.values(data).map(v => 
    typeof v === 'string' && v.includes(',') ? `"${v}"` : v
  ).join(',');
  
  const csv = `${headers}\n${values}`;
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dieta-${dailyLog.date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Exporta múltiples días a CSV (historial completo)
 */
export const exportHistoryToCSV = (user: User, dailyLogs: DailyLog[]) => {
  if (dailyLogs.length === 0) return;
  
  const allData = dailyLogs.map(log => prepareExportData(user, log));
  
  // Crear encabezados CSV
  const headers = Object.keys(allData[0]).join(',');
  const rows = allData.map(data => 
    Object.values(data).map(v => 
      typeof v === 'string' && v.includes(',') ? `"${v}"` : v
    ).join(',')
  );
  
  const csv = `${headers}\n${rows.join('\n')}`;
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dieta-historial-${user.email}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};