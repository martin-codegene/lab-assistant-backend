/**
 * protocols.tsx — HomeScreen design language port
 */

import {
  api,
  AssayType as ApiAssayType,
  Protocol as ApiProtocol,
} from "@/lib/api";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import {
  AddToListIcon,
  Archive01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Copy01Icon,
  Delete02Icon,
  FilterIcon,
  Mic02Icon,
  MoreHorizontalIcon,
  PlayIcon,
  ReloadIcon,
  Search01Icon,
  SortingAZ01Icon,
  SparklesIcon,
  TestTube01Icon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

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
  separator: "#e8e8ed",
} as const;

// Assay type pills — subtle tints only, no heavy colours
const TYPE_CONFIG: Record<string, { fg: string; bg: string }> = {
  PCR: { fg: "#7c5cfc", bg: "#f2effe" },
  Gel: { fg: C.blue, bg: "#eef3ff" },
  Western: { fg: C.amber, bg: "#fff4e0" },
  ELISA: { fg: C.green, bg: "#e8f8ef" },
  qPCR: { fg: "#0891b2", bg: "#e0f5fb" },
  Flow: { fg: C.red, bg: "#ffeceb" },
};

// ── Types ─────────────────────────────────────────────────────────────────────
type UiAssayType = "PCR" | "Gel" | "Western" | "ELISA" | "qPCR" | "Flow";
type ProtocolStatus = "active" | "running" | "draft" | "archived";
type SortOption = "recent" | "name" | "type" | "runs";

interface ProtocolStep {
  order: number;
  title: string;
  duration: string;
  temp?: number;
}
interface Protocol {
  id: string;
  name: string;
  type: UiAssayType;
  status: ProtocolStatus;
  description: string;
  author: string;
  lastRun: string | null;
  totalRuns: number;
  estimatedTime: string;
  tags: string[];
  steps: ProtocolStep[];
  successRate: number;
  runProgress?: number;
}

// ── API transform ─────────────────────────────────────────────────────────────
function mapApiType(t: ApiAssayType): UiAssayType {
  const m: Record<ApiAssayType, UiAssayType> = {
    PCR: "PCR",
    ELISA: "ELISA",
    WESTERN_BLOT: "Western",
    MICROSCOPY: "PCR",
    FLOW_CYTOMETRY: "Flow",
    CELL_CULTURE: "Flow",
    PROTEIN_EXPRESSION: "Western",
    DNA_SEQUENCING: "PCR",
    GEL: "Gel",
    OTHER: "Gel",
  };
  return m[t] ?? "PCR";
}
function transformProtocol(p: ApiProtocol): Protocol {
  const steps = p.steps.map((s) => ({
    order: s.step,
    title: s.action,
    duration: s.duration,
  }));
  const tags: string[] = [];
  if (p.conditions?.temperature) tags.push(`${p.conditions.temperature}`);
  if (p.conditions?.pH) tags.push(`pH ${p.conditions.pH}`);
  p.materials?.slice(0, 3).forEach((m) => tags.push(m.name));
  const mins = steps.reduce((acc, s) => {
    const match = s.duration.match(/(\d+)\s*(min|h|hr|hour)/i);
    if (!match) return acc;
    const val = parseInt(match[1]);
    return acc + (match[2].toLowerCase().startsWith("h") ? val * 60 : val);
  }, 0);
  const h = Math.floor(mins / 60),
    m = mins % 60;
  return {
    id: p.id,
    name: p.name,
    type: mapApiType(p.category),
    status: "active",
    description: p.description || "",
    author: p.createdBy?.name || p.createdBy?.email || "Unknown",
    lastRun: p.lastUsedAt ? new Date(p.lastUsedAt).toLocaleDateString() : null,
    totalRuns: p.usageCount,
    estimatedTime: h > 0 ? `${h}h ${m}m` : `${m}m`,
    tags: tags.slice(0, 5),
    steps,
    successRate: Math.floor(Math.random() * 30) + 70,
  };
}

// ── Filter config ─────────────────────────────────────────────────────────────
const ASSAY_TYPES: UiAssayType[] = [
  "PCR",
  "Gel",
  "Western",
  "ELISA",
  "qPCR",
  "Flow",
];
const STATUS_FILTERS: { value: ProtocolStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "running", label: "Running" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Most Recent" },
  { value: "name", label: "Name A–Z" },
  { value: "type", label: "Assay Type" },
  { value: "runs", label: "Most Runs" },
];

// ── Status dot config — HomeScreen statusDot pattern ─────────────────────────
const STATUS_CFG: Record<ProtocolStatus, { label: string; dot: string }> = {
  active: { label: "Active", dot: C.green },
  running: { label: "Running", dot: C.blue },
  draft: { label: "Draft", dot: C.textMuted },
  archived: { label: "Archived", dot: C.textMuted },
};

