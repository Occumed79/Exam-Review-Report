import { Activity, Globe2, Layers3, Radio, Search, ShieldAlert } from "lucide-react";
import "./aor-intelligence.css";

export default function AORIntelligence() {
  return (
    <div className="aor-command" data-testid="aor-intelligence">
      <header className="workstation-header">
        <div><span className="workstation-eyebrow"><Radio size={14}/> OPERATIONAL PICTURE</span><h1>AOR Intelligence</h1><p>Geographic command workspace for future area-of-responsibility intelligence. Live news and intelligence sources are not connected in this visual shell.</p></div>
        <span className="status-pill"><i/> Visual shell · no live feed</span>
      </header>
      <section className="aor-command-grid">
        <div className="aor-map-surface">
          <div className="aor-map-toolbar liquid-glass"><Search size={16}/><input aria-label="Search areas of responsibility" placeholder="Search region, country, or AOR…" disabled/><kbd>⌘ K</kbd></div>
          <div className="aor-world" aria-label="Stylized world map placeholder">
            <svg viewBox="0 0 1000 520" role="img"><defs><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32"/></pattern><filter id="glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="1000" height="520" fill="url(#grid)"/><g className="continents"><path d="M75 142l69-68 121 7 66 72-37 58-55 11-28 83-57-23-27-80z"/><path d="M273 302l68 30 21 78-47 91-30-34 9-76-44-46z"/><path d="M468 112l90-46 82 34 37 48 89-25 144 55-27 62-102 22-60-38-56 15-21 75-72-18-28-69-66-41z"/><path d="M726 340l77-31 84 49-19 75-71 29-63-45z"/></g><g className="map-nodes" filter="url(#glow)"><circle cx="241" cy="174" r="6"/><circle cx="551" cy="165" r="6"/><circle cx="680" cy="211" r="6"/><circle cx="818" cy="383" r="6"/><path d="M241 174L551 165 680 211 818 383"/></g></svg>
            <div className="scan-line"/><div className="map-watermark"><Globe2/> GEOSPATIAL LAYER STANDBY</div>
          </div>
          <footer><span><Layers3 size={14}/> Base geography</span><span>Layers ready: 0</span><span>Last sync: Not configured</span></footer>
        </div>
        <aside className="aor-inspector">
          <div className="inspector-head"><div><span>COMMAND INSPECTOR</span><h2>No region selected</h2></div><Activity size={19}/></div>
          <div className="inspector-empty"><div><ShieldAlert size={26}/></div><h3>Intelligence feed not connected</h3><p>Selecting regions and displaying sourced operational updates will become available when an intelligence pipeline is configured.</p></div>
          <div className="inspector-sections"><button disabled>Situation overview <span>—</span></button><button disabled>Medical factors <span>—</span></button><button disabled>Security signals <span>—</span></button><button disabled>Source timeline <span>—</span></button></div>
        </aside>
      </section>
    </div>
  );
}
