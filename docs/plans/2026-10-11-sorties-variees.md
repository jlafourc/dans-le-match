# Sorties : variété pédagogique

## Demande
Le retour utilisateur signale la redite des défis 4 et 5. Remplacer leur contenu par de vrais mécanismes nouveaux ; préserver les trois initiations, le défi 6 et les résultats déjà gagnés.

## Choix
Retenir deux situations écrites : réception par un joueur avec un pied sur la ligne (ballon mort au contact, même s’il est encore en l’air à l’intérieur), et deux contacts successifs (passe rouge, déviation bleue puis toucher rouge n°4). Les variations de décor seules sont insuffisantes ; l’aléatoire demanderait davantage de validations. La tentative manquée reste utile comme troisième distinction.

## Conception
Un troisième joueur reçoit la passe. Pose et appuis déterministes, contact réellement lisible. La scène sur ligne fige la réception après le contact ; aucun rebond extérieur fictif. La scène à deux contacts fournit deux temps et deux légendes, chacun visible au ralenti. Le cadrage sur ligne montre les mains et les pieds. Préserver les IDs de sauvegarde et les badges ; la nouvelle version d’un défi n’efface pas les anciennes étoiles.

## Plan d’implémentation
1. Écrire les tests de règles et de chronologie échouants : sortie sur joueur à hauteur de main, deux contacts ordonnés avec responsable final correct, sauvegardes conservées.
2. Ajouter trajectoires spécifiques et poses du receveur. Tests de portée réelle, contact de chaque joueur, absence de contact prématuré, pied effectivement sur ligne et regard. Implémenter jambes et orientation à partir du modèle existant.
3. Adapter caméra, arrêt au premier toucher, arrêt aux appuis, légendes exactes et explications de règles (23.1.1,23.1.2,23.2.1,23.2.2). Tests projection mobile et continuité ; vérifier chaque scène à 320/390 px dans contexte QA isolé.
4. Revue du code, tests complets et build Pages, synchronisation workspace, commit/intégration/publication sur site déjà autorisé, vérifier l’adresse publique.
