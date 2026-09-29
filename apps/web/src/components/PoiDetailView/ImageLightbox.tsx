"use client";

/**
 * Built directly on @radix-ui/react-dialog rather than the shadcn `Sheet`
 * wrapper (apps/web/src/components/ui/sheet.tsx) — Sheet is styled for a
 * slide-in side panel, not a full-bleed centered image viewer, and this
 * needs different overlay/content styling. Same underlying primitive
 * either way (already a dependency, no new package needed), so this still
 * gets Radix's focus trap, portal, and Escape-to-close for free.
 */
import { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PoiImage } from "@muslimspaces/shared";
import { useLocale } from "../../i18n/LocaleContext";

export function ImageLightbox({
  images,
  index,
  poiName,
  onIndexChange,
  onClose,
}: {
  images: PoiImage[];
  index: number;
  poiName: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const image = images[index];
  const hasMultiple = images.length > 1;

  // Radix's own focus trap + Escape-to-close cover the dialog itself;
  // arrow-key browsing between photos is this component's own addition.
  useEffect(() => {
    if (!hasMultiple) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") onIndexChange((index + 1) % images.length);
      if (event.key === "ArrowLeft") onIndexChange((index - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [hasMultiple, index, images.length, onIndexChange]);

  if (!image) return null;

  return (
    <Dialog.Root open onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-md p-[20px] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">{poiName}</Dialog.Title>

          <Dialog.Close
            aria-label={t("poi.closePhotos")}
            className="absolute end-[16px] top-[16px] inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-pill border-0 bg-black/50 text-white"
          >
            <X size={22} />
          </Dialog.Close>

          {hasMultiple && (
            <button
              type="button"
              onClick={() => onIndexChange((index - 1 + images.length) % images.length)}
              aria-label={t("poi.previousPhoto")}
              className="absolute start-[12px] top-1/2 inline-flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-pill border-0 bg-black/50 text-white"
            >
              <ChevronLeft size={26} />
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element -- pre-optimized WebP from our own media pipeline */}
          <img src={image.url} alt="" className="max-h-[85vh] max-w-full rounded-lg object-contain" />

          {hasMultiple && (
            <button
              type="button"
              onClick={() => onIndexChange((index + 1) % images.length)}
              aria-label={t("poi.nextPhoto")}
              className="absolute end-[12px] top-1/2 inline-flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-pill border-0 bg-black/50 text-white"
            >
              <ChevronRight size={26} />
            </button>
          )}

          {hasMultiple && (
            <div className="text-sm text-white/80">{t("poi.photoCounter", { current: index + 1, total: images.length })}</div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
