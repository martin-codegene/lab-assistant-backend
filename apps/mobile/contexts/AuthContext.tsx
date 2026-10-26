import { api, User } from "@/lib/api";
import { router } from "expo-router";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Text, View } from "react-native";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name?: string;
    avatarUrl?: string;
    role?: "RESEARCHER" | "LAB_MANAGER" | "ADMIN";
    plan?: "FREE" | "PRO" | "ENTERPRISE";
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirectToTabs, setShouldRedirectToTabs] = useState(false);

  useEffect(() => {
    // Check initial auth state
    checkAuthState();
  }, []);

  useEffect(() => {
    // Handle redirect after auth state is checked and component is mounted
    if (shouldRedirectToTabs && isAuthenticated) {
      // Small delay to ensure navigation is ready
      const timer = setTimeout(() => {
        router.push("/(tabs)");
        setShouldRedirectToTabs(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [shouldRedirectToTabs, isAuthenticated]);

  const checkAuthState = async () => {
    try {
      const currentUser = api.getCurrentUser();
      const authenticated = api.isAuthenticated();

      setUser(currentUser);
      setIsAuthenticated(authenticated);

      //   redirect to home if logged in
      if (authenticated) {
        setShouldRedirectToTabs(true);
      }
    } catch (error) {
      console.error("Failed to check auth state:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.login({ email, password });

      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);

        // Record login
        try {
          await api.recordLogin(response.data.user.id);
        } catch (error) {
          console.warn("Failed to record login:", error);
        }

        // Navigate to tabs after successful login
        setTimeout(() => {
          router.push("/(tabs)");
        }, 100);
      } else {
        throw new Error(response.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    name?: string;
    avatarUrl?: string;
    role?: "RESEARCHER" | "LAB_MANAGER" | "ADMIN";
    plan?: "FREE" | "PRO" | "ENTERPRISE";
  }) => {
    try {
      setIsLoading(true);
      const response = await api.register(data);

      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);

        // Navigate to tabs after successful registration
        setTimeout(() => {
          router.push("/(tabs)");
        }, 100);
      } else {
        throw new Error(response.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await api.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      if (!user) throw new Error("No user to update");

      setIsLoading(true);
      const response = await api.updateUser(user.id, updates);

      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error(response.error || "Update failed");
      }
    } catch (error) {
      console.error("Update user error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    await checkAuthState();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: { requireAuth?: boolean } = { requireAuth: true },
) {
  return function WithAuthComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      // Show loading screen
      return (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Loading...</Text>
        </View>
      );
    }

    if (options.requireAuth && !isAuthenticated) {
      // Redirect to login or show unauthorized
      // In React Native, you would use navigation here
      return (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Please login to access this page</Text>
        </View>
      );
    }

    return <Component {...props} />;
  };
}
