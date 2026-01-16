# 🎯 CHECKLIST DE TESTING MANUAL - FUELIER APP

## Para: Joan Pinto Curado
## Fecha: 12 Enero 2026
## URL: https://fuelier-app.vercel.app

---

## ✅ TEST 1: LOGIN Y AUTENTICACIÓN

### Pasos:
1. [ ] Ir a https://fuelier-app.vercel.app
2. [ ] Hacer click en "Iniciar Sesión"
3. [ ] Introducir email: joanpintocurado@gmail.com
4. [ ] Introducir password
5. [ ] ✅ Marcar checkbox "Recordar sesión"
6. [ ] Click en "Entrar"

### ✅ Resultado esperado:
- [ ] Login exitoso sin errores
- [ ] Redirección a Dashboard
- [ ] NO ver error 401 en consola (F12)
- [ ] Ver mensaje de bienvenida

### ❌ Si falla:
- Abrir DevTools (F12) → Console
- Capturar pantalla del error
- Reportar en chat

---

## ✅ TEST 2: AUTO-LOGIN (CRÍTICO)

### Pasos:
1. [ ] Después de hacer login con "Recordar sesión"
2. [ ] Cerrar COMPLETAMENTE el navegador
3. [ ] Abrir navegador de nuevo
4. [ ] Ir a https://fuelier-app.vercel.app

### ✅ Resultado esperado:
- [ ] NO pide login de nuevo
- [ ] Va directo al Dashboard
- [ ] Muestra tus datos personales
- [ ] NO muestra pantalla de login

### ❌ Si falla:
- Reportar: "Auto-login NO funciona, pide credenciales de nuevo"

---

## ✅ TEST 3: CREAR INGREDIENTE PERSONALIZADO

### Pasos:
1. [ ] Estando logueado, ir a "Ingredientes Personalizados"
2. [ ] Click en "Crear Ingrediente"
3. [ ] Rellenar datos:
   - Nombre: "Ingrediente Test 123"
   - Categoría: Proteína
   - Calorías: 100
   - Proteína: 20g
   - Carbos: 5g
   - Grasa: 2g
4. [ ] Click en "Guardar"

### ✅ Resultado esperado:
- [ ] Ingrediente creado exitosamente
- [ ] Aparece en listado de ingredientes
- [ ] NO ver error 401 en consola
- [ ] Mensaje de confirmación

### ❌ Si falla:
- Abrir DevTools (F12) → Console
- Buscar error "401" o "unauthorized"
- Capturar pantalla
- Reportar en chat

---

## ✅ TEST 4: CREAR COMIDA PERSONALIZADA

### Pasos:
1. [ ] Estando logueado, ir a "Crear Comida"
2. [ ] Click en "Nueva Comida Personalizada"
3. [ ] Rellenar datos:
   - Nombre: "Comida Test 123"
   - Tipo: Almuerzo
   - Agregar 2-3 ingredientes
   - Especificar cantidades
4. [ ] Click en "Guardar"

### ✅ Resultado esperado:
- [ ] Comida creada exitosamente
- [ ] Macros calculados automáticamente
- [ ] Aparece en listado de comidas
- [ ] NO ver error 401 en consola
- [ ] Puede verse y editarse después

### ❌ Si falla:
- Abrir DevTools (F12) → Console
- Buscar error "401" o "unauthorized"
- Capturar pantalla de consola
- Capturar pantalla de la UI
- Reportar en chat

---

## ✅ TEST 5: REGISTRAR COMIDA DEL DÍA

### Pasos:
1. [ ] Estando logueado, ir a Dashboard principal
2. [ ] Seleccionar comida para "Desayuno"
3. [ ] Click en "Añadir"
4. [ ] Repetir para Almuerzo y Cena
5. [ ] Verificar contador de macros del día

### ✅ Resultado esperado:
- [ ] Comida se agrega correctamente
- [ ] Macros se actualizan en tiempo real
- [ ] Barra de progreso muestra % del objetivo
- [ ] NO ver error 401 en consola
- [ ] Todo se guarda automáticamente

### ❌ Si falla:
- Abrir DevTools (F12) → Console
- Buscar error "401" o "unauthorized"
- Capturar pantalla
- Reportar en chat

