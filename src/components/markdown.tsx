/*
   Rendu Markdown minimal pour les notes de version.

   Les notes viennent de l'API GitHub : les afficher brutes laissait voir les
   `##`, les `**` et les backticks. Plutôt qu'une dépendance de plusieurs
   dizaines de kilooctets, ce module couvre le sous-ensemble que nos notes
   emploient réellement, et construit des éléments React sans jamais passer par
   `dangerouslySetInnerHTML` : le contenu distant ne peut donc pas injecter de
   balise.
   */
import type { ReactNode } from "react";

// Les notes s'affichent dans un encadré `--raised` : le code prend le fond de la
// toile pour ne pas s'y confondre.
const PRE = "mono overflow-x-auto rounded-[9px] border border-[var(--line)] bg-[var(--canvas)] p-2.5 text-[11.5px] text-[var(--ink)]";

/**
 * Ne garde que les changements d'une note de version. Les releases publiées
 * jusqu'ici ajoutent installation et licence après une section « Nouveautés » :
 * inutile dans la fenêtre de mise à jour.
 */
export function releaseHighlights(body: string): string {
  const text = body.replace(/\r\n/g, "\n");
  const news = /^##\s+Nouveautés\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/m.exec(text);
  return (news ? news[1] : text).trim();
}

/** Gras, code et liens à l'intérieur d'une ligne. */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  return text.split(pattern).filter(Boolean).map((piece, index) => {
    const key = `${keyPrefix}-${index}`;
    if (piece.startsWith("**") && piece.endsWith("**")) {
      return <strong key={key} className="font-semibold text-[var(--ink)]">{piece.slice(2, -2)}</strong>;
    }
    if (piece.startsWith("`") && piece.endsWith("`")) {
      return <code key={key} className="mono rounded-[5px] bg-[var(--canvas)] px-1 py-px text-[.92em] text-[var(--ink)]">{piece.slice(1, -1)}</code>;
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(piece);
    // Le lien reste du texte : ouvrir un navigateur depuis une note distante
    // n'apporte rien ici, et le souligné suffit à signaler la référence.
    if (link) return <span key={key} className="underline decoration-[var(--line-strong)] underline-offset-2">{link[1]}</span>;
    return <span key={key}>{piece}</span>;
  });
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let quote: string[] = [];
  let code: string[] | null = null;

  const flushList = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="ml-4 list-disc space-y-1 marker:text-[var(--faint)]">
        {list.map((item, index) => <li key={index}>{inline(item, `li-${blocks.length}-${index}`)}</li>)}
      </ul>,
    );
    list = [];
  };
  const flushQuote = () => {
    if (!quote.length) return;
    blocks.push(
      <blockquote key={`bq-${blocks.length}`} className="space-y-1 border-l-2 border-[var(--line-strong)] pl-3 text-[var(--muted)]">
        {quote.map((item, index) => <p key={index}>{inline(item, `bq-${blocks.length}-${index}`)}</p>)}
      </blockquote>,
    );
    quote = [];
  };
  const flushAll = () => { flushList(); flushQuote(); };

  // Vrai quand le bloc de code s'est ouvert dans une citation (`> ````) : ses
  // lignes portent alors le préfixe `>`, qu'il faut retirer.
  let codeQuoted = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    const fence = /^(>\s?)?\s*```/.exec(line);

    if (fence && (!code || !!fence[1] === codeQuoted)) {
      if (code) {
        blocks.push(
          <pre key={`pre-${blocks.length}`} className={PRE}>
            {code.join("\n")}
          </pre>,
        );
        code = null;
      } else { flushAll(); code = []; codeQuoted = !!fence[1]; }
      continue;
    }
    if (code) { code.push(codeQuoted ? raw.replace(/^>\s?/, "") : raw); continue; }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      blocks.push(
        <p key={`h-${blocks.length}`} className={level <= 2
          ? "pt-1 text-[13.5px] font-semibold text-[var(--ink)]"
          : "pt-1 text-[12.5px] font-semibold text-[var(--muted)]"}>
          {inline(heading[2], `h-${blocks.length}`)}
        </p>,
      );
      continue;
    }

    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) { flushQuote(); list.push(bullet[1]); continue; }

    const quoted = /^>\s?(.*)$/.exec(line);
    if (quoted) { flushList(); if (quoted[1].trim()) quote.push(quoted[1]); continue; }

    if (!line.trim()) { flushAll(); continue; }

    flushAll();
    blocks.push(<p key={`p-${blocks.length}`}>{inline(line, `p-${blocks.length}`)}</p>);
  }
  flushAll();
  if (code?.length) {
    blocks.push(
      <pre key={`pre-${blocks.length}`} className={PRE}>
        {code.join("\n")}
      </pre>,
    );
  }

  return <div className={className}>{blocks}</div>;
}
