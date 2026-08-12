import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  Globe2,
  HeartPulse,
  LoaderCircle,
  MapPin,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  Wind,
} from "lucide-react";
import {
  AOR_PROFILE_BY_ISO,
  AOR_PROFILES,
  type AorCountryProfile,
} from "../data/aorProfiles";
import { ISO2_TO_ISO3 } from "../data/isoCountryCodes";
import {
  fetchWhoIndicators,
  searchNewsIntelligence,
  type IntelligenceNewsItem,
  type WhoIndicator,
} from "../lib/intelligenceApi";
import "./deployment-reference.css";

declare global {
  interface Window {
    maptilersdk?: any;
  }
}

const MAPTILER_VERSION = "4.0.2";
const MAPTILER_SCRIPT = `https://cdn.maptiler.com/maptiler-sdk-js/v${MAPTILER_VERSION}/maptiler-sdk.umd.min.js`;
const MAPTILER_CSS = `https://cdn.maptiler.com/maptiler-sdk-js/v${MAPTILER_VERSION}/maptiler-sdk.css`;
const MAP_SOURCE_URL = "https://api.maptiler.com/tiles/countries/tiles.json";

type LiveState<T> = {
  status: "loading" | "ready" | "error";
  data: T;
  error?: string;
};

const eventQuery = (country: string) =>
  `(${country}) AND (outbreak OR epidemic OR disease OR hospital OR healthcare OR disaster OR earthquake OR flood OR wildfire OR cyclone OR hurricane OR typhoon OR "heat wave" OR "extreme cold" OR infrastructure OR transportation OR evacuation)`;
const formatDate = (value: string) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.valueOf())
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)
    : "Date not supplied";
};
const failureMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Live provider unavailable.";

const CURRENT_SOURCES = [
  {
    name: "CDC Travelers’ Health",
    url: "https://wwwnc.cdc.gov/travel/destinations/list",
  },
  {
    name: "U.S. State Department Travel Advisories",
    url: "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html/",
  },
];

const emptyIsoFilter = [
  "all",
  ["==", ["get", "level"], 0],
  ["==", ["get", "iso_a2"], "__NONE__"],
];
const isoFilter = (iso2: string) => [
  "all",
  ["==", ["get", "level"], 0],
  ["==", ["get", "iso_a2"], iso2],
];

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
      if (window.maptilersdk) finish();
      else {
        existing.addEventListener("load", finish, { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("Unable to load MapTiler SDK.")),
          { once: true },
        );
      }
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

