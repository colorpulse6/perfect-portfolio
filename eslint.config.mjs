// Flat ESLint config (ESLint 9). Lints the TS/TSX app code in src/ with the
// typescript-eslint recommended set + the React Hooks rules. Build output,
// config files, tests, and the legacy plain-JS components are ignored. Known
// existing debt (explicit `any`, unused vars, empty catches) is surfaced as
// warnings rather than hard errors so `npm run lint` is usable today and can be
// tightened over time.
import js from "@eslint/js"
import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"
import globals from "globals"

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "public/**",
      ".cache/**",
      "**/*.js",
      "**/*.cjs",
      "**/*.mjs",
      "**/*.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-unused-expressions": "warn",
      "no-empty": ["warn", { allowEmptyCatch: true }],
    },
  }
)
