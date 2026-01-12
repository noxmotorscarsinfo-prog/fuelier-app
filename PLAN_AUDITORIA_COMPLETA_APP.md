# 📋 PLAN DE AUDITORÍA COMPLETA DE LA APP
**Fecha:** 12 de enero de 2026  
**Versión:** 1.0  
**Metodología:** Modular (Similar a auditoría de Dieta)

---

## 🎯 OBJETIVO GENERAL

Realizar una auditoría exhaustiva de TODOS los módulos de la aplicación, identificar problemas, aplicar fixes, crear tests comprehensivos y documentar todo. Seguir el mismo patrón que se usó exitosamente en la sección de Dieta.

---

## 📊 MÓDULOS IDENTIFICADOS (12 Módulos Principales)

### 🥗 MÓDULO 1: DIET (Dieta) - ✅ COMPLETADO
**Componentes:** 12  
**Estado:** ✅ AUDITADO, FIXES APLICADOS, TESTS PASSING (20/20)  
**Problemas Encontrados:** 4  
**Fixes Implementados:** 4  
**Documentación:** 11 archivos  

**Componentes:**
- Dashboard.tsx
- CalendarView.tsx
- MealSelection.tsx
- ExtraFood.tsx
- SavedDiets.tsx
- CreateMeal.tsx
- ComplementaryMealsWidget.tsx
- ComplementSelector.tsx
- MealDetail.tsx
- DailySummary.tsx
- MealDistributionModal.tsx
- EditCustomMeal.tsx

---

### 💪 MÓDULO 2: TRAINING (Entrenamiento)
**Componentes:** 5  
**Estado:** ❌ NO AUDITADO  
**Complejidad:** ALTA (múltiples flujos)  

**Componentes:**
- TrainingDashboardNew.tsx
- TrainingOnboarding.tsx
- EditFullTrainingPlan.tsx
- DayCompletedModal.tsx
- MacroDistributionTest.tsx

**Áreas a Verificar:**
- [ ] Flujos de creación de planes de entrenamiento
- [ ] Validación de datos en cada etapa
- [ ] Persistencia de datos a BD
- [ ] Cálculos de completitud
- [ ] Recomendaciones de macros
- [ ] Validación de integridad con módulo de Dieta

---

### 🔐 MÓDULO 3: AUTHENTICATION (Autenticación)
**Componentes:** 3  
**Estado:** ❌ NO AUDITADO  
**Complejidad:** CRÍTICA  

**Componentes:**
- Login.tsx
- LoginAuth.tsx
- AdminLogin.tsx

**Áreas a Verificar:**
- [ ] Flujos de login (email/password)
- [ ] Validación de credenciales
- [ ] Manejo de sesiones
- [ ] Recovery de sesión
- [ ] Errores y mensajes
- [ ] Seguridad básica

---

### ⚙️ MÓDULO 4: ADMIN (Panel de Administración)
**Componentes:** 3  
**Estado:** ❌ NO AUDITADO  
**Complejidad:** CRÍTICA  

**Componentes:**
- AdminPanel.tsx
- AdminPanel_NEW.tsx
- AdminLogin.tsx

**Áreas a Verificar:**
- [ ] Acceso y permisos
- [ ] Gestión de usuarios
- [ ] Gestión de ingredientes (base)
- [ ] Gestión de comidas (base)
- [ ] Roles y permisos
- [ ] Auditoría de acciones

---

### 👤 MÓDULO 5: ONBOARDING (Incorporación de Usuario)
**Componentes:** 4  
**Estado:** ❌ NO AUDITADO  
**Complejidad:** ALTA (múltiples flujos)  

**Componentes:**
- Onboarding.tsx
- OnboardingProfile.tsx
- OnboardingGoals.tsx
- TrainingOnboarding.tsx

**Áreas a Verificar:**
- [ ] Flujos de onboarding (dieta + entrenamiento)
- [ ] Validación de datos ingresados
- [ ] Persistencia de configuración inicial
- [ ] Recomendaciones basadas en datos
- [ ] Errores y recuperación
- [ ] Integración con módulos posteriores

---

### 🧪 MÓDULO 6: INGREDIENTS (Ingredientes)
**Componentes:** 3  
**Estado:** ❌ NO AUDITADO  
**Complejidad:** MEDIA  

**Componentes:**
- CreateIngredient.tsx
- IngredientEditor.tsx
- CSVImporter.tsx

