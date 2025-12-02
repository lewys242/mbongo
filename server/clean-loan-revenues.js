const database = require('./database');

async function cleanLoanRevenues() {
  try {
    console.log('🔍 Recherche des revenus créés automatiquement pour les prêts...');
    
    // Charger la DB
    await database.ready();
    
    // Récupérer tous les revenus avec "Prêt:" dans la description
    const loanRevenues = database.prepare(`
      SELECT * FROM incomes 
      WHERE description LIKE 'Prêt:%'
    `).all();
    
    console.log(`📊 ${loanRevenues.length} revenu(s) lié(s) aux prêts trouvé(s)`);
    
    if (loanRevenues.length > 0) {
      console.log('\n📋 Liste des revenus à supprimer:');
      loanRevenues.forEach(revenue => {
        console.log(`- ID ${revenue.id}: ${revenue.amount} FCFA - ${revenue.description}`);
      });
      
      // Demander confirmation (on peut skip pour le script automatique)
      console.log('\n🗑️  Suppression des faux revenus...');
      
      for (const revenue of loanRevenues) {
        database.prepare('DELETE FROM incomes WHERE id = ?').run(revenue.id);
        console.log(`✅ Supprimé: ${revenue.description} (${revenue.amount} FCFA)`);
      }
      
      console.log(`\n🎉 ${loanRevenues.length} faux revenu(s) supprimé(s) avec succès!`);
      
      // Afficher le nouveau solde
      const totalIncomes = database.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM incomes').get().total;
      const totalExpenses = database.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expenses').get().total;
      const availableBalance = totalIncomes - totalExpenses;
      
      console.log('\n💰 Nouveau solde disponible:');
      console.log(`- Revenus: ${totalIncomes} FCFA`);
      console.log(`- Dépenses: ${totalExpenses} FCFA`);
      console.log(`- Solde disponible: ${Math.max(availableBalance, 0)} FCFA`);
      
    } else {
      console.log('✨ Aucun faux revenu trouvé. Base de données déjà propre!');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Lancer le nettoyage
cleanLoanRevenues();