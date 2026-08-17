import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ExternalLink,
  Globe2,
  HeartPulse,
  Layers3,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Waves,
} from "lucide-react";
import {
  COMBATANT_COMMANDS,
  COMBATANT_COMMAND_BY_COUNTRY,
  type CombatantCommand,
} from "../data/combatantCommands";
import {
  fetchAorPublicIntelligence,
  type AorPublicIntelligenceResponse,
  type GdacsEventItem,
  type UsgsEarthquakeItem,
  type WhoOutbreakItem,
} from "../lib/intelligenceApi";
import "./aor-intelligence.css";
import "./aor-public-intelligence.css";

declare global {
  interface Window {
    maptilersdk?: any;
  }
}

const MAPTILER_VERSION = "4.0.2";
const MAPTILER_SCRIPT = `https://cdn.maptiler.com/maptiler-sdk-js/v${MAPTILER_VERSION}/maptiler-sdk.umd.min.js`;
const MAPTILER_CSS = `https://cdn.maptiler.com/maptiler-sdk-js/v${MAPTILER_VERSION}/maptiler-sdk.css`;
const COUNTRY_SOURCE = "https://api.maptiler.com/tiles/countries/tiles.json";

const COMMAND_COLORS: Record<string, string> = {
  northcom: "#4f9aaa",
  southcom: "#4f927f",
  eucom: "#7485a5",
  africom: "#8d8068",
  centcom: "#a97567",
  indopacom: "#6577a8",
};

const allCountriesFilter = ["==", ["get", "level"], 0];
const countryFilter = (iso2s: string[]) => [
  "all",
  allCountriesFilter,
  ["in", ["get", "iso_a2"], ["literal", iso2s]],
];

type SourceState = {
  state: "loading" | "ready" | "error";
  data: AorPublicIntelligenceResponse | null;
  error?: string;
};

type TimelineItem = {
  id: string;
  title: string;
  source: string;
  provider: string;
  date: string;
  url: string;
  kind: "outbreak" | "disaster" | "earthquake";
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The live source could not be reached.";
}

