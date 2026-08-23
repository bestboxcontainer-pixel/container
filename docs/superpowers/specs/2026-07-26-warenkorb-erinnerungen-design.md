# Séquence de relance des tunnels de commande abandonnés (Warenkorb-Erinnerungen)

Date : 2026-07-26

## Problème

La commande n'existe en base qu'à la fin du tunnel : `POST /api/checkout` crée l'`Order` quand le
client valide l'étape « review ». Un visiteur qui saisit son email à l'étape « contact » puis
quitte le site ne laisse aucune trace. Rien ne permet de le recontacter, ni de savoir combien de
paniers se perdent en cours de route.

## Objectif

Quatre e-mails automatiques en allemand vers les visiteurs qui ont commencé le tunnel sans le
terminer. Le premier est un message de support, « le paiement n'a pas fonctionné ? », les
suivants relancent progressivement. Chaque mail affiche le produit avec son image, son prix et sa
disponibilité, un bouton pour reprendre le paiement là où il s'est arrêté, et juste en dessous un
lien vers la page contact. La séquence s'arrête dès qu'une commande est passée ou que la personne
se désabonne.

## Portée

- Capture de la session dès la validation de l'étape « contact » du tunnel.
- Séquence de quatre mails : 10 min, +24 h, +3 jours, +7 jours.
- Reprise du tunnel depuis le mail, y compris sur un autre appareil.
- Désabonnement définitif, avec en-têtes `List-Unsubscribe`.
- Planificateur interne au processus Next, sans service externe.
- Page de suivi dans le back-office et interrupteur global.

Hors périmètre : relance des commandes créées mais non payées (`paymentStatus: "offen"`,
typiquement un virement Vorkasse jamais effectué), c'est une séquence distincte, avec des délais
en jours et un ton de rappel de paiement, à traiter plus tard. Version anglaise des mails : le
champ `locale` est stocké mais tous les gabarits sont en allemand dans cette version.

## Décisions prises

**Déclencheur : tunnel abandonné, pas commande impayée.** Le délai de 10 minutes n'a de sens que
pour un abandon en cours de saisie.

**Premier mail à 10 minutes, pas 5.** Remplir une adresse de livraison à la main prend
facilement quatre à cinq minutes ; à 5 minutes on relancerait des clients encore en train
d'acheter.

**Aucune case de consentement.** En droit allemand, un mail de relance de panier est de la
publicité au sens du § 7 UWG, et l'exception « clients existants » du § 7 al. 3 ne s'applique pas
puisqu'il n'y a pas eu de vente. Le risque d'Abmahnung a été exposé au propriétaire de la
boutique, qui a décidé d'envoyer la séquence à tous les visiteurs ayant saisi leur email, sans
opt-in : une case à cocher serait ignorée par les visiteurs pressés, et l'objectif affiché est
l'assistance au client. Trois garde-fous compensent ce choix et sont donc obligatoires :

1. le mail 1 est rédigé comme un message de support, pas comme une offre commerciale ;
2. le lien de désabonnement figure dans les quatre mails et vaut refus définitif ;
3. un interrupteur en base coupe la séquence entière sans redéploiement.

**Planificateur interne.** Pas de cron système disponible sur l'hébergement. Un `setInterval`
dans `instrumentation.ts` suffit tant que l'application tourne en processus long (`next dev`,
`next start`). Une route protégée par secret reste exposée : si l'hébergement passe un jour en
serverless, il suffira de la brancher sur un cron externe, sans réécrire la logique.

## Modèle de données

Un seul modèle ajouté à `prisma/schema.prisma` ; les désabonnements réutilisent une table
existante. Contrainte du schéma respectée : aucun enum Prisma, aucune liste scalaire, pour que
SQLite et PostgreSQL se comportent à l'identique.

### `CheckoutRecovery`

Une ligne active par adresse email.