// ── Skeleton loader ───────────────────────────────────────────────────────────
function ProtocolCardSkeleton() {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[s.card, animStyle]}>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                width: 48,
                height: 22,
                backgroundColor: C.separator,
                borderRadius: 8,
              }}
            />
            <View
              style={{
                width: 60,
                height: 22,
                backgroundColor: C.separator,
                borderRadius: 8,
              }}
            />
          </View>
          <View
            style={{
              width: 28,
              height: 28,
              backgroundColor: C.separator,
              borderRadius: 10,
            }}
          />
        </View>
        <View
          style={{
            height: 18,
            backgroundColor: C.separator,
            borderRadius: 6,
            width: "75%",
          }}
        />
        <View
          style={{
            height: 14,
            backgroundColor: C.separator,
            borderRadius: 6,
            width: "90%",
          }}
        />
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[56, 72, 48].map((w, i) => (
            <View
              key={i}
              style={{
                height: 20,
                width: w,
                backgroundColor: C.separator,
                borderRadius: 7,
              }}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

// ── SVG progress ring ─────────────────────────────────────────────────────────
function RunProgress({ progress = 0 }: { progress: number }) {
  const r = 14,
    circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, progress / 100)));
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.12, { duration: 1000 }), -1, true);
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  return (
    <View
      style={{
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={36} height={36} viewBox="0 0 36 36">
        <Circle
          cx="18"
          cy="18"
          r={r}
          stroke={C.card}
          strokeWidth={3}
          fill="none"
        />
        <Circle
          cx="18"
          cy="18"
          r={r}
          stroke={C.blue}
          strokeWidth={3}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
      </Svg>
      <Animated.Text
        style={[
          {
            position: "absolute",
            fontSize: 9,
            fontWeight: "800",
            color: C.blue,
          },
          animStyle,
        ]}
      >
        {Math.round(progress)}%
      </Animated.Text>
    </View>
  );
}

// ── Protocol card ─────────────────────────────────────────────────────────────
function ProtocolCard({
  protocol,
  onPress,
  onActionPress,
}: {
  protocol: Protocol;
  onPress: () => void;
  onActionPress: () => void;
}) {
  const isRunning = protocol.status === "running";
  const typeCfg = TYPE_CONFIG[protocol.type] ?? TYPE_CONFIG.PCR;
  const statusCfg = STATUS_CFG[protocol.status];

  const successColor =
    protocol.successRate >= 90
      ? C.green
      : protocol.successRate >= 70
        ? C.amber
        : C.red;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onActionPress();
      }}
      delayLongPress={420}
      style={({ pressed }) => [
        s.card,
        isRunning && s.cardRunning,
        pressed && { backgroundColor: "#ededf2" },
      ]}
    >
      {/* Running strip — thin blue top bar */}
      {isRunning && (
        <View style={s.runStrip}>
          <View
            style={[
              s.runFill,
              { width: `${protocol.runProgress ?? 0}%` as any },
            ]}
          />
        </View>
      )}

      <View style={s.cardInner}>
        {/* Top row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", gap: 7, alignItems: "center" }}>
            {/* Type pill */}
            <View style={[s.typePill, { backgroundColor: typeCfg.bg }]}>
              <Text style={[s.typePillText, { color: typeCfg.fg }]}>
                {protocol.type}
              </Text>
            </View>
            {/* Status dot — exact HomeScreen runCard pattern */}
            <View style={s.statusRow}>
              <View style={[s.statusDot, { backgroundColor: statusCfg.dot }]} />
              <Text style={[s.statusLabel, { color: statusCfg.dot }]}>
                {statusCfg.label}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onActionPress();
            }}
            style={s.moreBtn}
            hitSlop={8}
          >
            <HugeiconsIcon
              icon={MoreHorizontalIcon}
              size={16}
              color={C.textMuted}
            />
          </Pressable>
        </View>

        {/* Name + description */}
        <Text style={s.cardName} numberOfLines={2}>
          {protocol.name}
        </Text>
        <Text style={s.cardDesc} numberOfLines={2}>
          {protocol.description}
        </Text>

        {/* Tags */}
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          {protocol.tags.slice(0, 3).map((tag, i) => (
            <View key={i} style={s.tagChip}>
              <Text style={s.tagChipText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {isRunning ? (
              <>
                <RunProgress progress={protocol.runProgress ?? 0} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: C.blue,
                    letterSpacing: 0.5,
                  }}
                >
                  LIVE RUN
                </Text>
              </>
            ) : (
              <>
                <HugeiconsIcon
                  icon={Clock01Icon}
                  size={11}
                  color={C.textMuted}
                />
                <Text style={s.footerText}>
                  {protocol.lastRun
                    ? `Last run ${protocol.lastRun}`
                    : "Never run"}
                </Text>
              </>
            )}
          </View>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            {/* Runs count — rankBubble-inspired chip */}
            <View style={s.runCountChip}>
              <Text style={s.runCountText}>{protocol.totalRuns} runs</Text>
            </View>
            {protocol.status !== "draft" && protocol.totalRuns > 0 && (
              <View
                style={[
                  s.successChip,
                  { backgroundColor: successColor + "18" },
                ]}
              >
                <Text style={[s.successText, { color: successColor }]}>
                  {protocol.successRate}%
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ProtocolsScreen() {
  const insets = useSafeAreaInsets();

  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedTypes, setSelectedTypes] = useState<UiAssayType[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ProtocolStatus | "all">(
    "all",
  );
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(
    null,
  );
  const [actionProtocol, setActionProtocol] = useState<Protocol | null>(null);

  const quickViewRef = useRef<BottomSheetModal>(null);
  const filterRef = useRef<BottomSheetModal>(null);
  const actionRef = useRef<BottomSheetModal>(null);

  const qvSnap = useMemo(() => ["65%", "92%"], []);
  const filterSnap = useMemo(() => ["58%", "85%"], []);
  const actionSnap = useMemo(() => ["42%"], []);

  const loadProtocols = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const r = await api.listMyProtocols({ page: 1, limit: 100 });
      if (r.success && r.data) setProtocols(r.data.data.map(transformProtocol));
      else setError(r.error || "Failed to load protocols");
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  useEffect(() => {
    loadProtocols();
  }, []);

  const handleQueryChange = (text: string) => {
    setRawQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.length > 0) {
      setIsSearching(true);
      searchTimer.current = setTimeout(() => {
        setQuery(text);
        setIsSearching(false);
      }, 320);
    } else {
      setQuery("");
      setIsSearching(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...protocols];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.author.toLowerCase().includes(q) ||
          p.steps.some((st) => st.title.toLowerCase().includes(q)),
      );
    }
    if (selectedTypes.length > 0)
      list = list.filter((p) => selectedTypes.includes(p.type));
    if (selectedStatus !== "all")
      list = list.filter((p) => p.status === selectedStatus);
    switch (sortBy) {
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "type":
        list.sort((a, b) => a.type.localeCompare(b.type));
        break;
      case "runs":
        list.sort((a, b) => b.totalRuns - a.totalRuns);
        break;
      default:
        list.sort(
          (a, b) =>
            (b.status === "running" ? 1 : 0) - (a.status === "running" ? 1 : 0),
        );
    }
    return list;
  }, [query, selectedTypes, selectedStatus, sortBy, protocols]);

  const activeFilterCount =
    selectedTypes.length +
    (selectedStatus !== "all" ? 1 : 0) +
    (sortBy !== "recent" ? 1 : 0);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.28}
      />
    ),
    [],
  );

  const openQuickView = (p: Protocol) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProtocol(p);
    quickViewRef.current?.present();
  };
  const openActions = (p: Protocol) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionProtocol(p);
    actionRef.current?.present();
  };

  const handleStartRun = async (p: Protocol) => {
    actionRef.current?.dismiss();
    quickViewRef.current?.dismiss();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const r = await api.createExperiment({
        title: `${p.name} - Run ${p.totalRuns + 1}`,
        description: p.description,
        protocolId: p.id,
        variables: { estimatedTime: p.estimatedTime, tags: p.tags },
      });
      if (r.success && r.data) {
        const sr = await api.startExperiment(r.data.id);
        if (sr.success) {
          Alert.alert("Experiment Started", `"${p.name}" is now running.`, [
            { text: "OK", style: "cancel" },
            {
              text: "View Details",
              onPress: () =>
                router.push({
                  pathname: "/(routes)/experiments",
                  params: { id: r.data!.id },
                }),
            },
          ]);
          await loadProtocols();
        } else Alert.alert("Error", sr.error || "Failed to start");
      } else Alert.alert("Error", r.error || "Failed to create");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleCancelRun = (p: Protocol) => {
    actionRef.current?.dismiss();
    Alert.alert(
      "Cancel Running Protocol?",
      `"${p.name}" is in progress. Cancelling will stop the run and log a partial result.`,
      [
        { text: "Keep Running", style: "cancel" },
        { text: "Cancel Run", style: "destructive", onPress: () => {} },
      ],
    );
  };

  const handleDelete = (p: Protocol) => {
    actionRef.current?.dismiss();
    Alert.alert("Delete Protocol?", `Permanently delete "${p.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const r = await api.deleteProtocol(p.id);
            if (r.success) {
              setProtocols((prev) => prev.filter((x) => x.id !== p.id));
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            } else Alert.alert("Error", r.error || "Failed to delete");
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  const handleDuplicate = async (p: Protocol) => {
    actionRef.current?.dismiss();
    try {
      const r = await api.duplicateProtocol(p.id, { name: `${p.name} (Copy)` });
      if (r.success && r.data) {
        setProtocols((prev) => [transformProtocol(r.data!), ...prev]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Protocol duplicated");
      } else Alert.alert("Error", r.error || "Failed to duplicate");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const toggleType = (t: UiAssayType) =>
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedStatus("all");
    setSortBy("recent");
  };

  const activeChips = [
    ...selectedTypes.map((t) => ({
      key: `type:${t}`,
      label: t,
      onRemove: () => toggleType(t),
    })),
    ...(selectedStatus !== "all"
      ? [
          {
            key: `status:${selectedStatus}`,
            label:
              STATUS_FILTERS.find((s) => s.value === selectedStatus)?.label ??
              "",
            onRemove: () => setSelectedStatus("all"),
          },
        ]
      : []),
    ...(sortBy !== "recent"
      ? [
          {
            key: `sort:${sortBy}`,
            label: `Sort: ${SORT_OPTIONS.find((s) => s.value === sortBy)?.label}`,
            onRemove: () => setSortBy("recent"),
          },
        ]
      : []),
  ];

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER — HomeScreen exact ── */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>PROTOCOLS</Text>
          <Text style={s.headerTitle}>Library</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {/* AI Generate — blockLabelPill inverted */}
          <Pressable
            style={[s.headerBtn, { backgroundColor: "#7c5cfc" }]}
            onPress={() => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              router.push("/(routes)/ai-generate" as any);
            }}
          >
            <HugeiconsIcon icon={SparklesIcon} size={16} color={C.white} />
            <Text style={s.headerBtnText}>AI</Text>
          </Pressable>
          {/* New — qaCardPrimary style */}
          <Pressable
            style={[s.headerBtn, { backgroundColor: C.black }]}
            onPress={() => router.push("/(routes)/create-protocol")}
          >
            <HugeiconsIcon icon={AddToListIcon} size={16} color={C.white} />
            <Text style={s.headerBtnText}>New</Text>
          </Pressable>
        </View>
      </View>

      {/* ── SEARCH ROW ── */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          {isSearching ? (
            <ActivityIndicator
              size="small"
              color={C.textMuted}
              style={{ width: 18 }}
            />
          ) : (
            <HugeiconsIcon icon={Search01Icon} size={16} color={C.textMuted} />
          )}
          <TextInput
            style={s.searchInput}
            placeholder="Search protocols, steps, tags…"
            placeholderTextColor={C.textMuted}
            value={rawQuery}
            onChangeText={handleQueryChange}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {rawQuery.length > 0 && (
            <Pressable
              hitSlop={8}
              onPress={() => {
                setRawQuery("");
                setQuery("");
              }}
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={14}
                color={C.textMuted}
              />
            </Pressable>
          )}
        </View>

        {/* Voice — card circle button */}
        <Pressable
          style={s.iconBtn}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
              "Voice Search",
              "Speak your protocol name, type, or step",
              [
                { text: "Cancel" },
                {
                  text: "Demo: qPCR GAPDH",
                  onPress: () => {
                    setRawQuery("qPCR GAPDH");
                    setQuery("qPCR GAPDH");
                  },
                },
              ],
            );
          }}
        >
          <HugeiconsIcon icon={Mic02Icon} size={18} color={C.textPrimary} />
        </Pressable>

        {/* Filter */}
        <Pressable
          style={[
            s.iconBtn,
            activeFilterCount > 0 && { backgroundColor: C.black },
          ]}
          onPress={() => filterRef.current?.present()}
        >
          <HugeiconsIcon
            icon={FilterIcon}
            size={18}
            color={activeFilterCount > 0 ? C.white : C.textPrimary}
          />
          {activeFilterCount > 0 && (
            <View style={s.filterBadge}>
              <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* ── ACTIVE FILTER CHIPS ── */}
      {activeChips.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={activeChips}
          keyExtractor={(c) => c.key}
          contentContainerStyle={{
            gap: 7,
            paddingHorizontal: 20,
            paddingVertical: 6,
          }}
          renderItem={({ item }) => (
            <Pressable style={s.activeChip} onPress={item.onRemove}>
              <Text style={s.activeChipText}>{item.label}</Text>
              <HugeiconsIcon icon={Cancel01Icon} size={10} color={C.black} />
            </Pressable>
          )}
          ListFooterComponent={
            <Pressable
              onPress={clearFilters}
              style={{ justifyContent: "center", paddingHorizontal: 6 }}
            >
              <Text
                style={{ fontSize: 12, color: C.textMuted, fontWeight: "600" }}
              >
                Clear all
              </Text>
            </Pressable>
          }
        />
      )}

      {/* ── COUNT ROW ── */}
      <View style={s.countRow}>
        <Text style={s.countText}>
          {isLoading
            ? "Loading…"
            : `${filtered.length} protocol${filtered.length !== 1 ? "s" : ""}${query ? ` for "${query}"` : ""}`}
        </Text>
        <Pressable
          style={s.sortPill}
          onPress={() => filterRef.current?.present()}
        >
          <HugeiconsIcon icon={SortingAZ01Icon} size={12} color={C.textMuted} />
          <Text style={s.sortPillText}>
            {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
          </Text>
        </Pressable>
      </View>

      {/* ── LIST ── */}
      <FlatList
        data={isLoading ? [] : filtered}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <ProtocolCard
            protocol={item}
            onPress={() => openQuickView(item)}
            onActionPress={() => openActions(item)}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <ProtocolCardSkeleton key={i} />
              ))}
            </View>
          ) : error ? (
            <View style={s.emptyState}>
              <View style={[s.emptyIcon, { backgroundColor: C.red + "12" }]}>
                <HugeiconsIcon icon={TestTube01Icon} size={26} color={C.red} />
              </View>
              <Text style={s.emptyTitle}>Error Loading</Text>
              <Text style={s.emptyBody}>{error}</Text>
              <Pressable style={s.emptyBtn} onPress={() => loadProtocols()}>
                <HugeiconsIcon icon={ReloadIcon} size={16} color={C.white} />
                <Text style={s.emptyBtnText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <View style={s.emptyState}>
              <View style={s.emptyIcon}>
                <HugeiconsIcon
                  icon={TestTube01Icon}
                  size={26}
                  color={C.textMuted}
                />
              </View>
              <Text style={s.emptyTitle}>No protocols found</Text>
              <Text style={s.emptyBody}>
                {query
                  ? `No results for "${query}".`
                  : protocols.length === 0
                    ? "Create your first protocol to get started."
                    : "Adjust your filters."}
              </Text>
              {protocols.length === 0 && (
                <Pressable
                  style={s.emptyBtn}
                  onPress={() => router.push("/(routes)/create-protocol")}
                >
                  <HugeiconsIcon
                    icon={AddToListIcon}
                    size={16}
                    color={C.white}
                  />
                  <Text style={s.emptyBtnText}>Create Protocol</Text>
                </Pressable>
              )}
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadProtocols(true)}
            tintColor={C.black}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: insets.bottom + 140,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      />

      {/* ══════════════════════════════════════════════
          QUICK VIEW SHEET
      ══════════════════════════════════════════════ */}
      <BottomSheetModal
        ref={quickViewRef}
        snapPoints={qvSnap}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={s.sheetHandle}
        backgroundStyle={s.sheetBg}
        enablePanDownToClose
      >
        <BottomSheetScrollView contentContainerStyle={s.sheetContent}>
          {selectedProtocol &&
            (() => {
              const p = selectedProtocol;
              const typeCfg = TYPE_CONFIG[p.type] ?? TYPE_CONFIG.PCR;
              const statusCfg = STATUS_CFG[p.status];
              const activeStepIdx =
                p.status === "running"
                  ? Math.max(
                      0,
                      Math.ceil((p.runProgress ?? 0) / (100 / p.steps.length)) -
                        1,
                    )
                  : -1;
              const successColor =
                p.successRate >= 90
                  ? C.green
                  : p.successRate >= 70
                    ? C.amber
                    : C.red;

              return (
                <>
                  {/* Sheet header — greeing pattern */}
                  <Text style={s.sheetGreeting}>PROTOCOL DETAILS</Text>

                  {/* Type + status */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={[s.typePill, { backgroundColor: typeCfg.bg }]}
                      >
                        <Text style={[s.typePillText, { color: typeCfg.fg }]}>
                          {p.type}
                        </Text>
                      </View>
                      <View style={s.statusRow}>
                        <View
                          style={[
                            s.statusDot,
                            { backgroundColor: statusCfg.dot },
                          ]}
                        />
                        <Text style={[s.statusLabel, { color: statusCfg.dot }]}>
                          {statusCfg.label}
                        </Text>
                      </View>
                    </View>
                    {p.status === "running" && (
                      <RunProgress progress={p.runProgress ?? 0} />
                    )}
                  </View>

                  <Text style={s.sheetTitle}>{p.name}</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: C.textMuted,
                      marginBottom: 8,
                    }}
                  >
                    By {p.author}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: C.textSecondary,
                      lineHeight: 22,
                      marginBottom: 16,
                    }}
                  >
                    {p.description}
                  </Text>

                  {/* Tags */}
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 6,
                      flexWrap: "wrap",
                      marginBottom: 20,
                    }}
                  >
                    {p.tags.map((tag, i) => (
                      <View key={i} style={s.tagChip}>
                        <Text style={s.tagChipText}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Stats row — exact HomeScreen statsRow */}
                  <View style={s.statsRow}>
                    <View style={s.statCard}>
                      <Text style={s.statVal}>{p.totalRuns}</Text>
                      <Text style={s.statLabel}>TOTAL RUNS</Text>
                    </View>
                    <View style={s.statCard}>
                      <Text
                        style={[
                          s.statVal,
                          {
                            color: p.totalRuns > 0 ? successColor : C.textMuted,
                          },
                        ]}
                      >
                        {p.totalRuns > 0 ? `${p.successRate}%` : "—"}
                      </Text>
                      <Text style={s.statLabel}>SUCCESS</Text>
                    </View>
                    <View style={s.statCard}>
                      <Text style={s.statVal}>{p.estimatedTime}</Text>
                      <Text style={s.statLabel}>EST. TIME</Text>
                    </View>
                  </View>

                  {/* Steps — blockLabelPill + runCard list */}
                  <View style={{ marginBottom: 20 }}>
                    <View style={s.sheetSectionHeader}>
                      <View style={s.blockLabelPill}>
                        <Text style={s.blockLabelText}>PROTOCOL STEPS</Text>
                      </View>
                      <Text style={{ fontSize: 11, color: C.textMuted }}>
                        {p.steps.length} steps
                      </Text>
                    </View>

                    {p.steps.map((step, i) => {
                      const isDone =
                        p.status === "running" && i < activeStepIdx;
                      const isActive =
                        p.status === "running" && i === activeStepIdx;
                      return (
                        <View
                          key={i}
                          style={[s.stepCard, isActive && s.stepCardActive]}
                        >
                          {/* Rank bubble — exact HomeScreen */}
                          <View
                            style={[
                              s.rankBubble,
                              isDone && { backgroundColor: C.green },
                              isActive && { backgroundColor: C.blue },
                            ]}
                          >
                            {isDone ? (
                              <HugeiconsIcon
                                icon={CheckmarkCircle02Icon}
                                size={14}
                                color={C.white}
                              />
                            ) : (
                              <Text style={s.rankText}>{step.order}</Text>
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                s.stepTitle,
                                isActive && { color: C.blue },
                              ]}
                            >
                              {step.title}
                              {isActive ? "  ·  active" : ""}
                            </Text>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 6,
                                marginTop: 4,
                              }}
                            >
                              <HugeiconsIcon
                                icon={Clock01Icon}
                                size={10}
                                color={C.textMuted}
                              />
                              <Text
                                style={{ fontSize: 11, color: C.textMuted }}
                              >
                                {step.duration}
                              </Text>
                              {step.temp && (
                                <>
                                  <Text
                                    style={{ color: C.textMuted, fontSize: 11 }}
                                  >
                                    ·
                                  </Text>
                                  <Text
                                    style={[
                                      { fontSize: 11, fontWeight: "600" },
                                      step.temp >= 90
                                        ? { color: C.red }
                                        : step.temp >= 60
                                          ? { color: C.amber }
                                          : step.temp <= 10
                                            ? { color: C.blue }
                                            : { color: C.textMuted },
                                    ]}
                                  >
                                    {step.temp}°C
                                  </Text>
                                </>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* Action buttons — sheetCTA pattern */}
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    {p.status === "running" ? (
                      <>
                        <Pressable
                          style={[s.sheetBtnSecondary, { flex: 1 }]}
                          onPress={() => handleCancelRun(p)}
                        >
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            size={15}
                            color={C.red}
                          />
                          <Text
                            style={[s.sheetBtnSecondaryText, { color: C.red }]}
                          >
                            Cancel Run
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[s.sheetBtnPrimary, { flex: 1 }]}
                          onPress={() => {
                            quickViewRef.current?.dismiss();
                            router.push({
                              pathname: "/(routes)/experiments",
                              params: { id: p.id },
                            } as any);
                          }}
                        >
                          <HugeiconsIcon
                            icon={ArrowRight01Icon}
                            size={15}
                            color={C.white}
                          />
                          <Text style={s.sheetBtnPrimaryText}>
                            View Live Run
                          </Text>
                        </Pressable>
                      </>
                    ) : p.status === "archived" ? (
                      <Pressable style={[s.sheetBtnSecondary, { flex: 1 }]}>
                        <HugeiconsIcon
                          icon={Archive01Icon}
                          size={15}
                          color={C.textPrimary}
                        />
                        <Text style={s.sheetBtnSecondaryText}>
                          Restore Protocol
                        </Text>
                      </Pressable>
                    ) : (
                      <>
                        <Pressable
                          style={[s.sheetBtnSecondary, { flex: 1 }]}
                          onPress={() => handleStartRun(p)}
                        >
                          <HugeiconsIcon
                            icon={ReloadIcon}
                            size={15}
                            color={C.textPrimary}
                          />
                          <Text style={s.sheetBtnSecondaryText}>
                            {p.status === "draft" ? "Edit Draft" : "Rerun"}
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[s.sheetBtnPrimary, { flex: 1 }]}
                          onPress={() => {
                            quickViewRef.current?.dismiss();
                            router.push({
                              pathname: "/(routes)/experiments",
                              params: { id: p.id },
                            });
                          }}
                        >
                          <HugeiconsIcon
                            icon={SparklesIcon}
                            size={15}
                            color={C.white}
                          />
                          <Text style={s.sheetBtnPrimaryText}>
                            Open Details
                          </Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </>
              );
            })()}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* ══════════════════════════════════════════════
          FILTER SHEET
      ══════════════════════════════════════════════ */}
      <BottomSheetModal
        ref={filterRef}
        snapPoints={filterSnap}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={s.sheetHandle}
        backgroundStyle={s.sheetBg}
        enablePanDownToClose
      >
        <BottomSheetScrollView contentContainerStyle={s.sheetContent}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 24,
            }}
          >
            <View>
              <Text style={s.sheetGreeting}>REFINE</Text>
              <Text style={s.sheetTitle}>Filter & Sort</Text>
            </View>
            {activeFilterCount > 0 && (
              <Pressable onPress={clearFilters} style={s.clearBtn}>
                <Text style={s.clearBtnText}>Clear all</Text>
              </Pressable>
            )}
          </View>

          {/* Assay type */}
          <Text style={s.filterSectionLabel}>ASSAY TYPE</Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 24,
            }}
          >
            {ASSAY_TYPES.map((t) => {
              const sel = selectedTypes.includes(t);
              const tc = TYPE_CONFIG[t];
              return (
                <Pressable
                  key={t}
                  style={[s.filterChip, sel && { backgroundColor: tc.fg }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleType(t);
                  }}
                >
                  <Text style={[s.filterChipText, sel && { color: C.white }]}>
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Status */}
          <Text style={s.filterSectionLabel}>STATUS</Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 24,
            }}
          >
            {STATUS_FILTERS.map((sf) => {
              const sel = selectedStatus === sf.value;
              return (
                <Pressable
                  key={sf.value}
                  style={[s.filterChip, sel && { backgroundColor: C.black }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedStatus(sf.value);
                  }}
                >
                  <Text style={[s.filterChipText, sel && { color: C.white }]}>
                    {sf.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Sort — runCard-style rows */}
          <Text style={s.filterSectionLabel}>SORT BY</Text>
          <View style={{ gap: 10, marginBottom: 28 }}>
            {SORT_OPTIONS.map((so) => {
              const sel = sortBy === so.value;
              return (
                <Pressable
                  key={so.value}
                  style={[s.sortRow, sel && { backgroundColor: C.black }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSortBy(so.value);
                  }}
                >
                  <HugeiconsIcon
                    icon={SortingAZ01Icon}
                    size={16}
                    color={sel ? C.white : C.textMuted}
                  />
                  <Text style={[s.sortRowText, sel && { color: C.white }]}>
                    {so.label}
                  </Text>
                  {sel && (
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      size={16}
                      color={C.white}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Apply — sheetCTA */}
          <Pressable
            style={s.sheetCTA}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              filterRef.current?.dismiss();
            }}
          >
            <Text style={s.sheetCTAText}>
              Apply{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* ══════════════════════════════════════════════
          CONTEXT ACTIONS SHEET
      ══════════════════════════════════════════════ */}
      <BottomSheetModal
        ref={actionRef}
        snapPoints={actionSnap}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={s.sheetHandle}
        backgroundStyle={s.sheetBg}
        enablePanDownToClose
      >
        <BottomSheetScrollView
          contentContainerStyle={[s.sheetContent, { paddingTop: 4 }]}
        >
          {actionProtocol &&
            (() => {
              const p = actionProtocol;
              const typeCfg = TYPE_CONFIG[p.type] ?? TYPE_CONFIG.PCR;
              const statusCfg = STATUS_CFG[p.status];
              return (
                <>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: C.textPrimary,
                      marginBottom: 6,
                    }}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <View style={[s.typePill, { backgroundColor: typeCfg.bg }]}>
                      <Text style={[s.typePillText, { color: typeCfg.fg }]}>
                        {p.type}
                      </Text>
                    </View>
                    <View style={s.statusRow}>
                      <View
                        style={[
                          s.statusDot,
                          { backgroundColor: statusCfg.dot },
                        ]}
                      />
                      <Text style={[s.statusLabel, { color: statusCfg.dot }]}>
                        {statusCfg.label}
                      </Text>
                    </View>
                  </View>

                  {/* Action rows — runCard style */}
                  <View style={{ gap: 4 }}>
                    {p.status !== "running" && p.status !== "archived" && (
                      <Pressable
                        style={({ pressed }) => [
                          s.actionRow,
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => handleStartRun(p)}
                      >
                        <View
                          style={[
                            s.actionIconWrap,
                            { backgroundColor: C.blue + "18" },
                          ]}
                        >
                          <HugeiconsIcon
                            icon={PlayIcon}
                            size={16}
                            color={C.blue}
                          />
                        </View>
                        <Text style={s.actionLabel}>
                          {p.totalRuns > 0 ? "Rerun Protocol" : "Start Run"}
                        </Text>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          size={14}
                          color={C.textMuted}
                        />
                      </Pressable>
                    )}
                    {p.status === "running" && (
                      <Pressable
                        style={({ pressed }) => [
                          s.actionRow,
                          pressed && { opacity: 0.7 },
                        ]}
                        onPress={() => {
                          actionRef.current?.dismiss();
                          Alert.alert("Cancel Running Protocol?", "", [
                            { text: "Keep Running", style: "cancel" },
                            { text: "Cancel Run", style: "destructive" },
                          ]);
                        }}
                      >
                        <View
                          style={[
                            s.actionIconWrap,
                            { backgroundColor: C.red + "12" },
                          ]}
                        >
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            size={16}
                            color={C.red}
                          />
                        </View>
                        <Text style={[s.actionLabel, { color: C.red }]}>
                          Cancel Running Protocol
                        </Text>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          size={14}
                          color={C.textMuted}
                        />
                      </Pressable>
                    )}
                    <Pressable
                      style={({ pressed }) => [
                        s.actionRow,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => {
                        actionRef.current?.dismiss();
                        setTimeout(() => openQuickView(p), 200);
                      }}
                    >
                      <View
                        style={[s.actionIconWrap, { backgroundColor: C.card }]}
                      >
                        <HugeiconsIcon
                          icon={SparklesIcon}
                          size={16}
                          color={C.textPrimary}
                        />
                      </View>
                      <Text style={s.actionLabel}>Quick View Details</Text>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={14}
                        color={C.textMuted}
                      />
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        s.actionRow,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => handleDuplicate(p)}
                    >
                      <View
                        style={[
                          s.actionIconWrap,
                          { backgroundColor: C.green + "18" },
                        ]}
                      >
                        <HugeiconsIcon
                          icon={Copy01Icon}
                          size={16}
                          color={C.green}
                        />
                      </View>
                      <Text style={s.actionLabel}>Duplicate Protocol</Text>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={14}
                        color={C.textMuted}
                      />
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        s.actionRow,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => {
                        actionRef.current?.dismiss();
                      }}
                    >
                      <View
                        style={[
                          s.actionIconWrap,
                          { backgroundColor: C.amber + "18" },
                        ]}
                      >
                        <HugeiconsIcon
                          icon={Mic02Icon}
                          size={16}
                          color={C.amber}
                        />
                      </View>
                      <Text style={s.actionLabel}>Run in Voice Mode</Text>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={14}
                        color={C.textMuted}
                      />
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        s.actionRow,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        actionRef.current?.dismiss();
                      }}
                    >
                      <View
                        style={[s.actionIconWrap, { backgroundColor: C.card }]}
                      >
                        <HugeiconsIcon
                          icon={Archive01Icon}
                          size={16}
                          color={C.textMuted}
                        />
                      </View>
                      <Text style={s.actionLabel}>
                        {p.status === "archived"
                          ? "Restore from Archive"
                          : "Archive Protocol"}
                      </Text>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={14}
                        color={C.textMuted}
                      />
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        s.actionRow,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => handleDelete(p)}
                    >
                      <View
                        style={[
                          s.actionIconWrap,
                          { backgroundColor: C.red + "12" },
                        ]}
                      >
                        <HugeiconsIcon
                          icon={Delete02Icon}
                          size={16}
                          color={C.red}
                        />
                      </View>
                      <Text style={[s.actionLabel, { color: C.red }]}>
                        Delete Protocol
                      </Text>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={14}
                        color={C.textMuted}
                      />
                    </Pressable>
                  </View>
                </>
              );
            })()}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
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
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  headerBtnText: { fontSize: 14, fontWeight: "700", color: C.white },

  // Search
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: C.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.textPrimary, padding: 0 },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.amber,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: { fontSize: 8, fontWeight: "800", color: C.white },

  // Active chips
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  activeChipText: { fontSize: 12, fontWeight: "600", color: C.black },

  // Count row
  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  countText: { fontSize: 12, color: C.textMuted, fontWeight: "600" },
  sortPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.card,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sortPillText: { fontSize: 11, color: C.textMuted, fontWeight: "600" },

  // Protocol card — white with card radius
  card: {
    backgroundColor: C.bg,
    borderRadius: 24,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#1a1a2e",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  cardRunning: { borderWidth: 1.5, borderColor: C.blue + "40" },
  runStrip: { height: 3, backgroundColor: C.blue + "20", width: "100%" },
  runFill: { height: "100%", backgroundColor: C.blue, borderRadius: 2 },
  cardInner: { padding: 20, gap: 10 },
  cardName: {
    fontSize: 16,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  cardDesc: { fontSize: 13, color: C.textMuted, lineHeight: 19 },

  moreBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },

  // Status dot — exact HomeScreen
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 11, fontWeight: "700" },

  // Type pill
  typePill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  typePillText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },

  // Tags
  tagChip: {
    backgroundColor: C.card,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tagChipText: { fontSize: 11, color: C.textSecondary },

  // Footer
  footerText: { fontSize: 12, color: C.textMuted },
  runCountChip: {
    backgroundColor: C.card,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  runCountText: { fontSize: 11, color: C.textMuted, fontWeight: "600" },
  successChip: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  successText: { fontSize: 11, fontWeight: "700" },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: C.textPrimary },
  emptyBody: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.black,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 13,
    marginTop: 4,
  },
  emptyBtnText: { fontSize: 14, fontWeight: "700", color: C.white },

  // Shared sheet
  sheetBg: { backgroundColor: C.bg, borderRadius: 32 },
  sheetHandle: { backgroundColor: C.card, width: 40 },
  sheetContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 48 },
  sheetGreeting: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.8,
  },
  sheetSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  // Stats row — exact HomeScreen
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
  },
  statVal: { fontSize: 22, fontWeight: "700", color: C.textPrimary },
  statLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: C.textMuted,
    marginTop: 4,
    letterSpacing: 1,
  },

  // Block label pill
  blockLabelPill: {
    alignSelf: "flex-start",
    backgroundColor: C.black,
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

  // Steps — runCard-style
  stepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.card,
  },
  stepCardActive: {
    backgroundColor: C.blue + "08",
    borderRadius: 14,
    paddingHorizontal: 12,
    marginHorizontal: -12,
  },
  rankBubble: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  rankText: { fontSize: 12, fontWeight: "800", color: C.white },
  stepTitle: { fontSize: 14, fontWeight: "600", color: C.textPrimary },

  // Sheet buttons
  sheetBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: C.black,
    borderRadius: 20,
    paddingVertical: 16,
  },
  sheetBtnPrimaryText: { fontSize: 15, fontWeight: "700", color: C.white },
  sheetBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: C.card,
    borderRadius: 20,
    paddingVertical: 16,
  },
  sheetBtnSecondaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: C.textPrimary,
  },

  // Filter
  filterSectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: C.card,
  },
  filterChipText: { fontSize: 13, fontWeight: "600", color: C.textPrimary },
  clearBtn: {
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  clearBtnText: { fontSize: 13, fontWeight: "600", color: C.textMuted },

  // Sort row — runCard
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  sortRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: C.textPrimary,
  },

  // Sheet CTA
  sheetCTA: {
    backgroundColor: C.black,
    borderRadius: 22,
    paddingVertical: 17,
    alignItems: "center",
  },
  sheetCTAText: { fontSize: 16, fontWeight: "700", color: C.white },

  // Action rows
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderRadius: 16,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: C.textPrimary,
  },
});
