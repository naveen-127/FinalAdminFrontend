import React from "react";
import katex from "katex";

/**
 * Drop-in replacement for parseTextWithFormulas / parseLineWithFormatting /
 * parseLineContent in AdminRight.jsx.
 *
 * Fixes:
 *  1. LaTeX that lost its backslash-escape upstream (\right -> CR + "ight",
 *     \frac -> FF + "rac", \times -> TAB + "imes", \neq -> LF + "eq" ...).
 *     These made KaTeX fail and print the raw source in red.
 *  2. Tamil (or any non-Latin) text sitting inside $...$ — wrapped in \text{}
 *     so it renders in the normal font instead of broken math glyphs.
 *  3. Stray / unbalanced ** markers showing literally (e.g. "** அதிக சுமைகளை").
 *  4. "__DOLLAR__" placeholder being eaten by the __italic__ parser.
 *  5. Math is extracted BEFORE splitting lines, so a formula that contains a
 *     line break no longer breaks the $...$ pairing.
 *  6. Supports $$..$$, \[..\], \(..\) as well as $..$.
 */

console.log("[renderMathText] v3 loaded");

// private-use characters used as placeholders (can never appear in real text)
const M_OPEN = "";
const M_CLOSE = "";
const ESC_DOLLAR = "";

// ---------------------------------------------------------------------------
// 1. Repair LaTeX whose "\x" escape was turned into a control character
// ---------------------------------------------------------------------------
export const repairLatex = (s) =>
  s
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\\r") //   \right \rho \rightarrow \rangle
    .replace(/\f/g, "\\f") //   \frac \forall \flat
    .replace(/\x07/g, "\\a") // \alpha \approx \angle
    .replace(/\x0B/g, "\\v") // \vec \varepsilon \vee
    .replace(/\x08/g, "\\b") // \beta \bar \begin \binom \boldsymbol
    // TAB is legitimate whitespace, so only restore it before known commands
    .replace(
      /\t(?=(?:imes|ext|extbf|extit|extrm|heta|au|an|anh|ilde|riangle|op|hinspace|o\b)(?![a-z]))/g,
      "\\t"
    )
    // LF inside a formula: restore \neq \nabla \newline ..., else make it a space
    .replace(/\n(?=(?:eq|abla|ewline|leq|geq|ot|u\b|i\b)(?![a-z]))/g, "\\n")
    .replace(/\n/g, " ")
    // Backslash AND control char both lost (the stored text just says "ight)"):
    // restore the commonly damaged commands when they appear bare.
    .replace(/(?<![\\A-Za-z])ight(?=\s*(?:[)\]|.]|\\[}|]|\\rangle|\\rbrace|arrow))/g, "\\right")
    .replace(/(?<![\\A-Za-z])rac(?=\s*\{)/g, "\\frac")
    .replace(/(?<![\\A-Za-z])imes(?![A-Za-z])/g, "\\times");

// ---------------------------------------------------------------------------
// 2. Tamil (and other Indic / non-Latin letters) inside math -> \text{...}
// ---------------------------------------------------------------------------
const NON_LATIN = "\\u0B80-\\u0BFF"; // Tamil block. Add more ranges if needed.
// Things that must be left alone: \text{..}-style commands, \begin{..}/\end{..},
// commands that take a word argument, and every plain \command name.
const PROTECT =
  "\\\\(?:text|textbf|textit|textrm|mbox|mathrm|operatorname)\\s*\\{[^{}]*\\}" +
  "|\\\\(?:begin|end|color|textcolor|colorbox|href|url|tag|label|ref|mathbb|mathcal|mathfrak|mathscr|mathsf|mathtt|mathbf|mathit|boldsymbol|bm|hspace|vspace|rule|class|style|size)\\s*\\{[^{}]*\\}" +
  "|\\\\[A-Za-z]+";
const WRAP_RE = new RegExp(
  `(${PROTECT})` +
    // Tamil run (letters + spaces between them)
    `|([${NON_LATIN}][${NON_LATIN}\\s.,]*[${NON_LATIN}]|[${NON_LATIN}])` +
    // English word of 4+ letters (Pascal, Newton, second, metre ...) -> upright text.
    // 1-3 letter variables/units (ML, T, Pa, kg, mol) are left as normal math.
    `|((?<![A-Za-z])[A-Za-z]{4,}(?![A-Za-z]))`,
  "g"
);
const wrapNonLatin = (latex) =>
  latex
    .replace(/\\(?:mathit|mathnormal)\s*\{([A-Za-z]{4,})\}/g, "\\text{$1}")
    .replace(WRAP_RE, (m, protectedPart, tamil, word) =>
    protectedPart ? protectedPart : `\\text{${tamil || word}}`
  );

const renderMath = (latexRaw, displayMode, key) => {
  const latex = wrapNonLatin(repairLatex(latexRaw)).trim();
  try {
    const html = katex.renderToString(latex, {
      throwOnError: false,
      strict: false, // no console spam for Unicode in \text
      output: "html",
      displayMode,
    });
    return (
      <span
        key={key}
        className={displayMode ? "katex-block" : undefined}
        style={displayMode ? { display: "block", textAlign: "center", margin: "6px 0" } : undefined}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch (e) {
    return (
      <span key={key} style={{ color: "red" }}>
        {latexRaw}
      </span>
    );
  }
};

// ---------------------------------------------------------------------------
// 3. Pull math out of the text, leaving placeholders
// ---------------------------------------------------------------------------
const extractMath = (text) => {
  const store = [];
  const put = (latex, display) => {
    store.push({ latex, display });
    return `${M_OPEN}${store.length - 1}${M_CLOSE}`;
  };

  let out = text
    // $$ ... $$
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, l) => put(l, true))
    // \[ ... \]
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, l) => put(l, true))
    // \( ... \)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, l) => put(l, false))
    // $ ... $   (may contain a single line break, but never a blank line)
    .replace(/\$((?:[^$\n]|\n(?!\s*\n))+?)\$/g, (_, l) => put(l, false));

  return { out, store };
};

