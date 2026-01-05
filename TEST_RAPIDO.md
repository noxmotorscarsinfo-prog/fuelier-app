# ⚡ TEST RÁPIDO - FUELIER (5 MINUTOS)

## 🎯 OBJETIVO
Verificar que todas las funcionalidades críticas funcionan correctamente en 5 minutos.

---

## ⏱️ CRONÓMETRO: EMPEZAR

### **MINUTO 1: Login y Onboarding**

**1.1 - Login (10 segundos)**
- [ ] App carga sin errores
- [ ] Pantalla de login visible
- [ ] Ingresar: `test@fuelier.com` / `Usuario Test`
- [ ] Click "Comenzar mi viaje"

**1.2 - Onboarding Rápido (50 segundos)**
- [ ] Paso 1: Seleccionar sexo (Hombre)
- [ ] Paso 2: Edad (30)
- [ ] Paso 3: Peso (75)
- [ ] Paso 4: Altura (175)
- [ ] Paso 5: Actividad (Moderada)
- [ ] Paso 6: Objetivo (Mantener peso)
- [ ] Paso 7: Macros (usar preset "Balanceado")
- [ ] Paso 8: Preferencias (saltar)
- [ ] Verificar que llegues al Dashboard

---

### **MINUTO 2: Dashboard y Progreso**

**2.1 - Verificar Dashboard (30 segundos)**
- [ ] Widget de perfil muestra: Nombre, Peso, Altura, **IMC**
- [ ] Progreso de macros en 0/0g
- [ ] 6 tipos de comida visibles
- [ ] Resumen semanal visible

**2.2 - Agregar Primera Comida (30 segundos)**
- [ ] Click "DESAYUNO" → "+ Agregar"
- [ ] Buscar "Avena"
- [ ] Click "Ver más" en "Avena con Frutas"
- [ ] Verificar slider de porciones funciona
- [ ] Click "Agregar a Desayuno"
- [ ] Regresas al Dashboard automáticamente

---

### **MINUTO 3: Verificar Funcionalidades Clave**

**3.1 - Progreso Actualizado (15 segundos)**
- [ ] Dashboard muestra plato agregado
- [ ] Barras de progreso se llenaron (verde)
- [ ] Calorías: ~350/2450 kcal
- [ ] Botones ✏️ y 🗑️ visibles en el plato

**3.2 - Botones Optimizados Móvil (15 segundos)**
- [ ] Abrir DevTools (F12)
- [ ] Toggle device toolbar (móvil)
- [ ] Click "COMIDA" → "+ Agregar"
- [ ] **Verificar botones:**
  - Móvil: `❤️ (0)` - Sin emoji duplicado ✓
  - Móvil: `👨‍🍳 (0)` - Sin emoji duplicado ✓
  - Móvil: `🔍 Filtrar` - Con texto ✓

**3.3 - Navegación desde Crear Plato (30 segundos)**
- [ ] Desde MealSelection → Click "Crear Plato"
- [ ] Ingresar nombre: "Test"
- [ ] **Click "Atrás"**
- [ ] **DEBE regresar a MealSelection** (NO Dashboard) ✓

---

### **MINUTO 4: Lógica Inteligente de Macros**

**4.1 - Settings (30 segundos)**
- [ ] Dashboard → Click icono ⚙️
- [ ] Ir a sección "Objetivos y Macros"
- [ ] Calorías actuales: 2450 kcal
- [ ] Macros actuales: 30/40/30%

**4.2 - Test: Cambiar Calorías (30 segundos)**
- [ ] Cambiar calorías de 2450 a 3000
- [ ] **Verificar ajuste automático:**
  - Proteínas: 184g → ~225g (mantiene 30%) ✓
  - Carbos: 245g → ~300g (mantiene 40%) ✓
  - Grasas: 82g → ~100g (mantiene 30%) ✓
