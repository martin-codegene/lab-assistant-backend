import { api } from "@/lib/api";
import {
  Camera01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  CloudUploadIcon,
  Image02Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
  red: "#ff3b30",
};

const PRIORITY_CONFIG = {
  CRITICAL: { color: C.red, bg: C.red + "15" },
  HIGH: { color: C.amber, bg: C.amber + "15" },
  MEDIUM: { color: "#3b7ef6", bg: "#3b7ef6" + "15" },
  LOW: { color: C.green, bg: C.green + "15" },
};

// ── TYPES ─────────────────────────────────────────────────────────────────────
type AnalysisStep = "select" | "configure" | "analyzing" | "results";

interface AnalysisResult {
  id: string;
  confidence: number;
  observations: Array<{
    type: string;
    description: string;
    confidence: number;
    location?: string;
  }>;
  recommendations: Array<{
    action: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    rationale: string;
  }>;
  nextSteps: Array<{ step: string; description: string }>;
}

// ── SMALL RE-USABLE COMPONENTS ────────────────────────────────────────────────

const SectionTitle = ({ text }: { text: string }) => (
  <Text style={styles.sectionTitle}>{text}</Text>
);

const BlockLabel = ({ text }: { text: string }) => (
  <View style={styles.blockLabelPill}>
    <Text style={styles.blockLabelText}>{text}</Text>
  </View>
);

