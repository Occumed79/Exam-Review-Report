import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Activity, Pill, Shield, Brain, Bone, ChevronRight, Search, Copy, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { fetchPubMedArticles } from '@/lib/directSourceIntelligence';
import type { ConditionCategory } from '@/lib/types';

// ─── Rich condition intelligence data ───────────────────────────────────────
const CONDITION_INTEL: Record<string, {
  label: string;
  subtitle: string;
  conditions: Array<{
    name: string;
    limitations: string[];
    safetyConcern: string;
    criticalTrigger: string;
    evidenceStrength: string;
    neutralObservation: string;
    riskSynthesis: string;
    providerQuestions: string[];
  }>;
}> = {
  cardiovascular: {
    label: 'Cardiovascular',
    subtitle: 'Cardiac Intelligence Path',
    conditions: [
      {
        name: 'Coronary Artery Disease',
        limitations: ['Exercise Intolerance', 'Angina on Exertion', 'Sudden Cardiac Event Risk', 'Fatigue'],
        safetyConcern: 'Risk of sudden cardiac event during heavy exertion, thermal stress, or emergency response. Medications (beta-blockers) may blunt heart rate response and reduce exertional tolerance.',
        criticalTrigger: 'MACE event within 12 months or ongoing unstable angina',
        evidenceStrength: 'High (NFPA 1582 / DOT)',
        neutralObservation: '"The examinee has a documented history of coronary artery disease, currently managed with [medications]. The most recent cardiac evaluation dated [Date] indicates [status]."',
        riskSynthesis: '"In the context of physically demanding or safety-sensitive duties, coronary artery disease presents risk of sudden incapacitation during exertion. Regulatory standards (NFPA 1582, DOT/FMCSA) establish fitness criteria based on functional capacity and event-free intervals."',
        providerQuestions: ['What is the date of the most recent cardiac event or intervention?', 'Has a current stress test or exercise tolerance evaluation been completed?', 'Is the examinee on anticoagulants or medications affecting heart rate response?', 'Does the treating cardiologist clear the examinee for [specific job demands]?'],
      },
      {
        name: 'Hypertension',
        limitations: ['Exertional Risk at Severe Stage', 'Medication Side Effects', 'Renal/CNS Complication Risk'],
        safetyConcern: 'Uncontrolled severe hypertension (Stage 3) poses risk of acute cardiovascular or cerebrovascular event. Antihypertensives may cause orthostatic hypotension or dizziness relevant to safety-sensitive work.',
        criticalTrigger: 'Sustained BP >180/110 mmHg or hypertensive urgency/emergency',
        evidenceStrength: 'High (JNC / DOT/FMCSA)',
        neutralObservation: '"The examinee carries a diagnosis of hypertension, currently managed with [medications]. Most recent recorded BP was [value] on [Date]."',
        riskSynthesis: '"For safety-sensitive or physically demanding roles, uncontrolled severe hypertension presents direct threat considerations. DOT/FMCSA requires BP below 180/110 for commercial driver medical certification."',
        providerQuestions: ['What is the current BP reading and trend over the last 3 months?', 'Is the examinee compliant with prescribed medications?', 'Are there end-organ effects (renal, retinal, cardiac)?', 'Does the treating provider consider BP adequately controlled for occupational demands?'],
      },
    ],
  },
  respiratory: {
    label: 'Respiratory',
    subtitle: 'Pulmonary Intelligence Path',
    conditions: [
      {
        name: 'Asthma / Reactive Airway Disease',
        limitations: ['Exertional Dyspnea', 'Bronchospasm Risk', 'Irritant Sensitivity', 'SCBA Tolerance'],
        safetyConcern: 'Bronchospasm triggered by exertion, cold air, irritants, or chemical exposure. SCBA use in firefighting or HAZMAT roles may be contraindicated with significant airway disease. Inhaler access in remote/austere environments is a deployment concern.',
        criticalTrigger: 'Hospitalization or ED visit for asthma within 12 months / FEV1 <60% predicted',
        evidenceStrength: 'High (NFPA 1582 / MOD)',
        neutralObservation: '"The examinee has a documented history of asthma, currently managed with [medications]. Most recent pulmonary function testing dated [Date] showed [results]."',
        riskSynthesis: '"For roles requiring SCBA use or work in environments with respiratory irritants, asthma requires individualized functional assessment. NFPA 1582 establishes specific spirometry thresholds for firefighter medical fitness."',
        providerQuestions: ['What is the current FEV1/FVC ratio from the most recent spirometry?', 'How frequently are rescue inhalers used per week?', 'Has the examinee tolerated SCBA or respirator use?', 'Are there known occupational or environmental triggers relevant to this role?'],
      },
      {
        name: 'COPD',
        limitations: ['Exertional Dyspnea', 'Reduced Aerobic Capacity', 'Hypoxia Risk', 'Exacerbation Vulnerability'],
        safetyConcern: 'COPD reduces aerobic reserve critical for emergency response and physical labor. High altitude or austere deployment environments may precipitate hypoxia. Acute exacerbations require medical intervention unavailable in remote settings.',
        criticalTrigger: 'GOLD Stage III/IV or exacerbation requiring hospitalization within 12 months',
        evidenceStrength: 'High (MOD / NFPA)',
        neutralObservation: '"The examinee has documented COPD, GOLD Stage [X], currently managed with [medications]. Most recent spirometry dated [Date] indicated FEV1 [value]."',
        riskSynthesis: '"COPD at moderate-severe stages significantly limits the aerobic capacity required for emergency response, heavy lifting, or physically demanding deployment duties. Exacerbation risk in austere environments without immediate medical access is a primary deployment concern."',
        providerQuestions: ['What is the current GOLD stage and most recent FEV1?', 'Has supplemental oxygen been prescribed or required?', 'What is the exacerbation history over the past 12 months?', 'Is the examinee able to tolerate aerobic exertion equivalent to [job standard]?'],
      },
    ],
  },
  neurologic: {
    label: 'Neurologic',
    subtitle: 'Neurologic Intelligence Path',
    conditions: [
      {
        name: 'Seizure Disorder',
        limitations: ['Sudden Incapacitation', 'Cognitive Impairment', 'Fatigue', 'Reaction Time'],
        safetyConcern: 'Primary concern is sudden loss of consciousness while operating heavy machinery, driving, or working at heights. Medication side effects (sedation) may further impair situational awareness.',
        criticalTrigger: 'Breakthrough seizure within 5 years',
        evidenceStrength: 'High (Regulatory Consensus)',
        neutralObservation: '"The examinee has a documented history of seizure disorder, currently managed with anticonvulsant therapy. The most recent event occurred in [Date], indicating a seizure-free period of [Duration]."',
        riskSynthesis: '"In the context of safety-sensitive duties, the primary clinical consideration is the risk of sudden incapacitation. Regulatory standards (e.g., FMCSA) typically require a specific seizure-free interval for such roles."',
        providerQuestions: ['What is the exact date of the last seizure event?', 'Is the patient compliant with the current medication regimen?', 'Are there any reported side effects affecting alertness?', 'Has a recent EEG or MRI been performed?'],
      },
      {
        name: 'TBI / Concussion History',
        limitations: ['Cognitive Processing Speed', 'Memory Impairment', 'Balance & Coordination', 'Light/Noise Sensitivity'],
        safetyConcern: 'Residual cognitive impairment from TBI may affect decision-making, reaction time, and situational awareness in safety-sensitive or emergency response roles. Second-impact risk relevant to high-risk physical occupations.',
        criticalTrigger: 'Moderate-severe TBI within 24 months or ongoing post-concussion syndrome',
        evidenceStrength: 'Moderate–High (VA/DoD, NFPA)',
        neutralObservation: '"The examinee has a documented history of TBI (Grade [X]) occurring [Date]. Current symptoms include [symptoms]. Neuropsychological evaluation dated [Date] indicated [results]."',
        riskSynthesis: '"For safety-sensitive or cognitively demanding roles, residual TBI sequelae require individualized neuropsychological assessment. Reaction time, executive function, and multitasking capacity are the primary occupational risk domains."',
        providerQuestions: ['What is the date and severity classification of the most recent TBI?', 'Has formal neuropsychological testing been completed?', 'Are there any current post-concussion symptoms?', 'Does the neurologist clear the examinee for safety-sensitive cognitive demands?'],
      },
    ],
  },
  endocrine: {
    label: 'Endocrine',
    subtitle: 'Metabolic Intelligence Path',
    conditions: [
      {
        name: 'Insulin-Dependent Diabetes (T1DM / T2DM on Insulin)',
        limitations: ['Hypoglycemia Risk', 'Hyperglycemia Impairment', 'Medication Refrigeration', 'Wound Healing'],
        safetyConcern: 'Hypoglycemic events can cause sudden incapacitation. Insulin storage is challenging in austere/deployment environments. DOT/FMCSA requires a federal diabetes exemption for insulin-treated commercial drivers.',
        criticalTrigger: 'Severe hypoglycemic episode within 12 months (requiring assistance)',
        evidenceStrength: 'High (DOT/FMCSA Exemption Program)',
        neutralObservation: '"The examinee has a documented history of insulin-dependent diabetes, currently managed with [regimen]. Most recent HbA1c dated [Date] was [value]."',
        riskSynthesis: '"Insulin-dependent diabetes in safety-sensitive roles requires assessment of hypoglycemia awareness, glucose monitoring capability, and medication access in the work environment. DOT/FMCSA requires an active federal diabetes exemption for insulin-treated CDL holders."',
        providerQuestions: ['What is the current HbA1c and trend?', 'Has the examinee experienced severe hypoglycemia (requiring assistance) in the past 12 months?', 'Does the examinee use a continuous glucose monitor?', 'Can insulin be safely stored/accessed in the specific work environment?'],
      },
    ],
  },
  orthopedic: {
    label: 'Orthopedic',
    subtitle: 'Musculoskeletal Intelligence Path',
    conditions: [
      {
        name: 'Lumbar Spine Disorder',
        limitations: ['Lifting Restriction', 'Prolonged Standing/Sitting', 'Bending/Twisting', 'Load-Bearing Capacity'],
        safetyConcern: 'Lumbar spine conditions may limit the ability to perform physically demanding essential functions including lifting, carrying, bending, or prolonged physical activity required in emergency response, operational, or labor-intensive roles.',
        criticalTrigger: 'Active radiculopathy with motor deficit or recent surgical intervention (<6 months)',
        evidenceStrength: 'Moderate (DOL / Functional Capacity Evaluation)',
        neutralObservation: '"The examinee has a documented history of lumbar spine disorder ([diagnosis]), with most recent imaging dated [Date]. Current functional status as reported by [provider] is [status]."',
        riskSynthesis: '"Lumbar spine conditions are evaluated against the specific physical demands of the position. A functional capacity evaluation (FCE) provides the most objective basis for determining job-specific lifting and activity tolerance."',
        providerQuestions: ['What are the current lifting restrictions, if any?', 'Has a functional capacity evaluation been completed?', 'Is there active radiculopathy with motor or sensory deficit?', 'Is the examinee cleared for the physical demands of [specific role]?'],
      },
    ],
  },
  psychiatric: {
    label: 'Psychiatric',
    subtitle: 'Behavioral Health Intelligence Path',
    conditions: [
      {
        name: 'PTSD / Acute Stress Disorder',
        limitations: ['Hypervigilance/Reactivity', 'Avoidance Behavior', 'Concentration Impairment', 'Medication Side Effects'],
        safetyConcern: 'PTSD may affect threat perception, decision-making under stress, and interpersonal functioning in high-pressure roles. Certain medications (benzodiazepines) are disqualifying for safety-sensitive roles. Deployment environments may serve as significant triggers.',
        criticalTrigger: 'Active severe symptoms with functional impairment or use of benzodiazepines',
        evidenceStrength: 'Moderate–High (VA/DoD / MOD)',
        neutralObservation: '"The examinee carries a diagnosis of PTSD, currently managed with [treatment]. A mental health evaluation dated [Date] documented [functional status]. The examinee [is/is not] on psychotropic medications."',
        riskSynthesis: '"For safety-sensitive, law enforcement, or deployment roles, PTSD is evaluated on the basis of symptom severity, functional status, medication profile, and the treating provider\'s opinion on fitness for specific occupational demands."',
        providerQuestions: ['What is the current PCL-5 or equivalent symptom severity score?', 'Is the examinee on any medications with sedating or cognitively impairing effects?', 'Does the treating provider have concerns about fitness for [specific role demands]?', 'Has there been any psychiatric hospitalization in the past 12 months?'],
      },
    ],
  },
};

