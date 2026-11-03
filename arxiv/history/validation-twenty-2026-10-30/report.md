# Validation of the current collection

Checked on 30 October 2026 through the parent `./scripts/preview` at `http://127.0.0.1:4000/arxiv/`.

There are **31 active prototypes**, including **20 new models** based on papers first submitted in 2025–2026 (eleven from 2025 and nine from 2026). The history records **50 attempted mechanisms and 19 removals**. The latest user clarification explicitly retains **What the Water Keeps** and removes **Water Keeps the Low Road**. Seven other requested models were also removed. Their source folders, generated destination folders and preview images are absent; their mechanisms and sources remain in the history.

## Numerical checks

`node --test arxiv/models.test.mjs arxiv/*/model.test.mjs`: **124 tests passed, no failures, skips or cancellations**. Full output: `validation/tests.txt`.

All active models are checked for deterministic seeded state and finite intervention. Catalog tests verify every default and preset against control ranges and slider increments, including hidden URL parameters. Mechanism tests cover:

- Contact-driven random organization, exact absorption without contacts, and distant motion induced by contact activity.
- Brownian search with event-split reset/gate clocks, transparent closed targets, absorbing open targets and continuing target clocks after arrival.
- Conserved chemotactic cell mass, coupled nutrient consumption and concentration-dependent transport.
- Local extrusion pressure relief, long-range elastic stress, zero-mean division kicks and bounded late tissue homeostasis.
- Three-dimensional Potts energy differences against the full Hamiltonian, immutable substrate, volume constraint and seeded active wetting.
- Both conservative biofilm redistribution stages, separate species ledgers, nitrate production, oxygen-dependent growth and vertical stratification.
- Molecular capture/exploration/escape accounting and curvature-dependent retention.
- Conserved pore area, Ostwald ripening and delayed size-selective transfer.
- Three-dimensional plate exclusion, size-selective partial reversal and regrowth around survivors.
- Nested tape latches, rectified returns and erasure by a larger peel.
- Rigid kirigami panels, exact coincident hinges and monotone held-actuator relaxation.
- Conserved shell layers, compatible parallel curvature and energy-lowering zero-temperature exchanges.
- Hydraulic flow partition and history-dependent fibre states without a double-well elastic element.
- Exact reflected double cover, removal of the constant rotational mode and matched-noise topological caging.
- Inertial active wave growth, increasing wave scale and conserved mean strain.
- Positive local angular current from solely negative-OAM constituents, with negative integrated OAM.
- Six-mode unitary norm, unit Stokes vectors and opposite finite-patch texture winding.
- Exact Fourier reconstruction across a signed temporal interface while physical time advances.
- Same-noise reference/damaged wave identity, the initial eigenstate residual and noise-enhanced recovery over a fixed ensemble.
- Atom–molecule matter balance, conversion and conservative phase interventions.
- The retained models’ earlier mathematical invariants, including fluid incompressibility and maintained late dye contrast.

`node arxiv/validate.mjs`: **155 of 155 recorded runs produced finite numerical states**. Every active model has three preset runs and both corners of its visible parameter ranges. New models use 1,000–7,000 steps per run; the earlier KS model uses 100,000. Full results: `validation/long-runs.jsonl`. The validator also accepts model slugs for focused checks, for example `node arxiv/validate.mjs living-layers`.

These runs bound the checks performed. They do not establish arbitrary-time stability, thermodynamic limits, critical exponents or quantitative agreement with the complete papers.

## Browser checks

All twenty new fields were visually inspected at **1280 × 900** and **390 × 844** CSS pixels, using the actual shared preview. The retained ink model was additionally checked after restoration at narrow widths, including 320 pixels.

- Every new page initialized successfully and fit the viewport without horizontal overflow or invalid range values.
- Every new page passed a complete pause, held-button drag, single-step, live-slider, alternate-preset and restart cycle. Dragging did not advance model time while paused; single steps did.
- No JavaScript errors or warnings were observed in the final browser checks.
- The rebuilt gallery contains exactly twenty new cards and eleven earlier cards. All **31 of 31 preview images** loaded. It fits both checked widths and retains the English, unnumbered interface.
- The ink title is present in the live gallery; the river landscape is absent. Static destination checks also confirm removal of all eight requested routes.
- New previews were exported through Save PNG from computed states and converted to JPEG. Some snapshots include explicit manual interventions; they are not illustrations or remotely generated assets.

Viewport tests use browser emulation, not physical mobile-device testing. The common pointer interface supports touch, but no physical touch device was used for this check.

## Revisions made during verification

The tissue model’s initially literal transfer of two printed Fourier expressions produced an amplifying avalanche and unphysical late pressure. The implementation now uses a symmetric dissipative stress operator derived from the source’s force-balance equations, with consistent mixed derivatives. The numerical difference and its scope are disclosed on the model page; a regression requires bounded late homeostasis with continuing turnover.

Independent review found that the search display skipped the current history row and that completed trials stopped their target clocks. The current row is now drawn, targets continue switching after arrival, and manually restarted searches measure their own duration. Regression tests cover continuing clocks and restarted durations. The crossing counter explicitly counts numerical crossing intervals, not the infinitely many mathematical Brownian zero crossings.

Kirigami pointer input changes the current angle; subsequent evolution returns towards the visible held slider target. The plate protocol admits one new plate per step so that its finite sequence can be observed. Neither model receives a hidden oscillation or automatic restart.

Preset checks caught two new geometric preset values that did not fit their slider increments. The increments now represent the intended values exactly. Small-screen titles retain navigation space; numeric outputs remain on one line, and controls use one column below 360 pixels.

The retained ink source was recovered from its original executed file-writing blocks and subsequent patches, including `supply: 3`, `removal: 0.09` and the unforced preset’s `supply: 0`. Its four original invariant tests pass as part of the full suite.

## Scope and interpretation

Each page links the primary arXiv paper and states the implemented equation and approximations. Selection was checked against the existing mechanism history; a new title, palette or recent citation was not treated as a new mechanism.

Several models deliberately reduce the full study: the temporal lens includes the propagating sector, the photonic texture is an imposed unitary-control probe, the biofilm uses zero flow and quasi-steady diffusion, wetting uses a coarse voxel geometry, shell exchange is equilibrium sampling, and tape curvature is a schematic rendering of its latching model. These limits remain visible in Model and source and in each folder’s README.

Finite protocols can complete, material budgets can fill, systems can settle and stochastic samples can differ. Poetic readings are invitations to attend to these behaviors; they do not turn the models into evidence for claims about human experience.
