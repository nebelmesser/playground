import './style.css';
import { requestGpu } from './gpu/device';
import { GpuIsing, type CursorState } from './gpu/ising';
import { labelPositions, PlaceTracker, type LabelMode, type PlaceLabel } from './places';

const CRITICAL_TEMPERATURE = 2 / Math.log(1 + Math.sqrt(2));
const HALF_STEPS_PER_SECOND = 30;
const MAP_DIAMETER = 40;

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
const freezeButton = byId<HTMLButtonElement>('freeze');
const heatButton = byId<HTMLButtonElement>('heat');
const phaseValue = byId<HTMLElement>('phase');
const magnetizationValue = byId<HTMLElement>('magnetization');
const energyValue = byId<HTMLElement>('energy');
const fatalError = byId<HTMLElement>('fatal-error');
const placeLabels = byId<HTMLElement>('place-labels');

const scaleCopy = [
  'Each point is one ±1 spin. The local rule is visible, but there is no independent large object yet.',
  'Nearby spins are averaged on the GPU. Random flips cancel while aligned regions grow stronger.',
  'The bright zero contour is the coastline. Wider views add elevation lines across the orange land.',
  'A large-scale observer cannot see individual flips. Regions that keep their shape are named like places on a map.',
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
  let baseTemperature = temperature;
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
  let mapStrength = 0;
  let placesGeneration = 0;
  let regionInFlight = false;
  let lastRegionRequest = 0;
  const places = new PlaceTracker();
  const labelNodes = new Map<number, HTMLSpanElement[]>();
  const freezeHolds = new Set<string>();
  const heatHolds = new Set<string>();
  const CHAOS_TEMPERATURE = CRITICAL_TEMPERATURE + 0.2;
  const MIN_TEMPERATURE = Number(temperatureInput.min);
  const MAX_TEMPERATURE = Number(temperatureInput.max);
  const HOLD_RESPONSE_SECONDS = 1.35;
  const RETURN_RESPONSE_SECONDS = 0.75;

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
    temperatureInput.value = temperature.toFixed(2);
    temperatureValue.textContent = `T = ${temperature.toFixed(2)}`;
    const temperatureProgress = Math.max(0, Math.min(1, (
      temperature - MIN_TEMPERATURE
    ) / (MAX_TEMPERATURE - MIN_TEMPERATURE)));
    freezeButton.style.setProperty('--temperature-progress', (1 - temperatureProgress).toFixed(4));
    heatButton.style.setProperty('--temperature-progress', temperatureProgress.toFixed(4));
    freezeButton.setAttribute('aria-label', `Freeze, current temperature ${temperature.toFixed(2)}`);
    heatButton.setAttribute('aria-label', `Heat, current temperature ${temperature.toFixed(2)}`);
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
    simulation.draw(scale, radius, microOpacity, mapStrength, cursorState());
    renderDirty = false;
  };

  const resetPlaces = (): void => {
    placesGeneration += 1;
    places.reset();
    syncPlaceLabels([]);
  };

  const syncPlaceLabels = (labels: PlaceLabel[]): void => {
    const seen = new Set<number>();
    for (const label of labels) {
      seen.add(label.id);
      const spots = labelPositions(label);
      let nodes = labelNodes.get(label.id);
      if (!nodes) {
        nodes = [];
        labelNodes.set(label.id, nodes);
      }
      while (nodes.length < spots.length) {
        const node = document.createElement('span');
        node.className = 'place-label';
        placeLabels.append(node);
        nodes.push(node);
      }
      while (nodes.length > spots.length) nodes.pop()?.remove();
      for (let index = 0; index < spots.length; index += 1) {
        const node = nodes[index];
        const spot = spots[index];
        if (node.dataset.kind !== label.kind) node.dataset.kind = label.kind;
        if (node.textContent !== label.text) node.textContent = label.text;
        node.style.opacity = label.opacity.toFixed(3);
        node.style.fontSize = `${label.fontSize.toFixed(2)}px`;
        node.style.letterSpacing = `${label.letterSpacing.toFixed(2)}px`;
        node.style.transform = `translate(${spot.x.toFixed(2)}px, ${spot.y.toFixed(2)}px) rotate(${label.angle.toFixed(2)}deg) translate(-50%, -50%)`;
      }
    }
    for (const [id, nodes] of labelNodes) {
      if (seen.has(id)) continue;
      for (const node of nodes) node.remove();
      labelNodes.delete(id);
    }
  };

  const resize = (preserve = true): void => {
    const metrics = targetGrid();
    simulation.resize(metrics.width, metrics.height, metrics.density, preserve);
    updateScaleInterface();
    renderDirty = true;
    drawNow();
    statsGeneration += 1;
    // Discard any sample taken against the previous GPU dimensions, but keep
    // place identity and normalized label positions across viewport resizes.
    placesGeneration += 1;
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
    baseTemperature = Number(temperatureInput.value);
    temperature = baseTemperature;
    updateTemperatureInterface();
  });

  const bindTemperatureHold = (
    button: HTMLButtonElement,
    holds: Set<string>,
  ): void => {
    const updatePressed = (): void => {
      button.setAttribute('aria-pressed', String(holds.size > 0));
    };
    const releasePointer = (event: PointerEvent): void => {
      holds.delete(`pointer:${event.pointerId}`);
      if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
      updatePressed();
    };
    button.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      holds.add(`pointer:${event.pointerId}`);
      updatePressed();
    });
    button.addEventListener('pointerup', releasePointer);
    button.addEventListener('pointercancel', releasePointer);
    button.addEventListener('lostpointercapture', (event) => {
      holds.delete(`pointer:${event.pointerId}`);
      updatePressed();
    });
    button.addEventListener('keydown', (event) => {
      if (event.code !== 'Space' && event.code !== 'Enter') return;
      event.preventDefault();
      holds.add(`key:${event.code}`);
      updatePressed();
    });
    button.addEventListener('keyup', (event) => {
      if (event.code !== 'Space' && event.code !== 'Enter') return;
      event.preventDefault();
      holds.delete(`key:${event.code}`);
      updatePressed();
    });
    button.addEventListener('blur', () => {
      for (const hold of holds) {
        if (hold.startsWith('key:')) holds.delete(hold);
      }
      updatePressed();
    });
  };

  bindTemperatureHold(freezeButton, freezeHolds);
  bindTemperatureHold(heatButton, heatHolds);

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
    resetPlaces();
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
    resetPlaces();
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
    freezeHolds.clear();
    heatHolds.clear();
    freezeButton.setAttribute('aria-pressed', 'false');
    heatButton.setAttribute('aria-pressed', 'false');
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
    const rawDelta = Math.max(0, (timestamp - previousFrame) / 1000);
    const deltaSeconds = Math.min(0.1, rawDelta);
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

    const temperatureDirection = Number(heatHolds.size > 0) - Number(freezeHolds.size > 0);
    const targetTemperature = temperatureDirection < 0
      ? MIN_TEMPERATURE
      : temperatureDirection > 0
        ? MAX_TEMPERATURE
        : baseTemperature;
    const temperatureResponse = temperatureDirection === 0
      ? RETURN_RESPONSE_SECONDS
      : HOLD_RESPONSE_SECONDS;
    const temperatureDifference = targetTemperature - temperature;
    if (Math.abs(temperatureDifference) > 0.0005) {
      temperature += temperatureDifference * (1 - Math.exp(-deltaSeconds / temperatureResponse));
      updateTemperatureInterface();
    } else if (temperature !== targetTemperature) {
      temperature = targetTemperature;
      updateTemperatureInterface();
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

    const mapTarget = observationDiameter() >= MAP_DIAMETER ? 1 : 0;
    const mapDelta = mapTarget - mapStrength;
    if (Math.abs(mapDelta) > 0.001) {
      mapStrength += mapDelta * (1 - Math.exp(-deltaSeconds * 7));
      renderDirty = true;
    } else if (mapStrength !== mapTarget) {
      mapStrength = mapTarget;
      renderDirty = true;
    }

    const labelMode: LabelMode = temperature > CHAOS_TEMPERATURE
      ? 'chaos'
      : observationDiameter() >= MAP_DIAMETER
        ? 'map'
        : 'hidden';
    const viewport = canvas.getBoundingClientRect();
    const labels = places.advance(Math.min(0.5, rawDelta), labelMode, {
      width: viewport.width,
      height: viewport.height,
    });
    syncPlaceLabels(labels);

    if (renderDirty) drawNow();
    if (!regionInFlight && labelMode === 'map' && timestamp - lastRegionRequest > 280) {
      lastRegionRequest = timestamp;
      regionInFlight = true;
      const generation = placesGeneration;
      void simulation.readRegionSample().then((sample) => {
        if (generation !== placesGeneration || !sample) return;
        if (temperature > CHAOS_TEMPERATURE || observationDiameter() < MAP_DIAMETER) return;
        places.ingest(sample);
      }).catch((error: unknown) => {
        console.warn('Could not read Ising regions.', error);
      }).finally(() => {
        regionInFlight = false;
      });
    }
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
