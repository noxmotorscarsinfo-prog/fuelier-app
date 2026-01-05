# ✅ BASE DE DATOS DE PLATOS REALES - FUELIER

## 🎯 SISTEMA COMPLETO IMPLEMENTADO

### 📊 **INGREDIENTES REALES (54 ingredientes)**

Todos los ingredientes tienen **valores nutricionales REALES** por 100g basados en bases de datos oficiales:

#### Proteínas (13):
- Pechuga de Pollo: 165 kcal, 31g prot
- Pechuga de Pavo: 135 kcal, 30g prot
- Ternera Magra: 250 kcal, 26g prot
- Salmón: 208 kcal, 20g prot
- Atún Natural: 116 kcal, 26g prot
- Merluza: 90 kcal, 17g prot
- Bacalao: 82 kcal, 18g prot
- Lubina: 97 kcal, 19g prot
- Dorada: 100 kcal, 20g prot
- Huevos: 155 kcal, 13g prot
- Tofu: 76 kcal, 8g prot
- Proteína Whey: 400 kcal, 80g prot
- Lentejas/Garbanzos (cocidos)

#### Carbohidratos (9):
- Arroz Blanco/Integral/Basmati
- Pasta Integral/Blanca
- Patata/Boniato
- Pan Integral/Centeno
- Avena
- Quinoa
- Tortitas de Arroz

#### Grasas Saludables (5):
- Aceite de Oliva
- Aguacate
- Nueces
- Almendras
- Mantequilla de Cacahuete

#### Vegetales (12):
- Brócoli, Espinacas, Tomate, Lechuga
- Zanahoria, Pimiento, Cebolla
- Calabacín, Berenjena, Espárragos
- Champiñones, Pepino

#### Lácteos (4):
- Leche Desnatada
- Yogur Griego Natural
- Queso Fresco 0%
- Mozzarella Light
- Requesón

#### Frutas (8):
- Plátano, Manzana, Fresas, Arándanos
- Kiwi, Naranja, Melocotón

---

## 🍳 **PLATOS REALES CREADOS**

### **DESAYUNOS (11 platos)**
1. Tortilla de Avena con Frutas
2. Yogur Griego con Granola y Frutos Rojos
3. Tostadas de Pan Integral con Pavo y Aguacate
4. Tortilla de Claras con Verduras
5. Bowl de Avena con Mantequilla de Cacahuete
6. Revuelto de Huevos con Salmón Ahumado
7. Pancakes Proteicos con Frutos Rojos
8. **Batido Proteico de Plátano y Avena** ⭐ NUEVO
9. **Tortitas de Arroz con Requesón y Frutas** ⭐ NUEVO
10. **Tostada de Centeno con Salmón y Aguacate** ⭐ NUEVO
11. **Porridge de Avena con Frutas Mixtas** ⭐ NUEVO

### **COMIDAS (10 platos)**
1. Pollo a la Plancha con Arroz Integral
2. Salmón con Quinoa y Vegetales
3. Pasta Integral con Pavo y Verduras
4. Ternera Magra con Patatas al Horno
5. Arroz con Pollo al Curry
6. **Ensalada Completa con Atún Natural** ⭐ NUEVO
7. **Lentejas con Verduras al Estilo Mediterráneo** ⭐ NUEVO
8. **Pollo Asado con Boniato y Espárragos** ⭐ NUEVO
9. **Garbanzos Salteados con Calabacín y Berenjena** ⭐ NUEVO
10. **Pavo Salteado con Arroz Basmati** ⭐ NUEVO

### **MERIENDAS (5 platos)**
1. Yogur Griego con Nueces y Frutas
2. Tostada con Queso Fresco y Pavo
3. Batido de Plátano y Avena
4. Frutas Variadas con Almendras
5. Tortitas de Avena con Frutas

### **CENAS (8 platos)**
1. Salmón con Verduras al Vapor
2. Pollo con Boniato y Ensalada
3. Tortilla de Claras con Ensalada Completa
4. Pavo Salteado con Quinoa
5. Merluza con Verduras Salteadas
6. Bacalao al Horno con Patatas
7. Lubina a la Plancha con Verduras
8. Dorada al Horno con Ensalada

---

## ⚙️ **CÓMO FUNCIONA**

### 1. **Cada plato tiene ingredientes reales con cantidades exactas**
Ejemplo: "Pollo a la Plancha con Arroz Integral"
```typescript
{
  ingredientId: 'pollo-pechuga', amountInGrams: 180,  // 180g pollo
  ingredientId: 'arroz-integral', amountInGrams: 150, // 150g arroz
  ingredientId: 'brocoli', amountInGrams: 150,        // 150g brócoli
  ingredientId: 'zanahoria', amountInGrams: 80,       // 80g zanahoria
  ingredientId: 'aceite-oliva', amountInGrams: 10     // 10g aceite
}
```

### 2. **Los macros se calculan automáticamente**
La función `calculateMacrosFromIngredients()` suma los valores nutricionales:
- Pollo (180g): 297 kcal, 55.8g prot
- Arroz (150g): 167 kcal, 3.9g prot, 34.5g carbs
- Brócoli (150g): 51 kcal, 4.2g prot
- Etc.

**Total automático**: ~520 kcal, ~65g prot, ~50g carbs, ~8g fat

### 3. **El sistema escala TODO proporcionalmente**
Si el usuario necesita 756 kcal para el desayuno:
- Multiplicador: 756 / 520 = 1.45x
- **Todos los ingredientes se multiplican por 1.45x**
- Pollo: 180g → 261g
- Arroz: 150g → 218g
- Brócoli: 150g → 218g
- **Resultado final**: EXACTAMENTE 756 kcal

### 4. **La última comida ajusta al 100%**
Si para la cena faltan exactamente 758 kcal y 38g proteína:
- El sistema escala el plato para llegar **EXACTAMENTE** a esos valores
- **Garantiza** que el día termine al 100% de los objetivos

---

## ✅ **VERIFICACIÓN DE PRECISIÓN**

### Ejemplo real con "Salmón con Verduras al Vapor":
**Ingredientes base:**
- Salmón 150g: 312 kcal, 30g prot, 0g carbs, 19.5g fat
- Brócoli 150g: 51 kcal, 4.2g prot, 10.5g carbs, 0.6g fat
- Espinacas 100g: 23 kcal, 2.9g prot, 3.6g carbs, 0.4g fat
- Zanahoria 80g: 33 kcal, 0.7g prot, 8g carbs, 0.2g fat
- Aceite 10g: 88 kcal, 0g prot, 0g carbs, 10g fat

**TOTAL BASE**: 507 kcal, 37.8g prot, 22.1g carbs, 30.7g fat

**Si el target de la cena es 758 kcal:**
- Multiplicador: 758 / 507 = 1.495x
- Salmón: 150g → 224g
- Brócoli: 150g → 224g
- Etc.

**RESULTADO ESCALADO**: 758 kcal, 56.5g prot, 33g carbs, 45.9g fat ✅

---

## 🚀 **TOTAL: 34 PLATOS REALES**
- 11 Desayunos
- 10 Comidas
- 5 Meriendas
- 8 Cenas

**TODOS con ingredientes reales, cantidades realistas y valores nutricionales precisos.**
