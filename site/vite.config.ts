import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://<owner>.github.io/dev-digest-ai-marketplace/ (docs/SITE-SPEC.md → Build and deploy).
export default defineConfig({
  base: '/dev-digest-ai-marketplace/',
  plugins: [react()],
});
