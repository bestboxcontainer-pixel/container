# Contenu légal et informatif : BBC Best Box Containerhandel e.K.

Ce document décrit le corpus légal livré dans `src/content/legal/`, ce qu'il couvre,
ce qui **doit impérativement être personnalisé avant la mise en ligne**, et les sources
juridiques utilisées.

> **Avertissement.** Les textes livrés sont des **modèles rédactionnels**, pas un conseil
> juridique. Toutes les données d'entreprise sont fictives. Aucune page ne doit être publiée
> avant relecture par un avocat spécialisé en droit du commerce électronique allemand.

---

## 1. Fichiers livrés

| Fichier | Rôle |
| --- | --- |
| `src/content/legal/types.ts` | Types partagés (`LegalPage`, `LegalSection`, `LegalSlug`, `LegalLocale`, liens de pied de page) |
| `src/content/legal/de.ts` | Contenu allemand complet (`deLegalPages`) |
| `src/content/legal/en.ts` | Traduction anglaise intégrale (`enLegalPages`) |
| `src/content/legal/index.ts` | Accès unifié : `getLegalPage`, `listLegalPages`, liens de pied de page |
| `docs/LEGAL.md` | Ce document |

Le corps des sections est du **texte simple**. Les paragraphes sont séparés par `\n\n`.
Aucun HTML brut n'est stocké : le rendu doit découper sur `\n\n` et échapper normalement
(pas de `dangerouslySetInnerHTML`).

## 2. Pages disponibles (slugs)

| Slug | Page (DE) | Page (EN) | Avertissement juridique en tête |
| --- | --- | --- | --- |
| `impressum` | Impressum | Legal Notice (Impressum) | oui |
| `agb` | Allgemeine Geschäftsbedingungen | General Terms and Conditions | oui |
| `datenschutz` | Datenschutzerklärung | Privacy Policy | oui |
| `widerruf` | Widerrufsrecht und Muster-Widerrufsformular | Right of Withdrawal and Model Withdrawal Form | oui |
| `versand` | Versand und Lieferung | Shipping and Delivery | oui |
| `zahlungsarten` | Zahlungsarten | Payment Methods | oui |
| `retoure` | Retoure und Reklamation | Returns and Complaints | oui |
| `faq` | Häufige Fragen (20 questions) | Frequently Asked Questions | non |
| `ueber-uns` | Über uns | About Us | non |
| `kontakt` | Kontakt | Contact | non |

Les pages anglaises portent en plus la mention : *« The contractual language is German; in
the event of any discrepancy, the German version of this page is the only legally binding one. »*

## 3. API de `index.ts`

```ts
// Constantes
const DEFAULT_LEGAL_LOCALE: LegalLocale;                // "de"
const LEGAL_LOCALES: readonly LegalLocale[];            // ["de", "en"]
const LEGAL_SLUGS: readonly LegalSlug[];                // 10 slugs, ordre d'affichage

// Gardes de type (pour les segments d'URL dynamiques)
function isLegalSlug(value: string): value is LegalSlug;
function isLegalLocale(value: string): value is LegalLocale;

// Accès au contenu
function getLegalPage(slug: LegalSlug, locale?: LegalLocale): LegalPage;
function findLegalPage(slug: string, locale?: string): LegalPage | undefined;
function listLegalPages(locale?: LegalLocale): readonly LegalPage[];

// Liens
function getLegalHref(slug: LegalSlug, locale?: LegalLocale): string;
function getLegalFooterLinks(locale?: LegalLocale): readonly LegalFooterLink[];
function getLegalFooterGroups(locale?: LegalLocale): readonly LegalFooterGroup[];

const legalFooterLinks: Readonly<Record<LegalLocale, readonly LegalFooterLink[]>>;
const legalFooterGroups: Readonly<Record<LegalLocale, readonly LegalFooterGroup[]>>;

// Corpus bruts si besoin
export { deLegalPages, enLegalPages };
```

`getLegalHref` produit `/<slug>` en allemand et `/en/<slug>` en anglais. **Si le routage
retenu diffère, cette fonction est le seul point à modifier**, les liens de pied de page
en découlent.

