// Safe env getter that works in Vite (browser), Node, and Jest.
//
// Note: this file must NOT contain a literal `import.meta` expression —
// Jest (ts-jest, CJS) cannot parse it. Instead, vite.config.ts defines
// `process.env` -> `import.meta.env`, so in Vite builds the expression
// below is rewritten to read Vite's env object; in Node/Jest it reads
// the real process.env. If neither exists, return the fallback (which
// keeps the app on same-origin relative API paths — the self-host default).
export function getEnv(key: string, fallback = ''): string {
  try {
    const env = process.env as Record<string, string | undefined>;
    return env?.[key] || fallback;
  } catch {
    // `process` not defined and not rewritten by the bundler
    return fallback;
  }
}
