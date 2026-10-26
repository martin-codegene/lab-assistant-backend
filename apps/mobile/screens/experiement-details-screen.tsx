/**
 * experiment-detail.tsx
 *
 * Universal experiment detail screen for Lab Assistant AI.
 * Supports: PCR · Gel Electrophoresis · Western Blot · ELISA · Flow Cytometry · qPCR
 *
 * Usage (expo-router):  router.push({ pathname: "/experiment-detail", params: { id: run.id } })
 * Standalone demo:      Set DEMO_TYPE at the bottom to preview any assay.
 */

import {
  api,
  AssayType as ApiAssayType,
  Experiment as ApiExperiment,
} from "@/lib/api";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import {
  AlertCircleIcon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Copy01Icon,
  Download02Icon,
  Mic02Icon,
  SparklesIcon,
  TickDouble02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useLocalSearchParams } from "expo-router";
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
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg: "#f2f2f4",
  surface: "#ffffff",
  black: "#0a0a0a",
  blackSoft: "#1c1c1e",
  white: "#ffffff",
  textPrimary: "#0a0a0a",
  textSecondary: "#4a4a52",
  textMuted: "#a0a0ae",
  textOnBlack: "#ffffff",
  textOnBlackMuted: "rgba(255,255,255,0.5)",
  green: "#00b37e",
  greenBg: "#e6faf3",
  amber: "#f0a020",
  amberBg: "#fff7e6",
  red: "#e03e3e",
  redBg: "#fdeaea",
  blue: "#3b7ef6",
  blueBg: "#eef3ff",
  purple: "#7c5cfc",
  purpleBg: "#f2effe",
  teal: "#0891b2",
  tealBg: "#e0f5fb",
};

// ─────────────────────────────────────────────────────────────────────────────
// SHADOWS
// ─────────────────────────────────────────────────────────────────────────────
const SHADOW_LG = { boxShadow: "0 18px 36px rgba(10, 10, 18, 0.14)" };
const SHADOW_SM = { boxShadow: "0 6px 12px rgba(10, 10, 18, 0.1)" };
const SHADOW_DARK = { boxShadow: "0 14px 28px rgba(0, 0, 0, 0.22)" };

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type AssayType = "PCR" | "Gel" | "Western" | "ELISA" | "qPCR" | "Flow";
type RunStatus = "success" | "warning" | "failed";

interface Band {
  lane: number;
  label: string;
  expectedBp: number;
  observedBp: number | null;
  intensity: "strong" | "faint" | "absent" | "smear";
  notes?: string;
}

interface PCRCycle {
  step: string;
  temp: number;
  duration: string;
}

interface WellResult {
  well: string;
  sample: string;
  absorbance: number;
  concentration?: number;
  status: "positive" | "negative" | "invalid";
}

interface FlowPopulation {
  name: string;
  percentage: number;
  count: number;
  color: string;
}

