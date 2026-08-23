# Reprise du projet : état au 26 juillet 2026

Ce document résume ce qui a été construit pendant la nuit, comment lancer le
projet, et ce qui reste à faire côté commerçant.

## Démarrer en local

```bash
npm install
npm run db:migrate     # applique les migrations sur la base SQLite locale
npm run db:seed        # catalogue, moyens de paiement, compte administrateur
npm run dev            # http://localhost:3000
```

Back-office : http://localhost:3000/admin, `admin@example.com` / `change-me`.
Ces identifiants viennent de `.env.local` et ne servent qu'au premier démarrage :
dès qu'un compte existe en base, c'est le mot de passe haché qui fait foi.
**Change ce mot de passe avant toute mise en ligne** (Zugänge → changer le mot de passe).

## Ce qui a changé en profondeur

### Base de données

Le site ne lit plus les fichiers `data/store/*.json` : tout est en base via
Prisma 7. Ces fichiers ne servent plus qu'au premier peuplement (`db:seed`).
La bascule vers PostgreSQL est documentée dans `docs/DATABASE.md` et ne demande
qu'un changement de `DATABASE_URL` plus une régénération des migrations.

Modèles : Group, Category, GuideSection, Product, Review, PaymentMethod,
Integration, StockMovement, AdminUser, Setting, et les modèles de commande.

### Authentification du back-office

- Mots de passe hachés (scrypt), plusieurs comptes possibles, activation/désactivation.
- Sessions signées (HMAC-SHA256), cookie httpOnly, 8 heures.
- Cinq échecs de connexion par adresse → blocage de quinze minutes.
- Le dernier compte actif ne peut être ni désactivé ni supprimé.
- **Double facteur obligatoire** : après le mot de passe, un code à six chiffres
  part par e-mail. Le cookie de session n'est posé qu'après validation du code.
  Code valable 10 minutes, cinq tentatives, renvoi possible après 60 secondes.
  Les codes sont hachés en base (table `AdminLoginChallenge`) et supprimés dès
  qu'ils sont utilisés, expirés ou épuisés.

Envoi des codes : SMTP de la boîte Hostinger de la boutique
(`kontakt@hausgeratepfeffer.de`, `smtp.hostinger.com:465`), via nodemailer. À
renseigner dans `.env.local` : `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASSWORD`, `MAIL_FROM` et `MAIL_FROM_NAME`. En développement, si ces
variables manquent, le code s'affiche dans la console du serveur et sur la page
de connexion : ce repli est verrouillé sur `NODE_ENV === "development"`. En
production, la connexion échoue proprement (502) tant que l'envoi n'est pas
possible.

Conséquence à ne pas perdre de vue : dès que le SMTP est configuré, le repli
console disparaît, y compris en développement. L'adresse du compte admin doit
donc être une boîte réellement relevable, sinon plus personne n'entre dans le
back-office.

L'adresse se change depuis **Utilisateurs** (`/admin/users`), bouton « Modifier
l'adresse e-mail » sur la ligne du compte. Elle sert à la fois d'identifiant de
connexion et de destinataire du code : l'interface demande donc une
confirmation avant d'enregistrer. `ADMIN_EMAIL` dans `.env.local` n'est qu'un
compte d'amorçage, utilisé uniquement quand la table `AdminUser` est vide, le
modifier ne change rien à un compte déjà créé.

L'e-mail reprend le logo sur fond blanc avec un filet rouge, en tableaux et
styles en ligne, avec `color-scheme: light` pour empêcher l'inversion
automatique des couleurs par Apple Mail et Outlook (le lettrage du logo est
presque noir : inversé, il disparaîtrait).

### Boutique

- Site bilingue allemand/anglais. L'allemand reste à la racine (`/`), l'anglais
  vit sous `/en`. Le sélecteur de langue conserve la page courante.
- Avis clients avec validation obligatoire par un administrateur avant publication.
- Moyens de paiement et clés API configurables depuis le back-office ; les clés
  sont chiffrées en AES-256-GCM et ne ressortent jamais en clair.
- Tunnel d'achat complet et conforme au droit allemand de la vente à distance.
- Flux et balisage conformes à Google Merchant Center.

### Espace client et liste de souhaits

- `/konto` : inscription, connexion, mot de passe oublié, historique des
  commandes, adresses, données personnelles avec export et suppression du
  compte. Détail dans `docs/ACCOUNTS.md`.
- Le compte reste **facultatif** : la commande en tant qu'invité fonctionne
  exactement comme avant, c'est une exigence du droit allemand.
- Supprimer un compte n'efface pas les commandes : elles sont anonymisées, car
  les pièces comptables doivent être conservées.
- `/merkliste` : liste de souhaits conservée dans le navigateur, sans compte,
  synchronisée entre les onglets. Le cœur figure sur chaque vignette et sur la
  fiche produit, le compteur s'affiche dans l'en-tête.

### Images

