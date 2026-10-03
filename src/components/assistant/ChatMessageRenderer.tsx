import React from 'react';

interface ChatMessageRendererProps {
  content: string;
  highlightQuery?: string;
  className?: string;
}

/**
 * Checks if a string contains Arabic/Urdu script Unicode characters.
 */
export function isUrduText(text?: string | null): boolean {
  if (!text) return false;
  return /[\u0600-\u06FF]/.test(text);
}

/**
 * Highlights any occurrences of the query inside a plain text chunk.
 * Wraps Latin terms and numbers in <bdi> to preserve proper bidirectional flow in Urdu sentences.
 */
function renderHighlightedPlain(text: string, query?: string, isUrduContext = false): React.ReactNode {
  if (!text) return null;

  if (query && query.trim()) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          className="bg-amber-300/80 dark:bg-amber-400/40 text-inherit rounded-xs px-0.5 font-bold shadow-2xs"
        >
          {part}
        </mark>
      ) : isUrduContext && /[a-zA-Z0-9]/.test(part) ? (
        <bdi key={i}>{part}</bdi>
      ) : (
        part
      )
    );
  }

  // If in Urdu context and segment contains Latin alphanumeric words/dosages (e.g. "Panadol 500mg"), isolate them
  if (isUrduContext && /[a-zA-Z0-9]/.test(text)) {
    const tokenRegex = /([a-zA-Z0-9_./+-]+(?:\s+[a-zA-Z0-9_./+-]+)*)/g;
    const parts = text.split(tokenRegex);
    return parts.map((chunk, cIdx) =>
      /[a-zA-Z0-9]/.test(chunk) ? <bdi key={cIdx}>{chunk}</bdi> : chunk
    );
  }

  return text;
}

/**
 * Parses inline formatting: **bold**, *italic*, `code`, and markdown links [text](url).
 */
function renderInlineFormatting(text: string, query?: string, isUrduContext = false): React.ReactNode {
  if (!text) return null;

  // Regex to split by inline tokens: links [label](url), **bold**, *italic*, `code`
  const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*.*?\*\*|\*[^*]+?\*|`[^`]+?`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    // Markdown link: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch && linkMatch[1] && linkMatch[2]) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline font-semibold hover:opacity-80 transition-opacity"
        >
          {renderInlineFormatting(linkMatch[1], query, isUrduContext)}
        </a>
      );
    }

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={idx} className="font-bold text-inherit">
          {renderInlineFormatting(inner, query, isUrduContext)}
        </strong>
      );
    }

    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={idx} className="italic opacity-90">
          {renderInlineFormatting(inner, query, isUrduContext)}
        </em>
      );
    }

    // Inline Code: `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded-md bg-surface-sunken border border-line font-mono text-xs text-accent font-semibold"
        >
          {renderHighlightedPlain(inner, query, false)}
        </code>
      );
    }

    return renderHighlightedPlain(part, query, isUrduContext);
  });
}

/**
 * Renders chat messages with structured markdown-like blocks:
 * Headings (###), Bullet lists (- / *), Numbered lists (1.), Tables (| ... |), and Paragraphs.
 * Includes native Bidirectional (BiDi) Right-to-Left (RTL) formatting and line-height expansion for Urdu.
 */
