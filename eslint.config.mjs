import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "next-env.d.ts",
  ]),

  {
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "prefer-const": "error",
      "no-console": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "import/order": [
        "error",
        {
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always",
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
        },
      ],
    },
  },

  // Konvensi penamaan SADA. Dua aturan pertama menegakkan yang paling sering
  // dilanggar dan paling mudah dicek mekanis; sisanya (nama fungsi diawali
  // "on", urutan blok state/function/useEffect/return) ditegakkan saat review,
  // karena menulis plugin ESLint sendiri untuk itu jauh lebih mahal daripada
  // manfaatnya.
  {
    // Termasuk tests/** supaya tests/fixtures/eslint-konvensi.tsx (fixture
    // pembukti aturan ini di Step 3) benar-benar ikut diperiksa. Glob asli di
    // brief ("src/**") tidak pernah cocok dengan path tests/fixtures/**,
    // sehingga verifikasi --no-inline-config di path itu tidak akan
    // menyalakan aturan apa pun — false positive yang lebih buruk daripada
    // tanpa aturan sama sekali.
    files: ["src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          // ":not([typeArguments])" mencegah selector ini ikut menyala pada
          // useState<boolean>(true|false) — kasus itu sudah ditangani pesan
          // "bukan useState<boolean>" di bawah. Tanpa pengecualian ini,
          // useState<boolean>(true) memicu DUA pesan sekaligus untuk satu
          // pelanggaran yang sama.
          selector:
            "CallExpression[callee.name='useState']:not([typeArguments]) > Literal[value=true], CallExpression[callee.name='useState']:not([typeArguments]) > Literal[value=false]",
          message:
            "State boolean wajib memakai useBoolean() dari @/hooks/use-boolean, bukan useState.",
        },
        {
          selector:
            "CallExpression[callee.name='useState'][typeArguments.params.0.type='TSBooleanKeyword']",
          message:
            "State boolean wajib memakai useBoolean() dari @/hooks/use-boolean, bukan useState<boolean>.",
        },
        {
          selector:
            "VariableDeclarator[init.callee.name='useBoolean'][id.name!=/^is[A-Z0-9]/]",
          message:
            "Nama state boolean wajib diawali \"is\". \"has\", \"should\", \"can\", dan \"show\" tidak dikecualikan.",
        },
      ],
    },
  },

  // Layar hanya boleh memakai wrapper, bukan primitif shadcn langsung. Begitu
  // satu layar merangkai primitif sendiri, warna dan jaraknya ikut tersalin ke
  // layar itu, dan dua halaman sejenis pelan-pelan berbeda tanpa ada yang
  // sadar. Yang boleh menyentuh primitif hanya components/common dan
  // components/layout.
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/ui/*"],
              message:
                "Layar memakai wrapper di @/components/common, bukan primitif shadcn langsung.",
            },
          ],
        },
      ],
    },
  },

  // Matikan rule formatting yang bentrok dengan Prettier — letakkan paling akhir.
  eslintConfigPrettier,
]);

export default eslintConfig;