| Champ | Type | Rôle |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `email` | `String` | tel que saisi, pour l'affichage et l'envoi |
| `emailNormalized` | `String` | minuscules et espaces retirés, sert aux rapprochements |
| `locale` | `String @default("de")` | langue du tunnel, stockée pour plus tard |
| `cartJson` | `String` | panier figé, encodé en JSON |
| `subtotalCents` | `Int` | marchandise TTC |
| `shippingCents` | `Int` | frais de port calculés au moment de la capture |
| `totalCents` | `Int` | total TTC |
| `resumeToken` | `String @unique` | 32 octets aléatoires en hexadécimal ; sert au lien de reprise **et** au désabonnement |
| `lastStep` | `String @default("contact")` | `contact` \| `payment` \| `review` |
| `sentCount` | `Int @default(0)` | mails déjà envoyés, 0 à 4 |
| `lastSentAt` | `DateTime?` | |
| `nextSendAt` | `DateTime?` | prochain envoi dû ; `null` = séquence terminée ou stoppée |
| `sendAttempts` | `Int @default(0)` | échecs consécutifs de l'envoi en cours, remis à 0 après un succès |
| `claimedAt` | `DateTime?` | verrou posé pendant un envoi |
| `stoppedReason` | `String @default("")` | `converted` \| `unsubscribed` \| `completed` \| `failed` |
| `stoppedAt` | `DateTime?` | |
| `createdAt` / `updatedAt` | `DateTime` | |

Index : `@@index([nextSendAt])` pour la requête du tick, `@@unique([emailNormalized])` pour
garantir une seule ligne active par adresse.

`cartJson` recopie le panier au lieu de le référencer, comme `OrderItem` recopie déjà les
libellés produits : le mail doit rester lisible si le produit sort du catalogue entre l'abandon et
le septième jour. Chaque ligne contient `productId`, `brand`, `name`, `image`, `path`,
`unitPriceCents`, `quantity`, `stock`, `condition`.

### Désabonnements : `EmailSuppression`, déjà présent

Le chantier des campagnes marketing a introduit `EmailSuppression`, clé primaire `email` en
minuscules, `reason` parmi `desinscription | rejet | plainte`, `campaignId` facultatif. Cette
séquence l'utilise telle quelle, avec `reason: "desinscription"` et `campaignId: null`.

Aucune table de désabonnement propre à la relance de panier n'est créée. Deux listes concurrentes
signifieraient qu'un client désabonné d'un côté continue de recevoir l'autre, ce qui est
exactement le reproche qui vaut une plainte pour spam. Conséquence assumée : se désabonner depuis
un mail de relance coupe aussi les campagnes promotionnelles, et inversement. C'est le
comportement attendu d'un lien « ne plus recevoir de messages ».

Le refus est définitif et survit à la purge de la `CheckoutRecovery` : `EmailSuppression` n'est
jamais purgé.

## Capture de la session

`src/components/checkout/CheckoutFlow.tsx` appelle `POST /api/checkout/recovery` à deux moments :

- au passage de l'étape `contact` vers `payment`, une fois l'email validé par `EMAIL_PATTERN` ;
- au passage de l'étape `payment` vers `review`, pour rafraîchir le panier et `lastStep`.

L'appel est en « fire and forget » : un échec réseau ne doit jamais bloquer la commande, on avale
l'erreur côté client.

La route serveur (`src/app/api/checkout/recovery/route.ts`) :

1. relit les produits en base à partir des `productId` reçus, les prix, images, stocks et libellés
   du mail viennent de la base, jamais du navigateur, comme dans `POST /api/checkout` ;
2. recalcule les montants avec les fonctions de `src/lib/cart.ts` ;
3. fait un `upsert` sur `emailNormalized`.

**Règle d'upsert.** Trois cas, et trois seulement :

1. Aucune ligne pour cet email → création, `sentCount: 0`, `nextSendAt: maintenant + 10 min`.
2. Ligne active (`stoppedAt` vide) → le panier, les montants et `lastStep` sont mis à jour.
   `nextSendAt` n'est repoussé à `maintenant + 10 min` que si `sentCount === 0` : une personne qui
   revient et abandonne à nouveau poursuit son calendrier initial au lieu de repartir du premier
   mail.
3. Ligne stoppée, quel qu'en soit le motif → **rien n'est écrit**. Une séquence terminée,
   convertie ou désabonnée n'est jamais relancée. La ligne disparaît à la purge des 30 jours ;
   un abandon ultérieur repart alors du cas 1, sauf si l'email figure dans `EmailSuppression`, qui est
   consulté avant toute création.

Une même adresse reçoit donc au maximum quatre mails par période de 30 jours.

**Protection contre l'abus.** La route est publique et prend une adresse email : sans frein, elle
permettrait d'envoyer des mails de la boutique à des inconnus. Un limiteur construit sur le modèle
de `src/server/customerRate.ts` (compteur en mémoire) plafonne à 5 captures par adresse IP par
tranche de 10 minutes. Au-delà, réponse `429` et rien n'est écrit en base.

