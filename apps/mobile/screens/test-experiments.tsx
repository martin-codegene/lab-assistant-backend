/**
 * experiments.tsx
 *
 * Experiments list screen for Lab Assistant AI.
 *
 * Features:
 *  - Full experiment list with status, protocol, dates, attachments, issues, analyses
 *  - Debounced async search (title, description, notes, protocol name, tags)
 *  - Status filter chips + sort options in a filter bottom sheet
 *  - Active filter pills (removable)
 *  - Quick-view bottom sheet per experiment (variables, results, conclusion)
 *  - Context actions: View, Edit, Duplicate, Archive, Delete, Add Analysis
 *  - "New Experiment" FAB-style button
 *  - Empty state
 *
 * Design: white bg · #f4f4f7 cards · black accents · uppercase labels · rounded-24
 */

import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetModalProvider,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import {
    AddCircleIcon,
    AlertCircleIcon,
    Archive01Icon,
    ArrowRight01Icon,
    Attachment01Icon,
    BookOpen01Icon,
    Cancel01Icon,
    ChartHistogramIcon,
    CheckmarkCircle02Icon,
    Clock01Icon,
    Copy01Icon,
    Delete02Icon,
    Edit02Icon,
    Filter,
    Microscope,
    MoreHorizontalIcon,
    PauseCircleIcon,
    PlayIcon,
    Search01Icon,
    SortingAZ01Icon,
    SparklesIcon,
    Warning,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
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

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg: "#ffffff",
  card: "#f4f4f7",
  cardPressed: "#ededf2",
  black: "#000000",
  blackSoft: "#1c1c1e",
  textPrimary: "#1a1a1e",
  textSecondary: "#4a4a4e",
  textMuted: "#8e8e93",
  white: "#ffffff",
  green: "#24b35f",
  greenBg: "#e8f8ef",
  amber: "#ff9f0a",
  amberBg: "#fff4e0",
  red: "#ff3b30",
  redBg: "#ffeceb",
  blue: "#3b7ef6",
  blueBg: "#eef3ff",
  purple: "#7c5cfc",
  purpleBg: "#f2effe",
  teal: "#0891b2",
  tealBg: "#e0f5fb",
  indigo: "#4f46e5",
  indigoBg: "#eef2ff",
};

// ─────────────────────────────────────────────────────────────────────────────
// SHADOWS
// ─────────────────────────────────────────────────────────────────────────────
const SH_MD = Platform.select({
  ios: {
    shadowColor: "#1a1a2e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
}) as any;
const SH_SM = Platform.select({
  ios: {
    shadowColor: "#1a1a2e",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.055,
    shadowRadius: 6,
  },
  android: { elevation: 2 },
}) as any;
const SH_DARK = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
  },
  android: { elevation: 8 },
}) as any;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type ExperimentStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "ON_HOLD";

type SortOption = "newest" | "oldest" | "title" | "status" | "updated";

interface ExperimentVariable {
  name: string;
  value: string | number;
  unit?: string;
}

interface ExperimentResult {
  metric: string;
  value: string | number;
  unit?: string;
  flag?: "ok" | "warn" | "fail";
}

