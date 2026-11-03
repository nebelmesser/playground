# An Atlas of Emergent Worlds

Interactive models from arXiv papers for computational contemplation. The collection contains **26 active models**, including **ten new interactive processes** added on 31 October 2026. Seven new sources are from 2026; three older studies were chosen for concrete, manipulable mechanisms. Each model has its own descriptive folder, English interface, source and approximation notes.

Open **http://127.0.0.1:4000/arxiv/**.

## New interactive processes

- [The Other Ends Meet](measured-bonds/) — Join two ends. The partners they leave behind may find themselves joined, far from your hand.
- [What Gives Way](granular-intruder/) — A small movement can change which grains carry the next push.
- [One Grain Holds the Passage](cornerstone-flow/) — The opening is wide enough for one grain. What the grains can hold together is another question.
- [When Nearness Is Not Enough](separate-futures/) — Carry a small population across the field. Being near another group may no longer be enough to make a future together.
- [A Direction Outlives Its Threads](renewing-direction/) — Every filament can disappear. A new one borrows its direction from those crossing the place where it is born.
- [What Holds the Edge](pinned-boundaries/) — Place a small particle across a moving edge. Its two contact points slide; a whole grain can remain because of a few small holds.
- [The Ground Changes the Meeting](curved-crystal/) — Two imperfections move toward a meeting. The shape beneath them changes how they arrive.
- [Enough to Take a Step](measured-ascent/) — The wall needs to know only the leftmost position. Reading everything changes what can happen next.
- [Where Two Fronts Meet](spiral-territories/) — Each source sends a front into recovering tissue. Where fronts meet changes where their sources can go.
- [Where the Lines Rejoin](rejoining-fields/) — Two magnetic islands press against each other. The field carries the fluid, and the fluid carries the field, until a connection can change.

## Earlier models

- [The Water Answers](chemical-echo/) — The drop releases what it avoids. A closed passage sends that signal back; an opening lets it spread.
- [What the Surface Asks](written-wetting/) — Write beneath the liquid. A change in the surface starts a withdrawal somewhere else.
- [The Way Water Chooses](porous-displacement/) — Water finds a few ways through the oil. Block one of them and watch where the next path begins.
- [The Dispersed Light Returns](temporal-lens/) — A field spreads until the medium changes. Its waves then find their earlier shape by taking the next physical step.
- [Two Reasons to Stay](two-calls/) — The cells leave a signal that gathers them together. They also eat what they are following, opening another way to go.
- [What the Water Keeps](ink-current/) — Ink follows a current it cannot change. A line stretches, folds and loses its edge.
- [What Grows in the Clearing](forest-return/) — A forest returns one tree at a time. A fire follows the connections that the forest has made.
- [Room for One More](room-for-one-more/) — Each new organ takes the first place where it can fit. The arrangement is a history of all those local accommodations.
- [The Shape of Arrival](diffusion-tree/) — A wandering particle has no plan. Where it first touches changes where the next thousand particles can arrive.
- [A World of Perfect Reflections](scattering-billiard/) — Nothing chooses a new direction. Free flight and perfectly elastic collisions turn a tiny difference into a different journey.
- [A Garden Held by Falling](gravity-garden/) — Every point falls toward every other point. Rotation prevents a simple ending, and close encounters rearrange the garden.
- [A Garden That Eats Itself](gray-scott/) — Spots grow, divide and disappear when they become crowded. A boundary between a creature and a process.
- [A Crowd Without Attraction](active-matter/) — Particles slow down in a crowd. That creates a feedback loop which brings them together.
- [Nobody Wins](cyclic-life/) — A displaces B, B displaces C, and C displaces A. Waves emerge because no species can win for good.
- [Direction Without a Leader](flocking/) — Each particle sees only its neighbours. Local adjustments can still produce a shared direction.
- [A Fabric That Never Repeats](chaotic-surface/) — Small irregularities grow while the smallest ones are smoothed away. A continuous struggle between scales remains.

Each folder owns its numerical `model.mjs`, a generated page and README. Newer models also own a renderer (`view.mjs`), metadata (`meta.mjs`) and invariant/causal tests. A model may keep a numerical helper beside them; the two granular models share a contact solver. The interface and Canvas2D helpers live in `shared/`. There are no external JavaScript dependencies or runtime API calls.

## Before selecting another visualization

Read [the history of tried visualizations](history/tried-visualizations.md). It records **sixty-three tried mechanisms**, including **thirty-seven removed at the user's request**. Removed mechanisms remain excluded; a fresh citation, title or palette alone does not make a fresh model. The priority is an interactive process whose subsequent evolution changes after intervention. Poetic potential should arise from that behavior, persistent traces or visible consequences. The ink remains; the river landscape was explicitly removed. The previous twenty additions retained only Two Reasons to Stay and The Dispersed Light Returns. New prototypes await user review and are not recorded as accepted.

## Preview

Use the parent `./scripts/preview` from the Playground root. Reload the HTTP page after edits; do not start another server. Regenerate pages and per-model READMEs with `node arxiv/build-pages.mjs` after catalog or metadata changes. Update this collection README and history when changing the selection. Gallery previews are exported snapshots of actual model states.

## Controls

Pause/resume, single step, same-seed restart, new seed, speed and presets are shared. Press and drag with the primary mouse button held, or draw with a finger. Field tools have contextual instructions. Strokes interpolate sparse pointer samples, reject field margins and release their held state on cancel, blur, restart or tool change. Models that need it receive separate press/hold/release events: the quantum engine postpones readings during a hold and reads once on release. Stop measuring changes its automatic protocol immediately.

Enter on the focused field makes one intervention unless a pointer gesture is already active. Space pauses; R restarts; H expands the field; Escape restores controls. Reduced-motion preference opens a model paused. The URL stores starting seed and parameters, including hidden preset configuration, but not elapsed time or interventions. Warmup is included in model time. Presets restart; sliders change current coefficients except controls marked “restart”. Speed changes the number of fixed steps; hidden tabs stop computation. External drives/feeders, finite domains, approximate solvers and natural settling are disclosed on each page. No hidden automatic restart maintains motion.

## Checks

Run `node --test arxiv/models.test.mjs arxiv/*/*.test.mjs` for deterministic worlds, valid presets, mechanism invariants and paired interventions. Run `node arxiv/validate.mjs` for all presets and parameter corners, or name particular slugs for focused validation. Current numerical and rendered evidence is recorded in [VALIDATION.md](VALIDATION.md). These checks validate the browser reductions, not quantitative reproduction of every source experiment.