## Planificateur

`src/instrumentation.ts` exporte `register()`, appelée une fois au démarrage de chaque instance du
serveur Next. Le fichier va dans `src/`, pas à la racine, parce que le projet utilise un dossier
`src` : c'est ce que prescrit `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md`.

`register()` lance un `setInterval` de 60 secondes sur le dispatcher et rend la main
immédiatement : la documentation précise que la fonction doit se terminer avant que le serveur
accepte des requêtes, donc aucun travail long ne s'y exécute. Elle sort sans rien faire si
`process.env.NEXT_RUNTIME !== "nodejs"`, et un drapeau posé sur `globalThis` empêche un second
intervalle après un rechargement à chaud : même protection que celle déjà appliquée au client
Prisma dans `src/server/prisma.ts`.

`src/server/checkoutRecovery.ts` porte le dispatcher. À chaque tick :

1. Si le réglage `checkoutRecovery.enabled` (table `Setting`) vaut `false`, sortie immédiate.
2. Si `isMailConfigured()` est faux, un avertissement est écrit une seule fois en console et le
   tick sort **sans toucher aux enregistrements** : la séquence ne doit pas se consumer parce que
   la clé Resend manque en local.
3. Sélection des lignes où `nextSendAt <= maintenant`, `stoppedAt` vide, et `claimedAt` vide ou
   antérieur à 5 minutes : un verrou plus vieux que ça vient d'un processus mort.
4. Pose du verrou ligne par ligne via un `updateMany` conditionné sur `claimedAt` : si deux ticks
   se chevauchent, un seul obtient la ligne.
5. Vérifications de dernière minute : email absent de `EmailSuppression`, et aucune `Order` portant
   exactement l'adresse capturée. Sinon la ligne est stoppée en `unsubscribed` ou `converted` et
   aucun mail ne part. Cette seconde vérification est un filet de sécurité en correspondance
   exacte : `Order.email` est archivé tel que saisi et Prisma ne sait pas comparer sans tenir
   compte de la casse sous SQLite. L'arrêt qui fait autorité est le crochet dans `createOrder()`,
   qui travaille sur `emailNormalized`.
6. Rendu du gabarit correspondant à `sentCount + 1`, envoi via `sendMail()`.
7. En cas de succès : `sentCount + 1`, `sendAttempts` remis à 0, `lastSentAt` à maintenant,
   `nextSendAt` au délai suivant : `null` après le quatrième, avec `stoppedReason: "completed"`.
   En cas d'échec Resend : verrou relâché, `sendAttempts + 1`, `nextSendAt` repoussé de
   30 minutes. À la troisième tentative infructueuse, la ligne est stoppée en `failed` et l'erreur
   est écrite en console.
8. Purge finale : suppression des lignes dont `createdAt` dépasse 30 jours, quel que soit leur
   état. `EmailSuppression` n'est jamais purgé.

Au plus **20 envois par tick**, espacés de 250 ms : le plan Resend limite le débit, et une file
de 500 abandons ne doit pas déclencher un rejet en masse.

**Rafraîchissement avant rendu.** Juste avant l'étape 6, les produits du panier figé sont relus en
base : prix, stock, image et nom du message sont ceux du jour de l'envoi, pas ceux de l'abandon.
Un article dont le prix a augmenté ne doit pas être annoncé à l'ancien tarif, le tunnel
facturerait le nouveau, et l'écart est une publicité trompeuse. Un article disparu du catalogue ou
passé en `active: false` retombe sur les valeurs figées et s'affiche `Derzeit nicht verfügbar`.

**Découpage.** Les calculs sans base de données : délais, libellés de disponibilité et d'état,
encodage du panier, construction des URL : vivent dans `src/lib/checkoutRecovery.ts`, importable
par le back-office comme par les scripts de test. `src/server/checkoutRecovery.ts` ne porte que ce
qui touche Prisma. C'est la séparation déjà en place entre `src/lib/cart.ts` et
`src/server/orders.ts`, et entre `src/lib/campaigns.ts` et le reste du chantier campagnes.

`POST /api/cron/recovery` exécute le même dispatcher, protégé par
`Authorization: Bearer $RECOVERY_CRON_SECRET`. Sans secret configuré, la route répond `503`.

## Les quatre e-mails

Nouveau fichier `src/server/emails/checkoutRecovery.ts`, qui réutilise le `layout()` de
`customerAccount.ts` : logo, filet rouge `#e3000e`, mise en page en tableaux, styles en ligne,
`color-scheme: light`.

