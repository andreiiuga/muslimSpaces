"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "../../i18n/LocaleContext";

/**
 * The "back to X" link at the top of account/blog sub-pages — previously
 * hand-copied byte-for-byte across MyReviewsView, BlogPostView,
 * ChangePasswordForm, and EditProfileForm. Owns the RTL-aware icon flip
 * (Arabic reads right-to-left, so "back" points right, not left) so callers
 * can't independently drift on that detail the way the four originals'
 * copy-pasted `BackIcon = locale === "ar" ? ArrowRight : ArrowLeft` could.
 */
export function BackLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const { locale } = useLocale();
  const Icon = locale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <Link href={href} className={cn("inline-flex min-h-[44px] items-center gap-sm text-sm text-primary no-underline", className)}>
      <Icon size={18} />
      {children}
    </Link>
  );
}
