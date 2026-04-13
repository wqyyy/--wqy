import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// GitHub Pages 项目站为 https://<user>.github.io/<仓库名>/，必须用非根 base，否则请求会打到 /.github.io/assets → 404 白屏。
// 使用相对 base，不依赖 GITHUB_REPOSITORY（避免未走 Actions、或 env 未传入时仍打成 "/"）。
const ghPages = process.env.GITHUB_PAGES === "true";
const base = ghPages ? "./" : "/";

export default defineConfig(({ mode }) => ({
  base,
  server: {
    host: "::",
    port: 8080,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
