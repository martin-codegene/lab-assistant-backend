# Lab Assistant AI - Frontend API Documentation

## Overview

This document provides comprehensive API documentation for the Lab Assistant AI backend, with examples using Axios for frontend integration. The API follows RESTful conventions and uses JWT for authentication.

## Base URL

```
http://localhost:3000/api
```

**Note:** Replace `localhost:3000` with your actual deployment URL in production.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Most endpoints require a valid JWT token in the Authorization header.

### Authentication Flow

1. **Register** a new user or **Login** with existing credentials
2. Receive a JWT token in the response
3. Include the token in subsequent requests using the `Authorization` header

### Axios Configuration

```javascript
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

## API Endpoints

### Health Check

**GET /** - Check API status

```javascript
// Example using axios
const response = await axios.get('http://localhost:3000/');
console.log(response.data);
// Response: { message: 'Lab Assistant AI API', version: '1.0.0', status: 'healthy' }
```

### User Management

#### 1. Register User

**POST** `/users`

Create a new user account.

**Request Body:**
```typescript
{
  email: string;          // Required, valid email
  password: string;       // Required, min 8 characters
  name?: string;          // Optional
  avatarUrl?: string;     // Optional
  role?: UserRole;        // Optional, defaults to 'RESEARCHER'
  plan?: PlanType;        // Optional, defaults to 'FREE'
}
```

**UserRole Enum:**
- `RESEARCHER`
- `LAB_MANAGER`
- `ADMIN`

**PlanType Enum:**
- `FREE`
- `PRO`
- `ENTERPRISE`

**Example:**
```javascript
const registerUser = async (userData) => {
  try {
    const response = await api.post('/users', userData);
    const { token, user } = response.data.data;
    
    // Store token and user data
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error.response?.data);
    throw error;
  }
};

// Usage
await registerUser({
  email: 'researcher@lab.com',
  password: 'securepassword123',
  name: 'John Researcher',
  role: 'RESEARCHER',
  plan: 'FREE'
});
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "researcher@lab.com",
      "name": "John Researcher",
      "role": "RESEARCHER",
      "plan": "FREE",
      "avatarUrl": null
    },
    "token": "jwt_token_here",
    "expiresIn": "7d"
  },
  "message": "User created successfully"
}
```

#### 2. Login

**POST** `/users/login`

Authenticate user and receive JWT token.

**Request Body:**
```typescript
{
  email: string;    // Required
  password: string; // Required
}
```

**Example:**
```javascript
const login = async (credentials) => {
  try {
    const response = await api.post('/users/login', credentials);
    const { token, user } = response.data.data;
    
    // Store token and user data
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data);
    throw error;
  }
};

// Usage
await login({
  email: 'researcher@lab.com',
  password: 'securepassword123'
});
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "researcher@lab.com",
      "name": "John Researcher",
      "role": "RESEARCHER",
      "plan": "FREE",
      "avatarUrl": null
    },
    "token": "jwt_token_here",
    "expiresIn": "7d"
  }
}
```

#### 3. Get User by ID

**GET** `/users/:id` (Protected)

Get user details by ID.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Example:**
```javascript
const getUserById = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get user:', error.response?.data);
    throw error;
  }
};

// Usage
await getUserById('user-uuid-here');
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "researcher@lab.com",
    "name": "John Researcher",
    "role": "RESEARCHER",
    "plan": "FREE",
    "avatarUrl": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 4. Get User by Email

**GET** `/users/email/:email` (Protected)

Get user details by email.

**Example:**
```javascript
const getUserByEmail = async (email) => {
  try {
    const response = await api.get(`/users/email/${encodeURIComponent(email)}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get user:', error.response?.data);
    throw error;
  }
};

