// Safe env getter that works in Vite (import.meta), Node, and Jest
export function getEnv(key: string, fallback = ''): string {
  // Vite / browser
  if (typeof (globalThis as any).import !== 'undefined' && (globalThis as any).import?.meta?.env) {
    return (globalThis as any).import.meta.env[key] || fallback;
  }
  // Node / test
  return (process.env as any)[key] || fallback;
}