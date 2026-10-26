import { api, ApiResponse } from "@/lib/api";
import { useCallback, useState } from "react";

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  immediate?: boolean;
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useApi<T = any>(
  apiCall: (...args: any[]) => Promise<ApiResponse<T>>,
  options: UseApiOptions<T> = {},
) {
  const { onSuccess, onError, immediate = false } = options;
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiCall(...args);

        if (response.success) {
          setState({
            data: response.data || null,
            loading: false,
            error: null,
          });
          onSuccess?.(response.data as T);
          return response;
        } else {
          const error = new Error(response.error || "API request failed");
          setState({ data: null, loading: false, error });
          onError?.(error);
          throw error;
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        setState({ data: null, loading: false, error: err });
        onError?.(err);
        throw err;
      }
    },
    [apiCall, onSuccess, onError],
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Auth-specific hooks
export function useAuth() {
  const [authState, setAuthState] = useState({
    isAuthenticated: api.isAuthenticated(),
    user: api.getCurrentUser(),
  });

  const login = useApi(api.login.bind(api));
  const register = useApi(api.register.bind(api));
  const logout = useApi(async () => {
    await api.logout();
    return { success: true, message: "Logged out successfully" } as ApiResponse;
  });

  const updateAuthState = useCallback(() => {
    setAuthState({
      isAuthenticated: api.isAuthenticated(),
      user: api.getCurrentUser(),
    });
  }, []);

  // Listen for auth state changes
  const executeLogin = useCallback(
    async (credentials: { email: string; password: string }) => {
      const result = await login.execute(credentials);
      if (result.success) {
        updateAuthState();
      }
      return result;
    },
    [login, updateAuthState],
  );

  const executeRegister = useCallback(
    async (data: Parameters<typeof api.register>[0]) => {
      const result = await register.execute(data);
      if (result.success) {
        updateAuthState();
      }
      return result;
    },
    [register, updateAuthState],
  );

  const executeLogout = useCallback(async () => {
    const result = await logout.execute();
    if (result.success) {
      updateAuthState();
    }
    return result;
  }, [logout, updateAuthState]);

  return {
    ...authState,
    login: {
      ...login,
      execute: executeLogin,
    },
    register: {
      ...register,
      execute: executeRegister,
    },
    logout: {
      ...logout,
      execute: executeLogout,
    },
    refreshAuthState: updateAuthState,
  };
}

// User-specific hooks
export function useUser() {
  const getUserById = useApi(api.getUserById.bind(api));
  const getUserByEmail = useApi(api.getUserByEmail.bind(api));
  const updateUser = useApi(api.updateUser.bind(api));
  const deleteUser = useApi(api.deleteUser.bind(api));
  const listUsers = useApi(api.listUsers.bind(api));
  const changePassword = useApi(api.changePassword.bind(api));
  const recordLogin = useApi(api.recordLogin.bind(api));

  return {
    getUserById,
    getUserByEmail,
    updateUser,
    deleteUser,
    listUsers,
    changePassword,
    recordLogin,
  };
}

// Protocol-specific hooks
export function useProtocols() {
  const listProtocols = useApi(api.listProtocols.bind(api));
  const getProtocol = useApi(api.getProtocol.bind(api));

  return {
    listProtocols,
    getProtocol,
  };
}

// Experiment-specific hooks
export function useExperiments() {
  const listExperiments = useApi(api.listExperiments.bind(api));
  const getExperiment = useApi(api.getExperiment.bind(api));

  return {
    listExperiments,
    getExperiment,
  };
}

// Health check hook
export function useHealthCheck() {
  return useApi(api.healthCheck.bind(api));
}
