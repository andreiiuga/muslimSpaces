import { cn } from "@/lib/utils";

// Two plain <img>s toggled by Tailwind's `dark:` variant (class strategy,
// set on <html> by next-themes before hydration) rather than reading the
// theme in JS — a JS switch would flash the wrong logo until next-themes
// resolves, and this stays a Server Component. SVGs gain nothing from
// next/image's optimizer. width/height are the SVG's intrinsic 1464x349 so
// layout doesn't shift while it loads.
export function Logo({ className }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-light.svg"
        alt="MuslimSpaces"
        width={1464}
        height={349}
        className={cn("block w-auto dark:hidden", className)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-dark.svg"
        alt=""
        aria-hidden
        width={1464}
        height={349}
        className={cn("hidden w-auto dark:block", className)}
      />
    </>
  );
}
