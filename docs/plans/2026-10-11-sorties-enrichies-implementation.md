# Sorties enrichies — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Six situations lisibles et des joueurs aux appuis naturels, avec progression existante conservée.

**Architecture:** Fonctions pures de mouvement et transformations rigides par scénario. Court applique ces poses sans modifier la chronologie du ballon. Les compteurs sont dérivés des scénarios, les badges historiques de l’initiation.

**Tech Stack:** JavaScript, Three.js, Vite, node:test, GitHub Pages.

## 1. Situations et sauvegarde
Fichiers : src/scenarios.js, src/game.js, src/signals.js ; tests/game.test.js, tests/scenarios.test.js.
Écrire tests échouants : six IDs uniques, couleurs équilibrées, badges sur trois initiaux, anciens résultats conservés et quatrième défi ouvert. Ajouter trois scènes et transformation point/yaw. Exécuter node --test tests/game.test.js tests/scenarios.test.js ; résultat attendu PASS.

## 2. Appuis et contact
Fichiers : src/movement.js, src/court.js ; tests/movement.test.js, tests/arms.test.js, tests/gaze.test.js, tests/hands.test.js.
Écrire tests échouants de pas, pieds plantés, jambe articulée, mouvement continu, regard et toucher/manqué. Implémenter préparation ballon et corps, pas d’approche déterministe, jambes IK. Généraliser tests de contact à toutes les zones et vérifier absence de contact lors de l’essai manqué. node --test tests/*.test.js : PASS.

## 3. Caméra et interface
Fichiers : src/presentation.js, src/main.js, src/style.css ; tests/presentation.test.js.
Adapter tests projection aux poses transformées et ajouter tentative manquée/caméra ralenti. Appliquer caméra transformée, moment Interception distinct du Dernier toucher. Dériver compteurs six défis/18 étoiles, distinguer initiation et entraînement, conserver textes et conditions de badges historiques. Vérifier 320/390 px dans Chrome, scènes normales et arrêts au contact.

## 4. Revue et publication
Mettre README à jour. npm test puis npm run build -- --base /dans-le-match/. Revue code et corrections. Commit sur branche, intégration après validations, push main sur dépôt déjà autorisé. Attendre workflow Pages réussi et ouvrir version publique mobile.
