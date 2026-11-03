# Visualizations already tried

Read this file before selecting the next visualization. These mechanisms have already been implemented and explored; a new palette, title or parameter preset does not make one a new candidate. Revisit a removed model only at the user's request.

The initial exploration ran on 25–26 October 2026. On 26 October the user removed the models marked **removed**, kept the remaining five, requested an English interface and asked for no model numbering. No reason for removing individual models was specified. On 27 October the user removed six more models from the second exploration and asked for the next selection to prioritize poetic readings. No individual rejection reasons were given. On 30 October the user removed eight further models, explicitly clarifying that the ink remains and the river landscape is removed.

## Retained

### Gray–Scott reaction–diffusion

- Current folder: `../gray-scott/`; title: **A Garden That Eats Itself**.
- Mechanism: two diffusing chemical concentrations with autocatalytic reaction, feed and decay. Spots split, form networks or disappear.
- Already tried: division, coral and maze presets; adding reagent by clicking and dragging.
- Source: John E. Pearson, [Complex Patterns in a Simple System](https://arxiv.org/abs/patt-sol/9304003), 1993.
- Outcome: working prototype retained. A Gray–Scott spot garden is already covered.

### Density-dependent active matter / MIPS

- Current folder: `../active-matter/`; title: **A Crowd Without Attraction**.
- Mechanism: particles slow down in dense neighbourhoods, creating positive feedback and clustering, without an attractive force.
- Already tried: quorum-sensing speed, angular noise, soft repulsion, clusters versus a same-seed gas, and turning particles outwards by dragging.
- Source: Michael E. Cates and Julien Tailleur, [Motility-Induced Phase Separation](https://arxiv.org/abs/1406.3533), 2014.
- Outcome: working qualitative point-particle prototype retained. It is not a hard-disk ABP reproduction.

### May–Leonard cyclic competition / rock–paper–scissors

- Current folder: `../cyclic-life/`; title: **Nobody Wins**.
- Mechanism: three species displace one another cyclically, reproduce into empty space and diffuse. Travelling fronts and spirals maintain spatial competition.
- Already tried: deterministic reaction–diffusion approximation, mobility and selection controls, and local species seeding.
- Source: Tobias Reichenbach, Mauro Mobilia and Erwin Frey, [Mobility promotes and jeopardizes biodiversity in rock-paper-scissors games](https://arxiv.org/abs/0709.0217), 2007.
- Outcome: working prototype retained. Demographic noise and finite-population extinction were not implemented.

### Vicsek flocking

- Current folder: `../flocking/`; title: **Direction Without a Leader**.
- Mechanism: constant-speed particles synchronously align with nearby headings, with angular noise; global order emerges without a leader.
- Already tried: local metric neighbourhoods, transition/shared-direction/disorder presets, polarization and local swirl interventions.
- Source: Tamás Vicsek et al., [Novel type of phase transition in a system of self-driven particles](https://arxiv.org/abs/cond-mat/0611743), original publication 1995, arXiv deposit 2006.
- Outcome: working prototype retained. Standard leaderless alignment is already covered.

### Kuramoto–Sivashinsky spatiotemporal chaos

- Current folder: `../chaotic-surface/`; title: **A Fabric That Never Repeats**.
- Mechanism: a growing long-wave instability competes with short-wave smoothing and nonlinear transport in a one-dimensional surface-slope field.
- Already tried: Fourier integration, short and long periodic domains, slope profile plus a space–time history, and local bumps.
- Source: Carson C. Chow and Terence Hwa, [Defect-Mediated Stability: An Effective Hydrodynamic Theory of Spatiotemporal Chaos](https://arxiv.org/abs/cond-mat/9412041), 1994.
- Outcome: working prototype retained. The integrator was repaired for long runs and uses 256 modes with a real-field projection.

## Further exploration — 26 October 2026

Ten new mechanisms were implemented in separate folders by three subagents, then integrated and checked in the browser. Selection was compared against this journal and the existing Playground projects. A separate KdV soliton candidate was discarded before implementation because it is closely related to the chosen FPUT chain.

### Diffusion-limited aggregation with partial sticking

- Date tried: 26 October 2026.
- Current folder: `../diffusion-tree/`; title: **The Shape of Arrival**.
- Mechanism: Independent lattice random walks attach irreversibly on contact with an aggregate. Tips screen the inner gaps; attachment probability changes branching.
- Already tried: Single-species partial sticking, launch and kill circles, chronological attachment colours and draggable external nuclei.
- Source: Bogdan Ranguelov · Desislava Goranova · Vesselin Tonchev · Rositsa Yakimova, [Diffusion Limited Aggregation with modified local rules](https://arxiv.org/abs/1105.5558), 2011.
- Outcome: Retained working prototype. Adjacency and ancestry checks pass. Growth stops honestly at a finite radius or particle budget; this is already covered as a mechanism.

### Pentagrid / cut-and-project quasicrystal

- Date tried: 26 October 2026.
- Former folder: `../quasicrystal-window/`; title: **Order Without Repetition**.
- Mechanism: Five offset line families yield unit-edge thick and thin rhombs through the dual de Bruijn construction. Internal-space offsets cause local phason flips.
- Already tried: A cropped Penrose patch, imposed circular phason probe, held window and dragging both hidden offsets.
- Source: V. E. Korepin · F. Gähler · J. Rhyner, [Quasiperiodic Tilings: A Generalized Grid–Projection Method](https://arxiv.org/abs/1110.6142), 2011.
- Outcome: **Removed at the user's request on 27 October 2026.** The implementation and preview were deleted. Previously implemented and checked: Unit-edge geometry and interior coverage were checked. The automatic sweep is an external parameter probe, not autonomous material dynamics. Source originally published in 1988 and deposited on arXiv in 2011.

### Kirchhoff transport with adaptive conductance

- Date tried: 26 October 2026.
- Former folder: `../living-circuit/`; title: **A Network Learns to Carry**.
- Mechanism: Pressures solve a resistive network exactly; conductance adapts to pressure drops while terminal loads fluctuate. Crosslinks can survive or be pruned.
- Already tried: An augmented binary tree, steady versus switching demand, conductance widths, flow marks and pointer-selected terminal demand.
- Source: Erik Andreas Martens · Konstantin Klemm, [Transitions from trees to cycles in adaptive flow networks](https://arxiv.org/abs/1711.00401), 2017.
- Outcome: **Removed at the user's request on 27 October 2026.** The implementation and preview were deleted. Previously implemented and checked: Conservation residuals are around machine precision. Steady-load pruning and fluctuating-load crosslink retention were checked; settling is legitimate. Distinct from particle trail-following.

### Dyson Brownian motion / complex Hermitian matrix OU process

- Date tried: 26 October 2026.
- Former folder: `../breathing-spectrum/`; title: **Lines That Cannot Cross**.
- Mechanism: Independent Gaussian Ornstein–Uhlenbeck increments of complex Hermitian matrix entries produce a correlated, repelling ordered eigenvalue spectrum.
- Already tried: Full 20-dimensional GUE spectrum, its history, real/imaginary matrix views, variance and relaxation controls, external diagonal perturbations.
- Source: Mark Adler · Eric Nordenstam · Pierre van Moerbeke, [The Dyson Brownian minor process](https://arxiv.org/abs/1006.2956), 2010.
- Outcome: **Removed at the user's request on 27 October 2026.** The implementation and preview were deleted. Previously implemented and checked: Hermiticity, spectral trace and squared norm were checked. This covers full-spectrum Dyson motion; minors and asymptotic kernels are not implemented.

### Dynamical independent bond percolation

- Date tried: 26 October 2026.
- Former folder: `../changing-connections/`; title: **One Bridge Changes Everything**.
- Mechanism: Independent Poisson bond refresh changes connected components and left-to-right crossings on a finite square lattice.
- Already tried: Exact interval refresh law, exact union-find connectivity, crossing history, critical versus sparse/dense presets and painted open bonds.
- Source: Yuval Peres · Oded Schramm · Jeffrey E. Steif, [Dynamical sensitivity of the infinite cluster in critical percolation](https://arxiv.org/abs/0708.4287), 2007.
- Outcome: **Removed at the user’s request on 30 October 2026.** Implementation and preview deleted; mechanism remains excluded from future selections. Previous outcome: Retained working prototype. Crossing changes persist on long runs. The finite lattice illustrates the mechanism, without claiming the source’s infinite-tree exceptional-time results.

### East kinetically constrained glass model

- Date tried: 26 October 2026.
- Former folder: `../facilitated-glass/`; title: **Permission to Change**.
- Mechanism: A site may refresh only when its right neighbour is vacant. Trivial independent equilibrium coexists with slow, hierarchical directional relaxation.
- Already tried: Exact continuous-time heat-bath attempts, a pinned facilitating boundary, quenches, persistence, vacancy space–time history and manual vacant patches.
- Source: Nicoletta Cancrini · Fabio Martinelli · Roberto H. Schonmann · Cristina Toninelli, [Facilitated oriented spin models: some non equilibrium results](https://arxiv.org/abs/0810.4237), 2008.
- Outcome: **Removed at the user's request on 27 October 2026.** The implementation and preview were deleted. Previously implemented and checked: Every accepted autonomous flip obeys facilitation. Long waits at low vacancy probability are part of the mechanism. This is not Ising energy-driven ordering.

### Beta Fermi–Pasta–Ulam–Tsingou recurrence

- Date tried: 26 October 2026.
- Former folder: `../returning-chain/`; title: **A Wave Remembers**.
- Mechanism: A fixed-end chain with quadratic and quartic bond potentials transfers energy between normal modes and can return it to the initially excited mode.
- Already tried: 16 masses, velocity Verlet, harmonic mode energies/history, returning and mixed-mode presets, local pulls.
- Source: Salvatore D. Pace · Kevin A. Reiss · David K. Campbell, [The β Fermi-Pasta-Ulam-Tsingou Recurrence Problem](https://arxiv.org/abs/1908.00564), 2019.
- Outcome: **Removed at the user's request on 27 October 2026.** The implementation and preview were deleted. Previously implemented and checked: Tests require first-mode energy to leave and then return; Hamiltonian drift stays small in long corner runs. Continuum KdV/mKdV soliton variants should count as related, not fresh candidates by default.

### Linear membrane eigenmode interference

- Date tried: 26 October 2026.
- Former folder: `../resonant-membrane/`; title: **The Shape of a Note**.
- Mechanism: A two-dimensional stretched rectangle evolves as independent sine-basis oscillators. Near-degenerate eigenfrequencies produce slow beating.
- Already tried: 64 exact harmonic modes, a projected mesh, near-square interference, off-centre plucks and live wave-speed/aspect changes.
- Source: Thomas Müller, [Numerical Chladni figures](https://arxiv.org/abs/1308.5523), 2013.
- Outcome: **Removed at the user's request on 27 October 2026.** The implementation and preview were deleted. Previously implemented and checked: Modal energy is conserved to roundoff at fixed parameters. This shows displacement, not simulated sand or bending-plate Chladni transport; arbitrary-domain FEM is not implemented.

### Periodic Lorentz gas / dispersing billiard

- Date tried: 26 October 2026.
- Current folder: `../scattering-billiard/`; title: **A World of Perfect Reflections**.
- Mechanism: Point particles fly freely and reflect specularly from periodic circular hard scatterers. Close initial directions separate through deterministic collisions.
- Already tried: Analytic circle intersections, periodic seams, conserved speed, a highlighted trajectory pair, long corridors, narrow passages and relaunching by dragging.
- Source: Valery B. Kokshenev · Eduardo Vicentini, [Insights into the superdiffusive dynamics through collision statistics in periodic Lorentz gas and Sinai billiard](https://arxiv.org/abs/math-ph/0405033), 2004.
- Outcome: Retained working prototype. Head-on/oblique collisions and long-run speed conservation were checked. Finite trails do not establish a diffusion exponent. This mechanism is distinct from alignment or active matter.

### Softened self-gravitating N-body disc

- Date tried: 26 October 2026.
- Current folder: `../gravity-garden/`; title: **A Garden Held by Falling**.
- Mechanism: Every equal-mass particle attracts every other through a Plummer-softened Newtonian pair potential. Rotation, collapse and encounters reshape a finite disc.
- Already tried: 160 direct interacting masses, leapfrog integration, turning/cold/two-disc initial states, orbit trails and momentum-balanced tangential impulses.
- Source: Sven De Rijcke · Jean-Baptiste Fouvry · Walter Dehnen, [How gravitational softening affects galaxy stability I. Linear mode analysis of disc galaxies](https://arxiv.org/abs/1812.07001), 2018.
- Outcome: Retained working prototype. Energy drift and linear/angular momentum were checked. This is a small collisional planar toy, not the source’s collisionless galaxy stability calculation; particles can escape the view.

## Poetic exploration — 27 October 2026

Selection priority: the user asked for visualizations that can be used for poetic reading first. Prefer visible processes that open questions of trace, loss, renewal, identity, constraint and unseen influence. Interpretive openings below are suggestions for attention, not claims about human life or the scientific conclusions of the sources. These ten mechanisms were compared against all earlier attempts and the existing Playground projects.

### Incompressible flow with passive dyes

- Date tried: 27 October 2026.
- Current folder: `../ink-current/`; title: **What the Water Keeps**.
- Mechanism: The fluid advects its own velocity and two dyes; pressure projection enforces incompressibility. Viscosity and dye diffusion compete with external stirring, inlets and removal.
- Already tried: Two inks, a slower fold, resting after stirring and bounded local dye/vortex painting.
- Possible readings: A line losing its edge; a trace that persists by changing shape; the difference between a thing and the current carrying it.
- Source: Bruno Eckhardt · Jörg Schumacher, [Structure function of passive scalars in two-dimensional turbulence](https://arxiv.org/abs/chao-dyn/9904024), 1999.
- Outcome: Confirmed retained by the user on 30 October 2026. Implemented and retained as an exploratory prototype. Bounded concentrations and near-zero spectral divergence were checked; maintained inlets preserve late contrast. This is fluid transport, not reaction–diffusion or a prescribed noise texture.

### Stream-power erosion and drainage

- Date tried: 27 October 2026.
- Former folder: `../river-memory/`; title: **Water Keeps the Low Road**.
- Mechanism: Downhill MFD8 flow splitting accumulates rainfall; drainage area and slope cause incision while uplift and creep reshape the rock.
- Already tried: Multiple watersheds, slope-weighted routing, implicit erosion, raised ridges and comparison of smooth hills with incised land.
- Possible readings: A landscape as the trace of water that has gone; paths becoming easier because they were taken before; a small ridge redirecting a larger future.
- Source: Shashank Kumar Anand · Milad Hooshyar · Amilcare Porporato, [Linear layout of multiple flow-direction networks for landscape-evolution simulations](https://arxiv.org/abs/1909.03176), 2019.
- Outcome: **Removed at the user’s request on 30 October 2026.** Implementation and preview deleted; mechanism remains excluded from future selections. Previous outcome: Implemented and retained as an exploratory prototype. Rainfall accounting, acyclic drainage, positive heights and live coefficients were checked. The source’s exact D∞ method is not reproduced. This is drainage and incision, not wind transport or adaptive conductance.

### Drossel–Schwabl forest fire and regrowth

- Date tried: 27 October 2026.
- Current folder: `../forest-return/`; title: **What Grows in the Clearing**.
- Mechanism: Independent growth makes connected tree patches; rare lightning consumes a connected component. Fire-front steps are resolved while slow growth waits.
- Already tried: Canopy age, clearings, embers, separate fast/slow time scales and local ignition.
- Possible readings: What returns after loss; connectedness as both shelter and vulnerability; the clearing as a record rather than an empty place.
- Source: Klaus Schenk · Barbara Drossel · Franz Schwabl, [The self-organized critical forest-fire model on large scales](https://arxiv.org/abs/cond-mat/0105121), 2001.
- Outcome: Implemented and retained as an exploratory prototype. Component burning, tree accounting and continued renewal were checked. The mechanism is not cyclic species competition, sandpile toppling or an ecological prediction.

### Deposition and droplet coalescence

- Date tried: 27 October 2026.
- Former folder: `../breath-on-glass/`; title: **A Surface Gathers**.
- Mechanism: Equal-volume arrivals nucleate or enlarge hemispherical droplets. Overlaps merge at a volume-weighted centre and resolve until no overlap remains.
- Already tried: Steady/light breath, arrivals stopped, wiping, volume ledger and periodic seams.
- Possible readings: Many arrivals becoming one drop; boundaries disappearing while material remains; a wipe making room for another accumulation.
- Source: Johannes Blaschke · Tobias Lapp · Björn Hof · Jürgen Vollmer, [Breath Figures: Nucleation, Growth, Coalescence, and the Size Distribution of Droplets](https://arxiv.org/abs/1206.6705), 2012.
- Outcome: **Removed at the user’s request on 30 October 2026.** Implementation and preview deleted; mechanism remains excluded from future selections. Previous outcome: Implemented and retained as an exploratory prototype. Volume conservation through cascaded merges and removal accounting were checked. A finite-radius limit stops deposition honestly. This is geometric coalescence, not density-dependent active clustering or Cahn–Hilliard phase separation.

### Vector elastic spring-network fracture

- Date tried: 27 October 2026.
- Former folder: `../brittle-land/`; title: **The Tear Finds a Way**.
- Mechanism: A triangular elastic sheet redistributes load through vector Hookean forces; sufficiently stretched bonds break permanently.
- Already tried: A genuine initial notch, disorder, slowly imposed tension, strain colour and permanent pointer cuts.
- Possible readings: A small flaw becoming a route; an event that changes what the material can bear; damage as a persistent condition of later motion.
- Source: Haruka Noguchi · Satoshi Yukawa, [Fracture process of composite material in a spring network model](https://arxiv.org/abs/2312.11798), 2023.
- Outcome: **Removed at the user’s request on 30 October 2026.** Implementation and preview deleted; mechanism remains excluded from future selections. Previous outcome: Implemented and retained as an exploratory prototype. The initial notch was repaired so it cuts actual bonds. Dissipation, permanent damage and finite strong-load evolution were checked. No independent percolation refresh, circuit current or sandpile transfer drives the cracks.

### Thin gravitational lens ray tracing

- Date tried: 27 October 2026.
- Former folder: `../unseen-lens/`; title: **Light Takes Another Way**.
- Mechanism: Image-plane rays map backward through one or two point masses into a finite textured source; image brightness is sampled from the corresponding source point.
- Already tried: Einstein alignment, multiple images, binary lens, changed strength/size and moving or held source position.
- Possible readings: An unseen presence changing what can be seen; several appearances of one source; apparent distance and the path of light.
- Source: Ramesh Narayan · Matthias Bartelmann, [Lectures on Gravitational Lensing](https://arxiv.org/abs/astro-ph/9606001), 1996.
- Outcome: **Removed at the user’s request on 30 October 2026.** Implementation and preview deleted; mechanism remains excluded from future selections. Previous outcome: Implemented and retained as an exploratory prototype. Analytic image positions, Einstein radius, zero-mass identity and brightness sampling were checked. Motion is an explicit position probe; this is not self-gravitating N-body motion or quantum localization.

### Growth and confinement of an elastic loop

- Date tried: 27 October 2026.
- Former folder: `../growing-fold/`; title: **More Thread Than Room**.
- Mechanism: Segment rest lengths increase within a fixed circular wall; stretching, angular bending, self-contact and topology constraints shape an overdamped closed elastica.
- Already tried: Initial indentation, local material feeding, soft/stiff thread, length budget and contact-preserving relaxation.
- Possible readings: More life than room; making space by becoming more intricate; a constraint carried into the shape that follows.
- Source: Riccardo De Pascalis · Gaetano Napoli · Stefano S. Turzi, [Growth-induced blisters in a circular tube](https://arxiv.org/abs/1311.6909), 2013.
- Outcome: **Removed at the user’s request on 30 October 2026.** Implementation and preview deleted; mechanism remains excluded from future selections. Previous outcome: Implemented and retained as an exploratory prototype. Tests require actual added geometric length, inward folds, containment, no crossings and energy dissipation at fixed length. Growth eventually ends. This is constrained growth, not the removed free FPUT vibration or a prescribed animated curve.

### Continuous modern Hopfield associative memory

- Date tried: 27 October 2026.
- Former folder: `../incomplete-memory/`; title: **What a Fragment Calls Back**.
- Mechanism: A continuous cue follows the gradient of a softmax associative energy formed from four explicitly stored normalized ink drawings.
- Already tried: Damaged fern/shell/moth/twig cues, erasure, thumbnail cue selection, high-sharpness retrieval and low-sharpness mixtures.
- Possible readings: A fragment calling back a whole; recognition shaped by what is already available; completion and ambiguity.
- Source: Hubert Ramsauer et al., [Hopfield Networks is All You Need](https://arxiv.org/abs/2008.02217), 2020.
- Outcome: **Removed at the user’s request on 30 October 2026.** Implementation and preview deleted; mechanism remains excluded from future selections. Previous outcome: Implemented and retained as an exploratory prototype. Energy decreases and damaged cues retrieve their actual stored vectors. The unforced model settles honestly. It is not a biological brain, semantic recognizer or nearest-neighbour Ising ordering.

### Saltation, shelter and sand redistribution

- Date tried: 27 October 2026.
- Former folder: `../dune-wind/`; title: **The Wind Moves the Ground**.
- Mechanism: Wind moves discrete sand slabs over nonlocal hops; lee shelter influences deposition and local rolling relaxes steep slopes while total autonomous mass stays fixed.
- Already tried: Turning wind, varying saltation, inherited ridges, rolling and counted pointer-added sand.
- Possible readings: A crest that survives while its grains leave; a place made of movement; old ridges becoming material for a changed wind.
- Source: Douglas A. Kurtze · Joseph A. Both · Daniel C. Hong, [Surface Instability in Windblown Sand](https://arxiv.org/abs/cond-mat/9910175), 1999.
- Outcome: **Removed at the user’s request on 30 October 2026.** Implementation and preview deleted; mechanism remains excluded from future selections. Previous outcome: Implemented and retained as an exploratory prototype. Exact slab conservation and wind-cache changes were checked. This is a disclosed 2D heuristic extension of a 1D ripple source, not a barchan prediction or the removed toppling sandpile.

### Sequential phyllotactic exclusion packing

- Date tried: 27 October 2026.
- Current folder: `../room-for-one-more/`; title: **Room for One More**.
- Mechanism: A Schwendener/Snow process puts each new exclusion disk at the lowest valid position on a periodic cylinder; centres are mapped to a radial head.
- Already tried: Shrinking exclusion disks, emerging spirals and defects, seed-dependent tie orientation, removing recent organs and a finite organ budget.
- Possible readings: The form inherited by a late arrival; a whole made by finding room locally; a history visible as arrangement.
- Source: Jonathan Swinton, [Disk-stacking models are consistent with Fibonacci and non-Fibonacci structure in sunflowers](https://arxiv.org/abs/2407.05857), 2024.
- Outcome: Implemented and retained as an exploratory prototype. Non-overlap and globally lowest valid birth height were checked. No golden angle or Fibonacci count is fitted. The radial mapping is a display choice, distinct from the removed pentagrid/quasicrystal projection.

## Removed at the user's request

### Complex Ginzburg–Landau phase turbulence

- Former title: **Breaks in a Shared Rhythm**.
- Mechanism: a two-dimensional complex oscillatory field with amplitude, phase, spiral cores and defect creation/annihilation.
- Already tried: turbulence, spirals and defects; locally suppressing amplitude.
- Source: Igor S. Aranson and Lorenz Kramer, [The World of the Complex Ginzburg-Landau Equation](https://arxiv.org/abs/cond-mat/0106115), 2001.
- Outcome: implemented and browser-tested, then removed on 26 October 2026. Its implementation and preview were deleted. Do not suggest the same phase-defect field again by default.

### Chimera states in a nonlocally coupled oscillator ring

- Former title: **Half an Agreement**.
- Mechanism: identical oscillators split into coherent and drifting regions under nonlocal coupling and a phase lag.
- Already tried: an exponential coupling kernel, Gaussian-envelope initial phases, a ring display, local coherence and phase-scrambling interventions.
- Source: Daniel M. Abrams and Steven H. Strogatz, [Chimera States in a Ring of Nonlocally Coupled Oscillators](https://arxiv.org/abs/nlin/0504046), 2005.
- Outcome: implemented and browser-tested, then removed on 26 October 2026. Its implementation and preview were deleted. A chimera oscillator ring is already tried.

### Abelian sandpile / self-organized criticality

- Former title: **The Last Grain**.
- Mechanism: cells topple at height four, distributing grains to neighbours, with dissipation at open edges; each new grain waits for the previous avalanche to finish.
- Already tried: random rain, a single source, toppling flashes, grain accounting and a queue painted by dragging.
- Source: Deepak Dhar, [Studying Self-Organized Criticality with Exactly Solved Models](https://arxiv.org/abs/cond-mat/9909009), 1999.
- Outcome: implemented and browser-tested, then removed on 26 October 2026. Its implementation and preview were deleted. Do not repackage the same sandpile avalanche model as a fresh idea.

### Quantum kicked rotor / dynamical localization

- Former title: **Chaos That Comes to a Halt**.
- Mechanism: repeated kicks spread a classical rotor ensemble while quantum interference can localize a wave in momentum space.
- Already tried: unitary split-step evolution, comparison with classical rotors, quasiperiodic kick modulation, momentum histories and phase imprints.
- Source: Julien Chabé et al., [Quantum scaling laws in the onset of dynamical delocalization](https://arxiv.org/abs/quant-ph/0607017), 2006.
- Outcome: implemented and browser-tested, then removed on 26 October 2026. Its implementation and preview were deleted. Quantum rotor localization is already covered.

### Non-reciprocal Cahn–Hilliard mixture

- Former title: **Matter That Chases**.
- Mechanism: two conserved scalar fields interact asymmetrically, allowing chasing concentration waves rather than only equilibrium coarsening.
- Already tried: symmetric double-well potentials, activity and reciprocal coupling controls, forward/reverse chasing and mass-preserving local interventions.
- Source: Suropriya Saha, Jaime Agudo-Canalejo and Ramin Golestanian, [Scalar Active Mixtures: The Non-Reciprocal Cahn-Hilliard Model](https://arxiv.org/abs/2005.07101), 2020.
- Outcome: implemented and browser-tested, then removed on 26 October 2026. Its implementation and preview were deleted. Do not suggest the same pair of chasing conserved fields again by default.
## Recent research — 30 October 2026

The user requested twenty more visualizations from fresher arXiv research, retaining poetic interpretability as the selection priority and asking that subprojects be implemented by subagents. All twenty sources below were first submitted in 2025–2026. Mechanisms were checked against all thirty earlier attempts and against one another. Interpretive openings are invitations to attention, not scientific claims about human experience. Finite protocols, approximate kinetics and imposed control probes are disclosed rather than presented as autonomous dynamics.

### Inertial coarsening in active solids

- Date tried: 30 October 2026.
- Former folder: `../wave-coarsening/`; title: **A Rhythm Finds More Room**.
- Mechanism: An inertial nonlinear complex shear-strain equation includes antisymmetric active coupling. Oscillations grow in scale and period; momentum loss can arrest this coarsening.
- Possible reading: A larger space finding a slower rhythm.
- Source: Jonas Veenstra · Jack Binysh · Vito Seinen · Rutger Naber · Damien Robledo-Poisson · Andres Hunt · Wim van Saarloos · Anton Souslov · Corentin Coulais, [Wave coarsening drives time crystallization in active solids](https://arxiv.org/abs/2508.20052), 2025.
- Outcome: **Removed at the user’s request on 30 October 2026**, when only Two Reasons to Stay and The Dispersed Light Returns were retained from this batch. The mechanism remains excluded. Previous outcome: implemented and checked as an exploratory prototype; the earlier batch report is preserved in [validation-twenty-2026-10-30/report.md](validation-twenty-2026-10-30/report.md). The implementation and preview were deleted from the active collection. The mechanism and source remain recorded here to prevent repetition.

### Geometric transformation memory

- Date tried: 30 October 2026.
- Former folder: `../what-the-large-leave/`; title: **What the Large Leave Behind**.
- Mechanism: Cubes or lamellae nucleate and grow in a finite volume until blocked. A disclosed partial reversal removes smaller plates; surviving large plates geometrically constrain the next generation.
- Possible reading: Absences shaped by the forms that remain.
- Source: F. Tolea · M. Tolea, [Geometric memory in incomplete phase transitions across dimensions](https://arxiv.org/abs/2604.27779), 2026.
- Outcome: **Removed at the user’s request on 30 October 2026**, when only Two Reasons to Stay and The Dispersed Light Returns were retained from this batch. The mechanism remains excluded. Previous outcome: implemented and checked as an exploratory prototype; the earlier batch report is preserved in [validation-twenty-2026-10-30/report.md](validation-twenty-2026-10-30/report.md). The implementation and preview were deleted from the active collection. The mechanism and source remain recorded here to prevent repetition.

### A community grows between opposite supplies

- Date tried: 30 October 2026.
- Former folder: `../living-layers/`; title: **Two Ways to Live Here**.
- Mechanism: Counter-diffusing substrates support different species in an expanding biofilm. Conservative two-stage redistribution transfers crowded biomass while retaining species composition.
- Possible reading: Different lives sustained by what arrives from opposite sides.
- Source: Soyoung Kim · Yinuo Noah Yao, [A conservative micro-continuum-cellular automaton method for multispecies biofilm dynamics in complex flows](https://arxiv.org/abs/2610.01565), 2026.
- Outcome: **Removed at the user’s request on 30 October 2026**, when only Two Reasons to Stay and The Dispersed Light Returns were retained from this batch. The mechanism remains excluded. Previous outcome: implemented and checked as an exploratory prototype; the earlier batch report is preserved in [validation-twenty-2026-10-30/report.md](validation-twenty-2026-10-30/report.md). The implementation and preview were deleted from the active collection. The mechanism and source remain recorded here to prevent repetition.

### A negative-index temporal lens

- Date tried: 30 October 2026.
- Current folder: `../temporal-lens/`; title: **The Dispersed Light Returns**.
- Mechanism: Exact Fourier Maxwell rotations continue forward in physical time across a signed permittivity/permeability switch. The propagating field’s optical phase evolution reverses at a controllable rate.
- Possible reading: A dispersed form finding its earlier shape through continued motion.
- Source: Oded Schiller · Yonatan Plotnik · Guy Bartal · Mordechai Segev, [Negative Index Makes a Perfect Time-Domain Lens, Generating Slow Playback of Ultrafast Events](https://arxiv.org/abs/2512.03985), 2025.
- Outcome: Implemented and retained as an exploratory prototype. Determinism, numerical invariants, parameter corners and browser behavior are recorded in `../VALIDATION.md`. The implemented equation and approximation limits are preserved in the model’s README. This mechanism is now already tried.

### Rectified latching memory

- Date tried: 30 October 2026.
- Former folder: `../where-peeling-stopped/`; title: **Where Peeling Stopped**.
- Mechanism: A rectified latching-bit model records the stopping distances of forward peeling. Laying down the tape preserves latches; a larger later peel reads and erases them.
- Possible reading: Stopping as a way of writing.
- Source: Sebanti Chattopadhyay · Carys Chase-Mayoral · Nathan Keim, [The mechanical latching memory of an adhesive tape](https://arxiv.org/abs/2511.08804), 2025.
- Outcome: **Removed at the user’s request on 30 October 2026**, when only Two Reasons to Stay and The Dispersed Light Returns were retained from this batch. The mechanism remains excluded. Previous outcome: implemented and checked as an exploratory prototype; the earlier batch report is preserved in [validation-twenty-2026-10-30/report.md](validation-twenty-2026-10-30/report.md). The implementation and preview were deleted from the active collection. The mechanism and source remain recorded here to prevent repetition.

### Competing chemical invitations

- Date tried: 30 October 2026.
- Current folder: `../two-calls/`; title: **Two Reasons to Stay**.
- Mechanism: Conserved cells move towards a self-produced signal and a consumed nutrient. The competing fields can sustain a concentrated population alongside dispersal.
- Possible reading: Following what one makes and what one uses up.
- Source: Agniva Datta · Robert Großmann · Carsten Beta, [Multi-scale patterns arising from competing chemotactic interactions](https://arxiv.org/abs/2610.32591), 2026.
- Outcome: Implemented and retained as an exploratory prototype. Determinism, numerical invariants, parameter corners and browser behavior are recorded in `../VALIDATION.md`. The implemented equation and approximation limits are preserved in the model’s README. This mechanism is now already tried.

### SU(6) photonic skyrmion control

- Date tried: 30 October 2026.
- Former folder: `../skyrmion-light/`; title: **The Other Hand of Light**.
- Mechanism: Determinant-one unitary rotations mix six spatial-polarization modes. An explicitly imposed optical-control probe transforms the local Stokes texture and finite-patch winding.
- Possible reading: A coherent texture changing its handedness.
- Source: Shinichi Saito, [Skyrmionic SU(6) structured light](https://arxiv.org/abs/2503.14884), 2025.
- Outcome: **Removed at the user’s request on 30 October 2026**, when only Two Reasons to Stay and The Dispersed Light Returns were retained from this batch. The mechanism remains excluded. Previous outcome: implemented and checked as an exploratory prototype; the earlier batch report is preserved in [validation-twenty-2026-10-30/report.md](validation-twenty-2026-10-30/report.md). The implementation and preview were deleted from the active collection. The mechanism and source remain recorded here to prevent repetition.

### A membrane that changes its welcome

- Date tried: 30 October 2026.
- Former folder: `../opening-membrane/`; title: **An Opening Becomes Enough**.
- Mechanism: Ostwald ripening redistributes a conserved pore area among changing pore sizes. Radius-selective permeability lets different solutes approach donor–acceptor equilibrium at different times.
- Possible reading: An opening gradually becoming enough for a passage.
- Source: Nivedina A. Sarma · David A. King · Xuefei Wu · Brett A. Helms · Paul D. Ashby · Thomas P. Russell · Ahmad K. Omar, [Dynamic Permeability in Metastable Droplet Interfacial Bilayers](https://arxiv.org/abs/2511.09510), 2025.
- Outcome: **Removed at the user’s request on 30 October 2026**, when only Two Reasons to Stay and The Dispersed Light Returns were retained from this batch. The mechanism remains excluded. Previous outcome: implemented and checked as an exploratory prototype; the earlier batch report is preserved in [validation-twenty-2026-10-30/report.md](validation-twenty-2026-10-30/report.md). The implementation and preview were deleted from the active collection. The mechanism and source remain recorded here to prevent repetition.

### Frustrated shell assembly

- Date tried: 30 October 2026.
- Former folder: `../enough-to-hold/`; title: **Enough to Hold Together**.
- Mechanism: Parallel shell curvatures create super-extensive bending and Gaussian-curvature stretching costs opposed by adhesion. Canonical Monte Carlo exchanges conserve layers without imposing a preferred stack size.
- Possible reading: The cost of holding another layer.
- Source: Kyle T. Sullivan · Mark J. Stevens · Gregory M. Grason, [Self-limited stacking of non-Euclidean colloidal shells: From saddles to caps](https://arxiv.org/abs/2609.25399), 2026.
- Outcome: **Removed at the user’s request on 30 October 2026**, when only Two Reasons to Stay and The Dispersed Light Returns were retained from this batch. The mechanism remains excluded. Previous outcome: implemented and checked as an exploratory prototype; the earlier batch report is preserved in [validation-twenty-2026-10-30/report.md](validation-twenty-2026-10-30/report.md). The implementation and preview were deleted from the active collection. The mechanism and source remain recorded here to prevent repetition.

### Topological caging

- Date tried: 30 October 2026.
- Former folder: `../a-world-with-one-turn/`; title: **A World With One Turn**.
- Mechanism: Matched stochastic spin-wave fields differ only at the seam: a direct torus join versus a reflected, sign-reversed Klein join. Non-orientability removes the global rotational soft mode.
- Possible reading: A world held by the way its far edges meet.
- Source: Gianmarco Spera · Axel Fotso Ndefo · Keaton J. Burns · Alexander Mietke, [Orientational order on non-orientable domains](https://arxiv.org/abs/2609.11367), 2026.
- Outcome: **Removed at the user’s request on 30 October 2026**, when only Two Reasons to Stay and The Dispersed Light Returns were retained from this batch. The mechanism remains excluded. Previous outcome: implemented and checked as an exploratory prototype; the earlier batch report is preserved in [validation-twenty-2026-10-30/report.md](validation-twenty-2026-10-30/report.md). The implementation and preview were deleted from the active collection. The mechanism and source remain recorded here to prevent repetition.

### Movement loosens a surface’s hold

- Date tried: 30 October 2026.
- Former folder: `../restless-wetting/`; title: **A Drop Finds Another Rest**.
- Mechanism: A three-dimensional, three-state Cellular Potts droplet explores a pillared substrate. Activity follows its previous measured centre-of-mass displacement and helps cross wetting barriers; volume is harmonically constrained.
- Possible reading: A resting shape that carries the history of how it arrived.
- Source: Bernardo Boatini · Cristina Gavazzoni · Leonardo Gregory Brunnet · Carolina Brito, [Probing wetting properties with self-propelled droplets](https://arxiv.org/abs/2510.16627), 2025.
- Outcome: **Removed at the user’s request on 30 October 2026**, when only Two Reasons to Stay and The Dispersed Light Returns were retained from this batch. The mechanism remains excluded. Previous outcome: implemented and checked as an exploratory prototype; the earlier batch report is preserved in [validation-twenty-2026-10-30/report.md](validation-twenty-2026-10-30/report.md). The implementation and preview were deleted from the active collection. The mechanism and source remain recorded here to prevent repetition.

### Single-photon azimuthal backflow

- Date tried: 30 October 2026.
- Former folder: `../azimuthal-backflow/`; title: **A Turn Against the Turning**.
- Mechanism: Two paraxial Laguerre–Gaussian modes with negative orbital angular momentum interfere. Their exact local angular current has positive sectors while integrated angular momentum remains negative.
- Possible reading: A small returning current inside a larger turn.
- Source: Zhen-Fei Zhang · Peng-Fei Huang · Shan-Chuan Dong · Yan-Xin Rong · Jin-Shi Xu · Yong-Jian Gu · Ya Xiao, [Observation of single-photon azimuthal backflow with weak measurement](https://arxiv.org/abs/2501.09952), 2025.
- Outcome: **Removed at the user’s request on 30 October 2026**, when only Two Reasons to Stay and The Dispersed Light Returns were retained from this batch. The mechanism remains excluded. Previous outcome: implemented and checked as an exploratory prototype; the earlier batch report is preserved in [validation-twenty-2026-10-30/report.md](validation-twenty-2026-10-30/report.md). The implementation and preview were deleted from the active collection. The mechanism and source remain recorded here to prevent repetition.

### Noise-enhanced wave-profile recovery

- Date tried: 30 October 2026.
- Former folder: `../noise-healing/`; title: **What the Noise Restores**.
- Mechanism: Reference and damaged copies of an asymmetric range-two open wave chain share identical Ornstein–Uhlenbeck noise. A fixed-ensemble test checks noise-enhanced normalized profile recovery.
- Possible reading: A difference becoming smaller in a shared uncertain environment.
- Source: Wuping Yang · H. Huang, [Noise-Enhanced Self-Healing Dynamics in Non-Hermitian Systems](https://arxiv.org/abs/2604.12347), 2026.
- Outcome: **Removed at the user’s request on 30 October 2026**, when only Two Reasons to Stay and The Dispersed Light Returns were retained from this batch. The mechanism remains excluded. Previous outcome: implemented and checked as an exploratory prototype; the earlier batch report is preserved in [validation-twenty-2026-10-30/report.md](validation-twenty-2026-10-30/report.md). The implementation and preview were deleted from the active collection. The mechanism and source remain recorded here to prevent repetition.

### Exploration before ice can stay

- Date tried: 30 October 2026.
- Former folder: `../grain-shelter/`; title: **What Finds a Hollow**.
- Mechanism: Captured molecules explore a hexagonal rough surface, escape, or find stabilizing concavities and island edges. Curvature-dependent retention separates contact with a surface from successful sticking.
- Possible reading: What it takes for an arrival to become a stay.
- Source: Philippe Parent · Carine Laffon · Stefano Curiotto · Daniel Ferry · Caroline Stadler · Frederik Granzow Doktor, [How nanoscale physics shapes ice formation in the Universe: Rethinking gas freeze-out on dust grains](https://arxiv.org/abs/2608.29161), 2026.
- Outcome: **Removed at the user’s request on 30 October 2026**, when only Two Reasons to Stay and The Dispersed Light Returns were retained from this batch. The mechanism remains excluded. Previous outcome: implemented and checked as an exploratory prototype; the earlier batch report is preserved in [validation-twenty-2026-10-30/report.md](validation-twenty-2026-10-30/report.md). The implementation and preview were deleted from the active collection. The mechanism and source remain recorded here to prevent repetition.

### Pressure, division and extrusion

- Date tried: 30 October 2026.
- Former folder: `../crowded-skin/`; title: **Someone Makes Room**.
- Mechanism: Quasistatic growth, division, shear yielding and pressure-triggered extrusion interact through a periodic elastic propagator. Force-balance-consistent mixed derivatives and stress signs prevent amplifying avalanches.
- Possible reading: A local release changing the load carried elsewhere.
- Source: Ali Tahaei · Marko Popović, [Signature of mechanically induced cell extrusions in cell size distribution](https://arxiv.org/abs/2609.21702), 2026.
- Outcome: **Removed at the user’s request on 30 October 2026**, when only Two Reasons to Stay and The Dispersed Light Returns were retained from this batch. The mechanism remains excluded. Previous outcome: implemented and checked as an exploratory prototype; the earlier batch report is preserved in [validation-twenty-2026-10-30/report.md](validation-twenty-2026-10-30/report.md). The implementation and preview were deleted from the active collection. The mechanism and source remain recorded here to prevent repetition.

### Rigid articulated kirigami

- Date tried: 30 October 2026.
- Former folder: `../cuts-that-open/`; title: **The Space in the Cuts**.
- Mechanism: Alternating rigid-square rotations preserve exact corner hinges while pre-existing cuts open. A disclosed overdamped actuator approaches a held compatible configuration.
- Possible reading: Making room through what is already allowed to turn.
- Source: Qinghai Jiang · Gary P. T. Choi, [PyKirigami: An interactive Python simulator for kirigami structures](https://arxiv.org/abs/2508.15753), 2025.
- Outcome: **Removed at the user’s request on 30 October 2026**, when only Two Reasons to Stay and The Dispersed Light Returns were retained from this batch. The mechanism remains excluded. Previous outcome: implemented and checked as an exploratory prototype; the earlier batch report is preserved in [validation-twenty-2026-10-30/report.md](validation-twenty-2026-10-30/report.md). The implementation and preview were deleted from the active collection. The mechanism and source remain recorded here to prevent repetition.

### Cavity-mediated atom–molecule conversion

- Date tried: 30 October 2026.
- Former folder: `../molecular-light/`; title: **Another Form of the Same Matter**.
- Mechanism: Two spatial mean-field condensates couple atom-pair to molecule conversion to a lossy shared cavity mode. Atom number plus twice molecule number is conserved while spatial coherence changes.
- Possible reading: Another form of the same matter.
- Source: Yun Chen · Yuqi Wang · Jingjun You · Yingqi Liu · Su Yi · Yuangang Deng, [Atom-Molecule Superradiance and Entanglement with Cavity-Mediated Three-Body Interactions](https://arxiv.org/abs/2501.09497), 2025.
- Outcome: **Removed at the user’s request on 30 October 2026**, when only Two Reasons to Stay and The Dispersed Light Returns were retained from this batch. The mechanism remains excluded. Previous outcome: implemented and checked as an exploratory prototype; the earlier batch report is preserved in [validation-twenty-2026-10-30/report.md](validation-twenty-2026-10-30/report.md). The implementation and preview were deleted from the active collection. The mechanism and source remain recorded here to prevent repetition.

### Fluidic hysterons

- Date tried: 30 October 2026.
- Former folder: `../bending-the-current/`; title: **The Bend Changes the Current**.
- Mechanism: Elastic fibre bending changes a channel’s hydraulic resistance, which changes its load. Shared series flow and a parallel bypass produce history-dependent bends without a built-in double well.
- Possible reading: A passage changing what passes through it.
- Source: Abhineet Singh Rajput · Amir A. Pahlavan, [Fluidic hysterons and memory in flow networks](https://arxiv.org/abs/2607.15122), 2026.
- Outcome: **Removed at the user’s request on 30 October 2026**, when only Two Reasons to Stay and The Dispersed Light Returns were retained from this batch. The mechanism remains excluded. Previous outcome: implemented and checked as an exploratory prototype; the earlier batch report is preserved in [validation-twenty-2026-10-30/report.md](validation-twenty-2026-10-30/report.md). The implementation and preview were deleted from the active collection. The mechanism and source remain recorded here to prevent repetition.

### Search with an unresetting target

- Date tried: 30 October 2026.
- Former folder: `../when-open/`; title: **When the Door Is Open**.
- Mechanism: Independent Brownian searchers return at Poisson times while transparent/absorbing targets continue their own two-state clocks. Event-split Brownian bridges detect crossings; arrivals stay absorbed until a manual new search.
- Possible reading: Returning to a beginning while the sought thing keeps its own time.
- Source: Bartosz Żbik · Bartłomiej Dybiec · Karol Capała · Zbigniew Palmowski · Igor M. Sokolov, [Hitting the blinking target under stochastic resetting](https://arxiv.org/abs/2512.09739), 2025.
- Outcome: **Removed at the user’s request on 30 October 2026**, when only Two Reasons to Stay and The Dispersed Light Returns were retained from this batch. The mechanism remains excluded. Previous outcome: implemented and checked as an exploratory prototype; the earlier batch report is preserved in [validation-twenty-2026-10-30/report.md](validation-twenty-2026-10-30/report.md). The implementation and preview were deleted from the active collection. The mechanism and source remain recorded here to prevent repetition.

### Mediated random organization

- Date tried: 30 October 2026.
- Former folder: `../distant-disquiet/`; title: **A Distant Disquiet**.
- Mechanism: Overlapping particles receive active random kicks. A spatially convolved contact-activity field gives distant passive particles weaker Gaussian kicks; a contact-free configuration is exactly absorbing.
- Possible reading: Stillness that requires everyone to stop together.
- Source: Tristan Jocteur · Cesare Nardini · Eric Bertin · Romain Mari, [Random organization criticality with long-range hydrodynamic interactions](https://arxiv.org/abs/2506.14330), 2025.
- Outcome: **Removed at the user’s request on 30 October 2026**, when only Two Reasons to Stay and The Dispersed Light Returns were retained from this batch. The mechanism remains excluded. Previous outcome: implemented and checked as an exploratory prototype; the earlier batch report is preserved in [validation-twenty-2026-10-30/report.md](validation-twenty-2026-10-30/report.md). The implementation and preview were deleted from the active collection. The mechanism and source remain recorded here to prevent repetition.

## Selection feedback — after the recent twenty

The user retained **Two Reasons to Stay** and **The Dispersed Light Returns**, and removed the other eighteen additions. The current priority is an interesting **interactive process**: an intervention changes subsequent evolution, the consequence is legible, and repeated experiments remain interesting. The user explicitly rejected mere flickering. This is batch-level feedback; no more specific reason for each removed model was provided. Rejected mechanisms must not return under another title, colour or recent citation.

## Interactive processes — 30 October 2026

After the eighteen removals, the next exploration was deliberately reduced to a few processes with editable conditions and persistent consequences. Source papers and mechanisms were compared with the full history. These are working experiments for the user's next review, not a claim that the user has accepted them.

### Chemical echolocation by a self-repelling droplet

- Date tried: 30 October 2026.
- Current folder: `../chemical-echo/`; title: **The Water Answers**.
- Mechanism: One moving droplet emits a diffusing repellent and accelerates away from its local gradient. No-flux walls change how its own chemical returns; a disclosed outlet drains the field at the right boundary. The same geometry and position can produce different future routes because the chemical history differs.
- Interaction tried: Build reflecting walls, reopen passages and move the droplet while preserving the existing chemical field. In the browser, closing a corridor caused a return upstream; reopening it allowed subsequent passage. A model test requires passage through the default bent channel and reservoir.
- Distinction: Unlike **Two Reasons to Stay**, this is one self-producing and self-sensing moving source; it has no external attractant, food field or competing population. It is not a maze pathfinder or an animated prescribed trajectory.
- Source: Aritra K. Mukhopadhyay · Ran Niu · Linhui Fu · Kai Feng · Christopher Fujta · Qiang Zhao · Jinping Qu · Benno Liebchen, [Automated decision-making by chemical echolocation in active droplets](https://arxiv.org/abs/2601.00480), submitted 1 January 2026.
- Limits: Gaussian source and sensing replace a point source; deterministic motion omits Brownian noise; swept inelastic contacts replace the source's WCA wall force. The finite reservoir can leave the drop almost stationary at its edge. Wall insertion displaces chemical rather than deleting it. The source's quantitative maze-success statistics are not reproduced.
- Outcome: Working prototype added for review after a visible causal intervention, mass-accounting tests and desktop/mobile checks. No hidden periodic reset, field subtraction or decay supplies new motion.

### Dewetting over a writable chemical substrate

- Date tried: 30 October 2026.
- Current folder: `../written-wetting/`; title: **What the Surface Asks**.
- Mechanism: A conserved thin liquid film follows capillary and disjoining pressure over a physically flat substrate. Drawn contact-angle patterns change the energy below the liquid. Thin places rupture to a precursor, while material moves into rims and pools.
- Interaction tried: Draw wettable routes or repellent divides without changing liquid height or volume. In the browser a repellent vertical stroke caused subsequent withdrawal; restoring the original chemistry preserved the redistributed film. Paired same-seed runs require wettable and repellent writing to cause opposite transport.
- Distinction: This is conserved thin-film hydrodynamics, not the removed active three-dimensional Potts wetting model or geometric condensation/coalescence. The 2025 paper studies how the form of chemical patterning changes rupture and final deposition; it does not introduce a new thin-film equation.
- Source: Tilman Richter · Paolo Malgaretti · Jens Harting, [Modelling of the dewetting of ultra-thin liquid films on chemically patterned substrates: linear spectrum and deposition patterns](https://arxiv.org/abs/2503.03627), submitted 5 March 2025, revised 10 April 2025.
- Limits: Lubrication/Stokes approximation, periodic finite field, molecular precursor and no evaporation or contact-angle hysteresis. Drawing performs work by changing substrate energy; large slopes/contact angles are qualitative. An isolated film eventually settles.
- Outcome: Working prototype added for review after a visible causal intervention and desktop/mobile checks. Finite-volume transport preserves volume, accepted numerical steps decrease the actual discrete free energy, and the five full-grid preset/corner runs remained finite and positive. Rendering uses a fixed physical-height map rather than frame-by-frame contrast normalization.

### Immiscible Darcy displacement with editable permeability

- Date tried: 30 October 2026.
- Current folder: `../porous-displacement/`; title: **The Way Water Chooses**.
- Mechanism: An injected low-viscosity fluid displaces a more viscous immiscible fluid. Saturation changes mobility, the pressure solution redistributes flow, and competing fingers shield and merge. The source's LET relative permeability, weakly oil-wet capillary law and permeability-dependent capillary entry are retained.
- Interaction tried: Reduce permeability with a ridge, restore a gap, and move the inlet along the left boundary. In the browser, a ridge ahead of the initial front diverted water around its ends and left an oil-rich shadow; opening its centre changed the subsequent passage without resetting saturation.
- Distinction: Unlike the retained passive ink model, the visible material changes the flow carrying it. Unlike the removed river landscape, there is no evolving drainage heightfield, erosion or rainfall. It is not an adaptive electrical network or a growing aggregate.
- Source: Paulo L. K. Caetano Chang · Kundan Kumar · Arne Skauge · Kenneth S. Sorbie, [Modelling the onset and evolution of immiscible viscous fingering in porous media](https://arxiv.org/abs/2608.20417), submitted 18 August 2026.
- Limits: A coarse finite-volume reduction rather than the paper's high-resolution experiment fit. Regularized tangent endpoints, an approximate correlated permeability field, explicit transport and a movable finite-width inlet are disclosed. The brush creates contrasts larger than the source's experimental heterogeneity. A fixed physical-time conversion is illustrative, not a calibrated prediction.
- Outcome: Working prototype added for review following the visible ridge/gap experiment. Full numerical results and final acceptance checks are recorded in `../VALIDATION.md`. This mechanism is now already tried; its title or palette should not be reused as a new proposal.

### Follow-up: visible water flow after displacement

On 30 October 2026 the user reported that **The Way Water Chooses** loses visible flow after water covers the field. The colour represented saturation, which can settle while water continues through the pores. Passive display markers were added from the actual staggered water-phase face flux divided by local water content. They follow the numerical time step, change paths with the medium and inlet, and freeze on Pause. The model still computes the same two-phase displacement; this is an improvement to an existing mechanism, not a new proposal. Display markers are supplied in proportion to inlet flux and renewed only on exit or after a disclosed finite visual lifetime. Their renewal neither adds water nor resets the physical field.

### Follow-up: procedurally generated chemical mazes

On 30 October 2026 the user requested a procedurally generated maze for **The Water Answers**. The fixed S-shaped default was replaced by seed-generated chamber/corridor geometry with variable widths, branching passages and blind arms. A second maze preset adds cycles; the open bath also uses seeded obstacles. A distant right-hand chamber connects to the reservoir. Geometry is generated before the simulation, and only its reflecting walls affect the chemical process. New seed generates a different environment; Restart reproduces the same geometry and chemical evolution. Existing wall/erase/move tools remain available. This updates the same chemical-echolocation experiment and is not counted as a new mechanism.


## Interactive processes — 31 October 2026

The user requested implementation of ten further ideas after the research shortlist. These entries record prototypes tried, not user acceptance. The earlier rejected mechanisms remain excluded. Three subagents implement separate models; the parent integrates, checks interactions and maintains the atlas.

### Measurement-only Bell-pair matching

- Date tried: 31 October 2026.
- Current folder: `../measured-bonds/`; title: **The Other Ends Meet**.
- Mechanism: Exact matching dynamics of single-site and Bell measurements on an open chain. Measuring two sites together pairs them and reconnects their former partners, potentially far away; a single-site measurement leaves both partners unpaired. Pair separations have the source’s power-law distribution.
- Interaction tried: Drag between two ends, then separate a site. A paused desktop gesture created the visible gold local and remote pair and changed the number of pairs crossing the chain midpoint. The matching changes rather than a prescribed curve animation.
- Distinction: An exact restricted entanglement representation, not the removed bond-percolation lattice or the removed adaptive transport network.
- Source: Will Holdhusen · Bailey M. McAmis · Armin Rahmani, [Classical Cellular Automaton for Measurement-Only Entanglement Transitions](https://arxiv.org/abs/2609.28743), 2026.
- Limits: A 96-site chain. Bell-state labels and outcomes that do not affect matching are omitted; no claim of a general quantum state or ensemble transition scaling. The bent chain remains open.
- Outcome: Implemented with exact matching invariants, deterministic replay and finite preset/corner checks. Preview exported from the actual browser state. Awaiting user review.

### Resistive magnetic-island reconnection

- Date tried: 31 October 2026.
- Current folder: `../rejoining-fields/`; title: **Where the Lines Rejoin**.
- Mechanism: Coupled magnetic flux and plasma vorticity. Magnetic tension drives fluid, advection changes the field, and resistivity permits changed connections as two islands merge. Fixed flux contours show actual evolving connectivity.
- Interaction tried: Push and turn the plasma without drawing magnetic flux. In the desktop browser, an impulse deformed the contours; subsequent evolution rejoined central contours and carried passive fluid markers. Mobile field/control layout and dragging were checked.
- Distinction: Active magnetic back-reaction and resistive topology change, unlike retained passive ink or the removed wave/elasticity models.
- Source: Vinay Kumar · Axel Brandenburg, [Magnetic Prandtl number dependence of plasmoid-mediated reconnection](https://arxiv.org/abs/2605.18946), 2026.
- Limits: A 65² incompressible constant-density reduction, with source initial two-island flux and conducting/free-slip walls. A broadened sheet and modest Lundquist number resolve smooth reconnection; the source’s high-resolution plasmoid regime and scaling are not reproduced. Arakawa brackets, a discrete sine-transform Poisson solve and adaptive Heun steps calculate the process. External gestures add kinetic energy. The isolated system naturally dissipates.
- Outcome: Four tests establish the discrete Poisson solve, ideal magnetic/fluid energy exchange, dissipation and changed central flux, and later magnetic response to a fluid-only impulse. Five preset/corner runs remain finite. Actual browser snapshot recorded; awaiting user review.


### A rocked intruder in a frictional packing

- Date tried: 31 October 2026.
- Current folder: `../granular-intruder/`; title: **What Gives Way**.
- Mechanism: A large disk driven by an explicit oscillatory force displaces bidisperse grains. Hertz normal contacts, stored tangential slip, rotations and basal friction transmit changing force chains. Arrest and breakthrough emerge from the contact forces.
- Interaction tried: Steer the applied force and disturb supporting grains without resetting positions or contact history. The desktop route and contact loads respond to the new aim. An unedited seeded run alternates advancement and long plateaus.
- Source: Douglas Daniel de Carvalho · Erick de Moraes Franklin, [Undulatory forcing of an intruder through granular media: effects of frequency and packing fraction](https://arxiv.org/abs/2606.02853), 2026.
- Limits: A smaller, softer dimensionless packing with illustrative material constants; no quantitative optimal-frequency claim. The drive and brush supply explicit external work. Closed walls and stable jams can stop the intruder. No random kicks manufacture passage.
- Outcome: Implemented with physical contact, dissipation, deterministic intervention and parameter checks. Actual load links use a fixed logarithmic brightness scale. Awaiting user review.

### A pinned cornerstone in a granular hopper

- Date tried: 31 October 2026.
- Current folder: `../cornerstone-flow/`; title: **One Grain Holds the Passage**.
- Mechanism: Gravity and frictional contacts form load-bearing arches above a real opening. One externally held grain changes the possible arch supports. An external feeder recirculates discharged grains through a non-overlapping insertion queue.
- Interaction tried: Move the held grain, apply an explicit local exciter, and change the opening. The default browser run discharged 44 grains and then remained jammed for more than 80 model seconds. The held exciter changed the contacts and restarted discharge from 44 to 70, followed by another lasting arch. Moving the cornerstone then allowed three more exits. A wider opening resumes sustained discharge in same-state numerical probes.
- Distinction: Mechanical support and force balance, unlike a prescribed stochastic flow/clog toggle or removed electrical-network adaptation. It shares a DEM helper with the intruder but has a different gravity/outlet/pinning process.
- Source: Jesse M. Hanlan · Sam Dillavou · Andrea J. Liu · Douglas J. Durian, [Cornerstones are the Key Stones: Using Interpretable Machine Learning to Probe the Clogging Process in 2D Granular Hoppers](https://arxiv.org/abs/2407.05491), 2024. This older source was selected for its specific manipulable causal experiment.
- Limits: The paper is experimental; this browser DEM is a constitutive approximation, not its machine-learning classifier or a calibrated discharge statistic. The feeder supplies potential energy explicitly. There is no automatic arch-breaking.
- Outcome: Implemented with equilibrium-arch, support-removal, feeder accounting and paired-flow checks. Awaiting user review.

### Genetic isolation after environmental change

- Date tried: 31 October 2026.
- Current folder: `../separate-futures/`; title: **When Nearness Is Not Enough**.
- Mechanism: Spatial sexual reproduction depends jointly on mating distance and genetic compatibility. Finite binary genomes recombine and mutate; an alternative preset uses the exact infinite-genome similarity recurrence. Changes of assortativity can fragment or extinguish populations.
- Interaction tried: Raise the compatibility threshold, transplant a neighbourhood, or thin a patch without editing genes. Raising the threshold from .80 to .90 split compatibility components; subsequent actual reproduction produced twelve groups and population 672 by generation 920 in the browser scenario.
- Distinction: Genetic inheritance and reproductive isolation, not preset cyclic species, chemotaxis or visual recolouring. Stable group colours follow overlap but are not themselves hereditary traits.
- Source: Larissa G. Landucci · Marcus A. M. de Aguiar, [Speciation, extinction and explosions induced by sudden environmental changes](https://arxiv.org/abs/2609.13349), 2026.
- Limits: Smaller reflecting lattice and population, qualitative demographic calibration; the density-normalization choice is disclosed. Real extinction is possible. No ecological adaptation or species prediction is claimed.
- Outcome: Implemented with allele inheritance, exact recurrence and demographic checks. An audit caught rounding of small drag increments; continuous cohort baselines now preserve full displacement, including offspring born during a hold. Awaiting user review.

### Microtubule polarity through material renewal

- Date tried: 31 October 2026.
- Current folder: `../renewing-direction/`; title: **A Direction Outlives Its Threads**.
- Mechanism: Both ends of each filament switch stochastically between growth and retraction. Completely lost filaments are replaced at six birth sites; orientation samples the actual filaments crossing that site. Optional newborn checkpoint samples local parallel support. Existing filaments never turn to align.
- Interaction tried: Trigger retraction and plant an opposite minority. The brush changes end states or explicitly replaces a few filaments. The browser showed complete loss of the original cohort while a directional bias remained; numerical paired runs compare feedback with unbiased replacement.
- Distinction: Orientation inherited only at actual birth during turnover, not the retained Vicsek heading-alignment rule or the removed Hopfield memory.
- Source: Hannah G. Scanlon · Gibarni Mahata · Anna C. Nelson · Scott A. McKinley · Melissa M. Rolls · Maria-Veronica Ciocanel, [Nucleation feedback can drive establishment and maintenance of biased microtubule polarity in neurites](https://arxiv.org/abs/2506.12209), 2025.
- Limits: The source’s one-dimensional 60-filament geometry, switching rates and local-feedback rule are retained; finite-tubulin growth limitation is omitted. Timing and mean lengths are qualitative. Separate rows are an inspection layout, not a second spatial dimension. External tools are not a full injury model.
- Outcome: Implemented with turnover, local-support, bias-retention and opposite-seed tests. Checkpoint phases remove failed filaments immediately, before another newborn can sample them. Awaiting user review.

### Explicit finite-particle grain-boundary pinning

- Date tried: 31 October 2026.
- Current folder: `../pinned-boundaries/`; title: **What Holds the Edge**.
- Mechanism: Curvature shortens explicitly tracked grain interfaces. Finite circular inclusions remove actual interface segments and introduce independent sliding contacts. Tension relaxes those contacts toward a 90-degree meeting. Removing or dissolving an inclusion reconnects the cut interface.
- Interaction tried: Release three particles around one grain, or place inclusions on a moving boundary. The released browser grain resumes shrinking while neighbours remain held. A dissolution preset gradually removes physical constraints.
- Distinction: Explicit front/contact geometry, not Potts spin coarsening, Allen–Cahn textures or a cosmetic variant of the removed glass model.
- Source: Sebastian Florez · Marc Bernacki, [Efficient and accurate simulation of the Smith-Zener pinning mechanism during grain growth using a front-tracking numerical framework](https://arxiv.org/abs/2501.11130), 2025.
- Limits: Twelve isolated grains in a matrix, without whole-polycrystal triple junctions or T1 topology statistics. Small grains have a disclosed resolution cutoff. A fully held field can genuinely settle.
- Outcome: Implemented with decreasing length energy, curvature area-loss, circle projection/contact-angle, inclusion exclusion and release-versus-held tests. Awaiting user review.

### Crystal dislocations on a changed support

- Date tried: 31 October 2026.
- Current folder: `../curved-crystal/`; title: **The Ground Changes the Meeting**.
- Mechanism: Three complex triangular-lattice amplitudes relax a surface free energy on a fixed Monge support. Geometry changes the surface differential operator and hence actual Burgers-defect motion and annihilation. Bright points reconstruct the density of the evolving amplitudes.
- Interaction tried: Raise a patch, flatten it while preserving the crystal, and explicitly introduce another neutral defect pair after repair. The browser began with four cores and later reached zero; flattening retained the repaired state. Paired numerical runs retain different cores after editing the support.
- Distinction: Lattice elasticity, Burgers charges and metric-dependent repair, not the removed complex phase turbulence or rotating decorative particles.
- Source: Marcello De Donno · Luiza Angheluta · Marco Salvalaglio, [Dislocation dynamics on deformable surfaces](https://arxiv.org/abs/2602.14348), 2026.
- Limits: The source’s fixed-support case, not its fully coupled buckling/self-propulsion. A periodic cotangent mesh and normalized bounded PFC polynomial are disclosed reductions; quantitative atomic speeds and large rotations are not claimed. Editing support supplies work. No automatic defect reinsertion.
- Outcome: Implemented with free-energy descent, flat compatibility, neutral defect topology, changed-support response and parameter-corner tests. Awaiting user review.

### Colliding excitable spiral territories

- Date tried: 31 October 2026.
- Current folder: `../spiral-territories/`; title: **Where Two Fronts Meet**.
- Mechanism: Aliev–Panfilov excitation and recovery create real spiral sources. Colliding wave fronts and reflecting boundaries alter their territories and slow core paths. Rings and trails detect phase winding in the calculated fields.
- Interaction tried: Draw and remove insulating boundaries, give a stimulus or leave a temporary refractory strip. A boundary near one source changes its subsequent fronts and core path. The unedited initial pair survives beyond time 173; no scripted point force moves the cores.
- Distinction: Excitable/refractory kinetics and wave collision interfaces, unlike cyclic ecological competition, Gray–Scott chemistry or the removed complex phase oscillator field.
- Source: Tim De Coster et al., [Laws of mutual spiral wave interaction in excitable media](https://arxiv.org/abs/2603.05745), 2026.
- Limits: A 192² PDE model with representative source kinetics, not a quantitative fit of the paper’s asymptotic response-function boundary integrals. Winding-based core identification is approximate near walls or during breaking.
- Outcome: An initial pair that vanished before the opening view was replaced by a larger resolved domain and more separated preparation. Sustained pair, resting/refractory behavior, no-flux walls, causal edits and corners are checked. Awaiting user review.

### A quantum engine with a minimal measurement record

- Date tried: 31 October 2026.
- Current folder: `../measured-ascent/`; title: **Enough to Take a Step**.
- Mechanism: Two free fermions evolve as complex occupied orbitals in a tilted lattice. Reading only the leftmost occupied position permits a wall behind it while retaining conditional coherence. Reading every occupied position removes that coherence. Subsequent evolution uses the actual post-measurement Slater state.
- Interaction tried: Hold to postpone a reading, release for exactly one measurement, compare edge-only and full records, or stop measurement altogether. The pair map, density and absolute-site wall ladder display calculated probabilities and actual uphill wall steps.
- Distinction: Conditional quantum measurement and preserved collective coherence, not classical diffusion/resetting, the removed kicked rotor or a moving probability animation.
- Source: Kangqiao Liu · Jie Gu · Deyou Chen, [Collective advantage from a minimal record in a quantum information engine](https://arxiv.org/abs/2609.24558), 2026.
- Limits: Two fermions and a finite reflecting right truncation replace the half-line. Crank–Nicolson evolution is approximate unitary time integration. No optimized thermodynamic efficiency, erasure-cost or heat-bath reproduction is claimed. Automatic readings are an explicit selected protocol; stop and cancellation do not queue hidden reads.
- Outcome: Implemented with norm/energy, exact two-particle projection comparison, coherence, release/cancel and protocol-state tests. The initial overly empty view was replaced by a fixed 12-site pair zoom plus actual absolute ascent. Awaiting user review.
