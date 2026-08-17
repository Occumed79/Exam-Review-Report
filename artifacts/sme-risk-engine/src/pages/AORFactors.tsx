import { useCallback, useEffect, useMemo, useState } from 'react';
import { CloudSun, Globe2, LoaderCircle, Radar, RefreshCw } from 'lucide-react';
import AORPublicIntelligence from './AORPublicIntelligence';
import ExternalFactors from './ExternalFactors';
import { fetchIntelligenceProviders, type ProviderStatusRecord } from '../lib/intelligenceApi';
import './consolidated-workspaces.css';

const AOR_PROVIDER_IDS = ['who_outbreaks', 'gdacs', 'usgs'] as const;
const PROVIDER_LABELS: Record<(typeof AOR_PROVIDER_IDS)[number], string> = {
  who_outbreaks: 'WHO Outbreaks',
  gdacs: 'GDACS',
  usgs: 'USGS Earthquakes',
};

function providerTone(status?: ProviderStatusRecord['status']) {
  if (status === 'connected' || status === 'public') return 'connected';
  if (status === 'degraded') return 'degraded';
  if (status === 'error' || status === 'not_configured') return 'error';
  return 'checking';
}

export default function AORFactors() {
  const [providerStatus, setProviderStatus] = useState<ProviderStatusRecord[]>([]);
  const [checkingProviders, setCheckingProviders] = useState(true);

  const refreshProviders = useCallback(async () => {
    setCheckingProviders(true);
    try {
      const result = await fetchIntelligenceProviders(true);
      setProviderStatus(result.providers);
    } catch {
      setProviderStatus([]);
    } finally {
      setCheckingProviders(false);
    }
  }, []);

  useEffect(() => {
    void refreshProviders();
  }, [refreshProviders]);

  const providerMap = useMemo(
    () => new Map(providerStatus.map((provider) => [provider.id, provider])),
    [providerStatus],
  );

  return (
    <div className="consolidated-workspace aor-consolidated" data-testid="aor-factors">
      <header className="consolidated-header consolidated-header-single">
        <div>
          <span className="consolidated-kicker"><Globe2 size={14} /> OPERATIONAL / ENVIRONMENTAL INTELLIGENCE</span>
          <h1>AOR Factors</h1>
          <p>One continuous operating-environment workspace combining geographic command intelligence with the exposure and human-performance conditions that shape occupational risk in the field.</p>
        </div>
        <div className="consolidated-domain-summary" aria-label="Workspace coverage">
          <span><Radar size={14} /><b>AOR / COMMAND</b><small>Geography · outbreaks · disasters · seismic activity</small></span>
          <span><CloudSun size={14} /><b>EXPOSURE FACTORS</b><small>Heat · altitude · AQI · fatigue · PPE</small></span>
        </div>
      </header>

      <div className="aor-provider-diagnostics" aria-label="Live intelligence provider diagnostics">
        <div className="aor-provider-diagnostics-label">
          <span>LIVE SOURCE DIAGNOSTICS</span>
          <small>Public no-key operational sources — active upstream checks</small>
        </div>
        <div className="aor-provider-diagnostics-grid">
          {AOR_PROVIDER_IDS.map((id) => {
            const provider = providerMap.get(id);
            const tone = checkingProviders && !provider ? 'checking' : providerTone(provider?.status);
            return (
              <div key={id} className="aor-provider-chip" data-tone={tone} title={provider?.error ?? `${PROVIDER_LABELS[id]} ${provider?.status ?? 'checking'}`}>
                <i />
                <span><strong>{PROVIDER_LABELS[id]}</strong><small>{checkingProviders && !provider ? 'checking' : provider?.status?.replace('_', ' ') ?? 'unavailable'}</small></span>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={() => void refreshProviders()} disabled={checkingProviders}>
          {checkingProviders ? <LoaderCircle size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          Recheck
        </button>
      </div>

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
            <p>Combatant-command coverage with WHO disease outbreaks, GDACS natural hazards, USGS seismic activity, and a command-scoped source timeline.</p>
          </div>
          <div className="consolidated-domain-signal"><i /> LIVE AOR PICTURE</div>
        </div>
        <div className="consolidated-domain-content">
          <AORPublicIntelligence />
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
