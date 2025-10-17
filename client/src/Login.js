import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email et mot de passe requis');
      return;
    }
    if (mode === 'register') {
      if (!name) { setError('Nom requis pour l\'inscription'); return; }
      if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    }
    if (mode === 'register') {
      // Enregistrer user en localStorage (dev only)
      try {
        const users = JSON.parse(localStorage.getItem('mbongo_users') || '[]');
        if (users.find(u => u.email === email)) {
          setError('Un compte existe déjà pour cet email');
          return;
        }
        users.push({ email, password });
        localStorage.setItem('mbongo_users', JSON.stringify(users));
      } catch (e) {
        console.error('Erreur stockage users', e);
      }
    } else {
      // login : vérifier user local (dev only)
      try {
        const users = JSON.parse(localStorage.getItem('mbongo_users') || '[]');
        const found = users.find(u => u.email === email && u.password === password);
        if (!found) {
          setError('Identifiants invalides (ou créez un compte)');
          return;
        }
      } catch (e) {}
    }

    const token = btoa(`${email}:${password}`);
    try { localStorage.setItem('mbongo_token', token); } catch (e) {}
    onLogin && onLogin({ email, token });
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <div className="login-logo">Mb</div>
          <div>
            <div className="login-title">Mbongo</div>
            <div className="login-sub">Gérez facilement vos dépenses</div>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {mode === 'register' && (
          <label>
            Nom
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom" />
          </label>
        )}

        <label>
          Email
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" />
        </label>

        <label>
          Mot de passe
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="********" />
        </label>

        {mode === 'register' && (
          <label>
            Confirmer le mot de passe
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmez le mot de passe" />
          </label>
        )}

        <button type="submit">{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</button>

        <div style={{ display:'flex', justifyContent: 'space-between', alignItems:'center', marginTop: 8 }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>{mode === 'login' ? "Vous n'avez pas de compte ?" : 'Déjà un compte ?'}</div>
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} style={{ background: 'transparent', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight:700 }}>
            {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
          </button>
        </div>
      </form>
    </div>
  );
}
