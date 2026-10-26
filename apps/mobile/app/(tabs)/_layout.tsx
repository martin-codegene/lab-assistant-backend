import {
  AddToListIcon,
  Home09Icon,
  Mic02Icon,
  ToolsIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabTriggerSlotProps,
} from "expo-router/ui";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

// ─── Tab Config ─────────────────────────────────────────
const TABS = [
  { name: "index", href: "/", icon: Home09Icon, label: "Home" },
  {
    name: "protocols",
    href: "/protocols",
    icon: AddToListIcon,
    label: "Protocols",
  },
  { name: "analyze", href: "/analyze", icon: Mic02Icon, label: "Analyze" },
  { name: "tools", href: "/tools", icon: ToolsIcon, label: "Tools" },
  { name: "profile", href: "/profile", icon: UserIcon, label: "Profile" },
] as const;

// ─── Animation Tokens ───────────────────────────────────
const SPRING_SNAPPY = { tension: 340, friction: 24, useNativeDriver: true };
const SPRING_SOFT = { tension: 260, friction: 22, useNativeDriver: true };

// ─── Layout ─────────────────────────────────────────────
export default function TabLayout() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () =>
      setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setIsKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <Tabs>
      <View style={{ flex: 1 }}>
        <TabSlot />
      </View>

      <TabList
        style={[styles.tabList, isKeyboardVisible && { display: "none" }]}
      >
        {TABS.map((tab) => (
          <TabTrigger
            key={tab.name}
            name={tab.name}
            href={tab.href as any}
            asChild
          >
            <TabButton icon={tab.icon} label={tab.label} />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}

// ─── Tab Button ─────────────────────────────────────────

interface TabButtonProps extends TabTriggerSlotProps {
  icon: any;
  label: string;
}

const TabButton = React.forwardRef<View, TabButtonProps>(
  ({ icon, label, isFocused, onPress, ...props }, ref) => {
    const pressScale = useRef(new Animated.Value(1)).current;
    const pillOpacity = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
    const pillScale = useRef(new Animated.Value(isFocused ? 1 : 0.8)).current;
    const iconScale = useRef(new Animated.Value(isFocused ? 1.1 : 1)).current;
    const iconY = useRef(new Animated.Value(isFocused ? -2 : 0)).current;

    const ACTIVE_COLOR = "#000"; // Amber
    const INACTIVE_COLOR = "#6B7280"; // Gray

    useEffect(() => {
      Animated.parallel([
        Animated.spring(pillOpacity, {
          toValue: isFocused ? 1 : 0,
          ...SPRING_SOFT,
        }),
        Animated.spring(pillScale, {
          toValue: isFocused ? 1 : 0.8,
          ...SPRING_SOFT,
        }),
        Animated.spring(iconScale, {
          toValue: isFocused ? 1.1 : 1,
          ...SPRING_SNAPPY,
        }),
        Animated.spring(iconY, {
          toValue: isFocused ? -2 : 0,
          ...SPRING_SNAPPY,
        }),
      ]).start();
    }, [isFocused]);

    const handlePressIn = () => {
      Animated.spring(pressScale, {
        toValue: 0.85,
        ...SPRING_SNAPPY,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(pressScale, {
        toValue: 1,
        tension: 420,
        friction: 18,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Pressable
        {...props}
        ref={ref as any}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.tabTrigger}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={label}
      >
        <Animated.View
          style={[styles.buttonInner, { transform: [{ scale: pressScale }] }]}
        >
          {/* Active background pill */}
          <Animated.View
            style={[
              styles.activePill,
              {
                opacity: pillOpacity,
                transform: [{ scale: pillScale }],
              },
            ]}
          />

          {/* Icon */}
          <Animated.View
            style={{
              transform: [{ scale: iconScale }, { translateY: iconY }],
            }}
          >
            <HugeiconsIcon
              icon={icon}
              size={22}
              color={isFocused ? ACTIVE_COLOR : INACTIVE_COLOR}
              fill={isFocused ? ACTIVE_COLOR : "transparent"}
              strokeWidth={isFocused ? 0 : 1.8}
            />
          </Animated.View>
        </Animated.View>
      </Pressable>
    );
  },
);

TabButton.displayName = "TabButton";

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  tabList: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 32 : 24,
    left: 24,
    right: 24,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
      android: {
        elevation: 22,
      },
    }),
  },
  tabTrigger: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonInner: {
    alignItems: "center",
    justifyContent: "center",
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  activePill: {
    ...StyleSheet.absoluteFillObject,
    // backgroundColor: "rgba(0, 0, 0, 0.15)",
    // borderRadius: 27,
  },
});
