# Hive — Cities & Roads

A WebGL 2 landscape with editable cities and soft, emergent paths. Invisible
agents walk between city pairs. The visible network is the accumulated trace
of their actual movement. There are no colonies, resources, birth cycles or
economic model, and no precomputed shortest routes.

## Controls

- **Move**: drag a circle's centre to move its city; drag its rim to resize it.
  A selected circle has two rim handles. The diameter slider is an alternative
  for keyboard users. Drag empty ground to pan; scroll or pinch to zoom.
- **Add city**: click empty ground. Up to 24 cities are supported.
- **Raise / Lower**: paint hills and valleys. Brush radius is in Settings.
- **Remove**, Delete or Backspace removes the selected city.
- **Together / Terrain / Roads** changes visible layers. Agents are never drawn.
- **Pause** and **1× / 2× / 4× / 8×** control simulation time.
- **Reset roads** clears accumulated traces and restarts agents. **New terrain**
  keeps cities in place. **Clear cities** starts an empty map.
- Keys 1–4 select tools. Escape clears the selection and closes settings.

There is no visible page heading. The source lives in `hive/app`; the earlier
colony experiment parked in `_hive` is separate.

## Model

A city's area determines how many distinct partners it chooses. Nearby, larger
cities are preferred; both cities' choices are combined into unique pairs.
Increasing a city's radius increases its chosen-pair budget, up to all other
cities. The number of total connections can also include incoming choices.
Agents are distributed across pairs in proportion to the cities' sizes, and
reallocated when the city graph changes.

Agents know their destination's direction, sense nearby trail intensity and
terrain cost, and choose a heading using exploration noise and inertia. They
have no global map of optimal routes. Uphill and downhill both cost effort and
slow movement. Agents reverse their journey after reaching the destination.
Cost-efficient completed journeys strengthen subsequent local deposition;
arrival never reinforces a whole route instantly. Trips stuck for 150 simulated
seconds restart at their source city.

Every actual movement deposits a small amount of shared pheromone proportional
to distance walked. Repeated traffic reinforces a corridor; unused traces decay
exponentially (default half-life: 25 simulated seconds). Rendering spreads this
field smoothly, suppressing lateral spread across steep relief. `Road spread`
controls softness; `Trail attraction`, `Exploration`, agent count and walking
speed control emergence. A visually soft path is a field of traffic, not a
rendered polyline. This is a local heuristic, not a shortest-path guarantee.

Terrain, paths and city circles are rendered in WebGL 2. Agent movement runs on
the CPU with a fixed 1/30-second step. Hidden tabs suspend time. Editing is live;
old traces evaporate while new journeys adapt to relocated or resized cities.

## Development

```sh
cd hive/app
npm ci
npm test
npm run build
cd ../..
./scripts/preview
```

Reload `http://127.0.0.1:4000/hive/` after rebuilding. Production files are
`hive/index.html` and `hive/assets/`.
