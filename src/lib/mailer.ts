/**
 * Envoi d'e-mails transactionnels par SMTP (boîte Hostinger de la boutique).
 *
 * Variables d'environnement :
 *   SMTP_HOST       serveur d'envoi, ex. "smtp.hostinger.com"
 *   SMTP_PORT       465 (SSL implicite) ou 587 (STARTTLS)
 *   SMTP_USER       adresse complète du compte, ex. "kontakt@hausgeratepfeffer.de"
 *   SMTP_PASSWORD   mot de passe de cette boîte
 *   MAIL_FROM       adresse expéditrice (défaut : SMTP_USER)
 *   MAIL_FROM_NAME  nom affiché (facultatif, défaut « Hausgeräte Pfeffer »)
 *
 * Tant que la configuration est incomplète, `isMailConfigured()` renvoie false :
 * en développement le code de connexion est alors affiché dans la console au
 * lieu d'être envoyé, ce qui évite de bloquer le back-office en local.
 *
 * L'expéditeur doit rester une adresse de la boîte authentifiée. Écrire au nom
 * d'un autre domaine ferait échouer SPF et DKIM, et le message partirait droit
 * en indésirable — quand le serveur ne le refuse pas d'emblée.
 */
import nodemailer, { type Transporter } from "nodemailer";
import { LOGO_CID, logoPngBytes } from "@/server/brandLogo";

const DEFAULT_FROM_NAME = "Hausgeräte Pfeffer";

/** Fichier joint au message, transmis tel quel à nodemailer. */
export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
  /**
   * Identifiant d'image incorporée. Renseigné, la pièce jointe n'apparaît pas
   * en bas du message : elle sert à alimenter un `<img src="cid:…">`.
   */
  cid?: string;
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Facture PDF de la confirmation de commande, le cas échéant. */
  attachments?: MailAttachment[];
  /**
   * En-têtes supplémentaires transmis tels quels au serveur SMTP. Sert aux
   * en-têtes List-Unsubscribe, que Gmail et Yahoo exigent depuis février 2024
   * pour les envois automatisés : sans eux, la réputation du domaine chute.
   */
  headers?: Record<string, string>;
}

interface SmtpSettings {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

function readSettings(): SmtpSettings | null {
  const host = process.env.SMTP_HOST?.trim() ?? "";
  const user = process.env.SMTP_USER?.trim() ?? "";
  const password = process.env.SMTP_PASSWORD?.trim() ?? "";
  if (!host || !user || !password) return null;

  return {
    host,
    // 465 par défaut : c'est le port SSL, celui que Hostinger recommande.
    port: Number(process.env.SMTP_PORT?.trim() || 465),
    user,
    password,
    // Sans MAIL_FROM explicite, on expédie depuis le compte authentifié.
    from: process.env.MAIL_FROM?.trim() || user,
  };
}

export function isMailConfigured(): boolean {
  return readSettings() !== null;
}

function formatSender(settings: SmtpSettings): string {
  const name = process.env.MAIL_FROM_NAME?.trim() || DEFAULT_FROM_NAME;
  return `"${name}" <${settings.from}>`;
}

/**
 * Le transporteur est réutilisé d'un envoi à l'autre : ouvrir une connexion
 * SMTP par message coûterait une poignée de main TLS à chaque fois, et les
 * campagnes en enchaînent des dizaines.
 */
let transporter: Transporter | null = null;
let transporterKey = "";

function getTransporter(settings: SmtpSettings): Transporter {
  const key = `${settings.host}:${settings.port}:${settings.user}`;
  if (transporter && transporterKey === key) return transporter;

  transporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    // 465 chiffre dès la connexion ; les autres ports montent en TLS ensuite.
    secure: settings.port === 465,
    auth: { user: settings.user, pass: settings.password },
    // Un envoi bloqué ne doit pas retenir une requête HTTP indéfiniment.
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  transporterKey = key;
  return transporter;
}

/**
 * Joint le logo au message dès qu'un gabarit le réclame par `cid:`.
 *
 * Le faire ici plutôt que dans chaque gabarit évite d'avoir à y penser à
 * l'écriture du message suivant : un en-tête sans logo passerait inaperçu à la
 * relecture du code, mais pas dans la boîte du client.
 */
function withEmbeddedLogo(message: MailMessage): MailAttachment[] | undefined {
  const jointes = message.attachments ?? [];
  if (!message.html.includes(`cid:${LOGO_CID}`)) {
    return jointes.length ? jointes : undefined;
  }

  return [
    ...jointes,
    {
      filename: "logo.png",
      content: Buffer.from(logoPngBytes()),
      contentType: "image/png",
      cid: LOGO_CID,
    },
  ];
}

/**
 * Envoie un message. Lève une erreur si le serveur refuse, pour que l'appelant
 * puisse répondre autre chose qu'un faux « code envoyé ».
 */
export async function sendMail(message: MailMessage): Promise<void> {
  const settings = readSettings();
  if (!settings) {
    throw new Error("SMTP_HOST, SMTP_USER ou SMTP_PASSWORD n'est pas configuré.");
  }

  const attachments = withEmbeddedLogo(message);

  await getTransporter(settings).sendMail({
    from: formatSender(settings),
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
    ...(attachments?.length ? { attachments } : {}),
    ...(message.headers ? { headers: message.headers } : {}),
    // Les réponses arrivent dans la boîte de la boutique, pas dans le vide.
    replyTo: settings.from,
  });
}

/**
 * Ouvre une connexion et s'authentifie, sans envoyer de message. Sert au
 * diagnostic : distingue « identifiants refusés » de « message refusé ».
 */
export async function verifyMailConnection(): Promise<void> {
  const settings = readSettings();
  if (!settings) {
    throw new Error("SMTP_HOST, SMTP_USER ou SMTP_PASSWORD n'est pas configuré.");
  }
  await getTransporter(settings).verify();
}
