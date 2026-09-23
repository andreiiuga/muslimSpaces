"use client";

import { useEffect, useRef } from "react";
import { radii } from "../tokens";
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
    // width/height/borderRadius are per-instance dynamic values (width even
    // accepts arbitrary CSS strings like "calc(...)") — Tailwind's JIT can't
    // scan a dynamically built arbitrary-value class, so they stay inline;
    // only the static background color moves to a className.
    <div ref={ref} className="bg-border" style={{ width, height, borderRadius: circle ? 999 : borderRadius }} />
  );
}
