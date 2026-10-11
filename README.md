# Dans le match

Prototype de jeu web d'initiation à l'arbitrage du basket pour les 12–15 ans, conçu en priorité pour téléphone. Chapitre 01 : sorties de balle.

## Lancer

```bash
npm install
npm run dev -- --port 5173
```

Ouvrir http://localhost:5173. Sur un téléphone connecté au même réseau, utiliser l'adresse réseau affichée par Vite et le port 5173 ; cela suppose que le réseau et le pare-feu de la machine permettent la connexion. Le serveur écoute sur toutes les interfaces pour ce test local.

```bash
npm test
npm run build
npm run preview
```

La compilation produit un site statique dans `dist/`. Aucun backend ni compte n'est nécessaire.

## Publier sur GitHub Pages

Le dépôt public est [jlafourc/dans-le-match](https://github.com/jlafourc/dans-le-match). L'adresse de publication prévue est [jlafourc.github.io/dans-le-match/](https://jlafourc.github.io/dans-le-match/).

Le workflow `.github/workflows/pages.yml` teste et compile le jeu puis publie `dist/` à chaque push sur `main`. Dans les paramètres du dépôt, ouvrir **Pages** et choisir **GitHub Actions** comme source. Le workflow peut aussi être relancé depuis l'onglet **Actions**.

Le chemin des ressources est calculé à partir de l'adresse Pages : le jeu fonctionne aussi sous `https://<compte>.github.io/<depot>/`. Pour vérifier cette configuration localement :

```bash
npm run build -- --base /dans-le-match/
npm run preview -- --base /dans-le-match/
```

Ouvrir alors `http://localhost:4173/dans-le-match/`. Les QR de test sur le réseau local sont exclus du dépôt et retirés de la publication. La progression sauvegardée sur l'adresse locale ne sera pas transférée à l'adresse publique, car chaque adresse possède son propre stockage navigateur.

## Jouer

Trois scènes 3D : sortie directe d'une passe bleue, déviation rouge, déviation bleue. La caméra est à hauteur d'arbitre, hors de la ligne de touche. Regarder l'action avant de choisir l'équipe qui bénéficie de la remise en jeu. La lecture peut être mise en pause et reprise. Après la décision, le ralenti reprend la même chronologie avec un zoom sur la main et une pause sur le dernier toucher, puis sur la sortie. Les boutons « Dernier toucher » et « Sortie » permettent aussi de conserver ces moments en arrêt sur image.

Après une décision correcte, deux exercices animés apprennent les gestes de l’arbitre : arrêt du chronomètre avec la paume ouverte, puis indication de la direction du jeu à partir d’un schéma des paniers. Une erreur explique la différence et permet un nouvel essai. Une démonstration de face enchaîne les deux gestes et invite à les reproduire physiquement. La reconnaissance des gestes est validée séparément des étoiles ; les trois défis débloquent le badge « Le bon signal ». Les anciennes sauvegardes de décision sont conservées.

Une réussite rapporte 3 étoiles au premier essai, 2 au deuxième, 1 ensuite. Seul le meilleur résultat de chaque défi est conservé. Les missions se débloquent successivement ; trois réussites débloquent le badge « Premier coup d’œil ». La progression est sauvegardée dans le navigateur utilisé, pas synchronisée entre appareils. Une sauvegarde illisible est ignorée ; un stockage bloqué n'empêche pas de jouer.

## Choix techniques

- Three.js : terrain de 15 × 28 m, joueurs articulés et ballon générés par le code, caméra et rendu WebGL.
- JavaScript et Vite : interface responsive sans framework, compilation statique.
- Chronologie déterministe : l'action et son ralenti utilisent `sampleBall` dans `src/scenarios.js`.
- Pas de rendu 3D continu à l'arrêt ; résolution du rendu plafonnée pour limiter le travail graphique.
- Cadrage suivant la balle après le toucher, étiquettes des deux joueurs concernés, maillots contrastés et ballon avec contour. Les mains comprennent une paume, un pouce et quatre doigts distincts ; la déviation se fait avec une seule main.
- Dans les deux scènes avec contact, le bras conserve des longueurs fixes avec un coude articulé ; la main touche le haut et le côté du ballon, à distance du torse, avant une légère déviation vers le bas et sur le côté. Le changement de direction est vérifié depuis la caméra d'arbitre, ainsi que la continuité de la trajectoire. La passe directe n'a pas de déviation ajoutée.
- Les défenseurs font face à la trajectoire ; les têtes suivent le ballon avec une amplitude limitée du cou. Le regard et le geste utilisent la même chronologie en lecture normale et au ralenti.
- Gestuelle : animations SVG procédurales avec mains et bras articulés, démonstration séquentielle, arrêt de la boucle au changement d’écran, poses statiques pour la préférence de mouvements réduits. Sauvegarde séparée des validations sous `dans-le-match-signals-v1`.
- Polices servies localement. Pas d'API distante nécessaire pour jouer.

## Sources et limites

Voir [docs/sources.md](docs/sources.md). Les scènes s'appuient sur les articles 22.2, 23.1.2 et 23.2.1 du règlement officiel FIBA / FFBB 2026, version française 1.1 de septembre 2026, effectivement consulté page 34. Le jeu est un prototype indépendant ; il n'a pas fait l'objet d'une validation fédérale.

Les personnages et gestes sont une première mise en scène simplifiée. Le prototype n'est pas une simulation de match complet ; il reste à affiner les animations et à les faire relire par un formateur arbitre. Le test en viewport mobile dans Chrome ne remplace pas un essai sur iPhone et Android réels.

## Vérification effectuée

- Tests Node : décision liée au dernier toucher, sortie uniquement au contact du sol extérieur, étoiles sans cumul, déblocages, badge, sauvegardes invalides, cadrage mobile, zoom après réponse, silhouette des mains et contact des doigts avec le ballon, réponses de gestuelle, nouveaux essais, badge de gestes, sauvegarde indépendante, poses et continuité des animations.
- Chrome : exercices de gestuelle à 390 px et 320 px, erreur dans chaque question et nouvel essai, trois validations, démonstration, navigation, badge distinct et persistance ; lecture avant réponse, mauvais choix, nouvel essai, score de 2 étoiles après erreur, deux déviations, ralenti visible avec annotation, fin du chapitre et badge.
- Chrome : persistance après rechargement, absence de débordement horizontal aux dimensions mobiles, liens de sources et récompenses.
- Chrome : pause et reprise sans déplacement de la barre de lecture, arrêts sur image du toucher et de la sortie, présence visuelle des mains en viewport mobile.
- Compilation Vite de production.

Les plans du prototype sont dans `docs/plans/`.
