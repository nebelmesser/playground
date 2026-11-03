# Where the Lines Rejoin

Magnetic reconnection. Two magnetic islands press against each other. The field carries the fluid, and the fluid carries the field, until a connection can change.

Follow one pale contour through the narrow central current sheet. Connections cross the sheet and a shared island forms. Moving copper threads follow the actual fluid velocity. Drag across a contour, release it, and watch the field push back. Higher viscosity slows this response.

## Source

Vinay Kumar · Axel Brandenburg. [Magnetic Prandtl number dependence of plasmoid-mediated reconnection](https://arxiv.org/abs/2605.18946) (2026).

## Implementation

```text
B=(∂yA,−∂xA), u=(∂yψ,−∂xψ), ω=−∇²ψ
∂tA={ψ,A}+η∇²A
∂tω={ψ,ω}+{A,∇²A}+ν∇²ω
```

A 65² incompressible, constant-density reduction of the source’s isothermal resistive MHD. Its initial two-island flux and conducting, free-slip walls are retained; the current sheet is broadened to resolve it. A sine-transform Poisson solve and Arakawa brackets couple the magnetic flux to fluid vorticity; adaptive Heun steps obey wave and diffusion limits. The source minimises compressibility with a large sound speed; here pressure enforces incompressibility exactly. Browser resistivities and resolution describe slow, smooth reconnection, not the paper’s high-Lundquist plasmoid regime or its scaling result. The initial state is only approximately force-balanced. Dragging injects external kinetic energy. Passive fluid trails do not change the fields. The isolated system dissipates and eventually rests; it has no automatic restart or hidden stirring.

Push the plasma by dragging, or turn a small patch with the vortex tool. These gestures give the fluid momentum without drawing magnetic lines. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/rejoining-fields/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