- [ ] **Si se ajustan proporcionalmente = ✅ CORRECTO**

---

### **MINUTO 5: Persistencia y Backend**

**5.1 - Test de Persistencia (30 segundos)**
- [ ] Agregar otro plato a "COMIDA"
- [ ] Recargar página (F5)
- [ ] **Verificar que datos persistan:**
  - Usuario sigue logueado ✓
  - Platos siguen en dashboard ✓
  - Progreso sigue actualizado ✓

**5.2 - Backend Health Check (30 segundos)**
- [ ] Abrir nueva pestaña
- [ ] Ir a: `https://fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0/health`
- [ ] **Debe mostrar:** `{"status":"ok"}` ✓
- [ ] Si aparece = Backend funcional ✓

---

## ✅ RESULTADO DEL TEST

### **SI TODOS LOS CHECKS PASARON:**
```
┌─────────────────────────────────┐
│  ✅ TEST EXITOSO                │
│                                 │
│  Fuelier está funcionando       │
│  correctamente y lista para     │
│  producción.                    │
│                                 │
│  🎉 ¡Puedes lanzar la app!      │
└─────────────────────────────────┘
```

**Próximo paso:** Hacer testing completo con [GUIA_VERIFICACION_VISUAL.md]

---

### **SI ALGÚN CHECK FALLÓ:**

#### **❌ Error en Onboarding**
**Síntoma:** No llegas al Dashboard  
**Solución:**
1. Verificar console (F12)
2. Revisar que todos los campos tengan valores válidos
3. Confirmar que `calculateMacrosFromUser()` funciona

#### **❌ Dashboard no muestra IMC**
**Síntoma:** Widget de perfil no muestra IMC  
**Solución:**
1. Verificar que peso y altura estén en user object
2. Revisar componente Dashboard.tsx línea donde se calcula IMC
3. Fórmula: `peso / (altura/100)²`

#### **❌ Botones móviles con doble emoji**
**Síntoma:** Se ven `❤️ ❤️ (0)` en móvil  
**Solución:**
```typescript
// ✅ CORRECTO en MealSelection.tsx:
<span className="sm:hidden">({count})</span>
<span className="hidden sm:inline">Favoritos ({count})</span>

// ❌ INCORRECTO:
<span className="sm:hidden">❤️ ({count})</span> // NO
```

#### **❌ Crear Plato → Atrás va a Dashboard**
**Síntoma:** Botón "Atrás" no regresa a MealSelection  
**Solución:**
```typescript
// En App.tsx handleBack():
if (currentScreen === 'create-meal' && selectedMealType) {
  setCurrentScreen('selection'); // ✓ Correcto
}
```

#### **❌ Macros no se ajustan al cambiar calorías**
**Síntoma:** Cambiar calorías no ajusta macros  
**Solución:**
1. Verificar Settings.tsx
2. Buscar función que maneja cambio de calorías
3. Debe recalcular: `nuevoGramos = (calorías × porcentaje) / kcalPorGramo`

#### **❌ Datos no persisten**
**Síntoma:** Al recargar (F5) se pierden los datos  
**Solución:**
1. Verificar que `api.saveDailyLogs()` se llame
2. Revisar Network tab → Debe haber POST a `/daily-logs`
3. Verificar que user.email exista
4. Confirmar que Supabase backend responde

#### **❌ Backend no responde**
**Síntoma:** Health check retorna error  
**Solución:**
1. Ir a dashboard.supabase.com
2. Proyecto: fzvsbpgqfubbqmqqxmwv
3. Functions → Verificar que `make-server-b0e879f0` esté activo
4. Revisar logs de errores
5. Confirmar variables de entorno

---

## 🔍 **DEBUG RÁPIDO**

### **Console Commands:**

