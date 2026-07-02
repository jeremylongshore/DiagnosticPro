import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/src"),
    },
  },
  define: {
    // Bridge for src/src/lib/env.ts: `process.env[key]` in source becomes
    // `import.meta.env[key]` in Vite builds (Jest keeps real process.env).
    // Vite's own longer `process.env.NODE_ENV` define still takes precedence.
    "process.env": "import.meta.env",
  },
}));
