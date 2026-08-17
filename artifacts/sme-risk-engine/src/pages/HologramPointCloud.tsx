import { useEffect, useMemo, useRef } from 'react';

type RegionKey =
  | 'head'
  | 'neck'
  | 'shoulder'
  | 'chest'
  | 'lowBack'
  | 'upperExtremity'
  | 'hand'
  | 'hip'
  | 'knee'
  | 'lowerExtremity'
  | 'foot'
  | 'wholeBody';

type Vec3 = { x: number; y: number; z: number };
type CloudPoint = Vec3 & { region: RegionKey; intensity: number };

type Props = {
  view: 'front' | 'back';
  tiltX: number;
  tiltY: number;
  activeRegion: RegionKey | null;
  regionScores: Partial<Record<RegionKey, number>>;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const length = (v: Vec3) => Math.hypot(v.x, v.y, v.z) || 1;
const normalize = (v: Vec3): Vec3 => {
  const d = length(v);
  return { x: v.x / d, y: v.y / d, z: v.z / d };
};
const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function pushEllipsoid(
  out: CloudPoint[],
  center: Vec3,
  radius: Vec3,
  region: RegionKey,
  latSteps: number,
  lonSteps: number,
  intensity = 1,
  innerLayer = true,
) {
  for (let i = 1; i < latSteps; i += 1) {
    const phi = (Math.PI * i) / latSteps;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    for (let j = 0; j < lonSteps; j += 1) {
      const theta = (Math.PI * 2 * j) / lonSteps + (i % 2 ? 0.045 : 0);
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);
      out.push({
        x: center.x + radius.x * sinPhi * cosTheta,
        y: center.y + radius.y * cosPhi,
        z: center.z + radius.z * sinPhi * sinTheta,
        region,
        intensity,
      });
      if (innerLayer && (i + j) % 5 === 0) {
        const shell = 0.78;
        out.push({
          x: center.x + radius.x * shell * sinPhi * cosTheta,
          y: center.y + radius.y * shell * cosPhi,
          z: center.z + radius.z * shell * sinPhi * sinTheta,
          region,
          intensity: intensity * 0.62,
        });
      }
    }
  }
}

function pushTaperedTube(
  out: CloudPoint[],
  start: Vec3,
  end: Vec3,
  startRadius: number,
  endRadius: number,
  region: RegionKey,
  lengthSteps: number,
  ringSteps: number,
  intensity = 1,
) {
  const axis = normalize({ x: end.x - start.x, y: end.y - start.y, z: end.z - start.z });
  const helper = Math.abs(axis.y) < 0.92 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const u = normalize(cross(axis, helper));
  const v = normalize(cross(axis, u));

  for (let i = 0; i <= lengthSteps; i += 1) {
    const t = i / lengthSteps;
    const center = {
      x: lerp(start.x, end.x, t),
      y: lerp(start.y, end.y, t),
      z: lerp(start.z, end.z, t),
    };
    const radius = lerp(startRadius, endRadius, t) * (0.97 + Math.sin(t * Math.PI) * 0.08);
    for (let j = 0; j < ringSteps; j += 1) {
      const angle = (Math.PI * 2 * j) / ringSteps + (i % 2 ? 0.08 : 0);
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);
      out.push({
        x: center.x + (u.x * ca + v.x * sa) * radius,
        y: center.y + (u.y * ca + v.y * sa) * radius,
        z: center.z + (u.z * ca + v.z * sa) * radius,
        region,
        intensity,
      });
      if ((i + j) % 7 === 0) {
        out.push({
          x: center.x + (u.x * ca + v.x * sa) * radius * 0.7,
          y: center.y + (u.y * ca + v.y * sa) * radius * 0.7,
          z: center.z + (u.z * ca + v.z * sa) * radius * 0.7,
          region,
          intensity: intensity * 0.58,
        });
      }
    }
  }
}

