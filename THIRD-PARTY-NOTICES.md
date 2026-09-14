# Notices tierces

Rushes est un logiciel propriétaire (voir [LICENSE](LICENSE)). Il **intègre et
redistribue** les composants tiers ci-dessous, soumis à leurs propres licences.
Ces licences prévalent sur la licence de Rushes pour ce qui concerne ces
composants.

---

## Moteurs embarqués dans l'application

Ces binaires sont copiés dans le bundle applicatif (`resources/engines/`) et
distribués avec chaque installateur. Rushes les invoque en **processus séparés**
et n'est lié à aucun d'eux au sens de l'édition de liens.

### FFmpeg et FFprobe — GPL-3.0-or-later

- Source amont : <https://ffmpeg.org>
- Build redistribué : [`ffmpeg-static`](https://github.com/eugeneware/ffmpeg-static)
  (`GPL-3.0-or-later`) et [`ffprobe-static`](https://github.com/joshwnj/ffprobe-static)
  (paquet npm sous MIT, mais le binaire `ffprobe` qu'il fournit est issu de
  FFmpeg et reste soumis à la licence de FFmpeg)

**Obligation de distribution.** Les binaires FFmpeg redistribués sont sous
GPL-3.0-or-later. Conformément à l'article 6 de la GPL, le code source
correspondant doit être mis à disposition de tout destinataire de
l'installateur. Ce code source est disponible auprès du fournisseur du build :

- <https://github.com/eugeneware/ffmpeg-static/releases>
- <https://github.com/joshwnj/ffprobe-static>
- Texte de la licence : <https://www.gnu.org/licenses/gpl-3.0.txt>

La GPL s'applique à ces binaires, **pas** à Rushes : Rushes les exécute en
sous-processus, sans liaison statique ni dynamique, et ne constitue donc pas une
œuvre dérivée de FFmpeg.

### yt-dlp — The Unlicense (domaine public)

- Source : <https://github.com/yt-dlp/yt-dlp>
- Licence : <https://github.com/yt-dlp/yt-dlp/blob/master/LICENSE>
- Binaire officiel redistribué, aucune obligation d'attribution, conservée ici
  par correction.

### Deno — MIT

- Source : <https://github.com/denoland/deno>
- Licence : <https://github.com/denoland/deno/blob/main/LICENSE.md>
- Copyright (c) 2018-2026 the Deno authors.
- La licence MIT impose la conservation de la notice de copyright lors de la
  redistribution du binaire ; c'est l'objet de la présente mention.

---

## Bibliothèques applicatives

Utilisées à la compilation, incorporées dans l'application.

| Composant | Licence |
| --- | --- |
| [Tauri](https://github.com/tauri-apps/tauri) (et plugins `dialog`, `fs`, `notification`, `opener`, `os`, `process`, `updater`) | MIT OU Apache-2.0 |
| [React](https://github.com/facebook/react) et React DOM | MIT |
| [Radix UI](https://github.com/radix-ui/primitives) | MIT |
| [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) | MIT |
| [Motion](https://github.com/motiondivision/motion) | MIT |
| [Sonner](https://github.com/emilkowalski/sonner) | MIT |
| [class-variance-authority](https://github.com/joe-bell/cva), [clsx](https://github.com/lukeed/clsx), [tailwind-merge](https://github.com/dcastil/tailwind-merge) | MIT |
| [Lucide](https://github.com/lucide-icons/lucide) (icônes) | ISC |
| [Simple Icons](https://github.com/simple-icons/simple-icons) | CC0-1.0 |
| [Geist / Geist Mono](https://github.com/vercel/geist-font) (polices) | OFL-1.1 |
| Dépendances Rust (crates) | MIT / Apache-2.0 / BSD, voir `src-tauri/Cargo.lock` |

Les composants de style shadcn/ui présents dans `src/components/ui/` sont
dérivés de [shadcn/ui](https://github.com/shadcn-ui/ui) (MIT).

---

## Marques citées

Twitch, YouTube et TikTok sont des marques de leurs titulaires respectifs.
Rushes n'est ni affilié à, ni approuvé, ni sponsorisé par ces sociétés. Ces noms
ne sont utilisés qu'à des fins descriptives, pour désigner les services avec
lesquels l'application est compatible.
