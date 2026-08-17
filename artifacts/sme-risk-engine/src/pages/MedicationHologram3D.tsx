import { useEffect, useRef } from 'react';
import { createAndersonManciniHolographicMaterial } from '../vendor/andersonManciniHolographicMaterial';

type Props = {
  cid?: number;
  drugName: string;
  onStatus?: (status: 'loading' | 'ready' | 'error') => void;
};

type Atom = { x: number; y: number; z: number; element: string };
type Bond = { a: number; b: number; order: number };

type Molecule3D = { atoms: Atom[]; bonds: Bond[] };

const THREE_VERSION = '0.180.0';
const THREE_URL = `https://esm.sh/three@${THREE_VERSION}`;

async function remoteImport(url: string): Promise<any> {
  return import(/* @vite-ignore */ url);
}

function parseSdf(text: string): Molecule3D {
  const lines = text.replace(/\r/g, '').split('\n');
  if (lines.length < 5) throw new Error('Invalid SDF payload');

  const counts = lines[3] ?? '';
  let atomCount = Number.parseInt(counts.slice(0, 3).trim(), 10);
  let bondCount = Number.parseInt(counts.slice(3, 6).trim(), 10);
  if (!Number.isFinite(atomCount) || !Number.isFinite(bondCount)) {
    const parts = counts.trim().split(/\s+/);
    atomCount = Number.parseInt(parts[0] ?? '', 10);
    bondCount = Number.parseInt(parts[1] ?? '', 10);
  }
  if (!atomCount) throw new Error('SDF contains no atoms');

  const atoms: Atom[] = [];
  for (let i = 0; i < atomCount; i += 1) {
    const line = lines[4 + i] ?? '';
    atoms.push({
      x: Number.parseFloat(line.slice(0, 10).trim()) || 0,
      y: Number.parseFloat(line.slice(10, 20).trim()) || 0,
      z: Number.parseFloat(line.slice(20, 30).trim()) || 0,
      element: line.slice(31, 34).trim() || 'C',
    });
  }

  const bonds: Bond[] = [];
  const bondStart = 4 + atomCount;
  for (let i = 0; i < bondCount; i += 1) {
    const line = lines[bondStart + i] ?? '';
    const a = Number.parseInt(line.slice(0, 3).trim(), 10) - 1;
    const b = Number.parseInt(line.slice(3, 6).trim(), 10) - 1;
    const order = Number.parseInt(line.slice(6, 9).trim(), 10) || 1;
    if (a >= 0 && b >= 0 && a < atoms.length && b < atoms.length) bonds.push({ a, b, order });
  }
  return { atoms, bonds };
}

function elementColor(element: string) {
  switch (element.toUpperCase()) {
    case 'O': return '#ff5d72';
    case 'N': return '#66a8ff';
    case 'S': return '#ffd35e';
    case 'P': return '#ff9d4a';
    case 'CL': return '#71f08c';
    case 'F': return '#8dffb3';
    default: return '#dffcff';
  }
}

function atomRadius(element: string) {
  switch (element.toUpperCase()) {
    case 'H': return 0.12;
    case 'O': return 0.23;
    case 'N': return 0.23;
    case 'S': return 0.28;
    case 'P': return 0.27;
    default: return 0.24;
  }
}

async function fetchSdf(cid: number | undefined, drugName: string, signal: AbortSignal) {
  const idPath = cid ? `cid/${cid}` : `name/${encodeURIComponent(drugName)}`;
  const url3d = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/${idPath}/record/SDF?record_type=3d`;
  const first = await fetch(url3d, { signal });
  if (first.ok) return first.text();
  const url2d = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/${idPath}/record/SDF?record_type=2d`;
  const second = await fetch(url2d, { signal });
  if (!second.ok) throw new Error(`PubChem SDF ${second.status}`);
  return second.text();
}