**Áreas a Verificar:**
- [ ] Creación de ingredientes personalizados
- [ ] Edición de ingredientes
- [ ] Validación de macros (P/C/G)
- [ ] Importación CSV
- [ ] Persistencia a BD
- [ ] Duplicados y conflictos

---

### 📊 MÓDULO 7: PROGRESS & ANALYTICS (Progreso y Análisis)
**Componentes:** 4  
**Estado:** ❌ NO AUDITADO  
**Complejidad:** MEDIA-ALTA  

**Componentes:**
- ProgressHub.tsx
- History.tsx
- WeeklyProgressWidget.tsx
- MacroCompletionRecommendations.tsx

**Áreas a Verificar:**
- [ ] Cálculo de progreso
- [ ] Análisis de tendencias
- [ ] Visualización de datos históricos
- [ ] Precisión de cálculos
- [ ] Recomendaciones

---

### ⚖️ MÓDULO 8: WEIGHT TRACKING (Seguimiento de Peso)
**Componentes:** 2  
**Estado:** ❌ NO AUDITADO  
**Complejidad:** MEDIA  

**Componentes:**
- WeightTracking.tsx
- WeightTrackingContent.tsx

**Áreas a Verificar:**
- [ ] Registro de peso
- [ ] Validación de datos
- [ ] Persistencia a BD
- [ ] Histórico de cambios
- [ ] Cálculos de tendencias

---

### ⚙️ MÓDULO 9: SETTINGS & PREFERENCES (Configuración)
**Componentes:** 2  
**Estado:** ❌ NO AUDITADO  
**Complejidad:** MEDIA  

**Componentes:**
- Settings.tsx
- PreferencesModal.tsx

**Áreas a Verificar:**
- [ ] Guardado de preferencias
- [ ] Validación de valores
- [ ] Persistencia a BD
- [ ] Sincronización
- [ ] Valores por defecto

---

### 💬 MÓDULO 10: CHATBOT & NOTIFICATIONS (Chatbot y Notificaciones)
**Componentes:** 2  
**Estado:** ❌ NO AUDITADO  
**Complejidad:** MEDIA  

**Componentes:**
- Chatbot.tsx
- AdaptiveNotification.tsx

**Áreas a Verificar:**
- [ ] Flujos de chatbot
- [ ] Almacenamiento de mensajes
- [ ] Notificaciones adaptativas
- [ ] Lógica de disparadores

---

### 🐛 MÓDULO 11: DEBUGGING & UTILITIES (Debug y Utilidades)
**Componentes:** 4  
**Estado:** ❌ NO AUDITADO  
**Complejidad:** BAJA  

**Componentes:**
- BugReportWidget.tsx
- MacroDebugPanel.tsx
- RecalculatingModal.tsx
- MigrationDocumentation.tsx

**Áreas a Verificar:**
- [ ] Widgets de debug
- [ ] Reporte de bugs
- [ ] Documentación técnica

---

### 🎨 MÓDULO 12: UI & LAYOUT (Componentes UI)
**Componentes:** 1+ (en subcarpeta)  
**Estado:** ❌ NO AUDITADO  
**Complejidad:** BAJA  

**Carpeta:** `ui/`  

**Áreas a Verificar:**
- [ ] Componentes reutilizables
- [ ] Consistencia visual
- [ ] Accesibilidad

---

## 📈 MATRIZ DE PRIORIZACIÓN

| Módulo | Criticidad | Complejidad | Riesgo | Dependencias | Prioridad |
|--------|-----------|-----------|--------|--------------|-----------|
| Auth | CRÍTICA | ALTA | ALTO | 0 | 🔴 P0 |
| Admin | CRÍTICA | ALTA | ALTO | Auth | 🔴 P0 |
| Dieta | CRÍTICA | ALTA | MEDIO | Ingredients | ✅ DONE |
| Entrenamiento | CRÍTICA | ALTA | MEDIO | Dieta, Auth | 🔴 P0 |
| Onboarding | ALTA | ALTA | ALTO | Auth, Dieta, Training | 🟠 P1 |
| Ingredientes | ALTA | MEDIA | MEDIO | Auth | 🟠 P1 |
| Progreso | ALTA | MEDIA-ALTA | MEDIO | Dieta, Training, Weight | 🟠 P1 |
| Peso | MEDIA | MEDIA | BAJO | Auth | 🟡 P2 |
| Configuración | MEDIA | MEDIA | BAJO | Auth | 🟡 P2 |
| Chatbot | MEDIA | MEDIA | BAJO | Auth, Data | 🟡 P2 |
| Debug | BAJA | BAJA | BAJO | - | 🟢 P3 |
| UI | BAJA | BAJA | BAJO | - | 🟢 P3 |