function pushTorso(out: CloudPoint[]) {
  const slices = 34;
  const ringSteps = 46;
  for (let i = 0; i <= slices; i += 1) {
    const t = i / slices;
    const y = lerp(0.98, -0.25, t);
    let width: number;
    if (t < 0.16) width = lerp(0.44, 0.54, t / 0.16);
    else if (t < 0.54) width = lerp(0.54, 0.39, (t - 0.16) / 0.38);
    else width = lerp(0.39, 0.33, (t - 0.54) / 0.46);
    const depth = t < 0.48 ? lerp(0.25, 0.23, t / 0.48) : lerp(0.23, 0.19, (t - 0.48) / 0.52);
    const region: RegionKey = t < 0.7 ? 'chest' : 'lowBack';
    for (let j = 0; j < ringSteps; j += 1) {
      const angle = (Math.PI * 2 * j) / ringSteps + (i % 2 ? 0.055 : 0);
      const x = width * Math.cos(angle);
      const z = depth * Math.sin(angle);
      const sternumLift = Math.max(0, 1 - Math.abs(x) / Math.max(width, 0.01)) * 0.025;
      out.push({ x, y, z: z + sternumLift, region, intensity: 1.02 });
      if ((i + j) % 6 === 0) out.push({ x: x * 0.78, y, z: z * 0.78, region, intensity: 0.58 });
    }
  }
}

function buildHumanPointCloud(): CloudPoint[] {
  const points: CloudPoint[] = [];

  // Head + jaw volume.
  pushEllipsoid(points, { x: 0, y: 1.55, z: 0 }, { x: 0.255, y: 0.35, z: 0.245 }, 'head', 26, 34, 1.12);
  pushEllipsoid(points, { x: 0, y: 1.31, z: 0.018 }, { x: 0.205, y: 0.17, z: 0.205 }, 'head', 12, 28, 1.04, false);

  // Face landmarks remain subtle but make anterior view read as a human head.
  for (let i = -3; i <= 3; i += 1) {
    points.push({ x: i * 0.038, y: 1.61, z: 0.235, region: 'head', intensity: 1.55 });
    points.push({ x: i * 0.027, y: 1.43, z: 0.235, region: 'head', intensity: 1.35 });
  }

  pushTaperedTube(points, { x: 0, y: 1.25, z: 0 }, { x: 0, y: 0.99, z: 0 }, 0.16, 0.18, 'neck', 11, 24, 1.05);
  pushTorso(points);
  pushEllipsoid(points, { x: 0, y: -0.38, z: 0 }, { x: 0.36, y: 0.25, z: 0.235 }, 'hip', 18, 38, 1.04);

  const sides = [-1, 1] as const;
  for (const side of sides) {
    const sx = side * 0.53;
    const elbowX = side * 0.76;
    const wristX = side * 0.89;
    const handX = side * 0.92;

    pushEllipsoid(points, { x: sx, y: 0.73, z: 0 }, { x: 0.17, y: 0.18, z: 0.19 }, 'shoulder', 14, 25, 1.28);
    pushTaperedTube(points, { x: sx, y: 0.7, z: 0 }, { x: elbowX, y: 0.08, z: 0 }, 0.135, 0.105, 'upperExtremity', 20, 22, 1.03);
    pushEllipsoid(points, { x: elbowX, y: 0.08, z: 0 }, { x: 0.11, y: 0.105, z: 0.105 }, 'upperExtremity', 10, 18, 1.18, false);
    pushTaperedTube(points, { x: elbowX, y: 0.04, z: 0 }, { x: wristX, y: -0.52, z: 0.005 }, 0.105, 0.075, 'upperExtremity', 18, 20, 1.02);
    pushEllipsoid(points, { x: handX, y: -0.68, z: 0.015 }, { x: 0.095, y: 0.18, z: 0.075 }, 'hand', 13, 20, 1.28);

    const hipX = side * 0.19;
    const kneeX = side * 0.215;
    const ankleX = side * 0.205;
    pushTaperedTube(points, { x: hipX, y: -0.48, z: 0 }, { x: kneeX, y: -1.16, z: 0.01 }, 0.18, 0.135, 'lowerExtremity', 24, 25, 1.04);
    pushEllipsoid(points, { x: kneeX, y: -1.17, z: 0.018 }, { x: 0.145, y: 0.125, z: 0.135 }, 'knee', 12, 22, 1.3, false);
    pushTaperedTube(points, { x: kneeX, y: -1.2, z: 0.01 }, { x: ankleX, y: -1.71, z: 0.035 }, 0.135, 0.085, 'lowerExtremity', 21, 22, 1.02);
    pushEllipsoid(points, { x: ankleX, y: -1.72, z: 0.03 }, { x: 0.09, y: 0.1, z: 0.09 }, 'foot', 10, 18, 1.22, false);
    pushEllipsoid(points, { x: side * 0.215, y: -1.82, z: 0.14 }, { x: 0.15, y: 0.085, z: 0.27 }, 'foot', 10, 26, 1.26);
  }

  return points;
}

