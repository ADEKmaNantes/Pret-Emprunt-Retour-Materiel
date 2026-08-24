# Registre de prêt matériel — Adekma Ouest (v2.06)

Outil de suivi des prêts et emprunts de matériel entre agences, avec
synchronisation partagée via Google Sheets.

## Structure du dépôt

Le dépôt contient **deux pages HTML** à la racine :

- **`index.html`** — page d'accueil fixe (fond jaune + logo Adekma), affichée
  2 secondes puis redirige automatiquement vers `app.html`. Ce fichier ne
  change quasiment jamais.
- **`app.html`** — l'outil lui-même (le vrai registre), celui qui évolue à
  chaque mise à jour.

## Mise en ligne (GitHub Pages)

1. Crée un nouveau dépôt sur GitHub (public ou privé selon ton besoin).
2. Mets **les deux fichiers** `index.html` et `app.html` à la racine du
   dépôt (pas dans un sous-dossier).
3. Va dans **Settings > Pages** du dépôt.
4. Sous "Build and deployment", choisis **Deploy from a branch**, branche
   `main`, dossier `/ (root)`. Sauvegarde.
5. Après une minute ou deux, GitHub affiche l'URL publique, du type :
   `https://<ton-nom-utilisateur>.github.io/<nom-du-dépôt>/`
6. Partage ce lien à tes collègues — c'est tout ce dont ils ont besoin.

## Mettre à jour l'outil plus tard

À chaque nouvelle version, je te fournis un pack GitHub complet
(`github-pack-vX.XX.zip`) contenant les deux fichiers à jour. Remplace
`index.html` et `app.html` sur GitHub par leur contenu. `index.html` ne
change en pratique presque jamais, mais autant remettre les deux à chaque
fois pour rester synchronisé. GitHub Pages se met à jour automatiquement
en 1-2 minutes.

Le numéro de version affiché dans l'en-tête de l'outil (ex: v2.06) permet
de vérifier que tout le monde utilise bien la même version.

## Google Sheets (déjà configuré)

`app.html` est déjà relié à un Google Sheet partagé (l'URL du script est
insérée dans le fichier). Toutes les personnes qui ouvrent la page, où
qu'elles l'ouvrent, voient et modifient les mêmes données.

### Schéma du Sheet

La ligne d'en-tête de l'onglet "Sorties" doit être exactement (A1:J1) :

```
id | materiel | agence | dateSortie | responsable | dateRetourPrevue | dateRetourEffective | type | deletedAt | deletedBy
```

`Code.gs` est le script côté Google Sheets qui reçoit les lectures et
écritures. La communication se fait en **JSONP** (et non en fetch/AJAX
classique) : les Web Apps Apps Script n'envoient pas d'en-tête CORS, donc
un fetch() depuis un site externe comme GitHub Pages est bloqué par le
navigateur même si la requête aboutit côté serveur. Charger la réponse via
une balise `<script>` (JSONP) contourne cette limitation.

Si tu modifies un jour Code.gs, il faut re-déployer une nouvelle version
depuis Apps Script (**Déployer > Gérer les déploiements > icône crayon >
Nouvelle version**) pour que le changement soit pris en compte — modifier
juste le code sans redéployer ne suffit pas.

## Suppression et Corbeille

Supprimer une ligne demande de saisir son nom (obligatoire) et de
confirmer. La ligne disparaît du registre principal mais n'est jamais
vraiment effacée : elle reste consultable dans la **Corbeille** (clic sur
le logo Adekma en haut à gauche > "Corbeille (suppressions)"), avec le nom
de la personne et la date, et peut être restaurée à tout moment.

## Solution de secours si Google Apps Script est bloqué (v2.09)

Si un collègue ne peut pas accéder à l'outil parce que `script.google.com`
est bloqué sur son poste (pare-feu, antivirus d'entreprise, politique
Google Workspace) et que ça ne peut pas être débloqué par l'IT, `app.html`
sait aussi utiliser **SheetDB** comme backend de secours — un service qui
transforme ta feuille Google Sheets existante en API accessible via un
autre nom de domaine (`sheetdb.io`), qui n'est généralement pas concerné
par le même blocage.

### Mise en place (à faire une seule fois, pour tout le monde)

1. Va sur [sheetdb.io](https://sheetdb.io), crée un compte gratuit.
2. Connecte ta feuille Google Sheets existante (celle qui a déjà les
   colonnes `id | materiel | agence | dateSortie | responsable |
   dateRetourPrevue | dateRetourEffective | type | deletedAt | deletedBy`).
3. SheetDB te donne une URL d'API, du type `https://sheetdb.io/api/v1/xxxxxxxxx`.
4. Ouvre `app.html`, cherche `SHEETDB_URL` tout en haut du script, remplace
   `"COLLE_TON_URL_SHEETDB_ICI"` par cette URL.
5. Remets `app.html` à jour sur GitHub.

Dès que `SHEETDB_URL` est renseignée, l'outil bascule **automatiquement**
sur SheetDB pour tout le monde (plus besoin de Google Apps Script). Pas
besoin de toucher à `Code.gs` ni de changer quoi que ce soit d'autre.

⚠️ Le plan gratuit de SheetDB a une limite de requêtes par mois (vérifie
les conditions actuelles sur leur site) — largement suffisant pour un usage
occasionnel, mais à surveiller si l'équipe grandit.
