// import AsyncStorage from "@react-native-async-storage/async-storage";
import AsyncStorage from '@react-native-community/async-storage';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Appearance, ColorSchemeName } from "react-native";

type ThemeMode = "light" | "dark" | "system";

interface ThemeColors {
  bg: string;
  card: string;
  black: string;
  white: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  green: string;
  blue: string;
  amber: string;
  red: string;
  purple: string;
  border: string;
  cardBorder: string;
  inputBg: string;
  inputBorder: string;
}

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
}

const lightColors: ThemeColors = {
  bg: "#ffffff",
  card: "#f4f4f7",
  black: "#000000",
  white: "#ffffff",
  textPrimary: "#1a1a1e",
  textSecondary: "#4a4a4e",
  textMuted: "#8e8e93",
  green: "#24b35f",
  blue: "#3b7ef6",
  amber: "#ff9f0a",
  red: "#ff3b30",
  purple: "#7c5cfc",
  border: "#e5e5e5",
  cardBorder: "#e0e0e0",
  inputBg: "#fafafa",
  inputBorder: "#e5e5e5",
};

const darkColors: ThemeColors = {
  bg: "#000000",
  card: "#1c1c1e",
  black: "#ffffff",
  white: "#000000",
  textPrimary: "#ffffff",
  textSecondary: "#e5e5e7",
  textMuted: "#98989d",
  green: "#30d158",
  blue: "#0a84ff",
  amber: "#ff9f0a",
  red: "#ff453a",
  purple: "#bf5af2",
  border: "#38383a",
  cardBorder: "#2c2c2e",
  inputBg: "#1c1c1e",
  inputBorder: "#38383a",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "lab_app_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme(),
  );

  useEffect(() => {
    // Load saved theme preference
    loadTheme();

    // Listen to system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (
        savedTheme &&
        (savedTheme === "light" ||
          savedTheme === "dark" ||
          savedTheme === "system")
      ) {
        setThemeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error("Failed to load theme:", error);
    }
  };

  const setTheme = async (newTheme: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  };

  const getEffectiveColorScheme = (): "light" | "dark" => {
    if (theme === "system") {
      return systemColorScheme === "dark" ? "dark" : "light";
    }
    return theme;
  };

  const effectiveScheme = getEffectiveColorScheme();
  const colors = effectiveScheme === "dark" ? darkColors : lightColors;
  const isDark = effectiveScheme === "dark";

  const value: ThemeContextType = {
    theme,
    colors,
    isDark,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