function displayDate(value: string) {
  if (!value) return "Date not supplied";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function loadMapTilerSdk() {
  if (window.maptilersdk) return Promise.resolve(window.maptilersdk);

  if (!document.querySelector(`link[href="${MAPTILER_CSS}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = MAPTILER_CSS;
    document.head.appendChild(link);
  }

  return new Promise<any>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-maptiler-sdk="true"]');
    const finish = () =>
      window.maptilersdk
        ? resolve(window.maptilersdk)
        : reject(new Error("MapTiler SDK did not initialize."));

    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load MapTiler SDK.")), { once: true });
      if (window.maptilersdk) finish();
      return;
    }

    const script = document.createElement("script");
    script.src = MAPTILER_SCRIPT;
    script.async = true;
    script.dataset.maptilerSdk = "true";
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => reject(new Error("Unable to load MapTiler SDK.")), { once: true });
    document.head.appendChild(script);
  });
}

export default function AORPublicIntelligence() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">("loading");
  const [mapError, setMapError] = useState("");
  const [selected, setSelected] = useState<CombatantCommand>(COMBATANT_COMMANDS[4]);
  const [query, setQuery] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [sources, setSources] = useState<SourceState>({ state: "loading", data: null });

  const matches = useMemo(() => {
    const clean = query.toLowerCase().trim();
    return clean
      ? COMBATANT_COMMANDS.filter((command) =>
          `${command.name} ${command.abbreviation} ${(command.aliases ?? []).join(" ")} ${command.countriesAreas.join(" ")}`
            .toLowerCase()
            .includes(clean),
        )
      : [];
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      try {
        if (!mapContainerRef.current) return;
        const configResponse = await fetch("/api/map-config", { cache: "no-store" });
        const config = await configResponse.json().catch(() => ({ configured: false, apiKey: "" }));
        if (!configResponse.ok || !config?.configured || !config?.apiKey) {
          throw new Error("MapTiler is not configured on the web service.");
        }

        const sdk = await loadMapTilerSdk();
        if (cancelled || !mapContainerRef.current) return;
        sdk.config.apiKey = config.apiKey;
        const darkStyle = sdk.MapStyle?.DATAVIZ?.DARK ?? sdk.MapStyle?.STREETS?.DARK ?? sdk.MapStyle.STREETS;
        const map = new sdk.Map({
          container: mapContainerRef.current,
          style: darkStyle,
          center: [18, 18],
          zoom: 1.05,
          minZoom: 0.75,
          maxZoom: 7,
          attributionControl: true,
        });
        mapRef.current = map;
        map.addControl(new sdk.NavigationControl({ showCompass: false }), "bottom-right");

        map.on("load", () => {
          if (cancelled) return;
          map.addSource("aor-countries", { type: "vector", url: COUNTRY_SOURCE });
          const firstSymbol = map.getStyle()?.layers?.find((layer: any) => layer.type === "symbol")?.id;
          const before = firstSymbol || undefined;

          COMBATANT_COMMANDS.forEach((command) => {
            map.addLayer(
              {
                id: `aor-fill-${command.id}`,
                type: "fill",
                source: "aor-countries",
                "source-layer": "administrative",
                filter: countryFilter(command.countryIso2),
                paint: { "fill-color": COMMAND_COLORS[command.id], "fill-opacity": 0.18 },
              },
              before,
            );
            map.addLayer(
              {
                id: `aor-line-${command.id}`,
                type: "line",
                source: "aor-countries",
                "source-layer": "administrative",
                filter: countryFilter(command.countryIso2),
                paint: { "line-color": COMMAND_COLORS[command.id], "line-width": 0.9, "line-opacity": 0.6 },
              },
              before,
            );
          });

          map.addLayer(
            {
              id: "aor-country-hit",
              type: "fill",
              source: "aor-countries",
              "source-layer": "administrative",
              filter: allCountriesFilter,
              paint: { "fill-color": "#ffffff", "fill-opacity": 0.001 },
            },
            before,
          );
          map.addLayer(
            {
              id: "aor-selected-glow",
              type: "line",
              source: "aor-countries",
              "source-layer": "administrative",
              filter: countryFilter(selected.countryIso2),
              paint: { "line-color": "#70e7ff", "line-width": 6, "line-opacity": 0.22, "line-blur": 3 },
            },
            before,
          );
          map.addLayer(
            {
              id: "aor-selected-line",
              type: "line",
              source: "aor-countries",
              "source-layer": "administrative",
              filter: countryFilter(selected.countryIso2),
              paint: { "line-color": "#b8f4ff", "line-width": 2, "line-opacity": 0.95 },
            },
            before,
          );

          map.on("mousemove", "aor-country-hit", (event: any) => {
            const iso2 = event.features?.[0]?.properties?.iso_a2;
            map.getCanvas().style.cursor = COMBATANT_COMMAND_BY_COUNTRY.has(iso2) ? "pointer" : "";
          });
          map.on("mouseleave", "aor-country-hit", () => {
            map.getCanvas().style.cursor = "";
          });
          map.on("click", "aor-country-hit", (event: any) => {
            const iso2 = event.features?.[0]?.properties?.iso_a2;
            const command = COMBATANT_COMMAND_BY_COUNTRY.get(iso2);
            if (command) setSelected(command);
          });
          setMapStatus("ready");
        });
        map.on("error", (event: any) => {
          if (!cancelled && event?.error?.message) setMapError(event.error.message);
        });
      } catch (error) {
        if (cancelled) return;
        setMapStatus("error");
        setMapError(errorMessage(error));
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
    if (mapStatus !== "ready" || !mapRef.current) return;
    const filter = countryFilter(selected.countryIso2);
    if (mapRef.current.getLayer?.("aor-selected-glow")) mapRef.current.setFilter("aor-selected-glow", filter);
    if (mapRef.current.getLayer?.("aor-selected-line")) mapRef.current.setFilter("aor-selected-line", filter);
    mapRef.current.easeTo?.({ center: selected.mapView.center, zoom: selected.mapView.zoom, duration: 650 });
  }, [selected, mapStatus]);

  useEffect(() => {
    const controller = new AbortController();
    setSources({ state: "loading", data: null });
    fetchAorPublicIntelligence(selected.id, 12, controller.signal)
      .then((data) => setSources({ state: "ready", data }))
      .catch((error) => {
        if (controller.signal.aborted) return;
        setSources({ state: "error", data: null, error: errorMessage(error) });
      });
    return () => controller.abort();
  }, [selected.id, refresh]);

  const outbreaks = sources.data?.outbreaks ?? [];
  const disasters = sources.data?.disasters ?? [];
  const earthquakes = sources.data?.earthquakes ?? [];
  const sourceHealth = sources.data?.sourceHealth ?? [];

  const timeline = useMemo<TimelineItem[]>(() => {
    const values: TimelineItem[] = [
      ...outbreaks.map((item) => ({
        id: `who-${item.id}`,
        title: item.title,
        source: item.matchedArea || "WHO",
        provider: item.provider,
        date: item.publishedAt,
        url: item.url,
        kind: "outbreak" as const,
      })),
      ...disasters.map((item) => ({
        id: `gdacs-${item.id}`,
        title: item.alertLevel ? `${item.alertLevel.toUpperCase()} · ${item.title}` : item.title,
        source: item.country || item.eventType,
        provider: item.provider,
        date: item.fromDate || item.toDate,
        url: item.url,
        kind: "disaster" as const,
      })),
      ...earthquakes.map((item) => ({
        id: `usgs-${item.id}`,
        title: `${item.magnitude === null ? "M?" : `M${item.magnitude.toFixed(1)}`} · ${item.place || item.title}`,
        source: item.place || "USGS",
        provider: item.provider,
        date: item.occurredAt,
        url: item.url,
        kind: "earthquake" as const,
      })),
    ];
    return values.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 24);
  }, [outbreaks, disasters, earthquakes]);

  const degraded = sourceHealth.some((provider) => !provider.ok);

  function choose(command: CombatantCommand) {
    setSelected(command);
    setQuery("");
  }

  return (
    <div className="aor-command aor-public-command" data-testid="aor-intelligence">
      <div className="aor-source-ribbon" aria-label="AOR live source coverage">
        <span><HeartPulse size={13} /> WHO Disease Outbreak News</span>
        <span><ShieldAlert size={13} /> GDACS disasters</span>
        <span><Waves size={13} /> USGS earthquakes</span>
        <strong className={sources.state === "loading" ? "loading" : degraded ? "degraded" : "live"}>
          <i /> {sources.state === "loading" ? "Refreshing" : degraded ? "Partial source coverage" : "Public sources live"}
        </strong>
      </div>

      <section className="aor-command-grid">
        <div className="aor-map-surface">
          <div className="aor-map-toolbar liquid-glass">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search combatant commands"
              placeholder="Search command, region, or area…"
            />
            <kbd>6 GCCs</kbd>
            {matches.length > 0 && (
              <div className="aor-search-results">
                {matches.map((command) => (
                  <button key={command.id} onClick={() => choose(command)}>
                    <strong>{command.abbreviation}</strong>
                    <span>{command.geographicScope}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="aor-world" aria-label="Geographic combatant command map">
            <div ref={mapContainerRef} className="aor-map-canvas" />
            {mapStatus !== "ready" && (
              <div className={`aor-map-state ${mapStatus === "error" ? "error" : ""}`}>
                {mapStatus === "loading" ? <LoaderCircle /> : <AlertTriangle />}
                <strong>{mapStatus === "loading" ? "Loading geographic command map" : "Geographic map unavailable"}</strong>
                {mapError && <span>{mapError}</span>}
              </div>
            )}
            <div className="aor-map-legend">
              {COMBATANT_COMMANDS.map((command) => (
                <button
                  key={command.id}
                  className={selected.id === command.id ? "active" : ""}
                  onClick={() => choose(command)}
                >
                  <i style={{ background: COMMAND_COLORS[command.id] }} />
                  {command.abbreviation}
                </button>
              ))}
            </div>
          </div>

          <div className="aor-command-switcher">
            {COMBATANT_COMMANDS.map((command) => (
              <button
                className={selected.id === command.id ? "active" : ""}
                key={command.id}
                onClick={() => choose(command)}
              >
                {command.abbreviation}
              </button>
            ))}
          </div>
          <footer>
            <span><Layers3 size={14} /> Public country-coverage orientation</span>
            <span>Selected: {selected.abbreviation}</span>
            <button onClick={() => setRefresh((value) => value + 1)}>
              <RefreshCw size={13} /> Refresh
            </button>
          </footer>
        </div>

        <aside className="aor-inspector">
          <div className="inspector-head">
            <div>
              <span>COMMAND INSPECTOR</span>
              <h2>{selected.abbreviation}</h2>
            </div>
            <Activity size={19} />
          </div>

          <section className="inspector-card overview aor-scope-card">
            <h3><Globe2 /> Command Scope</h3>
            <strong>{selected.name}</strong>
            <p>{selected.geographicScope}</p>
            <dl>
              <div><dt><MapPin /> Headquarters</dt><dd>{selected.headquarters}</dd></div>
            </dl>
            <a href={selected.source.url} target="_blank" rel="noreferrer">
              {selected.source.label}<ExternalLink size={12} />
            </a>
          </section>

          {sources.state === "error" ? (
            <section className="inspector-card">
              <div className="source-error">
                <AlertTriangle />
                <span><strong>Public AOR sources unavailable</strong>{sources.error}</span>
              </div>
            </section>
          ) : null}

          <SignalSection icon={<HeartPulse />} title="WHO Disease Outbreaks" loading={sources.state === "loading"} warning={sourceWarning(sourceHealth, "WHO Disease Outbreak News")}>
            {outbreaks.length ? (
              <div className="source-list">
                {outbreaks.map((item) => <WhoOutbreakRow key={item.id} item={item} />)}
              </div>
            ) : (
              <Empty text="No recent WHO Disease Outbreak News item matched this command's countries." />
            )}
          </SignalSection>

          <SignalSection icon={<ShieldAlert />} title="GDACS Natural Hazards" loading={sources.state === "loading"} warning={sourceWarning(sourceHealth, "GDACS")}>
            {disasters.length ? (
              <div className="source-list">
                {disasters.map((item) => <GdacsRow key={item.id} item={item} />)}
              </div>
            ) : (
              <Empty text="No current GDACS disaster event matched this command area." />
            )}
          </SignalSection>

          <SignalSection icon={<Waves />} title="USGS Seismic Activity" loading={sources.state === "loading"} warning={sourceWarning(sourceHealth, "USGS Earthquake Catalog")}>
            {earthquakes.length ? (
              <div className="source-list">
                {earthquakes.map((item) => <EarthquakeRow key={item.id} item={item} />)}
              </div>
            ) : (
              <Empty text="No magnitude 4.0+ earthquake in the last 30 days matched this command area." />
            )}
          </SignalSection>

          <section className="inspector-card">
            <h3><Activity /> Recent Source Timeline</h3>
            {timeline.length ? (
              <div className="timeline">
                {timeline.map((item) => <SourceRow key={`${item.kind}-${item.id}`} {...item} />)}
              </div>
            ) : sources.state === "loading" ? (
              <Loading />
            ) : (
              <Empty text="No current WHO, GDACS, or USGS records matched this command." />
            )}
          </section>
        </aside>
      </section>
    </div>
  );
}

function sourceWarning(health: AorPublicIntelligenceResponse["sourceHealth"], provider: string) {
  const item = health.find((entry) => entry.provider === provider);
  return item && !item.ok ? item.error || `${provider} unavailable.` : "";
}

function SignalSection({ icon, title, loading, warning, children }: {
  icon: ReactNode;
  title: string;
  loading: boolean;
  warning?: string;
  children: ReactNode;
}) {
  return (
    <section className="inspector-card">
      <h3>{icon}{title}</h3>
      {warning ? <div className="provider-warning"><AlertTriangle />{warning}</div> : null}
      {loading ? <Loading /> : children}
    </section>
  );
}

function WhoOutbreakRow({ item }: { item: WhoOutbreakItem }) {
  return (
    <a className="source-row" href={item.url} target="_blank" rel="noreferrer">
      <span className="source-row-title">{item.title}<ExternalLink size={12} /></span>
      {item.summary ? <span className="aor-source-summary">{item.summary}</span> : null}
      <span className="source-row-meta">
        <b>{item.matchedArea || "WHO"}</b><i>{item.provider}</i><time dateTime={item.publishedAt}>{displayDate(item.publishedAt)}</time>
      </span>
    </a>
  );
}

function GdacsRow({ item }: { item: GdacsEventItem }) {
  const title = item.alertLevel ? `${item.alertLevel.toUpperCase()} · ${item.title}` : item.title;
  return <SourceRow title={title} source={item.country || item.eventType} provider={item.provider} date={item.fromDate || item.toDate} url={item.url} />;
}

function EarthquakeRow({ item }: { item: UsgsEarthquakeItem }) {
  const magnitude = item.magnitude === null ? "M?" : `M${item.magnitude.toFixed(1)}`;
  const details = [item.depthKm === null ? "" : `${item.depthKm.toFixed(1)} km deep`, item.tsunami ? "tsunami flag" : ""].filter(Boolean).join(" · ");
  return (
    <a className="source-row" href={item.url} target="_blank" rel="noreferrer">
      <span className="source-row-title">{magnitude} · {item.place || item.title}<ExternalLink size={12} /></span>
      {details ? <span className="aor-source-summary">{details}</span> : null}
      <span className="source-row-meta"><b>USGS</b><i>{item.provider}</i><time dateTime={item.occurredAt}>{displayDate(item.occurredAt)}</time></span>
    </a>
  );
}

function SourceRow({ title, source, provider, date, url }: Pick<TimelineItem, "title" | "source" | "provider" | "date" | "url">) {
  return (
    <a className="source-row" href={url} target="_blank" rel="noreferrer">
      <span className="source-row-title">{title}<ExternalLink size={12} /></span>
      <span className="source-row-meta"><b>{source}</b><i>{provider}</i><time dateTime={date}>{displayDate(date)}</time></span>
    </a>
  );
}

function Loading() {
  return <div className="source-loading"><LoaderCircle className="animate-spin" /> Loading live source records…</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="source-empty">{text}</div>;
}
