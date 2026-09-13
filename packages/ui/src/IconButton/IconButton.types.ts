import type { ReactNode } from "react";

export type IconButtonVariant = "ghost" | "solid";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps {
  /** A lucide icon element, e.g. <Heart size={20} /> — kept icon-agnostic here. */
  icon: ReactNode;
  onPress?: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  /** Accessible label — required since an icon alone has no text content. */
  label: string;
}
