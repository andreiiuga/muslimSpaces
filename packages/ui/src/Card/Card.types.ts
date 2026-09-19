import type { ReactNode } from "react";

export interface CardProps {
  children?: ReactNode;
  onPress?: () => void;
  padding?: number;
  /** Heavier "lifted off the page" shadow — blog cards, feature strips. */
  elevated?: boolean;
  /** Overrides the default `radii.lg` corner radius (e.g. `radii.cardLg`). */
  radius?: number;
}