export default function DeploymentReferenceV2() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [query, setQuery] = useState("");
  const [selectedIso, setSelectedIso] = useState("KW");
  const [hoveredIso, setHoveredIso] = useState<string | null>(null);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [mapError, setMapError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [who, setWho] = useState<LiveState<WhoIndicator[]>>({
    status: "loading",
    data: [],
  });
  const [events, setEvents] = useState<LiveState<IntelligenceNewsItem[]>>({
    status: "loading",
    data: [],
  });
  const [providerWarning, setProviderWarning] = useState("");

  const selected = AOR_PROFILE_BY_ISO.get(selectedIso) ?? AOR_PROFILES[0];
  const hovered = hoveredIso ? AOR_PROFILE_BY_ISO.get(hoveredIso) : undefined;

  const matches = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];
    return AOR_PROFILES.filter((profile) =>
      `${profile.name} ${profile.region} ${profile.iso2}`
        .toLowerCase()
        .includes(clean),
    ).slice(0, 9);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      try {
        if (!mapContainerRef.current) return;
        const configResponse = await fetch("/api/map-config", {
          cache: "no-store",
        });
        const config = await configResponse
          .json()
          .catch(() => ({ configured: false, apiKey: "" }));
        if (!configResponse.ok || !config?.configured || !config?.apiKey) {
          throw new Error(
            "MAP_TILER_API_KEY is not configured on the Render web service.",
          );
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
        map.addControl(
          new sdk.NavigationControl({ showCompass: false }),
          "bottom-right",
        );

        map.on("load", () => {
          if (cancelled) return;
          map.addSource("aor-countries", {
            type: "vector",
            url: MAP_SOURCE_URL,
          });

          const firstSymbol = map
            .getStyle()
            ?.layers?.find((layer: any) => layer.type === "symbol")?.id;
          const before = firstSymbol || undefined;

          // Transparent hit area keeps the whole country clickable without recoloring the basemap.
          map.addLayer(
            {
              id: "aor-country-hit",
              type: "fill",
              source: "aor-countries",
              "source-layer": "administrative",
              filter: ["==", ["get", "level"], 0],
              paint: {
                "fill-color": "#ffffff",
                "fill-opacity": 0.001,
              },
            },
            before,
          );

          // Hover is border-only and intentionally subtle.
          map.addLayer(
            {
              id: "aor-country-hover-line",
              type: "line",
              source: "aor-countries",
              "source-layer": "administrative",
              filter: emptyIsoFilter,
              paint: {
                "line-color": "#52b7cc",
                "line-width": 1.4,
                "line-opacity": 0.58,
              },
            },
            before,
          );

          // Soft outer glow makes the selected country border feel illuminated without filling it.
          map.addLayer(
            {
              id: "aor-country-selected-glow",
              type: "line",
              source: "aor-countries",
              "source-layer": "administrative",
              filter: isoFilter(selectedIso),
              paint: {
                "line-color": "#6ee7ff",
                "line-width": 7,
                "line-opacity": 0.34,
                "line-blur": 3.5,
              },
            },
            before,
          );

          map.addLayer(
            {
              id: "aor-country-selected-line",
              type: "line",
              source: "aor-countries",
              "source-layer": "administrative",
              filter: isoFilter(selectedIso),
              paint: {
                "line-color": "#bdf7ff",
                "line-width": 2.6,
                "line-opacity": 1,
              },
            },
            before,
          );

          map.on("mousemove", "aor-country-hit", (event: any) => {
            map.getCanvas().style.cursor = "pointer";
            const iso2 = event.features?.[0]?.properties?.iso_a2;
            if (!iso2 || !AOR_PROFILE_BY_ISO.has(iso2)) return;
            setHoveredIso(iso2);
            map.setFilter("aor-country-hover-line", isoFilter(iso2));
          });

          map.on("mouseleave", "aor-country-hit", () => {
            map.getCanvas().style.cursor = "";
            setHoveredIso(null);
            map.setFilter("aor-country-hover-line", emptyIsoFilter);
          });

          map.on("click", "aor-country-hit", (event: any) => {
            const iso2 = event.features?.[0]?.properties?.iso_a2;
            if (!iso2 || !AOR_PROFILE_BY_ISO.has(iso2)) return;
            setSelectedIso(iso2);
          });

          setMapStatus("ready");
        });

        map.on("error", (event: any) => {
          if (event?.error?.message && !cancelled)
            setMapError(event.error.message);
        });
      } catch (error) {
        if (cancelled) return;
        setMapStatus("error");
        setMapError(
          error instanceof Error
            ? error.message
            : "Unable to initialize the AOR map.",
        );
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
    const selectedFilter = isoFilter(selectedIso);
    if (mapRef.current.getLayer?.("aor-country-selected-glow")) {
      mapRef.current.setFilter("aor-country-selected-glow", selectedFilter);
    }
    if (mapRef.current.getLayer?.("aor-country-selected-line")) {
      mapRef.current.setFilter("aor-country-selected-line", selectedFilter);
    }
  }, [selectedIso, mapStatus]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setWho({ status: "loading", data: [] });
    setEvents({ status: "loading", data: [] });
    setProviderWarning("");
    const iso3 = ISO2_TO_ISO3[selected.iso2];
    if (iso3) {
      fetchWhoIndicators(iso3, [], controller.signal)
        .then(
          (response) =>
            active && setWho({ status: "ready", data: response.indicators }),
        )
        .catch(
          (error) =>
            active &&
            setWho({ status: "error", data: [], error: failureMessage(error) }),
        );
    } else {
      setWho({
        status: "error",
        data: [],
        error: "No ISO alpha-3 mapping is available for this location.",
      });
    }
    searchNewsIntelligence(
      eventQuery(selected.name),
      selected.iso2.toLowerCase(),
      controller.signal,
    )
      .then((response) => {
        if (!active) return;
        setEvents({ status: "ready", data: response.items });
        setProviderWarning(
          response.providerHealth
            .filter((provider) => !provider.ok)
            .map(
              (provider) =>
                `${provider.provider}: ${provider.error ?? "unavailable"}`,
            )
            .join(" · "),
        );
      })
      .catch(
        (error) =>
          active &&
          setEvents({
            status: "error",
            data: [],
            error: failureMessage(error),
          }),
      );
    return () => {
      active = false;
      controller.abort();
    };
  }, [selected.iso2, selected.name, refresh]);

  function chooseCountry(profile: AorCountryProfile) {
    setSelectedIso(profile.iso2);
    setQuery("");
    setHoveredIso(null);
    if (mapRef.current?.getLayer?.("aor-country-hover-line")) {
      mapRef.current.setFilter("aor-country-hover-line", emptyIsoFilter);
    }
  }

  return (
    <div className="deployment-workbench" data-testid="deployment-reference">
      <header className="deployment-header">
        <div>
          <div className="deployment-kicker">
            EXTERNAL FACTORS / DEPLOYMENT MEDICINE
          </div>
          <h1>External Factors</h1>
          <p>
            Country-level deployment and medical review workspace. Select a
            location for clearly separated reference context, WHO observations,
            and recent sourced health, weather, disaster, transport, and access
            signals.
          </p>
        </div>
        <div className="deployment-static">
          <Globe2 size={15} />
          <div>
            <strong>{AOR_PROFILES.length} country profiles</strong>
            <small>MapTiler live geography</small>
          </div>
        </div>
      </header>

      <div className="deployment-toolbar">
        <div className="deployment-search-wrap">
          <div className="deployment-search liquid-glass">
            <Search size={14} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a country or region…"
            />
          </div>
          {query.trim() && (
            <div className="deployment-search-results liquid-glass">
              {matches.length > 0 ? (
                matches.map((profile) => (
                  <button
                    key={profile.iso2}
                    onClick={() => chooseCountry(profile)}
                  >
                    <span>
                      <strong>{profile.name}</strong>
                      <small>
                        {profile.region} · {profile.iso2}
                      </small>
                    </span>
                  </button>
                ))
              ) : (
                <div className="deployment-empty">
                  No matching country profile.
                </div>
              )}
            </div>
          )}
        </div>
        <div className="deployment-source-links">
          {CURRENT_SOURCES.map((source) => (
            <a
              key={source.name}
              href={source.url}
              target="_blank"
              rel="noreferrer"
            >
              {source.name}
              <ExternalLink size={9} />
            </a>
          ))}
        </div>
      </div>

      <div className="deployment-map-layout">
        <section className="deployment-map-card liquid-glass">
          <div ref={mapContainerRef} className="deployment-map-canvas" />
          <div className="deployment-map-overlay deployment-map-legend">
            <div>
              <strong>{hovered?.name ?? selected.name}</strong>
              <small>
                {hovered ? "Click to select country" : "Selected country"}
              </small>
            </div>
          </div>
          <div className="deployment-map-overlay deployment-map-hint">
            Click a country to illuminate its border
          </div>
          {mapStatus === "loading" && (
            <div className="deployment-map-state">
              <Globe2 size={24} />
              <strong>Loading world map…</strong>
            </div>
          )}
          {mapStatus === "error" && (
            <div className="deployment-map-state error">
              <ShieldCheck size={24} />
              <strong>Map connection needed</strong>
              <span>{mapError}</span>
            </div>
          )}
        </section>

        <main className="deployment-detail liquid-glass">
          <div className="deployment-title">
            <div>
              <span>COUNTRY DRILL-DOWN · {selected.iso2}</span>
              <h2>{selected.name}</h2>
              <p>
                {selected.region} · Country-level profile; no city-level
                inference
              </p>
            </div>
            <button
              className="deployment-refresh"
              onClick={() => setRefresh((value) => value + 1)}
            >
              <RefreshCw size={12} /> Refresh live sources
            </button>
          </div>

          <Section title="Location Overview" badge="STATIC / REFERENCE">
            <p>
              {selected.region}. Medical access classification:{" "}
              {selected.medicalTier}.
            </p>
            <div className="deployment-chips">
              {selected.watchItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </Section>
          <Section
            title="Climate / Environmental Considerations"
            badge="STATIC / REFERENCE"
            icon={<Wind size={14} />}
          >
            <p>{selected.climate}</p>
            <p>{selected.disease}</p>
          </Section>
          <Section
            title="Heat / Cold Considerations"
            badge="STATIC / REFERENCE"
            icon={<Thermometer size={14} />}
          >
            <p>{temperatureGuidance(selected)}</p>
          </Section>
          {altitudeRelevant(selected) && (
            <Section
              title="Altitude"
              badge="STATIC / REFERENCE"
              icon={<MapPin size={14} />}
            >
              <p>{altitudeGuidance(selected)}</p>
            </Section>
          )}
          <Section
            title="Public Health Indicators"
            badge="LIVE SOURCE · WHO"
            icon={<HeartPulse size={14} />}
          >
            <LiveBlock state={who}>
              {who.data.length ? (
                <div className="deployment-indicators">
                  {who.data.slice(0, 12).map((item, index) => (
                    <article
                      key={`${item.indicatorCode}-${item.dataYear}-${index}`}
                    >
                      <small>{item.indicatorName}</small>
                      <strong>
                        {item.displayValue || item.value} {item.unit}
                      </strong>
                      <span>
                        {item.country} · DATA YEAR {item.dataYear}
                      </span>
                      <a
                        href="https://ghoapi.azureedge.net/api"
                        target="_blank"
                        rel="noreferrer"
                      >
                        WHO Global Health Observatory
                        <ExternalLink size={9} />
                      </a>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty>
                  WHO returned no targeted indicators for this country.
                </Empty>
              )}
            </LiveBlock>
          </Section>
          <Section
            title="Healthcare Access / Capacity"
            badge="STATIC / REFERENCE"
          >
            <p>{selected.medical}</p>
            <p>{selected.evacuation}</p>
          </Section>
          <Section
            title="Current Health / Disaster Signals"
            badge="LIVE / RECENT · NEWSDATA.IO + APITUBE"
            icon={<AlertTriangle size={14} />}
          >
            <LiveBlock state={events} warning={providerWarning}>
              {events.data.length ? (
                <EventList items={events.data.slice(0, 8)} />
              ) : (
                <Empty>
                  No relevant recent health, disaster, weather, or access events
                  were returned.
                </Empty>
              )}
            </LiveBlock>
          </Section>
          <Section
            title="Medication / Logistics Considerations"
            badge="STATIC / REFERENCE"
            icon={<PackageCheck size={14} />}
          >
            <p>{medicationGuidance(selected)}</p>
            <p>{selected.security}</p>
          </Section>
          <Section title="Recent Relevant Events" badge="LIVE / RECENT">
            <LiveBlock state={events} warning={providerWarning}>
              {events.data.length ? (
                <EventList items={events.data.slice(0, 15)} />
              ) : (
                <Empty>
                  No recent relevant events were returned by the configured
                  providers.
                </Empty>
              )}
            </LiveBlock>
          </Section>
          <div className="deployment-warning">
            Reference content supports issue spotting only. Live records retain
            their source and observation date. Confirm current official
            destination, client, medication-import, transport, and site-specific
            guidance before a fitness or deployment determination.
          </div>
        </main>
      </div>
    </div>
  );
}

function Section({
  title,
  badge,
  icon,
  children,
}: {
  title: string;
  badge: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="deployment-section">
      <header>
        <h3>
          {icon}
          {title}
        </h3>
        <span>{badge}</span>
      </header>
      <div className="deployment-section-body">{children}</div>
    </section>
  );
}
function LiveBlock<T>({
  state,
  warning,
  children,
}: {
  state: LiveState<T>;
  warning?: string;
  children: React.ReactNode;
}) {
  if (state.status === "loading")
    return (
      <div className="deployment-live-state">
        <LoaderCircle className="spin" />
        Loading current source records…
      </div>
    );
  if (state.status === "error")
    return (
      <div className="deployment-live-state error">
        <AlertTriangle />
        <span>
          <strong>Live provider unavailable</strong>
          {state.error}
        </span>
      </div>
    );
  return (
    <>
      {warning && (
        <div className="deployment-partial">
          <AlertTriangle />
          Partial provider failure: {warning}
        </div>
      )}
      {children}
    </>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="deployment-empty-live">{children}</div>;
}
function EventList({ items }: { items: IntelligenceNewsItem[] }) {
  return (
    <div className="deployment-events">
      {items.map((item) => (
        <a key={item.id} href={item.url} target="_blank" rel="noreferrer">
          <strong>
            {item.title}
            <ExternalLink size={10} />
          </strong>
          <span>
            <b>{item.sourceName || "Source not supplied"}</b>
            <i>{item.provider}</i>
            <time dateTime={item.publishedAt}>
              {formatDate(item.publishedAt)}
            </time>
          </span>
        </a>
      ))}
    </div>
  );
}
function altitudeRelevant(profile: AorCountryProfile) {
  return /altitude|mountain|terrain/i.test(
    `${profile.climate} ${profile.watchItems.join(" ")}`,
  );
}
function altitudeGuidance(profile: AorCountryProfile) {
  return `${profile.climate} This country-level flag does not establish a worksite elevation. Obtain the exact site elevation and itinerary before assessing acclimatization, cardiopulmonary risk, or altitude-sensitive medication needs.`;
}
function temperatureGuidance(profile: AorCountryProfile) {
  const text = `${profile.climate} ${profile.watchItems.join(" ")}`;
  const heat = /heat|hot|tropical|arid/i.test(text);
  const cold = /cold|winter|cool/i.test(text);
  if (heat && cold)
    return "The reference profile flags both heat and cold or seasonal temperature variation. Assess itinerary, season, workload, hydration, clothing, and temperature-sensitive medications against current local forecasts.";
  if (heat)
    return "The reference profile flags heat exposure. Review exertional heat risk, hydration/renal and cardiovascular factors, acclimatization, and medication storage against current local forecasts.";
  if (cold)
    return "The reference profile flags cold exposure. Review cold tolerance, protective clothing, mobility, respiratory/cardiovascular factors, and medication/device performance against current local forecasts.";
  return "Temperature exposure varies by season and exact worksite. Use current local forecasts and site conditions; this country profile does not provide city-level weather.";
}
function medicationGuidance(profile: AorCountryProfile) {
  const remote = /remote|limited|evacuation|island/i.test(
    `${profile.medical} ${profile.evacuation}`,
  );
  return `${remote ? "Access or evacuation constraints may increase the need for an adequate medication supply and a documented continuity plan. " : ""}Confirm destination import rules, cold-chain or heat-sensitive storage, controlled-drug documentation, refill access, backup supply, and transport delays through official and program-specific sources. No medication availability is inferred from country-level data.`;
}
