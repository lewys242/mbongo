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

  // Gestion du salaire
  const [salary, setSalary] = useState(null);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryForm, setSalaryForm] = useState({ amount: '', description: '' });
  const [editingSalary, setEditingSalary] = useState(null);
  const [showAdvice, setShowAdvice] = useState(false);

  // Account / balance visibility
  const [accountNumber, setAccountNumber] = useState(() => {
    try { return localStorage.getItem('mbongo_account') || '37307313112'; } catch { return '37307313112'; }
  });
  const [showBalance, setShowBalance] = useState(false); // masqué par défaut

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
  const [loanForm, setLoanForm] = useState({ principal: '', interest_rate: 0, term_months: '', description: '' });
  const [activeLoanRepayments, setActiveLoanRepayments] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState(null);


  useEffect(() => {
    loadCategories();
    loadData();
    loadSalary();
    loadLoans();
  }, [selectedMonth, selectedYear, viewMode]);

  useEffect(() => {
    try { localStorage.setItem('savingsEnabled', JSON.stringify(savingsEnabled)); } catch(e) {}
  }, [savingsEnabled]);

  useEffect(() => {
    try { localStorage.setItem('savingsRate', String(savingsRate)); } catch(e) {}
  }, [savingsRate]);

  const savingsAmount = (() => {
    if (!salary) return 0;
    const amt = Number(salary.amount) || 0;
    const rate = Number(savingsRate) || 0;
    return Math.round((amt * (rate / 100)) * 100) / 100; // 2 déc
  })();

  // Formatage monétaire uniforme
  const formatCurrency = (value) => {
    const num = Number(value) || 0;
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num) + ' FCFA';
  };
  // Charger le salaire du mois
  const loadSalary = async () => {
    try {
      const month = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      const res = await axios.get(`${API_URL}/incomes`, { params: { month } });
      setSalary(res.data.length > 0 ? res.data[0] : null);
    } catch (error) {
      console.error('Erreur chargement salaire:', error);
    }
  };

  // Ajouter ou modifier le salaire
  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    try {
      const month = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      if (editingSalary) {
        await axios.put(`${API_URL}/incomes/${editingSalary.id}`, { amount: salaryForm.amount, description: salaryForm.description, month });
      } else {
        await axios.post(`${API_URL}/incomes`, { amount: salaryForm.amount, description: salaryForm.description, month });
      }
      setShowSalaryModal(false);
      setEditingSalary(null);
      setSalaryForm({ amount: '', description: '' });
      loadSalary();
    } catch (error) {
      console.error('Erreur sauvegarde salaire:', error);
      alert('Erreur lors de la sauvegarde du salaire');
    }
  };

  // Préparer la modification du salaire
  const handleEditSalary = () => {
    if (salary) {
      setEditingSalary(salary);
      setSalaryForm({ amount: salary.amount, description: salary.description || '' });
      setShowSalaryModal(true);
    }
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
      loadSalary();
      loadData();
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

  const handleAddRepayment = async (loanId, amount) => {
    try {
      const date = format(new Date(), 'yyyy-MM-dd');
      await axios.post(`${API_URL}/loans/${loanId}/repayments`, { amount, date });
      loadRepayments(loanId);
      // recharger dépenses et stats
      loadData();
    } catch (err) {
      console.error('Erreur ajout remboursement:', err);
    }
  };

  // Enregistrer l'épargne maintenant en créant une dépense (si catégorie 'Epargne' existe)
  const handleSaveSavingsNow = async () => {
    if (!salary) {
      alert('Renseignez d\u2019abord votre salaire pour calculer le montant d\u2019\'\u00e9pargne.');
      return;
    }
    if (savingsAmount <= 0) {
      alert('Montant d\u2019\'\u00e9pargne invalide (0). Changez le taux ou le salaire.');
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
    if (!salary) {
      return { level: 'neutral', text: 'Salaire non renseigné — renseignez votre salaire pour un feedback précis.' };
    }
    const salaryAmount = Number(salary.amount) || 0;
    let currentTotal = Number(stats.total) || 0;
    // Si on modifie une dépense existante, soustraire son ancien montant pour simuler le changement
    if (editingExpense) {
      currentTotal = currentTotal - (Number(editingExpense.amount) || 0);
    }
    const projected = currentTotal + amount;
    const pct = salaryAmount > 0 ? (projected / salaryAmount) * 100 : 0;

    if (projected <= salaryAmount * 0.8) {
      return { level: 'good', text: `Bonne gestion — utilisation estimée ${Math.round(pct)}% du salaire.` };
    }
    if (projected <= salaryAmount) {
      return { level: 'warning', text: `Attention — utilisation estimée ${Math.round(pct)}% du salaire. Surveillez vos postes non essentiels.` };
    }
    return { level: 'bad', text: `Mauvaise gestion — vos dépenses estimées (${projected.toFixed(2)} FCFA) dépassent le salaire (${salaryAmount.toFixed(2)} FCFA).` };
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
    }
  };

  // Camembert salaire vs dépenses (si salaire renseigné)
  const salaryPieData = (() => {
    if (!salary) return null;
    const salaryAmount = Number(salary.amount) || 0;
    const used = Number(stats.total) || 0;
    const usedClamped = Math.min(used, salaryAmount);
    const remaining = Math.max(salaryAmount - usedClamped, 0);
    // Si salaire 0, éviter division par zéro
    return {
      labels: ['Dépenses', 'Reste'],
      datasets: [{
        data: salaryAmount > 0 ? [usedClamped, remaining] : [0, 0],
        backgroundColor: ['#ef4444', '#10b981'],
        borderColor: ['#fff', '#fff'],
        borderWidth: 2
      }]
    };
  })();

  const salaryUsedPercent = (() => {
    if (!salary) return 0;
    const salaryAmount = Number(salary.amount) || 0;
    const used = Number(stats.total) || 0;
    if (salaryAmount <= 0) return 0;
    return Math.min(100, Math.round((used / salaryAmount) * 100));
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

  // Control: show/hide expenses list
  const [showExpenses, setShowExpenses] = useState(false);

  return (
    <div className="container">
      {/* If not authenticated, show Login */}
      {!user ? (() => { const Login = require('./Login').default; return <Login onLogin={handleLogin} />; })() : null}

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
      <div className="money-card">
          <div className="money-top">
            <div>
              <div style={{ fontSize: 12, opacity: 0.95 }}>Solde disponible</div>
              <div className="money-balance">{showBalance ? formatCurrency(Math.max((Number(salary?.amount) || 0) - (Number(stats.total) || 0), 0)) : '•••••••••'}</div>
              <div className="money-meta">Au {new Date().toLocaleString()}</div>
            </div>
            <div className="money-actions">
              <button title="Rafraîchir" className="icon-circle" onClick={() => { loadData(); loadSalary(); }}>
                <RefreshCw color="#fff" />
              </button>
              <button title={showBalance ? 'Masquer le solde' : 'Afficher le solde'} className="icon-circle" onClick={() => setShowBalance(s => !s)}>
                {showBalance ? <Eye color="#fff" /> : <EyeOff color="#fff" />}
              </button>
            </div>
          </div>
          <div className="money-account">Numéro de compte {accountNumber.slice(0,3)} {accountNumber.slice(3,7)} {accountNumber.slice(-4)}</div>

        <div className="action-grid">
          <div className="action-tile">
            <div className="tile-icon">🏠</div>
            <div> Espace client</div>
            <small>Accès rapide</small>
          </div>
          <div className="action-tile">
            <div className="tile-icon">🐎</div>
            <div>Virements</div>
            <small>Transferts</small>
          </div>
          <div className="action-tile">
            <div className="tile-icon">📱</div>
            <div>Mobile Money</div>
            <small>BCI Mobile</small>
          </div>
          <div className="action-tile">
            <div className="tile-icon">📁</div>
            <div>Dossiers crédit</div>
            <small>Historique</small>
          </div>
          <div className="action-tile">
            <div className="tile-icon">⋯</div>
            <div>Autres menus</div>
            <small>Plus</small>
          </div>
        </div>
      </div>

      {/* Bloc salaire mensuel */}
  <div className="card" style={{ marginBottom: '20px', background: '#e0f7fa' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>Salaire du mois</h2>
            <p style={{ fontSize: '1.2em', fontWeight: 'bold', margin: 0 }}>
              {salary ? formatCurrency(salary.amount) : 'Non renseigné'}
            </p>
            {salary && salary.description && (
              <p style={{ fontStyle: 'italic', margin: 0 }}>{salary.description}</p>
            )}
          </div>
          <div>
            <button className="btn btn-primary" onClick={() => {
              if (salary) {
                handleEditSalary();
              } else {
                setShowSalaryModal(true);
                setEditingSalary(null);
                setSalaryForm({ amount: '', description: '' });
              }
            }}>
              {salary ? 'Modifier le salaire' : 'Ajouter un salaire'}
            </button>
          </div>
        </div>
      </div>

      {/* Filtres et actions */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
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
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
            <TrendingDown size={28} />
          </div>
          <div className="stat-content">
            <h3>Total dépenses</h3>
            <p>{formatCurrency(stats.total)}</p>
          </div>
        </div>

        {salary && (
          <div className="stat-card">
            <div className="chart-container" style={{ width: 110, height: 110 }}>
              <Pie data={salaryPieData} options={{ ...pieOptions, maintainAspectRatio: false, plugins: { ...pieOptions.plugins, legend: { display: false } } }} />
            </div>
            <div className="stat-content">
              <h3>Solde</h3>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{formatCurrency(Math.max((Number(salary.amount) || 0) - (Number(stats.total) || 0), 0))}</p>
              <p style={{ margin: 0 }}>{salaryUsedPercent}% utilisé</p>
            </div>
          </div>
        )}

        {/* Alerte si dépenses > salaire */}
        {salary && (Number(stats.total) > Number(salary.amount)) && (
          <div className="card" style={{ background: '#fff1f2', border: '1px solid #fecaca', color: '#7f1d1d' }}>
            <h3 style={{ marginTop: 0 }}>Mauvaise gestion détectée</h3>
            <p style={{ margin: '8px 0' }}>
              Vos dépenses ({formatCurrency(stats.total)}) dépassent votre salaire ({formatCurrency(salary.amount)}).
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
      {stats.byCategory.length > 0 && (
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

      {/* Liste des dépenses (toggle) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Liste des dépenses</h2>
        <div>
          <button className="btn btn-secondary" onClick={() => setShowExpenses(s => !s)}>
            {showExpenses ? 'Masquer' : 'Afficher'} les dépenses
          </button>
        </div>
      </div>

      {showExpenses && (
        <div className="card">
          {expenses.length === 0 ? (
            <div className="empty-state">
              <Package size={64} />
              <h3>Aucune dépense</h3>
              <p>Ajoutez votre première dépense pour commencer</p>
            </div>
          ) : (
            <ul className="expense-list">
              {expenses.map(expense => (
                <li key={expense.id} className="expense-item">
                  <div className="expense-info">
                    <h4>
                      <span className="category-badge" style={{ background: expense.category_color + '20', color: expense.category_color }}>
                        {expense.category_icon} {expense.category_name}
                      </span>
                      {expense.description || 'Sans description'}
                    </h4>
                    <p>{format(new Date(expense.date), 'dd MMMM yyyy', { locale: fr })}</p>
                  </div>
                  <div className="expense-amount">{formatCurrency(expense.amount)}</div>
                  <div className="expense-actions">
                    <button className="icon-btn" onClick={() => handleEdit(expense)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="icon-btn" onClick={() => handleDelete(expense.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
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

      {/* Modal salaire */}
      {showSalaryModal && (
        <div className="modal-overlay" onClick={() => {
          setShowSalaryModal(false);
          setEditingSalary(null);
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingSalary ? 'Modifier le salaire' : 'Ajouter un salaire'}</h2>
            <form onSubmit={handleSalarySubmit}>
              <div className="input-group">
                <label>Montant du salaire (FCFA)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={salaryForm.amount}
                  onChange={(e) => setSalaryForm({ ...salaryForm, amount: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Description (optionnel)</label>
                <textarea
                  rows="2"
                  value={salaryForm.description}
                  onChange={(e) => setSalaryForm({ ...salaryForm, description: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingSalary ? 'Modifier' : 'Ajouter'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowSalaryModal(false);
                    setEditingSalary(null);
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
        <h2>Prêts</h2>
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
                    <strong className="loan-title">{loan.description || 'Prêt'}</strong>
                    <div className="loan-meta">Montant: {formatCurrency(loan.principal)} · Intérêt: {Number(loan.interest_rate).toFixed(2)}%</div>
                    <div className="loan-meta">Remboursé: {formatCurrency(loan.total_repaid || 0)} · Solde restant: {formatCurrency(loan.balance || 0)}</div>
                    {loan.monthly_payment && (
                      <div className="loan-meta">Mensualité estimée: {formatCurrency(loan.monthly_payment)} / mois</div>
                    )}
                  </div>
                  <div className="loan-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => loadRepayments(loan.id)}>Voir</button>
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      const montant = prompt('Montant du remboursement (FCFA)');
                      if (montant) handleAddRepayment(loan.id, Number(montant));
                    }}>Rembourser</button>
                    <button className="btn btn-danger btn-sm" onClick={async () => {
                      if (window.confirm('Supprimer ce prêt et tous ses remboursements ?')) {
                        try {
                          await axios.delete(`${API_URL}/loans/${loan.id}`);
                          // rafraîchir la liste
                          setLoans(prev => prev.filter(l => l.id !== loan.id));
                          if (selectedLoanId === loan.id) {
                            setSelectedLoanId(null);
                            setActiveLoanRepayments([]);
                          }
                        } catch (err) {
                          console.error('Erreur suppression prêt:', err);
                          alert('Erreur lors de la suppression');
                        }
                      }
                    }}>Supprimer</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {selectedLoanId && (
          <div style={{ marginTop: 12 }}>
            <h3>Remboursements</h3>
            {/* Détails du prêt sélectionné */}
            {(() => {
              const loan = loans.find(l => l.id === selectedLoanId);
              if (!loan) return null;
              return (
                <div style={{ marginBottom: 8 }}>
                  <div>Montant: {formatCurrency(loan.principal)} · Intérêt: {Number(loan.interest_rate).toFixed(2)}%</div>
                  <div>Remboursé: {formatCurrency(loan.total_repaid || 0)} · Solde restant: {formatCurrency(loan.balance || 0)}</div>
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
    </div>
  );
}

export default App;
