import type { ReactNode } from "react";

export interface ChipProps {
  children?: ReactNode;
  selected?: boolean;
  /** Highlights a selected chip as the "headline" one (e.g. a POI's primary category). */
  primary?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
}
