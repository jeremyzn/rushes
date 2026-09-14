# Journal des versions

Les sections de ce fichier alimentent les notes publiées sur GitHub et la fenêtre
de mise à jour de l'application. Le titre de chaque version doit rester au format
`## 1.2.3`, c'est lui qui sert de repère à `scripts/release-notes.mjs`.

## 1.0.2

### Allègement

- Le moteur JavaScript requis par YouTube n'est plus embarqué. L'application le propose au premier lancement et le télécharge à la demande, ce qui retire 77 Mo de l'installation. Il reste installable et supprimable depuis Réglages > Moteurs.
- L'installateur macOS passe de 119 à 82 Mo, celui de Windows de 290 à 261 Mo.

### macOS

- Les bundles sont désormais signés en ad-hoc. macOS devrait afficher « développeur non identifié », que l'on contourne d'un clic droit puis Ouvrir, au lieu de « Rushes est endommagé » qui imposait une commande dans le Terminal.
- Les instructions de première ouverture ont été corrigées : le clic droit ne suffisait pas pour le message « endommagé ».

### Corrections

- La préparation des moteurs réessaie jusqu'à cinq fois lorsque GitHub répond une erreur passagère, ce qui faisait échouer des installations.

## 1.0.1

### Corrections

- Ouvrir un fichier téléchargé ou son dossier échouait avec « Not allowed to open path ». Deux causes : le sélecteur de fichiers n'autorisait aucun chemin, et la destination annoncée par le moteur était relative.
- Le lancement recopiait près de 190 Mo de moteurs à chaque démarrage, retardant d'autant l'ouverture de la fenêtre. La copie n'a plus lieu que lors d'une installation ou d'une mise à jour.
- La fenêtre s'ouvrait sur un aplat noir avant l'affichage de l'interface.
- Les barres de progression forçaient un recalcul de mise en page à chaque image. Elles s'animent maintenant sur le processeur graphique.

### Changements

- Les fichiers `.info.json` ne sont plus déposés à côté des médias, et la miniature ne l'est plus par défaut.
- Vimeo, Dailymotion, X, Instagram, Reddit et les autres sites gérés par yt-dlp apparaissent enfin sous le champ d'adresse. Ils fonctionnaient déjà.
- La recherche de mise à jour se répète toutes les six heures, au lieu du seul démarrage.
- Le sélecteur de cookies affiche les logos des navigateurs.
- Rushes passe sous licence propriétaire ZenoX HQ, avec les notices des composants tiers.

## 1.0.0

Première version publique. Téléchargement de vidéos, VOD, clips, directs et pistes audio depuis Twitch, YouTube, TikTok et les autres sites gérés par yt-dlp, avec choix de la qualité, reprise, moteurs embarqués et mises à jour signées.
