"use client";

import { useCallback, useSyncExternalStore } from "react";
import { X } from "lucide-react";

/**
 * Rendu du bandeau d'annonce.
 *
 * Le défilement est en CSS, pas en JavaScript : une animation pilotée par le
 * fil principal saccade dès que la page travaille, et c'est justement au
 * chargement que le bandeau est visible. Le texte est écrit deux fois à la
 * suite et l'ensemble glisse d'exactement la moitié de sa largeur — la boucle
 * se referme alors sans saut visible.
 *
 * La fermeture est retenue dans le navigateur, par identifiant de bandeau :
 * changer le message rouvre le bandeau chez ceux qui avaient fermé le
 * précédent, ce qui est bien le but d'une nouvelle annonce.
 */
/** Signale la fermeture aux abonnés, dans cet onglet. */
const EVENEMENT = "annonce:fermee";

export function AnnouncementBarClient({
  id,
  message,
  linkUrl,
  linkLabel,
  backgroundColor,
  textColor,
  scrolling,
  scrollSeconds,
  fullWidth,
  dismissible,
  closeLabel,
}: {
  id: string;
  message: string;
  linkUrl: string;
  linkLabel: string;
  backgroundColor: string;
  textColor: string;
  scrolling: boolean;
  scrollSeconds: number;
  fullWidth: boolean;
  dismissible: boolean;
  closeLabel: string;
}) {
  const cle = `annonce-fermee:${id}`;

  // La fermeture vit dans le stockage local, donc hors de React. On la lit par
  // `useSyncExternalStore` : elle rend `false` au rendu serveur, où le stockage
  // n'existe pas, et le bandeau paraît donc dès la première image plutôt que de
  // surgir après coup en décalant la page.
  const ferme = useSyncExternalStore(
    (rafraichir) => {
      window.addEventListener(EVENEMENT, rafraichir);
      // Un autre onglet peut fermer le même bandeau.
      window.addEventListener("storage", rafraichir);
      return () => {
        window.removeEventListener(EVENEMENT, rafraichir);
        window.removeEventListener("storage", rafraichir);
      };
    },
    () => {
      try {
        return window.localStorage.getItem(cle) === "1";
      } catch {
        // Stockage refusé (navigation privée stricte) : le bandeau reste
        // visible, ce qui vaut mieux qu'une erreur.
        return false;
      }
    },
    () => false,
  );

  const fermer = useCallback(() => {
    try {
      window.localStorage.setItem(cle, "1");
    } catch {
      // Sans stockage, le bandeau reviendra au prochain chargement.
    }
    window.dispatchEvent(new Event(EVENEMENT));
  }, [cle]);

  if (ferme) return null;

  const contenu = (
    <>
      <span>{message}</span>
      {linkUrl && linkLabel && (
        <a
          href={linkUrl}
          className="ml-2 font-black underline underline-offset-2 hover:no-underline"
        >
          {linkLabel}
        </a>
      )}
    </>
  );

  return (
    <div
      role="region"
      aria-label={message}
      style={{ backgroundColor, color: textColor }}
      className="relative w-full overflow-hidden text-sm"
    >
      <div className={fullWidth ? "px-3 py-2" : "mx-auto max-w-screen-xl px-3 py-2"}>
        {scrolling ? (
          <div className="flex overflow-hidden">
            {/* `w-max` laisse la piste prendre la largeur de son contenu :
                sans quoi elle se limiterait à l'écran et le texte long serait
                coupé au lieu de défiler. */}
            <div
              className="flex w-max shrink-0 gap-12 whitespace-nowrap motion-safe:animate-[defilement_linear_infinite] motion-reduce:animate-none"
              style={{ animationDuration: `${scrollSeconds}s` }}
            >
              <span className="flex items-center">{contenu}</span>
              {/* Deuxième exemplaire, masqué aux lecteurs d'écran : il ne sert
                  qu'à ce que la boucle se referme sans blanc. */}
              <span className="flex items-center" aria-hidden>
                {contenu}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-center font-semibold">{contenu}</p>
        )}
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={fermer}
          aria-label={closeLabel}
          title={closeLabel}
          style={{ color: textColor }}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-1 opacity-80 hover:opacity-100"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
