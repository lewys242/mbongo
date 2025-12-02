const Database = require('better-sqlite3');
const path = require('path');

try {
  const dbPath = path.join(__dirname, 'budget.db');
  const db = new Database(dbPath);
  
  console.log('📊 Vérification de la base de données...');
  console.log('Chemin:', dbPath);
  
  // Vérifier les tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables.map(t => t.name));
  
  // Compter les revenus
  const incomeCount = db.prepare('SELECT COUNT(*) as count FROM incomes').get();
  console.log('Nombre de revenus:', incomeCount.count);
  
  if (incomeCount.count > 0) {
    const sampleIncomes = db.prepare('SELECT * FROM incomes LIMIT 5').all();
    console.log('Exemples de revenus:');
    sampleIncomes.forEach(income => {
      console.log(`- ${income.description}: ${income.amount}€ (${income.date})`);
    });
  }
  
  // Compter les dépenses
  const expenseCount = db.prepare('SELECT COUNT(*) as count FROM expenses').get();
  console.log('Nombre de dépenses:', expenseCount.count);
  
  // Compter les emprunts
  const loanCount = db.prepare('SELECT COUNT(*) as count FROM loans').get();
  console.log('Nombre d\'emprunts:', loanCount.count);
  
  db.close();
  console.log('✅ Vérification terminée');
} catch (error) {
  console.error('❌ Erreur:', error.message);
}