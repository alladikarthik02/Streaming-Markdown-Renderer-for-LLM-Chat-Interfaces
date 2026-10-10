import { defineConfig } from 'vite';
export default defineConfig({
  root: 'bench',
  resolve: { alias: [ {find: /^react-dom\/client$/, replacement: 'react-dom/profiling'} ] },
  build: { outDir: '../bench-dist', emptyOutDir: true },
});
