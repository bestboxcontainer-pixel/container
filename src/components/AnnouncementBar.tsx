import { getLocale } from "next-intl/server";
import { getActiveAnnouncement } from "@/server/announcement";
import { AnnouncementBarClient } from "@/components/AnnouncementBarClient";

/**
 * Bandeau d'annonce, tout en haut de la boutique.
 *
 * Rendu côté serveur : le message part avec la page, sans attendre le
 * navigateur. Un bandeau qui apparaîtrait après coup ferait sauter la mise en
 * page sous les yeux du visiteur, exactement au moment où il lit le haut de
 * l'écran.
 *
 * La partie interactive — la fermeture, et le souvenir qu'on en garde — vit
 * dans le composant client.
 */
export async function AnnouncementBar() {
  const annonce = await getActiveAnnouncement();
  if (!annonce) return null;

  const locale = await getLocale();
  // Un message vide dans une langue signifie « pas de bandeau dans cette
  // langue » : on n'affiche pas l'autre à la place, ce serait un texte que le
  // visiteur ne comprend pas.
  const message = locale === "en" ? annonce.messageEn : annonce.messageDe;
  if (!message.trim()) return null;

  return (
    <AnnouncementBarClient
      id={annonce.id}
      message={message}
      linkUrl={annonce.linkUrl}
      linkLabel={annonce.linkLabel}
      backgroundColor={annonce.backgroundColor}
      textColor={annonce.textColor}
      scrolling={annonce.scrolling}
      scrollSeconds={annonce.scrollSeconds}
      fullWidth={annonce.fullWidth}
      dismissible={annonce.dismissible}
      closeLabel={locale === "en" ? "Hide announcement" : "Hinweis ausblenden"}
    />
  );
}
