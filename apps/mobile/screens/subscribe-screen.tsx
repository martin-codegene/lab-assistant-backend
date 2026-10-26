/**
 * subscribe.tsx
 *
 * Subscription flow for Lab Assistant AI — 4-step wizard.
 *
 * Step 1 → Choose Plan   (Free · Pro · Team)
 * Step 2 → Payment       (select card / add new card)
 * Step 3 → Confirm       (order summary + Pay button)
 * Step 4 → Result        (Subscribed ✓  or  Failed ✗ + retry/update)
 *
 * Design: white bg · #f4f4f7 cards · black accents — exact match to rest of app.
 */

import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import {
  AddCircleIcon,
  ArrowLeft01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  CreditCardIcon,
  Flask,
  LockIcon,
  RefreshIcon,
  ShieldCheck,
  SparklesIcon,
  UserMultiple02Icon,
  Warning,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
// TOKENS
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  android: { elevation: 8 },
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
    shadowOpacity: 0.055,
    shadowRadius: 6,
  },
  android: { elevation: 2 },
}) as any;
const SH_DARK = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  android: { elevation: 8 },
}) as any;

// ─────────────────────────────────────────────────────────────────────────────
// PLAN DATA
// ─────────────────────────────────────────────────────────────────────────────
type PlanId = "free" | "pro" | "team";
type BillingCycle = "monthly" | "annual";

interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  icon: any;
  color: string;
  bg: string;
  features: { text: string; included: boolean }[];
  badge?: string;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Get started for nothing",
    monthlyPrice: 0,
    annualPrice: 0,
    icon: Flask,
    color: C.textMuted,
    bg: C.card,
    features: [
      { text: "5 experiments / month", included: true },
      { text: "3 protocols", included: true },
      { text: "Basic AI interpretation", included: true },
      { text: "PDF export", included: false },
      { text: "Voice Mode", included: false },
      { text: "Priority support", included: false },
      { text: "Team collaboration", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For individual researchers",
    monthlyPrice: 19,
    annualPrice: 15,
    icon: SparklesIcon,
    color: C.purple,
    bg: C.purpleBg,
    badge: "Most Popular",
    features: [
      { text: "Unlimited experiments", included: true },
      { text: "Unlimited protocols", included: true },
      { text: "Advanced AI + root cause", included: true },
      { text: "PDF / DOCX export", included: true },
      { text: "Voice Mode", included: true },
      { text: "Priority support", included: true },
      { text: "Team collaboration", included: false },
    ],
  },
  {
    id: "team",
    name: "Team",
    tagline: "For labs & institutions",
    monthlyPrice: 49,
    annualPrice: 39,
    icon: UserMultiple02Icon,
    color: C.blue,
    bg: C.blueBg,
    badge: "Best Value",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Up to 20 members", included: true },
      { text: "Shared protocol library", included: true },
      { text: "Team analytics dashboard", included: true },
      { text: "Custom report branding", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "SSO / SAML login", included: true },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SAVED PAYMENT METHODS
// ─────────────────────────────────────────────────────────────────────────────
interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
  brandColor: string;
}

const SAVED_METHODS: PaymentMethod[] = [
  {
    id: "pm1",
    brand: "Visa",
    last4: "4242",
    expiry: "08/27",
    isDefault: true,
    brandColor: "#1a1f71",
  },
  {
    id: "pm2",
    brand: "Mastercard",
    last4: "8888",
    expiry: "12/25",
    isDefault: false,
    brandColor: "#eb001b",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SMALL ATOMS
// ─────────────────────────────────────────────────────────────────────────────
function BlackPill({ label }: { label: string }) {
  return (
    <View style={s.blackPill}>
      <Text style={s.blackPillText}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={s.divider} />;
}

function FeatureRow({ text, included }: { text: string; included: boolean }) {
  return (
    <View style={s.featureRow}>
      <View
        style={[
          s.featureIcon,
          { backgroundColor: included ? C.greenBg : C.card },
        ]}
      >
        <HugeiconsIcon
          icon={included ? CheckmarkCircle02Icon : Cancel01Icon}
          size={12}
          color={included ? C.green : C.textMuted}
        />
      </View>
      <Text style={[s.featureText, !included && s.featureTextDim]}>{text}</Text>
    </View>
  );
}

// Step indicator pill at the top
function StepBar({ current, total }: { current: number; total: number }) {
  const LABELS = ["Plan", "Payment", "Confirm", "Done"];
  return (
    <View style={s.stepBar}>
      {Array.from({ length: total }).map((_, i) => {
        const state = i < current ? "done" : i === current ? "active" : "idle";
        return (
          <React.Fragment key={i}>
            <View style={s.stepItem}>
              <View
                style={[
                  s.stepCircle,
                  state === "done" && s.stepCircleDone,
                  state === "active" && s.stepCircleActive,
                ]}
              >
                {state === "done" ? (
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={12}
                    color={C.white}
                  />
                ) : (
                  <Text
                    style={[s.stepNum, state === "active" && s.stepNumActive]}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  s.stepLabel,
                  state === "active" && s.stepLabelActive,
                  state === "done" && s.stepLabelDone,
                ]}
              >
                {LABELS[i]}
              </Text>
            </View>
            {i < total - 1 && (
              <View style={[s.stepLine, i < current && s.stepLineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — CHOOSE PLAN
// ─────────────────────────────────────────────────────────────────────────────
function StepPlan({
  selected,
  onSelect,
  billing,
  setBilling,
}: {
  selected: PlanId;
  onSelect: (id: PlanId) => void;
  billing: BillingCycle;
  setBilling: (b: BillingCycle) => void;
}) {
  return (
    <View style={s.stepContent}>
      <Text style={s.stepTitle}>Choose your plan</Text>
      <Text style={s.stepSubtitle}>
        Upgrade anytime · Cancel anytime · No hidden fees
      </Text>

      {/* Billing toggle */}
      <View style={[s.billingToggle, SH_SM]}>
        {(["monthly", "annual"] as BillingCycle[]).map((b) => (
          <Pressable
            key={b}
            style={[s.billingOption, billing === b && s.billingOptionActive]}
            onPress={() => setBilling(b)}
          >
            <Text
              style={[
                s.billingOptionText,
                billing === b && s.billingOptionTextActive,
              ]}
            >
              {b === "monthly" ? "Monthly" : "Annual"}
            </Text>
            {b === "annual" && (
              <View style={s.saveBadge}>
                <Text style={s.saveBadgeText}>Save 21%</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Plan cards */}
      {PLANS.map((plan) => {
        const isSelected = selected === plan.id;
        const price =
          billing === "monthly" ? plan.monthlyPrice : plan.annualPrice;
        const isFree = plan.monthlyPrice === 0;

        return (
          <Pressable
            key={plan.id}
            style={({ pressed }) => [
              s.planCard,
              SH_SM,
              isSelected && s.planCardSelected,
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => onSelect(plan.id)}
          >
            {/* Selected ring */}
            {isSelected && <View style={s.planCardRing} />}

            {/* Badge */}
            {plan.badge && (
              <View style={[s.planBadge, { backgroundColor: plan.color }]}>
                <Text style={s.planBadgeText}>{plan.badge}</Text>
              </View>
            )}

            <View style={s.planCardTop}>
              {/* Icon */}
              <View
                style={[
                  s.planIcon,
                  { backgroundColor: isSelected ? plan.color : plan.bg },
                ]}
              >
                <HugeiconsIcon
                  icon={plan.icon}
                  size={20}
                  color={isSelected ? C.white : plan.color}
                  strokeWidth={1.8}
                />
              </View>

              <View style={s.planCardMeta}>
                <Text style={[s.planName, isSelected && { color: plan.color }]}>
                  {plan.name}
                </Text>
                <Text style={s.planTagline}>{plan.tagline}</Text>
              </View>

              {/* Price */}
              <View style={s.planPriceCol}>
                {isFree ? (
                  <Text style={s.planPriceFree}>Free</Text>
                ) : (
                  <>
                    <View style={s.planPriceRow}>
                      <Text style={s.planPriceCurrency}>$</Text>
                      <Text
                        style={[
                          s.planPrice,
                          { color: isSelected ? plan.color : C.textPrimary },
                        ]}
                      >
                        {price}
                      </Text>
                    </View>
                    <Text style={s.planPricePer}>/mo</Text>
                  </>
                )}
              </View>
            </View>

            {/* Features */}
            {isSelected && (
              <View style={s.planFeatures}>
                <Divider />
                {plan.features.map((f, i) => (
                  <FeatureRow key={i} text={f.text} included={f.included} />
                ))}
                {billing === "annual" && !isFree && (
                  <View style={s.annualNote}>
                    <HugeiconsIcon
                      icon={ShieldCheck}
                      size={12}
                      color={C.green}
                    />
                    <Text style={s.annualNoteText}>
                      Billed ${price * 12}/year · Save $
                      {(plan.monthlyPrice - price) * 12}/year
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — PAYMENT METHOD
// ─────────────────────────────────────────────────────────────────────────────
function StepPayment({
  selectedMethod,
  onSelectMethod,
  onAddMethod,
}: {
  selectedMethod: string;
  onSelectMethod: (id: string) => void;
  onAddMethod: () => void;
}) {
  return (
    <View style={s.stepContent}>
      <Text style={s.stepTitle}>Payment method</Text>
      <Text style={s.stepSubtitle}>Select a saved card or add a new one</Text>

      {/* Saved methods */}
      {SAVED_METHODS.map((pm) => {
        const active = selectedMethod === pm.id;
        return (
          <Pressable
            key={pm.id}
            style={({ pressed }) => [
              s.payCard,
              SH_SM,
              active && s.payCardActive,
              pressed && { opacity: 0.88 },
            ]}
            onPress={() => onSelectMethod(pm.id)}
          >
            {/* Card art */}
            <View style={[s.cardArt, { backgroundColor: pm.brandColor }]}>
              <HugeiconsIcon
                icon={CreditCardIcon}
                size={18}
                color="rgba(255,255,255,0.9)"
              />
            </View>

            <View style={s.payCardInfo}>
              <Text style={s.payCardBrand}>
                {pm.brand} ···· {pm.last4}
              </Text>
              <Text style={s.payCardExpiry}>Expires {pm.expiry}</Text>
            </View>

            <View style={s.payCardRight}>
              {pm.isDefault && (
                <View style={s.defaultBadge}>
                  <Text style={s.defaultBadgeText}>Default</Text>
                </View>
              )}
              <View style={[s.radioOuter, active && s.radioOuterActive]}>
                {active && <View style={s.radioInner} />}
              </View>
            </View>
          </Pressable>
        );
      })}

      {/* Add new method */}
      <Pressable
        style={({ pressed }) => [
          s.addMethodBtn,
          SH_SM,
          pressed && { opacity: 0.8 },
        ]}
        onPress={onAddMethod}
      >
        <View style={s.addMethodIcon}>
          <HugeiconsIcon icon={AddCircleIcon} size={18} color={C.black} />
        </View>
        <Text style={s.addMethodText}>Add new payment method</Text>
        <HugeiconsIcon icon={CreditCardIcon} size={16} color={C.textMuted} />
      </Pressable>

      {/* Security note */}
      <View style={s.securityNote}>
        <HugeiconsIcon icon={LockIcon} size={13} color={C.textMuted} />
        <Text style={s.securityNoteText}>
          Payments are processed securely by Stripe. We never store your card
          details.
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD CARD SHEET
// ─────────────────────────────────────────────────────────────────────────────
function AddCardSheet({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: () => void;
}) {
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [zip, setZip] = useState("");
  const [saving, setSaving] = useState(false);

  const formatCard = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };
  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSaving(false);
    onAdd();
    onClose();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={s.sheetBody}>
        <View style={s.sheetTitleRow}>
          <BlackPill label="ADD CARD" />
          <Pressable style={s.sheetCloseBtn} onPress={onClose}>
            <HugeiconsIcon icon={Cancel01Icon} size={14} color={C.textMuted} />
          </Pressable>
        </View>

        {/* Mock card preview */}
        <View style={[s.cardPreview, SH_MD]}>
          <View style={s.cardPreviewTop}>
            <View style={s.cardChip} />
            <HugeiconsIcon
              icon={CreditCardIcon}
              size={22}
              color="rgba(255,255,255,0.5)"
            />
          </View>
          <Text style={s.cardPreviewNumber}>
            {number || "•••• •••• •••• ••••"}
          </Text>
          <View style={s.cardPreviewBottom}>
            <View>
              <Text style={s.cardPreviewLabel}>CARD HOLDER</Text>
              <Text style={s.cardPreviewValue}>{name || "Your Name"}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.cardPreviewLabel}>EXPIRES</Text>
              <Text style={s.cardPreviewValue}>{expiry || "MM/YY"}</Text>
            </View>
          </View>
        </View>

        {/* Fields */}
        {[
          {
            label: "Card Number",
            value: number,
            set: (v: string) => setNumber(formatCard(v)),
            placeholder: "1234 5678 9012 3456",
            kb: "number-pad" as const,
          },
          {
            label: "Cardholder Name",
            value: name,
            set: setName,
            placeholder: "As printed on card",
            kb: "default" as const,
          },
        ].map((f, i) => (
          <View key={i} style={s.cardFieldGroup}>
            <Text style={s.cardFieldLabel}>{f.label}</Text>
            <TextInput
              style={s.cardFieldInput}
              value={f.value}
              onChangeText={f.set}
              placeholder={f.placeholder}
              placeholderTextColor={C.textMuted}
              keyboardType={f.kb}
              autoCorrect={false}
            />
          </View>
        ))}

        <View style={s.cardFieldRow}>
          {[
            {
              label: "Expiry",
              value: expiry,
              set: (v: string) => setExpiry(formatExpiry(v)),
              placeholder: "MM/YY",
              kb: "number-pad" as const,
            },
            {
              label: "CVV",
              value: cvv,
              set: (v: string) => setCvv(v.replace(/\D/g, "").slice(0, 4)),
              placeholder: "•••",
              kb: "number-pad" as const,
            },
            {
              label: "ZIP / Postcode",
              value: zip,
              set: setZip,
              placeholder: "00000",
              kb: "default" as const,
            },
          ].map((f, i) => (
            <View key={i} style={[s.cardFieldGroup, { flex: 1 }]}>
              <Text style={s.cardFieldLabel}>{f.label}</Text>
              <TextInput
                style={s.cardFieldInput}
                value={f.value}
                onChangeText={f.set}
                placeholder={f.placeholder}
                placeholderTextColor={C.textMuted}
                keyboardType={f.kb}
                autoCorrect={false}
                maxLength={f.label === "CVV" ? 4 : undefined}
              />
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            s.saveBt,
            SH_DARK,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <>
              <HugeiconsIcon icon={LockIcon} size={15} color={C.white} />
              <Text style={s.saveBtText}>Save Card Securely</Text>
            </>
          )}
        </Pressable>

        <View style={s.securityNote}>
          <HugeiconsIcon icon={ShieldCheck} size={12} color={C.textMuted} />
          <Text style={s.securityNoteText}>
            256-bit SSL encryption · PCI DSS compliant
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — CONFIRM
// ─────────────────────────────────────────────────────────────────────────────
function StepConfirm({
  plan,
  billing,
  method,
}: {
  plan: Plan;
  billing: BillingCycle;
  method: PaymentMethod | undefined;
}) {
  const price = billing === "monthly" ? plan.monthlyPrice : plan.annualPrice;
  const isFree = plan.monthlyPrice === 0;
  const tax = isFree ? 0 : parseFloat((price * 0.085).toFixed(2));
  const total = isFree ? 0 : price + tax;
  const annual = billing === "annual";

  return (
    <View style={s.stepContent}>
      <Text style={s.stepTitle}>Confirm & pay</Text>
      <Text style={s.stepSubtitle}>
        Review your order before completing payment
      </Text>

      {/* Order summary card */}
      <View style={[s.confirmCard, SH_SM]}>
        {/* Plan row */}
        <View style={s.confirmRow}>
          <View style={[s.confirmPlanIcon, { backgroundColor: plan.bg }]}>
            <HugeiconsIcon icon={plan.icon} size={18} color={plan.color} />
          </View>
          <View style={s.confirmRowMeta}>
            <Text style={s.confirmRowTitle}>{plan.name} Plan</Text>
            <Text style={s.confirmRowSub}>
              {annual ? "Annual billing" : "Monthly billing"}
            </Text>
          </View>
          <Text style={[s.confirmRowPrice, { color: plan.color }]}>
            {isFree ? "Free" : `$${price}/mo`}
          </Text>
        </View>

        <Divider />

        {/* Billing breakdown */}
        {!isFree && (
          <>
            <View style={s.lineRow}>
              <Text style={s.lineLabel}>
                {annual ? "Annual total (12 mo)" : "Monthly charge"}
              </Text>
              <Text style={s.lineValue}>${annual ? price * 12 : price}.00</Text>
            </View>
            <View style={s.lineRow}>
              <Text style={s.lineLabel}>Tax (8.5%)</Text>
              <Text style={s.lineValue}>${tax}</Text>
            </View>
            <Divider />
            <View style={[s.lineRow, s.totalRow]}>
              <Text style={s.totalLabel}>Total due today</Text>
              <Text style={s.totalValue}>
                ${(annual ? price * 12 + tax : total).toFixed(2)}
              </Text>
            </View>
            {annual && (
              <View style={s.savingsRow}>
                <HugeiconsIcon icon={ShieldCheck} size={12} color={C.green} />
                <Text style={s.savingsText}>
                  You're saving ${(plan.monthlyPrice - price) * 12}/year vs
                  monthly billing
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Payment method */}
      {method && !isFree && (
        <View style={[s.confirmPayRow, SH_SM]}>
          <View
            style={[
              s.cardArt,
              s.cardArtSm,
              { backgroundColor: method.brandColor },
            ]}
          >
            <HugeiconsIcon
              icon={CreditCardIcon}
              size={14}
              color="rgba(255,255,255,0.9)"
            />
          </View>
          <View style={s.payCardInfo}>
            <Text style={s.payCardBrand}>
              {method.brand} ···· {method.last4}
            </Text>
            <Text style={s.payCardExpiry}>Expires {method.expiry}</Text>
          </View>
          <HugeiconsIcon icon={LockIcon} size={13} color={C.green} />
        </View>
      )}

      {/* What you get */}
      <View style={[s.featurePreviewCard, { borderLeftColor: plan.color }]}>
        <Text style={[s.featurePreviewTitle, { color: plan.color }]}>
          What's included in {plan.name}
        </Text>
        {plan.features
          .filter((f) => f.included)
          .map((f, i) => (
            <View key={i} style={s.featureRow}>
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                size={13}
                color={plan.color}
              />
              <Text style={s.featureText}>{f.text}</Text>
            </View>
          ))}
      </View>

      {/* Legal */}
      <Text style={s.legalText}>
        By tapping "Pay now" you agree to our Terms of Service and Privacy
        Policy.
        {annual
          ? " Your subscription will auto-renew annually."
          : " Your subscription will auto-renew monthly."}{" "}
        Cancel anytime in your profile settings.
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — RESULT
// ─────────────────────────────────────────────────────────────────────────────
function StepResult({
  success,
  plan,
  onRetry,
  onUpdatePayment,
  onDone,
}: {
  success: boolean;
  plan: Plan;
  onRetry: () => void;
  onUpdatePayment: () => void;
  onDone: () => void;
}) {
  return (
    <View style={s.resultContainer}>
      {/* Big icon */}
      <View
        style={[
          s.resultIcon,
          SH_DARK,
          { backgroundColor: success ? C.black : C.black },
        ]}
      >
        <HugeiconsIcon
          icon={success ? CheckmarkCircle02Icon : Cancel01Icon}
          size={52}
          color={success ? C.white : C.red}
          strokeWidth={1.4}
        />
        {/* Outer ring decoration */}
        <View
          style={[
            s.resultIconRing,
            {
              borderColor: success
                ? "rgba(36,179,95,0.18)"
                : "rgba(255,59,48,0.18)",
            },
          ]}
        />
      </View>

      {/* Status text */}
      <Text style={s.resultTitle}>
        {success ? "You're subscribed!" : "Payment failed"}
      </Text>
      <Text style={s.resultSubtitle}>
        {success
          ? `Welcome to ${plan.name}. Your new features are active right now.`
          : "We couldn't process your payment. Please try again or use a different card."}
      </Text>

      {/* Success detail card */}
      {success && (
        <View style={[s.successCard, SH_SM]}>
          {[
            { label: "Plan", value: `${plan.name}`, color: plan.color },
            { label: "Status", value: "Active", color: C.green },
            {
              label: "Next billing",
              value: "July 1, 2025",
              color: C.textPrimary,
            },
            {
              label: "Receipt",
              value: "Sent to a.mwila@unza.zm",
              color: C.textMuted,
            },
          ].map((row, i) => (
            <React.Fragment key={i}>
              <View style={s.successRow}>
                <Text style={s.successRowLabel}>{row.label}</Text>
                <Text style={[s.successRowValue, { color: row.color }]}>
                  {row.value}
                </Text>
              </View>
              {i < 3 && <Divider />}
            </React.Fragment>
          ))}
        </View>
      )}

      {/* Failed actions */}
      {!success && (
        <View style={[s.failCard, SH_SM]}>
          <View style={[s.failIconWrap, { backgroundColor: C.redBg }]}>
            <HugeiconsIcon icon={Warning} size={16} color={C.red} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.failReason}>Card declined</Text>
            <Text style={s.failSub}>Insufficient funds or card expired</Text>
          </View>
        </View>
      )}

      {/* Buttons */}
      {success ? (
        <Pressable
          style={({ pressed }) => [
            s.resultPrimaryBtn,
            SH_DARK,
            pressed && { opacity: 0.85 },
          ]}
          onPress={onDone}
        >
          <HugeiconsIcon icon={SparklesIcon} size={16} color={C.white} />
          <Text style={s.resultPrimaryBtnText}>Start using {plan.name}</Text>
        </Pressable>
      ) : (
        <View style={s.failButtons}>
          <Pressable
            style={({ pressed }) => [
              s.resultPrimaryBtn,
              SH_DARK,
              pressed && { opacity: 0.85 },
            ]}
            onPress={onRetry}
          >
            <HugeiconsIcon icon={RefreshIcon} size={16} color={C.white} />
            <Text style={s.resultPrimaryBtnText}>Retry payment</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              s.resultSecondaryBtn,
              SH_SM,
              pressed && { opacity: 0.8 },
            ]}
            onPress={onUpdatePayment}
          >
            <HugeiconsIcon icon={CreditCardIcon} size={15} color={C.black} />
            <Text style={s.resultSecondaryBtnText}>Update payment method</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function SubscribeScreen() {
  const insets = useSafeAreaInsets();

  // Wizard state
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("pro");
  const [billing, setBilling] = useState<BillingCycle>("annual");
  const [selectedMethod, setSelectMethod] = useState("pm1");
  const [paying, setPaying] = useState(false);
  const [payResult, setPayResult] = useState<"success" | "failed" | null>(null);

  // Simulate toggling for demo purposes
  const [demoSuccess, setDemoSuccess] = useState(true);

  // Add card sheet
  const addCardRef = useRef<BottomSheetModal>(null);
  const addCardSnap = useMemo(() => ["78%", "95%"], []);

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

  const plan = PLANS.find((p) => p.id === selectedPlan)!;
  const method = SAVED_METHODS.find((m) => m.id === selectedMethod);
  const price = billing === "monthly" ? plan.monthlyPrice : plan.annualPrice;
  const isFree = plan.monthlyPrice === 0;

  // Primary CTA label per step
  const ctaLabels: Record<number, string> = {
    0: "Continue →",
    1: "Continue →",
    2: isFree ? "Activate Free Plan" : `Pay $${price}/mo now`,
    3: "",
  };

  const handleCta = async () => {
    if (step < 2) {
      setStep((step + 1) as any);
      return;
    }
    // Step 3 → pay
    setPaying(true);
    await new Promise((r) => setTimeout(r, 2000));
    setPaying(false);
    setPayResult(demoSuccess ? "success" : "failed");
    setStep(3);
  };

  const handleBack = () => {
    if (step === 0) return;
    setStep((step - 1) as any);
  };

  const handleRetry = () => {
    setPayResult(null);
    setStep(2);
  };

  const handleUpdatePayment = () => {
    setPayResult(null);
    setStep(1);
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* ── Nav bar ── */}
      <View style={s.navBar}>
        {step < 3 ? (
          <Pressable
            style={[s.backBtn, SH_SM]}
            onPress={handleBack}
            disabled={step === 0}
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={18}
              color={step === 0 ? C.textMuted : C.black}
              strokeWidth={2}
            />
          </Pressable>
        ) : (
          <View style={s.backBtn} />
        )}

        {/* Step bar */}
        <View style={s.navCenter}>
          <StepBar current={step} total={4} />
        </View>

        {/* Demo toggle (dev helper — remove in production) */}
        {step === 2 && (
          <Pressable
            style={[s.demoToggle]}
            onPress={() => setDemoSuccess((v) => !v)}
          >
            <Text style={s.demoToggleText}>{demoSuccess ? "✓" : "✗"}</Text>
          </Pressable>
        )}
        {step !== 2 && <View style={{ width: 38 }} />}
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <StepPlan
            selected={selectedPlan}
            onSelect={setSelectedPlan}
            billing={billing}
            setBilling={setBilling}
          />
        )}
        {step === 1 && (
          <StepPayment
            selectedMethod={selectedMethod}
            onSelectMethod={setSelectMethod}
            onAddMethod={() => addCardRef.current?.present()}
          />
        )}
        {step === 2 && (
          <StepConfirm plan={plan} billing={billing} method={method} />
        )}
        {step === 3 && payResult && (
          <StepResult
            success={payResult === "success"}
            plan={plan}
            onRetry={handleRetry}
            onUpdatePayment={handleUpdatePayment}
            onDone={() => router.dismissTo("/(tabs)")}
          />
        )}
      </ScrollView>

      {/* ── Bottom CTA bar (hidden on step 4) ── */}
      {step < 3 && (
        <View style={[s.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
          {/* Mini plan summary */}
          {step > 0 && (
            <View style={s.ctaSummary}>
              <View style={[s.ctaSummaryIcon, { backgroundColor: plan.bg }]}>
                <HugeiconsIcon icon={plan.icon} size={13} color={plan.color} />
              </View>
              <Text style={s.ctaSummaryText}>
                {plan.name} · {isFree ? "Free" : `$${price}/mo`}
              </Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              s.ctaBtn,
              SH_DARK,
              pressed && { opacity: 0.85 },
              paying && { opacity: 0.75 },
            ]}
            onPress={handleCta}
            disabled={paying}
          >
            {paying ? (
              <>
                <ActivityIndicator color={C.white} size="small" />
                <Text style={s.ctaBtnText}>Processing…</Text>
              </>
            ) : (
              <>
                {step === 2 && !isFree && (
                  <HugeiconsIcon icon={LockIcon} size={15} color={C.white} />
                )}
                <Text style={s.ctaBtnText}>{ctaLabels[step]}</Text>
              </>
            )}
          </Pressable>

          {/* Trust badges */}
          {step === 2 && (
            <View style={s.trustRow}>
              {[
                { icon: ShieldCheck, label: "SSL Secure" },
                { icon: LockIcon, label: "PCI Compliant" },
                { icon: RefreshIcon, label: "Cancel Anytime" },
              ].map((t, i) => (
                <View key={i} style={s.trustItem}>
                  <HugeiconsIcon icon={t.icon} size={11} color={C.textMuted} />
                  <Text style={s.trustLabel}>{t.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── Add card bottom sheet ── */}
      <BottomSheetModal
        ref={addCardRef}
        snapPoints={addCardSnap}
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
          <AddCardSheet
            onClose={() => addCardRef.current?.dismiss()}
            onAdd={() => {}}
          />
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
  scroll: { paddingHorizontal: 20 },

  // ── Nav bar ───────────────────────────────────────────────────────────────
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  navCenter: { flex: 1 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  demoToggle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  demoToggleText: { fontSize: 16, fontWeight: "800" },

  // ── Step bar ──────────────────────────────────────────────────────────────
  stepBar: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepItem: { alignItems: "center", gap: 4 },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleDone: { backgroundColor: C.black },
  stepCircleActive: { backgroundColor: C.black },
  stepNum: { fontSize: 10, fontWeight: "800", color: C.textMuted },
  stepNumActive: { color: C.white },
  stepLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: C.textMuted,
    letterSpacing: 0.3,
  },
  stepLabelActive: { color: C.black },
  stepLabelDone: { color: C.black },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: C.card,
    marginHorizontal: 4,
    marginBottom: 14,
  },
  stepLineDone: { backgroundColor: C.black },

  // ── Content ───────────────────────────────────────────────────────────────
  stepContent: { paddingTop: 8, paddingBottom: 20, gap: 16 },
  stepTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: C.textMuted,
    marginTop: -8,
    lineHeight: 20,
  },

  // ── Billing toggle ────────────────────────────────────────────────────────
  billingToggle: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 4,
  },
  billingOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
    borderRadius: 13,
  },
  billingOptionActive: { backgroundColor: C.black },
  billingOptionText: { fontSize: 14, fontWeight: "700", color: C.textMuted },
  billingOptionTextActive: { color: C.white },
  saveBadge: {
    backgroundColor: C.green,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  saveBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 0.3,
  },

  // ── Plan cards ────────────────────────────────────────────────────────────
  planCard: {
    backgroundColor: C.bg,
    borderRadius: 24,
    padding: 18,
    position: "relative",
    overflow: "hidden",
  },
  planCardSelected: { backgroundColor: C.bg },
  planCardRing: {
    position: "absolute",
    inset: 0,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: C.black,
  },
  planBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 0.4,
  },
  planCardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  planIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  planCardMeta: { flex: 1 },
  planName: {
    fontSize: 17,
    fontWeight: "700",
    color: C.textPrimary,
    letterSpacing: -0.2,
  },
  planTagline: { fontSize: 12.5, color: C.textMuted, marginTop: 2 },
  planPriceCol: { alignItems: "flex-end" },
  planPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 1 },
  planPriceCurrency: {
    fontSize: 14,
    fontWeight: "700",
    color: C.textMuted,
    marginBottom: 2,
  },
  planPrice: { fontSize: 28, fontWeight: "800", letterSpacing: -1 },
  planPricePer: { fontSize: 11.5, color: C.textMuted },
  planPriceFree: { fontSize: 20, fontWeight: "800", color: C.textMuted },
  planFeatures: { marginTop: 14, gap: 8 },
  annualNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.greenBg,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  annualNoteText: { fontSize: 12.5, color: C.green, fontWeight: "600" },

  // ── Feature row ───────────────────────────────────────────────────────────
  featureRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  featureIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { fontSize: 13.5, color: C.textSecondary, flex: 1 },
  featureTextDim: { color: C.textMuted, textDecorationLine: "line-through" },

  // ── Payment cards ─────────────────────────────────────────────────────────
  payCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.bg,
    borderRadius: 20,
    padding: 16,
  },
  payCardActive: {},
  payCardInfo: { flex: 1 },
  payCardBrand: { fontSize: 15, fontWeight: "700", color: C.textPrimary },
  payCardExpiry: { fontSize: 12.5, color: C.textMuted, marginTop: 2 },
  payCardRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardArt: {
    width: 52,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cardArtSm: { width: 42, height: 30, borderRadius: 6 },
  defaultBadge: {
    backgroundColor: C.greenBg,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  defaultBadgeText: { fontSize: 10, fontWeight: "800", color: C.green },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.card,
  },
  radioOuterActive: { borderColor: C.black, backgroundColor: C.white },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.black,
  },
  addMethodBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.bg,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: C.card,
    borderStyle: "dashed",
  },
  addMethodIcon: {
    width: 52,
    height: 36,
    borderRadius: 8,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  addMethodText: { flex: 1, fontSize: 15, fontWeight: "600", color: C.black },
  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    paddingHorizontal: 4,
  },
  securityNoteText: {
    flex: 1,
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 17,
  },

  // ── Add card sheet ────────────────────────────────────────────────────────
  cardPreview: {
    backgroundColor: C.black,
    borderRadius: 20,
    padding: 22,
    gap: 14,
  },
  cardPreviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardChip: {
    width: 34,
    height: 26,
    borderRadius: 5,
    backgroundColor: "rgba(255,215,0,0.7)",
  },
  cardPreviewNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: C.white,
    letterSpacing: 3,
  },
  cardPreviewBottom: { flexDirection: "row", justifyContent: "space-between" },
  cardPreviewLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1.5,
  },
  cardPreviewValue: {
    fontSize: 14,
    fontWeight: "700",
    color: C.white,
    marginTop: 3,
  },
  cardFieldRow: { flexDirection: "row", gap: 10 },
  cardFieldGroup: { gap: 6 },
  cardFieldLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 0.8,
  },
  cardFieldInput: {
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: "500",
    color: C.textPrimary,
  },

  // ── Confirm step ──────────────────────────────────────────────────────────
  confirmCard: {
    backgroundColor: C.bg,
    borderRadius: 22,
    padding: 18,
    gap: 14,
  },
  confirmRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  confirmPlanIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmRowMeta: { flex: 1 },
  confirmRowTitle: { fontSize: 16, fontWeight: "700", color: C.textPrimary },
  confirmRowSub: { fontSize: 12.5, color: C.textMuted, marginTop: 2 },
  confirmRowPrice: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lineLabel: { fontSize: 13.5, color: C.textMuted },
  lineValue: { fontSize: 13.5, fontWeight: "600", color: C.textPrimary },
  totalRow: {},
  totalLabel: { fontSize: 16, fontWeight: "800", color: C.textPrimary },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
    color: C.textPrimary,
    letterSpacing: -0.5,
  },
  savingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.greenBg,
    borderRadius: 10,
    padding: 10,
  },
  savingsText: { fontSize: 12.5, color: C.green, fontWeight: "600" },
  confirmPayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.bg,
    borderRadius: 18,
    padding: 14,
  },
  featurePreviewCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderLeftWidth: 3,
  },
  featurePreviewTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  legalText: {
    fontSize: 11.5,
    color: C.textMuted,
    lineHeight: 17,
    textAlign: "center",
  },

  // ── Result step ───────────────────────────────────────────────────────────
  resultContainer: {
    paddingTop: 40,
    alignItems: "center",
    gap: 20,
  },
  resultIcon: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: C.black,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  resultIconRing: {
    position: "absolute",
    width: 154,
    height: 154,
    borderRadius: 77,
    borderWidth: 2,
  },
  resultTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: C.textPrimary,
    letterSpacing: -0.9,
    textAlign: "center",
  },
  resultSubtitle: {
    fontSize: 15,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  successCard: {
    backgroundColor: C.bg,
    borderRadius: 22,
    padding: 18,
    width: "100%",
    gap: 14,
  },
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  successRowLabel: { fontSize: 13.5, color: C.textMuted },
  successRowValue: { fontSize: 14, fontWeight: "700" },
  failCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: C.bg,
    borderRadius: 18,
    padding: 16,
    width: "100%",
  },
  failIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  failReason: { fontSize: 14.5, fontWeight: "700", color: C.red },
  failSub: { fontSize: 12.5, color: C.textMuted, marginTop: 2 },
  failButtons: { width: "100%", gap: 10 },

  resultPrimaryBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.black,
    borderRadius: 20,
    paddingVertical: 18,
  },
  resultPrimaryBtnText: { fontSize: 16, fontWeight: "700", color: C.white },
  resultSecondaryBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 20,
    paddingVertical: 16,
  },
  resultSecondaryBtnText: { fontSize: 15, fontWeight: "700", color: C.black },

  // ── Bottom CTA bar ────────────────────────────────────────────────────────
  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.bg,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: C.card,
  },
  ctaSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
  },
  ctaSummaryIcon: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaSummaryText: { fontSize: 13, fontWeight: "600", color: C.textMuted },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.black,
    borderRadius: 20,
    paddingVertical: 18,
  },
  ctaBtnText: { fontSize: 16, fontWeight: "700", color: C.white },
  trustRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingBottom: 2,
  },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  trustLabel: { fontSize: 10.5, color: C.textMuted, fontWeight: "600" },

  // ── Shared ────────────────────────────────────────────────────────────────
  divider: { height: 1, backgroundColor: C.card },
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
  sheetBg: { backgroundColor: C.bg, borderRadius: 32 },
  sheetHandle: { backgroundColor: "#e5e5ea", width: 40 },
  sheetContent: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 52 },
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
  saveBt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.black,
    borderRadius: 18,
    paddingVertical: 16,
  },
  saveBtText: { fontSize: 15, fontWeight: "700", color: C.white },
});
