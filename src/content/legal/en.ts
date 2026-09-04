/**
 * Contenu légal et informatif en ANGLAIS : BBC Best Box Containerhandel e.K.
 *
 * Traduction professionnelle du corpus allemand (de.ts), mêmes clés et même
 * structure de sections. Pour les pages juridiques, une mention indique que
 * seule la version allemande fait foi (langue contractuelle = allemand).
 *
 * Coordonnées d'entreprise réelles. Voir docs/LEGAL.md pour ce qui reste
 * à compléter avant mise en ligne (assurance, prestataires, hébergeur…).
 *
 * ElektroG / BattDG (électroménager et électronique) volontairement absents,
 * pour la même raison que dans de.ts : hors du champ d'activité de
 * BBC Best Box Containerhandel e.K.
 *
 * NOTE DE REBRANDING (2026-09) : voir de.ts, le corps rédactionnel de ces
 * pages a été réécrit pour décrire une activité de négoce de conteneurs.
 */

import type { LegalPageMap } from "./types";

/** Date de dernière révision rédactionnelle du corpus anglais. */
const UPDATED_AT = "2026-07-26";

/** Coordonnées de l'entreprise : À REMPLACER par les données réelles. */
const COMPANY = {
  name: "BBC Best Box Containerhandel e.K.",
  street: "Petersweg 11a",
  city: "22946 Großensee",
  country: "Germany",
  email: "kontakt@bestboxcontainer.de",
  phone: "+49 1525 9026450",
  owner: "Peer Kunz",
  registeredSince: "20 April 2006",
  register: "Amtsgericht Lübeck (Local Court of Lübeck), HRA 3471",
  vatId: "DE814218818",
  domain: "www.bestboxcontainer.de",
} as const;

/** Adresse de retour (identique au siège dans ce modèle). */
const RETURN_ADDRESS = `${COMPANY.name}, Returns Department, ${COMPANY.street}, ${COMPANY.city}, ${COMPANY.country}`;

/** Avertissement placé en tête de chaque page juridique. */
const DISCLAIMER =
  "Legal notice: This text is a carefully prepared template for the BBC Best Box Containerhandel e.K. online shop. All company details (address, commercial register, VAT identification number, shipping rates, service providers) are placeholders and must be replaced with the actual data before publication. Have the text reviewed by a qualified lawyer afterwards, only then is it fit for live use.";

/** Mention indiquant que la version allemande prévaut. */
const GERMAN_PREVAILS =
  "This English text is a convenience translation. The contractual language is German; in the event of any discrepancy, the German version of this page is the only legally binding one.";

/** Assemble le chapeau : avertissement, primauté de l'allemand, puis introduction. */
function intro(lead: string): string {
  return `${DISCLAIMER}\n\n${GERMAN_PREVAILS}\n\n${lead}`;
}