---

## 🔄 METODOLOGÍA POR MÓDULO

Para cada módulo seguir este plan:

### FASE 1: ANÁLISIS (30-45 min)
```
1. Identificar todos los componentes
2. Mapear flujos de datos
3. Identificar dependencias
4. Documentar responsabilidades
5. Buscar code smells/anti-patterns
```

### FASE 2: PRUEBA (15-30 min)
```
1. Listar todos los casos de uso
2. Identificar puntos de fallo
3. Buscar validaciones faltantes
4. Verificar persistencia de datos
5. Buscar inconsistencias
```

### FASE 3: IMPLEMENTACIÓN (30-60 min)
```
1. Aplicar fixes para problemas encontrados
2. Crear/mejorar validaciones
3. Asegurar consistencia de datos
4. Mejorar manejo de errores
```

### FASE 4: TESTING (30-45 min)
```
1. Crear E2E tests para flujos principales
2. Crear tests unitarios para funciones críticas
3. Validar persistencia
4. Validar integridad referencial
5. Ejecutar suite completa
```

### FASE 5: DOCUMENTACIÓN (15-30 min)
```
1. Documentar problemas encontrados
2. Documentar fixes aplicados
3. Documentar arquitectura
4. Crear guía para developers
5. Generar changelog
```

---

## 📋 CRONOGRAMA SUGERIDO

**Total Estimado:** 10-15 horas de trabajo

| Módulo | P0/P1/P2 | Duración | Acumulado |
|--------|----------|----------|-----------|
| Auth | P0 | 2h | 2h |
| Admin | P0 | 2h | 4h |
| Dieta | ✅ | - | 4h |
| Training | P0 | 3h | 7h |
| Onboarding | P1 | 2.5h | 9.5h |
| Ingredientes | P1 | 1.5h | 11h |
| Progreso | P1 | 2h | 13h |
| Peso | P2 | 1h | 14h |
| Config | P2 | 1h | 15h |
| Chatbot | P2 | 1h | 16h |
| Debug/UI | P3 | 1.5h | 17.5h |

---

## 🎯 SIGUIENTES PASOS

### Opción 1: Empezar por P0 (Recomendado)
```
1. Auth → Admin → Training → (ya hecho: Dieta)
Esto cubre toda la cadena crítica de usuario
Tiempo: ~7h
Resultado: Aplicación estable en features críticos
```

### Opción 2: Empezar por Módulos Independientes
```
1. Auth (base de todo)
2. Ingredientes (sin dependencias de features)
3. Peso (feature simple)
Luego: Módulos complejos
```

### Opción 3: Orden de Dependencias
```
Empezar desde la base hasta la cima:
Auth → Ingredients → Dieta (✅) → Training → Onboarding → Analytics
```

---

## 💾 ENTREGABLES POR MÓDULO

Para CADA módulo se generarán:

1. **Documento Análisis** - Arquitectura y flujos
2. **Documento Problemas** - Issues encontrados
3. **Documento Fixes** - Cambios implementados  
4. **Tests E2E** - Suite de pruebas
5. **Tests Unitarios** - Funciones críticas
6. **Changelog** - Registro de cambios
7. **Guía Developer** - Quick reference

---

## ✅ CHECKLIST PARA INICIAR

- [ ] ¿Cuál es el primer módulo a auditar?
- [ ] ¿Cuánto tiempo disponible por sesión?
- [ ] ¿Deploy inmediato o esperar a completar todos?
- [ ] ¿Feedback de usuarios antes de auditoría?
- [ ] ¿Roles de testing (QA, dev, users)?

---

## 📞 NOTAS IMPORTANTES

- **Dependencias:** Algunos módulos dependen de otros (Auth → Todo)
- **Testing:** Usar mismo framework que Dieta (Vitest + E2E custom)
- **Documentation:** Aplicar mismo nivel de detalle que Dieta
- **Standards:** Mantener consistencia con fixes de Dieta
- **Git:** Commit por módulo para trazabilidad

---

**Próximo Paso:** ¿Por dónde empezamos? 🚀