Ajout au gabarit commun d'un **bloc produit** : image à gauche (120 px, `border-radius: 4px`),
à droite la marque en gris, le nom en gras, le prix, puis la disponibilité et l'état. Trois lignes
de panier au maximum, suivies de « und N weitere Artikel » si nécessaire.

Disponibilité, calculée à l'envoi et non à la capture :

- `stock === 0` → `Derzeit nicht verfügbar`
- `stock <= lowStockThreshold` → `Nur noch N verfügbar`
- sinon → `Auf Lager`

État, depuis `Product.condition` : `new` → `Neuware`, `refurbished` → `Generalüberholt`,
`used` → `Gebraucht`.

### Mail 1: 10 minutes

Objet : **Brauchen Sie Hilfe bei Ihrer Bestellung?**
Preheader : *Ihr Warenkorb ist gespeichert, wir helfen gern weiter.*
Titre : *Hat beim Abschluss etwas nicht funktioniert?*

> Sie haben vor wenigen Minuten eine Bestellung bei Hausgeräte Pfeffer begonnen, sie aber nicht
> abgeschlossen. Ihr Warenkorb liegt weiterhin für Sie bereit.
>
> Falls es an der Zahlung gelegen hat: Manchmal bricht eine Verbindung ab oder eine Eingabe wird
> nicht übernommen. Über den Button unten setzen Sie Ihre Bestellung genau dort fort, wo Sie
> aufgehört haben: Ihre Angaben sind noch gespeichert.

Bouton : **Bestellung fortsetzen**
Sous le bouton : *Probleme bei der Zahlung? Schreiben Sie uns kurz, wir antworten am gleichen
Werktag.* → **Zum Kontaktformular**

### Mail 2: +24 heures

Objet : **Ihr Gerät ist noch für Sie verfügbar**
Preheader : *Ihr Warenkorb wartet, versandkostenfrei ab 50,00 €.*
Titre : *Ihr Warenkorb ist noch da*

> Ihre Auswahl liegt weiterhin in Ihrem Warenkorb. Sie können die Bestellung mit einem Klick
> abschließen, ohne Ihre Daten erneut eingeben zu müssen.
>
> Gut zu wissen: Ab 50,00 € Warenwert liefern wir versandkostenfrei innerhalb Deutschlands. Und
> Sie haben 14 Tage Widerrufsrecht: passt das Gerät nicht, nehmen wir es zurück.

Le seuil de franco est interpolé depuis `FREE_SHIPPING_THRESHOLD_CENTS` (`src/lib/cart.ts`), jamais
écrit en dur : changer la constante doit changer le mail.

Bouton : **Jetzt abschließen**
Sous le bouton : *Unsicher bei der Auswahl? Wir beraten Sie gern.* → **Kontakt aufnehmen**

### Mail 3: +3 jours

Objet : **Noch Fragen zu Ihrem Gerät?**
Preheader : *Maße, Anschluss, Lieferzeit, fragen Sie uns.*
Titre : *Sprechen Sie mit uns, bevor Sie sich entscheiden*

> Ein Haushaltsgerät kauft man nicht jeden Tag. Wenn Sie noch etwas klären möchten, Maße,
> Anschluss, Lieferzeit oder Entsorgung des Altgeräts, beantworten wir Ihre Fragen gern
> persönlich.
>
> Ihr Warenkorb bleibt gespeichert. Sie können ihn jederzeit über den Button unten öffnen.

Bouton : **Warenkorb ansehen**
Sous le bouton : *Lieber direkt fragen? Wir sind für Sie erreichbar.* → **Frage stellen**

### Mail 4: +7 jours

Objet : **Wir sind weiterhin für Sie da**
Preheader : *Weitere Modelle in derselben Kategorie.*
Titre : *Falls Sie sich anders entschieden haben*

> Ihr gespeicherter Warenkorb wird bald automatisch gelöscht. Das ist völlig in Ordnung
> vielleicht war es nicht das passende Gerät.
>
> In derselben Kategorie führen wir weitere Modelle, auch in anderen Preislagen. Und wenn Sie
> etwas Bestimmtes suchen, das Sie bei uns online nicht finden: fragen Sie uns, wir haben oft mehr
> auf Lager, als die Website zeigt.

