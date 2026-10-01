# Ising Field

Source lives in `app/`. Root `index.html` and `assets/` are Vite build outputs
and must not be edited by hand.

Keep the physical state and all per-cell work on WebGPU. JavaScript may schedule
passes, handle input, and aggregate the small GPU statistics readback. A new
state is raw independent random spins; opening warm-up is a separate action.

Build from `ising/app` with `npm run build`. Preview only through the parent
repository's `./scripts/preview` command.

## Общие принципы > эвристик

Если пользователь предлагает набор противоречащих требований, то не превращай их в кучу эвристик, попробуй найти общий принцип и воплотить его в коде.

## Правила