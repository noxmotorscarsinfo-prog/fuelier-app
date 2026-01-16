# 🧪 GUÍA PARA TESTERS - FUELIER BETA

**Versión:** 1.0  
**Fecha:** 16 de enero de 2026  
**Estado:** ✅ LISTO PARA TESTING BETA

---

## 🌐 ACCESO A LA APLICACIÓN

### URLs de Producción
- **Principal:** https://fuelier-app.vercel.app
- **Alternativa:** https://fuelier-jgz6f8dqz-fuelier-apps-projects.vercel.app

### Credenciales de Prueba
Puedes crear tu propia cuenta o usar estas credenciales de prueba:
- **Email:** joaniphone2002@gmail.com
- **Password:** (tu contraseña de prueba)

---

## ✅ CHECKLIST DE TESTING

### FASE 1: Registro y Login (15 minutos)

#### Test 1.1: Crear Cuenta Nueva
- [ ] Click en "Crear cuenta"
- [ ] Ingresar email válido (nuevo)
- [ ] Ingresar contraseña (mínimo 6 caracteres)
- [ ] Ingresar nombre
- [ ] ✅ **VERIFICAR:** Cuenta se crea exitosamente
- [ ] ✅ **VERIFICAR:** Redirige a onboarding automáticamente

#### Test 1.2: Completar Onboarding
- [ ] Seleccionar sexo (hombre/mujer)
- [ ] Ingresar edad (16-100 años)
- [ ] Ingresar peso actual (kg)
- [ ] Ingresar altura (cm)
- [ ] Seleccionar frecuencia de entrenamiento
- [ ] Seleccionar objetivo (pérdida, mantenimiento, ganancia)
- [ ] Configurar distribución de comidas
- [ ] Seleccionar preferencias alimentarias (opcional)
- [ ] ✅ **VERIFICAR:** Al finalizar, llega al dashboard
- [ ] ✅ **VERIFICAR:** Dashboard muestra objetivos de macros

#### Test 1.3: Login con Cuenta Existente
- [ ] Logout desde Settings
- [ ] Volver a pantalla de login
- [ ] Ingresar email y contraseña
- [ ] Marcar "Recordar sesión" ✅
- [ ] ✅ **VERIFICAR:** Login exitoso
- [ ] ✅ **VERIFICAR:** Llega al dashboard con datos intactos

#### Test 1.4: Auto-Login (Recordar Sesión)
- [ ] Hacer login con "Recordar sesión" marcado
- [ ] Verificar que llega al dashboard
- [ ] **Cerrar completamente el navegador**
- [ ] Abrir navegador de nuevo
- [ ] Ir a la URL de la app
- [ ] ✅ **VERIFICAR:** Automáticamente carga el dashboard SIN pedir login
- [ ] ✅ **VERIFICAR:** Datos del usuario están cargados
- [ ] ✅ **VERIFICAR:** No hay errores en consola (F12 → Console)

**⚠️ SI FALLA:** Reportar con captura de pantalla de consola

---

### FASE 2: Selección y Consumo de Comidas (20 minutos)

#### Test 2.1: Desayuno
- [ ] Desde dashboard, click en "Desayuno"
- [ ] ✅ **VERIFICAR:** Se muestran platos disponibles (>30 opciones)
- [ ] ✅ **VERIFICAR:** NO aparece "No hay platos disponibles"
- [ ] ✅ **VERIFICAR:** Platos tienen macros (calorías, proteína, carbos, grasas)
- [ ] Buscar un plato específico (ej: "avena")
- [ ] ✅ **VERIFICAR:** Búsqueda funciona correctamente
- [ ] Seleccionar un plato
- [ ] ✅ **VERIFICAR:** Muestra detalles del plato (ingredientes, porciones)
- [ ] Agregar al log diario
- [ ] ✅ **VERIFICAR:** Plato aparece en dashboard
- [ ] ✅ **VERIFICAR:** Macros consumidos se actualizan

#### Test 2.2: Comida (Almuerzo)
- [ ] Click en "Comida"
- [ ] ✅ **VERIFICAR:** Platos diferentes a desayuno
- [ ] ✅ **VERIFICAR:** Platos apropiados para almuerzo
- [ ] Filtrar por categoría (ej: Carne)
- [ ] ✅ **VERIFICAR:** Filtro funciona
- [ ] Seleccionar y agregar un plato
- [ ] ✅ **VERIFICAR:** Se suma a los macros del día

