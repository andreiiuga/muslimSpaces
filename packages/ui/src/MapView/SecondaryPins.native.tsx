import { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, Easing, View } from "react-native";
import { ORBIT_PERIOD_MS, ORBIT_RADIUS_RATIO, PIN_EMOJI, PIN_EMOJI_SIZE, SATELLITE_SCALE, satellitePhaseDeg } from "./pin-utils";
import type { PinIconKey } from "./pin-utils";

// Satellites and their orbit scale from the primary emoji's size (ratios in pin-utils.ts).
const SATELLITE_SIZE = PIN_EMOJI_SIZE * SATELLITE_SCALE;
const ORBIT_RADIUS = PIN_EMOJI_SIZE * ORBIT_RADIUS_RATIO;

/**
 * One looping 0→1 clock for every orbiting pin on the map, so N pins cost
 * one native-driven animation rather than N. Create it once in MapView and
 * pass it down as `progress`. Honors the OS "reduce motion" setting by
 * never starting — satellites then sit still at their phase angle.
 */
export function useOrbitProgress(): Animated.Value {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced || cancelled) return;
      loop = Animated.loop(
        Animated.timing(progress, { toValue: 1, duration: ORBIT_PERIOD_MS, easing: Easing.linear, useNativeDriver: true }),
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [progress]);
  return progress;
}

/**
 * Secondary-category emoji drifting around the pin's main icon. Mount inside
 * the (relatively positioned) wrapper around the main emoji — everything here
 * is absolutely positioned, so it adds nothing to the marker's layout.
 *
 * Each satellite is an arm that rotates around the icon's center, with the
 * emoji at its end counter-rotating to stay upright; same construction as
 * the web variant's CSS keyframes (see createSatelliteElement in MapView.tsx).
 */
export function SecondaryPins({ icons, progress }: { icons: PinIconKey[]; progress: Animated.Value }) {
  return (
    <>
      {icons.map((iconKey, i) => {
        const phase = satellitePhaseDeg(i, icons.length);
        const armRotation = progress.interpolate({ inputRange: [0, 1], outputRange: [`${phase}deg`, `${phase + 360}deg`] });
        const counterRotation = progress.interpolate({ inputRange: [0, 1], outputRange: [`${-phase}deg`, `${-phase - 360}deg`] });
        return (
          <Animated.View
            key={iconKey}
            pointerEvents="none"
            className="absolute left-1/2 top-1/2 h-0 w-0"
            style={{ transform: [{ rotate: armRotation }] }}
          >
            <Animated.View
              className="absolute items-center justify-center"
              style={{
                width: SATELLITE_SIZE,
                height: SATELLITE_SIZE,
                left: ORBIT_RADIUS - SATELLITE_SIZE / 2,
                top: -SATELLITE_SIZE / 2,
                transform: [{ rotate: counterRotation }],
              }}
            >
              <Animated.Text style={{ fontSize: SATELLITE_SIZE * 0.9, lineHeight: SATELLITE_SIZE }}>
                {PIN_EMOJI[iconKey]}
              </Animated.Text>
            </Animated.View>
          </Animated.View>
        );
      })}
    </>
  );
}
