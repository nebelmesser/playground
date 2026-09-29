import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  Quality,
  canEncodeVideo,
} from 'mediabunny';

export const VIDEO_FPS = 60;
export const VIDEO_DURATION_SECONDS = 4;
export const VIDEO_FRAME_COUNT = VIDEO_FPS * VIDEO_DURATION_SECONDS;

export const VIDEO_PRESETS = [
  { value: 'source', label: 'SOURCE', longEdge: null },
  { value: '1280', label: '720p', longEdge: 1280 },
  { value: '1920', label: '1080p', longEdge: 1920 },
  { value: '2560', label: '1440p', longEdge: 2560 },
  { value: '3840', label: '4K', longEdge: 3840 },
] as const;

export type VideoPreset = (typeof VIDEO_PRESETS)[number]['value'];

export function isVideoPreset(value: unknown): value is VideoPreset {
  return VIDEO_PRESETS.some((preset) => preset.value === value);
}

export function videoPresetFits(preset: VideoPreset, maxEdge: number): boolean {
  if (preset === 'source') return true;
  return Number(preset) <= maxEdge;
}

/** H.264 4:2:0 needs even width and height. Round to the nearest even value that still fits. */
export function evenDimension(value: number, maxEdge: number): number {
  const limit = maxEdge - (maxEdge % 2);
  const rounded = Math.round(Math.min(Math.max(value, 2), limit) / 2) * 2;
  return Math.max(2, Math.min(rounded, limit));
}

export function fitEvenFrame(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  const scale = longest > maxEdge ? maxEdge / longest : 1;
  return {
    width: evenDimension(width * scale, maxEdge),
    height: evenDimension(height * scale, maxEdge),
  };
}

export function videoFrameSize(
  preset: VideoPreset,
  crop: { width: number; height: number },
  maxEdge: number,
): { width: number; height: number } {
  if (preset === 'source') return fitEvenFrame(crop.width, crop.height, maxEdge);
  const longEdge = Number(preset);
  const aspect = crop.width / Math.max(crop.height, 1);
  if (aspect >= 1) return fitEvenFrame(longEdge, longEdge / aspect, maxEdge);
  return fitEvenFrame(longEdge * aspect, longEdge, maxEdge);
}

function videoBitrate(width: number, height: number): number {
  const reference = 1920 * 1080;
  const scaled = 12_000_000 * (width * height) / reference;
  return Math.round(Math.min(50_000_000, Math.max(4_000_000, scaled)));
}

export async function encodeMp4(options: {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  frameCount: number;
  drawFrame: (index: number) => void;
  onProgress: (index: number) => void;
}): Promise<Blob> {
  const { canvas, width, height, frameCount, drawFrame, onProgress } = options;
  if (width % 2 !== 0 || height % 2 !== 0) {
    throw new Error('MP4 frame dimensions must be even.');
  }

  const quality = new Quality({ bitrate: videoBitrate(width, height), bitrateMode: 'variable' });
  const supported = await canEncodeVideo('avc', {
    width,
    height,
    quality,
    frameRate: VIDEO_FPS,
  });
  if (!supported) {
    throw new Error(`This browser cannot encode an H.264 MP4 at ${width} × ${height}.`);
  }

  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target,
  });
  const source = new CanvasSource(canvas, {
    codec: 'avc',
    quality,
    latencyMode: 'quality',
    keyFrameInterval: 2,
    alpha: 'discard',
  });
  output.addVideoTrack(source, { frameRate: VIDEO_FPS });

  try {
    await output.start();
    const frameDuration = 1 / VIDEO_FPS;
    for (let index = 0; index < frameCount; index += 1) {
      drawFrame(index);
      onProgress(index);
      await source.add(index * frameDuration, frameDuration);
      if (index % 8 === 0) {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        });
      }
    }
    await output.finalize();
  } catch (error) {
    if (output.state !== 'finalized' && output.state !== 'canceled') {
      await output.cancel().catch(() => undefined);
    }
    throw error;
  }

  if (!target.buffer) throw new Error('MP4 encoding produced an empty file.');
  return new Blob([target.buffer], { type: 'video/mp4' });
}