#### Test 2.3: Cena
- [ ] Click en "Cena"
- [ ] ✅ **VERIFICAR:** Platos disponibles
- [ ] Marcar un plato como favorito (⭐)
- [ ] ✅ **VERIFICAR:** Aparece en favoritos
- [ ] Agregar plato al log
- [ ] ✅ **VERIFICAR:** Macros actualizados

#### Test 2.4: Snack
- [ ] Click en "Snack"
- [ ] ✅ **VERIFICAR:** Platos tipo snack/merienda
- [ ] Seleccionar y agregar
- [ ] ✅ **VERIFICAR:** Total del día se acerca a objetivo

**⚠️ SI NO CARGAN PLATOS:** 
1. Abrir consola (F12)
2. Buscar errores 401
3. Capturar pantalla y reportar

---

### FASE 3: Mis Platos (Custom Meals) (15 minutos)

#### Test 3.1: Ver Mis Platos
- [ ] Ir a menú → "Mis Platos"
- [ ] ✅ **VERIFICAR:** Muestra lista (puede estar vacía si es nuevo usuario)
- [ ] ✅ **VERIFICAR:** Botón "Crear Plato" visible

#### Test 3.2: Crear Plato Personalizado
- [ ] Click en "Crear Plato"
- [ ] Ingresar nombre del plato (ej: "Mi Batido Proteico")
- [ ] Seleccionar tipo de comida (desayuno/comida/cena/snack)
- [ ] Agregar ingredientes:
  - [ ] Buscar ingrediente (ej: "leche")
  - [ ] Ingresar cantidad en gramos
  - [ ] Agregar más ingredientes
- [ ] ✅ **VERIFICAR:** Macros se calculan automáticamente
- [ ] ✅ **VERIFICAR:** Total de calorías correcto
- [ ] Guardar plato
- [ ] ✅ **VERIFICAR:** Plato aparece en "Mis Platos"

#### Test 3.3: Usar Plato Personalizado
- [ ] Ir a selección de comida (ej: Desayuno)
- [ ] ✅ **VERIFICAR:** Plato personalizado aparece en la lista
- [ ] ✅ **VERIFICAR:** Tiene etiqueta "Mi Plato" o similar
- [ ] Seleccionar plato personalizado
- [ ] Agregar al log diario
- [ ] ✅ **VERIFICAR:** Se registra correctamente

#### Test 3.4: Editar Plato Personalizado
- [ ] Ir a "Mis Platos"
- [ ] Click en editar plato
- [ ] Modificar ingredientes o cantidades
- [ ] Guardar cambios
- [ ] ✅ **VERIFICAR:** Cambios se guardan
- [ ] ✅ **VERIFICAR:** Macros se recalculan

#### Test 3.5: Eliminar Plato Personalizado
- [ ] Ir a "Mis Platos"
- [ ] Click en eliminar plato
- [ ] Confirmar eliminación
- [ ] ✅ **VERIFICAR:** Plato desaparece de la lista

---

### FASE 4: Persistencia de Datos (10 minutos)

#### Test 4.1: Recargar Página
- [ ] Agregar varias comidas al log diario
- [ ] **Recargar la página (F5)**
- [ ] ✅ **VERIFICAR:** Todas las comidas siguen en el log
- [ ] ✅ **VERIFICAR:** Macros consumidos se mantienen
- [ ] ✅ **VERIFICAR:** No se pierde ningún dato

#### Test 4.2: Cerrar y Abrir Navegador
- [ ] Registrar comidas del día
- [ ] **Cerrar completamente el navegador**
- [ ] Abrir navegador de nuevo
- [ ] Ir a la app
- [ ] ✅ **VERIFICAR:** Auto-login funciona
- [ ] ✅ **VERIFICAR:** Datos del día se mantienen
- [ ] ✅ **VERIFICAR:** Historial intacto

#### Test 4.3: Cambiar Configuración
- [ ] Ir a Settings
- [ ] Cambiar objetivo de macros
- [ ] Cambiar distribución de comidas
- [ ] Guardar cambios
- [ ] Recargar página
- [ ] ✅ **VERIFICAR:** Cambios persisten

