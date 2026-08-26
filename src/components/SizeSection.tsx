import { SizeItem } from "@/components/SizeItem";
import { HOME_SIZE_SECTION_TOKENS } from "@/lib/homeLayoutTokens";
import { HOME_SIZE_GROUPS } from "@/lib/homeSections";

/**
 * Section « Größenvielfalt » : les longueurs, largeurs et hauteurs disponibles,
 * chaque groupe dans son panneau.
 *
 * Partagée entre la page d'accueil et la page « Maße & Typen », qui traite le
 * même sujet : la dupliquer aurait fait diverger deux fois le même tableau de
 * dimensions.
 */
export function SizeSection() {
  const [lengthGroup, widthGroup, heightGroup] = HOME_SIZE_GROUPS;

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
              Verschiedene Größen – flexibel kombinierbar
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60 sm:text-base">
              Längen, Breiten und Höhen modular kombinieren – für jedes Projekt die passende
              Dimension.
            </p>
          </div>

          <dl className={HOME_SIZE_SECTION_TOKENS.counterRow}>
            {HOME_SIZE_GROUPS.map((group) => (
              <div key={group.id}>
                <dt className="sr-only">{group.title}</dt>
                <dd>
                  <span className={HOME_SIZE_SECTION_TOKENS.counterValue}>
                    {group.options.length}
                  </span>
                  <span className={HOME_SIZE_SECTION_TOKENS.counterLabel}>{group.title}</span>
                </dd>
              </div>
            ))}
          </dl>
        </header>

        <div className={HOME_SIZE_SECTION_TOKENS.groupStack}>
          <div className={HOME_SIZE_SECTION_TOKENS.groupPanel}>
            <div className={HOME_SIZE_SECTION_TOKENS.groupHead}>
              <h3 className={HOME_SIZE_SECTION_TOKENS.groupTitle}>{lengthGroup.title}</h3>
              <span className={HOME_SIZE_SECTION_TOKENS.groupRange}>{lengthGroup.subtitle}</span>
            </div>

            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {lengthGroup.options.map((option) => (
                <SizeItem key={`laengen-${option.label}`} option={option} />
              ))}
            </ul>
          </div>

          {/* Deux panneaux distincts : alignés à même le fond, les deux
              valeurs de largeur et les trois de hauteur se lisaient comme
              une seule rangée de cinq. */}
          <div className={HOME_SIZE_SECTION_TOKENS.specRow}>
            {[widthGroup, heightGroup].map((group) => (
              <div key={group.id} className={HOME_SIZE_SECTION_TOKENS.groupPanel}>
                <div className={HOME_SIZE_SECTION_TOKENS.groupHead}>
                  <h3 className={HOME_SIZE_SECTION_TOKENS.groupTitle}>{group.title}</h3>
                  <span className={HOME_SIZE_SECTION_TOKENS.groupRange}>{group.subtitle}</span>
                </div>

                <ul
                  className={`mt-5 grid gap-3 ${
                    group.options.length === 2 ? "grid-cols-2" : "grid-cols-3"
                  }`}
                >
                  {group.options.map((option) => (
                    <SizeItem key={`${group.id}-${option.label}`} option={option} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
