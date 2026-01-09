# 🔍 REVISIÓN COMPLETA DE FLUJOS - FUELIER

**Fecha:** 2026-01-09  
**Estado:** EN REVISIÓN

---

## ✅ CHECKLIST DE FLUJOS

### 1️⃣ AUTENTICACIÓN Y ONBOARDING

#### 1.1 Signup (Registro Nuevo)
- [ ] Usuario ingresa email, password, nombre
- [ ] Sistema verifica que email NO exista
- [ ] Si existe → Error claro "Email ya registrado"
- [ ] Si NO existe → Crear en Supabase Auth
- [ ] Iniciar onboarding (7 pasos)
- [ ] Guardar usuario en tabla `users` al final
- [ ] Ir a dashboard

**Pasos del Onboarding:**
1. [ ] Seleccionar sexo (male/female)
2. [ ] Ingresar edad + fecha de nacimiento
3. [ ] Ingresar peso
4. [ ] Ingresar altura
5. [ ] Seleccionar actividad física
6. [ ] Ver resumen + elegir objetivo + ver macros calculados
7. [ ] Configurar distribución de comidas
8. [ ] Configurar preferencias alimenticias

**Verificar:**
- [ ] ¿Los datos se guardan en `tempData`?
- [ ] ¿Al completar, se crea el objeto `User` completo?
- [ ] ¿Se guarda en Supabase antes de ir a dashboard?
- [ ] ¿Los macros se calculan correctamente?

#### 1.2 Login (Usuario Existente)
- [ ] Usuario ingresa email + password
- [ ] Sistema autentica en Supabase Auth
- [ ] Si falla → Error "Credenciales inválidas"
- [ ] Si OK → Obtener token
- [ ] Cargar perfil desde tabla `users`
- [ ] Si perfil existe → Ir a dashboard
- [ ] Si NO existe → Mostrar mensaje + Iniciar onboarding

**Verificar:**
- [ ] ¿Se carga el perfil completo?
- [ ] ¿Se cargan daily_logs?
- [ ] ¿Se cargan saved_diets?
- [ ] ¿Se cargan favorite_meals?

#### 1.3 Admin Login
- [ ] Acceso vía `/#adminfueliercardano`
- [ ] Email: admin@fuelier.com
- [ ] Password: Fuelier2025!
- [ ] Si existe perfil → Cargar
- [ ] Si NO existe → Crear perfil admin
- [ ] Ir a panel admin

**Verificar:**
- [ ] ¿Se detecta la ruta admin correctamente?
- [ ] ¿Se crea perfil admin si no existe?
- [ ] ¿El flag `isAdmin: true` se guarda?

---

### 2️⃣ DASHBOARD Y COMIDAS

#### 2.1 Agregar Comida
- [ ] Usuario hace clic en "Agregar" para breakfast/lunch/snack/dinner
- [ ] Sistema guarda `selectedMealType`
- [ ] Ir a pantalla de selección
- [ ] Ver comidas recomendadas (filtradas y ordenadas)
- [ ] Usuario selecciona una comida
- [ ] Ir a detalle
- [ ] Ver macros + ingredientes
- [ ] Usuario hace clic en "Confirmar"
- [ ] Sistema escala comida a macros exactos del usuario
- [ ] Comida se agrega al día actual
- [ ] Volver a dashboard

**Verificar:**
- [ ] ¿El escalado funciona correctamente?
- [ ] ¿Los macros son exactos según distribución del usuario?
- [ ] ¿La comida aparece en el dashboard?
- [ ] ¿Se guarda en Supabase automáticamente?

#### 2.2 Ver Detalle de Comida Existente
- [ ] Usuario hace clic en comida ya agregada
- [ ] Sistema carga `selectedMeal` + `selectedMealType`
- [ ] Ir a pantalla de detalle
- [ ] Mostrar botones "Editar" y "Eliminar"
- [ ] Si hace clic en "Eliminar" → Borrar comida
- [ ] Si hace clic en "Editar" → Ir a selección

**Verificar:**
- [ ] ¿Los botones aparecen solo para comidas existentes?
- [ ] ¿Eliminar funciona correctamente?
- [ ] ¿Editar lleva a selección?

#### 2.3 Editar Comida
- [ ] Desde detalle → Clic en "Editar"
- [ ] Ir a selección
- [ ] Seleccionar nueva comida
- [ ] Ir a detalle
- [ ] Confirmar
- [ ] Comida se REEMPLAZA (no se duplica)

**Verificar:**
- [ ] ¿La comida antigua se elimina?
- [ ] ¿La nueva comida se agrega?
- [ ] ¿No hay duplicados?

