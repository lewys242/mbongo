# Mbongo - Instructions pour Agents IA

## Architecture du Projet

**Mbongo** est une application full-stack de gestion des finances personnelles (dépenses, revenus, prêts, épargne) avec:
- **Frontend**: React 18 (CRA) avec Chart.js pour visualisations - port 3000
- **Backend**: Express.js avec API REST - port 5000
- **Base de données**: SQLite via better-sqlite3 (`budget.db` à la racine)

### Structure des Dossiers
```
mbongo/
├── client/          # Application React
│   └── src/
│       ├── App.js   # Composant monolithique principal (~1700 lignes)
│       └── index.css # Tous les styles CSS
├── server/          # API Express
│   ├── index.js            # Routes API principales
│   ├── database-better.js  # Module DB actif (better-sqlite3)
│   ├── database.js         # Module DB legacy (sql.js - non utilisé)
│   └── init-database.js    # Script initialisation données exemple
└── budget.db        # Fichier SQLite créé automatiquement
```

## Base de Données (SQLite)

**Important**: Le serveur utilise `database-better.js` (better-sqlite3), PAS `database.js` (sql.js).

### Tables Principales
- `categories` - Catégories de dépenses (50+ catégories pré-créées)
- `expenses` - Transactions de dépenses avec FK vers categories
- `incomes` - Revenus mensuels (stockage: `month` format YYYY-MM)
- `budgets` - Budgets mensuels par catégorie (contrainte UNIQUE sur category_id+month)
- `loans` - Prêts avec taux d'intérêt et durée
- `repayments` - Remboursements de prêts

### Patterns de Requêtes
```javascript
// Filtrage par date: utiliser strftime
WHERE strftime('%Y-%m', date) = '2025-11'

// JOINs avec catégories: toujours inclure color/icon
SELECT e.*, c.name as category_name, c.color, c.icon
FROM expenses e JOIN categories c ON e.category_id = c.id

// Budgets: UPSERT pattern
INSERT INTO budgets (category_id, month, amount)
VALUES (?, ?, ?)
ON CONFLICT(category_id, month) DO UPDATE SET amount = excluded.amount
```

## API Backend (`server/index.js`)

### Conventions d'Endpoint
- Routes organisées par ressource avec commentaires `// ============ ROUTES XXX ============`
- Format de réponse: JSON direct (ex: `res.json(expenses)`)
- Gestion erreurs: try-catch simple avec `res.status(500).json({ error: error.message })`
- Pas d'authentification/autorisation implémentée

### Paramètres Query Importants
- `GET /api/expenses?month=11&year=2025&category_id=3` - Filtrage dépenses
- `GET /api/incomes?month=2025-11` - Format YYYY-MM pour revenus
- `GET /api/stats?month=11&year=2025` - Statistiques filtrées

## Frontend React (`client/src/App.js`)

### Architecture Monolithique
- **Un seul composant** contenant toute la logique (~1700 lignes)
- Pas de composants séparés ou routing
- 20+ useState pour gérer l'état global

### Patterns d'État Clés
```javascript
// Modes d'affichage
viewMode: 'month' | 'year'  // Bascule vues mensuelle/annuelle

// Modales de formulaires
showModal, showIncomeModal, showLoanModal, repaymentModal

// Édition inline
editingExpense, editingIncome  // Objet complet ou null

// Visibilité conditionnelle
showBalance, showIncomeSection, showLoanSection  // Toggles UI
```

### Gestion des Formulaires
- Forms contrôlés avec objets d'état dédiés: `formData`, `incomeForm`, `loanForm`
- Réinitialisation: spread vide ou valeurs par défaut après soumission
- Édition: charger l'objet complet dans le form state

### Appels API avec Axios
```javascript
const API_URL = 'http://localhost:5000/api';

// Pattern standard
const response = await axios.get(`${API_URL}/expenses`, {
  params: { month, year, category_id }
});
setExpenses(response.data);
```

## Commandes de Développement

**Depuis la racine (`mbongo/`)** - les scripts npm root ne fonctionnent pas actuellement:
```bash
# Démarrer serveur backend
cd server; node index.js

# Démarrer client React (nouveau terminal)
cd client; npm start

# Initialiser DB avec données exemple
cd server; node init-database.js
```

**Note**: Les scripts `npm run dev`, `npm run server`, `npm run client` à la racine ne sont pas fonctionnels. Utiliser les commandes directes ci-dessus.

## Conventions de Code

### Backend
- Utiliser `database.prepare(query)` puis `.run()`, `.get()`, `.all()`
- Pas de middleware de validation - validation implicite dans les routes
- Logs console avec emojis: `console.log('✅ Message')`

### Frontend
- Imports Lucide React pour icônes: `import { Icon } from 'lucide-react'`
- Chart.js avec plugin datalabels pour étiquettes sur graphiques
- Format dates avec date-fns: `format(date, 'yyyy-MM-dd', { locale: fr })`
- Classes CSS utilitaires dans `index.css` (pas de CSS modules)

### Styles
- Toutes les règles CSS dans `client/src/index.css` (~2000+ lignes)
- Modales: classe `.modal-overlay` + `.modal-content`
- Animations: transitions CSS définies pour hover/focus
- Thème: couleurs dans variables CSS (vert principal: #10b981)

## Points d'Intégration Critiques

### Épargne Automatique
- Activé via `savingsEnabled` (localStorage)
- Taux: `savingsRate` (10% ou 5%)
- Calcul côté client lors de l'ajout de revenus

### Prêts et Remboursements
- Calcul des intérêts: `(principal * (interest_rate/100) * term_months) / 12`
- Remboursements: peuvent inclure `interest_amount` + `principal_amount` séparés
- Affichage du solde restant: principal - somme(principal_amount des repayments)

### Authentification (Vestige)
- Code d'auth présent mais non implémenté
- `user` state et localStorage `mbongo_token` existent mais non utilisés
- Routes API non protégées

## Pièges Courants

1. **Double module DB**: Ne PAS modifier `database.js`, utiliser `database-better.js`
2. **Format mois incomes**: Utiliser `YYYY-MM` (ex: '2025-11'), pas juste '11'
3. **Catégories multiples**: 50+ catégories par défaut - vérifier existence avant insertion
4. **Props drilling**: Tout est dans App.js - pas de context API
5. **budget.db location**: À la racine du projet, pas dans `server/`

## Tâches de Développement Typiques

### Ajouter une Route API
1. Trouver section commentée appropriée dans `server/index.js`
2. Ajouter route avec try-catch standard
3. Utiliser `database.prepare()` pour requêtes
4. Retourner JSON avec `res.json()`

### Ajouter Fonctionnalité Frontend
1. Ajouter useState dans `App.js` (avec les 20+ existants)
2. Créer fonction handler au même niveau
3. Ajouter élément UI dans le JSX (~ligne 500+)
4. Ajouter styles dans `client/src/index.css`

### Modifier Schéma DB
1. Pas de migrations - éditer `server/database.js` (section CREATE TABLE)
2. Supprimer `budget.db` et relancer le serveur pour recréer
3. OU exécuter `node server/init-database.js` pour réinitialiser avec données exemple
