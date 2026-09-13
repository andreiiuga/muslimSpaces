"use client";

import { useEffect, useRef } from "react";
import { colors, radii } from "../tokens";
import type { SkeletonProps } from "./Skeleton.types";

export function Skeleton({ width = "100%", height = 16, borderRadius = radii.sm, circle }: SkeletonProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Web Animations API instead of a CSS keyframes file — keeps this
  // component fully self-contained, no global stylesheet for consumers to
  // remember to import.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const animation = node.animate([{ opacity: 1 }, { opacity: 0.5 }, { opacity: 1 }], {
      duration: 1200,
      iterations: Infinity,
    });
    return () => animation.cancel();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width,
        height,
        borderRadius: circle ? 999 : borderRadius,
        backgroundColor: colors.border,
      }}
    />
  );
}
