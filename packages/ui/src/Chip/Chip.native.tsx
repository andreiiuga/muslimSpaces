import { Pressable, Text } from "react-native";
import { cva } from "class-variance-authority";
import { fontFamily } from "../fonts";
import { cn } from "../cn";
import type { ChipProps } from "./Chip.types";

const chip = cva("flex-row items-center gap-xs self-start rounded-pill border px-md py-xs", {
  variants: {
    selected: {
      true: "border-primary bg-primary",
      primary: "border-star bg-star",
      false: "border-border bg-surface",
    },
  },
  defaultVariants: { selected: false },
});

const TEXT_CLASS = "text-sm";
const TEXT_COLOR_CLASS = {
  true: "text-textOnPrimary",
  false: "text-text",
};

export function Chip({ children, selected, primary, onPress, icon }: ChipProps) {
  return (
    <Pressable onPress={onPress} className={cn(chip({ selected: primary && selected ? "primary" : selected }))}>
      {icon}
      <Text className={cn(TEXT_CLASS, primary && selected ? "text-text" : TEXT_COLOR_CLASS[selected ? "true" : "false"])} style={{ fontFamily: fontFamily("medium") }}>
        {children}
      </Text>
    </Pressable>
  );
}
