import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";
import boundaries from "eslint-plugin-boundaries";

// Selector `no-restricted-syntax` disimpan sebagai konstanta karena di flat
// config blok yang lebih akhir MENGGANTIKAN seluruh array opsi aturan yang sama
// dari blok sebelumnya — tidak menggabungkan. Blok kelas di bawah menulis ulang
// aturan ini untuk src/app dan src/features; tanpa spread NAMING_SELECTORS di
// sana, aturan useBoolean/is* diam-diam mati di persis dua folder yang paling
// banyak menulis state.
const NAMING_SELECTORS = [
  {
    selector:
      "JSXAttribute > JSXExpressionContainer > :matches(ArrowFunctionExpression, FunctionExpression) > BlockStatement[body.length>2]",
    message:
      "Handler inline lebih dari 2 statement dipindah ke const onX = … sebelum return.",
  },
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
      "VariableDeclarator[init.callee.name='useState'][id.elements.0.name=/^is[A-Z0-9]/]",
    message:
      "State boolean wajib memakai useBoolean() dari @/hooks/use-boolean, bukan const [is…] = useState(…).",
  },
  {
    selector:
      "VariableDeclarator[init.callee.name='useBoolean'][id.name!=/^is[A-Z0-9]/]",
    message:
      'Nama state boolean wajib diawali "is". "has", "should", "can", dan "show" tidak dikecualikan.',
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

const NO_UI_PRIMITIVE_IMPORT = {
  regex: "^@/components/ui(/.*)?$",
  message:
    "Layar memakai pintu di @/components/common (mis. common/control, common/display), bukan primitif shadcn di components/ui.",
};

// Dari luar folder, impor lewat barrel index.ts (CODE_STYLE.md WAJIB-8).
const DEEP_IMPORT = {
  regex:
    "^@/components/(common/[^/]+/|ui/|layout/(?!app-shell$)).+|^@/features/((auth|beranda|domain|observability|pencarian|pwa)/(?!ui$|get-session$|refresh$).+|(?!(auth|beranda|domain|observability|pencarian|pwa)/)[^/]+/[^/]+/(?!(list|form)$).+)",
  message:
    "Impor lewat barrel folder-nya, mis. @/components/common/list; rute memakai sub-barrel layarnya, mis. @/features/kejemaatan/daftar-jemaat/list.",
};

const NO_COMMON_ROOT_IMPORT = {
  regex:
    "^@/components/common/(?!(brand|control|dashboard|display|feedback|form|list|navigation|overlay)$)[^/]+$",
  message:
    "Komponen bersama masuk ke salah satu kelompok di components/common (frontend-structure.md §4.1).",
};

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
    selector: inClassName(
      String.raw`/(^|[\s:])font-(bold|extrabold|black)($|\s)/`,
    ),
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
      "import/no-duplicates": ["error", { "prefer-inline": true }],
      "@typescript-eslint/no-empty-object-type": [
        "error",
        { allowInterfaces: "with-single-extends" },
      ],
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

  // Impor menyebut berkasnya, bukan barrel (§6). Barrel menyembunyikan letak
  // berkas — persis keluhan yang memicu dokumen struktur.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [DEEP_IMPORT, NO_COMMON_ROOT_IMPORT] },
      ],
    },
  },

  // Layar hanya boleh memakai wrapper, bukan primitif shadcn langsung. Begitu
  // satu layar merangkai primitif sendiri, warna dan jaraknya ikut tersalin ke
  // layar itu, dan dua halaman sejenis pelan-pelan berbeda tanpa ada yang
  // sadar. Yang boleh menyentuh primitif hanya components/common dan
  // components/layout — `features/` juga layar, jadi ikut dilarang (dulu hanya
  // `app/`, dan empat berkas fitur sempat mengimpor ui/button dan ui/badge).
  {
    files: ["src/{app,features,lib,hooks,config,types}/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            NO_UI_PRIMITIVE_IMPORT,
            DEEP_IMPORT,
            NO_COMMON_ROOT_IMPORT,
          ],
        },
      ],
    },
  },

  // Arah impor antar-lapisan (docs/design/frontend-structure.md §1 dan §9).
  // Tanpa penegakan, konvensi ini luntur di layar ke-20, bukan ke-61: satu
  // fitur mengimpor isi fitur lain, lalu keduanya tidak bisa dipindah atau
  // dihapus tanpa membaca seluruh repo.
  //
  //   app      → feature, shared
  //   feature  → shared, fitur yang SAMA, dan features/auth (sesi & izin)
  //   shared   → shared
  //   tidak ada yang boleh mengimpor app
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      // Titik masuk runtime Next di akar `src` (`proxy.ts`,
      // `instrumentation*.ts`) tidak termasuk: keduanya bukan lapisan, dan
      // plugin ini mengklasifikasi folder, bukan berkas lepas.
      "boundaries/include": [
        "src/{app,features,components,lib,hooks,config,types}/**/*.{ts,tsx}",
      ],
      // Hanya EMPAT berkas auth yang boleh disentuh lintas lapisan, dan
      // keempatnya memang "sesi": penyedia sesi, pembaca sesi di server, hook
      // izin, dan kontrak sesinya sendiri (`types.ts`, setelah tipe menu
      // pindah ke `types/menu.ts`). `refresh.ts` — rotasi token — tidak ikut,
      // dan itulah yang membuat penyempitan ini ada artinya.
      "boundaries/files": [
        {
          category: "auth-session",
          pattern:
            "src/features/auth/{index,use-menu-access,session-provider,get-session,types}.{ts,tsx}",
        },
      ],
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**" },
        { type: "feature", pattern: "src/features/*", capture: ["feature"] },
        {
          type: "shared",
          pattern: "src/{components,lib,hooks,config,types}/**",
        },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message:
            "Arah impor: app → feature/shared, feature → shared + fitur yang sama + features/auth, shared → shared. Lihat docs/design/frontend-structure.md §1.",
          policies: [
            {
              from: { element: { type: "app" } },
              allow: {
                to: { element: { types: { anyOf: ["feature", "shared"] } } },
              },
            },
            {
              from: { element: { type: "feature" } },
              allow: { to: { element: { type: "shared" } } },
            },
            // Fitur hanya boleh menyentuh dirinya sendiri.
            {
              from: { element: { type: "feature" } },
              allow: {
                to: {
                  element: {
                    type: "feature",
                    captured: {
                      feature: "{{ from.element.captured.feature }}",
                    },
                  },
                },
              },
            },
            // Sesi dan izin dipakai semua lapisan — pengecualian sadar (§7),
            // tapi hanya untuk ketiga berkasnya, bukan seluruh features/auth.
            // Tanpa penyempitan ini, fitur mana pun boleh mengimpor
            // `features/auth/refresh.ts` tanpa satu pun alarm.
            { allow: { to: { file: { categories: ["auth-session"] } } } },
            {
              from: { element: { type: "shared" } },
              allow: { to: { element: { type: "shared" } } },
            },
          ],
        },
      ],
    },
  },

  // page.tsx hanya metadata + satu komponen layar (§5). Begitu logika mulai
  // menumpuk di rute, ia tidak bisa diuji dan tidak bisa dipakai ulang.
  //
  // Komentar dan baris kosong tidak dihitung: batas ini soal banyaknya KODE
  // di rute, dan menghitung komentar justru menghukum berkas yang menjelaskan
  // keputusan rutenya (mis. `dynamicParams` di `[domain]/page.tsx`).
  // `dev/**` dikecualikan seperti pada aturan kelas: bukan layar produk.
  {
    files: ["src/app/**/page.tsx"],
    ignores: ["src/app/dev/**"],
    rules: {
      "max-lines": [
        "error",
        { max: 30, skipComments: true, skipBlankLines: true },
      ],
    },
  },

  // Matikan rule formatting yang bentrok dengan Prettier — letakkan paling akhir.
  eslintConfigPrettier,
]);

export default eslintConfig;
