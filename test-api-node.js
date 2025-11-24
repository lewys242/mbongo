const http = require('http');

console.log('🔍 Test de l\'API...');

// Test de l'API incomes
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/incomes',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`✅ Statut: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const incomes = JSON.parse(data);
      console.log(`📊 Nombre de revenus: ${incomes.length}`);
      console.log('💰 Premiers revenus:');
      incomes.slice(0, 3).forEach(income => {
        console.log(`  - ${income.description}: ${income.amount}€ (${income.date})`);
      });
    } catch (error) {
      console.error('❌ Erreur parsing JSON:', error.message);
      console.log('Raw data:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur requête:', error.message);
});

req.setTimeout(5000, () => {
  console.error('❌ Timeout de la requête');
  req.destroy();
});

req.end();