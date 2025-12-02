const db = require('./database');

db.ready().then(() => {
  const categories = db.prepare('SELECT * FROM categories').all();
  
  // Ajouter des dépenses supplémentaires pour dépasser le salaire
  const additionalExpenses = [
    { amount: 50000, categoryName: 'Logement', description: 'Charges supplémentaires', date: '2025-11-08' },
    { amount: 75000, categoryName: 'Alimentation', description: 'Provisions du mois', date: '2025-11-09' },
    { amount: 30000, categoryName: 'Transport', description: 'Entretien véhicule', date: '2025-11-10' },
    { amount: 45000, categoryName: 'Shopping', description: 'Équipement maison', date: '2025-11-11' }
  ];
  
  let totalAdded = 0;
  additionalExpenses.forEach(expense => {
    const category = categories.find(c => c.name === expense.categoryName);
    if (category) {
      db.prepare('INSERT INTO expenses (amount, category_id, description, date) VALUES (?, ?, ?, ?)').run(
        expense.amount,
        category.id,
        expense.description,
        expense.date
      );
      console.log(`✅ Dépense ajoutée: ${expense.amount} FCFA - ${expense.description}`);
      totalAdded += expense.amount;
    }
  });
  
  console.log('');
  console.log(`💰 Total des nouvelles dépenses: ${totalAdded} FCFA`);
  console.log(`📊 Total général maintenant: ${193000 + totalAdded} FCFA`);
  console.log(`🔴 Dépassement du salaire (350,000 FCFA): ${((193000 + totalAdded) - 350000)} FCFA`);
  console.log('');
  console.log('🎯 Les conseils de gestion vont maintenant apparaître !');
}).catch(err => {
  console.error('❌ Erreur:', err);
});