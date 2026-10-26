import {
  Camera01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Image02Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// ── DESIGN TOKENS — mirrors HomeScreen exactly ────────────────────────────────
const C = {
  bg: "#ffffff",
  card: "#f4f4f7",
  black: "#000000",
  textPrimary: "#1a1a1e",
  textSecondary: "#4a4a4e",
  textMuted: "#8e8e93",
  white: "#ffffff",
  green: "#24b35f",
  amber: "#ff9f0a",
  blue: "#3b7ef6",
};

const AI_FEATURES = [
  { text: "Extract text from handwritten notes", done: true },
  { text: "Identify potential safety hazards", done: true },
  { text: "Suggest protocol optimisations", done: false },
  { text: "Highlight missing steps or materials", done: false },
  { text: "Convert to structured digital format", done: false },
];

export default function ProtocolCaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER — HomeScreen header pattern ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>LAB ASSISTANT</Text>
          <Text style={styles.headerTitle}>Protocol Capture</Text>
        </View>
        <Pressable onPress={() => router.back()} style={styles.avatar}>
          <HugeiconsIcon icon={Cancel01Icon} size={18} color={C.white} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero card — labCardPrimary (black) ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroCardHeader}>
            <View style={styles.blockLabelPill}>
              <Text style={styles.blockLabelText}>READY</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: C.amber }]} />
              <Text style={[styles.statusLabel, { color: C.amber }]}>
                OCR Beta
              </Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>
            Scan your{"\n"}handwritten{"\n"}protocols.
          </Text>
          <Text style={styles.heroDesc}>
            Upload or capture any lab protocol. AI will digitise, audit, and
            improve it in seconds.
          </Text>
        </View>

        {/* ── Source cards ── */}
        <Text style={styles.sectionTitle}>CAPTURE METHOD</Text>

        <View style={styles.sourceGroup}>
          <Pressable
            style={({ pressed }) => [
              styles.sourceCard,
              pressed && { backgroundColor: "#ededf2" },
            ]}
          >
            <View style={styles.sourceIconWrap}>
              <HugeiconsIcon icon={Camera01Icon} size={20} color={C.black} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sourceTitle}>Scan Protocol</Text>
              <Text style={styles.sourceDesc}>
                Photograph your handwritten notes
              </Text>
            </View>
            <Text style={styles.sourceArrow}>›</Text>
          </Pressable>

          <View style={styles.sourceSep} />

          <Pressable
            style={({ pressed }) => [
              styles.sourceCard,
              pressed && { backgroundColor: "#ededf2" },
            ]}
          >
            <View style={styles.sourceIconWrap}>
              <HugeiconsIcon icon={Image02Icon} size={20} color={C.black} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sourceTitle}>Upload Image</Text>
              <Text style={styles.sourceDesc}>
                Choose an existing protocol image
              </Text>
            </View>
            <Text style={styles.sourceArrow}>›</Text>
          </Pressable>
        </View>

        {/* ── Stats row — exact HomeScreen statsRow ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>AI TOOLS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>~8s</Text>
            <Text style={styles.statLabel}>AVG TIME</Text>
          </View>
        </View>

        {/* ── AI features — pipeline runCard rows ── */}
        <Text style={styles.sectionTitle}>AI CAPABILITIES</Text>

        {AI_FEATURES.map((f, i) => (
          <View key={i} style={styles.featureCard}>
            <View style={styles.rankBubble}>
              <Text style={styles.rankText}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.featureTitle}>{f.text}</Text>
            </View>
            {f.done ? (
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                size={16}
                color={C.green}
              />
            ) : (
              <View style={styles.soonBadge}>
                <HugeiconsIcon
                  icon={Clock01Icon}
                  size={11}
                  color={C.textMuted}
                />
                <Text style={styles.soonText}>Soon</Text>
              </View>
            )}
          </View>
        ))}

        {/* ── Coming soon banner — black CTA card ── */}
        <View style={styles.comingSoonCard}>
          <View style={styles.comingSoonCardHeader}>
            <View style={styles.blockLabelPill}>
              <Text style={styles.blockLabelText}>COMING SOON</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: C.blue }]} />
              <Text style={[styles.statusLabel, { color: C.blue + "CC" }]}>
                In development
              </Text>
            </View>
          </View>
          <Text style={styles.comingSoonTitle}>Full OCR & AI Analysis</Text>
          <Text style={styles.comingSoonDesc}>
            End-to-end protocol digitisation, hazard flags, and step-by-step
            optimisation will be available in the next release.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.notifyBtn,
              pressed && { opacity: 0.8 },
            ]}
          >
            <HugeiconsIcon icon={SparklesIcon} size={16} color={C.black} />
            <Text style={styles.notifyBtnText}>Notify Me</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 8 },

  // ── Header — exact HomeScreen ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Section title — exact HomeScreen ──
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1,
    marginBottom: 16,
  },

  // ── Hero card — labCardPrimary (black) ──
  heroCard: {
    backgroundColor: C.black,
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    gap: 12,
  },
  heroCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: C.white,
    letterSpacing: -1,
    lineHeight: 40,
  },
  heroDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 21,
  },

  // ── Block label pill — HomeScreen blockLabelPill ──
  blockLabelPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  blockLabelText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 1,
  },

  // ── Status dot / row — exact HomeScreen ──
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 12, fontWeight: "700" },

  // ── Source group — card wrap ──
  sourceGroup: {
    backgroundColor: C.card,
    borderRadius: 24,
    marginBottom: 32,
    overflow: "hidden",
  },
  sourceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: C.card,
  },
  sourceSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e2e2e8",
    marginHorizontal: 20,
  },
  sourceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  sourceTitle: { fontSize: 16, fontWeight: "600", color: C.textPrimary },
  sourceDesc: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  sourceArrow: { fontSize: 22, color: C.textMuted, lineHeight: 24 },

  // ── Stats row — exact HomeScreen ──
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 32 },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
  },
  statValue: { fontSize: 28, fontWeight: "700", color: C.textPrimary },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: C.textMuted,
    marginTop: 4,
    letterSpacing: 1,
  },

  // ── Feature cards — runCard rows ──
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
  },
  featureTitle: { fontSize: 15, fontWeight: "600", color: C.textPrimary },

  // ── Rank bubble — exact HomeScreen ──
  rankBubble: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { fontSize: 11, fontWeight: "800", color: C.white },

  // ── Soon badge ──
  soonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.card,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  soonText: { fontSize: 11, fontWeight: "700", color: C.textMuted },

  // ── Coming soon card — labCardSecondary (light card) ──
  comingSoonCard: {
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 24,
    marginTop: 4,
    gap: 12,
  },
  comingSoonCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  comingSoonTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.5,
  },
  comingSoonDesc: {
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 21,
  },
  // ── Notify button — labCardSecondary inverted (white bg on card) ──
  notifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.white,
    borderRadius: 18,
    paddingVertical: 14,
    marginTop: 4,
  },
  notifyBtnText: { fontSize: 15, fontWeight: "700", color: C.black },
});
