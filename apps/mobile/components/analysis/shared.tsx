/**
 * Shared UI primitives used across GelImageAnalyzer,
 * TroubleshootingAssistant and ProtocolOptimizer.
 * All tokens and patterns mirror the HomeScreen design language.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";

// ── DESIGN TOKENS — HomeScreen exact ─────────────────────────────────────────
export const C = {
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
  blue: "#3b7ef6",
};

// Priority → HomeScreen-consistent colours
export const PRIORITY_CONFIG: Record<
  string,
  { bg: string; dot: string; text: string }
> = {
  CRITICAL: { bg: C.red + "15", dot: C.red, text: C.red },
  HIGH: { bg: C.amber + "15", dot: C.amber, text: C.amber },
  MEDIUM: { bg: C.blue + "15", dot: C.blue, text: C.blue },
  LOW: { bg: C.green + "15", dot: C.green, text: C.green },
};

// ── Section title — exact HomeScreen sectionTitle ─────────────────────────────
export function SectionTitle({ text }: { text: string }) {
  return <Text style={shared.sectionTitle}>{text}</Text>;
}

// ── Observation card — runCard style ─────────────────────────────────────────
export function ObsCard({
  type,
  description,
  confidence,
  location,
}: {
  type: string;
  description: string;
  confidence?: number;
  location?: string;
}) {
  return (
    <View style={shared.runCard}>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={shared.runCardHeader}>
          {/* Type pill — obsType pattern */}
          <View style={shared.obsTypePill}>
            <Text style={shared.obsTypeText}>{type}</Text>
          </View>
          {confidence !== undefined && (
            <View style={shared.confMini}>
              <Text style={shared.confMiniText}>
                {(confidence * 100).toFixed(0)}%
              </Text>
            </View>
          )}
        </View>
        <Text style={shared.runCardName}>{description}</Text>
        {location && <Text style={shared.runCardDate}>⌖ {location}</Text>}
      </View>
    </View>
  );
}

// ── Recommendation card — runCard with left priority border ──────────────────
export function RecCard({
  action,
  rationale,
  estimatedTime,
  priority,
}: {
  action: string;
  rationale?: string;
  estimatedTime?: string;
  priority: string;
}) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.LOW;
  return (
    <View
      style={[shared.runCard, { borderLeftWidth: 3, borderLeftColor: cfg.dot }]}
    >
      <View style={{ flex: 1, gap: 6 }}>
        <View style={shared.runCardHeader}>
          <Text style={[shared.runCardName, { flex: 1 }]}>{action}</Text>
          <View style={[shared.priorityBadge, { backgroundColor: cfg.bg }]}>
            <View style={[shared.statusDot, { backgroundColor: cfg.dot }]} />
            <Text style={[shared.priorityText, { color: cfg.text }]}>
              {priority}
            </Text>
          </View>
        </View>
        {rationale && <Text style={shared.runCardDate}>{rationale}</Text>}
        {estimatedTime && (
          <Text style={[shared.runCardDate, { color: C.textMuted }]}>
            Est. time: {estimatedTime}
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Step card — rankBubble + runCard ─────────────────────────────────────────
export function StepCard({
  index,
  step,
  description,
  dependencies,
}: {
  index: number;
  step: string;
  description: string;
  dependencies?: string[];
}) {
  return (
    <View style={shared.runCard}>
      {/* Rank bubble — exact HomeScreen */}
      <View style={shared.rankBubble}>
        <Text style={shared.rankText}>{index + 1}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={shared.runCardName}>{step}</Text>
        <Text style={shared.runCardDate}>{description}</Text>
        {dependencies && dependencies.length > 0 && (
          <Text style={[shared.runCardDate, { color: C.textMuted }]}>
            After: {dependencies.join(", ")}
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Confidence hero — black labCardPrimary ────────────────────────────────────
export function ConfidenceCard({
  title,
  confidence,
  subtitle,
}: {
  title: string;
  confidence?: number;
  subtitle?: string;
}) {
  return (
    <View style={shared.confCard}>
      <View style={shared.confCardTop}>
        <View style={shared.blockLabelPill}>
          <Text style={shared.blockLabelText}>{title.toUpperCase()}</Text>
        </View>
        {subtitle && (
          <View style={shared.statusRow}>
            <View style={[shared.statusDot, { backgroundColor: C.green }]} />
            <Text style={[shared.statusLabel, { color: C.green }]}>
              {subtitle}
            </Text>
          </View>
        )}
      </View>
      {confidence !== undefined && (
        <>
          <Text style={shared.confScore}>
            {(confidence * 100).toFixed(0)}
            <Text style={shared.confScoreSuffix}>%</Text>
          </Text>
          <Text style={shared.confScoreLabel}>CONFIDENCE SCORE</Text>
        </>
      )}
    </View>
  );
}

// ── Error banner ──────────────────────────────────────────────────────────────
export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={shared.errorCard}>
      <View
        style={[
          shared.statusDot,
          { backgroundColor: C.red, width: 8, height: 8, borderRadius: 4 },
        ]}
      />
      <Text style={shared.errorText}>{message}</Text>
    </View>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
export const shared = StyleSheet.create({
  // Section title — exact HomeScreen
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1,
    marginBottom: 16,
  },

  // runCard — exact HomeScreen
  runCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
  },
  runCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  runCardName: { fontSize: 15, fontWeight: "600", color: C.textPrimary },
  runCardDate: { fontSize: 12, color: C.textMuted, lineHeight: 18 },

  // Observation type pill
  obsTypePill: {
    backgroundColor: C.black,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  obsTypeText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 0.8,
  },

  // Confidence mini badge
  confMini: {
    backgroundColor: C.white,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  confMiniText: { fontSize: 11, fontWeight: "800", color: C.textMuted },

  // Priority badge — StatusDot style
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priorityText: { fontSize: 10, fontWeight: "700" },

  // Status dot / row — exact HomeScreen
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusLabel: { fontSize: 12, fontWeight: "700" },

  // Rank bubble — exact HomeScreen rankBubble
  rankBubble: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  rankText: { fontSize: 12, fontWeight: "800", color: C.white },

  // Confidence hero card — labCardPrimary
  confCard: {
    backgroundColor: C.black,
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
    gap: 8,
  },
  confCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  confScore: {
    fontSize: 56,
    fontWeight: "800",
    color: C.white,
    lineHeight: 60,
  },
  confScoreSuffix: {
    fontSize: 28,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
  },
  confScoreLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1.5,
  },

  // Block label pill (on black)
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

  // Error card
  errorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: C.red + "12",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  errorText: { flex: 1, fontSize: 14, color: C.red, lineHeight: 20 },
});
