import { AnalysisToolsModal } from "@/components/analysis";
import {
  api,
  ChatSession as ApiChatSession,
  Experiment as ApiExperiment,
  Protocol as ApiProtocol,
  AttachmentType,
  Upload,
} from "@/lib/api";
import { Markdown } from "@docren/react-native-markdown";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  ArrowDown01Icon,
  ArrowUp02Icon,
  Attachment01Icon,
  Beaker,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  CloudUploadIcon,
  Delete02Icon,
  File01Icon,
  Folder01Icon,
  Menu01Icon,
  Message01Icon,
  Mic02Icon,
  MicOff01Icon,
  MicroscopeIcon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
  PlayCircle02Icon,
  Refresh01Icon,
  SparklesIcon,
  Video01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import * as ImagePicker from "expo-image-picker";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const { width: SCREEN_W } = Dimensions.get("window");
const SIDEBAR_W = SCREEN_W * 0.78;

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
  overlay: "rgba(0,0,0,0.35)",
};

// ── Types ─────────────────────────────────────────────────────────────────────
type Role = "user" | "assistant";
interface AttachedFile {
  id: string;
  uri: string;
  type: "image" | "video";
  mimeType?: string;
  fileName?: string;
  uploadedUrl?: string;
  uploadId?: string;
  uploadStatus?: "pending" | "uploading" | "done" | "error";
}
interface Message {
  id: string;
  role: Role;
  text: string;
  typing?: boolean;
  attachments?: AttachedFile[];
}
interface Chat {
  id: string;
  title: string;
  messages: Message[];
  experimentId?: string;
  protocolId?: string;
  protocol?: ApiProtocol;
  experiment?: any;
  sessionId?: string;
  isPersisted?: boolean;
}

function apiSessionToChat(session: ApiChatSession): Chat {
  return {
    id: session.id,
    title: session.title,
    messages: (session.messages || []).map((m) => ({
      id: m.id,
      role: m.role === "USER" ? "user" : "assistant",
      text: m.content,
    })),
    experimentId: session.experimentId,
    protocolId: session.protocolId,
    protocol: session.protocol,
    experiment: session.experiment,
    sessionId: session.id,
    isPersisted: true,
  };
}

const SUGGESTIONS = [
  "Analyze gel image",
  "Troubleshoot PCR",
  "Optimize protocol",
  "Load my experiments",
  "Load my protocols",
];

let msgCounter = 100;
const uid = () => `msg_${++msgCounter}`;
let chatCounter = 10;
const cid = () => `chat_${++chatCounter}`;

const RECORDING_OPTIONS_WITH_METERING = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

async function ensureMicPermission(): Promise<boolean> {
  const { status } = await getRecordingPermissionsAsync();
  if (status === "granted") return true;
  const { granted } = await requestRecordingPermissionsAsync();
  return granted;
}

async function transcribeWithNova(audioUri: string): Promise<string> {
  const key = process.env.EXPO_PUBLIC_NOVA_API_KEY;
  if (!key) throw new Error("EXPO_PUBLIC_NOVA_API_KEY is not set.");
  const fd = new FormData();
  fd.append("file", {
    uri: audioUri,
    name: "recording.m4a",
    type: "audio/m4a",
  } as any);
  fd.append("model", "nova-2-sonic-v1");
  const res = await fetch("https://api.nova.amazon.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: fd,
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(
      (j as any)?.error?.message ?? `Transcription failed (${res.status})`,
    );
  }
  const j = await res.json();
  return ((j as any).text as string) ?? "";
}

