import './style.css';
import { SourceEditor, type FrameSelection } from './editor';
import { DrosteRenderer, type OutputCrop, type RenderState } from './renderer';
import {
  VIDEO_FRAME_COUNT,
  VIDEO_PRESETS,
  encodeMp4,
  isVideoPreset,
  videoFrameSize,
  videoPresetFits,
  type VideoPreset,
} from './video';

function element<T extends HTMLElement>(selector: string): T {
  const result = document.querySelector<T>(selector);
  if (!result) throw new Error(`Missing interface element: ${selector}`);
  return result;
}

const sourceCanvas = element<HTMLCanvasElement>('#source-canvas');
const resultCanvas = element<HTMLCanvasElement>('#result-canvas');
const sourceFrame = element<HTMLElement>('#source-frame');
const resultFrame = element<HTMLElement>('#result-frame');
const canvasGrid = element<HTMLElement>('.canvas-grid');
const sourceCard = element<HTMLElement>('.source-card');
const innerDetailButton = element<HTMLButtonElement>('#inner-detail-button');
const canvasTip = element<HTMLElement>('#canvas-tip');
const fileInput = element<HTMLInputElement>('#file-input');
const openButton = element<HTMLButtonElement>('#open-button');
const dropOverlay = element<HTMLElement>('#drop-overlay');
const imageMeta = element<HTMLElement>('#image-meta');
const gpuState = element<HTMLElement>('#gpu-state');
const webglError = element<HTMLElement>('#webgl-error');
const fpsReadout = element<HTMLElement>('#fps');
const outputAspectSelect = element<HTMLSelectElement>('#output-aspect');
const resetButton = element<HTMLButtonElement>('#reset-button');
const pngButton = element<HTMLButtonElement>('#png-button');
const mp4Button = element<HTMLButtonElement>('#mp4-button');
const videoResolutionSelect = element<HTMLSelectElement>('#video-resolution');
const videoCyclesSelect = element<HTMLSelectElement>('#video-cycles');
const mp4Duration = element<HTMLElement>('#mp4-duration');
const exportNote = element<HTMLElement>('#export-note');
const exportSize = element<HTMLElement>('#export-size');
const videoSize = element<HTMLElement>('#video-size');

const directionLeftButton = element<HTMLButtonElement>('#direction-left');
const directionRightButton = element<HTMLButtonElement>('#direction-right');
const scaleInput = element<HTMLInputElement>('#scale');
const phaseInput = element<HTMLInputElement>('#phase');
const speedInput = element<HTMLInputElement>('#speed');
const animateInput = element<HTMLInputElement>('#animate');
const speedRow = element<HTMLElement>('#speed-row');

const scaleValue = element<HTMLOutputElement>('#scale-value');
const phaseValue = element<HTMLOutputElement>('#phase-value');
const speedValue = element<HTMLOutputElement>('#speed-value');
const autoScaleValue = element<HTMLElement>('#auto-scale');

const STORAGE_KEY = 'escher-workspace-v1';

const OUTPUT_ASPECTS = [
  { value: '2:3', label: '2:3', ratio: 2 / 3 },
  { value: '3:4', label: '3:4', ratio: 3 / 4 },
  { value: '9:16', label: '9:16', ratio: 9 / 16 },
  { value: '1:1', label: 'SQUARE', ratio: 1 },
  { value: '16:9', label: '16:9', ratio: 16 / 9 },
  { value: '4:3', label: '4:3', ratio: 4 / 3 },
  { value: '3:2', label: '3:2', ratio: 3 / 2 },
] as const;

type OutputAspect = (typeof OUTPUT_ASPECTS)[number]['value'];

type StoredWorkspace = {
  version: 1;
  image: string;
  fileName: string;
  frames: FrameSelection;
  direction: -1 | 1;
  twistStrength: number;
  phase: number;
  speed: number;
  videoResolution?: VideoPreset;
  videoCycles?: number;
  outputAspect?: OutputAspect;
};

let renderer: DrosteRenderer | null = null;
let dirty = true;
let phase = Number(phaseInput.value);
let direction: -1 | 1 = 1;
let currentFileName = 'escher-demo';
let persistedImage: string | null = null;
let restoringWorkspace = false;
let saveTimer: number | null = null;
let previousFrameTime = performance.now();
let fpsStart = performance.now();
let fpsFrames = 0;
let dragDepth = 0;
let exporting = false;

