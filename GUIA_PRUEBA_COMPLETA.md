# 🧪 GUÍA DE PRUEBA - MIGRACIÓN 100% SUPABASE

## 🎯 Objetivo
Verificar que **TODO** funciona correctamente con Supabase y que **NO HAY** localStorage.

---

## ✅ PRUEBA 1: Comidas Personalizadas

### Pasos:
1. **Login** en la app
2. Ir a **"Mis Comidas Personalizadas"**
3. Crear una comida nueva:
   - Nombre: "Test Supabase"
   - Agregar 2-3 ingredientes
   - Guardar
4. **Cerrar sesión**
5. **Login** de nuevo
6. Ir a **"Mis Comidas Personalizadas"**

### ✅ Resultado esperado:
- La comida "Test Supabase" debe aparecer
- Todos los ingredientes deben estar guardados

### ❌ Si falla:
- Verificar console del navegador (F12)
- Buscar errores relacionados con `saveCustomMeals`

---

## ✅ PRUEBA 2: Sincronización Multi-Dispositivo

### Pasos:
1. **Chrome Desktop:**
   - Login con usuario@test.com
   - Crear ejercicio personalizado "Test Chrome"
   - Cerrar sesión

2. **Firefox Desktop:**
   - Login con usuario@test.com
   - Ir a Training → Onboarding
   - Buscar ejercicio "Test Chrome"

### ✅ Resultado esperado:
- El ejercicio "Test Chrome" debe aparecer en Firefox
- Esto confirma sincronización multi-dispositivo

### ❌ Si falla:
- Verificar que ambos navegadores usan el mismo email
- Revisar console para errores de API

---

## ✅ PRUEBA 3: Auto-Guardado de Progreso

### Pasos:
1. **Iniciar un entrenamiento:**
   - Seleccionar un día del plan
   - Registrar **1 serie** de un ejercicio (ej: 10 reps, 80kg)
   - **Esperar 10 segundos** (auto-guardado cada 5s)

2. **Sin completar el entrenamiento:**
   - Volver al dashboard (← Back)
   - Recargar página (F5)

3. **Volver a entrar al entrenamiento:**
   - Seleccionar el mismo día

### ✅ Resultado esperado:
- La serie registrada debe aparecer automáticamente
- Console debe mostrar: "✅ Progreso de entrenamiento restaurado desde Supabase"

### ❌ Si falla:
- Verificar que esperaste 10 segundos antes de salir
- Revisar console para errores en `saveTrainingProgress`

---

## ✅ PRUEBA 4: Completar Entrenamiento

### Pasos:
1. **Iniciar un entrenamiento**
2. **Completar todas las series** de todos los ejercicios
3. Presionar **"Marcar como completado"**
4. Esperar modal de confirmación
5. **Volver a entrar al mismo día**

### ✅ Resultado esperado:
- El progreso guardado debe haberse **eliminado**
- Al entrar de nuevo, debe empezar desde cero (no debe cargar progreso anterior)
- Console debe mostrar: "✅ Progreso guardado eliminado de Supabase tras completar entrenamiento"

### ❌ Si falla:
- Verificar que todas las series tenían valores > 0
- Revisar console para errores en `deleteTrainingProgress`

---

## ✅ PRUEBA 5: Persistencia tras Limpiar Caché

### Pasos:
1. **Registrar datos:**
   - Agregar comida del día (desayuno)
   - Crear comida personalizada
   - Completar un entrenamiento

2. **Abrir DevTools (F12):**
   - Ir a pestaña "Application"
   - En el menú lateral, buscar "Storage"
   - Click en **"Clear site data"**
   - Confirmar

3. **Recargar página (F5)**
4. **Login** con el mismo usuario

### ✅ Resultado esperado:
- **Comida del desayuno**: debe aparecer en el dashboard
- **Comida personalizada**: debe estar en "Mis Comidas Personalizadas"
- **Entrenamiento completado**: debe aparecer en el historial

### ❌ Si falla:
- Significa que hay localStorage todavía
- Buscar en código: `localStorage.setItem`

---

## ✅ PRUEBA 6: Verificación de localStorage

### Pasos:
1. **Abrir DevTools (F12)**
2. Ir a pestaña **"Console"**
3. Ejecutar:
   ```javascript
   Object.keys(localStorage).filter(key => !key.includes('auth'))
   ```

### ✅ Resultado esperado:
```javascript
[]  // Array vacío (solo auth tokens permitidos)
```

### ❌ Si falla:
Si ves claves como:
- `customMeals`
- `dietUser`
- `dietLogs`
- `training-progress`

→ Significa que hay localStorage todavía → Reportar

---

## 🔍 PRUEBA AVANZADA: Inspeccionar Network

### Pasos:
1. **Abrir DevTools (F12)**
2. Ir a pestaña **"Network"**
3. Filtrar por: `make-server-b0e879f0`
4. **Realizar acciones en la app** (crear comida, guardar progreso, etc.)

### ✅ Resultado esperado:
Debes ver requests a:
- `POST /custom-meals`
- `GET /custom-meals/:email`
- `POST /training-progress`
- `GET /training-progress/:email/:date`
- `DELETE /training-progress/:email/:date`

### ❌ Si falla:
- Si NO ves requests → Problema en el frontend
- Si ves errores 500 → Problema en el backend

---

## 📊 CHECKLIST RÁPIDO

Marca cada prueba al completarla:

- [ ] ✅ PRUEBA 1: Comidas personalizadas
- [ ] ✅ PRUEBA 2: Sincronización multi-dispositivo
- [ ] ✅ PRUEBA 3: Auto-guardado de progreso
- [ ] ✅ PRUEBA 4: Completar entrenamiento
- [ ] ✅ PRUEBA 5: Persistencia tras limpiar caché
- [ ] ✅ PRUEBA 6: Verificación de localStorage
- [ ] ✅ PRUEBA AVANZADA: Network requests

---

## 🐛 ¿Encontraste un error?

### 1. Verificar Console del Navegador
```javascript
// Buscar mensajes de error en rojo
// Especialmente relacionados con:
// - api.saveCustomMeals
// - api.getTrainingProgress
// - api.deleteTrainingProgress
```

### 2. Verificar Network Tab
```
→ Status 500 = Error en backend
→ Status 400 = Datos inválidos
→ Status 200 = Todo OK ✅
```

### 3. Reportar con Detalles
```
- ¿Qué prueba falló?
- ¿Qué error apareció en console?
- ¿Qué status code en network?
- Screenshot si es posible
```

---

## ✅ TODO PASÓ LAS PRUEBAS

Si **TODAS las pruebas pasan**, entonces:

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        🎉 MIGRACIÓN VERIFICADA AL 100% 🎉                    ║
║                                                              ║
║     La app es 100% Supabase y está lista para producción    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 📈 PRÓXIMOS PASOS

1. **Deploy a producción** (Vercel)
2. **Testing con usuarios reales**
3. **Monitoreo de errores** (Supabase logs)
4. **Optimizaciones** si es necesario

---

**Tiempo estimado de pruebas:** 15-20 minutos  
**Última actualización:** 9 de Enero de 2026  
**Documentación adicional:** Ver `/ESTADO_FINAL.md`
