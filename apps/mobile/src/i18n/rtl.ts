import { Alert, I18nManager } from "react-native";
import type { LocaleCode } from "./index";

/**
 * React Native's layout direction is a native flag (I18nManager.isRTL) read
 * once at process launch — forceRTL only changes what the *next* launch
 * will read. Android's runtime picks this up on a JS reload (what
 * Updates.reloadAsync() does), but iOS does not: there is no supported
 * JS-callable way to kill and relaunch the native process from inside the
 * app, so on iOS the direction only actually flips once the user manually
 * force-quits and reopens MuslimSpaces. Rather than silently working on
 * Android and silently failing on iOS, this always asks — reloadAsync is
 * still worth trying first since it picks up every other language change
 * immediately and does no harm if the direction itself needs a manual
 * relaunch afterwards.
 *
 * expo-updates is a *native* module — like @maplibre/maplibre-react-native
 * (see CLAUDE.md), it only exists in a dev client / build that was
 * prebuilt after it was added as a dependency. Importing it statically
 * would throw "Cannot find native module 'ExpoUpdates'" at module-eval
 * time on any older dev client, taking down every screen that transitively
 * imports this file — so it's loaded dynamically and failure is silent
 * here (the Alert below still tells the user to relaunch by hand either way).
 */
async function tryReload(): Promise<void> {
  try {
    const Updates = await import("expo-updates");
    await Updates.reloadAsync();
  } catch {
    // No linked native module (dev client needs rebuilding) or reload
    // itself failed — either way, the Alert already told the user to
    // relaunch manually, so there's nothing further to surface here.
  }
}

export async function applyLocaleDirection(
  locale: LocaleCode,
  restartTitle: string,
  restartBody: string,
  restartConfirm: string,
): Promise<void> {
  const shouldBeRTL = locale === "ar";
  if (I18nManager.isRTL === shouldBeRTL) return;

  I18nManager.allowRTL(shouldBeRTL);
  I18nManager.forceRTL(shouldBeRTL);

  Alert.alert(restartTitle, restartBody, [{ text: restartConfirm, onPress: () => void tryReload() }]);
}
