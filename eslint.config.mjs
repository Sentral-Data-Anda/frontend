import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

// Selector `no-restricted-syntax` disimpan sebagai konstanta karena di flat
// config blok yang lebih akhir MENGGANTIKAN seluruh array opsi aturan yang sama
// dari blok sebelumnya — tidak menggabungkan. Blok kelas di bawah menulis ulang
// aturan ini untuk src/app dan src/features; tanpa spread NAMING_SELECTORS di
// sana, aturan useBoolean/is* diam-diam mati di persis dua folder yang paling
// banyak menulis state.
const NAMING_SELECTORS = [
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
];

// Kelas Tailwind hanya diperiksa di tempat yang pasti kelas: atribut
// className (termasuk cabang ternary dan argumen cn() di dalamnya) dan
// argumen cn() di mana pun.
const inClassName = (valueRegex) =>
  `:matches(JSXAttribute[name.name='className'], CallExpression[callee.name=/^(cn|cva)$/]) :matches(Literal[value=${valueRegex}], TemplateElement[value.raw=${valueRegex}])`;

// Skala teks milik token di globals.css (12px < lg, 14px hanya ≥ lg, min
// 10px). Ukuran bawaan Tailwind dan `text-[…px]` tidak mengikuti breakpoint
// itu, jadi ditolak di SELURUH src/ — termasuk components/ui, bukan hanya
// layar. Ikut di-spread di blok kelas di bawah (jebakan flat config).
const TEXT_SIZE_SELECTORS = [
  {
    selector: inClassName(
      String.raw`/(^|[\s:])text-(xs|2xs|sm|base|lg|[2-9]?xl|\[(length:)?[\d.]+(px|r?em)\])($|[\s\x2f])/`,
    ),
    message:
      "Ukuran teks hanya lewat token: text-title (12→14px di lg), text-body (12px), text-caption (10px). Maks 14px, dan hanya di desktop.",
  },
];

const CLASS_SELECTORS = [
  {
    selector: inClassName(
      String.raw`/(^|[\s:])((min-|max-)?(sm|md|lg|xl|2xl)|@[^\s:]*|min-\[[^\]]*\]|max-\[[^\]]*\]):/`,
    ),
    message:
      "Layar bebas breakpoint. Media query (md:/lg:) hanya di src/components/layout, container query (@container/@md:) hanya di src/components/common.",
  },
  {
    selector: inClassName(
      String.raw`/(^|[\s:])-?(bg|text|border(-[trblxyse])?|ring|fill|stroke)-(white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)($|[\s\x2f-])/`,
    ),
    message:
      "Warna palet mentah dilarang di layar. Pakai token tema (bg-primary, text-muted-foreground, border-input, ...).",
  },
  {
    selector: inClassName(
      String.raw`/(^|[\s:])-?(bg|text|border(-[trblxyse])?|ring|fill|stroke)-(primary|secondary|warning|success|failed)-[0-9]/`,
    ),
    message:
      "Langkah skala brand (primary-50 … failed-900) hanya dipakai lewat token semantik di globals.css, bukan langsung di layar.",
  },
  {
    selector: inClassName(String.raw`/(^|[\s:])font-(bold|extrabold|black)($|\s)/`),
    message:
      "Roboto hanya dimuat 400–600. Pakai font-semibold, bukan bobot 700 ke atas.",
  },
  {
    selector: inClassName(String.raw`/-\[#/`),
    message: "Warna arbitrer -[#...] dilarang di layar. Pakai token tema.",
  },
  {
    selector: inClassName(String.raw`/(^|[\s:])dark:/`),
    message:
      "dark: dilarang di layar. Tema gelap (kalau dinyalakan) diurus token di globals.css.",
  },
];

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
        ...NAMING_SELECTORS,
        ...TEXT_SIZE_SELECTORS,
      ],
    },
  },

  // Layar bebas breakpoint dan bebas warna mentah. Keputusan responsif hidup
  // di components/layout (media query) dan components/common (container
  // query); warna hidup di token globals.css. Begitu satu layar menulis
  // `lg:grid-cols-2` atau `text-gray-500` sendiri, tata letak dan palet mulai
  // bercabang per layar.
  //
  // Dikecualikan: (auth)/layout.tsx — rumah seluruh keputusan responsif layar
  // login — dan dev/** yang bukan layar produk. Keduanya tetap terkena aturan
  // penamaan dari blok di atas karena blok ini tidak berlaku untuk mereka.
  {
    files: [
      "src/app/**/*.{ts,tsx}",
      "src/features/**/*.{ts,tsx}",
      "tests/fixtures/eslint-kelas.tsx",
    ],
    ignores: ["src/app/(auth)/layout.tsx", "src/app/dev/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...NAMING_SELECTORS,
        ...TEXT_SIZE_SELECTORS,
        ...CLASS_SELECTORS,
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
