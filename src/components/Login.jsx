import { useState } from 'react';

const PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'pra2026';

function Login({ onSuccess }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === PASSWORD) {
      sessionStorage.setItem('pra_auth', '1');
      onSuccess();
    } else {
      setError(true);
      setInput('');
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-logo">🗺️</div>
        <h1 className="login-title">PH Reclamation Sites Tracker</h1>
        <p className="login-subtitle">Enter password to continue</p>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="password"
            className={`login-input${error ? ' login-input-error' : ''}`}
            placeholder="Password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            autoFocus
          />
          {error && <p className="login-error">Incorrect password. Try again.</p>}
          <button type="submit" className="login-btn">Enter</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
