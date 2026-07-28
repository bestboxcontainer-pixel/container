# Édition des pages légales depuis l'administration

Date : 2026-07-28
Statut : validé, en cours d'implémentation

## Problème

Les onze pages légales et informatives (`impressum`, `agb`, `datenschutz`,
`widerruf`, `versand`, `zahlungsarten`, `retoure`, `elektroaltgeraete`, `faq`,
`ueber-uns`, `kontakt`) sont écrites en dur dans `src/content/legal/de.ts` et
`src/content/legal/en.ts`. Elles portent les informations les plus sensibles du
site — raison sociale, adresse, gérant, registre du commerce, numéro de TVA,
numéro WEEE, conditions de vente. Les corriger demande aujourd'hui un
développeur et un déploiement.

Ces textes sont par ailleurs rendus en texte brut : aucun mot ne peut être mis
en gras ou en italique, et aucun lien ne peut être posé.

## Objectif

Permettre à l'administrateur connecté de modifier le contenu de ces pages depuis
le tableau de bord, dans les deux langues, avec un formatage simple, et de voir
la modification en ligne immédiatement.

## Décisions

### Stockage : base d'abord, fichier en repli

Nouveau modèle Prisma `LegalContent` : clé composite `(slug, locale)`, colonne
`data` en JSON texte, `updatedAt`, `updatedBy`.

Les fichiers `de.ts` et `en.ts` restent en place et deviennent le **contenu
d'origine**. Règle de lecture : si une ligne existe en base pour le couple
(slug, langue), elle est servie ; sinon le fichier l'est.

Conséquences retenues :
- aucune migration de données obligatoire, aucune régression au déploiement ;
- « Réinitialiser au contenu d'origine » se réduit à supprimer la ligne ;
- le contenu juridique de référence reste versionné dans le dépôt.

### Format du texte : markdown restreint

Trois marques, et rien d'autre : `**gras**`, `*italique*`, `[texte](lien)`.

Un parseur maison les transforme en éléments React `<strong>`, `<em>`, `<a>`.
Aucun `dangerouslySetInnerHTML` : l'injection de HTML est impossible par
construction, ce qui compte sur des pages éditées par un non-développeur.

Les liens sont filtrés à l'écriture comme à l'affichage : `http://`, `https://`,
chemin interne commençant par `/`, `mailto:`, `tel:`. Tout autre schéma est rendu
en texte brut plutôt que transformé en lien.

`stripMarks()` retire les marques pour les usages qui exigent du texte pur : la
`description` des métadonnées et le balisage JSON-LD `FAQPage`.

### Structure éditable : celle qui existe déjà

`title`, `intro` (facultatif), `sections[] { heading, body, list[] }`,
`updatedAt`. La structure pilote le design des pages ; la conserver garantit
qu'aucune saisie ne peut casser la mise en page.

`updatedAt` est renseignée automatiquement à la publication mais reste
modifiable à la main : une date de révision juridique peut devoir rester figée
pendant qu'on corrige une coquille.

### Interface

- Entrée « Pages & mentions légales » dans la section Système de la barre
  latérale.
- `/admin/pages` — liste des onze pages : titre, badge *Personnalisée* /
  *D'origine*, date et auteur de la dernière modification, alerte si la version
  anglaise est absente.
- `/admin/pages/[slug]` — onglets **Deutsch** / **English**. Sections repliables,
  réordonnables, ajoutables, supprimables. Barre d'outils gras / italique / lien
  sur chaque champ de texte, agissant sur la sélection. Aperçu du rendu sous
  chaque champ.
- Actions : **Publier** et **Réinitialiser au contenu d'origine** (confirmation).

### Publication immédiate

`GET` / `PUT` / `DELETE` sur `/api/admin/pages/[slug]?locale=de`, protégés par
`requireAdminApi()` comme les autres routes d'administration.

Validation côté serveur, jamais seulement côté navigateur : slug et langue
connus, titre non vide, section sans titre refusée, longueurs bornées, liens
filtrés.

Après écriture : `revalidatePath("/", "layout")`. Le passage par la racine est
nécessaire et non par excès de prudence — le pied de page reprend les titres des
pages légales, il change donc lui aussi.

### Écarté volontairement

- Historique des versions et restauration.
- Séparation brouillon / publié : la publication est directe, comme demandé.
- Centralisation des données d'entreprise dans un écran dédié : chaque page est
  éditée à la main (choix explicite de l'utilisateur).

## Impact sur l'existant

`findLegalPage()` devient asynchrone et enveloppée dans `cache()` de React pour
ne pas interroger la base deux fois dans un même rendu.

À adapter : les onze `page.tsx`, `LegalPageView`, `buildLegalMetadata`, la page
FAQ et `Footer` — ses libellés de colonnes viennent des titres de pages, qui
deviennent donc éditables eux aussi.

## Tests

`npm test` (`node --test`) couvre :
- le parseur : gras, italique, imbrication, marques non fermées, liens acceptés
  et rejetés ;
- `stripMarks()` ;
- la normalisation et la validation d'une page soumise par l'administration.
