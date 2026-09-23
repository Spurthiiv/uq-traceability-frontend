import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { api } from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('spurthi@fcbizz.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('uq_token', res.data.token);
      localStorage.setItem('uq_user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #4a1a5c, #9c1f5c)',
      fontFamily: 'sans-serif'
    }}>
      <form onSubmit={handleLogin} style={{
        background: 'white',
        padding: 32,
        borderRadius: 12,
        width: 320,
        textAlign: 'center'
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 12, margin: '0 auto 12px',
          background: 'linear-gradient(135deg, #a855c7, #d6336c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white'
        }}><Crown size={28} /></div>
        <h2 style={{ margin: '0 0 4px' }}>Udyami Queens</h2>
        <p style={{ color: '#888', marginTop: 0, marginBottom: 20 }}>Blockchain Powered Supply Chain</p>

        <div style={{ textAlign: 'left', marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: '#555' }}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4, boxSizing: 'border-box' }} />
        </div>

        <div style={{ textAlign: 'left', marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: '#555' }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4, boxSizing: 'border-box' }} />
        </div>

        {error && <p style={{ color: '#c62828', fontSize: 13 }}>{error}</p>}

        <button type="submit" style={{
          width: '100%', padding: 10, border: 'none', borderRadius: 8,
          background: 'linear-gradient(135deg, #7b2ff7, #d6336c)',
          color: 'white', fontWeight: 'bold', cursor: 'pointer'
        }}>Sign in</button>

        <p style={{ fontSize: 11, color: '#999', marginTop: 12 }}>
          Demo login pre-filled · seeded password: Password123!
        </p>
      </form>
    </div>
  );
}