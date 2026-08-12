import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Building2,
  ExternalLink,
  Globe2,
  HeartPulse,
  Layers3,
  LoaderCircle,
  MapPin,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import {
  COMBATANT_COMMANDS,
  COMBATANT_COMMAND_BY_COUNTRY,
  type CombatantCommand,
} from "../data/combatantCommands";
import {
  fetchWhoIndicators,
  searchCongressIntelligence,
  searchNewsIntelligence,
  searchRegulatoryIntelligence,
  type IntelligenceNewsItem,
  type WhoIndicator,
} from "../lib/intelligenceApi";
import "./aor-intelligence.css";

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

type Loadable<T> = {
  state: "loading" | "ready" | "error";
  data: T;
  error?: string;
};
type PolicyItem = {
  title?: string;
  url?: string;
  updateDate?: string;
  postedDate?: string;
  latestActionDate?: string;
  latestAction?: string;
  agencyId?: string;
  number?: string;
  type?: string;
};
type TimelineItem = {
  id: string;
  title: string;
  source: string;
  provider: string;
  date: string;
  url: string;
  kind: "news" | "legislation" | "regulation";
};

const empty = <T,>(data: T): Loadable<T> => ({ state: "loading", data });
const allCountriesFilter = ["==", ["get", "level"], 0];
const countryFilter = (iso2s: string[]) => [
  "all",
  allCountriesFilter,
  ["in", ["get", "iso_a2"], ["literal", iso2s]],
];

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The live source could not be reached.";
}
function displayDate(value: string) {
  if (!value) return "Date not supplied";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}
function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
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
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-maptiler-sdk="true"]',
    );
    const finish = () =>
      window.maptilersdk
        ? resolve(window.maptilersdk)
        : reject(new Error("MapTiler SDK did not initialize."));

    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Unable to load MapTiler SDK.")),
        { once: true },
      );
      if (window.maptilersdk) finish();
      return;
    }

    const script = document.createElement("script");
    script.src = MAPTILER_SCRIPT;
    script.async = true;
    script.dataset.maptilerSdk = "true";
    script.addEventListener("load", finish, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Unable to load MapTiler SDK.")),
      { once: true },
    );
    document.head.appendChild(script);
  });
}

