# Mbongo 💰

Application moderne de gestion des dépenses mensuelles et annuelles avec interface React et backend Node.js.

## Fonctionnalités

- ✅ Ajout, modification et suppression de dépenses
- 📊 Visualisation des dépenses par mois et par année
- 🎯 Gestion des catégories personnalisées
- 💵 Définition de budgets mensuels par catégorie
- 📈 Graphiques interactifs (camembert et courbes)
- 📥 Export des données en CSV
- 💾 Stockage local avec SQLite

## Technologies

- **Frontend**: React 18, Chart.js, Lucide Icons
- **Backend**: Node.js, Express
- **Base de données**: SQLite (better-sqlite3)
- **Styling**: CSS moderne avec animations

## Installation

### Prérequis
- Node.js 16+ et npm installés

### Étapes

1. **Installer toutes les dépendances** (backend + frontend):
```bash
npm run install-all
```

2. **Démarrer l'application** (serveur + client en mode développement):
```bash
npm run dev
```

Le serveur démarre sur `http://localhost:5000`  
Le client démarre sur `http://localhost:3000`

### Commandes alternatives

- **Démarrer uniquement le serveur**:
```bash
npm run server
```

- **Démarrer uniquement le client**:
```bash
npm run client
```

- **Build de production**:
```bash
npm run build
```

## Structure du projet

```
Mbongo/
├── server/
│   ├── index.js          # Serveur Express et API REST
│   └── database.js       # Configuration SQLite
├── client/
│   ├── public/
│   ├── src/
│   │   ├── App.js        # Composant principal
│   │   ├── index.js      # Point d'entrée React
│   │   └── index.css     # Styles globaux
│   └── package.json
├── package.json
└── README.md
```

## Utilisation

1. **Ajouter une dépense**: Cliquez sur "Nouvelle Dépense" et remplissez le formulaire
2. **Gérer les catégories**: Ajoutez des catégories personnalisées avec des couleurs
3. **Définir des budgets**: Fixez un budget mensuel pour chaque catégorie
4. **Visualiser**: Consultez les graphiques et statistiques par mois/année
5. **Exporter**: Téléchargez vos données en CSV

## Base de données

Les données sont stockées dans `budget.db` (créé automatiquement au premier lancement).

### Tables:
- **expenses**: Dépenses (montant, date, catégorie, description)
- **categories**: Catégories personnalisées (nom, couleur, icône)
- **budgets**: Budgets mensuels par catégorie

## Licence

MIT
