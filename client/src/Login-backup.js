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
      <div className="login-container">
        <h2>💰 Mbongo</h2>
        <p>Gérez facilement vos dépenses</p>
        
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom complet"
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
              placeholder="••••••••"
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
                placeholder="••••••••"
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
                Vous n'avez pas de compte ?{' '}
                <span 
                  onClick={() => setMode('register')} 
                  style={{ color: '#ffd700', cursor: 'pointer', fontWeight: '500' }}
                >
                  Créer un compte
                </span>
              </>
            ) : (
              <>
                Vous avez déjà un compte ?{' '}
                <span 
                  onClick={() => setMode('login')} 
                  style={{ color: '#ffd700', cursor: 'pointer', fontWeight: '500' }}
                >
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
        <span className="symbol symbol-7">💰</span>
        <span className="symbol symbol-8">💎</span>
        <span className="symbol symbol-9">💵</span>
        <span className="symbol symbol-10">🪙</span>
        <span className="symbol symbol-11">$</span>
        <span className="symbol symbol-12">€</span>
        <span className="symbol symbol-13">£</span>
        <span className="symbol symbol-14">¥</span>
        <span className="symbol symbol-15">₹</span>
        
        {/* Deuxième vague de symboles */}
        <span className="symbol symbol-16">₽</span>
        <span className="symbol symbol-17">₩</span>
        <span className="symbol symbol-18">₪</span>
        <span className="symbol symbol-19">₦</span>
        <span className="symbol symbol-20">₸</span>
        <span className="symbol symbol-21">💸</span>
        <span className="symbol symbol-22">💳</span>
        <span className="symbol symbol-23">🏦</span>
        <span className="symbol symbol-24">💴</span>
        <span className="symbol symbol-25">💶</span>
        <span className="symbol symbol-26">💷</span>
        <span className="symbol symbol-27">$</span>
        <span className="symbol symbol-28">€</span>
        <span className="symbol symbol-29">£</span>
        <span className="symbol symbol-30">¥</span>
        
        {/* Troisième vague de symboles */}
        <span className="symbol symbol-31">💰</span>
        <span className="symbol symbol-32">💎</span>
        <span className="symbol symbol-33">🪙</span>
        <span className="symbol symbol-34">₿</span>
        <span className="symbol symbol-35">$</span>
        <span className="symbol symbol-36">€</span>
        <span className="symbol symbol-37">₹</span>
        <span className="symbol symbol-38">¥</span>
        <span className="symbol symbol-39">£</span>
        <span className="symbol symbol-40">₽</span>
        
        {/* Quatrième vague - avec FCFA et plus de symboles */}
        <span className="symbol symbol-fcfa symbol-41">FCFA</span>
        <span className="symbol symbol-42">💵</span>
        <span className="symbol symbol-43">💸</span>
        <span className="symbol symbol-44">₨</span>
        <span className="symbol symbol-45">₺</span>
        <span className="symbol symbol-46">₫</span>
        <span className="symbol symbol-47">₴</span>
        <span className="symbol symbol-48">₱</span>
        <span className="symbol symbol-49">₡</span>
        <span className="symbol symbol-50">₮</span>
        <span className="symbol symbol-51">₭</span>
        <span className="symbol symbol-52">₯</span>
        <span className="symbol symbol-53">₰</span>
        <span className="symbol symbol-54">₲</span>
        <span className="symbol symbol-55">₳</span>
        
        {/* Cinquième vague - encore plus de variété */}
        <span className="symbol symbol-56">$</span>
        <span className="symbol symbol-57">€</span>
        <span className="symbol symbol-58">£</span>
        <span className="symbol symbol-59">¥</span>
        <span className="symbol symbol-fcfa symbol-60">FCFA</span>
        <span className="symbol symbol-61">💰</span>
        <span className="symbol symbol-62">💎</span>
        <span className="symbol symbol-63">🪙</span>
        <span className="symbol symbol-64">💴</span>
        <span className="symbol symbol-65">💶</span>
        <span className="symbol symbol-66">💷</span>
        <span className="symbol symbol-67">💸</span>
        <span className="symbol symbol-68">💳</span>
        <span className="symbol symbol-69">🏦</span>
        <span className="symbol symbol-70">₿</span>
        
        {/* Gros symboles aux coins - ajout de FCFA */}
        <span className="symbol symbol-big symbol-big-1">💰</span>
        <span className="symbol symbol-big symbol-big-2">💎</span>
        <span className="symbol symbol-big symbol-big-3">$</span>
        <span className="symbol symbol-big symbol-big-4">€</span>
        <span className="symbol symbol-big symbol-big-5">🪙</span>
        <span className="symbol symbol-big symbol-big-6">💵</span>
        <span className="symbol symbol-big symbol-big-7 symbol-fcfa">FCFA</span>
        <span className="symbol symbol-big symbol-big-8">£</span>
      </div>
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
