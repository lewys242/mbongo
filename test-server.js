const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api/loans', (req, res) => {
  try {
    console.log('Requête reçue pour /api/loans');
    
    // Données de test
    const testLoan = {
      id: 3,
      principal: 250000,
      interest_rate: 25,
      term_months: 2,
      description: "pret kouka",
      created_at: "2025-11-08 16:00:23"
    };

    // Calculs
    const totalRepaid = 0;
    const principal = Number(testLoan.principal) || 0;
    const interestRate = Number(testLoan.interest_rate) || 0;
    const interestTotal = principal * (interestRate / 100);
    const totalDue = principal + interestTotal;
    const balance = Math.max(totalDue - totalRepaid, 0);
    const monthly_payment = totalDue / Number(testLoan.term_months);

    const result = {
      ...testLoan,
      total_repaid: totalRepaid,
      interest_total: interestTotal,
      total_due: totalDue,
      balance: balance,
      monthly_payment: monthly_payment
    };

    console.log('Résultat:', JSON.stringify(result, null, 2));
    res.json([result]);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(5001, () => {
  console.log('🔧 Serveur de test sur http://localhost:5001');
});