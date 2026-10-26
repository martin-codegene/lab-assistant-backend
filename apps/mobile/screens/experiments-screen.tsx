/**
 * experiments-screen.tsx
 *
 * Experiments list screen for Lab Assistant AI.
 * Enhanced UI/UX with modern design, smooth animations, and improved interactions.
 */

import { api } from "@/lib/api";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import {
  AddCircleIcon,
  AlertCircleIcon,
  ArrowRight01Icon,
  Attachment01Icon,
  BookOpen01Icon,
  Cancel01Icon,
  ChartHistogramIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Delete02Icon,
  Edit02Icon,
  Filter,
  Flask,
  Microscope,
  MoreHorizontalIcon,
  PlayIcon,
  RefreshIcon,
  Search01Icon,
  SortingAZ01Icon,
  SparklesIcon,
  TestTube01Icon,
  Warning,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
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
  Animated,
  Dimensions,
  Platform,
  Pressable,
  RefreshControl,
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

const { width } = Dimensions.get("window");

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS - Modern color palette
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  // Base
  bg: "#ffffff",
  bgSecondary: "#fafafc",
  card: "#f5f5f7",
  cardPressed: "#e8e8ed",
  black: "#0a0a0b",
  blackSoft: "#18181b",

  // Text
  textPrimary: "#18181b",
  textSecondary: "#52525b",
  textMuted: "#a1a1aa",
  textInverse: "#ffffff",

  // Colors
  green: "#10b981",
  greenLight: "#d1fae5",
  amber: "#f59e0b",
  amberLight: "#fef3c7",
  red: "#ef4444",
  redLight: "#fee2e2",
  blue: "#3b82f6",
  blueLight: "#dbeafe",
  purple: "#8b5cf6",
  purpleLight: "#ede9fe",
  teal: "#14b8a6",
  tealLight: "#ccfbf1",
  pink: "#ec4899",
  pinkLight: "#fce7f3",
  indigo: "#6366f1",
  indigoLight: "#e0e7ff",

  // UI
  border: "#e4e4e7",
  borderLight: "#f1f1f4",
  overlay: "rgba(0, 0, 0, 0.3)",
  highlight: "rgba(59, 130, 246, 0.1)",

  // Gradients (simulated with solid colors)
  gradientStart: "#fafafc",
  gradientEnd: "#ffffff",
  white: "#fff",
};

// ─────────────────────────────────────────────────────────────────────────────
// SHADOWS - More refined
// ─────────────────────────────────────────────────────────────────────────────
const SHADOW_SM = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  android: { elevation: 2 },
}) as any;

const SHADOW_MD = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
}) as any;

const SHADOW_LG = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
  },
  android: { elevation: 8 },
}) as any;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
type ExperimentStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
type SortOption = "recent" | "title" | "status";

