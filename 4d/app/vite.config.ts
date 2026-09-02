import { rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '..');

export default defineConfig({
  base: './',
  publicDir: 'public',
  build: {
    outDir,
    emptyOutDir: false,
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: resolve(__dirname, 'viewer.html'),
      output: {
        entryFileNames: 'assets/viewer.js',
        chunkFileNames: 'assets/viewer-[name].js',
        assetFileNames: 'assets/viewer[extname]',
      },
    },
  },
  server: {
    open: '/viewer.html',
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
        rmSync(resolve(assets, 'viewer.js'), { force: true });
        rmSync(resolve(assets, 'viewer.css'), { force: true });
      },
    },
    {
      name: 'redirect-root',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/' || req.url === '/index.html') {
            res.writeHead(302, { Location: '/viewer.html' });
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
});