Les colonnes du pied de page sont réparties ainsi :

- **Service** : `versand`, `zahlungsarten`, `retoure`, `faq`
- **Rechtliches / Legal** : `impressum`, `agb`, `datenschutz`, `widerruf`
- **Unternehmen / Company** : `ueber-uns`, `kontakt`

### Note d'intégration

Le composant `src/components/Footer.tsx` existant utilise aujourd'hui les chemins
`/widerrufsrecht`, `/ruecksendung`, `/bestellung`, `/jobs`, `/presse`, `/partnerprogramm`.
Les slugs de ce corpus sont `widerruf` et `retoure`. Il faut soit aligner le footer sur
`getLegalFooterGroups()`, soit ajouter des redirections. Les pages `bestellung`, `jobs`,
`presse` et `partnerprogramm` ne font pas partie de ce corpus.

## 4. Ce que le corpus couvre

- **Impressumspflicht** (§ 5 DDG, ex-TMG) : raison sociale, forme juridique, adresse physique,
  représentant légal, moyens de contact rapides, registre du commerce, numéro de TVA
  intracommunautaire, responsable éditorial (§ 18 al. 2 MStV). Pas de registre d'emballages
  LUCID ni de numéros WEEE/batteries : un conteneur n'est pas un emballage au sens du
  Verpackungsgesetz, et la boutique ne vend pas d'appareils électriques.
- **Streitbeilegung** : formulation § 36 VSBG **sans lien vers la plateforme ODR**, qui a été
  définitivement fermée le 20 juillet 2025. Maintenir un lien vers cette plateforme est
  aujourd'hui une pratique commerciale trompeuse et un motif d'`Abmahnung`.
- **Widerrufsrecht** : belehrung conforme au modèle légal (Anlage 1 à l'art. 246a § 1 al. 2
  phrase 2 EGBGB) **dans sa version applicable depuis le 19 juin 2026**, incluant la phrase
  relative à l'exercice en ligne du droit de rétractation ; Muster-Widerrufsformular
  (Anlage 2) ; variantes de départ du délai pour livraisons multiples/partielles ; exclusion du
  § 312g al. 2 BGB pertinente pour un conteneur (fabrication sur mesure : découpe de portes et
  fenêtres, peinture, aménagement intérieur). Les exclusions du gabarit d'origine propres à
  l'électroménager et au multimédia (biens scellés pour raisons d'hygiène, supports audio/vidéo
  ou logiciels scellés, extinction du droit pour les contenus numériques § 356 al. 5 BGB) ont
  été retirées en 2026-09 : aucun produit vendu ne relève de ces catégories.
- **Widerrufsbutton / § 356a BGB** : obligatoire depuis le 19 juin 2026 pour tout contrat B2C
  conclu via une interface en ligne. Le contenu décrit la procédure en deux étapes et l'accusé
  de réception sur support durable. **La fonctionnalité technique reste à implémenter** (voir § 5).
- **AGB** B2C vente à distance : champ d'application, conclusion du contrat, correction des
  erreurs de saisie, langue et archivage, prix et frais de port, délais, paiement, réserve de
  propriété, droit de rétractation, garantie légale 2 ans + biens à éléments numériques
  (§§ 475b/475c BGB), garanties fabricant, dommages de transport, compensation,
  limitation de responsabilité, droit applicable et for.
- **Datenschutzerklärung** : art. 13/14 RGPD, bases légales art. 6, hébergement et logs,
  commande et compte client, prestataires de paiement, contrôle de solvabilité, transporteurs
  et service de montage, avis clients, newsletter (double opt-in + § 7 al. 3 UWG), cookies
  et gestion du consentement (§ 25 TDDDG), analytics, destinataires et transferts hors UE,
  durées de conservation (§ 257 HGB / § 147 AO), droits des personnes, droit d'opposition
  art. 21 mis en avant, autorité de contrôle, sécurité, décision automatisée.
- **PAngV** : prix total TTC, mention de la TVA, frais de port annoncés avant le panier,
  prix de base pour les produits vendus au poids/volume/longueur/surface, règle du prix le
  plus bas des 30 derniers jours en cas de promotion.
