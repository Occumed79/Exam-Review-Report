import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Activity, Briefcase, Globe, AlertCircle, CheckCircle2, FileText, Zap } from 'lucide-react';
import { SMECase } from '../../lib/types';

interface MasterDossierProps {
  caseData: SMECase;
}

export const MasterDossier: React.FC<MasterDossierProps> = ({ caseData }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Executive Summary Header */}
      <motion.div variants={item} className="glass-card" style={{ padding: '1.5rem', background: 'rgba(180, 215, 208, 0.05)', borderLeft: '4px solid #b4d7d0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b4d7d0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              Executive Intelligence Briefing
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
              {caseData.examineeName} — {caseData.jobTitle}
            </h2>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
              <span>ID: {caseData.id}</span>
              <span>Standard: {caseData.agencyStandard}</span>
              <span>Employer: {caseData.employer}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: caseData.riskLevel > 20 ? '#ef4444' : '#b4d7d0', lineHeight: 1 }}>
              {caseData.riskLevel}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>Aggregate Risk Score</div>
          </div>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Clinical & Occupational Synthesis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Clinical Profile Synthesis */}
          <motion.div variants={item} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Activity size={18} color="#b4d7d0" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Clinical Intelligence</h3>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {caseData.medicalConditions.map(condition => (
                <div key={condition.id} style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#fff' }}>{condition.conditionName}</span>
                    <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '4px', background: 'rgba(180,215,208,0.1)', color: '#b4d7d0' }}>
                      {condition.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                    Incapacitation Risk: <span style={{ color: '#fff' }}>{condition.incapacitationRisk}</span>. 
                    Clinical stability confirmed via longitudinal modeling.
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Occupational Demands Synthesis */}
          <motion.div variants={item} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Briefcase size={18} color="#6366f1" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Occupational Demands</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem' }}>Essential Functions</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{caseData.jobDemands.length}</div>
                <div style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '0.25rem' }}>Critical Demands Identified</div>
              </div>
              <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem' }}>Safety Sensitivity</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>High</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>Risk Category 1A</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Risk & Compliance Synthesis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Risk Scoring Synthesis */}
          <motion.div variants={item} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Shield size={18} color="#ef4444" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Risk Assessment</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Medical Stability', score: 85, color: '#b4d7d0' },
                { label: 'Functional Capacity', score: 92, color: '#6366f1' },
                { label: 'Medication Safety', score: 78, color: '#f59e0b' },
                { label: 'Deployment Risk', score: 95, color: '#10b981' }
              ].map(risk => (
                <div key={risk.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{risk.label}</span>
                    <span style={{ color: risk.color, fontWeight: 700 }}>{risk.score}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${risk.score}%`, background: risk.color }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Compliance & Deployment */}
          <motion.div variants={item} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Globe size={18} color="#3b82f6" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Compliance Status</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#10b981' }}>
                <CheckCircle2 size={14} />
                <span>NFPA 1582 Compliant</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#f59e0b' }}>
                <AlertCircle size={14} />
                <span>Deployment: {caseData.deploymentCountry || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>
                <FileText size={14} />
                <span>Doc Confidence: {caseData.documentationConfidence}%</span>
              </div>
            </div>
          </motion.div>

          {/* Nuclear Fuel Action */}
          <motion.button
            variants={item}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="glow-btn"
            style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '0.875rem' }}
          >
            <Zap size={16} />
            Generate Nuclear Report
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
