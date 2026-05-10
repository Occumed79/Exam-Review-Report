import { useState, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import {
  AlertTriangle, Activity, Globe, Radio, Thermometer,
  Shield, Zap, RefreshCw, Filter, ChevronRight,
  MapPin, Wind, X
} from "lucide-react";
import geoData from "world-atlas/countries-110m.json";
import type { AOREvent } from "@/lib/types";

type RiskLevel = AOREvent["riskLevel"];
type AORCategory = AOREvent["category"];

type WorldGeoCollection = {
  type: "Topology";
  objects: {
    countries: {
      type: string;
      geometries: Array<{
        type: string;
        properties: { name?: string };
      }>;
    };
  };
};

const RISK_COLORS: Record<RiskLevel, string> = {
  critical: "#b4d7d0",
  high: "#d6c8aa",
  moderate: "#a7c7be",
  low: "#7f9d96",
  monitor: "#f4efdc",
};

const CATEGORY_ICONS: Record<AORCategory, typeof AlertTriangle> = {
  health: Activity,
  conflict: Shield,
  environmental: Wind,
  infrastructure: Zap,
  disease: Thermometer,
};

const CATEGORY_COLORS: Record<AORCategory, string> = {
  health: "#b4d7d0",
  conflict: "#d6c8aa",
  environmental: "#a7c7be",
  infrastructure: "#7f9d96",
  disease: "#f4efdc",
};

const AOR_EVENTS: AOREvent[] = [
  {
    id: "evt-001",
    country: "Sudan",
    countryCode: "SD",
    region: "Sub-Saharan Africa",
    coordinates: [32.5, 15.5],
    riskLevel: "critical",
    category: "conflict",
    title: "Active Armed Conflict — Medical Evacuation Concerns",
    summary: "Ongoing armed conflict in Khartoum and surrounding regions significantly impairs medical infrastructure and evacuation routes.",
    details: "Healthcare facilities operating at <30% capacity. Emergency evacuation by air only through designated corridors. Personnel requiring specialty care face critical delays. CPAP/refrigerated medication supply chains severely disrupted.",
    date: "2025-05-01",
    source: "WHO AFRO / OCHA",
    tags: ["evacuation", "medical-supply", "infrastructure"],
  },
  {
    id: "evt-002",
    country: "Haiti",
    countryCode: "HT",
    region: "Caribbean",
    coordinates: [-72.5, 18.9],
    riskLevel: "critical",
    category: "conflict",
    title: "Security Collapse — Gang-Controlled Zones",
    summary: "Large portions of Port-au-Prince under gang control. Hospital access severely limited. Cholera outbreak ongoing.",
    details: "Orthopedic and emergency surgical capacity near zero in affected zones. Civilian medical transport routinely targeted. Cholera outbreak with limited oral rehydration therapy availability. Personnel with immunocompromising conditions face elevated mortality risk.",
    date: "2025-04-28",
    source: "PAHO / UN Security Council",
    tags: ["cholera", "security", "medical-access"],
  },
  {
    id: "evt-003",
    country: "Bangladesh",
    countryCode: "BD",
    region: "South Asia",
    coordinates: [90.3, 23.7],
    riskLevel: "high",
    category: "environmental",
    title: "Monsoon Flooding — Dengue & Leptospirosis Risk Elevated",
    summary: "Severe monsoon flooding has displaced 2M+ persons. Dengue and leptospirosis rates 340% above seasonal baseline.",
    details: "Floodwater contamination with human/animal waste increases leptospirosis risk for anyone with skin breaks or wounds. Personnel with renal conditions, diabetes, or immunosuppression at significantly elevated risk. Vector-borne disease transmission window extended.",
    date: "2025-04-30",
    source: "IEDCR Bangladesh / WHO SEARO",
    tags: ["dengue", "leptospirosis", "flood", "vector-borne"],
  },
  {
    id: "evt-004",
    country: "Ukraine",
    countryCode: "UA",
    region: "Eastern Europe",
    coordinates: [32.0, 49.0],
    riskLevel: "high",
    category: "infrastructure",
    title: "Healthcare Infrastructure Degraded — Power Grid Attacks",
    summary: "Repeated infrastructure strikes have disabled backup power at multiple hospital complexes in eastern oblasts.",
    details: "Cold chain for biologics and insulin interrupted across eastern regions. Dialysis and ICU operations at risk during outages. Medical oxygen supply disrupted. Personnel requiring refrigerated medications or power-dependent devices face elevated operational risk in eastern deployment zones.",
    date: "2025-04-29",
    source: "MoH Ukraine / WHO EURO",
    tags: ["infrastructure", "cold-chain", "power", "medications"],
  },
  {
    id: "evt-005",
    country: "DRC",
    countryCode: "CD",
    region: "Central Africa",
    coordinates: [23.6, -2.9],
    riskLevel: "high",
    category: "disease",
    title: "Mpox Clade Ib Outbreak — Cross-Border Spread Active",
    summary: "Mpox Clade Ib (high severity) confirmed in eastern DRC with spread to Uganda, Rwanda, and Burundi border regions.",
    details: "Clade Ib associated with higher transmission efficiency and more severe disease course than Clade II. Personnel with HIV, organ transplant history, or other immunocompromising conditions require enhanced pre-deployment evaluation. Vaccination (JYNNEOS) recommended for eligible personnel.",
    date: "2025-04-27",
    source: "WHO AFRO / Africa CDC",
    tags: ["mpox", "infectious-disease", "immunocompromised", "cross-border"],
  },
  {
    id: "evt-006",
    country: "Pakistan",
    countryCode: "PK",
    region: "South Asia",
    coordinates: [69.3, 30.4],
    riskLevel: "high",
    category: "health",
    title: "Heat Emergency — Record Temperatures in Sindh/Punjab",
    summary: "Temperatures exceeding 52°C recorded. Occupational heat illness risk at extreme level for outdoor workers.",
    details: "Personnel with cardiovascular disease, hypertension, obesity, or on diuretics face severe heat illness risk. Work/rest cycles must be aggressively enforced. Personnel on beta-blockers have impaired heat dissipation. Heat-related sudden cardiac death risk elevated for unacclimatized personnel.",
    date: "2025-05-02",
    source: "Pakistan Met Office / WHO EMRO",
    tags: ["heat", "cardiovascular", "hypertension", "outdoor-workers"],
  },
  {
    id: "evt-007",
    country: "Colombia",
    countryCode: "CO",
    region: "South America",
    coordinates: [-74.0, 4.7],
    riskLevel: "moderate",
    category: "disease",
    title: "Yellow Fever — Vaccination Certificate Required",
    summary: "Localized YFV transmission in Amazon basin departments. Vaccination certificate required for personnel transiting YF-endemic zones.",
    details: "Personnel aged 60+ or with thymus disorders should consult travel medicine before YFV vaccination. Unvaccinated personnel should not be deployed to affected departments. Risk highest April–October during rainy season. No established antiviral treatment available.",
    date: "2025-04-22",
    source: "Colombia INS / PAHO",
    tags: ["yellow-fever", "vaccination", "vector-borne", "amazon"],
  },
  {
    id: "evt-008",
    country: "Iraq",
    countryCode: "IQ",
    region: "Middle East",
    coordinates: [43.7, 33.2],
    riskLevel: "moderate",
    category: "environmental",
    title: "Severe Dust Storms — Respiratory Risk Elevated",
    summary: "Shamal dust storms with PM10 levels 60–80× WHO guidelines reported across central and southern Iraq.",
    details: "Personnel with asthma, COPD, or other respiratory conditions require enhanced pre-deployment evaluation. N95 (or equivalent) respirator use mandatory outdoors. PM2.5 penetration risk even with standard filtration. Storm season forecast: April–July 2025.",
    date: "2025-04-25",
    source: "WMO / Iraq MOH",
    tags: ["dust", "respiratory", "COPD", "asthma", "PM2.5"],
  },
  {
    id: "evt-009",
    country: "Philippines",
    countryCode: "PH",
    region: "Southeast Asia",
    coordinates: [122.0, 12.9],
    riskLevel: "moderate",
    category: "disease",
    title: "Rabies Exposure Risk — Underreported in Visayas Region",
    summary: "Rabies remains endemic with significant underreporting. Post-exposure prophylaxis (PEP) availability inconsistent outside Metro Manila.",
    details: "PEP vaccine cold chain reliability in provincial areas unreliable. Personnel with animal exposure should be evaluated and treated in Manila or evacuated. Pre-exposure prophylaxis strongly recommended for field deployments >30 days. Dog and bat populations are primary reservoirs.",
    date: "2025-04-18",
    source: "DOH Philippines / WHO WPRO",
    tags: ["rabies", "PEP", "cold-chain", "animal-exposure"],
  },
  {
    id: "evt-010",
    country: "Ethiopia",
    countryCode: "ET",
    region: "East Africa",
    coordinates: [40.5, 9.1],
    riskLevel: "moderate",
    category: "health",
    title: "Malaria Drug Resistance Confirmed — Tigray & Afar",
    summary: "Partial artemisinin resistance confirmed in P. falciparum isolates from Tigray and Afar regions.",
    details: "Standard ACT prophylaxis may be insufficient. Personnel deploying to highland regions (>2000m) at lower risk. Atovaquone-proguanil or doxycycline preferred over chloroquine-based prophylaxis. Personnel with G6PD deficiency should not receive primaquine. Seek ID consult for post-deployment evaluation.",
    date: "2025-04-20",
    source: "EPHI Ethiopia / WHO AFRO",
    tags: ["malaria", "drug-resistance", "prophylaxis", "G6PD"],
  },
  {
    id: "evt-011",
    country: "Japan",
    countryCode: "JP",
    region: "East Asia",
    coordinates: [138.3, 36.2],
    riskLevel: "monitor",
    category: "environmental",
    title: "Tick-Borne Spotted Fever Cluster — Spring Activity Peak",
    summary: "SFTS (Severe Fever with Thrombocytopenia Syndrome) and Japanese spotted fever activity elevated during April–June tick season.",
    details: "No approved treatment for SFTS; fatality rate 12–30% in elderly/immunocompromised. Tick avoidance measures essential. Personnel with anticoagulation therapy or thrombocytopenia history require enhanced risk assessment. Recommend long sleeves, DEET/permethrin use, and daily tick checks.",
    date: "2025-04-15",
    source: "NIID Japan",
    tags: ["SFTS", "tick-borne", "spring", "anticoagulation"],
  },
  {
    id: "evt-012",
    country: "Brazil",
    countryCode: "BR",
    region: "South America",
    coordinates: [-51.9, -14.2],
    riskLevel: "monitor",
    category: "disease",
    title: "Oropouche Fever — Expanding Geographic Range",
    summary: "Oropouche virus (OROV) expanding beyond Amazon basin into southeastern states. No approved vaccine or antiviral.",
    details: "Transmitted by midge (Culicoides) and mosquito. Novel clinical manifestations including neurological complications reported in 2024–2025 outbreak. Personnel with neurologic conditions should be evaluated. Standard mosquito repellents (DEET) effective. Risk elevated during rainy season.",
    date: "2025-04-10",
    source: "Brazil MS / PAHO",
    tags: ["oropouche", "arbovirus", "neurologic", "DEET"],
  },
];

const REGION_OPTIONS = ["All Regions", "Sub-Saharan Africa", "Central Africa", "East Africa", "Middle East", "South Asia", "Southeast Asia", "East Asia", "Eastern Europe", "Caribbean", "South America"];
const CATEGORY_OPTIONS: Array<AORCategory | "all"> = ["all", "health", "conflict", "environmental", "disease", "infrastructure"];
const RISK_OPTIONS: Array<RiskLevel | "all"> = ["all", "critical", "high", "moderate", "low", "monitor"];

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date("2025-05-03");
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff}d ago`;
}

function PulseMarker({ event, selected, onClick }: { event: AOREvent; selected: boolean; onClick: () => void }) {
  const color = RISK_COLORS[event.riskLevel];
  return (
    <Marker coordinates={event.coordinates}>
      <g onClick={onClick} style={{ cursor: "pointer" }}>
        {/* Outer pulse rings */}
        <circle
          r={selected ? 18 : 14}
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity={0.2}
          style={{
            transformOrigin: "center",
            animation: "pulse-ring 2s ease-out infinite",
          }}
        />
        <circle
          r={selected ? 12 : 9}
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity={0.4}
          style={{
            transformOrigin: "center",
            animation: "pulse-ring 2s ease-out infinite 0.5s",
          }}
        />
        {/* Core dot */}
        <circle
          r={selected ? 6 : 5}
          fill={color}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={selected ? "1.5" : "1"}
          opacity={0.95}
          style={{
            filter: `drop-shadow(0 0 ${selected ? 8 : 4}px ${color})`,
          }}
        />
        {event.riskLevel === "critical" && (
          <circle
            r={5}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            opacity={0.6}
            style={{
              transformOrigin: "center",
              animation: "pulse-critical 1.2s ease-in-out infinite",
            }}
          />
        )}
      </g>
    </Marker>
  );
}

function EventCard({ event, selected, onClick }: { event: AOREvent; selected: boolean; onClick: () => void }) {
  const Icon = CATEGORY_ICONS[event.category];
  const catColor = CATEGORY_COLORS[event.category];
  const riskColor = RISK_COLORS[event.riskLevel];

  return (
    <div
      onClick={onClick}
      data-testid={`aor-event-${event.id}`}
      style={{
        padding: "0.875rem 1rem",
        borderRadius: "10px",
        background: selected
          ? "rgba(180,215,208,0.07)"
          : "rgba(255,255,255,0.025)",
        border: `1px solid ${selected ? "rgba(180,215,208,0.3)" : "rgba(255,255,255,0.07)"}`,
        cursor: "pointer",
        transition: "all 0.2s",
        marginBottom: "0.5rem",
      }}
    >
      <div style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "7px",
            background: `${catColor}15`,
            border: `1px solid ${catColor}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: "1px",
          }}
        >
          <Icon size={13} style={{ color: catColor }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                padding: "0.15rem 0.45rem",
                borderRadius: "4px",
                background: `${riskColor}18`,
                color: riskColor,
                border: `1px solid ${riskColor}35`,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {event.riskLevel}
            </span>
            <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)" }}>
              {event.country} · {timeAgo(event.date)}
            </span>
          </div>
          <div
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "#fff",
              lineHeight: 1.4,
              marginBottom: "0.25rem",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {event.title}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.45)",
              lineHeight: 1.45,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {event.summary}
          </div>
        </div>
        <ChevronRight size={12} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0, marginTop: "6px" }} />
      </div>
    </div>
  );
}