- **Contenu commercial cohérent avec le site** : standard gratuit 7-10 jours ouvrés, express
  199 €, service de montage sur demande, garantie légale 2 ans, paiement facture / PayPal /
  carte / SEPA / virement.

## 5. À remplacer impérativement avant la mise en ligne

### 5.1 Données d'entreprise (réelles)

Mis à jour en 2026-09 avec l'identité réelle de l'entreprise. Toutes les données du
tableau ci-dessous sont réelles ; ce qui reste à compléter (assurance, prestataires…)
est du texte, pas des coordonnées d'entreprise, voir § 5.2.

| Élément | Valeur actuelle | Statut | Où |
| --- | --- | --- | --- |
| Raison sociale | `BBC Best Box Containerhandel e.K.` | réel | `COMPANY.name` dans `de.ts` et `en.ts` |
| Forme juridique | e.K. (Einzelkaufmann) | réel | idem |
| Adresse | `Petersweg 11a, 22946 Großensee, Schleswig-Holstein` | réel | idem |
| Inhaber (propriétaire) | `Peer Kunz` | réel | `COMPANY.owner` |
| Registre du commerce | `Amtsgericht Lübeck, HRA 3471` | réel | idem |
| Inscrit depuis | `20 avril 2006` | réel | `COMPANY.registeredSince` |
| E-mail | `kontakt@bestboxcontainer.de` | réel, domaine vérifié dans Resend | `COMPANY.email` |
| Téléphone | `+49 1525 9026450` | réel | `COMPANY.phone` |
| N° TVA intracommunautaire | `DE814218818` | réel | `COMPANY.vatId` (dupliqué dans `IMPRESSUM` de `campaign.ts`, voir le commentaire à cet endroit) |
| Adresse de retour | identique au siège | réel | `RETURN_ADDRESS` |
| Domaine | `www.bestboxcontainer.de` | réel, domaine vérifié dans Resend pour l'envoi d'e-mails | `COMPANY.domain` |

Trois rubriques du gabarit d'origine (vente d'électroménager) ont été retirées de
l'Impressum plutôt que complétées : WEEE (stiftung ear), registre batteries (BattDG) —
la boutique ne vend pas d'appareils électriques — et registre d'emballages LUCID en
2026-09 : un conteneur est le produit vendu, pas un emballage autour d'un autre produit,
au sens du Verpackungsgesetz. Aucun placeholder à suivre pour ces trois-là.

La vitrine publique bilingue (catalogue, devis, panier, back-office complet) est en
service à `/` et `/en`, ce n'est plus un back-office isolé derrière une page vierge — voir
`README.md`. Le contenu rédactionnel des pages légales (Impressum, AGB, FAQ, Über uns…) a
été réécrit pour l'activité de négoce de conteneurs de BBC Best Box Containerhandel e.K.,
et les mentions ElektroG/BattDG héritées du gabarit d'origine (vente d'électroménager) ont
été retirées, voir la note en tête de `de.ts` / `en.ts`.

Les constantes `COMPANY` de `de.ts` et `en.ts` sont **volontairement dupliquées** (le pays
diffère : `Deutschland` / `Germany`). Modifier les deux.

### 5.2 Éléments juridiques à compléter

1. **Assurance responsabilité civile professionnelle / exploitation**, nom, adresse et
   étendue géographique de l'assureur (`impressum`, section « Betriebshaftpflichtversicherung »).
   Obligatoire pour les prestations de service au sens du § 2 DL-InfoV (service de montage).
2. **Prestataires de paiement** : nommer explicitement chaque prestataire (PayPal (Europe)
   S.à r.l. et Cie, S.C.A., acquéreur carte, prestataire du paiement sur facture) avec adresse
   dans `datenschutz` §6 et `zahlungsarten`.
3. **Agence d'information sur la solvabilité** : nom et adresse de la Wirtschaftsauskunftei
   utilisée pour le paiement sur facture (`datenschutz` §7). Une information séparée type
   « Schufa-Klausel » est en général exigée.