const CAT_ICONS: Record<string, React.ReactNode> = {
  cardiovascular: <Heart size={16} />,
  respiratory: <Activity size={16} />,
  neurologic: <Brain size={16} />,
  endocrine: <Pill size={16} />,
  orthopedic: <Bone size={16} />,
  psychiatric: <Shield size={16} />,
};

const STANDARDS_BY_CATEGORY: Record<string, string[]> = {
  cardiovascular: ['NFPA 1582 §6.4', 'DOT/FMCSA §391.41(b)(4)', 'FAA Class 1/2/3', 'MOD JSP 950'],
  respiratory: ['NFPA 1582 §6.8', 'OSHA Respirator Standard 29 CFR 1910.134', 'MOD JSP 950 Annex F', 'DOT/FMCSA §391.41(b)(5)'],
  neurologic: ['DOT/FMCSA §391.41(b)(8)', 'FAA Seizure Policy', 'NFPA 1582 §6.9', 'MOD Deployment Standards'],
  endocrine: ['DOT/FMCSA Federal Diabetes Exemption', 'NFPA 1582 §6.6', 'FAA Special Issuance', 'MOD JSP 950'],
  orthopedic: ['DOL ADA Functional Capacity Standards', 'NFPA 1582 §6.11', 'DOT/FMCSA §391.41(b)(1)', 'OSHA 29 CFR 1926'],
  psychiatric: ['DOT/FMCSA §391.41(b)(9)', 'NFPA 1582 §6.14', 'MOD JSP 950 Chapter 3', 'FAA Psychiatric Policy'],
};

