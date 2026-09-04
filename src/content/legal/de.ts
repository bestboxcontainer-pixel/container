/**
 * Contenu légal et informatif en ALLEMAND : BBC Best Box Containerhandel e.K.
 *
 * ATTENTION : toutes les données d'entreprise sont des PLACEHOLDERS
 * (adresse, HRB, USt-IdNr., tarifs). Voir docs/LEGAL.md pour la liste
 * exhaustive des éléments à remplacer avant mise en ligne.
 *
 * État du droit retenu : juillet 2026 (§ 5 DDG, § 356a BGB / Widerrufsbutton
 * depuis le 19.06.2026, PAngV, DSGVO/TDDDG, VSBG § 36 : plateforme ODR fermée
 * depuis le 20.07.2025).
 *
 * ElektroG / BattDG (électroménager et électronique) volontairement absents :
 * BBC Best Box Containerhandel e.K. vend des containers, pas des équipements
 * électriques, et n'entre donc pas dans le champ de ces textes.
 *
 * NOTE DE REBRANDING (2026-09) : le corps rédactionnel de ces pages (Impressum,
 * AGB, FAQ, Über uns, etc.) a été réécrit pour décrire une activité de négoce
 * de conteneurs, à la place du gabarit d'origine (vente au détail d'appareils
 * électroménagers/multimédia). La page dédiée ElektroG/BattDG a été retirée
 * (hors champ), de même que les clauses de reprise d'appareils usagés.
 * Reste un gabarit à faire valider par un juriste avant mise en ligne réelle
 * (voir l'avertissement DISCLAIMER en tête de chaque page juridique).
 */

import type { LegalPageMap } from "./types";

/** Date de dernière révision rédactionnelle du corpus allemand. */
const UPDATED_AT = "2026-07-26";

/**
 * Coordonnées de l'entreprise : À REMPLACER par les données réelles.
 * Exportées : la facture PDF y puise les mentions exigées par le § 14 UStG,
 * et deux jeux de coordonnées qui divergeraient seraient pires qu'un seul faux.
 */
export const COMPANY = {
  name: "BBC Best Box Containerhandel e.K.",
  street: "Petersweg 11a",
  city: "22946 Großensee",
  postalCode: "22946",
  locality: "Großensee",
  country: "Deutschland",
  email: "kontakt@bestboxcontainer.de",
  phone: "+49 1525 9026450",
  owner: "Peer Kunz",
  registeredSince: "20. April 2006",
  // Ein eingetragener Kaufmann (e.K.) wird als Einzelkaufmann in Abteilung A
  // des Handelsregisters (HRA) geführt; für den Sitz in Großensee
  // (Schleswig-Holstein) ist das Amtsgericht Lübeck zuständig.
  register: "Amtsgericht Lübeck, HRA 3471",
  // À RENSEIGNER : la facture doit porter le numéro de TVA (§ 14 Abs. 4 Nr. 2
  // UStG). Tant que cette valeur reste un gabarit, chaque facture émise est
  // incomplète.
  vatId: "DE814218818",
  domain: "www.bestboxcontainer.de",
} as const;

/** Adresse de retour (identique au siège dans ce modèle). */
const RETURN_ADDRESS = `${COMPANY.name}, Retourenannahme, ${COMPANY.street}, ${COMPANY.city}, ${COMPANY.country}`;

/** Avertissement placé en tête de chaque page juridique. */
const DISCLAIMER =
  "Rechtlicher Hinweis: Dieser Text ist eine sorgfältig erstellte Vorlage für den Onlineshop BBC Best Box Containerhandel e.K. Sämtliche Unternehmensangaben (Anschrift, Handelsregister, Umsatzsteuer-Identifikationsnummer, Versandkosten, Dienstleister) sind Platzhalter und müssen vor der Veröffentlichung durch die tatsächlichen Daten ersetzt werden. Lassen Sie den Text anschließend anwaltlich prüfen, erst dann ist er rechtssicher verwendbar.";

/** Assemble le chapeau : avertissement puis texte d'introduction. */
function intro(lead: string): string {
  return `${DISCLAIMER}\n\n${lead}`;
}