Bouton : **Weitere Geräte ansehen** → page de la catégorie du premier article du panier, obtenue en
retirant le dernier segment de son `path` (`gruppe/kategorie/produkt` → `/gruppe/kategorie`)
Sous le bouton : *Eine konkrete Frage? Schreiben Sie uns.* → **Kontakt aufnehmen**

La formule « bald automatisch gelöscht » reste exacte au regard de la purge à 30 jours. Annoncer
une suppression « dans les prochains jours » serait faux, et une fausse urgence dans un mail
commercial est précisément ce que les tribunaux allemands qualifient d'irreführend.

### Pied de page commun

Sous la mention automatique existante, un lien discret en 12 px gris :
*Keine Erinnerungen mehr erhalten* → `/abmeldung?token=…`

Deux en-têtes accompagnent chaque envoi :

```
List-Unsubscribe: <https://…/abmeldung?token=…>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

Gmail et Yahoo les exigent depuis février 2024 pour les envois automatisés ; sans eux les mails
partent en indésirables. `sendMail()` reçoit donc un paramètre `headers` optionnel, transmis tel
quel à l'API Resend.

## Reprise du paiement

`/kasse?fortsetzen=<token>` : le composant serveur de la page caisse lit le jeton, charge la
`CheckoutRecovery` et passe le panier figé et l'email à `CheckoutFlow`. Côté client, un effet au
montage :

1. réécrit `localStorage` sous la clé `hgp.cart.v1` avec les lignes du panier restauré, le mail
   est souvent ouvert sur un autre appareil que celui de l'abandon, le panier local est donc vide
   ou différent ;
2. pré-remplit le champ email ;
3. ouvre directement l'étape enregistrée dans `lastStep`.

Jeton inconnu, ou enregistrement purgé : la page caisse s'ouvre normalement sur le panier courant,
sans message d'erreur : un lien de mail vieux de six semaines ne doit pas afficher une page cassée.

Les prix et stocks sont de toute façon recontrôlés en base par `POST /api/checkout` : un panier
restauré ne peut pas faire passer un ancien prix.

## Désabonnement

`/abmeldung?token=<token>` affiche une page avec un seul bouton de confirmation, qui poste vers
`/api/abmeldung`. Le lien n'agit pas au simple chargement : les antivirus et les proxys Outlook
préchargent les URL contenues dans les mails, ce qui désabonnerait des personnes qui n'ont rien
demandé. Le clic natif de Gmail est couvert par `List-Unsubscribe-Post`, que la route accepte
aussi en `POST` direct.

La confirmation écrit une ligne `EmailSuppression` et stoppe la `CheckoutRecovery` en `unsubscribed`. Page de
confirmation en allemand, sans possibilité de se réabonner : le refus est définitif.

L'URL n'a pas de préfixe de langue en allemand, `localePrefix: "as-needed"` et `defaultLocale: "de"`
dans `src/i18n/routing.ts` : donc les liens des mails pointent vers `/abmeldung`, et la variante
anglaise vit sous `/en/abmeldung`. La page est marquée `robots: { index: false }`, comme la page
caisse.

## Arrêt sur paiement

Dans `createOrder()` (`src/server/orders.ts`), après la transaction de création : la
`CheckoutRecovery` portant le même `emailNormalized`, il en existe au plus une, grâce à la
contrainte d'unicité : passe en `stoppedReason: "converted"` avec `nextSendAt: null`. L'écriture
passe par un `updateMany` conditionné sur `stoppedAt: null`, ce qui ne lève pas d'erreur quand
aucune ligne ne correspond, le cas le plus fréquent.

C'est le seul point de passage de la création de commande, donc le seul endroit à modifier.
L'opération est volontairement hors de la transaction principale et enveloppée dans un `try` :
un échec de mise à jour de la relance ne doit jamais faire échouer une commande payante. Le
dispatcher revérifie de toute façon l'absence de commande avant chaque envoi, ce qui rattrape le
cas.

## Back-office

**Interrupteur.** Clé `checkoutRecovery.enabled` dans la table `Setting`, valeur `"true"` ou
`"false"`, par défaut activée. Lue à chaque tick, donc effet immédiat sans redéploiement.

**Page `/admin/warenkorb-erinnerungen`** dans le segment `(protected)`, suivant les conventions des
pages admin existantes :

- en-tête avec quatre compteurs sur 30 jours : sessions capturées, mails envoyés, sessions
  converties, taux de récupération ;
- interrupteur de la séquence, avec confirmation ;
- tableau des sessions : email, montant du panier, étape atteinte, mails envoyés, état
  (`en cours` / `convertie` / `désabonnée` / `terminée` / `échec d'envoi`), date de capture,
  dernier envoi ;
