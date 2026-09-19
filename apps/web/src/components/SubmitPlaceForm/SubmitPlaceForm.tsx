"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, Camera, MapPin as MapPinIcon } from "lucide-react";
import { Button, Chip, Input, Skeleton, Text, colors, radii, spacing } from "@muslimspaces/ui";
import type { Category, Coordinates } from "@muslimspaces/shared";
import type { MapBounds } from "@muslimspaces/ui/map";
import { useLocale } from "../../i18n/LocaleContext";
import { pickLocalized } from "../../i18n/pick-localized";

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
    <div style={{ position: "relative", height: 250, border: `1px solid ${colors.border}`, borderRadius: radii.lg, overflow: "hidden", marginTop: 4 }}>
      <MapView pois={[]} initialCenter={value} initialZoom={13} onBoundsChange={handleBoundsChange} />
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-100%)", pointerEvents: "none" }}>
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

  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;

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
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "26px clamp(16px,4vw,28px) 60px" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, fontSize: 14, color: colors.primary, textDecoration: "none" }}>
          <BackIcon size={18} /> {t("common.backToMap")}
        </Link>
        <div style={{ maxWidth: 560, padding: "26px 0" }}>
          <BadgeCheck size={44} fill={colors.primaryLight} color={colors.primary} />
          <div style={{ margin: "14px 0 10px" }}>
            <Text size="3xl" weight="semibold">{t("submit.sentHeading")}</Text>
          </div>
          <Text size="md" color={colors.textMuted}>{t("submit.sentBody", { name: sentName })}</Text>
          <div style={{ marginTop: 22 }}>
            <Button onPress={() => router.push("/")}>{t("submit.backToMap")}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "26px clamp(16px,4vw,28px) 60px" }}>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, fontSize: 14, color: colors.primary, textDecoration: "none" }}>
        <BackIcon size={18} /> {t("common.backToMap")}
      </Link>

      <div style={{ margin: "4px 0 22px" }}>
        <Text size="3xl" weight="semibold">{t("submit.heading")}</Text>
        <div style={{ marginTop: 8 }}>
          <Text size="sm" color={colors.textMuted}>{t("submit.subheading")}</Text>
        </div>
      </div>

      <div style={{ background: colors.surface, borderRadius: radii.lg, boxShadow: "0 1px 3px rgba(28,25,23,.08),0 6px 18px rgba(28,25,23,.05)", padding: 24, display: "flex", gap: 28, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 380px", minWidth: 280, display: "flex", flexDirection: "column", gap: spacing.xl }}>
          <Input label={t("submit.name")} value={name} onChangeText={setName} placeholder={t("submit.namePlaceholder")} />

          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <Text size="xs" weight="medium" color={colors.textMuted} letterSpacing={1.4}>{t("submit.categories").toUpperCase()}</Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
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

          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <Text size="xs" weight="medium" color={colors.textMuted} letterSpacing={1.4}>{t("submit.openingHours").toUpperCase()}</Text>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ flex: "1 1 0", minWidth: 0 }}>
                <Input value={opensAt} onChangeText={setOpensAt} placeholder="09:00" />
              </div>
              <Text size="sm" color={colors.textMuted}>{t("submit.to")}</Text>
              <div style={{ flex: "1 1 0", minWidth: 0 }}>
                <Input value={closesAt} onChangeText={setClosesAt} placeholder="20:00" />
              </div>
            </div>
            <Text size="xs" color={colors.textMuted}>{t("submit.hoursNote")}</Text>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <Text size="xs" weight="medium" color={colors.textMuted} letterSpacing={1.4}>{t("submit.photos").toUpperCase()}</Text>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPhoto(e.target.files?.[0] ?? null)}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 96, height: 96, border: "1.5px dashed #CBC5B8", borderRadius: radii.input, display: "flex",
                flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer",
                color: colors.primary, background: "transparent",
              }}
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

        <div style={{ flex: "1 1 340px", minWidth: 280, display: "flex", flexDirection: "column", gap: spacing.xl }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <Text size="xs" weight="medium" color={colors.textMuted} letterSpacing={1.4}>{t("submit.address").toUpperCase()}</Text>
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
