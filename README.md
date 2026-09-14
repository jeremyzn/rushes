# Rushes

Rushes est une application desktop **Windows 10/11 + macOS** pour télécharger des médias **Twitch, YouTube et TikTok**, construite avec Tauri 2, Rust, React 19, TypeScript, **Tailwind CSS 4**, **Radix UI** et des composants locaux de style shadcn/ui.

## Expérience utilisateur

L’utilisateur final n’a **aucune commande à lancer** et n’installe ni Python, ni Node, ni Homebrew :

- **macOS Apple Silicon** : ouvre le `.dmg`, glisse Rushes dans Applications, puis lance une fois `xattr -cr /Applications/Rushes.app` dans le Terminal (voir « macOS : app non signée » ci-dessous).
- **Windows 10/11 x64** : double-clique le setup `.exe` (NSIS) ou le `.msi`, puis lance Rushes depuis le menu Démarrer.
- L’installateur Windows récupère le runtime WebView2 auprès de Microsoft s’il manque, ce qui allège le téléchargement d’environ 130 Mo. Windows 11 et les Windows 10 à jour l’ont déjà, l’étape est alors invisible. Une connexion est requise pendant l’installation.

Les fichiers installables sont générés automatiquement par `.github/workflows/build-release.yml` lors d’un tag `v*` ou d’un lancement manuel du workflow GitHub Actions.

## Interface

- React 19 + TypeScript
- Tailwind CSS 4 (`@tailwindcss/vite`)
- Radix UI via le package unifié `radix-ui`
- configuration `components.json` compatible shadcn/ui
- composants locaux : Button, Card, Dialog, Select, Switch, Tooltip, Progress, Skeleton, Badge…
- Motion pour les transitions / micro-animations
- Sonner pour les toasts
- thèmes Sombre / Clair / Système
- option Réduire les animations
- skeleton loaders, shimmer, spinners, progression animée
- notifications système de fin de téléchargement
- presse-papiers, ouverture Finder/Explorateur, états d’erreur lisibles

## Plateformes

`yt-dlp` est le moteur universel principal :

- Twitch : VOD, clips et directs pris en charge par l’extracteur disponible
- YouTube : vidéos, Shorts et directs
- TikTok : vidéos / formats courts
- analyse automatique des métadonnées et qualités réellement disponibles
- meilleure qualité ou résolution plafonnée
- vidéo ou audio seul
- M4A / MP3 / FLAC
- MP4 / MKV / automatique
- reprise des téléchargements partiels
- profils de fragments parallèles : 2 / 4 / 6 / 8 / 10
- file d’attente avec 1 à 4 téléchargements simultanés
- pause, reprise, annulation, retry
- cookies navigateur optionnels pour **les propres sessions de l’utilisateur** quand une plateforme exige une connexion

Rushes n’implémente aucun contournement DRM.

## Moteurs embarqués

Le build place directement dans l’application :

- `yt-dlp` : moteur principal Twitch / YouTube / TikTok
- `Deno` : runtime JavaScript requis par yt-dlp pour YouTube. Il n'est pas embarqué, car il pèse 77 Mo pour ce seul usage. L'application le propose au premier lancement et le bouton reste disponible dans Réglages > Moteurs.
- `FFmpeg` + `FFprobe` : fusion audio/vidéo, remux, extraction audio

Au premier lancement, ces moteurs sont copiés dans le dossier de données de Rushes. L’utilisateur n’a rien à installer.

### Mises à jour des moteurs

- yt-dlp : mise à jour intégrée (`-U`)
- FFmpeg : remplacé avec les nouvelles versions de Rushes
- Deno : installé et supprimé à la demande depuis les réglages
- option de vérification automatique des moteurs lorsque la connexion est disponible

## Hors connexion

Rushes vérifie périodiquement la connectivité, sans arrêter brutalement un processus uniquement à cause de ce test. Quand Internet est indisponible :

- bannière Hors ligne
- analyse de nouvelles URL désactivée
- nouveau téléchargement désactivé
- mises à jour désactivées
- Historique et Bibliothèque restent accessibles
- bouton Réessayer / reconnexion
- les téléchargements partiels peuvent être repris ensuite grâce à la continuation yt-dlp

Les erreurs connues (contenu privé, connexion requise, média supprimé, URL non supportée, réseau indisponible) sont traduites en messages utilisateur au lieu d’exposer seulement la sortie brute du moteur.

## Mises à jour de Rushes

Rushes utilise l’updater officiel Tauri, actif uniquement dans les builds de release (`tauri.release.conf.json`). En `tauri:dev`, la vérification est désactivée et l’interface l’indique.

- vérification au démarrage optionnelle
- vérification manuelle
- release notes
- progression du téléchargement de la mise à jour
- signature cryptographique obligatoire
- installation + redémarrage

Le workflow de release génère `src-tauri/tauri.release.conf.json` à partir du dépôt et de `TAURI_UPDATER_PUBLIC_KEY`. La clé publique peut être exposée ; la clé **privée** de signature ne doit jamais être committée.

Secrets GitHub nécessaires pour publier des mises à jour signées :

- `TAURI_UPDATER_PUBLIC_KEY`
- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

### macOS : app non signée