#### 2.4 Crear Comida Personalizada
- [ ] Desde selección → "Crear tu propio plato"
- [ ] Ir a CreateMeal
- [ ] Ingresar nombre, tipo, ingredientes
- [ ] Calcular macros automáticamente
- [ ] Guardar
- [ ] Sistema escala a macros del usuario
- [ ] Comida se agrega al día actual
- [ ] Volver a dashboard

**Verificar:**
- [ ] ¿Se guardan en `user.customMeals`?
- [ ] ¿Se escalan correctamente?
- [ ] ¿Aparecen en selección futura?

#### 2.5 Favoritos
- [ ] Usuario marca comida como favorita (⭐)
- [ ] ID se guarda en `favoriteMealIds`
- [ ] Comidas favoritas aparecen primero en selección
- [ ] Usuario desmarca → Se elimina de favoritos

**Verificar:**
- [ ] ¿Se guarda en Supabase?
- [ ] ¿Persiste entre sesiones?
- [ ] ¿Las favoritas aparecen primero?

---

### 3️⃣ FUNCIONALIDADES DIARIAS

#### 3.1 Comidas Extra
- [ ] Usuario agrega snack/comida fuera de plan
- [ ] Ingresar nombre, calorías, macros
- [ ] Se agrega a `extraFoods` del día
- [ ] Aparece en dashboard
- [ ] Se suma a totales del día

**Verificar:**
- [ ] ¿Se suman correctamente a los macros?
- [ ] ¿Se pueden eliminar?
- [ ] ¿Se guardan en Supabase?

#### 3.2 Comidas Complementarias
- [ ] Usuario ve que le faltan macros
- [ ] Sistema sugiere comidas pequeñas (120-200kcal)
- [ ] Usuario selecciona 1 o más
- [ ] Se agregan a `complementaryMeals`
- [ ] Aparecen en dashboard
- [ ] Se suman a totales

**Verificar:**
- [ ] ¿Las sugerencias son inteligentes?
- [ ] ¿Se pueden eliminar?
- [ ] ¿Se guardan en Supabase?

#### 3.3 Actualizar Peso
- [ ] Usuario ingresa peso del día
- [ ] Peso se guarda en `dailyLog.weight`
- [ ] Sistema recalcula TMB, TDEE
- [ ] Sistema ajusta macros (manteniendo déficit %)
- [ ] Usuario ve nuevos macros

**Verificar:**
- [ ] ¿El peso se guarda en el log del día?
- [ ] ¿También se actualiza `user.weight`?
- [ ] ¿Los macros se recalculan correctamente?

#### 3.4 Guardar Día
- [ ] Usuario completa todas las comidas
- [ ] Hace clic en "Guardar día"
- [ ] `dailyLog.isSaved = true`
- [ ] Mostrar modal de celebración
- [ ] Día se reinicia (queda vacío)
- [ ] Fecha avanza al siguiente día

**Verificar:**
- [ ] ¿El día guardado aparece en historial?
- [ ] ¿El día actual queda vacío?
- [ ] ¿La fecha cambia correctamente?

#### 3.5 Resetear Día
- [ ] Usuario hace clic en "Resetear día"
- [ ] Confirmar con modal
- [ ] Eliminar todas las comidas del día actual
- [ ] Dashboard queda vacío

**Verificar:**
- [ ] ¿Se eliminan todas las comidas?
- [ ] ¿No afecta días anteriores?

#### 3.6 Copiar Día
- [ ] Desde historial → Seleccionar día pasado
- [ ] Clic en "Copiar a hoy"
- [ ] Todas las comidas se copian al día actual
- [ ] Volver a dashboard

**Verificar:**
- [ ] ¿Se copian breakfast, lunch, snack, dinner?
- [ ] ¿Se copian extraFoods?
- [ ] ¿Se copian complementaryMeals?
- [ ] ¿Los macros se reescalan?

---

### 4️⃣ HISTORIAL Y PROGRESO

#### 4.1 Ver Historial
- [ ] Usuario va a "Historial"
- [ ] Ver calendario con días guardados
- [ ] Días con comidas → Marcados
- [ ] Días guardados → Badge "Guardado"
- [ ] Clic en día → Ver detalle

**Verificar:**
- [ ] ¿Se cargan todos los logs?
- [ ] ¿El calendario se renderiza correctamente?
- [ ] ¿Se pueden ver detalles de días pasados?

#### 4.2 Tracking de Peso
- [ ] Gráfica de peso en el tiempo
- [ ] Mostrar tendencia (subiendo/bajando)
- [ ] Calcular promedio semanal
- [ ] Comparar con objetivo

**Verificar:**
- [ ] ¿La gráfica se dibuja correctamente?
- [ ] ¿Los datos son precisos?

---

### 5️⃣ DIETAS GUARDADAS

