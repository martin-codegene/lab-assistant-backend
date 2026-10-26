import { Protocol } from "@/lib/api";
import {
  AlertCircleIcon,
  Beaker,
  Cancel01Icon,
  MicroscopeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { GelImageAnalyzer } from "./GelImageAnalyzer";
import { ProtocolOptimizer } from "./ProtocolOptimizer";
import { TroubleshootingAssistant } from "./TroubleshootingAssistant";

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
  amber: "#ff9f0a",
  red: "#ff3b30",
  blue: "#3b7ef6",
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface AnalysisToolsModalProps {
  visible: boolean;
  onClose: () => void;
  experimentId?: string;
  protocol?: Protocol;
  experimentName?: string;
}

type AnalysisTool = "gel" | "troubleshoot" | "optimize" | null;

// ── Tool config ───────────────────────────────────────────────────────────────
const TOOLS = [
  {
    key: "gel" as AnalysisTool,
    icon: MicroscopeIcon,
    title: "Gel Image Analysis",
    desc: "Detect bands, assess quality, and get AI recommendations",
    disabledDesc: "Select an experiment to analyse gel images",
    requiresExp: true,
    requiresProtocol: false,
  },
  {
    key: "troubleshoot" as AnalysisTool,
    icon: AlertCircleIcon,
    title: "Troubleshooting",
    desc: "Diagnose and solve experimental problems with AI",
    disabledDesc: "Select an experiment to troubleshoot",
    requiresExp: true,
    requiresProtocol: false,
  },
  {
    key: "optimize" as AnalysisTool,
    icon: Beaker,
    title: "Protocol Optimisation",
    desc: "Get targeted suggestions to improve your protocol",
    disabledDesc: "Select an experiment with a protocol to use this tool",
    requiresExp: false,
    requiresProtocol: true,
  },
];

// ── Main component ────────────────────────────────────────────────────────────
export const AnalysisToolsModal: React.FC<AnalysisToolsModalProps> = ({
  visible,
  onClose,
  experimentId,
  protocol,
  experimentName,
}) => {
  const [selectedTool, setSelectedTool] = useState<AnalysisTool>(null);
  const insets = useSafeAreaInsets();

  const handleClose = () => {
    setSelectedTool(null);
    onClose();
  };
  const handleBack = () => setSelectedTool(null);

  const hasExperiment = !!experimentId;
  const hasProtocol = !!protocol;

  const isEnabled = (tool: (typeof TOOLS)[0]) =>
    (!tool.requiresExp || hasExperiment) &&
    (!tool.requiresProtocol || hasProtocol);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={s.root} edges={["top"]}>
        {/* ── HEADER — HomeScreen pattern ── */}
        <View style={s.header}>
          {selectedTool ? (
            <Pressable onPress={handleBack} style={s.headerIconBtn}>
              <Text style={s.backArrow}>←</Text>
            </Pressable>
          ) : (
            <View style={{ width: 44 }} />
          )}

          <View style={s.headerCenter}>
            <Text style={s.headerGreeting}>LAB ASSISTANT</Text>
            <Text style={s.headerTitle}>
              {selectedTool
                ? (TOOLS.find((t) => t.key === selectedTool)?.title ??
                  "Analysis")
                : "Analysis Tools"}
            </Text>
          </View>

          <Pressable onPress={handleClose} style={s.headerIconBtn}>
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={18}
              color={C.textPrimary}
            />
          </Pressable>
        </View>

        {/* ── TOOL SELECTION ── */}
        {!selectedTool && (
          <ScrollView
            contentContainerStyle={[
              s.scroll,
              { paddingBottom: insets.bottom + 40 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Context banner — black labCardPrimary if experiment loaded */}
            {hasExperiment && (
              <View style={s.contextCard}>
                <View style={s.blockLabelPill}>
                  <Text style={s.blockLabelText}>ACTIVE EXPERIMENT</Text>
                </View>
                <Text style={s.contextName}>
                  {experimentName || experimentId}
                </Text>
              </View>
            )}

            <Text style={s.sectionTitle}>CHOOSE A TOOL</Text>

            {/* Tool cards — sourceGroup style with hairline separators */}
            <View style={s.toolGroup}>
              {TOOLS.map((tool, i) => {
                const enabled = isEnabled(tool);
                return (
                  <React.Fragment key={tool.key}>
                    <Pressable
                      style={({ pressed }) => [
                        s.toolCard,
                        !enabled && s.toolCardDisabled,
                        pressed && enabled && { backgroundColor: "#ededf2" },
                      ]}
                      onPress={() => enabled && setSelectedTool(tool.key)}
                      disabled={!enabled}
                    >
                      {/* Icon square — white bg inside card */}
                      <View
                        style={[
                          s.toolIconWrap,
                          !enabled && s.toolIconWrapDisabled,
                        ]}
                      >
                        <HugeiconsIcon
                          icon={tool.icon}
                          size={20}
                          color={enabled ? C.black : C.textMuted}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={[s.toolTitle, !enabled && s.toolTitleDisabled]}
                        >
                          {tool.title}
                        </Text>
                        <Text style={s.toolDesc}>
                          {enabled ? tool.desc : tool.disabledDesc}
                        </Text>
                      </View>

                      <Text style={[s.toolArrow, !enabled && { opacity: 0.3 }]}>
                        ›
                      </Text>
                    </Pressable>
                    {i < TOOLS.length - 1 && <View style={s.toolSep} />}
                  </React.Fragment>
                );
              })}
            </View>

            {/* Stats row — exactly HomeScreen statsRow */}
            <View style={s.statsRow}>
              <View style={s.statCard}>
                <Text style={s.statVal}>
                  {TOOLS.filter((t) => isEnabled(t)).length}
                </Text>
                <Text style={s.statLabel}>AVAILABLE</Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statVal}>
                  {TOOLS.filter((t) => !isEnabled(t)).length}
                </Text>
                <Text style={s.statLabel}>LOCKED</Text>
              </View>
            </View>

            {/* Tip card — labCardSecondary (card bg) */}
            {!hasExperiment && (
              <View style={s.tipCard}>
                <View style={s.blockLabelPillDark}>
                  <Text style={s.blockLabelTextDark}>TIP</Text>
                </View>
                <Text style={s.tipText}>
                  Load an experiment from the chat to unlock Gel Analysis and
                  Troubleshooting tools.
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* ── SELECTED TOOL ── */}
        {selectedTool === "gel" && experimentId && (
          <GelImageAnalyzer experimentId={experimentId} />
        )}
        {selectedTool === "troubleshoot" && experimentId && (
          <TroubleshootingAssistant experimentId={experimentId} />
        )}
        {selectedTool === "optimize" && experimentId && protocol && (
          <ProtocolOptimizer experimentId={experimentId} protocol={protocol} />
        )}
        {selectedTool && !experimentId && (
          <View style={s.errorState}>
            <View style={s.errorIcon}>
              <HugeiconsIcon
                icon={AlertCircleIcon}
                size={28}
                color={C.textMuted}
              />
            </View>
            <Text style={s.errorTitle}>No experiment selected</Text>
            <Text style={s.errorDesc}>
              Please load an experiment from the chat first.
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

// ── STYLES ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header — HomeScreen pattern
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: { fontSize: 20, color: C.textPrimary, lineHeight: 24 },
  headerCenter: { alignItems: "center" },
  headerGreeting: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.4,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  // Context card — labCardPrimary (black)
  contextCard: {
    backgroundColor: C.black,
    borderRadius: 24,
    padding: 20,
    marginBottom: 28,
    gap: 10,
  },
  contextName: {
    fontSize: 18,
    fontWeight: "700",
    color: C.white,
    letterSpacing: -0.3,
  },

  // Block label
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

  // Section title — exact HomeScreen sectionTitle
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1,
    marginBottom: 16,
  },

  // Tool group — sourceGroup pattern
  toolGroup: {
    backgroundColor: C.card,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 28,
  },
  toolCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: C.card,
  },
  toolCardDisabled: { opacity: 0.5 },
  toolSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e2e2e8",
    marginHorizontal: 20,
  },
  toolIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  toolIconWrapDisabled: { backgroundColor: "#ebebeb" },
  toolTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.textPrimary,
    marginBottom: 2,
  },
  toolTitleDisabled: { color: C.textMuted },
  toolDesc: { fontSize: 12, color: C.textMuted, lineHeight: 18 },
  toolArrow: { fontSize: 22, color: C.textMuted, lineHeight: 24 },

  // Stats row — exact HomeScreen statsRow
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
  },
  statVal: { fontSize: 28, fontWeight: "700", color: C.textPrimary },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: C.textMuted,
    marginTop: 4,
    letterSpacing: 1,
  },

  // Tip card — labCardSecondary
  tipCard: {
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 20,
    gap: 10,
  },
  blockLabelPillDark: {
    alignSelf: "flex-start",
    backgroundColor: C.black,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  blockLabelTextDark: {
    fontSize: 10,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 1,
  },
  tipText: { fontSize: 14, color: C.textSecondary, lineHeight: 21 },

  // Error state
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  errorTitle: { fontSize: 18, fontWeight: "700", color: C.textPrimary },
  errorDesc: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
