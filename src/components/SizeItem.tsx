import Image from "next/image";
import { HOME_SIZE_CARD_TOKENS } from "@/lib/homeLayoutTokens";
import { formatSizeDetail, type HomeSizeOption } from "@/lib/homeSections";

/**
 * Une dimension de la section « Größen » : le container seul, posé sur une
 * ligne de sol, avec son libellé et sa cote millimétrique en dessous. Aucune
 * carte ni bordure autour, pour que le visuel reste le sujet.
 */
export function SizeItem({ option }: { option: HomeSizeOption }) {
  const featured = option.featured === true;

  return (
    <li className={HOME_SIZE_CARD_TOKENS.item}>
      <div className={HOME_SIZE_CARD_TOKENS.head}>
        {featured && <span className={HOME_SIZE_CARD_TOKENS.badge}>Top-Maß</span>}
      </div>

      <div className="relative">
        {featured && <span className={HOME_SIZE_CARD_TOKENS.featuredGlow} aria-hidden />}

        <div className={HOME_SIZE_CARD_TOKENS.media}>
          {/* Les visuels recadrés portent eux-mêmes la progression des
              longueurs. Le pourcentage ne sert plus qu'aux largeurs et hauteurs,
              qui réutilisent faute de mieux des visuels de longueurs. */}
          <div className="relative" style={{ width: `${option.imageWidthPercent}%` }}>
            <Image
              src={option.imageSrc}
              alt={option.imageAlt}
              width={535}
              height={250}
              sizes="(min-width: 1024px) 15vw, (min-width: 640px) 30vw, 45vw"
              className={HOME_SIZE_CARD_TOKENS.image}
            />
          </div>
        </div>
      </div>

      <span
        className={featured ? HOME_SIZE_CARD_TOKENS.floorFeatured : HOME_SIZE_CARD_TOKENS.floor}
        aria-hidden
      />

      <p className={HOME_SIZE_CARD_TOKENS.footer}>
        <span
          className={featured ? HOME_SIZE_CARD_TOKENS.labelFeatured : HOME_SIZE_CARD_TOKENS.label}
        >
          {option.label}
        </span>
        <span className={HOME_SIZE_CARD_TOKENS.detail}>{formatSizeDetail(option.label)}</span>
      </p>
    </li>
  );
}
