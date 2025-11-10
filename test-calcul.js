// Test simple des calculs
const principal = 250000;
const interestRate = 25; // en %
const interestTotal = principal * (interestRate / 100);
const totalDue = principal + interestTotal;

console.log('=== Test de calcul des intérêts ===');
console.log(`Principal: ${principal} FCFA`);
console.log(`Taux d'intérêt: ${interestRate}%`);
console.log(`Intérêts totaux: ${interestTotal} FCFA`);
console.log(`Total dû: ${totalDue} FCFA`);

// Test avec les vraies valeurs de la base
const testLoan = {
  principal: 250000,
  interest_rate: 25,
  term_months: 2,
  description: "pret kouka"
};

const p = Number(testLoan.principal) || 0;
const ir = Number(testLoan.interest_rate) || 0;
const it = p * (ir / 100);
const td = p + it;

console.log('\n=== Test avec objet loan ===');
console.log(`Principal: ${p}`);
console.log(`Interest Rate: ${ir}%`);
console.log(`Interest Total: ${it}`);
console.log(`Total Due: ${td}`);

const result = {
  ...testLoan,
  total_repaid: 0,
  interest_total: it,
  total_due: td,
  balance: td,
  monthly_payment: td / Number(testLoan.term_months)
};

console.log('\n=== Résultat final ===');
console.log(JSON.stringify(result, null, 2));