import { clamp, isConvex, type Point } from './math';

const DEFAULT_INNER: Point[] = [
  { x: 0.32, y: 0.25 },
  { x: 0.68, y: 0.25 },
  { x: 0.68, y: 0.75 },
  { x: 0.32, y: 0.75 },
];

const DEFAULT_OUTER: Point[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

export type FrameSelection = {
  inner: readonly Point[];
  outer: readonly Point[];
};

type FrameName = 'inner' | 'outer';

type EditorOptions = {
  onChange: (selection: FrameSelection) => void;
  onInvalid: () => void;
};

type ViewBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function copyPoints(points: readonly Point[]): Point[] {
  return points.map((point) => ({ ...point }));
}

const FRAME_MARGIN = 0.012;

function edgeLength(a: Point, b: Point, imageAspect: number): number {
  return Math.hypot((b.x - a.x) * imageAspect, b.y - a.y);
}

function innerPhysicalAspect(points: readonly Point[], imageAspect: number): number {
  const width = (edgeLength(points[0], points[1], imageAspect)
    + edgeLength(points[3], points[2], imageAspect)) * 0.5;
  const height = (edgeLength(points[0], points[3], imageAspect)
    + edgeLength(points[1], points[2], imageAspect)) * 0.5;
  return clamp(width / Math.max(height, 1e-6), 0.08, 12);
}

function fitOuterToInnerAspect(
  inner: readonly Point[],
  currentOuter: readonly Point[],
  imageAspect: number,
): Point[] | null {
  const maximumSpan = 1;
  const normalizedRatio = innerPhysicalAspect(inner, imageAspect) / imageAspect;
  const minimumX = Math.min(...inner.map((point) => point.x));
  const maximumX = Math.max(...inner.map((point) => point.x));
  const minimumY = Math.min(...inner.map((point) => point.y));
  const maximumY = Math.max(...inner.map((point) => point.y));
  const requiredWidth = maximumX - minimumX + FRAME_MARGIN * 2;
  const requiredHeight = maximumY - minimumY + FRAME_MARGIN * 2;
  const currentHeight = currentOuter[3].y - currentOuter[0].y;

  let height = Math.max(currentHeight, requiredHeight, requiredWidth / normalizedRatio);
  let width = height * normalizedRatio;
  const fitScale = Math.min(1, maximumSpan / width, maximumSpan / height);
  width *= fitScale;
  height *= fitScale;
  if (width + 1e-6 < requiredWidth || height + 1e-6 < requiredHeight) return null;

  const currentCenterX = (currentOuter[0].x + currentOuter[2].x) * 0.5;
  const currentCenterY = (currentOuter[0].y + currentOuter[2].y) * 0.5;
  const minimumCenterX = Math.max(width * 0.5, maximumX + FRAME_MARGIN - width * 0.5);
  const maximumCenterX = Math.min(1 - width * 0.5, minimumX - FRAME_MARGIN + width * 0.5);
  const minimumCenterY = Math.max(height * 0.5, maximumY + FRAME_MARGIN - height * 0.5);
  const maximumCenterY = Math.min(1 - height * 0.5, minimumY - FRAME_MARGIN + height * 0.5);
  if (minimumCenterX > maximumCenterX + 1e-4 || minimumCenterY > maximumCenterY + 1e-4) return null;

  const centerX = clamp(currentCenterX, Math.min(minimumCenterX, maximumCenterX), Math.max(minimumCenterX, maximumCenterX));
  const centerY = clamp(currentCenterY, Math.min(minimumCenterY, maximumCenterY), Math.max(minimumCenterY, maximumCenterY));
  const left = centerX - width * 0.5;
  const right = centerX + width * 0.5;
  const top = centerY - height * 0.5;
  const bottom = centerY + height * 0.5;
  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
}

function moveRectangleCorner(
  points: readonly Point[],
  index: number,
  point: Point,
  normalizedRatio: number,
): Point[] {
  const opposite = points[(index + 2) % 4];
  const horizontalSign = index === 0 || index === 3 ? -1 : 1;
  const verticalSign = index === 0 || index === 1 ? -1 : 1;
  const rawWidth = Math.abs(point.x - opposite.x);
  const rawHeight = Math.abs(point.y - opposite.y);
  let height = rawWidth / Math.max(rawHeight, 1e-6) > normalizedRatio
    ? rawWidth / normalizedRatio
    : rawHeight;
  height = Math.max(height, 0.04, 0.04 / normalizedRatio);
  let width = height * normalizedRatio;
  const maximumWidth = horizontalSign < 0 ? opposite.x : 1 - opposite.x;
  const maximumHeight = verticalSign < 0 ? opposite.y : 1 - opposite.y;
  const fitScale = Math.min(1, maximumWidth / width, maximumHeight / height);
  width *= fitScale;
  height *= fitScale;

  const corner = {
    x: opposite.x + horizontalSign * width,
    y: opposite.y + verticalSign * height,
  };
  const left = Math.min(corner.x, opposite.x);
  const right = Math.max(corner.x, opposite.x);
  const top = Math.min(corner.y, opposite.y);
  const bottom = Math.max(corner.y, opposite.y);
  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
}

function pointInsideConvex(point: Point, polygon: readonly Point[]): boolean {
  for (let index = 0; index < polygon.length; index += 1) {
    const a = polygon[index];
    const b = polygon[(index + 1) % polygon.length];
    const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
    if (cross <= 0.003) return false;
  }
  return true;
}

function clampSpan(value: number, minimum: number, maximum: number): number {
  if (minimum > maximum) return 0;
  return clamp(value, minimum, maximum);
}

function clampInnerShift(inner: readonly Point[], outer: readonly Point[], delta: Point): Point {
  const margin = FRAME_MARGIN;
  const left = outer[0].x + margin;
  const right = outer[1].x - margin;
  const top = outer[0].y + margin;
  const bottom = outer[3].y - margin;
  let minimumX = Infinity;
  let maximumX = -Infinity;
  let minimumY = Infinity;
  let maximumY = -Infinity;
  inner.forEach((point) => {
    minimumX = Math.min(minimumX, point.x);
    maximumX = Math.max(maximumX, point.x);
    minimumY = Math.min(minimumY, point.y);
    maximumY = Math.max(maximumY, point.y);
  });
  return {
    x: clampSpan(delta.x, left - minimumX, right - maximumX),
    y: clampSpan(delta.y, top - minimumY, bottom - maximumY),
  };
}

function translateOuter(outer: readonly Point[], inner: readonly Point[], delta: Point): Point[] {
  const edge = 0;
  const margin = FRAME_MARGIN;
  const width = outer[1].x - outer[0].x;
  const height = outer[3].y - outer[0].y;
  let minimumX = Infinity;
  let maximumX = -Infinity;
  let minimumY = Infinity;
  let maximumY = -Infinity;
  inner.forEach((point) => {
    minimumX = Math.min(minimumX, point.x);
    maximumX = Math.max(maximumX, point.x);
    minimumY = Math.min(minimumY, point.y);
    maximumY = Math.max(maximumY, point.y);
  });
  const minimumLeft = Math.max(edge, maximumX + margin - width);
  const maximumLeft = Math.min(1 - edge - width, minimumX - margin);
  const minimumTop = Math.max(edge, maximumY + margin - height);
  const maximumTop = Math.min(1 - edge - height, minimumY - margin);
  const left = minimumLeft <= maximumLeft
    ? clamp(outer[0].x + delta.x, minimumLeft, maximumLeft)
    : outer[0].x;
  const top = minimumTop <= maximumTop
    ? clamp(outer[0].y + delta.y, minimumTop, maximumTop)
    : outer[0].y;
  const right = left + width;
  const bottom = top + height;
  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
}

export class SourceEditor {
  readonly imageCanvas = document.createElement('canvas');
  readonly canvas: HTMLCanvasElement;

  private readonly context: CanvasRenderingContext2D;
  private readonly onChange: EditorOptions['onChange'];
  private readonly onInvalid: EditorOptions['onInvalid'];
  private readonly resizeObserver: ResizeObserver;
  private innerPoints = copyPoints(DEFAULT_INNER);
  private outerPoints = copyPoints(DEFAULT_OUTER);
  private activeFrame: FrameName = 'inner';
  private activePoint = -1;
  private dragMode: 'point' | 'frame' | 'scroll' | null = null;
  private lastPointer: Point | null = null;
  private scrollClient: Point | null = null;
  private pointerId: number | null = null;
  private detailViewBox: ViewBox | null = null;

  constructor(canvas: HTMLCanvasElement, options: EditorOptions) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2D canvas is unavailable');
    this.context = context;
    this.onChange = options.onChange;
    this.onInvalid = options.onInvalid;
    this.canvas.tabIndex = 0;
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);
    this.canvas.addEventListener('pointerleave', this.handlePointerLeave);
    this.canvas.addEventListener('keydown', this.handleKeyDown);
    this.resizeObserver = new ResizeObserver(() => this.draw());
    this.resizeObserver.observe(this.canvas);
    this.createDemoImage();
    this.outerPoints = fitOuterToInnerAspect(
      this.innerPoints,
      this.outerPoints,
      this.width / this.height,
    ) ?? this.outerPoints;
    this.draw();
  }

  get selection(): FrameSelection {
    return { inner: this.innerPoints, outer: this.outerPoints };
  }

  get width(): number {
    return this.imageCanvas.width;
  }

  get height(): number {
    return this.imageCanvas.height;
  }

  get detailMode(): boolean {
    return this.detailViewBox !== null;
  }

  get viewAspect(): number {
    const view = this.currentViewBox();
    return view.width * (this.width / this.height) / view.height;
  }

  setDetailMode(enabled: boolean): void {
    this.detailViewBox = enabled ? this.makeDetailViewBox() : null;
    this.activeFrame = 'inner';
    this.activePoint = -1;
    this.draw();
  }

  resetSelection(): void {
    this.innerPoints = copyPoints(DEFAULT_INNER);
    this.outerPoints = fitOuterToInnerAspect(
      this.innerPoints,
      DEFAULT_OUTER,
      this.width / this.height,
    ) ?? copyPoints(DEFAULT_OUTER);
    if (this.detailMode) this.detailViewBox = this.makeDetailViewBox();
    this.activeFrame = 'inner';
    this.activePoint = -1;
    this.emitChange();
    this.draw();
  }

  setSelection(selection: FrameSelection): boolean {
    const inner = copyPoints(selection.inner);
    const outer = fitOuterToInnerAspect(inner, selection.outer, this.width / this.height);
    if (!outer || !this.validFrames(inner, outer)) return false;
    this.innerPoints = inner;
    this.outerPoints = outer;
    this.activeFrame = 'inner';
    this.activePoint = -1;
    if (this.detailMode) this.detailViewBox = this.makeDetailViewBox();
    this.emitChange();
    this.draw();
    return true;
  }

  async loadFile(file: File, maximumDimension: number): Promise<void> {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      throw new Error('Choose a PNG, JPEG or WebP image.');
    }

    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    this.drawBitmap(bitmap, maximumDimension);
    bitmap.close();
    this.resetSelection();
  }

  async loadDataUrl(dataUrl: string, maximumDimension: number): Promise<void> {
    const response = await fetch(dataUrl);
    if (!response.ok) throw new Error('Could not restore the saved image.');
    const bitmap = await createImageBitmap(await response.blob(), { imageOrientation: 'from-image' });
    this.drawBitmap(bitmap, maximumDimension);
    bitmap.close();
    this.draw();
  }

  storageDataUrl(): string {
    const attempts = [
      { maximum: 2048, quality: 0.9 },
      { maximum: 1728, quality: 0.86 },
      { maximum: 1440, quality: 0.82 },
      { maximum: 1200, quality: 0.78 },
    ];
    let lastResult = '';
    for (const attempt of attempts) {
      const scale = Math.min(1, attempt.maximum / Math.max(this.width, this.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(this.width * scale));
      canvas.height = Math.max(1, Math.round(this.height * scale));
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) continue;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(this.imageCanvas, 0, 0, canvas.width, canvas.height);
      lastResult = canvas.toDataURL('image/webp', attempt.quality);
      if (lastResult.length <= 1_800_000) return lastResult;
    }
    return lastResult;
  }

  private drawBitmap(bitmap: ImageBitmap, maximumDimension: number): void {
    const scale = Math.min(1, maximumDimension / Math.max(bitmap.width, bitmap.height));
    this.imageCanvas.width = Math.max(1, Math.round(bitmap.width * scale));
    this.imageCanvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = this.imageCanvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not prepare this image.');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
  }

  draw(): void {
    const bounds = this.canvas.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(bounds.width * dpr));
    const height = Math.max(1, Math.round(bounds.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    const context = this.context;
    const view = this.currentViewBox();
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, bounds.width, bounds.height);
    context.drawImage(
      this.imageCanvas,
      view.left * this.width,
      view.top * this.height,
      view.width * this.width,
      view.height * this.height,
      0,
      0,
      bounds.width,
      bounds.height,
    );
    context.save();

    if (this.detailMode) {
      // Keep the selected quadrilateral fully exposed while dimming the small
      // amount of surrounding context retained for grabbing its corners.
      context.beginPath();
      context.rect(0, 0, bounds.width, bounds.height);
      this.addPolygonPath(context, this.innerPoints, bounds.width, bounds.height, false);
      context.fillStyle = 'rgba(8, 8, 7, 0.34)';
      context.fill('evenodd');
    } else {
      // Keep the area between the frames visually clear: it is the fallback
      // source used to fill gaps around each rotated recursive copy.
      context.beginPath();
      context.rect(0, 0, bounds.width, bounds.height);
      this.addPolygonPath(context, this.outerPoints, bounds.width, bounds.height, false);
      context.fillStyle = 'rgba(8, 8, 7, 0.46)';
      context.fill('evenodd');
      this.addPolygonPath(context, this.innerPoints, bounds.width, bounds.height);
      context.fillStyle = 'rgba(8, 8, 7, 0.46)';
      context.fill();
      this.drawFrame(context, this.outerPoints, 'outer', bounds.width, bounds.height);
    }
    this.drawFrame(context, this.innerPoints, 'inner', bounds.width, bounds.height);
    context.restore();
  }

  private drawFrame(
    context: CanvasRenderingContext2D,
    points: readonly Point[],
    frame: FrameName,
    width: number,
    height: number,
  ): void {
    const isInner = frame === 'inner';
    const color = isInner ? '#f2a66e' : '#f4efe5';
    this.addPolygonPath(context, points, width, height);
    context.strokeStyle = color;
    context.lineWidth = frame === this.activeFrame ? 1.8 : 1.15;
    context.setLineDash([]);
    context.stroke();

    points.forEach((point, index) => {
      const displayPoint = this.displayPoint(point, width, height);
      const x = displayPoint.x;
      const y = displayPoint.y;
      const active = frame === this.activeFrame && index === this.activePoint;
      context.beginPath();
      if (isInner) context.arc(x, y, active ? 9 : 7.5, 0, Math.PI * 2);
      else context.rect(x - (active ? 8 : 6.5), y - (active ? 8 : 6.5), active ? 16 : 13, active ? 16 : 13);
      context.fillStyle = active ? color : '#11100e';
      context.fill();
      context.strokeStyle = color;
      context.lineWidth = 1.5;
      context.stroke();
      context.fillStyle = active ? '#11100e' : color;
      context.font = '600 7px ui-monospace, monospace';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(`${isInner ? 'I' : 'O'}${index}`, x, y + 0.5);
    });

    const labelPoint = this.displayPoint(points[0], width, height);
    const labelX = clamp(labelPoint.x + 12, 8, width - 54);
    const labelY = clamp(labelPoint.y - 13, 10, height - 10);
    context.fillStyle = 'rgba(10, 10, 9, 0.78)';
    context.fillRect(labelX - 4, labelY - 7, 48, 13);
    context.fillStyle = color;
    context.font = '600 7px ui-monospace, monospace';
    context.textAlign = 'left';
    context.fillText(isInner ? 'INNER' : 'OUTER', labelX, labelY);
  }

  private createDemoImage(): void {
    const width = 1600;
    const height = 1000;
    this.imageCanvas.width = width;
    this.imageCanvas.height = height;
    const context = this.imageCanvas.getContext('2d', { alpha: false });
    if (!context) return;

    const background = context.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, '#d9d2c3');
    background.addColorStop(0.48, '#a7a091');
    background.addColorStop(1, '#5b5a53');
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    context.save();
    context.globalAlpha = 0.2;
    context.strokeStyle = '#282923';
    context.lineWidth = 1;
    for (let x = -height; x < width + height; x += 32) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x + height, height);
      context.stroke();
    }
    context.restore();

    context.fillStyle = '#292a25';
    context.beginPath();
    context.moveTo(0, 745);
    context.lineTo(590, 610);
    context.lineTo(1100, 660);
    context.lineTo(1600, 535);
    context.lineTo(1600, 1000);
    context.lineTo(0, 1000);
    context.closePath();
    context.fill();

    context.fillStyle = '#747165';
    context.beginPath();
    context.moveTo(0, 745);
    context.lineTo(590, 610);
    context.lineTo(1100, 660);
    context.lineTo(1600, 535);
    context.lineTo(1600, 585);
    context.lineTo(1090, 720);
    context.lineTo(600, 664);
    context.lineTo(0, 805);
    context.closePath();
    context.fill();

    const portalX = DEFAULT_INNER[0].x * width;
    const portalY = DEFAULT_INNER[0].y * height;
    const portalWidth = (DEFAULT_INNER[1].x - DEFAULT_INNER[0].x) * width;
    const portalHeight = (DEFAULT_INNER[3].y - DEFAULT_INNER[0].y) * height;
    context.fillStyle = '#efeadf';
    context.fillRect(portalX, portalY, portalWidth, portalHeight);
    context.strokeStyle = '#272823';
    context.lineWidth = 28;
    context.strokeRect(portalX, portalY, portalWidth, portalHeight);

    const inset = 68;
    context.fillStyle = '#34352f';
    context.fillRect(portalX + inset, portalY + inset, portalWidth - inset * 2, portalHeight - inset * 2);

    const portalGlow = context.createRadialGradient(width * 0.5, height * 0.5, 15, width * 0.5, height * 0.5, 320);
    portalGlow.addColorStop(0, '#d49b6d');
    portalGlow.addColorStop(0.35, '#8a745f');
    portalGlow.addColorStop(1, '#2b2d2a');
    context.fillStyle = portalGlow;
    const glowInset = 90;
    context.fillRect(
      portalX + glowInset,
      portalY + glowInset,
      portalWidth - glowInset * 2,
      portalHeight - glowInset * 2,
    );

    context.save();
    context.translate(width * 0.5, height * 0.5);
    context.strokeStyle = 'rgba(241, 234, 219, 0.56)';
    context.lineWidth = 5;
    for (let index = 0; index < 8; index += 1) {
      context.rotate(Math.PI / 4);
      context.strokeRect(45 + index * 16, 45 + index * 16, 120 + index * 25, 120 + index * 25);
    }
    context.restore();

    context.fillStyle = '#d8d0bf';
    for (let index = 0; index < 7; index += 1) {
      const x = 80 + index * 195;
      const step = index % 2 === 0 ? 0 : 45;
      context.fillRect(x, 735 - step, 160, 28);
      context.fillRect(x + 132, 735 - step, 28, 150 + step);
    }

    context.fillStyle = '#1d1e1a';
    context.font = '600 22px ui-monospace, monospace';
    context.letterSpacing = '8px';
    context.fillText('A ROOM INSIDE ITSELF', 82, 110);
    context.font = '14px ui-monospace, monospace';
    context.letterSpacing = '3px';
    context.fillText('OUTER = SOURCE · INNER = NEXT RECURSIVE FRAME', 84, 145);

    context.globalAlpha = 0.12;
    for (let index = 0; index < 24000; index += 1) {
      const shade = Math.random() > 0.5 ? 255 : 0;
      context.fillStyle = `rgb(${shade} ${shade} ${shade})`;
      context.fillRect(Math.random() * width, Math.random() * height, 1, 1);
    }
    context.globalAlpha = 1;
  }

  private addPolygonPath(
    context: CanvasRenderingContext2D,
    points: readonly Point[],
    width: number,
    height: number,
    begin = true,
  ): void {
    if (begin) context.beginPath();
    const first = this.displayPoint(points[0], width, height);
    context.moveTo(first.x, first.y);
    for (let index = 1; index < points.length; index += 1) {
      const point = this.displayPoint(points[index], width, height);
      context.lineTo(point.x, point.y);
    }
    context.closePath();
  }

  private currentViewBox(): ViewBox {
    return this.detailViewBox ?? { left: 0, top: 0, width: 1, height: 1 };
  }

  private makeDetailViewBox(): ViewBox {
    const minimumX = Math.min(...this.innerPoints.map((point) => point.x));
    const maximumX = Math.max(...this.innerPoints.map((point) => point.x));
    const minimumY = Math.min(...this.innerPoints.map((point) => point.y));
    const maximumY = Math.max(...this.innerPoints.map((point) => point.y));
    const frameWidth = maximumX - minimumX;
    const frameHeight = maximumY - minimumY;
    const paddingX = Math.max(0.02, frameWidth * 0.1);
    const paddingY = Math.max(0.02, frameHeight * 0.1);
    const width = Math.min(1, frameWidth + paddingX * 2);
    const height = Math.min(1, frameHeight + paddingY * 2);
    return {
      left: clamp((minimumX + maximumX - width) * 0.5, 0, 1 - width),
      top: clamp((minimumY + maximumY - height) * 0.5, 0, 1 - height),
      width,
      height,
    };
  }

  private displayPoint(point: Point, width: number, height: number): Point {
    const view = this.currentViewBox();
    return {
      x: (point.x - view.left) / view.width * width,
      y: (point.y - view.top) / view.height * height,
    };
  }

  private validFrames(inner: readonly Point[], outer: readonly Point[]): boolean {
    return isConvex(inner) && isConvex(outer) && inner.every((point) => pointInsideConvex(point, outer));
  }

  private framePoints(frame: FrameName): Point[] {
    return frame === 'inner' ? this.innerPoints : this.outerPoints;
  }

  private emitChange(): void {
    this.onChange(this.selection);
  }

  private handlePointerDown = (event: PointerEvent): void => {
    const handle = this.nearestHandle(event);
    const imagePoint = this.pointerImagePoint(event);
    const frame = handle ? null : this.frameUnderPoint(imagePoint);
    if (!handle && !frame) {
      if (event.pointerType !== 'touch') return;
      this.dragMode = 'scroll';
      this.scrollClient = { x: event.clientX, y: event.clientY };
      this.pointerId = event.pointerId;
      this.canvas.setPointerCapture(event.pointerId);
      return;
    }
    this.dragMode = handle ? 'point' : 'frame';
    this.activeFrame = handle?.frame ?? frame ?? 'inner';
    this.activePoint = handle?.index ?? -1;
    this.lastPointer = imagePoint;
    this.pointerId = event.pointerId;
    this.canvas.setPointerCapture(event.pointerId);
    this.canvas.classList.add('dragging');
    this.canvas.classList.remove('can-grab');
    this.canvas.focus({ preventScroll: true });
    this.draw();
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (this.pointerId === null) {
      this.updateHoverCursor(event);
      return;
    }
    if (this.pointerId !== event.pointerId) return;
    if (this.dragMode === 'scroll') {
      this.scrollFromClient(event);
      return;
    }
    if (this.dragMode === 'frame') {
      this.moveActiveFrame(event);
      return;
    }
    if (this.activePoint < 0) return;
    const inner = copyPoints(this.innerPoints);
    let outer = copyPoints(this.outerPoints);
    if (this.activeFrame === 'inner') {
      inner[this.activePoint] = this.eventPoint(event, true);
      const matchedOuter = fitOuterToInnerAspect(inner, outer, this.width / this.height);
      if (!matchedOuter) {
        this.onInvalid();
        return;
      }
      outer = matchedOuter;
    } else {
      outer = moveRectangleCorner(
        outer,
        this.activePoint,
        this.eventPoint(event, false),
        innerPhysicalAspect(inner, this.width / this.height) / (this.width / this.height),
      );
    }
    if (!this.validFrames(inner, outer)) {
      this.onInvalid();
      return;
    }
    this.innerPoints = inner;
    this.outerPoints = outer;
    this.emitChange();
    this.draw();
  };

  private handlePointerUp = (event: PointerEvent): void => {
    if (this.pointerId !== event.pointerId) return;
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
    this.pointerId = null;
    this.dragMode = null;
    this.lastPointer = null;
    this.scrollClient = null;
    this.canvas.classList.remove('dragging');
    this.updateHoverCursor(event);
  };

  private handlePointerLeave = (): void => {
    if (this.pointerId !== null) return;
    this.canvas.classList.remove('can-grab');
  };

  private nearestHandle(event: PointerEvent): { frame: FrameName; index: number } | null {
    const bounds = this.canvas.getBoundingClientRect();
    let nearestFrame: FrameName | null = null;
    let nearestIndex = -1;
    let nearestDistance = 30;
    (this.detailMode ? ['inner'] as const : ['inner', 'outer'] as const).forEach((frame) => {
      this.framePoints(frame).forEach((candidate, index) => {
        const displayCandidate = this.displayPoint(candidate, bounds.width, bounds.height);
        const distance = Math.hypot(
          displayCandidate.x - (event.clientX - bounds.left),
          displayCandidate.y - (event.clientY - bounds.top),
        );
        if (distance < nearestDistance) {
          nearestFrame = frame;
          nearestIndex = index;
          nearestDistance = distance;
        }
      });
    });
    if (!nearestFrame || nearestIndex < 0) return null;
    return { frame: nearestFrame, index: nearestIndex };
  }

  private frameUnderPoint(point: Point): FrameName | null {
    if (pointInsideConvex(point, this.innerPoints)) return 'inner';
    if (this.insideOuter(point)) return 'outer';
    return null;
  }

  private insideOuter(point: Point): boolean {
    const left = this.outerPoints[0].x;
    const right = this.outerPoints[1].x;
    const top = this.outerPoints[0].y;
    const bottom = this.outerPoints[3].y;
    return point.x > left && point.x < right && point.y > top && point.y < bottom;
  }

  private updateHoverCursor(event: PointerEvent): void {
    const insideFrame = !this.nearestHandle(event) && this.frameUnderPoint(this.pointerImagePoint(event)) !== null;
    this.canvas.classList.toggle('can-grab', insideFrame);
  }

  private moveActiveFrame(event: PointerEvent): void {
    if (!this.lastPointer) return;
    const now = this.pointerImagePoint(event);
    const step = { x: now.x - this.lastPointer.x, y: now.y - this.lastPointer.y };
    this.lastPointer = now;
    const inner = copyPoints(this.innerPoints);
    let outer = copyPoints(this.outerPoints);
    let unused = { x: 0, y: 0 };
    if (this.activeFrame === 'inner') {
      const shift = clampInnerShift(inner, outer, step);
      inner.forEach((point) => {
        point.x += shift.x;
        point.y += shift.y;
      });
      unused = { x: step.x - shift.x, y: step.y - shift.y };
    } else {
      const next = translateOuter(outer, inner, step);
      unused = {
        x: step.x - (next[0].x - outer[0].x),
        y: step.y - (next[0].y - outer[0].y),
      };
      outer = next;
    }
    if (this.validFrames(inner, outer)) {
      this.innerPoints = inner;
      this.outerPoints = outer;
      this.emitChange();
      this.draw();
    }
    if (event.pointerType === 'touch') this.scrollUnused(unused);
  }

  private scrollFromClient(event: PointerEvent): void {
    if (!this.scrollClient) return;
    const deltaY = this.scrollClient.y - event.clientY;
    this.scrollClient = { x: event.clientX, y: event.clientY };
    this.scrollPage(deltaY);
  }

  private scrollUnused(unused: Point): void {
    if (Math.abs(unused.y) < 1e-6) return;
    const bounds = this.canvas.getBoundingClientRect();
    const view = this.currentViewBox();
    const pixelsY = unused.y / view.height * bounds.height;
    this.scrollPage(-pixelsY);
  }

  private scrollPage(deltaY: number): void {
    if (deltaY === 0) return;
    const scroller = document.scrollingElement ?? document.documentElement;
    scroller.scrollBy({ top: deltaY, behavior: 'auto' });
  }

  private pointerImagePoint(event: PointerEvent): Point {
    const bounds = this.canvas.getBoundingClientRect();
    const view = this.currentViewBox();
    return {
      x: view.left + (event.clientX - bounds.left) / bounds.width * view.width,
      y: view.top + (event.clientY - bounds.top) / bounds.height * view.height,
    };
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (this.activePoint < 0) return;
    const directions: Partial<Record<string, Point>> = {
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = this.detailMode
      ? (event.shiftKey ? 0.002 : 0.00025)
      : (event.shiftKey ? 0.01 : 0.002);
    const inner = copyPoints(this.innerPoints);
    let outer = copyPoints(this.outerPoints);
    const points = this.activeFrame === 'inner' ? inner : outer;
    const inset = this.activeFrame === 'inner' ? 0.01 : 0;
    const nextPoint = {
      x: clamp(points[this.activePoint].x + direction.x * step, inset, 1 - inset),
      y: clamp(points[this.activePoint].y + direction.y * step, inset, 1 - inset),
    };
    if (this.activeFrame === 'inner') {
      inner[this.activePoint] = nextPoint;
      const matchedOuter = fitOuterToInnerAspect(inner, outer, this.width / this.height);
      if (!matchedOuter) {
        this.onInvalid();
        return;
      }
      outer = matchedOuter;
    } else {
      outer = moveRectangleCorner(
        outer,
        this.activePoint,
        nextPoint,
        innerPhysicalAspect(inner, this.width / this.height) / (this.width / this.height),
      );
    }
    if (!this.validFrames(inner, outer)) {
      this.onInvalid();
      return;
    }
    this.innerPoints = inner;
    this.outerPoints = outer;
    this.emitChange();
    this.draw();
  };

  private eventPoint(event: PointerEvent, inset: boolean): Point {
    const bounds = this.canvas.getBoundingClientRect();
    const view = this.currentViewBox();
    const limit = inset ? 0.01 : 0;
    return {
      x: clamp(view.left + (event.clientX - bounds.left) / bounds.width * view.width, limit, 1 - limit),
      y: clamp(view.top + (event.clientY - bounds.top) / bounds.height * view.height, limit, 1 - limit),
    };
  }
}
