# The Way Water Chooses

An advancing front keeps the paths you change. Water finds a few ways through the oil. Block one of them and watch where the next path begins.

Draw a ridge ahead of an advancing finger. Water changes direction, competing fingers take more flow, and some oil can remain behind. Open a gap later, or move the inlet: the material already displaced is still there. Moving marks show water continuing through established channels after the colour stops changing. Their direction and speed follow the calculated water flow; Pause freezes them too.

## Source

Paulo L. K. Caetano Chang · Kundan Kumar · Arne Skauge · Kenneth S. Sorbie. [Modelling the onset and evolution of immiscible viscous fingering in porous media](https://arxiv.org/abs/2608.20417) (2026).

## Implementation

```text
φ ∂ₜSα + ∇·uα = 0; uα = −k krα(S)/μα ∇Pα
Pc = Po−Pw ∝ k⁻½ [A+B tan(π/2−πSₙᶜ)]
uw = fw ut + k λwλo/(λw+λo) ∇Pc
```

The source’s two-phase Darcy displacement, RP2 LET relative permeability and Pc2 weakly oil-wet capillary law are retained: L=3.52,E=3.20,T=2,Swr=.13,Sor=.20; A=−.017,B=.002,C=.7. Its 2026 finding links fine channelling and permeability-dependent capillary entry to thin fingers and persistent bypassed oil. This 96² conservative finite-volume reduction uses an IC-preconditioned pressure solve and explicit bounded transport substeps. It illustrates the mechanism rather than reproducing the source’s 1000² IMEX experiment fit. Coarse upwinding broadens thin fingers; widths and trapped-oil fractions are not calibrated. The tangent law is regularized at normalized saturation .005/.995. Harmonic capillary mobility approximates degenerate endpoint transport. Two correlated permeability scales replace the published RGS field. The brush externally changes permeability beyond the experiment’s modest contrast; Open passage restores it. A movable finite-width inlet replaces uniform injection. Water input and water output are conserved and separately counted. Continued injection can settle into persistent channels while water keeps flowing. Passive display tracers follow the interpolated water-phase face flux divided by local water content, using midpoint integration. They do not affect the fluid. They enter according to inlet flux and are renewed on exit or after 0.65 pore volumes; this renews only the display markers. Their trails retain 14 numerical steps and freeze when paused. One pore volume corresponds to the source’s approximately 7.9 days.

Choose Block flow, Open passage or Move inlet, then press and drag. Moving the inlet changes its position along the left edge without adding an uncounted pulse of fluid. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/porous-displacement/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
