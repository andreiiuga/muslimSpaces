import { useState } from "react";
import { Pressable, Switch, View } from "react-native";
import { useTranslation } from "react-i18next";
import { applyDayToAllDays, type DayHoursDraft } from "@muslimspaces/shared";
import { Input, Text, colors, radii, spacing } from "@muslimspaces/ui";

/**
 * One row per weekday. The row last focused (tapped into a time field or
 * toggled) shows a "use for all days" action copying its hours — and its
 * open/closed state — onto the whole week.
 */
export function WeeklyHoursEditor({ value, onChange }: { value: DayHoursDraft[]; onChange: (next: DayHoursDraft[]) => void }) {
  const { t } = useTranslation();
  const [focusedDay, setFocusedDay] = useState<number | null>(null);

  function update(index: number, patch: Partial<DayHoursDraft>) {
    onChange(value.map((day, i) => (i === index ? { ...day, ...patch } : day)));
  }

  return (
    <View style={{ gap: spacing.xs }}>
      {value.map((day, index) => {
        const focused = focusedDay === index;
        return (
          <View
            key={index}
            style={{
              gap: spacing.xs,
              padding: spacing.sm,
              borderRadius: radii.input,
              borderWidth: 1,
              borderColor: focused ? colors.primary : colors.border,
              backgroundColor: focused ? colors.tealTint : colors.surface,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Text size="sm" weight="medium">{t(`submit.day${index + 1}`)}</Text>
              <View style={{ flex: 1 }} />
              {focused && (
                <Pressable onPress={() => onChange(applyDayToAllDays(value, index))} hitSlop={8}>
                  <Text size="xs" weight="semibold" color={colors.primaryDark}>{t("submit.useForAllDays")}</Text>
                </Pressable>
              )}
              <Text size="sm" color={colors.textMuted}>{t("common.closed")}</Text>
              <Switch
                value={day.closed}
                onValueChange={(closed) => {
                  setFocusedDay(index);
                  update(index, { closed });
                }}
                trackColor={{ true: colors.primary }}
              />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Input value={day.opensAt} onChangeText={(opensAt) => update(index, { opensAt })} placeholder="09:00" disabled={day.closed} onFocus={() => setFocusedDay(index)} />
              </View>
              <Text size="sm" color={colors.textMuted}>{t("submit.to")}</Text>
              <View style={{ flex: 1 }}>
                <Input value={day.closesAt} onChangeText={(closesAt) => update(index, { closesAt })} placeholder="20:00" disabled={day.closed} onFocus={() => setFocusedDay(index)} />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