Les builds macOS ne sont **ni signés ni notarisés** : cela demanderait un compte Apple Developer payant (99 €/an). L’updater Tauri reste signé (minisign), indépendant d’Apple.

Conséquence au premier lancement, macOS affiche « Rushes est endommagé et ne peut pas être ouvert ». L’application n’est pas endommagée : macOS pose un attribut de quarantaine sur tout fichier venu d’Internet et refuse d’exécuter un programme non signé qui le porte.

Le remède, une seule fois après avoir glissé l’app dans Applications :

```bash
xattr -cr /Applications/Rushes.app
```

Le clic droit puis **Ouvrir** ne suffit pas ici. Ce contournement ne vaut que pour le message « développeur non identifié », qui concerne les applications signées mais non notariées.

Pour supprimer complètement cet avertissement, il faudrait ajouter les secrets Developer ID / notarisation (`APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`) et les réinjecter dans l’étape `tauri-action` du workflow.

Le workflow utilise deux runners :

- macOS Apple Silicon → `.app` + `.dmg`
- Windows 10/11 x64 → `.exe` NSIS + `.msi`

## Interface

L’application est construite autour d’un **header flottant unique** en verre, posé au-dessus de la zone de défilement : marque, navigation par pills, barre de collage d’URL, état réseau, courbe de débit et fil de progression de la file. Il n’y a pas de barre latérale, toute la largeur revient aux médias.

Le système reste **strictement achromatique** : la couleur est réservée à l’état d’un téléchargement (terminé, en pause, en erreur). Le relief vient de la matière (verre, grain, ombres portées, halos du fond), jamais d’une teinte décorative.

### Règles du système

- **Élévation en trois paliers** (`--e1`, `--e2`, `--e3`), jamais plus : au-delà, un simple trait hiérarchise mieux qu’une ombre supplémentaire. Les valeurs sont retaillées en thème sombre, où une ombre porte moins.
- **Matière tactile** (`.tactile`) sur les commandes qui ont une face : reflet en haut, ombre en bas, creux à l’appui. Les variantes plates (`ghost`, `outline`) en sont exclues : elles n’ont pas de face à éclairer.
- **Élévation au survol** (`.lift`) réservée aux surfaces cliquables dans leur entier ; ailleurs, un décalage de fond ou de bordure suffit.
- **Une seule courbe de sortie** (`--ease-out`), 150 à 250 ms pour un retour d’interface, 400 à 600 ms pour une transition de mise en page. Jamais de linéaire.
- **Icônes au poids de la typo** : Lucide dessine sur une grille de 24 px avec un trait de 2 px ; affiché à 13 à 16 px, c’est plus gras que le Geist qui l’accompagne. Tout le jeu est ramené à 1,75 (`STROKE` dans `src/components/icons.tsx`). Les logos de marque, qui sont des glyphes pleins, y échappent.
- **Squelettes aux dimensions du contenu final**, pour qu’aucune mise en page ne saute à l’arrivée des données.

## Développement

Les commandes ci-dessous concernent **le développeur**, jamais l’utilisateur final.

```bash
npm install
npm run dev        # interface seule, dans le navigateur, téléchargements simulés
npm run tauri:dev  # application complète, moteurs réels
```

### Mode navigateur

Hors de l’application de bureau, `src/lib/backend.ts` bascule automatiquement sur `src/lib/mock-backend.ts` : un backend de démonstration qui rejoue la même API que les commandes Rust. Analyse d’URL, files d’attente, débits, pauses, erreurs et bibliothèque y sont simulés à partir du temps écoulé, avec des vignettes générées en SVG, la démo fonctionne donc hors ligne. Le header affiche alors un badge **Démo**.

Cela permet de dessiner et d’éprouver toute l’interface sans recompiler le binaire Rust. Les capacités réellement natives (sélecteur de dossier, ouverture Finder/Explorateur, notifications système, mises à jour signées) passent par `src/lib/platform.ts`, qui retombe sur l’équivalent web le plus proche ou renvoie une erreur lisible.

Les moteurs sont préparés automatiquement par `scripts/prepare-engines.mjs` avant les builds Tauri.

## Limites

Le support effectif d’une URL dépend aussi de la plateforme et de la version de yt-dlp. YouTube, Twitch et TikTok changent régulièrement leurs formats/API internes : c’est précisément pour cela que yt-dlp peut être mis à jour indépendamment de l’application.

## Licence

Rushes est un **logiciel propriétaire**, voir [LICENSE](LICENSE). Tous droits réservés.

Le binaire officiel est libre d'usage, gratuitement, à titre personnel ou professionnel. En revanche, la copie du code source, la modification, le fork, la redistribution et le rebranding sont interdits sans autorisation écrite. Ce dépôt n'est ni libre ni open source, malgré la visibilité de son code.

Les composants tiers embarqués ou téléchargés (FFmpeg, yt-dlp, Deno, Tauri, React…) restent soumis à leurs propres licences, listées dans [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md). FFmpeg y est redistribué sous GPL-3.0-or-later : son code source correspondant est référencé dans ce fichier, comme la licence l'exige.

## Utilisation responsable

Télécharge uniquement des médias que tu possèdes ou que tu as le droit / l’autorisation légale d’enregistrer.
