const database = require('./server/database');

async function checkData() {
  try {
    await database.ready();
    console.log('=== VÉRIFICATION DE VOS DONNÉES ===');
    
    // Vérifier les revenus
    const incomes = database.prepare('SELECT * FROM incomes').all();
    console.log('\n💰 REVENUS TROUVÉS:', incomes.length);
    incomes.forEach(income => {
      console.log(`  - ${income.description}: ${income.amount} FCFA (${income.date})`);
    });
    
    // Vérifier les dépenses
    const expenses = database.prepare('SELECT * FROM expenses').all();
    console.log('\n💸 DÉPENSES TROUVÉES:', expenses.length);
    expenses.forEach(expense => {
      console.log(`  - ${expense.description}: ${expense.amount} FCFA (${expense.date})`);
    });
    
    // Vérifier les catégories
    const categories = database.prepare('SELECT * FROM categories').all();
    console.log('\n📂 CATÉGORIES TROUVÉES:', categories.length);
    categories.forEach(cat => {
      console.log(`  - ${cat.icon} ${cat.name}`);
    });
    
    console.log('\n=== FIN VÉRIFICATION ===');
    
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
  }
}

checkData();