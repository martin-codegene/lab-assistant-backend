/**
 * tools.tsx
 *
 * Tools screen for Lab Assistant AI.
 *
 * Tools included:
 *  1. Molarity Calculator      — MW, mass, volume → molarity (+ step-by-step instructions)
 *  2. Dilution Calculator      — C1V1 = C2V2 with volume to add + diluent
 *  3. DNA / RNA Concentration  — A260 absorbance → ng/μL (with purity check)
 *  4. PCR Master Mix Maker     — scale reactions, generate reagent volumes table
 *  5. Unit Converter           — mass, volume, concentration, temperature
 *  6. Buffer pH Calculator     — Henderson-Hasselbalch, acid/base ratio
 *  7. Look Up Reference        — quick-access troubleshooting cards
 *
 * Design language matches home.tsx / protocols.tsx exactly:
 *   bg #ffffff · cards #f4f4f7 · black accents · uppercase labels · rounded-24
 */

import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView
} from "@gorhom/bottom-sheet";
import {
    ArrowRight01Icon,
    Beaker,
    BookOpen01Icon,
    Calculator01Icon,
    Cancel01Icon,
    CheckmarkCircle02Icon,
    ChemistryIcon,
    Flask,
    InformationCircleIcon,
    Layers01Icon,
    Microscope,
    Scale,
    Search01Icon,
    SparklesIcon,
    TestTube01Icon,
    ToolsIcon,
    WaterfallDown01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    Keyboard,
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
  pink: "#ec4899",
  pinkBg: "#fce7f3",
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
    shadowOpacity: 0.05,
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
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function BlackPill({ label }: { label: string }) {
  return (
    <View style={s.blackPill}>
      <Text style={s.blackPillText}>{label}</Text>
    </View>
  );
}

function ResultBox({
  label,
  value,
  unit,
  color = C.black,
  note,
}: {
  label: string;
  value: string;
  unit?: string;
  color?: string;
  note?: string;
}) {
  return (
    <View style={[s.resultBox, { borderLeftColor: color }]}>
      <Text style={s.resultLabel}>{label}</Text>
      <View style={s.resultValueRow}>
        <Text style={[s.resultValue, { color }]}>{value}</Text>
        {unit && <Text style={s.resultUnit}>{unit}</Text>}
      </View>
      {note && <Text style={s.resultNote}>{note}</Text>}
    </View>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  unit,
  placeholder = "0",
  keyboardType = "decimal-pad",
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  unit?: string;
  placeholder?: string;
  keyboardType?: any;
}) {
  return (
    <View style={s.inputGroup}>
      <Text style={s.inputLabel}>{label}</Text>
      <View style={s.inputRow}>
        <TextInput
          style={s.inputField}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          keyboardType={keyboardType}
          returnKeyType="done"
        />
        {unit && (
          <View style={s.inputUnitBadge}>
            <Text style={s.inputUnitText}>{unit}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function SelectRow({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={s.selectGroup}>
      <Text style={s.inputLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={s.selectOptions}>
          {options.map((o) => (
            <Pressable
              key={o}
              style={[s.selectChip, selected === o && s.selectChipActive]}
              onPress={() => onSelect(o)}
            >
              <Text
                style={[
                  s.selectChipText,
                  selected === o && s.selectChipTextActive,
                ]}
              >
                {o}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Divider() {
  return <View style={s.divider} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 1 — MOLARITY CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────
function MolarityTool() {
  const [mass, setMass] = useState("");
  const [mw, setMw] = useState("");
  const [vol, setVol] = useState("");
  const [volUnit, setVolUnit] = useState("mL");

  const result = useMemo(() => {
    const m = parseFloat(mass);
    const w = parseFloat(mw);
    const v = parseFloat(vol);
    if (!m || !w || !v || w <= 0 || v <= 0) return null;
    const volInL =
      volUnit === "mL" ? v / 1000 : volUnit === "μL" ? v / 1_000_000 : v;
    const molarity = m / w / volInL;
    const mM = molarity * 1000;
    const uM = molarity * 1_000_000;
    const display =
      molarity >= 1
        ? `${molarity.toFixed(4)} M`
        : mM >= 1
          ? `${mM.toFixed(3)} mM`
          : `${uM.toFixed(2)} μM`;
    return { molarity, mM, uM, display };
  }, [mass, mw, vol, volUnit]);

  const purity =
    parseFloat(mw) > 0 && parseFloat(mass) > 0 && parseFloat(vol) > 0;

  const steps = result
    ? [
        `Weigh out ${mass} g of your compound (MW ${mw} g/mol)`,
        `Dissolve in a small volume of appropriate solvent`,
        `Transfer to a ${vol} ${volUnit} volumetric flask`,
        `Bring to final volume with solvent and mix well`,
        `Final concentration: ${result.display}`,
      ]
    : [];

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={s.toolBody}>
        <BlackPill label="MOLARITY CALCULATOR" />
        <Text style={s.toolDesc}>
          Calculate molar concentration from mass and molecular weight.
        </Text>

        <View style={s.inputsGrid}>
          <InputField
            label="Mass"
            value={mass}
            onChangeText={setMass}
            unit="g"
          />
          <InputField
            label="Mol. Weight"
            value={mw}
            onChangeText={setMw}
            unit="g/mol"
          />
        </View>
        <InputField label="Final Volume" value={vol} onChangeText={setVol} />
        <SelectRow
          label="Volume Unit"
          options={["μL", "mL", "L"]}
          selected={volUnit}
          onSelect={setVolUnit}
        />

        {result ? (
          <View style={s.resultsSection}>
            <ResultBox
              label="Molar Concentration"
              value={result.display}
              color={C.purple}
            />
            <View style={s.resultRowTwo}>
              <ResultBox
                label="Molarity"
                value={result.molarity.toExponential(3)}
                unit="M"
              />
              <ResultBox
                label="millimolar"
                value={result.mM.toFixed(3)}
                unit="mM"
              />
            </View>
            <Divider />
            <BlackPill label="PREPARATION STEPS" />
            <View style={s.stepsList}>
              {steps.map((step, i) => (
                <View key={i} style={s.stepItemRow}>
                  <View style={s.stepNumCircle}>
                    <Text style={s.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={s.stepItemText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={s.emptyResult}>
            <Text style={s.emptyResultText}>
              Enter values above to calculate
            </Text>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 2 — DILUTION CALCULATOR  (C1V1 = C2V2)
// ─────────────────────────────────────────────────────────────────────────────
function DilutionTool() {
  const [c1, setC1] = useState("");
  const [v2, setV2] = useState("");
  const [c2, setC2] = useState("");
  const [concUnit, setConcUnit] = useState("mM");
  const [volUnit, setVolUnit] = useState("mL");

  const result = useMemo(() => {
    const C1 = parseFloat(c1);
    const V2 = parseFloat(v2);
    const C2 = parseFloat(c2);
    if (!C1 || !V2 || !C2 || C1 <= 0 || C2 <= 0 || V2 <= 0) return null;
    if (C2 >= C1)
      return { error: "Target concentration must be less than stock." };
    const V1 = (C2 * V2) / C1;
    const diluent = V2 - V1;
    const df = C1 / C2;
    return {
      V1: V1.toFixed(3),
      diluent: diluent.toFixed(3),
      df: df.toFixed(1),
    };
  }, [c1, v2, c2]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={s.toolBody}>
        <BlackPill label="DILUTION CALCULATOR" />
        <Text style={s.toolDesc}>
          C₁V₁ = C₂V₂ · Find volume of stock needed.
        </Text>

        <SelectRow
          label="Concentration Unit"
          options={["M", "mM", "μM", "nM", "%", "mg/mL"]}
          selected={concUnit}
          onSelect={setConcUnit}
        />
        <SelectRow
          label="Volume Unit"
          options={["μL", "mL", "L"]}
          selected={volUnit}
          onSelect={setVolUnit}
        />

        <View style={s.inputsGrid}>
          <InputField
            label={`Stock Conc. (C₁)`}
            value={c1}
            onChangeText={setC1}
            unit={concUnit}
          />
          <InputField
            label={`Target Conc. (C₂)`}
            value={c2}
            onChangeText={setC2}
            unit={concUnit}
          />
        </View>
        <InputField
          label={`Final Volume (V₂)`}
          value={v2}
          onChangeText={setV2}
          unit={volUnit}
        />

        {result ? (
          "error" in result ? (
            <View style={[s.errorBox]}>
              <HugeiconsIcon icon={Cancel01Icon} size={14} color={C.red} />
              <Text style={s.errorText}>{result.error}</Text>
            </View>
          ) : (
            <View style={s.resultsSection}>
              <ResultBox
                label={`Volume of Stock (V₁)`}
                value={result.V1}
                unit={volUnit}
                color={C.blue}
              />
              <View style={s.resultRowTwo}>
                <ResultBox
                  label="Add Diluent"
                  value={result.diluent}
                  unit={volUnit}
                />
                <ResultBox
                  label="Dilution Factor"
                  value={`1 : ${result.df}`}
                  color={C.green}
                />
              </View>
              <View style={[s.protocolBox]}>
                <HugeiconsIcon icon={Flask} size={14} color={C.purple} />
                <Text style={s.protocolBoxText}>
                  Pipette{" "}
                  <Text style={s.bold}>
                    {result.V1} {volUnit}
                  </Text>{" "}
                  of stock into a tube, then add{" "}
                  <Text style={s.bold}>
                    {result.diluent} {volUnit}
                  </Text>{" "}
                  of diluent. Mix gently by inversion.
                </Text>
              </View>
            </View>
          )
        ) : (
          <View style={s.emptyResult}>
            <Text style={s.emptyResultText}>
              Enter stock & target concentrations
            </Text>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 3 — DNA/RNA CONCENTRATION (A260)
// ─────────────────────────────────────────────────────────────────────────────
function NanodropTool() {
  const [a260, setA260] = useState("");
  const [a280, setA280] = useState("");
  const [a230, setA230] = useState("");
  const [type, setType] = useState("dsDNA");
  const [dilution, setDilution] = useState("1");

  const FACTORS: Record<string, number> = {
    dsDNA: 50,
    ssDNA: 33,
    ssRNA: 40,
    Oligo: 30,
  };

  const result = useMemo(() => {
    const abs = parseFloat(a260);
    const abs280 = parseFloat(a280);
    const abs230 = parseFloat(a230);
    const dil = parseFloat(dilution) || 1;
    if (!abs || abs <= 0) return null;
    const factor = FACTORS[type];
    const conc = abs * factor * dil;
    const ratio280 = abs280 > 0 ? (abs / abs280).toFixed(2) : null;
    const ratio230 = abs230 > 0 ? (abs / abs230).toFixed(2) : null;
    const r280num = ratio280 ? parseFloat(ratio280) : null;
    const purity280 = r280num
      ? r280num >= 1.8 && r280num <= 2.0
        ? "ok"
        : r280num < 1.8
          ? "warn-low"
          : "warn-high"
      : null;
    return { conc, ratio280, ratio230, purity280 };
  }, [a260, a280, a230, type, dilution]);

  const purityLabel: Record<
    string,
    { label: string; color: string; bg: string }
  > = {
    ok: { label: "Pure", color: C.green, bg: C.greenBg },
    "warn-low": {
      label: "Protein / RNA contamination",
      color: C.amber,
      bg: C.amberBg,
    },
    "warn-high": { label: "High — possible issue", color: C.red, bg: C.redBg },
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={s.toolBody}>
        <BlackPill label="DNA / RNA CONCENTRATION" />
        <Text style={s.toolDesc}>
          Calculate concentration from A260 absorbance (NanoDrop /
          spectrophotometer).
        </Text>

        <SelectRow
          label="Molecule Type"
          options={["dsDNA", "ssDNA", "ssRNA", "Oligo"]}
          selected={type}
          onSelect={setType}
        />

        <View style={s.inputsGrid}>
          <InputField
            label="A₂₆₀"
            value={a260}
            onChangeText={setA260}
            placeholder="0.000"
          />
          <InputField
            label="A₂₈₀"
            value={a280}
            onChangeText={setA280}
            placeholder="0.000"
          />
          <InputField
            label="A₂₃₀"
            value={a230}
            onChangeText={setA230}
            placeholder="0.000"
          />
          <InputField
            label="Dilution Factor"
            value={dilution}
            onChangeText={setDilution}
            placeholder="1"
          />
        </View>

        {result ? (
          <View style={s.resultsSection}>
            <ResultBox
              label="Concentration"
              value={
                result.conc >= 1000
                  ? (result.conc / 1000).toFixed(2)
                  : result.conc.toFixed(1)
              }
              unit={result.conc >= 1000 ? "μg/mL" : "ng/μL"}
              color={C.teal}
            />
            <View style={s.resultRowTwo}>
              {result.ratio280 && (
                <ResultBox
                  label="A₂₆₀/A₂₈₀"
                  value={result.ratio280}
                  color={
                    result.purity280 === "ok"
                      ? C.green
                      : result.purity280 === "warn-low"
                        ? C.amber
                        : C.red
                  }
                />
              )}
              {result.ratio230 && (
                <ResultBox label="A₂₆₀/A₂₃₀" value={result.ratio230} />
              )}
            </View>
            {result.purity280 && (
              <View
                style={[
                  s.purityBanner,
                  { backgroundColor: purityLabel[result.purity280].bg },
                ]}
              >
                <HugeiconsIcon
                  icon={
                    result.purity280 === "ok"
                      ? CheckmarkCircle02Icon
                      : Cancel01Icon
                  }
                  size={14}
                  color={purityLabel[result.purity280].color}
                />
                <Text
                  style={[
                    s.purityText,
                    { color: purityLabel[result.purity280].color },
                  ]}
                >
                  A₂₆₀/A₂₈₀ = {result.ratio280} ·{" "}
                  {purityLabel[result.purity280].label}
                </Text>
              </View>
            )}
            <View style={s.refRow}>
              <Text style={s.refText}>
                Reference: dsDNA=50 · ssRNA=40 · ssDNA=33 · Oligo=30
              </Text>
            </View>
          </View>
        ) : (
          <View style={s.emptyResult}>
            <Text style={s.emptyResultText}>
              Enter A₂₆₀ absorbance to calculate
            </Text>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 4 — PCR MASTER MIX
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_COMPONENTS = [
  { name: "10× Buffer", stockConc: "10×", finalConc: "1×", vol: 2.5 },
  { name: "dNTPs", stockConc: "10 mM", finalConc: "0.2 mM", vol: 0.5 },
  { name: "Forward Primer", stockConc: "10 μM", finalConc: "0.4 μM", vol: 1.0 },
  { name: "Reverse Primer", stockConc: "10 μM", finalConc: "0.4 μM", vol: 1.0 },
  {
    name: "Taq DNA Polymerase",
    stockConc: "5 U/μL",
    finalConc: "0.04 U/μL",
    vol: 0.2,
  },
  { name: "MgCl₂ (25 mM)", stockConc: "25 mM", finalConc: "1.5 mM", vol: 1.5 },
  { name: "Template DNA", stockConc: "50 ng", finalConc: "50 ng", vol: 1.0 },
];

function MasterMixTool() {
  const [reactions, setReactions] = useState("10");
  const [rxnVol, setRxnVol] = useState("25");
  const [overage, setOverage] = useState("10");

  const n = parseFloat(reactions) || 1;
  const vol = parseFloat(rxnVol) || 25;
  const ov = parseFloat(overage) || 10;
  const multiplier = n * (1 + ov / 100);

  const totalWater = vol - DEFAULT_COMPONENTS.reduce((a, c) => a + c.vol, 0);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={s.toolBody}>
        <BlackPill label="PCR MASTER MIX" />
        <Text style={s.toolDesc}>
          Scale reaction components for multiple samples with overage.
        </Text>

        <View style={s.inputsGrid}>
          <InputField
            label="Reactions"
            value={reactions}
            onChangeText={setReactions}
            placeholder="10"
          />
          <InputField
            label="Rxn Volume"
            value={rxnVol}
            onChangeText={setRxnVol}
            unit="μL"
            placeholder="25"
          />
          <InputField
            label="Overage %"
            value={overage}
            onChangeText={setOverage}
            unit="%"
            placeholder="10"
          />
        </View>

        {/* Results table */}
        <View style={s.mmTable}>
          {/* Header */}
          <View style={[s.mmRow, s.mmHeader]}>
            <Text style={[s.mmCell, s.mmCellName, s.mmHeaderText]}>
              Component
            </Text>
            <Text style={[s.mmCell, s.mmCellVol, s.mmHeaderText]}>Per rxn</Text>
            <Text style={[s.mmCell, s.mmCellTotal, s.mmHeaderText]}>Total</Text>
          </View>

          {DEFAULT_COMPONENTS.map((comp, i) => {
            const totalVol = comp.vol * multiplier;
            return (
              <View key={i} style={[s.mmRow, i % 2 === 1 && s.mmRowAlt]}>
                <View style={[s.mmCell, s.mmCellName]}>
                  <Text style={s.mmCompName}>{comp.name}</Text>
                  <Text style={s.mmCompConc}>
                    {comp.stockConc} → {comp.finalConc}
                  </Text>
                </View>
                <Text style={[s.mmCell, s.mmCellVol, s.mmVolText]}>
                  {comp.vol} μL
                </Text>
                <Text style={[s.mmCell, s.mmCellTotal, s.mmTotalText]}>
                  {totalVol.toFixed(1)} μL
                </Text>
              </View>
            );
          })}

          {/* Water row */}
          <View
            style={[s.mmRow, DEFAULT_COMPONENTS.length % 2 === 1 && s.mmRowAlt]}
          >
            <View style={[s.mmCell, s.mmCellName]}>
              <Text style={s.mmCompName}>Nuclease-free Water</Text>
              <Text style={s.mmCompConc}>to final volume</Text>
            </View>
            <Text style={[s.mmCell, s.mmCellVol, s.mmVolText]}>
              {totalWater.toFixed(1)} μL
            </Text>
            <Text style={[s.mmCell, s.mmCellTotal, s.mmTotalText]}>
              {(totalWater * multiplier).toFixed(1)} μL
            </Text>
          </View>

          {/* Total row */}
          <View style={[s.mmRow, s.mmTotalRow]}>
            <Text style={[s.mmCell, s.mmCellName, s.mmTotalLabel]}>TOTAL</Text>
            <Text style={[s.mmCell, s.mmCellVol, s.mmTotalLabel]}>
              {vol} μL
            </Text>
            <Text style={[s.mmCell, s.mmCellTotal, s.mmTotalLabel]}>
              {(vol * multiplier).toFixed(1)} μL
            </Text>
          </View>
        </View>

        <View style={s.mmNote}>
          <HugeiconsIcon
            icon={InformationCircleIcon}
            size={13}
            color={C.blue}
          />
          <Text style={s.mmNoteText}>
            Preparing for <Text style={s.bold}>{n}</Text> reactions + {overage}%
            overage = <Text style={s.bold}>{multiplier.toFixed(1)}×</Text> scale
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 5 — UNIT CONVERTER
// ─────────────────────────────────────────────────────────────────────────────
type UnitCategory = "Mass" | "Volume" | "Concentration" | "Temperature";

const UNIT_DEFS: Record<
  UnitCategory,
  {
    units: string[];
    toBase: Record<string, number | ((v: number) => number)>;
    fromBase: Record<string, number | ((v: number) => number)>;
    base: string;
  }
> = {
  Mass: {
    units: ["kg", "g", "mg", "μg", "ng", "pg"],
    base: "g",
    toBase: { kg: 1000, g: 1, mg: 0.001, μg: 1e-6, ng: 1e-9, pg: 1e-12 },
    fromBase: { kg: 0.001, g: 1, mg: 1000, μg: 1e6, ng: 1e9, pg: 1e12 },
  },
  Volume: {
    units: ["L", "mL", "μL", "nL"],
    base: "μL",
    toBase: { L: 1e6, mL: 1000, μL: 1, nL: 0.001 },
    fromBase: { L: 1e-6, mL: 0.001, μL: 1, nL: 1000 },
  },
  Concentration: {
    units: ["M", "mM", "μM", "nM", "pM", "mg/mL", "μg/mL", "ng/mL"],
    base: "nM",
    toBase: {
      M: 1e9,
      mM: 1e6,
      μM: 1e3,
      nM: 1,
      pM: 0.001,
      "mg/mL": 1e6,
      "μg/mL": 1e3,
      "ng/mL": 1,
    },
    fromBase: {
      M: 1e-9,
      mM: 1e-6,
      μM: 1e-3,
      nM: 1,
      pM: 1000,
      "mg/mL": 1e-6,
      "μg/mL": 1e-3,
      "ng/mL": 1,
    },
  },
  Temperature: {
    units: ["°C", "°F", "K"],
    base: "°C",
    toBase: {
      "°C": (v: number) => v,
      "°F": (v: number) => ((v - 32) * 5) / 9,
      K: (v: number) => v - 273.15,
    },
    fromBase: {
      "°C": (v: number) => v,
      "°F": (v: number) => (v * 9) / 5 + 32,
      K: (v: number) => v + 273.15,
    },
  },
};

function UnitConverterTool() {
  const [category, setCategory] = useState<UnitCategory>("Mass");
  const [fromUnit, setFromUnit] = useState("g");
  const [toUnit, setToUnit] = useState("mg");
  const [value, setValue] = useState("");

  const def = UNIT_DEFS[category];

  const converted = useMemo(() => {
    const v = parseFloat(value);
    if (isNaN(v)) return null;
    const tb = def.toBase[fromUnit];
    const fb = def.fromBase[toUnit];
    const base = typeof tb === "function" ? tb(v) : v * tb;
    const result = typeof fb === "function" ? fb(base) : base * fb;
    if (!isFinite(result)) return null;
    const abs = Math.abs(result);
    const display =
      abs === 0
        ? "0"
        : abs >= 1000
          ? result.toExponential(3)
          : abs >= 0.001
            ? result.toPrecision(5)
            : result.toExponential(3);
    return display;
  }, [value, fromUnit, toUnit, category, def]);

  const handleCategoryChange = (cat: UnitCategory) => {
    setCategory(cat);
    const units = UNIT_DEFS[cat].units;
    setFromUnit(units[0]);
    setToUnit(units[1] ?? units[0]);
    setValue("");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={s.toolBody}>
        <BlackPill label="UNIT CONVERTER" />
        <Text style={s.toolDesc}>
          Convert between common lab units instantly.
        </Text>

        <SelectRow
          label="Category"
          options={["Mass", "Volume", "Concentration", "Temperature"]}
          selected={category}
          onSelect={(v) => handleCategoryChange(v as UnitCategory)}
        />

        <InputField
          label="Value"
          value={value}
          onChangeText={setValue}
          placeholder="Enter value"
        />

        <View style={s.unitFromToRow}>
          <View style={s.unitFromTo}>
            <Text style={s.inputLabel}>From</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={s.selectOptions}>
                {def.units.map((u) => (
                  <Pressable
                    key={u}
                    style={[s.selectChip, fromUnit === u && s.selectChipActive]}
                    onPress={() => setFromUnit(u)}
                  >
                    <Text
                      style={[
                        s.selectChipText,
                        fromUnit === u && s.selectChipTextActive,
                      ]}
                    >
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
          <View style={s.unitArrow}>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={18}
              color={C.textMuted}
            />
          </View>
          <View style={s.unitFromTo}>
            <Text style={s.inputLabel}>To</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={s.selectOptions}>
                {def.units.map((u) => (
                  <Pressable
                    key={u}
                    style={[
                      s.selectChip,
                      toUnit === u && s.selectChipActiveGreen,
                    ]}
                    onPress={() => setToUnit(u)}
                  >
                    <Text
                      style={[
                        s.selectChipText,
                        toUnit === u && s.selectChipTextActive,
                      ]}
                    >
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {converted !== null ? (
          <View style={s.resultsSection}>
            <ResultBox
              label={`${value} ${fromUnit} =`}
              value={converted}
              unit={toUnit}
              color={C.green}
            />
          </View>
        ) : (
          <View style={s.emptyResult}>
            <Text style={s.emptyResultText}>Enter a value to convert</Text>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 6 — BUFFER pH CALCULATOR (Henderson-Hasselbalch)
// ─────────────────────────────────────────────────────────────────────────────
const BUFFERS = [
  { name: "Phosphate (PBS)", pKa: 7.2 },
  { name: "HEPES", pKa: 7.5 },
  { name: "Tris-HCl", pKa: 8.1 },
  { name: "MOPS", pKa: 7.2 },
  { name: "Citrate", pKa: 6.4 },
  { name: "Acetate", pKa: 4.76 },
  { name: "Carbonate", pKa: 10.3 },
  { name: "Custom", pKa: 0 },
];

function BufferTool() {
  const [bufferIdx, setBufferIdx] = useState(0);
  const [customPka, setCustomPka] = useState("");
  const [targetPh, setTargetPh] = useState("7.4");
  const [totalVol, setTotalVol] = useState("100");

  const pKa =
    bufferIdx < BUFFERS.length - 1
      ? BUFFERS[bufferIdx].pKa
      : parseFloat(customPka) || 7.0;

  const result = useMemo(() => {
    const pH = parseFloat(targetPh);
    const vol = parseFloat(totalVol) || 100;
    if (!pH || !pKa) return null;
    const ratio = Math.pow(10, pH - pKa); // [A-] / [HA]
    const fracBase = ratio / (1 + ratio);
    const fracAcid = 1 - fracBase;
    const rangeOk = Math.abs(pH - pKa) <= 1.5;
    return {
      ratio: ratio.toFixed(3),
      basePercent: (fracBase * 100).toFixed(1),
      acidPercent: (fracAcid * 100).toFixed(1),
      baseVol: (fracBase * vol).toFixed(1),
      acidVol: (fracAcid * vol).toFixed(1),
      rangeOk,
      vol,
    };
  }, [targetPh, totalVol, pKa]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={s.toolBody}>
        <BlackPill label="BUFFER pH (Henderson-Hasselbalch)" />
        <Text style={s.toolDesc}>
          pH = pKₐ + log([A⁻]/[HA]) · Calculate acid/base mixing ratios.
        </Text>

        <View style={s.bufferList}>
          {BUFFERS.map((b, i) => (
            <Pressable
              key={i}
              style={[s.bufferChip, bufferIdx === i && s.bufferChipActive]}
              onPress={() => setBufferIdx(i)}
            >
              <Text
                style={[
                  s.bufferChipText,
                  bufferIdx === i && s.bufferChipTextActive,
                ]}
              >
                {b.name}
              </Text>
              {i < BUFFERS.length - 1 && (
                <Text
                  style={[
                    s.bufferPka,
                    bufferIdx === i && { color: "rgba(255,255,255,0.65)" },
                  ]}
                >
                  pKₐ {b.pKa}
                </Text>
              )}
            </Pressable>
          ))}
        </View>

        {bufferIdx === BUFFERS.length - 1 && (
          <InputField
            label="Custom pKₐ"
            value={customPka}
            onChangeText={setCustomPka}
            placeholder="7.0"
          />
        )}

        <View style={s.inputsGrid}>
          <InputField
            label="Target pH"
            value={targetPh}
            onChangeText={setTargetPh}
            placeholder="7.4"
          />
          <InputField
            label="Total Volume"
            value={totalVol}
            onChangeText={setTotalVol}
            unit="mL"
            placeholder="100"
          />
        </View>

        {result && (
          <View style={s.resultsSection}>
            {!result.rangeOk && (
              <View style={[s.errorBox, { marginBottom: 12 }]}>
                <HugeiconsIcon icon={Cancel01Icon} size={13} color={C.amber} />
                <Text style={[s.errorText, { color: C.amber }]}>
                  pH is {Math.abs(parseFloat(targetPh) - pKa).toFixed(1)} units
                  from pKₐ — buffering capacity will be reduced.
                </Text>
              </View>
            )}
            <ResultBox
              label="[Base] / [Acid] Ratio"
              value={`1 : ${(1 / parseFloat(result.ratio)).toFixed(3)}`}
              color={C.purple}
            />
            <View style={s.resultRowTwo}>
              <ResultBox
                label="Base Form"
                value={`${result.basePercent}%`}
                unit={`${result.baseVol} mL`}
                color={C.blue}
              />
              <ResultBox
                label="Acid Form"
                value={`${result.acidPercent}%`}
                unit={`${result.acidVol} mL`}
                color={C.amber}
              />
            </View>
            {/* Visual ratio bar */}
            <View style={s.ratioBarWrap}>
              <View style={s.ratioBar}>
                <View
                  style={[
                    s.ratioFillBase,
                    { flex: parseFloat(result.basePercent) },
                  ]}
                />
                <View
                  style={[
                    s.ratioFillAcid,
                    { flex: parseFloat(result.acidPercent) },
                  ]}
                />
              </View>
              <View style={s.ratioBarLabels}>
                <Text style={[s.ratioBarLabel, { color: C.blue }]}>
                  Base {result.basePercent}%
                </Text>
                <Text style={[s.ratioBarLabel, { color: C.amber }]}>
                  Acid {result.acidPercent}%
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL 7 — LOOK UP / REFERENCE CARDS
// ─────────────────────────────────────────────────────────────────────────────
const REFERENCE_CARDS = [
  {
    title: "PCR Troubleshooting",
    icon: TestTube01Icon,
    color: C.purple,
    bg: C.purpleBg,
    items: [
      {
        problem: "No bands",
        cause: "No template / wrong primers / polymerase inactive",
      },
      {
        problem: "Faint bands",
        cause: "Low template conc. / wrong annealing temp",
      },
      {
        problem: "Smearing",
        cause: "Too much template / low annealing temp / primer dimers",
      },
      {
        problem: "Multiple bands",
        cause: "Non-specific priming / low annealing temp",
      },
      { problem: "Wrong size", cause: "Mispriming / genomic contamination" },
    ],
  },
  {
    title: "Western Blot Tips",
    icon: Layers01Icon,
    color: C.amber,
    bg: C.amberBg,
    items: [
      {
        problem: "High background",
        cause: "Insufficient blocking / ab too concentrated",
      },
      {
        problem: "No signal",
        cause: "Protein not expressed / transfer failure",
      },
      {
        problem: "Multiple bands",
        cause: "Non-specific ab binding / protease degradation",
      },
      {
        problem: "Uneven signal",
        cause: "Uneven transfer / antibody settling",
      },
    ],
  },
  {
    title: "ELISA Reference",
    icon: Beaker,
    color: C.green,
    bg: C.greenBg,
    items: [
      {
        problem: "High OD blank",
        cause: "Incomplete washing / substrate contamination",
      },
      {
        problem: "Low signal all",
        cause: "Plate dried out / detection ab failure",
      },
      {
        problem: "Poor curve fit",
        cause: "Standard preparation error / expired reagents",
      },
      { problem: "High CV", cause: "Pipetting inconsistency / edge effects" },
    ],
  },
  {
    title: "Gel Electrophoresis",
    icon: ChemistryIcon,
    color: C.blue,
    bg: C.blueBg,
    items: [
      {
        problem: "Diffuse bands",
        cause: "Low voltage / degraded DNA / overloaded lanes",
      },
      {
        problem: "Bands running odd",
        cause: "Buffer depletion / gel percentage wrong",
      },
      {
        problem: "No bands seen",
        cause: "No EtBr / DNA degraded / wrong loading",
      },
    ],
  },
  {
    title: "Common Lab Conversions",
    icon: Calculator01Icon,
    color: C.teal,
    bg: C.tealBg,
    items: [
      { problem: "1 OD₆₀₀ (E. coli)", cause: "≈ 8 × 10⁸ cells/mL" },
      { problem: "1 μg/μL DNA", cause: "= 1 mg/mL = 1 g/L" },
      { problem: "1 M NaCl (58.44)", cause: "= 58.44 g/L" },
      { problem: "1 kDa protein", cause: "≈ 9 amino acids" },
      { problem: "1 unit enzyme", cause: "= 1 μmol substrate/min at 25°C" },
    ],
  },
];

function LookUpTool() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return REFERENCE_CARDS;
    const q = query.toLowerCase();
    return REFERENCE_CARDS.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.items.some(
          (i) =>
            i.problem.toLowerCase().includes(q) ||
            i.cause.toLowerCase().includes(q),
        ),
    );
  }, [query]);

  return (
    <View style={s.toolBody}>
      <BlackPill label="LOOK UP REFERENCE" />
      <Text style={s.toolDesc}>
        Quick-access troubleshooting guides and lab reference cards.
      </Text>

      {/* Search */}
      <View style={[s.lookupSearch, SH_SM]}>
        <HugeiconsIcon icon={Search01Icon} size={15} color={C.textMuted} />
        <TextInput
          style={s.lookupSearchInput}
          placeholder="Search problems, causes…"
          placeholderTextColor={C.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable hitSlop={8} onPress={() => setQuery("")}>
            <HugeiconsIcon icon={Cancel01Icon} size={13} color={C.textMuted} />
          </Pressable>
        )}
      </View>

      <View style={s.refCards}>
        {filtered.map((card, ci) => (
          <View key={ci} style={[s.refCard, SH_SM]}>
            {/* Card header */}
            <Pressable
              style={s.refCardHeader}
              onPress={() => setExpanded(expanded === ci ? null : ci)}
            >
              <View style={[s.refCardIcon, { backgroundColor: card.bg }]}>
                <HugeiconsIcon icon={card.icon} size={16} color={card.color} />
              </View>
              <Text style={s.refCardTitle}>{card.title}</Text>
              <View style={[s.refCardCount, { backgroundColor: card.bg }]}>
                <Text style={[s.refCardCountText, { color: card.color }]}>
                  {card.items.length}
                </Text>
              </View>
              <HugeiconsIcon
                icon={expanded === ci ? Cancel01Icon : ArrowRight01Icon}
                size={14}
                color={C.textMuted}
              />
            </Pressable>

            {/* Expanded items */}
            {expanded === ci && (
              <View style={s.refCardItems}>
                {card.items.map((item, ii) => (
                  <View
                    key={ii}
                    style={[s.refItem, ii % 2 === 1 && s.refItemAlt]}
                  >
                    <View
                      style={[s.refItemDot, { backgroundColor: card.color }]}
                    />
                    <View style={s.refItemBody}>
                      <Text style={s.refItemProblem}>{item.problem}</Text>
                      <Text style={s.refItemCause}>{item.cause}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL REGISTRY
// ─────────────────────────────────────────────────────────────────────────────
const TOOLS = [
  {
    id: "molarity",
    label: "Molarity",
    sublabel: "Mass · MW · Volume",
    icon: Flask,
    color: C.purple,
    bg: C.purpleBg,
    Component: MolarityTool,
  },
  {
    id: "dilution",
    label: "Dilution",
    sublabel: "C₁V₁ = C₂V₂",
    icon: WaterfallDown01Icon,
    color: C.blue,
    bg: C.blueBg,
    Component: DilutionTool,
  },
  {
    id: "nanodrop",
    label: "DNA/RNA Conc.",
    sublabel: "A₂₆₀ NanoDrop",
    icon: Microscope,
    color: C.teal,
    bg: C.tealBg,
    Component: NanodropTool,
  },
  {
    id: "mastermix",
    label: "Master Mix",
    sublabel: "PCR scale-up",
    icon: TestTube01Icon,
    color: C.green,
    bg: C.greenBg,
    Component: MasterMixTool,
  },
  {
    id: "convert",
    label: "Unit Convert",
    sublabel: "Mass · Vol · Conc.",
    icon: Scale,
    color: C.amber,
    bg: C.amberBg,
    Component: UnitConverterTool,
  },
  {
    id: "buffer",
    label: "Buffer pH",
    sublabel: "Henderson-Hasselbalch",
    icon: Beaker,
    color: C.pink,
    bg: C.pinkBg,
    Component: BufferTool,
  },
  {
    id: "lookup",
    label: "Look Up",
    sublabel: "Troubleshooting ref.",
    icon: BookOpen01Icon,
    color: C.red,
    bg: C.redBg,
    Component: LookUpTool,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function ToolsScreen() {
  const insets = useSafeAreaInsets();
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["75%", "95%"], []);

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

  const openTool = (id: string) => {
    setActiveToolId(id);
    sheetRef.current?.present();
  };

  const activeTool = TOOLS.find((t) => t.id === activeToolId);

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.sectionTitle}>LAB UTILITIES</Text>
            <Text style={s.headerTitle}>Tools</Text>
          </View>
          <View style={[s.headerIcon, SH_DARK]}>
            <HugeiconsIcon icon={ToolsIcon} size={20} color={C.white} />
          </View>
        </View>

        {/* ── Featured tool (Molarity — most used) ── */}
        <Pressable
          style={({ pressed }) => [
            s.featuredCard,
            SH_MD,
            pressed && { opacity: 0.88 },
          ]}
          onPress={() => openTool("molarity")}
        >
          <View style={s.featuredLeft}>
            <View style={s.featuredIconWrap}>
              <HugeiconsIcon icon={Flask} size={22} color={C.white} />
            </View>
            <View style={s.featuredText}>
              <Text style={s.featuredLabel}>Molarity Calculator</Text>
              <Text style={s.featuredSublabel}>
                Most used tool · Mass, MW, Volume → M
              </Text>
            </View>
          </View>
          <View style={s.featuredArrow}>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} color={C.white} />
          </View>
        </Pressable>

        {/* ── Tool grid ── */}
        <Text style={s.gridLabel}>ALL TOOLS</Text>
        <View style={s.toolGrid}>
          {TOOLS.map((tool) => (
            <Pressable
              key={tool.id}
              style={({ pressed }) => [
                s.toolCard,
                { backgroundColor: tool.bg },
                SH_SM,
                pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] },
              ]}
              onPress={() => openTool(tool.id)}
            >
              <View
                style={[s.toolIconWrap, { backgroundColor: tool.color + "22" }]}
              >
                <HugeiconsIcon
                  icon={tool.icon}
                  size={20}
                  color={tool.color}
                  strokeWidth={1.9}
                />
              </View>
              <Text style={[s.toolCardLabel, { color: C.textPrimary }]}>
                {tool.label}
              </Text>
              <Text style={[s.toolCardSublabel, { color: tool.color }]}>
                {tool.sublabel}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Recent calculations strip ── */}
        <Text style={s.gridLabel}>QUICK REFERENCE</Text>
        <View style={s.quickRefRow}>
          {[
            { label: "1 mM NaCl", sub: "= 0.0584 mg/mL", color: C.teal },
            {
              label: "Good A260/280",
              sub: "1.8 – 2.0 (DNA)",
              color: C.green,
            },
            { label: "Ideal PCR eff.", sub: "90 – 110%", color: C.purple },
            { label: "Ideal pH buf.", sub: "pKₐ ± 1.0", color: C.pink },
          ].map((q, i) => (
            <View key={i} style={[s.quickRefCard, SH_SM]}>
              <Text style={[s.quickRefLabel, { color: q.color }]}>
                {q.label}
              </Text>
              <Text style={s.quickRefSub}>{q.sub}</Text>
            </View>
          ))}
        </View>

        {/* ── AI banner ── */}
        <Pressable style={[s.aiBanner, SH_MD]}>
          <View style={s.aiBannerIcon}>
            <HugeiconsIcon icon={SparklesIcon} size={14} color={C.white} />
          </View>
          <View style={s.aiBannerText}>
            <Text style={s.aiBannerTitle}>Ask AI for calculations</Text>
            <Text style={s.aiBannerSub}>
              Describe your experiment — AI will run the numbers
            </Text>
          </View>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={15}
            color={C.textMuted}
          />
        </Pressable>
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════════
            TOOL BOTTOM SHEET
        ══════════════════════════════════════════════════════════════════ */}
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={s.sheetHandle}
        backgroundStyle={s.sheetBg}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetScrollView
          contentContainerStyle={s.sheetContent}
          keyboardShouldPersistTaps="handled"
        >
          {activeTool && (
            <>
              {/* Sheet header */}
              <View style={s.sheetHeader}>
                <View
                  style={[
                    s.sheetHeaderIcon,
                    { backgroundColor: activeTool.bg },
                  ]}
                >
                  <HugeiconsIcon
                    icon={activeTool.icon}
                    size={18}
                    color={activeTool.color}
                  />
                </View>
                <View style={s.sheetHeaderText}>
                  <Text style={s.sheetTitle}>{activeTool.label}</Text>
                  <Text style={s.sheetSubtitle}>{activeTool.sublabel}</Text>
                </View>
                <Pressable
                  style={s.sheetClose}
                  onPress={() => sheetRef.current?.dismiss()}
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={14}
                    color={C.textMuted}
                  />
                </Pressable>
              </View>

              <Divider />

              {/* Render active tool */}
              <activeTool.Component />
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 12 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionTitle: {
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
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
  },

  // Featured card
  featuredCard: {
    backgroundColor: C.black,
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  featuredLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featuredIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  featuredText: { flex: 1, gap: 3 },
  featuredLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: C.white,
    letterSpacing: -0.2,
  },
  featuredSublabel: { fontSize: 12.5, color: "rgba(255,255,255,0.55)" },
  featuredArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Tool grid
  gridLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  toolGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  toolCard: {
    width: "47%",
    borderRadius: 22,
    padding: 16,
    gap: 10,
  },
  toolIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  toolCardLabel: {
    fontSize: 14.5,
    fontWeight: "700",
    letterSpacing: -0.15,
  },
  toolCardSublabel: { fontSize: 11.5, lineHeight: 16 },

  // Quick ref row
  quickRefRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  quickRefCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 12,
    flex: 1,
    minWidth: "45%",
    gap: 4,
  },
  quickRefLabel: { fontSize: 13, fontWeight: "700" },
  quickRefSub: { fontSize: 11.5, color: C.textMuted, lineHeight: 16 },

  // AI banner
  aiBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 8,
  },
  aiBannerIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
  },
  aiBannerText: { flex: 1 },
  aiBannerTitle: { fontSize: 14, fontWeight: "700", color: C.textPrimary },
  aiBannerSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  // Sheet
  sheetBg: { backgroundColor: C.bg, borderRadius: 32 },
  sheetHandle: { backgroundColor: "#e5e5ea", width: 40 },
  sheetContent: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 60 },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 4,
  },
  sheetHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetHeaderText: { flex: 1 },
  sheetTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.4,
  },
  sheetSubtitle: { fontSize: 12.5, color: C.textMuted, marginTop: 2 },
  sheetClose: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },

  // Shared tool body
  toolBody: { paddingTop: 16, gap: 16 },
  toolDesc: {
    fontSize: 13.5,
    color: C.textMuted,
    lineHeight: 19,
    marginTop: -8,
  },

  divider: { height: 1, backgroundColor: C.card, marginVertical: 4 },

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

  // Input fields
  inputsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  inputGroup: { flex: 1, minWidth: "44%", gap: 6 },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    gap: 6,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: C.textPrimary,
    paddingVertical: 12,
  },
  inputUnitBadge: {
    backgroundColor: C.bg,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  inputUnitText: { fontSize: 11, fontWeight: "700", color: C.textMuted },

  // Select chips
  selectGroup: { gap: 8 },
  selectOptions: { flexDirection: "row", gap: 8 },
  selectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.card,
    borderRadius: 12,
  },
  selectChipActive: { backgroundColor: C.black },
  selectChipActiveGreen: { backgroundColor: C.green },
  selectChipText: { fontSize: 13, fontWeight: "600", color: C.textPrimary },
  selectChipTextActive: { color: C.white },

  // Results
  resultsSection: { gap: 10, marginTop: 4 },
  resultBox: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: C.black,
    gap: 4,
  },
  resultLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 0.8,
  },
  resultValueRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  resultValue: { fontSize: 24, fontWeight: "700", letterSpacing: -0.5 },
  resultUnit: { fontSize: 13, color: C.textMuted, fontWeight: "600" },
  resultNote: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  resultRowTwo: { flexDirection: "row", gap: 10 },

  // Error / protocol boxes
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: C.redBg,
    borderRadius: 12,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13.5, color: C.red, lineHeight: 19 },
  protocolBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: C.purpleBg,
    borderRadius: 12,
    padding: 12,
  },
  protocolBoxText: {
    flex: 1,
    fontSize: 13.5,
    color: C.textSecondary,
    lineHeight: 20,
  },
  bold: { fontWeight: "700", color: C.textPrimary },

  // Prep steps
  stepsList: { gap: 10, marginTop: 8 },
  stepItemRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepNumCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumText: { fontSize: 11, fontWeight: "800", color: C.white },
  stepItemText: {
    flex: 1,
    fontSize: 13.5,
    color: C.textSecondary,
    lineHeight: 20,
  },

  // Purity banner
  purityBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 12,
  },
  purityText: { flex: 1, fontSize: 13, fontWeight: "600" },

  // Ref row
  refRow: { paddingTop: 4 },
  refText: { fontSize: 11.5, color: C.textMuted, lineHeight: 18 },

  // Master mix table
  mmTable: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: C.card,
    marginTop: 4,
  },
  mmRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  mmRowAlt: { backgroundColor: "#ededf2" },
  mmHeader: { backgroundColor: C.black, paddingVertical: 8 },
  mmTotalRow: { backgroundColor: C.blackSoft, paddingVertical: 12 },
  mmHeaderText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 0.8,
  },
  mmTotalLabel: { fontSize: 13, fontWeight: "800", color: C.white },
  mmCell: {},
  mmCellName: { flex: 3 },
  mmCellVol: { flex: 1.5, textAlign: "right" },
  mmCellTotal: { flex: 1.5, textAlign: "right" },
  mmCompName: { fontSize: 12.5, fontWeight: "600", color: C.textPrimary },
  mmCompConc: { fontSize: 10.5, color: C.textMuted, marginTop: 1 },
  mmVolText: { fontSize: 13, color: C.textSecondary, fontWeight: "500" },
  mmTotalText: { fontSize: 13, color: C.black, fontWeight: "700" },
  mmNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: C.blueBg,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  mmNoteText: { flex: 1, fontSize: 13, color: C.blue, lineHeight: 19 },

  // Unit converter
  unitFromToRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  unitFromTo: { flex: 1, gap: 6 },
  unitArrow: { paddingTop: 24, alignItems: "center" },

  // Buffer tool
  bufferList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bufferChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.card,
    borderRadius: 12,
    gap: 2,
  },
  bufferChipActive: { backgroundColor: C.black },
  bufferChipText: { fontSize: 12.5, fontWeight: "700", color: C.textPrimary },
  bufferChipTextActive: { color: C.white },
  bufferPka: { fontSize: 10, color: C.textMuted },

  // Ratio bar
  ratioBarWrap: { gap: 8 },
  ratioBar: {
    flexDirection: "row",
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: C.card,
  },
  ratioFillBase: { backgroundColor: C.blue },
  ratioFillAcid: { backgroundColor: C.amber },
  ratioBarLabels: { flexDirection: "row", justifyContent: "space-between" },
  ratioBarLabel: { fontSize: 11.5, fontWeight: "700" },

  // Look up
  lookupSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  lookupSearchInput: {
    flex: 1,
    fontSize: 14,
    color: C.textPrimary,
    padding: 0,
  },
  refCards: { gap: 10, marginTop: 4 },
  refCard: {
    backgroundColor: C.bg,
    borderRadius: 20,
    overflow: "hidden",
  },
  refCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  refCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  refCardTitle: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: "700",
    color: C.textPrimary,
  },
  refCardCount: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  refCardCountText: { fontSize: 11, fontWeight: "800" },
  refCardItems: { paddingBottom: 8 },
  refItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  refItemAlt: { backgroundColor: C.card },
  refItemDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  refItemBody: { flex: 1, gap: 2 },
  refItemProblem: { fontSize: 13.5, fontWeight: "700", color: C.textPrimary },
  refItemCause: { fontSize: 12.5, color: C.textMuted, lineHeight: 17 },
  emptyResult: {},
  emptyResultText: {},
});
