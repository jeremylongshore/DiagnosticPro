// Jest transform shim: wraps ts-jest so that modules using the Vite-only
// `import.meta.env` meta-property can load under the CommonJS jest runtime.
//
// Why: ts-jest forces `module: CommonJS` in non-ESM mode, so any literal
// `import.meta` fails to compile (TS1343) and would SyntaxError at runtime.
// `src/services/diagnostics.ts` reads `import.meta.env.VITE_*` directly.
// We rewrite `import.meta.env` -> `({})` before ts-jest sees it. That is a
// faithful emulation of the jest runtime, where no Vite env object exists:
// `({}).VITE_API_GATEWAY_URL` is `undefined`, so the source's `|| ''`
// fallback yields the same-origin relative base -- the self-host default.
//
// Zero blast radius: the replacement is a no-op for every file that does not
// contain a literal `import.meta` (all current suites go through getEnv /
// process.env). Only diagnostics.ts is affected.
const tsJest = require('ts-jest').default;

const tsJestConfig = {
  // isolatedModules => transpile-only (no cross-file type-checking), matching
  // tsconfig.app.json's own posture. Without an explicit `lib` the default for
  // target es2022 omits DOM, so setupTests.ts (window / IntersectionObserver)
  // fails to type-check under a cold CI run even though jsdom provides them at
  // runtime. Pin the DOM libs so local and CI resolve identically.
  isolatedModules: true,
  tsconfig: {
    jsx: 'react-jsx',
    module: 'esnext',
    target: 'es2022',
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    strict: false,
    noImplicitAny: false,
    baseUrl: '.',
    paths: {
      '@/*': ['./src/src/*'],
    },
  },
};

const inner = tsJest.createTransformer(tsJestConfig);

function patch(sourceText) {
  return sourceText.includes('import.meta')
    ? sourceText.replace(/import\.meta\.env/g, '({} as any)')
    : sourceText;
}

module.exports = {
  process(sourceText, sourcePath, options) {
    return inner.process(patch(sourceText), sourcePath, options);
  },
  getCacheKey(sourceText, sourcePath, options) {
    return inner.getCacheKey(patch(sourceText), sourcePath, options);
  },
};
