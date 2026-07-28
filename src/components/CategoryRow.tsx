import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/Reveal";
import { categoryGroups } from "@/data/categoryNav";

export async function CategoryRow() {
  const t = await getTranslations("common");

  return (
    <section className="mx-auto max-w-screen-xl px-3 py-6">
      {categoryGroups.map((group) => (
        <div key={group.slug} className="mb-8 last:mb-0">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-foreground">{t(`groupNames.${group.slug}`)}</h2>
            <Link href={group.href} className="text-sm font-semibold text-primary hover:underline">
              {t("showAll")}
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {group.items.map((item, index) => {
              const label = t(`categoryNames.${item.slug}`);

              return (
                <Reveal key={item.slug} delay={Math.min(index * 60, 300)}>
                  <Link href={item.href} className="group flex w-24 flex-col items-center gap-2 sm:w-28 lg:w-32">
                    <span className="relative block aspect-square w-full overflow-hidden rounded-full border border-border transition-shadow duration-300 group-hover:border-primary/40 group-hover:shadow-lg">
                      <Image
                        src={item.image}
                        alt={label}
                        fill
                        sizes="(min-width: 1024px) 8rem, (min-width: 640px) 7rem, 6rem"
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </span>
                    <span className="text-center text-xs font-semibold text-foreground transition-colors group-hover:text-primary">
                      {label}
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
