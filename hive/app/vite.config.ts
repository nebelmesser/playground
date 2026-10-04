import { readdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '..');

export default defineConfig({
  base: './',
  build: {
    outDir,
    emptyOutDir: false,
    sourcemap: false,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'assets/hive-[hash].js',
        chunkFileNames: 'assets/hive-[name]-[hash].js',
        assetFileNames: 'assets/hive-[hash][extname]',
      },
    },
  },
  server: {
    open: '/',
  },
  plugins: [
    {
      name: 'strip-crossorigin',
      transformIndexHtml(html) {
        return html.replace(/ crossorigin(?:="[^"]*")?/g, '');
      },
    },
    {
      name: 'clean-old-hashed-assets',
      buildStart() {
        const assets = resolve(outDir, 'assets');
        try {
          for (const name of readdirSync(assets)) {
            if (name.startsWith('hive-')) rmSync(resolve(assets, name), { force: true });
          }
        } catch {
          // assets/ does not exist on a fresh clone
        }
      },
    },
  ],
});
