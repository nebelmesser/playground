# Ising Field

An interactive two-dimensional Ising model for seeing how a local spin rule
turns into moving domains at larger observation scales.

The simulation, random initialization, full-resolution observation blur,
brush, statistics reduction, contour rendering, and final presentation run
on WebGPU. JavaScript only schedules GPU work and manages the controls.

## Develop

```bash
cd app
npm install
npm run dev
npm run build
```

The production build is written to `ising/`. Preview it through the parent
playground at `http://127.0.0.1:4000/ising/`.

## Controls

- Wheel or pinch changes the observation scale.
- Drag paints continuously with the visible domain color at the initial
  pointer position on the current observation scale.
- `[` and `]` change brush size up to 100 px.
- Time speed changes the number of checkerboard Metropolis half-steps per
  second from 1× to 10× without changing the temperature.
- New state writes independent random ±1 spins without a warm-up delay.
- Clear fills the field with blue spins; the next brush stroke defaults to
  orange while the field remains entirely blue.

## License

MIT. Made by [Nebelmesser](https://nebelmesser.com/).
