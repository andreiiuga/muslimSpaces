/**
 * Converts a locally-picked file's URI (expo-image-picker's `asset.uri`)
 * into a real `Blob` for `packages/shared`'s `media.upload`.
 *
 * The old approach — passing a plain `{ uri, name, type }` object cast
 * `as unknown as Blob` straight into `FormData.append` — worked under
 * React Native's own `fetch`, which reads a blob-like object's `uri`
 * directly. Since Expo SDK 57, `global.fetch` is Expo's own "winter" fetch
 * runtime instead, and its multipart encoder requires each part to be a
 * real `Blob` — a plain `{ uri, name, type }` object throws "Unsupported
 * FormDataPart implementation".
 *
 * `fetch(uri).then(r => r.blob())` reads the local file through React
 * Native's own Blob machinery (`globalThis.Blob` is still RN's polyfill,
 * independent of Expo's fetch swap — see `expo/src/winter/fetch/
 * createBlob.ts`) and infers `.type` from the response's Content-Type
 * header. Deliberately returns a plain `Blob`, not a `File`: `client.ts`'s
 * `uploadFile` calls `form.append("file", file, filename)`, and Expo's
 * global `FormData.append` patch (`expo/src/winter/FormData.ts`) always
 * tries to set `value.name = filename` on anything `instanceof Blob` to
 * honor that 3rd argument — which throws ("Cannot assign to property
 * 'name' which has only a getter") against a real RN `File`, since `File`
 * defines `.name` as a read-only accessor on its prototype. Plain `Blob`
 * has no `.name` at all, so that same assignment just creates the property
 * instead of colliding with an existing getter.
 */
export async function localFileToUpload(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}
