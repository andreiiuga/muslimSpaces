"use client";

import { useState } from "react";
import { applyDayToAllDays, type DayHoursDraft } from "@muslimspaces/shared";
import { Text } from "@muslimspaces/ui";
import { cn } from "@/lib/utils";
import { useLocale } from "../../i18n/LocaleContext";

const timeInput =
  "w-full min-w-0 rounded-input border border-border bg-surface px-md py-sm text-md text-text outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:bg-background disabled:text-textFaint";

/**
 * One row per weekday. The row that currently has focus (anywhere inside it)
 * shows a "use for all days" action that copies its hours — and its
 * open/closed state — onto the whole week.
 */
export function WeeklyHoursEditor({ value, onChange }: { value: DayHoursDraft[]; onChange: (next: DayHoursDraft[]) => void }) {
  const { t } = useLocale();
  const [focusedDay, setFocusedDay] = useState<number | null>(null);

  function update(index: number, patch: Partial<DayHoursDraft>) {
    onChange(value.map((day, i) => (i === index ? { ...day, ...patch } : day)));
  }

  return (
    <div className="flex flex-col gap-[6px]">
      {value.map((day, index) => {
        const focused = focusedDay === index;
        const dayName = t(`submit.day${index + 1}`);
        return (
          <div
            key={index}
            onFocus={() => setFocusedDay(index)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusedDay((cur) => (cur === index ? null : cur));
            }}
            className={cn(
              "flex flex-col gap-[8px] rounded-input border px-md py-[10px] transition-colors",
              focused ? "border-primary bg-tealTint" : "border-border bg-surface",
            )}
          >
            <div className="flex min-h-[28px] items-center gap-[10px]">
              <Text size="sm" weight="medium">{dayName}</Text>
              <div className="flex-1" />
              {focused && (
                <button
                  type="button"
                  onClick={() => onChange(applyDayToAllDays(value, index))}
                  className="cursor-pointer rounded-pill border-0 bg-transparent px-[6px] py-[2px] text-xs font-semibold text-primaryDark underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {t("submit.useForAllDays")}
                </button>
              )}
              <label className="flex cursor-pointer items-center gap-[6px] text-sm text-textSecondary">
                <input
                  type="checkbox"
                  checked={day.closed}
                  onChange={(e) => update(index, { closed: e.target.checked })}
                  className="h-[16px] w-[16px] cursor-pointer accent-primary"
                />
                {t("common.closed")}
              </label>
            </div>
            <div className="flex items-center gap-[10px]">
              <input
                type="time"
                aria-label={`${dayName} — ${t("submit.openingHours")}`}
                value={day.opensAt}
                disabled={day.closed}
                onChange={(e) => update(index, { opensAt: e.target.value })}
                className={timeInput}
              />
              <Text size="sm" color="textMuted">{t("submit.to")}</Text>
              <input
                type="time"
                aria-label={`${dayName} — ${t("submit.to")}`}
                value={day.closesAt}
                disabled={day.closed}
                onChange={(e) => update(index, { closesAt: e.target.value })}
                className={timeInput}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
