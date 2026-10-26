# Frontend Integration Guide

## Overview

This guide shows you how to integrate the Lab Assistant AI backend APIs into your frontend application (React, React Native, Vue, etc.).

## Quick Start

### 1. Running Backend Tests

```bash
# Terminal 1: Start the backend server
cd lab-app-backend
bun run dev

# Terminal 2: Run API tests
node test-protocol-api.js
node test-experiment-api.js
node test-analysis-api.js
```

### 2. API Base Configuration

Create an API service file:

```javascript
// services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired - redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

## API Integration by Feature

### 1. User Authentication

```javascript
// services/authService.js
import api from './api';

export const authService = {
  // Register new user
  async register(userData) {
    const response = await api.post('/users', userData);
    const { token, user } = response.data.data;
    
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  },

  // Login
  async login(email, password) {
    const response = await api.post('/users/login', { email, password });
    const { token, user } = response.data.data;
    
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  },

  // Logout
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if authenticated
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }
};
```

### 2. Protocol Management

```javascript
// services/protocolService.js
import api from './api';

export const protocolService = {
  // Create protocol
  async create(protocolData) {
    const response = await api.post('/protocols', protocolData);
    return response.data;
  },

  // Get protocol by ID
  async getById(id) {
    const response = await api.get(`/protocols/${id}`);
    return response.data;
  },

  // List user's protocols
  async listMine(params = {}) {
    const response = await api.get('/protocols/user/my-protocols', { params });
    return response.data;
  },

  // Search protocols
  async search(query, params = {}) {
    const response = await api.get('/protocols/search', {
      params: { q: query, ...params }
    });
    return response.data;
  },

  // Update protocol
  async update(id, updates) {
    const response = await api.put(`/protocols/${id}`, updates);
    return response.data;
  },

  // Delete protocol
  async delete(id) {
    const response = await api.delete(`/protocols/${id}`);
    return response.data;
  },

  // Duplicate protocol
  async duplicate(id) {
    const response = await api.post(`/protocols/${id}/duplicate`);
    return response.data;
  }
};
```

### 3. Experiment Management

```javascript
// services/experimentService.js
import api from './api';

export const experimentService = {
  // Create experiment
  async create(experimentData) {
    const response = await api.post('/experiments', experimentData);
    return response.data;
  },

  // Get experiment by ID
  async getById(id) {
    const response = await api.get(`/experiments/${id}`);
    return response.data;
  },

  // Get experiment with analyses
  async getWithAnalyses(id) {
    const response = await api.get(`/experiments/${id}/analyses`);
    return response.data;
  },

  // List user's experiments
  async listMine(params = {}) {
    const response = await api.get('/experiments/user/my-experiments', { params });
    return response.data;
  },

  // Start experiment
  async start(id) {
    const response = await api.post(`/experiments/${id}/start`);
    return response.data;
  },

  // Update experiment
  async update(id, updates) {
    const response = await api.put(`/experiments/${id}`, updates);
    return response.data;
  },

  // Complete experiment
  async complete(id, success, conclusion) {
    const response = await api.post(`/experiments/${id}/complete`, {
      success,
      conclusion
    });
    return response.data;
  },

  // Fail experiment
  async fail(id, reason) {
    const response = await api.post(`/experiments/${id}/fail`, { reason });
    return response.data;
  },

  // Cancel experiment
  async cancel(id, reason) {
    const response = await api.post(`/experiments/${id}/cancel`, { reason });
    return response.data;
  }
};
```

### 4. AI Analysis

```javascript
// services/analysisService.js
import api from './api';

