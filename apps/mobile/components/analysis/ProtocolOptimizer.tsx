import { useAnalysis } from "@/hooks/useAnalysis";
import { Analysis, Protocol } from "@/lib/api";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  C,
  ConfidenceCard,
  ErrorBanner,
  ObsCard,
  RecCard,
  SectionTitle,
  StepCard,
} from "./shared";

interface ProtocolOptimizerProps {
  experimentId: string;
  protocol: Protocol;
}

export const ProtocolOptimizer: React.FC<ProtocolOptimizerProps> = ({
  experimentId,
  protocol,
}) => {
  const [result, setResult] = useState<Analysis | null>(null);
  const { optimizeProtocol, loading, error } = useAnalysis();

  const handleOptimize = async () => {
    const analysis = await optimizeProtocol({
      experimentId,
      currentProtocol: {
        steps: protocol.steps,
        materials: protocol.materials,
        conditions: protocol.conditions,
      },
    });
    if (analysis) setResult(analysis);
  };

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Page header — HomeScreen pattern */}
      <Text style={s.greeting}>LAB ASSISTANT</Text>
      <Text style={s.title}>Protocol Optimiser</Text>
      <Text style={s.subtitle}>
        AI analysis of your current protocol with targeted improvement
        suggestions.
      </Text>

      {/* ── Protocol summary card — labCardPrimary (black) ── */}
      <View style={s.protocolCard}>
        {/* Block label pill */}
        <View style={s.blockLabelPill}>
          <Text style={s.blockLabelText}>LOADED PROTOCOL</Text>
        </View>

        {/* Protocol name */}
        <Text style={s.protocolName}>{protocol.name}</Text>
        {protocol.description ? (
          <Text style={s.protocolDesc} numberOfLines={2}>
            {protocol.description}
          </Text>
        ) : null}

        {/* Stats row inside card — hairline-separated */}
        <View style={s.protocolStatsRow}>
          <View style={s.protocolStat}>
            <Text style={s.protocolStatVal}>{protocol.steps.length}</Text>
            <Text style={s.protocolStatLabel}>STEPS</Text>
          </View>
          <View style={s.protocolStatDivider} />
          <View style={s.protocolStat}>
            <Text style={s.protocolStatVal}>{protocol.materials.length}</Text>
            <Text style={s.protocolStatLabel}>MATERIALS</Text>
          </View>
        </View>
      </View>

      {/* CTA */}
      <Pressable
        style={({ pressed }) => [
          s.cta,
          loading && s.ctaDisabled,
          pressed && !loading && { opacity: 0.8 },
        ]}
        onPress={handleOptimize}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={C.black} size="small" />
        ) : (
          <Text style={s.ctaText}>Optimise Protocol</Text>
        )}
      </Pressable>

      {/* Error */}
      {error && <ErrorBanner message={error} />}

      {/* Results */}
      {result && (
        <>
          <ConfidenceCard
            title="Optimisation complete"
            confidence={result.confidence}
            subtitle="Done"
          />

          {result.observations.length > 0 && (
            <>
              <SectionTitle text="ANALYSIS" />
              {result.observations.map((obs, i) => (
                <ObsCard key={i} {...obs} />
              ))}
            </>
          )}

          {result.recommendations.length > 0 && (
            <>
              <SectionTitle text="OPTIMISATION SUGGESTIONS" />
              {result.recommendations.map((rec, i) => (
                <RecCard key={i} {...rec} />
              ))}
            </>
          )}

          {result.nextSteps.length > 0 && (
            <>
              <SectionTitle text="IMPLEMENTATION STEPS" />
              {result.nextSteps.map((step, i) => (
                <StepCard key={i} index={i} {...step} />
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 64 },

  greeting: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -1,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 20,
    marginBottom: 28,
  },

  // Protocol card — labCardPrimary (black)
  protocolCard: {
    backgroundColor: C.black,
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
    gap: 10,
  },
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
  protocolName: {
    fontSize: 22,
    fontWeight: "700",
    color: C.white,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  protocolDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 19,
  },

  // Stats inside black card
  protocolStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.15)",
    paddingTop: 16,
    marginTop: 4,
  },
  protocolStat: { flex: 1, alignItems: "center" },
  protocolStatVal: {
    fontSize: 26,
    fontWeight: "800",
    color: C.white,
    letterSpacing: -0.5,
  },
  protocolStatLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
    letterSpacing: 0.8,
  },
  protocolStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  // CTA
  cta: {
    backgroundColor: C.black,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  ctaDisabled: { backgroundColor: C.card },
  ctaText: { fontSize: 15, fontWeight: "700", color: C.white },
});
