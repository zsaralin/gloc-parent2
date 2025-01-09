import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'internal_cdn', dest: '' } // ✅ Copies `internal_cdn` into `dist/internal_cdn`
      ]
    })
  ],
  build: {
    outDir: 'dist', // ✅ Ensure Vite builds to `dist/`
    emptyOutDir: false, // ✅ Prevents deletion of existing files in `dist/`
  },
  base: "./" // ✅ Ensures assets use relative paths
});
