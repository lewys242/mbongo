import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email et mot de passe requis');
      return;
    }
    if (mode === 'register') {
      if (!name) { setError('Nom requis'); return; }
      if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    }
    
    const token = btoa(`${email}:${password}`);
    localStorage.setItem('mbongo_token', token);
    onLogin && onLogin({ email, token });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2> Mbongo</h2>
        <p>Gérez facilement vos dépenses</p>
        
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                required
              />
            </div>
          )}
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@exemple.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
              required
            />
          </div>
          
          {mode === 'register' && (
            <div className="form-group">
              <label>Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder=""
                required
              />
            </div>
          )}
          
          <button type="submit">
            {mode === 'login' ? 'Se connecter' : 'Créer un compte'}
          </button>
          
          {error && <div className="error">{error}</div>}
          
          <div style={{ textAlign: 'center', marginTop: '20px', color: 'rgba(255,255,255,0.7)' }}>
            {mode === 'login' ? (
              <>
                Pas de compte ?{' '}
                <span onClick={() => setMode('register')} style={{ color: '#ffd700', cursor: 'pointer' }}>
                  Créer un compte
                </span>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <span onClick={() => setMode('login')} style={{ color: '#ffd700', cursor: 'pointer' }}>
                  Se connecter
                </span>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
