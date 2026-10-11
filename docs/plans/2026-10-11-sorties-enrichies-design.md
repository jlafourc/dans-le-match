# Chapitre des sorties enrichi

## Objectif validé
Suite demandée : enrichir les sorties et améliorer les mouvements naturels avant de créer d’autres chapitres. Public débutant 12–15 ans, téléphone, vue à hauteur d’arbitre, observer puis choisir, récompenses et gestes officiels.

## Approches examinées
- Retenir six situations écrites : contrôle de la lisibilité, du contact et de la progression. Choix retenu pour cette itération.
- Tirer des scènes aléatoires : plus de variété, mais chaque contact et cadrage deviendrait plus difficile à valider.
- Créer immédiatement un chapitre marcher : enrichit les règles, mais demande une précision des appuis encore à construire.

## Contenu
Conserver les trois défis d’initiation et leurs identifiants. Ajouter une passe rouge directe depuis la touche opposée, une déviation rouge dans une autre zone et une tentative rouge manquée sur une passe bleue. Les trois entraînements ont des positions, orientations et chronologies différentes, et des réponses bleues comme rouges. Aucun titre ni consigne initiale ne dévoile si le contact a lieu.

## Animation et architecture
Chronologie déterministe et fonctions pures : coordonnées locales transformées rigidement vers la zone du terrain ; le ballon, les mains, les joueurs et la caméra utilisent la même transformation. Préparation de passe, pas d’approche du défenseur, jambes articulées et pieds posés pendant les appuis. Les bras gardent leur solveur et leurs longueurs. Le défenseur arrive sur ses appuis avant le contact et regarde le ballon. La tentative manquée garde une distance visible entre doigts et ballon, sans déviation artificielle. Le ralenti peut arrêter l’interception manquée pour l’expliquer.

## Progression
Six défis successifs, 18 étoiles au maximum. Les badges Premier coup d’œil et Le bon signal restent liés aux trois défis initiaux : conserver les récompenses déjà acquises. La fin du chapitre exige les six décisions. Même stockage et lecture défensive des anciennes sauvegardes. Gestes guidés inchangés pendant cette itération.

## Vérification
Tests : règles du dernier toucher, sauvegarde ancienne et nouveaux IDs, déblocages, projection mobile, contact des doigts, absence de contact dans la tentative manquée, longueurs des jambes, appuis fixes, continuité et regard. Chrome : 320 et 390 px, trois nouvelles scènes, arrêt au toucher, ralenti, gestes, navigation et récompenses. Vérifier sources officielles et compilation sous le chemin Pages. Publier la mise à jour sur le site déjà autorisé après revue et vérification.
