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
      {/* Ajout de la couche de motifs monétaires */}
      <div className="money-pattern-overlay"></div>
      
      {/* Symboles monétaires animés */}
      <div className="money-symbols">
        <div className="symbol symbol-1">$</div>
        <div className="symbol symbol-2">€</div>
        <div className="symbol symbol-3">£</div>
        <div className="symbol symbol-4">¥</div>
        <div className="symbol symbol-5">₹</div>
        <div className="symbol symbol-6 symbol-fcfa">FCFA</div>
        <div className="symbol symbol-7">₿</div>
        <div className="symbol symbol-8">₸</div>
        <div className="symbol symbol-9">₼</div>
        <div className="symbol symbol-10">₨</div>
        <div className="symbol symbol-11">₺</div>
        <div className="symbol symbol-12">₽</div>
        <div className="symbol symbol-13">₩</div>
        <div className="symbol symbol-14">₫</div>
        <div className="symbol symbol-15">₴</div>
        <div className="symbol symbol-16">💰</div>
        <div className="symbol symbol-17">💎</div>
        <div className="symbol symbol-18">🪙</div>
      </div>
      
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">M</div>
          <div>
            <div className="login-title">Mbongo</div>
            <div className="login-sub">Gérez facilement vos dépenses</div>
          </div>
        </div>
        
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
              placeholder="••••••"
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
                placeholder="••••••"
                required
              />
            </div>
          )}
          
          <button type="submit">
            {mode === 'login' ? 'Se connecter' : 'Créer un compte'}
          </button>
          
          {error && <div className="error">{error}</div>}
          
          <div style={{ textAlign: 'center', marginTop: '20px', color: '#64748b' }}>
            {mode === 'login' ? (
              <>
                Pas de compte ?{' '}
                <span onClick={() => setMode('register')} style={{ color: '#4CAF50', cursor: 'pointer', fontWeight: '600' }}>
                  Créer un compte
                </span>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <span onClick={() => setMode('login')} style={{ color: '#4CAF50', cursor: 'pointer', fontWeight: '600' }}>
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
