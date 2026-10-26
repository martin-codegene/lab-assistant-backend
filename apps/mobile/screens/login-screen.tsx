import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

const { width } = Dimensions.get("window");

// ── DESIGN TOKENS — HomeScreen exact ─────────────────────────────────────────
const C = {
  bg: "#ffffff",
  card: "#f4f4f7",
  black: "#000000",
  textPrimary: "#1a1a1e",
  textSecondary: "#4a4a4e",
  textMuted: "#8e8e93",
  white: "#ffffff",
  green: "#24b35f",
  red: "#ff3b30",
  separator: "#e8e8ed",
};

// ── Inline SVG icons ──────────────────────────────────────────────────────────
function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={C.textMuted}
        strokeWidth="1.8"
      />
      <Circle cx="12" cy="12" r="3" stroke={C.textMuted} strokeWidth="1.8" />
      {!visible && (
        <Line
          x1="3"
          y1="3"
          x2="21"
          y2="21"
          stroke={C.textMuted}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </Svg>
  );
}

function MailIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke={C.textMuted}
        strokeWidth="1.8"
      />
      <Path
        d="M3 8l9 6 9-6"
        stroke={C.textMuted}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PhoneIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Rect
        x="5"
        y="2"
        width="14"
        height="20"
        rx="3"
        stroke={C.textMuted}
        strokeWidth="1.8"
      />
      <Circle cx="12" cy="18" r="1" fill={C.textMuted} />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <Rect
        x="5"
        y="11"
        width="14"
        height="11"
        rx="2"
        stroke={C.textMuted}
        strokeWidth="1.8"
      />
      <Path
        d="M8 11V7a4 4 0 018 0v4"
        stroke={C.textMuted}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="16" r="1.5" fill={C.textMuted} />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={C.textPrimary}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── App logo mark ─────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <Svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <Rect width="44" height="44" rx="14" fill={C.black} />
      <Path
        d="M11 33L22 11l11 22"
        stroke={C.white}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Line
        x1="15.5"
        y1="26"
        x2="28.5"
        y2="26"
        stroke={C.white}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [step, setStep] = useState<"identifier" | "checking" | "password">(
    "identifier",
  );
  const [error, setError] = useState("");

  const identifierRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  // Entrance animation
  const entranceFade = useRef(new Animated.Value(0)).current;
  const entranceY = useRef(new Animated.Value(24)).current;
  // Content cross-fade
  const contentFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(entranceY, {
        toValue: 0,
        tension: 60,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const crossFade = (cb: () => void) => {
    Animated.timing(contentFade, {
      toValue: 0,
      duration: 130,
      useNativeDriver: true,
    }).start(() => {
      cb();
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleNext = () => {
    setError("");
    const val = identifier.trim();
    if (!val) {
      setError(
        mode === "email"
          ? "Enter your email address."
          : "Enter your phone number.",
      );
      return;
    }
    if (mode === "email" && !val.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    Keyboard.dismiss();
    setStep("checking");
    setTimeout(() => {
      crossFade(() => {
        setStep("password");
        setTimeout(() => passwordRef.current?.focus(), 60);
      });
    }, 1200);
  };

  const handleSignIn = async () => {
    setError("");
    if (!password) {
      setError("Enter your password.");
      return;
    }
    Keyboard.dismiss();
    setStep("checking");
    try {
      await login(identifier, password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setStep("password");
      setError(e.message || "Login failed. Check your credentials.");
      Alert.alert(
        "Login Failed",
        e.message || "Please check your email and password.",
        [{ text: "OK" }],
      );
    }
  };

  const handleBack = () => {
    setError("");
    setPassword("");
    crossFade(() => {
      setStep("identifier");
      setTimeout(() => identifierRef.current?.focus(), 60);
    });
  };

  const isChecking = step === "checking" || isLoading;
  const isPasswordStep = step === "password";

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View
              style={[
                s.container,
                {
                  opacity: entranceFade,
                  transform: [{ translateY: entranceY }],
                },
              ]}
            >
              {/* ── TOP BAR ── */}
              <View style={s.topBar}>
                {isPasswordStep && (
                  <Pressable
                    onPress={handleBack}
                    style={s.backBtn}
                    hitSlop={12}
                  >
                    <Text style={s.backArrow}>←</Text>
                  </Pressable>
                )}
              </View>

              {/* ── LOGO + GREETING — HomeScreen header pattern ── */}
              <View style={s.logoBlock}>
                <LogoMark />
                <View style={s.logoLabels}>
                  <Text style={s.logoGreeting}>LAB ASSISTANT</Text>
                  <Text style={s.logoTitle}>Sign in</Text>
                </View>
              </View>

              {/* ── FORM BLOCK ── */}
              <Animated.View style={[s.formBlock, { opacity: contentFade }]}>
                {/* Identifier confirmed chip — HomeScreen tag chip pattern */}
                {isPasswordStep && (
                  <Pressable
                    onPress={handleBack}
                    style={s.identifierChip}
                    hitSlop={4}
                  >
                    <CheckIcon />
                    <Text style={s.identifierChipText} numberOfLines={1}>
                      {identifier}
                    </Text>
                  </Pressable>
                )}

                {/* Mode toggle — filter chip pair */}
                {!isPasswordStep && (
                  <View style={s.modeToggle}>
                    {(["email", "phone"] as const).map((m) => (
                      <Pressable
                        key={m}
                        style={[s.modeChip, mode === m && s.modeChipActive]}
                        onPress={() => {
                          setMode(m);
                          setIdentifier("");
                          setError("");
                        }}
                      >
                        <Text
                          style={[
                            s.modeChipText,
                            mode === m && s.modeChipTextActive,
                          ]}
                        >
                          {m === "email" ? "Email" : "Phone"}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Input card — single white card with icon prefix */}
                <View style={s.formCard}>
                  {!isPasswordStep && (
                    <View style={s.inputRow}>
                      <View style={s.inputIconWrap}>
                        {mode === "email" ? <MailIcon /> : <PhoneIcon />}
                      </View>
                      {mode === "phone" && (
                        <View style={s.phonePre}>
                          <Text style={s.phonePreText}>🇿🇲 +260</Text>
                          <View style={s.phoneSep} />
                        </View>
                      )}
                      <TextInput
                        ref={identifierRef}
                        style={s.input}
                        placeholder={
                          mode === "email" ? "name@example.com" : "097 000 0000"
                        }
                        placeholderTextColor={C.textMuted}
                        keyboardType={
                          mode === "email" ? "email-address" : "phone-pad"
                        }
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={identifier}
                        onChangeText={(t) => {
                          setIdentifier(t);
                          setError("");
                        }}
                        editable={!isChecking}
                        returnKeyType="next"
                        onSubmitEditing={handleNext}
                      />
                    </View>
                  )}

                  {isPasswordStep && (
                    <>
                      {/* Hairline separator between rows inside formCard */}
                      <View style={s.inputRow}>
                        <View style={s.inputIconWrap}>
                          <LockIcon />
                        </View>
                        <TextInput
                          ref={passwordRef}
                          style={s.input}
                          placeholder="Password"
                          placeholderTextColor={C.textMuted}
                          secureTextEntry={!showPwd}
                          autoCapitalize="none"
                          autoCorrect={false}
                          value={password}
                          onChangeText={(t) => {
                            setPassword(t);
                            setError("");
                          }}
                          returnKeyType="done"
                          onSubmitEditing={handleSignIn}
                        />
                        <Pressable
                          onPress={() => setShowPwd((v) => !v)}
                          style={s.eyeBtn}
                          hitSlop={8}
                        >
                          <EyeIcon visible={showPwd} />
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>

                {/* Forgot password — right-aligned muted link */}
                {isPasswordStep && (
                  <Pressable style={s.forgotWrap} hitSlop={10}>
                    <Text style={s.forgotText}>Forgot password?</Text>
                  </Pressable>
                )}

                {/* Error banner — HomeScreen red card pattern */}
                {!!error && (
                  <View style={s.errorCard}>
                    <View style={s.errorDot} />
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                )}

                {/* CTA — qaCardPrimary / sheetCTA */}
                <Pressable
                  style={({ pressed }) => [
                    s.cta,
                    isChecking && s.ctaDisabled,
                    pressed && !isChecking && { opacity: 0.82 },
                  ]}
                  onPress={isPasswordStep ? handleSignIn : handleNext}
                  disabled={isChecking}
                >
                  {isChecking ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <ActivityIndicator color={C.white} size="small" />
                      <Text style={s.ctaText}>
                        {isPasswordStep ? "Signing in…" : "Checking…"}
                      </Text>
                    </View>
                  ) : (
                    <Text style={s.ctaText}>
                      {isPasswordStep ? "Sign In" : "Continue"}
                    </Text>
                  )}
                </Pressable>
              </Animated.View>

              {/* ── FOOTER ── */}
              <View style={s.footer}>
                <Text style={s.footerText}>No account? </Text>
                <Pressable
                  hitSlop={10}
                  onPress={() => router.push("/register")}
                >
                  <Text style={s.footerLink}>Create one</Text>
                </Pressable>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, paddingHorizontal: 24, paddingBottom: 32 },

  // Top bar
  topBar: { height: 52, justifyContent: "center" },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: { fontSize: 20, color: C.textPrimary, lineHeight: 24 },

  // Logo block — HomeScreen greeting + title pattern
  logoBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 44,
  },
  logoLabels: { gap: 2 },
  logoGreeting: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1.5,
  },
  logoTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -1,
  },

  // Form block
  formBlock: { gap: 14 },

  // Identifier confirmed chip — HomeScreen tagChip
  identifierChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.card,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  identifierChipText: {
    fontSize: 14,
    color: C.textPrimary,
    fontWeight: "600",
    maxWidth: width - 120,
  },

  // Mode toggle — filterChip pair
  modeToggle: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 4,
  },
  modeChip: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 16 },
  modeChipActive: { backgroundColor: C.black },
  modeChipText: { fontSize: 13, fontWeight: "700", color: C.textMuted },
  modeChipTextActive: { color: C.white },

  // Input card — C.card surface, white inputs
  formCard: { backgroundColor: C.card, borderRadius: 24, overflow: "hidden" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  inputIconWrap: { paddingRight: 10 },
  input: {
    flex: 1,
    fontSize: 16,
    color: C.textPrimary,
    paddingVertical: 18,
    fontWeight: "500",
  },
  eyeBtn: { paddingLeft: 12, paddingVertical: 18 },

  // Phone prefix
  phonePre: { flexDirection: "row", alignItems: "center" },
  phonePreText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textSecondary,
    marginRight: 10,
  },
  phoneSep: {
    width: 1,
    height: 22,
    backgroundColor: C.separator,
    marginRight: 10,
  },

  // Forgot
  forgotWrap: { alignSelf: "flex-end" },
  forgotText: { fontSize: 13, color: C.textMuted, fontWeight: "600" },

  // Error card — red card HomeScreen pattern
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ff3b3012",
    borderRadius: 20,
    padding: 16,
  },
  errorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.red,
    flexShrink: 0,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: C.red,
    fontWeight: "500",
    lineHeight: 19,
  },

  // CTA — qaCardPrimary / sheetCTA
  cta: {
    backgroundColor: C.black,
    borderRadius: 22,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaDisabled: { backgroundColor: C.card },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
    color: C.white,
    letterSpacing: 0.2,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 32,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: { fontSize: 14, color: C.textMuted },
  footerLink: { fontSize: 14, color: C.textPrimary, fontWeight: "700" },
});
