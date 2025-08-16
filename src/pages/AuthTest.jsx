import React, { useState } from 'react';
import { User } from '../api/entities';

const AuthTest = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting login with:', credentials);
      const response = await User.login(credentials);
      console.log('Login response:', response);
      
      if (response.success) {
        setToken(localStorage.getItem('authToken'));
        console.log('Login successful!');
        
        // Try to get user profile
        try {
          const userProfile = await User.me();
          setUser(userProfile);
          console.log('User profile:', userProfile);
        } catch (profileError) {
          console.error('Failed to get user profile:', profileError);
        }
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      setUser(null);
      setToken(null);
      setCredentials({ email: '', password: '' });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const testApiCall = async () => {
    try {
      console.log('Testing API call...');
      const users = await User.list();
      console.log('Users fetched:', users);
      alert(`Successfully fetched ${users?.length || 0} users`);
    } catch (err) {
      console.error('API test error:', err);
      alert(`API test failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const fillDefaultCredentials = () => {
    setCredentials({ email: 'admin@company.com', password: 'admin123' });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Authentication Test</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
        <strong>Current Token:</strong> {token ? 'Present' : 'None'}
        <br />
        <small>{token ? token.substring(0, 50) + '...' : 'No token stored'}</small>
      </div>

      {!user ? (
        <form onSubmit={handleLogin} style={{ marginBottom: '20px' }}>
          <h2>Login</h2>
          
          <div style={{ marginBottom: '10px' }}>
            <label>Email:</label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              placeholder="admin@company.com"
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label>Password:</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              placeholder="admin123"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer', marginRight: '10px' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          
          <button 
            type="button" 
            onClick={fillDefaultCredentials}
            style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Use Default Credentials
          </button>
          
          {error && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              Error: {error}
            </div>
          )}
        </form>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          <h2>Logged In</h2>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
            {JSON.stringify(user, null, 2)}
          </pre>
          <button 
            onClick={handleLogout}
            style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', cursor: 'pointer', marginRight: '10px' }}
          >
            Logout
          </button>
          <button 
            onClick={testApiCall}
            style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Test API Call
          </button>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e9ecef' }}>
        <h3>Default Admin Credentials</h3>
        <p><strong>These are the seeded admin credentials from the backend:</strong></p>
        <ul>
          <li><strong>Email:</strong> admin@company.com</li>
          <li><strong>Password:</strong> admin123</li>
        </ul>
        <p><small>⚠️ Change the default password in production!</small></p>
        <p><small>Check the browser console for detailed API logging</small></p>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd' }}>
        <h4>How to Access This Page:</h4>
        <p>You can access this auth test page using:</p>
        <ul>
          <li><code>http://localhost:5173/AuthTest</code></li>
          <li><code>http://localhost:5173/#auth-test</code></li>
          <li><code>http://localhost:5173/?page=AuthTest</code></li>
        </ul>
      </div>
    </div>
  );
};

export default AuthTest;