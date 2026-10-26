import { useTheme } from "@/contexts/ThemeContext";
import { Plane } from "@hugeicons/core-free-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

const { width } = Dimensions.get("window");
const CARD_SIZE = width * 0.82;
const SWIPE_THRESHOLD = 60;

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
  blue: "#3b7ef6",
  amber: "#ff9f0a",
  red: "#ff3b30",
  purple: "#7c5cfc",
};

// ── Illustrations (unchanged — they're good) ─────────────────────────────────
function ScientistIllustration() {
  return (
    <Svg viewBox="0 0 280 210" width="100%" height="100%" fill="none">
      <Rect x="10" y="30" width="260" height="6" rx="3" fill="#F3F4F6" />
      <Path
        d="M30 36 L26 60 Q26 66 32 66 Q38 66 38 60 L34 36Z"
        fill="#BFDBFE"
        opacity="0.7"
      />
      <Rect x="29" y="33" width="6" height="4" rx="1" fill="#93C5FD" />
      <Path
        d="M55 36 L51 55 Q51 62 57 62 Q63 62 63 55 L59 36Z"
        fill="#BBF7D0"
        opacity="0.7"
      />
      <Rect x="54" y="33" width="6" height="4" rx="1" fill="#6EE7B7" />
      <Path
        d="M80 36 L77 58 Q77 64 82 64 Q87 64 87 58 L84 36Z"
        fill="#FDE68A"
        opacity="0.8"
      />
      <Rect x="79" y="33" width="6" height="4" rx="1" fill="#FCD34D" />
      <Rect x="10" y="155" width="260" height="10" rx="4" fill="#E8D5B0" />
      <Rect x="20" y="165" width="14" height="40" rx="4" fill="#D4B88A" />
      <Rect x="246" y="165" width="14" height="40" rx="4" fill="#D4B88A" />
      <Rect x="198" y="120" width="8" height="36" rx="2" fill="#374151" />
      <Rect x="190" y="150" width="24" height="6" rx="2" fill="#374151" />
      <Ellipse cx="202" cy="120" rx="14" ry="10" fill="#4B5563" />
      <Circle cx="202" cy="120" r="6" fill="#1F2937" />
      <Circle cx="202" cy="120" r="3" fill="#111827" />
      <Path
        d="M240 130 L236 152 Q236 158 242 158 Q248 158 248 152 L244 130Z"
        fill="#DDD6FE"
        opacity="0.8"
      />
      <Rect x="239" y="127" width="10" height="5" rx="2" fill="#C4B5FD" />
      <Path d="M110 200 Q110 160 140 155 Q170 160 170 200" fill="#FFFFFF" />
      <Path
        d="M110 200 Q110 160 120 157 L130 175 L140 160 L150 175 L160 157 Q170 160 170 200"
        fill="#E5E7EB"
        opacity="0.6"
      />
      <Path
        d="M128 157 L134 175 L140 160"
        fill="none"
        stroke="#D1D5DB"
        strokeWidth="1.5"
      />
      <Path
        d="M152 157 L146 175 L140 160"
        fill="none"
        stroke="#D1D5DB"
        strokeWidth="1.5"
      />
      <Path
        d="M112 162 Q95 170 90 188"
        stroke="#F5D0A9"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M168 162 Q185 145 192 128"
        stroke="#F5D0A9"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />
      <Ellipse cx="90" cy="191" rx="7" ry="6" fill="#F5D0A9" />
      <Ellipse cx="193" cy="126" rx="7" ry="6" fill="#F5D0A9" />
      <Rect
        x="196"
        y="95"
        width="10"
        height="34"
        rx="5"
        fill="#FEF3C7"
        stroke="#FCD34D"
        strokeWidth="1.5"
      />
      <Rect
        x="197"
        y="112"
        width="8"
        height="16"
        rx="4"
        fill="#34D399"
        opacity="0.85"
      />
      <Ellipse cx="201" cy="104" rx="3" ry="2" fill="white" opacity="0.5" />
      <Rect x="135" y="130" width="10" height="18" rx="5" fill="#F5D0A9" />
      <Ellipse cx="140" cy="118" rx="22" ry="24" fill="#F5D0A9" />
      <Path d="M118 112 Q118 88 140 86 Q162 88 162 112" fill="#5C3D2E" />
      <Ellipse cx="140" cy="87" rx="12" ry="11" fill="#5C3D2E" />
      <Ellipse cx="140" cy="80" rx="8" ry="7" fill="#7C5239" />
      <Ellipse cx="132" cy="116" rx="3.5" ry="4" fill="white" />
      <Ellipse cx="148" cy="116" rx="3.5" ry="4" fill="white" />
      <Circle cx="133" cy="117" r="2.2" fill="#5C3D2E" />
      <Circle cx="149" cy="117" r="2.2" fill="#5C3D2E" />
      <Circle cx="133.8" cy="116.2" r="0.8" fill="white" />
      <Circle cx="149.8" cy="116.2" r="0.8" fill="white" />
      <Path
        d="M129 111 Q133 109 137 110.5"
        stroke="#5C3D2E"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M145 110.5 Q149 109 153 111"
        stroke="#5C3D2E"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M139 120 Q137 125 140 126 Q143 125 141 120"
        fill="none"
        stroke="#D4956A"
        strokeWidth="1"
      />
      <Path
        d="M134 130 Q140 135 146 130"
        stroke="#C97B5A"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <Rect
        x="127"
        y="113"
        width="14"
        height="9"
        rx="4"
        stroke="#374151"
        strokeWidth="1.5"
        fill="none"
      />
      <Rect
        x="143"
        y="113"
        width="14"
        height="9"
        rx="4"
        stroke="#374151"
        strokeWidth="1.5"
        fill="none"
      />
      <Line
        x1="141"
        y1="117"
        x2="143"
        y2="117"
        stroke="#374151"
        strokeWidth="1.5"
      />
      <Line
        x1="113"
        y1="117"
        x2="127"
        y2="117"
        stroke="#374151"
        strokeWidth="1"
      />
      <Line
        x1="157"
        y1="117"
        x2="162"
        y2="117"
        stroke="#374151"
        strokeWidth="1"
      />
      <Rect
        x="114"
        y="175"
        width="14"
        height="10"
        rx="2"
        stroke="#D1D5DB"
        strokeWidth="1"
        fill="none"
      />
      <Rect x="116" y="173" width="10" height="3" rx="1" fill="#60A5FA" />
    </Svg>
  );
}