try {
  renderer = new DrosteRenderer(resultCanvas);
} catch (error) {
  gpuState.classList.add('error');
  gpuState.lastChild!.textContent = ' WEBGL2 ERROR';
  webglError.hidden = false;
  pngButton.disabled = true;
  mp4Button.disabled = true;
  videoResolutionSelect.disabled = true;
  videoCyclesSelect.disabled = true;
  outputAspectSelect.disabled = true;
  exportNote.textContent = error instanceof Error ? error.message : 'WebGL2 initialization failed.';
}

const editor = new SourceEditor(sourceCanvas, {
  onChange: () => {
    sourceCard.classList.add('has-edited');
    updateSourceLayout();
    updateGeometry();
    scheduleWorkspaceSave();
  },
  onInvalid: () => {
    sourceCard.classList.remove('invalid');
    requestAnimationFrame(() => sourceCard.classList.add('invalid'));
  },
});

// The built-in image is a real workspace too. Keeping a compact copy here
// makes persistence testable before the first upload and lets RESET/frame
// edits survive a reload in exactly the same way as an uploaded image.
persistedImage = editor.storageDataUrl();

if (renderer) renderer.setImage(editor.imageCanvas, editor.width, editor.height);
updateImageLayout();
updateGeometry();
void restoreWorkspace();

function updateImageLayout(): void {
  updateSourceLayout();
  imageMeta.textContent = `${currentFileName.toUpperCase()} · ${editor.width} × ${editor.height}`;
  updateResultLayout();
  dirty = true;
}

function updateSourceLayout(): void {
  sourceFrame.style.setProperty('--image-ratio', String(editor.viewAspect));
}

function isOutputAspect(value: unknown): value is OutputAspect {
  return OUTPUT_ASPECTS.some((aspect) => aspect.value === value);
}

function selectedOutputAspect(): OutputAspect {
  return isOutputAspect(outputAspectSelect.value) ? outputAspectSelect.value : '1:1';
}