4. **Hébergeur** : nom, adresse et pays de l'hébergeur du shop, plus mention du contrat de
   sous-traitance art. 28 RGPD (`datenschutz` §4).
5. **Transporteurs et partenaires de montage** : identifier les destinataires réels
   (`datenschutz` §8).
6. **Outils d'analytics / marketing** : la section 14 de `datenschutz` (« Reichweitenmessung
   und Marketing ») est un cadre vide : énumérer chaque outil, son fournisseur, les données
   traitées, la durée et les transferts hors UE. Aucune page ne doit être publiée avec cette
   section laissée en l'état. (La section 13, cookies et gestion du consentement, est déjà à
   jour : Smartsupp et la carte Google du contact, seuls services concernés aujourd'hui.)
7. **Délégué à la protection des données** : vérifier l'obligation de désignation
   (§ 38 BDSG) avant d'annoncer un DPO.
8. **Position § 36 VSBG** : le corpus indique « ni disposés ni tenus » de participer à un
   règlement extrajudiciaire. Décision commerciale à confirmer ; l'obligation d'information ne
   s'applique pas aux entreprises de 10 salariés ou moins au 31 décembre de l'année précédente.
9. **Mention de TVA** : si l'entreprise relève du régime des petites entreprises
   (§ 19 UStG), toutes les mentions « inkl. gesetzl. MwSt. » doivent être remplacées.

### 5.3 Données commerciales à confirmer

Les tarifs suivants sont des **valeurs d'exemple** cohérentes avec l'interface du site,
mais doivent être alignés sur les contrats logistiques et de service réels :

- Colis Allemagne 4,95 € ; franco de port dès 50 € ; expédition transporteur grands appareils
  39,90 € ; supplément îles 29 € ; supplément encombrant 19 €.
- Livraison jusqu'au lieu d'installation 29 € ; déballage et reprise de l'emballage 9 €.
- Raccordement lave-linge / sèche-linge / lave-vaisselle 49 € ; réfrigérateur pose libre 39 € ;
  encastrement 89 € ; fixation murale TV 99 €.
- Délais 1-3 jours ouvrés ; articles « Auf Anfrage » 2-4 semaines ; réservation 7 jours en
  paiement d'avance ; paiement sur facture à 14 jours.
- Droit de rétractation légal 14 jours **+ droit de retour contractuel volontaire 30 jours**
  (repris du bandeau de confiance du site). Si ce geste commercial n'est pas voulu, retirer
  les passages correspondants dans `agb`, `widerruf` et `retoure`.
- **Frais de retour à notre charge.** Ce choix figure dans la Widerrufsbelehrung ; s'il change,
  la belehrung doit indiquer que le client supporte les frais directs de renvoi et, pour les
  marchandises non expédiables par colis, une **estimation chiffrée** de ces frais.

## 6. Ce qui reste à faire hors de ce corpus

Ces obligations ne sont pas du contenu texte et relèvent d'autres chantiers :

- **Bouton de rétractation (§ 356a BGB)** : obligatoire depuis le 19.06.2026 : bouton
  « Vertrag widerrufen » visible et accessible pendant tout le délai, formulaire en deux
  étapes (nom, identification du contrat, moyen de contact électronique), bouton de
  confirmation distinct, puis accusé de réception immédiat sur support durable avec date et
  heure. À défaut : prolongation du délai de rétractation et risque concurrentiel.