- filtre par état et pagination, via `src/lib/pagination.ts` ;
- une action par ligne : arrêter la séquence.

Pas d'envoi manuel depuis le back-office : la séquence est automatique, ajouter un bouton
« envoyer maintenant » ouvrirait la porte à des envois non désirés.

## Protection des données

- Rétention de 30 jours sur `CheckoutRecovery`, appliquée par le dispatcher. Une adresse email
  sans commande n'a aucune raison d'être conservée plus longtemps.
- `EmailSuppression` est conservé sans limite : c'est la preuve du refus, et l'oublier reviendrait à
  redémarrer les envois.
- Aucune donnée de paiement n'est capturée. La session ne contient que l'email, la langue et le
  panier.
- La section « Warenkorb-Erinnerungen » à ajouter dans `src/content/legal/datenschutz` :
  finalité, base légale, durée de conservation, droit d'opposition.

## Fichiers

Nouveaux :

| Fichier | Rôle |
|---|---|
| `src/instrumentation.ts` | démarrage du tick de 60 s |
| `src/server/scheduler.ts` | registre des tâches périodiques, appelé par l'instrumentation |
| `src/lib/checkoutRecovery.ts` | calendrier, libellés, encodage du panier, sans Prisma ni React |
| `src/server/checkoutRecovery.ts` | capture, dispatcher, verrou, purge, statistiques |
| `src/server/emails/checkoutRecovery.ts` | les quatre gabarits allemands et le bloc produit |
| `src/server/recoveryRate.ts` | limiteur par IP de la route de capture |
| `src/app/api/checkout/recovery/route.ts` | capture de la session |
| `src/app/api/cron/recovery/route.ts` | déclenchement manuel protégé |
| `src/app/api/abmeldung/route.ts` | enregistrement du désabonnement |
| `src/app/[locale]/abmeldung/page.tsx` | page de confirmation du désabonnement |
| `src/app/admin/(protected)/warenkorb-erinnerungen/page.tsx` | suivi back-office |
| `src/components/admin/RecoveryTable.tsx` | tableau et interrupteur |
| `scripts/test-recovery.ts` | vérification en mode DRY_RUN |

Modifiés :

| Fichier | Modification |
|---|---|
| `prisma/schema.prisma` | modèle `CheckoutRecovery` uniquement |
| `src/lib/mailer.ts` | paramètre `headers` optionnel |
| `src/components/checkout/CheckoutFlow.tsx` | capture aux deux transitions, restauration depuis `fortsetzen` |
| `src/app/[locale]/kasse/page.tsx` | lecture du jeton de reprise |
| `src/server/orders.ts` | arrêt de la séquence à la création de commande |
| `src/messages/de.json`, `en.json` | libellés de la page de désabonnement |
| `.env.example` | `RECOVERY_CRON_SECRET` |

## Vérification

Le projet n'a pas de framework de test. Deux niveaux :

**`scripts/test-recovery.ts`** : crée une session factice à partir d'un produit réel du catalogue,
puis pour chacun des quatre rangs : force `sentCount` et `nextSendAt` dans le passé, exécute le
dispatcher avec `DRY_RUN=1`, et écrit le HTML rendu dans
`.next/cache/recovery-preview/mail-N.html`. Aucun mail ne part. Sert à contrôler les quatre
gabarits dans un navigateur, avec l'image produit, le prix, la disponibilité, les deux liens et le
lien de désabonnement.

**Parcours manuel complet**, une fois les gabarits validés :

1. remplir un panier, saisir un email à l'étape contact, quitter le site ;
2. vérifier la ligne créée en base avec `npm run db:studio` ;
3. avancer `nextSendAt` à la main, attendre un tick, vérifier la réception ;
4. cliquer **Bestellung fortsetzen** depuis un autre navigateur, le panier doit se reconstituer
   et l'étape doit être la bonne ;
5. terminer la commande, vérifier que la ligne passe en `converted` et qu'aucun autre mail ne
   part ;
6. sur une seconde session, cliquer le lien de désabonnement, confirmer, vérifier
   la ligne `EmailSuppression` puis qu'un nouvel abandon avec le même email ne déclenche rien ;
7. couper l'interrupteur du back-office et vérifier qu'un envoi dû ne part pas.
