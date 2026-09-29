import './style.css';
import { requestGpu } from './gpu/device';
import { GpuIsing, type CursorState } from './gpu/ising';

const CRITICAL_TEMPERATURE = 2 / Math.log(1 + Math.sqrt(2));
const HALF_STEPS_PER_SECOND = 30;

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element as T;
};

const canvas = byId<HTMLCanvasElement>('field');
const scaleInput = byId<HTMLInputElement>('scale');
const temperatureInput = byId<HTMLInputElement>('temperature');
const timeSpeedInput = byId<HTMLInputElement>('time-speed');
const brushSizeInput = byId<HTMLInputElement>('brush-size');
const scaleValue = byId<HTMLOutputElement>('scale-value');
const temperatureValue = byId<HTMLOutputElement>('temperature-value');
const timeSpeedValue = byId<HTMLOutputElement>('time-speed-value');
const brushSizeValue = byId<HTMLOutputElement>('brush-size-value');
const explanation = byId<HTMLParagraphElement>('explanation');
const settingsToggle = byId<HTMLButtonElement>('settings-toggle');
const settingsPanel = byId<HTMLElement>('settings-panel');
const pauseButton = byId<HTMLButtonElement>('pause');
const restartButton = byId<HTMLButtonElement>('restart');
const clearBlueButton = byId<HTMLButtonElement>('clear-blue');
const phaseValue = byId<HTMLElement>('phase');
const magnetizationValue = byId<HTMLElement>('magnetization');
const energyValue = byId<HTMLElement>('energy');
const fatalError = byId<HTMLElement>('fatal-error');

const scaleCopy = [
  'Each point is one ±1 spin. The local rule is visible, but there is no independent large object yet.',
  'Nearby spins are averaged on the GPU. Random flips cancel while aligned regions grow stronger.',
  'The bright zero contour moves like one boundary although the model contains only local cells.',
  'A large-scale observer cannot see individual flips. Islands merge into a different, slower geometry.',
];

type Point = { x: number; y: number };