Les visuels produits passent par Cloudinary dès que les trois clés sont saisies
dans le back-office (Intégrations). Sans clés, l'envoi reste local en
développement et est refusé en production. Voir `docs/IMAGES.md`.

### Back-office

Tableaux paginés à 25 lignes par page (produits, commandes, avis, stock, Google
Merchant, catégories, clients, comptes, univers), filtres conservés au
changement de page. Moyens de paiement et Intégrations restent sans pagination :
ce sont des écrans de configuration courts avec réordonnancement.

## Ce qui a été vérifié

- `npm run lint`, `tsc --noEmit` et `npm run build` passent (245 pages générées).
- Parcours d'achat complet dans le navigateur : fiche produit → panier → caisse
  en trois étapes → commande `HP-2026-000003` créée → visible dans le back-office.
  Le bouton final porte la mention légale « Zahlungspflichtig bestellen »
  (§ 312j Abs. 3 BGB : sans elle, aucun contrat ne se forme).
- Circuit des avis : dépôt par un visiteur → invisible sur le site → validation
  par l'administrateur → publication et recalcul de la note.
- Les deux langues : toutes les pages catégorie et les 78 fiches produit
  répondent en allemand et en anglais.
- Flux Google Merchant : 78 articles, XML validé, aucune balise vide.

Deux commandes de test restent en base (`test.kunde@example.de` et
`test.bestellung@example.de`) ainsi que trois avis d'exemple : supprimables
depuis le back-office.

## Relance des paniers abandonnés (Warenkorb-Erinnerungen)

Trois e-mails automatiques vers les visiteurs qui saisissent leur adresse dans le tunnel
sans terminer la commande : +20 min (rappel doux, cadré comme de l'aide), +8 h après le
premier (options de livraison, 14 jours de rétractation), +24 h après le deuxième
(dernière relance avant suppression, avec un code promo). Détails dans
`docs/superpowers/specs/2026-07-26-warenkorb-erinnerungen-design.md`.

- **Sans consentement préalable.** En droit allemand c'est de la publicité au sens du
  § 7 UWG ; l'exception « clients existants » ne s'applique pas puisqu'aucune vente n'a
  eu lieu. Le propriétaire de la boutique a accepté ce risque en connaissance de cause.
  Garde-fous : premier message cadré comme du support, lien de désabonnement définitif
  dans les trois messages, interrupteur `checkoutRecovery.enabled` dans le back-office
  (`/admin/warenkorb-erinnerungen`) coupant l'envoi sans redéploiement.
- **Planificateur interne**, pas de cron système : `src/instrumentation.ts` démarre un
  `setInterval` de 60 s au lancement de chaque instance Next (`next dev` ou `next start`
  uniquement: un hébergement serverless ne déclencherait rien). `POST
  /api/cron/recovery`, protégé par `RECOVERY_CRON_SECRET`, reste le point d'entrée pour
  un cron externe si l'hébergement change un jour.
- **Coupon `WARENKORB10`** créé en base pour le troisième message : 10 %, dès 300 €
  d'achat, sans limite de date ni de nombre d'utilisations, applicable à tout le
  catalogue. À surveiller comme n'importe quel coupon actif (`/admin/coupons`).
- Rétention de 30 jours sur les sessions captées ; `EmailSuppression` (partagée avec les
  campagnes marketing) n'est jamais purgée.

## Limites connues, à traiter avant d'ouvrir la boutique

1. **Aucun e-mail n'est envoyé** : la confirmation de commande par e-mail est
   obligatoire (§ 312i Abs. 1 Nr. 3 BGB). La clé `smtp_password` existe déjà
   dans Integrationen, il reste à brancher l'envoi. En attendant, la page de
   confirmation ne promet pas d'e-mail.
2. **Aucun paiement n'est encaissé** : virement et facture fonctionnent de bout
   en bout ; PayPal, carte, SEPA et Sofort créent la commande en attente de
   paiement et affichent que le prestataire sera branché via Integrationen.
3. **Bouton de rétractation en ligne** : obligatoire depuis le 19 juin 2026
   (§ 356a BGB). Le texte est en place, la fonctionnalité reste à construire ;
   sans elle, le délai de rétractation se prolonge.
4. **IBAN de démonstration** sur la page de confirmation, signalée comme telle.
5. **Livraison Allemagne uniquement**, frais 4,95 € et franco à 50 € codés dans
   `src/lib/cart.ts` : pas encore pilotables depuis le back-office.

## À faire avant la mise en ligne

1. Remplacer les informations d'entreprise fictives (voir `docs/LEGAL.md`).
2. Faire relire les textes juridiques par un juriste.
3. Renseigner les GTIN réels des produits (voir `docs/GOOGLE_MERCHANT.md`).
4. Brancher une vraie base PostgreSQL (`docs/DATABASE.md`).
5. Remplacer le stockage des images par un stockage objet si l'hébergement a un
   système de fichiers éphémère (Vercel).
6. Changer le mot de passe administrateur et régénérer `ADMIN_SESSION_SECRET`
   ainsi que `INTEGRATION_ENCRYPTION_KEY`.
