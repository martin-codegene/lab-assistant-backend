/**
 * create-protocol-screen.tsx
 *
 * Screen for creating new experimental protocols in Lab Assistant AI.
 * Features:
 *  - Multi-step form for protocol definition
 *  - Dynamic step management (add/remove/reorder)
 *  - Protocol type selection with visual indicators
 *  - Tag management
 *  - Real-time validation
 *  - Draft saving
 *  - Voice input support for hands-free entry
 */

import {
  api,
  ProtocolConditions as ApiProtocolConditions,
  ProtocolMaterial as ApiProtocolMaterial,
  ProtocolStep as ApiProtocolStep,
  AssayType,
  AssayTypeArr,
} from "@/lib/api";
import {
  Add01Icon,
  ArrowLeft01Icon,
  Bookmark02Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Copy01Icon,
  Flask,
  Mic02Icon,
  MicOff01Icon,
  MoreHorizontalIcon,
  PlayIcon,
  SparklesIcon,
  Tag01Icon,
  ThermometerIcon,
  Trash,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
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
// DESIGN TOKENS (matches existing screens)
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
  separator: "#f0f0f3",
  success: "#10a37f",
  successBg: "#e8f8ef",
};

const TYPE_COLOR: Record<string, { fg: string; bg: string; icon: any }> = {
  PCR: { fg: "#7c5cfc", bg: "#f2effe", icon: Flask },
  GEL: { fg: "#3b7ef6", bg: "#eef3ff", icon: Copy01Icon },
  WESTERN_BLOT: { fg: "#f0a020", bg: "#fff4e0", icon: MoreHorizontalIcon },
  ELISA: { fg: "#00b37e", bg: "#e8f8ef", icon: CheckmarkCircle02Icon },
  FLOW_CYTOMETRY: { fg: "#ff3b30", bg: "#ffeceb", icon: PlayIcon },
  CELL_CULTURE: { fg: "#0891b2", bg: "#e0f5fb", icon: ThermometerIcon },
  PROTEIN_EXPRESSION: { fg: "#7c5cfc", bg: "#f2effe", icon: Flask },
  DNA_SEQUENCING: { fg: "#3b7ef6", bg: "#eef3ff", icon: Copy01Icon },
  MICROSCOPY: { fg: "#f0a020", bg: "#fff4e0", icon: MoreHorizontalIcon },
  OTHER: { fg: "#8e8e93", bg: "#f4f4f7", icon: Flask },
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SHADOWS
// ─────────────────────────────────────────────────────────────────────────────
const SHADOW_MD = Platform.select({
  ios: {
    shadowColor: "#1a1a2e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
}) as any;

const SHADOW_SM = Platform.select({
  ios: {
    shadowColor: "#1a1a2e",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  android: { elevation: 2 },
}) as any;

const SHADOW_DARK = Platform.select({
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

interface ProtocolStep {
  order: number;
  title: string;
  duration: string;
  temp?: number;
}

interface ProtocolFormData {
  name: string;
  type: AssayType | "";
  description: string;
  tags: string[];
  steps: ProtocolStep[];
  estimatedTime: string;
  author: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function BlackPill({ label }: { label: string }) {
  return (
    <View style={styles.blackPill}>
      <Text style={styles.blackPillText}>{label}</Text>
    </View>
  );
}

function TypeOption({
  type,
  label,
  selected,
  onSelect,
}: {
  type: AssayType;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const colorConfig = TYPE_COLOR[type] || TYPE_COLOR.OTHER;
  const { fg, bg, icon } = colorConfig;

  return (
    <Pressable
      style={[
        styles.typeOption,
        SHADOW_SM,
        selected && { backgroundColor: fg },
        { borderColor: selected ? fg : C.separator },
      ]}
      onPress={onSelect}
    >
      <View
        style={[styles.typeIcon, { backgroundColor: selected ? C.white : bg }]}
      >
        <HugeiconsIcon icon={icon} size={16} color={selected ? fg : fg} />
      </View>
      <Text
        style={[
          styles.typeLabel,
          selected && { color: C.white, fontWeight: "700" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function StepRow({
  step,
  index,
  totalSteps,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  step: ProtocolStep;
  index: number;
  totalSteps: number;
  onUpdate: (
    field: keyof ProtocolStep,
    value: string | number | undefined,
  ) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <View style={[styles.stepRow, SHADOW_SM]}>
      {/* Step number */}
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{step.order}</Text>
      </View>

      {/* Step content */}
      <View style={styles.stepContent}>
        <TextInput
          style={styles.stepTitleInput}
          placeholder="Step title (e.g., 'Initial Denaturation')"
          placeholderTextColor={C.textMuted}
          value={step.title}
          onChangeText={(text) => onUpdate("title", text)}
        />

        <View style={styles.stepMetaRow}>
          <View style={styles.durationInput}>
            <HugeiconsIcon icon={Clock01Icon} size={12} color={C.textMuted} />
            <TextInput
              style={styles.durationInputText}
              placeholder="Duration"
              placeholderTextColor={C.textMuted}
              value={step.duration}
              onChangeText={(text) => onUpdate("duration", text)}
            />
          </View>

          <View style={styles.tempInput}>
            <HugeiconsIcon
              icon={ThermometerIcon}
              size={12}
              color={C.textMuted}
            />
            <TextInput
              style={styles.tempInputText}
              placeholder="Temp (°C)"
              placeholderTextColor={C.textMuted}
              value={step.temp?.toString() || ""}
              onChangeText={(text) => {
                const num = parseInt(text);
                onUpdate("temp", isNaN(num) ? undefined : num);
              }}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* Step actions */}
      <View style={styles.stepActions}>
        {index > 0 && (
          <Pressable style={styles.stepActionBtn} onPress={onMoveUp}>
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={14}
              color={C.textMuted}
              style={{ transform: [{ rotate: "90deg" }] }}
            />
          </Pressable>
        )}
        {index < totalSteps - 1 && (
          <Pressable style={styles.stepActionBtn} onPress={onMoveDown}>
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={14}
              color={C.textMuted}
              style={{ transform: [{ rotate: "-90deg" }] }}
            />
          </Pressable>
        )}
        <Pressable
          style={[styles.stepActionBtn, { backgroundColor: C.redBg }]}
          onPress={onRemove}
        >
          <HugeiconsIcon icon={Trash} size={14} color={C.red} />
        </Pressable>
      </View>
    </View>
  );
}

function TagInput({
  tags,
  onAddTag,
  onRemoveTag,
}: {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (index: number) => void;
}) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAddTag(trimmed);
      setInput("");
    }
  };

  return (
    <View style={styles.tagSection}>
      <BlackPill label="TAGS" />
      <View style={styles.tagInputRow}>
        <View style={[styles.tagInput, SHADOW_SM]}>
          <HugeiconsIcon icon={Tag01Icon} size={14} color={C.textMuted} />
          <TextInput
            style={styles.tagInputField}
            placeholder="Add tags (e.g., 'Bacteria', '16S', 'Universal')"
            placeholderTextColor={C.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          {input.length > 0 && (
            <Pressable onPress={handleAdd}>
              <HugeiconsIcon icon={Add01Icon} size={14} color={C.blue} />
            </Pressable>
          )}
        </View>
      </View>

      {tags.length > 0 && (
        <View style={styles.tagList}>
          {tags.map((tag, index) => (
            <Pressable
              key={index}
              style={styles.tagChip}
              onPress={() => onRemoveTag(index)}
            >
              <Text style={styles.tagChipText}>{tag}</Text>
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={10}
                color={C.textMuted}
              />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function CreateProtocolScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [formData, setFormData] = useState<ProtocolFormData>({
    name: "",
    type: "",
    description: "",
    tags: [],
    steps: [{ order: 1, title: "", duration: "" }],
    estimatedTime: "",
    author: "Current User",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  // Validation
  const isValid =
    formData.name.trim() !== "" &&
    formData.type !== "" &&
    formData.steps.every(
      (step) => step.title.trim() !== "" && step.duration.trim() !== "",
    );

  // Update form field
  const updateField = <K extends keyof ProtocolFormData>(
    field: K,
    value: ProtocolFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Step management
  const addStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        { order: prev.steps.length + 1, title: "", duration: "" },
      ],
    }));
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const updateStep = (
    index: number,
    field: keyof ProtocolStep,
    value: string | number,
  ) => {
    setFormData((prev) => {
      const newSteps = [...prev.steps];
      newSteps[index] = { ...newSteps[index], [field]: value };
      return { ...prev, steps: newSteps };
    });
  };

  const removeStep = (index: number) => {
    if (formData.steps.length <= 1) {
      Alert.alert("Cannot Remove", "A protocol must have at least one step.");
      return;
    }

    setFormData((prev) => {
      const newSteps = prev.steps.filter((_, i) => i !== index);
      // Reorder steps
      return {
        ...prev,
        steps: newSteps.map((step, i) => ({ ...step, order: i + 1 })),
      };
    });
  };

  const moveStep = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= formData.steps.length) return;

    setFormData((prev) => {
      const newSteps = [...prev.steps];
      const [movedStep] = newSteps.splice(fromIndex, 1);
      newSteps.splice(toIndex, 0, movedStep);
      // Reorder steps
      return {
        ...prev,
        steps: newSteps.map((step, i) => ({ ...step, order: i + 1 })),
      };
    });
  };

  // Form submission
  const handleSaveDraft = async () => {
    if (!formData.name.trim() || !formData.type) {
      Alert.alert(
        "Validation Error",
        "Please provide at least a name and type to save as draft.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert form data to API format
      const apiData = {
        name: formData.name,
        description: formData.description || undefined,
        category: formData.type as AssayType,
        version: "1.0.0",
        isPublic: false,
        isTemplate: false,
        materials: formData.tags.map((tag) => ({
          name: tag,
          quantity: "TBD",
          unit: "unit",
        })) as ApiProtocolMaterial[],
        steps: formData.steps.map((step) => ({
          step: step.order,
          action: step.title,
          duration: step.duration,
          notes: step.temp ? `Temperature: ${step.temp}°C` : undefined,
        })) as ApiProtocolStep[],
        conditions: {
          temperature: formData.steps.find((s) => s.temp)
            ? `${formData.steps.find((s) => s.temp)?.temp}°C`
            : undefined,
        } as ApiProtocolConditions,
        safetyNotes: "Draft protocol - review safety requirements",
      };

      const response = await api.createProtocol(apiData);

      if (response.success) {
        Alert.alert("Draft Saved", "Your protocol has been saved as a draft.", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert("Error", response.error || "Failed to save draft");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save draft");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProtocol = async () => {
    if (!isValid) {
      Alert.alert("Validation Error", "Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert form data to API format
      const apiData = {
        name: formData.name,
        description: formData.description || undefined,
        category: formData.type as AssayType,
        version: "1.0.0",
        isPublic: true,
        isTemplate: false,
        materials: formData.tags.map((tag, index) => ({
          name: tag,
          quantity: "As needed",
          unit: "unit",
        })) as ApiProtocolMaterial[],
        steps: formData.steps.map((step) => ({
          step: step.order,
          action: step.title,
          duration: step.duration,
          notes: step.temp ? `Temperature: ${step.temp}°C` : undefined,
        })) as ApiProtocolStep[],
        conditions: {
          temperature: formData.steps.find((s) => s.temp)
            ? `${formData.steps.find((s) => s.temp)?.temp}°C`
            : undefined,
        } as ApiProtocolConditions,
        safetyNotes: "Follow standard laboratory safety procedures",
        references: formData.author
          ? `Created by ${formData.author}`
          : undefined,
      };

      const response = await api.createProtocol(apiData);

      if (response.success && response.data) {
        Alert.alert(
          "Protocol Created",
          `"${formData.name}" has been created successfully.`,
          [
            {
              text: "View Protocols",
              onPress: () => {
                router.replace("/(tabs)/protocols");
              },
            },
            {
              text: "Create Another",
              style: "default",
              onPress: () => {
                // Reset form
                setFormData({
                  name: "",
                  type: "",
                  description: "",
                  tags: [],
                  steps: [{ order: 1, title: "", duration: "" }],
                  estimatedTime: "",
                  author: "Current User",
                });
              },
            },
          ],
        );
      } else {
        Alert.alert("Error", response.error || "Failed to create protocol");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create protocol");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (
      formData.name ||
      formData.description ||
      formData.steps.some((s) => s.title)
    ) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
        ],
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 100 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Header ── */}
            <View style={styles.header}>
              <Pressable style={styles.backBtn} onPress={handleCancel}>
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  size={20}
                  color={C.black}
                />
              </Pressable>
              <View>
                <Text style={styles.sectionTitle}>NEW PROTOCOL</Text>
                <Text style={styles.headerTitle}>Create Protocol</Text>
              </View>
              <Pressable
                style={[
                  styles.voiceBtn,
                  isVoiceMode && { backgroundColor: C.blue },
                ]}
                onPress={() => setIsVoiceMode(!isVoiceMode)}
              >
                <HugeiconsIcon
                  icon={isVoiceMode ? Mic02Icon : MicOff01Icon}
                  size={16}
                  color={isVoiceMode ? C.white : C.textMuted}
                />
              </Pressable>
            </View>

            {/* ── Basic Info ── */}
            <View style={styles.section}>
              <BlackPill label="BASIC INFORMATION" />

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Protocol Name *</Text>
                <TextInput
                  style={[styles.textInput, SHADOW_SM]}
                  placeholder="e.g., PCR Amplification — 16S rRNA"
                  placeholderTextColor={C.textMuted}
                  value={formData.name}
                  onChangeText={(text) => updateField("name", text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textArea, SHADOW_SM]}
                  placeholder="Brief description of the protocol's purpose and application..."
                  placeholderTextColor={C.textMuted}
                  value={formData.description}
                  onChangeText={(text) => updateField("description", text)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Assay Type *</Text>
                <View style={styles.typeGrid}>
                  {AssayTypeArr.map((type) => (
                    <TypeOption
                      key={type.value}
                      type={type.value as AssayType}
                      label={type.label}
                      selected={formData.type === type.value}
                      onSelect={() =>
                        updateField("type", type.value as AssayType)
                      }
                    />
                  ))}
                </View>
              </View>
            </View>

            {/* ── Tags ── */}
            <TagInput
              tags={formData.tags}
              onAddTag={(tag) => updateField("tags", [...formData.tags, tag])}
              onRemoveTag={(index) => {
                const newTags = [...formData.tags];
                newTags.splice(index, 1);
                updateField("tags", newTags);
              }}
            />

            {/* ── Protocol Steps ── */}
            <View style={styles.section}>
              <View style={styles.stepsHeader}>
                <BlackPill label="PROTOCOL STEPS" />
                <Pressable style={styles.addStepBtn} onPress={addStep}>
                  <HugeiconsIcon icon={Add01Icon} size={14} color={C.blue} />
                  <Text style={styles.addStepText}>Add Step</Text>
                </Pressable>
              </View>

              <View style={styles.stepsList}>
                {formData.steps.map((step, index) => (
                  <StepRow
                    key={index}
                    step={step}
                    index={index}
                    totalSteps={formData.steps.length}
                    onUpdate={(field, value) =>
                      updateStep(index, field, value as any)
                    }
                    onRemove={() => removeStep(index)}
                    onMoveUp={() => moveStep(index, index - 1)}
                    onMoveDown={() => moveStep(index, index + 1)}
                  />
                ))}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Estimated Total Time</Text>
                <View style={[styles.timeInput, SHADOW_SM]}>
                  <HugeiconsIcon
                    icon={Clock01Icon}
                    size={14}
                    color={C.textMuted}
                  />
                  <TextInput
                    style={styles.timeInputField}
                    placeholder="e.g., 2h 15m"
                    placeholderTextColor={C.textMuted}
                    value={formData.estimatedTime}
                    onChangeText={(text) => updateField("estimatedTime", text)}
                  />
                </View>
              </View>
            </View>

            {/* ── Author Info ── */}
            <View style={styles.section}>
              <BlackPill label="AUTHOR INFORMATION" />
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Author</Text>
                <TextInput
                  style={[styles.textInput, SHADOW_SM]}
                  placeholder="Your name"
                  placeholderTextColor={C.textMuted}
                  value={formData.author}
                  onChangeText={(text) => updateField("author", text)}
                />
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>

        {/* ── Action Bar ── */}
        <View style={[styles.actionBar, { paddingBottom: insets.bottom }]}>
          <Pressable
            style={[styles.actionBtn, styles.saveDraftBtn, SHADOW_SM]}
            onPress={handleSaveDraft}
            disabled={isSubmitting}
          >
            <HugeiconsIcon
              icon={Bookmark02Icon}
              size={16}
              color={C.textMuted}
            />
            <Text style={styles.saveDraftText}>Save Draft</Text>
          </Pressable>

          <Pressable
            style={[
              styles.actionBtn,
              styles.createBtn,
              SHADOW_DARK,
              !isValid && styles.createBtnDisabled,
            ]}
            onPress={handleCreateProtocol}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={C.white} />
            ) : (
              <>
                <HugeiconsIcon icon={SparklesIcon} size={16} color={C.white} />
                <Text style={styles.createBtnText}>Create Protocol</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.8,
    textAlign: "center",
  },
  voiceBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },

  // Sections
  section: { marginBottom: 28 },
  inputGroup: { marginTop: 16 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textSecondary,
    marginBottom: 8,
  },

  // Black pill
  blackPill: {
    backgroundColor: C.black,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  blackPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 0.5,
  },

  // Inputs
  textInput: {
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: C.textPrimary,
  },
  textArea: {
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: C.textPrimary,
    minHeight: 100,
    textAlignVertical: "top",
  },

  // Type selection
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.bg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    minWidth: 100,
  },
  typeIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textPrimary,
  },

  // Tags
  tagSection: { marginBottom: 28 },
  tagInputRow: { marginTop: 16 },
  tagInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tagInputField: {
    flex: 1,
    fontSize: 14,
    color: C.textPrimary,
    padding: 0,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.card,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagChipText: {
    fontSize: 12,
    color: C.textSecondary,
    fontWeight: "500",
  },

  // Steps
  stepsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  addStepBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.blueBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addStepText: {
    fontSize: 12,
    color: C.blue,
    fontWeight: "600",
  },
  stepsList: { gap: 12 },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.bg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.separator,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.textPrimary,
  },
  stepContent: { flex: 1, gap: 8 },
  stepTitleInput: {
    fontSize: 14,
    color: C.textPrimary,
    fontWeight: "500",
    padding: 0,
  },
  stepMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  durationInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.card,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  durationInputText: {
    flex: 1,
    fontSize: 13,
    color: C.textPrimary,
    padding: 0,
  },
  tempInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.card,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tempInputText: {
    flex: 1,
    fontSize: 13,
    color: C.textPrimary,
    padding: 0,
  },
  stepActions: {
    flexDirection: "row",
    gap: 6,
  },
  stepActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },

  // Time input
  timeInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timeInputField: {
    flex: 1,
    fontSize: 14,
    color: C.textPrimary,
    padding: 0,
  },

  // Action bar
  actionBar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.separator,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
  },
  saveDraftBtn: {
    backgroundColor: C.card,
  },
  saveDraftText: {
    fontSize: 15,
    fontWeight: "600",
    color: C.textMuted,
  },
  createBtn: {
    backgroundColor: C.black,
  },
  createBtnDisabled: {
    backgroundColor: C.textMuted,
    opacity: 0.6,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: C.white,
  },
});
