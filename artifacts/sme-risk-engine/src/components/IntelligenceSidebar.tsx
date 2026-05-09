import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, AlertTriangle, Search, Activity, Cpu, Globe } from 'lucide-react';
import { useStore } from '../lib/store';
import { calculateNuclearPowerLevel, getActiveAgents } from '../lib/nuclearWarheadAPIs';

export const IntelligenceSidebar: React.FC = () => {
  const { cases, activeCaseId, nuclearConfig } = useStore();
  const activeCase = cases.find(c => c.id === activeCaseId);
  const powerLevel = calculateNuclearPowerLevel(nuclearConfig);
  const activeAgents = getActiveAgents(nuclearConfig);

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
      {/* Nuclear Power Status */}
      <div className="glass-card" style={{ padding: '1rem', background: 'rgba(180, 215, 208, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Zap size={16} color="#b4d7d0" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b4d7d0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Nuclear Power Level
          </span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${powerLevel}%` }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #b4d7d0, #6366f1)', borderRadius: '3px' }}
          />
        </div>
        <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.4)', display: 'flex', justifyContent: 'space-between' }}>
          <span>{activeAgents.length} Agents Active</span>
          <span>{Math.round(powerLevel)}% Capacity</span>
        </div>
      </div>

      {/* Live Intelligence Feed */}
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
                {/* Risk Alerts */}
                {activeCase.riskLevel > 15 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card"
                    style={{ padding: '0.875rem', borderLeft: '3px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)' }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <AlertTriangle size={16} color="#ef4444" style={{ marginTop: '0.125rem' }} />
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>High Risk Detected</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                          Case risk level ({activeCase.riskLevel}%) exceeds safety threshold for {activeCase.jobTitle}.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Research Insights */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card"
                  style={{ padding: '0.875rem', borderLeft: '3px solid #6366f1', background: 'rgba(99, 102, 241, 0.05)' }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Search size={16} color="#6366f1" style={{ marginTop: '0.125rem' }} />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>Clinical Research</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                        Tavily found 4 recent studies regarding {activeCase.medicalConditions[0]?.conditionName || 'occupational health'}.
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Regulatory Updates */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card"
                  style={{ padding: '0.875rem', borderLeft: '3px solid #b4d7d0', background: 'rgba(180, 215, 208, 0.05)' }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Globe size={16} color="#b4d7d0" style={{ marginTop: '0.125rem' }} />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>Regulatory Update</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
                        New OSHA guidelines detected for {activeCase.agencyStandard} compliance.
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.2)' }}>
                <Activity size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <div style={{ fontSize: '0.8125rem' }}>Select a case to view live intelligence</div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Active Agents List */}
      <div className="glass-card" style={{ padding: '1rem' }}>
        <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
          Active Intelligence Agents
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {activeAgents.map(agent => (
            <span
              key={agent}
              style={{
                fontSize: '0.625rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.6)',
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
