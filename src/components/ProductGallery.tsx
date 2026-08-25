"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { PRODUCT_GALLERY_TOKENS } from "@/lib/productLayoutTokens";

// Galerie de la fiche produit : une grande vue, et les miniatures juste en
// dessous quand le produit a plusieurs visuels. Sans vue complémentaire, le
// rendu est exactement celui d'avant : une seule image, sans rangée vide.
//
// L'ordre vient du back-office : l'image principale d'abord, puis la galerie
// telle qu'elle a été rangée dans le formulaire produit.

export function ProductGallery({
  image,
  images = [],
  alt,
}: {
  image: string;
  images?: string[];
  alt: string;
}) {
  const t = useTranslations("product");

  // L'image principale ouvre la galerie ; les doublons éventuels sont écartés
  // pour ne pas afficher deux fois la même miniature.
  const views = [image, ...images.filter((entry) => entry && entry !== image)];
  const [active, setActive] = useState(0);
  const current = views[active] ?? image;

  return (
    <div>
      {/* Zoom au survol, comme sur les cartes produit. Le grossissement est plus
          léger ici (105 % contre 110 %) : sur une image de cette taille, le même
          rapport déplacerait beaucoup plus de pixels et le geste deviendrait
          brusque. Le cadre garde `overflow-hidden`, l'image ne dépasse jamais.
          Sous `motion-safe`, comme les autres mouvements de la boutique : un
          visiteur qui a demandé moins d'animations n'en reçoit aucune. */}
      {/* Format 4/3 et non carré : les visuels de conteneurs sont des objets
          longs, photographiés en paysage. Dans un cadre carré, `object-contain`
          laissait deux bandes blanches qui occupaient près de la moitié de la
          hauteur pour ne rien montrer. Le recadrage reste exclu : sur une fiche
          produit, montrer l'objet entier prime sur le remplissage du cadre. */}
      <div className={PRODUCT_GALLERY_TOKENS.frame}>
        {/* Le conteneur est détouré sur fond blanc : sans rien sous lui, il
            flottait dans le vide. Une ombre portée très diffuse le pose, sans
            lui ajouter le cadre que le `object-contain` interdit. */}
        <span className={PRODUCT_GALLERY_TOKENS.halo} aria-hidden />
        <Image
          key={current}
          src={current}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className={PRODUCT_GALLERY_TOKENS.image}
        />
      </div>

      {views.length > 1 && (
        <ul className={PRODUCT_GALLERY_TOKENS.rail} aria-label={t("galleryLabel")}>
          {views.map((view, index) => {
            const selected = index === active;
            return (
              <li key={view}>
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={t("galleryView", { index: index + 1, total: views.length })}
                  aria-current={selected ? "true" : undefined}
                  className={`${PRODUCT_GALLERY_TOKENS.thumb} ${
                    selected ? PRODUCT_GALLERY_TOKENS.thumbOn : PRODUCT_GALLERY_TOKENS.thumbOff
                  }`}
                >
                  <Image src={view} alt="" fill sizes="96px" className="object-contain p-1.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
