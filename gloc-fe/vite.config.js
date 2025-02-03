import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy'; // Use the correct named export

// https://vite.dev/config/
export default defineConfig({
  base: '/', // Use './' for relative paths or set your deployment path
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'internal_cdn', dest: '.' }, // Copy `internal_cdn` into `dist/internal_cdn`
        { src: 'fonts/*', dest: 'fonts' }, // Copy fonts from `src/fonts/` to `dist/fonts/`
      ],
    }),
  ],
  define: {
    global: ({})
}
});
