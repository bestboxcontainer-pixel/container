import { getTranslations } from "next-intl/server";
import { RotateCcw, Truck, Wrench } from "lucide-react";

// L'icône reste dans le code, le texte vient des messages ("trust.*Title/Detail").
const services = [
  { icon: Truck, key: "shipping" },
  { icon: RotateCcw, key: "return" },
  { icon: Wrench, key: "service" },
] as const;

export async function TrustBar() {
  const t = await getTranslations("trust");

  return (
    <section className="border-b border-border bg-muted">
      <div className="mx-auto grid max-w-screen-xl grid-cols-1 gap-4 px-3 py-4 sm:grid-cols-3">
        {services.map(({ icon: Icon, key }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold text-foreground sm:text-sm">
                {t(`${key}Title`)}
              </span>
              <span className="block text-[11px] text-muted-foreground sm:text-xs">
                {t(`${key}Detail`)}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