function DNAIllustration() {
  const dnaPoints: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const leftPts: string[] = [],
    rightPts: string[] = [];
  const SX = 60,
    EX = 180,
    CY = 105,
    AMP = 32,
    STEPS = 120;
  for (let i = 0; i <= STEPS; i++) {
    const x = SX + (i / STEPS) * (EX - SX);
    const angle = i * ((Math.PI * 2) / STEPS) * 5;
    const y1 = CY + Math.sin(angle) * AMP;
    const y2 = CY + Math.sin(angle + Math.PI) * AMP;
    leftPts.push(`${x},${y1}`);
    rightPts.push(`${x},${y2}`);
    if (i % 12 === 0) dnaPoints.push({ x1: x, y1, x2: x, y2 });
  }
  const HX = 210,
    HY = 148,
    HR = 30;
  return (
    <Svg viewBox="0 0 280 210" width="100%" height="100%" fill="none">
      <Defs>
        <LinearGradient id="strand1" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#60A5FA" />
          <Stop offset="1" stopColor="#A78BFA" />
        </LinearGradient>
        <LinearGradient id="strand2" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#F472B6" />
          <Stop offset="1" stopColor="#FB923C" />
        </LinearGradient>
        <LinearGradient id="haem" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FCA5A5" />
          <Stop offset="1" stopColor="#EF4444" />
        </LinearGradient>
      </Defs>
      {dnaPoints.map((p, i) => (
        <Line
          key={`r-${i}`}
          x1={p.x1}
          y1={p.y1}
          x2={p.x2}
          y2={p.y2}
          stroke={i % 2 === 0 ? "#BAE6FD" : "#FDE68A"}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.85"
        />
      ))}
      <Path
        d={`M ${leftPts.join(" L ")}`}
        stroke="url(#strand1)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={`M ${rightPts.join(" L ")}`}
        stroke="url(#strand2)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {dnaPoints.map((p, i) => (
        <React.Fragment key={`n-${i}`}>
          <Circle
            cx={p.x1}
            cy={p.y1}
            r="5"
            fill={["#60A5FA", "#A78BFA", "#34D399", "#FBBF24"][i % 4]}
            opacity="0.9"
          />
          <Circle
            cx={p.x2}
            cy={p.y2}
            r="5"
            fill={["#F472B6", "#FB923C", "#818CF8", "#2DD4BF"][i % 4]}
            opacity="0.9"
          />
        </React.Fragment>
      ))}
      <Ellipse
        cx={HX}
        cy={HY + 4}
        rx={HR + 4}
        ry={8}
        fill="#E5E7EB"
        opacity="0.5"
      />
      <Circle
        cx={HX}
        cy={HY}
        r={HR}
        stroke="url(#haem)"
        strokeWidth="3"
        fill="#FEF2F2"
        opacity="0.9"
      />
      {[0, 90, 180, 270].map((deg, i) => {
        const r = (deg * Math.PI) / 180;
        return (
          <Rect
            key={`p-${i}`}
            x={HX + Math.cos(r) * (HR * 0.62) - 7}
            y={HY + Math.sin(r) * (HR * 0.62) - 5}
            width="14"
            height="10"
            rx="3"
            fill="#FCA5A5"
            stroke="#EF4444"
            strokeWidth="1"
            opacity="0.85"
          />
        );
      })}
      <Circle cx={HX} cy={HY} r="9" fill="#EF4444" opacity="0.9" />
      <Circle cx={HX} cy={HY} r="5" fill="#DC2626" />
      <Circle cx={HX - 2} cy={HY - 2} r="2" fill="white" opacity="0.5" />
      <Rect x="20" y="196" width="240" height="5" rx="2.5" fill="#F3F4F6" />
    </Svg>
  );
}

