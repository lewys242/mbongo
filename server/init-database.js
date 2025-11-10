const path = require('path');
const fs = require('fs');

// Supprimer l'ancienne base de données s'elle existe
const dbPath = path.join(__dirname, '..', 'budget.db');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('🗑️ Ancienne base de données supprimée');
}

// Importer le module de base de données pour recréer la structure
const db = require('./database');

// Attendre que la base soit initialisée
db.ready().then(() => {
  console.log('📊 Création de données d\'exemple...');
  
  // Obtenir les catégories créées automatiquement
  const categories = db.prepare('SELECT * FROM categories').all();
  console.log('✅ Catégories disponibles:', categories.map(c => c.name).join(', '));
  
  // Créer un revenu mensuel (salaire)
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  db.prepare('INSERT INTO incomes (amount, description, month) VALUES (?, ?, ?)').run(350000, 'Salaire', currentMonth);
  console.log('💰 Revenu créé: 350,000 FCFA');
  
  // Créer des dépenses d'exemple pour le mois courant
  const expenses = [
    { amount: 80000, categoryName: 'Logement', description: 'Loyer mensuel', date: '2025-11-01' },
    { amount: 25000, categoryName: 'Alimentation', description: 'Courses de la semaine', date: '2025-11-02' },
    { amount: 15000, categoryName: 'Transport', description: 'Carburant', date: '2025-11-03' },
    { amount: 12000, categoryName: 'Alimentation', description: 'Restaurant', date: '2025-11-04' },
    { amount: 8000, categoryName: 'Transport', description: 'Taxi', date: '2025-11-05' },
    { amount: 20000, categoryName: 'Shopping', description: 'Vêtements', date: '2025-11-06' },
    { amount: 5000, categoryName: 'Santé', description: 'Pharmacie', date: '2025-11-06' },
    { amount: 18000, categoryName: 'Alimentation', description: 'Marché', date: '2025-11-07' },
    { amount: 10000, categoryName: 'Loisirs', description: 'Cinéma', date: '2025-11-07' }
  ];
  
  expenses.forEach(expense => {
    const category = categories.find(c => c.name === expense.categoryName);
    if (category) {
      db.prepare('INSERT INTO expenses (amount, category_id, description, date) VALUES (?, ?, ?, ?)').run(
        expense.amount,
        category.id,
        expense.description,
        expense.date
      );
      console.log(`✅ Dépense créée: ${expense.amount} FCFA - ${expense.description}`);
    }
  });
  
  // Créer un prêt d'exemple
  const loanResult = db.prepare('INSERT INTO loans (principal, interest_rate, term_months, description) VALUES (?, ?, ?, ?)').run(
    500000,
    5.0,
    24,
    'Prêt personnel'
  );
  
  console.log('💳 Prêt créé: 500,000 FCFA à 5% sur 24 mois');
  
  // Ajouter quelques remboursements au prêt
  const repayments = [
    { amount: 25000, date: '2025-10-15' },
    { amount: 25000, date: '2025-11-01' }
  ];
  
  repayments.forEach(repayment => {
    db.prepare('INSERT INTO repayments (loan_id, amount, date) VALUES (?, ?, ?)').run(
      loanResult.lastInsertRowid,
      repayment.amount,
      repayment.date
    );
    console.log(`✅ Remboursement créé: ${repayment.amount} FCFA le ${repayment.date}`);
  });
  
  console.log('');
  console.log('🎉 Base de données initialisée avec succès !');
  console.log('📊 Résumé des données créées:');
  console.log(`   • ${categories.length} catégories`);
  console.log(`   • ${expenses.length} dépenses`);
  console.log(`   • 1 revenu mensuel`);
  console.log(`   • 1 prêt avec ${repayments.length} remboursements`);
  console.log('');
  console.log('🚀 Vous pouvez maintenant lancer l\'application !');
}).catch(err => {
  console.error('❌ Erreur lors de l\'initialisation:', err);
});