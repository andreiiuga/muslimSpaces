import type { ReactNode } from "react";

export interface ChipProps {
  children?: ReactNode;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
}