// Usage
await getUserByEmail('researcher@lab.com');
```

#### 5. Update User

**PUT** `/users/:id` (Protected)

Update user information.

**Request Body:**
```typescript
{
  name?: string;
  avatarUrl?: string;
  role?: UserRole;
  plan?: PlanType;
  password?: string; // Plain text password for update
}
```

**Example:**
```javascript
const updateUser = async (userId, updates) => {
  try {
    const response = await api.put(`/users/${userId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Failed to update user:', error.response?.data);
    throw error;
  }
};

// Usage
await updateUser('user-uuid-here', {
  name: 'Updated Name',
  avatarUrl: 'https://example.com/avatar.jpg',
  plan: 'PRO'
});
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "researcher@lab.com",
    "name": "Updated Name",
    "role": "RESEARCHER",
    "plan": "PRO",
    "avatarUrl": "https://example.com/avatar.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z",
    "lastLoginAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "User updated successfully"
}
```

#### 6. Delete User

**DELETE** `/users/:id` (Protected, Admin only)

Delete a user account.

**Example:**
```javascript
const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete user:', error.response?.data);
    throw error;
  }
};

// Usage (Admin only)
await deleteUser('user-uuid-here');
```

**Success Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### 7. List Users

**GET** `/users` (Protected)

Get paginated list of users with optional filters.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `role` (UserRole, optional) - Filter by role
- `plan` (PlanType, optional) - Filter by plan

**Example:**
```javascript
const listUsers = async (params = {}) => {
  try {
    const response = await api.get('/users', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to list users:', error.response?.data);
    throw error;
  }
};

// Usage
await listUsers({
  page: 1,
  limit: 20,
  role: 'RESEARCHER',
  plan: 'PRO'
});
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid-1",
        "email": "user1@lab.com",
        "name": "User One",
        "role": "RESEARCHER",
        "plan": "PRO",
        "avatarUrl": null,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "uuid-2",
        "email": "user2@lab.com",
        "name": "User Two",
        "role": "LAB_MANAGER",
        "plan": "ENTERPRISE",
        "avatarUrl": null,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 2,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

#### 8. Change Password

**POST** `/users/:id/change-password` (Protected)

Change user password.

**Request Body:**
```typescript
{
  currentPassword: string; // Current password
  newPassword: string;     // New password
}
```

**Example:**
```javascript
const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const response = await api.post(`/users/${userId}/change-password`, {
      currentPassword,
      newPassword
    });
    return response.data;
  } catch (error) {
    console.error('Failed to change password:', error.response?.data);
    throw error;
  }
};

// Usage
await changePassword('user-uuid-here', 'oldpassword', 'newpassword123');
```

**Success Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### 9. Record User Login

**POST** `/users/:id/login-record` (Protected)

Record user login timestamp.

**Example:**
```javascript
const recordLogin = async (userId) => {
  try {
    const response = await api.post(`/users/${userId}/login-record`);
    return response.data;
  } catch (error) {
    console.error('Failed to record login:', error.response?.data);
    throw error;
  }
};

// Usage
await recordLogin('user-uuid-here');
```

**Success Response:**
```json
{
  "success": true,
  "message": "Login recorded successfully"
}
```

### Protocol Management

**Note:** Protocol endpoints are currently under development. The following endpoints are planned:

#### 1. List Protocols

**GET** `/protocols`

Get list of protocols.

**Example:**
```javascript
const listProtocols = async () => {
  try {
    const response = await api.get('/protocols');
    return response.data;
  } catch (error) {
    console.error('Failed to list protocols:', error.response?.data);
    throw error;
  }
};
```

#### 2. Get Protocol by ID

**GET** `/protocols/:id`

Get protocol details by ID.

**Example:**
```javascript
const getProtocol = async (protocolId) => {
  try {
    const response = await api.get(`/protocols/${protocolId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get protocol:', error.response?.data);
    throw error;
  }
};
```

### Experiment Management

**Note:** Experiment endpoints are currently under development. The following endpoints are planned:

#### 1. List Experiments

**GET** `/experiments`

Get list of experiments.

**Example:**
```javascript
const listExperiments = async () => {
  try {
    const response = await api.get('/experiments');
    return response.data;
  } catch (error) {
    console.error('Failed to list experiments:', error.response?.data);
    throw error;
  }
};
```

#### 2. Get Experiment by ID

**GET** `/experiments/:id`

Get experiment details by ID.

**Example:**
```javascript
const getExperiment = async (experimentId) => {
  try {
    const response = await api.get(`/experiments/${experimentId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get experiment:', error.response?.data);
    throw error;
  }
};
```

## Data Models

### User Model

```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // Email address
  name?: string;                 // Full name
  avatarUrl?: string;            // Profile picture URL
  role: UserRole;                // User role
  plan: PlanType;                // Subscription plan
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
  lastLoginAt?: Date;            // Last login timestamp
}
```

### Protocol Model

```typescript
interface Protocol {
  id: string;                    // UUID
  name: string;                  // Protocol name
  description?: string;          // Protocol description
  category: ProtocolCategory;    // Protocol category
  version: string;               // Version number
  isPublic: boolean;             // Public visibility
  isTemplate: boolean;           // Template flag
  materials: ProtocolMaterial[]; // Required materials
  steps: ProtocolStep[];         // Protocol steps
  conditions: ProtocolConditions; // Experimental conditions
  safetyNotes?: string;          // Safety information
  references?: string;           // References
  createdById: string;           // Creator user ID
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
  lastUsedAt?: Date;             // Last usage timestamp
  usageCount: number;            // Usage count
  createdBy?: User;              // Creator user (populated)
}

interface ProtocolStep {
  step: number;                  // Step number
  action: string;                // Action description
  duration: string;              // Duration
  notes?: string;                // Additional notes
  materials?: string[];          // Materials for this step
}

interface ProtocolMaterial {
  name: string;                  // Material name
  quantity: string;              // Quantity
  unit: string;                  // Unit of measurement
  catalogNumber?: string;        // Catalog number
  supplier?: string;             // Supplier name
}
```

### Experiment Model

```typescript
interface Experiment {
  id: string;                    // UUID
  title: string;                 // Experiment title
  description?: string;          // Experiment description
  status: ExperimentStatus;      // Current status
  protocolId: string;            // Protocol ID
  startDate?: Date;              // Start date
  endDate?: Date;                // End date
  notes?: string;                // Experiment notes
  variables: Record<string, any>; // Experimental variables
  results?: any[];               // Experiment results
  conclusion?: string;           // Conclusion
  success?: boolean;             // Success flag
  createdById: string;           // Creator user ID
  labId?: string;                // Lab ID
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
  protocol?: Protocol;           // Protocol (populated)
  createdBy?: User;              // Creator user (populated)
}
```

## Error Handling

### Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "message": "Optional additional message"
}
```

### Common HTTP Status Codes

- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid request data
- **401 Unauthorized** - Authentication required or invalid token
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

### Example Error Handling

```javascript
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        console.error('Bad request:', data.error);
        break;
      case 401:
        console.error('Unauthorized - please login again');
        // Redirect to login
        window.location.href = '/login';
        break;
      case 403:
        console.error('Forbidden - insufficient permissions');
        break;
      case 404:
        console.error('Resource not found');
        break;
      case 500:
        console.error('Server error:', data.error);
        break;
      default:
        console.error('Unexpected error:', data.error);
    }
  } else if (error.request) {
    // Request made but no response
    console.error('No response from server');
  } else {
    // Error setting up request
    console.error('Request error:', error.message);
  }
  
  throw error;
};

// Usage in API calls
try {
  const response = await api.get('/users/123');
  return response.data;
} catch (error) {
  handleApiError(error);
}
```

## Best Practices

### 1. Token Management

```javascript
// Store token securely
const storeToken = (token) => {
  localStorage.setItem('token', token);
};

// Get token
const getToken = () => {
  return localStorage.getItem('token');
};

// Remove token (logout)
const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Check if user is authenticated
const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  
  // Optional: Check token expiration
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};
```

### 2. Request Retry Logic

```javascript
const apiWithRetry = axios.create({
  baseURL: 'http://localhost:3000/api',
});

apiWithRetry.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Retry on network errors or 5xx errors
    if (!error.response || error.response.status >= 500) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        
        // Wait 1 second before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return apiWithRetry(originalRequest);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### 3. Loading States

```javascript
// Example React hook for API calls with loading state
const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const callApi = async (apiCall, ...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall(...args);
      return result;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { callApi, loading, error };
};

// Usage in component
const UserProfile = ({ userId }) => {
  const { callApi, loading, error } = useApi();
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await callApi(api.get, `/users/${userId}`);
        setUser(result.data);
      } catch (err) {
        // Error already set by useApi
      }
    };
    
    fetchUser();
  }, [userId]);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>{/* Render user data */}</div>;
};
```

## Example: Complete Authentication Flow

```javascript
// authService.js
import api from './api';