interface ExperimentRun {
  id: string;
  protocolName: string;
  type: AssayType;
  date: string;
  operator: string;
  status: RunStatus;
  observation: string;
  causes: string[];
  nextStep: string;
  tags: string[];
  // Type-specific data
  pcrData?: {
    templateConc: number;
    primerConc: number;
    polymerase: string;
    cycles: number;
    cycleConditions: PCRCycle[];
    productSize: number;
    yield: number;
    purity: number;
  };
  gelData?: {
    gelPercent: number;
    voltage: number;
    runtime: number;
    buffer: string;
    bands: Band[];
    ladderBp: number[];
  };
  westernData?: {
    membrane: string;
    primaryAb: string;
    primaryDilution: string;
    secondaryAb: string;
    exposureTime: number;
    blockingAgent: string;
    targetMw: number;
    bands: Band[];
  };
  elisaData?: {
    plateType: string;
    coatingAg: string;
    detectionAb: string;
    substrate: string;
    readWavelength: number;
    wells: WellResult[];
    standardCurve: { conc: number; abs: number }[];
  };
  qpcrData?: {
    gene: string;
    reference: string;
    primer: string;
    efficiency: number;
    samples: {
      name: string;
      ct: number;
      deltaCt: number;
      foldChange: number;
      status: "valid" | "invalid";
    }[];
  };
  flowData?: {
    instrument: string;
    totalEvents: number;
    populations: FlowPopulation[];
    gatingStrategy: string[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_RUNS: Record<string, ExperimentRun> = {
  r1: {
    id: "r1",
    protocolName: "PCR Amplification — 16S rRNA",
    type: "PCR",
    date: "Today, 10:42 AM",
    operator: "Dr. A. Mwila",
    status: "warning",
    observation:
      "Faint bands detected at 500 bp. Possible low template concentration or suboptimal annealing temperature.",
    causes: [
      "Low DNA template concentration (< 10 ng/μL)",
      "Suboptimal annealing temperature — try ±2°C",
      "Polymerase degradation — check cold chain",
    ],
    nextStep:
      "Increase template to 50 ng/μL and run a gradient PCR at 56–64°C to determine optimal annealing temperature.",
    tags: ["16S rRNA", "Bacteria", "Gradient needed"],
    pcrData: {
      templateConc: 8.4,
      primerConc: 0.4,
      polymerase: "Taq DNA Polymerase",
      cycles: 35,
      productSize: 500,
      yield: 42.1,
      purity: 1.6,
      cycleConditions: [
        { step: "Initial Denaturation", temp: 95, duration: "3 min" },
        { step: "Denaturation", temp: 95, duration: "30 s" },
        { step: "Annealing", temp: 58, duration: "30 s" },
        { step: "Extension", temp: 72, duration: "45 s" },
        { step: "Final Extension", temp: 72, duration: "5 min" },
        { step: "Hold", temp: 4, duration: "∞" },
      ],
    },
  },

  r2: {
    id: "r2",
    protocolName: "Agarose Gel Electrophoresis",
    type: "Gel",
    date: "Yesterday, 3:15 PM",
    operator: "M. Banda",
    status: "success",
    observation:
      "Clean bands at expected sizes in lanes 1–4. No smearing observed. Lane 5 shows faint secondary band at 300 bp — likely primer dimer.",
    causes: [
      "Primer dimer in lane 5 (minor — acceptable)",
      "No critical issues detected",
    ],
    nextStep:
      "Proceed with gel extraction of target bands. Consider adding a clean-up step before downstream applications.",
    tags: ["1% Agarose", "TAE buffer", "EtBr stain"],
    gelData: {
      gelPercent: 1.0,
      voltage: 100,
      runtime: 45,
      buffer: "1× TAE",
      ladderBp: [100, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000],
      bands: [
        {
          lane: 1,
          label: "Sample A",
          expectedBp: 500,
          observedBp: 498,
          intensity: "strong",
        },
        {
          lane: 2,
          label: "Sample B",
          expectedBp: 500,
          observedBp: 502,
          intensity: "strong",
        },
        {
          lane: 3,
          label: "Sample C",
          expectedBp: 500,
          observedBp: 496,
          intensity: "strong",
        },
        {
          lane: 4,
          label: "Sample D",
          expectedBp: 500,
          observedBp: 501,
          intensity: "strong",
        },
        {
          lane: 5,
          label: "Sample E",
          expectedBp: 500,
          observedBp: 499,
          intensity: "faint",
          notes: "Secondary band at ~300 bp — primer dimer",
        },
        {
          lane: 6,
          label: "NTC",
          expectedBp: 0,
          observedBp: null,
          intensity: "absent",
          notes: "No template control — clean",
        },
      ],
    },
  },

  r3: {
    id: "r3",
    protocolName: "Western Blot — β-actin",
    type: "Western",
    date: "Jun 12, 2025",
    operator: "Dr. C. Phiri",
    status: "failed",
    observation:
      "High background noise across all lanes. Target band at 42 kDa barely visible. Signal-to-noise ratio unacceptable for publication.",
    causes: [
      "Primary antibody too concentrated — try 1:2000 dilution",
      "Insufficient blocking time — extend to 1 hour at RT",
      "Membrane dried out during incubation — keep wet throughout",
    ],
    nextStep:
      "Re-block membrane for 1 hour, dilute primary antibody to 1:2000, and incubate overnight at 4°C with gentle rocking.",
    tags: ["β-actin 42 kDa", "PVDF", "HRP-conjugated"],
    westernData: {
      membrane: "PVDF",
      primaryAb: "Anti-β-actin (ab8227)",
      primaryDilution: "1:1000",
      secondaryAb: "Goat Anti-Rabbit HRP",
      exposureTime: 120,
      blockingAgent: "5% BSA in TBST",
      targetMw: 42,
      bands: [
        {
          lane: 1,
          label: "HeLa lysate",
          expectedBp: 42,
          observedBp: 42,
          intensity: "faint",
          notes: "High background",
        },
        {
          lane: 2,
          label: "HEK293 lysate",
          expectedBp: 42,
          observedBp: 42,
          intensity: "faint",
          notes: "High background",
        },
        {
          lane: 3,
          label: "MCF7 lysate",
          expectedBp: 42,
          observedBp: 40,
          intensity: "faint",
          notes: "Slight shift",
        },
        {
          lane: 4,
          label: "Positive ctrl",
          expectedBp: 42,
          observedBp: 42,
          intensity: "strong",
        },
        {
          lane: 5,
          label: "Negative ctrl",
          expectedBp: 42,
          observedBp: null,
          intensity: "smear",
          notes: "Non-specific smearing",
        },
      ],
    },
  },

  r4: {
    id: "r4",
    protocolName: "TNF-α Sandwich ELISA",
    type: "ELISA",
    date: "Jun 11, 2025",
    operator: "Dr. A. Mwila",
    status: "success",
    observation:
      "Standard curve R² = 0.998. All samples within detection range. Samples 3 and 7 above upper limit — recommend dilution for re-run.",
    causes: [
      "Samples 3 & 7 exceed upper detection limit (OD > 2.5)",
      "Re-assay required with 1:4 dilution",
    ],
    nextStep:
      "Dilute samples 3 and 7 (1:4 in assay diluent) and re-run to obtain accurate concentrations.",
    tags: ["TNF-α", "96-well", "Colorimetric"],
    elisaData: {
      plateType: "96-well Nunc MaxiSorp",
      coatingAg: "Anti-TNF-α capture antibody",
      detectionAb: "Biotinylated anti-TNF-α",
      substrate: "TMB",
      readWavelength: 450,
      standardCurve: [
        { conc: 0, abs: 0.04 },
        { conc: 31.2, abs: 0.18 },
        { conc: 62.5, abs: 0.34 },
        { conc: 125, abs: 0.64 },
        { conc: 250, abs: 1.18 },
        { conc: 500, abs: 2.12 },
        { conc: 1000, abs: 2.89 },
      ],
      wells: [
        {
          well: "A1",
          sample: "Sample 1",
          absorbance: 0.62,
          concentration: 122,
          status: "positive",
        },
        {
          well: "B1",
          sample: "Sample 2",
          absorbance: 0.38,
          concentration: 68,
          status: "positive",
        },
        {
          well: "C1",
          sample: "Sample 3",
          absorbance: 2.71,
          concentration: undefined,
          status: "invalid",
        },
        {
          well: "D1",
          sample: "Sample 4",
          absorbance: 0.91,
          concentration: 188,
          status: "positive",
        },
        {
          well: "E1",
          sample: "Sample 5",
          absorbance: 0.14,
          concentration: 28,
          status: "positive",
        },
        {
          well: "F1",
          sample: "Sample 6",
          absorbance: 0.06,
          concentration: undefined,
          status: "negative",
        },
        {
          well: "G1",
          sample: "Sample 7",
          absorbance: 2.88,
          concentration: undefined,
          status: "invalid",
        },
        {
          well: "H1",
          sample: "Blank",
          absorbance: 0.04,
          concentration: 0,
          status: "negative",
        },
      ],
    },
  },

  qr1: {
    id: "qr1",
    protocolName: "qPCR — GAPDH Normalisation",
    type: "qPCR",
    date: "Jun 10, 2025",
    operator: "M. Banda",
    status: "success",
    observation:
      "All Ct values within acceptable range. Amplification efficiency 96.4%. GAPDH reference gene stable across all samples.",
    causes: [
      "No issues detected",
      "Amplification efficiency within ideal 90–110% range",
    ],
    nextStep:
      "Proceed with relative quantification analysis. Data suitable for publication.",
    tags: ["GAPDH", "SYBR Green", "96.4% efficiency"],
    qpcrData: {
      gene: "IL-6",
      reference: "GAPDH",
      primer: "IL6-F/R v2",
      efficiency: 96.4,
      samples: [
        {
          name: "Control 1",
          ct: 28.4,
          deltaCt: 0.0,
          foldChange: 1.0,
          status: "valid",
        },
        {
          name: "Control 2",
          ct: 28.6,
          deltaCt: 0.2,
          foldChange: 0.87,
          status: "valid",
        },
        {
          name: "Treatment A",
          ct: 25.1,
          deltaCt: -3.3,
          foldChange: 9.85,
          status: "valid",
        },
        {
          name: "Treatment B",
          ct: 24.8,
          deltaCt: -3.6,
          foldChange: 12.1,
          status: "valid",
        },
        {
          name: "Treatment C",
          ct: 26.3,
          deltaCt: -2.1,
          foldChange: 4.29,
          status: "valid",
        },
        {
          name: "NTC",
          ct: 99.0,
          deltaCt: 70.6,
          foldChange: 0.0,
          status: "invalid",
        },
      ],
    },
  },

  r6: {
    id: "r6",
    protocolName: "Flow Cytometry — T-cell Panel",
    type: "Flow",
    date: "Jun 9, 2025",
    operator: "Dr. C. Phiri",
    status: "warning",
    observation:
      "CD4+/CD8+ ratio lower than expected. Live gate shows 78% viability — acceptable. CD25+ Treg population higher than reference range.",
    causes: [
      "Extended sample processing time may affect CD4 expression",
      "CD25+ elevation may indicate active immune response",
      "Consider repeating with freshly isolated cells",
    ],
    nextStep:
      "Re-stain with freshly isolated PBMCs. Add FoxP3 intracellular staining to confirm Treg expansion.",
    tags: ["T-cell", "CD3/CD4/CD8/CD25", "PBMC"],
    flowData: {
      instrument: "BD FACSCanto II",
      totalEvents: 25000,
      gatingStrategy: [
        "Singlets",
        "Live/Dead",
        "CD3+ T-cells",
        "CD4/CD8 subset",
        "CD25+ Tregs",
      ],
      populations: [
        { name: "CD3+ T-cells", percentage: 68.2, count: 17050, color: C.blue },
        { name: "CD4+ Helper", percentage: 28.4, count: 7100, color: C.green },
        {
          name: "CD8+ Cytotoxic",
          percentage: 22.1,
          count: 5525,
          color: C.purple,
        },
        { name: "CD25+ Tregs", percentage: 8.6, count: 2150, color: C.amber },
        {
          name: "CD3- other",
          percentage: 31.8,
          count: 7950,
          color: C.textMuted,
        },
      ],
    },
  },
};

// Demo run ID — in production this comes from router params
const ALL_RUN_IDS = Object.keys(MOCK_RUNS);

// ─────────────────────────────────────────────────────────────────────────────
// API DATA TRANSFORMATION
// ─────────────────────────────────────────────────────────────────────────────

function mapApiTypeToUiType(apiType: ApiAssayType): AssayType {
  const mapping: Record<ApiAssayType, AssayType> = {
    PCR: "PCR",
    GEL: "Gel",
    WESTERN_BLOT: "Western",
    ELISA: "ELISA",
    FLOW_CYTOMETRY: "Flow",
    MICROSCOPY: "PCR",
    CELL_CULTURE: "PCR",
    PROTEIN_EXPRESSION: "Western",
    DNA_SEQUENCING: "PCR",
    OTHER: "PCR",
  };
  return mapping[apiType] || "PCR";
}

function transformExperimentToRun(experiment: ApiExperiment): ExperimentRun {
  // Determine status based on experiment status and success
  let status: RunStatus = "warning";
  if (experiment.status === "COMPLETED") {
    status = experiment.success ? "success" : "failed";
  } else if (experiment.status === "FAILED") {
    status = "failed";
  }

  // Format date
  const date = experiment.startDate
    ? new Date(experiment.startDate).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : new Date(experiment.createdAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

  // Extract tags from variables
  const tags = Object.keys(experiment.variables || {}).slice(0, 5);

  // Parse results for observations and causes
  const observation =
    experiment.notes ||
    experiment.description ||
    "Experiment in progress. No observations recorded yet.";

  const causes = experiment.conclusion
    ? [experiment.conclusion]
    : experiment.status === "IN_PROGRESS"
      ? ["Experiment currently running"]
      : ["Analysis pending"];

  const nextStep =
    experiment.status === "IN_PROGRESS"
      ? "Continue monitoring experiment progress and record observations."
      : experiment.status === "COMPLETED"
        ? experiment.success
          ? "Review results and proceed with downstream analysis."
          : "Review failure causes and plan corrective actions."
        : experiment.status === "FAILED"
          ? "Analyze failure points and restart experiment with adjustments."
          : "Review experiment setup and restart when ready.";

  // Parse type-specific data from variables and results
  const type = experiment.protocol?.category
    ? mapApiTypeToUiType(experiment.protocol.category)
    : "PCR";

  // Create base run object
  const run: ExperimentRun = {
    id: experiment.id,
    protocolName: experiment.protocol?.name || experiment.title,
    type,
    date,
    operator:
      experiment.createdBy?.name ||
      experiment.createdBy?.email ||
      "Unknown Operator",
    status,
    observation,
    causes,
    nextStep,
    tags,
  };

  // Add type-specific data if available in variables
  if (type === "PCR" && experiment.variables) {
    run.pcrData = {
      templateConc: experiment.variables.templateConc || 0,
      primerConc: experiment.variables.primerConc || 0,
      polymerase: experiment.variables.polymerase || "Taq DNA Polymerase",
      cycles: experiment.variables.cycles || 35,
      cycleConditions: experiment.variables.cycleConditions || [],
      productSize: experiment.variables.productSize || 0,
      yield: experiment.variables.yield || 0,
      purity: experiment.variables.purity || 0,
    };
  }

  return run;
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  success: { label: "Success", color: C.green, bg: C.greenBg },
  warning: { label: "Review", color: C.amber, bg: C.amberBg },
  failed: { label: "Failed", color: C.red, bg: C.redBg },
};

const ASSAY_CFG: Record<
  AssayType,
  { color: string; bg: string; label: string }
> = {
  PCR: { color: C.purple, bg: C.purpleBg, label: "PCR" },
  Gel: { color: C.blue, bg: C.blueBg, label: "Gel Electrophoresis" },
  Western: { color: C.amber, bg: C.amberBg, label: "Western Blot" },
  ELISA: { color: C.green, bg: C.greenBg, label: "ELISA" },
  qPCR: { color: C.teal, bg: C.tealBg, label: "qPCR" },
  Flow: { color: C.red, bg: C.redBg, label: "Flow Cytometry" },
};

type FocusMode = "evidence" | "interpretation" | "decision";

const INSIGHT_CFG: Record<
  RunStatus,
  {
    signal: number;
    risk: number;
    confidence: number;
    tone: string;
  }
> = {
  success: {
    signal: 0.86,
    risk: 0.18,
    confidence: 0.9,
    tone: "Signal is clean and repeatable.",
  },
  warning: {
    signal: 0.62,
    risk: 0.44,
    confidence: 0.58,
    tone: "Signal is usable, but carries uncertainty.",
  },
  failed: {
    signal: 0.28,
    risk: 0.82,
    confidence: 0.3,
    tone: "Signal is compromised; decision risk is high.",
  },
};

const FOCUS_MODES: Array<{
  key: FocusMode;
  label: string;
  icon: any;
}> = [
  { key: "evidence", label: "Evidence", icon: CheckmarkCircle02Icon },
  { key: "interpretation", label: "Interpretation", icon: SparklesIcon },
  { key: "decision", label: "Decision", icon: TickDouble02Icon },
];

function Pill({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function BlackPill({ label }: { label: string }) {
  return (
    <View style={styles.blackPill}>
      <Text style={styles.blackPillText}>{label}</Text>
    </View>
  );
}

function SectionCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return <View style={[styles.sectionCard, SHADOW_SM, style]}>{children}</View>;
}

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <BlackPill label={label} />
    </View>
  );
}

function StatCell({
  label,
  value,
  unit,
  color,
  flag,
}: {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  flag?: "ok" | "warn" | "bad";
}) {
  const flagColor =
    flag === "ok"
      ? C.green
      : flag === "warn"
        ? C.amber
        : flag === "bad"
          ? C.red
          : undefined;
  return (
    <View style={styles.statCell}>
      <Text style={styles.statCellLabel}>{label}</Text>
      <View style={styles.statCellValueRow}>
        <Text style={[styles.statCellValue, color ? { color } : {}]}>
          {value}
        </Text>
        {unit && <Text style={styles.statCellUnit}>{unit}</Text>}
        {flag && (
          <View style={[styles.flagDot, { backgroundColor: flagColor }]} />
        )}
      </View>
    </View>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaChip}>
      <Text style={styles.metaChipLabel}>{label}</Text>
      <Text style={styles.metaChipValue}>{value}</Text>
    </View>
  );
}

function MetricBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricTop}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={[styles.metricValue, { color }]}>{Math.round(pct)}%</Text>
      </View>
      <View style={styles.metricTrack}>
        <View
          style={[
            styles.metricFill,
            { width: `${pct}%` as any, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

function getSampleCount(run: ExperimentRun) {
  if (run.gelData) return run.gelData.bands.length;
  if (run.westernData) return run.westernData.bands.length;
  if (run.elisaData) return run.elisaData.wells.length;
  if (run.qpcrData) return run.qpcrData.samples.length;
  if (run.flowData) return run.flowData.populations.length;
  if (run.pcrData) return run.pcrData.cycles;
  return 0;
}

function getSampleLabel(run: ExperimentRun) {
  if (run.gelData) return "Bands";
  if (run.westernData) return "Bands";
  if (run.elisaData) return "Wells";
  if (run.qpcrData) return "Samples";
  if (run.flowData) return "Populations";
  if (run.pcrData) return "Cycles";
  return "Units";
}

function getFocusCopy(run: ExperimentRun, insight: typeof INSIGHT_CFG.success) {
  return {
    evidence: {
      title: "Evidence the instrument captured",
      body: run.observation,
    },
    interpretation: {
      title: "Most probable driver",
      body: `${run.causes[0] ?? "Signal quality shifted."} ${insight.tone}`,
    },
    decision: {
      title: "Decision-ready next step",
      body: run.nextStep,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BAND INTENSITY BAR (reused in Gel + Western)
// ─────────────────────────────────────────────────────────────────────────────
const INTENSITY_MAP = {
  strong: { fill: 1.0, color: C.green, label: "Strong" },
  faint: { fill: 0.35, color: C.amber, label: "Faint" },
  absent: { fill: 0.0, color: C.textMuted, label: "Absent" },
  smear: { fill: 0.6, color: C.red, label: "Smear" },
};

function BandRow({ band, unit = "bp" }: { band: Band; unit?: string }) {
  const im = INTENSITY_MAP[band.intensity];
  return (
    <View style={styles.bandRow}>
      {/* Lane number */}
      <View style={styles.bandLaneCircle}>
        <Text style={styles.bandLaneText}>{band.lane}</Text>
      </View>
      {/* Info */}
      <View style={styles.bandInfo}>
        <View style={styles.bandInfoTop}>
          <Text style={styles.bandLabel}>{band.label}</Text>
          <Text style={[styles.bandIntensityLabel, { color: im.color }]}>
            {im.label}
          </Text>
        </View>
        {/* Intensity bar */}
        <View style={styles.bandBarBg}>
          <View
            style={[
              styles.bandBarFill,
              { width: `${im.fill * 100}%` as any, backgroundColor: im.color },
            ]}
          />
        </View>
        <View style={styles.bandMeta}>
          <Text style={styles.bandMetaText}>
            Expected:{" "}
            <Text style={styles.bandMetaVal}>
              {band.expectedBp} {unit}
            </Text>
          </Text>
          {band.observedBp !== null && (
            <Text style={styles.bandMetaText}>
              Observed:{" "}
              <Text style={[styles.bandMetaVal, { color: im.color }]}>
                {band.observedBp} {unit}
              </Text>
            </Text>
          )}
        </View>
        {band.notes && <Text style={styles.bandNotes}>{band.notes}</Text>}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PCR DETAIL
// ─────────────────────────────────────────────────────────────────────────────
function PCRDetail({ run }: { run: ExperimentRun }) {
  const d = run.pcrData!;
  const purityFlag = d.purity >= 1.8 ? "ok" : d.purity >= 1.6 ? "warn" : "bad";
  const yieldFlag = d.yield >= 50 ? "ok" : d.yield >= 20 ? "warn" : "bad";
  return (
    <>
      {/* Key metrics */}
      <SectionCard>
        <SectionHeader label="Reaction Parameters" />
        <View style={styles.statsGrid}>
          <StatCell
            label="Template"
            value={d.templateConc}
            unit="ng/μL"
            flag={d.templateConc >= 20 ? "ok" : "warn"}
          />
          <StatCell label="Primer Conc" value={d.primerConc} unit="μM" />
          <StatCell label="Cycles" value={d.cycles} />
          <StatCell label="Product" value={d.productSize} unit="bp" />
          <StatCell
            label="Yield"
            value={d.yield}
            unit="ng/μL"
            flag={yieldFlag}
          />
          <StatCell label="A260/A280" value={d.purity} flag={purityFlag} />
        </View>
        {/* Polymerase chip */}
        <View style={styles.tagRow}>
          <View style={styles.monoChip}>
            <Text style={styles.monoChipText}>{d.polymerase}</Text>
          </View>
        </View>
      </SectionCard>

      {/* Cycling conditions */}
      <SectionCard>
        <SectionHeader label="Cycling Conditions" />
        <View style={styles.cycleTable}>
          {/* Header */}
          <View style={[styles.cycleRow, styles.cycleHeaderRow]}>
            <Text
              style={[
                styles.cycleCell,
                styles.cycleCellStep,
                styles.cycleHeaderText,
              ]}
            >
              Step
            </Text>
            <Text
              style={[
                styles.cycleCell,
                styles.cycleCellTemp,
                styles.cycleHeaderText,
              ]}
            >
              Temp
            </Text>
            <Text
              style={[
                styles.cycleCell,
                styles.cycleCellDur,
                styles.cycleHeaderText,
              ]}
            >
              Duration
            </Text>
          </View>
          {d.cycleConditions.map((c, i) => (
            <View
              key={i}
              style={[
                styles.cycleRow,
                i % 2 === 1 && styles.cycleRowAlt,
                (i === 1 || i === 2 || i === 3) && styles.cycleRowLooped,
              ]}
            >
              <View style={[styles.cycleCell, styles.cycleCellStep]}>
                {(i === 1 || i === 2 || i === 3) && (
                  <View style={styles.loopTag}>
                    <Text style={styles.loopTagText}>
                      ×{run.pcrData!.cycles}
                    </Text>
                  </View>
                )}
                <Text style={styles.cycleCellText}>{c.step}</Text>
              </View>
              <View
                style={[
                  styles.cycleCell,
                  styles.cycleCellTemp,
                  styles.cycleTempCell,
                ]}
              >
                <Text
                  style={[
                    styles.cycleTempText,
                    c.temp >= 90
                      ? { color: C.red }
                      : c.temp >= 60
                        ? { color: C.amber }
                        : c.temp >= 60
                          ? { color: C.purple }
                          : c.temp <= 10
                            ? { color: C.blue }
                            : { color: C.textPrimary },
                  ]}
                >
                  {c.temp}°C
                </Text>
              </View>
              <Text
                style={[
                  styles.cycleCell,
                  styles.cycleCellDur,
                  styles.cycleCellText,
                ]}
              >
                {c.duration}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GEL DETAIL
// ─────────────────────────────────────────────────────────────────────────────
function GelDetail({ run }: { run: ExperimentRun }) {
  const d = run.gelData!;
  return (
    <>
      <SectionCard>
        <SectionHeader label="Gel Parameters" />
        <View style={styles.statsGrid}>
          <StatCell label="Agarose" value={`${d.gelPercent}%`} />
          <StatCell label="Voltage" value={d.voltage} unit="V" />
          <StatCell label="Runtime" value={d.runtime} unit="min" />
          <StatCell label="Buffer" value={d.buffer} />
        </View>
        {/* Ladder visualization */}
        <View style={styles.ladderSection}>
          <Text style={styles.ladderTitle}>DNA Ladder</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.ladderRow}>
              {d.ladderBp.map((bp, i) => (
                <View key={i} style={styles.ladderBand}>
                  <View
                    style={[
                      styles.ladderLine,
                      { height: Math.max(6, (bp / 2000) * 36) },
                    ]}
                  />
                  <Text style={styles.ladderBpText}>
                    {bp >= 1000 ? `${bp / 1000}k` : bp}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </SectionCard>

      {/* Band results */}
      <SectionCard>
        <SectionHeader label="Band Analysis" />
        <View style={styles.bandList}>
          {d.bands.map((band, i) => (
            <React.Fragment key={i}>
              <BandRow band={band} unit="bp" />
              {i < d.bands.length - 1 && <View style={styles.bandDivider} />}
            </React.Fragment>
          ))}
        </View>
      </SectionCard>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WESTERN BLOT DETAIL
// ─────────────────────────────────────────────────────────────────────────────
function WesternDetail({ run }: { run: ExperimentRun }) {
  const d = run.westernData!;
  return (
    <>
      <SectionCard>
        <SectionHeader label="Antibody & Protocol" />
        <View style={styles.abTable}>
          {[
            { label: "Membrane", value: d.membrane },
            { label: "Primary Ab", value: d.primaryAb },
            { label: "Dilution", value: d.primaryDilution },
            { label: "Secondary Ab", value: d.secondaryAb },
            { label: "Blocking", value: d.blockingAgent },
            { label: "Exposure", value: `${d.exposureTime}s` },
            { label: "Target MW", value: `${d.targetMw} kDa` },
          ].map((row, i) => (
            <View
              key={i}
              style={[styles.abRow, i % 2 === 1 && styles.abRowAlt]}
            >
              <Text style={styles.abRowLabel}>{row.label}</Text>
              <Text style={styles.abRowValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard>
        <SectionHeader label="Band Detection" />
        <Text style={styles.unitNote}>All sizes in kDa</Text>
        <View style={styles.bandList}>
          {d.bands.map((band, i) => (
            <React.Fragment key={i}>
              <BandRow band={band} unit="kDa" />
              {i < d.bands.length - 1 && <View style={styles.bandDivider} />}
            </React.Fragment>
          ))}
        </View>
      </SectionCard>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ELISA DETAIL
// ─────────────────────────────────────────────────────────────────────────────
function ELISADetail({ run }: { run: ExperimentRun }) {
  const d = run.elisaData!;
  const maxAbs = Math.max(...d.standardCurve.map((p) => p.abs));

  const wellStatusCfg = {
    positive: { color: C.green, bg: C.greenBg, icon: CheckmarkCircle02Icon },
    negative: { color: C.textMuted, bg: C.bg, icon: TickDouble02Icon },
    invalid: { color: C.red, bg: C.redBg, icon: AlertCircleIcon },
  };

  return (
    <>
      <SectionCard>
        <SectionHeader label="Assay Configuration" />
        <View style={styles.abTable}>
          {[
            { label: "Plate", value: d.plateType },
            { label: "Coating Ag", value: d.coatingAg },
            { label: "Detection", value: d.detectionAb },
            { label: "Substrate", value: d.substrate },
            { label: "Read at", value: `${d.readWavelength} nm` },
          ].map((row, i) => (
            <View
              key={i}
              style={[styles.abRow, i % 2 === 1 && styles.abRowAlt]}
            >
              <Text style={styles.abRowLabel}>{row.label}</Text>
              <Text style={styles.abRowValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      {/* Standard curve visual */}
      <SectionCard>
        <SectionHeader label="Standard Curve" />
        <View style={styles.stdCurveContainer}>
          {/* Y-axis labels */}
          <View style={styles.stdYAxis}>
            {[3.0, 2.0, 1.0, 0.0].map((v) => (
              <Text key={v} style={styles.stdAxisLabel}>
                {v.toFixed(1)}
              </Text>
            ))}
          </View>
          {/* Bar chart */}
          <View style={styles.stdBars}>
            {d.standardCurve.map((pt, i) => (
              <View key={i} style={styles.stdBarCol}>
                <View style={styles.stdBarTrack}>
                  <View
                    style={[
                      styles.stdBarFill,
                      {
                        height:
                          `${Math.min(100, (pt.abs / 3.0) * 100)}%` as any,
                        backgroundColor:
                          pt.abs > 2.5
                            ? C.red
                            : pt.abs > 1.0
                              ? C.purple
                              : C.blue,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.stdBarLabel}>
                  {pt.conc === 0
                    ? "Blk"
                    : pt.conc >= 1000
                      ? `${pt.conc / 1000}k`
                      : pt.conc}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.curveR2Row}>
          <View style={styles.curveR2Chip}>
            <Text style={styles.curveR2Text}>R² = 0.998 · Excellent fit</Text>
          </View>
        </View>
      </SectionCard>

      {/* Well results */}
      <SectionCard>
        <SectionHeader label="Sample Results" />
        {d.wells.map((w, i) => {
          const cfg = wellStatusCfg[w.status];
          return (
            <View
              key={i}
              style={[styles.wellRow, i % 2 === 1 && styles.wellRowAlt]}
            >
              <View style={[styles.wellBadge, { backgroundColor: cfg.bg }]}>
                <HugeiconsIcon icon={cfg.icon} size={13} color={cfg.color} />
              </View>
              <View style={styles.wellInfo}>
                <Text style={styles.wellSample}>{w.sample}</Text>
                <Text style={styles.wellWell}>{w.well}</Text>
              </View>
              <View style={styles.wellRight}>
                <Text
                  style={[
                    styles.wellAbs,
                    { color: w.absorbance > 2.5 ? C.red : C.textPrimary },
                  ]}
                >
                  {w.absorbance.toFixed(3)}
                </Text>
                <Text style={styles.wellAbsUnit}>OD</Text>
              </View>
              <View style={styles.wellConc}>
                {w.concentration !== undefined ? (
                  <Text style={styles.wellConcValue}>
                    {w.concentration} pg/mL
                  </Text>
                ) : (
                  <Text style={[styles.wellConcValue, { color: C.red }]}>
                    Rerun
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </SectionCard>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// qPCR DETAIL
// ─────────────────────────────────────────────────────────────────────────────
function QPCRDetail({ run }: { run: ExperimentRun }) {
  const d = run.qpcrData!;
  const maxFold = Math.max(
    ...d.samples.filter((s) => s.status === "valid").map((s) => s.foldChange),
  );
  return (
    <>
      <SectionCard>
        <SectionHeader label="Assay Details" />
        <View style={styles.statsGrid}>
          <StatCell label="Target Gene" value={d.gene} />
          <StatCell label="Reference" value={d.reference} />
          <StatCell label="Primer Set" value={d.primer} />
          <StatCell
            label="Efficiency"
            value={`${d.efficiency}%`}
            flag={d.efficiency >= 90 && d.efficiency <= 110 ? "ok" : "warn"}
          />
        </View>
      </SectionCard>

      <SectionCard>
        <SectionHeader label="Sample Results" />
        {d.samples.map((s, i) => {
          const isNTC = s.status === "invalid";
          const barWidth = isNTC ? 0 : s.foldChange / maxFold;
          return (
            <View key={i} style={styles.qpcrRow}>
              <View style={styles.qpcrRowLeft}>
                <Text
                  style={[
                    styles.qpcrSampleName,
                    isNTC && { color: C.textMuted },
                  ]}
                >
                  {s.name}
                </Text>
                <View style={styles.qpcrMeta}>
                  <Text style={styles.qpcrMetaText}>
                    Ct{" "}
                    <Text style={styles.qpcrMetaVal}>
                      {isNTC ? "—" : s.ct.toFixed(1)}
                    </Text>
                  </Text>
                  <Text style={styles.qpcrMetaDot}>·</Text>
                  <Text style={styles.qpcrMetaText}>
                    ΔCt{" "}
                    <Text style={styles.qpcrMetaVal}>
                      {isNTC ? "—" : s.deltaCt.toFixed(1)}
                    </Text>
                  </Text>
                </View>
                {!isNTC && (
                  <View style={styles.qpcrBarBg}>
                    <View
                      style={[
                        styles.qpcrBarFill,
                        {
                          width: `${barWidth * 100}%` as any,
                          backgroundColor:
                            s.foldChange > 5
                              ? C.red
                              : s.foldChange > 2
                                ? C.amber
                                : C.green,
                        },
                      ]}
                    />
                  </View>
                )}
              </View>
              <View style={styles.qpcrFoldWrap}>
                {isNTC ? (
                  <View style={[styles.pill, { backgroundColor: C.redBg }]}>
                    <Text style={[styles.pillText, { color: C.red }]}>NTC</Text>
                  </View>
                ) : (
                  <>
                    <Text
                      style={[
                        styles.qpcrFold,
                        {
                          color:
                            s.foldChange > 5
                              ? C.red
                              : s.foldChange > 2
                                ? C.amber
                                : C.green,
                        },
                      ]}
                    >
                      {s.foldChange.toFixed(2)}×
                    </Text>
                    <Text style={styles.qpcrFoldLabel}>fold change</Text>
                  </>
                )}
              </View>
            </View>
          );
        })}
      </SectionCard>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOW CYTOMETRY DETAIL
// ─────────────────────────────────────────────────────────────────────────────
function FlowDetail({ run }: { run: ExperimentRun }) {
  const d = run.flowData!;
  return (
    <>
      <SectionCard>
        <SectionHeader label="Instrument & Gating" />
        <View style={styles.abTable}>
          <View style={styles.abRow}>
            <Text style={styles.abRowLabel}>Instrument</Text>
            <Text style={styles.abRowValue}>{d.instrument}</Text>
          </View>
          <View style={[styles.abRow, styles.abRowAlt]}>
            <Text style={styles.abRowLabel}>Total Events</Text>
            <Text style={styles.abRowValue}>
              {d.totalEvents.toLocaleString()}
            </Text>
          </View>
        </View>
        <View style={styles.gatingChain}>
          {d.gatingStrategy.map((gate, i) => (
            <React.Fragment key={i}>
              <View style={styles.gateChip}>
                <Text style={styles.gateChipText}>{gate}</Text>
              </View>
              {i < d.gatingStrategy.length - 1 && (
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={11}
                  color={C.textMuted}
                />
              )}
            </React.Fragment>
          ))}
        </View>
      </SectionCard>

      <SectionCard>
        <SectionHeader label="Population Analysis" />
        {d.populations.map((pop, i) => (
          <View key={i} style={styles.flowPopRow}>
            <View style={[styles.flowPopDot, { backgroundColor: pop.color }]} />
            <View style={styles.flowPopInfo}>
              <View style={styles.flowPopTop}>
                <Text style={styles.flowPopName}>{pop.name}</Text>
                <Text style={[styles.flowPopPct, { color: pop.color }]}>
                  {pop.percentage}%
                </Text>
              </View>
              <View style={styles.flowBarBg}>
                <View
                  style={[
                    styles.flowBarFill,
                    {
                      width: `${pop.percentage}%` as any,
                      backgroundColor: pop.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.flowPopCount}>
                {pop.count.toLocaleString()} events
              </Text>
            </View>
          </View>
        ))}
      </SectionCard>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function ExperimentDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  console.log(params);
  // API State
  const [experiment, setExperiment] = useState<ApiExperiment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // UI State
  const [focusMode, setFocusMode] = useState<FocusMode>("evidence");

  // Demo fallback state
  const [demoIndex, setDemoIndex] = useState(0);
  const [useDemoData, setUseDemoData] = useState(false);

  // Bottom sheet for AI recommendations
  const aiSheetRef = useRef<BottomSheetModal>(null);
  const aiSnapPoints = useMemo(() => ["50%", "85%"], []);

  // Load experiment data
  useEffect(() => {
    if (params.id) {
      loadExperiment(params.id);
      console.log("FETCHING EXPERIEMENT");
    } else {
      // No ID provided, use demo data
      setUseDemoData(true);
      setIsLoading(false);
    }
  }, [params.id]);

  // Poll for updates if experiment is running
  useEffect(() => {
    if (!experiment || experiment.status !== "IN_PROGRESS") return;

    const interval = setInterval(() => {
      if (params.id) {
        loadExperiment(params.id, true); // Silent refresh
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [experiment?.status, params.id]);

  const loadExperiment = async (experimentId: string, silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }

      const response = await api.getExperimentWithAnalyses(experimentId);

      if (response.success && response.data) {
        setExperiment(response.data);
        setUseDemoData(false);
      } else {
        const errorMsg = response.error || "Failed to load experiment";
        console.error("API Error:", errorMsg);
        setError(errorMsg);
        // Fallback to demo data on error
        setUseDemoData(true);
      }
    } catch (err: any) {
      const errorMsg = err.message || "An error occurred";
      console.error("Error loading experiment:", errorMsg, err);
      setError(errorMsg);
      // Fallback to demo data on error
      setUseDemoData(true);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  // const loadExperimentByProtocol = async ()

  const onRefresh = async () => {
    if (!params.id) return;
    setRefreshing(true);
    await loadExperiment(params.id);
    setRefreshing(false);
  };

  // Action handlers
  const handleCompleteExperiment = async () => {
    if (!experiment) return;

    Alert.alert(
      "Complete Experiment",
      "Mark this experiment as successfully completed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          style: "default",
          onPress: async () => {
            try {
              const response = await api.completeExperiment(experiment.id, {
                success: true,
                conclusion: "Experiment completed successfully",
              });

              if (response.success) {
                await loadExperiment(experiment.id);
                Alert.alert("Success", "Experiment marked as complete");
              } else {
                Alert.alert(
                  "Error",
                  response.error || "Failed to complete experiment",
                );
              }
            } catch (err: any) {
              Alert.alert(
                "Error",
                err.message || "Failed to complete experiment",
              );
            }
          },
        },
      ],
    );
  };

  const handleFailExperiment = async () => {
    if (!experiment) return;

    Alert.prompt(
      "Fail Experiment",
      "Enter reason for failure:",
      async (reason) => {
        if (!reason) return;

        try {
          const response = await api.failExperiment(experiment.id, { reason });

          if (response.success) {
            await loadExperiment(experiment.id);
            Alert.alert("Experiment Failed", "Experiment marked as failed");
          } else {
            Alert.alert(
              "Error",
              response.error || "Failed to update experiment",
            );
          }
        } catch (err: any) {
          Alert.alert("Error", err.message || "Failed to update experiment");
        }
      },
    );
  };

  const handleCancelExperiment = async () => {
    if (!experiment) return;

    Alert.prompt(
      "Cancel Experiment",
      "Enter reason for cancellation:",
      async (reason) => {
        if (!reason) return;

        try {
          const response = await api.cancelExperiment(experiment.id, {
            reason,
          });

          if (response.success) {
            await loadExperiment(experiment.id);
            Alert.alert(
              "Experiment Cancelled",
              "Experiment has been cancelled",
            );
          } else {
            Alert.alert(
              "Error",
              response.error || "Failed to cancel experiment",
            );
          }
        } catch (err: any) {
          Alert.alert("Error", err.message || "Failed to cancel experiment");
        }
      },
    );
  };

  // Transform data for UI
  const run = useDemoData
    ? MOCK_RUNS[ALL_RUN_IDS[demoIndex]] || MOCK_RUNS[ALL_RUN_IDS[0]]
    : experiment
      ? transformExperimentToRun(experiment)
      : null;

  // Compute derived values (must be called unconditionally)
  const assayCfg = run ? ASSAY_CFG[run.type] : ASSAY_CFG.PCR;
  const statusCfg = run ? STATUS_CFG[run.status] : STATUS_CFG.warning;
  const insight = run ? INSIGHT_CFG[run.status] : INSIGHT_CFG.warning;
  const focusCopy = useMemo(
    () => (run ? getFocusCopy(run, insight) : null),
    [run, insight],
  );
  const focus = focusCopy ? focusCopy[focusMode] : null;
  const sampleCount = useMemo(() => (run ? getSampleCount(run) : 0), [run]);
  const sampleLabel = useMemo(
    () => (run ? getSampleLabel(run) : "Units"),
    [run],
  );

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

  // Cycle demo run (dev helper)
  const cycleDemoRun = () => setDemoIndex((i) => (i + 1) % ALL_RUN_IDS.length);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.root, styles.centerContent]}>
        <ActivityIndicator size="large" color={C.black} />
        <Text style={styles.loadingText}>Loading experiment...</Text>
      </View>
    );
  }

  // Error state (only show if not using demo data)
  if (error && !useDemoData && !run) {
    return (
      <View style={[styles.root, styles.centerContent]}>
        <View style={styles.errorIcon}>
          <HugeiconsIcon icon={AlertCircleIcon} size={32} color={C.red} />
        </View>
        <Text style={styles.errorTitle}>Error Loading Experiment</Text>
        <View style={styles.errorMessageBox}>
          <Text style={styles.errorBody}>{error}</Text>
        </View>
        {params.id && (
          <Text style={styles.errorId}>Experiment ID: {params.id}</Text>
        )}
        <Pressable
          style={[styles.retryBtn, SHADOW_SM]}
          onPress={() => params.id && loadExperiment(params.id)}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
        <Pressable
          style={styles.demoBtn}
          onPress={() => {
            setUseDemoData(true);
            setError(null);
          }}
        >
          <Text style={styles.demoBtnText}>View Demo Data</Text>
        </Pressable>
      </View>
    );
  }

  if (!run || !focus) {
    return (
      <View style={[styles.root, styles.centerContent]}>
        <Text style={styles.errorTitle}>Experiment not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          params.id ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        <View style={styles.ambientTop} pointerEvents="none">
          <View style={styles.ambientBlobOne} />
          <View style={styles.ambientBlobTwo} />
        </View>
        {/* ── Top bar ── */}
        {/* <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [
              styles.backBtn,
              SHADOW_SM,
              pressed && { opacity: 0.6 },
            ]}
            onPress={() =>
              router.canGoBack() ? router.back() : cycleDemoRun()
            }
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={18}
              color={C.black}
              strokeWidth={2}
            />
          </Pressable>

          <View style={styles.topBarCenter}>
            <Pill
              label={assayCfg.label}
              color={assayCfg.color}
              bg={assayCfg.bg}
            />
          </View>

          <View style={styles.topBarRight}>
            <Pressable style={[styles.iconBtn, SHADOW_SM]}>
              <HugeiconsIcon
                icon={Share08Icon}
                size={16}
                color={C.black}
                strokeWidth={1.8}
              />
            </Pressable>
            <Pressable style={[styles.iconBtn, SHADOW_SM]}>
              <HugeiconsIcon
                icon={MoreHorizontalIcon}
                size={16}
                color={C.black}
                strokeWidth={1.8}
              />
            </Pressable>
          </View>
        </View> */}
        <View
          style={{
            paddingVertical: 10,
          }}
        ></View>

        {/* ── Hero card ── */}
        <View style={[styles.heroCard, SHADOW_LG]}>
          {/* Status strip at top of card */}
          <View
            style={[
              styles.heroStatusStrip,
              { backgroundColor: statusCfg.color },
            ]}
          />

          <View style={styles.heroBody}>
            <View style={styles.heroTopRow}>
              <Text style={styles.heroDate}>
                {run.date} · {run.operator}
              </Text>
              <View
                style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: statusCfg.color },
                  ]}
                />
                <Text
                  style={[styles.statusBadgeText, { color: statusCfg.color }]}
                >
                  {statusCfg.label}
                </Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>{run.protocolName}</Text>

            <View style={styles.heroMetaRow}>
              <MetaChip label="Run ID" value={run.id.toUpperCase()} />
              <MetaChip label={sampleLabel} value={`${sampleCount}`} />
              <MetaChip
                label="Confidence"
                value={`${Math.round(insight.confidence * 100)}%`}
              />
            </View>

            {/* Tags */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tagScroll}
            >
              <View style={styles.tagRow}>
                {run.tags.map((tag, i) => (
                  <View key={i} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Observation */}
            <View style={styles.observationBox}>
              <View style={styles.observationIconWrap}>
                <HugeiconsIcon icon={SparklesIcon} size={13} color={C.white} />
              </View>
              <Text style={styles.observationText}>{run.observation}</Text>
            </View>
          </View>
        </View>

        {/* ── Decision loop ── */}
        <SectionCard style={styles.deepCard}>
          <View style={styles.deepHeader}>
            <View>
              <Text style={styles.deepEyebrow}>Decision Loop</Text>
              <Text style={styles.deepTitle}>From evidence to action</Text>
            </View>
            <View style={styles.deepStatusPill}>
              <View
                style={[
                  styles.deepStatusDot,
                  { backgroundColor: statusCfg.color },
                ]}
              />
              <Text style={[styles.deepStatusText, { color: statusCfg.color }]}>
                {statusCfg.label}
              </Text>
            </View>
          </View>

          <View style={styles.focusRow}>
            {FOCUS_MODES.map((mode) => {
              const active = focusMode === mode.key;
              return (
                <Pressable
                  key={mode.key}
                  onPress={() => setFocusMode(mode.key)}
                  style={({ pressed }) => [
                    styles.focusChip,
                    active && styles.focusChipActive,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <HugeiconsIcon
                    icon={mode.icon}
                    size={13}
                    color={active ? C.white : C.textOnBlackMuted}
                  />
                  <Text
                    style={[
                      styles.focusChipText,
                      active && styles.focusChipTextActive,
                    ]}
                  >
                    {mode.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.focusBody}>
            <Text style={styles.focusTitle}>{focus.title}</Text>
            <Text style={styles.focusText}>{focus.body}</Text>
          </View>

          <View style={styles.metricRow}>
            <MetricBar
              label="Signal"
              value={insight.signal}
              color={assayCfg.color}
            />
            <MetricBar label="Risk" value={insight.risk} color={C.red} />
            <MetricBar
              label="Confidence"
              value={insight.confidence}
              color={C.black}
            />
          </View>
        </SectionCard>

        {/* ── Type-specific sections ── */}
        {run.type === "PCR" && <PCRDetail run={run} />}
        {run.type === "Gel" && <GelDetail run={run} />}
        {run.type === "Western" && <WesternDetail run={run} />}
        {run.type === "ELISA" && <ELISADetail run={run} />}
        {run.type === "qPCR" && <QPCRDetail run={run} />}
        {run.type === "Flow" && <FlowDetail run={run} />}

        {/* ── AI Insights ── */}
        <SectionCard>
          <SectionHeader label="Likely Causes" />
          <View style={styles.causeList}>
            {run.causes.map((cause, i) => (
              <View key={i} style={styles.causeRow}>
                <View style={styles.causeRank}>
                  <Text style={styles.causeRankText}>{i + 1}</Text>
                </View>
                <Text style={styles.causeText}>{cause}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard>
          <SectionHeader label="Recommended Next Step" />
          <Text style={styles.nextStepText}>{run.nextStep}</Text>
        </SectionCard>

        {/* ── Action buttons ── */}
        <View style={styles.actionRow}>
          {experiment && experiment.status === "IN_PROGRESS" && (
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtnSuccess,
                  SHADOW_SM,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={handleCompleteExperiment}
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={15}
                  color={C.green}
                  strokeWidth={1.8}
                />
                <Text style={styles.actionBtnSuccessText}>Mark Complete</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtnDanger,
                  SHADOW_SM,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={handleFailExperiment}
              >
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  size={15}
                  color={C.red}
                  strokeWidth={1.8}
                />
                <Text style={styles.actionBtnDangerText}>Mark Failed</Text>
              </Pressable>
            </>
          )}
          {(!experiment || experiment.status !== "IN_PROGRESS") && (
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtnSecondary,
                  SHADOW_SM,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <HugeiconsIcon
                  icon={Copy01Icon}
                  size={15}
                  color={C.black}
                  strokeWidth={1.8}
                />
                <Text style={styles.actionBtnSecondaryText}>Copy Report</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtnSecondary,
                  SHADOW_SM,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <HugeiconsIcon
                  icon={Download02Icon}
                  size={15}
                  color={C.black}
                  strokeWidth={1.8}
                />
                <Text style={styles.actionBtnSecondaryText}>Export PDF</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* ── Full analysis CTA ── */}
        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            SHADOW_DARK,
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => aiSheetRef.current?.present()}
        >
          <HugeiconsIcon icon={SparklesIcon} size={16} color={C.white} />
          <Text style={styles.ctaBtnText}>Ask AI About This Run</Text>
        </Pressable>

        {/* Demo navigation / API status */}
        {useDemoData ? (
          <Pressable onPress={cycleDemoRun} style={styles.demoToggle}>
            <Text style={styles.demoToggleText}>
              Preview next assay type → [{run.type}] (Demo Mode)
            </Text>
          </Pressable>
        ) : (
          <View style={styles.apiStatus}>
            <View style={styles.apiStatusDot} />
            <Text style={styles.apiStatusText}>
              Live Data · {experiment?.status || "Unknown"}
            </Text>
          </View>
        )}
      </ScrollView>

      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── AI Sheet ── */}
      <BottomSheetModal
        ref={aiSheetRef}
        snapPoints={aiSnapPoints}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.sheetHandle}
        backgroundStyle={styles.sheetBg}
        enablePanDownToClose
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          <View style={styles.sheetTopRow}>
            <BlackPill label="AI Analysis" />
            <Pill label={run.type} color={assayCfg.color} bg={assayCfg.bg} />
          </View>

          <Text style={styles.sheetTitle}>{run.protocolName}</Text>
          <View style={styles.sheetMetaRow}>
            <HugeiconsIcon icon={Clock01Icon} size={12} color={C.textMuted} />
            <Text style={styles.sheetMetaText}>{run.date}</Text>
          </View>

          <View style={styles.sheetBlock}>
            <View style={styles.blockLabelRow}>
              <BlackPill label="Observation" />
            </View>
            <Text style={styles.blockBody}>{run.observation}</Text>
          </View>

          <View style={styles.sheetBlock}>
            <View style={styles.blockLabelRow}>
              <BlackPill label="Ranked Causes" />
            </View>
            {run.causes.map((c, i) => (
              <View key={i} style={styles.causeRow}>
                <View style={styles.causeRank}>
                  <Text style={styles.causeRankText}>{i + 1}</Text>
                </View>
                <Text style={styles.causeText}>{c}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sheetBlock}>
            <View style={styles.blockLabelRow}>
              <BlackPill label="Next Step" />
            </View>
            <Text style={styles.blockBody}>{run.nextStep}</Text>
          </View>

          <View style={styles.sheetVoiceRow}>
            <HugeiconsIcon icon={Mic02Icon} size={14} color={C.textMuted} />
            <Text style={styles.sheetVoiceText}>
              Switch to Voice Mode for hands-free guidance
            </Text>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, overflow: "hidden" },
  scrollContainer: { zIndex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 12 },
  ambientTop: {
    position: "absolute",
    top: -40,
    left: -20,
    right: -20,
    height: 260,
    zIndex: 0,
  },
  ambientBlobOne: {
    position: "absolute",
    top: 10,
    left: 20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: C.purpleBg,
    opacity: 0.9,
  },
  ambientBlobTwo: {
    position: "absolute",
    top: -20,
    right: -10,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: C.blueBg,
    opacity: 0.85,
  },

  // ── Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.86)",
    borderRadius: 18,
    borderCurve: "continuous",
    marginBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },
  topBarCenter: { flex: 1, alignItems: "center" },
  topBarRight: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
  },

  // ── Hero card
  heroCard: {
    backgroundColor: C.surface,
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 12,
    borderCurve: "continuous",
  },
  heroStatusStrip: { height: 4, width: "100%" },
  heroBody: { padding: 18, gap: 10 },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroDate: { fontSize: 12, color: C.textMuted, letterSpacing: 0.1 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 11.5, fontWeight: "700" },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.4,
    lineHeight: 27,
  },
  heroMetaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    marginBottom: 2,
    flexWrap: "wrap",
  },
  metaChip: {
    backgroundColor: C.bg,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderCurve: "continuous",
    minWidth: 72,
  },
  metaChipLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    color: C.textMuted,
    letterSpacing: 0.6,
  },
  metaChipValue: {
    fontSize: 13,
    fontWeight: "700",
    color: C.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  tagScroll: { marginHorizontal: -2 },
  tagRow: { flexDirection: "row", gap: 6 },
  tagChip: {
    backgroundColor: C.bg,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderCurve: "continuous",
  },
  tagChipText: { fontSize: 11.5, color: C.textSecondary },
  observationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 12,
    borderCurve: "continuous",
  },
  observationIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    borderCurve: "continuous",
  },
  observationText: {
    flex: 1,
    fontSize: 13.5,
    color: C.textSecondary,
    lineHeight: 20,
  },

  // ── Section card
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderCurve: "continuous",
  },
  sectionHeaderRow: { marginBottom: 14 },

  // ── Decision loop
  deepCard: {
    backgroundColor: C.blackSoft,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderCurve: "continuous",
  },
  deepHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  deepEyebrow: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: C.textOnBlackMuted,
  },
  deepTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.textOnBlack,
    letterSpacing: -0.2,
  },
  deepStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderCurve: "continuous",
  },
  deepStatusDot: { width: 7, height: 7, borderRadius: 3.5 },
  deepStatusText: { fontSize: 11, fontWeight: "700" },
  focusRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  focusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderCurve: "continuous",
  },
  focusChipActive: {
    backgroundColor: C.black,
    borderColor: C.black,
  },
  focusChipText: {
    fontSize: 11.5,
    color: C.textOnBlackMuted,
    fontWeight: "600",
  },
  focusChipTextActive: { color: C.white },
  focusBody: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 14,
    borderCurve: "continuous",
    marginBottom: 14,
  },
  focusTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.white,
    marginBottom: 6,
  },
  focusText: { fontSize: 13, color: C.textOnBlackMuted, lineHeight: 19 },
  metricRow: { gap: 8, flexDirection: "column" },
  metricCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderCurve: "continuous",
  },
  metricTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  metricLabel: { fontSize: 11, color: C.textOnBlackMuted },
  metricValue: {
    fontSize: 12.5,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  metricTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
  },
  metricFill: { height: "100%", borderRadius: 4 },

  // ── Pills
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    borderCurve: "continuous",
  },
  pillText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  blackPill: {
    alignSelf: "flex-start",
    backgroundColor: C.black,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderCurve: "continuous",
  },
  blackPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.white,
    letterSpacing: 0.3,
  },

  // ── Stats grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
    marginBottom: 8,
  },
  statCell: {
    width: "33.33%",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  statCellLabel: {
    fontSize: 10.5,
    color: C.textMuted,
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  statCellValueRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statCellValue: {
    fontSize: 16,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.2,
  },
  statCellUnit: { fontSize: 10.5, color: C.textMuted, marginTop: 2 },
  flagDot: { width: 7, height: 7, borderRadius: 3.5, marginTop: 2 },

  // ── Mono chip (polymerase name etc.)
  monoChip: {
    alignSelf: "flex-start",
    backgroundColor: C.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 4,
  },
  monoChipText: { fontSize: 12, color: C.textSecondary, letterSpacing: 0.1 },

  // ── Cycling table
  cycleTable: { gap: 0 },
  cycleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  cycleHeaderRow: { marginBottom: 2 },
  cycleRowAlt: { backgroundColor: C.bg },
  cycleRowLooped: { marginLeft: 12 },
  cycleHeaderText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  cycleCell: { paddingHorizontal: 4 },
  cycleCellStep: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cycleCellTemp: { flex: 1, alignItems: "flex-end" },
  cycleCellDur: { flex: 1, textAlign: "right" },
  cycleCellText: { fontSize: 13, color: C.textSecondary },
  cycleTempCell: { alignItems: "flex-end" },
  cycleTempText: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2 },
  loopTag: {
    backgroundColor: C.purple + "22",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  loopTagText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: C.purple,
    letterSpacing: 0.3,
  },

  // ── Ladder
  ladderSection: { marginTop: 10 },
  ladderTitle: {
    fontSize: 11,
    color: C.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  ladderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingBottom: 4,
  },
  ladderBand: { alignItems: "center", gap: 3 },
  ladderLine: { width: 3, backgroundColor: C.black, borderRadius: 1.5 },
  ladderBpText: { fontSize: 9, color: C.textMuted },

  // ── Band rows
  bandList: { gap: 0 },
  bandRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    gap: 12,
  },
  bandDivider: { height: 1, backgroundColor: C.bg },
  bandLaneCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  bandLaneText: { fontSize: 12, fontWeight: "700", color: C.white },
  bandInfo: { flex: 1, gap: 5 },
  bandInfoTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bandLabel: { fontSize: 13.5, fontWeight: "600", color: C.textPrimary },
  bandIntensityLabel: { fontSize: 11.5, fontWeight: "700" },
  bandBarBg: { height: 5, backgroundColor: C.bg, borderRadius: 3 },
  bandBarFill: { height: "100%", borderRadius: 3 },
  bandMeta: { flexDirection: "row", gap: 14 },
  bandMetaText: { fontSize: 11.5, color: C.textMuted },
  bandMetaVal: { fontWeight: "600" },
  bandNotes: { fontSize: 11.5, color: C.amber, fontStyle: "italic" },
  unitNote: {
    fontSize: 11,
    color: C.textMuted,
    marginBottom: 6,
    letterSpacing: 0.2,
  },

  // ── Antibody/Protocol table
  abTable: { gap: 0, marginBottom: 4 },
  abRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  abRowAlt: { backgroundColor: C.bg },
  abRowLabel: { flex: 1, fontSize: 12, color: C.textMuted },
  abRowValue: {
    flex: 2,
    fontSize: 13,
    color: C.textPrimary,
    fontWeight: "500",
    textAlign: "right",
  },

  // ── Standard curve (ELISA)
  stdCurveContainer: {
    flexDirection: "row",
    height: 120,
    gap: 6,
    marginBottom: 8,
  },
  stdYAxis: { justifyContent: "space-between", paddingVertical: 2, width: 28 },
  stdAxisLabel: { fontSize: 9, color: C.textMuted, textAlign: "right" },
  stdBars: { flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 4 },
  stdBarCol: { flex: 1, alignItems: "center", gap: 3 },
  stdBarTrack: {
    width: "100%",
    height: 100,
    justifyContent: "flex-end",
    backgroundColor: C.bg,
    borderRadius: 4,
  },
  stdBarFill: { width: "100%", borderRadius: 4 },
  stdBarLabel: { fontSize: 8.5, color: C.textMuted },
  curveR2Row: { alignItems: "flex-start" },
  curveR2Chip: {
    backgroundColor: C.greenBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  curveR2Text: { fontSize: 12, color: C.green, fontWeight: "600" },

  // ── Well results (ELISA)
  wellRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 10,
  },
  wellRowAlt: { backgroundColor: C.bg },
  wellBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  wellInfo: { flex: 2 },
  wellSample: { fontSize: 13, fontWeight: "600", color: C.textPrimary },
  wellWell: { fontSize: 11, color: C.textMuted },
  wellRight: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  wellAbs: { fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
  wellAbsUnit: { fontSize: 10, color: C.textMuted },
  wellConc: { flex: 1.2, alignItems: "flex-end" },
  wellConcValue: { fontSize: 11.5, color: C.textSecondary, fontWeight: "500" },

  // ── qPCR rows
  qpcrRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.bg,
  },
  qpcrRowLeft: { flex: 1, gap: 4 },
  qpcrSampleName: { fontSize: 13.5, fontWeight: "600", color: C.textPrimary },
  qpcrMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  qpcrMetaText: { fontSize: 11.5, color: C.textMuted },
  qpcrMetaVal: { fontWeight: "700", color: C.textSecondary },
  qpcrMetaDot: { color: C.textMuted },
  qpcrBarBg: {
    height: 4,
    backgroundColor: C.bg,
    borderRadius: 2,
    marginTop: 2,
  },
  qpcrBarFill: { height: "100%", borderRadius: 2 },
  qpcrFoldWrap: { alignItems: "flex-end", minWidth: 70 },
  qpcrFold: { fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  qpcrFoldLabel: { fontSize: 10, color: C.textMuted },

  // ── Flow cytometry
  gatingChain: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },
  gateChip: {
    backgroundColor: C.bg,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gateChipText: { fontSize: 11.5, color: C.textSecondary },
  flowPopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.bg,
  },
  flowPopDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  flowPopInfo: { flex: 1, gap: 5 },
  flowPopTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  flowPopName: { fontSize: 13.5, fontWeight: "600", color: C.textPrimary },
  flowPopPct: { fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  flowBarBg: { height: 5, backgroundColor: C.bg, borderRadius: 3 },
  flowBarFill: { height: "100%", borderRadius: 3 },
  flowPopCount: { fontSize: 11, color: C.textMuted },

  // ── AI Insights
  causeList: { gap: 8 },
  causeRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  causeRank: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  causeRankText: { fontSize: 11, fontWeight: "700", color: C.white },
  causeText: {
    flex: 1,
    fontSize: 13.5,
    color: C.textSecondary,
    lineHeight: 20,
  },
  nextStepText: { fontSize: 14, color: C.textSecondary, lineHeight: 22 },

  // ── Action buttons
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingVertical: 13,
    borderCurve: "continuous",
  },
  actionBtnSecondaryText: { fontSize: 13.5, fontWeight: "600", color: C.black },

  // ── CTA
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.black,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 10,
    borderCurve: "continuous",
  },
  ctaBtnText: {
    fontSize: 15,
    fontWeight: "650" as any,
    color: C.white,
    letterSpacing: 0.1,
  },

  // ── Demo toggle
  demoToggle: { alignItems: "center", paddingVertical: 8 },
  demoToggleText: { fontSize: 12, color: C.textMuted },

  // ── API Status
  apiStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6,
  },
  apiStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.green,
  },
  apiStatusText: { fontSize: 12, color: C.textMuted, fontWeight: "600" },

  // ── Loading/Error States
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: C.textMuted,
    fontWeight: "600",
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: C.redBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.textPrimary,
    marginBottom: 8,
  },
  errorMessageBox: {
    backgroundColor: C.redBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: C.red + "40",
  },
  errorBody: {
    fontSize: 14,
    color: C.red,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "600",
  },
  errorId: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "monospace",
  },
  retryBtn: {
    backgroundColor: C.black,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 12,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.white,
  },
  demoBtn: {
    paddingVertical: 8,
  },
  demoBtnText: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: "600",
  },

  // ── Action button variants
  actionBtnSuccess: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: C.greenBg,
    borderRadius: 14,
    paddingVertical: 13,
    borderCurve: "continuous",
  },
  actionBtnSuccessText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: C.green,
  },
  actionBtnDanger: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: C.redBg,
    borderRadius: 14,
    paddingVertical: 13,
    borderCurve: "continuous",
  },
  actionBtnDangerText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: C.red,
  },

  // ── Bottom sheet
  sheetBg: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderCurve: "continuous",
  },
  sheetHandle: { backgroundColor: "#d0d0d8", width: 36 },
  sheetContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 52 },
  sheetTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 6,
  },
  sheetMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 18,
  },
  sheetMetaText: { fontSize: 12.5, color: C.textMuted },
  sheetBlock: {
    backgroundColor: C.bg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 10,
    borderCurve: "continuous",
  },
  blockLabelRow: { marginBottom: 2 },
  blockBody: { fontSize: 14, color: C.textSecondary, lineHeight: 21 },
  sheetVoiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    justifyContent: "center",
  },
  sheetVoiceText: { fontSize: 12.5, color: C.textMuted },
});
