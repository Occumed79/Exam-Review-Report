import { CloudSun, Globe2, Radar } from 'lucide-react';
import AORIntelligence from './AORIntelligence';
import ExternalFactors from './ExternalFactors';
import './consolidated-workspaces.css';

export default function AORFactors() {
  return (
    <div className="consolidated-workspace aor-consolidated" data-testid="aor-factors">
      <header className="consolidated-header consolidated-header-single">
        <div>
          <span className="consolidated-kicker"><Globe2 size={14} /> OPERATIONAL / ENVIRONMENTAL INTELLIGENCE</span>
          <h1>AOR Factors</h1>
          <p>One continuous operating-environment workspace combining geographic command intelligence with the exposure and human-performance conditions that shape occupational risk in the field.</p>
        </div>
        <div className="consolidated-domain-summary" aria-label="Workspace coverage">
          <span><Radar size={14} /><b>AOR / COMMAND</b><small>Geography · health · security · policy</small></span>
          <span><CloudSun size={14} /><b>EXPOSURE FACTORS</b><small>Heat · altitude · AQI · fatigue · PPE</small></span>
        </div>
      </header>

      <div className="consolidated-context-strip consolidated-context-strip-static">
        <span>01 Where the work occurs &amp; what is happening there</span>
        <i />
        <span>02 Environmental &amp; human-performance load</span>
        <i />
        <span>03 Governing limits → Standards Intelligence</span>
      </div>

      <section className="consolidated-domain-section aor-domain-section" aria-labelledby="aor-domain-title">
        <div className="consolidated-domain-heading">
          <span className="consolidated-domain-index">01</span>
          <div>
            <small>GEOGRAPHIC / COMMAND DOMAIN</small>
            <h2 id="aor-domain-title"><Radar size={17} /> AOR &amp; Command Intelligence</h2>
            <p>Combatant-command coverage, regional public-health context, operational/security signals, policy, and source timeline.</p>
          </div>
          <div className="consolidated-domain-signal"><i /> LIVE AOR PICTURE</div>
        </div>
        <div className="consolidated-domain-content">
          <AORIntelligence />
        </div>
      </section>

      <section className="consolidated-domain-section exposure-domain-section" aria-labelledby="exposure-domain-title">
        <div className="consolidated-domain-heading">
          <span className="consolidated-domain-index">02</span>
          <div>
            <small>EXPOSURE / HUMAN-PERFORMANCE DOMAIN</small>
            <h2 id="exposure-domain-title"><CloudSun size={17} /> Environmental &amp; Performance Factors</h2>
            <p>Heat, cold, altitude, air quality, fatigue, time-zone disruption, PPE burden, hydration, and other case-specific external load.</p>
          </div>
          <div className="consolidated-domain-signal"><i /> EXPOSURE LOAD</div>
        </div>
        <div className="consolidated-domain-content">
          <ExternalFactors />
        </div>
      </section>
    </div>
  );
}
