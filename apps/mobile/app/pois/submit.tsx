import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Camera, MapPin } from "lucide-react-native";
import { ApiError } from "@muslimspaces/shared";
import type { Category, Coordinates } from "@muslimspaces/shared";
import { Button, Chip, Input, Text, colors, radii, spacing } from "@muslimspaces/ui";
import { MapView } from "@muslimspaces/ui/map";
import type { MapBounds } from "@muslimspaces/ui/map";
import { api } from "../../src/lib/api-client";
import { localFileToUpload } from "../../src/lib/local-file";
import { useAuth } from "../../src/auth/AuthContext";
import { pickLocalized } from "../../src/i18n/pick-localized";
import type { LocaleCode } from "../../src/i18n";

// Bucharest — this app is Romania-only (see CLAUDE.md), and every submitted
// place starts here rather than at MapView's own whole-country default zoom,
// which is too wide to place a pin usefully.
const DEFAULT_LOCATION: Coordinates = { lat: 44.4268, lng: 26.1025 };
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function LocationPicker({ value, onChange }: { value: Coordinates; onChange: (v: Coordinates) => void }) {
  function handleBoundsChange(bounds: MapBounds) {
    onChange({ lat: (bounds.minLat + bounds.maxLat) / 2, lng: (bounds.minLng + bounds.maxLng) / 2 });
  }

  return (
    <View style={{ height: 140, borderRadius: radii.input, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
      <MapView pois={[]} initialCenter={value} initialZoom={13} onBoundsChange={handleBoundsChange} />
      <View style={{ position: "absolute", left: "50%", top: "50%", marginLeft: -15, marginTop: -30 }} pointerEvents="none">
        <MapPin size={30} color={colors.danger} fill={colors.danger} />
      </View>
    </View>
  );
}

export default function SubmitPlaceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const locale = i18n.language as LocaleCode;
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.categories.list().then(setCategories);
  }, []);

  const [name, setName] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<Coordinates>(DEFAULT_LOCATION);
  const [opensAt, setOpensAt] = useState("09:00");
  const [closesAt, setClosesAt] = useState("20:00");
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [sentName, setSentName] = useState<string | null>(null);

  function toggleCategory(id: string) {
    setCategoryIds((prev) => {
      // Tapping the current primary (first) again demotes it instead of
      // removing it — tapping any non-primary a second time makes it
      // primary. Matches the "tap the primary twice" copy in the label.
      if (prev[0] === id) return prev.slice(1).concat(id);
      if (prev.includes(id)) return [id, ...prev.filter((c) => c !== id)];
      return [...prev, id];
    });
  }

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets?.[0]) setPhoto(result.assets[0]);
  }

  async function handleSubmit() {
    if (!user) {
      router.push("/login");
      return;
    }
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
      const poi = await api.pois.create({
        // The form only collects one name — both LocalizedText locales get
        // it verbatim, matching what the design's single "Name" field
        // implies; a moderator can split it into proper ro/en text while
        // reviewing the submission.
        name: { ro: name, en: name },
        categoryIds,
        primaryCategoryId: categoryIds[0],
        address,
        location,
      });

      if (TIME_RE.test(opensAt) && TIME_RE.test(closesAt)) {
        await api.pois.hours.set(
          poi.id,
          Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i + 1, opensAt, closesAt })),
        );
      }

      if (photo) {
        const filename = photo.fileName ?? "photo.jpg";
        const file = await localFileToUpload(photo.uri);
        const { storageKey } = await api.media.upload(file, filename);
        await api.pois.images.attach(poi.id, { role: "gallery", storageKey, sortOrder: 0 });
      }

      setSentName(name);
    } catch (err) {
      setNote(err instanceof ApiError ? err.message : t("submit.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (sentName) {
    return (
      <View style={{ flex: 1, alignItems: "flex-start", justifyContent: "center", padding: spacing.xl, gap: spacing.md }}>
        <Text size="2xl" weight="semibold">{t("submit.sentHeading")}</Text>
        <Text color={colors.textMuted}>{t("submit.sentBody", { name: sentName })}</Text>
        <Button onPress={() => router.replace("/(tabs)")}>{t("submit.backToMap")}</Button>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
      <View style={{ gap: 4 }}>
        <Text size="2xl" weight="semibold">{t("submit.heading")}</Text>
        <Text size="sm" color={colors.textMuted}>{t("submit.subheading")}</Text>
      </View>

      <Input label={t("submit.name")} value={name} onChangeText={setName} placeholder={t("submit.namePlaceholder")} />

      <View style={{ gap: spacing.xs }}>
        <Text size="sm" weight="medium">{t("submit.categories")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
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
        </View>
      </View>

      <View style={{ gap: spacing.xs }}>
        <Input label={t("submit.address")} value={address} onChangeText={setAddress} placeholder={t("submit.addressPlaceholder")} />
        <LocationPicker value={location} onChange={setLocation} />
        <Text size="xs" color={colors.textMuted}>{t("submit.dragPin")}</Text>
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text size="sm" weight="medium">{t("submit.openingHours")}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Input value={opensAt} onChangeText={setOpensAt} placeholder="09:00" />
          </View>
          <Text size="sm" color={colors.textMuted}>{t("submit.to")}</Text>
          <View style={{ flex: 1 }}>
            <Input value={closesAt} onChangeText={setClosesAt} placeholder="20:00" />
          </View>
        </View>
        <Text size="xs" color={colors.textMuted}>{t("submit.hoursNote")}</Text>
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text size="sm" weight="medium">{t("submit.photos")}</Text>
        <Pressable
          onPress={pickPhoto}
          style={{
            width: 84,
            height: 84,
            borderRadius: radii.input,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            overflow: "hidden",
          }}
        >
          {photo ? (
            <Text size="xs" color={colors.textMuted} align="center">{photo.fileName ?? "photo.jpg"}</Text>
          ) : (
            <>
              <Camera size={22} color={colors.primary} />
              <Text size="xs" color={colors.primary}>{t("submit.add")}</Text>
            </>
          )}
        </Pressable>
      </View>

      {note && <Text size="sm" color={colors.dangerDark}>{note}</Text>}

      <Button onPress={handleSubmit} loading={submitting} fullWidth>
        {submitting ? t("submit.sending") : t("submit.send")}
      </Button>
    </ScrollView>
  );
}
