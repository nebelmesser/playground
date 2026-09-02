import type { MeshBasicMaterial } from 'three';

export type DepthFade = {
  strength: { value: number };
  near: { value: number };
  far: { value: number };
};

export function attachDepthFade(mat: MeshBasicMaterial): DepthFade {
  const fade: DepthFade = {
    strength: { value: 0.36 },
    near: { value: 1 },
    far: { value: 8 },
  };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.fadeStrength = fade.strength;
    shader.uniforms.fadeNear = fade.near;
    shader.uniforms.fadeFar = fade.far;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vFadeDepth;')
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvFadeDepth = -mvPosition.z;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying float vFadeDepth;\nuniform float fadeStrength;\nuniform float fadeNear;\nuniform float fadeFar;',
      )
      .replace(
        '#include <opaque_fragment>',
        `#include <opaque_fragment>
        float fadeT = clamp((vFadeDepth - fadeNear) / max(0.001, fadeFar - fadeNear), 0.0, 1.0);
        gl_FragColor.a *= mix(1.0, fadeT, fadeStrength);`,
      );
  };
  mat.customProgramCacheKey = () => 'depth-fade';
  return fade;
}

export function setDepthFade(
  fades: DepthFade[],
  strength: number,
  near: number,
  far: number,
): void {
  for (const fade of fades) {
    fade.strength.value = strength;
    fade.near.value = near;
    fade.far.value = far;
  }
}
