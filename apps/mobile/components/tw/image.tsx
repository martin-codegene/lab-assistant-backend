import { Image as RNImage } from "expo-image";
import React from "react";
import { StyleSheet } from "react-native";
import { useCssElement } from "react-native-css";
import Animated from "react-native-reanimated";

const AnimatedExpoImage = Animated.createAnimatedComponent(RNImage);

export type OriginalImageProps = React.ComponentProps<typeof RNImage>;

function CSSImage(props: React.ComponentProps<typeof AnimatedExpoImage>) {
    // @ts-expect-error: Remap objectFit style to contentFit property
    const { objectFit, objectPosition, ...style } =
        StyleSheet.flatten(props.style) || {};

    return (
        <AnimatedExpoImage
            contentFit={objectFit}
            contentPosition={objectPosition}
            {...props}
            source={
                typeof props.source === "string" ? { uri: props.source } : props.source
            }
            // @ts-expect-error: Style is remapped above
            style={style}
        />
    );
}

export type ImageProps = React.ComponentProps<typeof CSSImage>;

export const Image = (
    props: OriginalImageProps & { className?: string }
) => {
    // @ts-expect-error: Type instantiation is excessively deep
    return useCssElement(CSSImage, props, { className: "style" }) as React.ReactElement;
};

Image.displayName = "CSS(Image)";
