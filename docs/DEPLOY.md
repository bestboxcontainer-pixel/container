# Mise en ligne — Hostinger

Procédure de déploiement de Hausgeräte Pfeffer sur Hostinger, en Node.js.

Deux hébergements Hostinger permettent de faire tourner ce site. Ils ne se
déploient pas de la même façon :

| | Hébergement web Node.js (hPanel) | VPS |
|---|---|---|
| Démarrage | Passenger exécute `server.js` | `npm start` sous PM2 |
| Reverse proxy | fourni | à installer (Nginx) |
| Certificat SSL | fourni | Certbot |
| Tâche planifiée | onglet « Cron Jobs » de hPanel | `crontab -e` |

Le VPS est la voie la plus sûre : le site est une application rendue côté
serveur avec base de données, envoi d'e-mails et tâche planifiée à la minute.
L'hébergement mutualisé fonctionne, mais la mémoire allouée à la compilation y
est limitée — voir « Build sur une machine limitée » plus bas.

---

## 1. Ce qu'il faut avoir sous la main

- Node **20.9 minimum** (le projet est développé sous Node 26).
- L'URL de la base **PostgreSQL Neon** (chaîne « pooled », avec `sslmode=require`).
- Les trois clés **Cloudinary** — sans elles, l'envoi d'images est refusé en
  production, et c'est par là que passeront toutes les photos produits.
- Les identifiants **SMTP Hostinger** de `kontakt@hausgeratepfeffer.de`.
  Sans eux, plus personne n'entre dans le back-office : le code de connexion à
  six chiffres part par e-mail et le repli console n'existe qu'en développement.
- Le domaine **hausgeratepfeffer.de** pointé sur l'hébergement.

## 2. Variables d'environnement

La liste complète et commentée est dans [`.env.example`](../.env.example).
Elles se saisissent dans le panneau de l'application (hPanel) ou dans un fichier
`.env.local` déposé à la racine sur le serveur — jamais dans le dépôt Git.

Générer chaque secret séparément :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Trois secrets doivent être **régénérés pour la production**, différents de ceux
utilisés en développement :

- `ADMIN_SESSION_SECRET` — signature des sessions du back-office
- `CUSTOMER_SESSION_SECRET` — signature des sessions clients
- `INTEGRATION_ENCRYPTION_KEY` — chiffrement des clés de paiement en base

Attention à `INTEGRATION_ENCRYPTION_KEY` : la changer après coup rend
illisibles les clés d'intégration déjà enregistrées en base. Elle se fixe
**avant** la première saisie de clés en production, puis ne bouge plus.

Ne pas oublier non plus :

- `NEXT_PUBLIC_SITE_URL=https://hausgeratepfeffer.de` — sans barre finale. Cette
  variable est lue **au moment du build**, pas au démarrage : la changer impose
  de reconstruire. Elle alimente les URL canoniques, le sitemap, le flux Google
  Merchant et tous les liens contenus dans les e-mails.
- `NODE_ENV=production`
- `CRON_SECRET` — sinon la route d'envoi des campagnes reste fermée.

## 3. Déploiement sur VPS Hostinger

```bash
# Sur le serveur, une seule fois
sudo apt update && sudo apt install -y git nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

git clone https://github.com/mathieudrouvot444-beep/electro.git /var/www/hausgeraete
cd /var/www/hausgeraete
```

Créer `/var/www/hausgeraete/.env.local` avec les variables de l'étape 2, puis :

```bash
npm ci                 # installe et lance `prisma generate` (postinstall)
npx prisma migrate deploy   # applique les migrations à la base Neon
npm run build
pm2 start npm --name hausgeraete -- start
pm2 save && pm2 startup     # relance automatique au redémarrage du serveur
```

Nginx en frontal, dans `/etc/nginx/sites-available/hausgeraete` :

```nginx
server {
    server_name hausgeratepfeffer.de www.hausgeratepfeffer.de;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Les envois d'images passent par Cloudinary, mais l'import CSV de produits
    # peut atteindre plusieurs mégaoctets.
    client_max_body_size 12M;
}
```

Puis activer le site et poser le certificat :

