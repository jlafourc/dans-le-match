# Fluidité de la démonstration des gestes

Retour utilisateur : l’enchaînement des gestes paraît haché.

## Diagnostic et correction

La démonstration redescendait au repos entre les deux signaux. Le changement de signal remplaçait instantanément la forme et l’orientation des mains ; le rendu était limité à 20 images par seconde.

Conserver une pause lisible sur chaque signal, puis une transition continue de 0,95 seconde. Vers la droite, le bras déployé décrit un arc depuis le signal d’arrêt. Vers la gauche, le bras droit descend pendant que le gauche monte. Interpoler l’orientation de chaque poignet et le repli des doigts. Revenir progressivement au repos avant la reprise. Utiliser requestAnimationFrame sans limitation à 20 images par seconde. Conserver les poses statiques pour la préférence de mouvements réduits.

## Vérification

Deux tests de régression échouent avant correction : absence de retour au repos entre les signaux et continuité des poignets/doigts. Vérifier ensuite toute la suite, le rendu mobile, la compilation et la publication sur le site existant. Les gestes et récompenses restent ceux du parcours existant.

Le test du rendu SVG a révélé un pivot trop rapide du coude droit lors du signal vers la gauche (environ 15,6 unités par image). La descente suit maintenant la trajectoire courbe du signal d’arrêt ; un test vérifie aussi les coudes du SVG à 60 images/s.
