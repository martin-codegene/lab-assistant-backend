import { API_CONFIG } from "@/env";
import { api, type Experiment } from "@/lib/api";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const STORAGE_KEYS = { TOKEN: "lab_app_token", USER: "lab_app_user" } as const;
const { width: SCREEN_W } = Dimensions.get("window");

// ── DESIGN TOKENS (matches home screen) ──────────────────────────────────────
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
  red: "#ff3b30",
  border: "#e4e4e7",
};

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: C.green,
  IN_PROGRESS: C.blue,
  FAILED: C.red,
  PENDING: C.amber,
};

interface LocalExperiment {
  id: string;
  title: string;
  description?: string;
  protocol?: { id: string; name: string };
  status: string;
  createdAt: string;
}

type GuidanceState = "selecting" | "streaming";

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const color = STATUS_COLOR[status] ?? C.textMuted;
  return (
    <View style={[styles.badge, { backgroundColor: color + "18" }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{status.replace("_", " ")}</Text>
    </View>
  );
};

const PulsingDot = ({ color }: { color: string }) => {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.pulsingDot, { backgroundColor: color, transform: [{ scale }] }]} />
  );
};

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────

export default function ExperimentGuidanceScreen() {
  const insets = useSafeAreaInsets();

  // Selection state
  const [state, setState] = useState<GuidanceState>("selecting");
  const [experiments, setExperiments] = useState<LocalExperiment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<LocalExperiment | null>(null);

  // Camera & WS state
  const cameraRef = useRef<CameraView>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<any>(null);
  const isCapturingRef = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [messages, setMessages] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const messagesScrollRef = useRef<ScrollView>(null);
  // const player = useAudioPlayer(null);

  useEffect(() => {
    loadExperiments();
    return () => {
      clearInterval(intervalRef.current);
      wsRef.current?.close();
    };
    
  }, []);

  const loadExperiments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.listMyExperiments({ page: 1, limit: 100 });
      if (response.success && response.data) {
        setExperiments(
          response.data.data.map((exp: Experiment) => ({
            id: exp.id,
            title: exp.title,
            description: exp.description,
            protocol: exp.protocol ? { id: exp.protocol.id, name: exp.protocol.name } : undefined,
            status: exp.status,
            createdAt: exp.createdAt instanceof Date ? exp.createdAt.toISOString() : exp.createdAt,
          }))
        );
      } else {
        setError(response.error || "Failed to load experiments");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load experiments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExperimentSelect = (exp: LocalExperiment) => {
    if (!exp.protocol) {
      setError("Cannot start guidance: this experiment has no protocol");
      return;
    }
    setSelectedExperiment(exp);
    setState("streaming");
    connectWebSocket(exp);
  };

  const connectWebSocket = async (exp: LocalExperiment) => {
    if (!exp.protocol) return;

    const token = await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);
    if (!token) {
      setWsError("No auth token. Please log in again.");
      return;
    }

    const WS_URL = `${API_CONFIG.WS_URL}/experiments/${exp.id}/guidance?protocolId=${exp.protocol.id}&token=${token}`;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setWsError(null);
        ws.send(
          JSON.stringify({
            type: "start_guidance",
            experimentId: exp.id,
            protocolId: exp.protocol!.id,
            systemContext: `Running ${exp.protocol!.name}...`,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          if (
            response.type === "session_ready" ||
            response.type === "connection_ready" ||
            response.type === "session_started"
          ) {
            setIsSessionReady(true);
          }
          if (response.type === "text_delta") {
            setMessages((prev) => [...prev, response.content]);
            setTimeout(() => messagesScrollRef.current?.scrollToEnd({ animated: true }), 100);
          }
          if (response.type === "error") {
            setWsError(response.error || "Server error");
            ws.close();
          }

          if(response.type === 'connected') {
            console.log("WebSocket connected");
            console.log("Server message:", response);
          }
            console.log("Received WS message:", response);


          if (response.type === "audio_chunk") {
            const audioData = response.content; // base64 mp3
            // player.replace({
            //   uri: `data:audio/mp3;base64,${audioData}`,
            // });
            // player.play();

            console.log(audioData)
          }

        } catch (err) {
          console.error("Failed to parse WS message:", err);
        }
      };

      ws.onerror = () => {
        setWsError("Connection failed — check your network");
        setIsSessionReady(false);
      };

      ws.onclose = () => {
        setIsSessionReady(false);
        if (isStreaming) stopStreaming();
      };

      wsRef.current = ws;
    } catch (err: any) {
      setWsError(err.message || "Failed to connect");
    }
  };

  const startStreaming = async () => {
    if (!cameraRef.current || !wsRef.current) return;
    if (wsRef.current.readyState !== WebSocket.OPEN) {
      setWsError("Connection lost. Please go back and retry.");
      return;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsStreaming(true);
    isCapturingRef.current = false;
    await new Promise((r) => setTimeout(r, 500));

    intervalRef.current = setInterval(async () => {
      if (isCapturingRef.current || !cameraRef.current || !wsRef.current) return;
      if (wsRef.current.readyState !== WebSocket.OPEN) {
        stopStreaming();
        setWsError("Connection lost");
        return;
      }
      isCapturingRef.current = true;
      try {
        const photo = await cameraRef.current!.takePictureAsync({
          base64: true,
          quality: 0.4,
          skipProcessing: true,
        });
        if (photo?.base64 && wsRef.current!.readyState === WebSocket.OPEN) {
          wsRef.current!.send(
            JSON.stringify({ type: "send_frame", frameData: photo.base64, mimeType: "image/jpeg" })
          );
        }
      } catch {}
      isCapturingRef.current = false;
    }, 800);
  };

  const stopStreaming = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    isCapturingRef.current = false;
    setIsStreaming(false);
  };

  const handleBack = () => {
    stopStreaming();
    wsRef.current?.close();
    wsRef.current = null;
    setMessages([]);
    setSelectedExperiment(null);
    setWsError(null);
    setError(null);
    setIsSessionReady(false);
    setState("selecting");
  };

  // ── SELECTING VIEW ─────────────────────────────────────────────────────────
  if (state === "selecting") {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <StatusBar barStyle="dark-content" />
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.sectionLabel}>LIVE GUIDANCE</Text>
              <Text style={styles.headerTitle}>Experiments</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>⚗️</Text>
            </View>
          </View>

          {/* Hero card */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>AI POWERED</Text>
              </View>
              <PulsingDot color={C.green} />
            </View>
            <Text style={styles.heroTitle}>Real-time Lab{"\n"}Assistant</Text>
            <Text style={styles.heroDesc}>
              Select an experiment below to begin live visual guidance through your protocol steps.
            </Text>
          </View>

          {/* Experiments list */}
          <Text style={styles.sectionLabel}>YOUR EXPERIMENTS</Text>

          {isLoading ? (
            <View style={styles.centerBlock}>
              <ActivityIndicator size="large" color={C.black} />
              <Text style={styles.mutedText}>Loading experiments…</Text>
            </View>
          ) : error ? (
            <View style={styles.centerBlock}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryBtn} onPress={loadExperiments}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </Pressable>
            </View>
          ) : experiments.length === 0 ? (
            <View style={styles.centerBlock}>
              <Text style={styles.emptyTitle}>No experiments yet</Text>
              <Text style={styles.mutedText}>Create an experiment first to use live guidance.</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {experiments.map((exp) => (
                <Pressable
                  key={exp.id}
                  style={({ pressed }) => [
                    styles.expCard,
                    !exp.protocol && styles.expCardDisabled,
                    pressed && exp.protocol && { opacity: 0.75 },
                  ]}
                  onPress={() => handleExperimentSelect(exp)}
                  disabled={!exp.protocol}
                >
                  <View style={styles.expCardTop}>
                    <Text style={styles.expTitle} numberOfLines={2}>
                      {exp.title}
                    </Text>
                    <StatusBadge status={exp.status} />
                  </View>

                  {exp.protocol ? (
                    <View style={styles.protocolRow}>
                      <Text style={styles.protocolIcon}>📋</Text>
                      <Text style={styles.protocolName} numberOfLines={1}>
                        {exp.protocol.name}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.noProtocolText}>No protocol — guidance unavailable</Text>
                  )}

                  {exp.description && (
                    <Text style={styles.expDesc} numberOfLines={2}>
                      {exp.description}
                    </Text>
                  )}

                  <View style={styles.expCardFooter}>
                    <Text style={styles.expDate}>
                      {new Date(exp.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                    {exp.protocol && (
                      <View style={styles.startPill}>
                        <Text style={styles.startPillText}>Start Guidance →</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── CAMERA PERMISSION CHECKS ───────────────────────────────────────────────
  if (!permission) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centerBlock}>
          <ActivityIndicator color={C.black} />
          <Text style={styles.mutedText}>Checking camera…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centerBlock}>
          <Text style={styles.emptyTitle}>Camera Access Required</Text>
          <Text style={styles.mutedText}>
            Live guidance needs your camera to analyse experiment progress in real-time.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>Grant Permission</Text>
          </Pressable>
          <Pressable style={styles.ghostBtn} onPress={handleBack}>
            <Text style={styles.ghostBtnText}>← Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── STREAMING VIEW ─────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: C.black }}>
      <StatusBar barStyle="light-content" />

      {/* Camera */}
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* Top bar overlay */}
      <SafeAreaView edges={["top"]} style={styles.cameraTopBar}>
        <Pressable style={styles.backPill} onPress={handleBack}>
          <Text style={styles.backPillText}>← Back</Text>
        </Pressable>
        <View style={styles.expInfoPill}>
          <Text style={styles.expInfoText} numberOfLines={1}>
            {selectedExperiment?.title}
          </Text>
        </View>
        {isStreaming && (
          <View style={styles.livePill}>
            <PulsingDot color={C.red} />
            <Text style={styles.livePillText}>LIVE</Text>
          </View>
        )}
      </SafeAreaView>

      {/* Bottom controls overlay */}
      <View style={[styles.cameraBottom, { paddingBottom: insets.bottom + 16 }]}>
        {/* Messages feed */}
        {messages.length > 0 && (
          <ScrollView
            ref={messagesScrollRef}
            style={styles.messagesFeed}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg, i) => (
              <View key={i} style={styles.messageBubble}>
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
                <Text style={styles.messageText}>{msg}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Status / Controls card */}
        <View style={styles.controlCard}>
          {wsError ? (
            <View style={styles.statusRow}>
              <View style={[styles.statusIndicator, { backgroundColor: C.red + "20" }]}>
                <Text >⚠️</Text>
                <Text style={[styles.statusMsg, { color: C.red }]}>{wsError}</Text>
              </View>
              <Pressable style={[styles.controlBtn, { backgroundColor: C.red }]} onPress={handleBack}>
                <Text style={styles.controlBtnText}>Go Back</Text>
              </Pressable>
            </View>
          ) : !isSessionReady ? (
            <View style={styles.statusRow}>
              <View style={[styles.statusIndicator, { backgroundColor: C.blue + "18" }]}>
                <ActivityIndicator color={C.blue} size="small" />
                <Text style={[styles.statusMsg, { color: C.blue }]}>
                  Connecting to guidance server…
                </Text>
              </View>
            </View>
          ) : !isStreaming ? (
            <View style={styles.statusRow}>
              <View style={[styles.statusIndicator, { backgroundColor: C.green + "18" }]}>
                <View style={[styles.pulsingDot, { backgroundColor: C.green }]} />
                <Text style={[styles.statusMsg, { color: C.green }]}>Ready — tap to begin</Text>
              </View>
              <Pressable style={[styles.controlBtn, { backgroundColor: C.black }]} onPress={startStreaming}>
                <Text style={styles.controlBtnText}>Start Guidance</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.statusRow}>
              <View style={[styles.statusIndicator, { backgroundColor: C.red + "18", flex: 1 }]}>
                <PulsingDot color={C.red} />
                <Text style={[styles.statusMsg, { color: C.red }]}>Streaming frames…</Text>
              </View>
              <Pressable
                style={[styles.controlBtn, { backgroundColor: "#1a1a1e" }]}
                onPress={stopStreaming}
              >
                <Text style={styles.controlBtnText}>Stop</Text>
              </Pressable>
            </View>
          )}

          {selectedExperiment?.protocol && (
            <Text style={styles.protocolFooter}>
              📋 {selectedExperiment.protocol.name}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 12 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -1,
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 22 },

  // Hero card
  heroCard: {
    backgroundColor: C.black,
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroPill: {
    backgroundColor: C.white + "18",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: C.white,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  heroDesc: {
    fontSize: 14,
    color: C.white + "99",
    lineHeight: 20,
  },

  // Experiment cards
  expCard: {
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 20,
    gap: 10,
  },
  expCardDisabled: { opacity: 0.5 },
  expCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  expTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.3,
  },
  protocolRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  protocolIcon: { fontSize: 13 },
  protocolName: { fontSize: 13, color: C.textMuted, flex: 1 },
  noProtocolText: { fontSize: 12, color: C.red + "99", fontStyle: "italic" },
  expDesc: { fontSize: 13, color: C.textSecondary, lineHeight: 18 },
  expCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  expDate: { fontSize: 12, color: C.textMuted },
  startPill: {
    backgroundColor: C.black,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  startPillText: { fontSize: 12, fontWeight: "700", color: C.white },

  // Badge
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

  // Utility
  centerBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  mutedText: { fontSize: 14, color: C.textMuted, textAlign: "center" },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.textPrimary,
    textAlign: "center",
  },
  errorText: { fontSize: 14, color: C.red, textAlign: "center" },
  retryBtn: {
    backgroundColor: C.black,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: C.white },
  primaryBtn: {
    backgroundColor: C.black,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: 8,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "700", color: C.white },
  ghostBtn: { paddingVertical: 12 },
  ghostBtnText: { fontSize: 14, color: C.textMuted, fontWeight: "600" },

  // Pulsing dot
  pulsingDot: { width: 7, height: 7, borderRadius: 4 },

  // Camera overlay — top
  cameraTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    backgroundColor: "transparent",
  },
  backPill: {
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backPillText: { fontSize: 13, fontWeight: "700", color: C.white },
  expInfoPill: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  expInfoText: { fontSize: 13, fontWeight: "600", color: C.white },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,59,48,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  livePillText: { fontSize: 11, fontWeight: "800", color: C.red, letterSpacing: 1 },

  // Camera overlay — bottom
  cameraBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    gap: 12,
  },
  messagesFeed: {
    maxHeight: 220,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 20,
    padding: 14,
  },
  messageBubble: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 10,
  },
  aiBadge: {
    backgroundColor: C.blue,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  aiBadgeText: { fontSize: 9, fontWeight: "800", color: C.white, letterSpacing: 0.5 },
  messageText: { flex: 1, fontSize: 13, color: C.white, lineHeight: 18 },

  controlCard: {
    backgroundColor: C.bg,
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusIndicator: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  statusMsg: { fontSize: 13, fontWeight: "600", flex: 1 },
  controlBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  controlBtnText: { fontSize: 13, fontWeight: "700", color: C.white },
  protocolFooter: {
    fontSize: 12,
    color: C.textMuted,
    paddingHorizontal: 4,
  },
});