function RocketIllustration() {
  return (
    <Svg viewBox="0 0 280 200" width="100%" height="100%" fill="none">
      <Circle cx="40" cy="30" r="2" fill="#FDE68A" />
      <Circle cx="240" cy="50" r="2.5" fill="#FDE68A" />
      <Circle cx="60" cy="160" r="1.5" fill="#FDE68A" />
      <Circle cx="220" cy="140" r="2" fill="#FDE68A" />
      <Circle cx="140" cy="20" r="1.5" fill="#FDE68A" />
      <Circle cx="180" cy="170" r="1.5" fill="#A5F3FC" />
      <Path
        d="M140 20 C140 20 110 60 108 110 L140 130 L172 110 C170 60 140 20 140 20Z"
        fill="#1A1A2E"
      />
      <Circle cx="140" cy="80" r="18" fill="#2D6CDF" opacity="0.9" />
      <Circle cx="140" cy="80" r="12" fill="#60A5FA" opacity="0.7" />
      <Circle cx="135" cy="76" r="4" fill="white" opacity="0.4" />
      <Path d="M108 110 L80 140 L108 130Z" fill="#374151" />
      <Path d="M172 110 L200 140 L172 130Z" fill="#374151" />
      <Ellipse cx="140" cy="138" rx="14" ry="20" fill="#FBBF24" opacity="0.9" />
      <Ellipse cx="140" cy="142" rx="9" ry="14" fill="#F97316" opacity="0.85" />
      <Ellipse cx="140" cy="146" rx="5" ry="8" fill="#FEF3C7" opacity="0.9" />
      <Ellipse
        cx="140"
        cy="100"
        rx="70"
        ry="20"
        stroke="#E5E7EB"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        fill="none"
      />
      <Circle cx="210" cy="100" r="8" fill="#A78BFA" opacity="0.8" />
      <Circle cx="70" cy="100" r="6" fill="#34D399" opacity="0.8" />
      <Rect x="20" y="168" width="240" height="6" rx="3" fill="#F3F4F6" />
    </Svg>
  );
}