function outputFrame(): { width: number; height: number; crop: OutputCrop } {
  const outer = editor.selection.outer;
  const fullWidth = Math.max(1, Math.round(editor.width * (outer[1].x - outer[0].x)));
  const fullHeight = Math.max(1, Math.round(editor.height * (outer[3].y - outer[0].y)));
  const ratio = OUTPUT_ASPECTS.find((aspect) => aspect.value === selectedOutputAspect())?.ratio ?? 1;
  const sourceAspect = fullWidth / fullHeight;
  const cropWidth = ratio > sourceAspect ? 1 : ratio / sourceAspect;
  const cropHeight = ratio > sourceAspect ? sourceAspect / ratio : 1;
  return {
    width: Math.max(1, Math.round(fullWidth * cropWidth)),
    height: Math.max(1, Math.round(fullHeight * cropHeight)),
    crop: {
      x: (1 - cropWidth) / 2,
      y: (1 - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    },
  };
}

function outputDimensions(): { width: number; height: number } {
  const frame = outputFrame();
  return { width: frame.width, height: frame.height };
}

function updateResultLayout(): void {
  const size = outputDimensions();
  resultFrame.style.setProperty('--image-ratio', String(size.width / size.height));
  exportSize.textContent = `${size.width} × ${size.height} PX`;
  refreshVideoOptions();
}

function selectedVideoPreset(): VideoPreset {
  return isVideoPreset(videoResolutionSelect.value) ? videoResolutionSelect.value : '1920';
}

function isVideoCycles(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 10;
}

function selectedVideoCycles(): number {
  const cycles = Number(videoCyclesSelect.value);
  return isVideoCycles(cycles) ? cycles : 1;
}

function updateVideoDurationLabel(): void {
  const seconds = selectedVideoCycles() * 4;
  mp4Duration.textContent = `${String(seconds).padStart(2, '0')} SEC`;
}

function selectedVideoSize(): { width: number; height: number } {
  return videoFrameSize(
    selectedVideoPreset(),
    outputDimensions(),
    renderer?.maximumOutputSize ?? 8192,
  );
}

function refreshVideoOptions(): void {
  const maxEdge = renderer?.maximumOutputSize ?? 8192;
  const crop = outputDimensions();
  for (const option of videoResolutionSelect.options) {
    if (!isVideoPreset(option.value)) continue;
    const preset = VIDEO_PRESETS.find((item) => item.value === option.value);
    if (!preset) continue;
    const fits = videoPresetFits(option.value, maxEdge);
    option.disabled = !fits;
    option.title = fits ? '' : 'Larger than this GPU can render';
    if (!fits) {
      option.textContent = preset.label;
      continue;
    }
    const size = videoFrameSize(option.value, crop, maxEdge);
    option.textContent = `${preset.label} · ${size.width}×${size.height}`;
  }

  const selected = videoResolutionSelect.selectedOptions[0];
  if (!selected || selected.disabled) {
    const fallback = [...videoResolutionSelect.options].find((option) => option.value === '1920' && !option.disabled)
      ?? [...videoResolutionSelect.options].find((option) => !option.disabled);
    if (fallback) videoResolutionSelect.value = fallback.value;
  }

  const size = selectedVideoSize();
  videoSize.textContent = `${size.width} × ${size.height}`;
}

function updateGeometry(): void {
  autoScaleValue.textContent = 'NATURAL';
  scaleValue.textContent = `${Number(scaleInput.value).toFixed(2)}×`;
  updateResultLayout();
  dirty = true;
}

function currentRenderState(): RenderState {
  return {
    innerQuad: editor.selection.inner,
    outerQuad: editor.selection.outer,
    outputCrop: outputFrame().crop,
    phase,
    direction,
    twistStrength: Number(scaleInput.value),
    imageAspect: editor.width / editor.height,
  };
}

function renderFrame(time: number): void {
  if (exporting) {
    requestAnimationFrame(renderFrame);
    return;
  }

  const delta = Math.min(50, time - previousFrameTime);
  previousFrameTime = time;

  if (animateInput.checked) {
    const speed = Number(speedInput.value);
    phase = (phase + delta * speed * 0.00012 + 1) % 1;
    updatePhaseUi();
    dirty = true;
  }

  if (renderer && dirty) {
    renderer.render(currentRenderState());
    dirty = false;
    fpsFrames += 1;
  }

  if (time - fpsStart >= 600) {
    if (animateInput.checked) {
      const fps = Math.round(fpsFrames * 1000 / (time - fpsStart));
      fpsReadout.textContent = `${fps} FPS`;
    } else {
      fpsReadout.textContent = 'STILL';
    }
    fpsStart = time;
    fpsFrames = 0;
  }
  requestAnimationFrame(renderFrame);
}
requestAnimationFrame(renderFrame);

function updatePhaseUi(): void {
  phaseInput.value = phase.toFixed(3);
  phaseValue.textContent = `${Math.round(phase * 100)}%`;
}

function updateControlReadouts(): void {
  directionLeftButton.setAttribute('aria-pressed', String(direction === -1));
  directionRightButton.setAttribute('aria-pressed', String(direction === 1));
  speedValue.textContent = `${Number(speedInput.value).toFixed(2)}×`;
  speedRow.setAttribute('aria-disabled', String(!animateInput.checked));
  updatePhaseUi();
}
updateControlReadouts();

innerDetailButton.addEventListener('click', () => {
  const enabled = !editor.detailMode;
  editor.setDetailMode(enabled);
  canvasGrid.classList.toggle('inner-detail', enabled);
  innerDetailButton.setAttribute('aria-pressed', String(enabled));
  canvasTip.textContent = enabled
    ? 'INNER DETAIL · DRAG INSIDE TO MOVE · ARROW KEYS FOR CORNERS'
    : 'DRAG INSIDE A FRAME TO MOVE IT';
  updateSourceLayout();
});

directionLeftButton.addEventListener('click', () => {
  direction = -1;
  updateControlReadouts();
  updateGeometry();
  scheduleWorkspaceSave();
});

directionRightButton.addEventListener('click', () => {
  direction = 1;
  updateControlReadouts();
  updateGeometry();
  scheduleWorkspaceSave();
});

scaleInput.addEventListener('input', () => {
  updateGeometry();
  scheduleWorkspaceSave();
});
phaseInput.addEventListener('input', () => {
  phase = Number(phaseInput.value);
  if (animateInput.checked) animateInput.checked = false;
  updateControlReadouts();
  dirty = true;
  scheduleWorkspaceSave();
});

speedInput.addEventListener('input', () => {
  updateControlReadouts();
  scheduleWorkspaceSave();
});

animateInput.addEventListener('change', () => {
  previousFrameTime = performance.now();
  updateControlReadouts();
});

resetButton.addEventListener('click', () => {
  direction = 1;
  scaleInput.value = '1';
  phase = 0;
  animateInput.checked = false;
  speedInput.value = '0.35';
  editor.resetSelection();
  sourceCard.classList.remove('has-edited');
  updateControlReadouts();
  updateGeometry();
  scheduleWorkspaceSave();
});

openButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) void loadImage(file);
  fileInput.value = '';
});