interface Experiment {
  id: string;
  title: string;
  description: string;
  status: ExperimentStatus;
  protocolName: string;
  protocolType?: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  notes: string;
  success: boolean | null;
  conclusion: string | null;
  operator: string;
  attachmentCount?: number;
  analysisCount?: number;
  issueCount?: number;
  tags?: string[];
  variables?: { name: string; value: string | number; unit?: string }[];
  results?: {
    metric: string;
    value: string | number;
    unit?: string;
    flag?: "ok" | "warn" | "fail";
  }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSFORM (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function transformApiExperiment(apiExperiment: any): Experiment {
  return {
    id: apiExperiment.id,
    title: apiExperiment.title,
    description: apiExperiment.description || "",
    status: apiExperiment.status,
    protocolName: apiExperiment.protocol?.name || "Unknown Protocol",
    protocolType: apiExperiment.protocol?.type || undefined,
    startDate: apiExperiment.startDate
      ? new Date(apiExperiment.startDate).toLocaleDateString()
      : null,
    endDate: apiExperiment.endDate
      ? new Date(apiExperiment.endDate).toLocaleDateString()
      : null,
    createdAt: new Date(apiExperiment.createdAt).toLocaleDateString(),
    notes: apiExperiment.notes || "",
    success: apiExperiment.success ?? null,
    conclusion: apiExperiment.conclusion || null,
    operator:
      apiExperiment.createdBy?.name ||
      apiExperiment.createdBy?.email ||
      "Unknown",
    attachmentCount:
      apiExperiment._count?.attachments ??
      apiExperiment.attachments?.length ??
      0,
    analysisCount:
      apiExperiment._count?.analyses ?? apiExperiment.analyses?.length ?? 0,
    issueCount:
      apiExperiment._count?.issues ?? apiExperiment.issues?.length ?? 0,
    tags: Array.isArray(apiExperiment.tags) ? apiExperiment.tags : [],
    variables: Array.isArray(apiExperiment.variables)
      ? apiExperiment.variables
      : apiExperiment.variables && typeof apiExperiment.variables === "object"
        ? Object.entries(apiExperiment.variables).map(([name, value]: any) => ({
            name,
            value,
          }))
        : [],
    results: Array.isArray(apiExperiment.results) ? apiExperiment.results : [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG - Enhanced with gradients
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<
  ExperimentStatus,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    accent: string;
    icon: any;
  }
> = {
  DRAFT: {
    label: "Draft",
    color: C.textMuted,
    bg: C.card,
    border: C.border,
    accent: "#d4d4d8",
    icon: Edit02Icon,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: C.blue,
    bg: C.blueLight,
    border: "#93c5fd",
    accent: C.blue,
    icon: PlayIcon,
  },
  COMPLETED: {
    label: "Completed",
    color: C.green,
    bg: C.greenLight,
    border: "#a7f3d0",
    accent: C.green,
    icon: CheckmarkCircle02Icon,
  },
  FAILED: {
    label: "Failed",
    color: C.red,
    bg: C.redLight,
    border: "#fecaca",
    accent: C.red,
    icon: AlertCircleIcon,
  },
};

const PROTOCOL_TYPE_CFG: Record<
  string,
  { color: string; bg: string; border: string; icon: any }
> = {
  PCR: { color: C.purple, bg: C.purpleLight, border: "#c4b5fd", icon: Flask },
  Gel: {
    color: C.blue,
    bg: C.blueLight,
    border: "#93c5fd",
    icon: TestTube01Icon,
  },
  Western: {
    color: C.amber,
    bg: C.amberLight,
    border: "#fcd34d",
    icon: Microscope,
  },
  ELISA: {
    color: C.green,
    bg: C.greenLight,
    border: "#a7f3d0",
    icon: SparklesIcon,
  },
  qPCR: {
    color: C.teal,
    bg: C.tealLight,
    border: "#99f6e4",
    icon: ChartHistogramIcon,
  },
  Flow: { color: C.pink, bg: C.pinkLight, border: "#fbcfe8", icon: Filter },
};

// ─────────────────────────────────────────────────────────────────────────────
// FILTER CONFIG (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const ALL_STATUSES: ExperimentStatus[] = [
  "DRAFT",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Most Recent" },
  { value: "title", label: "Title A–Z" },
  { value: "status", label: "By Status" },
];

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─────────────────────────────────────────────────────────────────────────────
// ATOMS - Enhanced
// ─────────────────────────────────────────────────────────────────────────────
function LabelPill({
  label,
  color = C.black,
}: {
  label: string;
  color?: string;
}) {
  return (
    <View style={[s.labelPill, { backgroundColor: color }]}>
      <Text style={s.labelPillText}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={s.divider} />;
}

function StatusBadge({ status }: { status: ExperimentStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <View
      style={[s.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
    >
      <HugeiconsIcon icon={cfg.icon} size={10} color={cfg.color} />
      <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function TypeBadge({ type }: { type: string }) {
  const cfg = PROTOCOL_TYPE_CFG[type] ?? {
    color: C.textMuted,
    bg: C.card,
    border: C.border,
    icon: Flask,
  };
  return (
    <View
      style={[s.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
    >
      <HugeiconsIcon icon={cfg.icon} size={10} color={cfg.color} />
      <Text style={[s.badgeText, { color: cfg.color }]}>{type}</Text>
    </View>
  );
}

function SuccessBadge({ success }: { success: boolean | null }) {
  if (success === null) return null;
  const cfg = success
    ? {
        label: "Success",
        color: C.green,
        bg: C.greenLight,
        border: "#a7f3d0",
        icon: CheckmarkCircle02Icon,
      }
    : {
        label: "Issues",
        color: C.amber,
        bg: C.amberLight,
        border: "#fcd34d",
        icon: Warning,
      };
  return (
    <View
      style={[s.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
    >
      <HugeiconsIcon icon={cfg.icon} size={10} color={cfg.color} />
      <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function MetaChip({
  icon,
  label,
  color = C.textMuted,
  bg = C.card,
  count,
}: {
  icon: any;
  label: string;
  color?: string;
  bg?: string;
  count?: number;
}) {
  return (
    <View style={[s.metaChip, { backgroundColor: bg }]}>
      <HugeiconsIcon icon={icon} size={12} color={color} />
      <Text style={[s.metaChipText, { color }]}>
        {count !== undefined ? `${count} ${label}` : label}
      </Text>
    </View>
  );
}

function StatCard({ value, label, color, bg, border }: any) {
  return (
    <View style={[s.statCard, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={[s.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPERIMENT CARD - Redesigned
// ─────────────────────────────────────────────────────────────────────────────
function ExperimentCard({
  experiment,
  onPress,
  onActionPress,
  index,
}: {
  experiment: Experiment;
  onPress: () => void;
  onActionPress: () => void;
  index: number;
}) {
  const cfg = STATUS_CFG[experiment.status];
  const typeCfg = experiment.protocolType
    ? (PROTOCOL_TYPE_CFG[experiment.protocolType] ?? {
        color: C.textMuted,
        bg: C.card,
        border: C.border,
        icon: Flask,
      })
    : null;

  const hasConclusion =
    !!experiment.conclusion &&
    (experiment.status === "COMPLETED" || experiment.status === "FAILED");

  const dateLabel = experiment.startDate
    ? experiment.startDate
    : experiment.createdAt;

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  return (
    <AnimatedPressable
      style={[s.card, SHADOW_MD, { transform: [{ scale: scaleAnim }] }]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Gradient top bar */}
      <View style={[s.cardAccent, { backgroundColor: cfg.accent }]} />

      <View style={s.cardInner}>
        {/* Header with badges and menu */}
        <View style={s.cardHeader}>
          <View style={s.badgeGroup}>
            {typeCfg && experiment.protocolType && (
              <TypeBadge type={experiment.protocolType} />
            )}
            <StatusBadge status={experiment.status} />
          </View>

          <Pressable
            style={({ pressed }) => [
              s.menuButton,
              pressed && s.menuButtonPressed,
            ]}
            onPress={onActionPress}
            hitSlop={12}
          >
            <HugeiconsIcon
              icon={MoreHorizontalIcon}
              size={18}
              color={C.textSecondary}
            />
          </Pressable>
        </View>

        {/* Title */}
        <Text style={s.cardTitle} numberOfLines={2}>
          {experiment.title}
        </Text>

        {/* Protocol with icon */}
        <View style={s.protocolRow}>
          <View
            style={[s.protocolIcon, { backgroundColor: typeCfg?.bg || C.card }]}
          >
            <HugeiconsIcon
              icon={typeCfg?.icon || BookOpen01Icon}
              size={12}
              color={typeCfg?.color || C.textMuted}
            />
          </View>
          <Text style={s.protocolText} numberOfLines={1}>
            {experiment.protocolName}
          </Text>
        </View>

        {/* Description (if any) */}
        {!!experiment.description && (
          <Text style={s.cardDescription} numberOfLines={2}>
            {experiment.description}
          </Text>
        )}

        {/* Tags */}
        {(experiment.tags?.length ?? 0) > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.tagContainer}
          >
            {experiment.tags!.map((tag, i) => (
              <View key={i} style={s.tag}>
                <Text style={s.tagText}>#{tag}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Conclusion preview */}
        {hasConclusion && (
          <View
            style={[
              s.conclusionPreview,
              {
                backgroundColor:
                  experiment.success === false
                    ? C.redLight
                    : experiment.success
                      ? C.greenLight
                      : C.card,
                borderColor:
                  experiment.success === false
                    ? C.redBorder
                    : experiment.success
                      ? C.greenBorder
                      : C.border,
              },
            ]}
          >
            <HugeiconsIcon
              icon={
                experiment.success === false ? Warning : CheckmarkCircle02Icon
              }
              size={14}
              color={
                experiment.success === false
                  ? C.red
                  : experiment.success
                    ? C.green
                    : C.textMuted
              }
            />
            <Text
              style={[
                s.conclusionPreviewText,
                {
                  color:
                    experiment.success === false
                      ? C.red
                      : experiment.success
                        ? C.green
                        : C.textMuted,
                },
              ]}
              numberOfLines={1}
            >
              {experiment.conclusion}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={s.cardFooter}>
          <View style={s.footerLeft}>
            <HugeiconsIcon icon={Clock01Icon} size={12} color={C.textMuted} />
            <Text style={s.footerDate}>{dateLabel}</Text>
            {experiment.status === "IN_PROGRESS" && (
              <View style={s.liveIndicator}>
                <View style={s.liveDot} />
                <Text style={s.liveText}>Live</Text>
              </View>
            )}
          </View>

          <View style={s.footerRight}>
            {(experiment.analysisCount ?? 0) > 0 && (
              <View style={[s.footerChip, { backgroundColor: C.purpleLight }]}>
                <HugeiconsIcon icon={SparklesIcon} size={10} color={C.purple} />
                <Text style={[s.footerChipText, { color: C.purple }]}>
                  {experiment.analysisCount}
                </Text>
              </View>
            )}
            {(experiment.attachmentCount ?? 0) > 0 && (
              <View style={[s.footerChip, { backgroundColor: C.blueLight }]}>
                <HugeiconsIcon
                  icon={Attachment01Icon}
                  size={10}
                  color={C.blue}
                />
                <Text style={[s.footerChipText, { color: C.blue }]}>
                  {experiment.attachmentCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK VIEW SHEET CONTENT - Enhanced
// ─────────────────────────────────────────────────────────────────────────────
function QuickViewContent({
  exp,
  onClose,
  onViewDetails,
  onContinue,
  onComplete,
}: {
  exp: Experiment;
  onClose: () => void;
  onViewDetails: (e: Experiment) => void;
  onContinue: (e: Experiment) => void;
  onComplete: (e: Experiment) => void;
}) {
  const cfg = STATUS_CFG[exp.status];
  const typeCfg = exp.protocolType
    ? (PROTOCOL_TYPE_CFG[exp.protocolType] ?? {
        color: C.purple,
        bg: C.purpleLight,
        border: C.purpleBorder,
        icon: Flask,
      })
    : { color: C.purple, bg: C.purpleLight, border: "#c4b5fd", icon: Flask };

  const FLAG_CFG = {
    ok: { color: C.green, bg: C.greenLight },
    warn: { color: C.amber, bg: C.amberLight },
    fail: { color: C.red, bg: C.redLight },
  };

  return (
    <>
      {/* Header */}
      <View style={s.qvHeader}>
        <View style={s.qvBadgeGroup}>
          {exp.protocolType && <TypeBadge type={exp.protocolType} />}
          <StatusBadge status={exp.status} />
          {exp.status === "COMPLETED" && <SuccessBadge success={exp.success} />}
        </View>
        <Pressable style={s.qvCloseButton} onPress={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} size={18} color={C.textMuted} />
        </Pressable>
      </View>

      {/* Title and author */}
      <View style={s.qvTitleSection}>
        <Text style={s.qvTitle}>{exp.title}</Text>
        <Text style={s.qvAuthor}>by {exp.operator}</Text>
      </View>

      {/* Protocol card */}
      <View
        style={[
          s.qvProtocolCard,
          {
            backgroundColor: typeCfg.bg,
            borderColor: typeCfg.border,
          },
        ]}
      >
        <HugeiconsIcon icon={typeCfg.icon} size={16} color={typeCfg.color} />
        <Text style={[s.qvProtocolText, { color: typeCfg.color }]}>
          {exp.protocolName}
        </Text>
      </View>

      {/* Description */}
      {!!exp.description && (
        <View style={s.qvDescriptionBox}>
          <Text style={s.qvDescription}>{exp.description}</Text>
        </View>
      )}

      {/* Stats grid */}
      <View style={s.statsGrid}>
        <View style={[s.statItem, { backgroundColor: C.purpleLight }]}>
          <Text style={[s.statItemValue, { color: C.purple }]}>
            {exp.analysisCount ?? 0}
          </Text>
          <Text style={[s.statItemLabel, { color: C.purple }]}>
            AI Analyses
          </Text>
        </View>
        <View
          style={[
            s.statItem,
            {
              backgroundColor:
                (exp.issueCount ?? 0) > 0 ? C.redLight : C.greenLight,
            },
          ]}
        >
          <Text
            style={[
              s.statItemValue,
              { color: (exp.issueCount ?? 0) > 0 ? C.red : C.green },
            ]}
          >
            {exp.issueCount ?? 0}
          </Text>
          <Text
            style={[
              s.statItemLabel,
              { color: (exp.issueCount ?? 0) > 0 ? C.red : C.green },
            ]}
          >
            Issues
          </Text>
        </View>
        <View style={[s.statItem, { backgroundColor: C.blueLight }]}>
          <Text style={[s.statItemValue, { color: C.blue }]}>
            {exp.attachmentCount ?? 0}
          </Text>
          <Text style={[s.statItemLabel, { color: C.blue }]}>Files</Text>
        </View>
      </View>

      {/* Timeline */}
      <View style={s.timelineCard}>
        <View style={s.timelineItem}>
          <View style={[s.timelineDot, { backgroundColor: C.textMuted }]} />
          <Text style={s.timelineLabel}>Created</Text>
          <Text style={s.timelineValue}>{exp.createdAt}</Text>
        </View>
        {exp.startDate && (
          <View style={s.timelineItem}>
            <View style={[s.timelineDot, { backgroundColor: C.blue }]} />
            <Text style={s.timelineLabel}>Started</Text>
            <Text style={s.timelineValue}>{exp.startDate}</Text>
          </View>
        )}
        {exp.endDate && (
          <View style={s.timelineItem}>
            <View style={[s.timelineDot, { backgroundColor: C.green }]} />
            <Text style={s.timelineLabel}>Ended</Text>
            <Text style={s.timelineValue}>{exp.endDate}</Text>
          </View>
        )}
      </View>

      {/* Variables */}
      {(exp.variables?.length ?? 0) > 0 && (
        <View style={s.qvSection}>
          <LabelPill label="VARIABLES" color={C.black} />
          <View style={s.variableGrid}>
            {exp.variables!.map((v, i) => (
              <View key={i} style={[s.variableCard, SHADOW_SM]}>
                <Text style={s.variableName}>{v.name}</Text>
                <Text style={s.variableValue}>
                  {String(v.value)}
                  {v.unit ? ` ${v.unit}` : ""}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Results */}
      {(exp.results?.length ?? 0) > 0 && (
        <View style={s.qvSection}>
          <LabelPill label="RESULTS" color={C.black} />
          {exp.results!.map((r, i) => {
            const fc = r.flag
              ? FLAG_CFG[r.flag]
              : { color: C.textPrimary, bg: C.card };
            return (
              <View key={i} style={s.resultRow}>
                <Text style={s.resultMetric}>{r.metric}</Text>
                <View style={[s.resultChip, { backgroundColor: fc.bg }]}>
                  <Text style={[s.resultValue, { color: fc.color }]}>
                    {String(r.value)}
                    {r.unit ? ` ${r.unit}` : ""}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Notes */}
      {!!exp.notes && (
        <View style={s.qvSection}>
          <LabelPill label="NOTES" color={C.black} />
          <View style={s.notesCard}>
            <Text style={s.notesText}>{exp.notes}</Text>
          </View>
        </View>
      )}

      {/* Conclusion */}
      {!!exp.conclusion && (
        <View style={s.qvSection}>
          <LabelPill label="CONCLUSION" color={C.black} />
          <View
            style={[
              s.conclusionCard,
              {
                backgroundColor:
                  exp.success === false
                    ? C.redLight
                    : exp.success
                      ? C.greenLight
                      : C.card,
                borderLeftColor:
                  exp.success === false
                    ? C.red
                    : exp.success
                      ? C.green
                      : C.textMuted,
              },
            ]}
          >
            <Text
              style={[
                s.conclusionCardText,
                {
                  color:
                    exp.success === false
                      ? C.red
                      : exp.success
                        ? C.green
                        : C.textPrimary,
                },
              ]}
            >
              {exp.conclusion}
            </Text>
          </View>
        </View>
      )}

      {/* Action buttons */}
      <View style={s.qvActionButtons}>
        {exp.status === "IN_PROGRESS" ? (
          <>
            <Pressable
              style={({ pressed }) => [
                s.secondaryButton,
                pressed && s.buttonPressed,
              ]}
              onPress={() => onComplete(exp)}
            >
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                size={18}
                color={C.textPrimary}
              />
              <Text style={s.secondaryButtonText}>Complete</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                s.primaryButton,
                pressed && s.buttonPressed,
                SHADOW_MD,
              ]}
              onPress={() => onViewDetails(exp)}
            >
              <HugeiconsIcon icon={SparklesIcon} size={18} color={C.white} />
              <Text style={s.primaryButtonText}>View Details</Text>
            </Pressable>
          </>
        ) : exp.status === "DRAFT" ? (
          <>
            <Pressable
              style={({ pressed }) => [
                s.secondaryButton,
                pressed && s.buttonPressed,
              ]}
              onPress={() => onViewDetails(exp)}
            >
              <HugeiconsIcon
                icon={Edit02Icon}
                size={18}
                color={C.textPrimary}
              />
              <Text style={s.secondaryButtonText}>Edit</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                s.primaryButton,
                pressed && s.buttonPressed,
                SHADOW_MD,
              ]}
              onPress={() => onContinue(exp)}
            >
              <HugeiconsIcon icon={PlayIcon} size={18} color={C.white} />
              <Text style={s.primaryButtonText}>Start</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={({ pressed }) => [
              s.primaryButton,
              { flex: 1 },
              pressed && s.buttonPressed,
              SHADOW_MD,
            ]}
            onPress={() => onViewDetails(exp)}
          >
            <HugeiconsIcon icon={SparklesIcon} size={18} color={C.white} />
            <Text style={s.primaryButtonText}>View Details</Text>
          </Pressable>
        )}
      </View>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN - Enhanced UI
// ─────────────────────────────────────────────────────────────────────────────
export default function ExperimentsScreen() {
  const insets = useSafeAreaInsets();

  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedStatuses, setSelectedStatuses] = useState<ExperimentStatus[]>(
    [],
  );
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);
  const [actionExp, setActionExp] = useState<Experiment | null>(null);

  const quickViewRef = useRef<BottomSheetModal>(null);
  const filterRef = useRef<BottomSheetModal>(null);
  const actionRef = useRef<BottomSheetModal>(null);

  const qvSnap = useMemo(() => ["75%", "95%"], []);
  const filterSnap = useMemo(() => ["65%", "85%"], []);
  const actionSnap = useMemo(() => ["45%"], []);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const searchScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    loadExperiments();

    // Entrance animation
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(searchScale, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadExperiments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.listMyExperiments({ page: 1, limit: 100 });
      if (response.success && response.data) {
        setExperiments(response.data.data.map(transformApiExperiment));
      } else {
        setError(response.error || "Failed to load experiments");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load experiments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadExperiments();
    setIsRefreshing(false);
  };

  const handleQueryChange = (text: string) => {
    setRawQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.length > 0) {
      setIsSearching(true);
      searchTimer.current = setTimeout(() => {
        setQuery(text);
        setIsSearching(false);
      }, 380);
    } else {
      setQuery("");
      setIsSearching(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...experiments];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.protocolName.toLowerCase().includes(q) ||
          e.notes.toLowerCase().includes(q) ||
          e.operator.toLowerCase().includes(q) ||
          e.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (selectedStatuses.length > 0)
      list = list.filter((e) => selectedStatuses.includes(e.status));
    switch (sortBy) {
      case "title":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "status":
        list.sort((a, b) => a.status.localeCompare(b.status));
        break;
      default:
        list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
    }
    return list;
  }, [query, selectedStatuses, sortBy, experiments]);

  const activeFilterCount =
    selectedStatuses.length + (sortBy !== "recent" ? 1 : 0);

  const clearFilters = () => {
    setSelectedStatuses([]);
    setSortBy("recent");
  };

  const toggleStatus = (st: ExperimentStatus) =>
    setSelectedStatuses((p) =>
      p.includes(st) ? p.filter((x) => x !== st) : [...p, st],
    );

  const activeChips = [
    ...selectedStatuses.map((st) => ({
      key: `s:${st}`,
      label: STATUS_CFG[st].label,
      onRemove: () => setSelectedStatuses((p) => p.filter((x) => x !== st)),
    })),
    ...(sortBy !== "recent"
      ? [
          {
            key: "sort",
            label: `Sort: ${SORT_OPTIONS.find((o) => o.value === sortBy)?.label}`,
            onRemove: () => setSortBy("recent"),
          },
        ]
      : []),
  ];

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

  const openQuickView = (e: Experiment) => {
    setSelectedExp(e);
    quickViewRef.current?.present();
  };
  const openActions = (e: Experiment) => {
    setActionExp(e);
    actionRef.current?.present();
  };

  const handleViewDetails = (e: Experiment) => {
    actionRef.current?.dismiss();
    quickViewRef.current?.dismiss();
    router.push({
      pathname: "/(routes)/experiment-details",
      params: { id: e.id },
    });
  };

  const handleContinue = async (e: Experiment) => {
    actionRef.current?.dismiss();
    try {
      const response = await api.startExperiment(e.id);
      if (response.success) {
        Alert.alert("Success", "Experiment started successfully");
        await loadExperiments();
      } else {
        Alert.alert("Error", response.error || "Failed to start experiment");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to start experiment");
    }
  };

  const handleComplete = async (e: Experiment) => {
    actionRef.current?.dismiss();
    try {
      // @ts-ignore
      const response = await api.completeExperiment(e.id);
      if (response.success) {
        Alert.alert("Success", "Experiment completed successfully");
        await loadExperiments();
      } else {
        Alert.alert("Error", response.error || "Failed to complete experiment");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to complete experiment");
    }
  };

  const handleDelete = (e: Experiment) => {
    actionRef.current?.dismiss();
    Alert.alert(
      "Delete Experiment?",
      `This will permanently delete "${e.title}" and all associated data.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await api.deleteExperiment(e.id);
              if (response.success) {
                setExperiments((p) => p.filter((exp) => exp.id !== e.id));
                Alert.alert("Success", "Experiment deleted successfully");
              } else {
                Alert.alert(
                  "Error",
                  response.error || "Failed to delete experiment",
                );
              }
            } catch (err: any) {
              Alert.alert(
                "Error",
                err.message || "Failed to delete experiment",
              );
            }
          },
        },
      ],
    );
  };

  const inProgressCount = experiments.filter(
    (e) => e.status === "IN_PROGRESS",
  ).length;
  const completedCount = experiments.filter(
    (e) => e.status === "COMPLETED",
  ).length;
  const totalIssues = experiments.reduce((a, e) => a + (e.issueCount ?? 0), 0);

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={C.black}
            colors={[C.black]}
          />
        }
      >
        {/* Header Section */}
        <Animated.View style={[s.headerSection, { opacity: headerOpacity }]}>
          <View style={s.headerTop}>
            <View>
              <Text style={s.greeting}>LAB RUNS</Text>
              <Text style={s.title}>Your Experiments</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                s.newButton,
                pressed && s.newButtonPressed,
                SHADOW_MD,
              ]}
              onPress={() => router.push("/(routes)/experiment-details")}
            >
              <HugeiconsIcon icon={AddCircleIcon} size={20} color={C.white} />
              <Text style={s.newButtonText}>New</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Stats Bar */}
        {!isLoading && !error && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.statsContainer}
          >
            <StatCard
              value={experiments.length}
              label="Total"
              color={C.textPrimary}
              bg={C.bgSecondary}
              border={C.border}
            />
            <StatCard
              value={inProgressCount}
              label="Running"
              color={C.blue}
              bg={C.blueLight}
              border="#93c5fd"
            />
            <StatCard
              value={completedCount}
              label="Completed"
              color={C.green}
              bg={C.greenLight}
              border="#a7f3d0"
            />
            <StatCard
              value={totalIssues}
              label="Issues"
              color={totalIssues > 0 ? C.red : C.textMuted}
              bg={totalIssues > 0 ? C.redLight : C.bgSecondary}
              border={totalIssues > 0 ? "#fecaca" : C.border}
            />
          </ScrollView>
        )}

        {/* Search Section */}
        <Animated.View
          style={[s.searchSection, { transform: [{ scale: searchScale }] }]}
        >
          <View style={[s.searchBox, SHADOW_SM]}>
            {isSearching ? (
              <ActivityIndicator size="small" color={C.blue} />
            ) : (
              <HugeiconsIcon
                icon={Search01Icon}
                size={18}
                color={C.textMuted}
              />
            )}
            <TextInput
              style={s.searchInput}
              placeholder="Search experiments, protocols..."
              placeholderTextColor={C.textMuted}
              value={rawQuery}
              onChangeText={handleQueryChange}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {rawQuery.length > 0 && (
              <Pressable
                hitSlop={10}
                onPress={() => {
                  setRawQuery("");
                  setQuery("");
                }}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={16}
                  color={C.textMuted}
                />
              </Pressable>
            )}
          </View>

          <Pressable
            style={[
              s.filterButton,
              activeFilterCount > 0 && s.filterButtonActive,
              SHADOW_SM,
            ]}
            onPress={() => filterRef.current?.present()}
          >
            <HugeiconsIcon
              icon={Filter}
              size={18}
              color={activeFilterCount > 0 ? C.white : C.textSecondary}
            />
            {activeFilterCount > 0 && (
              <View style={s.filterBadge}>
                <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </Animated.View>

        {/* Active Filters */}
        {activeChips.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chipsContainer}
          >
            {activeChips.map((chip) => (
              <Pressable key={chip.key} style={s.chip} onPress={chip.onRemove}>
                <Text style={s.chipText}>{chip.label}</Text>
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={12}
                  color={C.textMuted}
                />
              </Pressable>
            ))}
            <Pressable style={s.clearChip} onPress={clearFilters}>
              <Text style={s.clearChipText}>Clear all</Text>
            </Pressable>
          </ScrollView>
        )}

        {/* Results Info */}
        <View style={s.resultsInfo}>
          <Text style={s.resultsCount}>
            {isLoading
              ? "Loading..."
              : `${filtered.length} experiment${filtered.length !== 1 ? "s" : ""}`}
          </Text>
          <Pressable
            style={s.sortChip}
            onPress={() => filterRef.current?.present()}
          >
            <HugeiconsIcon
              icon={SortingAZ01Icon}
              size={14}
              color={C.textMuted}
            />
            <Text style={s.sortChipText}>
              {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={s.loadingState}>
            <ActivityIndicator size="large" color={C.black} />
            <Text style={s.loadingText}>Loading your experiments...</Text>
          </View>
        ) : error ? (
          <View style={s.errorState}>
            <View style={[s.stateIcon, { backgroundColor: C.redLight }]}>
              <HugeiconsIcon icon={TestTube01Icon} size={32} color={C.red} />
            </View>
            <Text style={s.stateTitle}>Something went wrong</Text>
            <Text style={s.stateMessage}>{error}</Text>
            <Pressable
              style={[s.retryButton, SHADOW_MD]}
              onPress={loadExperiments}
            >
              <HugeiconsIcon icon={RefreshIcon} size={16} color={C.white} />
              <Text style={s.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyState}>
            <View style={[s.stateIcon, { backgroundColor: C.bgSecondary }]}>
              <HugeiconsIcon icon={Microscope} size={32} color={C.textMuted} />
            </View>
            <Text style={s.stateTitle}>No experiments found</Text>
            <Text style={s.stateMessage}>
              {query
                ? `No results for "${query}". Try different keywords.`
                : experiments.length === 0
                  ? "Create your first experiment to get started."
                  : "Adjust your filters to see more results."}
            </Text>
            {query && (
              <Pressable
                style={s.clearSearchButton}
                onPress={() => {
                  setRawQuery("");
                  setQuery("");
                }}
              >
                <Text style={s.clearSearchButtonText}>Clear Search</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={s.experimentsList}>
            {filtered.map((e, index) => (
              <ExperimentCard
                key={e.id}
                experiment={e}
                index={index}
                onPress={() => openQuickView(e)}
                onActionPress={() => openActions(e)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Quick View Sheet */}
      <BottomSheetModal
        ref={quickViewRef}
        snapPoints={qvSnap}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={s.sheetIndicator}
        backgroundStyle={s.sheetBackground}
        enablePanDownToClose
      >
        <BottomSheetScrollView
          contentContainerStyle={s.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          {selectedExp && (
            <QuickViewContent
              exp={selectedExp}
              onClose={() => quickViewRef.current?.dismiss()}
              onViewDetails={handleViewDetails}
              onContinue={handleContinue}
              onComplete={handleComplete}
            />
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Filter Sheet */}
      <BottomSheetModal
        ref={filterRef}
        snapPoints={filterSnap}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={s.sheetIndicator}
        backgroundStyle={s.sheetBackground}
        enablePanDownToClose
      >
        <BottomSheetScrollView
          contentContainerStyle={s.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.filterHeader}>
            <Text style={s.filterTitle}>Filter & Sort</Text>
            {activeFilterCount > 0 && (
              <Pressable onPress={clearFilters}>
                <Text style={s.filterClearLink}>Clear all</Text>
              </Pressable>
            )}
          </View>

          <View style={s.filterSection}>
            <Text style={s.filterSectionTitle}>Status</Text>
            <View style={s.statusGrid}>
              {ALL_STATUSES.map((st) => {
                const cfg = STATUS_CFG[st];
                const active = selectedStatuses.includes(st);
                return (
                  <Pressable
                    key={st}
                    style={[
                      s.statusChip,
                      active && {
                        backgroundColor: cfg.color,
                        borderColor: cfg.color,
                      },
                    ]}
                    onPress={() => toggleStatus(st)}
                  >
                    <HugeiconsIcon
                      icon={cfg.icon}
                      size={14}
                      color={active ? C.white : cfg.color}
                    />
                    <Text
                      style={[s.statusChipText, active && { color: C.white }]}
                    >
                      {cfg.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={s.filterSection}>
            <Text style={s.filterSectionTitle}>Sort by</Text>
            <View style={s.sortOptions}>
              {SORT_OPTIONS.map((o) => {
                const active = sortBy === o.value;
                return (
                  <Pressable
                    key={o.value}
                    style={[s.sortOption, active && s.sortOptionActive]}
                    onPress={() => setSortBy(o.value)}
                  >
                    <HugeiconsIcon
                      icon={SortingAZ01Icon}
                      size={16}
                      color={active ? C.white : C.textMuted}
                    />
                    <Text
                      style={[s.sortOptionText, active && { color: C.white }]}
                    >
                      {o.label}
                    </Text>
                    {active && (
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
          </View>

          <Pressable
            style={[s.applyButton, SHADOW_MD]}
            onPress={() => filterRef.current?.dismiss()}
          >
            <Text style={s.applyButtonText}>
              Show Results {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Action Sheet */}
      <BottomSheetModal
        ref={actionRef}
        snapPoints={actionSnap}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={s.sheetIndicator}
        backgroundStyle={s.sheetBackground}
        enablePanDownToClose
      >
        <BottomSheetScrollView
          contentContainerStyle={[s.sheetContent, s.actionSheetContent]}
          showsVerticalScrollIndicator={false}
        >
          {actionExp && (
            <>
              <View style={s.actionHeader}>
                <Text style={s.actionTitle} numberOfLines={2}>
                  {actionExp.title}
                </Text>
                <View style={s.actionBadges}>
                  {actionExp.protocolType && (
                    <TypeBadge type={actionExp.protocolType} />
                  )}
                  <StatusBadge status={actionExp.status} />
                </View>
              </View>

              <View style={s.actionList}>
                <Pressable
                  style={({ pressed }) => [
                    s.actionItem,
                    pressed && s.actionItemPressed,
                  ]}
                  onPress={() => handleViewDetails(actionExp)}
                >
                  <View
                    style={[s.actionIcon, { backgroundColor: C.purpleLight }]}
                  >
                    <HugeiconsIcon
                      icon={SparklesIcon}
                      size={18}
                      color={C.purple}
                    />
                  </View>
                  <Text style={s.actionItemText}>View Details</Text>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={16}
                    color={C.textMuted}
                  />
                </Pressable>

                {(actionExp.status === "DRAFT" ||
                  actionExp.status === "FAILED") && (
                  <Pressable
                    style={({ pressed }) => [
                      s.actionItem,
                      pressed && s.actionItemPressed,
                    ]}
                    onPress={() => handleContinue(actionExp)}
                  >
                    <View
                      style={[s.actionIcon, { backgroundColor: C.blueLight }]}
                    >
                      <HugeiconsIcon icon={PlayIcon} size={18} color={C.blue} />
                    </View>
                    <Text style={s.actionItemText}>
                      {actionExp.status === "DRAFT"
                        ? "Start Experiment"
                        : "Retry Experiment"}
                    </Text>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={16}
                      color={C.textMuted}
                    />
                  </Pressable>
                )}

                {actionExp.status === "IN_PROGRESS" && (
                  <Pressable
                    style={({ pressed }) => [
                      s.actionItem,
                      pressed && s.actionItemPressed,
                    ]}
                    onPress={() => handleComplete(actionExp)}
                  >
                    <View
                      style={[s.actionIcon, { backgroundColor: C.greenLight }]}
                    >
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        size={18}
                        color={C.green}
                      />
                    </View>
                    <Text style={s.actionItemText}>Complete Experiment</Text>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={16}
                      color={C.textMuted}
                    />
                  </Pressable>
                )}

                <Pressable
                  style={({ pressed }) => [
                    s.actionItem,
                    pressed && s.actionItemPressed,
                  ]}
                  onPress={() => {
                    actionRef.current?.dismiss();
                    router.push({
                      pathname: "/(routes)/experiment-details",
                      params: { id: actionExp.id, tab: "analysis" },
                    });
                  }}
                >
                  <View
                    style={[s.actionIcon, { backgroundColor: C.tealLight }]}
                  >
                    <HugeiconsIcon
                      icon={ChartHistogramIcon}
                      size={18}
                      color={C.teal}
                    />
                  </View>
                  <Text style={s.actionItemText}>Add AI Analysis</Text>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={16}
                    color={C.textMuted}
                  />
                </Pressable>

                <View style={s.actionDivider} />

                <Pressable
                  style={({ pressed }) => [
                    s.actionItem,
                    s.actionItemDestructive,
                    pressed && s.actionItemPressed,
                  ]}
                  onPress={() => handleDelete(actionExp)}
                >
                  <View style={[s.actionIcon, { backgroundColor: C.redLight }]}>
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      size={18}
                      color={C.red}
                    />
                  </View>
                  <Text style={[s.actionItemText, s.actionItemTextDestructive]}>
                    Delete Experiment
                  </Text>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={16}
                    color={C.red}
                  />
                </Pressable>
              </View>
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ENHANCED STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  scrollContent: {
    flexGrow: 1,
  },

  // Header Section
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  greeting: {
    fontSize: 14,
    color: C.textMuted,
    fontWeight: "500",
    marginBottom: 2,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: C.textPrimary,
    letterSpacing: -0.5,
  },

  newButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.black,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  newButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  newButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: C.white,
  },

  // Stats
  statsContainer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  statCard: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 90,
  },

  statValue: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
    opacity: 0.8,
  },

  // Search Section
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.bgSecondary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.border,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: C.textPrimary,
    padding: 0,
    fontWeight: "400",
  },

  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: C.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
    position: "relative",
  },

  filterButtonActive: {
    backgroundColor: C.black,
    borderColor: C.black,
  },

  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.red,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.white,
  },

  filterBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: C.white,
  },

  // Chips
  chipsContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.bgSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.border,
  },

  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textSecondary,
  },

  clearChip: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    justifyContent: "center",
  },

  clearChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: C.textMuted,
  },

  // Results Info
  resultsInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 14,
  },

  resultsCount: {
    fontSize: 14,
    color: C.textMuted,
    fontWeight: "500",
  },

  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.bgSecondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.border,
  },

  sortChipText: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: "500",
  },

  // Experiments List
  experimentsList: {
    paddingHorizontal: 16,
    gap: 12,
  },

  // Card - Redesigned
  card: {
    backgroundColor: C.bg,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
  },

  cardAccent: {
    height: 4,
    width: "100%",
  },

  cardInner: {
    padding: 18,
    gap: 12,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  badgeGroup: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    flex: 1,
  },

  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },

  menuButtonPressed: {
    backgroundColor: C.cardPressed,
    transform: [{ scale: 0.95 }],
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 24,
  },

  protocolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  protocolIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  protocolText: {
    fontSize: 13,
    fontWeight: "500",
    color: C.textSecondary,
    flex: 1,
  },

  cardDescription: {
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 20,
  },

  tagContainer: {
    flexDirection: "row",
    gap: 6,
    paddingBottom: 2,
  },

  tag: {
    backgroundColor: C.bgSecondary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.border,
  },

  tagText: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: "500",
  },

  conclusionPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },

  conclusionPreviewText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
  },

  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },

  footerDate: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: "400",
  },

  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.blueLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.blue,
  },

  liveText: {
    fontSize: 10,
    fontWeight: "700",
    color: C.blue,
  },

  footerRight: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },

  footerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  footerChipText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Badge
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.1,
  },

  // Meta Chip
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },

  metaChipText: {
    fontSize: 10,
    fontWeight: "600",
  },

  // States
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 16,
  },

  loadingText: {
    fontSize: 15,
    color: C.textMuted,
    fontWeight: "500",
  },

  errorState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 16,
    paddingHorizontal: 32,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 16,
    paddingHorizontal: 32,
  },

  stateIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  stateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.3,
  },

  stateMessage: {
    fontSize: 15,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "400",
  },

  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.black,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 8,
  },

  retryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: C.white,
  },

  clearSearchButton: {
    marginTop: 8,
  },

  clearSearchButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.blue,
  },

  // Quick View Sheet
  qvHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  qvBadgeGroup: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    flex: 1,
  },

  qvCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },

  qvTitleSection: {
    gap: 4,
    marginBottom: 16,
  },

  qvTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: C.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 30,
  },

  qvAuthor: {
    fontSize: 14,
    color: C.textMuted,
    fontWeight: "400",
  },

  qvProtocolCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 16,
  },

  qvProtocolText: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },

  qvDescriptionBox: {
    backgroundColor: C.bgSecondary,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },

  qvDescription: {
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 22,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },

  statItemValue: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  statItemLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Timeline
  timelineCard: {
    backgroundColor: C.bgSecondary,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 20,
  },

  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  timelineLabel: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: "500",
    width: 60,
  },

  timelineValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: C.textPrimary,
  },

  // Sections
  qvSection: {
    gap: 12,
    marginBottom: 20,
  },

  variableGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  variableCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: C.bgSecondary,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: C.border,
  },

  variableName: {
    fontSize: 11,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  variableValue: {
    fontSize: 16,
    fontWeight: "700",
    color: C.textPrimary,
  },

  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: C.bgSecondary,
    borderRadius: 12,
    marginBottom: 6,
  },

  resultMetric: {
    fontSize: 14,
    color: C.textSecondary,
    flex: 1,
  },

  resultChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  resultValue: {
    fontSize: 13,
    fontWeight: "700",
  },

  notesCard: {
    backgroundColor: C.bgSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },

  notesText: {
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 22,
  },

  conclusionCard: {
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
  },

  conclusionCardText: {
    fontSize: 14,
    lineHeight: 22,
  },

  // Action buttons
  qvActionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },

  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.black,
    borderRadius: 18,
    paddingVertical: 16,
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: C.white,
  },

  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.bgSecondary,
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: C.border,
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: C.textPrimary,
  },

  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  // Filter Sheet
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  filterTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.textPrimary,
    letterSpacing: -0.4,
  },

  filterClearLink: {
    fontSize: 15,
    color: C.textMuted,
    fontWeight: "500",
  },

  filterSection: {
    gap: 14,
    marginBottom: 24,
  },

  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: C.bgSecondary,
    borderWidth: 1,
    borderColor: C.border,
  },

  statusChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textPrimary,
  },

  sortOptions: {
    gap: 8,
  },

  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.bgSecondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.border,
  },

  sortOptionActive: {
    backgroundColor: C.black,
    borderColor: C.black,
  },

  sortOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: C.textPrimary,
  },

  applyButton: {
    backgroundColor: C.black,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
  },

  applyButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: C.white,
  },

  // Action Sheet
  actionSheetContent: {
    paddingTop: 8,
  },

  actionHeader: {
    gap: 8,
    marginBottom: 16,
  },

  actionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.2,
  },

  actionBadges: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },

  actionList: {
    gap: 4,
  },

  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
  },

  actionItemPressed: {
    backgroundColor: C.bgSecondary,
  },

  actionItemDestructive: {
    marginTop: 4,
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  actionItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: C.textPrimary,
  },

  actionItemTextDestructive: {
    color: C.red,
  },

  actionDivider: {
    height: 1,
    backgroundColor: C.borderLight,
    marginVertical: 8,
  },

  // Sheet Chrome
  sheetBackground: {
    backgroundColor: C.bg,
    borderRadius: 28,
  },

  sheetIndicator: {
    backgroundColor: C.border,
    width: 40,
    height: 4,
    borderRadius: 2,
  },

  sheetContent: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },

  // Atoms
  labelPill: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  labelPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 0.7,
  },

  divider: {
    height: 1,
    backgroundColor: C.borderLight,
  },
});
