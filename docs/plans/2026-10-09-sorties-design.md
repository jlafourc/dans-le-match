# Dans le match — prototype validé

Jeu web pour découvrir l'arbitrage du basket, pensé pour les 12–15 ans sur téléphone. Premier chapitre approuvé : les sorties de balle. Le joueur regarde une scène 3D depuis un emplacement d'arbitre, choisit l'équipe qui bénéficie de la remise en jeu, puis comprend la décision au ralenti. Ambiance jeu vidéo : étoiles, progression et badge.

## Périmètre

Trois situations déterministes : passe bleue directement dehors, passe bleue déviée par un rouge, passe rouge déviée par un bleu. Deux réponses nommées et colorées. Les deux équipes ont des numéros distincts. Un bon choix rapporte 3 étoiles au premier essai, 2 au deuxième, 1 ensuite. On conserve le meilleur résultat ; rejouer ne permet pas de cumuler des étoiles. Une erreur permet un nouvel essai. Tous les défis réussis débloquent le badge « Premier coup d’œil ».

Three.js pour le terrain, les personnages articulés, le ballon et la caméra à 1,70 m ; HTML/CSS pour les commandes et la carte de chapitre. Le temps de simulation est indépendant du temps réel ; le ralenti réutilise les mêmes positions avec annotations. Modèles procéduraux simplifiés pour valider la mise en scène, sans prétendre à des mouvements photoréalistes. Les scènes de contact, le marcher, les comptes et les classements sont hors du prototype.

## Sources et précision pédagogique

Règlement officiel FIBA / FFBB 2026, version française 1.1 de septembre 2026, articles 22.2, 23.1.2 et 23.2.1, page 34, effectivement consultés le 9 octobre 2026 : https://api.ffbb.app/assets/313f308a-7b3b-4116-b969-882eb9c1d3ea?fs=5201041#page=34

La page https://www.ffbb.com/reglements donne le lien de ce PDF. Après une première consultation de la version FIBA 2024, l'édition française 2026 a pu être téléchargée et vérifiée. Les règles concernées concordent ; l'interface cite l'édition 2026.

Techniques individuelles FIBA, pour l'angle ouvert et le positionnement : https://refereeing.fiba.basketball/en/material-library/individual-officiating-techniques-2024-v25-iot (page de présentation consultée).

Guide FFBB e-learning : https://www.ffbb.com/sites/default/files/guide_e-learning_du_stagiaire_examen_arbitre_departemental_1.pdf (guide consulté, cours privés non consultés). Inspiration : exercices rejouables et analyse de clips ; scènes et textes originaux.

## Vérification

Tester la décision opposée au dernier toucher, la sortie au contact du sol extérieur (pas au franchissement en l'air), les étoiles sans cumul, les déblocages et la lecture de sauvegardes corrompues. Tester le parcours dans Chrome à largeur mobile et ordinateur : lecture, réponses, erreur, nouvel essai, ralenti, chapitre fini et persistance. Compiler le bundle. Le test navigateur émule un téléphone, sans remplacer un essai sur appareil réel.

## Exigence permanente : des actions naturelles

Retour utilisateur du 10 octobre 2026 : le jeu doit garder des comportements crédibles de vrai match. Chaque nouvelle scène doit montrer des joueurs orientés vers l’action et qui regardent le ballon avant d’intervenir. Le regard, la préparation du geste, le contact et la réaction doivent former une séquence cohérente. Les limites du cou, des bras et des appuis doivent être respectées ; une bonne lisibilité pédagogique ne justifie pas une interception à l’aveugle ou une articulation impossible.

Vérifier cette cohérence en mouvement à vitesse normale, puis au ralenti depuis la vue arbitre sur téléphone. Les tests géométriques complètent cette vérification visuelle.

## Exigence pédagogique : apprendre les gestes de l’arbitre

Demande utilisateur du 10 octobre 2026 : la formation doit aussi apprendre la gestuelle de l’arbitre. Cet objectif est implémenté dans le prototype pour les sorties de balle : deux questions, puis une démonstration de face.

Boucle : observer l’action, prendre une décision, choisir les deux gestes correspondants parmi de courtes animations, puis regarder une démonstration expliquée. Introduire progressivement les gestes dans les premiers niveaux et les réutiliser dans les situations de match. Distinguer la réussite de la décision et celle de la gestuelle dans le retour pédagogique.

Vérifier chaque geste et sa séquence dans les signaux officiels FIBA / FFBB avant de produire les animations. Prévoir une invitation à reproduire physiquement le geste ; le choix d’une animation sur téléphone permet d’évaluer sa reconnaissance, mais ne valide pas son exécution corporelle.

Les signaux d’arrêt et de direction ont été vérifiés dans l’annexe A 2026, pages 77–78, y compris les illustrations. Le geste de direction reproduit les deux doigts tendus de l’illustration officielle. Les étoiles restent liées à la décision ; la gestuelle a une sauvegarde et un badge distincts. Le schéma des paniers précise la direction attendue pour chaque équipe.
