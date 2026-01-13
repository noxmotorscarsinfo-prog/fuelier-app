# 🔍 CÓMO DIAGNOSTICAR EL SISTEMA DE ESCALADO

## 📋 Pasos para Verificar que Funciona

### 1. **Abrir la Consola del Navegador**

1. Abre la app en Chrome/Firefox/Safari
2. Presiona **F12** (o Cmd+Option+I en Mac)
3. Ve a la pestaña **"Console"**
4. **IMPORTANTE:** Limpia la consola (icono 🚫 o Cmd+K)

### 2. **Ir al Dashboard y Seleccionar una Comida**

1. Ve al Dashboard
2. Click en **"Añadir Desayuno"** (o cualquier comida)
3. La consola mostrará:

```
🎯 AutoTarget Calculator: {...}
┌────────────────────────────────────────────┐
│  🎯 CÁLCULO DE TARGET AUTOMÁTICO           │
├────────────────────────────────────────────┤
│  Comida: BREAKFAST                         │
│  Comidas restantes: 4                      │
├────────────────────────────────────────────┤
│  OBJETIVOS TOTALES DEL DÍA:                │
│  • Calorías:    2000 kcal                  │
│  • Proteína:    150g                       │
│  • Carbos:      200g                       │
│  • Grasas:      67g                        │
├────────────────────────────────────────────┤
│  YA CONSUMIDO (comidas anteriores):        │
│  • Calorías:    0 kcal                     │
│  • Proteína:    0g                         │
│  • Carbos:      0g                         │
│  • Grasas:      0g                         │
├────────────────────────────────────────────┤
│  RESTANTE:                                 │
│  • Calorías:    2000 kcal                  │
│  • Proteína:    150g                       │
│  • Carbos:      200g                       │
│  • Grasas:      67g                        │
└────────────────────────────────────────────┘
```

**Esto te dice:**
- ✅ Tu objetivo total del día
- ✅ Cuánto has comido ya
- ✅ Cuánto te falta
- ✅ Cuántas comidas quedan

### 3. **Seleccionar un Plato**

Cuando hagas click en un plato, verás:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 ESCALANDO: "Arroz con Pollo"
   Última comida: ❌ NO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Target: {calories: 500, protein: 38, carbs: 50, fat: 17}
📊 Macros base del plato: {calories: 597, protein: 36, carbs: 73, fat: 18}
   Tiene ingredientReferences: ✅ SÍ (3 ingredientes)
🎯 Búsqueda binaria para encontrar multiplicador óptimo...
   🔍 Multiplicadores ideales por macro: {
     cal: '0.838',
     prot: '1.056',
     carbs: '0.685',
     fat: '0.944'
   }
   ✅ Mejor multiplicador encontrado: 0.881x (error máx: 8.2%)
   🔢 Ingredientes optimizados (61 iteraciones, error máx: 8.24%):
      pollo-pechuga: 100g → 88g (-12g)
      arroz-blanco: 80g → 70g (-10g)
      brocoli: 150g → 132g (-18g)
