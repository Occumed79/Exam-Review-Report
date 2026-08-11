import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Globe2, MapPin, Search, ShieldCheck, Stethoscope, Thermometer } from 'lucide-react';
import { AOR_PROFILE_BY_ISO, AOR_PROFILES, type AorCountryProfile } from '../data/aorProfiles';
import './deployment-reference.css';

declare global {
  interface Window {
    maptilersdk?: any;
  }
}

const MAPTILER_VERSION = '4.0.2';
const MAPTILER_SCRIPT = `https://cdn.maptiler.com/maptiler-sdk-js/v${MAPTILER_VERSION}/maptiler-sdk.umd.min.js`;
const MAPTILER_CSS = `https://cdn.maptiler.com/maptiler-sdk-js/v${MAPTILER_VERSION}/maptiler-sdk.css`;
const MAP_SOURCE_URL = 'https://api.maptiler.com/tiles/countries/tiles.json';

const CURRENT_SOURCES = [
  { name: 'CDC Travelers’ Health', url: 'https://wwwnc.cdc.gov/travel/destinations/list' },
  { name: 'U.S. State Department Travel Advisories', url: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html/' },
];

const emptyIsoFilter = ['all', ['==', ['get', 'level'], 0], ['==', ['get', 'iso_a2'], '__NONE__']];
const isoFilter = (iso2: string) => ['all', ['==', ['get', 'level'], 0], ['==', ['get', 'iso_a2'], iso2]];

function loadMapTilerSdk() {
  if (window.maptilersdk) return Promise.resolve(window.maptilersdk);

  if (!document.querySelector(`link[href="${MAPTILER_CSS}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = MAPTILER_CSS;
    document.head.appendChild(link);
  }

  return new Promise<any>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-maptiler-sdk="true"]');
    const finish = () => window.maptilersdk ? resolve(window.maptilersdk) : reject(new Error('MapTiler SDK did not initialize.'));

    if (existing) {
      if (window.maptilersdk) finish();
      else {
        existing.addEventListener('load', finish, { once: true });
        existing.addEventListener('error', () => reject(new Error('Unable to load MapTiler SDK.')), { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = MAPTILER_SCRIPT;
    script.async = true;
    script.dataset.maptilerSdk = 'true';
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', () => reject(new Error('Unable to load MapTiler SDK.')), { once: true });
    document.head.appendChild(script);
  });
}

export default function DeploymentReferenceV2() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [query, setQuery] = useState('');
  const [selectedIso, setSelectedIso] = useState('KW');
  const [hoveredIso, setHoveredIso] = useState<string | null>(null);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [mapError, setMapError] = useState('');

  const selected = AOR_PROFILE_BY_ISO.get(selectedIso) ?? AOR_PROFILES[0];
  const hovered = hoveredIso ? AOR_PROFILE_BY_ISO.get(hoveredIso) : undefined;

  const matches = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];
    return AOR_PROFILES
      .filter((profile) => `${profile.name} ${profile.region} ${profile.iso2}`.toLowerCase().includes(clean))
      .slice(0, 9);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      try {
        if (!mapContainerRef.current) return;
        const configResponse = await fetch('/api/map-config', { cache: 'no-store' });
        const config = await configResponse.json().catch(() => ({ configured: false, apiKey: '' }));
        if (!configResponse.ok || !config?.configured || !config?.apiKey) {
          throw new Error('MAP_TILER_API_KEY is not configured on the Render web service.');
        }

        const sdk = await loadMapTilerSdk();
        if (cancelled || !mapContainerRef.current) return;

        sdk.config.apiKey = config.apiKey;
        const map = new sdk.Map({
          container: mapContainerRef.current,
          style: sdk.MapStyle.STREETS,
          center: [8, 18],
          zoom: 1.35,
          minZoom: 1,
          maxZoom: 8,
          attributionControl: true,
        });
        mapRef.current = map;
        map.addControl(new sdk.NavigationControl({ showCompass: false }), 'bottom-right');

        map.on('load', () => {
          if (cancelled) return;
          map.addSource('aor-countries', { type: 'vector', url: MAP_SOURCE_URL });

          const firstSymbol = map.getStyle()?.layers?.find((layer: any) => layer.type === 'symbol')?.id;
          const before = firstSymbol || undefined;

          // Transparent hit area keeps the whole country clickable without recoloring the basemap.
          map.addLayer({
            id: 'aor-country-hit',
            type: 'fill',
            source: 'aor-countries',
            'source-layer': 'administrative',
            filter: ['==', ['get', 'level'], 0],
            paint: {
              'fill-color': '#ffffff',
              'fill-opacity': 0.001,
            },
          }, before);

          // Hover is border-only and intentionally subtle.
          map.addLayer({
            id: 'aor-country-hover-line',
            type: 'line',
            source: 'aor-countries',
            'source-layer': 'administrative',
            filter: emptyIsoFilter,
            paint: {
              'line-color': '#52b7cc',
              'line-width': 1.4,
              'line-opacity': 0.58,
            },
          }, before);

          // Soft outer glow makes the selected country border feel illuminated without filling it.
          map.addLayer({
            id: 'aor-country-selected-glow',
            type: 'line',
            source: 'aor-countries',
            'source-layer': 'administrative',
            filter: isoFilter(selectedIso),
            paint: {
              'line-color': '#6ee7ff',
              'line-width': 7,
              'line-opacity': 0.34,
              'line-blur': 3.5,
            },
          }, before);

          map.addLayer({
            id: 'aor-country-selected-line',
            type: 'line',
            source: 'aor-countries',
            'source-layer': 'administrative',
            filter: isoFilter(selectedIso),
            paint: {
              'line-color': '#bdf7ff',
              'line-width': 2.6,
              'line-opacity': 1,
            },
          }, before);

          map.on('mousemove', 'aor-country-hit', (event: any) => {
            map.getCanvas().style.cursor = 'pointer';
            const iso2 = event.features?.[0]?.properties?.iso_a2;
            if (!iso2 || !AOR_PROFILE_BY_ISO.has(iso2)) return;
            setHoveredIso(iso2);
            map.setFilter('aor-country-hover-line', isoFilter(iso2));
          });

          map.on('mouseleave', 'aor-country-hit', () => {
            map.getCanvas().style.cursor = '';
            setHoveredIso(null);
            map.setFilter('aor-country-hover-line', emptyIsoFilter);
          });

          map.on('click', 'aor-country-hit', (event: any) => {
            const iso2 = event.features?.[0]?.properties?.iso_a2;
            if (!iso2 || !AOR_PROFILE_BY_ISO.has(iso2)) return;
            setSelectedIso(iso2);
          });

          setMapStatus('ready');
        });

        map.on('error', (event: any) => {
          if (event?.error?.message && !cancelled) setMapError(event.error.message);
        });
      } catch (error) {
        if (cancelled) return;
        setMapStatus('error');
        setMapError(error instanceof Error ? error.message : 'Unable to initialize the AOR map.');
      }
    }

    void initializeMap();
    return () => {
      cancelled = true;
      mapRef.current?.remove?.();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapStatus !== 'ready' || !mapRef.current) return;
    const selectedFilter = isoFilter(selectedIso);
    if (mapRef.current.getLayer?.('aor-country-selected-glow')) {
      mapRef.current.setFilter('aor-country-selected-glow', selectedFilter);
    }
    if (mapRef.current.getLayer?.('aor-country-selected-line')) {
      mapRef.current.setFilter('aor-country-selected-line', selectedFilter);
    }
  }, [selectedIso, mapStatus]);

  function chooseCountry(profile: AorCountryProfile) {
    setSelectedIso(profile.iso2);
    setQuery('');
    setHoveredIso(null);
    if (mapRef.current?.getLayer?.('aor-country-hover-line')) {
      mapRef.current.setFilter('aor-country-hover-line', emptyIsoFilter);
    }
  }

  return (
    <div className="deployment-workbench" data-testid="deployment-reference">
      <header className="deployment-header">
        <div>
          <div className="deployment-kicker">GLOBAL AOR / DEPLOYMENT INTELLIGENCE</div>
          <h1>Area of Responsibility</h1>
          <p>Interactive country reference for deployment review. Select any country on the map to open its climate, medical-access, security, travel-health, escalation, and watch-item profile.</p>
        </div>
        <div className="deployment-static">
          <Globe2 size={15} />
          <div><strong>{AOR_PROFILES.length} country profiles</strong><small>MapTiler live geography</small></div>
        </div>
      </header>

      <div className="deployment-toolbar">
        <div className="deployment-search-wrap">
          <div className="deployment-search liquid-glass">
            <Search size={14} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a country or region…" />
          </div>
          {query.trim() && (
            <div className="deployment-search-results liquid-glass">
              {matches.length > 0 ? matches.map((profile) => (
                <button key={profile.iso2} onClick={() => chooseCountry(profile)}>
                  <span><strong>{profile.name}</strong><small>{profile.region} · {profile.iso2}</small></span>
                </button>
              )) : <div className="deployment-empty">No matching country profile.</div>}
            </div>
          )}
        </div>
        <div className="deployment-source-links">
          {CURRENT_SOURCES.map((source) => <a key={source.name} href={source.url} target="_blank" rel="noreferrer">{source.name}<ExternalLink size={9} /></a>)}
        </div>
      </div>

      <div className="deployment-map-layout">
        <section className="deployment-map-card liquid-glass">
          <div ref={mapContainerRef} className="deployment-map-canvas" />
          <div className="deployment-map-overlay deployment-map-legend">
            <div><strong>{hovered?.name ?? selected.name}</strong><small>{hovered ? 'Click to select country' : 'Selected country'}</small></div>
          </div>
          <div className="deployment-map-overlay deployment-map-hint">Click a country to illuminate its border</div>
          {mapStatus === 'loading' && <div className="deployment-map-state"><Globe2 size={24} /><strong>Loading world map…</strong></div>}
          {mapStatus === 'error' && <div className="deployment-map-state error"><ShieldCheck size={24} /><strong>Map connection needed</strong><span>{mapError}</span></div>}
        </section>

        <main className="deployment-detail liquid-glass">
          <div className="deployment-title">
            <div>
              <span>REFERENCE PROFILE · {selected.iso2}</span>
              <h2>{selected.name}</h2>
              <p>{selected.region} · Medical access: {selected.medicalTier}</p>
            </div>
          </div>

          <div className="deployment-facts">
            <Fact icon={Thermometer} label="Climate / environment" value={selected.climate} />
            <Fact icon={Stethoscope} label="Medical access" value={selected.medical} />
            <Fact icon={ShieldCheck} label="Security / access" value={selected.security} />
            <Fact icon={Globe2} label="Travel-health context" value={selected.disease} />
            <Fact icon={MapPin} label="Escalation / evacuation" value={selected.evacuation} />
          </div>

          <section className="deployment-watch">
            <span>REVIEW WATCH ITEMS</span>
            <div>{selected.watchItems.map((item) => <span key={item}>{item}</span>)}</div>
          </section>
          <div className="deployment-warning">Fast reviewer reference only. When location materially affects a case, confirm current government, client, and site-specific guidance before making a deployment determination.</div>
        </main>
      </div>
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Globe2; label: string; value: string }) {
  return <div className="deployment-fact"><Icon size={14} /><div><span>{label}</span><p>{value}</p></div></div>;
}
