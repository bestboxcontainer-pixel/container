# BBC Best Box Containerhandel e.K.

Back-office (admin) d'origine e-commerce : la vitrine publique bilingue a été
retirée à la demande du client et remplacée par une page blanche. Seul
`/admin` reste en service : produits, commandes, back-office complet et flux
Google Merchant.

Domaine : **bestbox-containerhandel.de** (placeholder)

## Stack

- **Next.js 16** : App Router, React 19, TypeScript strict
- **PostgreSQL (Neon)** via **Prisma 7** : une seule base pour le développement
  et la production
- **Tailwind CSS v4** : jetons de design en oklch
- **next-intl** : allemand à la racine, anglais sous `/en`
- **Cloudinary** : stockage des images produits
- **Nodemailer** : e-mails transactionnels via le SMTP Hostinger de la boutique

## Démarrer en local

```bash
npm install                # installe et génère le client Prisma
cp .env.example .env.local # puis renseigner les valeurs
npm run dev                # http://localhost:3000
```

Back-office : `http://localhost:3000/admin`. La connexion demande un mot de
passe **puis** un code à six chiffres envoyé par e-mail. Sans SMTP configuré,
le code s'affiche dans la console du serveur : repli réservé au développement.

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
| [`docs/HANDOVER.md`](docs/HANDOVER.md) | État du projet, ce qui est construit, limites connues |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Base PostgreSQL, migrations, sauvegardes |
| [`docs/IMAGES.md`](docs/IMAGES.md) | Cloudinary et gestion des visuels produits |
| [`docs/ACCOUNTS.md`](docs/ACCOUNTS.md) | Espace client, RGPD, suppression de compte |
| [`docs/GOOGLE_MERCHANT.md`](docs/GOOGLE_MERCHANT.md) | Flux produits et balisage |
| [`docs/LEGAL.md`](docs/LEGAL.md) | Mentions légales, textes à faire relire |

## Structure

```
src/
  app/[locale]/     # vitrine désactivée : une seule page vierge (voir docs/HANDOVER.md)
  app/admin/        # back-office, hors routage multilingue, seule partie active
  app/api/admin/    # routes serveur du back-office
  app/api/cron/     # tâches planifiées
  app/feed/         # flux Google Merchant (XML et CSV)
  components/       # composants du back-office (et vestiges de la vitrine)
  server/           # accès base et logique métier
  messages/         # traductions de.json / en.json
prisma/             # schéma, migrations, peuplement
docs/               # documentation d'exploitation
```

## Variables d'environnement

Voir [`.env.example`](.env.example) : dix-sept variables, toutes commentées.
Les valeurs réelles vivent dans `.env.local`, jamais dans le dépôt.

## Licence

MIT