---

### FASE 5: Dashboard y Resumen (10 minutos)

#### Test 5.1: Visualización de Macros
- [ ] Ver dashboard principal
- [ ] ✅ **VERIFICAR:** Muestra objetivos del día
- [ ] ✅ **VERIFICAR:** Muestra macros consumidos
- [ ] ✅ **VERIFICAR:** Muestra macros restantes
- [ ] ✅ **VERIFICAR:** Barras de progreso se actualizan
- [ ] ✅ **VERIFICAR:** Colores indican si estás cerca/lejos del objetivo

#### Test 5.2: Resumen del Día
- [ ] Click en "Ver Resumen"
- [ ] ✅ **VERIFICAR:** Lista todas las comidas del día
- [ ] ✅ **VERIFICAR:** Muestra total de calorías
- [ ] ✅ **VERIFICAR:** Muestra desglose de macros
- [ ] ✅ **VERIFICAR:** Permite eliminar comidas

#### Test 5.3: Historial
- [ ] Ir a calendario/historial
- [ ] ✅ **VERIFICAR:** Muestra días anteriores
- [ ] ✅ **VERIFICAR:** Permite ver logs de días pasados
- [ ] Seleccionar día anterior
- [ ] ✅ **VERIFICAR:** Muestra comidas de ese día

---

### FASE 6: Funcionalidades Adicionales (10 minutos)

#### Test 6.1: Favoritos
- [ ] Marcar varios platos como favoritos
- [ ] Ir a selección de comida
- [ ] Activar filtro "Solo favoritos"
- [ ] ✅ **VERIFICAR:** Solo muestra platos favoritos

#### Test 6.2: Búsqueda y Filtros
- [ ] Buscar plato por nombre
- [ ] ✅ **VERIFICAR:** Resultados relevantes
- [ ] Filtrar por categoría
- [ ] ✅ **VERIFICAR:** Solo muestra platos de esa categoría
- [ ] Combinar búsqueda + filtro
- [ ] ✅ **VERIFICAR:** Funciona correctamente

#### Test 6.3: Preferencias Alimentarias
- [ ] Ir a Settings → Preferencias
- [ ] Agregar alérgenos (ej: "lácteos")
- [ ] Agregar disgustos (ej: "pescado")
- [ ] Guardar
- [ ] Ir a selección de comidas
- [ ] ✅ **VERIFICAR:** Platos con alérgenos están marcados o filtrados

---

## 🐛 CÓMO REPORTAR BUGS

### Información Necesaria

#### 1. Descripción del Bug
```
Ejemplo:
"Al intentar crear un plato personalizado, el botón 'Guardar' no responde"
```

#### 2. Pasos para Reproducir
```
Ejemplo:
1. Ir a "Mis Platos"
2. Click en "Crear Plato"
3. Agregar nombre: "Test"
4. Agregar 1 ingrediente
5. Click en "Guardar"
6. → No pasa nada
```

#### 3. Comportamiento Esperado
```
Ejemplo:
"El plato debería guardarse y aparecer en la lista de Mis Platos"
```

#### 4. Comportamiento Actual
```
Ejemplo:
"El botón no hace nada, no hay feedback visual"
```

#### 5. Consola del Navegador
**MUY IMPORTANTE:**
1. Abrir DevTools (F12)
2. Ir a pestaña "Console"
3. Capturar pantalla de los errores (si los hay)
4. Incluir en el reporte

#### 6. Información del Sistema
- Navegador: (Chrome, Firefox, Safari, etc.)
- Versión del navegador
- Sistema operativo: (Windows, Mac, Linux, iOS, Android)
- Dispositivo: (PC, móvil, tablet)

### Template de Reporte

```markdown
## Bug: [Título breve]

**Severidad:** [Crítico / Alto / Medio / Bajo]

**Descripción:**
[Descripción detallada]

**Pasos para reproducir:**
1. 
2. 
3. 

**Esperado:**
[Qué debería pasar]

**Actual:**
[Qué pasa realmente]

**Consola:**
[Captura de errores o escribir "Sin errores"]

**Sistema:**
- Navegador: 
- SO: 
- Dispositivo: 

**Capturas de pantalla:**
[Adjuntar si es posible]
```

---

## 🎯 CASOS DE USO PRINCIPALES

