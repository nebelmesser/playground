import { rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const appDir = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(appDir, '..');
const buildVersion = Date.now().toString(36);

export default defineConfig({
  base: './',
  build: {
    outDir,
    emptyOutDir: false,
    sourcemap: false,
    rollupOptions: {
      input: resolve(appDir, 'index.html'),
      output: {
        entryFileNames: 'assets/escher.js',
        chunkFileNames: 'assets/escher-[name].js',
        assetFileNames: 'assets/escher[extname]',
      },
    },
  },
  server: {
    open: '/index.html',
  },
  plugins: [
    {
      name: 'strip-crossorigin',
      transformIndexHtml(html) {
        return html
          .replace(/ crossorigin(?:="[^"]*")?/g, '')
          .replace(/(assets\/escher\.(?:js|css))/g, `$1?v=${buildVersion}`);
      },
    },
    {
      name: 'clean-built-assets',
      buildStart() {
        rmSync(resolve(outDir, 'assets/escher.js'), { force: true });
        rmSync(resolve(outDir, 'assets/escher.css'), { force: true });
      },
    },
  ],
});
