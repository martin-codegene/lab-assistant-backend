import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import "./global.css";

// Prevent splash screen from auto-hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <BottomSheetModalProvider>
          {/* <NavigationThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          > */}
          <AuthProvider>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen
                name="(routes)/login"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(routes)/onboarding"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(routes)/subscribe"
                options={{
                  headerShown: false,
                  presentation: "card",
                  navigationBarHidden: true,
                  animation: "flip",
                }}
              />
              <Stack.Screen
                name="(routes)/experiment-details"
                options={{
                  headerShown: false,
                  title: "Experiment Details",
                  presentation: "formSheet",
                  sheetAllowedDetents: [0.5, 0.7, 1],
                  sheetGrabberVisible: true,
                  sheetCornerRadius: 27,
                  animationMatchesGesture: true,
                }}
              />
              <Stack.Screen
                name="(routes)/create-protocol"
                options={{
                  headerShown: false,
                  presentation: "card",
                  animation: "slide_from_bottom",
                }}
              />
              <Stack.Screen
                name="(routes)/api-test"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="(routes)/register"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="modal"
                options={{ presentation: "modal", title: "Modal" }}
              />
              <Stack.Screen
                name="(routes)/experiments"
                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="(routes)/gel-analysis"
                options={{
                  headerShown: false,
                  sheetAllowedDetents: [0.5, 0.7, 1],
                  sheetGrabberVisible: true,
                  sheetCornerRadius: 27,
                  animationMatchesGesture: true,
                }}
              />
              <Stack.Screen
                name="(routes)/protocol-capture"
                options={{
                  headerShown: false,
                  // presentation: "modal",
                  // sheetAllowedDetents: [0.5, 0.7, 1],
                  // sheetGrabberVisible: true,
                  // sheetCornerRadius: 27,
                  // animationMatchesGesture: true,
                }}
              />

                <Stack.Screen


                name="(routes)/experiment-guidance"
                options={{
                  headerShown: false,
                  // presentation: "modal",
                  // sheetAllowedDetents: [0.5, 0.7, 1],
                  // sheetGrabberVisible: true,
                  // sheetCornerRadius: 27,
                  // animationMatchesGesture: true,
                }}
              />
            </Stack>
            <StatusBar style="auto" />
          </AuthProvider>
          {/* </NavigationThemeProvider> */}
        </BottomSheetModalProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
