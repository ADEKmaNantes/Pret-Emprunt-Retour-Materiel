# Registre de prêt matériel — Adekma Ouest

Outil de suivi des prêts et emprunts de matériel entre agences, avec
synchronisation partagée via Google Sheets.

## Mise en ligne (GitHub Pages)

1. Crée un nouveau dépôt sur GitHub (public ou privé selon ton besoin).
2. Mets `index.html` **à la racine** du dépôt (pas dans un sous-dossier).
3. Va dans **Settings > Pages** du dépôt.
4. Sous "Build and deployment", choisis **Deploy from a branch**, branche
   `main`, dossier `/ (root)`. Sauvegarde.
5. Après une minute ou deux, GitHub affiche l'URL publique, du type :
   `https://<ton-nom-utilisateur>.github.io/<nom-du-dépôt>/`
6. Partage ce lien à tes collègues — c'est tout ce dont ils ont besoin.

## Mettre à jour l'outil plus tard

Remplace simplement `index.html` dans le dépôt (upload du nouveau fichier,
ou `git push`). GitHub Pages se met à jour automatiquement en 1-2 minutes.
Tout le monde verra la nouvelle version au prochain chargement de la page.

## Google Sheets (déjà configuré)

`index.html` est déjà relié à un Google Sheet partagé (l'URL du script est
insérée dans le fichier). Toutes les personnes qui ouvrent la page, où
qu'elles l'ouvrent, voient et modifient les mêmes données.

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

Si tu ajoutes un jour un nouveau champ de données, pense à mettre à jour
`Code.gs` **et** la ligne d'en-tête du Sheet en même temps que le HTML.