### Caso de Uso 1: Primer Día Completo

**Objetivo:** Registrar todas las comidas de un día

**Flujo:**
1. Crear cuenta y completar onboarding (5 min)
2. Seleccionar desayuno y agregarlo (2 min)
3. Seleccionar almuerzo y agregarlo (2 min)
4. Seleccionar snack y agregarlo (1 min)
5. Seleccionar cena y agregarlo (2 min)
6. Revisar resumen del día (1 min)

**Resultado esperado:**
- Todas las comidas registradas
- Macros cercanos al objetivo (±10%)
- Dashboard actualizado correctamente

---

### Caso de Uso 2: Crear y Usar Plato Personalizado

**Objetivo:** Crear un plato favorito y usarlo regularmente

**Flujo:**
1. Ir a "Mis Platos"
2. Crear plato personalizado (ej: "Mi Batido Post-Entreno")
3. Agregar ingredientes: proteína, plátano, leche, avena
4. Guardar plato
5. Usar el plato en la comida correspondiente

**Resultado esperado:**
- Plato guardado correctamente
- Macros calculados automáticamente
- Plato aparece en selección de comidas

---

### Caso de Uso 3: Seguimiento Semanal

**Objetivo:** Usar la app durante 7 días consecutivos

**Flujo:**
1. Día 1-7: Registrar todas las comidas diarias
2. Verificar que datos persisten cada día
3. Revisar historial al final de la semana
4. Verificar tendencias y progreso

**Resultado esperado:**
- 7 días completos registrados
- Historial accesible
- Datos consistentes
- App funciona fluidamente

---

## ⚠️ PROBLEMAS CONOCIDOS

### No es un bug:

❌ **"Los macros no están exactamente en el objetivo"**
- ✅ **Correcto:** El sistema recomienda platos cercanos, no exactos

❌ **"No encuentro mi comida favorita"**
- ✅ **Solución:** Usa "Mis Platos" para crear platos personalizados

❌ **"Los platos cambian cada día"**
- ✅ **Correcto:** El algoritmo recomienda variedad
- ✅ **Solución:** Marca favoritos para encontrarlos fácilmente

---

## 📊 MÉTRICAS QUE MEDIREMOS

Durante el testing beta, estaremos monitoreando:

- **Tasa de registro exitoso:** >95%
- **Tasa de completar onboarding:** >90%
- **Tasa de login exitoso:** 100%
- **Tasa de carga de platos:** 100%
- **Bugs críticos reportados:** Objetivo 0
- **Satisfacción de UX:** >4/5 estrellas

---

## 🎓 TIPS PARA TESTERS

### Cómo Ser un Buen Tester

✅ **HAZ:**
- Reporta TODO lo que no funcione como esperabas
- Incluye capturas de pantalla
- Sigue los pasos de reproducción
- Prueba en diferentes dispositivos si puedes
- Sé específico en las descripciones

❌ **NO HAGAS:**
- Reportar bugs sin detalles
- Omitir la consola del navegador
- Reportar "no funciona" sin explicar qué intentaste
- Asumir que "ya lo saben"

### Priorización de Bugs

🔴 **CRÍTICO** - Reportar inmediatamente:
- App no carga
- No se puede hacer login
- Platos no cargan
- Datos se pierden

🟡 **ALTO** - Reportar dentro de 24h:
- Funcionalidad no funciona
- Errores al guardar datos
- Auto-login falla

🟢 **MEDIO/BAJO** - Reportar cuando puedas:
- Bugs visuales
- Textos incorrectos
- Sugerencias de mejora

---

## 📞 CONTACTO

**Para reportar bugs:**
- Email: [tu-email@ejemplo.com]
- Discord: [Canal de testing]
- WhatsApp: [Grupo de testers]

**Disponibilidad de soporte:**
- Lunes a Viernes: 9:00 - 18:00
- Fines de semana: 10:00 - 14:00

---

## 🙏 AGRADECIMIENTO

Gracias por ayudarnos a mejorar FUELIER. Tu feedback es invaluable para crear la mejor experiencia de tracking nutricional.

**¡Feliz testing!** 🚀

---

**Creado por:** Equipo FUELIER  
**Última actualización:** 16 de enero de 2026, 18:00 CET  
**Versión del documento:** 1.0
