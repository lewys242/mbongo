const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const database = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Attendre que la DB soit prête
let dbReady = false;
database.ready().then(() => {
  dbReady = true;
  console.log('✅ Base de données initialisée');
}).catch(err => {
  console.error('❌ Erreur initialisation DB:', err);
});

// Middleware pour vérifier que la DB est prête
app.use((req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({ error: 'Database not ready' });
  }
  next();
});

// ============ ROUTES CATÉGORIES ============

// Récupérer toutes les catégories
app.get('/api/categories', (req, res) => {
  try {
    const categories = database.prepare('SELECT * FROM categories ORDER BY name').all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une catégorie
app.post('/api/categories', (req, res) => {
  try {
    const { name, color, icon } = req.body;
    const stmt = database.prepare('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)');
    const result = stmt.run(name, color, icon || '💰');
    res.json({ id: result.lastInsertRowid, name, color, icon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer une catégorie
app.delete('/api/categories/:id', (req, res) => {
  try {
    const stmt = database.prepare('DELETE FROM categories WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ROUTES DÉPENSES ============

// Récupérer toutes les dépenses avec filtres
app.get('/api/expenses', (req, res) => {
  try {
    const { month, year, category_id } = req.query;
    let query = `
      SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (month && year) {
      query += ` AND strftime('%Y-%m', e.date) = ?`;
      params.push(`${year}-${month.padStart(2, '0')}`);
    } else if (year) {
      query += ` AND strftime('%Y', e.date) = ?`;
      params.push(year);
    }

    if (category_id) {
      query += ` AND e.category_id = ?`;
      params.push(category_id);
    }

    query += ` ORDER BY e.date DESC, e.created_at DESC`;

    const expenses = database.prepare(query).all(...params);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer une dépense
app.post('/api/expenses', (req, res) => {
  try {
    const { amount, category_id, description, date } = req.body;
    const stmt = database.prepare('INSERT INTO expenses (amount, category_id, description, date) VALUES (?, ?, ?, ?)');
    const result = stmt.run(amount, category_id, description || '', date);
    
    // Récupérer la dépense créée avec les infos de catégorie
    const expense = database.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).get(result.lastInsertRowid);
    
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modifier une dépense
app.put('/api/expenses/:id', (req, res) => {
  try {
    const { amount, category_id, description, date } = req.body;
    const stmt = database.prepare('UPDATE expenses SET amount = ?, category_id = ?, description = ?, date = ? WHERE id = ?');
    stmt.run(amount, category_id, description, date, req.params.id);
    
    const expense = database.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `).get(req.params.id);
    
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer une dépense
app.delete('/api/expenses/:id', (req, res) => {
  try {
    const stmt = database.prepare('DELETE FROM expenses WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ROUTES STATISTIQUES ============

// Statistiques globales
app.get('/api/stats', (req, res) => {
  try {
    const { month, year } = req.query;
    let dateFilter = '';
    const params = [];

    if (month && year) {
      dateFilter = `WHERE strftime('%Y-%m', date) = ?`;
      params.push(`${year}-${month.padStart(2, '0')}`);
    } else if (year) {
      dateFilter = `WHERE strftime('%Y', date) = ?`;
      params.push(year);
    }

    // Total des dépenses
    const total = database.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses ${dateFilter}`).get(...params);

    // Dépenses par catégorie
    const byCategory = database.prepare(`
      SELECT c.name, c.color, c.icon, COALESCE(SUM(e.amount), 0) as total
      FROM categories c
      LEFT JOIN expenses e ON c.id = e.category_id ${dateFilter ? 'AND ' + dateFilter.replace('WHERE ', '') : ''}
      GROUP BY c.id, c.name, c.color, c.icon
      HAVING total > 0
      ORDER BY total DESC
    `).all(...params);

    // Nombre de transactions
    const count = database.prepare(`SELECT COUNT(*) as count FROM expenses ${dateFilter}`).get(...params);

    res.json({
      total: total.total,
      count: count.count,
      byCategory
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dépenses mensuelles pour l'année
app.get('/api/stats/monthly/:year', (req, res) => {
  try {
    const { year } = req.params;
    const monthly = database.prepare(`
      SELECT strftime('%m', date) as month, SUM(amount) as total
      FROM expenses
      WHERE strftime('%Y', date) = ?
      GROUP BY month
      ORDER BY month
    `).all(year);

    // Créer un tableau avec tous les mois (même ceux sans dépenses)
    const result = Array.from({ length: 12 }, (_, i) => {
      const month = (i + 1).toString().padStart(2, '0');
      const found = monthly.find(m => m.month === month);
      return {
        month: month,
        total: found ? found.total : 0
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ROUTES BUDGETS ============

// Récupérer les budgets
app.get('/api/budgets', (req, res) => {
  try {
    const { month } = req.query;
    let query = `
      SELECT b.*, c.name as category_name, c.color as category_color
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
    `;
    const params = [];

    if (month) {
      query += ` WHERE b.month = ?`;
      params.push(month);
    }

    query += ` ORDER BY c.name`;

    const budgets = database.prepare(query).all(...params);
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer ou mettre à jour un budget
app.post('/api/budgets', (req, res) => {
  try {
    const { category_id, month, amount } = req.body;
    const stmt = database.prepare(`
      INSERT INTO budgets (category_id, month, amount)
      VALUES (?, ?, ?)
      ON CONFLICT(category_id, month) DO UPDATE SET amount = excluded.amount
    `);
    stmt.run(category_id, month, amount);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un budget
app.delete('/api/budgets/:id', (req, res) => {
  try {
    const stmt = database.prepare('DELETE FROM budgets WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ROUTES REVENUS ============

// Récupérer les revenus
app.get('/api/incomes', (req, res) => {
  try {
    const { month } = req.query;
    let query = 'SELECT * FROM incomes';
    const params = [];

    if (month) {
      query += ' WHERE month = ?';
      params.push(month);
    }

    query += ' ORDER BY created_at DESC';

    const incomes = database.prepare(query).all(...params);
    res.json(incomes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un revenu
app.post('/api/incomes', (req, res) => {
  try {
    const { amount, description, month } = req.body;
    const stmt = database.prepare('INSERT INTO incomes (amount, description, month) VALUES (?, ?, ?)');
    const result = stmt.run(amount, description || '', month);
    
    const income = database.prepare('SELECT * FROM incomes WHERE id = ?').get(result.lastInsertRowid);
    res.json(income);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Modifier un revenu
app.put('/api/incomes/:id', (req, res) => {
  try {
    const { amount, description, month } = req.body;
    const stmt = database.prepare('UPDATE incomes SET amount = ?, description = ?, month = ? WHERE id = ?');
    stmt.run(amount, description, month, req.params.id);
    
    const income = database.prepare('SELECT * FROM incomes WHERE id = ?').get(req.params.id);
    res.json(income);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un revenu
app.delete('/api/incomes/:id', (req, res) => {
  try {
    const stmt = database.prepare('DELETE FROM incomes WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Total des revenus pour une période
app.get('/api/incomes/total', (req, res) => {
  try {
    const { month } = req.query;
    let query = 'SELECT COALESCE(SUM(amount), 0) as total FROM incomes';
    const params = [];

    if (month) {
      query += ' WHERE month = ?';
      params.push(month);
    }

    const result = database.prepare(query).get(...params);
    res.json({ total: result.total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ EXPORT CSV ============

app.get('/api/export/csv', (req, res) => {
  try {
    const { month, year } = req.query;
    let query = `
      SELECT e.date, c.name as categorie, e.description, e.amount as montant
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (month && year) {
      query += ` AND strftime('%Y-%m', e.date) = ?`;
      params.push(`${year}-${month.padStart(2, '0')}`);
    } else if (year) {
      query += ` AND strftime('%Y', e.date) = ?`;
      params.push(year);
    }

    query += ` ORDER BY e.date DESC`;

    const expenses = database.prepare(query).all(...params);

    // Créer le CSV
    let csv = 'Date,Catégorie,Description,Montant\n';
    expenses.forEach(exp => {
      csv += `${exp.date},"${exp.categorie}","${exp.description || ''}",${exp.montant}\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=depenses.csv');
    res.send('\ufeff' + csv); // BOM pour Excel
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ROUTES PRETS (LOANS) ============

// Récupérer tous les prêts
app.get('/api/loans', (req, res) => {
  try {
    const loans = database.prepare('SELECT * FROM loans ORDER BY created_at DESC').all();

    // Pour chaque prêt, calculer remboursé, intérêt, solde et mensualité
    const enriched = loans.map(loan => {
      const rep = database.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM repayments WHERE loan_id = ?').get(loan.id);
      const totalRepaid = rep ? Number(rep.total) : 0;
      const principal = Number(loan.principal) || 0;
      const interestRate = Number(loan.interest_rate) || 0; // en %
      const interestTotal = principal * (interestRate / 100);
      const totalDue = principal + interestTotal;
      const balance = Math.max(totalDue - totalRepaid, 0);
      let monthly_payment = null;
      if (loan.term_months && Number(loan.term_months) > 0) {
        monthly_payment = totalDue / Number(loan.term_months);
      }

      return {
        ...loan,
        total_repaid: totalRepaid,
        interest_total: interestTotal,
        total_due: totalDue,
        balance: balance,
        monthly_payment: monthly_payment
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Créer un prêt
app.post('/api/loans', (req, res) => {
  try {
    const { principal, interest_rate, term_months, description } = req.body;
    const stmt = database.prepare('INSERT INTO loans (principal, interest_rate, term_months, description) VALUES (?, ?, ?, ?)');
    const result = stmt.run(principal, interest_rate || 0, term_months || null, description || '');
    const loan = database.prepare('SELECT * FROM loans WHERE id = ?').get(result.lastInsertRowid);
    // Créer automatiquement un revenu pour refléter l'argent reçu du prêt
    try {
      const month = new Date().toISOString().slice(0,7); // YYYY-MM
      const incomeStmt = database.prepare('INSERT INTO incomes (amount, description, month) VALUES (?, ?, ?)');
      incomeStmt.run(principal, `Prêt: ${description || ''}`.trim(), month);
    } catch (err) {
      console.error('Erreur création revenu lié au prêt:', err);
    }

    res.json(loan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remboursements pour un prêt
app.get('/api/loans/:id/repayments', (req, res) => {
  try {
    const repayments = database.prepare('SELECT * FROM repayments WHERE loan_id = ? ORDER BY date DESC').all(req.params.id);
    res.json(repayments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/loans/:id/repayments', (req, res) => {
  try {
    const { amount, date } = req.body;
    const stmt = database.prepare('INSERT INTO repayments (loan_id, amount, date) VALUES (?, ?, ?)');
    const result = stmt.run(req.params.id, amount, date);
    const repayment = database.prepare('SELECT * FROM repayments WHERE id = ?').get(result.lastInsertRowid);
    // Créer également une dépense pour ce remboursement afin qu'il apparaisse dans la liste des dépenses
    try {
      // chercher la catégorie 'Prêt' si elle existe
      let cat = database.prepare("SELECT id FROM categories WHERE name = ? OR name = ? LIMIT 1").get('Prêt', 'Pret');
      let category_id = cat ? cat.id : null;
      if (!category_id) {
        const first = database.prepare('SELECT id FROM categories LIMIT 1').get();
        category_id = first ? first.id : 1;
      }
      const expenseStmt = database.prepare('INSERT INTO expenses (amount, category_id, description, date) VALUES (?, ?, ?, ?)');
      expenseStmt.run(amount, category_id, `Remboursement prêt #${req.params.id}`, date);
    } catch (err) {
      console.error('Erreur création dépense liée au remboursement:', err);
    }

    res.json(repayment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un prêt et ses remboursements
app.delete('/api/loans/:id', (req, res) => {
  try {
    const loanId = req.params.id;
    // Supprimer les remboursements liés
    database.prepare('DELETE FROM repayments WHERE loan_id = ?').run(loanId);
    // Supprimer le prêt
    database.prepare('DELETE FROM loans WHERE id = ?').run(loanId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Démarrer le serveur avec gestion d'erreurs propre
const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📊 API disponible sur http://localhost:${PORT}/api`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`❌ Le port ${PORT} est déjà utilisé. Arrête le processus qui l'occupe ou démarre le serveur sur un autre port.`);
    console.error(`Tu peux tuer le processus qui écoute sur le port ${PORT} (PowerShell) :`);
    console.error(`  netstat -ano | Select-String ':${PORT}'  # trouver le PID\n  taskkill /PID <PID> /F`);
    console.error(`Ou utiliser npx kill-port ${PORT} puis relancer le serveur.`);
    process.exit(1);
  }
  console.error('Erreur serveur :', err);
  process.exit(1);
});
