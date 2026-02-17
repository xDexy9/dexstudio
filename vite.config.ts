import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

const BASE = '/dexstudio/GaragePRO/';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? BASE : '/',
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      manifestFilename: "manifest.json",
      includeAssets: ["Garageprologo.png", "pwa-icon.png", "screenshot-*.png", "screenshotandroid.jpg", "icon-*.gif"],
      manifest: {
        name: "GaragePRO",
        short_name: "GaragePRO",
        description: "Professional garage management system",
        theme_color: "#1a1a2e",
        background_color: "#1a1a2e",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "portrait",
        scope: BASE,
        start_url: BASE,
        screenshots: [
          {
            src: "/screenshotandroid.jpg",
            sizes: "1600x2390",
            type: "image/jpeg",
            label: "GaragePRO Dashboard",
          },
          {
            src: "/screenshot-desktop.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "GaragePRO Manager View",
          },
        ],
        icons: [
          {
            src: "/pwa-icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api/],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