- **Bandeau de consentement cookies** conforme au § 25 TDDDG (refus aussi simple que
  l'acceptation, pas de cookies non essentiels avant consentement).
- **Bouton de résiliation (§ 312k BGB)** si des contrats à durée déterminée sont proposés.
- **Mentions produit GPSR** (règlement (UE) 2023/988, applicable depuis le 13.12.2024, et
  nouveau ProdSG allemand en vigueur depuis le 19.02.2026) : fabricant, personne responsable
  dans l'UE, identifiants produit, avertissements de sécurité sur chaque fiche produit.
- **Indication du prix de base** générée par le catalogue là où elle s'applique.
- **Affichage de l'ancien prix / prix le plus bas sur 30 jours** en cas de promotion (§ 11 PAngV).
- **Bouton « Zahlungspflichtig bestellen »** et récapitulatif de commande conformes à
  l'art. 246a EGBGB / § 312j BGB.

## 7. Sources

Recherche effectuée en juillet 2026. Sources officielles et cabinets spécialisés :

- Impressum / § 5 DDG: [IHK Chemnitz, « Die Impressumspflicht »](https://www.ihk.de/chemnitz/recht-und-steuern/rechtsinformationen/internetrecht/pflichtangaben-im-internet-die-impressumspflicht-4401580), [eRecht24](https://www.e-recht24.de/artikel/datenschutz/209.html)
- Fermeture de la plateforme ODR au 20.07.2025: [IT-Recht Kanzlei](https://www.it-recht-kanzlei.de/entfernung-informationen-os-plattform.html), [IHK Osnabrück](https://www.ihk.de/osnabrueck/recht-und-fair-play/recht/internetrecht/einstellung-os-plattform-6474562), [WBS Legal](https://www.wbs.legal/it-und-internet-recht/eu-streitbeilegungsplattform-os-plattform-eingestellt-jetzt-impressum-aktualisieren-83428/)
- § 36 VSBG et Universalschlichtungsstelle des Bundes (Kehl), [gesetze-im-internet.de, § 36 VSBG](https://www.gesetze-im-internet.de/vsbg/__36.html), [Bundesamt für Justiz](https://www.bundesjustizamt.de/DE/Themen/Verbraucherrechte/Verbraucherstreitbeilegung/Unternehmen/Unternehmen_node.html)
- Muster-Widerrufsbelehrung (Anlage 1 EGBGB) et Muster-Widerrufsformular (Anlage 2 EGBGB), [buzer.de, Anlage 1](https://www.buzer.de/Anlage_1_EGBGB.htm), [buzer.de, Anlage 2](https://www.buzer.de/Anlage_2_EGBGB.htm), [BMJ, Musterbelehrungen Widerrufsrecht im Fernabsatz](https://www.bmjv.de/DE/service/formulare/form_widerrufsrecht/form_widerrufsrecht_node.html)
- Widerrufsbutton / § 356a BGB au 19.06.2026: [Wettbewerbszentrale](https://www.wettbewerbszentrale.de/die-zeit-laeuft-ab-19-06-2026-ist-der-widerrufsbutton-pflicht/), [Noerr, loi de transposition](https://www.noerr.com/de/insights/umsetzungsgesetz-zum-widerrufsbutton-veroeffentlicht), [Datenschutz-Generator, FAQ Widerrufsbutton](https://datenschutz-generator.de/widerrufsbutton/), [Verbraucherzentrale](https://www.verbraucherzentrale.de/wissen/vertraege-reklamation/kundenrechte/widerrufsbutton-ab-juni-2026-onlinevertraege-einfacher-widerrufen-118449)
- PAngV: [gesetze-im-internet.de, PAngV](https://www.gesetze-im-internet.de/pangv_2022/BJNR492110021.html), [IT-Recht Kanzlei, guide PAngV](https://www.it-recht-kanzlei.de/preisangabenverordnung.html)
- Datenschutzerklärung / RGPD / § 25 TDDDG: [IHK Schleswig-Holstein](https://www.ihk.de/schleswig-holstein/recht/recht-im-internet/pflichtangaben-internet-datenschutzerklaerung-1359834), [eRecht24, RGPD pour boutiques en ligne](https://www.e-recht24.de/datenschutz/7902-datenschutzerklaerung-fuer-online-shops-was-shopbetreiber-wissen-muessen.html)
- GPSR et nouveau ProdSG (19.02.2026): [Dr. Bahr, FAQ GPSR](https://www.dr-bahr.com/infos/rechts-faq/rechts-faq-produktsicherheitsverordnung-gpsr-pflichten-fuer-online-shop-betreiber.html), [Händlerbund](https://www.haendlerbund.de/de/ratgeber/recht/produktsicherheitsverordnung), [eRecht24](https://www.e-recht24.de/ecommerce/13370-produktsicherheitsverordnung-im-e-commerce.html)
