// Verificar si los macros de los platos coinciden con sus ingredientes
const ingredients = {
  'pollo-pechuga': {cal: 165, p: 31, c: 0, f: 3.6},
  'arroz-blanco': {cal: 130, p: 2.7, c: 28, f: 0.3},
  'cebolla': {cal: 40, p: 1.1, c: 9, f: 0.1},
  'pimiento': {cal: 31, p: 1, c: 6, f: 0.3},
  'leche-desnatada': {cal: 34, p: 3.4, c: 5, f: 0.1},
  'aceite-oliva': {cal: 884, p: 0, c: 0, f: 100}
};

// Plato: Arroz con Pollo al Curry - ingredientReferences de la DB
const refs = [
  {id: 'pollo-pechuga', g: 170},
  {id: 'arroz-blanco', g: 140},
  {id: 'cebolla', g: 60},
  {id: 'pimiento', g: 80},
  {id: 'leche-desnatada', g: 100},
  {id: 'aceite-oliva', g: 10}
];

let cal=0, p=0, c=0, f=0;
console.log('📊 Calculando macros "Arroz con Pollo al Curry":\n');
refs.forEach(r => {
  const i = ingredients[r.id];
  const cals = (i.cal * r.g) / 100;
  const prot = (i.p * r.g) / 100;
  const carb = (i.c * r.g) / 100;
  const fat = (i.f * r.g) / 100;
  console.log(`  ${r.id} (${r.g}g): ${Math.round(cals)} cal, ${prot.toFixed(1)}g P, ${carb.toFixed(1)}g C, ${fat.toFixed(1)}g F`);
  cal += cals; p += prot; c += carb; f += fat;
});

console.log('');
console.log(`✅ CALCULADO: ${Math.round(cal)} cal, ${Math.round(p)}g P, ${Math.round(c)}g C, ${Math.round(f)}g F`);
console.log(`📍 EN DB:     570 cal, 64g P, 54g C, 16g F`);
console.log('');
console.log(Math.abs(cal - 570) < 10 ? '✅ ¡LOS MACROS COINCIDEN!' : '❌ NO COINCIDE - Necesita recalcular');