```bash
sudo ln -s /etc/nginx/sites-available/hausgeraete /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d hausgeratepfeffer.de -d www.hausgeratepfeffer.de
```

`X-Forwarded-Proto` n'est pas décoratif : sans lui, l'application se croit en
HTTP et les cookies de session, marqués `Secure`, ne sont jamais posés — la
connexion au back-office tourne alors en boucle.

## 4. Déploiement sur hébergement web Node.js (hPanel)

1. hPanel → **Avancé → Node.js** → créer l'application.
   - Version de Node : **20 ou plus**
   - Racine de l'application : le dossier du site
   - Fichier de démarrage : **`server.js`** (fourni à la racine du dépôt)
2. Onglet **Variables d'environnement** : saisir celles de l'étape 2.
3. Déposer le code (Git dans hPanel, ou SSH), puis dans le terminal de
   l'application :

```bash
npm ci
npx prisma migrate deploy
npm run build
```

4. **Restart** de l'application depuis hPanel.

`server.js` ne choisit pas son port : il lit `PORT`, imposé par Passenger. Ne
pas le modifier.

### Build sur une machine limitée

Si `npm run build` s'interrompt sans message (le processus est tué faute de
mémoire), construire en local et n'envoyer que le résultat :

```bash
# En local
npm run build
# Puis transférer .next/ et node_modules/ vers le serveur, en plus du code
```

## 5. Base de données

Les migrations ne se génèrent jamais en production. On applique celles du dépôt :

```bash
npx prisma migrate deploy
```

Le premier peuplement (catalogue, moyens de paiement, compte administrateur)
se fait une seule fois :

```bash
npm run db:seed
```

À sauter si la base Neon contient déjà le catalogue — c'est le cas ici, la même
base sert le développement et la production (voir [`DATABASE.md`](DATABASE.md)).

Neon met le calcul en veille après inactivité : la première requête après une
nuit calme peut prendre une à deux secondes. C'est normal.

## 6. Tâche planifiée des campagnes e-mail

Sans elle, les campagnes programmées ne partent jamais. Toutes les minutes :

```
* * * * * curl -fsS -X POST -H "Authorization: Bearer LE_CRON_SECRET" https://hausgeratepfeffer.de/api/cron/campaigns > /dev/null
```

Sur VPS : `crontab -e`. Sur hébergement web : hPanel → **Cron Jobs**.

Appeler la route trop souvent est sans effet : le répartiteur ne fait rien tant
que l'heure du prochain lot n'est pas atteinte.

## 7. Vérifications après mise en ligne

```bash
curl -I https://hausgeratepfeffer.de/                    # 200
curl -s https://hausgeratepfeffer.de/sitemap.xml | head  # XML des pages
curl -s https://hausgeratepfeffer.de/robots.txt          # autorise l'indexation
curl -s "https://hausgeratepfeffer.de/feed/google" | head -20   # flux Merchant
```

Puis, dans le navigateur :

- `/admin` → connexion, **réception réelle du code à six chiffres par e-mail**
- Changer le mot de passe administrateur (Zugänge)
- Envoyer une image produit depuis le back-office → l'URL renvoyée doit être en
  `res.cloudinary.com`
- Une commande de test de bout en bout, puis la supprimer

## 8. Ce qui reste à traiter avant d'ouvrir la boutique

Repris de [`HANDOVER.md`](HANDOVER.md) — ces points ne bloquent pas le
déploiement mais bloquent la vente réelle :

1. Confirmation de commande par e-mail (§ 312i Abs. 1 Nr. 3 BGB) — obligatoire.
2. Aucun paiement encaissé : virement et facture fonctionnent, les prestataires
   (PayPal, carte, SEPA) restent à brancher via Intégrations.
3. Bouton de rétractation en ligne (§ 356a BGB, obligatoire depuis le
   19 juin 2026) : le texte est en place, la fonctionnalité reste à construire.
4. IBAN de démonstration sur la page de confirmation.
5. Informations d'entreprise fictives dans les mentions légales — voir
   [`LEGAL.md`](LEGAL.md), à faire relire par un juriste.
6. Supprimer les deux commandes et les trois avis de test restés en base.
