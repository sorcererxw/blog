import { bundledLanguages, createHighlighter, createJavaScriptRegexEngine } from "shiki";

const languageAliases: Record<string, string> = {
  html: "html",
  js: "javascript",
  jsx: "jsx",
  sh: "bash",
  shell: "bash",
  svg: "html",
  ts: "typescript",
  tsx: "tsx",
  xml: "xml",
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const normalizeLanguage = (language?: string | null) => {
  if (!language) {
    return "text";
  }

  const normalized = language.trim().toLowerCase();
  return languageAliases[normalized] ?? normalized;
};

const isBundledLanguage = (language: string) => language in bundledLanguages;

export const highlightCode = async (code: string, language?: string | null) => {
  const normalizedLanguage = normalizeLanguage(language);

  if (!isBundledLanguage(normalizedLanguage)) {
    return `<pre class="shiki shiki-themes"><code>${escapeHtml(code)}</code></pre>`;
  }

  const highlighter = await createHighlighter({
    engine: createJavaScriptRegexEngine(),
    langs: [normalizedLanguage],
    themes: ["github-light", "github-dark"],
  });

  return highlighter.codeToHtml(code, {
    lang: normalizedLanguage,
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
  });
};
