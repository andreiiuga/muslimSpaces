"use client";

/**
 * Remembers Explore's map viewport/filters/selection across a visit to a POI
 * detail page and back. `/` and `/pois/[id]` are sibling App Router routes
 * with no parallel/intercepting route between them, so navigating to a POI
 * fully unmounts ExploreView; this provider lives in the root layout instead
 * of the page, and only the page content swaps on navigation between
 * siblings, so this instance survives the round trip untouched.
 *
 * Backed by a ref, not `useState` — nothing needs to *react* to this
 * changing. ExploreView reads it once as its initial state on mount and
 * writes back to it as the user interacts, so making this reactive would
 * just re-render the whole layout subtree (Navbar included) on every map
 * pan for no reason.
 */
import { createContext, useContext, useRef, type ReactNode } from "react";
import type { MapViewport } from "@muslimspaces/ui/map";

export type ExploreMode = "map" | "list";

export interface ExploreState {
  mode: ExploreMode;
  viewport: MapViewport | null;
  selectedCategoryId: string | null;
  openNow: boolean;
  selectedPoiId: string | null;
}

function defaultExploreState(): ExploreState {
  return {
    mode: "map",
    viewport: null,
    selectedCategoryId: null,
    openNow: false,
    selectedPoiId: null,
  };
}

interface ExploreStateContextValue {
  getState: () => ExploreState;
  setState: (patch: Partial<ExploreState>) => void;
}

const ExploreStateContext = createContext<ExploreStateContextValue | null>(null);

export function ExploreStateProvider({ children }: { children: ReactNode }) {
  const stateRef = useRef<ExploreState>(defaultExploreState());
  // Created once and never reassigned, so it's a stable dependency for any
  // effect that reads it off useExploreState().
  const valueRef = useRef<ExploreStateContextValue>({
    getState: () => stateRef.current,
    setState: (patch) => {
      stateRef.current = { ...stateRef.current, ...patch };
    },
  });

  return <ExploreStateContext.Provider value={valueRef.current}>{children}</ExploreStateContext.Provider>;
}

export function useExploreState(): ExploreStateContextValue {
  const ctx = useContext(ExploreStateContext);
  if (!ctx) throw new Error("useExploreState must be used within an ExploreStateProvider");
  return ctx;
}
