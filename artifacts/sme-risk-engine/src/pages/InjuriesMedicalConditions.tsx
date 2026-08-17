import { useState } from 'react';
import { Activity, HeartPulse, Stethoscope } from 'lucide-react';
import InjuryIntelligence from './InjuryIntelligenceLive';
import ConditionIntelligence from './ConditionIntelligence';
import './consolidated-workspaces.css';

type View = 'injuries' | 'conditions';

export default function InjuriesMedicalConditions({ initialView = 'injuries' }: { initialView?: View }) {
  const [view, setView] = useState<View>(initialView);

  return (
    <div className="consolidated-workspace clinical-consolidated" data-testid="injuries-medical-conditions">
      <header className="consolidated-header">
        <div>
          <span className="consolidated-kicker"><HeartPulse size={14} /> CLINICAL / OCCUPATIONAL HEALTH INTELLIGENCE</span>
          <h1>Injuries & Medical Conditions</h1>
          <p>One clinical intelligence workspace for occupational injury patterns and condition-specific medical review context. Switch views without leaving the case domain.</p>
        </div>
        <div className="consolidated-switcher" role="tablist" aria-label="Injury and medical condition views">
          <button role="tab" aria-selected={view === 'injuries'} className={view === 'injuries' ? 'active' : ''} onClick={() => setView('injuries')}>
            <Activity size={15} /><span><strong>Injuries</strong><small>BLS · OSHA · anatomy · job demand</small></span>
          </button>
          <button role="tab" aria-selected={view === 'conditions'} className={view === 'conditions' ? 'active' : ''} onClick={() => setView('conditions')}>
            <Stethoscope size={15} /><span><strong>Medical Conditions</strong><small>Clinical context · red flags · evidence</small></span>
          </button>
        </div>
      </header>

      <div className="consolidated-context-strip">
        <span className={view === 'injuries' ? 'active' : ''}>01 Injury surveillance & occupation interaction</span>
        <i />
        <span className={view === 'conditions' ? 'active' : ''}>02 Condition function & evidence needs</span>
        <i />
        <span>03 Governing thresholds remain in Standards Intelligence</span>
      </div>

      <section className={`consolidated-view view-${view}`}>
        {view === 'injuries' ? <InjuryIntelligence /> : <ConditionIntelligence />}
      </section>
    </div>
  );
}
