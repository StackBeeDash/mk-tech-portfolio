import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

/**
 * Vite 設定
 *
 * Why Vite:
 * - ESM ネイティブの高速 HMR でコンポーネント開発が快適
 * - React プラグインで JSX/Fast Refresh を自動設定
 * - パスエイリアスで import を簡潔に
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@components": resolve(__dirname, "components"),
      "@tokens": resolve(__dirname, "design-tokens"),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