```

**Esto te dice:**
- ✅ El target calculado para esta comida (ej: 500 kcal, 38g prot, 50g carbs, 17g fat)
- ✅ Los macros originales del plato
- ✅ Los multiplicadores ideales para cada macro
- ✅ El multiplicador final encontrado
- ✅ Cómo se escalaron los ingredientes

### 4. **Verificar el Resultado Final**

```
┌─────────────────────────────────────────────────────────────┐
│  🍽️ COMIDA - RESULTADO FINAL                               │
├─────────────────────────────────────────────────────────────┤
│  📊 Calorías:  526/500 kcal (105.2%)                        │
│  💪 Proteína:  32/38g (84.2%)                               │
│  🍚 Carbos:    64/50g (128.0%)                              │
│  🥑 Grasas:    16/17g (94.1%)                               │
├─────────────────────────────────────────────────────────────┤
│  ⭐ Completitud mínima:   84.2%                             │
│  📊 Completitud promedio: 102.9%                            │
│  ⚠️ Error máximo:         28.0%                             │
│  🔢 Multiplicador:        0.881x                            │
└─────────────────────────────────────────────────────────────┘
```

**Esto te dice:**
- ✅ Los macros FINALES del plato escalado
- ✅ El porcentaje de completitud de cada macro
- ✅ El macro con menor completitud (el "cuello de botella")
- ✅ El error máximo

---

## ⚠️ ¿QUÉ SIGNIFICA EL "ERROR"?

### Caso Normal: Error <10%

```
│  📊 Calorías:  498/500 kcal (99.6%)   ✅
│  💪 Proteína:  37/38g (97.4%)         ✅
│  🍚 Carbos:    48/50g (96.0%)         ✅
│  🥑 Grasas:    16/17g (94.1%)         ✅
│  ⚠️ Error máximo: 5.9%                ✅ PERFECTO
```

**Interpretación:** El plato está MUY cerca de tu target. Todos los macros al 94-100%.

### Caso con Error Moderado: 10-20%

```
│  📊 Calorías:  510/500 kcal (102.0%)  ✅
│  💪 Proteína:  32/38g (84.2%)         ⚠️
│  🍚 Carbos:    52/50g (104.0%)        ✅
│  🥑 Grasas:    15/17g (88.2%)         ⚠️
│  ⚠️ Error máximo: 15.8%               ⚠️ ACEPTABLE
```

**Interpretación:** La **composición del plato** no permite llegar al 100% en todos los macros. El algoritmo encontró el **mejor equilibrio posible**.

**¿Por qué?** El plato tiene proporciones fijas. Por ejemplo:
- Arroz con Pollo tiene MUCHO carbohidrato (arroz)
- Tu target pide POCA proteína
- No hay multiplicador que cumpla ambos al 100%

### Caso con Error Alto: >20%

```
│  📊 Calorías:  520/500 kcal (104.0%)  ✅
│  💪 Proteína:  28/38g (73.7%)         ❌
│  🍚 Carbos:    65/50g (130.0%)        ❌
│  🥑 Grasas:    14/17g (82.4%)         ⚠️
│  ⚠️ Error máximo: 30.0%               ❌ MALO
```

**Interpretación:** Este plato **NO es adecuado** para tu target. Deberías elegir otro.

**¿Qué hacer?**
1. Busca otro plato con mejor "score" (verás un badge verde "Recomendado")
2. Los platos recomendados tienen error <10%

---

## 🔬 Diagnóstico de Problemas

### Problema 1: "Los macros no se cumplen al final del día"

**Síntomas:**
- Has comido 4 comidas
- Al final del día te faltan/sobran macros
- El modal de diferencias aparece

**Diagnóstico:**

1. **Revisa la consola de CADA comida**
2. **Suma mentalmente** los macros de cada una
3. **Compara** con tu objetivo total

**Ejemplo:**

```
DESAYUNO: 498 kcal, 37g prot, 48g carbs, 16g fat
COMIDA:   510 kcal, 32g prot, 52g carbs, 15g fat
MERIENDA: 250 kcal, 15g prot, 25g carbs, 8g fat
CENA:     742 kcal, 66g prot, 75g carbs, 28g fat
───────────────────────────────────────────────────
TOTAL:    2000 kcal, 150g prot, 200g carbs, 67g fat ✅
OBJETIVO: 2000 kcal, 150g prot, 200g carbs, 67g fat ✅
```

**¿Qué buscar?**
- ✅ Si el total está al ~95-105% en todos los macros → **PERFECTO**
- ⚠️ Si algún macro está al 80-90% → **ACEPTABLE** (limitación de composición de platos)
- ❌ Si algún macro está <70% o >130% → **PROBLEMA**

### Problema 2: "Los platos no se escalan"

**Síntomas:**
- Los macros mostrados son iguales a los originales
- No ves logs de escalado en consola

**Diagnóstico:**

1. **Verifica que el plato tiene ingredientes:**
```
   Tiene ingredientReferences: ✅ SÍ (3 ingredientes)
