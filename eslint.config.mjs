import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    /**
     * `src/core/api/contracts/**` is VENDORED, not authored here: it is copied
     * verbatim from the handoff (`web-handoff/api/{types,endpoints,mock-contracts}.ts`),
     * which is generated from the swagger. `types.ts` alone is 3 684 lines, and
     * its `any`s are in the deliberately-tolerant coercion helpers that parse a
     * reverse-engineered API.
     *
     * Linting it would mean either rewriting a generated file — which the next
     * regeneration throws away — or scattering disable comments through it. The
     * code that consumes these types is linted normally, and `tsc` still checks
     * this folder, so nothing here goes unverified.
     */
    files: ["src/core/api/contracts/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
    },
  },
]);

export default eslintConfig;