```javascript
// 1. Verificar usuario cargado
console.log('User:', user);
// Debe mostrar objeto con email, name, goals, etc.

// 2. Verificar logs diarios
console.log('Daily Logs:', dailyLogs);
// Debe mostrar array con registros

// 3. Verificar progreso
const currentLog = dailyLogs.find(log => log.date === currentDate);
console.log('Current Log:', currentLog);
// Debe mostrar log del día actual con platos

// 4. Test backend manualmente
fetch('https://fzvsbpgqfubbqmqqxmwv.supabase.co/functions/v1/make-server-b0e879f0/health')
  .then(r => r.json())
  .then(console.log);
// Debe retornar: {status: "ok"}

// 5. Verificar cálculo de IMC
const imc = 75 / ((175/100) ** 2);
console.log('IMC:', imc.toFixed(1)); // Debe ser ~24.5
```

---

## 📊 **SCORECARD**

Llena esto después del test:

```
┌────────────────────────────────────────┐
│  FUELIER - TEST RÁPIDO SCORECARD       │
├────────────────────────────────────────┤
│                                        │
│  ✅ Login y Onboarding         [✓/✗]  │
│  ✅ Dashboard y Progreso       [✓/✗]  │
│  ✅ Botones Optimizados        [✓/✗]  │
│  ✅ Navegación Correcta        [✓/✗]  │
│  ✅ Lógica de Macros           [✓/✗]  │
│  ✅ Persistencia de Datos      [✓/✗]  │
│  ✅ Backend Funcional          [✓/✗]  │
│                                        │
├────────────────────────────────────────┤
│  TOTAL:                        ___ /7  │
│                                        │
│  Mínimo para producción:       6/7     │
│  Ideal:                        7/7     │
└────────────────────────────────────────┘
```

**Resultado:**
- **7/7:** 🚀 LANZAR INMEDIATAMENTE
- **6/7:** ✅ Lanzar (corregir el detalle después)
- **5/7 o menos:** ⚠️ Revisar problemas antes de lanzar

---

## 🎯 **DESPUÉS DEL TEST**

### **Si todo pasó (7/7):**
1. ✅ Ejecutar [GUIA_VERIFICACION_VISUAL.md] para testing completo
2. ✅ Revisar [CHECKLIST_TECNICO_FINAL.md]
3. ✅ Planear beta testing
4. 🚀 LANZAR

### **Si hay 1-2 fallos (5-6/7):**
1. ⚠️ Revisar sección "Si algún check falló"
2. ⚠️ Corregir problemas encontrados
3. ⚠️ Re-ejecutar test rápido
4. ✅ Cuando llegues a 7/7, proceder al testing completo

### **Si hay 3+ fallos (4/7 o menos):**
1. ❌ Revisar documentación completa
2. ❌ Verificar logs en console y Supabase
3. ❌ Comparar con código original en archivos
4. ❌ Contactar soporte si es necesario

---

## ⏰ **TIEMPO TOTAL**

**Tiempo objetivo:** 5 minutos  
**Tu tiempo:** _____ minutos  

Si tardaste más de 7 minutos, es normal en la primera vez. La app es compleja y tiene muchas funcionalidades.

---

## 🎉 **¡ÉXITO!**

Si pasaste todos los tests:

```
     🎉 🎉 🎉 🎉 🎉
    
    FELICIDADES! 
    
    Fuelier está funcionando
    perfectamente!
    
    Tu app está lista para
    cambiar vidas! 💪
    
     🎉 🎉 🎉 🎉 🎉
```

**Próximo paso:** [GUIA_VERIFICACION_VISUAL.md] para testing exhaustivo

---

**¿Necesitas ayuda?**
- 📖 [DESPLIEGUE_COMPLETO.md] - Información completa
- 👁️ [GUIA_VERIFICACION_VISUAL.md] - Tests detallados
- 🔧 [CHECKLIST_TECNICO_FINAL.md] - Debug técnico
- 📋 [RESUMEN_DESPLIEGUE.md] - Resumen general

**¡Buena suerte! 🍀💚**
