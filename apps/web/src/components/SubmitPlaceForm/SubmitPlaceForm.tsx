"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { BadgeCheck, Camera, MapPin as MapPinIcon } from "lucide-react";
import { Button, Chip, Input, Skeleton, Text, colors } from "@muslimspaces/ui";
import type { Category, Coordinates } from "@muslimspaces/shared";
import type { MapBounds } from "@muslimspaces/ui/map";
import { useLocale } from "../../i18n/LocaleContext";
import { pickLocalized } from "../../i18n/pick-localized";
import { BackLink } from "../BackLink/BackLink";

const MapView = dynamic(() => import("@muslimspaces/ui/map").then((m) => m.MapView), {
  ssr: false,
  loading: () => <Skeleton height="100%" borderRadius={0} />,
});

// Bucharest — this app is Romania-only (see CLAUDE.md), and every submitted
// place starts here rather than MapView's own whole-country default zoom,
// which is too wide to place a pin usefully. Mirrors apps/mobile's
// DEFAULT_LOCATION in pois/submit.tsx.
const DEFAULT_LOCATION: Coordinates = { lat: 44.4268, lng: 26.1025 };
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function LocationPicker({ value, onChange }: { value: Coordinates; onChange: (v: Coordinates) => void }) {
  function handleBoundsChange(bounds: MapBounds) {
    onChange({ lat: (bounds.minLat + bounds.maxLat) / 2, lng: (bounds.minLng + bounds.maxLng) / 2 });
  }

  return (
    <div className="relative mt-1 h-[250px] overflow-hidden rounded-lg border border-border">
      <MapView pois={[]} initialCenter={value} initialZoom={13} onBoundsChange={handleBoundsChange} />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
        <MapPinIcon size={34} fill={colors.danger} color={colors.danger} />
      </div>
    </div>
  );
}

export function SubmitPlaceForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { locale, t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<Coordinates>(DEFAULT_LOCATION);
  const [opensAt, setOpensAt] = useState("09:00");
  const [closesAt, setClosesAt] = useState("20:00");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [sentName, setSentName] = useState<string | null>(null);

  function toggleCategory(id: string) {
    setCategoryIds((prev) => {
      // Tapping the current primary (first) again demotes it instead of
      // removing it — tapping any non-primary a second time makes it
      // primary. Matches the "click the primary twice" copy in the label.
      if (prev[0] === id) return prev.slice(1).concat(id);
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

      if (TIME_RE.test(opensAt) && TIME_RE.test(closesAt)) {
        await fetch(`/api/pois/${poi.id}/hours`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i + 1, opensAt, closesAt }))),
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
          <BadgeCheck size={44} fill={colors.primaryLight} color={colors.primary} />
          <div className="mb-[10px] mt-[14px]">
            <Text size="3xl" weight="semibold">{t("submit.sentHeading")}</Text>
          </div>
          <Text size="md" color={colors.textMuted}>{t("submit.sentBody", { name: sentName })}</Text>
          <div className="mt-[22px]">
            <Button onPress={() => router.push("/")}>{t("submit.backToMap")}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1040px] px-[clamp(16px,4vw,28px)] pb-[60px] pt-[26px]">
      <BackLink href="/">{t("common.backToMap")}</BackLink>

      <div className="mb-[22px] mt-1">
        <Text size="3xl" weight="semibold">{t("submit.heading")}</Text>
        <div className="mt-sm">
          <Text size="sm" color={colors.textMuted}>{t("submit.subheading")}</Text>
        </div>
      </div>

      <div className="flex flex-wrap gap-[28px] rounded-lg bg-surface p-xl shadow-panel">
        <div className="flex min-w-[280px] flex-[1_1_380px] flex-col gap-xl">
          <Input label={t("submit.name")} value={name} onChangeText={setName} placeholder={t("submit.namePlaceholder")} />

          <div className="flex flex-col gap-[9px]">
            <Text size="xs" weight="medium" color={colors.textMuted}>{t("submit.categories").toUpperCase()}</Text>
            <div className="flex flex-wrap gap-sm">
              {categories.map((category) => {
                const selected = categoryIds.includes(category.id);
                const isPrimary = categoryIds[0] === category.id;
                return (
                  <Chip key={category.id} selected={selected} onPress={() => toggleCategory(category.id)}>
                    {pickLocalized(category.name, locale)}
                    {isPrimary ? " ·" : ""}
                  </Chip>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-[7px]">
            <Text size="xs" weight="medium" color={colors.textMuted}>{t("submit.openingHours").toUpperCase()}</Text>
            <div className="flex items-center gap-[10px]">
              <div className="min-w-0 flex-1">
                <Input value={opensAt} onChangeText={setOpensAt} placeholder="09:00" />
              </div>
              <Text size="sm" color={colors.textMuted}>{t("submit.to")}</Text>
              <div className="min-w-0 flex-1">
                <Input value={closesAt} onChangeText={setClosesAt} placeholder="20:00" />
              </div>
            </div>
            <Text size="xs" color={colors.textMuted}>{t("submit.hoursNote")}</Text>
          </div>

          <div className="flex flex-col gap-[9px]">
            <Text size="xs" weight="medium" color={colors.textMuted}>{t("submit.photos").toUpperCase()}</Text>
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
              className="flex h-[96px] w-[96px] cursor-pointer flex-col items-center justify-center gap-[5px] rounded-input border-[1.5px] border-dashed border-[#CBC5B8] bg-transparent text-primary"
            >
              {photo ? (
                <Text size="xs" color={colors.textMuted} align="center">{photo.name}</Text>
              ) : (
                <>
                  <Camera size={23} />
                  <Text size="xs" color={colors.primary}>{t("submit.add")}</Text>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex min-w-[280px] flex-[1_1_340px] flex-col gap-xl">
          <div className="flex flex-col gap-[7px]">
            <Text size="xs" weight="medium" color={colors.textMuted}>{t("submit.address").toUpperCase()}</Text>
            <Input value={address} onChangeText={setAddress} placeholder={t("submit.addressPlaceholder")} />
            <LocationPicker value={location} onChange={setLocation} />
            <Text size="xs" color={colors.textMuted}>{t("submit.dragPin")}</Text>
          </div>

          {note && <Text size="sm" color={colors.dangerDark}>{note}</Text>}

          <Button onPress={handleSubmit} loading={submitting}>
            {submitting ? t("submit.sending") : t("submit.send")}
          </Button>
        </div>
      </div>
    </div>
  );
}
