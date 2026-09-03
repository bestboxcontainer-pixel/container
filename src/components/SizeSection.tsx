import { SizeItem } from "@/components/SizeItem";
import { compterParTaille } from "@/lib/containerSize";
import { HOME_SIZE_SECTION_TOKENS } from "@/lib/homeLayoutTokens";
import { HOME_SIZE_GROUPS } from "@/lib/homeSections";
import { getCategoryPages } from "@/server/store";

/**
 * Section « Größenvielfalt » : les longueurs, largeurs et hauteurs disponibles,
 * chaque groupe dans son panneau.
 *
 * Partagée entre la page d'accueil et la page « Maße & Typen », qui traite le
 * même sujet : la dupliquer aurait fait diverger deux fois le même tableau de
 * dimensions.
 */
export async function SizeSection() {
  const [lengthGroup] = HOME_SIZE_GROUPS;

  // Nombre de containers derrière chaque longueur. Une base injoignable rend
  // la section muette plutôt qu'elle ne la fait disparaître : les cotes restent
  // justes, seuls les liens s'effacent.
  let stockParTaille = new Map<string, number>();
  try {
    const pages = await getCategoryPages();
    stockParTaille = compterParTaille(
      pages.flatMap((page) => [...page.products]),
      lengthGroup.options.map((option) => option.label),
    );
  } catch (error) {
    console.error("[tailles] stock illisible, blocs non cliquables", error);
  }

  // Bandeau sombre, containers posés sur une ligne de sol. Les visuels sont
  // blancs sur fond transparent : sur le navy ils ressortent, et sans cadre
  // autour c'est bien le container qu'on regarde.
  return (
    <section className={HOME_SIZE_SECTION_TOKENS.section}>
      <span className={HOME_SIZE_SECTION_TOKENS.glow} aria-hidden />
      <span className={HOME_SIZE_SECTION_TOKENS.glowSoft} aria-hidden />

      <div className={HOME_SIZE_SECTION_TOKENS.container}>
        <header className={HOME_SIZE_SECTION_TOKENS.header}>
          <div className="max-w-2xl">
            <p className={HOME_SIZE_SECTION_TOKENS.eyebrow}>Größenvielfalt</p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.02em] sm:text-3xl">
              Verschiedene Längen – flexibel kombinierbar
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60 sm:text-base">
              Drei Längen ab Lager – für jedes Projekt die passende Dimension.
            </p>
          </div>

          <dl className={HOME_SIZE_SECTION_TOKENS.counterRow}>
            <div>
              <dt className="sr-only">{lengthGroup.title}</dt>
              <dd>
                <span className={HOME_SIZE_SECTION_TOKENS.counterValue}>
                  {lengthGroup.options.length}
                </span>
                <span className={HOME_SIZE_SECTION_TOKENS.counterLabel}>{lengthGroup.title}</span>
              </dd>
            </div>
          </dl>
        </header>

        <div className={HOME_SIZE_SECTION_TOKENS.groupStack}>
          <div className={HOME_SIZE_SECTION_TOKENS.groupPanel}>
            <div className={HOME_SIZE_SECTION_TOKENS.groupHead}>
              <h3 className={HOME_SIZE_SECTION_TOKENS.groupTitle}>{lengthGroup.title}</h3>
              <span className={HOME_SIZE_SECTION_TOKENS.groupRange}>{lengthGroup.subtitle}</span>
            </div>

            <ul className="mt-5 grid grid-cols-3 gap-6 sm:gap-10">
              {lengthGroup.options.map((option) => (
                <SizeItem
                  key={`laengen-${option.label}`}
                  option={option}
                  // Seule une longueur réellement en stock mène quelque part.
                  href={
                    (stockParTaille.get(option.label) ?? 0) > 0
                      ? `/groessen/${option.label}`
                      : undefined
                  }
                  count={stockParTaille.get(option.label)}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