function DetailPanel({ event, onClose }: { event: AOREvent; onClose: () => void }) {
  const Icon = CATEGORY_ICONS[event.category];
  const catColor = CATEGORY_COLORS[event.category];
  const riskColor = RISK_COLORS[event.riskLevel];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(4,8,20,0.96)",
        backdropFilter: "blur(16px)",
        borderRadius: "14px",
        padding: "1.25rem",
        overflowY: "auto",
        zIndex: 10,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: `${catColor}18`,
              border: `1px solid ${catColor}35`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={15} style={{ color: catColor }} />
          </div>
          <div>
            <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)" }}>{event.region} · {event.category}</div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: catColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>{event.country}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "0.25rem", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex" }}
        >
          <X size={14} />
        </button>
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          background: `${riskColor}15`,
          border: `1px solid ${riskColor}35`,
          borderRadius: "6px",
          padding: "0.25rem 0.625rem",
          marginBottom: "0.875rem",
        }}
      >
        <AlertTriangle size={11} style={{ color: riskColor }} />
        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: riskColor, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {event.riskLevel} risk
        </span>
      </div>

      <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#fff", lineHeight: 1.4, marginBottom: "0.75rem" }}>
        {event.title}
      </div>

      <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, marginBottom: "1rem", padding: "0.75rem", background: "rgba(255,255,255,0.04)", borderRadius: "8px", borderLeft: `3px solid ${riskColor}` }}>
        {event.summary}
      </div>

      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>
        SME Operational Guidance
      </div>
      <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.65, marginBottom: "1rem" }}>
        {event.details}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "1rem" }}>
        {event.tags.map(tag => (
          <span
            key={tag}
            style={{
              fontSize: "0.625rem",
              padding: "0.15rem 0.5rem",
              borderRadius: "4px",
              background: "rgba(180,215,208,0.07)",
              color: "#b4d7d0",
              border: "1px solid rgba(180,215,208,0.2)",
              fontWeight: 500,
            }}
          >
            #{tag}
          </span>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        <div style={{ padding: "0.625rem", background: "rgba(255,255,255,0.03)", borderRadius: "7px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>Source</div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{event.source}</div>
        </div>
        <div style={{ padding: "0.625rem", background: "rgba(255,255,255,0.03)", borderRadius: "7px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>Reported</div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{event.date} · {timeAgo(event.date)}</div>
        </div>
      </div>

      <div
        style={{
          marginTop: "1rem",
          padding: "0.625rem 0.75rem",
          background: "rgba(245,158,11,0.07)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: "8px",
          fontSize: "0.6875rem",
          color: "rgba(245,158,11,0.85)",
          lineHeight: 1.5,
        }}
      >
        Operational intelligence update.
      </div>
    </div>
  );
}

export default function AORUpdates() {
  const [selectedEvent, setSelectedEvent] = useState<AOREvent | null>(null);
  const [filterRegion, setFilterRegion] = useState("All Regions");
  const [filterCategory, setFilterCategory] = useState<AOREvent["category"] | "all">("all");
  const [filterRisk, setFilterRisk] = useState<RiskLevel | "all">("all");
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([15, 20]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const filtered: AOREvent[] = AOR_EVENTS.filter((e: AOREvent) => {
    if (filterRegion !== "All Regions" && e.region !== filterRegion) return false;
    if (filterCategory !== "all" && e.category !== filterCategory) return false;
    if (filterRisk !== "all" && e.riskLevel !== filterRisk) return false;
    return true;
  });

  const criticalCount = AOR_EVENTS.filter(e => e.riskLevel === "critical").length;
  const highCount = AOR_EVENTS.filter(e => e.riskLevel === "high").length;
  const selectedEventId = selectedEvent?.id ?? null;

  function handleEventSelect(event: AOREvent) {
    setSelectedEvent(prev => prev?.id === event.id ? null : event);
    setCenter(event.coordinates);
    setZoom(3);
  }

  function handleRefresh() {
    setLastRefresh(new Date());
  }

  const countryHasEvent = useCallback((name: string) => {
    return AOR_EVENTS.find(e => e.country === name || name.includes(e.country));
  }, []);

  return (
    <div data-testid="aor-updates-page" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e", animation: "pulse-dot 2s infinite" }} />
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              AOR Intelligence Monitor
            </h1>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
            Global occupational health & operational risk updates · Last refreshed {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ padding: "0.375rem 0.75rem", borderRadius: "8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", fontSize: "0.75rem", fontWeight: 700, color: "#ef4444" }}>
              {criticalCount} Critical
            </div>
            <div style={{ padding: "0.375rem 0.75rem", borderRadius: "8px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", fontSize: "0.75rem", fontWeight: 700, color: "#f59e0b" }}>
              {highCount} High
            </div>
          </div>
          <button
            className="glow-btn glow-btn-secondary"
            onClick={handleRefresh}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", padding: "0.4rem 0.75rem" }}
            data-testid="btn-refresh-aor"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.625rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <Filter size={13} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
        <select
          className="glass-input"
          value={filterRegion}
          onChange={e => setFilterRegion(e.target.value)}
          style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", cursor: "pointer" }}
          data-testid="filter-region"
        >
          {REGION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          className="glass-input"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as AOREvent["category"] | "all")}
          style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", cursor: "pointer" }}
          data-testid="filter-category"
        >
          {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <select
          className="glass-input"
          value={filterRisk}
          onChange={e => setFilterRisk(e.target.value as RiskLevel | "all")}
          style={{ padding: "0.35rem 0.75rem", fontSize: "0.8125rem", cursor: "pointer" }}
          data-testid="filter-risk"
        >
          {RISK_OPTIONS.map(r => <option key={r} value={r}>{r === "all" ? "All Risk Levels" : r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        {(filterRegion !== "All Regions" || filterCategory !== "all" || filterRisk !== "all") && (
          <button
            onClick={() => { setFilterRegion("All Regions"); setFilterCategory("all"); setFilterRisk("all"); }}
            style={{ fontSize: "0.75rem", color: "#00d4ff", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
          >
            Clear filters
          </button>
        )}
        <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
          {filtered.length} of {AOR_EVENTS.length} events
        </span>
      </div>

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1rem", flex: 1, minHeight: 0 }}>
        {/* Map area */}
        <div
          className="glass-card"
          style={{ padding: 0, overflow: "hidden", position: "relative", height: "520px" }}
        >
          {/* Map controls */}
          <div style={{ position: "absolute", top: "0.875rem", left: "0.875rem", zIndex: 5, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <button
              onClick={() => setZoom(z => Math.min(z * 1.5, 8))}
              style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(10,15,30,0.8)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 700 }}
            >+</button>
            <button
              onClick={() => setZoom(z => Math.max(z / 1.5, 1))}
              style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(10,15,30,0.8)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 700 }}
            >−</button>
            <button
              onClick={() => { setZoom(1); setCenter([15, 20]); setSelectedEvent(null); }}
              style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(10,15,30,0.8)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Reset view"
            >
              <MapPin size={12} />
            </button>
          </div>

          {/* Legend */}
          <div
            style={{
              position: "absolute",
              bottom: "0.875rem",
              left: "0.875rem",
              zIndex: 5,
              background: "rgba(4,8,20,0.85)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              padding: "0.625rem 0.875rem",
            }}
          >
            <div style={{ fontSize: "0.5875rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.4rem" }}>Risk Level</div>
            {(Object.entries(RISK_COLORS) as [RiskLevel, string][]).map(([level, color]) => (
              <div key={level} style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.2rem" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, boxShadow: `0 0 5px ${color}` }} />
                <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.55)", textTransform: "capitalize" }}>{level}</span>
              </div>
            ))}
          </div>

          {/* Active event indicator */}
          {selectedEvent && (
            <div
              style={{
                position: "absolute",
                top: "0.875rem",
                right: "0.875rem",
                zIndex: 5,
                background: "rgba(4,8,20,0.85)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${RISK_COLORS[selectedEvent.riskLevel]}40`,
                borderRadius: "8px",
                padding: "0.5rem 0.75rem",
                maxWidth: "200px",
              }}
            >
              <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: RISK_COLORS[selectedEvent.riskLevel] }}>{selectedEvent.country}</div>
              <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.45)", marginTop: "0.125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedEvent.title}</div>
            </div>
          )}

          <ComposableMap
            projectionConfig={{ scale: 140, center: [0, 10] }}
            style={{ width: "100%", height: "100%", background: "transparent" }}
          >
            <ZoomableGroup zoom={zoom} center={center}>
              <Geographies geography={geoData as WorldGeoCollection}>
                {({ geographies }: { geographies: Array<{ rsmKey: string; properties: { name?: string } }> }) =>
                  geographies.map((geo) => {
                    const name = geo.properties.name ?? "";
                    const event = countryHasEvent(name) as AOREvent | undefined;
                    const isSelected = selectedEvent?.country === name;
                    const isHovered = hoveredCountry === name;
                    let fill = "rgba(255,255,255,0.04)";
                    if (event) {
                      fill = `${RISK_COLORS[event.riskLevel]}22`;
                    }
                    if (isSelected || isHovered) {
                      fill = event ? `${RISK_COLORS[event.riskLevel]}40` : "rgba(255,255,255,0.1)";
                    }
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fill}
                        stroke={
                          isSelected
                            ? RISK_COLORS[event?.riskLevel ?? "monitor"]
                            : event
                            ? `${RISK_COLORS[event.riskLevel]}50`
                            : "rgba(255,255,255,0.08)"
                        }
                        strokeWidth={isSelected ? 1.5 : 0.5}
                        style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }}
                        onMouseEnter={() => setHoveredCountry(name)}
                        onMouseLeave={() => setHoveredCountry(null)}
                        onClick={() => {
                          if (event) handleEventSelect(event);
                        }}
                        tabIndex={-1}
                      />
                    );
                  })
                }
              </Geographies>

              {/* Pulse markers for filtered events */}
              {filtered.map((event) => (
                <PulseMarker
                  key={event.id}
                  event={event}
                  selected={selectedEvent?.id === event.id}
                  onClick={() => handleEventSelect(event)}
                />
              ))}
            </ZoomableGroup>
          </ComposableMap>
        </div>

        {/* Right panel — events feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", minHeight: 0 }}>
          {/* Stats bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.5rem" }}>
            {[
              { label: "Active", value: AOR_EVENTS.length, color: "#00d4ff" },
              { label: "Critical", value: criticalCount, color: "#ef4444" },
              { label: "High", value: highCount, color: "#f59e0b" },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card" style={{ padding: "0.625rem 0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "0.2rem" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Events list */}
          <div
            className="glass-card"
            style={{
              flex: 1,
              padding: "0.875rem",
              overflowY: "auto",
              position: "relative",
            }}
          >
            {selectedEvent ? (
              <DetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />
            ) : (
              <>
                <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <Radio size={11} style={{ color: "#22c55e" }} />
                  Live AOR Feed · {filtered.length} Events
                </div>
                {filtered.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.3)", fontSize: "0.8125rem" }}>
                    No events match current filters
                  </div>
                ) : (
                  filtered
                    .sort((a, b) => {
                      const order: RiskLevel[] = ["critical", "high", "moderate", "low", "monitor"];
                      return order.indexOf(a.riskLevel) - order.indexOf(b.riskLevel);
                    })
                    .map((event: AOREvent) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        selected={selectedEventId === event.id}
                        onClick={() => handleEventSelect(event)}
                      />
                    ))
                )}
              </>
            )}
          </div>

          <div style={{ padding: "0.625rem 0.875rem", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "8px", fontSize: "0.625rem", color: "rgba(245,158,11,0.7)", lineHeight: 1.5 }}>
            Intelligence feed curates reference updates for operational review.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes pulse-critical {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.8); opacity: 0.1; }
        }
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 5px #22c55e; }
          50% { box-shadow: 0 0 12px #22c55e, 0 0 20px #22c55e44; }
        }
      `}</style>
    </div>
  );
}
