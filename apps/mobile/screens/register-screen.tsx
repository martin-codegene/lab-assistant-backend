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

// ─── Icons ────────────────────────────────────────────────────────────────────────
const EyeIcon = ({ visible }: { visible: boolean }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      stroke="#999"
      strokeWidth="1.8"
    />
    <Circle cx="12" cy="12" r="3" stroke="#999" strokeWidth="1.8" />
    {!visible && (
      <Line
        x1="3"
        y1="3"
        x2="21"
        y2="21"
        stroke="#999"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    )}
  </Svg>
);

const MailIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Rect
      x="3"
      y="5"
      width="18"
      height="14"
      rx="2"
      stroke="#999"
      strokeWidth="1.8"
    />
    <Path
      d="M3 8l9 6 9-6"
      stroke="#999"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </Svg>
);

const UserIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke="#999" strokeWidth="1.8" />
    <Path
      d="M4 20c0-4 3.5-7 8-7s8 3 8 7"
      stroke="#999"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </Svg>
);

const LockIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Rect
      x="5"
      y="11"
      width="14"
      height="11"
      rx="2"
      stroke="#999"
      strokeWidth="1.8"
    />
    <Path
      d="M8 11V7a4 4 0 018 0v4"
      stroke="#999"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <Circle cx="12" cy="16" r="1.5" fill="#999" />
  </Svg>
);

const BackIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12l7-7M5 12l7 7"
      stroke="#111"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const { register, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [step, setStep] = useState<"info" | "password" | "creating">("info");
  const [error, setError] = useState("");

  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const entranceFade = useRef(new Animated.Value(0)).current;
  const entranceY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entranceFade, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.spring(entranceY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const crossFade = (cb: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start(() => {
      cb();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleNext = () => {
    setError("");
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Enter your name.");
      return;
    }
    if (!trimmedEmail) {
      setError("Enter your email address.");
      return;
    }
    if (!trimmedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    Keyboard.dismiss();
    crossFade(() => {
      setStep("password");
      setTimeout(() => passwordRef.current?.focus(), 60);
    });
  };

  const handleCreateAccount = async () => {
    setError("");

    if (!password) {
      setError("Enter a password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    Keyboard.dismiss();
    setStep("creating");

    try {
      await register({
        email: email.trim(),
        password,
        name: name.trim(),
        role: "RESEARCHER",
        plan: "FREE",
      });

      // Registration successful - navigate to main app
      router.replace("/(tabs)");
    } catch (error: any) {
      setStep("password");
      setError(error.message || "Registration failed. Please try again.");

      // Show alert for better error visibility
      Alert.alert(
        "Registration Failed",
        error.message || "Please check your information and try again.",
        [{ text: "OK" }],
      );
    }
  };

  const handleBack = () => {
    setError("");
    if (step === "password") {
      setPassword("");
      setConfirmPassword("");
      crossFade(() => {
        setStep("info");
        setTimeout(() => nameRef.current?.focus(), 60);
      });
    } else {
      router.back();
    }
  };

  const isCreating = step === "creating" || isLoading;
  const isPasswordStep = step === "password";

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View
              style={[
                styles.container,
                {
                  opacity: entranceFade,
                  transform: [{ translateY: entranceY }],
                },
              ]}
            >
              {/* Top bar */}
              <View style={styles.topBar}>
                <Pressable
                  onPress={handleBack}
                  style={styles.backBtn}
                  hitSlop={12}
                >
                  <BackIcon />
                </Pressable>
              </View>

              {/* Logo */}
              <View style={styles.logoWrap}>
                <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                  <Rect width="30" height="30" rx="8" fill="#111" />
                  <Path
                    d="M7 23L15 7l8 16"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <Line
                    x1="10.5"
                    y1="18"
                    x2="19.5"
                    y2="18"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </Svg>
              </View>

              {/* Heading */}
              <Animated.View
                style={[styles.headingWrap, { opacity: fadeAnim }]}
              >
                {isPasswordStep ? (
                  <>
                    <Text style={styles.heading}>Create a{"\n"}password</Text>
                    <Text style={styles.subheading}>
                      Secure your account with a strong password.
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.heading}>Create account</Text>
                    <Text style={styles.subheading}>
                      Join Lab Assistant to manage your experiments.
                    </Text>
                  </>
                )}
              </Animated.View>

              {/* Form */}
              <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
                {/* Info step */}
                {!isPasswordStep && (
                  <>
                    <View style={styles.inputRow}>
                      <View style={styles.inputIcon}>
                        <UserIcon />
                      </View>
                      <TextInput
                        ref={nameRef}
                        style={styles.input}
                        placeholder="Full name"
                        placeholderTextColor="#bbb"
                        autoCapitalize="words"
                        autoCorrect={false}
                        value={name}
                        onChangeText={(t) => {
                          setName(t);
                          setError("");
                        }}
                        editable={!isCreating}
                        returnKeyType="next"
                        onSubmitEditing={() => emailRef.current?.focus()}
                      />
                    </View>

                    <View style={styles.inputRow}>
                      <View style={styles.inputIcon}>
                        <MailIcon />
                      </View>
                      <TextInput
                        ref={emailRef}
                        style={styles.input}
                        placeholder="name@example.com"
                        placeholderTextColor="#bbb"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={email}
                        onChangeText={(t) => {
                          setEmail(t);
                          setError("");
                        }}
                        editable={!isCreating}
                        returnKeyType="next"
                        onSubmitEditing={handleNext}
                      />
                    </View>
                  </>
                )}

                {/* Password step */}
                {isPasswordStep && (
                  <>
                    <View style={styles.inputRow}>
                      <View style={styles.inputIcon}>
                        <LockIcon />
                      </View>
                      <TextInput
                        ref={passwordRef}
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#bbb"
                        secureTextEntry={!showPwd}
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={password}
                        onChangeText={(t) => {
                          setPassword(t);
                          setError("");
                        }}
                        returnKeyType="next"
                        onSubmitEditing={() =>
                          confirmPasswordRef.current?.focus()
                        }
                      />
                      <Pressable
                        onPress={() => setShowPwd(!showPwd)}
                        style={styles.eyeBtn}
                        hitSlop={8}
                      >
                        <EyeIcon visible={showPwd} />
                      </Pressable>
                    </View>

                    <View style={styles.inputRow}>
                      <View style={styles.inputIcon}>
                        <LockIcon />
                      </View>
                      <TextInput
                        ref={confirmPasswordRef}
                        style={styles.input}
                        placeholder="Confirm password"
                        placeholderTextColor="#bbb"
                        secureTextEntry={!showConfirmPwd}
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={confirmPassword}
                        onChangeText={(t) => {
                          setConfirmPassword(t);
                          setError("");
                        }}
                        returnKeyType="done"
                        onSubmitEditing={handleCreateAccount}
                      />
                      <Pressable
                        onPress={() => setShowConfirmPwd(!showConfirmPwd)}
                        style={styles.eyeBtn}
                        hitSlop={8}
                      >
                        <EyeIcon visible={showConfirmPwd} />
                      </Pressable>
                    </View>

                    <Text style={styles.passwordHint}>
                      Password must be at least 6 characters
                    </Text>
                  </>
                )}

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <Pressable
                  style={({ pressed }) => [
                    styles.nextBtn,
                    pressed && { opacity: 0.82 },
                  ]}
                  onPress={isPasswordStep ? handleCreateAccount : handleNext}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <View style={styles.checkingRow}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.checkingText}>
                        Creating account...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.nextBtnText}>
                      {isPasswordStep ? "Create Account" : "Next"}
                    </Text>
                  )}
                </Pressable>
              </Animated.View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Pressable hitSlop={10} onPress={() => router.back()}>
                  <Text style={styles.footerLink}>Sign in</Text>
                </Pressable>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  topBar: {
    height: 48,
    justifyContent: "center",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    marginBottom: 32,
  },
  headingWrap: {
    marginBottom: 36,
    gap: 10,
  },
  heading: {
    fontSize: 34,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.7,
  },
  subheading: {
    fontSize: 15,
    color: "#888",
    fontWeight: "400",
  },
  form: {
    flex: 1,
    gap: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e5e5e5",
    borderRadius: 14,
    backgroundColor: "#fafafa",
    overflow: "hidden",
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111",
    paddingVertical: 17,
    paddingRight: 16,
    fontWeight: "500",
  },
  eyeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 17,
  },
  passwordHint: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
    marginTop: -6,
  },
  errorText: {
    fontSize: 13,
    color: "#D93535",
    fontWeight: "500",
    marginTop: -2,
  },
  nextBtn: {
    backgroundColor: "#111",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  nextBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  checkingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkingText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#888",
  },
  footerLink: {
    fontSize: 14,
    color: "#111",
    fontWeight: "700",
  },
});
