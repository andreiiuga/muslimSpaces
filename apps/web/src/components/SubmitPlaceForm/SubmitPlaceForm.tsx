"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Camera } from "lucide-react";
import { Button, Chip, Input, Text, Textarea } from "@muslimspaces/ui";
import { defaultWeekHours, weekHoursToPayload } from "@muslimspaces/shared";
import type { Category, Coordinates, DayHoursDraft } from "@muslimspaces/shared";
import { useLocale } from "../../i18n/LocaleContext";
import { pickLocalized } from "../../i18n/pick-localized";
import { BackLink } from "../BackLink/BackLink";
import { DEFAULT_LOCATION, LocationPicker } from "../LocationPicker/LocationPicker";
import { WeeklyHoursEditor } from "./WeeklyHoursEditor";

export function SubmitPlaceForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { locale, t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<Coordinates>(DEFAULT_LOCATION);
  const [weekHours, setWeekHours] = useState<DayHoursDraft[]>(defaultWeekHours);
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [sentName, setSentName] = useState<string | null>(null);

  function toggleCategory(id: string) {
    setCategoryIds((prev) => {
      // Cycle per chip: unselected -> selected -> primary -> unselected.
      // The first chip picked is primary by default (index 0).
      if (prev[0] === id) return prev.slice(1);
      if (prev.includes(id)) return [id, ...prev.filter((c) => c !== id)];
      return [...prev, id];
    });
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setNote(t("submit.nameRequired"));
      return;
    }
    if (categoryIds.length === 0) {
      setNote(t("submit.categoryRequired"));
      return;
    }
    if (!address.trim()) {
      setNote(t("submit.addressRequired"));
      return;
    }

    const hours = weekHoursToPayload(weekHours);
    if (!hours.ok) {
      setNote(t("submit.hoursInvalid"));
      return;
    }

    setSubmitting(true);
    setNote(null);
    try {
      const createRes = await fetch("/api/pois", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // The form only collects one name — both LocalizedText locales
          // get it verbatim, matching mobile's submit screen; a moderator
          // can split it into proper ro/en text while reviewing.
          name: { ro: name, en: name },
          // Same single-field-both-locales approach as the name; omitted when
          // empty since the API treats description as optional.
          ...(description.trim() && { description: { ro: description.trim(), en: description.trim() } }),
          categoryIds,
          primaryCategoryId: categoryIds[0],
          address,
          location,
        }),
      });
      if (!createRes.ok) {
        const body = await createRes.json().catch(() => undefined);
        throw new Error(body?.message ?? t("submit.genericError"));
      }
      const poi = await createRes.json();

      if (hours.payload.length > 0) {
        await fetch(`/api/pois/${poi.id}/hours`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(hours.payload),
        });
      }

      if (photo) {
        const form = new FormData();
        form.append("file", photo);
        const uploadRes = await fetch("/api/media", { method: "POST", body: form });
        if (uploadRes.ok) {
          const { storageKey } = await uploadRes.json();
          await fetch(`/api/pois/${poi.id}/images`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: "gallery", storageKey, sortOrder: 0 }),
          });
        }
      }

      setSentName(name);
    } catch (err) {
      setNote(err instanceof Error ? err.message : t("submit.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (sentName) {
    return (
      <div className="mx-auto max-w-[1040px] px-[clamp(16px,4vw,28px)] pb-[60px] pt-[26px]">
        <BackLink href="/">{t("common.backToMap")}</BackLink>
        <div className="max-w-[560px] py-[26px]">
          <BadgeCheck size={44} className="fill-primaryLight text-primaryDark" />
          <div className="mb-[10px] mt-[14px]">
            <Text size="3xl" weight="semibold">{t("submit.sentHeading")}</Text>
          </div>
          <Text size="md" color="textMuted">{t("submit.sentBody", { name: sentName })}</Text>
          <div className="mt-[22px]">
            <Button onPress={() => router.push("/")}>{t("submit.backToMap")}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[680px] px-[clamp(16px,4vw,28px)] pb-[60px] pt-[26px]">
      <BackLink href="/">{t("common.backToMap")}</BackLink>

      <div className="mb-[22px] mt-1">
        <Text size="3xl" weight="semibold">{t("submit.heading")}</Text>
        <div className="mt-sm">
          <Text size="sm" color="textMuted">{t("submit.subheading")}</Text>
        </div>
      </div>

      <div className="flex flex-col gap-xl rounded-lg bg-surface p-xl shadow-panel">
        <Input label={t("submit.name")} value={name} onChangeText={setName} placeholder={t("submit.namePlaceholder")} />

        <Textarea label={t("submit.description")} value={description} onChangeText={setDescription} placeholder={t("submit.descriptionPlaceholder")} rows={4} />

        <div className="flex flex-col gap-[9px]">
          <Text size="xs" weight="medium" color="textMuted">{t("submit.categories").toUpperCase()}</Text>
          <div className="flex flex-wrap gap-sm">
            {categories.map((category) => {
              const selected = categoryIds.includes(category.id);
              const isPrimary = categoryIds[0] === category.id;
              return (
                <Chip key={category.id} selected={selected} primary={isPrimary} onPress={() => toggleCategory(category.id)}>
                  {pickLocalized(category.name, locale)}
                    </Chip>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-[7px]">
          <Text size="xs" weight="medium" color="textMuted">{t("submit.address").toUpperCase()}</Text>
          <Input value={address} onChangeText={setAddress} placeholder={t("submit.addressPlaceholder")} />
          <LocationPicker value={location} onChange={setLocation} />
          <Text size="xs" color="textMuted">{t("submit.dragPin")}</Text>
        </div>

        <div className="flex flex-col gap-[7px]">
          <Text size="xs" weight="medium" color="textMuted">{t("submit.openingHours").toUpperCase()}</Text>
          <WeeklyHoursEditor value={weekHours} onChange={setWeekHours} />
        </div>

        <div className="flex flex-col gap-[9px]">
          <Text size="xs" weight="medium" color="textMuted">{t("submit.photos").toUpperCase()}</Text>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPhoto(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-[96px] w-[96px] cursor-pointer flex-col items-center justify-center gap-[5px] rounded-input border-[1.5px] border-dashed border-[#CBC5B8] bg-transparent text-primaryDark"
          >
            {photo ? (
              <Text size="xs" color="textMuted" align="center">{photo.name}</Text>
            ) : (
              <>
                <Camera size={23} />
                <Text size="xs" color="primaryDark">{t("submit.add")}</Text>
              </>
            )}
          </button>
        </div>

        {note && <Text size="sm" color="dangerDark">{note}</Text>}

        <Button onPress={handleSubmit} loading={submitting} fullWidth>
          {submitting ? t("submit.sending") : t("submit.send")}
        </Button>
      </div>
    </div>
  );
}
