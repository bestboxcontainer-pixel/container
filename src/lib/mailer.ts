/**
 * Envoi d'e-mails transactionnels via l'API Resend.
 *
 * Variables d'environnement :
 *   RESEND_API_KEY  clé API Resend (https://resend.com/api-keys), commence par « re_ »
 *   MAIL_FROM       adresse expéditrice, obligatoirement sur un domaine vérifié
 *                   dans Resend, ex. « kontakt@bestboxcontainer.de »
 *   MAIL_FROM_NAME  nom affiché (facultatif, défaut « BBC Best Box Containerhandel e.K. »)
 *
 * Tant que RESEND_API_KEY ou MAIL_FROM manque, `isMailConfigured()` renvoie
 * false : en développement le code de connexion est alors affiché dans la
 * console au lieu d'être envoyé, ce qui évite de bloquer le back-office en local.
 *
 * L'adresse d'expédition doit appartenir à un domaine vérifié dans Resend
 * (enregistrements SPF et DKIM publiés). Écrire au nom d'un autre domaine ferait
 * échouer l'authentification et le message partirait droit en indésirable,
 * quand l'API ne le refuse pas d'emblée avec `invalid_from_address`.
 */
import { Resend } from "resend";
import { LOGO_CID, logoPngBytes } from "@/server/brandLogo";

const DEFAULT_FROM_NAME = "BBC Best Box Containerhandel e.K.";

/** Fichier joint au message. */
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
   * En-têtes supplémentaires transmis tels quels. Sert aux en-têtes
   * List-Unsubscribe, que Gmail et Yahoo exigent depuis février 2024 pour les
   * envois automatisés : sans eux, la réputation du domaine chute.
   */
  headers?: Record<string, string>;
}

interface ResendSettings {
  apiKey: string;
  from: string;
}

function readSettings(): ResendSettings | null {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const from = process.env.MAIL_FROM?.trim() ?? "";
  if (!apiKey || !from) return null;

  return { apiKey, from };
}

export function isMailConfigured(): boolean {
  return readSettings() !== null;
}

/**
 * Assemble l'en-tête `From`. Le nom d'affichage « BBC Best Box Containerhandel
 * e.K. » contient un point : il faut alors le guillemetter pour rester conforme
 * à la RFC 5322, sans quoi Resend rejette l'adresse.
 */
function formatSender(settings: ResendSettings): string {
  const name = process.env.MAIL_FROM_NAME?.trim() || DEFAULT_FROM_NAME;
  const needsQuoting = /[()<>@,;:\\".\[\]]/.test(name);
  const display = needsQuoting ? `"${name.replace(/(["\\])/g, "\\$1")}"` : name;
  return `${display} <${settings.from}>`;
}

/**
 * Le client Resend est réutilisé d'un envoi à l'autre. Il n'ouvre pas de
 * connexion persistante (chaque envoi est une requête HTTPS), mais recréer
 * l'objet à chaque message n'apporte rien.
 */
let client: Resend | null = null;
let clientKey = "";

function getClient(apiKey: string): Resend {
  if (client && clientKey === apiKey) return client;

  client = new Resend(apiKey);
  clientKey = apiKey;
  return client;
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

/** Traduit nos pièces jointes vers la forme attendue par le SDK Resend. */
function toResendAttachments(list: MailAttachment[] | undefined) {
  if (!list?.length) return undefined;

  return list.map((jointe) => ({
    filename: jointe.filename,
    content: jointe.content,
    contentType: jointe.contentType,
    // `contentId` bascule la pièce en incorporée, référençable par `cid:`.
    ...(jointe.cid ? { contentId: jointe.cid } : {}),
  }));
}

/**
 * Envoie un message. Lève une erreur si Resend le refuse, pour que l'appelant
 * puisse répondre autre chose qu'un faux « code envoyé ».
 */
export async function sendMail(message: MailMessage): Promise<void> {
  const settings = readSettings();
  if (!settings) {
    throw new Error("RESEND_API_KEY ou MAIL_FROM n'est pas configuré.");
  }

  const attachments = toResendAttachments(withEmbeddedLogo(message));

  // Resend renvoie l'erreur dans la réponse ({ data, error }) plutôt que de
  // lever : il faut donc l'inspecter explicitement.
  const { data, error } = await getClient(settings.apiKey).emails.send({
    from: formatSender(settings),
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
    // Les réponses arrivent dans la boîte de la boutique, pas dans le vide.
    replyTo: settings.from,
    ...(attachments ? { attachments } : {}),
    ...(message.headers ? { headers: message.headers } : {}),
  });

  if (error) {
    throw new Error(`Resend a refusé le message (${error.name}) : ${error.message}`);
  }
  if (!data?.id) {
    throw new Error("Resend n'a pas confirmé l'envoi (réponse sans identifiant).");
  }
}

/**
 * Contrôle de configuration, sans envoyer de message ni appeler l'API.
 *
 * Resend n'ouvre pas de session à vérifier, et la clé de la boutique est une
 * clé « d'envoi seul » : elle ne peut appeler que `emails.send`, tout autre
 * point de terminaison (lister les domaines, les clés…) répond 401
 * `restricted_api_key`. Un vrai aller-retour n'est donc possible qu'en
 * expédiant un message ; ce diagnostic se limite à la forme des variables.
 */
export async function verifyMailConnection(): Promise<void> {
  const settings = readSettings();
  if (!settings) {
    throw new Error("RESEND_API_KEY ou MAIL_FROM n'est pas configuré.");
  }
  if (!settings.apiKey.startsWith("re_")) {
    throw new Error("RESEND_API_KEY ne ressemble pas à une clé Resend (préfixe « re_ » attendu).");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(settings.from)) {
    throw new Error(`MAIL_FROM n'est pas une adresse e-mail valide : « ${settings.from} ».`);
  }
}