export const enLegalPages: LegalPageMap = {
  /* ------------------------------------------------------------------ */
  /* Impressum / Legal notice: § 5 DDG                                  */
  /* ------------------------------------------------------------------ */
  impressum: {
    slug: "impressum",
    title: "Legal Notice (Impressum)",
    intro: intro(
      "Provider identification pursuant to section 5 of the German Digital Services Act (Digitale-Dienste-Gesetz, DDG) and section 18(2) of the German Interstate Media Treaty (Medienstaatsvertrag, MStV) for the online shop of BBC Best Box Containerhandel e.K., trading shipping, storage, office and sanitary containers.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Service provider",
        body: "This online shop for shipping, storage, office and sanitary containers is operated by:",
        list: [COMPANY.name, COMPANY.street, COMPANY.city, COMPANY.country],
      },
      {
        heading: "Represented by",
        body: `Owner: ${COMPANY.owner}\n\nAs a registered sole trader (eingetragener Kaufmann, e.K.), the owner is personally and unlimitedly liable.`,
      },
      {
        heading: "Contact",
        body: "You can reach us quickly and directly through the following channels. Our customer service team is available Monday to Friday, 8 a.m. to 6 p.m. (CET).",
        list: [
          `Phone: ${COMPANY.phone}`,
          `Email: ${COMPANY.email}`,
          `Contact form: ${COMPANY.domain}/kontakt`,
        ],
      },
      {
        heading: "Commercial register",
        body: `Entered in the German commercial register since ${COMPANY.registeredSince}.\nRegistering court and register number: ${COMPANY.register}`,
      },
      {
        heading: "VAT identification number",
        body: `VAT identification number pursuant to section 27a of the German VAT Act (Umsatzsteuergesetz): ${COMPANY.vatId}`,
      },
      {
        heading: "Responsible for editorial content",
        body: `Responsible pursuant to section 18(2) MStV:\n${COMPANY.owner}, address as above.`,
      },
      {
        heading: "Business liability insurance",
        body: "Details of our business and product liability insurance (voluntary disclosure; mandatory for service providers under section 2 of the German Service Information Obligations Ordinance):",
        list: [
          "Insurer: name of the insurance company (placeholder)",
          "Address of the insurer (placeholder)",
          "Geographical scope: Federal Republic of Germany (placeholder)",
        ],
      },
      {
        heading: "Consumer dispute resolution",
        body:
          "Notice pursuant to section 36 of the German Consumer Dispute Resolution Act (Verbraucherstreitbeilegungsgesetz, VSBG): We are neither willing nor obliged to participate in dispute resolution proceedings before a consumer arbitration board. If you are dissatisfied with our service, please contact our customer service team first, we resolve almost every issue directly.\n\n" +
          "The competent consumer arbitration board would be: Universalschlichtungsstelle des Bundes, Zentrum für Schlichtung e. V., Straßburger Straße 8, 77694 Kehl am Rhein, Germany, www.verbraucher-schlichter.de.\n\n" +
          "The European Commission's Online Dispute Resolution (ODR) platform was permanently shut down on 20 July 2025. Linking to that platform is no longer permitted, which is why we deliberately do not provide such a link.",
      },
      {
        heading: "Liability for content",
        body: "As a service provider, we are responsible for our own content on these pages under general law in accordance with section 7(1) DDG. Under sections 8 to 10 DDG, however, we are not obliged to monitor transmitted or stored third-party information or to investigate circumstances that indicate unlawful activity. Obligations to remove or block the use of information under general law remain unaffected. Liability in this respect is only possible from the point in time at which we become aware of a specific infringement. Upon becoming aware of such infringements, we will remove the content in question immediately.",
      },
      {
        heading: "Liability for links",
        body: "Our website contains links to external third-party websites over whose content we have no influence. We therefore cannot accept any liability for such third-party content. The respective provider or operator of the linked pages is always responsible for their content. The linked pages were checked for possible legal violations at the time of linking; no unlawful content was identifiable at that time. Permanent monitoring of the content of linked pages is not reasonable without concrete indications of an infringement. Upon becoming aware of legal violations, we will remove such links immediately.",
      },
      {
        heading: "Copyright",
        body: "The content and works created by the site operators on these pages are subject to German copyright law. Reproduction, editing, distribution and any form of exploitation beyond the limits of copyright require the written consent of the respective author or creator. Downloads and copies of this site are permitted for private, non-commercial use only.",
      },
      {
        heading: "Image credits",
        body: "The container photos on this website come from Wikimedia Commons and are freely licensed:",
        list: [
          "Igor Ovsyannykov: \"Shipping containers in a port\", CC0 (no attribution required)",
          "AgainErick: \"Shipping container stacks, Port of Rotterdam\", CC BY-SA 4.0",
          "Carsten Steger: \"Aerial image of the Eurogate and Burchardkai container terminals\" (Hamburg), CC BY-SA 4.0",
          "Immanuel Giel: \"Container architecture in Germany 01\", CC BY-SA 4.0",
          "Immanuel Giel: \"Container architecture in Germany 02\", CC BY-SA 4.0",
          "Immanuel Giel: \"Container architecture in Germany 03\", CC0 (no attribution required)",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Terms and conditions                                                */
  /* ------------------------------------------------------------------ */
  agb: {
    slug: "agb",
    title: "General Terms and Conditions",
    intro: intro(
      "These General Terms and Conditions (GTC) apply to all orders placed by consumers and businesses through the BBC Best Box Containerhandel e.K. online shop. Last updated: 26 July 2026.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Section 1 Scope and provider",
        body:
          `These General Terms and Conditions apply, in the version valid at the time of the order, to all orders placed through our online shop. Your contracting party is ${COMPANY.name}, ${COMPANY.street}, ${COMPANY.city}, ${COMPANY.country}.\n\n` +
          "A consumer is any natural person who enters into a legal transaction for purposes that are predominantly outside their trade, business or profession (section 13 of the German Civil Code, BGB). A business is a natural or legal person or a partnership with legal capacity that, when entering into the contract, acts in the exercise of its trade, business or profession (section 14 BGB).\n\n" +
          "We do not accept any deviating terms and conditions of the customer unless we have expressly agreed to their validity in text form.",
      },
      {
        heading: "Section 2 Conclusion of contract",
        body:
          "The presentation of products in the online shop does not constitute a legally binding offer but a non-binding invitation to place an order.\n\n" +
          "By clicking the \"Place binding order\" button you submit a binding offer to purchase the items in your shopping basket. Immediately after submitting your order you will receive an automated acknowledgement of receipt by email. This acknowledgement merely documents that we have received your order and does not yet constitute acceptance of your offer.\n\n" +
          "The purchase contract is concluded as soon as we accept your order by way of a separate order confirmation sent by email, dispatch the goods or, in the case of advance payment, send you the payment request. If we do not accept your order within five working days, it is deemed to have been rejected and any payments already made will be refunded without delay.\n\n" +
          "Orders involving freight forwarder delivery, installation services or custom-made items are always confirmed separately because a delivery date has to be arranged.",
      },
      {
        heading: "Section 3 Correcting input errors, contract language and storage of the contract text",
        body:
          "Before submitting your binding order you can correct your entries at any time using the usual keyboard and mouse functions. In addition, all entries are displayed once more in a confirmation window before the order is placed and can also be corrected there.\n\n" +
          "The contract language is German only. English versions of these terms are provided for information purposes; in the event of a dispute, the German version prevails.\n\n" +
          "We store the contract text and send you the order details together with these GTC by email. For security reasons the contract text is no longer accessible via the internet after the order has been completed; if you have a customer account, you can continue to view your orders there.",
      },
      {
        heading: "Section 4 Prices and shipping costs",
        body:
          "All prices stated are final prices in euros and include statutory VAT. They are exclusive of shipping costs unless stated otherwise on the product page.\n\n" +
          "Standard delivery within Germany is free of charge, with no minimum order value. If you would like faster delivery, express shipping costs a flat 199.00 euros. Separate charges apply to optional additional services such as connection, installation or delivery to the installation location; you arrange these with our customer service team before or after placing your order. Shipping costs are shown in the shopping basket before you complete your order. Full details can be found on our \"Shipping & delivery\" page.\n\n" +
          "For goods sold by weight, volume, length or area we also state the unit price in accordance with the German Price Indication Ordinance (Preisangabenverordnung). Where prices are reduced, we state the lowest total price we applied during the 30 days preceding the reduction.",
      },
      {
        heading: "Section 5 Delivery and delivery times",
        body:
          "We deliver throughout Germany; on request we also deliver to other member states of the European Union. Delivery to parcel lockers is possible for parcel shipments only; containers are delivered exclusively by freight forwarder to a street address.\n\n" +
          "Items in stock are usually delivered by standard shipping within 7 to 10 working days of the conclusion of the contract, or from the date of receipt of payment in the case of advance payment; express shipping delivers within a maximum of 5 working days for the surcharge shown in your order. For items marked \"On request\" (made to order) we state the expected delivery time on the product page; it is typically around three weeks.\n\n" +
          "If an item is unavailable because our supplier failed to deliver to us despite a corresponding contractual obligation (congruent hedging transaction), we may withdraw from the contract. We will inform you without delay and immediately refund any payments already made. Your statutory rights remain unaffected.\n\n" +
          "Partial deliveries are permitted where reasonable for you. You will not incur any additional shipping costs as a result.",
      },
      {
        heading: "Section 6 Payment terms",
        body:
          "We offer advance payment by bank transfer, Sofortüberweisung, PayPal, credit card and SEPA direct debit. The payment methods available in each individual case are shown during the order process; we reserve the right to exclude individual payment methods.\n\n" +
          "For advance payment you receive our bank details with the order confirmation; the order number serves as the payment reference. We reserve the goods for seven calendar days and dispatch them once payment has arrived. If payment does not reach us within that period, we cancel the order.\n\n" +
          "For SEPA direct debit you grant us a SEPA direct debit mandate. We will notify you of the debit at least one banking day in advance (shortened pre-notification period). Where you are responsible for a returned direct debit, we may charge you the bank fees actually incurred.\n\n" +
          "We do not charge any additional fee for the use of common SEPA payment methods or payment cards (section 270a BGB). If you default on payment, the statutory provisions apply; consumers owe default interest of five percentage points above the base rate.",
      },
      {
        heading: "Section 7 Retention of title",
        body:
          "The goods delivered remain our property until payment has been made in full.\n\n" +
          "Vis-à-vis business customers, we retain title until all claims arising from an ongoing business relationship have been settled in full. The business customer is entitled to resell the goods in the ordinary course of business; all resulting claims are hereby assigned to us in advance.",
      },
      {
        heading: "Section 8 Right of withdrawal",
        body:
          "Consumers have a statutory right of withdrawal of 14 days. The full withdrawal instructions, the online withdrawal function pursuant to section 356a BGB and the model withdrawal form can be found on our \"Right of withdrawal\" page; both are also included in our order confirmation.\n\n" +
          "In addition to the statutory right of withdrawal, we voluntarily grant you a contractual right of return of 30 days from receipt of the goods. This contractual right requires the goods to be complete, undamaged and in resaleable condition. Your statutory rights, in particular the 14-day right of withdrawal and your rights in respect of defects, are not restricted by this.",
      },
      {
        heading: "Section 9 Liability for defects (statutory warranty)",
        body:
          "The statutory law on liability for defects applies. For new goods, consumers' claims for defects become time-barred two years after delivery of the goods. If a defect becomes apparent within one year of delivery, it is presumed that the goods were already defective at the time of handover.\n\n" +
          "Vis-à-vis business customers, claims for defects in new goods become time-barred one year after the transfer of risk. Statutory provisions on supplier recourse remain unaffected.\n\n" +
          "Please report defects to our customer service team, ideally with photos of the damage, before taking any further steps. In many cases we can assess the cause in advance and, if necessary, arrange an on-site inspection or a repair through our installation service.",
      },
      {
        heading: "Section 10 Manufacturer guarantees",
        body: "In addition to the statutory liability for defects, some manufacturers grant their own guarantees, for example on the anti-corrosion coating, weld seam tightness or the mechanism of roll-up doors and doors. These guarantees are voluntary additional services provided by the respective manufacturer and do not affect your statutory rights. The exact guarantee conditions can be found in the container documentation and, where available, on the relevant product page.",
      },
      {
        heading: "Section 11 Transport damage",
        body:
          "If goods are delivered with obvious transport damage, please report this to the carrier as soon as possible and contact us. In the case of freight forwarder deliveries, please have the damage noted on the delivery receipt.\n\n" +
          "Failure to make such a complaint or to contact us has no consequences whatsoever for your statutory rights or their enforcement, in particular your rights in respect of defects. However, it helps us to assert our own claims against the carrier.",
      },
      {
        heading: "Section 12 Set-off and right of retention",
        body: "You are only entitled to set-off if your counterclaims have been legally established, are undisputed or have been acknowledged by us. You may only exercise a right of retention if the claims arise from the same contractual relationship.",
      },
      {
        heading: "Section 13 Liability",
        body:
          "We are liable without limitation in accordance with statutory provisions for damage arising from injury to life, body or health as well as in cases of intent and gross negligence. The same applies in the event of fraudulent concealment of a defect, the assumption of a guarantee and within the scope of the German Product Liability Act.\n\n" +
          "In cases of ordinary negligence we are liable only for breach of a material contractual obligation, that is an obligation the fulfilment of which is essential for the proper performance of the contract and on the observance of which you may regularly rely. In such cases liability is limited to the foreseeable damage typical for this type of contract. Any further liability is excluded.",
      },
      {
        heading: "Section 14 Dispute resolution",
        body:
          "We are neither willing nor obliged to participate in dispute resolution proceedings before a consumer arbitration board within the meaning of the German Consumer Dispute Resolution Act.\n\n" +
          "The European Commission's Online Dispute Resolution platform was discontinued on 20 July 2025 and is no longer available. Please address any complaints directly to our customer service team.",
      },
      {
        heading: "Section 15 Applicable law, place of jurisdiction and final provisions",
        body:
          "German law applies, excluding the UN Convention on Contracts for the International Sale of Goods. In relation to consumers, this choice of law applies only insofar as it does not deprive the consumer of the protection afforded by mandatory provisions of the law of the country in which the consumer has their habitual residence.\n\n" +
          "If the customer is a merchant, a legal entity under public law or a special fund under public law, the exclusive place of jurisdiction for all disputes arising from this contract is our registered office in Großensee.\n\n" +
          "Should any provision of these GTC be or become invalid, the validity of the remaining provisions shall remain unaffected.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Privacy policy: GDPR / TDDDG                                       */
  /* ------------------------------------------------------------------ */
  datenschutz: {
    slug: "datenschutz",
    title: "Privacy Policy",
    intro: intro(
      "Thank you for your interest in our online shop. Protecting your personal data matters to us. Below we inform you in accordance with Articles 13 and 14 of the General Data Protection Regulation (GDPR) about the data we process, the purposes for which we process it and the rights available to you.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "1. Controller and contact details",
        body: "The controller within the meaning of the GDPR is:",
        list: [
          COMPANY.name,
          `${COMPANY.street}, ${COMPANY.city}, ${COMPANY.country}`,
          `Phone: ${COMPANY.phone}`,
          `Email: ${COMPANY.email}`,
          `Represented by: ${COMPANY.owner}`,
        ],
      },
      {
        heading: "2. Data protection officer",
        body: "You can contact our data protection officer at datenschutz@bestboxcontainer.de or by post at the address above, marked \"Datenschutzbeauftragter\". Whether an appointment is mandatory depends on section 38 of the German Federal Data Protection Act and must be verified before publication.",
      },
      {
        heading: "3. Legal bases for processing",
        body: "We process personal data only on one of the following legal bases:",
        list: [
          "Article 6(1)(a) GDPR: your consent, for example for newsletters or non-essential cookies",
          "Article 6(1)(b) GDPR: performance of the purchase contract or pre-contractual measures",
          "Article 6(1)(c) GDPR: compliance with legal obligations, in particular commercial and tax retention requirements",
          "Article 6(1)(f) GDPR: our legitimate interests, such as fraud prevention, IT security and improving our services",
        ],
      },
      {
        heading: "4. Hosting and server log files",
        body:
          "Our online shop is hosted by a service provider located within the European Union (the hosting provider's name and address must be inserted before publication). We have concluded a data processing agreement with the host in accordance with Article 28 GDPR.\n\n" +
          "When you access our pages, the server automatically collects information transmitted by your browser: IP address, date and time of access, page requested, volume of data transferred, referrer URL and browser and operating system type. This data cannot be attributed to specific individuals by us and is used to deliver the pages, ensure system security and analyse faults. The legal basis is Article 6(1)(f) GDPR. Log files are deleted or anonymised after seven days at the latest.",
      },
      {
        heading: "5. Order processing and customer accounts",
        body:
          "To process your order we handle your form of address, first and last name, billing and delivery address, email address, telephone number where applicable, and your order and payment data. Without this information the contract cannot be concluded or performed. The legal basis is Article 6(1)(b) GDPR.\n\n" +
          "If you create a customer account, we store your access credentials and order history so that you can complete future orders more conveniently. You may have your customer account deleted at any time; statutory retention obligations remain unaffected.",
      },
      {
        heading: "6. Payment service providers",
        body:
          "Depending on the payment method you select, we pass on the data required for payment processing to the relevant payment service provider (the names and addresses of the providers used must be added before publication, for example for PayPal, card acquiring and purchase on account).\n\n" +
          "The payment service providers process this data under their own responsibility. The legal basis for the transfer is Article 6(1)(b) GDPR. Credit card and bank details are collected exclusively by the respective provider; we do not store complete payment data.",
      },
      {
        heading: "7. No credit checks",
        body: "We offer neither purchase on account nor payment in instalments. We therefore do not obtain credit reports from credit reference agencies, and we pass your data to no one for that purpose. Should we offer such a payment method in future, we will first extend this notice to name the agency, the legal basis and your right to object.",
      },
      {
        heading: "8. Shipping and installation services",
        body: "For delivery purposes we pass on your name, delivery address and, for scheduling freight forwarder deliveries and connection or installation services, your telephone number or email address to the logistics or service partner engaged. The legal basis is Article 6(1)(b) GDPR.",
      },
      {
        heading: "9. Customer reviews",
        body: "If you submit a product review, we process the name or pseudonym you provide, the review text, the star rating and the time of submission. Reviews are checked before publication. The legal basis is Article 6(1)(a) and (f) GDPR. You may request the deletion of your review at any time.",
      },
      {
        heading: "10. Newsletter",
        body:
          "We use the double opt-in procedure for our newsletter: after you sign up, we send you an email containing a confirmation link. Only after you confirm do we add you to the mailing list. We store the IP address and time of registration and confirmation in order to document the process.\n\n" +
          "The legal basis is your consent under Article 6(1)(a) GDPR. You may unsubscribe at any time using the link in every email or by contacting us. Where the statutory requirements of section 7(3) of the German Act Against Unfair Competition are met, we may also send existing customers advertising for similar goods without separate consent; you may object to this at any time as well.",
      },
      {
        heading: "11. Shopping cart reminders",
        body:
          "If you enter your email address during checkout but do not complete the order, we store your email address, the selected items, the amounts and the time you left.\n\n" +
          "We use this data to send you up to three reminders about your shopping cart within about a day and a half, and to help you if something went wrong during checkout. The last reminder may include a discount code. The legal basis is our legitimate interest in recovering abandoned checkouts (Art. 6(1)(f) GDPR).\n\n" +
          "You may object at any time. Every message contains an unsubscribe link at the bottom. Once you unsubscribe, you will receive neither further reminders nor offers from us. The stored data is deleted automatically no later than 30 days after the checkout was abandoned, unless an order is placed.",
      },
      {
        heading: "12. Contacting us and customer service",
        body: "If you contact us by email, telephone or contact form, we process your details in order to handle your enquiry. The legal basis is Article 6(1)(b) GDPR where the enquiry relates to a contract, otherwise Article 6(1)(f) GDPR. We delete enquiries once they have been dealt with conclusively and no retention obligations apply.",
      },
      {
        heading: "13. Cookies and consent management",
        body:
          "We use cookies and comparable technologies. Technically necessary cookies, for the shopping basket, session management and security, for example, are used on the basis of section 25(2) of the German Telecommunications Digital Services Data Protection Act (TDDDG) without consent; the associated data processing is based on Article 6(1)(f) GDPR.\n\n" +
          "We load two services only after you consent via the banner: our live chat (Smartsupp s.r.o., Czech Republic), which stores a visitor ID on your device, and the map on the contact page (Google Ireland Limited, Ireland; processing may also involve the parent company Google LLC, USA), which transmits your IP address to Google when it loads. In both cases the legal basis is your consent under Article 6(1)(a) GDPR and section 25(1) TDDDG. Without consent, chat and map stay disabled; the contact page then offers a plain link that opens Google Maps in a new tab without first connecting to Google. You can withdraw your consent at any time via the \"Cookie settings\" link in the site footer.\n\n" +
          "You can also delete or block cookies in your browser. Some shop functions may then no longer be fully available.",
      },
      {
        heading: "14. Web analytics and marketing",
        body: "Where we use web analytics, retargeting or conversion tracking services, we do so exclusively on the basis of your consent. The specific services used, their providers, the data processed, the storage period and any third-country transfers must be listed in full at this point before publication.",
      },
      {
        heading: "15. Recipients and transfers to third countries",
        body: "Recipients of your data are exclusively service providers we have selected with care and who act for us as processors under Article 28 GDPR, as well as bodies to which we are legally required to transfer data (such as tax authorities). A transfer to countries outside the EU and the EEA only takes place if you consent to the map on the contact page: Google LLC, based in the USA, may then receive your IP address, based on the European Commission's standard contractual clauses under Article 46 GDPR. Without this consent, no such transfer takes place; should another one become necessary in future, it will only happen on the basis of an adequacy decision of the European Commission or appropriate safeguards within the meaning of Articles 44 et seq. GDPR.",
      },
      {
        heading: "16. Retention periods",
        body: "We store personal data only for as long as is necessary for the relevant purposes. Contract and invoice data are subject to commercial and tax retention periods of six and ten years respectively (section 257 of the German Commercial Code, section 147 of the German Fiscal Code). We delete the data once these periods have expired.",
      },
      {
        heading: "17. Your rights as a data subject",
        body: "You have the following rights in relation to us:",
        list: [
          "Right of access to the data stored about you (Article 15 GDPR)",
          "Right to rectification of inaccurate data and completion of incomplete data (Article 16 GDPR)",
          "Right to erasure, provided no retention obligations apply (Article 17 GDPR)",
          "Right to restriction of processing (Article 18 GDPR)",
          "Right to data portability in a structured, commonly used and machine-readable format (Article 20 GDPR)",
          "Right to withdraw consent with effect for the future (Article 7(3) GDPR)",
          "Right to lodge a complaint with a supervisory authority (Article 77 GDPR)",
        ],
      },
      {
        heading: "18. Right to object under Article 21 GDPR",
        body:
          "You have the right to object at any time, on grounds relating to your particular situation, to the processing of personal data concerning you which is carried out on the basis of Article 6(1)(f) GDPR. We will then no longer process the data unless we can demonstrate compelling legitimate grounds that override your interests, rights and freedoms, or unless the processing serves to establish, exercise or defend legal claims.\n\n" +
          "If you object to processing for direct marketing purposes, we will no longer process your data for those purposes. No particular form is required for the objection; it may be sent to " +
          COMPANY.email +
          ".",
      },
      {
        heading: "19. Competent supervisory authority",
        body: "The authority responsible for us is the Independent Centre for Data Protection Schleswig-Holstein (Unabhängiges Landeszentrum für Datenschutz Schleswig-Holstein, ULD), Holstenstraße 98, 24103 Kiel, Germany.",
      },
      {
        heading: "20. Data security and automated decision-making",
        body:
          "We secure the transmission of your data using TLS encryption (recognisable by the padlock symbol in your browser's address bar) and implement technical and organisational measures in accordance with Article 32 GDPR.\n\n" +
          "Automated decision-making including profiling within the meaning of Article 22 GDPR does not take place, with the exception of the credit check described above, which is subject to manual review.",
      },
      {
        heading: "21. Changes to this privacy policy",
        body: "We update this privacy policy when the legal situation, our services or our data processing change. The version published on this page applies. Last updated: 26 July 2026.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Right of withdrawal                                                 */
  /* ------------------------------------------------------------------ */
  widerruf: {
    slug: "widerruf",
    title: "Right of Withdrawal and Model Withdrawal Form",
    intro: intro(
      "Consumers have a 14-day right of withdrawal. The instructions below follow the statutory model set out in Annex 1 to Article 246a section 1(2) sentence 2 of the Introductory Act to the German Civil Code (EGBGB), as amended with effect from 19 June 2026.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Withdrawal instructions, right of withdrawal",
        body:
          "You have the right to withdraw from this contract within fourteen days without giving any reason.\n\n" +
          "The withdrawal period will expire after fourteen days from the day on which you acquire, or a third party other than the carrier and indicated by you acquires, physical possession of the goods.\n\n" +
          `To exercise the right of withdrawal, you must inform us (${COMPANY.name}, ${COMPANY.street}, ${COMPANY.city}, ${COMPANY.country}, phone ${COMPANY.phone}, email ${COMPANY.email}) of your decision to withdraw from this contract by an unequivocal statement (for example a letter sent by post or an email). You may use the attached model withdrawal form, but it is not obligatory.\n\n` +
          "We will send you an acknowledgement of receipt of your withdrawal declaration by email without undue delay, stating the date and time of its receipt.\n\n" +
          "To meet the withdrawal deadline, it is sufficient for you to send your communication concerning your exercise of the right of withdrawal before the withdrawal period has expired.",
      },
      {
        heading: "Withdrawal instructions, effects of withdrawal",
        body:
          "If you withdraw from this contract, we shall reimburse to you all payments received from you, including the costs of delivery (with the exception of the supplementary costs resulting from your choice of a type of delivery other than the least expensive type of standard delivery offered by us), without undue delay and in any event not later than fourteen days from the day on which we are informed about your decision to withdraw from this contract. We will carry out such reimbursement using the same means of payment as you used for the initial transaction, unless you have expressly agreed otherwise; in any event, you will not incur any fees as a result of such reimbursement.\n\n" +
          "We may withhold reimbursement until we have received the goods back or you have supplied evidence of having sent back the goods, whichever is the earliest.\n\n" +
          `You shall send back the goods or hand them over to us at ${RETURN_ADDRESS} without undue delay and in any event not later than fourteen days from the day on which you communicate your withdrawal from this contract to us. The deadline is met if you send back the goods before the period of fourteen days has expired.\n\n` +
          "We will bear the cost of returning the goods.\n\n" +
          "You are only liable for any diminished value of the goods resulting from the handling other than what is necessary to establish the nature, characteristics and functioning of the goods.\n\n" +
          "End of withdrawal instructions",
      },
      {
        heading: "Start of the period for multiple goods and partial deliveries",
        body:
          "If your order comprises several goods ordered in one order and delivered separately, the withdrawal period expires fourteen days from the day on which you acquire, or a third party other than the carrier and indicated by you acquires, physical possession of the last item.\n\n" +
          "If goods are delivered in several lots or pieces, for example a multi-part, assembled container, the period runs from the day on which you acquire, or a third party other than the carrier and indicated by you acquires, physical possession of the last lot or piece.",
      },
      {
        heading: "Withdrawal in text form",
        body:
          "An unequivocal statement in text form is all that is needed. The quickest route is an email to " +
          `${COMPANY.email}: State your name, your order number and the item you wish to return. A letter to the address given in our legal notice, or a call to ${COMPANY.phone}, works just as well.\n\n` +
          "You may use the model withdrawal form reproduced below, but it is not obligatory.\n\n" +
          "We will send you an acknowledgement of receipt by email without undue delay, stating the date and time of receipt.",
      },
      {
        heading: "Model withdrawal form",
        body:
          "(Complete and return this form only if you wish to withdraw from the contract.)\n\n" +
          `To ${COMPANY.name}, ${COMPANY.street}, ${COMPANY.city}, ${COMPANY.country}, email: ${COMPANY.email}:`,
        list: [
          "I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract of sale of the following goods (*) / for the provision of the following service (*)",
          "Ordered on (*) / received on (*)",
          "Name of consumer(s)",
          "Address of consumer(s)",
          "Signature of consumer(s) (only if this form is notified on paper)",
          "Date",
          "(*) Delete as appropriate.",
        ],
      },
      {
        heading: "Exclusion and early expiry of the right of withdrawal",
        body: "Pursuant to section 312g(2) BGB, the right of withdrawal does not apply, among others, to the following contracts:",
        list: [
          "goods that are not prefabricated and for the manufacture of which an individual choice or decision by you is decisive, or goods that are clearly tailored to your personal requirements (for example containers custom-cut for doors and windows, custom paint finish, or a custom interior fit-out)",
          "goods which, after delivery, are inseparably mixed with other items due to their nature",
        ],
      },
      {
        heading: "Voluntary 30-day return policy",
        body: "In addition to the statutory right of withdrawal, we grant you a contractual right of return of 30 days from receipt of the goods. It applies to unused, complete and resaleable items and does not affect your statutory rights. Details can be found on our \"Returns & complaints\" page.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Shipping and delivery                                               */
  /* ------------------------------------------------------------------ */
  versand: {
    slug: "versand",
    title: "Shipping and Delivery",
    intro: intro(
      "Here you will find everything about shipping costs, delivery times, freight forwarder delivery and our on-site installation service.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Shipping costs at a glance",
        body: "All prices include statutory VAT. The shipping costs applicable to your order are shown in the shopping basket before you complete your purchase.",
        list: [
          "Standard delivery within Germany: free of charge, with no minimum order value",
          "Express delivery within Germany: 199.00 euros",
          "Additional services such as delivery to the installation location, connection or installation: by arrangement, see below",
        ],
      },
      {
        heading: "Delivery times",
        body:
          "Items in stock reach you within 7 to 10 working days with standard delivery, or within a maximum of 5 working days with express delivery. Working days are Monday to Saturday, excluding public holidays at the location of our warehouse.\n\n" +
          "For advance payment, the delivery period begins on the day after the payment order is issued; for all other payment methods, on the day after the contract is concluded.\n\n" +
          "Items marked \"On request\" are made-to-order containers, built specifically for you. Delivery in these cases usually takes around three weeks; the specific lead time is stated on the product page.",
      },
      {
        heading: "Delivery area",
        body: "We deliver throughout Germany, including the North Sea and Baltic Sea islands. On request we also deliver to other member states of the European Union; please arrange costs and delivery time with our customer service team in advance. Parcels can be sent to a parcel locker on request; freight forwarder deliveries require a street address and a contactable telephone number.",
      },
      {
        heading: "Freight forwarder delivery of containers",
        body:
          "Containers are delivered by hook-lift freight service (roll-off truck) or, depending on access and size, by crane vehicle. The carrier contacts you in advance by telephone or SMS to agree a delivery window.\n\n" +
          "By default, we set the container down at the freely accessible site you specify. We clarify access, ground conditions and any lifting equipment needed with you in advance: please check that the access route is suitable for a roll-off truck (typically up to 12 m long) and that the ground is level and load-bearing.",
        list: [
          "Setting down at the agreed site: included in the freight delivery charge",
          "Crane unloading for restricted access or special positioning: quotation after site survey, on request",
          "Levelling and underpinning the container: 29.00 euros, on request",
        ],
      },
      {
        heading: "On-site installation service",
        body:
          "On request, our service partners will join multi-part containers, adjust doors and roll-up doors, and check the seals after set-up. You do not book this service in the basket but by telephone or email, ideally before ordering, so that we can schedule it together with the delivery.\n\n" +
          "This requires level, load-bearing and freely accessible ground. Electrical and plumbing connections to on-site utilities may only be carried out by licensed trade partners, which we can arrange on request.",
        list: [
          "Joining and levelling assemblable containers (e.g. 2 × 4 × 2 m into 8 × 2 m): 89.00 euros",
          "Adjusting doors, roll-up doors and locks: 49.00 euros",
          "Referral to a trade partner for electrical or plumbing connection: quotation after site survey",
        ],
      },
      {
        heading: "Partial deliveries",
        body: "If you order several items with different availability, we normally dispatch items in stock immediately and deliver the rest later. You will not incur any additional shipping costs. For the start of the withdrawal period, receipt of the last item is decisive.",
      },
      {
        heading: "Where is my order?",
        body: "You can check the status of your order at any time using the link in your order confirmation, and in your customer account under \"My orders\". As soon as the goods leave our warehouse we set the status to \"dispatched\". We send you the consignment number, and, for freight forwarder deliveries, the contact details for scheduling, by email as soon as we have them.",
      },
      {
        heading: "Transport damage",
        body: "Please inspect the shipment on delivery where possible. Report visible damage to the carrier and, in the case of freight deliveries, have it noted on the delivery receipt. Then contact our customer service team, we will arrange a replacement or repair. Your statutory rights in respect of defects remain unaffected in all cases.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Payment methods                                                     */
  /* ------------------------------------------------------------------ */
  zahlungsarten: {
    slug: "zahlungsarten",
    title: "Payment Methods",
    intro: intro(
      "Pay by advance bank transfer, by Sofortüberweisung, with PayPal, by credit card or by SEPA direct debit. The methods available in each case are shown during the order process.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Advance payment by bank transfer",
        body:
          "With the order confirmation you receive our bank details and the order number, which serves as the payment reference. The same details appear on the invoice attached to the confirmation as a PDF.\n\n" +
          "We reserve the goods for seven calendar days. Once payment has arrived we agree a delivery date with you straight away. If payment does not reach us within the reservation period, we cancel the order and let you know.",
      },
      {
        heading: "Sofortüberweisung",
        body: "At the end of the order process you are redirected to your bank's online banking, where you authorise the transfer directly. We receive confirmation immediately and can start dispatch straight away, you do not need an account with a separate payment service.",
      },
      {
        heading: "PayPal",
        body: "At the end of the order process you are redirected to PayPal, where you confirm the payment using your login details. The amount is debited immediately after the contract is concluded. A PayPal account is required; PayPal's terms of use apply in addition.",
      },
      {
        heading: "Credit card",
        body: "We accept Visa, Mastercard and American Express. Your card is charged when the goods are dispatched, or proportionately in the case of partial deliveries. For security we use your bank's 3-D Secure procedure; your card details are transmitted to our payment service provider in encrypted form only and are not stored by us.",
      },
      {
        heading: "SEPA direct debit",
        body:
          "You grant us a SEPA direct debit mandate during the order process. We collect the invoice amount from your account no earlier than the dispatch of the goods.\n\n" +
          "We notify you of the debit at least one banking day in advance (shortened pre-notification period). Please ensure your account has sufficient funds: where you are responsible for a returned direct debit, we will invoice the bank charges actually incurred.",
      },
      {
        heading: "No additional charges",
        body: "We do not charge any additional fee for the use of common SEPA payment methods or common payment cards (section 270a BGB). The total shown in your shopping basket is the amount you actually pay.",
      },
      {
        heading: "Security of your payment data",
        body: "All payment transactions run over a TLS-encrypted connection. Credit card and bank details are processed exclusively by the respective payment service providers, which comply with the PCI DSS security standard. Details of the data processing can be found in our privacy policy.",
      },
      {
        heading: "Late payment",
        body: "If you default on a payment, the statutory provisions apply. Consumers owe default interest of five percentage points above the base rate. Before taking any further steps we will always send you a payment reminder first.",
      },
      {
        heading: "Refunds",
        body: "Refunds are generally made using the original payment method. For advance payment, Sofortüberweisung and SEPA direct debit we transfer the amount to the account from which payment was made. You incur no costs in doing so.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Returns and complaints                                              */
  /* ------------------------------------------------------------------ */
  retoure: {
    slug: "retoure",
    title: "Returns and Complaints",
    intro: intro(
      "Something doesn't fit or doesn't work as expected? This page explains step by step how to return an item and how to report a defect. The legally binding provisions can be found in our withdrawal instructions and our General Terms and Conditions.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Two ways to send something back",
        body:
          "Statutory right of withdrawal: 14 days from receipt of the goods, without giving any reason. The binding instructions can be found on our \"Right of withdrawal\" page.\n\n" +
          "Voluntary right of return: in addition we grant 30 days from receipt of the goods. The item must be unused, complete and resaleable. This additional right does not restrict your statutory rights.",
      },
      {
        heading: "How to register a return",
        body: "Please register your return in advance, that way we can allocate your parcel immediately and refund you faster.",
        list: [
          `Email to ${COMPANY.email} stating your order number and the item description`,
          "The model withdrawal form from our \"Right of withdrawal\" page, completed and sent by email or post, it is not obligatory",
          `Phone: ${COMPANY.phone}, Monday to Friday, 8 a.m. to 6 p.m.`,
        ],
      },
      {
        heading: "Return shipping costs",
        body:
          "We bear the cost of returning the goods. For parcel shipments we provide a free return label.\n\n" +
          "Containers delivered by freight forwarder are collected from you. Please arrange an appointment with our customer service team.",
      },
      {
        heading: "Accessories and condition",
        body: "Please enclose all accessories supplied, such as keys, locking bolts and documentation. If parts are missing, we can only refund part of the value.",
      },
      {
        heading: "Inspecting the goods and diminished value",
        body: "You may examine the goods just as you would be able to at the dealer's premises, that is, inspect them, open them and test doors and roll-up doors. For any diminished value that goes beyond such inspection (for example drilling, welding or other structural alterations to the container), we may claim compensation.",
      },
      {
        heading: "Refunds",
        body: "We refund the purchase price including standard outbound shipping costs without undue delay and no later than 14 days after receiving your withdrawal declaration. We may withhold the refund until we have received the goods back or you provide proof of dispatch. The refund is made using the original payment method; you will not incur any fees.",
      },
      {
        heading: "Reporting a defect",
        body:
          "New containers are covered by the statutory liability for defects for two years from delivery. If a defect becomes apparent within the first twelve months, it is presumed to have existed at the time of handover, so you do not have to prove anything.\n\n" +
          "Please report the defect to our customer service team first and have your order number, the container number and a brief fault description with photos to hand. We usually arrange an on-site inspection rather than transporting the container, this is faster and gentler on the goods.",
      },
      {
        heading: "Guarantees in addition to statutory rights",
        body: "Some manufacturers grant voluntary guarantees, for example on the anti-corrosion coating or weld seam tightness. These guarantees exist alongside the statutory liability for defects and do not restrict it. We are happy to help you deal with the manufacturer.",
      },
      {
        heading: "Transport damage",
        body: "If the goods arrived damaged, please contact us within a few days and, where possible, send photos of the damage. We will then arrange a replacement or repair. Reporting late does not harm your statutory rights but does make it easier for us to settle matters with the carrier.",
      },
      {
        heading: "Items excluded from return",
        body: "Custom-made containers, for example with custom-cut doors and windows, a custom paint finish or a custom interior fit-out, are excluded from the right of withdrawal and the voluntary return policy. The full list can be found on our \"Right of withdrawal\" page.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* FAQ : pas d'avertissement juridique                                 */
  /* ------------------------------------------------------------------ */
  faq: {
    slug: "faq",
    title: "Frequently Asked Questions",
    intro:
      "From delivery times and our installation service to payment: here are the answers to the questions we are asked most often. If yours isn't covered, call us or send us an email, we are available Monday to Friday, 8 a.m. to 6 p.m.",
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "How long does delivery take?",
        body: "Items in stock reach you within 7 to 10 working days with standard delivery, or within a maximum of 5 working days with express delivery. The carrier contacts you in advance by phone to agree a delivery window. Items marked \"On request\" are made to order and normally take around three weeks.",
      },
      {
        heading: "How much does shipping cost?",
        body: "Standard delivery within Germany is free, with no minimum order value, whatever the size or weight of the goods. If you want delivery within a maximum of 5 working days, express shipping costs a flat 199.00 euros. There are no other surcharges. The costs for your order are always shown in the shopping basket before you buy.",
      },
      {
        heading: "Do you ship outside Germany?",
        body: "We deliver throughout Germany, including the islands. We also deliver to other member states of the European Union on request. Write to us before ordering and we will let you know feasibility, cost and delivery time for your address.",
      },
      {
        heading: "Will the container be brought onto my property?",
        body: "The carrier sets the container down by default at the freely accessible site you specify. If access is restricted or special positioning is needed, we arrange crane unloading; that quotation depends on a site survey. Call or email us before ordering so we can check access, ground conditions and space together.",
      },
      {
        heading: "Do you offer an installation service?",
        body: "Yes: 89 euros for joining and levelling assemblable containers, 49 euros for adjusting doors, roll-up doors and locks. You arrange the service by telephone or email, ideally before ordering, it cannot be added in the basket. This requires level, load-bearing and freely accessible ground. Electrical and plumbing work may only be carried out by licensed trade partners.",
      },
      {
        heading: "Do you take my used container in part exchange?",
        body: "Often, yes. Describe the condition, year and dimensions of your container to us, ideally with photos, and we will make you a purchase offer. Details and contact options are on our purchasing (Ankauf) page.",
      },
      {
        heading: "Which payment methods can I use?",
        body: "You can pay by advance bank transfer, by Sofortüberweisung, with PayPal, by credit card (Visa, Mastercard, American Express) or by SEPA direct debit. We do not charge extra fees for any of these methods (section 270a of the German Civil Code). With advance transfer we reserve the goods for seven calendar days; if payment has not arrived by then, we cancel the order. Which methods are available in your case is shown during checkout.",
      },
      {
        heading: "How does advance payment work?",
        body: "With the order confirmation you receive our bank details and the order number to quote as the payment reference; both also appear on the invoice attached to the confirmation as a PDF. We reserve the goods for seven calendar days and agree a delivery date with you as soon as payment arrives. If payment does not reach us in time, we cancel the order and contact you.",
      },
      {
        heading: "How long is the warranty?",
        body: "All new containers are covered by the statutory liability for defects for two years from delivery. If a fault occurs within the first twelve months, it is presumed to have existed from the outset, so you do not have to prove anything. Some manufacturers also grant voluntary guarantees, for example on the anti-corrosion coating.",
      },
      {
        heading: "What is the difference between a guarantee and statutory warranty rights?",
        body: "Statutory warranty rights are your legal rights against us and last two years. A guarantee is a voluntary manufacturer promise that may go further, for instance on weld seam tightness. A guarantee does not replace your statutory rights; it comes on top of them, and you decide which route to use.",
      },
      {
        heading: "How long do I have to return an item?",
        body: "There are two routes back. Your statutory right of withdrawal runs for 14 days from receipt of the goods and requires no reason; the binding text is the withdrawal policy. On top of that we voluntarily grant a contractual return right of 30 days from receipt, provided the item is unused, complete and fit for resale. This additional right does not restrict your statutory rights.",
      },
      {
        heading: "How do I send something back?",
        body: `Register the return in advance, by email to ${COMPANY.email} or by phone on ${COMPANY.phone}. The model withdrawal form is on our "Right of withdrawal" page, though you need not use it: an unequivocal statement is enough. Containers are collected from you by appointment. Please enclose all accessories, such as keys and locking bolts.`,
      },
      {
        heading: "What does a return cost?",
        body: "Nothing. We bear the return costs, both for parcels and for the collection of containers by the freight forwarder.",
      },
      {
        heading: "When will I get my money back?",
        body: "We refund the purchase price no later than 14 days after receiving your withdrawal, once the goods have arrived with us or you have provided proof of dispatch. The refund is made using your original payment method and no fees apply. There are no outbound shipping costs to refund with standard delivery. If you chose express delivery, its surcharge stays with you under section 357(2) BGB: we refund only what the cheapest standard delivery would have cost, and that is free.",
      },
      {
        heading: "An item is marked \"On request\", what does that mean?",
        body: "The item is a made-to-order container: we only have it built once you place your order. Delivery usually takes around three weeks. You can order such items as normal and we will get back to you as soon as a firm date is confirmed.",
      },
      {
        heading: "How do I know whether the access route suits delivery?",
        body: "What matters are the width and height of the access route, the load-bearing capacity of the ground and enough space to manoeuvre for a roll-off truck. As a rule of thumb, the truck typically needs the length of the container plus about 15 metres to set it down. If in doubt, measure again or call us, our advisers will check with you whether the access route is sufficient and suggest crane unloading if needed.",
      },
      {
        heading: "Can I order as a business and receive a VAT invoice?",
        body: "Yes. Enter your company name in the \"Company\" field during the order process. The invoice is attached to your order confirmation as a PDF and shows the VAT included. If you need your VAT identification number on the invoice, please add it to the comments field of your order or send it to us afterwards, there is no dedicated field for it in the order process yet. Please note two differences from consumer purchases: businesses have no statutory right of withdrawal, and the limitation period for defect claims on new goods is one year from the passing of risk rather than two. Our voluntary 30-day return right does apply to you as well.",
      },
      {
        heading: "What if my container is damaged after the two years are up?",
        body: "Contact us anyway. A manufacturer guarantee often still covers individual components, or an on-site repair works out considerably cheaper than a new purchase. We will put you in touch with an authorised service partner and check spare part availability for your model.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* About us : pas d'avertissement juridique                            */
  /* ------------------------------------------------------------------ */
  "ueber-uns": {
    slug: "ueber-uns",
    title: "About Us",
    intro:
      "BBC Best Box Containerhandel e.K. is a specialist retailer for shipping, storage, office, sanitary and special-purpose containers based in Großensee. We don't just sell containers off the shelf, we advise on them, from the right format to the right on-site setup.",
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Who we are",
        body: `As a registered merchant (eingetragener Kaufmann) since ${COMPANY.registeredSince}, we trade in new and used containers for storage, office, sanitary and special-purpose use. The name stands for what matters to us: honest advice, fair prices and a contact person who is still there after the sale. The company is led by ${COMPANY.owner}.`,
      },
      {
        heading: "Our range",
        body: "We focus on containers: shipping containers in standard sizes, lockable storage containers, fitted-out office containers, sanitary containers and individual special-purpose conversions. Instead of an endless catalogue we carry a curated selection of manufacturers we know ourselves, for their quality and their after-sales service.",
      },
      {
        heading: "Advice rather than an order form",
        body: `A container that doesn't fit through the access route, or a format that turns out too small for its intended use, is an annoyance that lasts. That is why our advisers are available Monday to Friday, 8 a.m. to 6 p.m., on ${COMPANY.phone}. We ask about access, site conditions, ground and intended use, and we will say so when the cheaper model is the better choice for your situation.`,
      },
      {
        heading: "Service and installation",
        body: "Our service partners join multi-part containers, adjust doors and roll-up doors, and level the installation on site. If something is damaged, we prefer to send a technician to you rather than transporting the container across the country. That is faster for you and gentler on the goods.",
      },
      {
        heading: "Sustainability and used containers",
        body: "Containers are by nature a durable, reusable product: we buy back used containers, inspect them for water-tightness and structural soundness, and prepare them for resale instead of having them scrapped. When selecting our range we look at corrosion protection, repairability and spare part availability, criteria that rarely appear on a spec sheet but make all the difference in everyday use.",
      },
      {
        heading: "Location and logistics",
        body: "We are based in Großensee, from where we manage purchasing, customer service and order handling. Shipping is handled by specialist freight carriers with roll-off trucks or crane vehicles, so that even a container weighing several tonnes arrives safely in its place.",
      },
      {
        heading: "Working at BBC Best Box Containerhandel e.K.",
        body: "We regularly look for reinforcements in advice, technical service and logistics. If you enjoy genuinely helping people rather than just processing orders, write to us at kontakt@bestboxcontainer.de, speculative applications are welcome too.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Contact : pas d'avertissement juridique                             */
  /* ------------------------------------------------------------------ */
  kontakt: {
    slug: "kontakt",
    title: "Contact",
    intro:
      "Whether you need advice before buying, have a question about a delivery or want to report a problem: we are here Monday to Friday, 8 a.m. to 6 p.m. For questions about an order, please have your order number to hand, it speeds everything up.",
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Customer service",
        body: "Our team answers questions about products, availability, delivery dates and payments.",
        list: [
          `Phone: ${COMPANY.phone}`,
          "Availability: Monday to Friday, 8 a.m. to 6 p.m.",
          `Email: ${COMPANY.email}`,
          "Email response time: usually within one working day",
        ],
      },
      {
        heading: "Postal address",
        body: "Please send written enquiries to:",
        list: [COMPANY.name, COMPANY.street, COMPANY.city, COMPANY.country],
      },
      {
        heading: "Returns",
        body: "Please do not send returns back unannounced, register them in advance so that we can allocate your shipment immediately.",
        list: [`Returns department: ${RETURN_ADDRESS}`],
      },
      {
        heading: "Technical service and installation",
        body: `To arrange an installation appointment or a technician visit, contact our service scheduling team on ${COMPANY.phone}. Please have your order number and the container number ready; the latter is shown on the container's CSC plate.`,
      },
      {
        heading: "Data protection requests",
        body: "To request access to, rectification of or erasure of your data, write to datenschutz@bestboxcontainer.de or by post marked \"Datenschutzbeauftragter\". We respond within the statutory period of one month.",
      },
      {
        heading: "Press and partnerships",
        body: `Please send press enquiries and questions about partnerships or affiliate programmes to ${COMPANY.email} with the subject line "Press" or "Partnership".`,
      },
      {
        heading: "Company details",
        body: `${COMPANY.name}, represented by the owner, ${COMPANY.owner}. Registering court: ${COMPANY.register}. VAT identification number: ${COMPANY.vatId}. Full details can be found in our legal notice (Impressum).`,
      },
    ],
  },
};