export default function AORIntelligence() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [mapError, setMapError] = useState("");
  const [selected, setSelected] = useState<CombatantCommand>(
    COMBATANT_COMMANDS[4],
  );
  const [query, setQuery] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [news, setNews] = useState<Loadable<IntelligenceNewsItem[]>>(empty([]));
  const [health, setHealth] = useState<Loadable<WhoIndicator[]>>(empty([]));
  const [congress, setCongress] = useState<Loadable<PolicyItem[]>>(empty([]));
  const [regulations, setRegulations] = useState<Loadable<PolicyItem[]>>(
    empty([]),
  );
  const [partialNews, setPartialNews] = useState<string[]>([]);

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
        const config = await configResponse
          .json()
          .catch(() => ({ configured: false, apiKey: "" }));
        if (!configResponse.ok || !config?.configured || !config?.apiKey) {
          throw new Error("MapTiler is not configured on the web service.");
        }

        const sdk = await loadMapTilerSdk();
        if (cancelled || !mapContainerRef.current) return;
        sdk.config.apiKey = config.apiKey;
        const darkStyle =
          sdk.MapStyle?.DATAVIZ?.DARK ??
          sdk.MapStyle?.STREETS?.DARK ??
          sdk.MapStyle.STREETS;
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
        map.addControl(
          new sdk.NavigationControl({ showCompass: false }),
          "bottom-right",
        );

        map.on("load", () => {
          if (cancelled) return;
          map.addSource("aor-countries", { type: "vector", url: COUNTRY_SOURCE });
          const firstSymbol = map
            .getStyle()
            ?.layers?.find((layer: any) => layer.type === "symbol")?.id;
          const before = firstSymbol || undefined;

          COMBATANT_COMMANDS.forEach((command) => {
            map.addLayer(
              {
                id: `aor-fill-${command.id}`,
                type: "fill",
                source: "aor-countries",
                "source-layer": "administrative",
                filter: countryFilter(command.countryIso2),
                paint: {
                  "fill-color": COMMAND_COLORS[command.id],
                  "fill-opacity": 0.18,
                },
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
                paint: {
                  "line-color": COMMAND_COLORS[command.id],
                  "line-width": 0.9,
                  "line-opacity": 0.6,
                },
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
              paint: {
                "line-color": "#70e7ff",
                "line-width": 6,
                "line-opacity": 0.22,
                "line-blur": 3,
              },
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
              paint: {
                "line-color": "#b8f4ff",
                "line-width": 2,
                "line-opacity": 0.95,
              },
            },
            before,
          );

          map.on("mousemove", "aor-country-hit", (event: any) => {
            const iso2 = event.features?.[0]?.properties?.iso_a2;
            map.getCanvas().style.cursor = COMBATANT_COMMAND_BY_COUNTRY.has(iso2)
              ? "pointer"
              : "";
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
    if (mapRef.current.getLayer?.("aor-selected-glow")) {
      mapRef.current.setFilter("aor-selected-glow", filter);
    }
    if (mapRef.current.getLayer?.("aor-selected-line")) {
      mapRef.current.setFilter("aor-selected-line", filter);
    }
    mapRef.current.easeTo?.({
      center: selected.mapView.center,
      zoom: selected.mapView.zoom,
      duration: 650,
    });
  }, [selected, mapStatus]);

  useEffect(() => {
    let active = true;
    setNews(empty([]));
    setHealth(empty([]));
    setCongress(empty([]));
    setRegulations(empty([]));
    setPartialNews([]);

    searchNewsIntelligence(selected.newsQuery)
      .then((result) => {
        if (!active) return;
        setNews({ state: "ready", data: result.items });
        setPartialNews(
          result.providerHealth
            .filter((provider) => !provider.ok)
            .map(
              (provider) =>
                `${provider.provider}: ${provider.error ?? "unavailable"}`,
            ),
        );
      })
      .catch(
        (error) =>
          active &&
          setNews({ state: "error", data: [], error: errorMessage(error) }),
      );

    Promise.allSettled(
      selected.healthCountries.map((country) => fetchWhoIndicators(country.iso3)),
    ).then((results) => {
      if (!active) return;
      const values = results.flatMap((result) =>
        result.status === "fulfilled" ? result.value.indicators.slice(0, 6) : [],
      );
      const failed = results.filter((result) => result.status === "rejected");
      setHealth(
        values.length
          ? { state: "ready", data: values }
          : failed.length
            ? {
                state: "error",
                data: [],
                error: "WHO returned no usable country indicator response.",
              }
            : { state: "ready", data: [] },
      );
    });

    searchCongressIntelligence(selected.policyQuery, 12)
      .then(
        (result) =>
          active &&
          setCongress({ state: "ready", data: result.items as PolicyItem[] }),
      )
      .catch(
        (error) =>
          active &&
          setCongress({ state: "error", data: [], error: errorMessage(error) }),
      );

    searchRegulatoryIntelligence(selected.policyQuery, undefined, 12)
      .then(
        (result) =>
          active &&
          setRegulations({ state: "ready", data: result.items as PolicyItem[] }),
      )
      .catch(
        (error) =>
          active &&
          setRegulations({ state: "error", data: [], error: errorMessage(error) }),
      );

    return () => {
      active = false;
    };
  }, [selected, refresh]);

  const timeline = useMemo<TimelineItem[]>(
    () =>
      [
        ...news.data.map((item) => ({
          id: item.id,
          title: item.title,
          source: item.sourceName || host(item.url),
          provider: item.provider,
          date: item.publishedAt,
          url: item.url,
          kind: "news" as const,
        })),
        ...congress.data.map((item, index) => ({
          id: `c-${item.number ?? index}`,
          title: item.title ?? "Congress.gov record",
          source: "Congress.gov",
          provider: "Congress.gov API",
          date: item.latestActionDate ?? item.updateDate ?? "",
          url: item.url ?? "https://www.congress.gov/",
          kind: "legislation" as const,
        })),
        ...regulations.data.map((item, index) => ({
          id: `r-${index}-${item.title}`,
          title: item.title ?? "Regulations.gov document",
          source: item.agencyId || "Regulations.gov",
          provider: "Regulations.gov API",
          date: item.postedDate ?? "",
          url: item.url ?? "https://www.regulations.gov/",
          kind: "regulation" as const,
        })),
      ]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 20),
    [news.data, congress.data, regulations.data],
  );

  const loading = [news, health, congress, regulations].some(
    (source) => source.state === "loading",
  );
  const degraded =
    partialNews.length > 0 ||
    [news, health, congress, regulations].some((source) => source.state === "error");

  function choose(command: CombatantCommand) {
    setSelected(command);
    setQuery("");
  }

  return (
    <div className="aor-command" data-testid="aor-intelligence">
      <header className="workstation-header">
        <div>
          <span className="workstation-eyebrow">
            <Radio size={14} /> LIVE OPERATIONAL PICTURE
          </span>
          <h1>AOR Intelligence</h1>
          <p>
            Geographic combatant-command workspace for public health,
            operational, legislative, and regulatory signals. Live items link to
            upstream records; they are not intelligence assessments.
          </p>
        </div>
        <span
          className={`status-pill ${loading ? "is-loading" : degraded ? "is-degraded" : "is-live"}`}
        >
          <i />
          {loading
            ? "Refreshing sources"
            : degraded
              ? "Sources partially degraded"
              : "Live sources connected"}
        </span>
      </header>

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
                <strong>
                  {mapStatus === "loading"
                    ? "Loading geographic command map"
                    : "Geographic map unavailable"}
                </strong>
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
            <span>
              <Layers3 size={14} /> Public country-coverage orientation
            </span>
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
          <section className="inspector-card overview">
            <h3>
              <Globe2 /> Overview
            </h3>
            <strong>{selected.name}</strong>
            <p>{selected.geographicScope}</p>
            <dl>
              <div>
                <dt>
                  <MapPin /> Headquarters
                </dt>
                <dd>{selected.headquarters}</dd>
              </div>
              <div>
                <dt>Countries / areas</dt>
                <dd>{selected.countriesAreas.join(" · ")}</dd>
              </div>
            </dl>
            <a href={selected.source.url} target="_blank" rel="noreferrer">
              {selected.source.label}
              <ExternalLink size={12} />
            </a>
          </section>

          <SignalSection icon={<HeartPulse />} title="Public Health" source={health}>
            {health.data.length > 0 ? (
              <div className="health-grid">
                {health.data.slice(0, 9).map((item, index) => (
                  <article
                    key={`${item.country}-${item.indicatorCode}-${item.dataYear}-${index}`}
                  >
                    <span>
                      {item.country} · data year {item.dataYear}
                    </span>
                    <strong>
                      {item.displayValue || item.value} {item.unit}
                    </strong>
                    <p>{item.indicatorName}</p>
                    <small>WHO Global Health Observatory</small>
                  </article>
                ))}
              </div>
            ) : (
              <Empty text="No WHO indicators were returned for the representative countries." />
            )}
          </SignalSection>

          <SignalSection
            icon={<ShieldAlert />}
            title="Operational / Security Signals"
            source={news}
            warning={partialNews.join(" · ")}
          >
            {news.data.length > 0 ? (
              <div className="source-list">
                {news.data.slice(0, 10).map((item) => (
                  <SourceRow
                    key={item.id}
                    title={item.title}
                    source={item.sourceName || host(item.url)}
                    provider={item.provider}
                    date={item.publishedAt}
                    url={item.url}
                  />
                ))}
              </div>
            ) : (
              <Empty text="No operationally relevant recent events were returned." />
            )}
          </SignalSection>

          <SignalSection
            icon={<BookOpen />}
            title="Regulatory / Legislative Signals"
            source={{
              state:
                congress.state === "error" && regulations.state === "error"
                  ? "error"
                  : congress.state === "loading" || regulations.state === "loading"
                    ? "loading"
                    : "ready",
              data: [...congress.data, ...regulations.data],
              error: [congress.error, regulations.error].filter(Boolean).join(" · "),
            }}
            warning={[
              congress.state === "error" ? `Congress.gov: ${congress.error}` : "",
              regulations.state === "error"
                ? `Regulations.gov: ${regulations.error}`
                : "",
            ]
              .filter(Boolean)
              .join(" · ")}
          >
            {congress.data.length + regulations.data.length > 0 ? (
              <div className="source-list">
                {timeline
                  .filter((item) => item.kind !== "news")
                  .slice(0, 10)
                  .map((item) => (
                    <SourceRow key={item.id} {...item} />
                  ))}
              </div>
            ) : (
              <Empty text="No relevant legislative or regulatory records were returned." />
            )}
          </SignalSection>

          <section className="inspector-card">
            <h3>
              <Building2 /> Recent Source Timeline
            </h3>
            {timeline.length > 0 ? (
              <div className="timeline">
                {timeline.map((item) => (
                  <SourceRow key={`${item.kind}-${item.id}`} {...item} />
                ))}
              </div>
            ) : loading ? (
              <Loading />
            ) : (
              <Empty text="No live source records are available for this command." />
            )}
          </section>
        </aside>
      </section>
    </div>
  );
}

function SignalSection<T>({
  icon,
  title,
  source,
  warning,
  children,
}: {
  icon: ReactNode;
  title: string;
  source: Loadable<T>;
  warning?: string;
  children: ReactNode;
}) {
  return (
    <section className="inspector-card">
      <h3>
        {icon}
        {title}
      </h3>
      {warning && (
        <div className="provider-warning">
          <AlertTriangle />
          Partial source failure: {warning}
        </div>
      )}
      {source.state === "loading" ? (
        <Loading />
      ) : source.state === "error" ? (
        <div className="source-error">
          <AlertTriangle />
          <span>
            <strong>Live source unavailable</strong>
            {source.error}
          </span>
        </div>
      ) : (
        children
      )}
    </section>
  );
}
function Loading() {
  return (
    <div className="source-loading">
      <LoaderCircle /> Loading live source records…
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="source-empty">{text}</div>;
}
function SourceRow({
  title,
  source,
  provider,
  date,
  url,
}: Pick<TimelineItem, "title" | "source" | "provider" | "date" | "url">) {
  return (
    <a className="source-row" href={url} target="_blank" rel="noreferrer">
      <span className="source-row-title">
        {title}
        <ExternalLink size={12} />
      </span>
      <span className="source-row-meta">
        <b>{source}</b>
        <i>{provider}</i>
        <time dateTime={date}>{displayDate(date)}</time>
      </span>
    </a>
  );
}