class AuthService {
  // Register new user
  async register(userData) {
    const response = await api.post('/users', userData);
    const { token, user } = response.data.data;
    
    this.setAuthData(token, user);
    return response.data;
  }
  
  // Login existing user
  async login(credentials) {
    const response = await api.post('/users/login', credentials);
    const { token, user } = response.data.data;
    
    this.setAuthData(token, user);
    return response.data;
  }
  
  // Logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Clear axios authorization header
    delete api.defaults.headers.common['Authorization'];
  }
  
  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  
  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
  }
  
  // Set authentication data
  setAuthData(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  // Update user profile
  async updateProfile(userId, updates) {
    const response = await api.put(`/users/${userId}`, updates);
    
    // Update stored user data
    if (response.data.success) {
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        const updatedUser = { ...currentUser, ...response.data.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
    
    return response.data;
  }
  
  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const response = await api.post(`/users/${userId}/change-password`, {
      currentPassword,
      newPassword
    });
    return response.data;
  }
}

export default new AuthService();
```

## Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:3000/

# Register user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@lab.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@lab.com","password":"password123"}'

# Get user (with token)
curl -X GET http://localhost:3000/api/users/user-uuid-here \
  -H "Authorization: Bearer your_jwt_token_here"
```

### Using Postman

1. **Collection Setup:**
   - Create new collection named "Lab Assistant AI"
   - Add base URL variable: `{{baseUrl}} = http://localhost:3000`

2. **Authentication:**
   - Create "Login" request (POST to `/api/users/login`)
   - Add test script to extract and store token:
   ```javascript
   if (pm.response.code === 200) {
     const jsonData = pm.response.json();
     pm.environment.set('token', jsonData.data.token);
     pm.environment.set('user', JSON.stringify(jsonData.data.user));
   }
   ```

3. **Protected Requests:**
   - Add Authorization header: `Bearer {{token}}`
   - Use environment variables for dynamic values

## Support

For API issues or questions:
1. Check the health endpoint: `GET /`
2. Verify your JWT token is valid and not expired
3. Ensure required fields are provided in requests
4. Check network connectivity and CORS settings

## Changelog

### v1.0.0 (Current)
- User registration and authentication
- User CRUD operations
- JWT-based authentication
- Basic protocol and experiment endpoints (under development)

---

*Last Updated: February 23, 2026*