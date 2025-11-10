const db = require('./database');

db.ready().then(() => {
  console.log('🔄 Migration: Ajout du champ date à la table incomes...');
  
  try {
    // Vérifier si la colonne date existe déjà
    const tableInfo = db.prepare("PRAGMA table_info(incomes)").all();
    const hasDateColumn = tableInfo.some(column => column.name === 'date');
    
    if (!hasDateColumn) {
      // Ajouter la colonne date
      db.exec('ALTER TABLE incomes ADD COLUMN date TEXT');
      console.log('✅ Colonne date ajoutée à la table incomes');
      
      // Mettre à jour les enregistrements existants avec une date par défaut (premier jour du mois)
      const existingIncomes = db.prepare('SELECT id, month FROM incomes WHERE date IS NULL').all();
      
      existingIncomes.forEach(income => {
        const defaultDate = income.month + '-01'; // Premier jour du mois
        db.prepare('UPDATE incomes SET date = ? WHERE id = ?').run(defaultDate, income.id);
        console.log(`📅 Date par défaut ajoutée pour le revenu ${income.id}: ${defaultDate}`);
      });
      
      console.log('');
      console.log('🎉 Migration terminée avec succès !');
      console.log('📊 Vous pouvez maintenant ajouter des dates spécifiques aux revenus.');
    } else {
      console.log('✅ La colonne date existe déjà dans la table incomes');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
}).catch(err => {
  console.error('❌ Erreur d\'initialisation de la base de données:', err);
});