# Timelapse

A browser editor for photos taken from one viewpoint. Open it through the shared project preview at `http://127.0.0.1:4000/timelapse/`.

Add photos with the file picker or by dropping them onto the page. Reorder frames by dragging their thumbnails, using **Move left** / **Move right**, sorting by name, or reversing the sequence. The first photo becomes the reference; any other frame can replace it.

Alignment runs in a Web Worker. ORB detects distinctive points, Hamming KNN with a ratio test matches them, and RANSAC followed by least-squares refinement estimates translation, rotation and uniform scale. By default, the top 30% is excluded to avoid moving clouds. Up to three previously aligned neighbors are considered alongside the reference. Unreliable results are marked **!** and can be adjusted manually. Strong parallax or perspective changes may need manual correction.

Click **Edit anchors** to inspect and edit the alignment search areas on the reference photo. The automatic area is shown as an editable box. Amber dots are detected ORB points; green dots are the accepted matches used to align the selected frame after the latest **Align frames** run. Select another thumbnail to inspect that frame's matches. **Show detected points** hides the amber dots without changing alignment. Regions and accepted matches persist after reloading.

Drag a region to move it or a corner to resize freely. Use **Draw region** and drag on the photo to add an area around a static landmark; the first drawn area replaces the automatic search mask. Further areas form a union. Select a region to remove it, or use **Reset auto** to restore the chosen automatic preset. Focus a region or its corner and use arrow keys for pixel adjustments, with Shift for ten pixels; Delete removes the focused region. Click **Align frames** to apply changed areas. Until then, the existing frame transforms stay in place and previous matches from a different region configuration are hidden. An empty region list disables alignment. For other source images, the search mask follows the last known transform with a small search margin, while target descriptors and all accepted matches are strictly restricted to the selected reference areas.

The automatic crop uses the intersection of all transformed frame bounds. Click **Edit crop** to see the extent of all aligned frames with a shared crop box. Blue dashed outlines show every frame, and the green region marks the area covered by all of them. The view fits every transformed frame, including portions outside the reference canvas. Drag inside the box to move it; drag any corner to resize while preserving the reference aspect ratio. **Crop size** also resizes around the selection center. Arrow keys move the focused box by one original-image pixel; hold Shift for ten pixels. Focus a corner to resize with the keyboard. Click **Done cropping** to preview the result, or **Auto** to restore the automatic shared area. Custom crops are constrained to the reference canvas; moving beyond the coverage of another aligned photo may expose an empty edge in that frame. One crop applies to every frame, to video, and to collages.

Exposure matching uses the median brightness ratio of shared, unclipped areas, limited to ±2 EV. Manual exposure, contrast and saturation apply to each photo. Seasonal and lighting changes can still require manual adjustments.

Original files, preview copies, frame order, crop position and settings are saved in IndexedDB in the current browser. Preview copies have a longest side of 1400 px; export reads originals one at a time. Clearing site data removes the saved project.

MP4 uses H.264 through WebCodecs and Mediabunny with exact timestamps: each photo lasts `1 / fps` seconds. The browser must provide an H.264 encoder. The **Slideshow** tab starts playback; removing a frame during playback continues from its neighbor. JPEG collages support vertical, horizontal and diagonal stripes, a custom angle and reversed order. The output longest side applies after cropping, without upscaling the source.

Dependencies are bundled locally, without a CDN:

- `vendor/opencv.js`: OpenCV 4.12.0, npm `@techstark/opencv-js@4.12.0-release.1`, Apache 2.0; [OpenCV feature matching](https://docs.opencv.org/4.x/d7/dff/tutorial_feature_homography.html).
- `vendor/mediabunny.mjs`: `mediabunny@1.62.1`, MPL 2.0; [writing video files](https://mediabunny.dev/guide/writing-media-files).

Geometry and alignment-region checks: `node --test timelapse/geometry.test.mjs timelapse/anchors.test.mjs`.