async function main(): Promise<void> {
  const gpu = await requestGpu();
  if (!gpu) {
    fatalError.hidden = false;
    fatalError.textContent = 'This experiment requires a browser with WebGPU enabled.';
    return;
  }

  const simulation = new GpuIsing(gpu.device, gpu.format, canvas);
  let temperature = Number(temperatureInput.value);
  let scale = Number(scaleInput.value);
  let targetScale = scale;
  let timeSpeed = Number(timeSpeedInput.value);
  let brushDiameter = Number(brushSizeInput.value);
  let paused = false;
  let settingsOpen = true;
  let painting = false;
  let forceHotBrush = false;
  let pointerActive = false;
  let pointerX = 0;
  let pointerY = 0;
  let lastPaintPoint: Point | null = null;
  let renderDirty = true;
  let stepAccumulator = 0;
  let previousFrame = performance.now();
  let previousStats = 0;
  let statsInFlight = false;
  let statsGeneration = 0;
  const activePointers = new Map<number, Point>();
  let pinchActive = false;
  let pinchStartDistance = 0;
  let pinchStartScale = scale;
  let touchPaintPending = false;
  let touchGestureHadPinch = false;

  const targetGrid = (): { density: number; width: number; height: number } => {
    const viewportWidth = Math.max(1, window.innerWidth);
    const viewportHeight = Math.max(1, window.innerHeight);
    const desiredDensity = viewportWidth <= 720 ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const dimensionLimit = Math.min(
      gpu.device.limits.maxTextureDimension2D / viewportWidth,
      gpu.device.limits.maxTextureDimension2D / viewportHeight,
    );
    const bufferLimit = Math.sqrt(
      Number(gpu.device.limits.maxStorageBufferBindingSize) / 4 / (viewportWidth * viewportHeight),
    );
    const density = Math.max(0.25, Math.min(desiredDensity, dimensionLimit, bufferLimit));
    const width = Math.max(1, Math.round(viewportWidth * density));
    const height = Math.max(1, Math.round(viewportHeight * density));
    return { density: width / viewportWidth, width, height };
  };

  const observationDiameter = (): number => {
    const radius = Math.max(0, Math.round((2 ** scale - 1) * (Math.min(simulation.width, simulation.height) / 65.64)));
    return radius * 2 + 1;
  };

  const updateScaleInterface = (): void => {
    const diameter = observationDiameter();
    scaleInput.value = scale.toFixed(2);
    scaleValue.textContent = diameter === 1 ? '1 spin' : `${diameter} × ${diameter}`;
    explanation.textContent = scaleCopy[Math.min(3, Math.floor(scale + 0.25))];
    document.documentElement.style.setProperty(
      '--noise-opacity',
      (0.12 * (1 - scale / 3) ** 2).toFixed(3),
    );
  };

  const updateTemperatureInterface = (): void => {
    temperatureValue.textContent = `T = ${temperature.toFixed(2)}`;
    const distance = temperature - CRITICAL_TEMPERATURE;
    if (distance < -0.2) phaseValue.textContent = 'ordered';
    else if (distance > 0.2) phaseValue.textContent = 'disordered';
    else phaseValue.textContent = 'critical';
  };

  const updateTimeInterface = (): void => {
    const digits = Number.isInteger(timeSpeed) ? 0 : 1;
    timeSpeedValue.textContent = `${timeSpeed.toFixed(digits)}×`;
  };

  const updateBrushInterface = (): void => {
    brushSizeInput.value = String(brushDiameter);
    brushSizeValue.textContent = `${brushDiameter} px`;
  };

  const cursorState = (): CursorState => ({
    active: pointerActive && !pinchActive && !touchGestureHadPinch,
    painting,
    forceHot: forceHotBrush,
    x: pointerX,
    y: pointerY,
    radius: brushDiameter / 2,
  });

  const drawNow = (): void => {
    const diameter = observationDiameter();
    const radius = (diameter - 1) / 2;
    const microOpacity = diameter === 1 ? 0 : 0.14 * (1 - scale / 3) ** 2;
    simulation.draw(scale, radius, microOpacity, cursorState());
    renderDirty = false;
  };

  const resize = (preserve = true): void => {
    const metrics = targetGrid();
    simulation.resize(metrics.width, metrics.height, metrics.density, preserve);
    updateScaleInterface();
    renderDirty = true;
    drawNow();
    statsGeneration += 1;
  };

  const pointerPoint = (event: PointerEvent): Point | null => {
    const rect = canvas.getBoundingClientRect();
    const normalizedX = (event.clientX - rect.left) / rect.width;
    const normalizedY = (event.clientY - rect.top) / rect.height;
    if (normalizedX < 0 || normalizedX >= 1 || normalizedY < 0 || normalizedY >= 1) return null;
    pointerX = event.clientX - rect.left;
    pointerY = event.clientY - rect.top;
    return {
      x: normalizedX * simulation.width,
      y: normalizedY * simulation.height,
    };
  };

  const paintTo = (event: PointerEvent, select: boolean): void => {
    const point = pointerPoint(event);
    if (!point) {
      lastPaintPoint = null;
      return;
    }
    const start = lastPaintPoint ?? point;
    simulation.paintSegment(
      start.x,
      start.y,
      point.x,
      point.y,
      brushDiameter * simulation.density / 2,
      select,
      forceHotBrush,
    );
    lastPaintPoint = point;
    renderDirty = true;
  };

  const beginPainting = (event: PointerEvent): void => {
    painting = true;
    lastPaintPoint = null;
    paintTo(event, true);
    forceHotBrush = false;
  };

  const pointerDistance = (): number => {
    const points = [...activePointers.values()];
    if (points.length < 2) return 0;
    return Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
  };

  const requestStats = (): void => {
    if (statsInFlight) return;
    statsInFlight = true;
    const generation = statsGeneration;
    void simulation.readStats().then((stats) => {
      if (generation !== statsGeneration) return;
      magnetizationValue.textContent = stats.magnetization.toFixed(3);
      energyValue.textContent = stats.energy.toFixed(3);
      const allBlue = stats.signedMagnetization === -1;
      if (!painting && forceHotBrush !== allBlue) {
        forceHotBrush = allBlue;
        renderDirty = true;
      }
    }).catch((error: unknown) => {
      console.warn('Could not read Ising statistics.', error);
    }).finally(() => {
      statsInFlight = false;
    });
  };

  scaleInput.addEventListener('input', () => {
    scale = Number(scaleInput.value);
    targetScale = scale;
    updateScaleInterface();
    renderDirty = true;
  });

  temperatureInput.addEventListener('input', () => {
    temperature = Number(temperatureInput.value);
    updateTemperatureInterface();
  });

  timeSpeedInput.addEventListener('input', () => {
    timeSpeed = Number(timeSpeedInput.value);
    updateTimeInterface();
  });

  brushSizeInput.addEventListener('input', () => {
    brushDiameter = Number(brushSizeInput.value);
    updateBrushInterface();
    renderDirty = true;
  });

  window.addEventListener('keydown', (event) => {
    if (event.code !== 'BracketLeft' && event.code !== 'BracketRight') return;
    event.preventDefault();
    brushDiameter = Math.max(4, Math.min(100, brushDiameter + (event.code === 'BracketLeft' ? -4 : 4)));
    updateBrushInterface();
    renderDirty = true;
  });

  settingsToggle.addEventListener('click', () => {
    settingsOpen = !settingsOpen;
    settingsPanel.classList.toggle('is-closed', !settingsOpen);
    settingsPanel.setAttribute('aria-hidden', String(!settingsOpen));
    settingsToggle.setAttribute('aria-expanded', String(settingsOpen));
    settingsToggle.setAttribute('aria-label', settingsOpen ? 'Close settings' : 'Open settings');
  });

  pauseButton.addEventListener('click', () => {
    paused = !paused;
    const action = paused ? 'Resume simulation' : 'Pause simulation';
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.setAttribute('aria-label', action);
    pauseButton.title = action;
    stepAccumulator = 0;
  });

  restartButton.addEventListener('click', () => {
    simulation.randomize();
    forceHotBrush = false;
    stepAccumulator = 0;
    statsGeneration += 1;
    magnetizationValue.textContent = '0.000';
    energyValue.textContent = '0.000';
    renderDirty = true;
    drawNow();
    requestStats();
  });

  clearBlueButton.addEventListener('click', () => {
    simulation.clearBlue();
    forceHotBrush = true;
    stepAccumulator = 0;
    statsGeneration += 1;
    magnetizationValue.textContent = '1.000';
    energyValue.textContent = '-2.000';
    renderDirty = true;
    drawNow();
    requestStats();
  });

  canvas.addEventListener('pointerdown', (event) => {
    const point = pointerPoint(event);
    if (!point) return;
    canvas.setPointerCapture(event.pointerId);
    pointerActive = true;

    if (event.pointerType === 'touch') {
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (activePointers.size === 1) {
        touchPaintPending = true;
        touchGestureHadPinch = false;
      } else if (activePointers.size === 2) {
        painting = false;
        lastPaintPoint = null;
        touchPaintPending = false;
        touchGestureHadPinch = true;
        pinchActive = true;
        pinchStartDistance = pointerDistance();
        pinchStartScale = targetScale;
      }
      renderDirty = true;
      return;
    }

    beginPainting(event);
  });

  canvas.addEventListener('pointermove', (event) => {
    pointerPoint(event);
    pointerActive = true;
    renderDirty = true;

    if (event.pointerType === 'touch') {
      if (!activePointers.has(event.pointerId)) return;
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pinchActive && activePointers.size >= 2) {
        const distance = pointerDistance();
        if (pinchStartDistance > 0 && distance > 0) {
          targetScale = Math.max(0, Math.min(3, pinchStartScale - Math.log2(distance / pinchStartDistance) * 0.9));
        }
        return;
      }
      if (activePointers.size === 1 && !touchGestureHadPinch) {
        if (touchPaintPending) {
          beginPainting(event);
          touchPaintPending = false;
        } else if (painting) {
          for (const sample of event.getCoalescedEvents()) paintTo(sample, false);
        }
      }
      return;
    }

    if (painting) {
      const samples = event.getCoalescedEvents();
      if (samples.length === 0) paintTo(event, false);
      else for (const sample of samples) paintTo(sample, false);
    }
  });

  const endPointer = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') {
      if (touchPaintPending && !touchGestureHadPinch) beginPainting(event);
      activePointers.delete(event.pointerId);
      if (activePointers.size < 2) pinchActive = false;
      if (activePointers.size === 0) {
        touchPaintPending = false;
        touchGestureHadPinch = false;
        pointerActive = false;
      }
    }
    painting = false;
    lastPaintPoint = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    renderDirty = true;
    requestStats();
  };

  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', (event) => {
    activePointers.delete(event.pointerId);
    painting = false;
    pointerActive = false;
    lastPaintPoint = null;
    touchPaintPending = false;
    pinchActive = false;
    renderDirty = true;
  });
  canvas.addEventListener('pointerenter', () => {
    pointerActive = true;
    renderDirty = true;
  });
  canvas.addEventListener('pointerleave', () => {
    if (!painting) {
      pointerActive = false;
      renderDirty = true;
    }
  });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const delta = Math.max(-120, Math.min(120, event.deltaY));
    targetScale = Math.max(0, Math.min(3, targetScale + delta * 0.00125));
    pointerPoint(event as unknown as PointerEvent);
    pointerActive = true;
  }, { passive: false });

  window.addEventListener('blur', () => {
    painting = false;
    pointerActive = false;
    lastPaintPoint = null;
    activePointers.clear();
    pinchActive = false;
    touchPaintPending = false;
    renderDirty = true;
  });

  window.addEventListener('resize', () => resize(true));

  resize(false);
  simulation.step(temperature, 40);
  updateTemperatureInterface();
  updateTimeInterface();
  updateBrushInterface();
  renderDirty = true;
  drawNow();
  requestStats();

  const animate = (timestamp: number): void => {
    const deltaSeconds = Math.min(0.1, Math.max(0, (timestamp - previousFrame) / 1000));
    previousFrame = timestamp;

    const scaleDifference = targetScale - scale;
    if (Math.abs(scaleDifference) > 0.0005) {
      scale += scaleDifference * (1 - Math.exp(-deltaSeconds * 10));
      updateScaleInterface();
      renderDirty = true;
    } else if (scale !== targetScale) {
      scale = targetScale;
      updateScaleInterface();
      renderDirty = true;
    }

    if (!paused) {
      stepAccumulator += deltaSeconds * HALF_STEPS_PER_SECOND * timeSpeed;
      const halfSteps = Math.min(8, Math.floor(stepAccumulator));
      if (halfSteps > 0) {
        stepAccumulator -= halfSteps;
        simulation.step(temperature, halfSteps);
        renderDirty = true;
      }
    }

    if (renderDirty) drawNow();
    if (timestamp - previousStats > 750) {
      previousStats = timestamp;
      requestStats();
    }
    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

void main().catch((error: unknown) => {
  console.error(error);
  fatalError.hidden = false;
  fatalError.textContent = error instanceof Error ? error.message : 'Could not start the WebGPU simulation.';
});
