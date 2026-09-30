# Local preview

Use **one** command. Do not start Jekyll, `python -m http.server`, `npx serve`, or Vite preview to open the site.

```bash
./scripts/preview status   # is it up?
./scripts/preview          # start anything that is down (no-op if already running)
./scripts/preview down     # stop
```

`./scripts/preview` is the same as `./scripts/preview up`. It never spawns a second copy.

| What | Where |
| --- | --- |
| Preview (use this) | `http://127.0.0.1:4000/` |

After an edit, reload the HTTP URL. Jekyll rebuilds on its own.

## App source (`4d/app`, `hilbert/app`, `fractal/app`)

`npm run dev` is only for Vite while editing TypeScript. People open the built files under `4d/`, `hilbert/`, `fractal/`, and `ising/` via **http://127.0.0.1:4000/**. After `npm run build`, reload that origin.
