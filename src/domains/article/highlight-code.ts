import {
  createHighlighterCore,
  type HighlighterCore,
  type LanguageRegistration,
} from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import githubDark from "shiki/themes/github-dark.mjs";
import githubLight from "shiki/themes/github-light.mjs";

type LanguageModule = {
  default: LanguageRegistration[];
};

const languageAliases: Record<string, string> = {
  "c++": "cpp",
  dockerfile: "docker",
  golang: "go",
  gql: "graphql",
  gradle: "groovy",
  html: "html",
  js: "javascript",
  jsx: "jsx",
  kt: "kotlin",
  makefile: "make",
  md: "markdown",
  protobuf: "proto",
  py: "python",
  rs: "rust",
  sh: "bash",
  shell: "bash",
  svg: "html",
  ts: "typescript",
  tsx: "tsx",
  xml: "xml",
  yml: "yaml",
  zsh: "bash",
};

const languageLoaders: Record<string, () => Promise<LanguageModule>> = {
  bash: () => import("shiki/langs/bash.mjs"),
  c: () => import("shiki/langs/c.mjs"),
  cpp: () => import("shiki/langs/cpp.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
  docker: () => import("shiki/langs/docker.mjs"),
  go: () => import("shiki/langs/go.mjs"),
  graphql: () => import("shiki/langs/graphql.mjs"),
  groovy: () => import("shiki/langs/groovy.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  http: () => import("shiki/langs/http.mjs"),
  ini: () => import("shiki/langs/ini.mjs"),
  java: () => import("shiki/langs/java.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  jsonc: () => import("shiki/langs/jsonc.mjs"),
  jsx: () => import("shiki/langs/jsx.mjs"),
  kotlin: () => import("shiki/langs/kotlin.mjs"),
  make: () => import("shiki/langs/make.mjs"),
  markdown: () => import("shiki/langs/markdown.mjs"),
  mdx: () => import("shiki/langs/mdx.mjs"),
  nginx: () => import("shiki/langs/nginx.mjs"),
  properties: () => import("shiki/langs/properties.mjs"),
  proto: () => import("shiki/langs/proto.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  rust: () => import("shiki/langs/rust.mjs"),
  scss: () => import("shiki/langs/scss.mjs"),
  shellscript: () => import("shiki/langs/shellscript.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  toml: () => import("shiki/langs/toml.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  xml: () => import("shiki/langs/xml.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
};

let highlighterPromise: Promise<HighlighterCore> | null = null;
const loadedLanguages = new Set<string>();
const pendingLanguageLoads = new Map<string, Promise<void>>();

const getHighlighter = (): Promise<HighlighterCore> => {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      engine: createJavaScriptRegexEngine(),
      langs: [],
      themes: [githubLight, githubDark],
    });
  }

  return highlighterPromise;
};

const ensureLanguageLoaded = async (
  highlighter: HighlighterCore,
  language: string,
): Promise<void> => {
  if (loadedLanguages.has(language)) {
    return;
  }

  const existing = pendingLanguageLoads.get(language);
  if (existing) {
    return existing;
  }

  const loader = languageLoaders[language];
  if (!loader) {
    return;
  }

  const pending = (async () => {
    const langModule = await loader();
    await highlighter.loadLanguage(langModule.default);
    loadedLanguages.add(language);
  })().finally(() => {
    pendingLanguageLoads.delete(language);
  });

  pendingLanguageLoads.set(language, pending);
  return pending;
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

export const highlightCode = async (code: string, language?: string | null) => {
  const normalizedLanguage = normalizeLanguage(language);

  if (!(normalizedLanguage in languageLoaders)) {
    return `<pre class="shiki shiki-themes"><code>${escapeHtml(code)}</code></pre>`;
  }

  const highlighter = await getHighlighter();
  await ensureLanguageLoaded(highlighter, normalizedLanguage);

  return highlighter.codeToHtml(code, {
    lang: normalizedLanguage,
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
  });
};