export default function GuidelineLibrary() {
  const { guidelines } = useStore();
  const [selectedCat, setSelectedCat] = useState<string>('neurologic');
  const [selectedCondIdx, setSelectedCondIdx] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const intel = CONDITION_INTEL[selectedCat];
  const cond = intel?.conditions[selectedCondIdx];

  // Guidelines from store filtered by category
  const relatedGuidelines = useMemo(() =>
    guidelines.filter(g => g.conditionCategory === selectedCat || g.conditionCategory === 'other'),
    [guidelines, selectedCat]
  );

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const [pubmedArticles, setPubmedArticles] = React.useState<Array<{pmid: string; title: string; journal: string; year: string; url: string}>>([]);
  const [pubmedLoading, setPubmedLoading] = React.useState(false);

  React.useEffect(() => {
    if (!cond) return;
    let cancelled = false;
    setPubmedLoading(true);
    setPubmedArticles([]);
    const query = `${cond.name} occupational medicine fitness for duty`;
    fetchPubMedArticles(query, 4).then(articles => {
      if (!cancelled) { setPubmedArticles(articles); setPubmedLoading(false); }
    });
    return () => { cancelled = true; };
  }, [selectedCat, selectedCondIdx]);

  const filteredCategories = Object.entries(CONDITION_INTEL).filter(([, v]) =>
    !search || v.label.toLowerCase().includes(search.toLowerCase()) ||
    v.conditions.some(c => c.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#f4efdc', letterSpacing: '-0.03em', margin: 0 }}>
            CONDITION INTELLIGENCE
          </h1>
          <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
            Clinical Intelligence Atlas & Risk Pathways
          </p>
        </div>
        <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.625rem', borderRadius: '12px' }}>
          <Search size={14} style={{ color: 'rgba(255,255,255,0.35)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedCondIdx(0); }}
            placeholder="Search Conditions..."
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.8125rem', color: '#f4efdc', width: '220px' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 300px', gap: '1rem', flex: 1, minHeight: 0 }}>
        {/* Left: Category Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', overflowY: 'auto' }}>
          {filteredCategories.map(([catId, catData]) => (
            <button
              key={catId}
              onClick={() => { setSelectedCat(catId); setSelectedCondIdx(0); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: '12px', cursor: 'pointer',
                border: selectedCat === catId ? '1px solid rgba(180,215,208,0.30)' : '1px solid rgba(255,255,255,0.06)',
                background: selectedCat === catId ? 'rgba(180,215,208,0.10)' : 'rgba(255,255,255,0.03)',
                textAlign: 'left', transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: selectedCat === catId ? 'rgba(180,215,208,0.20)' : 'rgba(255,255,255,0.05)',
                color: selectedCat === catId ? '#b4d7d0' : 'rgba(255,255,255,0.35)',
              }}>
                {CAT_ICONS[catId]}
              </div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: selectedCat === catId ? '#b4d7d0' : 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {catData.label}
              </span>
              <ChevronRight size={12} style={{ marginLeft: 'auto', color: selectedCat === catId ? '#b4d7d0' : 'rgba(255,255,255,0.2)' }} />
            </button>
          ))}
        </div>

        {/* Center: Condition Detail */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <AnimatePresence mode="wait">
            {intel && cond ? (
              <motion.div key={selectedCat + selectedCondIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Condition picker if multiple */}
                {intel.conditions.length > 1 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {intel.conditions.map((c, idx) => (
                      <button key={idx} onClick={() => setSelectedCondIdx(idx)}
                        className={idx === selectedCondIdx ? 'tab-btn active-tab' : 'tab-btn'}
                        style={{ fontSize: '0.75rem' }}>{c.name}</button>
                    ))}
                  </div>
                )}

                {/* Main condition card */}
                <div className="glass-card" style={{ borderRadius: '14px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f4efdc', margin: '0 0 0.25rem', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>{cond.name}</h2>
                      <p style={{ fontSize: '0.6875rem', color: '#b4d7d0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{intel.subtitle}</p>
                    </div>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(180,215,208,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b4d7d0' }}>
                      {CAT_ICONS[selectedCat]}
                    </div>
                  </div>

                  <section style={{ marginBottom: '1.25rem' }}>
                    <div className="section-label" style={{ marginBottom: '0.5rem' }}>Functional Limitations</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {cond.limitations.map(tag => (
                        <span key={tag} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '6px', padding: '0.25rem 0.625rem', fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.70)' }}>{tag}</span>
                      ))}
                    </div>
                  </section>

                  <section style={{ marginBottom: '1.25rem' }}>
                    <div className="section-label" style={{ marginBottom: '0.5rem' }}>Safety-Sensitive Concerns</div>
                    <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0 }}>{cond.safetyConcern}</p>
                  </section>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: '10px', padding: '0.875rem' }}>
                      <div style={{ fontSize: '0.625rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Critical Trigger</div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.80)' }}>{cond.criticalTrigger}</div>
                    </div>
                    <div style={{ background: 'rgba(180,215,208,0.06)', border: '1px solid rgba(180,215,208,0.20)', borderRadius: '10px', padding: '0.875rem' }}>
                      <div style={{ fontSize: '0.625rem', fontWeight: 700, color: '#b4d7d0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Evidence Strength</div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.80)' }}>{cond.evidenceStrength}</div>
                    </div>
                  </div>
                </div>

                {/* Report-Ready Language */}
                <div className="glass-card" style={{ borderRadius: '14px', padding: '1.25rem' }}>
                  <div className="section-label" style={{ marginBottom: '0.75rem' }}>Report-Ready Language</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {[
                      { label: 'Neutral Observation', text: cond.neutralObservation, key: 'neutral' },
                      { label: 'Risk Synthesis', text: cond.riskSynthesis, key: 'risk' },
                    ].map(({ label, text, key }) => (
                      <div key={key} style={{ position: 'relative', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.875rem 2.5rem 0.875rem 0.875rem' }}>
                        <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>{label}</div>
                        <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.65)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>{text}</p>
                        <button
                          onClick={() => copyText(text, key + selectedCat + selectedCondIdx)}
                          style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: copied === key + selectedCat + selectedCondIdx ? '#b4d7d0' : 'rgba(255,255,255,0.3)', padding: 0 }}
                        >
                          {copied === key + selectedCat + selectedCondIdx ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Provider Questions */}
                <div className="glass-card" style={{ borderRadius: '14px', padding: '1.25rem' }}>
                  <div className="section-label" style={{ marginBottom: '0.75rem' }}>Suggested Provider Questions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {cond.providerQuestions.map((q, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', flexShrink: 0, marginTop: '1px' }}>{i + 1}</div>
                        <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.70)', lineHeight: 1.5, margin: 0 }}>{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.35)', padding: '2rem', textAlign: 'center' }}>Select a category</div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Standards + Store Guidelines */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Relevant Standards */}
          <div className="glass-card" style={{ borderRadius: '14px', padding: '1rem' }}>
            <div className="section-label" style={{ marginBottom: '0.625rem' }}>Relevant Standards</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {(STANDARDS_BY_CATEGORY[selectedCat] || []).map(std => (
                <div key={std} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
                  onClick={() => {}}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.80)' }}>{std}</span>
                  <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.25)' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Guidelines from store */}
          <div className="glass-card" style={{ borderRadius: '14px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
              <div className="section-label">Your Saved Guidelines</div>
              <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{relatedGuidelines.length} match</span>
            </div>
            {relatedGuidelines.length === 0 ? (
              <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', padding: '0.75rem 0', textAlign: 'center' }}>
                No saved guidelines for this category.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {relatedGuidelines.map(g => (
                  <div key={g.id} style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f4efdc', marginBottom: '0.25rem' }}>{g.sourceName}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.45)' }}>{g.agency} · {g.versionDate}</div>
                    {g.summary && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.375rem', lineHeight: 1.5, margin: '0.375rem 0 0' }}>{g.summary}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
