# Prévisualisation live dans le back-office + upload Cloudinary des images de catégorie

Date : 2026-07-26

## Problème

Deux manques dans le back-office :

1. Le formulaire de catégorie (`/admin/categories/[...id]`) demande un « chemin de l'image »
   saisi à la main. L'administrateur ne peut pas envoyer une image depuis son ordinateur ; les
   visuels doivent pourtant être hébergés sur Cloudinary.
2. Ni le formulaire de catégorie ni le formulaire produit ne montrent le résultat. Il faut
   enregistrer puis ouvrir la boutique pour voir l'effet d'une modification.

## Objectif

Un panneau de prévisualisation à droite de chaque formulaire, qui reproduit le rendu vu par le
client et se met à jour à chaque frappe. Bureau uniquement dans un premier temps.

## Portée

- Formulaire catégorie et formulaire produit (création et édition).
- Rendu fidèle de la boutique, pas une fiche récapitulative d'administration.
- Affichage à partir du point de rupture `xl` (1280 px). Masqué en dessous.

Hors périmètre : version mobile du panneau, prévisualisation des autres formulaires
(univers, méthodes de paiement, utilisateurs).

## Partie 1 : Upload Cloudinary dans le formulaire catégorie

`ImageUploadField` existe déjà et fait le travail : envoi vers `/api/admin/upload`, qui pousse
sur Cloudinary et retombe sur un stockage local si les clés manquent. Le formulaire produit
l'utilise déjà.

Le champ texte « Chemin de l'image » de `CategoryForm` est remplacé par ce composant. Aucune
modification côté API ni côté base. Le champ texte reste accessible dans le composant, à côté du
bouton d'envoi, donc coller une URL existante reste possible.

## Partie 2 : Panneau de prévisualisation

### Contrainte

`ProductCard`, `ProductPurchaseBox`, `Breadcrumb` et `CategoryGuide` dépendent de next-intl
(`useTranslations` / `useLocale`), du `Link` localisé et des contextes panier et liste d'envies.
Le back-office vit hors du segment `[locale]` : ces composants ne peuvent pas y être montés.

### Décision

Trois composants autonomes dans `src/components/admin/`, qui reprennent le balisage et les
classes Tailwind du site public sans aucune de ces dépendances :

- `PreviewImage` : une image avec ses états vides : « Aucune image » quand la valeur est
  absente, « Aperçu indisponible » quand le chargement échoue. Rendu en `unoptimized` pour
  accepter n'importe quelle source pendant la saisie.
- `CategoryPreview` : adresse simulée, fil d'ariane, en-tête (image, libellé, description),
  guide d'achat (introduction, sections, conclusion).
- `ProductPreview`: deux vues commutables : « Fiche produit » (galerie, marque, nom,
  description courte, ancien prix, prix, badge, disponibilité, caractéristiques) et
  « Carte en liste » (le rendu de `ProductCard`).

Les libellés figés du site sont repris en allemand depuis `src/messages/de.json` pour rester
fidèles : « Start », « {label} bei Hausgeräte Pfeffer », « Vorrätig, Lieferung in 1-3
Werktagen », « Auf Anfrage : kommt in 2-4 Wochen », « Ursprünglicher Preis ».

Écarté : envelopper le panneau dans `NextIntlClientProvider` avec de faux contextes panier et
liste d'envies. Plus fidèle, mais une plomberie fragile qui lierait le back-office aux
providers de la boutique.

### Mise à jour live

Les deux formulaires tiennent déjà tout leur état dans `useState`. Les valeurs sont passées
telles quelles aux composants de prévisualisation : React rend à nouveau à chaque frappe.
Aucun appel réseau, aucun anti-rebond, aucune écriture en base.

### Mise en page

Dans chaque page d'édition, une grille `xl:grid-cols-[minmax(0,1fr)_380px]` : formulaire à
gauche, panneau `sticky top-6` à droite, `hidden xl:block`. Le conteneur du back-office
(`max-w-6xl`) reste inchangé.

### Cas limites

- Image absente ou cassée : placeholder, jamais d'espace vide.
- Produit sans image : l'image de la catégorie prend le relais, comme sur la boutique.
- Champ vide : mention grisée « (non renseigné) » plutôt qu'un trou dans la mise en page.
- Stock à zéro : « Auf Anfrage ». Stock sous le seuil d'alerte : mention de stock faible.
- Note hors de l'intervalle 0-5 ou non numérique : l'étoile n'est pas affichée.

## Vérification

Le dépôt n'a pas de cadre de test. La vérification passe par `npm run lint`, `npm run build`,
puis un contrôle visuel réel sur `localhost:3000` : ouverture des deux formulaires, saisie dans
un champ, confirmation que le panneau bouge sans rechargement.
