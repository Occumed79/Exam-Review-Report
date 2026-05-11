import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Activity, Briefcase, Globe, AlertCircle, CheckCircle2, FileText, Zap } from 'lucide-react';
import { SMECase, RiskScore } from '../../lib/types';

interface MasterDossierProps {
  caseData: SMECase;
}

const scoreToPercent = (score: RiskScore): number => {
  if (score === 'U') return 50;
  return Math.min(100, Math.max(0, Math.round((Number(score) / 3) * 100)));
};

const scoreColor = (score: RiskScore): string => {
  if (score === 'U') return '#f59e0b';
  if (score >= 3) return '#ef4444';
  if (score === 2) return '#f59e0b';
  return '#10b981';
};

const complianceTone = (caseData: SMECase) => {
  const highRisk = caseData.riskScores.some((risk) => risk.score === 3);
  const missingDocs = caseData.documentationGaps.filter((gap) => gap.severity === 'high' || gap.severity === 'moderate');
  if (missingDocs.length) return { color: '#f59e0b', label: 'Records Needed', icon: AlertCircle };
  if (highRisk) return { color: '#ef4444', label: 'SME Risk Review Needed', icon: AlertCircle };
  return { color: '#10b981', label: 'Ready for SME Review', icon: CheckCircle2 };
};

export const MasterDossier: React.FC<MasterDossierProps> = ({ caseData }) => {
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const jobDuties = [
    ...caseData.jobDuties.physicalDemands,
    ...caseData.jobDuties.cognitiveDemands,
    ...caseData.jobDuties.environmentalDemands,
  ].filter(Boolean);
  const uniqueJobDuties = Array.from(new Set(jobDuties));
  const riskPercentages = caseData.riskScores.map((risk) => scoreToPercent(risk.score));
  const aggregateRisk = riskPercentages.length
    ? Math.round(riskPercentages.reduce((sum, risk) => sum + risk, 0) / riskPercentages.length)
    : 0;
  const compliance = complianceTone(caseData);
  const ComplianceIcon = compliance.icon;
  const standards = caseData.standards?.selected?.length ? caseData.standards.selected : [caseData.agencyStandard].filter(Boolean);
  const docConfidence = caseData.documentationGaps.length === 0
    ? 90
    : Math.max(20, 90 - caseData.documentationGaps.length * 12 - caseData.documentationGaps.filter((gap) => gap.severity === 'high').length * 10);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <motion.div variants={item} className="glass-card" style={{ padding: '1.5rem', background: 'rgba(180, 215, 208, 0.05)', borderLeft: '4px solid #b4d7d0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b4d7d0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              Executive Intelligence Briefing
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
              {caseData.examineeName || 'Unnamed Examinee'} — {caseData.jobTitle || 'Job title pending'}
            </h2>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', flexWrap: 'wrap' }}>
              <span>Case: {caseData.caseId}</span>
              <span>Status: {caseData.status}</span>
              <span>Standard: {standards.join(', ') || 'Pending'}</span>
              <span>Employer: {caseData.employer || 'Pending'}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: aggregateRisk >= 67 ? '#ef4444' : aggregateRisk >= 34 ? '#f59e0b' : '#b4d7d0', lineHeight: 1 }}>
              {aggregateRisk}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>Aggregate Risk Index</div>
          </div>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <motion.div variants={item} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Activity size={18} color="#b4d7d0" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Clinical Intelligence</h3>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {caseData.medicalConditions.length ? caseData.medicalConditions.map(condition => (
                <div key={condition.id} style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '1rem' }}>
                    <span style={{ fontWeight: 700, color: '#fff' }}>{condition.conditionName}</span>
                    <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '4px', background: 'rgba(180,215,208,0.1)', color: '#b4d7d0' }}>
                      {condition.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.58)', lineHeight: 1.5 }}>
                    Incapacitation Risk: <span style={{ color: '#fff' }}>{condition.incapacitationRisk}</span>. Recurrence Risk: <span style={{ color: '#fff' }}>{condition.recurrenceRisk}</span>.
                    {condition.recentLabs ? ` Recent labs: ${condition.recentLabs}.` : ' Objective stability documentation should be verified.'}
                  </p>
                </div>
              )) : (
                <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.58)' }}>
                  No medical conditions have been entered or extracted yet.
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={item} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Briefcase size={18} color="#9badc4" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Occupational Demands</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem' }}>Essential Functions</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{uniqueJobDuties.length}</div>
                <div style={{ fontSize: '0.75rem', color: '#9badc4', marginTop: '0.25rem' }}>Demands Identified</div>
              </div>
              <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem' }}>Safety Sensitivity</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{uniqueJobDuties.some((d) => /weapon|drive|fire|respirator|hazard|confined|height/i.test(d)) ? 'High' : 'Assess'}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>Derived from duties</div>
              </div>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
              {caseData.jobDuties.essentialFunctions || uniqueJobDuties.join('; ') || 'Official essential functions are not yet documented.'}
            </p>
          </motion.div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <motion.div variants={item} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Shield size={18} color="#ef4444" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Risk Assessment</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {caseData.riskScores.length ? caseData.riskScores.map(risk => {
                const pct = scoreToPercent(risk.score);
                const color = scoreColor(risk.score);
                return (
                  <div key={`${risk.category}-${risk.score}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{risk.category}</span>
                      <span style={{ color, fontWeight: 700 }}>{risk.score === 'U' ? 'Unclear' : `${risk.score}/3`}</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              }) : (
                <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)' }}>No risk score rows have been created yet.</div>
              )}
            </div>
          </motion.div>

          <motion.div variants={item} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Globe size={18} color="#3b82f6" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Compliance Status</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: compliance.color }}>
                <ComplianceIcon size={14} />
                <span>{compliance.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#f59e0b' }}>
                <AlertCircle size={14} />
                <span>Deployment: {caseData.deploymentCountry || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>
                <FileText size={14} />
                <span>Documentation Confidence: {docConfidence}%</span>
              </div>
            </div>
          </motion.div>

          <motion.button
            variants={item}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="glow-btn"
            style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '0.875rem' }}
            onClick={() => window.dispatchEvent(new CustomEvent('generate-case-report', { detail: { caseId: caseData.id } }))}
            type="button"
          >
            <Zap size={16} />
            Generate Source-Backed Report
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
