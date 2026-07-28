"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_LABELS, routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  // Chemin sans préfixe de langue : on reste donc exactement sur la même page
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div className={cn("flex items-center gap-1", className)} aria-busy={pending}>
      <Globe className="h-4 w-4 opacity-70" aria-hidden />
      <span className="sr-only">Sprache wählen / Choose language</span>
      {routing.locales.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => switchTo(code)}
          aria-current={code === locale ? "true" : undefined}
          title={LOCALE_LABELS[code]}
          className={cn(
            "rounded-sm px-1.5 py-0.5 text-xs font-bold uppercase transition-colors",
            code === locale ? "bg-white/20 text-white" : "text-white/60 hover:text-white",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
