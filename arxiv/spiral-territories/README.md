# Where Two Fronts Meet

Spiral sources share an excitable field. Each source sends a front into recovering tissue. Where fronts meet changes where their sources can go.

Follow the small centre rings and the trails they leave. The fronts move quickly; their sources move slowly. Add a boundary near a source or let a temporary recovering strip interrupt a front.

## Source

Tim De Coster · Arstanbek Okenov · Debora Hoogendijk · Arman Nobacht · Mathilde Rivaud · Antoine de Vries · Daniël Pijnappels · Vivi Rottschäfer · Hans Dierckx. [Laws of mutual spiral wave interaction in excitable media](https://arxiv.org/abs/2603.05745) (2026).

## Implementation

```text
∂ₜu = D∇²u − 8u(u−0.08)(u−1) − uv + I
∂ₜv = (ε+0.2v/(u+0.3))[−v−8u(u−1.1)]
∂ₙu=0 on outer and painted boundaries
```

The 2026 paper derives interaction laws for excitable spiral sources from collision interfaces, and simulates Aliev–Panfilov kinetics. This prototype integrates those two-variable kinetics directly; it does not insert a fitted attraction or claim quantitative agreement with the paper’s response-function integrals. Representative reduced parameters k=8, a=0.08, b=0.1, μ₁=0.2, μ₂=0.3; 192² grid, Δx=0.6, Heun Δt=0.008, 12 substeps per tick. An initially broken excited strip prepares one or two sources; no clock or automatic restart creates new waves. Outer and editable walls use no-flux faces. Writing a wall removes local excitation/recovery as an explicit intervention; opening restores resting tissue. A stimulus sets local u to at least 0.98, with I=0.2 while held; a refractory stroke sets u=0 and v≥1.5. Centre rings estimate winding around (u,v)=(0.35,0.6); they can miss or misidentify a core during wave breaking or close to walls. Trails retain up to 220 samples over the last 80 model time units. Inactive tissue stays inactive until stimulated. This is an excitable and recovering medium, not a simulation of a patient or a generic complex phase field.

Build or open reflecting boundaries. Excite tissue with a brief press, or hold to supply a small current. Make refractory leaves a temporary recovering patch rather than a permanent wall. You can also drag with the main mouse button held down, or draw with a finger.

Open through the shared preview: http://127.0.0.1:4000/arxiv/spiral-territories/

Model: `model.mjs`. Shared interface and renderer: `../shared/`. The page supports pause, single steps, replay with the same seed, a new seed, speed and presets. The URL reproduces the starting world and parameters; elapsed time is not stored.
