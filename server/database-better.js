const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'budget.db');
let db = null;

// Initialiser la base de données
const initDb = async () => {
  try {
    // Créer une connexion à la base de données SQLite
    db = new Database(dbPath);
    
    // Activer les clés étrangères
    db.pragma('foreign_keys = ON');
    
    console.log('📊 Base de données connectée:', dbPath);
    return db;
  } catch (error) {
    console.error('❌ Erreur initialisation DB:', error);
    throw error;
  }
};

// Wrapper pour maintenir la compatibilité avec l'ancien code
const prepare = (query) => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db.prepare(query);
};

// Fonction pour obtenir toutes les données d'une table
const all = (query, ...params) => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db.prepare(query).all(...params);
};

// Fonction pour obtenir une seule ligne
const get = (query, ...params) => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db.prepare(query).get(...params);
};

// Fonction pour exécuter une requête
const run = (query, ...params) => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db.prepare(query).run(...params);
};

// Fermer la base de données
const close = () => {
  if (db) {
    db.close();
    db = null;
  }
};

// Fonction ready pour l'initialisation
const ready = async () => {
  if (!db) {
    await initDb();
  }
  return db;
};

module.exports = {
  prepare,
  all,
  get,
  run,
  close,
  ready,
  initDb
};