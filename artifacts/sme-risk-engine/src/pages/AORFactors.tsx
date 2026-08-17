import { useState } from 'react';
import { CloudSun, Globe2, Radar } from 'lucide-react';
import AORIntelligence from './AORIntelligence';
import ExternalFactors from './ExternalFactors';
import './consolidated-workspaces.css';

type View = 'aor' | 'exposures';

export default function AORFactors({ initialView = 'aor' }: { initialView?: View }) {
  const [view, setView] = useState<View>(initialView);

  return (
    <div className="consolidated-workspace aor-consolidated" data-testid="aor-factors">
      <header className="consolidated-header">
        <div>
          <span className="consolidated-kicker"><Globe2 size={14} /> OPERATIONAL / ENVIRONMENTAL INTELLIGENCE</span>
          <h1>AOR Factors</h1>
          <p>One workspace for the operating environment: geographic command context on one side, case-specific exposure and human-performance modifiers on the other.</p>
        </div>
        <div className="consolidated-switcher" role="tablist" aria-label="AOR factor views">
          <button role="tab" aria-selected={view === 'aor'} className={view === 'aor' ? 'active' : ''} onClick={() => setView('aor')}>
            <Radar size={15} /><span><strong>AOR / Command</strong><small>Geography · health · security · policy</small></span>
          </button>
          <button role="tab" aria-selected={view === 'exposures'} className={view === 'exposures' ? 'active' : ''} onClick={() => setView('exposures')}>
            <CloudSun size={15} /><span><strong>Exposure Factors</strong><small>Heat · altitude · AQI · fatigue · PPE</small></span>
          </button>
        </div>
      </header>

      <div className="consolidated-context-strip">
        <span className={view === 'aor' ? 'active' : ''}>01 Where the work occurs & what is happening there</span>
        <i />
        <span className={view === 'exposures' ? 'active' : ''}>02 What the environment does to human performance</span>
        <i />
        <span>03 Standards Intelligence handles governing limits</span>
      </div>

      <section className={`consolidated-view view-${view}`}>
        {view === 'aor' ? <AORIntelligence /> : <ExternalFactors />}
      </section>
    </div>
  );
}
