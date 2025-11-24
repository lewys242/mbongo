const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'budget.db');
let db = null;

// Initialiser la base de données
const initDb = async () => {
  const SQL = await initSqlJs();
  
  // Charger la base existante ou créer une nouvelle
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  return db;
};

// Sauvegarder la base de données
const saveDb = () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
};

// Wrapper pour exécuter des requêtes
const prepare = (query) => {
  return {
    run: (...params) => {
      const stmt = db.prepare(query);
      stmt.bind(params);
      stmt.step();
      const lastId = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0];
      stmt.free();
      saveDb();
      return { lastInsertRowid: lastId };
    },
    get: (...params) => {
      const stmt = db.prepare(query);
      stmt.bind(params);
      const result = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();
      return result;
    },
    all: (...params) => {
      const stmt = db.prepare(query);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    }
  };
};

const exec = (query) => {
  db.run(query);
  saveDb();
};

// Créer les tables
const initDatabase = async () => {
  await initDb();
  
  // Table des catégories
  exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      icon TEXT DEFAULT '💰',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table des dépenses
  exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      category_id INTEGER NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table des budgets mensuels
  exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category_id, month)
    )
  `);

  // Table des revenus mensuels
  exec(`
    CREATE TABLE IF NOT EXISTS incomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      description TEXT,
      month TEXT NOT NULL,
      date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table des prêts (loans)
  exec(`
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      principal REAL NOT NULL,
      interest_rate REAL DEFAULT 0,
      term_months INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table des remboursements pour les prêts
  exec(`
    CREATE TABLE IF NOT EXISTS repayments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      interest_amount REAL DEFAULT 0,
      principal_amount REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insérer des catégories par défaut si la table est vide
  const count = prepare('SELECT COUNT(*) as count FROM categories').get();
  if (!count || count.count === 0) {
    const categories = [
      // Catégories essentielles
      ['Alimentation', '#10b981', '🍔'],
      ['Transport', '#3b82f6', '🚗'],
      ['Logement', '#8b5cf6', '🏠'],
      ['Santé', '#ef4444', '💊'],
      
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
      ['Coiffure/Esthétique', '#ec4899', '�'],
      ['Vêtements', '#8b5cf6', '👕'],
      ['Chaussures', '#6b7280', '👞'],
      ['Produits beauté', '#f59e0b', '💄'],
      
      // Éducation et développement
      ['Éducation/Formation', '#06b6d4', '📚'],
      ['Internet/Data', '#3b82f6', '📶'],
      ['Livres/Journaux', '#059669', '📰'],
      
      // Loisirs et divertissement
      ['Loisirs/Sorties', '#f59e0b', '🎮'],
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
      ['Shopping', '#ec4899', '🛍️'],
      ['Urgences/Imprévus', '#ef4444', '🚨'],
      ['Autres', '#6b7280', '📦']
    ];
    
    categories.forEach(cat => {
      prepare('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)').run(...cat);
    });
    console.log('✅ Catégories par défaut créées');
  }
};

// Initialiser au démarrage
let dbReady = initDatabase();

module.exports = {
  ready: () => dbReady,
  prepare,
  exec
};