```

Si dice "❌ NO", el plato no se puede escalar (es legacy).

2. **Verifica que se llama a scaleToExactTarget:**
```
🔧 ESCALANDO: "Arroz con Pollo"
```

Si NO ves este log, el escalado no se está ejecutando.

### Problema 3: "El target calculado es 0"

**Síntomas:**
```
📊 Target: {calories: 0, protein: 0, carbs: 0, fat: 0}
```

**Causa:** Ya completaste todos los macros del día.

**Solución:** Resetea el día o come menos en las comidas anteriores.

---

## 📊 Ejemplo Completo de un Día Perfecto

```
═══════════════════════════════════════════════════════
DESAYUNO (08:00)
═══════════════════════════════════════════════════════
Target: 500 kcal, 38g prot, 50g carbs, 17g fat
Plato: "Tostadas con Aguacate y Huevo"
Resultado: 498/500 kcal (99.6%), 37/38g prot (97.4%), 48/50g carbs (96%), 16/17g fat (94.1%)
✅ Error máx: 5.9%

═══════════════════════════════════════════════════════
COMIDA (14:00)
═══════════════════════════════════════════════════════
Consumido hasta ahora: 498 kcal, 37g prot, 48g carbs, 16g fat
Restante: 1502 kcal, 113g prot, 152g carbs, 51g fat
Target: 500 kcal, 38g prot, 50g carbs, 17g fat
Plato: "Arroz con Pollo al Curry"
Resultado: 510/500 kcal (102%), 32/38g prot (84.2%), 52/50g carbs (104%), 15/17g fat (88.2%)
⚠️ Error máx: 15.8% (composición del plato no permite mejor ajuste)

═══════════════════════════════════════════════════════
MERIENDA (18:00)
═══════════════════════════════════════════════════════
Consumido: 1008 kcal, 69g prot, 100g carbs, 31g fat
Restante: 992 kcal, 81g prot, 100g carbs, 36g fat
Target: 250 kcal, 19g prot, 25g carbs, 8g fat
Plato: "Yogur Griego con Frutos Secos"
Resultado: 248/250 kcal (99.2%), 18/19g prot (94.7%), 24/25g carbs (96%), 8/8g fat (100%)
✅ Error máx: 5.3%

═══════════════════════════════════════════════════════
CENA (21:00) - ÚLTIMA COMIDA
═══════════════════════════════════════════════════════
Consumido: 1256 kcal, 87g prot, 124g carbs, 39g fat
Restante: 744 kcal, 63g prot, 76g carbs, 28g fat
Target: 744 kcal, 63g prot, 76g carbs, 28g fat (TODO lo restante)
Plato: "Salmón con Verduras al Horno"
Resultado: 742/744 kcal (99.7%), 66/63g prot (104.8%), 75/76g carbs (98.7%), 28/28g fat (100%)
✅ Error máx: 4.8%

═══════════════════════════════════════════════════════
TOTAL DEL DÍA
═══════════════════════════════════════════════════════
Objetivo:  2000 kcal, 150g prot, 200g carbs, 67g fat
Consumido: 1998 kcal, 153g prot, 199g carbs, 67g fat
Diferencia: -2 kcal, +3g prot, -1g carbs, 0g fat
✅ Completitud: 99.9%, 102%, 99.5%, 100%
✅ PERFECTO - Modal NO aparece
```

---

## 🎯 Qué Esperar

### ✅ Sistema Funcionando Correctamente

1. **Cada comida** muestra target calculado en consola
2. **Los ingredientes** se escalan automáticamente
3. **Los macros finales** están al 85-105% del target (dependiendo del plato)
4. **Al final del día** estás al 95-105% en TODOS los macros
5. **Modal de diferencias** NO aparece (o aparece solo si error >10%)

### ❌ Sistema NO Funcionando

1. **No ves logs** de "ESCALANDO" en consola
2. **Los macros finales** son iguales a los originales
3. **Al final del día** estás al <80% o >120% en algún macro
4. **Modal de diferencias** aparece siempre

---

## 🚀 Próximos Pasos

1. **Recarga la app** (Cmd+R o Ctrl+R)
2. **Abre la consola** (F12)
3. **Agrega platos** y observa los logs
4. **Toma screenshot** de los logs si hay problemas
5. **Comparte** los logs para diagnóstico