function rotatePoint(point: CloudPoint, yaw: number, pitch: number): CloudPoint {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = point.x * cy + point.z * sy;
  const z1 = -point.x * sy + point.z * cy;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const y2 = point.y * cp - z1 * sp;
  const z2 = point.y * sp + z1 * cp;
  return { ...point, x: x1, y: y2, z: z2 };
}

function regionColor(score: number, active: boolean) {
  if (!active) return { r: 110, g: 235, b: 255 };
  if (score >= 0.8) return { r: 255, g: 102, b: 133 };
  if (score >= 0.6) return { r: 255, g: 185, b: 99 };
  if (score >= 0.4) return { r: 118, g: 239, b: 221 };
  return { r: 96, g: 216, b: 255 };
}

export default function HologramPointCloud({ view, tiltX, tiltY, activeRegion, regionScores }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const points = useMemo(() => buildHumanPointCloud(), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const pixelWidth = Math.round(width * dpr);
      const pixelHeight = Math.round(height * dpr);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const yaw = (view === 'back' ? Math.PI : 0) + tiltX * 0.17;
      const pitch = -tiltY * 0.1;
      const rotated = points.map((point) => rotatePoint(point, yaw, pitch)).sort((a, b) => a.z - b.z);
      const camera = 5.6;
      const scale = Math.min(width / 2.75, height / 4.02);
      const cx = width / 2;
      const cy = height * 0.505;

      context.save();
      context.globalCompositeOperation = 'lighter';

      // Soft volumetric glow pass.
      for (const point of rotated) {
        const perspective = camera / (camera - point.z);
        const x = cx + point.x * scale * perspective;
        const y = cy - point.y * scale * perspective;
        const depth = clamp((point.z + 0.34) / 0.68, 0, 1);
        const score = regionScores[point.region] ?? 0;
        const isActive = activeRegion === point.region;
        const color = regionColor(score, isActive);
        const alpha = (0.035 + depth * 0.045) * point.intensity * (isActive ? 1.65 : 1);
        const radius = (2.2 + depth * 1.45) * perspective * (isActive ? 1.18 : 1);
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`;
        context.fill();
      }

      // Crisp point pass.
      for (const point of rotated) {
        const perspective = camera / (camera - point.z);
        const x = cx + point.x * scale * perspective;
        const y = cy - point.y * scale * perspective;
        const depth = clamp((point.z + 0.34) / 0.68, 0, 1);
        const score = regionScores[point.region] ?? 0;
        const isActive = activeRegion === point.region;
        const color = regionColor(score, isActive);
        const signalBoost = score > 0 ? 1 + score * 0.18 : 1;
        const alpha = clamp((0.5 + depth * 0.5) * point.intensity * signalBoost, 0.2, 1);
        const radius = (0.62 + depth * 0.72) * perspective * (isActive ? 1.24 : 1);
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${color.r},${color.g},${color.b},${alpha})`;
        context.fill();
      }

      context.restore();
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [points, view, tiltX, tiltY, activeRegion, regionScores]);

  return <canvas ref={canvasRef} className="hologram-point-cloud-canvas" aria-label={`${view === 'front' ? 'Anterior' : 'Posterior'} volumetric human point-cloud hologram`} />;
}