export default function MedicationHologram3D({ cid, drugName, onStatus }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let frame = 0;
    const controller = new AbortController();
    onStatus?.('loading');

    const boot = async () => {
      try {
        const [THREE, sdfText] = await Promise.all([
          remoteImport(THREE_URL),
          fetchSdf(cid, drugName, controller.signal),
        ]);
        if (disposed) return;

        const molecule = parseSdf(sdfText);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.className = 'med-hologram-three-canvas';
        renderer.domElement.setAttribute('aria-hidden', 'true');
        host.replaceChildren(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
        camera.position.set(0, 0, 7.4);
        camera.lookAt(0, 0, 0);

        const root = new THREE.Group();
        scene.add(root);

        const positions = molecule.atoms.map(atom => new THREE.Vector3(atom.x, atom.y, atom.z));
        const box = new THREE.Box3().setFromPoints(positions);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z, 0.1);
        const scale = 3.25 / maxDimension;

        root.position.set(0, 0, 0);

        const holoMaterial = createAndersonManciniHolographicMaterial(THREE, {
          hologramColor: '#43e9ff',
          fresnelAmount: 0.56,
          fresnelOpacity: 1,
          scanlineSize: 7.5,
          hologramBrightness: 1.42,
          signalSpeed: 0.48,
          hologramOpacity: 0.68,
          enableBlinking: true,
          blinkFresnelOnly: true,
          depthTest: false,
        });

        const atomGeometry = new THREE.SphereGeometry(1, 24, 18);
        molecule.atoms.forEach((atom, index) => {
          const p = positions[index].clone().sub(center).multiplyScalar(scale);
          const radius = atomRadius(atom.element);

          const shell = new THREE.Mesh(atomGeometry, holoMaterial);
          shell.position.copy(p);
          shell.scale.setScalar(radius * 1.35);
          shell.renderOrder = 3;
          root.add(shell);

          const coreMaterial = new THREE.MeshBasicMaterial({
            color: elementColor(atom.element),
            transparent: true,
            opacity: atom.element.toUpperCase() === 'C' ? 0.22 : 0.78,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          const core = new THREE.Mesh(atomGeometry, coreMaterial);
          core.position.copy(p);
          core.scale.setScalar(radius * 0.67);
          core.renderOrder = 2;
          root.add(core);
        });

        const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true);
        const up = new THREE.Vector3(0, 1, 0);
        molecule.bonds.forEach((bond) => {
          const a = positions[bond.a].clone().sub(center).multiplyScalar(scale);
          const b = positions[bond.b].clone().sub(center).multiplyScalar(scale);
          const delta = b.clone().sub(a);
          const length = delta.length();
          if (length <= 0.001) return;
          const bondMesh = new THREE.Mesh(cylinderGeometry, holoMaterial);
          bondMesh.position.copy(a.clone().add(b).multiplyScalar(0.5));
          bondMesh.quaternion.setFromUnitVectors(up, delta.clone().normalize());
          const width = 0.045 + Math.min(bond.order, 3) * 0.012;
          bondMesh.scale.set(width, length, width);
          bondMesh.renderOrder = 1;
          root.add(bondMesh);
        });

        const ringMaterial = new THREE.MeshBasicMaterial({
          color: '#4be8ff', transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
        });
        [1.75, 2.05, 2.38].forEach((radius, index) => {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.008 + index * 0.004, 8, 120), ringMaterial.clone());
          ring.rotation.x = index === 1 ? Math.PI / 2.7 : Math.PI / 2;
          ring.rotation.y = index === 2 ? Math.PI / 3.2 : 0;
          root.add(ring);
        });

        const resize = () => {
          const rect = host.getBoundingClientRect();
          const width = Math.max(1, rect.width);
          const height = Math.max(1, rect.height);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        resize();

        let targetX = 0.15;
        let targetY = -0.22;
        const onPointerMove = (event: PointerEvent) => {
          const rect = host.getBoundingClientRect();
          targetY = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 0.8;
          targetX = ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 0.34;
        };
        host.addEventListener('pointermove', onPointerMove);

        const animate = () => {
          if (disposed) return;
          frame = requestAnimationFrame(animate);
          (holoMaterial as any).updateHologram?.();
          root.rotation.y += 0.0028;
          root.rotation.x += (targetX - root.rotation.x) * 0.035;
          root.rotation.y += (targetY - root.rotation.y) * 0.012;
          renderer.render(scene, camera);
        };
        animate();
        onStatus?.('ready');

        const cleanup = () => {
          resizeObserver.disconnect();
          host.removeEventListener('pointermove', onPointerMove);
          cancelAnimationFrame(frame);
          atomGeometry.dispose();
          cylinderGeometry.dispose();
          holoMaterial.dispose();
          ringMaterial.dispose();
          renderer.dispose();
          if (renderer.domElement.parentElement === host) renderer.domElement.remove();
        };
        (host as any).__medHologramCleanup = cleanup;
      } catch (error) {
        if (!disposed && !controller.signal.aborted) {
          console.warn('3D medication hologram unavailable', error);
          onStatus?.('error');
        }
      }
    };

    void boot();
    return () => {
      disposed = true;
      controller.abort();
      cancelAnimationFrame(frame);
      const cleanup = (host as any).__medHologramCleanup;
      if (typeof cleanup === 'function') cleanup();
      delete (host as any).__medHologramCleanup;
    };
  }, [cid, drugName, onStatus]);

  return <div ref={hostRef} className="med-hologram-three-host" data-testid="medication-hologram-3d" />;
}