#### 5.1 Guardar Dieta Actual
- [ ] Usuario completa 4 comidas (breakfast, lunch, snack, dinner)
- [ ] Clic en "Guardar como dieta"
- [ ] Ingresar nombre, descripción, tags
- [ ] Dieta se guarda en `savedDiets`
- [ ] Aparece en lista de dietas guardadas

**Verificar:**
- [ ] ¿Se guardan las 4 comidas?
- [ ] ¿Se calculan totales correctamente?
- [ ] ¿Se guarda en Supabase?

#### 5.2 Aplicar Dieta Guardada
- [ ] Usuario abre "Dietas Guardadas"
- [ ] Selecciona una dieta
- [ ] Clic en "Aplicar"
- [ ] Las 4 comidas se copian al día actual
- [ ] Volver a dashboard

**Verificar:**
- [ ] ¿Se reemplazan las comidas actuales?
- [ ] ¿Los macros se reescalan?

#### 5.3 Eliminar Dieta
- [ ] Clic en "Eliminar"
- [ ] Confirmar
- [ ] Dieta se elimina de `savedDiets`

**Verificar:**
- [ ] ¿Se elimina de Supabase?
- [ ] ¿Desaparece de la lista?

---

### 6️⃣ CONFIGURACIÓN

#### 6.1 Actualizar Perfil
- [ ] Usuario va a Settings
- [ ] Actualiza peso, altura, edad, actividad
- [ ] Sistema recalcula TMB, TDEE, macros
- [ ] Guardar cambios

**Verificar:**
- [ ] ¿Los macros se recalculan automáticamente?
- [ ] ¿Se guarda en Supabase?

#### 6.2 Cambiar Objetivo
- [ ] Usuario cambia de "pérdida" a "ganancia"
- [ ] Sistema recalcula macros según nuevo objetivo
- [ ] Guardar cambios

**Verificar:**
- [ ] ¿El déficit/superávit cambia correctamente?
- [ ] ¿Los macros se ajustan?

#### 6.3 Actualizar Distribución de Comidas
- [ ] Usuario ajusta % de breakfast, lunch, snack, dinner
- [ ] Total debe sumar 100%
- [ ] Guardar cambios
- [ ] Futuras comidas usan nueva distribución

**Verificar:**
- [ ] ¿La validación funciona (total = 100%)?
- [ ] ¿Las comidas futuras se escalan correctamente?

#### 6.4 Preferencias Alimenticias
- [ ] Usuario agrega gustos, disgustos, alergias
- [ ] Sistema filtra comidas en selección
- [ ] Guardar cambios

**Verificar:**
- [ ] ¿Las comidas se filtran correctamente?
- [ ] ¿No aparecen comidas con ingredientes no deseados?

---

### 7️⃣ COMIDAS Y INGREDIENTES PERSONALIZADOS

#### 7.1 Crear Comida Personalizada
- [ ] Desde Settings → "Mis comidas"
- [ ] Clic en "Crear comida"
- [ ] Ingresar nombre, tipo (breakfast/lunch/snack/dinner)
- [ ] Agregar ingredientes
- [ ] Sistema calcula macros automáticamente
- [ ] Guardar
- [ ] Comida aparece en "Mis comidas"

**Verificar:**
- [ ] ¿Se guarda en `user.customMeals`?
- [ ] ¿Los macros se calculan bien?
- [ ] ¿Aparece en selección futura?

#### 7.2 Editar Comida Personalizada
- [ ] Desde "Mis comidas" → Seleccionar comida
- [ ] Editar nombre, ingredientes
- [ ] Guardar cambios
- [ ] Comida se actualiza

**Verificar:**
- [ ] ¿Los cambios se reflejan?
- [ ] ¿Se guarda en Supabase?

#### 7.3 Eliminar Comida Personalizada
- [ ] Clic en "Eliminar"
- [ ] Confirmar
- [ ] Comida se elimina de `user.customMeals`

**Verificar:**
- [ ] ¿Desaparece de "Mis comidas"?
- [ ] ¿Ya no aparece en selección?

#### 7.4 Crear Ingrediente Personalizado
- [ ] Desde Settings → "Crear ingrediente"
- [ ] Ingresar nombre, categoría
- [ ] Ingresar macros por 100g
- [ ] Guardar
- [ ] Ingrediente aparece en selector al crear comidas

**Verificar:**
- [ ] ¿Se guarda en `user.customIngredients`?
- [ ] ¿Aparece al crear comidas?

---

### 8️⃣ ADMIN PANEL

#### 8.1 Gestión de Comidas Globales
- [ ] Admin ve lista de todas las comidas base
- [ ] Puede crear comida global nueva
- [ ] Puede editar comida existente
- [ ] Puede eliminar comida
- [ ] Cambios se guardan en `base_meals` table

