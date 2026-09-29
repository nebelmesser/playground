export type GpuContext = {
  device: GPUDevice;
  format: GPUTextureFormat;
};

export async function requestGpu(): Promise<GpuContext | null> {
  try {
    if (!navigator.gpu) return null;
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) return null;
    const device = await adapter.requestDevice();

    device.lost.then((info) => {
      console.error('WebGPU device lost:', info.message);
    });
    device.addEventListener('uncapturederror', (event) => {
      console.error('WebGPU:', event.error.message);
    });

    return {
      device,
      format: navigator.gpu.getPreferredCanvasFormat(),
    };
  } catch (error) {
    console.error('WebGPU initialization failed.', error);
    return null;
  }
}
