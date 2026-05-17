import js from "@eslint/js";
import tseslint from "typescript-eslint";

const allowedCssModuleImports = new Set([
  "./article-detail-view.module.css",
  "./intro.module.css",
  "./masonry-feed.module.css",
]);

const localRules = {
  rules: {
    "no-unapproved-css-module-imports": {
      meta: {
        type: "problem",
        messages: {
          unapproved:
            "Prefer inline Tailwind utilities. CSS modules are only allowed for documented rich text, generated markup, or animation exceptions.",
        },
        schema: [],
      },
      create(context) {
        return {
          ImportDeclaration(node) {
            const source = node.source.value;

            if (
              typeof source === "string" &&
              source.endsWith(".module.css") &&
              !allowedCssModuleImports.has(source)
            ) {
              context.report({ node: node.source, messageId: "unapproved" });
            }
          },
        };
      },
    },
    "require-cn-for-complex-classname": {
      meta: {
        type: "problem",
        messages: {
          useCn:
            "Use cn(...) for conditional, template, or concatenated className expressions so twMerge handles Tailwind conflicts.",
        },
        schema: [],
      },
      create(context) {
        function isCnCall(expression) {
          return (
            expression?.type === "CallExpression" &&
            expression.callee.type === "Identifier" &&
            expression.callee.name === "cn"
          );
        }

        function isComplexClassExpression(expression) {
          if (!expression || isCnCall(expression)) {
            return false;
          }

          return [
            "ArrayExpression",
            "BinaryExpression",
            "ConditionalExpression",
            "LogicalExpression",
            "TemplateLiteral",
          ].includes(expression.type);
        }

        return {
          JSXAttribute(node) {
            if (node.name.name !== "className" || node.value?.type !== "JSXExpressionContainer") {
              return;
            }

            if (isComplexClassExpression(node.value.expression)) {
              context.report({ node: node.value, messageId: "useCn" });
            }
          },
        };
      },
    },
    "require-next-link-and-image": {
      meta: {
        type: "problem",
        messages: {
          noRawAnchor: "Use NextLink from next/link instead of a raw JSX <a> element.",
          noRawImage: "Use NextImage from next/image or the shared ResponsiveRemoteImage wrapper instead of a raw JSX <img> element.",
        },
        schema: [],
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (node.name.type !== "JSXIdentifier") {
              return;
            }

            if (node.name.name === "a") {
              context.report({ node: node.name, messageId: "noRawAnchor" });
            }

            if (node.name.name === "img") {
              context.report({ node: node.name, messageId: "noRawImage" });
            }
          },
        };
      },
    },
  },
};

const browserGlobals = {
  AbortSignal: "readonly",
  BodyInit: "readonly",
  clearTimeout: "readonly",
  console: "readonly",
  crypto: "readonly",
  document: "readonly",
  Element: "readonly",
  Event: "readonly",
  fetch: "readonly",
  Headers: "readonly",
  HTMLAnchorElement: "readonly",
  HTMLImageElement: "readonly",
  ImageData: "readonly",
  localStorage: "readonly",
  location: "readonly",
  process: "readonly",
  Request: "readonly",
  RequestInit: "readonly",
  Response: "readonly",
  setTimeout: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  window: "readonly",
};

const eslintConfig = tseslint.config(
  {
    ignores: [
      ".astro/**",
      ".next/**",
      ".open-next/**",
      ".wrangler/**",
      "build/**",
      "dist/**",
      "node_modules/**",
      "out/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: browserGlobals,
    },
    plugins: {
      local: localRules,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "local/no-unapproved-css-module-imports": "error",
      "local/require-cn-for-complex-classname": "error",
      "local/require-next-link-and-image": "error",
    },
  },
);

export default eslintConfig;