// ---------------------------------------------------------------------------
// 4. Inline formatting: **bold**, __italic__, math placeholders
// ---------------------------------------------------------------------------
const INLINE_SRC = "(\\*\\*[\\s\\S]+?\\*\\*)|(__[\\s\\S]+?__)|(" + M_OPEN + "\\d+" + M_CLOSE + ")";

const renderInline = (str, store, keyBase) => {
  const nodes = [];
  let last = 0;
  let m;
  // fresh regex per call: a shared /g regex has shared lastIndex, which the
  // recursive calls below would reset (infinite loop)
  const INLINE_RE = new RegExp(INLINE_SRC, "g");

  const pushText = (t, k) => {
    // drop dangling ** markers and restore escaped dollars
    const clean = t.replace(/\*\*/g, "").replaceAll(ESC_DOLLAR, "$");
    if (clean) nodes.push(<React.Fragment key={k}>{clean}</React.Fragment>);
  };

  while ((m = INLINE_RE.exec(str)) !== null) {
    if (m.index > last) pushText(str.slice(last, m.index), `${keyBase}-t${last}`);
    const k = `${keyBase}-${m.index}`;

    if (m[1]) {
      nodes.push(<strong key={k}>{renderInline(m[1].slice(2, -2), store, k)}</strong>);
    } else if (m[2]) {
      nodes.push(<em key={k}>{renderInline(m[2].slice(2, -2), store, k)}</em>);
    } else if (m[3]) {
      const idx = parseInt(m[3].slice(1, -1), 10);
      const { latex, display } = store[idx];
      nodes.push(renderMath(latex, display, k));
    }
    last = m.index + m[0].length;
  }
  if (last < str.length) pushText(str.slice(last), `${keyBase}-t${last}`);
  return nodes;
};

// ---------------------------------------------------------------------------
// 5. Public API – same name/signature you already call everywhere
// ---------------------------------------------------------------------------
export const parseTextWithFormulas = (texts) => {
  if (!texts) return null;
  if (typeof texts !== "string") texts = String(texts);

  // "\\frac" (double escaped) -> "\frac", "\\$" -> "\$"
  let text = texts.replace(/\\\\(?=[A-Za-z$()])/g, "\\");
  // escaped dollar -> placeholder so it is not treated as a math delimiter
  text = text.replace(/\\\$/g, ESC_DOLLAR);

  const { out, store } = extractMath(text);

  return out.split("\n").map((line, i) => {
    if (line.trim() === "") return <br key={i} />;

    const bullet = line.trim().match(/^[*-]\s+(.*)$/);
    if (bullet) {
      return (
        <div key={i} style={{ marginLeft: 20, marginBottom: 5, display: "flex" }}>
          <span style={{ marginRight: 8 }}>•</span>
          <span>{renderInline(bullet[1], store, `l${i}`)}</span>
        </div>
      );
    }

    const num = line.match(/^(\d+)\.\s+(.*)$/);
    if (num) {
      return (
        <div key={i} style={{ marginLeft: 20, marginBottom: 5, display: "flex" }}>
          <span style={{ marginRight: 8 }}>{num[1]}.</span>
          <span>{renderInline(num[2], store, `l${i}`)}</span>
        </div>
      );
    }

    const head = line.match(/^#{1,6}\s+(.*)$/);
    if (head) {
      return (
        <div key={i} style={{ fontWeight: "bold", fontSize: 18, margin: "10px 0 5px 0" }}>
          {renderInline(head[1], store, `l${i}`)}
        </div>
      );
    }

    return (
      <div key={i} style={{ marginBottom: 5 }}>
        {renderInline(line, store, `l${i}`)}
      </div>
    );
  });
};

export default parseTextWithFormulas;