const PriorityBadge = ({
  priority,
}: {
  priority: keyof typeof PRIORITY_CONFIG;
}) => {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.LOW;
  return (
    <View style={[styles.priorityBadge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.priorityText, { color: cfg.color }]}>
        {priority}
      </Text>
    </View>
  );
};

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────
export default function GelAnalysisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<AnalysisStep>("select");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [experimentId, setExperimentId] = useState("");
  const [sampleCount, setSampleCount] = useState("");
  const [expectedBandSize, setExpectedBandSize] = useState("");
  const [primerName, setPrimerName] = useState("");
  const [experiments, setExperiments] = useState<any[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExperiments();
    loadUploads();
  }, []);

  const loadExperiments = async () => {
    try {
      const r = await api.listMyExperiments({ page: 1, limit: 50 });
      if (r.success && r.data) setExperiments(r.data.data);
    } catch (_) {}
  };

  const loadUploads = async () => {
    try {
      setIsLoadingData(true);
      const r = await api.listMyUploads({ page: 1, limit: 50 });
      if (r.success && r.data)
        setUploads(r.data.data.filter((u: any) => u.type.startsWith("image/")));
    } catch (_) {
    } finally {
      setIsLoadingData(false);
    }
  };

  const selectUploadedImage = (upload: any) => {
    setImageUri(upload.url);
    setUploadedUrl(upload.url);
    setStep("configure");
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setStep("configure");
    }
  };

  const captureImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera Permission", "Camera access is required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setStep("configure");
    }
  };

  const handleAnalyze = async () => {
    if (!imageUri) return;
    setStep("analyzing");
    setError(null);
    try {
      let finalUrl = uploadedUrl;
      if (!uploadedUrl) {
        const up = await api.uploadFile(
          {
            uri: imageUri,
            name: `gel_${Date.now()}.jpg`,
            mimeType: "image/jpeg",
          },
          true,
        );
        if (!up.success || !up.data) throw new Error("Failed to upload image");
        finalUrl = up.data.url;
        setUploadedUrl(finalUrl);
      }
      const res = await api.analyzeGelImage({
        experimentId: experimentId || "temp_experiment",
        imageUrl: finalUrl!,
        metadata: {
          lanes: sampleCount ? parseInt(sampleCount) : undefined,
          marker: primerName || undefined,
          expectedSize: expectedBandSize || undefined,
        },
      });
      if (!res.success || !res.data)
        throw new Error(res.message || "Analysis failed");
      setAnalysisResult(res.data as any);
      setStep("results");
    } catch (err: any) {
      setError(err.message || "Failed to analyze image");
      setStep("configure");
      Alert.alert("Analysis Failed", err.message || "Please try again");
    }
  };

  const reset = () => {
    setStep("select");
    setImageUri(null);
    setUploadedUrl(null);
    setAnalysisResult(null);
    setError(null);
    setExperimentId("");
    setSampleCount("");
    setExpectedBandSize("");
    setPrimerName("");
  };

  const STEPS = [
    { key: "select", label: "Image" },
    { key: "configure", label: "Configure" },
    { key: "analyzing", label: "Analysing" },
    { key: "results", label: "Results" },
  ];
  const stepIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER — HomeScreen header pattern ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>LAB ASSISTANT</Text>
          <Text style={styles.headerTitle}>Gel Analysis</Text>
        </View>
        <Pressable onPress={() => router.back()} style={styles.avatar}>
          <HugeiconsIcon icon={Cancel01Icon} size={18} color={C.white} />
        </Pressable>
      </View>

      {/* ── STEP PILLS — qaGrid pattern ── */}
      <View style={styles.stepGrid}>
        {STEPS.map((s, i) => (
          <View
            key={s.key}
            style={[styles.stepPill, i === stepIdx && styles.stepPillActive]}
          >
            {i < stepIdx ? (
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                size={11}
                color={C.green}
              />
            ) : (
              <View
                style={[styles.stepDot, i === stepIdx && styles.stepDotActive]}
              />
            )}
            <Text
              style={[
                styles.stepLabel,
                i === stepIdx && styles.stepLabelActive,
              ]}
            >
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ══════════════ STEP 1 — SELECT ══════════════ */}
        {step === "select" && (
          <>
            <SectionTitle text="IMAGE SOURCE" />

            <View style={styles.sourceGroup}>
              {[
                {
                  icon: Image02Icon,
                  title: "Upload Image",
                  desc: "Choose from your photo library",
                  fn: pickImage,
                },
                {
                  icon: Camera01Icon,
                  title: "Capture Image",
                  desc: "Photograph gel with your camera",
                  fn: captureImage,
                },
                {
                  icon: CloudUploadIcon,
                  title: "My Uploads",
                  desc: "Browse previously uploaded files",
                  fn: () => router.push("/uploads" as any),
                },
              ].map((item, i, arr) => (
                <React.Fragment key={item.title}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.sourceCard,
                      pressed && { backgroundColor: "#ededf2" },
                    ]}
                    onPress={item.fn}
                  >
                    <View style={styles.sourceIconWrap}>
                      <HugeiconsIcon
                        icon={item.icon}
                        size={20}
                        color={C.black}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sourceTitle}>{item.title}</Text>
                      <Text style={styles.sourceDesc}>{item.desc}</Text>
                    </View>
                    <Text style={styles.sourceArrow}>›</Text>
                  </Pressable>
                  {i < arr.length - 1 && <View style={styles.sourceSep} />}
                </React.Fragment>
              ))}
            </View>

            {isLoadingData && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={C.textMuted} />
                <Text style={styles.loadingText}>Loading uploads…</Text>
              </View>
            )}

            {uploads.length > 0 && (
              <>
                <SectionTitle text="RECENT UPLOADS" />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbStrip}
                  style={{ marginBottom: 32 }}
                >
                  {uploads.slice(0, 10).map((u) => (
                    <Pressable
                      key={u.id}
                      style={({ pressed }) => [
                        styles.thumb,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => selectUploadedImage(u)}
                    >
                      <Image
                        source={{ uri: u.url }}
                        style={styles.thumbImg}
                        resizeMode="cover"
                      />
                      <Text style={styles.thumbName} numberOfLines={1}>
                        {u.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{uploads.length || "—"}</Text>
                <Text style={styles.statLabel}>UPLOADS</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {experiments.length || "—"}
                </Text>
                <Text style={styles.statLabel}>EXPERIMENTS</Text>
              </View>
            </View>
          </>
        )}

        {/* ══════════════ STEP 2 — CONFIGURE ══════════════ */}
        {step === "configure" && imageUri && (
          <>
            {/* Black preview card — labCardPrimary */}
            <View style={styles.previewCard}>
              <View style={styles.previewCardHeader}>
                <BlockLabel text="LOADED IMAGE" />
                <Pressable onPress={reset}>
                  <Text style={styles.previewSwap}>Replace ×</Text>
                </Pressable>
              </View>
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImg}
                resizeMode="contain"
              />
            </View>

            <SectionTitle text="RUN PARAMETERS" />

            {experiments.length > 0 && (
              <>
                <Text style={styles.fieldLabel}>Linked Experiment</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                  style={{ marginBottom: 20 }}
                >
                  {[{ id: "", title: "None" }, ...experiments].map((exp) => (
                    <Pressable
                      key={exp.id}
                      style={[
                        styles.chip,
                        experimentId === exp.id && styles.chipActive,
                      ]}
                      onPress={() => setExperimentId(exp.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          experimentId === exp.id && styles.chipTextActive,
                        ]}
                      >
                        {exp.title}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.formCard}>
              {[
                {
                  label: "Lane Count",
                  value: sampleCount,
                  set: setSampleCount,
                  ph: "e.g. 8",
                  kb: "number-pad" as const,
                },
                {
                  label: "Expected Band Size",
                  value: expectedBandSize,
                  set: setExpectedBandSize,
                  ph: "e.g. 500 bp",
                  kb: "default" as const,
                },
                {
                  label: "Primer / Marker Name",
                  value: primerName,
                  set: setPrimerName,
                  ph: "e.g. GAPDH",
                  kb: "default" as const,
                },
              ].map((f, i, arr) => (
                <React.Fragment key={f.label}>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>{f.label}</Text>
                    <TextInput
                      style={styles.input}
                      value={f.value}
                      onChangeText={f.set}
                      placeholder={f.ph}
                      keyboardType={f.kb}
                      placeholderTextColor={C.textMuted}
                    />
                  </View>
                  {i < arr.length - 1 && <View style={styles.formSep} />}
                </React.Fragment>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [styles.cta, pressed && { opacity: 0.8 }]}
              onPress={handleAnalyze}
            >
              <HugeiconsIcon icon={SparklesIcon} size={18} color={C.white} />
              <Text style={styles.ctaText}>Run AI Analysis</Text>
            </Pressable>
          </>
        )}

        {/* ══════════════ STEP 3 — ANALYZING ══════════════ */}
        {step === "analyzing" && (
          <>
            <View style={styles.analyzingCard}>
              <View style={styles.analyzingIconWrap}>
                <ActivityIndicator size="large" color={C.white} />
              </View>
              <Text style={styles.analyzingTitle}>Detecting Bands…</Text>
              <Text style={styles.analyzingDesc}>
                Scanning lane geometry, estimating fragment sizes and scoring
                signal quality.
              </Text>
            </View>

            <SectionTitle text="PIPELINE STATUS" />

            {[
              { label: "Image pre-processing", done: true },
              { label: "Lane segmentation", done: true },
              { label: "Band localisation", done: false },
              { label: "Size calibration", done: false },
            ].map((p, i) => (
              <View key={i} style={styles.pipelineCard}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: p.done ? C.green : C.textMuted,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                    },
                  ]}
                />
                <Text style={styles.pipelineLabel}>{p.label}</Text>
                {p.done ? (
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={16}
                    color={C.green}
                  />
                ) : (
                  <ActivityIndicator size="small" color={C.textMuted} />
                )}
              </View>
            ))}
          </>
        )}

        {/* ══════════════ STEP 4 — RESULTS ══════════════ */}
        {step === "results" && analysisResult && (
          <>
            {/* Confidence hero — black labCardPrimary */}
            <View style={styles.confCard}>
              <View style={styles.confCardTop}>
                <BlockLabel text="ANALYSIS COMPLETE" />
                <View style={styles.statusRow}>
                  <View
                    style={[styles.statusDot, { backgroundColor: C.green }]}
                  />
                  <Text style={[styles.statusLabel, { color: C.green }]}>
                    Success
                  </Text>
                </View>
              </View>
              <Text style={styles.confScore}>
                {Math.round(analysisResult.confidence * 100)}
                <Text style={styles.confScoreSuffix}>%</Text>
              </Text>
              <Text style={styles.confScoreLabel}>CONFIDENCE SCORE</Text>
            </View>

            {imageUri && (
              <>
                <SectionTitle text="ANALYSED IMAGE" />
                <View style={styles.resultImgCard}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.resultImg}
                    resizeMode="contain"
                  />
                </View>
              </>
            )}

            <SectionTitle text="OBSERVATIONS" />
            {analysisResult.observations.map((obs, idx) => (
              <View key={idx} style={styles.runCard}>
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={styles.runCardHeader}>
                    <Text style={styles.obsType}>{obs.type}</Text>
                    <View style={styles.confMini}>
                      <Text style={styles.confMiniText}>
                        {Math.round(obs.confidence * 100)}%
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.runCardName}>{obs.description}</Text>
                  {obs.location && (
                    <Text style={styles.runCardDate}>⌖ {obs.location}</Text>
                  )}
                </View>
              </View>
            ))}

            <SectionTitle text="RECOMMENDATIONS" />
            {analysisResult.recommendations.map((rec, idx) => (
              <View key={idx} style={styles.runCard}>
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={styles.runCardHeader}>
                    <Text style={[styles.runCardName, { flex: 1 }]}>
                      {rec.action}
                    </Text>
                    <PriorityBadge priority={rec.priority} />
                  </View>
                  <Text style={styles.runCardDate}>{rec.rationale}</Text>
                </View>
              </View>
            ))}

            {analysisResult.nextSteps.length > 0 && (
              <>
                <SectionTitle text="NEXT STEPS" />
                {analysisResult.nextSteps.map((ns, idx) => (
                  <View key={idx} style={styles.runCard}>
                    <View style={styles.rankBubble}>
                      <Text style={styles.rankText}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.runCardName}>{ns.step}</Text>
                      <Text style={styles.runCardDate}>{ns.description}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            <View style={styles.actionsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.btnSecondary,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={reset}
              >
                <Text style={styles.btnSecondaryText}>New Analysis</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.btnPrimary,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => router.back()}
              >
                <Text style={styles.btnPrimaryText}>Done</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── STYLES — token-matched to HomeScreen ──────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 8 },

  // Header
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

  // Step pills
  stepGrid: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 28,
  },
  stepPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: C.card,
    borderRadius: 12,
    paddingVertical: 8,
  },
  stepPillActive: { backgroundColor: C.black },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.textMuted,
  },
  stepDotActive: { backgroundColor: C.white },
  stepLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 0.5,
  },
  stepLabelActive: { color: C.white },

  // Section title — exact HomeScreen
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1,
    marginBottom: 16,
  },

  // Source group — card wrap
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

  // Thumbs
  thumbStrip: { gap: 12, paddingBottom: 4 },
  thumb: {
    width: 110,
    backgroundColor: C.card,
    borderRadius: 16,
    overflow: "hidden",
  },
  thumbImg: { width: 110, height: 90 },
  thumbName: { fontSize: 11, color: C.textMuted, padding: 8 },

  // Stats
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

  // Loading
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  loadingText: { fontSize: 13, color: C.textMuted },

  // Preview card — black labCardPrimary
  previewCard: {
    backgroundColor: C.black,
    borderRadius: 24,
    padding: 20,
    marginBottom: 28,
    gap: 14,
  },
  previewCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewSwap: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
  previewImg: { width: "100%", height: 200, borderRadius: 16 },

  // Block label pill
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

  // Form card
  formCard: {
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  formField: { paddingVertical: 6 },
  formSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e2e2e8",
    marginVertical: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: { fontSize: 16, color: C.textPrimary, paddingVertical: 0 },

  // Chips
  chipRow: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: C.card,
    marginRight: 4,
  },
  chipActive: { backgroundColor: C.black },
  chipText: { fontSize: 13, fontWeight: "600", color: C.textPrimary },
  chipTextActive: { color: C.white },

  // CTA — sheetCTA
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: C.black,
    borderRadius: 24,
    paddingVertical: 18,
  },
  ctaText: { fontSize: 16, fontWeight: "700", color: C.white },

  // Analyzing card
  analyzingCard: {
    backgroundColor: C.black,
    borderRadius: 24,
    padding: 28,
    marginBottom: 32,
    alignItems: "center",
    gap: 16,
  },
  analyzingIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  analyzingTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: C.white,
    letterSpacing: -0.5,
  },
  analyzingDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 21,
  },

  // Pipeline cards
  pipelineCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.card,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 10,
  },
  pipelineLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: C.textPrimary,
  },

  // Confidence card
  confCard: {
    backgroundColor: C.black,
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    gap: 8,
  },
  confCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  confScore: {
    fontSize: 64,
    fontWeight: "800",
    color: C.white,
    lineHeight: 68,
  },
  confScoreSuffix: {
    fontSize: 32,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
  },
  confScoreLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1.5,
  },

  // Result image
  resultImgCard: {
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 16,
    marginBottom: 32,
  },
  resultImg: { width: "100%", height: 200, borderRadius: 16 },

  // Run card — exact HomeScreen
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
  runCardName: { fontSize: 16, fontWeight: "600", color: C.textPrimary },
  runCardDate: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  obsType: {
    fontSize: 11,
    fontWeight: "800",
    color: "#3b7ef6",
    letterSpacing: 0.5,
  },

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
  priorityText: { fontSize: 11, fontWeight: "700" },

  // Status
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 12, fontWeight: "700" },

  // Rank bubble — exact HomeScreen
  rankBubble: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  rankText: { fontSize: 11, fontWeight: "800", color: C.white },

  // Footer actions
  actionsRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  btnSecondary: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: "center",
  },
  btnSecondaryText: { fontSize: 16, fontWeight: "700", color: C.textPrimary },
  btnPrimary: {
    flex: 1,
    backgroundColor: C.black,
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: "center",
  },
  btnPrimaryText: { fontSize: 16, fontWeight: "700", color: C.white },
});
