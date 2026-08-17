import { Activity, HeartPulse, Stethoscope } from 'lucide-react';
import InjuryIntelligence from './InjuryIntelligenceLive';
import ConditionIntelligence from './ConditionIntelligence';
import './consolidated-workspaces.css';

export default function InjuriesMedicalConditions() {
  return (
    <div className="consolidated-workspace clinical-consolidated" data-testid="injuries-medical-conditions">
      <header className="consolidated-header consolidated-header-single">
        <div>
          <span className="consolidated-kicker"><HeartPulse size={14} /> CLINICAL / OCCUPATIONAL HEALTH INTELLIGENCE</span>
          <h1>Injuries &amp; Medical Conditions</h1>
          <p>One continuous reviewer workspace combining occupation-linked injury surveillance, anatomical intelligence, and condition-specific clinical context. Governing thresholds and waiver logic remain centralized in Standards Intelligence.</p>
        </div>
        <div className="consolidated-domain-summary" aria-label="Workspace coverage">
          <span><Activity size={14} /><b>INJURY INTELLIGENCE</b><small>BLS · OSHA · anatomy · occupation demand</small></span>
          <span><Stethoscope size={14} /><b>MEDICAL CONDITIONS</b><small>Function · red flags · evidence · literature</small></span>
        </div>
      </header>

      <div className="consolidated-context-strip consolidated-context-strip-static">
        <span>01 Injury surveillance &amp; occupation interaction</span>
        <i />
        <span>02 Medical condition function &amp; evidence needs</span>
        <i />
        <span>03 Governing thresholds → Standards Intelligence</span>
      </div>

      <section className="consolidated-domain-section injury-domain-section" aria-labelledby="injury-domain-title">
        <div className="consolidated-domain-heading">
          <span className="consolidated-domain-index">01</span>
          <div>
            <small>OCCUPATIONAL INJURY DOMAIN</small>
            <h2 id="injury-domain-title"><Activity size={17} /> Injury Intelligence</h2>
            <p>Measured surveillance, severe-injury context, anatomy, occupation demand, and finding-to-job interaction.</p>
          </div>
          <div className="consolidated-domain-signal"><i /> BLS + OSHA + O*NET</div>
        </div>
        <div className="consolidated-domain-content">
          <InjuryIntelligence />
        </div>
      </section>

      <section className="consolidated-domain-section condition-domain-section" aria-labelledby="condition-domain-title">
        <div className="consolidated-domain-heading">
          <span className="consolidated-domain-index">02</span>
          <div>
            <small>CLINICAL CONDITION DOMAIN</small>
            <h2 id="condition-domain-title"><Stethoscope size={17} /> Medical Conditions</h2>
            <p>Condition function, clinical pressure points, questions to resolve, useful documentation, literature, and saved guidance.</p>
          </div>
          <div className="consolidated-domain-signal"><i /> CLINICAL CONTEXT</div>
        </div>
        <div className="consolidated-domain-content">
          <ConditionIntelligence />
        </div>
      </section>
    </div>
  );
}
