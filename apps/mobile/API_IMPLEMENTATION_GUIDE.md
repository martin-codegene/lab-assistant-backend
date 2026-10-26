# Lab Assistant AI - API Implementation Guide

## Overview

This guide explains how to use the API implementation for the Lab Assistant AI frontend. The implementation includes:

1. **API Service** (`lib/api.ts`) - Core API client with secure token storage
2. **React Hooks** (`hooks/useApi.ts`) - Custom hooks for API calls with loading/error states
3. **Auth Context** (`contexts/AuthContext.tsx`) - React context for authentication state management
4. **Example Components** - Demonstrations of API usage

## Installation

The API implementation is already set up with the following dependencies:

- `expo-secure-store@~15.0.8` - Secure token storage
- `axios` - HTTP client (already included in the project)

## Quick Start

### 1. Using the Auth Context

Wrap your app with the `AuthProvider` in `app/_layout.tsx`:

```typescript
import { AuthProvider } from '@/contexts/AuthContext';

// In your RootLayout component
return (
  <AuthProvider>
    {/* Your app content */}
  </AuthProvider>
);
```

### 2. Using Authentication in Components

```typescript
import { useAuth } from '@/contexts/AuthContext';

function LoginComponent() {
  const { login, logout, user, isAuthenticated, isLoading } = useAuth();

  const handleLogin = async () => {
    try {
      await login('user@example.com', 'password123');
      // User is now logged in and token is stored securely
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (isLoading) return <Text>Loading...</Text>;

  return (
    <View>
      {isAuthenticated ? (
        <Text>Welcome, {user?.name}</Text>
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}
    </View>
  );
}
```

### 3. Making API Calls

#### Using the API service directly:

```typescript
import { api } from "@/lib/api";

// Get current user
const user = api.getCurrentUser();

// Check authentication
const isAuthenticated = api.isAuthenticated();

// Make API calls
const response = await api.getUserById("user-id");
const protocols = await api.listProtocols();
```

#### Using React hooks:

```typescript
import { useApi, useAuth, useProtocols } from '@/hooks/useApi';

function MyComponent() {
  // General API hook
  const { execute, loading, error, data } = useApi(api.getUserById);

  // Auth-specific hook
  const auth = useAuth();

  // Protocol-specific hook
  const protocols = useProtocols();

  useEffect(() => {
    // Execute API call
    execute('user-id');
  }, []);

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return <Text>User: {data?.name}</Text>;
}
```

## API Endpoints Implemented

### Authentication

- `api.login(credentials)` - Login with email/password
- `api.register(userData)` - Register new user
- `api.logout()` - Logout and clear tokens

### User Management

- `api.getUserById(userId)` - Get user by ID
- `api.getUserByEmail(email)` - Get user by email
- `api.updateUser(userId, updates)` - Update user
- `api.deleteUser(userId)` - Delete user (admin only)
- `api.listUsers(params)` - List users with pagination
- `api.changePassword(userId, data)` - Change password
- `api.recordLogin(userId)` - Record login timestamp

### Protocols (Under Development)

- `api.listProtocols()` - List protocols
- `api.getProtocol(protocolId)` - Get protocol by ID

### Experiments (Under Development)

- `api.listExperiments()` - List experiments
- `api.getExperiment(experimentId)` - Get experiment by ID

### Health Check

- `api.healthCheck()` - Check API status

## Token Storage

Tokens are securely stored using `expo-secure-store`:

- **Token**: Stored with key `lab_app_token`
- **User Data**: Stored with key `lab_app_user`

The API service automatically:

1. Loads tokens on initialization
2. Adds tokens to request headers
3. Clears tokens on logout or 401 errors
4. Handles token expiration

## Error Handling

All API methods throw errors that can be caught and handled:

```typescript
try {
  await api.login({ email, password });
} catch (error: any) {
  // Handle specific error types
  if (error.message.includes("Unauthorized")) {
    // Show login form again
  } else if (error.message.includes("Network")) {
    // Show network error
  } else {
    // Show generic error
    Alert.alert("Error", error.message);
  }
}
```

## Best Practices

### 1. Use the Auth Context for Authentication State

Instead of checking localStorage directly, use the `useAuth` hook:

```typescript
// Good
const { isAuthenticated, user } = useAuth();

// Avoid
const token = localStorage.getItem("token");
```

### 2. Use React Hooks for Loading States

The `useApi` hook provides built-in loading and error states:

```typescript
const { execute, loading, error, data } = useApi(api.getUserById);

useEffect(() => {
  execute('user-id');
}, []);

if (loading) return <Loader />;
if (error) return <Error message={error.message} />;
return <UserProfile user={data} />;
```

### 3. Handle Token Expiration Gracefully

The API service automatically handles 401 errors by clearing tokens. You can listen for this in your components:

```typescript
const { isAuthenticated } = useAuth();

useEffect(() => {
  if (!isAuthenticated && wasAuthenticated) {
    // User was logged out (token expired)
    Alert.alert("Session expired", "Please login again");
    router.push("/login");
  }
}, [isAuthenticated]);
```

### 4. Update User Data After Changes

When updating user information, the AuthContext automatically updates the stored user data:

```typescript
const { updateUser } = useAuth();

const handleUpdate = async () => {
  await updateUser({ name: "New Name" });
  // User data is automatically updated in context and storage
};
```

## Testing

### 1. Test API Connection

Use the `ApiTest` component to verify API connectivity:

```typescript
import { ApiTest } from '@/components/ApiTest';

function TestScreen() {
  return <ApiTest />;
}
```

### 2. Mock API for Development

For development without a backend, you can modify the API base URL:

```typescript
// In lib/api.ts
const API_CONFIG = {
  BASE_URL: "http://localhost:3000/api", // Change to your backend URL
  // BASE_URL: 'https://your-api.herokuapp.com/api', // Production
};
```

### 3. Test Token Storage

Verify secure storage is working:

```typescript
import * as SecureStore from "expo-secure-store";

// Check if token is stored
const token = await SecureStore.getItemAsync("lab_app_token");
console.log("Token stored:", !!token);
```

## Troubleshooting

### Common Issues

1. **Network Errors**
   - Check if backend is running on `http://localhost:3000`
   - Verify CORS settings on backend
   - Check network connectivity

2. **Token Not Persisting**
   - Verify `expo-secure-store` is installed
   - Check for storage permissions on device
   - Test on physical device (simulator may have issues)

3. **401 Unauthorized Errors**
   - Token may be expired
   - Clear app data and login again
   - Check token format in requests

4. **TypeScript Errors**
   - Ensure all types are imported correctly
   - Check for missing dependencies
   - Run TypeScript compiler: `npx tsc --noEmit`

### Debugging

Enable debug logging in the API service:

```typescript
// In lib/api.ts, add logging
private async setAuthData(token: string, user: User) {
  console.log('Setting auth data:', { token, user });
  // ... rest of implementation
}
```

## Next Steps

1. **Implement Protocol Screens** - Use `useProtocols` hook
2. **Implement Experiment Screens** - Use `useExperiments` hook
3. **Add Error Boundaries** - Catch API errors globally
4. **Implement Offline Support** - Cache API responses
5. **Add API Documentation** - Generate from TypeScript types

## Support

For issues with the API implementation:

1. Check the console for error messages
2. Verify backend API is running and accessible
3. Test with the `ApiTest` component
4. Check network requests in browser dev tools

---

_Last Updated: February 23, 2026_