// ── Step data ─────────────────────────────────────────────────────────────────
const STEPS = [
  {
    Illustration: ScientistIllustration,
    label: "DISCOVER",
    title: "Curiosity\ndriven science",
    subtitle:
      "Explore the science behind breakthroughs — one experiment at a time.",
  },
  {
    Illustration: DNAIllustration,
    label: "UNDERSTAND",
    title: "Life at the\nmolecular level",
    subtitle:
      "From double-stranded DNA to haemoglobin — nature's blueprints are breathtaking.",
  },
  {
    Illustration: RocketIllustration,
    label: "LAUNCH",
    title: "Your best\nwork starts here",
    subtitle:
      "Everything you need to get started — all in one place, ready when you are.",
  },
];

// ── Progress dots — HomeScreen statusDot pattern ──────────────────────────────
function ProgressDots({
  active,
  total,
  colors,
}: {
  active: number;
  total: number;
  colors: any;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            i === active
              ? [s.dotActive, { backgroundColor: colors.black }]
              : [s.dotInactive, { backgroundColor: colors.card }],
          ]}
        />
      ))}
    </View>
  );
}

// ── Social button — runCard-style row ─────────────────────────────────────────
function SocialButton({
  label,
  icon,
  onPress,
  colors,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  colors: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[{ width: "100%" }, { transform: [{ scale }] }]}>
      <Pressable
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.97,
            useNativeDriver: true,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
        }
        onPress={onPress}
        style={[s.socialBtn, { backgroundColor: colors.card }]}
      >
        <View style={s.socialIconWrap}>{icon}</View>
        <Text style={[s.socialLabel, { color: colors.textPrimary }]}>
          {label}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 16 }}>›</Text>
      </Pressable>
    </Animated.View>
  );
}

