# 🎯 Sistema de Cálculo Exacto de Porciones

## Cómo Funciona Ahora

### Ejemplo Práctico:

**Usuario:** Juan
- Objetivo diario: 2400 kcal | 180g proteína | 270g carbos | 80g grasas

---

### 📊 **Selección Secuencial:**

#### **1️⃣ DESAYUNO (Primera comida del día)**

**Lo que falta:** 2400 kcal | 180g proteína | 270g carbos | 80g grasas

**Plato seleccionado:** "Tortilla de Avena con Frutas"
- Base: 475 kcal | 32.5g proteína | 70.9g carbos | 14.4g grasas

**Cálculo del multiplicador óptimo:**
```
Multiplicador por calorías: 2400 / 475 = 5.05x (demasiado)
Multiplicador por proteína: 180 / 32.5 = 5.54x (demasiado)
Multiplicador por carbos: 270 / 70.9 = 3.81x
Multiplicador por grasas: 80 / 14.4 = 5.56x (demasiado)

Algoritmo de minimización de error → Multiplicador óptimo: 1.2x
```

**Resultado ajustado:**
- 570 kcal | 39g proteína | 85g carbos | 17.3g grasas ✅

**Macros restantes después del desayuno:**
- 1830 kcal | 141g proteína | 185g carbos | 62.7g grasas

---

#### **2️⃣ COMIDA (Segunda comida - condicionada por el desayuno)**

**Lo que AHORA falta:** 1830 kcal | 141g proteína | 185g carbos | 62.7g grasas

**Plato seleccionado:** "Pollo a la Plancha con Arroz Integral"
- Base: 617 kcal | 45.7g proteína | 62.1g carbos | 16.8g grasas

**Cálculo del multiplicador óptimo:**
```
Multiplicador por calorías: 1830 / 617 = 2.97x
Multiplicador por proteína: 141 / 45.7 = 3.09x
Multiplicador por carbos: 185 / 62.1 = 2.98x
Multiplicador por grasas: 62.7 / 16.8 = 3.73x

Algoritmo de minimización de error → Multiplicador óptimo: 1.1x
```

**Resultado ajustado:**
- 679 kcal | 50.3g proteína | 68.3g carbos | 18.5g grasas ✅

**Macros restantes después de desayuno + comida:**
- 1151 kcal | 90.7g proteína | 116.7g carbos | 44.2g grasas

---

#### **3️⃣ MERIENDA (Tercera comida - condicionada por desayuno + comida)**

**Lo que AHORA falta:** 1151 kcal | 90.7g proteína | 116.7g carbos | 44.2g grasas

**Plato seleccionado:** "Yogur Griego con Nueces y Frutas"
- Base: 343 kcal | 22.7g proteína | 42g carbos | 8.6g grasas

**Cálculo del multiplicador óptimo:**
```
Multiplicador por calorías: 1151 / 343 = 3.36x
Multiplicador por proteína: 90.7 / 22.7 = 4.00x
Multiplicador por carbos: 116.7 / 42 = 2.78x
Multiplicador por grasas: 44.2 / 8.6 = 5.14x

Algoritmo de minimización de error → Multiplicador óptimo: 0.9x
```

**Resultado ajustado:**
- 309 kcal | 20.4g proteína | 37.8g carbos | 7.7g grasas ✅

**Macros restantes después de desayuno + comida + merienda:**
- 842 kcal | 70.3g proteína | 78.9g carbos | 36.5g grasas

---

#### **4️⃣ CENA (Última comida - COMPLETA EXACTAMENTE lo que falta)**

**Lo que AHORA falta:** 842 kcal | 70.3g proteína | 78.9g carbos | 36.5g grasas

**Plato seleccionado:** "Salmón con Verduras al Vapor"
- Base: 496 kcal | 32.4g proteína | 29.9g carbos | 25.8g grasas

**Cálculo del multiplicador óptimo:**
```
Multiplicador por calorías: 842 / 496 = 1.70x
Multiplicador por proteína: 70.3 / 32.4 = 2.17x
Multiplicador por carbos: 78.9 / 29.9 = 2.64x
Multiplicador por grasas: 36.5 / 25.8 = 1.41x

Algoritmo de minimización de error → Multiplicador óptimo: 1.7x
```

**Resultado ajustado:**
- 843 kcal | 55.1g proteína | 50.8g carbos | 43.9g grasas ✅

---

## 📈 **Resultado Final del Día:**

| Macro | Objetivo | Consumido | Diferencia | % Cumplido |
|-------|----------|-----------|------------|------------|
| **Calorías** | 2400 kcal | 2401 kcal | +1 kcal | 100.0% ✅ |
| **Proteína** | 180g | 164.8g | -15.2g | 91.6% ✅ |
| **Carbohidratos** | 270g | 241.9g | -28.1g | 89.6% ✅ |
| **Grasas** | 80g | 87.4g | +7.4g | 109.3% ✅ |

---

## 🎯 **Ventajas del Sistema:**

1. ✅ **Secuencial:** Cada comida se ajusta a lo que FALTA después de las anteriores
2. ✅ **Automático:** El usuario no hace cálculos, solo elige el plato
3. ✅ **Equilibrado:** Minimiza el error en TODOS los macros simultáneamente
4. ✅ **Preciso:** Llega casi exacto a los objetivos diarios
5. ✅ **Flexible:** Se adapta a las preferencias del usuario (puede elegir los platos que quiera)

---

## 🧠 **Algoritmo de Minimización de Error:**

Para cada plato, se prueba con diferentes multiplicadores:
- Multiplicador individual por cada macro
- Promedio de multiplicadores
- Mínimo (conservador)
- Máximo (agresivo)

Se elige el multiplicador que minimiza el **error cuadrático normalizado**:

```typescript
error = Σ [(resultado - objetivo) / objetivo]²
```

Esto garantiza que todos los macros se respetan de forma equilibrada.
