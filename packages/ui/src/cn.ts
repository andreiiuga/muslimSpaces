import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Shared by every component (web + native) that resolves cva variants to a className string. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
