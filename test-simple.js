const http = require('http');

function testAPI(path, callback) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: path,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        callback(null, json);
      } catch (e) {
        callback(e, data);
      }
    });
  });

  req.on('error', (e) => {
    callback(e, null);
  });

  req.setTimeout(5000, () => {
    callback(new Error('Timeout'), null);
  });

  req.end();
}

console.log('=== TEST CONNEXION API ===');

testAPI('/api/incomes', (err, data) => {
  if (err) {
    console.log('❌ ERREUR REVENUS:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.log('🔴 SERVEUR NON ACCESSIBLE sur port 5000');
    }
  } else {
    console.log('✅ REVENUS API:', data);
    if (Array.isArray(data)) {
      const total = data.reduce((sum, income) => sum + Number(income.amount), 0);
      console.log('💰 TOTAL REVENUS:', total, 'FCFA');
    }
  }
});

testAPI('/api/stats', (err, data) => {
  if (err) {
    console.log('❌ ERREUR STATS:', err.message);
  } else {
    console.log('✅ STATS API:', data);
  }
});