/**
 * profile.tsx
 *
 * Profile screen for Lab Assistant AI.
 *
 * Sections:
 *  - User hero card (avatar, name, role, institution, plan badge)
 *  - Activity stats (experiments, protocols, streak, success rate)
 *  - AI Preferences (explanation level, default assay, language)
 *  - Notification settings (toggles)
 *  - Report defaults (format, include sections)
 *  - Account & Security (change password, 2FA, connected devices)
 *  - Data & Privacy (export, delete data)
 *  - Help & Support
 *  - Logout
 *
 *  Each settings section opens in a Gorhom bottom sheet.
 */

import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/lib/api";
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import {
    ArrowRight01Icon,
    BookOpen01Icon,
    Cancel01Icon,
    CheckmarkCircle02Icon,
    Delete02Icon,
    Download02Icon,
    Edit02Icon,
    HelpCircleIcon,
    InformationCircleIcon,
    Key01Icon,
    Logout01Icon,
    Mic02Icon,
    Notification01Icon,
    PencilEdit02Icon,
    Share08Icon,
    ShieldCheck,
    Smartphone,
    SparklesIcon,
    UserIcon,
    Warning,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS  (matches rest of app exactly)
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
};

// ─────────────────────────────────────────────────────────────────────────────
// SHADOWS
// ─────────────────────────────────────────────────────────────────────────────
const SH_LG = Platform.select({
  ios: {
    shadowColor: "#1a1a2e",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  android: { elevation: 6 },
}) as any;
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
// DATA
// ─────────────────────────────────────────────────────────────────────────────
// Mock user data (fallback when not logged in)
const MOCK_USER = {
  name: "Dr. Amara Mwila",
  initials: "AM",
  role: "Principal Investigator",
  institution: "University of Zambia",
  department: "Dept. of Molecular Biology",
  email: "a.mwila@unza.zm",
  phone: "+260 97 123 4567",
  plan: "Pro",
  memberSince: "March 2024",
  lastActive: "Today",
};

// Helper function to get user data
const getUserData = (authUser: any) => {
  if (!authUser) return MOCK_USER;

  return {
    name: authUser.name || authUser.email.split("@")[0],
    initials: authUser.name
      ? authUser.name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .substring(0, 2)
      : "U",
    role: authUser.role || "RESEARCHER",
    institution: "University of Zambia", // Default, could be from user profile
    department: "Dept. of Molecular Biology", // Default
    email: authUser.email,
    phone: "+260 97 123 4567", // Default
    plan: authUser.plan || "FREE",
    memberSince: "March 2024", // Default, could be from createdAt
    lastActive: "Today", // Default, could be from lastLoginAt
  };
};

const STATS = [
  { label: "Experiments", value: "142", color: C.purple },
  { label: "Protocols", value: "38", color: C.blue },
  { label: "Day Streak", value: "12", color: C.amber },
  { label: "Success Rate", value: "88%", color: C.green },
];

const ACTIVITY_MONTHS = [
  { month: "Jan", runs: 8 },
  { month: "Feb", runs: 14 },
  { month: "Mar", runs: 11 },
  { month: "Apr", runs: 19 },
  { month: "May", runs: 22 },
  { month: "Jun", runs: 16 },
];

// ─────────────────────────────────────────────────────────────────────────────
// SMALL ATOMS
// ─────────────────────────────────────────────────────────────────────────────
function BlackPill({ label }: { label: string }) {
  return (
    <View style={st.blackPill}>
      <Text style={st.blackPillText}>{label}</Text>
    </View>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const isPro = plan === "Pro";
  return (
    <View style={[st.planBadge, { backgroundColor: isPro ? C.amber : C.card }]}>
      {isPro && <HugeiconsIcon icon={SparklesIcon} size={10} color={C.white} />}
      <Text
        style={[st.planBadgeText, { color: isPro ? C.white : C.textMuted }]}
      >
        {plan}
      </Text>
    </View>
  );
}

// A single settings row — icon + label + value/chevron
function SettingsRow({
  icon,
  iconColor = C.black,
  iconBg = C.card,
  label,
  value,
  onPress,
  danger = false,
  rightNode,
}: {
  icon: any;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  rightNode?: React.ReactNode;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        st.settingsRow,
        pressed && onPress && { backgroundColor: C.cardPressed },
      ]}
      onPress={onPress}
      disabled={!onPress && !rightNode}
    >
      <View style={[st.settingsRowIcon, { backgroundColor: iconBg }]}>
        <HugeiconsIcon
          icon={icon}
          size={16}
          color={iconColor}
          strokeWidth={1.8}
        />
      </View>
      <Text style={[st.settingsRowLabel, danger && { color: C.red }]}>
        {label}
      </Text>
      <View style={st.settingsRowRight}>
        {rightNode ?? (
          <>
            {value && <Text style={st.settingsRowValue}>{value}</Text>}
            {onPress && (
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={14}
                color={C.textMuted}
              />
            )}
          </>
        )}
      </View>
    </Pressable>
  );
}

