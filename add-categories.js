const database = require('./server/database');

async function addNewCategories() {
  try {
    await database.ready();
    console.log('=== AJOUT DES NOUVELLES CATÉGORIES ===');
    
    const newCategories = [
      // Transport et véhicule
      ['Carburant', '#f97316', '⛽'],
      ['Vidange', '#84cc16', '🔧'],
      ['Assurance véhicule', '#06b6d4', '🚙'],
      ['Réparation auto', '#dc2626', '🔩'],
      ['Parking/Péage', '#7c3aed', '🅿️'],
      
      // Vie sociale et familiale
      ['Partage/Aide famille', '#f59e0b', '🤝'],
      ['Marché/Courses', '#22c55e', '🛒'],
      ['Restaurant/Maquis', '#ef4444', '🍽️'],
      ['Cadeaux', '#ec4899', '🎁'],
      ['Cérémonies', '#8b5cf6', '🎊'],
      
      // Services et communication
      ['Téléphone/Internet', '#06b6d4', '📱'],
      ['Électricité', '#fbbf24', '⚡'],
      ['Eau', '#3b82f6', '💧'],
      ['Gaz', '#f97316', '🔥'],
      ['Poubelle/Assainissement', '#6b7280', '🗑️'],
      
      // Apparence et soins
      ['Coiffure/Esthétique', '#ec4899', '💇'],
      ['Vêtements', '#8b5cf6', '👕'],
      ['Chaussures', '#6b7280', '👞'],
      ['Produits beauté', '#f59e0b', '💄'],
      
      // Éducation et développement
      ['Internet/Data', '#3b82f6', '📶'],
      ['Livres/Journaux', '#059669', '📰'],
      
      // Loisirs et divertissement
      ['Sport/Gym', '#22c55e', '⚽'],
      ['Cinéma/Spectacles', '#8b5cf6', '🎬'],
      ['Voyage/Vacances', '#06b6d4', '✈️'],
      
      // Santé et bien-être
      ['Médicaments', '#ef4444', '💊'],
      ['Consultation médicale', '#f97316', '🏥'],
      ['Pharmacie', '#22c55e', '💉'],
      
      // Charges professionnelles
      ['Frais professionnels', '#6b7280', '💼'],
      ['Déjeuner bureau', '#f59e0b', '🥪'],
      ['Transport travail', '#3b82f6', '🚌'],
      
      // Épargne et investissement
      ['Épargne', '#22c55e', '💰'],
      ['Investissement', '#8b5cf6', '📈'],
      ['Assurance vie', '#6b7280', '🛡️'],
      
      // Remboursements et crédits
      ['Remboursement de prêt', '#ef4444', '💳'],
      ['Crédit/Emprunt', '#dc2626', '🏦'],
      
      // Divers
      ['Urgences/Imprévus', '#ef4444', '🚨']
    ];
    
    let added = 0;
    
    newCategories.forEach(cat => {
      // Vérifier si la catégorie existe déjà
      const existing = database.prepare('SELECT id FROM categories WHERE name = ?').get(cat[0]);
      if (!existing) {
        database.prepare('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)').run(...cat);
        console.log(`✅ Ajouté: ${cat[2]} ${cat[0]}`);
        added++;
      }
    });
    
    console.log(`\n🎉 ${added} nouvelles catégories ajoutées !`);
    console.log('Vos revenus et autres données sont préservées.');
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

addNewCategories();