interface Experiment {
  id: string;
  title: string;
  description?: string;
  status: ExperimentStatus;
  protocolId: string;
  protocolName: string;
  protocolType: "PCR" | "Gel" | "Western" | "ELISA" | "qPCR" | "Flow";
  startDate?: string;
  endDate?: string;
  notes?: string;
  variables: ExperimentVariable[];
  results?: ExperimentResult[];
  conclusion?: string;
  success?: boolean;
  createdById: string;
  createdByName: string;
  labId?: string;
  labName?: string;
  createdAt: string;
  updatedAt: string;
  attachmentCount: number;
  analysisCount: number;
  issueCount: number;
  tags: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE DATA
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE_EXPERIMENTS: Experiment[] = [
  {
    id: "exp-001",
    title: "16S rRNA Amplification — Batch 7",
    description:
      "Standard bacterial identification PCR using universal primers 515F/806R on soil microbiome samples.",
    status: "IN_PROGRESS",
    protocolId: "p1",
    protocolName: "PCR Amplification — 16S rRNA",
    protocolType: "PCR",
    startDate: "2025-06-14T08:00:00Z",
    createdByName: "Dr. A. Mwila",
    labName: "Molecular Biology Lab",
    createdAt: "2025-06-14T07:45:00Z",
    updatedAt: "2025-06-14T10:42:00Z",
    attachmentCount: 3,
    analysisCount: 1,
    issueCount: 1,
    tags: ["Soil microbiome", "16S rRNA", "Batch 7"],
    variables: [
      { name: "Template concentration", value: 8.4, unit: "ng/μL" },
      { name: "Primer concentration", value: 0.4, unit: "μM" },
      { name: "Annealing temperature", value: 58, unit: "°C" },
      { name: "Cycle count", value: 35, unit: "cycles" },
    ],
    notes: "Using new Taq batch. Monitor for efficiency changes vs Batch 6.",
    createdById: "",
  },
  {
    id: "exp-002",
    title: "Agarose Gel QC — Batch 7 PCR Products",
    description:
      "Quality control gel electrophoresis to verify PCR product sizes from Batch 7 amplification.",
    status: "COMPLETED",
    protocolId: "p2",
    protocolName: "Agarose Gel Electrophoresis",
    protocolType: "Gel",
    startDate: "2025-06-13T14:00:00Z",
    endDate: "2025-06-13T15:30:00Z",
    conclusion:
      "All samples showed clean bands at 500 bp. Lane 5 had faint primer dimer at ~300 bp — acceptable.",
    success: true,
    createdByName: "M. Banda",
    labName: "Molecular Biology Lab",
    createdAt: "2025-06-13T13:45:00Z",
    updatedAt: "2025-06-13T15:45:00Z",
    attachmentCount: 2,
    analysisCount: 2,
    issueCount: 0,
    tags: ["QC", "500 bp", "TAE"],
    variables: [
      { name: "Gel percentage", value: 1, unit: "%" },
      { name: "Voltage", value: 100, unit: "V" },
      { name: "Runtime", value: 45, unit: "min" },
    ],
    results: [
      { metric: "Band size", value: "498–502", unit: "bp", flag: "ok" },
      { metric: "Band intensity", value: "Strong", flag: "ok" },
      { metric: "Smearing", value: "None detected", flag: "ok" },
      { metric: "Primer dimers", value: "Lane 5 only", flag: "warn" },
    ],
    createdById: "",
  },
  {
    id: "exp-003",
    title: "Western Blot — β-actin Loading Control",
    description:
      "Detection of β-actin housekeeping protein across HeLa, HEK293, and MCF7 cell lysates.",
    status: "FAILED",
    protocolId: "p3",
    protocolName: "Western Blot — β-actin",
    protocolType: "Western",
    startDate: "2025-06-12T09:00:00Z",
    endDate: "2025-06-12T18:30:00Z",
    conclusion:
      "High background noise across all lanes. Signal-to-noise ratio unacceptable. Antibody dilution issue suspected.",
    success: false,
    createdByName: "Dr. C. Phiri",
    labName: "Immunology Lab",
    createdAt: "2025-06-12T08:30:00Z",
    updatedAt: "2025-06-12T18:45:00Z",
    attachmentCount: 4,
    analysisCount: 1,
    issueCount: 3,
    tags: ["β-actin", "Loading control", "PVDF"],
    variables: [
      { name: "Primary Ab dilution", value: "1:1000" },
      { name: "Secondary Ab", value: "Goat Anti-Rabbit HRP" },
      { name: "Blocking agent", value: "5% BSA in TBST" },
      { name: "Exposure time", value: 120, unit: "s" },
    ],
    results: [
      { metric: "Target band (42 kDa)", value: "Faint", flag: "fail" },
      { metric: "Background", value: "High", flag: "fail" },
      { metric: "Non-specific bands", value: "Present", flag: "fail" },
    ],
    notes:
      "Re-run with 1:2000 primary Ab. Extend blocking to 1h. Consider overnight incubation at 4°C.",
    createdById: "",
  },
  {
    id: "exp-004",
    title: "TNF-α ELISA — LPS-stimulated Macrophages",
    description:
      "Quantification of TNF-α secretion from LPS-stimulated RAW264.7 macrophages at 4h and 24h timepoints.",
    status: "COMPLETED",
    protocolId: "p4",
    protocolName: "TNF-α Sandwich ELISA",
    protocolType: "ELISA",
    startDate: "2025-06-11T08:00:00Z",
    endDate: "2025-06-11T14:00:00Z",
    conclusion:
      "Significant TNF-α upregulation at both timepoints vs untreated controls. Samples 3 and 7 exceeded detection range — require 1:4 re-dilution.",
    success: true,
    createdByName: "Dr. A. Mwila",
    labName: "Immunology Lab",
    createdAt: "2025-06-11T07:30:00Z",
    updatedAt: "2025-06-11T15:00:00Z",
    attachmentCount: 1,
    analysisCount: 3,
    issueCount: 1,
    tags: ["TNF-α", "Macrophage", "LPS", "Cytokine"],
    variables: [
      { name: "Cell line", value: "RAW264.7" },
      { name: "LPS concentration", value: 100, unit: "ng/mL" },
      { name: "Timepoints", value: "4h, 24h" },
      { name: "Replicates", value: 3, unit: "n" },
    ],
    results: [
      { metric: "4h TNF-α mean", value: 342, unit: "pg/mL", flag: "ok" },
      { metric: "24h TNF-α mean", value: 1180, unit: "pg/mL", flag: "ok" },
      { metric: "Standard curve R²", value: 0.998, flag: "ok" },
      { metric: "Out-of-range wells", value: 2, flag: "warn" },
    ],
    createdById: "",
  },
  {
    id: "exp-005",
    title: "IL-6 qPCR Expression Profile",
    description:
      "Relative quantification of IL-6 mRNA expression in LPS-treated vs untreated cells, normalised to GAPDH.",
    status: "PLANNED",
    protocolId: "p5",
    protocolName: "qPCR — IL-6 Expression",
    protocolType: "qPCR",
    createdByName: "M. Banda",
    labName: "Molecular Biology Lab",
    createdAt: "2025-06-14T11:00:00Z",
    updatedAt: "2025-06-14T11:00:00Z",
    attachmentCount: 0,
    analysisCount: 0,
    issueCount: 0,
    tags: ["IL-6", "GAPDH", "LPS response"],
    variables: [
      { name: "Target gene", value: "IL-6" },
      { name: "Reference gene", value: "GAPDH" },
      { name: "Method", value: "SYBR Green" },
      { name: "Samples", value: 12, unit: "n" },
    ],
    createdById: "",
  },
  {
    id: "exp-006",
    title: "T-cell Immunophenotyping — PBMC Donors",
    description:
      "Multi-colour flow cytometry panel to characterise CD4/CD8 T-cell subsets and Treg populations in PBMC samples from 5 donors.",
    status: "ON_HOLD",
    protocolId: "p6",
    protocolName: "Flow Cytometry — T-cell Panel",
    protocolType: "Flow",
    startDate: "2025-06-09T09:00:00Z",
    createdByName: "Dr. C. Phiri",
    labName: "Immunology Lab",
    createdAt: "2025-06-09T08:00:00Z",
    updatedAt: "2025-06-10T14:20:00Z",
    attachmentCount: 2,
    analysisCount: 1,
    issueCount: 2,
    tags: ["T-cell", "PBMC", "Treg", "5-colour"],
    variables: [
      { name: "Donors", value: 5, unit: "n" },
      { name: "Panel", value: "CD3/4/8/25/FoxP3" },
      { name: "Instrument", value: "BD FACSCanto II" },
      { name: "Events per sample", value: 25000, unit: "events" },
    ],
    notes: "On hold — waiting for fresh PBMC isolations from donor cohort 2.",
    createdById: "",
  },
  {
    id: "exp-007",
    title: "RT-PCR Viral Load — Patient Cohort A",
    description:
      "One-step RT-PCR for quantification of RNA viral load from 24 nasopharyngeal swab samples.",
    status: "CANCELLED",
    protocolId: "p7",
    protocolName: "RT-PCR Viral Load",
    protocolType: "PCR",
    startDate: "2025-05-28T09:00:00Z",
    endDate: "2025-05-28T13:00:00Z",
    conclusion:
      "Cancelled due to sample quality issues — RNA degradation confirmed by A260/A280 < 1.6.",
    success: false,
    createdByName: "Dr. A. Mwila",
    labName: "Virology Lab",
    createdAt: "2025-05-27T16:00:00Z",
    updatedAt: "2025-05-28T13:30:00Z",
    attachmentCount: 1,
    analysisCount: 0,
    issueCount: 2,
    tags: ["Viral load", "RNA", "Nasopharyngeal"],
    variables: [
      { name: "Sample type", value: "Nasopharyngeal swab" },
      { name: "Sample count", value: 24, unit: "n" },
      { name: "RNA extraction", value: "TRIzol" },
    ],
    createdById: "",
  },
  {
    id: "exp-008",
    title: "2% Gel Verification — Short Fragment Panel",
    description:
      "High-resolution gel to confirm sizes of synthetic oligo controls (50–300 bp range).",
    status: "COMPLETED",
    protocolId: "p8",
    protocolName: "2% Gel — Small Fragments",
    protocolType: "Gel",
    startDate: "2025-06-08T10:00:00Z",
    endDate: "2025-06-08T11:30:00Z",
    conclusion:
      "All controls at expected sizes. Resolution excellent at 2%. Proceed with sample panel.",
    success: true,
    createdByName: "M. Banda",
    labName: "Molecular Biology Lab",
    createdAt: "2025-06-08T09:45:00Z",
    updatedAt: "2025-06-08T11:45:00Z",
    attachmentCount: 1,
    analysisCount: 1,
    issueCount: 0,
    tags: ["2%", "QC", "Oligo controls"],
    variables: [
      { name: "Gel percentage", value: 2, unit: "%" },
      { name: "Voltage", value: 90, unit: "V" },
      { name: "Runtime", value: 60, unit: "min" },
    ],
    results: [
      { metric: "50 bp control", value: "Confirmed", flag: "ok" },
      { metric: "150 bp control", value: "Confirmed", flag: "ok" },
      { metric: "300 bp control", value: "Confirmed", flag: "ok" },
    ],
    createdById: "",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<
  ExperimentStatus,
  {
    label: string;
    color: string;
    bg: string;
    icon: any;
  }
> = {
  PLANNED: { label: "Planned", color: C.blue, bg: C.blueBg, icon: Clock01Icon },
  IN_PROGRESS: {
    label: "In Progress",
    color: C.amber,
    bg: C.amberBg,
    icon: PlayIcon,
  },
  COMPLETED: {
    label: "Completed",
    color: C.green,
    bg: C.greenBg,
    icon: CheckmarkCircle02Icon,
  },
  FAILED: { label: "Failed", color: C.red, bg: C.redBg, icon: Cancel01Icon },
  CANCELLED: {
    label: "Cancelled",
    color: C.textMuted,
    bg: C.card,
    icon: Cancel01Icon,
  },
  ON_HOLD: {
    label: "On Hold",
    color: C.purple,
    bg: C.purpleBg,
    icon: PauseCircleIcon,
  },
};

const PROTOCOL_TYPE_CFG: Record<string, { color: string; bg: string }> = {
  PCR: { color: C.purple, bg: C.purpleBg },
  Gel: { color: C.blue, bg: C.blueBg },
  Western: { color: C.amber, bg: C.amberBg },
  ELISA: { color: C.green, bg: C.greenBg },
  qPCR: { color: C.teal, bg: C.tealBg },
  Flow: { color: C.red, bg: C.redBg },
};

// ─────────────────────────────────────────────────────────────────────────────
// FILTER / SORT CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const ALL_STATUSES: ExperimentStatus[] = [
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "ON_HOLD",
];
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "title", label: "Title A–Z" },
  { value: "status", label: "By Status" },
  { value: "updated", label: "Last Updated" },
];
const ALL_TYPES = ["PCR", "Gel", "Western", "ELISA", "qPCR", "Flow"];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function durationLabel(start?: string, end?: string) {
  if (!start) return null;
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const diffH = (e.getTime() - s.getTime()) / 3_600_000;
  if (diffH < 1) return `${Math.round(diffH * 60)}m`;
  if (diffH < 24) return `${diffH.toFixed(1)}h`;
  return `${Math.floor(diffH / 24)}d`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ATOMS
// ─────────────────────────────────────────────────────────────────────────────
function BlackPill({ label }: { label: string }) {
  return (
    <View style={st.blackPill}>
      <Text style={st.blackPillText}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={st.divider} />;
}

function StatusPill({ status }: { status: ExperimentStatus }) {
  const cfg = STATUS_CFG[status];
  const isRunning = status === "IN_PROGRESS";
  return (
    <View style={[st.statusPill, { backgroundColor: cfg.bg }]}>
      {isRunning && (
        <View style={[st.statusPulse, { backgroundColor: cfg.color }]} />
      )}
      <Text style={[st.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function TypePill({ type }: { type: string }) {
  const cfg = PROTOCOL_TYPE_CFG[type] ?? { color: C.textMuted, bg: C.card };
  return (
    <View style={[st.typePill, { backgroundColor: cfg.bg }]}>
      <Text style={[st.typePillText, { color: cfg.color }]}>{type}</Text>
    </View>
  );
}

function MetaChip({
  icon,
  label,
  color = C.textMuted,
  bg = C.card,
}: {
  icon: any;
  label: string | number;
  color?: string;
  bg?: string;
}) {
  return (
    <View style={[st.metaChip, { backgroundColor: bg }]}>
      <HugeiconsIcon icon={icon} size={11} color={color} />
      <Text style={[st.metaChipText, { color }]}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPERIMENT CARD
// ─────────────────────────────────────────────────────────────────────────────
function ExperimentCard({
  exp,
  onPress,
  onActionPress,
}: {
  exp: Experiment;
  onPress: () => void;
  onActionPress: () => void;
}) {
  const cfg = STATUS_CFG[exp.status];
  const duration = durationLabel(exp.startDate, exp.endDate);
  const typeCfg = PROTOCOL_TYPE_CFG[exp.protocolType] ?? {
    color: C.textMuted,
    bg: C.card,
  };

  return (
    <Pressable
      style={({ pressed }) => [st.expCard, SH_SM, pressed && st.expCardPressed]}
      onPress={onPress}
    >
      {/* Status accent bar on left edge */}
      <View style={[st.accentBar, { backgroundColor: cfg.color }]} />

      <View style={st.cardBody}>
        {/* Top row: pills + more button */}
        <View style={st.cardTopRow}>
          <View style={st.cardPills}>
            <TypePill type={exp.protocolType} />
            <StatusPill status={exp.status} />
          </View>
          <Pressable style={st.moreBtn} onPress={onActionPress} hitSlop={8}>
            <HugeiconsIcon
              icon={MoreHorizontalIcon}
              size={15}
              color={C.textMuted}
            />
          </Pressable>
        </View>

        {/* Title */}
        <Text style={st.cardTitle} numberOfLines={2}>
          {exp.title}
        </Text>

        {/* Description */}
        {exp.description && (
          <Text style={st.cardDesc} numberOfLines={2}>
            {exp.description}
          </Text>
        )}

        {/* Protocol name */}
        <View style={st.cardProtocolRow}>
          <HugeiconsIcon
            icon={BookOpen01Icon}
            size={11}
            color={typeCfg.color}
          />
          <Text
            style={[st.cardProtocolText, { color: typeCfg.color }]}
            numberOfLines={1}
          >
            {exp.protocolName}
          </Text>
        </View>

        {/* Tags */}
        {exp.tags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={st.tagScroll}
            contentContainerStyle={st.tagRow}
          >
            {exp.tags.map((tag, i) => (
              <View key={i} style={st.tagChip}>
                <Text style={st.tagChipText}>{tag}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Footer */}
        <View style={st.cardFooter}>
          <View style={st.cardFooterLeft}>
            {/* Meta chips */}
            {exp.analysisCount > 0 && (
              <MetaChip
                icon={SparklesIcon}
                label={`${exp.analysisCount} AI`}
                color={C.purple}
                bg={C.purpleBg}
              />
            )}
            {exp.issueCount > 0 && (
              <MetaChip
                icon={AlertCircleIcon}
                label={exp.issueCount}
                color={C.red}
                bg={C.redBg}
              />
            )}
            {exp.attachmentCount > 0 && (
              <MetaChip icon={Attachment01Icon} label={exp.attachmentCount} />
            )}
          </View>

          <View style={st.cardFooterRight}>
            {duration && (
              <View style={st.durationChip}>
                <HugeiconsIcon
                  icon={Clock01Icon}
                  size={10}
                  color={C.textMuted}
                />
                <Text style={st.durationText}>{duration}</Text>
              </View>
            )}
            <Text style={st.cardDate}>{formatDate(exp.updatedAt)}</Text>
          </View>
        </View>

        {/* Conclusion strip (completed / failed only) */}
        {exp.conclusion &&
          (exp.status === "COMPLETED" ||
            exp.status === "FAILED" ||
            exp.status === "CANCELLED") && (
            <View
              style={[
                st.conclusionStrip,
                {
                  backgroundColor:
                    exp.success === false
                      ? C.redBg
                      : exp.success
                        ? C.greenBg
                        : C.card,
                },
              ]}
            >
              <HugeiconsIcon
                icon={
                  exp.success === false
                    ? Warning
                    : exp.success
                      ? CheckmarkCircle02Icon
                      : AlertCircleIcon
                }
                size={12}
                color={
                  exp.success === false
                    ? C.red
                    : exp.success
                      ? C.green
                      : C.textMuted
                }
              />
              <Text
                style={[
                  st.conclusionText,
                  {
                    color:
                      exp.success === false
                        ? C.red
                        : exp.success
                          ? C.green
                          : C.textMuted,
                  },
                ]}
                numberOfLines={1}
              >
                {exp.conclusion}
              </Text>
            </View>
          )}
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK VIEW SHEET CONTENT
// ─────────────────────────────────────────────────────────────────────────────
function QuickViewContent({
  exp,
  onClose,
}: {
  exp: Experiment;
  onClose: () => void;
}) {
  const cfg = STATUS_CFG[exp.status];
  const typeCfg = PROTOCOL_TYPE_CFG[exp.protocolType] ?? {
    color: C.textMuted,
    bg: C.card,
  };
  const duration = durationLabel(exp.startDate, exp.endDate);

  const FLAG_CFG = {
    ok: { color: C.green, bg: C.greenBg },
    warn: { color: C.amber, bg: C.amberBg },
    fail: { color: C.red, bg: C.redBg },
  };

  return (
    <>
      {/* Header */}
      <View style={st.qvHeaderRow}>
        <View style={st.qvPills}>
          <TypePill type={exp.protocolType} />
          <StatusPill status={exp.status} />
        </View>
        <Pressable style={st.sheetCloseBtn} onPress={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} size={14} color={C.textMuted} />
        </Pressable>
      </View>

      <Text style={st.qvTitle}>{exp.title}</Text>
      <Text style={st.qvAuthor}>
        {exp.createdByName}
        {exp.labName ? `  ·  ${exp.labName}` : ""}
      </Text>

      {exp.description && <Text style={st.qvDesc}>{exp.description}</Text>}

      {/* Stats strip */}
      <View style={[st.statsStrip, SH_SM]}>
        {[
          {
            label: "ANALYSES",
            value: exp.analysisCount.toString(),
            color: C.purple,
          },
          {
            label: "ISSUES",
            value: exp.issueCount.toString(),
            color: exp.issueCount > 0 ? C.red : C.green,
          },
          {
            label: "ATTACHMENTS",
            value: exp.attachmentCount.toString(),
            color: C.blue,
          },
          ...(duration
            ? [{ label: "DURATION", value: duration, color: C.teal }]
            : []),
        ].map((s, i, arr) => (
          <React.Fragment key={i}>
            <View style={st.statStripItem}>
              <Text style={[st.statStripValue, { color: s.color }]}>
                {s.value}
              </Text>
              <Text style={st.statStripLabel}>{s.label}</Text>
            </View>
            {i < arr.length - 1 && <View style={st.statDivider} />}
          </React.Fragment>
        ))}
      </View>

      {/* Dates */}
      <View style={[st.datesCard, SH_SM]}>
        {[
          { label: "Created", value: formatDate(exp.createdAt) },
          { label: "Last updated", value: formatDate(exp.updatedAt) },
          ...(exp.startDate
            ? [{ label: "Started", value: formatDate(exp.startDate) }]
            : []),
          ...(exp.endDate
            ? [{ label: "Ended", value: formatDate(exp.endDate) }]
            : []),
          { label: "Protocol", value: exp.protocolName },
        ].map((row, i, arr) => (
          <React.Fragment key={i}>
            <View style={st.dateRow}>
              <Text style={st.dateLabel}>{row.label}</Text>
              <Text style={st.dateValue} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
            {i < arr.length - 1 && <View style={st.tinyDivider} />}
          </React.Fragment>
        ))}
      </View>

      {/* Variables */}
      {exp.variables.length > 0 && (
        <View style={st.blockSection}>
          <BlackPill label="VARIABLES" />
          <View style={st.varGrid}>
            {exp.variables.map((v, i) => (
              <View key={i} style={[st.varCell, SH_SM]}>
                <Text style={st.varName}>{v.name}</Text>
                <Text style={st.varValue}>
                  {v.value}
                  {v.unit ? ` ${v.unit}` : ""}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Results */}
      {exp.results && exp.results.length > 0 && (
        <View style={st.blockSection}>
          <BlackPill label="RESULTS" />
          {exp.results.map((r, i) => {
            const fc = r.flag
              ? FLAG_CFG[r.flag]
              : { color: C.textMuted, bg: C.card };
            return (
              <View
                key={i}
                style={[
                  st.resultRow,
                  i % 2 === 1 && { backgroundColor: C.card },
                ]}
              >
                <Text style={st.resultMetric}>{r.metric}</Text>
                <View style={[st.resultValueChip, { backgroundColor: fc.bg }]}>
                  <Text style={[st.resultValue, { color: fc.color }]}>
                    {r.value}
                    {r.unit ? ` ${r.unit}` : ""}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Conclusion */}
      {exp.conclusion && (
        <View style={st.blockSection}>
          <BlackPill label="CONCLUSION" />
          <View
            style={[
              st.conclusionBlock,
              {
                backgroundColor:
                  exp.success === false
                    ? C.redBg
                    : exp.success
                      ? C.greenBg
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
                st.conclusionBlockText,
                {
                  color:
                    exp.success === false
                      ? C.red
                      : exp.success
                        ? C.green
                        : C.textSecondary,
                },
              ]}
            >
              {exp.conclusion}
            </Text>
          </View>
        </View>
      )}

      {/* Notes */}
      {exp.notes && (
        <View style={st.blockSection}>
          <BlackPill label="NOTES" />
          <View style={[st.notesBlock]}>
            <Text style={st.notesText}>{exp.notes}</Text>
          </View>
        </View>
      )}

      {/* CTA */}
      <Pressable
        style={({ pressed }) => [
          st.qvCTA,
          SH_DARK,
          pressed && { opacity: 0.85 },
        ]}
      >
        <HugeiconsIcon icon={SparklesIcon} size={15} color={C.white} />
        <Text style={st.qvCTAText}>Open Full Experiment</Text>
      </Pressable>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION SHEET CONTENT
// ─────────────────────────────────────────────────────────────────────────────
function ActionSheetContent({
  exp,
  onClose,
}: {
  exp: Experiment;
  onClose: () => void;
}) {
  const ACTIONS = [
    {
      icon: Edit02Icon,
      iconColor: C.blue,
      iconBg: C.blueBg,
      label: "Edit Experiment",
      danger: false,
    },
    {
      icon: SparklesIcon,
      iconColor: C.purple,
      iconBg: C.purpleBg,
      label: "Add AI Analysis",
      danger: false,
    },
    {
      icon: ChartHistogramIcon,
      iconColor: C.teal,
      iconBg: C.tealBg,
      label: "View Results",
      danger: false,
    },
    {
      icon: Copy01Icon,
      iconColor: C.green,
      iconBg: C.greenBg,
      label: "Duplicate Experiment",
      danger: false,
    },
    {
      icon: Archive01Icon,
      iconColor: C.textMuted,
      iconBg: C.card,
      label: "Archive",
      danger: false,
    },
    {
      icon: Delete02Icon,
      iconColor: C.red,
      iconBg: C.redBg,
      label: "Delete Experiment",
      danger: true,
    },
  ];

  return (
    <>
      <Text style={st.actionSheetTitle} numberOfLines={2}>
        {exp.title}
      </Text>
      <View style={st.actionSheetPills}>
        <TypePill type={exp.protocolType} />
        <StatusPill status={exp.status} />
      </View>
      <Divider />
      <View style={st.actionList}>
        {ACTIONS.map((a, i) => (
          <Pressable
            key={i}
            style={({ pressed }) => [st.actionRow, pressed && { opacity: 0.7 }]}
            onPress={() => {
              if (a.danger) {
                Alert.alert(
                  "Delete Experiment?",
                  `"${exp.title}" and all associated analyses, issues and attachments will be permanently deleted.`,
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: onClose },
                  ],
                );
              } else {
                onClose();
              }
            }}
          >
            <View style={[st.actionIcon, { backgroundColor: a.iconBg }]}>
              <HugeiconsIcon icon={a.icon} size={16} color={a.iconColor} />
            </View>
            <Text style={[st.actionLabel, a.danger && { color: C.red }]}>
              {a.label}
            </Text>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={13}
              color={C.textMuted}
            />
          </Pressable>
        ))}
      </View>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER SHEET CONTENT
// ─────────────────────────────────────────────────────────────────────────────
function FilterSheetContent({
  selectedStatuses,
  setSelectedStatuses,
  selectedTypes,
  setSelectedTypes,
  sortBy,
  setSortBy,
  onApply,
  onClear,
  activeCount,
}: {
  selectedStatuses: ExperimentStatus[];
  setSelectedStatuses: React.Dispatch<React.SetStateAction<ExperimentStatus[]>>;
  selectedTypes: string[];
  setSelectedTypes: React.Dispatch<React.SetStateAction<string[]>>;
  sortBy: SortOption;
  setSortBy: (v: SortOption) => void;
  onApply: () => void;
  onClear: () => void;
  activeCount: number;
}) {
  const toggleStatus = (s: ExperimentStatus) =>
    setSelectedStatuses((p) =>
      p.includes(s) ? p.filter((x) => x !== s) : [...p, s],
    );

  const toggleType = (t: string) =>
    setSelectedTypes((p) =>
      p.includes(t) ? p.filter((x) => x !== t) : [...p, t],
    );

  return (
    <>
      <View style={st.filterHeaderRow}>
        <Text style={st.filterTitle}>Filter & Sort</Text>
        {activeCount > 0 && (
          <Pressable onPress={onClear}>
            <Text style={st.clearAllLink}>Clear all</Text>
          </Pressable>
        )}
      </View>

      {/* Status */}
      <View style={st.filterSection}>
        <BlackPill label="STATUS" />
        <View style={st.filterChips}>
          {ALL_STATUSES.map((s) => {
            const cfg = STATUS_CFG[s];
            const active = selectedStatuses.includes(s);
            return (
              <Pressable
                key={s}
                style={[
                  st.filterChip,
                  active && { backgroundColor: cfg.color },
                ]}
                onPress={() => toggleStatus(s)}
              >
                <Text style={[st.filterChipText, active && { color: C.white }]}>
                  {cfg.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Assay type */}
      <View style={st.filterSection}>
        <BlackPill label="ASSAY TYPE" />
        <View style={st.filterChips}>
          {ALL_TYPES.map((t) => {
            const cfg = PROTOCOL_TYPE_CFG[t];
            const active = selectedTypes.includes(t);
            return (
              <Pressable
                key={t}
                style={[
                  st.filterChip,
                  active && { backgroundColor: cfg.color },
                ]}
                onPress={() => toggleType(t)}
              >
                <Text style={[st.filterChipText, active && { color: C.white }]}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Sort */}
      <View style={st.filterSection}>
        <BlackPill label="SORT BY" />
        <View style={st.sortOptions}>
          {SORT_OPTIONS.map((s) => (
            <Pressable
              key={s.value}
              style={[st.sortOption, sortBy === s.value && st.sortOptionActive]}
              onPress={() => setSortBy(s.value)}
            >
              <HugeiconsIcon
                icon={SortingAZ01Icon}
                size={14}
                color={sortBy === s.value ? C.white : C.textMuted}
              />
              <Text
                style={[
                  st.sortOptionText,
                  sortBy === s.value && { color: C.white },
                ]}
              >
                {s.label}
              </Text>
              {sortBy === s.value && (
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={14}
                  color={C.white}
                />
              )}
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable style={[st.applyBtn, SH_DARK]} onPress={onApply}>
        <Text style={st.applyBtnText}>
          Apply{activeCount > 0 ? ` (${activeCount})` : ""}
        </Text>
      </Pressable>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function ExperimentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Search
  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filters
  const [selectedStatuses, setSelectedStatuses] = useState<ExperimentStatus[]>(
    [],
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Sheet state
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);
  const [actionExp, setActionExp] = useState<Experiment | null>(null);

  const quickViewRef = useRef<BottomSheetModal>(null);
  const actionRef = useRef<BottomSheetModal>(null);
  const filterRef = useRef<BottomSheetModal>(null);

  const qvSnap = useMemo(() => ["75%", "95%"], []);
  const actionSnap = useMemo(() => ["45%"], []);
  const filterSnap = useMemo(() => ["65%", "88%"], []);

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

  // Debounced search
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

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = [...SAMPLE_EXPERIMENTS];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.notes?.toLowerCase().includes(q) ||
          e.protocolName.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)) ||
          e.createdByName.toLowerCase().includes(q) ||
          e.labName?.toLowerCase().includes(q),
      );
    }

    if (selectedStatuses.length > 0)
      list = list.filter((e) => selectedStatuses.includes(e.status));

    if (selectedTypes.length > 0)
      list = list.filter((e) => selectedTypes.includes(e.protocolType));

    switch (sortBy) {
      case "oldest":
        list.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case "title":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "status":
        list.sort((a, b) => a.status.localeCompare(b.status));
        break;
      case "updated":
        list.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
        break;
      default:
        list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
    }

    return list;
  }, [query, selectedStatuses, selectedTypes, sortBy]);

  const activeFilterCount =
    selectedStatuses.length +
    selectedTypes.length +
    (sortBy !== "newest" ? 1 : 0);

  const clearFilters = () => {
    setSelectedStatuses([]);
    setSelectedTypes([]);
    setSortBy("newest");
  };

  // Build removable chips
  const activeChips = [
    ...selectedStatuses.map((s) => ({
      key: `s:${s}`,
      label: STATUS_CFG[s].label,
      onRemove: () => setSelectedStatuses((p) => p.filter((x) => x !== s)),
    })),
    ...selectedTypes.map((t) => ({
      key: `t:${t}`,
      label: t,
      onRemove: () => setSelectedTypes((p) => p.filter((x) => x !== t)),
    })),
    ...(sortBy !== "newest"
      ? [
          {
            key: "sort",
            label: `Sort: ${SORT_OPTIONS.find((s) => s.value === sortBy)?.label}`,
            onRemove: () => setSortBy("newest"),
          },
        ]
      : []),
  ];

  // Summary counts for header
  const inProgressCount = SAMPLE_EXPERIMENTS.filter(
    (e) => e.status === "IN_PROGRESS",
  ).length;
  const completedCount = SAMPLE_EXPERIMENTS.filter(
    (e) => e.status === "COMPLETED",
  ).length;
  const issueCount = SAMPLE_EXPERIMENTS.reduce((a, e) => a + e.issueCount, 0);

  return (
    <BottomSheetModalProvider>
      <SafeAreaView style={st.root} edges={["top"]}>
        <StatusBar barStyle="dark-content" />

        {/* ── Header ── */}
        <View style={st.header}>
          <View>
            <Text style={st.superTitle}>RESEARCH</Text>
            <Text style={st.headerTitle}>Experiments</Text>
          </View>
          <Pressable style={[st.newBtn, SH_DARK]}>
            <HugeiconsIcon icon={AddCircleIcon} size={15} color={C.white} />
            <Text style={st.newBtnText}>New</Text>
          </Pressable>
        </View>

        {/* ── Summary strip ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={st.summaryScroll}
          contentContainerStyle={st.summaryRow}
        >
          {[
            {
              label: "Total",
              value: SAMPLE_EXPERIMENTS.length,
              color: C.black,
              bg: C.card,
            },
            {
              label: "In Progress",
              value: inProgressCount,
              color: C.amber,
              bg: C.amberBg,
            },
            {
              label: "Completed",
              value: completedCount,
              color: C.green,
              bg: C.greenBg,
            },
            {
              label: "Open Issues",
              value: issueCount,
              color: C.red,
              bg: C.redBg,
            },
          ].map((s, i) => (
            <View
              key={i}
              style={[st.summaryCard, SH_SM, { backgroundColor: s.bg }]}
            >
              <Text style={[st.summaryValue, { color: s.color }]}>
                {s.value}
              </Text>
              <Text style={[st.summaryLabel, { color: s.color }]}>
                {s.label}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* ── Search + filter row ── */}
        <View style={st.searchRow}>
          <View style={[st.searchBox, SH_SM]}>
            {isSearching ? (
              <ActivityIndicator
                size="small"
                color={C.textMuted}
                style={{ width: 18 }}
              />
            ) : (
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                color={C.textMuted}
              />
            )}
            <TextInput
              style={st.searchInput}
              placeholder="Search experiments, protocols, tags…"
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
          <Pressable
            style={[
              st.filterBtn,
              SH_SM,
              activeFilterCount > 0 && st.filterBtnActive,
            ]}
            onPress={() => filterRef.current?.present()}
          >
            <HugeiconsIcon
              icon={Filter}
              size={16}
              color={activeFilterCount > 0 ? C.white : C.black}
            />
            {activeFilterCount > 0 && (
              <View style={st.filterBadge}>
                <Text style={st.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── Active filter chips ── */}
        {activeChips.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={st.chipsScroll}
            contentContainerStyle={st.chipsRow}
          >
            {activeChips.map((chip) => (
              <Pressable
                key={chip.key}
                style={st.activeChip}
                onPress={chip.onRemove}
              >
                <Text style={st.activeChipText}>{chip.label}</Text>
                <HugeiconsIcon icon={Cancel01Icon} size={10} color={C.black} />
              </Pressable>
            ))}
            <Pressable style={st.clearChip} onPress={clearFilters}>
              <Text style={st.clearChipText}>Clear all</Text>
            </Pressable>
          </ScrollView>
        )}

        {/* ── Count + sort row ── */}
        <View style={st.countRow}>
          <Text style={st.countText}>
            {filtered.length} experiment{filtered.length !== 1 ? "s" : ""}
            {query ? ` for "${query}"` : ""}
          </Text>
          <Pressable
            style={st.sortPill}
            onPress={() => filterRef.current?.present()}
          >
            <HugeiconsIcon
              icon={SortingAZ01Icon}
              size={11}
              color={C.textMuted}
            />
            <Text style={st.sortPillText}>
              {SORT_OPTIONS.find((s) => s.value === sortBy)?.label}
            </Text>
          </Pressable>
        </View>

        {/* ── List ── */}
        <ScrollView
          contentContainerStyle={[
            st.list,
            { paddingBottom: insets.bottom + 120 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filtered.length === 0 ? (
            <View style={st.emptyState}>
              <View style={st.emptyIcon}>
                <HugeiconsIcon
                  icon={Microscope}
                  size={30}
                  color={C.textMuted}
                />
              </View>
              <Text style={st.emptyTitle}>No experiments found</Text>
              <Text style={st.emptyBody}>
                {query
                  ? `No results for "${query}". Try different keywords.`
                  : "Adjust your filters or create your first experiment."}
              </Text>
            </View>
          ) : (
            filtered.map((exp) => (
              <ExperimentCard
                key={exp.id}
                exp={exp}
                onPress={() => {
                  setSelectedExp(exp);
                  quickViewRef.current?.present();
                }}
                onActionPress={() => {
                  setActionExp(exp);
                  actionRef.current?.present();
                }}
              />
            ))
          )}
        </ScrollView>

        {/* ══════════════════════════════════════════════════════════════════
            QUICK VIEW SHEET
        ══════════════════════════════════════════════════════════════════ */}
        <BottomSheetModal
          ref={quickViewRef}
          snapPoints={qvSnap}
          backdropComponent={renderBackdrop}
          handleIndicatorStyle={st.sheetHandle}
          backgroundStyle={st.sheetBg}
          enablePanDownToClose
        >
          <BottomSheetScrollView contentContainerStyle={st.sheetContent}>
            {selectedExp && (
              <QuickViewContent
                exp={selectedExp}
                onClose={() => quickViewRef.current?.dismiss()}
              />
            )}
          </BottomSheetScrollView>
        </BottomSheetModal>

        {/* ══════════════════════════════════════════════════════════════════
            ACTION SHEET
        ══════════════════════════════════════════════════════════════════ */}
        <BottomSheetModal
          ref={actionRef}
          snapPoints={actionSnap}
          backdropComponent={renderBackdrop}
          handleIndicatorStyle={st.sheetHandle}
          backgroundStyle={st.sheetBg}
          enablePanDownToClose
        >
          <BottomSheetScrollView contentContainerStyle={st.sheetContent}>
            {actionExp && (
              <ActionSheetContent
                exp={actionExp}
                onClose={() => actionRef.current?.dismiss()}
              />
            )}
          </BottomSheetScrollView>
        </BottomSheetModal>

        {/* ══════════════════════════════════════════════════════════════════
            FILTER SHEET
        ══════════════════════════════════════════════════════════════════ */}
        <BottomSheetModal
          ref={filterRef}
          snapPoints={filterSnap}
          backdropComponent={renderBackdrop}
          handleIndicatorStyle={st.sheetHandle}
          backgroundStyle={st.sheetBg}
          enablePanDownToClose
        >
          <BottomSheetScrollView contentContainerStyle={st.sheetContent}>
            <FilterSheetContent
              selectedStatuses={selectedStatuses}
              setSelectedStatuses={setSelectedStatuses}
              selectedTypes={selectedTypes}
              setSelectedTypes={setSelectedTypes}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onApply={() => filterRef.current?.dismiss()}
              onClear={clearFilters}
              activeCount={activeFilterCount}
            />
          </BottomSheetScrollView>
        </BottomSheetModal>
      </SafeAreaView>
    </BottomSheetModalProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  superTitle: {
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
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.black,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  newBtnText: { fontSize: 14, fontWeight: "700", color: C.white },

  // Summary strip
  summaryScroll: { marginBottom: 12 },
  summaryRow: { paddingHorizontal: 24, flexDirection: "row", gap: 10 },
  summaryCard: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    gap: 3,
    minWidth: 80,
  },
  summaryValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  summaryLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },

  // Search row
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: C.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 14.5, color: C.textPrimary, padding: 0 },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterBtnActive: { backgroundColor: C.black },
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
  chipsScroll: { marginBottom: 8 },
  chipsRow: { paddingHorizontal: 24, flexDirection: "row", gap: 7 },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.card,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activeChipText: { fontSize: 12, fontWeight: "600", color: C.black },
  clearChip: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: "center",
  },
  clearChipText: { fontSize: 12, color: C.textMuted, fontWeight: "600" },

  // Count row
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 10,
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
  sortPillText: { fontSize: 11.5, color: C.textMuted, fontWeight: "600" },

  // List
  list: { paddingHorizontal: 20, gap: 12, paddingTop: 2 },

  // Experiment card
  expCard: {
    backgroundColor: C.bg,
    borderRadius: 24,
    flexDirection: "row",
    overflow: "hidden",
  },
  expCardPressed: { backgroundColor: C.cardPressed },
  accentBar: { width: 4, borderRadius: 0 },
  cardBody: { flex: 1, padding: 16, gap: 8 },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardPills: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  moreBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  cardDesc: { fontSize: 12.5, color: C.textMuted, lineHeight: 18 },
  cardProtocolRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardProtocolText: { fontSize: 11.5, fontWeight: "600" },
  tagScroll: { marginHorizontal: -2 },
  tagRow: { flexDirection: "row", gap: 6 },
  tagChip: {
    backgroundColor: C.card,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagChipText: { fontSize: 11, color: C.textSecondary },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  cardFooterLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardFooterRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  durationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: C.card,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: { fontSize: 10.5, color: C.textMuted, fontWeight: "600" },
  cardDate: { fontSize: 11.5, color: C.textMuted },
  conclusionStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 10,
    padding: 9,
    marginTop: 2,
  },
  conclusionText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: "500",
    lineHeight: 16,
  },

  // Meta chip
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  metaChipText: { fontSize: 11, fontWeight: "700" },

  // Pills
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPulse: { width: 5, height: 5, borderRadius: 2.5 },
  statusPillText: { fontSize: 11, fontWeight: "700" },
  typePill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  typePillText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: C.textPrimary },
  emptyBody: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 20,
  },

  // Quick view
  qvHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  qvPills: { flexDirection: "row", gap: 7 },
  qvTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 28,
    marginBottom: 4,
  },
  qvAuthor: { fontSize: 12.5, color: C.textMuted, marginBottom: 10 },
  qvDesc: {
    fontSize: 14.5,
    color: C.textSecondary,
    lineHeight: 22,
    marginBottom: 6,
  },

  // Stats strip
  statsStrip: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
  },
  statStripItem: { flex: 1, alignItems: "center", gap: 4 },
  statStripValue: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  statStripLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 0.8,
  },
  statDivider: { width: 1, height: 28, backgroundColor: "#e5e5ea" },

  // Dates card
  datesCard: {
    backgroundColor: C.bg,
    borderRadius: 18,
    padding: 14,
    gap: 0,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
  },
  dateLabel: { fontSize: 13, color: C.textMuted, flex: 1 },
  dateValue: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textPrimary,
    flex: 2,
    textAlign: "right",
  },
  tinyDivider: { height: 1, backgroundColor: C.card },

  // Block sections
  blockSection: { gap: 12 },
  varGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  varCell: {
    flex: 1,
    minWidth: "44%",
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  varName: {
    fontSize: 10.5,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 0.5,
  },
  varValue: { fontSize: 15, fontWeight: "700", color: C.textPrimary },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resultMetric: { fontSize: 13.5, color: C.textSecondary, flex: 1 },
  resultValueChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resultValue: { fontSize: 12.5, fontWeight: "700" },
  conclusionBlock: {
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
  },
  conclusionBlockText: { fontSize: 14, lineHeight: 21 },
  notesBlock: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
  },
  notesText: { fontSize: 14, color: C.textSecondary, lineHeight: 21 },

  // QV CTA
  qvCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.black,
    borderRadius: 20,
    paddingVertical: 17,
    marginTop: 6,
  },
  qvCTAText: { fontSize: 15, fontWeight: "700", color: C.white },

  // Action sheet
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  actionSheetPills: { flexDirection: "row", gap: 7, marginBottom: 14 },
  actionList: { gap: 4, marginTop: 8 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderRadius: 14,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: C.textPrimary,
  },

  // Filter sheet
  filterHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.5,
  },
  clearAllLink: { fontSize: 14, color: C.textMuted, fontWeight: "600" },
  filterSection: { gap: 12, marginBottom: 22 },
  filterChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: C.card,
  },
  filterChipText: { fontSize: 13.5, fontWeight: "600", color: C.textPrimary },
  sortOptions: { gap: 8 },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sortOptionActive: { backgroundColor: C.black },
  sortOptionText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: "600",
    color: C.textPrimary,
  },
  applyBtn: {
    backgroundColor: C.black,
    borderRadius: 20,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 4,
  },
  applyBtnText: { fontSize: 16, fontWeight: "700", color: C.white },

  // Shared sheet
  sheetBg: { backgroundColor: C.bg, borderRadius: 32 },
  sheetHandle: { backgroundColor: "#e5e5ea", width: 40 },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 52,
    gap: 18,
  },
  sheetCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },

  // Atoms
  blackPill: {
    alignSelf: "flex-start",
    backgroundColor: C.black,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  blackPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 0.8,
  },
  divider: { height: 1, backgroundColor: C.card },
});