// ── Attachment strip ──────────────────────────────────────────────────────────
function AttachmentStrip({
  files,
  onRemove,
}: {
  files: AttachedFile[];
  onRemove: (id: string) => void;
}) {
  if (files.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.attachStrip}
      contentContainerStyle={s.attachStripContent}
      keyboardShouldPersistTaps="always"
    >
      {files.map((f) => (
        <View key={f.id} style={s.attachThumb}>
          <Image
            source={{ uri: f.uri }}
            style={s.attachThumbImage}
            resizeMode="cover"
          />
          {f.type === "video" && (
            <View style={s.attachVideoOverlay}>
              <HugeiconsIcon
                icon={PlayCircle02Icon}
                size={20}
                color={C.white}
              />
            </View>
          )}
          <Pressable
            onPress={() => onRemove(f.id)}
            style={s.attachRemoveBtn}
            hitSlop={6}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={10} color={C.white} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(500),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);
  return (
    <View style={s.typingRow}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            s.typingDot,
            {
              transform: [
                {
                  translateY: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                  }),
                },
              ],
              opacity: dot.interpolate({
                inputRange: [0, 1],
                outputRange: [0.35, 1],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(8)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.spring(ty, {
        toValue: 0,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!isUser) {
    return (
      <Animated.View
        style={[s.msgWrapAI, { opacity, transform: [{ translateY: ty }] }]}
      >
        {/* AI avatar — black circle, "LA" initials */}
        <View style={s.aiAvatar}>
          <Text style={s.aiAvatarText}>LA</Text>
        </View>
        <View style={{ flex: 1 }}>
          {msg.typing ? (
            <TypingDots />
          ) : (
            msg.text.length > 0 && <Markdown markdown={msg.text} />
          )}
        </View>
      </Animated.View>
    );
  }
  return (
    <Animated.View
      style={[
        s.msgWrap,
        s.msgWrapUser,
        { opacity, transform: [{ translateY: ty }] },
      ]}
    >
      <View style={s.bubbleUser}>
        {msg.attachments && msg.attachments.length > 0 && (
          <View style={s.bubbleAttachGrid}>
            {msg.attachments.map((f) => (
              <View key={f.id} style={s.bubbleAttachItem}>
                <Image
                  source={{ uri: f.uri }}
                  style={s.bubbleAttachImage}
                  resizeMode="cover"
                />
                {f.type === "video" && (
                  <View style={s.attachVideoOverlay}>
                    <HugeiconsIcon
                      icon={PlayCircle02Icon}
                      size={18}
                      color={C.white}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
        {msg.text.length > 0 && (
          <Text style={s.bubbleUserText}>{msg.text}</Text>
        )}
      </View>
    </Animated.View>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({
  chats,
  activeChatId,
  onSelect,
  onNewChat,
  onClose,
  translateX,
  onViewUploads,
  uploadCount,
  onDeleteChat,
}: {
  chats: Chat[];
  activeChatId: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onClose: () => void;
  translateX: Animated.Value;
  onViewUploads: () => void;
  uploadCount: number;
  onDeleteChat: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50 || g.vx < -0.5) onClose();
        else
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
      },
    }),
  ).current;

  const handleLongPress = (id: string) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Delete Chat"],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) onDeleteChat(id);
        },
      );
    } else {
      Alert.alert("Chat Options", "", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Chat",
          style: "destructive",
          onPress: () => onDeleteChat(id),
        },
      ]);
    }
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        s.sidebar,
        { transform: [{ translateX }], paddingTop: insets.top },
      ]}
    >
      {/* Header — "LAB ASSISTANT / Nova AI" mirror */}
      <View style={s.sidebarHeader}>
        <View>
          <Text style={s.sidebarGreeting}>LAB ASSISTANT</Text>
          <Text style={s.sidebarTitle}>Nova AI</Text>
        </View>
        <Pressable onPress={onClose} style={s.sidebarCloseBtn}>
          <HugeiconsIcon icon={Cancel01Icon} size={18} color={C.textMuted} />
        </Pressable>
      </View>

      {/* New analysis — qaCardPrimary (black) */}
      <Pressable
        onPress={onNewChat}
        style={({ pressed }) => [s.sidebarNewBtn, pressed && { opacity: 0.8 }]}
      >
        <HugeiconsIcon icon={PencilEdit02Icon} size={18} color={C.white} />
        <Text style={s.sidebarNewBtnText}>New Analysis</Text>
      </Pressable>

      {/* Uploads — qaCardSecondary (card) */}
      <Pressable
        onPress={() => {
          onClose();
          setTimeout(onViewUploads, 250);
        }}
        style={({ pressed }) => [
          s.sidebarUploadsBtn,
          pressed && { opacity: 0.8 },
        ]}
      >
        <HugeiconsIcon icon={CloudUploadIcon} size={18} color={C.black} />
        <Text style={s.sidebarUploadsBtnText}>My Uploads</Text>
        {uploadCount > 0 && (
          <View style={s.uploadBadge}>
            <Text style={s.uploadBadgeText}>
              {uploadCount > 99 ? "99+" : uploadCount}
            </Text>
          </View>
        )}
      </Pressable>

      {/* Section label — exact HomeScreen sectionTitle */}
      <Text style={s.sidebarSection}>CHAT HISTORY</Text>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {chats.map((chat) => (
          <Pressable
            key={chat.id}
            onPress={() => {
              onSelect(chat.id);
              onClose();
            }}
            onLongPress={() => handleLongPress(chat.id)}
            style={({ pressed }) => [
              s.sidebarChatItem,
              chat.id === activeChatId && s.sidebarChatItemActive,
              pressed && { backgroundColor: "#ededf2" },
            ]}
          >
            <HugeiconsIcon icon={Message01Icon} size={16} color={C.textMuted} />
            <Text style={s.sidebarChatTitle} numberOfLines={1}>
              {chat.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={[s.sidebarFooter, { paddingBottom: insets.bottom + 12 }]}>
        <View style={s.sidebarUserAvatar}>
          <Text style={s.sidebarUserAvatarText}>U</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.sidebarUserName}>You</Text>
          <Text style={s.sidebarUserRole}>Researcher</Text>
        </View>
        <Pressable>
          <HugeiconsIcon
            icon={MoreHorizontalIcon}
            size={20}
            color={C.textMuted}
          />
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AnalyzeScreen() {
  const insets = useSafeAreaInsets();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>("new");
  const [message, setMessage] = useState("");
  const [inputHeight, setInputHeight] = useState(46);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [micPermission, setMicPermission] = useState<
    "unknown" | "granted" | "denied"
  >("unknown");
  const [uiRecordingStatus, setUiRecordingStatus] = useState<
    "idle" | "recording" | "processing" | "done" | "error"
  >("idle");
  const [transcriptionResult, setTranscriptionResult] = useState("");
  const [transcriptionError, setTranscriptionError] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [experiments, setExperiments] = useState<ApiExperiment[]>([]);
  const [protocols, setProtocols] = useState<ApiProtocol[]>([]);
  const [myUploads, setMyUploads] = useState<Upload[]>([]);
  const [uploadsLoading, setUploadsLoading] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const uploadsSheetRef = useRef<BottomSheetModal>(null);
  const uploadsSnapPoints = useMemo(() => ["60%", "92%"], []);
  const handleSendRef = useRef<((text?: string) => void) | null>(null);

  const audioRecorder = useAudioRecorder(RECORDING_OPTIONS_WITH_METERING);
  const recorderState = useAudioRecorderState(audioRecorder, 100);

  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse1Opacity = useRef(new Animated.Value(0.5)).current;
  const pulse2Opacity = useRef(new Animated.Value(0.3)).current;
  const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const meteringScale = useRef(new Animated.Value(1)).current;

  const startPulse = useCallback(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse1, {
            toValue: 1.5,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulse1, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulse1Opacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulse1Opacity, {
            toValue: 0.5,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(pulse2, {
            toValue: 1.8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulse2, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(pulse2Opacity, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulse2Opacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    pulseAnimRef.current = loop;
    loop.start();
  }, [pulse1, pulse2, pulse1Opacity, pulse2Opacity]);

  const stopPulse = useCallback(() => {
    pulseAnimRef.current?.stop();
    pulse1.setValue(1);
    pulse2.setValue(1);
    pulse1Opacity.setValue(0.5);
    pulse2Opacity.setValue(0.3);
    meteringScale.setValue(1);
  }, [pulse1, pulse2, pulse1Opacity, pulse2Opacity, meteringScale]);

  useEffect(() => {
    if (uiRecordingStatus !== "recording") return;
    const db = recorderState.metering ?? -60;
    const norm = Math.max(0, Math.min(1, (db + 60) / 60));
    Animated.timing(meteringScale, {
      toValue: 1 + norm * 0.35,
      duration: 80,
      useNativeDriver: true,
    }).start();
  }, [recorderState.metering, uiRecordingStatus]);

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const voiceSheetRef = useRef<BottomSheetModal>(null);
  const voiceSnapPoints = useMemo(() => ["45%", "65%"], []);

  const handleOpenVoiceMode = useCallback(async () => {
    Keyboard.dismiss();
    const granted = await ensureMicPermission();
    setMicPermission(granted ? "granted" : "denied");
    if (granted)
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    voiceSheetRef.current?.present();
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setTranscriptionResult("");
      setTranscriptionError("");
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setUiRecordingStatus("recording");
      startPulse();
    } catch (e) {
      console.warn("Failed to start recording", e);
    }
  }, [audioRecorder, startPulse]);

  const stopRecording = useCallback(async () => {
    if (!recorderState.isRecording) return;
    stopPulse();
    setUiRecordingStatus("processing");
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri) throw new Error("No recording URI found");
      const transcript = await transcribeWithNova(uri);
      setTranscriptionResult(transcript);
      setUiRecordingStatus("done");
    } catch (e: any) {
      setTranscriptionError(e?.message ?? "Transcription failed");
      setUiRecordingStatus("error");
    }
  }, [audioRecorder, recorderState.isRecording, stopPulse]);

  const handleUseTranscription = useCallback(() => {
    const text = transcriptionResult.trim();
    if (text) setMessage((p) => (p ? `${p} ${text}` : text));
    setTranscriptionResult("");
    setUiRecordingStatus("idle");
    voiceSheetRef.current?.dismiss();
  }, [transcriptionResult]);

  const handleSendTranscription = useCallback(() => {
    const text = transcriptionResult.trim();
    setTranscriptionResult("");
    setUiRecordingStatus("idle");
    voiceSheetRef.current?.dismiss();
    if (text) setTimeout(() => handleSendRef.current?.(text), 150);
  }, [transcriptionResult]);

  const handleRetryRecording = useCallback(() => {
    setTranscriptionResult("");
    setTranscriptionError("");
    setUiRecordingStatus("idle");
  }, []);

  const handleVoiceSheetChange = useCallback(
    (idx: number) => {
      if (idx === -1) {
        if (recorderState.isRecording) stopRecording();
        stopPulse();
        setUiRecordingStatus("idle");
        setTranscriptionResult("");
        setTranscriptionError("");
      }
    },
    [recorderState.isRecording, stopRecording, stopPulse],
  );

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

  useEffect(() => {
    const show = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const s1 = Keyboard.addListener(show, () => setIsKeyboardVisible(true));
    const s2 = Keyboard.addListener(hide, () => setIsKeyboardVisible(false));
    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);

  const TAB_BAR_H = Platform.OS === "ios" ? 100 : 92;
  const inputPaddingBottom = isKeyboardVisible ? 8 : TAB_BAR_H + 8;

  const sidebarX = useRef(new Animated.Value(-SIDEBAR_W)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const focusAnim = useRef(new Animated.Value(0)).current;
  const sendScale = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef<FlatList>(null);
  const isAtBottom = useRef(true);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const scrollDownAnim = useRef(new Animated.Value(0)).current;

  const scrollToBottom = useCallback((animated = true) => {
    flatListRef.current?.scrollToEnd({ animated });
  }, []);

  const handleScroll = useCallback(
    (e: any) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const atBottom =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - 60;
      if (atBottom !== isAtBottom.current) {
        isAtBottom.current = atBottom;
        setShowScrollDown(!atBottom);
        Animated.timing(scrollDownAnim, {
          toValue: atBottom ? 0 : 1,
          duration: 180,
          useNativeDriver: true,
        }).start();
      }
    },
    [scrollDownAnim],
  );

  const activeChat = chats.find((c) => c.id === activeChatId);
  const isNewChat = activeChatId === "new";
  const hasContent = message.trim().length > 0 || attachments.length > 0;

  useEffect(() => {
    loadChatSessions();
    loadExperiments();
    loadProtocols();
    loadMyUploads();
  }, []);

  const loadChatSessions = async () => {
    try {
      setIsLoadingData(true);
      const r = await api.listChatSessions({ page: 1, limit: 50 });
      if (r.success && r.data)
        setChats((prev) => [
          ...r.data!.data.map(apiSessionToChat),
          ...prev.filter((c) => !c.isPersisted),
        ]);
    } catch (_) {
    } finally {
      setIsLoadingData(false);
    }
  };
  const loadExperiments = async () => {
    try {
      const r = await api.listMyExperiments({ page: 1, limit: 50 });
      if (r.success && r.data) setExperiments(r.data.data);
    } catch (_) {}
  };
  const loadProtocols = async () => {
    try {
      const r = await api.listMyProtocols({ page: 1, limit: 50 });
      if (r.success && r.data) setProtocols(r.data.data);
    } catch (_) {}
  };
  const loadMyUploads = async () => {
    try {
      setUploadsLoading(true);
      const r = await api.listMyUploads({ page: 1, limit: 50 });
      if (r.success && r.data) setMyUploads(r.data.data);
    } catch (_) {
    } finally {
      setUploadsLoading(false);
    }
  };

  const uploadFilesToServer = useCallback(
    async (files: AttachedFile[]): Promise<AttachedFile[]> => {
      const out: AttachedFile[] = [];
      for (const f of files) {
        try {
          const r = await api.uploadFile({
            uri: f.uri,
            name: f.fileName ?? `upload_${Date.now()}`,
            mimeType: f.mimeType,
          });
          if (r.success && r.data) {
            out.push({
              ...f,
              uploadedUrl: r.data.url,
              uploadId: r.data.id,
              uploadStatus: "done",
            });
            setMyUploads((prev) => [r.data!, ...prev]);
          } else out.push({ ...f, uploadStatus: "error" });
        } catch {
          out.push({ ...f, uploadStatus: "error" });
        }
      }
      return out;
    },
    [],
  );

  const registerAttachments = useCallback(
    async (files: AttachedFile[], expId: string) => {
      for (const f of files) {
        if (f.uploadStatus !== "done" || !f.uploadedUrl) continue;
        try {
          let type: AttachmentType = "DATA_FILE";
          if (f.type === "image") type = "IMAGE";
          else if (f.type === "video") type = "VIDEO";
          await api.createAttachment({
            experimentId: expId,
            type,
            fileName: f.fileName ?? `upload_${Date.now()}`,
            fileSize: 0,
            mimeType: f.mimeType ?? "application/octet-stream",
            url: f.uploadedUrl,
          });
        } catch (_) {}
      }
    },
    [],
  );

  const pickFromLibrary = useCallback(
    async (type: "images" | "videos" | "all") => {
      const mt: ImagePicker.MediaType[] =
        type === "images"
          ? ["images"]
          : type === "videos"
            ? ["videos"]
            : ["images", "videos"];
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mt,
        allowsMultipleSelection: true,
        quality: 0.85,
        videoMaxDuration: 120,
      });
      if (!r.canceled)
        setAttachments((prev) => [
          ...prev,
          ...r.assets.map((a) => ({
            id: uid(),
            uri: a.uri,
            type: (a.type === "video" ? "video" : "image") as "image" | "video",
            mimeType: a.mimeType ?? undefined,
            fileName: a.fileName ?? undefined,
          })),
        ]);
    },
    [],
  );

  const pickFromCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera access denied", "Enable in Settings.");
      return;
    }
    const r = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.85,
      videoMaxDuration: 60,
    });
    if (!r.canceled) {
      const a = r.assets[0];
      setAttachments((prev) => [
        ...prev,
        {
          id: uid(),
          uri: a.uri,
          type: (a.type === "video" ? "video" : "image") as "image" | "video",
          mimeType: a.mimeType ?? undefined,
          fileName: a.fileName ?? undefined,
        },
      ]);
    }
  }, []);

  const handleAttach = useCallback(() => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            "Cancel",
            "Photo & Video Library",
            "Camera",
            "Images Only",
            "Videos Only",
          ],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) pickFromLibrary("all");
          else if (idx === 2) pickFromCamera();
          else if (idx === 3) pickFromLibrary("images");
          else if (idx === 4) pickFromLibrary("videos");
        },
      );
    } else {
      Alert.alert("Attach file", "", [
        {
          text: "Photo & Video Library",
          onPress: () => pickFromLibrary("all"),
        },
        { text: "Camera", onPress: () => pickFromCamera() },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }, [pickFromLibrary, pickFromCamera]);

  const openSidebar = () => {
    setIsSidebarOpen(true);
    Keyboard.dismiss();
    Animated.parallel([
      Animated.spring(sidebarX, {
        toValue: 0,
        tension: 260,
        friction: 26,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };
  const closeSidebar = useCallback(() => {
    Animated.parallel([
      Animated.spring(sidebarX, {
        toValue: -SIDEBAR_W,
        tension: 300,
        friction: 28,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setIsSidebarOpen(false));
  }, [sidebarX, overlayOpacity]);

  const handleNewChat = () => {
    setActiveChatId("new");
    setShowSuggestions(true);
    setMessage("");
    setInputHeight(46);
  };

  const handleDeleteChat = useCallback(
    async (chatId: string) => {
      const chat = chats.find((c) => c.id === chatId);
      if (!chat) return;
      Alert.alert("Delete Chat", `Delete "${chat.title}"?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (chat.sessionId) await api.deleteChatSession(chat.sessionId);
            } catch (_) {}
            setChats((prev) => prev.filter((c) => c.id !== chatId));
            if (activeChatId === chatId) {
              setActiveChatId("new");
              setShowSuggestions(true);
            }
          },
        },
      ]);
    },
    [chats, activeChatId],
  );

  const handleSuggestionClick = (sug: string) => {
    if (
      ["Analyze gel image", "Troubleshoot PCR", "Optimize protocol"].includes(
        sug,
      )
    )
      setShowAnalysisModal(true);
    else if (sug === "Load my experiments") loadExperimentsToChat();
    else if (sug === "Load my protocols") loadProtocolsToChat();
    else handleSend(sug);
  };

  const loadExperimentsToChat = async () => {
    if (experiments.length === 0) {
      Alert.alert("No Experiments", "Create one to get started!");
      return;
    }
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", ...experiments.map((e) => e.title)],
          cancelButtonIndex: 0,
          title: "Select an experiment",
        },
        (idx) => {
          if (idx > 0) loadExperimentContext(experiments[idx - 1]);
        },
      );
    } else {
      Alert.alert("Select Experiment", "", [
        { text: "Cancel", style: "cancel" },
        ...experiments.slice(0, 5).map((e) => ({
          text: e.title,
          onPress: () => loadExperimentContext(e),
        })),
      ]);
    }
  };
  const loadExperimentContext = async (exp: any) => {
    try {
      const sr = await api.createChatSession({
        title: `Experiment: ${exp.title}`,
        experimentId: exp.id,
      });
      if (!sr.success || !sr.data) throw new Error("Failed to create session");
      const ctx = `I've loaded experiment "${exp.title}". ${exp.protocol ? `Protocol: ${exp.protocol.name}. ` : ""}Status: ${exp.status}. How can I help?`;
      const mr = await api.sendChatMessage(sr.data.id, ctx);
      if (mr.success && mr.data) {
        setChats((prev) => [
          apiSessionToChat({
            ...sr.data!,
            messages: [mr.data!.reply],
            experiment: exp,
            protocol: exp.protocol,
          }),
          ...prev,
        ]);
        setActiveChatId(sr.data.id);
        setShowSuggestions(false);
      }
    } catch (_) {
      Alert.alert("Error", "Failed to load experiment context");
    }
  };
  const loadProtocolsToChat = async () => {
    if (protocols.length === 0) {
      Alert.alert("No Protocols", "Create one first!");
      return;
    }
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", ...protocols.map((p) => p.name)],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx > 0) loadProtocolContext(protocols[idx - 1]);
        },
      );
    } else {
      Alert.alert("Select Protocol", "", [
        { text: "Cancel", style: "cancel" },
        ...protocols.slice(0, 5).map((p) => ({
          text: p.name,
          onPress: () => loadProtocolContext(p),
        })),
      ]);
    }
  };
  const loadProtocolContext = async (p: ApiProtocol) => {
    try {
      const sr = await api.createChatSession({
        title: `Protocol: ${p.name}`,
        protocolId: p.id,
      });
      if (!sr.success || !sr.data) throw new Error();
      const ctx = `I've loaded protocol "${p.name}". ${p.description || ""}\n\n${p.steps.length} steps, ${p.materials.length} materials. How can I help?`;
      const mr = await api.sendChatMessage(sr.data.id, ctx);
      if (mr.success && mr.data) {
        setChats((prev) => [
          apiSessionToChat({
            ...sr.data!,
            messages: [mr.data!.reply],
            protocol: p,
          }),
          ...prev,
        ]);
        setActiveChatId(sr.data.id);
        setShowSuggestions(false);
      }
    } catch (_) {
      Alert.alert("Error", "Failed to load protocol");
    }
  };

  const handleSend = useCallback(
    (text?: string) => {
      const content = (text ?? message).trim();
      if (!content && attachments.length === 0) return;
      if (isTyping || isUploadingFiles) return;

      const pending = [...attachments];
      const userMsg: Message = {
        id: uid(),
        role: "user",
        text: content,
        attachments: pending.length > 0 ? pending : undefined,
      };
      const typingMsg: Message = {
        id: uid(),
        role: "assistant",
        text: "",
        typing: true,
      };

      setMessage("");
      setInputHeight(46);
      setShowSuggestions(false);
      setIsTyping(true);
      setAttachments([]);
      isAtBottom.current = true;
      setShowScrollDown(false);

      let targetId = activeChatId;
      let targetSessionId: string | undefined;

      if (activeChatId === "new") {
        const newId = cid();
        targetId = newId;
        setChats((prev) => [
          {
            id: newId,
            title: content.length > 32 ? content.slice(0, 32) + "…" : content,
            messages: [userMsg, typingMsg],
            isPersisted: false,
          },
          ...prev,
        ]);
        setActiveChatId(newId);
      } else {
        targetSessionId = chats.find((c) => c.id === activeChatId)?.sessionId;
        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId
              ? { ...c, messages: [...c.messages, userMsg, typingMsg] }
              : c,
          ),
        );
      }

      const targetChatId = targetId;
      const ctxExpId = chats.find((c) => c.id === targetChatId)?.experimentId;
      const ctxProtoId = chats.find((c) => c.id === targetChatId)?.protocolId;

      (async () => {
        try {
          let uploadSummary = "";
          if (pending.length > 0) {
            setIsUploadingFiles(true);
            try {
              const uploaded = await uploadFilesToServer(pending);
              setChats((prev) =>
                prev.map((c) => {
                  if (c.id !== targetChatId) return c;
                  return {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === userMsg.id ? { ...m, attachments: uploaded } : m,
                    ),
                  };
                }),
              );
              if (ctxExpId)
                registerAttachments(uploaded, ctxExpId).catch(() => {});
              uploadSummary = uploaded
                .filter((f) => f.uploadStatus === "done")
                .map(
                  (f) =>
                    `[Uploaded: ${f.fileName ?? "file"} → ${f.uploadedUrl}]`,
                )
                .join("\n");
            } finally {
              setIsUploadingFiles(false);
            }
          }

          let sessionId = targetSessionId;
          if (!sessionId) {
            const sr = await api.createChatSession(
              ctxExpId
                ? { experimentId: ctxExpId }
                : ctxProtoId
                  ? { protocolId: ctxProtoId }
                  : {},
            );
            if (sr.success && sr.data) {
              sessionId = sr.data.id;
              setChats((prev) =>
                prev.map((c) =>
                  c.id === targetChatId
                    ? { ...c, sessionId, isPersisted: true }
                    : c,
                ),
              );
            }
          }
          if (!sessionId) throw new Error("Failed to create session");

          const fullContent = uploadSummary
            ? `${content}\n\n${uploadSummary}`
            : content;
          const res = await api.sendChatMessage(sessionId, fullContent);
          if (!res.success || !res.data)
            throw new Error(res.message ?? "Failed to send");

          const aiMsg: Message = {
            id: res.data.reply.id,
            role: "assistant",
            text: res.data.reply.content,
          };
          setChats((prev) =>
            prev.map((c) => {
              if (c.id !== targetChatId) return c;
              return {
                ...c,
                messages: [...c.messages.filter((m) => !m.typing), aiMsg],
                title: res.data!.session.title,
                sessionId: res.data!.session.id,
                isPersisted: true,
              };
            }),
          );
        } catch (err) {
          const errText =
            err instanceof Error ? err.message : "Failed to get AI reply";
          setChats((prev) =>
            prev.map((c) => {
              if (c.id !== targetChatId) return c;
              return {
                ...c,
                messages: [
                  ...c.messages.filter((m) => !m.typing),
                  { id: uid(), role: "assistant", text: `Error: ${errText}` },
                ],
              };
            }),
          );
        } finally {
          setIsTyping(false);
          setIsUploadingFiles(false);
        }
      })();
    },
    [
      message,
      attachments,
      activeChatId,
      isTyping,
      isUploadingFiles,
      chats,
      uploadFilesToServer,
      registerAttachments,
    ],
  );

  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);
  useEffect(() => {
    isAtBottom.current = true;
    setShowScrollDown(false);
  }, [activeChatId]);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
        {/* ── HEADER — HomeScreen header pattern ── */}
        <View style={s.header}>
          <Pressable onPress={openSidebar} style={s.headerIconBtn}>
            <HugeiconsIcon icon={Menu01Icon} size={22} color={C.textPrimary} />
          </Pressable>

          <View style={s.headerCenter}>
            <Text style={s.headerGreeting}>LAB ASSISTANT</Text>
            <Text style={s.headerTitle}>Nova AI</Text>
          </View>

          <Pressable onPress={handleNewChat} style={s.headerIconBtn}>
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              size={22}
              color={C.textPrimary}
            />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={{ flex: 1 }}>
            {/* ── EMPTY / NEW CHAT STATE ── */}
            {isNewChat ? (
              <Pressable onPress={Keyboard.dismiss} style={s.emptyState}>
                {isLoadingData ? (
                  <>
                    <ActivityIndicator size="large" color={C.black} />
                    <Text style={s.emptyTitle}>Loading your data…</Text>
                  </>
                ) : (
                  <>
                    {/* Hero avatar — black circle, SparklesIcon */}
                    <View style={s.emptyAvatar}>
                      <HugeiconsIcon
                        icon={SparklesIcon}
                        size={28}
                        color={C.white}
                      />
                    </View>
                    <Text style={s.emptyGreeting}>LAB ASSISTANT</Text>
                    <Text style={s.emptyTitle}>
                      Ready to analyse your experiment?
                    </Text>
                    <Text style={s.emptySubtitle}>
                      Load an experiment, upload gel images,{"\n"}or ask for
                      troubleshooting help.
                    </Text>
                    {experiments.length > 0 && (
                      <View style={s.emptyStatRow}>
                        <View style={s.emptyStat}>
                          <Text style={s.emptyStatVal}>
                            {experiments.length}
                          </Text>
                          <Text style={s.emptyStatLabel}>EXPERIMENTS</Text>
                        </View>
                        <View style={s.emptyStat}>
                          <Text style={s.emptyStatVal}>{protocols.length}</Text>
                          <Text style={s.emptyStatLabel}>PROTOCOLS</Text>
                        </View>
                      </View>
                    )}
                  </>
                )}
              </Pressable>
            ) : (
              <View style={{ flex: 1 }}>
                <FlatList
                  ref={flatListRef}
                  data={activeChat?.messages ?? []}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => <MessageBubble msg={item} />}
                  contentContainerStyle={s.messageList}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  onScrollBeginDrag={Keyboard.dismiss}
                  keyboardDismissMode={
                    Platform.OS === "ios" ? "interactive" : "on-drag"
                  }
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  onContentSizeChange={() => {
                    if (isAtBottom.current) scrollToBottom(true);
                  }}
                  onLayout={() => scrollToBottom(false)}
                  maintainVisibleContentPosition={{
                    minIndexForVisible: 0,
                    autoscrollToTopThreshold: 10,
                  }}
                />
                {/* Scroll-to-bottom FAB */}
                <Animated.View
                  pointerEvents={showScrollDown ? "auto" : "none"}
                  style={[
                    s.scrollFab,
                    {
                      opacity: scrollDownAnim,
                      transform: [
                        {
                          translateY: scrollDownAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [12, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => scrollToBottom(true)}
                    style={s.scrollFabInner}
                  >
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      size={16}
                      color={C.textPrimary}
                    />
                  </Pressable>
                </Animated.View>
              </View>
            )}

            {/* ── INPUT AREA ── */}
            <View style={[s.inputArea, { paddingBottom: inputPaddingBottom }]}>
              {/* Suggestion pills — card style */}
              {showSuggestions && isNewChat && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 12 }}
                  contentContainerStyle={s.pillsContent}
                  keyboardShouldPersistTaps="always"
                >
                  {SUGGESTIONS.map((sug) => (
                    <Pressable
                      key={sug}
                      onPress={() => handleSuggestionClick(sug)}
                      style={({ pressed }) => [
                        s.pill,
                        pressed && { opacity: 0.75 },
                      ]}
                    >
                      <Text style={s.pillText}>{sug}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              {/* Input card — card surface like HomeScreen cards */}
              <View style={s.inputCard}>
                {isUploadingFiles && (
                  <View style={s.uploadBanner}>
                    <ActivityIndicator
                      size="small"
                      color={C.black}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={s.uploadBannerText}>Uploading files…</Text>
                  </View>
                )}
                <AttachmentStrip
                  files={attachments}
                  onRemove={(id) =>
                    setAttachments((p) => p.filter((f) => f.id !== id))
                  }
                />
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Describe your experiment or upload images…"
                  placeholderTextColor={C.textMuted}
                  multiline
                  onFocus={() =>
                    Animated.timing(focusAnim, {
                      toValue: 1,
                      duration: 200,
                      useNativeDriver: false,
                    }).start()
                  }
                  onBlur={() =>
                    Animated.timing(focusAnim, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: false,
                    }).start()
                  }
                  onContentSizeChange={(e) =>
                    setInputHeight(
                      Math.min(
                        160,
                        Math.max(46, e.nativeEvent.contentSize.height),
                      ),
                    )
                  }
                  style={[s.textInput, { height: inputHeight }]}
                />
                <View style={s.toolbar}>
                  {/* Tool chips — HomeScreen qaCard style */}
                  <View style={s.toolRow}>
                    <Pressable
                      style={({ pressed }) => [
                        s.toolChip,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={handleAttach}
                    >
                      <HugeiconsIcon
                        icon={Attachment01Icon as any}
                        size={16}
                        color={C.textSecondary}
                      />
                      <Text style={s.toolChipLabel}>Attach</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        s.toolChip,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => setShowAnalysisModal(true)}
                    >
                      <HugeiconsIcon
                        icon={MicroscopeIcon as any}
                        size={16}
                        color={C.textSecondary}
                      />
                      <Text style={s.toolChipLabel}>Analyze</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        s.toolChip,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <HugeiconsIcon
                        icon={Beaker as any}
                        size={16}
                        color={C.textSecondary}
                      />
                      <Text style={s.toolChipLabel}>Protocol</Text>
                    </Pressable>
                  </View>

                  {hasContent ? (
                    <Animated.View
                      style={{ transform: [{ scale: sendScale }] }}
                    >
                      <Pressable
                        onPress={() => handleSend()}
                        onPressIn={() =>
                          Animated.spring(sendScale, {
                            toValue: 0.85,
                            useNativeDriver: true,
                            tension: 450,
                            friction: 20,
                          }).start()
                        }
                        onPressOut={() =>
                          Animated.spring(sendScale, {
                            toValue: 1,
                            useNativeDriver: true,
                            tension: 320,
                            friction: 14,
                          }).start()
                        }
                        style={s.sendBtn}
                      >
                        <HugeiconsIcon
                          icon={ArrowUp02Icon}
                          size={20}
                          color={C.white}
                        />
                      </Pressable>
                    </Animated.View>
                  ) : (
                    <Pressable onPress={handleOpenVoiceMode} style={s.micBtn}>
                      <HugeiconsIcon
                        icon={Mic02Icon}
                        size={20}
                        color={C.textPrimary}
                      />
                    </Pressable>
                  )}
                </View>
              </View>

              <Text style={s.footnote}>
                Lab Assistant AI provides guidance based on standard protocols.
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── SIDEBAR OVERLAY ── */}
      {isSidebarOpen && (
        <Animated.View style={[s.overlay, { opacity: overlayOpacity }]}>
          <TouchableWithoutFeedback onPress={closeSidebar}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>
      )}

      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelect={setActiveChatId}
        onNewChat={() => {
          handleNewChat();
          closeSidebar();
        }}
        onClose={closeSidebar}
        translateX={sidebarX}
        onViewUploads={() => {
          loadMyUploads();
          uploadsSheetRef.current?.present();
        }}
        uploadCount={myUploads.length}
        onDeleteChat={handleDeleteChat}
      />

      {/* ── VOICE BOTTOM SHEET ── */}
      <BottomSheetModal
        ref={voiceSheetRef}
        index={0}
        snapPoints={voiceSnapPoints}
        onChange={handleVoiceSheetChange}
        backdropComponent={renderBackdrop}
        backgroundStyle={s.sheetBg}
        handleIndicatorStyle={s.sheetHandle}
      >
        <BottomSheetView style={s.voiceSheet}>
          {micPermission === "denied" ? (
            <>
              <View style={s.voiceOrb}>
                <HugeiconsIcon icon={MicOff01Icon} size={32} color={C.white} />
              </View>
              <Text style={s.voiceTitle}>Microphone denied</Text>
              <Text style={s.voiceSubtitle}>
                Enable in device Settings to use voice input.
              </Text>
            </>
          ) : uiRecordingStatus === "done" ? (
            <>
              <View style={[s.voiceOrb, { backgroundColor: C.green }]}>
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  size={32}
                  color={C.white}
                />
              </View>
              <Text style={s.voiceTitle}>Voice captured</Text>
              <Text style={s.voiceSubtitle}>
                Review your transcription below
              </Text>
              <View style={s.transcriptCard}>
                <ScrollView
                  style={{ maxHeight: 110 }}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={s.transcriptText}>
                    {transcriptionResult || "(no speech detected)"}
                  </Text>
                </ScrollView>
              </View>
              <View style={s.voiceActionRow}>
                <Pressable
                  onPress={handleRetryRecording}
                  style={s.voiceBtnCard}
                >
                  <HugeiconsIcon
                    icon={Refresh01Icon}
                    size={15}
                    color={C.textMuted}
                  />
                  <Text style={s.voiceBtnCardText}>Retry</Text>
                </Pressable>
                <Pressable
                  onPress={handleUseTranscription}
                  style={[s.voiceBtnCard, { flex: 1 }]}
                >
                  <Text style={[s.voiceBtnCardText, { color: C.textPrimary }]}>
                    Edit First
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSendTranscription}
                  style={[s.voiceBtnPrimary, { flex: 1 }]}
                >
                  <Text style={s.voiceBtnPrimaryText}>Send Now</Text>
                </Pressable>
              </View>
            </>
          ) : uiRecordingStatus === "error" ? (
            <>
              <View style={[s.voiceOrb, { backgroundColor: C.red }]}>
                <HugeiconsIcon icon={MicOff01Icon} size={32} color={C.white} />
              </View>
              <Text style={s.voiceTitle}>Transcription failed</Text>
              <Text style={s.voiceSubtitle} numberOfLines={3}>
                {transcriptionError}
              </Text>
              <Pressable
                onPress={handleRetryRecording}
                style={[
                  s.voiceBtnPrimary,
                  { marginTop: 24, paddingHorizontal: 32 },
                ]}
              >
                <HugeiconsIcon icon={Refresh01Icon} size={15} color={C.white} />
                <Text style={s.voiceBtnPrimaryText}>Try Again</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={s.voicePulseWrap}>
                {uiRecordingStatus === "recording" && (
                  <>
                    <Animated.View
                      style={[
                        s.pulseRing,
                        {
                          transform: [{ scale: pulse1 }],
                          opacity: pulse1Opacity,
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        s.pulseRing,
                        s.pulseRing2,
                        {
                          transform: [{ scale: pulse2 }],
                          opacity: pulse2Opacity,
                        },
                      ]}
                    />
                  </>
                )}
                <Animated.View
                  style={{ transform: [{ scale: meteringScale }] }}
                >
                  <Pressable
                    onPress={
                      uiRecordingStatus === "recording"
                        ? stopRecording
                        : uiRecordingStatus === "idle"
                          ? startRecording
                          : undefined
                    }
                    style={[
                      s.voiceOrb,
                      uiRecordingStatus === "recording" && {
                        backgroundColor: C.red,
                      },
                    ]}
                  >
                    {uiRecordingStatus === "processing" ? (
                      <ActivityIndicator size="large" color={C.white} />
                    ) : (
                      <HugeiconsIcon
                        icon={
                          uiRecordingStatus === "recording"
                            ? Cancel01Icon
                            : Mic02Icon
                        }
                        size={32}
                        color={C.white}
                      />
                    )}
                  </Pressable>
                </Animated.View>
              </View>
              <Text style={s.voiceTitle}>
                {uiRecordingStatus === "idle"
                  ? "Tap to speak"
                  : uiRecordingStatus === "recording"
                    ? formatDuration(recorderState.durationMillis ?? 0)
                    : "Transcribing…"}
              </Text>
              <Text style={s.voiceSubtitle}>
                {uiRecordingStatus === "idle"
                  ? "Voice will be transcribed automatically"
                  : uiRecordingStatus === "recording"
                    ? "Tap orb to stop"
                    : "Sending to Whisper AI"}
              </Text>
            </>
          )}
        </BottomSheetView>
      </BottomSheetModal>

      {/* ── UPLOADS BOTTOM SHEET ── */}
      <BottomSheetModal
        ref={uploadsSheetRef}
        index={0}
        snapPoints={uploadsSnapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={s.sheetBg}
        handleIndicatorStyle={s.sheetHandle}
      >
        <BottomSheetScrollView contentContainerStyle={s.uploadsSheet}>
          {/* Sheet header */}
          <View style={s.uploadsHeader}>
            <View>
              <Text style={s.uploadsGreeting}>YOUR FILES</Text>
              <Text style={s.uploadsTitle}>My Uploads</Text>
            </View>
            <Pressable onPress={loadMyUploads} style={s.uploadsRefreshBtn}>
              <HugeiconsIcon
                icon={Refresh01Icon}
                size={16}
                color={C.textPrimary}
              />
            </Pressable>
          </View>

          {/* Stats row */}
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statVal}>{myUploads.length}</Text>
              <Text style={s.statLabel}>TOTAL FILES</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statVal}>
                {myUploads.filter((u) => u.type.startsWith("image/")).length}
              </Text>
              <Text style={s.statLabel}>IMAGES</Text>
            </View>
          </View>

          {uploadsLoading ? (
            <View style={s.uploadsEmpty}>
              <ActivityIndicator size="large" color={C.black} />
              <Text style={s.uploadsEmptyText}>Loading uploads…</Text>
            </View>
          ) : myUploads.length === 0 ? (
            <View style={s.uploadsEmpty}>
              <View style={s.uploadsEmptyIcon}>
                <HugeiconsIcon
                  icon={Folder01Icon}
                  size={28}
                  color={C.textMuted}
                />
              </View>
              <Text style={s.uploadsEmptyTitle}>No uploads yet</Text>
              <Text style={s.uploadsEmptyText}>
                Attach files when chatting to upload them here.
              </Text>
            </View>
          ) : (
            <>
              <Text style={s.uploadsSectionTitle}>ALL FILES</Text>
              {myUploads.map((item) => {
                const isImage = item.type.startsWith("image/");
                const isVideo = item.type.startsWith("video/");
                const kb = Math.round(item.size / 1024);
                const size =
                  kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
                const date = new Date(item.createdAt).toLocaleDateString(
                  undefined,
                  { month: "short", day: "numeric", year: "numeric" },
                );
                return (
                  <View key={item.id} style={s.uploadItem}>
                    <View style={s.uploadThumb}>
                      {isImage ? (
                        <Image
                          source={{ uri: item.url }}
                          style={s.uploadThumbImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <HugeiconsIcon
                          icon={isVideo ? Video01Icon : File01Icon}
                          size={22}
                          color={C.textMuted}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text
                        style={s.uploadName}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                      >
                        {item.name}
                      </Text>
                      <Text style={s.uploadMeta}>
                        {size} · {date}
                      </Text>
                      <View style={s.uploadBadgeRow}>
                        <View
                          style={[
                            s.uploadVisibilityBadge,
                            item.isPublic
                              ? s.uploadBadgePublic
                              : s.uploadBadgePrivate,
                          ]}
                        >
                          <Text style={s.uploadBadgeText}>
                            {item.isPublic ? "Public" : "Private"}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Pressable
                      onPress={() =>
                        Alert.alert("Delete Upload", `Delete "${item.name}"?`, [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: async () => {
                              try {
                                await api.deleteUpload(item.id);
                                setMyUploads((p) =>
                                  p.filter((u) => u.id !== item.id),
                                );
                              } catch (_) {
                                Alert.alert("Error", "Could not delete.");
                              }
                            },
                          },
                        ])
                      }
                      style={s.uploadDeleteBtn}
                    >
                      <HugeiconsIcon
                        icon={Delete02Icon}
                        size={17}
                        color={C.red}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      <AnalysisToolsModal
        visible={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        experimentId={
          activeChat?.experimentId ||
          (activeChatId !== "new" ? activeChatId : undefined)
        }
        protocol={activeChat?.protocol}
        experimentName={activeChat?.experiment?.title}
      />
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Header — exact HomeScreen ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { alignItems: "center" },
  headerGreeting: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.5,
  },

  // ── Empty state ──
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  emptyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyGreeting: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.textPrimary,
    textAlign: "center",
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 21,
  },
  emptyStatRow: { flexDirection: "row", gap: 12, marginTop: 28 },
  emptyStat: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
  },
  emptyStatVal: { fontSize: 26, fontWeight: "700", color: C.textPrimary },
  emptyStatLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: C.textMuted,
    marginTop: 4,
    letterSpacing: 1,
  },

  // ── Messages ──
  messageList: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  msgWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
    gap: 10,
  },
  msgWrapUser: { flexDirection: "row-reverse" },
  msgWrapAI: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  aiAvatarText: { fontSize: 10, fontWeight: "800", color: C.white },
  bubbleUser: {
    maxWidth: "80%",
    backgroundColor: C.card,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  bubbleUserText: { fontSize: 15, lineHeight: 22, color: C.textPrimary },
  typingRow: {
    flexDirection: "row",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.textMuted,
  },
  bubbleAttachGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 6,
  },
  bubbleAttachItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: C.card,
  },
  bubbleAttachImage: { width: "100%", height: "100%" },

  // ── Scroll FAB ──
  scrollFab: { position: "absolute", bottom: 12, right: 14, zIndex: 10 },
  scrollFabInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Input area ──
  inputArea: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: C.bg },
  pillsContent: { gap: 8, paddingHorizontal: 2 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: C.card,
    borderRadius: 20,
  },
  pillText: { fontSize: 13, color: C.textPrimary, fontWeight: "500" },

  // Input card — card surface matching HomeScreen card style
  inputCard: { backgroundColor: C.card, borderRadius: 26, overflow: "hidden" },
  textInput: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 6,
    fontSize: 16,
    lineHeight: 24,
    color: C.textPrimary,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 4,
  },
  toolRow: { flexDirection: "row", gap: 6 },
  toolChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: C.white,
    borderRadius: 14,
  },
  toolChipLabel: { fontSize: 12, fontWeight: "600", color: C.textSecondary },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
  },
  micBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  footnote: {
    textAlign: "center",
    color: C.textMuted,
    fontSize: 11,
    marginTop: 8,
    marginBottom: 4,
  },

  // Upload banner
  uploadBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: C.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.card,
  },
  uploadBannerText: { fontSize: 13, fontWeight: "600", color: C.black },

  // Attachment strip
  attachStrip: { marginHorizontal: 8, marginTop: 10 },
  attachStripContent: { gap: 8, paddingHorizontal: 4, paddingBottom: 2 },
  attachThumb: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: C.white,
  },
  attachThumbImage: { width: "100%", height: "100%" },
  attachVideoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  attachRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Overlay ──
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.overlay,
    zIndex: 10,
  },

  // ── Sidebar — HomeScreen visual DNA ──
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_W,
    backgroundColor: C.bg,
    zIndex: 20,
  },
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  sidebarGreeting: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1.5,
  },
  sidebarTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -1,
  },
  sidebarCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  // qaCardPrimary
  sidebarNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.black,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 18,
  },
  sidebarNewBtnText: { fontSize: 15, fontWeight: "700", color: C.white },
  // qaCardSecondary
  sidebarUploadsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.card,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
  },
  sidebarUploadsBtnText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: C.textPrimary,
  },
  uploadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  uploadBadgeText: { fontSize: 11, fontWeight: "700", color: C.white },
  // sectionTitle
  sidebarSection: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  // runCard-style rows
  sidebarChatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 12,
    borderRadius: 20,
    marginBottom: 4,
  },
  sidebarChatItemActive: { backgroundColor: C.card },
  sidebarChatTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: C.textPrimary,
  },
  sidebarFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.card,
  },
  sidebarUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarUserAvatarText: { fontSize: 13, fontWeight: "800", color: C.white },
  sidebarUserName: { fontSize: 14, fontWeight: "700", color: C.textPrimary },
  sidebarUserRole: { fontSize: 11, color: C.textMuted },

  // ── Bottom sheets ──
  sheetBg: { backgroundColor: C.bg, borderRadius: 28 },
  sheetHandle: { backgroundColor: C.card, width: 40 },

  // Voice sheet
  voiceSheet: {
    flex: 1,
    alignItems: "center",
    paddingTop: 36,
    paddingHorizontal: 24,
  },
  voicePulseWrap: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  pulseRing: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  pulseRing2: { width: 140, height: 140, borderRadius: 70 },
  voiceOrb: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  voiceSubtitle: { fontSize: 14, color: C.textMuted, textAlign: "center" },
  transcriptCard: {
    width: "100%",
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: C.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  transcriptText: { fontSize: 15, lineHeight: 23, color: C.textPrimary },
  voiceActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    width: "100%",
  },
  voiceBtnCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: C.card,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  voiceBtnCardText: { fontSize: 14, fontWeight: "600", color: C.textMuted },
  voiceBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: C.black,
    borderRadius: 16,
    paddingVertical: 12,
  },
  voiceBtnPrimaryText: { fontSize: 14, fontWeight: "700", color: C.white },

  // Uploads sheet
  uploadsSheet: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
  uploadsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  uploadsGreeting: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1.5,
  },
  uploadsTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -1,
  },
  uploadsRefreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
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
  uploadsSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1,
    marginBottom: 14,
  },
  // runCard-style upload row
  uploadItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
  },
  uploadThumb: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  uploadThumbImg: { width: 48, height: 48 },
  uploadName: { fontSize: 14, fontWeight: "600", color: C.textPrimary },
  uploadMeta: { fontSize: 12, color: C.textMuted },
  uploadBadgeRow: { flexDirection: "row", gap: 6, marginTop: 2 },
  uploadVisibilityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  uploadBadgePublic: { backgroundColor: C.green + "22" },
  uploadBadgePrivate: { backgroundColor: C.card },
  // uploadBadgeText: { fontSize: 11, fontWeight: "600", color: C.textSecondary },
  uploadDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.red + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadsEmpty: { alignItems: "center", paddingVertical: 48, gap: 12 },
  uploadsEmptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadsEmptyTitle: { fontSize: 16, fontWeight: "700", color: C.textPrimary },
  uploadsEmptyText: { fontSize: 13, color: C.textMuted, textAlign: "center" },
});
