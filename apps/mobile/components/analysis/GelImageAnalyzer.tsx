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

interface GelImageAnalyzerProps {
  experimentId: string;
}

export const GelImageAnalyzer: React.FC<GelImageAnalyzerProps> = ({
  experimentId,
}) => {
  const [imageUrl, setImageUrl] = useState("");
  const [lanes, setLanes] = useState("");
  const [marker, setMarker] = useState("");
  const [expectedSize, setExpectedSize] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);

  const { analyzeGelImage, loading, error } = useAnalysis();
  const canSubmit = !loading && imageUrl.trim().length > 0;

  const handleAnalyze = async () => {
    if (!imageUrl.trim()) return;
    const analysis = await analyzeGelImage({
      experimentId,
      imageUrl: imageUrl.trim(),
      metadata: {
        lanes: lanes ? parseInt(lanes) : undefined,
        marker: marker || undefined,
        expectedSize: expectedSize || undefined,
      },
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
      <Text style={s.greeting}>GEL ANALYSIS</Text>
      <Text style={s.title}>Image Analysis</Text>
      <Text style={s.subtitle}>
        Provide image details and run AI analysis to detect bands, smearing, and
        anomalies.
      </Text>

      {/* ── Form card — card surface ── */}
      <View style={s.formCard}>
        {/* Image URL — full width, prominent */}
        <View style={s.field}>
          <Text style={s.fieldLabel}>
            Image URL <Text style={s.required}>*</Text>
          </Text>
          <TextInput
            style={[s.input, imageUrl.length > 0 && s.inputActive]}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://example.com/gel-image.jpg"
            placeholderTextColor={C.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
          />
        </View>

        {/* Two-column row */}
        <View style={s.fieldRow}>
          <View style={[s.field, { flex: 1 }]}>
            <Text style={s.fieldLabel}>Lanes</Text>
            <TextInput
              style={[s.input, lanes.length > 0 && s.inputActive]}
              value={lanes}
              onChangeText={setLanes}
              placeholder="4"
              keyboardType="number-pad"
              returnKeyType="done"
              placeholderTextColor={C.textMuted}
            />
          </View>
          <View style={[s.field, { flex: 1 }]}>
            <Text style={s.fieldLabel}>Marker</Text>
            <TextInput
              style={[s.input, marker.length > 0 && s.inputActive]}
              value={marker}
              onChangeText={setMarker}
              placeholder="1 kb ladder"
              returnKeyType="done"
              placeholderTextColor={C.textMuted}
            />
          </View>
        </View>

        <View style={s.field}>
          <Text style={s.fieldLabel}>Expected Band Size</Text>
          <TextInput
            style={[s.input, expectedSize.length > 0 && s.inputActive]}
            value={expectedSize}
            onChangeText={setExpectedSize}
            placeholder="e.g. 500 bp"
            returnKeyType="done"
            placeholderTextColor={C.textMuted}
          />
        </View>

        {/* CTA — sheetCTA / qaCardPrimary */}
        <Pressable
          style={({ pressed }) => [
            s.cta,
            !canSubmit && s.ctaDisabled,
            pressed && canSubmit && { opacity: 0.8 },
          ]}
          onPress={handleAnalyze}
          disabled={!canSubmit}
        >
          {loading ? (
            <ActivityIndicator color={C.white} size="small" />
          ) : (
            <Text style={[s.ctaText, !canSubmit && s.ctaTextDisabled]}>
              Analyse Image
            </Text>
          )}
        </Pressable>
      </View>

      {/* Error */}
      {error && <ErrorBanner message={error} />}

      {/* Results */}
      {result && (
        <>
          {/* Confidence hero */}
          <ConfidenceCard
            title="Analysis complete"
            confidence={result.confidence}
            subtitle="Success"
          />

          {/* Model / processing meta — statCard row */}
          {(result.modelUsed || result.processingTime !== undefined) && (
            <>
              <SectionTitle text="RUN METADATA" />
              <View style={s.statsRow}>
                {result.modelUsed && (
                  <View style={s.statCard}>
                    <Text style={s.statVal} numberOfLines={1}>
                      {result.modelUsed}
                    </Text>
                    <Text style={s.statLabel}>MODEL</Text>
                  </View>
                )}
                {result.processingTime !== undefined && (
                  <View style={s.statCard}>
                    <Text style={s.statVal}>{result.processingTime}</Text>
                    <Text style={s.statLabel}>MS</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {result.observations.length > 0 && (
            <>
              <SectionTitle text="OBSERVATIONS" />
              {result.observations.map((obs, i) => (
                <ObsCard key={i} {...obs} />
              ))}
            </>
          )}

          {result.recommendations.length > 0 && (
            <>
              <SectionTitle text="RECOMMENDATIONS" />
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

  // Page header — HomeScreen
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

  // Form card — card surface
  formCard: {
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  field: { marginBottom: 16 },
  fieldRow: { flexDirection: "row", gap: 12 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  required: { color: C.textMuted },
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
  inputActive: { borderColor: C.black },

  // CTA — black qaCardPrimary
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

  // Stats row — exact HomeScreen
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
  },
  statVal: { fontSize: 20, fontWeight: "700", color: C.textPrimary },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: C.textMuted,
    marginTop: 4,
    letterSpacing: 1,
  },
});
