"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { Button, Text } from "@muslimspaces/ui";
import { useLocale } from "../../i18n/LocaleContext";

// Creator contact details live here, not in the i18n files — they're the
// same in every language.
const CONTACT_EMAIL = "andreiiuga2@gmail.com";
const GITHUB_URL = "https://github.com/andreiiuga";
const LINKEDIN_URL = "https://www.linkedin.com/in/andrei-iuga-b948bb122";

const linkPill =
  "inline-flex min-h-[44px] items-center gap-[6px] rounded-pill border border-border bg-surface px-md text-sm font-medium text-primaryDark no-underline transition-colors hover:border-primary hover:bg-tealTint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function AboutView() {
  const router = useRouter();
  const { t } = useLocale();

  const sections = [1, 2, 3, 4].map((n) => ({ heading: t(`about.h${n}`), body: t(`about.b${n}`) }));

  return (
    // pt-[26px], matching BlogPostView's identical "narrow article" shell.
    <div className="mx-auto flex max-w-[720px] flex-col gap-xl px-[clamp(16px,4vw,28px)] pb-[70px] pt-[26px]">
      <div className="flex flex-col gap-md">
        <h1 className="m-0 text-balance">
          <Text size="3xl" weight="semibold">{t("about.title")}</Text>
        </h1>
        <Text size="lg" color="textBody">{t("about.lead")}</Text>
      </div>

      {sections.map(({ heading, body }) => (
        <section key={heading} className="flex flex-col gap-sm">
          <h2 className="m-0">
            <Text size="xl" weight="semibold">{heading}</Text>
          </h2>
          <Text size="md" color="textBody">{body}</Text>
        </section>
      ))}

      <div className="flex flex-col items-start gap-md">
        <Text size="md" color="textBody">{t("about.cta")}</Text>
        <Button onPress={() => router.push("/submit")}>{t("submit.entryLabel")}</Button>
      </div>

      <section className="flex flex-col gap-md rounded-lg bg-tealTint p-xl">
        <h2 className="m-0">
          <Text size="xl" weight="semibold">{t("about.mh")}</Text>
        </h2>
        <Text size="md" color="textBody">{t("about.mb")}</Text>
        <div className="flex flex-wrap gap-sm">
          <a href={`mailto:${CONTACT_EMAIL}`} className={linkPill}>
            <Mail size={16} aria-hidden />
            {CONTACT_EMAIL}
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={linkPill}>
            {t("about.gh")}
            <ArrowUpRight size={16} aria-hidden />
          </a>
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className={linkPill}>
            {t("about.li")}
            <ArrowUpRight size={16} aria-hidden />
          </a>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-lg border-t border-divider pt-md">
        <Text size="sm" color="textMuted">{t("about.footer")}</Text>
        <Link href="/blog" className="text-sm text-primaryDark underline-offset-4 hover:underline">
          {t("common.blog")}
        </Link>
      </div>
    </div>
  );
}