async function loadImage(file: File): Promise<void> {
  try {
    openButton.disabled = true;
    await editor.loadFile(file, renderer?.maximumTextureSize ?? 4096);
    currentFileName = file.name.replace(/\.[^.]+$/, '') || 'escher';
    persistedImage = file.size <= 1_250_000
      ? await fileToDataUrl(file)
      : editor.storageDataUrl();
    renderer?.setImage(editor.imageCanvas, editor.width, editor.height);
    scaleInput.value = '1';
    phase = 0;
    animateInput.checked = false;
    sourceCard.classList.remove('has-edited');
    updateImageLayout();
    updateControlReadouts();
    updateGeometry();
    saveWorkspace();
  } catch (error) {
    exportNote.textContent = error instanceof Error ? error.message : 'Could not load this image.';
  } finally {
    openButton.disabled = false;
  }
}

async function restoreWorkspace(): Promise<void> {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const stored = JSON.parse(raw) as StoredWorkspace;
    if (!isStoredWorkspace(stored)) throw new Error('Saved workspace is invalid.');
    restoringWorkspace = true;
    persistedImage = stored.image;
    currentFileName = stored.fileName;
    direction = stored.direction;
    scaleInput.value = clampedRangeValue(scaleInput, stored.twistStrength);
    speedInput.value = clampedRangeValue(speedInput, stored.speed);
    phase = Math.min(1, Math.max(0, stored.phase));
    if (isVideoPreset(stored.videoResolution)) videoResolutionSelect.value = stored.videoResolution;
    if (isVideoCycles(stored.videoCycles)) videoCyclesSelect.value = String(stored.videoCycles);
    if (isOutputAspect(stored.outputAspect)) outputAspectSelect.value = stored.outputAspect;
    updateVideoDurationLabel();
    animateInput.checked = false;

    await editor.loadDataUrl(stored.image, renderer?.maximumTextureSize ?? 4096);
    if (!editor.setSelection(stored.frames)) throw new Error('Saved frame geometry is invalid.');
    renderer?.setImage(editor.imageCanvas, editor.width, editor.height);
    sourceCard.classList.add('has-edited');
    updateImageLayout();
    updateControlReadouts();
    updateGeometry();
  } catch (error) {
    exportNote.textContent = error instanceof Error ? error.message : 'Could not restore the saved workspace.';
  } finally {
    restoringWorkspace = false;
  }
}

function scheduleWorkspaceSave(): void {
  if (restoringWorkspace || !persistedImage) return;
  if (saveTimer !== null) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    saveWorkspace();
  }, 160);
}

function saveWorkspace(): void {
  if (restoringWorkspace || !persistedImage) return;
  const workspace: StoredWorkspace = {
    version: 1,
    image: persistedImage,
    fileName: currentFileName,
    frames: editor.selection,
    direction,
    twistStrength: Number(scaleInput.value),
    phase,
    speed: Number(speedInput.value),
    videoResolution: selectedVideoPreset(),
    videoCycles: selectedVideoCycles(),
    outputAspect: selectedOutputAspect(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  } catch {
    exportNote.textContent = 'The image is too large for local browser storage.';
  }
}

function isStoredWorkspace(value: unknown): value is StoredWorkspace {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoredWorkspace>;
  return candidate.version === 1
    && typeof candidate.image === 'string'
    && candidate.image.startsWith('data:image/')
    && typeof candidate.fileName === 'string'
    && (candidate.direction === -1 || candidate.direction === 1)
    && Number.isFinite(candidate.twistStrength)
    && Number.isFinite(candidate.phase)
    && Number.isFinite(candidate.speed)
    && isFrameSelection(candidate.frames);
}

function isFrameSelection(value: unknown): value is FrameSelection {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<FrameSelection>;
  return validPoints(candidate.inner) && validPoints(candidate.outer);
}

function validPoints(value: unknown): value is FrameSelection['inner'] {
  return Array.isArray(value)
    && value.length === 4
    && value.every((point) => point
      && typeof point === 'object'
      && Number.isFinite((point as { x?: number }).x)
      && Number.isFinite((point as { y?: number }).y));
}

function clampedRangeValue(input: HTMLInputElement, value: number): string {
  return String(Math.min(Number(input.max), Math.max(Number(input.min), value)));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result)));
    reader.addEventListener('error', () => reject(new Error('Could not cache this image.')));
    reader.readAsDataURL(file);
  });
}

