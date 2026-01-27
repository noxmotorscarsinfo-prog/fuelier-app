// Script temporal para descargar el backend desde GitHub
const fs = require('fs');
const https = require('https');

const url = 'https://raw.githubusercontent.com/noxmotorscarsinfo-prog/fuelier-app/21aee42332e269a75b8fdfe9feb282f2a2e6d248/supabase/functions/make-server-b0e879f0/index.ts';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('./backend-index-downloaded.ts', data);
    console.log('✅ Backend index.ts descargado');
    console.log(`📊 Tamaño: ${data.length} caracteres`);
  });
}).on('error', (err) => {
  console.error('❌ Error:', err.message);
});