export const analysisService = {
  // Analyze gel image
  async analyzeGelImage(experimentId, imageUrl, metadata) {
    const response = await api.post('/analyses/gel-image', {
      experimentId,
      imageUrl,
      metadata
    });
    return response.data;
  },

  // Troubleshooting
  async troubleshoot(experimentId, problem, context) {
    const response = await api.post('/analyses/troubleshoot', {
      experimentId,
      problem,
      context
    });
    return response.data;
  },

  // Optimize protocol
  async optimizeProtocol(experimentId, currentProtocol, issues) {
    const response = await api.post('/analyses/optimize-protocol', {
      experimentId,
      currentProtocol,
      issues
    });
    return response.data;
  },

  // Get analysis by ID
  async getById(id) {
    const response = await api.get(`/analyses/${id}`);
    return response.data;
  },

  // List experiment analyses
  async listByExperiment(experimentId, params = {}) {
    const response = await api.get(`/analyses/experiment/${experimentId}`, { params });
    return response.data;
  },

  // List user's analyses
  async listMine(params = {}) {
    const response = await api.get('/analyses/user/my-analyses', { params });
    return response.data;
  }
};
```

## React Hooks

### useAuth Hook

```javascript
// hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    setUser(result.data.user);
    return result;
  };

  const register = async (userData) => {
    const result = await authService.register(userData);
    setUser(result.data.user);
    return result;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### useExperiment Hook

```javascript
// hooks/useExperiment.js
import { useState } from 'react';
import { experimentService } from '../services/experimentService';

export const useExperiment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createExperiment = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await experimentService.create(data);
      return result;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const startExperiment = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await experimentService.start(id);
      return result;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateExperiment = async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const result = await experimentService.update(id, updates);
      return result;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createExperiment,
    startExperiment,
    updateExperiment,
    loading,
    error
  };
};
```

### useAnalysis Hook

```javascript
// hooks/useAnalysis.js
import { useState } from 'react';
import { analysisService } from '../services/analysisService';

export const useAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeGelImage = async (experimentId, imageUrl, metadata) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analysisService.analyzeGelImage(experimentId, imageUrl, metadata);
      return result;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const troubleshoot = async (experimentId, problem, context) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analysisService.troubleshoot(experimentId, problem, context);
      return result;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    analyzeGelImage,
    troubleshoot,
    loading,
    error
  };
};
```

## React Component Examples

### Login Component

```javascript
// components/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        {error && <div className="error">{error}</div>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
```

### Experiment List Component

```javascript
// components/ExperimentList.jsx
import React, { useState, useEffect } from 'react';
import { experimentService } from '../services/experimentService';

const ExperimentList = () => {
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    try {
      const result = await experimentService.listMine({ page: 1, limit: 20 });
      setExperiments(result.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="experiment-list">
      <h2>My Experiments</h2>
      {experiments.map((exp) => (
        <div key={exp.id} className="experiment-card">
          <h3>{exp.title}</h3>
          <p>Status: {exp.status}</p>
          <p>Protocol: {exp.protocol?.name}</p>
          {exp.startDate && <p>Started: {new Date(exp.startDate).toLocaleDateString()}</p>}
        </div>
      ))}
    </div>
  );
};

export default ExperimentList;
```

### Gel Analysis Component

```javascript
// components/GelAnalysis.jsx
import React, { useState } from 'react';
import { useAnalysis } from '../hooks/useAnalysis';

const GelAnalysis = ({ experimentId }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [result, setResult] = useState(null);
  const { analyzeGelImage, loading, error } = useAnalysis();

  const handleAnalyze = async () => {
    try {
      const analysis = await analyzeGelImage(experimentId, imageUrl, {
        lanes: 4,
        marker: '1kb ladder'
      });
      setResult(analysis.data);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  return (
    <div className="gel-analysis">
      <h3>Gel Image Analysis</h3>
      
      <input
        type="text"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="Enter gel image URL"
      />
      
      <button onClick={handleAnalyze} disabled={loading || !imageUrl}>
        {loading ? 'Analyzing...' : 'Analyze Image'}
      </button>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="results">
          <h4>Analysis Results</h4>
          <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
          
          <h5>Observations:</h5>
          <ul>
            {result.observations.map((obs, i) => (
              <li key={i}>{obs.description}</li>
            ))}
          </ul>

          <h5>Recommendations:</h5>
          <ul>
            {result.recommendations.map((rec, i) => (
              <li key={i} className={`priority-${rec.priority.toLowerCase()}`}>
                {rec.action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GelAnalysis;
```

## Testing in Frontend

### Mock API for Development

```javascript
// services/mockApi.js
export const mockApi = {
  experiments: {
    async listMine() {
      return {
        success: true,
        data: {
          data: [
            {
              id: '1',
              title: 'PCR Experiment 1',
              status: 'IN_PROGRESS',
              protocol: { name: 'Standard PCR' }
            }
          ],
          total: 1,
          page: 1,
          limit: 10
        }
      };
    }
  },
  
  analysis: {
    async analyzeGelImage() {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        data: {
          id: 'mock-analysis',
          observations: [
            { type: 'band_detection', description: 'Clear bands visible', confidence: 0.92 }
          ],
          recommendations: [
            { action: 'Proceed with sequencing', priority: 'HIGH' }
          ],
          confidence: 0.90
        }
      };
    }
  }
};
```

## Environment Variables

Create `.env` file in your frontend:

```bash
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_USE_MOCK_API=false
```

## Running Tests

### Backend Tests
```bash
# Start backend
cd lab-app-backend
bun run dev

# Run tests
node test-protocol-api.js
node test-experiment-api.js
node test-analysis-api.js
```

### Frontend Integration Test
```bash
# In your frontend project
npm start

# Test the integration:
# 1. Login with test credentials
# 2. Create a protocol
# 3. Create an experiment
# 4. Run AI analysis
```

## Troubleshooting

### CORS Issues
If you get CORS errors, the backend already has CORS enabled. Make sure you're using the correct API URL.

### Authentication Issues
- Check that JWT token is being stored in localStorage
- Verify token is included in Authorization header
- Check token hasn't expired (7 days default)

### API Connection Issues
- Verify backend is running on http://localhost:3000
- Check network tab in browser dev tools
- Verify API_BASE_URL is correct

## Next Steps

1. Implement file upload for experiment images
2. Add real-time updates with WebSockets
3. Implement offline support with service workers
4. Add data caching with React Query or SWR
5. Implement push notifications

---

*Last Updated: February 23, 2026*
