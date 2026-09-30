# Escher — Conformal Droste Lab

Interactive WebGL2 image tool for building a perspective-aware Droste effect from a rectangular source crop and an arbitrary convex inner frame.

## Use

Open `/escher/` from the repository preview, drop a PNG/JPEG/WebP image, place the four **INNER** handles around the next frame, and crop the source with the rectangular **OUTER** handles. A new image and **Reset** place INNER on the strongest quadrilateral in the photograph, or on a centered rectangle when none is clear or the guess is far from a rectangle, then expand OUTER outward to the largest rectangle that matches INNER's aspect and still fits the photograph. The area between those contours is the fundamental image strip. The selected OUTER crop fills the result; pixels outside it are not rendered. Drag inside INNER or OUTER to move that frame. The result heading can show the photograph at its original aspect, or center-crop it to 2:3, 3:4, 9:16, square, 16:9, 4:3, or 3:2. A chosen aspect keeps the inner frame's center in the middle of the frame and does not move the source handles. Use **INNER DETAIL** in the source-panel heading to enlarge only the inner-frame area for precise mouse or arrow-key alignment. The app starts in still-image mode: choose an exact phase with **Frame / Zoom**, then export a full-resolution PNG. Its 0% and 100% endpoints are the same projective-recursion frame, so the optional preview and the H.264 MP4 close without a jump. Each exported cycle lasts as long as one animation loop at the current speed; the video control repeats that cycle from one to ten times. Video resolution is the source crop, 720p, 1080p, 1440p, or 4K on the long edge; both frame dimensions are even. The current image, both frames, direction, transformation settings, video resolution, and cycle count are restored from local browser storage after a reload.

## Implementation

- TypeScript and Vite source lives in `app/`.
- Canvas 2D keeps OUTER axis-aligned and locked to the average opposite-edge proportions of INNER. A new image and **Reset** expand that rectangle outward until it meets the photograph, and a corner can sit on the image boundary. The editor validates the convex INNER frame and enforces inner/outer containment. The title-bar **INNER DETAIL** mode crops the editor viewport around INNER without changing its source coordinates. On a touch screen, a swipe outside OUTER scrolls the page, and so does a swipe that keeps pushing a frame after that frame has reached its limit.
- A pair of 3 × 3 DLT homographies identifies the whole **OUTER** frame with **INNER**, producing the straight infinite Droste plane and its projective perspective.
- A WebGL2 fragment shader applies the continuous inverse power map `exp(γ · log(z))`. It then folds the resulting point through the projective recursion until it lies in the source strip. A distributed projective correction identifies both sides of the logarithm branch exactly, eliminating the hard left-hand seam without feathering the image. A rotated four-sample subpixel grid antialiases recursion joins without applying a blur kernel to the photograph.
- The recursion period is derived entirely from the selected OUTER and INNER frames. **Spiral strength** changes the twist pitch and **Left / Right** selects its sign. Direction-specific branch compensation keeps the two twist directions geometrically equivalent without exposing a hard logarithmic seam. Spiral strength does not change the zoom phase.
- **Frame / Zoom** interpolates one actual OUTER-to-INNER projective recursion step. Phase 1 is identified exactly with phase 0 rather than approximated by a radial scale, making the animation endpoints identical.
- PNG export rerenders at the selected OUTER crop dimensions, up to the GPU's maximum texture/viewport size.
- MP4 export steps through one to ten copies of one animation loop at 60 fps. The loop lasts as long as the live preview takes to travel the same phase at the current speed, and a negative speed plays that loop backward. The chosen long edge keeps the crop aspect, then both dimensions are rounded to even numbers and clamped to the GPU limit. Within each cycle, phase runs from 0 up to, but not including, 1, so the identical endpoints are not stored twice.

## Build

```bash
cd escher/app
npm install
npm run build
```

The build writes `index.html` and stable `assets/escher.{js,css}` files into `escher/` for Jekyll to serve.
