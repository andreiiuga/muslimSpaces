import { Pressable, Text } from "react-native";
import { cva } from "class-variance-authority";
import { fontFamily } from "../fonts";
import { cn } from "../cn";
import type { ChipProps } from "./Chip.types";

const chip = cva("flex-row items-center gap-xs self-start rounded-pill border px-md py-xs", {
  variants: {
    selected: {
      true: "border-primary bg-primary",
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

export function Chip({ children, selected, onPress, icon }: ChipProps) {
  return (
    <Pressable onPress={onPress} className={cn(chip({ selected }))}>
      {icon}
      <Text className={cn(TEXT_CLASS, TEXT_COLOR_CLASS[selected ? "true" : "false"])} style={{ fontFamily: fontFamily("medium") }}>
        {children}
      </Text>
    </Pressable>
  );
}
