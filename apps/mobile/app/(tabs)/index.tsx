import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import {
  AddToListIcon,
  ArrowRight01Icon,
  Beaker,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Flask,
  LiveStreaming01Icon,
  Mic02Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
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

// ── DESIGN TOKENS ────────────────────────────────────────────────────────────
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
  red: "#ff3b30",
};

const TYPE_COLOR: Record<string, string> = {
  PCR: "#7c5cfc",
  Gel: "#3b7ef6",
  Western: "#f0a020",
  ELISA: "#00b37e",
};

// ── TYPES & DATA ─────────────────────────────────────────────────────────────
interface RecentRun {
  id: string;
  protocolName: string;
  type: "PCR" | "Gel" | "Western" | "ELISA";
  date: string;
  status: "success" | "warning" | "failed";
  observation: string;
}

const RECENT_RUNS: RecentRun[] = [
  {
    id: "r1",
    protocolName: "PCR Amplification — 16S rRNA",
    type: "PCR",
    date: "Today, 10:42 AM",
    status: "warning",
    observation:
      "Faint bands detected at 500 bp. Possible low template concentration.",
  },
  {
    id: "r2",
    protocolName: "Agarose Gel Electrophoresis",
    type: "Gel",
    date: "Yesterday, 3:15 PM",
    status: "success",
    observation: "Clean bands at expected sizes. No smearing observed.",
  },
];

// ── COMPONENTS ────────────────────────────────────────────────────────────────

const StatusDot = ({ status }: { status: RecentRun["status"] }) => {
  const colors = { success: C.green, warning: C.amber, failed: C.red };
  const labels = { success: "Success", warning: "Review", failed: "Failed" };
  return (
    <View style={styles.statusRow}>
      <View style={[styles.statusDot, { backgroundColor: colors[status] }]} />
      <Text style={[styles.statusLabel, { color: colors[status] }]}>
        {labels[status]}
      </Text>
    </View>
  );
};

