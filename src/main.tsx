import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

registerSW({
  onNeedRefresh() {
    // New content available — reload automatically
    window.location.reload();
  },
  onOfflineReady() {},
});

// Capture PWA install prompt as early as possible (fires before React mounts)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).__pwaInstallPrompt = e;
});

// Apply saved theme before render to prevent flash
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById("root")!).render(<App />);