---

## ✅ TEST 6: PERSISTENCIA DE DATOS

### Pasos:
1. [ ] Después de registrar comidas del día
2. [ ] Cerrar navegador
3. [ ] Abrir navegador de nuevo
4. [ ] Ir a https://fuelier-app.vercel.app
5. [ ] Verificar Dashboard

### ✅ Resultado esperado:
- [ ] Auto-login funciona (va directo a Dashboard)
- [ ] Comidas del día siguen ahí
- [ ] Macros del día se mantienen
- [ ] Ingredientes personalizados siguen ahí
- [ ] Comidas personalizadas siguen ahí

### ❌ Si falla:
- Reportar qué datos se perdieron
- Capturar pantalla

---

## ✅ TEST 7: PLATOS GLOBALES CARGAN

### Pasos:
1. [ ] Estando logueado, ir a "Seleccionar Comida"
2. [ ] Verificar que aparecen platos predefinidos
3. [ ] Click en varios platos para ver detalles

### ✅ Resultado esperado:
- [ ] Se ven 21 platos predefinidos
- [ ] Cada plato muestra macros correctos
- [ ] Cada plato muestra ingredientes
- [ ] NO aparece "Cargando..." infinitamente
- [ ] NO ver error 401 en consola

### ❌ Si falla:
- Capturar pantalla de platos vacíos
- Abrir consola y reportar errores

---

## ✅ TEST 8: INGREDIENTES GLOBALES CARGAN

### Pasos:
1. [ ] Estando logueado, ir a "Ingredientes"
2. [ ] Verificar que aparecen ingredientes predefinidos
3. [ ] Buscar algunos ingredientes específicos:
   - Pechuga de Pollo
   - Arroz Integral
   - Brócoli
   - Aguacate

### ✅ Resultado esperado:
- [ ] Se ven 60+ ingredientes predefinidos
- [ ] Cada ingrediente muestra macros correctos
- [ ] Búsqueda funciona correctamente
- [ ] NO aparece "Cargando..." infinitamente
- [ ] NO ver error 401 en consola

### ❌ Si falla:
- Capturar pantalla de ingredientes vacíos
- Abrir consola y reportar errores

---

## 📊 RESUMEN FINAL

Una vez completados TODOS los tests, reportar:

```
✅ TESTS PASADOS: [número]
❌ TESTS FALLIDOS: [número]

Detalles de fallos (si hay):
- Test X: [descripción del problema]
- Test Y: [descripción del problema]
```

---

## 🚨 IMPORTANTE

### Cómo ver la Consola del navegador:
1. **Chrome/Edge**: Presionar F12 o Click Derecho → "Inspeccionar"
2. **Safari**: Desarrollador → Mostrar Consola Web
3. **Firefox**: Presionar F12 o Click Derecho → "Inspeccionar"

### Qué buscar en la Consola:
- ❌ Errores en ROJO
- ⚠️ Warnings en AMARILLO
- 🔍 Buscar específicamente: "401", "unauthorized", "error"

### Cómo capturar pantalla:
- **macOS**: Cmd + Shift + 4
- **Windows**: Win + Shift + S
- **Chrome DevTools**: Click derecho en consola → "Save as..."

---

## ✅ CRITERIOS DE ÉXITO

Para que la app esté lista para BETA TESTERS, TODOS los tests deben pasar:

- [X] Login funciona
- [X] Auto-login funciona
- [X] Crear ingrediente funciona
- [X] Crear comida funciona
- [X] Registrar comida del día funciona
- [X] Datos persisten entre sesiones
- [X] Platos globales cargan
- [X] Ingredientes globales cargan

**Si alguno falla → NO abrir a beta testers hasta corregir**

---

**Tiempo estimado de testing**: 15-20 minutos  
**Prioridad**: 🔴 CRÍTICA  
**Fecha límite**: Hoy mismo

---

## 📞 REPORTAR RESULTADOS

Después de completar los tests, enviar:

1. ✅ Checklist completado (marcar cada item)
2. 📸 Capturas de pantalla si hay errores
3. 📋 Copia de mensajes de error de la consola
4. 💬 Descripción breve de experiencia general

---

**¡Suerte con los tests!** 🚀