const InsightRow = ({
  rank,
  text,
  success,
}: {
  rank: number;
  text: string;
  success?: boolean;
}) => (
  <View style={styles.insightRow}>
    {success ? (
      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color={C.green} />
    ) : (
      <View style={styles.rankBubble}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>
    )}
    <Text style={styles.insightText}>{text}</Text>
  </View>
);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedRun, setSelectedRun] = useState<RecentRun | null>(null);

  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["65%", "90%"], []);

  const openRun = (run: RecentRun) => {
    setSelectedRun(run);
    sheetRef.current?.present();
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.3}
      />
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>SYSTEM READY</Text>
            <Text style={styles.headerTitle}>Lab AI</Text>
          </View>
          <View style={styles.avatar}>
            <HugeiconsIcon icon={Flask} size={20} color={C.white} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.qaGrid}>
          {[
            {
              label: "Analysis",
              icon: SparklesIcon,
              primary: true,
              route: "/analyze",
            },
            { label: "Protocols", icon: AddToListIcon, route: "/protocols" },
            { label: "Voice", icon: Mic02Icon, route: "/analyze" },
            { label: "Tools", icon: Beaker, route: "/tools" },
          ].map((qa, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [
                styles.qaCard,
                qa.primary ? styles.qaCardPrimary : styles.qaCardSecondary,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => qa.route && router.push(qa.route as any)}
            >
              <HugeiconsIcon
                icon={qa.icon}
                size={22}
                color={qa.primary ? C.white : C.black}
              />
              <Text
                style={[
                  styles.qaLabel,
                  { color: qa.primary ? C.white : C.black },
                ]}
              >
                {qa.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Lab Assistant Features */}
        <Text style={styles.sectionTitle}>LAB ASSISTANT</Text>
        <View style={styles.labAssistantGrid}>
          <Pressable
            style={({ pressed }) => [
              styles.labCard,
              styles.labCardPrimary,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => router.push("/gel-analysis" as any)}
          >
            <View style={styles.labCardHeader}>
              <HugeiconsIcon icon={SparklesIcon} size={20} color={C.white} />
              <Text style={styles.labCardBadge}>READY</Text>
            </View>
            <Text style={styles.labCardTitle}>Gel Image Analysis</Text>
            <Text style={styles.labCardDesc}>
              Upload or capture gel images for AI-powered band detection and
              analysis
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.labCard,
              styles.labCardSecondary,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => router.push("/protocol-capture" as any)}
          >
            <View style={styles.labCardHeader}>
              <HugeiconsIcon icon={AddToListIcon} size={20} color={C.black} />
              <Text style={[styles.labCardBadge, styles.labCardBadgeSecondary]}>
                READY
              </Text>
            </View>
            <Text style={[styles.labCardTitle, { color: C.black }]}>
              Protocol Capture
            </Text>
            <Text style={styles.labCardDesc}>
              Scan handwritten protocols and get AI suggestions
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.labCard,
              // styles.labCardDisabled,
              styles.labCardSecondary,

              pressed && { opacity: 0.8 },
            ]}
            // disabled
            onPress={() => router.push("/experiment-guidance")}
          >
            <View style={styles.labCardHeader}>
              <HugeiconsIcon icon={LiveStreaming01Icon} size={20} color={C.black} />
              <Text style={[styles.labCardBadge, ]}>
                READY
              </Text>
            </View>
            <Text style={[styles.labCardTitle, { color: C.black }]}>
              Live Experiment Assistant
            </Text>
            <Text style={[styles.labCardDesc, { color: C.black}]}>
              Real-time guidance during experiments
            </Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>07</Text>
            <Text style={styles.statLabel}>EXPERIMENTS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>03</Text>
            <Text style={styles.statLabel}>ISSUES</Text>
          </View>
        </View>

        {/* Recent List */}
        <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
        {RECENT_RUNS.map((run) => (
          <Pressable
            key={run.id}
            style={({ pressed }) => [
              styles.runCard,
              pressed && { backgroundColor: "#ededf2" },
            ]}
            onPress={() => openRun(run)}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.runHeader}>
                <Text style={[styles.runType, { color: TYPE_COLOR[run.type] }]}>
                  {run.type}
                </Text>
                <StatusDot status={run.status} />
              </View>
              <Text style={styles.runName}>{run.protocolName}</Text>
              <Text style={styles.runDate}>{run.date}</Text>
            </View>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={18}
              color={C.textMuted}
            />
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Detail Bottom Sheet ── */}
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.sheetHandle}
        backgroundStyle={styles.sheetBg}
        enablePanDownToClose
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          {selectedRun && (
            <>
              <View style={styles.sheetTopRow}>
                <View
                  style={[
                    styles.sheetTypePill,
                    { backgroundColor: TYPE_COLOR[selectedRun.type] + "12" },
                  ]}
                >
                  <Text
                    style={[
                      styles.sheetTypeText,
                      { color: TYPE_COLOR[selectedRun.type] },
                    ]}
                  >
                    {selectedRun.type.toUpperCase()}
                  </Text>
                </View>
                <StatusDot status={selectedRun.status} />
              </View>

              <Text style={styles.sheetTitle}>{selectedRun.protocolName}</Text>
              <View style={styles.sheetMeta}>
                <HugeiconsIcon
                  icon={Clock01Icon}
                  size={13}
                  color={C.textMuted}
                />
                <Text style={styles.sheetMetaText}>{selectedRun.date}</Text>
              </View>

              {/* AI Observation block */}
              <View style={styles.sheetBlock}>
                <View style={styles.blockLabelPill}>
                  <Text style={styles.blockLabelPillText}>AI OBSERVATION</Text>
                </View>
                <Text style={styles.blockBody}>{selectedRun.observation}</Text>
              </View>

              {/* Likely causes block */}
              <View style={styles.sheetBlock}>
                <View style={styles.blockLabelPill}>
                  <Text style={styles.blockLabelPillText}>LIKELY CAUSES</Text>
                </View>
                <View style={{ gap: 16, marginTop: 4 }}>
                  {selectedRun.status === "warning" && (
                    <>
                      <InsightRow
                        rank={1}
                        text="Low DNA template concentration (< 10 ng/μL)"
                      />
                      <InsightRow
                        rank={2}
                        text="Suboptimal annealing temperature adjustment"
                      />
                      <InsightRow
                        rank={3}
                        text="Polymerase degradation check required"
                      />
                    </>
                  )}
                  {selectedRun.status === "failed" && (
                    <>
                      <InsightRow
                        rank={1}
                        text="Primary antibody too concentrated"
                      />
                      <InsightRow rank={2} text="Insufficient blocking time" />
                    </>
                  )}
                  {selectedRun.status === "success" && (
                    <InsightRow
                      rank={0}
                      text="No issues detected. Experiment successful."
                      success
                    />
                  )}
                </View>
              </View>

              {/* Next step block */}
              {selectedRun.status !== "success" && (
                <View style={styles.sheetBlock}>
                  <View style={styles.blockLabelPill}>
                    <Text style={styles.blockLabelPillText}>
                      RECOMMENDED NEXT STEP
                    </Text>
                  </View>
                  <Text style={styles.blockBody}>
                    Optimize based on the ranked causes above. Consider a
                    gradient experiment or reagent concentration adjustment
                    before the next run.
                  </Text>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.sheetCTA,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {
                  sheetRef.current?.dismiss();
                  router.push({
                    pathname: "/experiment-details",
                    params: { id: selectedRun.id },
                  });
                }}
              >
                <HugeiconsIcon icon={SparklesIcon} size={16} color={C.white} />
                <Text style={styles.sheetCTAText}>Open Full Analysis</Text>
              </Pressable>
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 12 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
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

  // Quick Actions
  qaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 32 },
  qaCard: { flex: 1, minWidth: "45%", padding: 20, borderRadius: 24, gap: 12 },
  qaCardPrimary: { backgroundColor: C.black },
  qaCardSecondary: { backgroundColor: C.card },
  qaLabel: { fontSize: 15, fontWeight: "600" },

  // Stats
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 40 },
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

  // List
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1,
    marginBottom: 16,
  },
  runCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
  },
  runHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  runType: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  runName: {
    fontSize: 16,
    fontWeight: "600",
    color: C.textPrimary,
    marginTop: 4,
  },
  runDate: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  // Status
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 12, fontWeight: "700" },

  // Sheet
  sheetBg: { backgroundColor: C.bg, borderRadius: 32 },
  sheetHandle: { backgroundColor: "#e5e5ea", width: 40 },
  sheetContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },
  sheetTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sheetTypePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  sheetTypeText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  sheetTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: C.black,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  sheetMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  sheetMetaText: { fontSize: 13, color: C.textMuted },
  sheetBlock: {
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    gap: 12,
  },
  blockLabelPill: {
    alignSelf: "flex-start",
    backgroundColor: C.black,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  blockLabelPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 1,
  },
  blockBody: { fontSize: 15, color: C.textSecondary, lineHeight: 22 },

  // Insights
  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  rankBubble: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  rankText: { fontSize: 11, fontWeight: "800", color: C.white },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: C.textPrimary,
    lineHeight: 20,
    fontWeight: "500",
  },

  // CTA
  sheetCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: C.black,
    borderRadius: 20,
    paddingVertical: 18,
    marginTop: 12,
  },
  sheetCTAText: { fontSize: 16, fontWeight: "700", color: C.white },

  // Lab Assistant Cards
  labAssistantGrid: { gap: 12, marginBottom: 40 },
  labCard: {
    borderRadius: 24,
    padding: 24,
    gap: 12,
  },
  labCardPrimary: {
    backgroundColor: C.black,
  },
  labCardSecondary: {
    backgroundColor: C.card,
  },
  labCardDisabled: {
    backgroundColor: C.card,
    opacity: 0.6,
  },
  labCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  labCardBadge: {
    fontSize: 9,
    fontWeight: "800",
    color: C.green,
    letterSpacing: 1,
    backgroundColor: C.green + "20",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  labCardBadgeSecondary: {
    color: C.black,
    backgroundColor: C.black + "10",
  },
  labCardBadgeDisabled: {
    color: C.textMuted,
    backgroundColor: C.textMuted + "10",
  },
  labCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.white,
    letterSpacing: -0.5,
  },
  labCardDesc: {
    fontSize: 14,
    color: C.white + "CC",
    lineHeight: 20,
  },
});
