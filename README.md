# BBC Best Box Containerhandel e.K.

Boutique en ligne de vente et location de conteneurs (maritimes, de stockage,
de bureau, sanitaires, spéciaux), bilingue (allemand à la racine, anglais sous
`/en`), avec back-office complet.

Domaine : **bestboxcontainer.de**

## Stack

- **Next.js 16** : App Router, React 19, TypeScript strict
- **PostgreSQL (Neon)** via **Prisma 7** : une seule base pour le développement
  et la production
- **Tailwind CSS v4** : jetons de design en oklch
- **next-intl** : allemand à la racine, anglais sous `/en`
- **Cloudinary** : stockage des images produits
- **Stripe** : paiement par carte
- **Resend** : e-mails transactionnels (codes de connexion, confirmations de
  commande, demandes de devis, relances panier), voir `src/lib/mailer.ts`

## Démarrer en local

```bash
npm install                # installe et génère le client Prisma
cp .env.example .env.local # puis renseigner les valeurs
npm run dev                # http://localhost:3000
```

Back-office : `http://localhost:3000/admin`. La connexion demande un mot de
passe **puis** un code à six chiffres envoyé par e-mail. Sans `RESEND_API_KEY`
configurée, le code s'affiche dans la console du serveur : repli réservé au
développement.

## Commandes

```bash
npm run dev        # serveur de développement
npm run build      # build de production
npm start          # serveur de production (après build)
npm run lint       # ESLint
npm test           # tests unitaires
npm run db:deploy  # applique les migrations (production)
npm run db:migrate # crée et applique une migration (développement)
npm run db:seed    # peuplement initial du catalogue
npm run db:studio  # explorateur de base Prisma
```

## Documentation

| Fichier | Contenu |
|---|---|
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | **Mise en ligne sur Hostinger**, variables, migrations, cron, vérifications |
| [`docs/HANDOVER.md`](docs/HANDOVER.md) | Journal de reprise du projet à une date donnée : voir son propre en-tête pour la fraîcheur |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Base PostgreSQL, migrations, sauvegardes |
| [`docs/IMAGES.md`](docs/IMAGES.md) | Cloudinary et gestion des visuels produits |
| [`docs/ACCOUNTS.md`](docs/ACCOUNTS.md) | Espace client, RGPD, suppression de compte |
| [`docs/GOOGLE_MERCHANT.md`](docs/GOOGLE_MERCHANT.md) | Flux produits et balisage |
| [`docs/LEGAL.md`](docs/LEGAL.md) | Mentions légales, ce qui reste un placeholder à faire relire par un avocat |

## Structure

```
src/
  app/[locale]/     # vitrine publique : accueil, catalogue, fiches produit, panier, compte
  app/admin/        # back-office, hors routage multilingue
  app/api/          # routes serveur (compte, panier, devis, contact, cron…)
  app/feed/         # flux Google Merchant (XML et CSV)
  components/       # composants de la vitrine et du back-office
  content/legal/    # textes légaux DE/EN (Impressum, AGB, Datenschutz…)
  server/           # accès base et logique métier
  messages/         # traductions de.json / en.json
prisma/             # schéma, migrations, peuplement
docs/               # documentation d'exploitation
```

## Variables d'environnement

Voir [`.env.example`](.env.example), commenté. Les valeurs réelles vivent dans
`.env.local`, jamais dans le dépôt.

## Licence

MIT
