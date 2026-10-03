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
  second from 0.5× to 10× without changing the temperature (default 1×).
- New state writes independent random ±1 spins without a warm-up delay.
- Clear fills the field with water (−1) spins. On a single-color map the brush
  automatically paints the opposite domain; Cmd/Ctrl inverts the brush.

## URL options

Example: `/ising/?start_terrain=40&terrain_color=ff693d&water_color=369cff`.

- `start_terrain`: initial percentage of +1 terrain spins, from 0 to 100
  (decimals allowed; default 47). Applies only at startup and on New random
  state. The simulation evolves freely afterward; newly added cells on resize
  still use 50/50 noise. These are independent probabilities, not exact quotas.
- `terrain_color` and `water_color`: base colors in three- or six-digit RGB hex.
  Omit `#`, or encode it as `%23` in the URL. Without overrides, the
  defaults are white terrain (`FFF`) and deep blue water (`010E86`). Shading
  and contours still apply to these colors.
  Land isolines use a darker shade of `terrain_color`.
  Label inks are derived from each area's base color, with a dark shade and a
  light tint; contrast and opacity adapt to the background and text size.
- `temperature_duration`: seconds of holding Cool or Heat to reach the
  corresponding temperature limit (positive number; default 8). Temperature
  follows an S-curve: slow at both ends, fastest in the middle. For example,
  `?temperature_duration=4` makes the change twice as fast. The fill shows actual
  temperature progress, with a straight front clipped inside the arrow.

Missing or invalid parameters fall back to their defaults independently.

## License

MIT. Made by [Nebelmesser](https://nebelmesser.com/).