// A settings section card with title
function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={st.settingsSection}>
      <Text style={st.settingsSectionTitle}>{title}</Text>
      <View style={[st.settingsSectionCard, SH_SM]}>{children}</View>
    </View>
  );
}

// Thin divider inside settings card
function RowDivider() {
  return <View style={st.rowDivider} />;
}

// SelectChip group used inside sheets
function SelectChipGroup({
  options,
  selected,
  onSelect,
  color = C.black,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  color?: string;
}) {
  return (
    <View style={st.chipGroup}>
      {options.map((o) => (
        <Pressable
          key={o}
          style={[st.chip, selected === o && { backgroundColor: color }]}
          onPress={() => onSelect(o)}
        >
          <Text style={[st.chipText, selected === o && { color: C.white }]}>
            {o}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION TOGGLES STATE
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_NOTIFS = {
  runComplete: true,
  runFailed: true,
  aiInsights: true,
  weeklyReport: false,
  systemUpdates: false,
  voiceReminder: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// SHEET CONTENT COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function EditProfileSheet({
  onClose,
  user,
  updateUser,
}: {
  onClose: () => void;
  user: User | null;
  updateUser: (data: any) => void;
}) {
  const currentUser = getUserData(user);

  const [name, setName] = useState(currentUser.name);
  const [role, setRole] = useState(currentUser.role);
  const [dept, setDept] = useState(currentUser.department);
  const [inst, setInst] = useState(currentUser.institution);

  return (
    <View style={st.sheetBody}>
      <View style={st.sheetTitleRow}>
        <BlackPill label="EDIT PROFILE" />
        <Pressable style={st.sheetCloseBtn} onPress={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} size={14} color={C.textMuted} />
        </Pressable>
      </View>

      {/* Avatar picker */}
      <View style={st.avatarEditRow}>
        <View style={st.heroBigAvatar}>
          <Text style={st.heroBigAvatarText}>{user?.name}</Text>
        </View>
        <Pressable style={[st.avatarChangeBt, SH_SM]}>
          <HugeiconsIcon icon={PencilEdit02Icon} size={14} color={C.black} />
          <Text style={st.avatarChangeTxt}>Change Photo</Text>
        </Pressable>
      </View>

      {[
        { label: "Full Name", value: name, set: setName },
        { label: "Role / Title", value: role, set: setRole },
        { label: "Department", value: dept, set: setDept },
        { label: "Institution", value: inst, set: setInst },
      ].map((f, i) => (
        <View key={i} style={st.editFieldGroup}>
          <Text style={st.editFieldLabel}>{f.label}</Text>
          <TextInput
            style={st.editFieldInput}
            value={f.value}
            onChangeText={f.set}
            autoCorrect={false}
          />
        </View>
      ))}

      <Pressable
        style={[st.saveBt, SH_DARK]}
        onPress={async () => {
          try {
            if (user) {
              await updateUser({ name });
              Alert.alert("Success", "Profile updated successfully");
              onClose();
            }
          } catch (error) {
            Alert.alert("Error", "Failed to update profile. Please try again.");
          }
        }}
      >
        <Text style={st.saveBtText}>Save Changes</Text>
      </Pressable>
    </View>
  );
}

function AIPreferencesSheet({ onClose }: { onClose: () => void }) {
  const [level, setLevel] = useState("Intermediate");
  const [assay, setAssay] = useState("PCR");
  const [lang, setLang] = useState("English");
  const [units, setUnits] = useState("Metric");
  const [verbosity, setVerbosity] = useState("Balanced");

  return (
    <View style={st.sheetBody}>
      <View style={st.sheetTitleRow}>
        <BlackPill label="AI PREFERENCES" />
        <Pressable style={st.sheetCloseBtn} onPress={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} size={14} color={C.textMuted} />
        </Pressable>
      </View>
      <Text style={st.sheetDesc}>
        Tailor how the AI explains results and generates recommendations.
      </Text>

      {[
        {
          label: "Explanation Level",
          options: ["Beginner", "Intermediate", "Expert"],
          selected: level,
          onSelect: setLevel,
          color: C.purple,
        },
        {
          label: "Default Assay",
          options: ["PCR", "Gel", "Western", "ELISA", "qPCR", "Flow"],
          selected: assay,
          onSelect: setAssay,
          color: C.blue,
        },
        {
          label: "Language",
          options: ["English", "French", "Portuguese"],
          selected: lang,
          onSelect: setLang,
          color: C.black,
        },
        {
          label: "Measurement Units",
          options: ["Metric", "Imperial"],
          selected: units,
          onSelect: setUnits,
          color: C.black,
        },
        {
          label: "Response Verbosity",
          options: ["Concise", "Balanced", "Detailed"],
          selected: verbosity,
          onSelect: setVerbosity,
          color: C.teal,
        },
      ].map((row, i) => (
        <View key={i} style={st.prefRow}>
          <Text style={st.prefLabel}>{row.label}</Text>
          <SelectChipGroup
            options={row.options}
            selected={row.selected}
            onSelect={row.onSelect}
            color={row.color}
          />
        </View>
      ))}

      <Pressable style={[st.saveBt, SH_DARK]}>
        <Text style={st.saveBtText}>Save Preferences</Text>
      </Pressable>
    </View>
  );
}

function NotificationsSheet({
  notifs,
  setNotifs,
  onClose,
}: {
  notifs: typeof DEFAULT_NOTIFS;
  setNotifs: React.Dispatch<React.SetStateAction<typeof DEFAULT_NOTIFS>>;
  onClose: () => void;
}) {
  const rows: {
    key: keyof typeof DEFAULT_NOTIFS;
    label: string;
    sub: string;
    icon: any;
    color: string;
  }[] = [
    {
      key: "runComplete",
      label: "Run Complete",
      sub: "When an experiment finishes",
      icon: CheckmarkCircle02Icon,
      color: C.green,
    },
    {
      key: "runFailed",
      label: "Run Failed / Issues",
      sub: "Alerts for errors or warnings",
      icon: Warning,
      color: C.red,
    },
    {
      key: "aiInsights",
      label: "AI Insights Ready",
      sub: "When new analysis is available",
      icon: SparklesIcon,
      color: C.purple,
    },
    {
      key: "weeklyReport",
      label: "Weekly Report",
      sub: "Summary every Monday morning",
      icon: BookOpen01Icon,
      color: C.blue,
    },
    {
      key: "systemUpdates",
      label: "App Updates",
      sub: "New features and improvements",
      icon: InformationCircleIcon,
      color: C.teal,
    },
    {
      key: "voiceReminder",
      label: "Voice Mode Reminder",
      sub: "Remind before starting bench work",
      icon: Mic02Icon,
      color: C.amber,
    },
  ];

  return (
    <View style={st.sheetBody}>
      <View style={st.sheetTitleRow}>
        <BlackPill label="NOTIFICATIONS" />
        <Pressable style={st.sheetCloseBtn} onPress={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} size={14} color={C.textMuted} />
        </Pressable>
      </View>

      {rows.map((row, i) => (
        <View key={i}>
          <View style={st.notifRow}>
            <View style={[st.notifIcon, { backgroundColor: row.color + "18" }]}>
              <HugeiconsIcon icon={row.icon} size={16} color={row.color} />
            </View>
            <View style={st.notifText}>
              <Text style={st.notifLabel}>{row.label}</Text>
              <Text style={st.notifSub}>{row.sub}</Text>
            </View>
            <Switch
              value={notifs[row.key]}
              onValueChange={(v) =>
                setNotifs((prev) => ({ ...prev, [row.key]: v }))
              }
              trackColor={{ false: C.card, true: C.black }}
              thumbColor={C.white}
              ios_backgroundColor={C.card}
            />
          </View>
          {i < rows.length - 1 && <RowDivider />}
        </View>
      ))}
    </View>
  );
}

function ReportDefaultsSheet({ onClose }: { onClose: () => void }) {
  const [format, setFormat] = useState("PDF");
  const [logoPos, setLogoPos] = useState("Top Left");
  const [sections, setSections] = useState<string[]>([
    "Observation",
    "Causes",
    "Next Step",
    "Protocol",
  ]);

  const allSections = [
    "Observation",
    "Causes",
    "Next Step",
    "Protocol",
    "Raw Data",
    "Statistics",
    "References",
  ];

  const toggleSection = (s: string) =>
    setSections((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  return (
    <View style={st.sheetBody}>
      <View style={st.sheetTitleRow}>
        <BlackPill label="REPORT DEFAULTS" />
        <Pressable style={st.sheetCloseBtn} onPress={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} size={14} color={C.textMuted} />
        </Pressable>
      </View>
      <Text style={st.sheetDesc}>
        Configure default format for auto-generated lab reports.
      </Text>

      <View style={st.prefRow}>
        <Text style={st.prefLabel}>Export Format</Text>
        <SelectChipGroup
          options={["PDF", "DOCX", "Markdown"]}
          selected={format}
          onSelect={setFormat}
        />
      </View>

      <View style={st.prefRow}>
        <Text style={st.prefLabel}>Logo Position</Text>
        <SelectChipGroup
          options={["Top Left", "Top Right", "None"]}
          selected={logoPos}
          onSelect={setLogoPos}
        />
      </View>

      <View style={st.prefRow}>
        <Text style={st.prefLabel}>Include Sections</Text>
        <View style={st.chipGroup}>
          {allSections.map((sec) => {
            const active = sections.includes(sec);
            return (
              <Pressable
                key={sec}
                style={[st.chip, active && { backgroundColor: C.green }]}
                onPress={() => toggleSection(sec)}
              >
                {active && (
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={10}
                    color={C.white}
                  />
                )}
                <Text style={[st.chipText, active && { color: C.white }]}>
                  {sec}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable style={[st.saveBt, SH_DARK]}>
        <Text style={st.saveBtText}>Save Defaults</Text>
      </Pressable>
    </View>
  );
}

function SecuritySheet({ onClose }: { onClose: () => void }) {
  const [twoFA, setTwoFA] = useState(true);
  const DEVICES = [
    { name: "iPhone 15 Pro", last: "Active now", current: true },
    { name: "iPad Air", last: "2 days ago", current: false },
    { name: "MacBook Pro", last: "5 days ago", current: false },
  ];

  return (
    <View style={st.sheetBody}>
      <View style={st.sheetTitleRow}>
        <BlackPill label="SECURITY" />
        <Pressable style={st.sheetCloseBtn} onPress={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} size={14} color={C.textMuted} />
        </Pressable>
      </View>

      {/* 2FA toggle */}
      <View style={st.secRow}>
        <View style={[st.notifIcon, { backgroundColor: C.greenBg }]}>
          <HugeiconsIcon icon={ShieldCheck} size={16} color={C.green} />
        </View>
        <View style={st.notifText}>
          <Text style={st.notifLabel}>Two-Factor Authentication</Text>
          <Text style={st.notifSub}>
            {twoFA ? "Enabled — Authenticator app" : "Disabled"}
          </Text>
        </View>
        <Switch
          value={twoFA}
          onValueChange={setTwoFA}
          trackColor={{ false: C.card, true: C.black }}
          thumbColor={C.white}
          ios_backgroundColor={C.card}
        />
      </View>

      <RowDivider />

      <Pressable style={[st.secRow, st.secRowTappable]}>
        <View style={[st.notifIcon, { backgroundColor: C.blueBg }]}>
          <HugeiconsIcon icon={Key01Icon} size={16} color={C.blue} />
        </View>
        <View style={st.notifText}>
          <Text style={st.notifLabel}>Change Password</Text>
          <Text style={st.notifSub}>Last changed 3 months ago</Text>
        </View>
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={C.textMuted} />
      </Pressable>

      <RowDivider />

      {/* Connected devices */}
      <Text style={[st.prefLabel, { marginTop: 8, marginBottom: 10 }]}>
        Connected Devices
      </Text>
      {DEVICES.map((d, i) => (
        <View
          key={i}
          style={[st.deviceRow, i % 2 === 1 && { backgroundColor: C.card }]}
        >
          <View
            style={[
              st.notifIcon,
              { backgroundColor: d.current ? C.blueBg : C.card },
            ]}
          >
            <HugeiconsIcon
              icon={Smartphone}
              size={15}
              color={d.current ? C.blue : C.textMuted}
            />
          </View>
          <View style={st.notifText}>
            <Text style={st.notifLabel}>{d.name}</Text>
            <Text
              style={[
                st.notifSub,
                d.current && { color: C.green, fontWeight: "700" },
              ]}
            >
              {d.last}
            </Text>
          </View>
          {!d.current && (
            <Pressable>
              <Text style={[st.notifSub, { color: C.red, fontWeight: "700" }]}>
                Remove
              </Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

function DataPrivacySheet({ onClose }: { onClose: () => void }) {
  return (
    <View style={st.sheetBody}>
      <View style={st.sheetTitleRow}>
        <BlackPill label="DATA & PRIVACY" />
        <Pressable style={st.sheetCloseBtn} onPress={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} size={14} color={C.textMuted} />
        </Pressable>
      </View>

      <View style={[st.dataInfoBox]}>
        <HugeiconsIcon icon={ShieldCheck} size={16} color={C.blue} />
        <Text style={st.dataInfoText}>
          Your research data is encrypted at rest (AES-256) and in transit (TLS
          1.3). Anthropic does not use your lab data to train AI models.
        </Text>
      </View>

      {[
        {
          icon: Download02Icon,
          iconColor: C.green,
          iconBg: C.greenBg,
          label: "Export All Data",
          sub: "Download a full archive of your experiments, protocols and reports (JSON + PDF)",
          action: () =>
            Alert.alert(
              "Export started",
              "You'll receive a download link by email within 10 minutes.",
            ),
          danger: false,
        },
        {
          icon: Share08Icon,
          iconColor: C.blue,
          iconBg: C.blueBg,
          label: "Share Usage Analytics",
          sub: "Help improve Lab Assistant AI with anonymous usage data",
          action: undefined,
          danger: false,
          toggle: true,
        },
        {
          icon: Delete02Icon,
          iconColor: C.red,
          iconBg: C.redBg,
          label: "Delete All Data",
          sub: "Permanently remove all experiments, protocols and history",
          action: () =>
            Alert.alert(
              "Delete all data?",
              "This is irreversible. All experiments, protocols and run history will be permanently deleted.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete Everything", style: "destructive" },
              ],
            ),
          danger: true,
        },
      ].map((row, i) => (
        <View key={i} style={[st.dataRow, i > 0 && { marginTop: 8 }]}>
          <View style={[st.notifIcon, { backgroundColor: row.iconBg }]}>
            <HugeiconsIcon icon={row.icon} size={16} color={row.iconColor} />
          </View>
          <View style={st.notifText}>
            <Text style={[st.notifLabel, row.danger && { color: C.red }]}>
              {row.label}
            </Text>
            <Text style={st.notifSub}>{row.sub}</Text>
          </View>
          {row.action && (
            <Pressable
              style={[
                st.dataActionBtn,
                { backgroundColor: row.danger ? C.redBg : C.card },
              ]}
              onPress={row.action}
            >
              <Text
                style={[
                  st.dataActionText,
                  { color: row.danger ? C.red : C.textPrimary },
                ]}
              >
                {row.danger ? "Delete" : "Export"}
              </Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, isLoading, updateUser } = useAuth();

  // Sheet state
  type SheetId =
    | "editProfile"
    | "aiPrefs"
    | "notifications"
    | "reportDefaults"
    | "security"
    | "dataPrivacy";
  const [activeSheet, setActiveSheet] = useState<SheetId | null>(null);
  const [notifs, setNotifs] = useState(DEFAULT_NOTIFS);

  const USER = getUserData(user);

  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["70%", "95%"], []);

  const openSheet = (id: SheetId) => {
    setActiveSheet(id);
    sheetRef.current?.present();
  };

  const closeSheet = () => sheetRef.current?.dismiss();

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

  const activeNotifCount = Object.values(notifs).filter(Boolean).length;
  const maxBar = Math.max(...ACTIVITY_MONTHS.map((m) => m.runs));

  return (
    <SafeAreaView style={st.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={[
          st.scroll,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page header ── */}
        <View style={st.pageHeader}>
          <Text style={st.pageSuperTitle}>MY ACCOUNT</Text>
          <Text style={st.pageTitle}>Profile</Text>
        </View>

        {/* ═══════════════════════════════════════════════════════════════
               HERO CARD
          ═══════════════════════════════════════════════════════════════ */}
        <View style={[st.heroCard, SH_LG]}>
          {/* Top strip */}
          <View style={st.heroStrip} />

          <View style={st.heroBody}>
            <View style={st.heroTopRow}>
              {/* Avatar */}
              <View style={st.heroAvatarWrap}>
                <View style={[st.heroAvatar, SH_DARK]}>
                  <Text style={st.heroAvatarText}>{USER.initials}</Text>
                </View>
                <View style={st.heroAvatarOnline} />
              </View>

              {/* Edit + Share */}
              <View style={st.heroActions}>
                <Pressable
                  style={[st.heroActionBtn, SH_SM]}
                  onPress={() => openSheet("editProfile")}
                >
                  <HugeiconsIcon icon={Edit02Icon} size={14} color={C.black} />
                  <Text style={st.heroActionBtnText}>Edit</Text>
                </Pressable>
                <Pressable style={[st.heroActionBtnIcon, SH_SM]}>
                  <HugeiconsIcon icon={Share08Icon} size={15} color={C.black} />
                </Pressable>
              </View>
            </View>

            {/* Name + plan */}
            <View style={st.heroNameRow}>
              <Text style={st.heroName}>{USER.name}</Text>
              <PlanBadge plan={USER.plan} />
            </View>
            <Text style={st.heroRole}>{user?.role}</Text>
            <Text style={st.heroInst}>
              {USER.department} · {USER.institution}
            </Text>

            {/* Meta pills */}
            <View style={st.heroMetaRow}>
              {[
                { label: `Member since ${USER.memberSince}` },
                { label: `Last active ${USER.lastActive}` },
              ].map((m, i) => (
                <View key={i} style={st.heroMetaPill}>
                  <Text style={st.heroMetaText}>{m.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════════
               STATS GRID
          ═══════════════════════════════════════════════════════════════ */}
        <View style={st.statsGrid}>
          {STATS.map((stat, i) => (
            <View key={i} style={[st.statCard, SH_SM]}>
              <View
                style={[st.statColorBar, { backgroundColor: stat.color }]}
              />
              <Text style={[st.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={st.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ═══════════════════════════════════════════════════════════════
               ACTIVITY BAR CHART
          ═══════════════════════════════════════════════════════════════ */}
        <View style={[st.activityCard, SH_SM]}>
          <View style={st.activityHeader}>
            <BlackPill label="ACTIVITY" />
            <Text style={st.activitySubtitle}>Experiments per month</Text>
          </View>
          <View style={st.barsRow}>
            {ACTIVITY_MONTHS.map((m, i) => {
              const pct = m.runs / maxBar;
              const isMax = m.runs === maxBar;
              return (
                <View key={i} style={st.barCol}>
                  <Text
                    style={[
                      st.barValue,
                      isMax && { color: C.purple, fontWeight: "700" },
                    ]}
                  >
                    {m.runs}
                  </Text>
                  <View style={st.barTrack}>
                    <View
                      style={[
                        st.barFill,
                        {
                          height: `${pct * 100}%` as any,
                          backgroundColor: isMax ? C.purple : C.black,
                          opacity: isMax ? 1 : 0.15 + pct * 0.6,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      st.barMonth,
                      isMax && { color: C.purple, fontWeight: "700" },
                    ]}
                  >
                    {m.month}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════════
               SETTINGS SECTIONS
          ═══════════════════════════════════════════════════════════════ */}

        {/* AI & Personalization */}
        <SettingsSection title="AI & PERSONALIZATION">
          <SettingsRow
            icon={SparklesIcon}
            iconColor={C.purple}
            iconBg={C.purpleBg}
            label="AI Preferences"
            value="Intermediate"
            onPress={() => openSheet("aiPrefs")}
          />
          <RowDivider />
          <SettingsRow
            icon={BookOpen01Icon}
            iconColor={C.blue}
            iconBg={C.blueBg}
            label="Report Defaults"
            value="PDF · 4 sections"
            onPress={() => openSheet("reportDefaults")}
          />
          <RowDivider />
          <SettingsRow
            icon={Mic02Icon}
            iconColor={C.amber}
            iconBg={C.amberBg}
            label="Voice Mode Settings"
            value="English"
            onPress={() => {}}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="NOTIFICATIONS">
          <SettingsRow
            icon={Notification01Icon}
            iconColor={C.blue}
            iconBg={C.blueBg}
            label="Notification Preferences"
            value={`${activeNotifCount} enabled`}
            onPress={() => openSheet("notifications")}
          />
        </SettingsSection>

        {/* Account */}
        <SettingsSection title="ACCOUNT & SECURITY">
          <SettingsRow
            icon={UserIcon}
            iconColor={C.black}
            iconBg={C.card}
            label="Account Details"
            value={USER.email}
            onPress={() => openSheet("editProfile")}
          />
          <RowDivider />
          <SettingsRow
            icon={ShieldCheck}
            iconColor={C.green}
            iconBg={C.greenBg}
            label="Password & Security"
            value="2FA enabled"
            onPress={() => openSheet("security")}
          />
          <RowDivider />
          <SettingsRow
            icon={SparklesIcon}
            iconColor={C.amber}
            iconBg={C.amberBg}
            label="Subscription"
            value="Pro Plan"
            onPress={() => router.push("/(routes)/subscribe")}
          />
        </SettingsSection>

        {/* Data */}
        <SettingsSection title="DATA & PRIVACY">
          <SettingsRow
            icon={ShieldCheck}
            iconColor={C.teal}
            iconBg={C.tealBg}
            label="Privacy & Data"
            value="Export · Delete"
            onPress={() => openSheet("dataPrivacy")}
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection title="HELP & SUPPORT">
          <SettingsRow
            icon={HelpCircleIcon}
            iconColor={C.blue}
            iconBg={C.blueBg}
            label="Help Center"
            onPress={() => {}}
          />
          <RowDivider />
          <SettingsRow
            icon={InformationCircleIcon}
            iconColor={C.textMuted}
            iconBg={C.card}
            label="About Lab Assistant AI"
            value="v2.4.1"
            onPress={() => {}}
          />
          <RowDivider />
          <SettingsRow
            icon={Edit02Icon}
            iconColor={C.textMuted}
            iconBg={C.card}
            label="Send Feedback"
            onPress={() => {}}
          />
        </SettingsSection>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [
            st.logoutBtn,
            SH_SM,
            pressed && { opacity: 0.75 },
          ]}
          onPress={() =>
            Alert.alert("Log Out", "Are you sure you want to log out?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Log Out",
                style: "destructive",
                onPress: async () => {
                  try {
                    await logout();
                    router.replace("/(routes)/login");
                  } catch (error) {
                    Alert.alert(
                      "Error",
                      "Failed to log out. Please try again.",
                    );
                  }
                },
              },
            ])
          }
        >
          <HugeiconsIcon icon={Logout01Icon} size={16} color={C.red} />
          <Text style={st.logoutText}>Log Out</Text>
        </Pressable>

        <Text style={st.versionText}>Lab Assistant AI · v2.4.1 · © 2025</Text>
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════════
            BOTTOM SHEET
        ══════════════════════════════════════════════════════════════════ */}
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={st.sheetHandle}
        backgroundStyle={st.sheetBg}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        <BottomSheetScrollView
          contentContainerStyle={st.sheetContent}
          keyboardShouldPersistTaps="handled"
        >
          {activeSheet === "editProfile" && user && (
            <EditProfileSheet
              onClose={closeSheet}
              updateUser={updateUser}
              user={user}
            />
          )}
          {activeSheet === "aiPrefs" && (
            <AIPreferencesSheet onClose={closeSheet} />
          )}
          {activeSheet === "notifications" && (
            <NotificationsSheet
              notifs={notifs}
              setNotifs={setNotifs}
              onClose={closeSheet}
            />
          )}
          {activeSheet === "reportDefaults" && (
            <ReportDefaultsSheet onClose={closeSheet} />
          )}
          {activeSheet === "security" && <SecuritySheet onClose={closeSheet} />}
          {activeSheet === "dataPrivacy" && (
            <DataPrivacySheet onClose={closeSheet} />
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 12 },

  // Page header
  pageHeader: { marginBottom: 20 },
  pageSuperTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1.5,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -1,
  },

  // ── Hero card ──────────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: C.bg,
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 20,
  },
  heroStrip: { height: 80, backgroundColor: C.black },
  heroBody: { padding: 20, paddingTop: 0, gap: 6 },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  heroAvatarWrap: { position: "relative" },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -40,
    borderWidth: 4,
    borderColor: C.bg,
  },
  heroAvatarText: {
    fontSize: 26,
    fontWeight: "800",
    color: C.white,
    letterSpacing: -0.5,
  },
  heroAvatarOnline: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.green,
    borderWidth: 2,
    borderColor: C.bg,
  },

  // Big avatar for edit sheet
  heroBigAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
  },
  heroBigAvatarText: { fontSize: 22, fontWeight: "800", color: C.white },

  heroActions: { flexDirection: "row", gap: 8, paddingBottom: 6 },
  heroActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroActionBtnText: { fontSize: 13, fontWeight: "700", color: C.black },
  heroActionBtnIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  heroNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroName: {
    fontSize: 22,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.4,
  },
  heroRole: { fontSize: 14, color: C.textSecondary, fontWeight: "500" },
  heroInst: { fontSize: 12.5, color: C.textMuted },
  heroMetaRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  heroMetaPill: {
    backgroundColor: C.card,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroMetaText: { fontSize: 11.5, color: C.textMuted, fontWeight: "500" },

  // Plan badge
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  planBadgeText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },

  // ── Stats grid ─────────────────────────────────────────────────────────────
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    gap: 5,
    overflow: "hidden",
  },
  statColorBar: { position: "absolute", top: 0, left: 0, right: 0, height: 3 },
  statValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 0.5,
    textAlign: "center",
  },

  // ── Activity bar chart ─────────────────────────────────────────────────────
  activityCard: {
    backgroundColor: C.bg,
    borderRadius: 24,
    padding: 20,
    marginBottom: 28,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  activitySubtitle: { fontSize: 12, color: C.textMuted },
  barsRow: {
    flexDirection: "row",
    height: 110,
    gap: 8,
    alignItems: "flex-end",
  },
  barCol: { flex: 1, alignItems: "center", gap: 5 },
  barValue: { fontSize: 10.5, color: C.textMuted, fontWeight: "600" },
  barTrack: {
    flex: 1,
    width: "100%",
    backgroundColor: C.card,
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: { width: "100%", borderRadius: 6 },
  barMonth: { fontSize: 10.5, color: C.textMuted, fontWeight: "600" },

  // ── Settings sections ──────────────────────────────────────────────────────
  settingsSection: { marginBottom: 24, gap: 8 },
  settingsSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1.5,
    paddingHorizontal: 4,
  },
  settingsSectionCard: {
    backgroundColor: C.bg,
    borderRadius: 22,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    paddingHorizontal: 16,
  },
  settingsRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsRowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: C.textPrimary,
  },
  settingsRowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  settingsRowValue: { fontSize: 13, color: C.textMuted },
  rowDivider: { height: 1, backgroundColor: C.card, marginLeft: 64 },

  // ── Logout button ──────────────────────────────────────────────────────────
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.redBg,
    borderRadius: 20,
    paddingVertical: 16,
    marginBottom: 12,
  },
  logoutText: { fontSize: 15, fontWeight: "700", color: C.red },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: C.textMuted,
    marginBottom: 8,
  },

  // ── Sheet shared ───────────────────────────────────────────────────────────
  sheetBg: { backgroundColor: C.bg, borderRadius: 32 },
  sheetHandle: { backgroundColor: "#e5e5ea", width: 40 },
  sheetContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 52 },
  sheetBody: { gap: 18 },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetDesc: {
    fontSize: 13.5,
    color: C.textMuted,
    lineHeight: 20,
    marginTop: -8,
  },

  // ── Edit profile sheet ─────────────────────────────────────────────────────
  avatarEditRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatarChangeBt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  avatarChangeTxt: { fontSize: 13.5, fontWeight: "600", color: C.black },
  editFieldGroup: { gap: 6 },
  editFieldLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 0.8,
  },
  editFieldInput: {
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: "500",
    color: C.textPrimary,
  },
  saveBt: {
    backgroundColor: C.black,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtText: { fontSize: 15, fontWeight: "700", color: C.white },

  // ── Prefs / chips ──────────────────────────────────────────────────────────
  prefRow: { gap: 10 },
  prefLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 0.8,
  },
  chipGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: C.card,
    borderRadius: 12,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: C.textPrimary },

  // ── Notif rows ─────────────────────────────────────────────────────────────
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  notifText: { flex: 1 },
  notifLabel: { fontSize: 14.5, fontWeight: "600", color: C.textPrimary },
  notifSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  // ── Security sheet ─────────────────────────────────────────────────────────
  secRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  secRowTappable: { paddingVertical: 12 },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
  },

  // ── Data privacy sheet ─────────────────────────────────────────────────────
  dataInfoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: C.blueBg,
    borderRadius: 14,
    padding: 14,
  },
  dataInfoText: { flex: 1, fontSize: 13.5, color: C.blue, lineHeight: 20 },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
  },
  dataActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  dataActionText: { fontSize: 13, fontWeight: "700" },

  // ── Atoms ──────────────────────────────────────────────────────────────────
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
});
