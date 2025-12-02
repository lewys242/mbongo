import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PlusCircle, 
  TrendingDown, 
  Calendar, 
  PieChart as PieChartIcon,
  Download,
  Edit2,
  Trash2,
  DollarSign,
  Package,
  Home,
  Repeat,
  Smartphone,
  Folder,
  MoreHorizontal,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Pie, Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
ChartJS.register(ChartDataLabels);

const API_URL = 'http://localhost:5000/api';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ total: 0, count: 0, byCategory: [] });
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [globalStats, setGlobalStats] = useState({ total: 0, count: 0, byCategory: [] });
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState('month'); // 'month' ou 'year'

  // Auth (déclaré ici pour conserver l'ordre des hooks)
  const [user, setUser] = React.useState(() => {
    try { const t = localStorage.getItem('mbongo_token'); return t ? { token: t } : null; } catch { return null; }
  });

  const handleLogin = (u) => { setUser(u); };
  const handleLogout = () => { try { localStorage.removeItem('mbongo_token'); } catch {} ; setUser(null); };

  // Gestion des conseils de gestion
  const [showAdvice, setShowAdvice] = useState(false);

  // Gestion des revenus multiples
  const [incomes, setIncomes] = useState([]);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showIncomeSection, setShowIncomeSection] = useState(false);
  const [incomeForm, setIncomeForm] = useState({ amount: '', description: '', date: '' });
  const [editingIncome, setEditingIncome] = useState(null);

  // Statistiques des revenus par mois
  const [incomeStats, setIncomeStats] = useState({ total: 0, count: 0, bySource: [] });

  // Account / balance visibility
  const [showBalance, setShowBalance] = useState(true); // visible par défaut

  // Épargne
  const [savingsRate, setSavingsRate] = useState(() => {
    try { return Number(localStorage.getItem('savingsRate')) || 10; } catch { return 10; }
  }); // 10 ou 5
  const [savingsEnabled, setSavingsEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem('savingsEnabled')) ?? false; } catch { return false; }
  });

  const [formData, setFormData] = useState({
    amount: '',
    category_id: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  // Loans (prêts)
  const [loans, setLoans] = useState([]);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showLoanSection, setShowLoanSection] = useState(false);
  const [loanForm, setLoanForm] = useState({ principal: '', interest_rate: 0, term_months: '', description: '' });
  const [activeLoanRepayments, setActiveLoanRepayments] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  // Modal de remboursement avec meilleure gestion
  const [repaymentModal, setRepaymentModal] = useState({ isOpen: false, loan: null });
  const [repaymentForm, setRepaymentForm] = useState({ interestAmount: '', principalAmount: '' });

  // Modal détails catégorie
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState({ category: null, expenses: [] });

  // Gestion de la visibilité des détails de prêts
  const [hiddenLoanDetails, setHiddenLoanDetails] = useState(new Set());

  // Modal de confirmation pour tout vider
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [clearAllPassword, setClearAllPassword] = useState('');


  useEffect(() => {
    loadCategories();
    loadData();
    loadIncomes();
    loadLoans();
    loadGlobalStats();
    loadBalance(); // Charger le solde disponible
  }, [selectedMonth, selectedYear, viewMode]);

  useEffect(() => {
    try { localStorage.setItem('savingsEnabled', JSON.stringify(savingsEnabled)); } catch(e) {}
  }, [savingsEnabled]);

  useEffect(() => {
    try { localStorage.setItem('savingsRate', String(savingsRate)); } catch(e) {}
  }, [savingsRate]);

  // État pour le solde disponible
  const [balance, setBalance] = useState({
    totalIncomes: 0,
    totalLoansReceived: 0,
    totalExpenses: 0,
    availableBalance: 0
  });

  // Calculer le total des revenus SEULEMENT (pas les prêts)
  const getTotalIncome = () => {
    return incomes.reduce((total, income) => {
      const desc = (income.description || '').toLowerCase();
      // Ignorer les entrées créées automatiquement pour des prêts (ancien comportement)
      if (desc.includes('prêt') || desc.includes('pret')) return total;
      return total + Number(income.amount);
    }, 0);
  };

  // Charger le solde disponible (revenus + prêts - dépenses)
  const loadBalance = async () => {
    try {
      const res = await axios.get(`${API_URL}/balance`);
      setBalance(res.data);
    } catch (error) {
      console.error('Erreur chargement solde:', error);
    }
  };

  // Charger les statistiques globales (toutes les dépenses)
  const loadGlobalStats = async () => {
    try {
      const statsRes = await axios.get(`${API_URL}/stats`);
      console.log('Stats globales chargées:', statsRes.data);
      setGlobalStats(statsRes.data);
    } catch (error) {
      console.error('Erreur chargement stats globales:', error);
    }
  };

  // Calculer le montant total avec intérêts pour un prêt
  const calculateLoanTotal = (loan) => {
    const principal = Number(loan.principal) || 0;
    const interestRate = Number(loan.interest_rate) || 0;
    const interestTotal = principal * (interestRate / 100);
    return principal + interestTotal;
  };

  // Calculer la répartition intérêts/capital pour un prêt
  const calculateInterestAndPrincipalRemaining = (loan) => {
    // Si le serveur fournit déjà ces données, les utiliser
    if (loan.interest_remaining !== undefined) {
      return {
        totalInterest: loan.interest_total || 0,
        interestRemaining: loan.interest_remaining || 0,
        principalRemaining: loan.principal_remaining || 0,
        interestPaid: loan.interest_paid || 0,
        principalPaid: loan.principal_paid || 0
      };
    }
    
    // Sinon, calculer côté client (fallback)
    const principal = Number(loan.principal) || 0;
    const interestRate = Number(loan.interest_rate) || 0;
    const totalRepaid = Number(loan.total_repaid) || 0;
    const totalInterest = principal * (interestRate / 100);
    
    // Les intérêts sont remboursés en priorité
    const interestRemaining = Math.max(totalInterest - totalRepaid, 0);
    const principalRepaid = Math.max(totalRepaid - totalInterest, 0);
    const principalRemaining = Math.max(principal - principalRepaid, 0);
    
    return {
      totalInterest,
      interestRemaining,
      principalRemaining,
      interestPaid: totalInterest - interestRemaining,
      principalPaid: principalRepaid
    };
  };

  const savingsAmount = (() => {
    const totalIncome = getTotalIncome();
    if (!totalIncome) return 0;
    const rate = Number(savingsRate) || 0;
    return Math.round((totalIncome * (rate / 100)) * 100) / 100; // 2 déc
  })();

  // Formatage monétaire uniforme
  const formatCurrency = (value) => {
    const num = Number(value) || 0;
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num) + ' FCFA';
  };

  // Charger les revenus du mois sélectionné
  const loadIncomes = async () => {
    try {
      // Charger les revenus filtrés par mois sélectionné
      const params = { month: selectedMonth, year: selectedYear };
      const res = await axios.get(`${API_URL}/incomes`, { params });
      setIncomes(res.data);
      loadIncomeStats(res.data); // Calculer les stats des revenus
    } catch (error) {
      console.error('Erreur chargement revenus:', error);
    }
  };

  // Calculer les statistiques des revenus
  const loadIncomeStats = (incomesData) => {
    const totalAmount = incomesData.reduce((sum, income) => sum + Number(income.amount), 0);
    const count = incomesData.length;
    
    // Grouper par source (description)
    const bySource = incomesData.reduce((acc, income) => {
      const source = income.description || 'Sans description';
      const existing = acc.find(item => item.source === source);
      if (existing) {
        existing.amount += Number(income.amount);
        existing.count += 1;
      } else {
        acc.push({
          source,
          amount: Number(income.amount),
          count: 1
        });
      }
      return acc;
    }, []);

    setIncomeStats({
      total: totalAmount,
      count,
      bySource: bySource.sort((a, b) => b.amount - a.amount)
    });
  };

  // Ajouter ou modifier un revenu
  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    try {
      const month = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      if (editingIncome) {
        await axios.put(`${API_URL}/incomes/${editingIncome.id}`, { 
          amount: incomeForm.amount, 
          description: incomeForm.description,
          date: incomeForm.date,
          month 
        });
      } else {
        await axios.post(`${API_URL}/incomes`, { 
          amount: incomeForm.amount, 
          description: incomeForm.description,
          date: incomeForm.date,
          month 
        });
      }
      setShowIncomeModal(false);
      setEditingIncome(null);
      setIncomeForm({ amount: '', description: '', date: '' });
      loadIncomes();
      loadBalance(); // Recharger le solde après modification des revenus
    } catch (error) {
      console.error('Erreur sauvegarde revenu:', error);
      alert('Erreur lors de la sauvegarde du revenu');
    }
  };

  // Supprimer un revenu
  const handleDeleteIncome = async (incomeId) => {
    if (window.confirm('Supprimer ce revenu ?')) {
      try {
        await axios.delete(`${API_URL}/incomes/${incomeId}`);
        loadIncomes();
        loadBalance(); // Recharger le solde après suppression d'un revenu
      } catch (error) {
        console.error('Erreur suppression revenu:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  // Préparer la modification d'un revenu
  const handleEditIncome = (income) => {
    setEditingIncome(income);
    setIncomeForm({ 
      amount: income.amount, 
      description: income.description || '', 
      date: income.date || '' 
    });
    setShowIncomeModal(true);
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
      if (response.data.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: response.data[0].id }));
      }
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  };

  const loadData = async () => {
    try {
      const params = viewMode === 'month' 
        ? { month: selectedMonth, year: selectedYear }
        : { year: selectedYear };

      const [expensesRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/expenses`, { params }),
        axios.get(`${API_URL}/stats`, { params })
      ]);

      setExpenses(expensesRes.data);
      setStats(statsRes.data);

      if (viewMode === 'year') {
        const monthlyRes = await axios.get(`${API_URL}/stats/monthly/${selectedYear}`);
        setMonthlyStats(monthlyRes.data);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
          // Coerce types to expected formats
          const payload = {
            amount: Number(formData.amount),
            category_id: Number(formData.category_id),
            description: formData.description,
            date: formData.date
          };

          // Debug: log payload before sending
          console.log('Submitting expense payload:', payload);

          if (editingExpense) {
            await axios.put(`${API_URL}/expenses/${editingExpense.id}`, payload);
          } else {
            await axios.post(`${API_URL}/expenses`, payload);
          }
      setShowModal(false);
      setEditingExpense(null);
      setFormData({
        amount: '',
        category_id: categories[0]?.id || '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd')
      });
      loadData();
      loadGlobalStats(); // Recharger les stats globales
      loadBalance(); // Recharger le solde après modification des dépenses
    } catch (error) {
      // Afficher plus d'informations pour aider le debug
      const serverMsg = error && error.response && error.response.data ? JSON.stringify(error.response.data) : error.message || String(error);
      console.error('Erreur sauvegarde:', error, serverMsg);
      alert('Erreur lors de la sauvegarde: ' + serverMsg);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount,
      category_id: expense.category_id,
      description: expense.description || '',
      date: expense.date
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette dépense ?')) {
      try {
        await axios.delete(`${API_URL}/expenses/${id}`);
        loadData();
        loadGlobalStats(); // Recharger les stats globales
        loadBalance(); // Recharger le solde après suppression d'une dépense
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  };

  const loadLoans = async () => {
    try {
      const res = await axios.get(`${API_URL}/loans`);
      setLoans(res.data);
    } catch (err) {
      console.error('Erreur chargement prêts:', err);
    }
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/loans`, { ...loanForm });
      setLoans(prev => [res.data, ...prev]);
      setShowLoanModal(false);
      setLoanForm({ principal: '', interest_rate: 0, term_months: '', description: '' });
      // recharger revenus et dépenses
      loadIncomes();
      loadData();
      loadBalance(); // Recharger le solde après création d'un prêt
    } catch (err) {
      console.error('Erreur création prêt:', err);
    }
  };

  const loadRepayments = async (loanId) => {
    try {
      const res = await axios.get(`${API_URL}/loans/${loanId}/repayments`);
      setActiveLoanRepayments(res.data);
      setSelectedLoanId(loanId);
    } catch (err) {
      console.error('Erreur chargement remboursements:', err);
    }
  };

  const handleAddRepayment = async (loanId, amount, interestAmount = 0, principalAmount = 0) => {
    try {
      const date = format(new Date(), 'yyyy-MM-dd');
      await axios.post(`${API_URL}/loans/${loanId}/repayments`, { 
        amount, 
        date, 
        interest_amount: interestAmount, 
        principal_amount: principalAmount 
      });
      loadRepayments(loanId);
      // recharger dépenses et stats pour voir l'impact sur le solde
      loadData();
      loadGlobalStats(); // Recharger les stats globales
      loadLoans(); // Recharger les prêts pour mettre à jour les calculs
      loadIncomes(); // Recharger pour recalculer le solde
      loadBalance(); // Recharger le solde après remboursement
      
      // Fermer la modal et réinitialiser le formulaire
      setRepaymentModal({ isOpen: false, loan: null });
      setRepaymentForm({ interestAmount: '', principalAmount: '' });
    } catch (err) {
      console.error('Erreur ajout remboursement:', err);
    }
  };

  const openRepaymentModal = (loan) => {
    setRepaymentModal({ isOpen: true, loan });
    setRepaymentForm({ interestAmount: '', principalAmount: '' });
  };

  const handleRepaymentSubmit = () => {
    const breakdown = calculateInterestAndPrincipalRemaining(repaymentModal.loan);
    const interestAmount = Number(repaymentForm.interestAmount) || 0;
    const principalAmount = Number(repaymentForm.principalAmount) || 0;
    
    // Debug logs
    console.log('=== REPAYMENT DEBUG ===');
    console.log('Form values:', repaymentForm);
    console.log('Parsed amounts:', { interestAmount, principalAmount });
    console.log('Breakdown:', breakdown);
    
    // Validation plus souple avec tolérance pour les erreurs d'arrondi
    const tolerance = 0.01; // tolérance de 1 centime
    
    // Si il ne reste plus d'intérêts, forcer la valeur à 0
    if (breakdown.interestRemaining <= 0) {
      console.log('No interest remaining, forcing interest amount to 0');
      const forcedInterestAmount = 0;
      const forcedPrincipalAmount = principalAmount;
      const forcedTotalAmount = forcedPrincipalAmount;
      
      if (forcedPrincipalAmount <= 0) {
        alert('Vous devez saisir un montant de capital à rembourser !');
        return;
      }
      
      if (forcedPrincipalAmount > (breakdown.principalRemaining + tolerance)) {
        alert(`Montant capital invalide ! Doit être entre 0 et ${formatCurrency(breakdown.principalRemaining)}`);
        return;
      }
      
      console.log('Processing repayment with forced values:', { forcedInterestAmount, forcedPrincipalAmount, forcedTotalAmount });
      handleAddRepayment(repaymentModal.loan.id, forcedTotalAmount, forcedInterestAmount, Math.min(forcedPrincipalAmount, breakdown.principalRemaining));
      return;
    }
    
    if (interestAmount < 0 || interestAmount > (breakdown.interestRemaining + tolerance)) {
      console.log('Interest validation failed:', interestAmount, 'vs max', breakdown.interestRemaining);
      alert(`Montant intérêts invalide ! Doit être entre 0 et ${formatCurrency(breakdown.interestRemaining)}`);
      return;
    }
    
    if (principalAmount < 0 || principalAmount > (breakdown.principalRemaining + tolerance)) {
      console.log('Principal validation failed:', principalAmount, 'vs max', breakdown.principalRemaining);
      alert(`Montant capital invalide ! Doit être entre 0 et ${formatCurrency(breakdown.principalRemaining)}`);
      return;
    }
    
    const totalAmount = interestAmount + principalAmount;
    
    if (totalAmount === 0) {
      alert('Vous devez saisir au moins un montant !');
      return;
    }
    
    // Ajuster les montants pour ne pas dépasser les limites
    const adjustedInterestAmount = Math.min(interestAmount, breakdown.interestRemaining);
    const adjustedPrincipalAmount = Math.min(principalAmount, breakdown.principalRemaining);
    const adjustedTotalAmount = adjustedInterestAmount + adjustedPrincipalAmount;
    
    console.log('Final amounts:', { adjustedInterestAmount, adjustedPrincipalAmount, adjustedTotalAmount });
    
    handleAddRepayment(repaymentModal.loan.id, adjustedTotalAmount, adjustedInterestAmount, adjustedPrincipalAmount);
  };

  // Fonction pour gérer le double-clic sur le graphique
  const handlePieClick = async (event, elements) => {
    if (elements.length > 0) {
      const elementIndex = elements[0].index;
      const category = stats.byCategory[elementIndex];
      
      // Récupérer toutes les dépenses de cette catégorie
      try {
        const params = viewMode === 'month' 
          ? { month: selectedMonth, year: selectedYear, category_id: category.id }
          : { year: selectedYear, category_id: category.id };
          
        const response = await axios.get(`${API_URL}/expenses`, { params });
        
        setSelectedCategoryDetails({
          category: category,
          expenses: response.data
        });
        setShowCategoryModal(true);
      } catch (error) {
        console.error('Erreur chargement détails catégorie:', error);
      }
    }
  };



  // Basculer la visibilité des détails d'un prêt
  const toggleLoanDetails = (loanId) => {
    setHiddenLoanDetails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(loanId)) {
        newSet.delete(loanId);
      } else {
        newSet.add(loanId);
      }
      return newSet;
    });
  };

  // Fonction pour tout vider (toutes les dépenses)
  const handleClearAll = async () => {
    console.log('=== DEBUT TOUT VIDER ===');
    console.log('User:', user);
    console.log('Password saisi:', clearAllPassword);
    
    // Récupérer le mot de passe de l'utilisateur connecté
    let userPassword = '';
    try {
      if (user && user.token) {
        // Décoder le token pour récupérer le mot de passe
        const decoded = atob(user.token);
        console.log('Token décodé:', decoded);
        userPassword = decoded.split(':')[1];
        console.log('Mot de passe utilisateur:', userPassword);
      }
    } catch (e) {
      console.error('Erreur décodage token:', e);
      alert('Erreur d\'authentification. Veuillez vous reconnecter.');
      return;
    }
    
    if (clearAllPassword !== userPassword) {
      console.log('Mot de passe incorrect!', clearAllPassword, '!==', userPassword);
      alert('Mot de passe incorrect ! Accès refusé.');
      return;
    }

    console.log('Authentification réussie, début suppression...');

    try {
      // Récupérer toutes les dépenses (sans filtre de date)
      console.log('Récupération des dépenses...');
      const allExpensesRes = await axios.get(`${API_URL}/expenses`);
      console.log('Dépenses trouvées:', allExpensesRes.data.length);
      
      // Récupérer tous les revenus
      console.log('Récupération des revenus...');
      const allIncomesRes = await axios.get(`${API_URL}/incomes`);
      console.log('Revenus trouvés:', allIncomesRes.data.length);
      
      const totalItems = allExpensesRes.data.length + allIncomesRes.data.length;
      
      if (totalItems === 0) {
        alert('Aucune donnée à supprimer ! Votre base de données est déjà vide.');
        setShowClearAllModal(false);
        setClearAllPassword('');
        return;
      }
      
      // Supprimer toutes les dépenses une par une
      for (const expense of allExpensesRes.data) {
        console.log('Suppression dépense:', expense.id);
        await axios.delete(`${API_URL}/expenses/${expense.id}`);
      }
      
      // Supprimer tous les revenus un par un
      for (const income of allIncomesRes.data) {
        console.log('Suppression revenu:', income.id);
        await axios.delete(`${API_URL}/incomes/${income.id}`);
      }
      
      console.log('Toutes les données supprimées, rechargement...');
      
      // Recharger toutes les données
      loadData();
      loadGlobalStats();
      loadIncomes(); // Important pour recharger les revenus
      loadBalance(); // Recharger le solde après suppression totale
      
      // Fermer la modal et réinitialiser
      setShowClearAllModal(false);
      setClearAllPassword('');
      
      alert(`${allExpensesRes.data.length} dépense(s) et ${allIncomesRes.data.length} revenu(s) supprimé(s) avec succès.\nSolde disponible remis à 0 FCFA !`);
    } catch (error) {
      console.error('Erreur lors de la suppression totale:', error);
      alert('Erreur lors de la suppression totale des données.');
    }
  };

  // Enregistrer l'épargne maintenant en créant une dépense (si catégorie 'Epargne' existe)
  const handleSaveSavingsNow = async () => {
    const totalIncome = getTotalIncome();
    if (!totalIncome) {
      alert('Renseignez d\u2019abord vos revenus pour calculer le montant d\u2019\'\u00e9pargne.');
      return;
    }
    if (savingsAmount <= 0) {
      alert('Montant d\u2019\'\u00e9pargne invalide (0). Changez le taux ou ajoutez des revenus.');
      return;
    }
    // chercher une catégorie nommée 'Epargne' ou 'Épargne' (insensible à la casse)
    const cat = categories.find(c => (c.name || '').toLowerCase().replace(/\s+/g, '') === 'epargne' || (c.name || '').toLowerCase().replace(/\s+/g, '') === 'épargne');
    if (!cat) {
      alert('Aucune cat\u00e9gorie nomm\u00e9e "Epargne" trouv\u00e9e. Cr\u00e9ez une cat\u00e9gorie nomm\u00e9e "Epargne" ou modifiez une cat\u00e9gorie existante.');
      return;
    }
    try {
      const payload = {
        amount: savingsAmount,
        category_id: cat.id,
        description: 'Épargne mensuelle',
        date: format(new Date(), 'yyyy-MM-dd')
      };
      await axios.post(`${API_URL}/expenses`, payload);
      alert('Épargne enregistrée en dépense.');
      loadData();
    } catch (err) {
      console.error('Erreur enregistrement épargne:', err);
      alert('Erreur lors de l\'enregistrement de l\'épargne.');
    }
  };

  // Feedback réactif pour l'ajout/modification d'une dépense
  const getExpenseManagementStatus = (amountValue) => {
    const amount = Number(amountValue) || 0;
    const totalIncome = getTotalIncome();
    if (!totalIncome) {
      return { level: 'neutral', text: 'Revenus non renseignés — renseignez vos revenus pour un feedback précis.' };
    }
    let currentTotal = Number(stats.total) || 0;
    // Si on modifie une dépense existante, soustraire son ancien montant pour simuler le changement
    if (editingExpense) {
      currentTotal = currentTotal - (Number(editingExpense.amount) || 0);
    }
    const projected = currentTotal + amount;
    const pct = totalIncome > 0 ? (projected / totalIncome) * 100 : 0;

    if (projected <= totalIncome * 0.8) {
      return { level: 'good', text: `Bonne gestion — utilisation estimée ${Math.round(pct)}% des revenus.` };
    }
    if (projected <= totalIncome) {
      return { level: 'warning', text: `Attention — utilisation estimée ${Math.round(pct)}% des revenus. Surveillez vos postes non essentiels.` };
    }
    return { level: 'bad', text: `Mauvaise gestion — vos dépenses estimées (${projected.toFixed(2)} FCFA) dépassent les revenus (${totalIncome.toFixed(2)} FCFA).` };
  };

  const handleExport = async () => {
    try {
      const params = viewMode === 'month' 
        ? { month: selectedMonth, year: selectedYear }
        : { year: selectedYear };
      
      const response = await axios.get(`${API_URL}/export/csv`, { 
        params,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `depenses_${selectedYear}_${viewMode === 'month' ? selectedMonth : 'annee'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erreur export:', error);
    }
  };

  const pieData = {
    labels: stats.byCategory.map(c => c.name),
    datasets: [{
      data: stats.byCategory.map(c => c.total),
      backgroundColor: stats.byCategory.map(c => c.color),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const pieOptions = {
    plugins: {
      legend: { position: 'bottom' },
      datalabels: {
        color: '#fff',
        formatter: (value, context) => {
          const data = context.chart.data.datasets[0].data;
          const total = data.reduce((a, b) => a + b, 0);
          if (!total) return '';
          const pct = Math.round((value / total) * 100);
          return pct > 0 ? pct + '%' : '';
        },
        font: { weight: '700', size: 12 }
      }
    },
    onClick: handlePieClick
  };

  // Camembert revenus vs dépenses (si revenus renseignés)
  const incomePieData = (() => {
    const totalIncome = getTotalIncome();
    if (!totalIncome) return null;
    const used = Number(stats.total) || 0;
    const usedClamped = Math.min(used, totalIncome);
    const remaining = Math.max(totalIncome - usedClamped, 0);
    return {
      labels: ['Dépenses', 'Reste'],
      datasets: [{
        data: totalIncome > 0 ? [usedClamped, remaining] : [0, 0],
        backgroundColor: ['#ef4444', '#10b981'],
        borderColor: ['#fff', '#fff'],
        borderWidth: 2
      }]
    };
  })();

  const incomeUsedPercent = (() => {
    const totalIncome = getTotalIncome();
    if (!totalIncome) return 0;
    const used = Number(stats.total) || 0;
    if (totalIncome <= 0) return 0;
    return Math.min(100, Math.round((used / totalIncome) * 100));
  })();

  const managementTips = [
    'Priorisez les dépenses essentielles (logement, alimentation, factures).',
    'Fixez un budget par catégorie et respectez-le.',
    'Automatisez une épargne (même petite) dès la réception du salaire.',
    "Vérifiez les dépenses récurrentes et annulez les abonnements inutiles.",
    'Gardez une marge de sécurité (15–20%) pour les imprévus.'
  ];

  const lineData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [{
      label: 'Dépenses mensuelles',
      data: monthlyStats.map(m => m.total),
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  // Si l'utilisateur n'est pas connecté, afficher seulement la page de login
  if (!user) {
    const Login = require('./Login').default;
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <h1>💰 Mbongo</h1>
          <p>Gérez vos dépenses mensuelles et annuelles</p>
        </div>
        <div className="header-actions">
          <div className="user-badge">Connecté</div>
          <button className="btn btn-secondary" onClick={handleLogout}>Déconnexion</button>
        </div>
      </div>
      {/* Money card (inspired) */}
      <div className="money-card" style={{ marginBottom: '30px' }}>
          <div className="money-top">
            <div>
              <div style={{ fontSize: 12, opacity: 0.95 }}>Solde disponible</div>
              <div className="money-balance">{showBalance ? formatCurrency(balance.availableBalance) : '•••••••••'}</div>
              <div className="money-meta">Au {new Date().toLocaleString()}</div>
            </div>
            <div className="money-actions">
              <button title="Rafraîchir" className="icon-circle" onClick={() => { loadData(); loadIncomes(); loadGlobalStats(); loadBalance(); }}>
                <RefreshCw color="#fff" />
              </button>
              <button title={showBalance ? 'Masquer le solde' : 'Afficher le solde'} className="icon-circle" onClick={() => setShowBalance(s => !s)}>
                {showBalance ? <Eye color="#fff" /> : <EyeOff color="#fff" />}
              </button>
            </div>
          </div>
      </div>

      {/* Section Revenus multiples */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
             onClick={() => setShowIncomeSection(!showIncomeSection)}>
          <h2 style={{ margin: 0 }}>📊 Revenus de {selectedMonth}/{selectedYear}</h2>
          <span>{showIncomeSection ? '▼' : '▶'}</span>
        </div>
        
        {showIncomeSection && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, marginBottom: 16 }}>
              <button className="btn btn-primary" onClick={() => {
                setShowIncomeModal(true);
                setEditingIncome(null);
                setIncomeForm({ amount: '', description: '', date: '' });
              }}>
                Ajouter un revenu
              </button>
            </div>
            
            {incomes.length === 0 ? (
              <p>Aucun revenu enregistré pour {selectedMonth}/{selectedYear}</p>
            ) : (
              <div className="incomes-list">
                {incomes.map(income => (
                  <div key={income.id} className="income-item" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px', 
                    marginBottom: '8px',
                    background: '#f8f9fa'
                  }}>
                    <div>
                      <strong>{formatCurrency(income.amount)}</strong>
                      {income.description && (
                        <div style={{ fontSize: '0.9em', color: '#666' }}>{income.description}</div>
                      )}
                      {income.date && (
                        <div style={{ fontSize: '0.8em', color: '#888', marginTop: '4px' }}>
                          📅 {new Date(income.date).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEditIncome(income)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteIncome(income.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  background: '#e8f5e8', 
                  borderRadius: '8px', 
                  fontWeight: 'bold' 
                }}>
                  Total des revenus du mois: {formatCurrency(incomes.reduce((total, income) => total + Number(income.amount), 0))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filtres et actions */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '30px' }}>
        <div className="filters">
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
            <option value="month">Vue mensuelle</option>
            <option value="year">Vue annuelle</option>
          </select>
          
          {viewMode === 'month' && (
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
              {monthNames.map((name, idx) => (
                <option key={idx} value={idx + 1}>{name}</option>
              ))}
            </select>
          )}
          
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => {
              loadCategories();
              loadData();
              loadIncomes();
              loadLoans();
            }}>
            <RefreshCw size={18} />
            Actualiser
          </button>
          <button className="btn btn-danger" onClick={async () => {
              if (window.confirm('Êtes-vous sûr de vouloir supprimer TOUTES les dépenses de ce mois ?')) {
                try {
                  const params = { month: selectedMonth, year: selectedYear };
                  const expensesRes = await axios.get(`${API_URL}/expenses`, { params });
                  
                  for (const expense of expensesRes.data) {
                    await axios.delete(`${API_URL}/expenses/${expense.id}`);
                  }
                  
                  loadData();
                  loadGlobalStats(); // Recharger les stats globales
                  loadBalance(); // Recharger le solde après suppression mensuelle
                  alert('Toutes les dépenses ont été supprimées.');
                } catch (error) {
                  console.error('Erreur suppression:', error);
                  alert('Erreur lors de la suppression des dépenses.');
                }
              }
            }}>
            <Trash2 size={18} />
            Vider le mois
          </button>
          <button className="btn btn-danger" onClick={() => setShowClearAllModal(true)} style={{ background: '#dc3545', borderColor: '#dc3545' }}>
            <Trash2 size={18} />
            🔥 TOUT VIDER
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={18} />
            Exporter CSV
          </button>
          <button className="btn btn-primary" onClick={() => {
              setShowModal(true);
              setEditingExpense(null);
              setFormData({
                amount: '',
                category_id: categories[0]?.id || '',
                description: '',
                date: format(new Date(), 'yyyy-MM-dd')
              });
            }}>
            <PlusCircle size={18} />
            Nouvelle Dépense
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
            <TrendingDown size={28} />
          </div>
          <div className="stat-content">
            <h3>Total dépenses</h3>
            <p>{formatCurrency(stats.total)}</p>
          </div>
        </div>

        {getTotalIncome() > 0 && (
          <div className="stat-card">
            <div className="chart-container" style={{ width: 110, height: 110 }}>
              <Pie data={incomePieData} options={{ ...pieOptions, maintainAspectRatio: false, plugins: { ...pieOptions.plugins, legend: { display: false } } }} />
            </div>
            <div className="stat-content">
              <h3>Solde</h3>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{formatCurrency(balance.availableBalance)}</p>
              <p style={{ margin: 0 }}>{incomeUsedPercent}% utilisé</p>
            </div>
          </div>
        )}

        {/* Alerte si dépenses > revenus */}
        {getTotalIncome() > 0 && (globalStats.total > getTotalIncome()) && (
          <div className="stat-card" style={{ background: '#fff1f2', border: '1px solid #fecaca', color: '#7f1d1d' }}>
            <h3 style={{ marginTop: 0 }}>Mauvaise gestion détectée</h3>
            <p style={{ margin: '8px 0', textAlign: 'center' }}>
              Vos dépenses ({formatCurrency(globalStats.total)}) dépassent vos revenus ({formatCurrency(getTotalIncome())}).
              Ne paniquez pas — voici quelques conseils pour retrouver de la maîtrise.
            </p>
            <button className="btn btn-warning" onClick={() => setShowAdvice(prev => !prev)} style={{ marginBottom: 8 }}>
              {showAdvice ? 'Masquer les conseils' : 'Afficher les conseils de gestion'}
            </button>
            {showAdvice && (
              <div>
                <ul>
                  {managementTips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
                <p style={{ fontStyle: 'italic', marginTop: 8 }}>Conseil rassurant : commencez par de petites actions. Ajuster 1 ou 2 postes de dépense suffit souvent pour retrouver l'équilibre.</p>
              </div>
            )}
          </div>
        )}

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
            <Package size={28} />
          </div>
          <div className="stat-content">
            <h3>Transactions</h3>
            <p>{stats.count}</p>
          </div>
        </div>

        {/* Épargne recommandée (refactorisée) */}
  <div className="stat-card savings-card">
          <div className="stat-icon savings-icon" aria-hidden>
            <DollarSign size={28} />
          </div>
          <div className="stat-content savings-content">
            <h3 className="savings-title">Épargne recommandée</h3>
            <div className="savings-amount">{formatCurrency(savingsAmount)}</div>
            <div className="savings-sub">Basé sur {savingsRate}% du salaire</div>

            <div className="savings-controls" style={{ marginTop: 10 }}>
              <button type="button" className={`btn btn-sm ${savingsRate === 10 ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSavingsRate(10)}>10%</button>
              <button type="button" className={`btn btn-sm ${savingsRate === 5 ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSavingsRate(5)}>5%</button>
              <label className="toggle-switch" title={savingsEnabled ? 'Épargne activée' : 'Épargne désactivée'} style={{ marginLeft: 8 }}>
                <input type="checkbox" checked={savingsEnabled} onChange={() => setSavingsEnabled(s => !s)} />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="savings-actions" style={{ marginTop: 12 }}>
              <button className="btn btn-success btn-sm" onClick={handleSaveSavingsNow}>Enregistrer maintenant</button>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
            <Calendar size={28} />
          </div>
          <div className="stat-content">
            <h3>Période</h3>
            <p>{viewMode === 'month' ? monthNames[selectedMonth - 1] : selectedYear}</p>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      {getTotalIncome() > 0 && stats.byCategory.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'year' ? '1fr 1fr' : '1fr', gap: '20px', marginBottom: '30px' }}>
          <div className="card">
            <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChartIcon size={24} />
              Répartition par catégorie
            </h2>
            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>

          {viewMode === 'year' && (
            <div className="card">
              <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={24} />
                Évolution mensuelle
              </h2>
              <Line data={lineData} options={{ 
                responsive: true,
                plugins: { legend: { display: false } }
              }} />
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(false);
          setEditingExpense(null);
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>{editingExpense ? 'Modifier la dépense' : 'Nouvelle dépense'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Montant (FCFA)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              {/* Feedback dynamique */}
              <div style={{ marginTop: 8 }}>
                {(() => {
                  const status = getExpenseManagementStatus(formData.amount);
                  const color = status.level === 'good' ? '#16a34a' : status.level === 'warning' ? '#f59e0b' : status.level === 'bad' ? '#dc2626' : '#6b7280';
                  return (
                    <div style={{ padding: '8px', borderRadius: 6, background: '#ffffff', border: `1px solid ${color}` }}>
                      <strong style={{ color }}>{status.level === 'good' ? 'Bon' : status.level === 'warning' ? 'Attention' : status.level === 'bad' ? 'Mauvais' : 'Info'}</strong>
                      <div style={{ marginTop: 4 }}>{status.text}</div>
                    </div>
                  );
                })()}
              </div>

              <div className="input-group">
                <label>Catégorie</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Description (optionnel)</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingExpense ? 'Modifier' : 'Ajouter'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowModal(false);
                    setEditingExpense(null);
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal revenus */}
      {showIncomeModal && (
        <div className="modal-overlay" onClick={() => {
          setShowIncomeModal(false);
          setEditingIncome(null);
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingIncome ? 'Modifier le revenu' : 'Ajouter un revenu'}</h2>
            <form onSubmit={handleIncomeSubmit}>
              <div className="input-group">
                <label>Montant du revenu (FCFA)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Description</label>
                <input
                  type="text"
                  required
                  value={incomeForm.description}
                  onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                  placeholder="Ex: Salaire principal, Freelance, Prime..."
                />
              </div>
              <div className="input-group">
                <label>Date du revenu</label>
                <input
                  type="date"
                  required
                  value={incomeForm.date}
                  onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingIncome ? 'Modifier' : 'Ajouter'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowIncomeModal(false);
                    setEditingIncome(null);
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prêts et remboursements */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
             onClick={() => setShowLoanSection(!showLoanSection)}>
          <h2>Prêts</h2>
          <span>{showLoanSection ? '▼' : '▶'}</span>
        </div>
        
        {showLoanSection && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <button className="btn btn-primary" onClick={() => setShowLoanModal(true)}>Nouveau prêt</button>
            </div>

            {loans.length === 0 ? (
              <p>Aucun prêt enregistré</p>
            ) : (
              <ul className="loan-list">
                {loans.map(loan => (
                  <li key={loan.id} className="loan-item">
                    <div className="loan-main">
                      <div className="loan-info">
                        <div className="amount-display">
                          <strong style={{fontSize: '18px', color: '#2c3e50'}}>{formatCurrency(calculateLoanTotal(loan))}</strong>
                          <div style={{fontSize: '12px', color: '#7f8c8d', marginTop: '2px'}}>
                            {loan.description || 'Prêt'}
                          </div>
                        </div>
                        
                        {!hiddenLoanDetails.has(loan.id) && (
                          <>
                            <div style={{fontSize: '12px', color: '#7f8c8d', marginTop: '6px'}}>
                              Total dû (Capital: {formatCurrency(loan.principal)} + Intérêts: {formatCurrency(calculateLoanTotal(loan) - loan.principal)})
                            </div>
                            
                            <div style={{marginTop: '8px'}}>
                              <div style={{fontSize: '12px', color: '#7f8c8d', marginTop: '2px'}}>
                                Taux: {Number(loan.interest_rate).toFixed(2)}% · Durée: {loan.term_months} mois
                              </div>
                            </div>
                            
                            {(() => {
                              const breakdown = calculateInterestAndPrincipalRemaining(loan);
                              return (
                                <div style={{marginTop: '8px', fontSize: '12px', color: '#7f8c8d'}}>
                                  <div>🏦 Intérêts: {formatCurrency(breakdown.interestPaid)}/{formatCurrency(breakdown.totalInterest)} 
                                    <span style={{color: '#e74c3c', fontWeight: '500'}}> (Restant: {formatCurrency(breakdown.interestRemaining)})</span>
                                  </div>
                                  <div style={{marginTop: '2px'}}>💰 Capital: {formatCurrency(breakdown.principalPaid)}/{formatCurrency(loan.principal)}
                                    <span style={{color: '#e74c3c', fontWeight: '500'}}> (Restant: {formatCurrency(breakdown.principalRemaining)})</span>
                                  </div>
                                </div>
                              );
                            })()}
                            
                            {loan.monthly_payment && (
                              <div style={{marginTop: '6px', fontSize: '12px', color: '#7f8c8d'}}>
                                📅 Mensualité estimée: {formatCurrency(loan.monthly_payment)}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="loan-actions">
                        <button
                          onClick={() => toggleLoanDetails(loan.id)}
                          className="btn-sm edit-btn"
                          title={hiddenLoanDetails.has(loan.id) ? "Afficher les détails" : "Masquer les détails"}
                        >
                          {hiddenLoanDetails.has(loan.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => loadRepayments(loan.id)}
                          className="btn-sm edit-btn"
                          title="Voir les remboursements"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => setRepaymentModal({ isOpen: true, loan })}
                          className="btn-sm repay-btn"
                        >
                          Rembourser
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm('Supprimer ce prêt et tous ses remboursements ?')) {
                              try {
                                await axios.delete(`${API_URL}/loans/${loan.id}`);
                                // rafraîchir la liste
                                setLoans(prev => prev.filter(l => l.id !== loan.id));
                                if (selectedLoanId === loan.id) {
                                  setSelectedLoanId(null);
                                  setActiveLoanRepayments([]);
                                }
                                loadBalance(); // Recharger le solde après suppression d'un prêt
                              } catch (err) {
                                console.error('Erreur suppression prêt:', err);
                                alert('Erreur lors de la suppression');
                              }
                            }
                          }}
                          className="btn-sm delete-btn"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {selectedLoanId && !hiddenLoanDetails.has(selectedLoanId) && (
              <div style={{ marginTop: 12 }}>
                <h3>Remboursements</h3>
                {/* Détails du prêt sélectionné */}
                {(() => {
                  const loan = loans.find(l => l.id === selectedLoanId);
                  if (!loan) return null;
                  return (
                    <div style={{ marginBottom: 8 }}>
                      <div><strong>Prêt: {loan.description}</strong></div>
                      
                      <div style={{ marginTop: '8px' }}>
                        <div><strong>Capital:</strong> {formatCurrency(loan.principal)} | <strong>Taux:</strong> {Number(loan.interest_rate).toFixed(2)}%</div>
                        <div><strong>Total dû:</strong> {formatCurrency(calculateLoanTotal(loan))}</div>
                      </div>
                      
                      {(() => {
                        const breakdown = calculateInterestAndPrincipalRemaining(loan);
                        return (
                          <div style={{ marginTop: '8px' }}>
                            <div><strong>Intérêts:</strong> {formatCurrency(breakdown.interestPaid)} / {formatCurrency(breakdown.totalInterest)} <span style={{color: '#e74c3c'}}>(Restant: {formatCurrency(breakdown.interestRemaining)})</span></div>
                            <div><strong>Capital:</strong> {formatCurrency(breakdown.principalPaid)} / {formatCurrency(loan.principal)} <span style={{color: '#e74c3c'}}>(Restant: {formatCurrency(breakdown.principalRemaining)})</span></div>
                          </div>
                        );
                      })()}
                      {loan.monthly_payment && (
                        <div>Mensualité estimée: {formatCurrency(loan.monthly_payment)} / mois</div>
                      )}
                    </div>
                  );
                })()}
                {activeLoanRepayments.length === 0 ? <p>Aucun remboursement</p> : (
                  <ul>
                    {activeLoanRepayments.map(r => (
                      <li key={r.id}>{r.date} — {formatCurrency(r.amount)}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal création prêt */}
      {showLoanModal && (
        <div className="modal-overlay" onClick={() => setShowLoanModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouveau prêt</h2>
            <form onSubmit={handleCreateLoan}>
              <div className="input-group">
                <label>Montant principal (FCFA)</label>
                <input type="number" required value={loanForm.principal} onChange={(e) => setLoanForm({ ...loanForm, principal: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Taux d'intérêt (%)</label>
                <input type="number" value={loanForm.interest_rate} onChange={(e) => setLoanForm({ ...loanForm, interest_rate: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Durée (mois)</label>
                <input type="number" value={loanForm.term_months} onChange={(e) => setLoanForm({ ...loanForm, term_months: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Description</label>
                <input value={loanForm.description} onChange={(e) => setLoanForm({ ...loanForm, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary" type="submit">Créer</button>
                <button className="btn btn-secondary" type="button" onClick={() => setShowLoanModal(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal détails catégorie */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>
              {selectedCategoryDetails.category?.icon} Détails - {selectedCategoryDetails.category?.name}
            </h2>
            
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f3f4f6', borderRadius: '8px' }}>
              <strong>Total: {formatCurrency(selectedCategoryDetails.category?.total || 0)}</strong>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                {selectedCategoryDetails.expenses?.length || 0} transaction(s)
              </div>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {selectedCategoryDetails.expenses?.map((expense) => (
                <div key={expense.id} style={{ 
                  padding: '12px', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>{expense.description}</div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {format(new Date(expense.date), 'dd MMMM yyyy', { locale: fr })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontWeight: 'bold', color: '#ef4444' }}>
                      -{formatCurrency(expense.amount)}
                    </div>
                    <div>
                      <button 
                        onClick={() => {
                          setEditingExpense(expense);
                          setFormData({
                            amount: expense.amount,
                            category_id: expense.category_id,
                            description: expense.description,
                            date: expense.date
                          });
                          setShowCategoryModal(false);
                          setShowModal(true);
                        }}
                        style={{ marginRight: '4px', padding: '4px 8px', fontSize: '12px' }}
                        className="btn btn-primary"
                      >
                        <Edit2 size={12} /> Modifier
                      </button>
                      <button 
                        onClick={async () => {
                          if (window.confirm('Supprimer cette dépense ?')) {
                            await axios.delete(`${API_URL}/expenses/${expense.id}`);
                            loadData();
                            loadGlobalStats(); // Recharger les stats globales
                            loadBalance(); // Recharger le solde après suppression d'une dépense
                            setShowCategoryModal(false);
                          }
                        }}
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        className="btn btn-danger"
                      >
                        <Trash2 size={12} /> Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de remboursement */}
      {repaymentModal.isOpen && repaymentModal.loan && (
        <div className="modal-overlay" onClick={() => {
          setRepaymentModal({ isOpen: false, loan: null });
          setRepaymentForm({ interestAmount: '', principalAmount: '' });
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Remboursement - {repaymentModal.loan.description}</h2>
            {(() => {
              const breakdown = calculateInterestAndPrincipalRemaining(repaymentModal.loan);
              return (
                <div>
                  <div style={{ marginBottom: '20px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <div><strong>Informations du prêt :</strong></div>
                    <div>Capital: {formatCurrency(repaymentModal.loan.principal)} · Intérêt: {repaymentModal.loan.interest_rate}%</div>
                    <div>Intérêts restants: {formatCurrency(breakdown.interestRemaining)}</div>
                    <div>Capital restant: {formatCurrency(breakdown.principalRemaining)}</div>
                  </div>
                  
                  <div style={{ marginBottom: '15px', padding: '12px', background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px' }}>
                    <div style={{ fontSize: '14px', color: '#856404' }}>
                      <strong>💡 Information :</strong> Ce remboursement sera automatiquement enregistré comme une dépense dans la catégorie "Remboursement de prêt" et impactera votre solde disponible.
                    </div>
                  </div>
                  
                  <div className="input-group">
                    <label>Montant des intérêts à rembourser (max {formatCurrency(breakdown.interestRemaining)})</label>
                    <input 
                      type="number" 
                      value={repaymentForm.interestAmount} 
                      onChange={(e) => setRepaymentForm({...repaymentForm, interestAmount: e.target.value})}
                      placeholder="0"
                      max={breakdown.interestRemaining}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="input-group">
                    <label>Montant du capital à rembourser (max {formatCurrency(breakdown.principalRemaining)})</label>
                    <input 
                      type="number" 
                      value={repaymentForm.principalAmount} 
                      onChange={(e) => setRepaymentForm({...repaymentForm, principalAmount: e.target.value})}
                      placeholder="0"
                      max={breakdown.principalRemaining}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  {(repaymentForm.interestAmount || repaymentForm.principalAmount) && (
                    <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
                      <strong>Récapitulatif :</strong>
                      <div>Intérêts: {formatCurrency(Math.max(0, Number(repaymentForm.interestAmount) || 0))}</div>
                      <div>Capital: {formatCurrency(Math.max(0, Number(repaymentForm.principalAmount) || 0))}</div>
                      <div><strong>Total: {formatCurrency(Math.max(0, (Number(repaymentForm.interestAmount) || 0) + (Number(repaymentForm.principalAmount) || 0)))}</strong></div>
                    </div>
                  )}
                </div>
              );
            })()}
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setRepaymentModal({ isOpen: false, loan: null });
                  setRepaymentForm({ interestAmount: '', principalAmount: '' });
                }}
              >
                Annuler
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleRepaymentSubmit}
                style={{ flex: 1 }}
              >
                Confirmer le remboursement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation pour tout vider */}
      {showClearAllModal && (
        <div className="modal-overlay" onClick={() => setShowClearAllModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2 style={{ color: '#dc3545' }}>🔒 Authentification requise</h2>
            
            <div style={{ marginBottom: '20px', padding: '15px', background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#856404' }}>
                ⚠️ Cette action va supprimer TOUTES vos données de façon IRRÉVERSIBLE :
              </p>
              <ul style={{ margin: '8px 0 0 20px', color: '#856404' }}>
                <li>🗑️ <strong>Toutes les dépenses</strong> de tous les mois</li>
                <li>💰 <strong>Tous les revenus</strong></li>
                <li>📊 <strong>Solde disponible → 0 FCFA</strong></li>
              </ul>
            </div>
            
            <p>Veuillez saisir votre mot de passe de connexion pour confirmer cette remise à zéro complète :</p>
            
            <div className="input-group">
              <label>Mot de passe de votre compte :</label>
              <input 
                type="password" 
                value={clearAllPassword} 
                onChange={(e) => setClearAllPassword(e.target.value)}
                placeholder="Saisissez votre mot de passe de connexion"
                style={{ 
                  border: '1px solid #ddd',
                  background: 'white'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleClearAll();
                  }
                }}
              />
              <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                � Utilisez le même mot de passe que pour vous connecter à l'application
              </small>
            </div>
            
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowClearAllModal(false);
                  setClearAllPassword('');
                }}
                style={{ flex: 1 }}
              >
                Annuler
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleClearAll}
                disabled={!clearAllPassword}
                style={{ 
                  flex: 1,
                  opacity: clearAllPassword ? 1 : 0.5,
                  cursor: clearAllPassword ? 'pointer' : 'not-allowed'
                }}
              >
                🔥 REMISE À ZÉRO TOTALE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