export function ChatMessageRenderer({
  content,
  highlightQuery,
  className = '',
}: ChatMessageRendererProps) {
  if (!content) return null;

  const rawLines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let currentListItems: React.ReactNode[] = [];
  let currentListType: 'ul' | 'ol' | null = null;
  let currentListIsUrdu = false;
  let currentTableRows: string[][] = [];

  const flushList = () => {
    if (currentListItems.length > 0 && currentListType) {
      const listDir = currentListIsUrdu ? 'rtl' : 'auto';
      const listClasses = `list-outside ps-5 space-y-1 my-2 text-xs sm:text-sm ${
        currentListIsUrdu ? 'leading-[2.05] text-right font-sans' : 'leading-relaxed'
      }`;

      if (currentListType === 'ul') {
        blocks.push(
          <ul
            key={`ul-${blocks.length}`}
            dir={listDir}
            className={`list-disc ${listClasses}`}
          >
            {currentListItems}
          </ul>
        );
      } else {
        blocks.push(
          <ol
            key={`ol-${blocks.length}`}
            dir={listDir}
            className={`list-decimal ${listClasses}`}
          >
            {currentListItems}
          </ol>
        );
      }
      currentListItems = [];
      currentListType = null;
      currentListIsUrdu = false;
    }
  };

  const flushTable = () => {
    if (currentTableRows.length > 0) {
      const header = currentTableRows[0] || [];
      const body = currentTableRows.slice(1).filter((r) => !r.every((c) => /^[-:\s]+$/.test(c)));

      blocks.push(
        <div key={`table-${blocks.length}`} className="my-2.5 overflow-x-auto rounded-xl border border-line bg-surface-sunken/60 shadow-2xs">
          <table className="w-full text-xs text-left border-collapse" dir="auto">
            {header.length > 0 && (
              <thead>
                <tr className="border-b border-line bg-surface-raised/80 text-content-muted font-bold">
                  {header.map((col, cIdx) => (
                    <th key={cIdx} className="px-3 py-2 text-2xs uppercase tracking-wider">
                      {renderInlineFormatting(col.trim(), highlightQuery, isUrduText(col))}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-line/60">
              {body.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-surface-hover/40 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 text-content">
                      {renderInlineFormatting(cell.trim(), highlightQuery, isUrduText(cell))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTableRows = [];
    }
  };

  rawLines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // Table rows: | Col 1 | Col 2 |
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
      flushList();
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      currentTableRows.push(cells);
      return;
    } else {
      flushTable();
    }

    // Empty lines act as paragraph separators
    if (!trimmed) {
      flushList();
      return;
    }

    const isUrdu = isUrduText(trimmed);
    const textDir = isUrdu ? 'rtl' : 'auto';
    const urduLineHeight = isUrdu ? 'leading-[2.05] text-right font-urdu' : 'leading-relaxed';

    // Heading 3: ### Heading
    if (trimmed.startsWith('### ')) {
      flushList();
      const title = trimmed.replace(/^###\s+/, '');
      blocks.push(
        <h4
          key={`h3-${lineIdx}`}
          dir={textDir}
          className={`font-bold text-xs sm:text-sm tracking-tight mt-2.5 mb-1 ${urduLineHeight}`}
        >
          {renderInlineFormatting(title, highlightQuery, isUrdu)}
        </h4>
      );
      return;
    }

    // Heading 2: ## Heading
    if (trimmed.startsWith('## ')) {
      flushList();
      const title = trimmed.replace(/^##\s+/, '');
      blocks.push(
        <h3
          key={`h2-${lineIdx}`}
          dir={textDir}
          className={`font-extrabold text-sm sm:text-base tracking-tight mt-3 mb-1.5 ${urduLineHeight}`}
        >
          {renderInlineFormatting(title, highlightQuery, isUrdu)}
        </h3>
      );
      return;
    }

    // Heading 1: # Heading
    if (trimmed.startsWith('# ')) {
      flushList();
      const title = trimmed.replace(/^#\s+/, '');
      blocks.push(
        <h2
          key={`h1-${lineIdx}`}
          dir={textDir}
          className={`font-black text-base sm:text-lg tracking-tight mt-3.5 mb-2 ${urduLineHeight}`}
        >
          {renderInlineFormatting(title, highlightQuery, isUrdu)}
        </h2>
      );
      return;
    }

    // Bullet List Item: - item, * item, • item
    const bulletMatch = trimmed.match(/^([-*•])\s+(.+)$/);
    if (bulletMatch && bulletMatch[2]) {
      if (currentListType && currentListType !== 'ul') {
        flushList();
      }
      currentListType = 'ul';
      if (isUrdu) currentListIsUrdu = true;
      currentListItems.push(
        <li
          key={`li-${lineIdx}`}
          dir={textDir}
          className={urduLineHeight}
        >
          {renderInlineFormatting(bulletMatch[2], highlightQuery, isUrdu)}
        </li>
      );
      return;
    }

    // Numbered List Item: 1. item, 2. item
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (numMatch && numMatch[2]) {
      if (currentListType && currentListType !== 'ol') {
        flushList();
      }
      currentListType = 'ol';
      if (isUrdu) currentListIsUrdu = true;
      currentListItems.push(
        <li
          key={`ol-li-${lineIdx}`}
          dir={textDir}
          className={urduLineHeight}
        >
          {renderInlineFormatting(numMatch[2], highlightQuery, isUrdu)}
        </li>
      );
      return;
    }

    // Regular paragraph / text line
    flushList();
    blocks.push(
      <p
        key={`p-${lineIdx}`}
        dir={textDir}
        className={`text-xs sm:text-sm my-1 ${urduLineHeight}`}
      >
        {renderInlineFormatting(line, highlightQuery, isUrdu)}
      </p>
    );
  });

  flushList();
  flushTable();

  return <div className={`space-y-1 ${className}`}>{blocks}</div>;
}
