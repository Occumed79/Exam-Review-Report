/*
 * Adapted from Anderson Mancini's MIT-licensed HolographicMaterialVanilla.
 * Source: https://github.com/ektogamat/threejs-vanilla-holographic-material
 * Original copyright remains with the upstream author; see THIRD_PARTY_ASSETS.md.
 */

export type HolographicMaterialOptions = {
  fresnelOpacity?: number;
  fresnelAmount?: number;
  scanlineSize?: number;
  hologramBrightness?: number;
  signalSpeed?: number;
  hologramColor?: string;
  hologramOpacity?: number;
  enableBlinking?: boolean;
  blinkFresnelOnly?: boolean;
  depthTest?: boolean;
};

const vertexShader = `
  varying vec2 vUv;
  varying vec4 vPos;
  varying vec3 vNormalW;
  varying vec3 vPositionW;
  void main() {
    vUv = uv;
    vPos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vPositionW = vec3(modelMatrix * vec4(position, 1.0));
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = vPos;
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying vec4 vPos;
  varying vec3 vNormalW;
  varying vec3 vPositionW;

  uniform float time;
  uniform float fresnelOpacity;
  uniform float fresnelAmount;
  uniform float scanlineSize;
  uniform float hologramBrightness;
  uniform float signalSpeed;
  uniform float hologramOpacity;
  uniform bool enableBlinking;
  uniform bool blinkFresnelOnly;
  uniform vec3 hologramColor;

  float flicker(float amount, float t) {
    return clamp(fract(cos(t) * 43758.5453123), amount, 1.0);
  }
  float random2(vec2 p) {
    return fract(cos(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 coords = vPos.xy / vPos.w;
    vec2 screenUv = fract(coords * 0.5 + 0.5);
    float scan = 10.0 + 20.0 * sin(time * signalSpeed * 20.8 - screenUv.y * 60.0 * scanlineSize);
    scan *= smoothstep(1.3 * cos(time * signalSpeed + screenUv.y * scanlineSize), 0.78, 0.9);
    scan *= max(0.25, sin(time * signalSpeed));

    float noise = random2(vUv + vec2(time * 0.01, 0.0));
    vec4 holo = vec4(hologramColor, hologramOpacity);
    holo.rgb *= hologramBrightness;
    holo.rgb += vec3(noise * scan, noise * scan * 0.65, scan) / 84.0;

    vec3 viewDirectionW = normalize(cameraPosition - vPositionW);
    float fresnel = dot(viewDirectionW, normalize(vNormalW)) * (1.6 - fresnelOpacity * 0.5);
    fresnel = clamp(fresnelAmount - fresnel, 0.0, fresnelOpacity);

    float blinkValue = enableBlinking ? 0.6 - signalSpeed : 1.0;
    float blink = flicker(blinkValue, time * signalSpeed * 0.02);
    vec3 finalColor = blinkFresnelOnly ? holo.rgb + fresnel * blink : holo.rgb * blink + fresnel;

    gl_FragColor = vec4(finalColor, hologramOpacity);
  }
`;

export function createAndersonManciniHolographicMaterial(THREE: any, options: HolographicMaterialOptions = {}) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      fresnelOpacity: { value: options.fresnelOpacity ?? 1.0 },
      fresnelAmount: { value: options.fresnelAmount ?? 0.48 },
      scanlineSize: { value: options.scanlineSize ?? 8.0 },
      hologramBrightness: { value: options.hologramBrightness ?? 1.25 },
      signalSpeed: { value: options.signalSpeed ?? 0.52 },
      hologramColor: { value: new THREE.Color(options.hologramColor ?? '#36e7ff') },
      hologramOpacity: { value: options.hologramOpacity ?? 0.72 },
      enableBlinking: { value: options.enableBlinking ?? true },
      blinkFresnelOnly: { value: options.blinkFresnelOnly ?? true },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest: options.depthTest ?? false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  const clock = new THREE.Clock();
  (material as any).updateHologram = () => {
    material.uniforms.time.value = clock.getElapsedTime();
  };
  return material;
}
