# Gestes des sorties — Implementation Plan

**Goal:** Ajouter la reconnaissance des signaux officiels aux trois défis de sortie sans perdre les scores existants.

**Architecture:** Deux questions après la bonne décision : arrêt du chronomètre, puis direction du jeu. Animations SVG procédurales de face avec paume ouverte, poing et index distincts. Une démonstration séquentielle termine l’apprentissage. Validation et badge de gestuelle indépendants des étoiles de décision, sauvegardés séparément.

**Tech Stack:** JavaScript, SVG, CSS, Vite, tests Node, Chrome DevTools.

## 1. Règles et sauvegarde

Créer `src/signals.js` et `tests/signals.test.js`. Tester d’abord les deux bonnes réponses, les distracteurs, la lecture défensive des sauvegardes, le badge et les poses du chronomètre et de direction. Vérifier l’échec, implémenter, puis `npm test`. Référence : FFBB 2026 annexe A, pages77–78.

## 2. Animations

Créer `src/referee-signals.js`, rendu SVG partagé pour choix et démonstration. Proportions humaines, bras articulés, distinction paume/poing/index, transitions continues. Une boucle commune à20fps ; interrompre au changement d’écran et respecter la préférence de mouvements réduits. Vérifier les poses et les doigts dans Chrome mobile.

## 3. Parcours

Modifier `src/main.js` et `src/style.css`. Après réponse correcte : bouton « Apprendre les gestes », question arrêt, retour pédagogique avec nouvel essai si erreur, question direction avec schéma des paniers, démonstration, puis défi suivant. Préserver les étoiles et sauvegardes existantes. Afficher validation gestes sur cartes et récompense distincte après les trois défis. Revoir sources et fin du chapitre.

## 4. Vérification et documentation

Tester dans Chrome à390px et320px : réponse erronée et correcte, gestes erronés et corrects, démonstration/relecture, prochain défi, retour accueil, sauvegarde et badges. `npm test`, `npm run build`. Mettre README et document de conception à jour. Pas de commit : le répertoire ne fournit pas de dépôt Git utilisable.
