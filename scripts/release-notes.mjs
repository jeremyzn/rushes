/*
   Compose les notes de version publiées sur GitHub.

   Le corps vient de CHANGELOG.md, section de la version courante, suivi des
   consignes d'installation. Ces notes servent deux fois : sur la page de
   release, et dans la fenêtre de mise à jour de l'application, qui les reçoit
   par latest.json et les rend en Markdown.

   Écrit `body` dans GITHUB_OUTPUT quand la variable existe, sur la sortie
   standard sinon, ce qui permet de vérifier le rendu en local.
   */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");

// La section court du titre de la version jusqu'au titre suivant de même niveau.
const section = new RegExp(`^## ${version.replace(/\./g, "\\.")}\\s*$([\\s\\S]*?)(?=^## |\\s*$(?![\\s\\S]))`, "m");
const found = section.exec(changelog);
if (!found) throw new Error(`CHANGELOG.md ne contient aucune section "## ${version}"`);

const changes = found[1].trim();
if (!changes) throw new Error(`La section "## ${version}" de CHANGELOG.md est vide`);

const repository = process.env.GITHUB_REPOSITORY || "jeremyzn/rushes";
const body = `## Nouveautés

${changes}

## Installation

**Windows 10/11 x64** : télécharge \`Rushes_x64-setup.exe\` (ou le \`.msi\`), lance-le, puis ouvre Rushes depuis le menu Démarrer. Une connexion est requise pendant l'installation, le temps de vérifier le runtime WebView2.

**macOS Apple Silicon** : ouvre \`Rushes_aarch64.dmg\`, accepte la licence, puis glisse Rushes dans Applications.

> **Première ouverture sur macOS.** L'application est signée en ad-hoc mais pas notariée par Apple, ce qui exigerait un compte développeur payant. macOS affiche donc un avertissement au premier lancement. Fais un **clic droit sur Rushes.app puis Ouvrir**, et confirme. C'est à faire une seule fois.
>
> Si macOS annonce que l'application est endommagée, retire l'attribut de quarantaine :
> \`\`\`
> xattr -cr /Applications/Rushes.app
> \`\`\`

Les mises à jour suivantes sont automatiques et signées.

## Licence

Rushes est un logiciel propriétaire. © 2026 ZenoX HQ, tous droits réservés. L'usage des binaires officiels est gratuit et le restera. En revanche, la copie du code, le fork, la redistribution et le rebranding sont interdits. Voir [LICENSE](https://github.com/${repository}/blob/main/LICENSE) et les [notices tierces](https://github.com/${repository}/blob/main/THIRD-PARTY-NOTICES.md).
`;

if (process.env.GITHUB_OUTPUT) {
  // Délimiteur improbable dans le corps, exigé par GitHub pour les valeurs multilignes.
  const marker = "RUSHES_RELEASE_NOTES_EOF";
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `body<<${marker}\n${body}\n${marker}\n`);
  console.log(`[notes] version ${version}, ${changes.split("\n").length} lignes de changements`);
} else {
  process.stdout.write(body);
}
