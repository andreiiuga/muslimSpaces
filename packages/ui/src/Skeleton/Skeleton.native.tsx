import { useEffect, useRef } from "react";
import { Animated, type DimensionValue } from "react-native";
import { radii } from "../tokens";
import type { SkeletonProps } from "./Skeleton.types";

export function Skeleton({ width = "100%", height = 16, borderRadius = radii.sm, circle }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.5, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      className="bg-border"
      style={{
        // Shared prop type allows a generic string (for web's arbitrary CSS
        // values like "calc(...)"); RN's own style types are narrower.
        width: width as DimensionValue,
        height: height as DimensionValue,
        borderRadius: circle ? 999 : borderRadius,
        opacity,
      }}
    />
  );
}
