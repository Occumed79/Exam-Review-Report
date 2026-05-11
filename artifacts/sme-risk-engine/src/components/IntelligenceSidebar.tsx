import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, AlertTriangle, Search, Activity, Cpu, Globe, Pill } from 'lucide-react';
import { useStore } from '../lib/store';
import { calculateNuclearPowerLevel, getActiveAgents } from '../lib/nuclearWarheadAPIs';
import { DIRECT_SOURCE_AGENT_NAMES, fetchDirectSourceIntelligence, type DirectSourceFinding } from '../lib/directSourceIntelligence';
import type { RiskScore, SMECase } from '../lib/types';

const scoreWeight = (score: RiskScore): number => {
  if (score === 'U') return 1;
  return Number(score);
};

const findingColor = (source: DirectSourceFinding['source'], status: DirectSourceFinding['status']) => {
  if (status === 'error') return '#ef4444';
  if (source === 'PubMed') return '#9badc4';
  if (source === 'RxNav') return '#7f9d96';
  return '#b4d7d0';
};

const sourceIcon = (source: DirectSourceFinding['source']) => {
  if (source === 'RxNav') return Pill;
  if (source === 'PubMed') return Search;
  if (source === 'OSHA') return Shield;
  return Globe;
};

interface IntelligenceSidebarProps {
  activeCase?: SMECase;
}

export const IntelligenceSidebar: React.FC<IntelligenceSidebarProps> = ({ activeCase }) => {
  const { nuclearConfig } = useStore();
  const keyedAgents = getActiveAgents(nuclearConfig);
  const activeAgents = [...DIRECT_SOURCE_AGENT_NAMES, ...keyedAgents];
  const powerLevel = calculateNuclearPowerLevel(nuclearConfig);
  const [findings, setFindings] = useState<DirectSourceFinding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const aggregateScore = useMemo(() => {
    if (!activeCase?.riskScores.length) return 0;
    return activeCase.riskScores.reduce((sum, risk) => sum + scoreWeight(risk.score), 0) / activeCase.riskScores.length;
  }, [activeCase]);

  useEffect(() => {
    let cancelled = false;
    if (!activeCase) {
      setFindings([]);
      setCheckedAt(null);
      return;
    }

    setIsLoading(true);
    fetchDirectSourceIntelligence(activeCase)
      .then((result) => {
        if (cancelled) return;
        setFindings(result.findings);
        setCheckedAt(result.checkedAt);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeCase?.id, activeCase?.updatedAt]);

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="intelligence-sidebar"
      style={{
        width: '320px',
        height: '100vh',
        background: 'rgba(15, 20, 25, 0.4)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        overflowY: 'auto',
        position: 'fixed',
        right: 0,
        top: 0,
        zIndex: 40
      }}
    >
      <div className="glass-card" style={{ padding: '1rem', background: 'rgba(180, 215, 208, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Zap size={16} color="#b4d7d0" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b4d7d0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Source Intelligence Coverage
          </span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${powerLevel}%` }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #7f9d96, #b4d7d0)', borderRadius: '3px' }}
          />
        </div>
        <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', display: 'flex', justifyContent: 'space-between' }}>
          <span>{activeAgents.length} Source Agent(s)</span>
          <span>{DIRECT_SOURCE_AGENT_NAMES.length} free direct + {keyedAgents.length} keyed</span>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Cpu size={16} color="rgba(255,255,255,0.5)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Live Intelligence Feed
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <AnimatePresence mode="popLayout">
            {activeCase ? (
              <>
                {aggregateScore >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card"
                    style={{ padding: '0.875rem', borderLeft: '3px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)' }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <AlertTriangle size={16} color="#ef4444" style={{ marginTop: '0.125rem' }} />
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>Risk Review Needed</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                          Case risk score average is {aggregateScore.toFixed(1)}/3 for {activeCase.jobTitle || 'this role'}.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {isLoading && (
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Checking PubMed, RxNav, OSHA, and deployment guidance sources...</div>
                )}

                {findings.map((finding) => {
                  const Icon = sourceIcon(finding.source);
                  const color = findingColor(finding.source, finding.status);
                  return (
                    <motion.a
                      key={`${finding.source}-${finding.title}`}
                      href={finding.url}
                      target="_blank"
                      rel="noreferrer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card"
                      style={{ padding: '0.875rem', borderLeft: `3px solid ${color}`, background: 'rgba(255,255,255,0.03)', textDecoration: 'none', display: 'block' }}
                    >
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Icon size={16} color={color} style={{ marginTop: '0.125rem', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>{finding.source}: {finding.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                            {finding.summary}
                          </div>
                        </div>
                      </div>
                    </motion.a>
                  );
                })}

                {checkedAt && (
                  <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.28)', textAlign: 'right' }}>
                    Checked {new Date(checkedAt).toLocaleString()}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.2)' }}>
                <Activity size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <div style={{ fontSize: '0.8125rem' }}>Select a case to view source intelligence</div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1rem' }}>
        <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
          Available Intelligence Agents
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {activeAgents.map(agent => (
            <span
              key={agent}
              style={{
                fontSize: '0.625rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                background: DIRECT_SOURCE_AGENT_NAMES.includes(agent) ? 'rgba(180,215,208,0.08)' : 'rgba(255,255,255,0.05)',
                color: DIRECT_SOURCE_AGENT_NAMES.includes(agent) ? '#b4d7d0' : 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              {agent}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
