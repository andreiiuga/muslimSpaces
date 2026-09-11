/**
 * Stored as jsonb. Must always carry at least `ro` + `en` — enforced at the
 * application boundary by `localizedTextSchema` in @muslimspaces/shared, not
 * by a DB constraint (jsonb has no per-key NOT NULL).
 */
export interface LocalizedText {
  ro: string;
  en: string;
  [locale: string]: string;
}
