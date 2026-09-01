# 4D Viewer

[![4D Viewer](https://nebelmesser.com/4d/img/preview.png)](https://nebelmesser.com/4d/viewer.html)

A single-file tesseract (4-cube) viewer. Open the [live page](https://nebelmesser.com/4d/viewer.html)
or the local `4d/viewer.html`. It loads Three.js from a CDN; nothing else is required.

A tesseract is two ordinary cubes sitting at W = −1 and W = +1, with matching
corners joined by edges that run only along W. The viewer rotates that object
in four dimensions, projects it down to 3D, and draws the result. Blue is the
negative-W cube, red is the positive-W cube. Edges that cross W interpolate
from one color to the other.

The camera then looks at that 3D picture — either as a single view or as a
stereo pair, so the 4D shape can be seen with depth.

## Inspiration

[![Visualizing 4D part 3: Projections and Perspective](https://img.youtube.com/vi/bAinj6lcv_4/0.jpg)](https://www.youtube.com/watch?v=bAinj6lcv_4)


## Stereo

The bar at the top picks the layout:

- **Mono** — one camera, full window.
- **Cross-eyed** (default) — two images, swapped: right eye on the left,
  left eye on the right. Cross your eyes until they fuse.
- **Parallel** — left eye on the left image, right eye on the right. Look
  through the screen as if into the distance.

Stereo strength is the eye separation. The convergence plane sits on the
object, so changing the slider should not make the cubes slide sideways.

## Rotation

4D rotations happen in a plane spanned by two axes. The viewer exposes the
usual six: XY, XZ, YZ in ordinary 3-space, and XW, YW, ZW into the fourth
axis.

| Input | Plane |
| --- | --- |
| Drag, or one finger | XZ · YZ (3D orbit; W is held still) |
| Shift + drag, two-finger pan, or scroll | XW · YW |
| Shift + scroll, pinch, or trackpad pinch | ZW |

On a phone, **Tilt rotates** (in the menu) maps device motion onto a plane:

- **Off** — ignore the sensors.
- **3D (around W)** — tilt orbits XZ and YZ, same as a one-finger drag.
- **4D (XW · YW)** — default; tilt turns the object through W.
- **ZW plane** — tilt is a single ZW rotation.

**Invert tilt** flips the sense. While a finger is down, tilt is locked so
the two inputs do not fight. iOS asks for motion permission on the first tap.

## Menu

The hamburger opens the settings (always open on a wide desktop):

- **Cube size** — how large the tesseract is in the frame.
- **Stereo strength** — eye separation (hidden in effect in Mono).
- **Perspective** — 4D projection distance. Smaller values exaggerate how
  much W stretches or shrinks the cubes; larger values flatten the projection
  toward an orthographic look.
- **Fill W± cubes** — translucent faces on the two bounding cubes.
- **W-axis slices** — extra wireframe cubes at even W values between −1 and
  +1, colored on a blue→red ramp. **Slice count** is 2–16.

## Axes

The HUD at the bottom is the same four axes after the current 4D rotation:
X red, Y green, Z blue, W yellow. An axis that points nearly at the camera
becomes a circle instead of an arrow (solid if it points toward you, dashed
if it points away).

## License

MIT. Made by [Nebelmesser](https://nebelmesser.com/).