export const deLegalPages: LegalPageMap = {
  /* ------------------------------------------------------------------ */
  /* Impressum: § 5 DDG                                                 */
  /* ------------------------------------------------------------------ */
  impressum: {
    slug: "impressum",
    title: "Impressum",
    intro: intro(
      "Anbieterkennzeichnung nach § 5 Digitale-Dienste-Gesetz (DDG) und § 18 Absatz 2 Medienstaatsvertrag (MStV).",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Diensteanbieter",
        body: "Verantwortlich für diesen Onlineshop ist:",
        list: [
          COMPANY.name,
          COMPANY.street,
          COMPANY.city,
          COMPANY.country,
        ],
      },
      {
        heading: "Vertreten durch",
        body: `Inhaber: ${COMPANY.owner}\n\nAls eingetragener Einzelkaufmann (e.K.) haftet der Inhaber persönlich und unbeschränkt.`,
      },
      {
        heading: "Kontakt",
        body: "Sie erreichen uns schnell und unmittelbar über die folgenden Wege. Unser Kundenservice ist montags bis freitags von 8 bis 18 Uhr besetzt.",
        list: [
          `Telefon: ${COMPANY.phone}`,
          `E-Mail: ${COMPANY.email}`,
          `Kontaktformular: ${COMPANY.domain}/kontakt`,
        ],
      },
      {
        heading: "Registereintrag",
        body: `Eintragung im Handelsregister seit dem ${COMPANY.registeredSince}\nRegistergericht und Registernummer: ${COMPANY.register}`,
      },
      {
        heading: "Umsatzsteuer-Identifikationsnummer",
        body: `Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: ${COMPANY.vatId}`,
      },
      {
        heading: "Registrierung nach dem Verpackungsgesetz",
        body: "Als Vertreiber verpackter Waren sind wir im Verpackungsregister LUCID gemeldet:",
        list: [
          "Verpackungsregister LUCID: DE0000000000000 (Platzhalter)",
        ],
      },
      {
        heading: "Verantwortlich für den redaktionellen Inhalt",
        body: `Verantwortlich nach § 18 Absatz 2 Medienstaatsvertrag (MStV):\n${COMPANY.owner}, Anschrift wie oben.`,
      },
      {
        heading: "Betriebshaftpflichtversicherung",
        body: "Angaben zur Betriebs- und Produkthaftpflichtversicherung (freiwillige Angabe, für Dienstleistungen nach § 2 DL-InfoV verpflichtend):",
        list: [
          "Versicherer: Name der Versicherung (Platzhalter)",
          "Anschrift des Versicherers (Platzhalter)",
          "Räumlicher Geltungsbereich: Bundesrepublik Deutschland (Platzhalter)",
        ],
      },
      {
        heading: "Verbraucherstreitbeilegung",
        body:
          "Hinweis nach § 36 Verbraucherstreitbeilegungsgesetz (VSBG): Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. Sollten Sie mit unserem Service nicht zufrieden sein, wenden Sie sich bitte zunächst direkt an unseren Kundenservice, wir finden fast immer eine Lösung.\n\n" +
          "Zuständige Verbraucherschlichtungsstelle wäre: Universalschlichtungsstelle des Bundes, Zentrum für Schlichtung e. V., Straßburger Straße 8, 77694 Kehl am Rhein, www.verbraucher-schlichter.de.\n\n" +
          "Die frühere Online-Streitbeilegungsplattform (OS-Plattform) der Europäischen Kommission wurde zum 20. Juli 2025 endgültig eingestellt. Ein Link auf diese Plattform darf seitdem nicht mehr angegeben werden; wir verzichten daher bewusst auf einen entsprechenden Hinweis.",
      },
      {
        heading: "Haftung für Inhalte",
        body: "Als Diensteanbieter sind wir nach § 7 Absatz 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach den §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden entsprechender Rechtsverletzungen entfernen wir diese Inhalte umgehend.",
      },
      {
        heading: "Haftung für Links",
        body: "Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft; rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen entfernen wir derartige Links umgehend.",
      },
      {
        heading: "Urheberrecht",
        body: "Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.",
      },
      {
        heading: "Bildnachweis",
        body: "Die Containerfotos auf dieser Website stammen von Wikimedia Commons und sind frei lizenziert:",
        list: [
          "Igor Ovsyannykov: „Shipping containers in a port“, CC0 (keine Namensnennung erforderlich)",
          "AgainErick: „Shipping container stacks, Port of Rotterdam“, CC BY-SA 4.0",
          "Carsten Steger: „Aerial image of the Eurogate and Burchardkai container terminals“ (Hamburg), CC BY-SA 4.0",
          "Immanuel Giel: „Container architecture in Germany 01“, CC BY-SA 4.0",
          "Immanuel Giel: „Container architecture in Germany 02“, CC BY-SA 4.0",
          "Immanuel Giel: „Container architecture in Germany 03“, CC0 (keine Namensnennung erforderlich)",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* AGB                                                                 */
  /* ------------------------------------------------------------------ */
  agb: {
    slug: "agb",
    title: "Allgemeine Geschäftsbedingungen",
    intro: intro(
      "Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Bestellungen, die Verbraucherinnen und Verbraucher sowie Unternehmen über den Onlineshop von BBC Best Box Containerhandel e.K. aufgeben. Stand: 26. Juli 2026.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "§ 1 Geltungsbereich und Anbieter",
        body:
          `Für alle Bestellungen über unseren Onlineshop gelten diese Allgemeinen Geschäftsbedingungen in der zum Zeitpunkt der Bestellung gültigen Fassung. Vertragspartner ist die ${COMPANY.name}, ${COMPANY.street}, ${COMPANY.city}, ${COMPANY.country}.\n\n` +
          "Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können (§ 13 BGB). Unternehmer ist eine natürliche oder juristische Person oder eine rechtsfähige Personengesellschaft, die bei Abschluss des Vertrags in Ausübung ihrer gewerblichen oder selbständigen beruflichen Tätigkeit handelt (§ 14 BGB).\n\n" +
          "Abweichende Bedingungen des Kunden erkennen wir nicht an, es sei denn, wir haben ihrer Geltung ausdrücklich in Textform zugestimmt.",
      },
      {
        heading: "§ 2 Vertragsschluss",
        body:
          "Die Darstellung der Produkte im Onlineshop stellt kein rechtlich bindendes Angebot dar, sondern eine unverbindliche Aufforderung zur Bestellung.\n\n" +
          "Durch Anklicken der Schaltfläche „Zahlungspflichtig bestellen“ geben Sie ein verbindliches Angebot zum Kauf der im Warenkorb enthaltenen Waren ab. Unmittelbar nach dem Absenden der Bestellung erhalten Sie eine automatische Empfangsbestätigung per E-Mail. Diese Bestätigung dokumentiert lediglich den Eingang Ihrer Bestellung und stellt noch keine Annahme des Antrags dar.\n\n" +
          "Der Kaufvertrag kommt zustande, sobald wir Ihre Bestellung durch eine gesonderte Auftragsbestätigung per E-Mail annehmen, die Ware versenden oder, bei Vorkasse, die Zahlungsaufforderung übersenden. Nehmen wir die Bestellung nicht innerhalb von fünf Werktagen an, gilt sie als abgelehnt; bereits geleistete Zahlungen erstatten wir unverzüglich.\n\n" +
          "Bestellungen mit Speditionslieferung, Montageservice oder Sonderanfertigungen bestätigen wir stets gesondert, weil hierfür ein Liefertermin abzustimmen ist.",
      },
      {
        heading: "§ 3 Korrekturmöglichkeit, Vertragssprache und Speicherung des Vertragstextes",
        body:
          "Vor dem verbindlichen Absenden der Bestellung können Sie Ihre Eingaben über die üblichen Tastatur- und Mausfunktionen jederzeit korrigieren. Zusätzlich werden alle Eingaben vor der Bestellung in einem Bestätigungsfenster nochmals angezeigt und können auch dort berichtigt werden.\n\n" +
          "Vertragssprache ist ausschließlich Deutsch. Englischsprachige Fassungen dieser Bedingungen dienen nur der Information; im Streitfall ist die deutsche Fassung maßgeblich.\n\n" +
          "Wir speichern den Vertragstext und senden Ihnen die Bestelldaten sowie diese AGB per E-Mail zu. Nach Abschluss der Bestellung ist der Vertragstext aus Sicherheitsgründen nicht mehr über das Internet zugänglich; in einem Kundenkonto können Sie Ihre Bestellungen jedoch weiterhin einsehen.",
      },
      {
        heading: "§ 4 Preise und Versandkosten",
        body:
          "Alle angegebenen Preise sind Endpreise in Euro und enthalten die gesetzliche Umsatzsteuer. Sie verstehen sich zuzüglich Versandkosten, sofern auf der Produktseite nichts anderes angegeben ist.\n\n" +
          "Der Standardversand innerhalb Deutschlands ist kostenlos, ohne Mindestbestellwert. Wünschen Sie eine schnellere Zustellung, kostet der Expressversand pauschal 199,00 Euro. Für optionale Zusatzleistungen wie Anschluss, Montage oder die Lieferung bis zum Aufstellort gelten gesonderte Entgelte; diese Leistungen vereinbaren Sie vor oder nach der Bestellung mit unserem Kundenservice. Die Versandkosten werden vor Abschluss der Bestellung im Warenkorb ausgewiesen. Einzelheiten finden Sie auf der Seite „Versand & Lieferung“.\n\n" +
          "Bei Waren, die nach Gewicht, Volumen, Länge oder Fläche angeboten werden, weisen wir zusätzlich den Grundpreis gemäß Preisangabenverordnung aus. Bei Preisermäßigungen nennen wir den niedrigsten Gesamtpreis, den wir in den letzten 30 Tagen vor der Ermäßigung angewendet haben.",
      },
      {
        heading: "§ 5 Lieferung und Lieferzeit",
        body:
          "Wir liefern deutschlandweit; auf Anfrage liefern wir auch in weitere Mitgliedstaaten der Europäischen Union. Lieferungen an Packstationen sind nur bei Paketversand möglich; Container liefern wir ausschließlich per Spedition an eine Adresse.\n\n" +
          "Vorrätige Container liefern wir im Standardversand in der Regel innerhalb von 7 bis 10 Werktagen nach Vertragsschluss, bei Vorkasse ab dem Tag des Zahlungseingangs; im Expressversand innerhalb von maximal 5 Werktagen gegen den in der Bestellung ausgewiesenen Aufpreis. Bei Artikeln mit dem Hinweis „Auf Anfrage“ (Sonderanfertigung) nennen wir die voraussichtliche Lieferzeit auf der Produktseite; sie beträgt typischerweise rund drei Wochen.\n\n" +
          "Ist ein Artikel nicht verfügbar, weil uns unser Zulieferer trotz vertraglicher Verpflichtung nicht beliefert hat (kongruentes Deckungsgeschäft), können wir vom Vertrag zurücktreten. Wir informieren Sie unverzüglich und erstatten bereits geleistete Zahlungen sofort. Ihre gesetzlichen Rechte bleiben unberührt.\n\n" +
          "Teillieferungen sind zulässig, soweit sie für Sie zumutbar sind. Zusätzliche Versandkosten entstehen Ihnen dadurch nicht.",
      },
      {
        heading: "§ 6 Zahlungsbedingungen",
        body:
          "Wir bieten Vorkasse per Überweisung, Sofortüberweisung, PayPal, Kreditkarte und SEPA-Lastschrift an. Welche Zahlungsarten im Einzelfall zur Verfügung stehen, wird Ihnen im Bestellprozess angezeigt; wir behalten uns vor, einzelne Zahlungsarten auszuschließen.\n\n" +
          "Bei Vorkasse erhalten Sie unsere Bankdaten mit der Bestellbestätigung; die Bestellnummer dient als Verwendungszweck. Wir reservieren die Ware sieben Kalendertage und versenden nach Eingang der Zahlung. Geht die Zahlung innerhalb der Reservierungsfrist nicht ein, stornieren wir die Bestellung.\n\n" +
          "Bei SEPA-Lastschrift erteilen Sie uns ein SEPA-Lastschriftmandat. Über den Einzug informieren wir Sie mindestens einen Bankarbeitstag im Voraus (verkürzte Vorabankündigung). Für Rücklastschriften, die Sie zu vertreten haben, können wir die tatsächlich angefallenen Bankentgelte in Rechnung stellen.\n\n" +
          "Für die Nutzung gängiger SEPA-Zahlungsarten und Zahlungskarten berechnen wir kein zusätzliches Entgelt (§ 270a BGB). Kommen Sie in Zahlungsverzug, gelten die gesetzlichen Regelungen; als Verbraucher schulden Sie Verzugszinsen in Höhe von fünf Prozentpunkten über dem Basiszinssatz.",
      },
      {
        heading: "§ 7 Eigentumsvorbehalt",
        body:
          "Die gelieferte Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.\n\n" +
          "Gegenüber Unternehmern behalten wir uns das Eigentum bis zur vollständigen Begleichung aller Forderungen aus einer laufenden Geschäftsbeziehung vor. Der Unternehmer ist berechtigt, die Ware im ordentlichen Geschäftsgang weiterzuveräußern; sämtliche daraus entstehenden Forderungen tritt er bereits jetzt an uns ab.",
      },
      {
        heading: "§ 8 Widerrufsrecht",
        body:
          "Verbraucherinnen und Verbrauchern steht ein gesetzliches Widerrufsrecht von 14 Tagen zu. Die vollständige Widerrufsbelehrung, die Online-Widerrufsfunktion nach § 356a BGB sowie das Muster-Widerrufsformular finden Sie auf der Seite „Widerrufsrecht“; beides ist auch Bestandteil unserer Bestellbestätigung.\n\n" +
          "Zusätzlich zum gesetzlichen Widerrufsrecht räumen wir Ihnen freiwillig ein Rückgaberecht von 30 Tagen ab Erhalt der Ware ein. Dieses vertragliche Rückgaberecht setzt voraus, dass die Ware vollständig, unbeschädigt und in wiederverkaufsfähigem Zustand ist. Ihre gesetzlichen Rechte, insbesondere das 14-tägige Widerrufsrecht und die Mängelrechte, werden dadurch nicht eingeschränkt.",
      },
      {
        heading: "§ 9 Mängelhaftung (Gewährleistung)",
        body:
          "Es gilt das gesetzliche Mängelhaftungsrecht. Für neue Waren beträgt die Verjährungsfrist für Mängelansprüche von Verbrauchern zwei Jahre ab Ablieferung der Ware. Zeigt sich innerhalb eines Jahres seit Ablieferung ein Mangel, wird vermutet, dass die Ware bereits bei Übergabe mangelhaft war.\n\n" +
          "Gegenüber Unternehmern beträgt die Verjährungsfrist für Mängelansprüche bei neuen Waren ein Jahr ab Gefahrübergang. Die gesetzlichen Regelungen zum Lieferantenregress bleiben unberührt.\n\n" +
          "Bitte melden Sie Mängel unserem Kundenservice, möglichst mit Fotos des Schadens, bevor Sie weitere Schritte veranlassen. So können wir die Ursache meist schon vorab einschätzen und, falls nötig, eine Besichtigung vor Ort oder eine Nachbesserung durch unseren Aufbauservice organisieren.",
      },
      {
        heading: "§ 10 Herstellergarantien",
        body: "Neben der gesetzlichen Mängelhaftung gewähren manche Hersteller eigene Garantien, etwa auf die Korrosionsschutzbeschichtung, die Dichtigkeit der Schweißnähte oder die Mechanik von Rolltoren und Türen. Diese Garantien sind freiwillige Zusatzleistungen des jeweiligen Herstellers und lassen die gesetzlichen Rechte unberührt. Die genauen Garantiebedingungen finden Sie in den Unterlagen des Containers sowie, soweit vorhanden, auf der jeweiligen Produktseite.",
      },
      {
        heading: "§ 11 Transportschäden",
        body:
          "Werden Waren mit offensichtlichen Transportschäden angeliefert, reklamieren Sie diese bitte möglichst sofort beim Zusteller und nehmen Sie Kontakt mit uns auf. Bei Speditionslieferungen lassen Sie den Schaden bitte auf dem Ablieferbeleg vermerken.\n\n" +
          "Die Versäumung einer Reklamation oder Kontaktaufnahme hat für Ihre gesetzlichen Ansprüche und deren Durchsetzung, insbesondere für Ihre Gewährleistungsrechte, keinerlei Folgen. Sie helfen uns aber, unsere eigenen Ansprüche gegenüber dem Frachtführer geltend zu machen.",
      },
      {
        heading: "§ 12 Aufrechnung und Zurückbehaltungsrecht",
        body: "Ein Recht zur Aufrechnung steht Ihnen nur zu, wenn Ihre Gegenansprüche rechtskräftig festgestellt, unbestritten oder von uns anerkannt sind. Ein Zurückbehaltungsrecht können Sie nur ausüben, wenn die Ansprüche aus demselben Vertragsverhältnis resultieren.",
      },
      {
        heading: "§ 13 Haftung",
        body:
          "Für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit sowie bei Vorsatz und grober Fahrlässigkeit haften wir unbeschränkt nach den gesetzlichen Vorschriften. Gleiches gilt bei arglistigem Verschweigen eines Mangels, bei Übernahme einer Garantie und im Anwendungsbereich des Produkthaftungsgesetzes.\n\n" +
          "Bei einfacher Fahrlässigkeit haften wir nur bei Verletzung einer wesentlichen Vertragspflicht, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung Sie regelmäßig vertrauen dürfen. In diesem Fall ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt. Eine weitergehende Haftung ist ausgeschlossen.",
      },
      {
        heading: "§ 14 Streitbeilegung",
        body:
          "Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle im Sinne des Verbraucherstreitbeilegungsgesetzes teilzunehmen.\n\n" +
          "Die Online-Streitbeilegungsplattform der Europäischen Kommission wurde zum 20. Juli 2025 eingestellt und steht nicht mehr zur Verfügung. Bitte wenden Sie sich bei Beschwerden direkt an unseren Kundenservice.",
      },
      {
        heading: "§ 15 Anwendbares Recht, Gerichtsstand und Schlussbestimmungen",
        body:
          "Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Gegenüber Verbrauchern gilt diese Rechtswahl nur insoweit, als dadurch der Schutz nicht entzogen wird, der durch zwingende Bestimmungen des Rechts des Staates gewährt wird, in dem der Verbraucher seinen gewöhnlichen Aufenthalt hat.\n\n" +
          "Ist der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist ausschließlicher Gerichtsstand für alle Streitigkeiten aus diesem Vertrag unser Geschäftssitz in Großensee.\n\n" +
          "Sollte eine Bestimmung dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Datenschutzerklärung: DSGVO / TDDDG                                */
  /* ------------------------------------------------------------------ */
  datenschutz: {
    slug: "datenschutz",
    title: "Datenschutzerklärung",
    intro: intro(
      "Wir freuen uns über Ihr Interesse an unserem Onlineshop. Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Nachfolgend informieren wir Sie gemäß Artikel 13 und 14 der Datenschutz-Grundverordnung (DSGVO) darüber, welche Daten wir verarbeiten, zu welchem Zweck und welche Rechte Ihnen zustehen.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "1. Verantwortlicher und Kontakt",
        body: "Verantwortlicher im Sinne der DSGVO ist:",
        list: [
          COMPANY.name,
          `${COMPANY.street}, ${COMPANY.city}, ${COMPANY.country}`,
          `Telefon: ${COMPANY.phone}`,
          `E-Mail: ${COMPANY.email}`,
          `Vertreten durch: ${COMPANY.owner}`,
        ],
      },
      {
        heading: "2. Datenschutzbeauftragter",
        body: "Unseren betrieblichen Datenschutzbeauftragten erreichen Sie unter datenschutz@bestboxcontainer.de oder postalisch unter der oben genannten Anschrift mit dem Zusatz „Datenschutzbeauftragter“. Ob eine Bestellpflicht besteht, richtet sich nach § 38 BDSG; die Angabe ist vor der Veröffentlichung zu prüfen.",
      },
      {
        heading: "3. Rechtsgrundlagen der Verarbeitung",
        body: "Wir verarbeiten personenbezogene Daten nur auf einer der folgenden Rechtsgrundlagen:",
        list: [
          "Artikel 6 Absatz 1 Buchstabe a DSGVO: Ihre Einwilligung, etwa für Newsletter oder nicht notwendige Cookies",
          "Artikel 6 Absatz 1 Buchstabe b DSGVO: Erfüllung des Kaufvertrags oder vorvertragliche Maßnahmen",
          "Artikel 6 Absatz 1 Buchstabe c DSGVO: Erfüllung rechtlicher Pflichten, insbesondere handels- und steuerrechtlicher Aufbewahrungspflichten",
          "Artikel 6 Absatz 1 Buchstabe f DSGVO: unsere berechtigten Interessen, etwa Betrugsprävention, IT-Sicherheit und Verbesserung unseres Angebots",
        ],
      },
      {
        heading: "4. Hosting und Server-Logfiles",
        body:
          "Unser Onlineshop wird bei einem Dienstleister innerhalb der Europäischen Union gehostet (Name und Anschrift des Hosters sind vor der Veröffentlichung einzutragen). Mit dem Hoster besteht ein Auftragsverarbeitungsvertrag nach Artikel 28 DSGVO.\n\n" +
          "Beim Aufruf unserer Seiten erhebt der Server automatisch Informationen, die Ihr Browser übermittelt: IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite, übertragene Datenmenge, Referrer-URL sowie Browser- und Betriebssystemtyp. Diese Daten sind für uns nicht bestimmten Personen zuordenbar und dienen der Auslieferung der Seiten, der Systemsicherheit und der Fehleranalyse. Rechtsgrundlage ist Artikel 6 Absatz 1 Buchstabe f DSGVO. Die Logfiles werden nach spätestens sieben Tagen gelöscht oder anonymisiert.",
      },
      {
        heading: "5. Bestellabwicklung und Kundenkonto",
        body:
          "Für die Abwicklung Ihrer Bestellung verarbeiten wir Anrede, Vor- und Nachname, Rechnungs- und Lieferanschrift, E-Mail-Adresse, gegebenenfalls Telefonnummer sowie die Bestell- und Zahlungsdaten. Ohne diese Angaben kann der Vertrag nicht geschlossen und erfüllt werden. Rechtsgrundlage ist Artikel 6 Absatz 1 Buchstabe b DSGVO.\n\n" +
          "Legen Sie ein Kundenkonto an, speichern wir die Zugangsdaten und die Bestellhistorie, damit Sie künftige Bestellungen bequemer abschließen können. Sie können Ihr Kundenkonto jederzeit löschen lassen; gesetzliche Aufbewahrungspflichten bleiben davon unberührt.",
      },
      {
        heading: "6. Zahlungsdienstleister",
        body:
          "Je nach gewählter Zahlungsart geben wir die für die Zahlungsabwicklung erforderlichen Daten an den jeweiligen Zahlungsdienstleister weiter (Name und Anschrift der eingesetzten Dienstleister sind vor der Veröffentlichung zu ergänzen, zum Beispiel für PayPal, Kreditkartenakzeptanz und Rechnungskauf).\n\n" +
          "Die Zahlungsdienstleister verarbeiten die Daten in eigener Verantwortung. Rechtsgrundlage der Übermittlung ist Artikel 6 Absatz 1 Buchstabe b DSGVO. Kreditkarten- und Bankdaten werden ausschließlich beim jeweiligen Dienstleister erhoben; wir speichern keine vollständigen Zahlungsdaten.",
      },
      {
        heading: "7. Keine Bonitätsprüfung",
        body: "Wir bieten weder Kauf auf Rechnung noch Ratenzahlung an. Eine Bonitätsauskunft bei einer Wirtschaftsauskunftei holen wir deshalb nicht ein, und wir übermitteln Ihre Daten zu diesem Zweck an niemanden. Sollten wir eine solche Zahlungsart künftig anbieten, ergänzen wir diese Erklärung vorher um die Auskunftei, die Rechtsgrundlage und Ihr Widerspruchsrecht.",
      },
      {
        heading: "8. Versand und Montageservice",
        body: "Zur Zustellung geben wir Name, Lieferanschrift und, für die Terminabstimmung bei Speditionslieferungen sowie beim Anschluss- und Montageservice, Telefonnummer oder E-Mail-Adresse an den beauftragten Logistik- beziehungsweise Servicepartner weiter. Rechtsgrundlage ist Artikel 6 Absatz 1 Buchstabe b DSGVO.",
      },
      {
        heading: "9. Kundenbewertungen",
        body: "Wenn Sie eine Produktbewertung abgeben, verarbeiten wir den von Ihnen angegebenen Namen beziehungsweise das Pseudonym, den Bewertungstext, die Sternebewertung und den Zeitpunkt der Abgabe. Bewertungen werden vor der Veröffentlichung geprüft. Rechtsgrundlage ist Artikel 6 Absatz 1 Buchstabe a und f DSGVO. Sie können die Löschung Ihrer Bewertung jederzeit verlangen.",
      },
      {
        heading: "10. Newsletter",
        body:
          "Für den Newsletter verwenden wir das Double-Opt-in-Verfahren: Nach Ihrer Anmeldung senden wir Ihnen eine E-Mail mit einem Bestätigungslink. Erst nach Bestätigung nehmen wir Sie in den Verteiler auf. Wir speichern IP-Adresse und Zeitpunkt von Anmeldung und Bestätigung, um den Vorgang nachweisen zu können.\n\n" +
          "Rechtsgrundlage ist Ihre Einwilligung nach Artikel 6 Absatz 1 Buchstabe a DSGVO. Sie können den Newsletter jederzeit über den Abmeldelink in jeder E-Mail oder per Nachricht an uns abbestellen. Bestandskundinnen und -kunden können wir unter den Voraussetzungen des § 7 Absatz 3 UWG auch ohne gesonderte Einwilligung Werbung für ähnliche Waren senden; auch dagegen können Sie jederzeit widersprechen.",
      },
      {
        heading: "11. Warenkorb-Erinnerungen",
        body:
          "Wenn Sie im Bestellvorgang Ihre E-Mail-Adresse eingeben, die Bestellung aber nicht abschließen, speichern wir Ihre E-Mail-Adresse, die gewählten Artikel, die Beträge und den Zeitpunkt des Abbruchs.\n\n" +
          "Wir verwenden diese Daten, um Ihnen innerhalb von rund anderthalb Tagen bis zu drei Erinnerungen an Ihren Warenkorb zu senden und Ihnen bei Problemen im Bestellvorgang zu helfen. Die letzte Erinnerung kann einen Rabattcode enthalten. Rechtsgrundlage ist unser berechtigtes Interesse an der Wiederaufnahme abgebrochener Bestellvorgänge (Art. 6 Abs. 1 lit. f DSGVO).\n\n" +
          "Sie können dieser Verarbeitung jederzeit widersprechen. Jede Nachricht enthält am Ende einen Abmeldelink. Nach der Abmeldung erhalten Sie weder weitere Erinnerungen noch Angebote von uns. Die gespeicherten Daten werden spätestens 30 Tage nach dem Abbruch automatisch gelöscht, sofern keine Bestellung zustande kommt.",
      },
      {
        heading: "12. Kontaktaufnahme und Kundenservice",
        body: "Wenn Sie uns per E-Mail, Telefon oder Kontaktformular kontaktieren, verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage. Rechtsgrundlage ist Artikel 6 Absatz 1 Buchstabe b DSGVO, sofern die Anfrage einen Vertrag betrifft, ansonsten Artikel 6 Absatz 1 Buchstabe f DSGVO. Anfragen löschen wir, sobald sie abschließend bearbeitet sind und keine Aufbewahrungspflichten entgegenstehen.",
      },
      {
        heading: "13. Cookies und Einwilligungsverwaltung",
        body:
          "Der Betrieb dieses Shops beruht auf technisch notwendigen Cookies: Warenkorb, Sitzungsverwaltung, Sprachwahl und Sicherheit. Sie sind nach § 25 Absatz 2 Nummer 2 TDDDG einwilligungsfrei; die damit verbundene Datenverarbeitung stützt sich auf Artikel 6 Absatz 1 Buchstabe f DSGVO.\n\n" +
          "Zwei Dienste laden wir erst nach Ihrer Einwilligung über das Banner: unseren Live-Chat (Smartsupp s.r.o., Tschechische Republik), der eine Besucherkennung auf Ihrem Gerät speichert, und die Anfahrtskarte auf der Kontaktseite (Google Ireland Limited, Irland; Datenverarbeitung gegebenenfalls auch durch die Muttergesellschaft Google LLC, USA), die beim Laden Ihre IP-Adresse an Google überträgt. Rechtsgrundlage ist in beiden Fällen Ihre Einwilligung nach Artikel 6 Absatz 1 Buchstabe a DSGVO und § 25 Absatz 1 TDDDG. Ohne Einwilligung bleiben Chat und Karte deaktiviert; die Kontaktseite bietet dann einen einfachen Link, der Google Maps in einem neuen Tab öffnet, ohne vorher eine Verbindung zu Google herzustellen. Ihre Einwilligung widerrufen Sie jederzeit über den Link „Cookie-Einstellungen“ im Seitenfuß.\n\n" +
          "Cookies zur Reichweitenmessung, zu Werbezwecken oder von sozialen Netzwerken setzen wir nicht.\n\n" +
          "Zusätzlich können Sie Cookies in Ihrem Browser löschen oder blockieren. Einige Funktionen des Shops stehen dann möglicherweise nicht mehr vollständig zur Verfügung.",
      },
      {
        heading: "14. Reichweitenmessung und Marketing",
        body: "Soweit wir Web-Analyse-, Retargeting- oder Conversion-Tracking-Dienste einsetzen, geschieht dies ausschließlich auf Basis Ihrer Einwilligung. Die konkret eingesetzten Dienste, ihre Anbieter, die verarbeiteten Daten, die Speicherdauer und etwaige Drittlandübermittlungen sind vor der Veröffentlichung an dieser Stelle vollständig zu benennen.",
      },
      {
        heading: "15. Empfänger und Übermittlung in Drittländer",
        body: "Empfänger Ihrer Daten sind ausschließlich Dienstleister, die wir sorgfältig ausgewählt haben und die als Auftragsverarbeiter nach Artikel 28 DSGVO für uns tätig werden, sowie Stellen, an die wir aufgrund gesetzlicher Pflichten übermitteln müssen (etwa Finanzbehörden). Eine Übermittlung in Länder außerhalb der EU und des EWR findet nur statt, wenn Sie der Anfahrtskarte auf der Kontaktseite zustimmen: Dabei kann Google LLC mit Sitz in den USA Ihre IP-Adresse erhalten, gestützt auf die Standardvertragsklauseln der Europäischen Kommission gemäß Artikel 46 DSGVO. Ohne diese Einwilligung findet keine Übermittlung in ein Drittland statt; sollte künftig eine weitere erforderlich werden, geschieht dies nur auf Grundlage eines Angemessenheitsbeschlusses der Europäischen Kommission oder geeigneter Garantien im Sinne der Artikel 44 ff. DSGVO.",
      },
      {
        heading: "16. Speicherdauer",
        body: "Wir speichern personenbezogene Daten nur so lange, wie es für die jeweiligen Zwecke erforderlich ist. Vertrags- und Rechnungsdaten unterliegen handels- und steuerrechtlichen Aufbewahrungsfristen von sechs beziehungsweise zehn Jahren (§ 257 HGB, § 147 AO). Nach Ablauf dieser Fristen löschen wir die Daten.",
      },
      {
        heading: "17. Ihre Rechte als betroffene Person",
        body: "Ihnen stehen gegenüber uns die folgenden Rechte zu:",
        list: [
          "Auskunft über die zu Ihrer Person gespeicherten Daten (Artikel 15 DSGVO)",
          "Berichtigung unrichtiger oder Vervollständigung unvollständiger Daten (Artikel 16 DSGVO)",
          "Löschung Ihrer Daten, soweit keine Aufbewahrungspflichten entgegenstehen (Artikel 17 DSGVO)",
          "Einschränkung der Verarbeitung (Artikel 18 DSGVO)",
          "Datenübertragbarkeit in einem strukturierten, gängigen und maschinenlesbaren Format (Artikel 20 DSGVO)",
          "Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft (Artikel 7 Absatz 3 DSGVO)",
          "Beschwerde bei einer Datenschutz-Aufsichtsbehörde (Artikel 77 DSGVO)",
        ],
      },
      {
        heading: "18. Widerspruchsrecht nach Artikel 21 DSGVO",
        body:
          "Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen die Verarbeitung Sie betreffender personenbezogener Daten Widerspruch einzulegen, die auf Grundlage von Artikel 6 Absatz 1 Buchstabe f DSGVO erfolgt. Wir verarbeiten die Daten dann nicht mehr, es sei denn, wir können zwingende schutzwürdige Gründe nachweisen, die Ihre Interessen, Rechte und Freiheiten überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen.\n\n" +
          "Widersprechen Sie der Verarbeitung zum Zweck der Direktwerbung, verarbeiten wir Ihre Daten für diesen Zweck nicht mehr. Der Widerspruch ist formfrei und kann an " +
          COMPANY.email +
          " gerichtet werden.",
      },
      {
        heading: "19. Zuständige Aufsichtsbehörde",
        body: "Für uns zuständig ist das Unabhängige Landeszentrum für Datenschutz Schleswig-Holstein (ULD), Holstenstraße 98, 24103 Kiel.",
      },
      {
        heading: "20. Datensicherheit und automatisierte Entscheidungen",
        body:
          "Wir sichern die Übertragung Ihrer Daten durch eine TLS-Verschlüsselung (erkennbar am Schloss-Symbol in der Adresszeile Ihres Browsers) und setzen technische sowie organisatorische Maßnahmen nach Artikel 32 DSGVO ein.\n\n" +
          "Eine automatisierte Entscheidungsfindung einschließlich Profiling nach Artikel 22 DSGVO findet nicht statt, mit Ausnahme der im Abschnitt zur Bonitätsprüfung beschriebenen Prüfung, die einer manuellen Überprüfung zugänglich ist.",
      },
      {
        heading: "21. Änderungen dieser Datenschutzerklärung",
        body: "Wir passen diese Datenschutzerklärung an, wenn sich die Rechtslage, unsere Dienste oder die Datenverarbeitung ändern. Es gilt jeweils die auf dieser Seite veröffentlichte Fassung. Stand: 26. Juli 2026.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Widerrufsrecht                                                      */
  /* ------------------------------------------------------------------ */
  widerruf: {
    slug: "widerruf",
    title: "Widerrufsrecht und Muster-Widerrufsformular",
    intro: intro(
      "Verbraucherinnen und Verbraucher haben ein 14-tägiges Widerrufsrecht. Die nachfolgende Belehrung folgt dem gesetzlichen Muster nach Anlage 1 zu Artikel 246a § 1 Absatz 2 Satz 2 EGBGB in der seit dem 19. Juni 2026 geltenden Fassung.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Widerrufsbelehrung: Widerrufsrecht",
        body:
          "Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.\n\n" +
          "Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.\n\n" +
          `Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (${COMPANY.name}, ${COMPANY.street}, ${COMPANY.city}, ${COMPANY.country}, Telefon ${COMPANY.phone}, E-Mail ${COMPANY.email}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.\n\n` +
          "Über den Eingang Ihrer Widerrufserklärung senden wir Ihnen unverzüglich eine Bestätigung per E-Mail, mit Datum und Uhrzeit des Eingangs.\n\n" +
          "Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.",
      },
      {
        heading: "Widerrufsbelehrung: Folgen des Widerrufs",
        body:
          "Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.\n\n" +
          "Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.\n\n" +
          `Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an ${RETURN_ADDRESS} zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden.\n\n` +
          "Wir tragen die Kosten der Rücksendung der Waren.\n\n" +
          "Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.\n\n" +
          "Ende der Widerrufsbelehrung",
      },
      {
        heading: "Fristbeginn bei mehreren Waren und Teillieferungen",
        body:
          "Umfasst Ihre Bestellung mehrere Waren, die Sie in einer einheitlichen Bestellung bestellt haben und die getrennt geliefert werden, beginnt die Widerrufsfrist an dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die letzte Ware in Besitz genommen haben bzw. hat.\n\n" +
          "Wird eine Ware in mehreren Teilsendungen oder Stücken geliefert (etwa ein mehrteiliger, zusammensetzbarer Container), beginnt die Frist an dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die letzte Teilsendung oder das letzte Stück in Besitz genommen haben bzw. hat.",
      },
      {
        heading: "Widerruf in Textform",
        body:
          "Für den Widerruf genügt eine eindeutige Erklärung in Textform. Am schnellsten geht es per E-Mail an " +
          `${COMPANY.email}: Nennen Sie darin Ihren Namen, Ihre Bestellnummer und den Artikel, den Sie zurückgeben möchten. Ebenso möglich sind ein Brief an die im Impressum genannte Anschrift oder ein Anruf unter ${COMPANY.phone}.\n\n` +
          "Sie können dafür das unten abgedruckte Muster-Widerrufsformular verwenden; vorgeschrieben ist es nicht.\n\n" +
          "Über den Eingang Ihrer Erklärung erhalten Sie unverzüglich eine Bestätigung per E-Mail, mit Datum und Uhrzeit des Eingangs.",
      },
      {
        heading: "Muster-Widerrufsformular",
        body:
          "(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)\n\n" +
          `An ${COMPANY.name}, ${COMPANY.street}, ${COMPANY.city}, ${COMPANY.country}, E-Mail: ${COMPANY.email}:`,
        list: [
          "Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*) / die Erbringung der folgenden Dienstleistung (*)",
          "Bestellt am (*) / erhalten am (*)",
          "Name des/der Verbraucher(s)",
          "Anschrift des/der Verbraucher(s)",
          "Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)",
          "Datum",
          "(*) Unzutreffendes streichen.",
        ],
      },
      {
        heading: "Ausschluss und vorzeitiges Erlöschen des Widerrufsrechts",
        body: "Das Widerrufsrecht besteht nach § 312g Absatz 2 BGB unter anderem nicht bei folgenden Verträgen:",
        list: [
          "Waren, die nicht vorgefertigt sind und für deren Herstellung eine individuelle Auswahl oder Bestimmung durch Sie maßgeblich ist oder die eindeutig auf Ihre persönlichen Bedürfnisse zugeschnitten sind (zum Beispiel Container mit individuellem Zuschnitt für Türen und Fenster)",
          "versiegelte Waren, die aus Gründen des Gesundheitsschutzes oder der Hygiene nicht zur Rückgabe geeignet sind, wenn die Versiegelung nach der Lieferung entfernt wurde (zum Beispiel Rasierer, Epiliergeräte, In-Ear-Kopfhörer, Wasserfilterkartuschen)",
          "Ton- oder Videoaufnahmen sowie Computersoftware in einer versiegelten Packung, wenn die Versiegelung nach der Lieferung entfernt wurde (zum Beispiel Spiele-Discs und Software)",
          "Waren, die nach der Lieferung aufgrund ihrer Beschaffenheit untrennbar mit anderen Gütern vermischt wurden",
        ],
      },
      {
        heading: "Digitale Inhalte",
        body: "Bei Verträgen über die Lieferung von nicht auf einem körperlichen Datenträger befindlichen digitalen Inhalten, etwa Download-Codes für Spiele oder Software, erlischt Ihr Widerrufsrecht nach § 356 Absatz 5 BGB, wenn wir mit der Vertragserfüllung begonnen haben, nachdem Sie ausdrücklich zugestimmt haben, dass wir vor Ablauf der Widerrufsfrist beginnen, und Sie Ihre Kenntnis vom Erlöschen des Widerrufsrechts bestätigt haben. Wir bestätigen Ihnen dies zusätzlich auf einem dauerhaften Datenträger.",
      },
      {
        heading: "Freiwilliges 30-Tage-Rückgaberecht",
        body: "Über das gesetzliche Widerrufsrecht hinaus räumen wir Ihnen ein vertragliches Rückgaberecht von 30 Tagen ab Erhalt der Ware ein. Es gilt für unbenutzte, vollständige und wiederverkaufsfähige Artikel und lässt Ihre gesetzlichen Rechte unberührt. Details finden Sie auf der Seite „Retoure & Reklamation“.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Versand & Lieferung                                                 */
  /* ------------------------------------------------------------------ */
  versand: {
    slug: "versand",
    title: "Versand und Lieferung",
    intro: intro(
      "Hier finden Sie alle Informationen zu Versandkosten, Lieferzeiten, Speditionslieferung sowie zum Aufstellservice vor Ort.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Versandkosten auf einen Blick",
        body: "Alle Preise verstehen sich inklusive der gesetzlichen Umsatzsteuer. Die für Ihre Bestellung geltenden Versandkosten werden Ihnen im Warenkorb ausgewiesen, bevor Sie die Bestellung abschließen.",
        list: [
          "Standardversand innerhalb Deutschlands: kostenlos, ohne Mindestbestellwert",
          "Expressversand innerhalb Deutschlands: 199,00 Euro",
          "Zusatzleistungen wie Lieferung bis zum Aufstellort, Anschluss oder Montage: nach Vereinbarung, siehe unten",
        ],
      },
      {
        heading: "Lieferzeiten",
        body:
          "Vorrätige Container erreichen Sie im Standardversand innerhalb von 7 bis 10 Werktagen, im Expressversand innerhalb von maximal 5 Werktagen. Werktage sind Montag bis Samstag, ausgenommen gesetzliche Feiertage am Sitz unseres Lagers.\n\n" +
          "Bei Vorkasse beginnt die Lieferzeit am Tag nach Erteilung des Zahlungsauftrags, bei allen anderen Zahlungsarten am Tag nach Vertragsschluss.\n\n" +
          "Artikel mit dem Hinweis „Auf Anfrage“ sind Sonderanfertigungen, die wir eigens für Sie fertigen lassen. Die Lieferzeit beträgt in diesen Fällen üblicherweise rund drei Wochen; die konkrete Angabe finden Sie auf der Produktseite.",
      },
      {
        heading: "Liefergebiet",
        body: "Wir liefern deutschlandweit, einschließlich der Nordsee- und Ostseeinseln. Auf Anfrage liefern wir außerdem in weitere Mitgliedstaaten der Europäischen Union; sprechen Sie Kosten und Lieferzeit vorab mit unserem Kundenservice ab. Paketsendungen können auf Wunsch an eine Packstation gehen; Speditionslieferungen benötigen eine Straßenanschrift und eine erreichbare Telefonnummer.",
      },
      {
        heading: "Speditionslieferung von Containern",
        body:
          "Container liefern wir per Hakenlift-Spedition (Absetzkipper) oder, je nach Zufahrt und Größe, mit Kranfahrzeug. Die Spedition meldet sich vorab telefonisch oder per SMS und vereinbart mit Ihnen ein Zeitfenster.\n\n" +
          "Standardmäßig setzen wir den Container an der von Ihnen angegebenen, frei zugänglichen Stellfläche ab. Zufahrt, Untergrund und eventuell nötiges Hebegerät klären wir vorab mit Ihnen: Bitte prüfen Sie, dass die Zufahrt für ein Fahrzeug mit Absetzkipper (in der Regel bis 12 m Länge) befahrbar ist und der Untergrund tragfähig sowie eben ist.",
        list: [
          "Absetzen an der vereinbarten Stellfläche: im Speditionsversand enthalten",
          "Kranentladung bei eingeschränkter Zufahrt oder besonderer Positionierung: Angebot nach Aufmaß, auf Anfrage",
          "Ausrichten und Unterbauen des Containers: 29,00 Euro, auf Anfrage",
        ],
      },
      {
        heading: "Aufbauservice vor Ort",
        body:
          "Auf Wunsch übernehmen unsere Servicepartner das Verbinden mehrteiliger Container, das Einstellen der Türen und Rolltore sowie die Kontrolle der Dichtungen nach dem Aufstellen. Die Leistung buchen Sie nicht im Warenkorb, sondern telefonisch oder per E-Mail, am besten vor der Bestellung, damit wir sie mit der Lieferung zusammen einplanen können.\n\n" +
          "Voraussetzung ist ein ebener, tragfähiger und frei zugänglicher Untergrund. Elektro- und Sanitäranschlüsse an bauseitige Leitungen dürfen wir nur durch zugelassene Fachbetriebe ausführen lassen und vermitteln diese auf Wunsch.",
        list: [
          "Verbinden und Ausrichten zusammensetzbarer Container (z. B. 2 × 4 × 2 m zu 8 × 2 m): 89,00 Euro",
          "Einstellen von Türen, Rolltoren und Verriegelungen: 49,00 Euro",
          "Vermittlung eines Fachbetriebs für Strom- oder Sanitäranschluss: Angebot nach Aufmaß",
        ],
      },
      {
        heading: "Teillieferungen",
        body: "Bestellen Sie mehrere Artikel mit unterschiedlicher Verfügbarkeit, versenden wir vorrätige Positionen in der Regel sofort und liefern den Rest nach. Zusätzliche Versandkosten entstehen Ihnen dadurch nicht. Für den Beginn der Widerrufsfrist ist der Erhalt der letzten Ware maßgeblich.",
      },
      {
        heading: "Wo bleibt meine Bestellung?",
        body: "Den Stand Ihrer Bestellung sehen Sie jederzeit über den Link in Ihrer Bestellbestätigung, und in Ihrem Kundenkonto unter „Meine Bestellungen“. Sobald die Ware unser Lager verlässt, setzen wir den Status auf „versandt“. Die Sendungsnummer und, bei Speditionslieferungen, die Kontaktdaten für die Terminabstimmung teilen wir Ihnen per E-Mail mit, sobald sie uns vorliegen.",
      },
      {
        heading: "Transportschäden",
        body: "Bitte prüfen Sie die Sendung möglichst bei Anlieferung. Melden Sie sichtbare Schäden dem Zusteller und lassen Sie diese bei Speditionslieferungen auf dem Ablieferbeleg vermerken. Informieren Sie anschließend unseren Kundenservice, wir organisieren Ersatz oder Reparatur. Ihre gesetzlichen Gewährleistungsrechte bleiben davon in jedem Fall unberührt.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Zahlungsarten                                                       */
  /* ------------------------------------------------------------------ */
  zahlungsarten: {
    slug: "zahlungsarten",
    title: "Zahlungsarten",
    intro: intro(
      "Sie zahlen bei uns per Vorkasse-Überweisung, per Sofortüberweisung, mit PayPal, per Kreditkarte oder per SEPA-Lastschrift. Welche Zahlungsarten im Einzelfall verfügbar sind, sehen Sie im Bestellprozess.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Vorkasse per Überweisung",
        body:
          "Mit der Bestellbestätigung erhalten Sie unsere Bankverbindung und die Bestellnummer, die Sie bitte als Verwendungszweck angeben. Dieselben Angaben stehen auf der Rechnung, die der Bestätigung als PDF beiliegt.\n\n" +
          "Wir reservieren die Ware sieben Kalendertage. Nach Eingang der Zahlung stimmen wir umgehend den Liefertermin mit Ihnen ab. Geht die Zahlung nicht innerhalb der Reservierungsfrist ein, stornieren wir die Bestellung und Sie erhalten eine Nachricht von uns.",
      },
      {
        heading: "Sofortüberweisung",
        body: "Sie werden am Ende des Bestellvorgangs zum Online-Banking Ihrer Bank weitergeleitet und geben die Überweisung dort direkt frei. Wir erhalten die Zahlungsbestätigung unmittelbar und können sofort mit dem Versand beginnen, ein eigenes Konto bei einem Zahlungsdienst brauchen Sie dafür nicht.",
      },
      {
        heading: "PayPal",
        body: "Sie werden am Ende des Bestellvorgangs zu PayPal weitergeleitet und bestätigen die Zahlung dort mit Ihren Zugangsdaten. Der Betrag wird unmittelbar nach dem Vertragsschluss abgebucht. Für die Nutzung benötigen Sie ein PayPal-Konto; es gelten zusätzlich die Nutzungsbedingungen von PayPal.",
      },
      {
        heading: "Kreditkarte",
        body: "Wir akzeptieren Visa, Mastercard und American Express. Die Belastung Ihrer Karte erfolgt mit dem Versand der Ware, bei Teillieferungen anteilig. Zur Sicherheit setzen wir das 3-D-Secure-Verfahren Ihrer Bank ein; Ihre Kartendaten werden ausschließlich verschlüsselt an unseren Zahlungsdienstleister übermittelt und nicht bei uns gespeichert.",
      },
      {
        heading: "SEPA-Lastschrift",
        body:
          "Sie erteilen uns im Bestellprozess ein SEPA-Lastschriftmandat. Wir buchen den Rechnungsbetrag frühestens mit dem Versand der Ware von Ihrem Konto ab.\n\n" +
          "Über den Einzug informieren wir Sie mindestens einen Bankarbeitstag vorher (verkürzte Vorabankündigung). Bitte sorgen Sie für ausreichende Kontodeckung: Für Rücklastschriften, die Sie zu vertreten haben, stellen wir die tatsächlich angefallenen Bankentgelte in Rechnung.",
      },
      {
        heading: "Keine Zusatzentgelte",
        body: "Für die Nutzung gängiger SEPA-Zahlungsarten und gängiger Zahlungskarten berechnen wir kein zusätzliches Entgelt (§ 270a BGB). Der im Warenkorb angezeigte Gesamtbetrag ist der Betrag, den Sie tatsächlich zahlen.",
      },
      {
        heading: "Sicherheit Ihrer Zahlungsdaten",
        body: "Alle Zahlungsvorgänge laufen über eine TLS-verschlüsselte Verbindung. Kreditkarten- und Kontodaten werden ausschließlich bei den jeweiligen Zahlungsdienstleistern verarbeitet, die den Sicherheitsstandard PCI DSS einhalten. Details zur Datenverarbeitung finden Sie in unserer Datenschutzerklärung.",
      },
      {
        heading: "Zahlungsverzug",
        body: "Kommen Sie mit einer Zahlung in Verzug, gelten die gesetzlichen Regelungen. Verbraucherinnen und Verbraucher schulden Verzugszinsen in Höhe von fünf Prozentpunkten über dem Basiszinssatz. Wir melden uns vor jeder weiteren Maßnahme zunächst mit einer Zahlungserinnerung.",
      },
      {
        heading: "Rückerstattungen",
        body: "Erstattungen erfolgen grundsätzlich über das ursprünglich verwendete Zahlungsmittel. Bei Vorkasse, Sofortüberweisung und SEPA-Lastschrift überweisen wir auf das Konto, von dem die Zahlung erfolgt ist. Kosten entstehen Ihnen dabei nicht.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Retoure & Reklamation                                               */
  /* ------------------------------------------------------------------ */
  retoure: {
    slug: "retoure",
    title: "Retoure und Reklamation",
    intro: intro(
      "Etwas passt nicht oder funktioniert nicht wie erwartet? Auf dieser Seite erklären wir Schritt für Schritt, wie Sie einen Artikel zurückgeben und wie Sie einen Mangel reklamieren. Die rechtsverbindlichen Regelungen finden Sie in der Widerrufsbelehrung und in den AGB.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Zwei Wege zurück",
        body:
          "Gesetzliches Widerrufsrecht: 14 Tage ab Erhalt der Ware, ohne Angabe von Gründen. Die maßgebliche Belehrung finden Sie auf der Seite „Widerrufsrecht“.\n\n" +
          "Freiwilliges Rückgaberecht: Zusätzlich gewähren wir 30 Tage ab Erhalt der Ware. Voraussetzung ist, dass der Artikel unbenutzt, vollständig und wiederverkaufsfähig ist. Dieses zusätzliche Recht schränkt Ihre gesetzlichen Rechte nicht ein.",
      },
      {
        heading: "So melden Sie eine Rücksendung an",
        body: "Bitte melden Sie die Rücksendung vorab an, so ordnen wir Ihr Paket sofort zu und erstatten schneller.",
        list: [
          `E-Mail an ${COMPANY.email} mit Bestellnummer und Artikelbezeichnung`,
          "Muster-Widerrufsformular von der Seite „Widerrufsrecht“, ausgefüllt per E-Mail oder Post, vorgeschrieben ist es nicht",
          `Telefon: ${COMPANY.phone}, montags bis freitags von 8 bis 18 Uhr`,
        ],
      },
      {
        heading: "Rücksendekosten",
        body:
          "Die Kosten der Rücksendung tragen wir. Für Paketsendungen stellen wir Ihnen ein kostenloses Rücksendeetikett zur Verfügung.\n\n" +
          "Container, die per Spedition geliefert wurden, holen wir bei Ihnen ab. Bitte vereinbaren Sie dafür einen Termin mit unserem Kundenservice.",
      },
      {
        heading: "Zubehör und Zustand",
        body: "Legen Sie bitte sämtliches mitgeliefertes Zubehör bei, etwa Schlüssel, Verriegelungsbolzen und Dokumentation. Fehlen Teile, können wir den Wertersatz nur anteilig erstatten.",
      },
      {
        heading: "Prüfung der Ware und Wertersatz",
        body: "Sie dürfen die Ware prüfen, wie es Ihnen auch vor Ort beim Händler möglich wäre, also besichtigen, öffnen und Türen sowie Rolltore probeweise bedienen. Für einen Wertverlust, der über diese Prüfung hinausgeht (zum Beispiel Bohrungen, Anschweißungen oder sonstige bauliche Veränderungen am Container), können wir Wertersatz verlangen.",
      },
      {
        heading: "Rückerstattung",
        body: "Wir erstatten den Kaufpreis einschließlich der Standard-Hinsendekosten unverzüglich, spätestens binnen 14 Tagen nach Eingang Ihrer Widerrufserklärung. Wir dürfen die Rückzahlung zurückhalten, bis wir die Ware zurückerhalten haben oder Sie den Absendenachweis vorlegen. Die Erstattung erfolgt über das ursprüngliche Zahlungsmittel; Entgelte entstehen Ihnen dadurch nicht.",
      },
      {
        heading: "Reklamation eines Mangels",
        body:
          "Für neue Container gilt die gesetzliche Mängelhaftung von zwei Jahren ab Ablieferung. Zeigt sich innerhalb der ersten zwölf Monate ein Mangel, wird vermutet, dass er bereits bei Übergabe vorlag. Sie müssen also nichts beweisen.\n\n" +
          "Melden Sie den Mangel bitte zuerst unserem Kundenservice und halten Sie Bestellnummer, Containernummer und eine kurze Fehlerbeschreibung samt Fotos bereit. Wir vereinbaren dann meist eine Besichtigung vor Ort, statt den Container zu transportieren, das ist schneller und schont die Ware.",
      },
      {
        heading: "Garantie zusätzlich zur Gewährleistung",
        body: "Manche Hersteller gewähren freiwillige Garantien, etwa auf die Korrosionsschutzbeschichtung oder die Dichtigkeit der Schweißnähte. Diese Garantien treten neben die gesetzliche Mängelhaftung und schränken sie nicht ein. Wir unterstützen Sie gern bei der Abwicklung mit dem Hersteller.",
      },
      {
        heading: "Transportschaden",
        body: "Ist die Ware beschädigt angekommen, melden Sie sich bitte innerhalb weniger Tage bei uns und senden Sie nach Möglichkeit Fotos des Schadens. Wir organisieren dann Ersatz oder Nachbesserung. Eine verspätete Meldung schadet Ihren gesetzlichen Rechten nicht, erleichtert uns aber die Klärung mit dem Frachtführer.",
      },
      {
        heading: "Nicht zurückgenommene Artikel",
        body: "Vom Widerrufs- und Rückgaberecht ausgeschlossen sind unter anderem maßgefertigte Artikel sowie entsiegelte Hygieneartikel, Software und Datenträger. Die vollständige Aufzählung finden Sie auf der Seite „Widerrufsrecht“.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* FAQ : pas d'avertissement juridique                                 */
  /* ------------------------------------------------------------------ */
  faq: {
    slug: "faq",
    title: "Häufige Fragen",
    intro:
      "Von der Lieferzeit über den Aufbauservice bis zur Zahlung: Hier finden Sie Antworten auf die Fragen, die uns am häufigsten erreichen. Ist Ihre Frage nicht dabei, rufen Sie uns an oder schreiben Sie uns, montags bis freitags von 8 bis 18 Uhr.",
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Wie lange dauert die Lieferung?",
        body: "Vorrätige Container sind im Standardversand innerhalb von 7 bis 10 Werktagen bei Ihnen, im Expressversand innerhalb von maximal 5 Werktagen. Die Spedition meldet sich vorab telefonisch und vereinbart ein Zeitfenster mit Ihnen. Artikel mit dem Hinweis „Auf Anfrage“ sind Sonderanfertigungen; hier dauert es üblicherweise rund drei Wochen.",
      },
      {
        heading: "Was kostet der Versand?",
        body: "Der Standardversand innerhalb Deutschlands ist kostenlos, ohne Mindestbestellwert, unabhängig von Größe und Gewicht der Ware. Wünschen Sie die Lieferung innerhalb von maximal 5 Werktagen, kostet der Expressversand pauschal 199,00 Euro. Andere Zuschläge gibt es nicht. Die für Ihre Bestellung geltenden Kosten sehen Sie immer im Warenkorb, bevor Sie bestellen.",
      },
      {
        heading: "Liefern Sie auch ins Ausland?",
        body: "Wir liefern deutschlandweit, einschließlich der Inseln. In weitere Mitgliedstaaten der Europäischen Union liefern wir auf Anfrage. Schreiben Sie uns vor der Bestellung, dann nennen wir Ihnen Machbarkeit, Kosten und Lieferzeit für Ihre Adresse.",
      },
      {
        heading: "Wird der Container bis auf mein Grundstück gebracht?",
        body: "Die Spedition setzt den Container standardmäßig an der von Ihnen angegebenen, frei zugänglichen Stellfläche ab. Ist die Zufahrt eingeschränkt oder ist eine besondere Positionierung nötig, organisieren wir eine Kranentladung; das Angebot dafür richtet sich nach Aufmaß. Rufen Sie uns an oder schreiben Sie uns vor der Bestellung, dann prüfen wir gemeinsam Zufahrt, Untergrund und Platzbedarf.",
      },
      {
        heading: "Bieten Sie einen Aufbauservice an?",
        body: "Ja: 89 Euro für das Verbinden und Ausrichten zusammensetzbarer Container, 49 Euro für das Einstellen von Türen, Rolltoren und Verriegelungen. Den Service vereinbaren Sie telefonisch oder per E-Mail, am besten vor der Bestellung, im Warenkorb lässt er sich nicht mitbestellen. Voraussetzung ist ein ebener, tragfähiger und frei zugänglicher Untergrund. Elektro- und Sanitärarbeiten dürfen wir nur durch zugelassene Fachbetriebe ausführen lassen.",
      },
      {
        heading: "Nehmen Sie meinen gebrauchten Container in Zahlung?",
        body: "Häufig ja. Beschreiben Sie uns Zustand, Baujahr und Maße Ihres Containers, gern mit Fotos, wir machen Ihnen dann ein Ankaufsangebot. Details und Kontaktmöglichkeiten finden Sie auf unserer Ankaufsseite.",
      },
      {
        heading: "Welche Zahlungsarten kann ich nutzen?",
        body: "Sie können per Vorkasse-Überweisung, per Sofortüberweisung, mit PayPal, mit Kreditkarte (Visa, Mastercard, American Express) oder per SEPA-Lastschrift bezahlen. Zusatzgebühren berechnen wir für keine dieser Zahlungsarten (§ 270a BGB). Bei Vorkasse reservieren wir die Ware sieben Kalendertage; geht die Zahlung bis dahin nicht ein, stornieren wir die Bestellung. Welche Zahlungsarten im Einzelfall zur Verfügung stehen, sehen Sie im Bestellprozess.",
      },
      {
        heading: "Wie läuft die Zahlung per Vorkasse ab?",
        body: "Mit der Bestellbestätigung erhalten Sie unsere Bankverbindung und die Bestellnummer, die als Verwendungszweck dient; beides steht auch auf der Rechnung, die der Bestätigung als PDF beiliegt. Wir reservieren die Ware sieben Kalendertage und stimmen nach Zahlungseingang umgehend den Liefertermin mit Ihnen ab. Kommt die Zahlung nicht rechtzeitig an, stornieren wir die Bestellung und melden uns bei Ihnen.",
      },
      {
        heading: "Wie lange habe ich Garantie?",
        body: "Auf alle neuen Container gilt die gesetzliche Mängelhaftung von zwei Jahren ab Ablieferung. Tritt in den ersten zwölf Monaten ein Defekt auf, wird vermutet, dass er von Anfang an vorlag. Sie müssen also nichts beweisen. Manche Hersteller gewähren zusätzlich freiwillige Garantien, etwa auf die Korrosionsschutzbeschichtung.",
      },
      {
        heading: "Was ist der Unterschied zwischen Garantie und Gewährleistung?",
        body: "Die Gewährleistung ist Ihr gesetzliches Recht uns gegenüber und dauert zwei Jahre. Eine Garantie ist eine freiwillige Zusage des Herstellers, die darüber hinausgehen kann, etwa auf die Dichtigkeit der Schweißnähte. Die Garantie ersetzt die Gewährleistung nicht, sondern kommt zusätzlich hinzu. Sie entscheiden, welchen Weg Sie nutzen.",
      },
      {
        heading: "Wie lange kann ich einen Artikel zurückgeben?",
        body: "Es gibt zwei Wege zurück. Ihr gesetzliches Widerrufsrecht läuft 14 Tage ab Erhalt der Ware und verlangt keine Begründung; maßgeblich ist die Widerrufsbelehrung. Darüber hinaus räumen wir Ihnen freiwillig ein vertragliches Rückgaberecht von 30 Tagen ab Erhalt der Ware ein, vorausgesetzt, der Artikel ist unbenutzt, vollständig und wiederverkaufsfähig. Dieses zusätzliche Recht schränkt Ihre gesetzlichen Rechte nicht ein.",
      },
      {
        heading: "Wie schicke ich etwas zurück?",
        body: `Melden Sie die Rücksendung vorab an, per E-Mail an ${COMPANY.email} oder telefonisch unter ${COMPANY.phone}. Das Muster-Widerrufsformular finden Sie auf der Seite „Widerrufsrecht“; Sie müssen es aber nicht verwenden, eine formlose eindeutige Erklärung genügt. Container holen wir nach Terminabsprache bei Ihnen ab. Legen Sie bitte sämtliches Zubehör bei, etwa Schlüssel und Verriegelungsbolzen.`,
      },
      {
        heading: "Was kostet die Rücksendung?",
        body: "Nichts. Wir tragen die Kosten der Rücksendung, sowohl für Pakete als auch für die Abholung von Containern durch die Spedition.",
      },
      {
        heading: "Wann bekomme ich mein Geld zurück?",
        body: "Wir erstatten den Kaufpreis spätestens 14 Tage nach Eingang Ihres Widerrufs, sobald die Ware bei uns eingetroffen ist oder Sie den Absendenachweis vorgelegt haben. Die Rückzahlung erfolgt über das ursprüngliche Zahlungsmittel; Gebühren entstehen Ihnen dabei nicht. Hinsendekosten fallen beim Standardversand nicht an. Haben Sie den Expressversand gewählt, bleibt dessen Aufpreis nach § 357 Absatz 2 BGB bei Ihnen: Erstattet wird nur, was die günstigste Standardlieferung gekostet hätte, und die ist bei uns kostenlos.",
      },
      {
        heading: "Ein Artikel ist „Auf Anfrage“, was bedeutet das?",
        body: "Der Artikel ist eine Sonderanfertigung: Wir lassen ihn erst nach Ihrer Bestellung fertigen. Die Lieferzeit beträgt üblicherweise rund drei Wochen. Sie können solche Artikel ganz normal bestellen und erhalten von uns eine Rückmeldung, sobald ein konkreter Termin feststeht.",
      },
      {
        heading: "Woher weiß ich, ob die Zufahrt für die Lieferung geeignet ist?",
        body: "Entscheidend sind die Breite und Höhe der Zufahrt, die Tragfähigkeit des Untergrunds und ausreichend Platz zum Rangieren für ein Fahrzeug mit Absetzkipper. Ein Richtwert: Der Lkw benötigt in der Regel so viel Länge wie der Container plus etwa 15 Meter zum Absetzen. Messen Sie im Zweifel nach oder rufen Sie uns an, unsere Beratung prüft mit Ihnen gemeinsam, ob die Zufahrt reicht, und schlägt bei Bedarf eine Kranentladung vor.",
      },
      {
        heading: "Kann ich als Firma bestellen und eine Rechnung mit Umsatzsteuerausweis erhalten?",
        body: "Ja. Tragen Sie im Bestellprozess Ihren Firmennamen in das Feld „Firma“ ein. Die Rechnung liegt der Bestellbestätigung als PDF bei und weist die enthaltene Umsatzsteuer aus. Benötigen Sie Ihre Umsatzsteuer-Identifikationsnummer auf der Rechnung, schreiben Sie sie bitte in das Anmerkungsfeld der Bestellung oder senden Sie sie uns nach; ein eigenes Feld dafür gibt es im Bestellprozess noch nicht. Bitte beachten Sie zwei Unterschiede zum Verbraucherkauf: Unternehmen haben kein gesetzliches Widerrufsrecht, und die Verjährungsfrist für Mängelansprüche beträgt bei neuen Waren ein Jahr ab Gefahrübergang statt zwei Jahre. Unser freiwilliges 30-tägiges Rückgaberecht gilt auch für Sie.",
      },
      {
        heading: "Was mache ich, wenn mein Container nach Ablauf der zwei Jahre einen Schaden hat?",
        body: "Melden Sie sich trotzdem bei uns. Häufig greift noch eine Herstellergarantie auf einzelne Bauteile, oder eine Reparatur vor Ort ist deutlich günstiger als ein Neukauf. Wir vermitteln Ihnen einen autorisierten Servicepartner und prüfen die Ersatzteilverfügbarkeit für Ihr Modell.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Über uns : pas d'avertissement juridique                            */
  /* ------------------------------------------------------------------ */
  "ueber-uns": {
    slug: "ueber-uns",
    title: "Über uns",
    intro:
      "BBC Best Box Containerhandel e.K. ist ein Fachhändler für See-, Lager-, Büro-, Sanitär- und Sondercontainer mit Sitz in Großensee. Wir verkaufen keine Container von der Stange, sondern beraten dazu, vom passenden Format bis zur richtigen Aufstelllösung.",
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Wer wir sind",
        body: `Als eingetragener Kaufmann seit ${COMPANY.registeredSince} handeln wir mit neuen und gebrauchten Containern für Lagerung, Büro, Sanitär und Sonderanwendungen. Der Name steht für das, was uns wichtig ist: ehrliche Beratung, faire Preise und ein Ansprechpartner, der auch nach dem Kauf noch da ist. Geführt wird das Unternehmen von ${COMPANY.owner}.`,
      },
      {
        heading: "Unser Sortiment",
        body: "Wir konzentrieren uns auf Container: Seecontainer in Standardgrößen, abschließbare Lagercontainer, ausgebaute Bürocontainer, Sanitärcontainer sowie individuelle Sonderanfertigungen. Statt eines endlosen Katalogs führen wir eine kuratierte Auswahl von Herstellern, die wir selbst kennen und deren Qualität und Serviceabwicklung funktioniert.",
      },
      {
        heading: "Beratung statt Bestellformular",
        body: `Ein Container, der nicht durch die Zufahrt passt, oder ein Format, das für den geplanten Zweck zu knapp bemessen ist, ärgert lange. Deshalb ist unsere Beratung montags bis freitags von 8 bis 18 Uhr unter ${COMPANY.phone} erreichbar. Wir fragen nach Zufahrt, Stellfläche, Untergrund und Nutzungszweck, und sagen auch, wenn das günstigere Modell für Ihren Fall das bessere ist.`,
      },
      {
        heading: "Service und Aufbau",
        body: "Unsere Servicepartner verbinden mehrteilige Container, stellen Türen und Rolltore ein und richten den Aufbau vor Ort aus. Bei einem Schaden schicken wir bevorzugt einen Techniker zu Ihnen, statt den Container quer durch Deutschland zu transportieren. Das ist schneller für Sie und schont die Ware.",
      },
      {
        heading: "Nachhaltigkeit und gebrauchte Container",
        body: "Container sind von Natur aus ein langlebiges, wiederverwendbares Produkt: Wir kaufen gebrauchte Container an, prüfen sie auf Dichtigkeit und Statik und bereiten sie für den Weiterverkauf auf, statt sie verschrotten zu lassen. Bei der Sortimentsauswahl achten wir auf Korrosionsschutz, Reparierbarkeit und Ersatzteilverfügbarkeit, Kriterien, die im Datenblatt selten stehen, im Alltag aber den Unterschied machen.",
      },
      {
        heading: "Standort und Logistik",
        body: "Unser Sitz ist Großensee, von dort steuern wir Einkauf, Kundenservice und Auftragsabwicklung. Der Versand erfolgt über spezialisierte Speditionen mit Absetzkipper oder Kranfahrzeug, damit auch ein mehrere Tonnen schwerer Container sicher an seinem Platz ankommt.",
      },
      {
        heading: "Arbeiten bei BBC Best Box Containerhandel e.K.",
        body: "Wir suchen regelmäßig Verstärkung in Beratung, Technik und Logistik. Wenn Sie Freude daran haben, Menschen wirklich weiterzuhelfen, statt nur Bestellungen abzuarbeiten, schreiben Sie uns an kontakt@bestboxcontainer.de, auch Initiativbewerbungen sind willkommen.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Kontakt : pas d'avertissement juridique                             */
  /* ------------------------------------------------------------------ */
  kontakt: {
    slug: "kontakt",
    title: "Kontakt",
    intro:
      "Ob Beratung vor dem Kauf, Frage zur Lieferung oder Reklamation: Wir sind montags bis freitags von 8 bis 18 Uhr für Sie da. Halten Sie bei Fragen zu einer Bestellung bitte Ihre Bestellnummer bereit, das beschleunigt alles.",
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Kundenservice",
        body: "Unser Team beantwortet Fragen zu Produkten, Verfügbarkeit, Lieferterminen und Zahlungen.",
        list: [
          `Telefon: ${COMPANY.phone}`,
          "Erreichbarkeit: Montag bis Freitag, 8 bis 18 Uhr",
          `E-Mail: ${COMPANY.email}`,
          "Antwortzeit per E-Mail: in der Regel innerhalb eines Werktages",
        ],
      },
      {
        heading: "Postanschrift",
        body: "Schriftliche Anliegen richten Sie bitte an:",
        list: [COMPANY.name, COMPANY.street, COMPANY.city, COMPANY.country],
      },
      {
        heading: "Retouren",
        body: "Bitte senden Sie Retouren nicht unangekündigt zurück, sondern melden Sie sie vorab an, so ordnen wir Ihre Sendung sofort zu.",
        list: [`Retourenannahme: ${RETURN_ADDRESS}`],
      },
      {
        heading: "Technischer Service und Aufbau",
        body: `Für Termine zum Aufbauservice oder einem Technikereinsatz erreichen Sie unsere Serviceplanung unter ${COMPANY.phone}. Halten Sie bitte Bestellnummer und Containernummer bereit; Letztere finden Sie auf dem CSC-Plate des Containers.`,
      },
      {
        heading: "Datenschutzanfragen",
        body: "Auskunft, Berichtigung oder Löschung Ihrer Daten beantragen Sie unter datenschutz@bestboxcontainer.de oder postalisch mit dem Zusatz „Datenschutzbeauftragter“. Wir antworten innerhalb der gesetzlichen Frist von einem Monat.",
      },
      {
        heading: "Presse und Kooperationen",
        body: `Presseanfragen sowie Anfragen zu Kooperationen und Partnerprogrammen richten Sie bitte an ${COMPANY.email} mit dem Betreff „Presse“ beziehungsweise „Kooperation“.`,
      },
      {
        heading: "Rechtliche Angaben",
        body: `${COMPANY.name}, vertreten durch den Inhaber ${COMPANY.owner}. Registergericht: ${COMPANY.register}. Umsatzsteuer-Identifikationsnummer: ${COMPANY.vatId}. Vollständige Angaben finden Sie im Impressum.`,
      },
    ],
  },
};
