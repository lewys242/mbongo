const axios = require('axios');

async function testAPI() {
  try {
    console.log('=== TEST DE L\'API ===');
    
    // Test des revenus
    const incomesRes = await axios.get('http://localhost:5000/api/incomes');
    console.log('\n💰 API REVENUS:', incomesRes.data);
    
    const total = incomesRes.data.reduce((sum, income) => sum + Number(income.amount), 0);
    console.log('💰 TOTAL CALCULÉ:', total, 'FCFA');
    
    // Test des stats globales
    const statsRes = await axios.get('http://localhost:5000/api/stats');
    console.log('\n📊 API STATS GLOBALES:', statsRes.data);
    
    // Test des catégories
    const categoriesRes = await axios.get('http://localhost:5000/api/categories');
    console.log('\n📂 API CATÉGORIES:', categoriesRes.data.length, 'catégories trouvées');
    
  } catch (error) {
    console.error('❌ ERREUR API:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('🔴 Le serveur n\'est pas démarré sur le port 5000');
    }
  }
}

testAPI();