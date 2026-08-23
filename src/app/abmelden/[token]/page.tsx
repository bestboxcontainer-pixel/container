/**
 * Désinscription des messages commerciaux.
 *
 * La page vit hors du routage multilingue : le lien part dans un message déjà
 * envoyé, il doit rester valable tel quel pour toujours. La langue vient donc
 * du destinataire enregistré, pas de l'URL.
 *
 * Point capital : la désinscription n'a lieu qu'au POST, après un clic
 * explicite sur le bouton. Les antivirus, les passerelles de sécurité et les
 * aperçus de Gmail et d'Outlook visitent les liens contenus dans les messages
 * pour les analyser. Une désinscription déclenchée par un simple GET
 * désabonnerait donc des clients qui n'ont jamais rien demandé, et
 * silencieusement, puisque personne n'a vu la page.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, MailX } from "lucide-react";
import { prisma } from "@/server/prisma";
import { recordEvent } from "@/server/campaigns";
import { suppressEmail } from "@/server/contacts";

export const dynamic = "force-dynamic";

// Une page de désinscription n'a rien à faire dans un index de moteur de
// recherche, et le jeton ne doit pas s'y retrouver.
export const metadata: Metadata = {
  title: "Abmeldung",
  robots: { index: false, follow: false },
};

type Params = Promise<{ token: string }>;
type Search = Promise<{ erledigt?: string }>;

const TEXTS = {
  de: {
    title: "Keine Angebote mehr erhalten",
    intro: "Sie melden folgende E-Mail-Adresse von unseren Angebots-E-Mails ab:",
    note: "Bestellbestätigungen, Versandbenachrichtigungen und Antworten auf Ihre Anfragen erhalten Sie weiterhin. Diese E-Mails gehören zu Ihrem Kauf und lassen sich nicht abbestellen.",
    button: "Abmeldung bestätigen",
    doneTitle: "Sie sind abgemeldet",
    doneText:
      "Diese Adresse erhält von uns keine Angebots-E-Mails mehr. Die Änderung gilt ab sofort und für alle künftigen Aktionen.",
    alreadyTitle: "Bereits abgemeldet",
    alreadyText: "Diese Adresse erhält von uns bereits keine Angebots-E-Mails mehr.",
    unknownTitle: "Link nicht mehr gültig",
    unknownText:
      "Dieser Abmeldelink lässt sich nicht mehr zuordnen. Schreiben Sie uns kurz, dann übernehmen wir die Abmeldung von Hand.",
    contact: "Zum Kontaktformular",
    home: "Zur Startseite",
  },
  en: {
    title: "Stop receiving offers",
    intro: "You are unsubscribing the following email address from our promotional emails:",
    note: "You will still receive order confirmations, shipping notifications and replies to your enquiries. Those emails are part of your purchase and cannot be unsubscribed from.",
    button: "Confirm unsubscribe",
    doneTitle: "You have been unsubscribed",
    doneText:
      "This address will no longer receive promotional emails from us. The change applies immediately and to all future campaigns.",
    alreadyTitle: "Already unsubscribed",
    alreadyText: "This address already receives no promotional emails from us.",
    unknownTitle: "Link no longer valid",
    unknownText:
      "This unsubscribe link can no longer be matched. Send us a short message and we will remove the address by hand.",
    contact: "Contact form",
    home: "Back to the shop",
  },
} as const;

type PageLocale = keyof typeof TEXTS;

/**
 * L'écriture se fait ici, jamais au chargement de la page. Le jeton transite par
 * un champ caché plutôt que par l'URL de l'action : il reste ainsi hors des
 * journaux du serveur mandataire, qui enregistrent les chemins mais pas les
 * corps de requête.
 */
async function confirmUnsubscribe(formData: FormData): Promise<void> {
  "use server";

  const token = String(formData.get("token") ?? "");
  if (!token) return;

  const recipient = await prisma.campaignRecipient.findUnique({
    where: { token },
    select: { id: true, campaignId: true, email: true, unsubscribedAt: true },
  });

  if (recipient && !recipient.unsubscribedAt) {
    await suppressEmail(recipient.email, "desinscription", recipient.campaignId);
    await prisma.campaignRecipient.update({
      where: { id: recipient.id },
      data: { unsubscribedAt: new Date() },
    });
    await recordEvent(recipient.campaignId, "desinscription", recipient.id);
  }

  redirect(`/abmelden/${token}?erledigt=1`);
}

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { token } = await params;
  const { erledigt } = await searchParams;

  const recipient = await prisma.campaignRecipient.findUnique({
    where: { token },
    select: { email: true, locale: true, unsubscribedAt: true },
  });

  const locale: PageLocale = recipient?.locale === "en" ? "en" : "de";
  const texts = TEXTS[locale];

  // Jeton inconnu : message neutre. Confirmer qu'une adresse est chez nous à
  // partir d'un jeton deviné donnerait un moyen de vérifier des adresses.
  if (!recipient) {
    return (
      <Shell locale={locale}>
        <Card
          icon={<MailX className="h-6 w-6 text-muted-foreground" />}
          title={texts.unknownTitle}
          text={texts.unknownText}
        >
          <Links locale={locale} texts={texts} />
        </Card>
      </Shell>
    );
  }

  if (erledigt || recipient.unsubscribedAt) {
    const done = Boolean(erledigt);
    return (
      <Shell locale={locale}>
        <Card
          icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
          title={done ? texts.doneTitle : texts.alreadyTitle}
          text={done ? texts.doneText : texts.alreadyText}
        >
          <p className="mb-6 rounded-sm bg-muted px-4 py-3 text-sm font-semibold text-foreground">
            {recipient.email}
          </p>
          <Links locale={locale} texts={texts} />
        </Card>
      </Shell>
    );
  }

  return (
    <Shell locale={locale}>
      <Card
        icon={<MailX className="h-6 w-6 text-primary" />}
        title={texts.title}
        text={texts.intro}
      >
        <p className="mb-5 rounded-sm bg-muted px-4 py-3 text-sm font-semibold text-foreground">
          {recipient.email}
        </p>

        <form action={confirmUnsubscribe}>
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            className="w-full rounded-sm bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {texts.button}
          </button>
        </form>

        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{texts.note}</p>

        <div className="mt-6">
          <Links locale={locale} texts={texts} />
        </div>
      </Card>
    </Shell>
  );
}

function Shell({ locale, children }: { locale: PageLocale; children: React.ReactNode }) {
  return (
    <main lang={locale} className="flex flex-1 items-center justify-center bg-muted px-4 py-16">
      {children}
    </main>
  );
}

function Card({
  icon,
  title,
  text,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-md rounded-sm border border-border bg-white p-8 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        {icon}
        <h1 className="text-xl font-black tracking-tight text-foreground">{title}</h1>
      </div>
      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{text}</p>
      {children}
    </div>
  );
}

function Links({
  locale,
  texts,
}: {
  locale: PageLocale;
  texts: (typeof TEXTS)[PageLocale];
}) {
  const prefix = locale === "en" ? "/en" : "";
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
      <Link href={`${prefix}/kontakt`} className="text-primary hover:underline">
        {texts.contact}
      </Link>
      <Link href={`${prefix}/`} className="text-muted-foreground hover:underline">
        {texts.home}
      </Link>
    </p>
  );
}
