# Sorties de balle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Livrer un prototype jouable de trois scènes de sorties de balle sur navigateur mobile.

**Architecture:** Three.js dessine une scène déterministe alimentée par une chronologie commune à la lecture et au ralenti. Un module indépendant gère les règles, les résultats et la sauvegarde. Une interface HTML/CSS affiche le chapitre, les questions et les récompenses.

**Tech Stack:** JavaScript ESM, Three.js, Vite, Node test runner, Chrome DevTools.

---

### Task 1 : Décisions et progression

Files: `tests/game.test.js`, `src/game.js`, `src/scenarios.js`.

1. Écrire des tests de règles (dernier toucher, vraie sortie), de progression (pas de cumul, meilleur résultat, déblocage), et de sauvegarde corrompue.
2. Lancer `npm test` ; constater l'échec dû aux modules absents.
3. Implémenter les données et fonctions pures ; relancer `npm test`, attendu : tous les tests passent.

### Task 2 : Scène 3D

Files: `src/court.js`, `src/scenarios.js`.

1. Construire un terrain dimensionné 15 × 28 m avec lignes, paniers et décor de gymnase.
2. Construire des joueurs articulés aux proportions humaines et des bras dirigés vers le ballon aux moments de passe/toucher.
3. Animer des trajectoires paramétrées ; partager le même échantillonnage entre lecture normale et ralenti.
4. Placer une caméra à hauteur d'arbitre avec une vue dégagée ; gérer les dimensions mobiles et l'indisponibilité WebGL.

### Task 3 : Parcours jouable

Files: `index.html`, `src/main.js`, `src/style.css`.

1. Afficher la carte du chapitre, les trois missions et l'état sauvegardé.
2. Implémenter observer → répondre → explication → ralenti/nouvel essai → mission suivante.
3. Ajouter les étoiles, le badge, les sources dans l'interface et la persistance locale défensive.
4. Vérifier le parcours réel dans Chrome, en mobile et desktop ; corriger les problèmes observés.

### Task 4 : Livrable et vérification

Files: `README.md`, `docs/sources.md`.

1. Documenter lancement, limites du prototype et sources réellement consultées.
2. Exécuter `npm test` et `npm run build`.
3. Vérifier lecture, erreur, ralenti, trois réussites, badge et rechargement sans erreur JavaScript.
4. Laisser le serveur local disponible et fournir l'adresse. Aucun déploiement distant n'est nécessaire pour ce prototype de workspace.

Pas de commit ni worktree : ce workspace ne contient pas de dépôt Git utilisable et son dossier `.git` est protégé. Exécuter dans le dossier fourni par l'utilisateur.
