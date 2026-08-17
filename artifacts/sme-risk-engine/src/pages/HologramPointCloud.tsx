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
type CloudPoint = Vec3 & { region: RegionKey; intensity: number; seed: number };
type SweepNode = Vec3 & { rx: number; rz: number; region: RegionKey };

type Props = {
  view: 'front' | 'back';
  tiltX: number;
  tiltY: number;
  activeRegion: RegionKey | null;
  regionScores: Partial<Record<RegionKey, number>>;
};

const TAU = Math.PI * 2;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

function seeded(index: number) {
  const x = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function addRing(
  out: CloudPoint[],
  center: Vec3,
  rx: number,
  rz: number,
  region: RegionKey,
  ringSteps: number,
  seedBase: number,
  phase = 0,
  intensity = 1,
) {
  for (let j = 0; j < ringSteps; j += 1) {
    const a = (j / ringSteps) * TAU + phase;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const seed = seeded(seedBase + j);
    out.push({
      x: center.x + rx * ca,
      y: center.y,
      z: center.z + rz * sa,
      region,
      intensity: intensity * (0.93 + seed * 0.14),
      seed,
    });
  }
}

function addInnerRing(
  out: CloudPoint[],
  center: Vec3,
  rx: number,
  rz: number,
  region: RegionKey,
  ringSteps: number,
  seedBase: number,
  phase = 0,
) {
  const shell = 0.76;
  for (let j = 0; j < ringSteps; j += 3) {
    const a = (j / ringSteps) * TAU + phase;
    const seed = seeded(seedBase + j + 311);
    out.push({
      x: center.x + rx * shell * Math.cos(a),
      y: center.y,
      z: center.z + rz * shell * Math.sin(a),
      region,
      intensity: 0.42 + seed * 0.16,
      seed,
    });
  }
}

function addHead(out: CloudPoint[]) {
  const slices = 34;
  const rings = 42;
  const yBottom = 1.29;
  const yTop = 1.84;

  for (let i = 0; i <= slices; i += 1) {
    const t = i / slices;
    const y = lerp(yBottom, yTop, t);
    const normalized = (t - 0.52) / 0.52;
    const skull = Math.sqrt(Math.max(0, 1 - normalized * normalized));
    const jawTaper = t < 0.36 ? lerp(0.72, 1, smooth(t / 0.36)) : 1;
    const crownTaper = t > 0.78 ? lerp(1, 0.82, smooth((t - 0.78) / 0.22)) : 1;
    const width = 0.205 * skull * jawTaper * crownTaper + 0.018;
    const depth = 0.218 * skull * (0.94 + 0.06 * Math.sin(t * Math.PI)) + 0.016;
    const centerZ = t < 0.42 ? 0.018 : -0.004;
    const phase = i % 2 ? 0.07 : 0;
    addRing(out, { x: 0, y, z: centerZ }, width, depth, 'head', rings, 1000 + i * rings, phase, 1.08);
    if (i % 2 === 0) addInnerRing(out, { x: 0, y, z: centerZ }, width, depth, 'head', rings, 14000 + i * rings, phase);
  }

  const face = [
    [-0.075, 1.61, 0.205], [0.075, 1.61, 0.205],
    [-0.055, 1.60, 0.211], [0.055, 1.60, 0.211],
    [0, 1.54, 0.224], [0, 1.49, 0.216],
    [-0.055, 1.42, 0.19], [0, 1.405, 0.196], [0.055, 1.42, 0.19],
  ];
  face.forEach(([x, y, z], index) => out.push({ x, y, z, region: 'head', intensity: 1.7, seed: seeded(90000 + index) }));
}

function addNeck(out: CloudPoint[]) {
  const slices = 14;
  const rings = 34;
  for (let i = 0; i <= slices; i += 1) {
    const t = i / slices;
    const y = lerp(1.30, 1.05, t);
    const flare = smooth(t);
    const rx = lerp(0.13, 0.19, flare);
    const rz = lerp(0.145, 0.19, flare);
    addRing(out, { x: 0, y, z: -0.005 }, rx, rz, 'neck', rings, 22000 + i * rings, i % 2 ? 0.08 : 0, 0.98);
  }
}

function torsoProfile(t: number) {
  let width: number;
  if (t < 0.14) width = lerp(0.36, 0.53, smooth(t / 0.14));
  else if (t < 0.42) width = lerp(0.53, 0.45, smooth((t - 0.14) / 0.28));
  else if (t < 0.72) width = lerp(0.45, 0.335, smooth((t - 0.42) / 0.30));
  else width = lerp(0.335, 0.39, smooth((t - 0.72) / 0.28));

  let depth: number;
  if (t < 0.34) depth = lerp(0.205, 0.255, smooth(t / 0.34));
  else if (t < 0.68) depth = lerp(0.255, 0.19, smooth((t - 0.34) / 0.34));
  else depth = lerp(0.19, 0.215, smooth((t - 0.68) / 0.32));

  return { width, depth };
}

function addTorso(out: CloudPoint[]) {
  const slices = 48;
  const rings = 58;
  for (let i = 0; i <= slices; i += 1) {
    const t = i / slices;
    const y = lerp(1.08, -0.36, t);
    const { width, depth } = torsoProfile(t);
    const region: RegionKey = t < 0.68 ? 'chest' : 'lowBack';
    const phase = i % 2 ? 0.055 : 0;
    for (let j = 0; j < rings; j += 1) {
      const a = (j / rings) * TAU + phase;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const front = Math.max(0, sa);
      const back = Math.max(0, -sa);
      const sternum = front * Math.max(0, 1 - Math.abs(ca)) * 0.025 * (1 - t * 0.45);
      const lumbar = back * 0.012 * smooth(clamp((t - 0.48) / 0.4, 0, 1));
      const seed = seeded(30000 + i * rings + j);
      out.push({
        x: width * ca,
        y,
        z: depth * sa + sternum - lumbar,
        region,
        intensity: 0.95 + seed * 0.12,
        seed,
      });
    }
    if (i % 2 === 0) addInnerRing(out, { x: 0, y, z: 0 }, width, depth, region, rings, 52000 + i * rings, phase);
  }
}

function interpolateSweep(nodes: SweepNode[], t: number): SweepNode {
  const scaled = t * (nodes.length - 1);
  const index = Math.min(nodes.length - 2, Math.floor(scaled));
  const local = smooth(scaled - index);
  const a = nodes[index];
  const b = nodes[index + 1];
  return {
    x: lerp(a.x, b.x, local),
    y: lerp(a.y, b.y, local),
    z: lerp(a.z, b.z, local),
    rx: lerp(a.rx, b.rx, local),
    rz: lerp(a.rz, b.rz, local),
    region: local < 0.5 ? a.region : b.region,
  };
}

function addSweep(out: CloudPoint[], nodes: SweepNode[], slices: number, rings: number, seedBase: number) {
  for (let i = 0; i <= slices; i += 1) {
    const t = i / slices;
    const p = interpolateSweep(nodes, t);
    const prev = interpolateSweep(nodes, clamp(t - 1 / slices, 0, 1));
    const next = interpolateSweep(nodes, clamp(t + 1 / slices, 0, 1));
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const phase = i % 2 ? 0.075 : 0;

    for (let j = 0; j < rings; j += 1) {
      const a = (j / rings) * TAU + phase;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const seed = seeded(seedBase + i * rings + j);
      out.push({
        x: p.x + nx * p.rx * ca,
        y: p.y + ny * p.rx * ca,
        z: p.z + p.rz * sa,
        region: p.region,
        intensity: 0.95 + seed * 0.12,
        seed,
      });
      if ((i + j) % 9 === 0) {
        out.push({
          x: p.x + nx * p.rx * ca * 0.74,
          y: p.y + ny * p.rx * ca * 0.74,
          z: p.z + p.rz * sa * 0.74,
          region: p.region,
          intensity: 0.46,
          seed: seeded(seedBase + 80000 + i * rings + j),
        });
      }
    }
  }
}

function addPelvis(out: CloudPoint[]) {
  const slices = 22;
  const rings = 48;
  for (let i = 0; i <= slices; i += 1) {
    const t = i / slices;
    const y = lerp(-0.27, -0.63, t);
    const bell = Math.sin(t * Math.PI);
    const width = 0.32 + bell * 0.095 - t * 0.015;
    const depth = 0.19 + bell * 0.045;
    addRing(out, { x: 0, y, z: 0 }, width, depth, 'hip', rings, 68000 + i * rings, i % 2 ? 0.06 : 0, 0.98);
  }
}

function addArms(out: CloudPoint[]) {
  for (const side of [-1, 1] as const) {
    const s = side;
    addSweep(out, [
      { x: s * 0.39, y: 0.96, z: 0, rx: 0.18, rz: 0.19, region: 'shoulder' },
      { x: s * 0.54, y: 0.87, z: 0, rx: 0.155, rz: 0.165, region: 'shoulder' },
      { x: s * 0.65, y: 0.56, z: 0.005, rx: 0.135, rz: 0.145, region: 'upperExtremity' },
      { x: s * 0.70, y: 0.22, z: 0.008, rx: 0.105, rz: 0.112, region: 'upperExtremity' },
      { x: s * 0.73, y: 0.04, z: 0.006, rx: 0.096, rz: 0.102, region: 'upperExtremity' },
      { x: s * 0.78, y: -0.24, z: 0.012, rx: 0.105, rz: 0.098, region: 'upperExtremity' },
      { x: s * 0.83, y: -0.50, z: 0.018, rx: 0.073, rz: 0.068, region: 'upperExtremity' },
      { x: s * 0.85, y: -0.62, z: 0.028, rx: 0.066, rz: 0.06, region: 'hand' },
    ], 48, 28, side < 0 ? 90000 : 110000);

    addSweep(out, [
      { x: s * 0.85, y: -0.61, z: 0.028, rx: 0.07, rz: 0.06, region: 'hand' },
      { x: s * 0.865, y: -0.73, z: 0.045, rx: 0.082, rz: 0.055, region: 'hand' },
      { x: s * 0.875, y: -0.86, z: 0.055, rx: 0.055, rz: 0.042, region: 'hand' },
    ], 16, 22, side < 0 ? 130000 : 140000);
  }
}

function addLegs(out: CloudPoint[]) {
  for (const side of [-1, 1] as const) {
    const s = side;
    addSweep(out, [
      { x: s * 0.18, y: -0.48, z: 0, rx: 0.19, rz: 0.205, region: 'hip' },
      { x: s * 0.205, y: -0.68, z: 0.002, rx: 0.18, rz: 0.19, region: 'lowerExtremity' },
      { x: s * 0.215, y: -0.96, z: 0.008, rx: 0.158, rz: 0.165, region: 'lowerExtremity' },
      { x: s * 0.218, y: -1.19, z: 0.012, rx: 0.126, rz: 0.13, region: 'knee' },
      { x: s * 0.214, y: -1.33, z: 0.016, rx: 0.118, rz: 0.122, region: 'lowerExtremity' },
      { x: s * 0.205, y: -1.53, z: 0.022, rx: 0.132, rz: 0.122, region: 'lowerExtremity' },
      { x: s * 0.198, y: -1.72, z: 0.028, rx: 0.093, rz: 0.082, region: 'lowerExtremity' },
      { x: s * 0.195, y: -1.86, z: 0.035, rx: 0.074, rz: 0.068, region: 'foot' },
    ], 58, 30, side < 0 ? 160000 : 190000);

    addSweep(out, [
      { x: s * 0.195, y: -1.84, z: 0.055, rx: 0.078, rz: 0.075, region: 'foot' },
      { x: s * 0.195, y: -1.90, z: 0.16, rx: 0.105, rz: 0.085, region: 'foot' },
      { x: s * 0.195, y: -1.91, z: 0.30, rx: 0.115, rz: 0.065, region: 'foot' },
      { x: s * 0.195, y: -1.91, z: 0.40, rx: 0.075, rz: 0.04, region: 'foot' },
    ], 18, 24, side < 0 ? 220000 : 230000);
  }
}

function buildHumanSurface(): CloudPoint[] {
  const points: CloudPoint[] = [];
  addHead(points);
  addNeck(points);
  addTorso(points);
  addPelvis(points);
  addArms(points);
  addLegs(points);
  return points;
}

function rotate(point: CloudPoint, yaw: number, pitch: number): CloudPoint {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = point.x * cy + point.z * sy;
  const z1 = -point.x * sy + point.z * cy;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return {
    ...point,
    x: x1,
    y: point.y * cp - z1 * sp,
    z: point.y * sp + z1 * cp,
  };
}

function regionColor(score: number, active: boolean) {
  if (!active) return { r: 104, g: 232, b: 255 };
  if (score >= 0.8) return { r: 255, g: 92, b: 126 };
  if (score >= 0.6) return { r: 255, g: 181, b: 93 };
  if (score >= 0.4) return { r: 114, g: 240, b: 220 };
  return { r: 90, g: 214, b: 255 };
}

export default function HologramPointCloud({ view, tiltX, tiltY, activeRegion, regionScores }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const points = useMemo(() => buildHumanSurface(), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const pw = Math.round(width * dpr);
      const ph = Math.round(height * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const elapsed = (now - start) / 1000;
      const idleYaw = Math.sin(elapsed * 0.33) * 0.018;
      const yaw = (view === 'back' ? Math.PI : 0) + tiltX * 0.14 + idleYaw;
      const pitch = -tiltY * 0.075;
      const rotated = points.map((p) => rotate(p, yaw, pitch)).sort((a, b) => a.z - b.z);

      const camera = 5.8;
      const scale = Math.min(width / 2.45, height / 4.18);
      const cx = width / 2;
      const cy = height * 0.515;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < rotated.length; i += 2) {
        const p = rotated[i];
        const perspective = camera / (camera - p.z);
        const x = cx + p.x * scale * perspective;
        const y = cy - p.y * scale * perspective;
        const depth = clamp((p.z + 0.32) / 0.64, 0, 1);
        const score = regionScores[p.region] ?? 0;
        const active = activeRegion === p.region;
        const c = regionColor(score, active);
        const shimmer = 0.86 + Math.sin(elapsed * 2.1 + p.seed * 9) * 0.14;
        const alpha = (0.022 + depth * 0.035) * p.intensity * shimmer * (active ? 1.55 : 1);
        const radius = (2 + depth * 1.8) * perspective * (active ? 1.15 : 1);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`;
        ctx.fill();
      }

      for (const p of rotated) {
        const perspective = camera / (camera - p.z);
        const x = cx + p.x * scale * perspective;
        const y = cy - p.y * scale * perspective;
        const depth = clamp((p.z + 0.32) / 0.64, 0, 1);
        const score = regionScores[p.region] ?? 0;
        const active = activeRegion === p.region;
        const c = regionColor(score, active);
        const scan = 0.9 + 0.1 * Math.sin(elapsed * 3.3 + p.y * 13 + p.seed * 4);
        const alpha = clamp((0.38 + depth * 0.6) * p.intensity * scan * (active ? 1.16 : 1), 0.16, 1);
        const radius = (0.48 + depth * 0.64) * perspective * (active ? 1.2 : 1);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`;
        ctx.fill();
      }

      const scanY = ((elapsed * 0.16) % 1) * height;
      const gradient = ctx.createLinearGradient(0, scanY - 24, 0, scanY + 24);
      gradient.addColorStop(0, 'rgba(120,245,255,0)');
      gradient.addColorStop(0.5, 'rgba(180,255,255,0.055)');
      gradient.addColorStop(1, 'rgba(120,245,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(cx - width * 0.31, scanY - 24, width * 0.62, 48);

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [points, view, tiltX, tiltY, activeRegion, regionScores]);

  return (
    <canvas
      ref={canvasRef}
      className="hologram-point-cloud-canvas"
      aria-label={`${view === 'front' ? 'Anterior' : 'Posterior'} continuous human point-cloud hologram`}
    />
  );
}