**Verificar:**
- [ ] ¿Solo admin puede acceder?
- [ ] ¿Los cambios afectan a todos los usuarios?
- [ ] ¿Se guarda en Supabase?

#### 8.2 Gestión de Ingredientes Globales
- [ ] Admin ve lista de todos los ingredientes base
- [ ] Puede crear ingrediente global nuevo
- [ ] Puede editar ingrediente existente
- [ ] Puede eliminar ingrediente
- [ ] Cambios se guardan en `base_ingredients` table

**Verificar:**
- [ ] ¿Los cambios se reflejan para todos?

#### 8.3 Ver Bug Reports
- [ ] Admin ve todos los reportes
- [ ] Puede filtrar por estado (pending/resolved)
- [ ] Puede agregar notas de admin
- [ ] Puede cambiar estado a "resolved"

**Verificar:**
- [ ] ¿Se cargan desde Supabase?
- [ ] ¿Los cambios se guardan?

---

### 9️⃣ SISTEMA ADAPTATIVO

#### 9.1 Análisis Semanal
- [ ] Cada domingo a las 23:59
- [ ] Sistema analiza últimos 7 días
- [ ] Calcula promedio de calorías consumidas
- [ ] Calcula cambio de peso semanal
- [ ] Compara con objetivo

**Verificar:**
- [ ] ¿El análisis se ejecuta automáticamente?
- [ ] ¿Los cálculos son correctos?

#### 9.2 Ajuste Automático
- [ ] Si peso no cambia según objetivo
- [ ] Sistema ajusta macros (+/- 5-10%)
- [ ] Muestra notificación al usuario
- [ ] Usuario ve nuevos macros

**Verificar:**
- [ ] ¿El ajuste es inteligente?
- [ ] ¿El usuario es notificado?
- [ ] ¿Los nuevos macros se aplican?

#### 9.3 Detección de Metabolismo Adaptado
- [ ] Si déficit alto pero pérdida lenta
- [ ] Sistema detecta adaptación metabólica
- [ ] Sugiere diet break o reverse diet
- [ ] Usuario es notificado

**Verificar:**
- [ ] ¿La detección funciona?
- [ ] ¿Las recomendaciones son apropiadas?

---

### 🔟 ENTRENAMIENTO

#### 10.1 Onboarding de Entrenamiento
- [ ] Usuario completa cuestionario
- [ ] Selecciona split (PPL, Upper/Lower, etc.)
- [ ] Sistema crea plan semanal
- [ ] Plan se guarda en `training_plans`

**Verificar:**
- [ ] ¿El plan se crea correctamente?
- [ ] ¿Se guarda en Supabase?

#### 10.2 Dashboard de Entrenamiento
- [ ] Usuario ve día actual del plan
- [ ] Puede marcar ejercicios como completados
- [ ] Puede ingresar peso/reps realizados
- [ ] Progreso se guarda

**Verificar:**
- [ ] ¿El progreso se guarda en Supabase?
- [ ] ¿Se puede ver historial?

#### 10.3 Editar Plan de Entrenamiento
- [ ] Usuario puede modificar ejercicios
- [ ] Puede cambiar sets/reps
- [ ] Puede reorganizar días
- [ ] Guardar cambios

**Verificar:**
- [ ] ¿Los cambios se reflejan?
- [ ] ¿Se guarda en Supabase?

---

## 🔄 SINCRONIZACIÓN CON SUPABASE

### Datos que se Guardan Automáticamente:
- [ ] `user` → Cada vez que cambia
- [ ] `dailyLogs` → Cada vez que cambia
- [ ] `savedDiets` → Cada vez que cambia
- [ ] `favoriteMealIds` → Cada vez que cambia
- [ ] `bugReports` → Cada vez que cambia

**Verificar:**
- [ ] ¿Los efectos se ejecutan correctamente?
- [ ] ¿No hay loops infinitos?
- [ ] ¿Los datos persisten entre sesiones?

---

## 🚨 CASOS EDGE A VERIFICAR

### Casos de Error:
- [ ] Sin conexión a internet → ¿Mensaje de error?
- [ ] Token expirado → ¿Re-login automático?
- [ ] Usuario elimina cuenta → ¿Limpieza correcta?
- [ ] Datos corruptos en DB → ¿Validación?

### Casos de Concurrencia:
- [ ] Usuario abre 2 pestañas → ¿Sincronización?
- [ ] Usuario usa 2 dispositivos → ¿Datos consistentes?

### Casos de Validación:
- [ ] Email inválido → ¿Rechazado?
- [ ] Password < 6 chars → ¿Rechazado?
- [ ] Macros negativos → ¿Imposible?
- [ ] Distribución no suma 100% → ¿Bloqueado?

---

**Siguiente paso:** Ejecutar esta checklist completa y reportar resultados.