// ── Brand icons ───────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}
function AppleIcon({ colors }: { colors: any }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill={colors.black}>
      <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </Svg>
  );
}
function MicrosoftIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 24 24">
      <Rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <Rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <Rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <Rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </Svg>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { colors, isDark } = useTheme();
  const [step, setStep] = useState(0);

  const cardFade = useRef(new Animated.Value(1)).current;
  const cardSlideX = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(1)).current;
  const textSlideX = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const swipeHintX = useRef(new Animated.Value(0)).current;

  // Gentle float
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -7,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  // Swipe hint nudge
  useEffect(() => {
    Animated.sequence([
      Animated.delay(900),
      Animated.timing(swipeHintX, {
        toValue: -10,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(swipeHintX, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(swipeHintX, {
        toValue: -7,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(swipeHintX, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateToStep = (next: number, dir: "left" | "right") => {
    const exitX = dir === "left" ? -width * 0.38 : width * 0.38;
    const enterX = dir === "left" ? width * 0.38 : -width * 0.38;
    Animated.parallel([
      Animated.timing(cardFade, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(cardSlideX, {
        toValue: exitX,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(textFade, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(textSlideX, {
        toValue: exitX * 0.18,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(next);
      cardSlideX.setValue(enterX);
      textSlideX.setValue(enterX * 0.18);
      Animated.parallel([
        Animated.spring(cardFade, { toValue: 1, useNativeDriver: true }),
        Animated.spring(cardSlideX, {
          toValue: 0,
          tension: 60,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(textFade, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.spring(textSlideX, {
          toValue: 0,
          tension: 60,
          friction: 14,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        cardSlideX.setValue(g.dx * 0.3);
      },
      onPanResponderRelease: (_, g) => {
        const cur = stepRef.current;
        if (g.dx < -SWIPE_THRESHOLD && cur < STEPS.length - 1)
          animateToStep(cur + 1, "left");
        else if (g.dx > SWIPE_THRESHOLD && cur > 0)
          animateToStep(cur - 1, "right");
        else
          Animated.spring(cardSlideX, {
            toValue: 0,
            tension: 80,
            friction: 10,
            useNativeDriver: true,
          }).start();
      },
    }),
  ).current;

  const isLast = step === STEPS.length - 1;
  const { Illustration } = STEPS[step];

  // Dynamic styles based on theme
  const dynamicStyles = {
    root: { backgroundColor: colors.bg },
    skipText: { color: colors.textMuted },
    stepCounterBg: { backgroundColor: colors.card },
    stepCounterText: { color: colors.textMuted },
    dotActive: { backgroundColor: colors.black },
    dotInactive: { backgroundColor: colors.card },
    swipeHint: { color: colors.textMuted },
    cardWrap: { backgroundColor: colors.card },
    cardLabelBg: { backgroundColor: colors.black },
    cardLabelText: { color: colors.white },
    stepLabel: { color: colors.textMuted },
    title: { color: colors.textPrimary },
    subtitle: { color: colors.textMuted },
    cta: { backgroundColor: colors.black },
    ctaText: { color: colors.white },
    signInText: { color: colors.textMuted },
    signInLink: { color: colors.textPrimary },
    socialBtn: { backgroundColor: colors.card },
    socialLabel: { color: colors.textPrimary },
  };

  return (
    <SafeAreaView style={[s.root, dynamicStyles.root]}>
      <StatusBar style={Platform.OS === "ios" ? "inverted" : "light"} />
      {/* ── TOP ROW ── */}
      <View style={s.topRow}>
        {/* Skip — muted text link */}
        <Pressable
          onPress={() => !isLast && animateToStep(STEPS.length - 1, "left")}
          hitSlop={12}
        >
          <Text
            style={[
              s.skipText,
              dynamicStyles.skipText,
              isLast && { opacity: 0 },
            ]}
          >
            Skip
          </Text>
        </Pressable>

        <ProgressDots active={step} total={STEPS.length} colors={colors} />

        {/* Step counter — blockLabelPill-style */}
        <View style={[s.stepCounter, dynamicStyles.stepCounterBg]}>
          <Text style={[s.stepCounterText, dynamicStyles.stepCounterText]}>
            {step + 1}/{STEPS.length}
          </Text>
        </View>
      </View>

      {/* ── SWIPE HINT ── */}
      <Animated.View
        style={{
          transform: [{ translateX: swipeHintX }],
          alignSelf: "center",
          marginTop: 2,
        }}
      >
        <Text style={[s.swipeHint, dynamicStyles.swipeHint]}>
          swipe to navigate
        </Text>
      </Animated.View>

      {/* ── ILLUSTRATION CARD — labCardSecondary (C.card surface, high borderRadius) ── */}
      <Animated.View
        {...pan.panHandlers}
        style={[
          s.cardWrap,
          dynamicStyles.cardWrap,
          {
            opacity: cardFade,
            transform: [{ translateX: cardSlideX }, { translateY: floatY }],
          },
        ]}
      >
        {/* Step label pill — blockLabelPill on card */}
        <View style={[s.cardLabelPill, dynamicStyles.cardLabelBg]}>
          <Text style={[s.cardLabelText, dynamicStyles.cardLabelText]}>
            {STEPS[step].label}
          </Text>
        </View>
        <Illustration />
      </Animated.View>

      {/* ── TEXT BLOCK ── */}
      <Animated.View
        style={[
          s.textBlock,
          { opacity: textFade, transform: [{ translateX: textSlideX }] },
        ]}
      >
        {/* Section title — exact HomeScreen */}
        <Text style={[s.stepLabel, dynamicStyles.stepLabel]}>
          {STEPS[step].label}
        </Text>
        <Text style={[s.title, dynamicStyles.title]}>{STEPS[step].title}</Text>
        <Text style={[s.subtitle, dynamicStyles.subtitle]}>
          {STEPS[step].subtitle}
        </Text>
      </Animated.View>

      {/* ── CTA AREA ── */}
      <View style={s.ctaArea}>
        {!isLast ? (
          <>
            {/* Continue — sheetCTA / qaCardPrimary */}
            <Pressable
              style={({ pressed }) => [
                s.cta,
                dynamicStyles.cta,
                pressed && { opacity: 0.82 },
              ]}
              onPress={() => animateToStep(step + 1, "left")}
            >
              <Text style={[s.ctaText, dynamicStyles.ctaText]}>Continue →</Text>
            </Pressable>

            <View style={s.signInRow}>
              <Text style={[s.signInText, dynamicStyles.signInText]}>
                Already have an account?{" "}
              </Text>
              <Pressable onPress={() => router.push("/login")}>
                <Text style={[s.signInLink, dynamicStyles.signInLink]}>
                  Sign in
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          /* Last step — social sign up — qaCardSecondary rows */
          <View style={s.socialBlock}>
            {/* Header — HomeScreen greeting pattern */}
            <Text style={[s.socialGreeting, dynamicStyles.stepLabel]}>
              GET STARTED
            </Text>
            <Text style={[s.socialTitle, dynamicStyles.title]}>
              Create your account
            </Text>
            <Text style={[s.socialSubtitle, dynamicStyles.subtitle]}>
              Choose how you'd like to sign up
            </Text>

            <View style={s.socialList}>
              <SocialButton
                label="Continue with Google"
                icon={<GoogleIcon />}
                onPress={() => router.push("/register")}
                colors={colors}
              />
              <SocialButton
                label="Continue with Apple"
                icon={<AppleIcon colors={colors} />}
                onPress={() => router.push("/register")}
                colors={colors}
              />
              <SocialButton
                label="Continue with Microsoft"
                icon={<MicrosoftIcon />}
                onPress={() => router.push("/register")}
                colors={colors}
              />
            </View>

            <View style={s.signInRow}>
              <Text style={[s.signInText, dynamicStyles.signInText]}>
                Already have an account?{" "}
              </Text>
              <Pressable onPress={() => router.push("/login")}>
                <Text style={[s.signInLink, dynamicStyles.signInLink]}>
                  Sign in
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },

  // Top row
  topRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skipText: { fontSize: 14, color: C.textMuted, fontWeight: "600", width: 36 },
  stepCounter: {
    backgroundColor: C.card,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stepCounterText: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 0.5,
  },

  // Progress dots
  dot: { height: 7, borderRadius: 99 },
  dotActive: { width: 22, backgroundColor: C.black },
  dotInactive: { width: 7, backgroundColor: C.card },

  // Swipe hint
  swipeHint: {
    fontSize: 11,
    color: C.card,
    letterSpacing: 0.3,
    fontWeight: "600",
  },

  // Illustration card — labCardSecondary
  cardWrap: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    backgroundColor: C.card,
    borderRadius: 28,
    overflow: "hidden",
    padding: 16,
    // transform: [{ rotate: "-1deg" }],
  },
  cardLabelPill: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 1,
    backgroundColor: C.black,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cardLabelText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 1,
  },

  // Text block
  textBlock: { width: "100%", alignItems: "center", paddingHorizontal: 4 },
  stepLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: C.textPrimary,
    textAlign: "center",
    letterSpacing: -1,
    lineHeight: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
    fontWeight: "500",
  },

  // CTA
  ctaArea: { width: "100%", alignItems: "center", gap: 0 },
  cta: {
    width: "100%",
    backgroundColor: C.black,
    paddingVertical: 18,
    borderRadius: 26,
    alignItems: "center",
  },
  ctaText: {
    color: C.white,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  signInRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  signInText: { fontSize: 13, color: C.textMuted, fontWeight: "500" },
  signInLink: { fontSize: 13, color: C.textPrimary, fontWeight: "700" },

  // Social block — last step
  socialBlock: { width: "100%", alignItems: "center", gap: 6 },
  socialGreeting: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1.5,
  },
  socialTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  socialSubtitle: { fontSize: 13, color: C.textMuted, marginBottom: 8 },
  socialList: { width: "100%", gap: 8 },

  // Social button — runCard / qaCardSecondary
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    width: "100%",
  },
  socialIconWrap: { width: 28, alignItems: "center" },
  socialLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.2,
  },
});