window.addEventListener('pagehide', saveWorkspace);

window.addEventListener('dragenter', (event) => {
  if (!hasFiles(event.dataTransfer)) return;
  event.preventDefault();
  dragDepth += 1;
  dropOverlay.classList.add('visible');
});

window.addEventListener('dragover', (event) => {
  if (!hasFiles(event.dataTransfer)) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
});

window.addEventListener('dragleave', (event) => {
  if (!hasFiles(event.dataTransfer)) return;
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) dropOverlay.classList.remove('visible');
});

window.addEventListener('drop', (event) => {
  event.preventDefault();
  dragDepth = 0;
  dropOverlay.classList.remove('visible');
  const file = [...(event.dataTransfer?.files ?? [])].find((candidate) => candidate.type.startsWith('image/'));
  if (file) void loadImage(file);
});

function hasFiles(dataTransfer: DataTransfer | null): boolean {
  return Boolean(dataTransfer && [...dataTransfer.types].includes('Files'));
}

pngButton.addEventListener('click', async () => {
  if (!renderer) return;
  try {
    pngButton.disabled = true;
    exportNote.textContent = 'Rendering full-resolution PNG…';
    const result = await renderer.exportPng(currentRenderState());
    downloadBlob(result.blob, `${safeName(currentFileName)}-droste.png`);
    exportNote.textContent = `Saved ${result.width} × ${result.height} PNG.`;
  } catch (error) {
    exportNote.textContent = error instanceof Error ? error.message : 'PNG export failed.';
  } finally {
    pngButton.disabled = false;
    dirty = true;
  }
});

outputAspectSelect.addEventListener('change', () => {
  updateResultLayout();
  dirty = true;
  scheduleWorkspaceSave();
});

videoResolutionSelect.addEventListener('change', () => {
  refreshVideoOptions();
  scheduleWorkspaceSave();
});

videoCyclesSelect.addEventListener('change', () => {
  updateVideoDurationLabel();
  scheduleWorkspaceSave();
});
updateVideoDurationLabel();

mp4Button.addEventListener('click', () => void exportMp4());

async function exportMp4(): Promise<void> {
  if (!renderer || exporting) return;
  const stillPhase = phase;
  const wasAnimating = animateInput.checked;
  const size = selectedVideoSize();
  const frameCount = VIDEO_FRAME_COUNT * selectedVideoCycles();
  try {
    exporting = true;
    mp4Button.disabled = true;
    pngButton.disabled = true;
    videoResolutionSelect.disabled = true;
    videoCyclesSelect.disabled = true;
    outputAspectSelect.disabled = true;
    animateInput.checked = false;
    updateControlReadouts();
    fpsReadout.textContent = 'ENCODING';
    exportNote.textContent = `Encoding ${size.width} × ${size.height} MP4… 0%`;
    const blob = await encodeMp4({
      canvas: renderer.canvas,
      width: size.width,
      height: size.height,
      frameCount,
      drawFrame: (index) => {
        phase = (index % VIDEO_FRAME_COUNT) / VIDEO_FRAME_COUNT;
        renderer?.render(currentRenderState(), size);
        renderer?.finish();
      },
      onProgress: (index) => {
        updatePhaseUi();
        if (index % 8 === 0) {
          exportNote.textContent = `Encoding ${size.width} × ${size.height} MP4… ${Math.round(index / frameCount * 100)}%`;
        }
      },
    });
    downloadBlob(blob, `${safeName(currentFileName)}-droste-loop.mp4`);
    exportNote.textContent = `Saved ${size.width} × ${size.height} MP4.`;
  } catch (error) {
    exportNote.textContent = error instanceof Error ? error.message : 'MP4 export failed.';
  } finally {
    exporting = false;
    phase = stillPhase;
    animateInput.checked = wasAnimating;
    previousFrameTime = performance.now();
    updateControlReadouts();
    mp4Button.disabled = false;
    pngButton.disabled = false;
    videoResolutionSelect.disabled = false;
    videoCyclesSelect.disabled = false;
    outputAspectSelect.disabled = false;
    dirty = true;
  }
}

function safeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9а-яё_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'escher';
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

new ResizeObserver(() => {
  editor.draw();
  dirty = true;
}).observe(resultFrame);
