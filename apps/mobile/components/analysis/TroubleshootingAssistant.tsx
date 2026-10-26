import { useAnalysis } from "@/hooks/useAnalysis";
import { Analysis } from "@/lib/api";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

interface TroubleshootingAssistantProps {
  experimentId: string;
}

export const TroubleshootingAssistant: React.FC<
  TroubleshootingAssistantProps
> = ({ experimentId }) => {
  const [problem, setProblem] = useState("");
  const [protocol, setProtocol] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);

  const { troubleshoot, loading, error } = useAnalysis();
  const canSubmit = !loading && problem.trim().length > 0;

  const handleTroubleshoot = async () => {
    if (!problem.trim()) return;
    const analysis = await troubleshoot({
      experimentId,
      problem: problem.trim(),
      context: { protocol: protocol || undefined },
    });
    if (analysis) setResult(analysis);
  };

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Page header — HomeScreen pattern */}
      <Text style={s.greeting}>LAB ASSISTANT</Text>
      <Text style={s.title}>Troubleshooting</Text>
      <Text style={s.subtitle}>
        Describe what went wrong and get AI-guided solutions ranked by
        likelihood.
      </Text>

      {/* ── Form card ── */}
      <View style={s.formCard}>
        <View style={s.field}>
          <Text style={s.fieldLabel}>
            Problem Description <Text style={s.required}>*</Text>
          </Text>
          <TextInput
            style={[
              s.input,
              s.inputMultiline,
              problem.length > 0 && s.inputActive,
            ]}
            value={problem}
            onChangeText={setProblem}
            placeholder="e.g. No bands visible on gel after PCR amplification"
            placeholderTextColor={C.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={s.field}>
          <Text style={s.fieldLabel}>
            Protocol Used <Text style={s.optional}>(optional)</Text>
          </Text>
          <TextInput
            style={[s.input, protocol.length > 0 && s.inputActive]}
            value={protocol}
            onChangeText={setProtocol}
            placeholder="e.g. Standard PCR"
            placeholderTextColor={C.textMuted}
            returnKeyType="done"
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            s.cta,
            !canSubmit && s.ctaDisabled,
            pressed && canSubmit && { opacity: 0.8 },
          ]}
          onPress={handleTroubleshoot}
          disabled={!canSubmit}
        >
          {loading ? (
            <ActivityIndicator color={C.white} size="small" />
          ) : (
            <Text style={[s.ctaText, !canSubmit && s.ctaTextDisabled]}>
              Get Help
            </Text>
          )}
        </Pressable>
      </View>

      {/* Error */}
      {error && <ErrorBanner message={error} />}

      {/* Results */}
      {result && (
        <>
          <ConfidenceCard
            title="Analysis complete"
            confidence={result.confidence}
            subtitle="Done"
          />

          {result.observations.length > 0 && (
            <>
              <SectionTitle text="IDENTIFIED ISSUES" />
              {result.observations.map((obs, i) => (
                <ObsCard key={i} {...obs} />
              ))}
            </>
          )}

          {result.recommendations.length > 0 && (
            <>
              <SectionTitle text="RECOMMENDED ACTIONS" />
              {result.recommendations.map((rec, i) => (
                <RecCard key={i} {...rec} />
              ))}
            </>
          )}

          {result.nextSteps.length > 0 && (
            <>
              <SectionTitle text="NEXT STEPS" />
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

  formCard: {
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  field: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  required: { color: C.textMuted },
  optional: { color: C.textMuted, fontWeight: "400" },
  input: {
    backgroundColor: C.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: C.textPrimary,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputMultiline: { minHeight: 100, paddingTop: 13, textAlignVertical: "top" },
  inputActive: { borderColor: C.black },

  cta: {
    backgroundColor: C.black,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  ctaDisabled: { backgroundColor: C.card },
  ctaText: { fontSize: 15, fontWeight: "700", color: C.white },
  ctaTextDisabled: { color: C.textMuted },
});
