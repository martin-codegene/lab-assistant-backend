import {
    useCssElement,
    useNativeVariable as useFunctionalVariable,
} from "react-native-css";

import { Link as RouterLink } from "expo-router";
import React from "react";
import {
    Pressable as RNPressable,
    ScrollView as RNScrollView,
    Text as RNText,
    TextInput as RNTextInput,
    TouchableHighlight as RNTouchableHighlight,
    TouchableOpacity as RNTouchableOpacity,
    View as RNView,
    StyleSheet,
} from "react-native";
import Animated from "react-native-reanimated";

// CSS-enabled Link
export const Link = (
    props: React.ComponentProps<typeof RouterLink> & { className?: string }
) => {
    return useCssElement(RouterLink, props, { className: "style" });
};

Link.Trigger = RouterLink.Trigger;
Link.Menu = RouterLink.Menu;
Link.MenuAction = RouterLink.MenuAction;
Link.Preview = RouterLink.Preview;

// CSS Variable hook
export const useCSSVariable =
    process.env.EXPO_OS !== "web"
        ? useFunctionalVariable
        : (variable: string) => `var(${variable})`;

// View
export type ViewProps = React.ComponentProps<typeof RNView> & {
    className?: string;
};

export const View = (props: ViewProps) => {
    return useCssElement(RNView, props, { className: "style" });
};
View.displayName = "CSS(View)";

// Text
export const Text = (
    props: React.ComponentProps<typeof RNText> & { className?: string }
) => {
    return useCssElement(RNText, props, { className: "style" });
};
Text.displayName = "CSS(Text)";

// ScrollView
export const ScrollView = (
    props: React.ComponentProps<typeof RNScrollView> & {
        className?: string;
        contentContainerClassName?: string;
    }
) => {
    return useCssElement(RNScrollView, props, {
        className: "style",
        contentContainerClassName: "contentContainerStyle",
    });
};
ScrollView.displayName = "CSS(ScrollView)";

// Pressable
export const Pressable = (
    props: React.ComponentProps<typeof RNPressable> & { className?: string }
) => {
    return useCssElement(RNPressable, props, { className: "style" });
};
Pressable.displayName = "CSS(Pressable)";

// TextInput
export const TextInput = (
    props: React.ComponentProps<typeof RNTextInput> & { className?: string }
) => {
    return useCssElement(RNTextInput, props, { className: "style" });
};
TextInput.displayName = "CSS(TextInput)";

export type AnimatedScrollViewProps = React.ComponentProps<typeof RNScrollView>;

// AnimatedScrollView
export const AnimatedScrollView = (
    props: AnimatedScrollViewProps & {
        className?: string;
        contentClassName?: string;
        contentContainerClassName?: string;
    }
) => {
    // @ts-expect-error: Type instantiation is excessively deep
    return useCssElement(Animated.ScrollView, props, {
        className: "style",
        contentClassName: "contentContainerStyle",
        contentContainerClassName: "contentContainerStyle",
    }) as React.ReactElement;
};

// TouchableHighlight with underlayColor extraction
function XXTouchableHighlight(
    props: React.ComponentProps<typeof RNTouchableHighlight>
) {
    const { underlayColor, ...style } = (StyleSheet.flatten(props.style) || {}) as any;
    return (
        <RNTouchableHighlight
            underlayColor={underlayColor}
            {...props}
            style={style}
        />
    );
}

export const TouchableHighlight = (
    props: React.ComponentProps<typeof RNTouchableHighlight>
) => {
    return useCssElement(XXTouchableHighlight, props, { className: "style" });
};
TouchableHighlight.displayName = "CSS(TouchableHighlight)";

// TouchableOpacity
export const TouchableOpacity = (
    props: React.ComponentProps<typeof RNTouchableOpacity> & { className?: string }
) => {
    return useCssElement(RNTouchableOpacity, props, { className: "style" });
};
TouchableOpacity.displayName = "CSS(TouchableOpacity)";
