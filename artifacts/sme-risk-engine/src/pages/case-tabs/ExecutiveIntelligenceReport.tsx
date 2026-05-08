import React, { useMemo, useRef, useState } from "react";
import { Download, TrendingUp, AlertTriangle, CheckCircle, Scale, BarChart3, Zap } from "lucide-react";
import { SMECase } from "@/lib/types";
import { calculateAdvancedRisk, RiskProbabilityResult } from "@/lib/advancedRiskEngine";
import { getRelevantHistoricalIncidents, getOccupationalStatistics, calculateComparativeRisk } from "@/lib/caseHistoryDatabase";

interface Props {
  caseData: SMECase;
  onUpdate: (updates: Partial<SMECase>) => void;
}

export default function ExecutiveIntelligenceReport({ caseData, onUpdate }: Props) {
  const [showReport, setShowReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const riskAnalysis = useMemo(() => calculateAdvancedRisk(caseData), [caseData]);
  const historicalIncidents = useMemo(() => getRelevantHistoricalIncidents(caseData.jobTitle), [caseData.jobTitle]);
  const occupationalStats = useMemo(() => getOccupationalStatistics(caseData.jobTitle), [caseData.jobTitle]);
  const comparativeRisk = useMemo(
    () => caseData.medicalConditions.length > 0 
      ? calculateComparativeRisk(caseData.jobTitle, caseData.medicalConditions[0].conditionName)
      : { baselineRisk: 0.15, conditionRisk: 0.15, relativeRisk: 1 },
    [caseData.jobTitle, caseData.medicalConditions]
  );

  const getRiskColor = (score: number) => {
    if (score >= 70) return "#ef4444"; // red
    if (score >= 40) return "#f59e0b"; // amber
    return "#22c55e"; // green
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return "HIGH RISK";
    if (score >= 40) return "MODERATE RISK";
    return "LOW RISK";
  };

  const buildExecutiveReport = (): string => {
    const today = new Date().toLocaleDateString();
    const riskColor = getRiskColor(riskAnalysis.overallRiskScore);
    const riskLabel = getRiskLabel(riskAnalysis.overallRiskScore);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Executive Intelligence Report - ${caseData.caseId}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Georgia', serif; color: #1a1a2e; background: #f5f5f5; }
          .report { max-width: 8.5in; height: 11in; margin: 20px auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0a0f1e; padding-bottom: 20px; }
          .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 5px; }
          .header p { font-size: 12px; color: #666; }
          .risk-banner { display: flex; align-items: center; justify-content: space-between; padding: 15px; border-radius: 8px; margin-bottom: 20px; background: rgba(0,0,0,0.02); border-left: 5px solid ${riskColor}; }
          .risk-score { font-size: 32px; font-weight: 700; color: ${riskColor}; }
          .risk-label { font-size: 14px; font-weight: 700; color: ${riskColor}; text-transform: uppercase; letter-spacing: 1px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: 700; color: #0a0f1e; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #0a0f1e; padding-bottom: 8px; margin-bottom: 12px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
          .metric-box { background: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb; }
          .metric-label { font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
          .metric-value { font-size: 18px; font-weight: 700; color: #0a0f1e; margin-top: 4px; }
          .probability-bar { width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin-top: 6px; }
          .probability-fill { height: 100%; background: ${riskColor}; border-radius: 4px; }
          .risk-factor { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
          .risk-factor-name { font-weight: 600; }
          .risk-factor-prob { font-weight: 700; color: ${riskColor}; }
          .legal-box { background: #f0f4ff; padding: 12px; border-radius: 6px; border-left: 4px solid #3b82f6; font-size: 11px; line-height: 1.5; }
          .timeline { display: flex; justify-content: space-between; margin-top: 10px; }
          .timeline-item { flex: 1; text-align: center; padding: 10px; background: #f9fafb; border-radius: 6px; margin-right: 10px; }
          .timeline-item:last-child { margin-right: 0; }
          .timeline-period { font-size: 11px; font-weight: 600; color: #666; }
          .timeline-prob { font-size: 16px; font-weight: 700; margin-top: 4px; }
          .recommendation { padding: 10px; margin-bottom: 8px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; font-size: 11px; line-height: 1.5; }
          .footer { margin-top: 20px; padding-top: 15px; border-top: 2px solid #0a0f1e; font-size: 10px; color: #666; text-align: center; }
          .case-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px; margin-bottom: 15px; }
          .case-info-item { }
          .case-info-label { font-weight: 600; color: #666; }
          .case-info-value { font-weight: 700; }
          @media print { body { background: white; } .report { box-shadow: none; margin: 0; } }
        </style>
      </head>
      <body>
        <div class="report">
          <div class="header">
            <h1>EXECUTIVE INTELLIGENCE REPORT</h1>
            <p>Occupational Health Risk Assessment & Legal Analysis</p>
          </div>

          <div class="case-info">
            <div class="case-info-item"><span class="case-info-label">Case ID:</span> <span class="case-info-value">${caseData.caseId}</span></div>
            <div class="case-info-item"><span class="case-info-label">Examinee:</span> <span class="case-info-value">${caseData.examineeName}</span></div>
            <div class="case-info-item"><span class="case-info-label">Position:</span> <span class="case-info-value">${caseData.jobTitle}</span></div>
            <div class="case-info-item"><span class="case-info-label">Report Date:</span> <span class="case-info-value">${today}</span></div>
          </div>

          <div class="risk-banner">
            <div>
              <div class="risk-label">${riskLabel}</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">Overall Risk Score</div>
            </div>
            <div class="risk-score">${riskAnalysis.overallRiskScore}%</div>
          </div>

          <div class="grid">
            <div class="metric-box">
              <div class="metric-label">Injury Probability</div>
              <div class="metric-value">${Math.round(riskAnalysis.injuryProbability * 100)}%</div>
              <div class="probability-bar">
                <div class="probability-fill" style="width: ${riskAnalysis.injuryProbability * 100}%"></div>
              </div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Aggravation Probability</div>
              <div class="metric-value">${Math.round(riskAnalysis.aggravationProbability * 100)}%</div>
              <div class="probability-bar">
                <div class="probability-fill" style="width: ${riskAnalysis.aggravationProbability * 100}%"></div>
              </div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Direct Threat Score</div>
              <div class="metric-value">${riskAnalysis.directThreatScore}</div>
              <div class="probability-bar">
                <div class="probability-fill" style="width: ${riskAnalysis.directThreatScore}%"></div>
              </div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Comparative Risk</div>
              <div class="metric-value">${comparativeRisk.relativeRisk.toFixed(1)}x</div>
              <div style="font-size: 10px; color: #666; margin-top: 4px;">vs. baseline occupational</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Risk Factors</div>
            ${riskAnalysis.riskFactors.slice(0, 5).map(f => `
              <div class="risk-factor">
                <span class="risk-factor-name">${f.name}</span>
                <span class="risk-factor-prob">${Math.round(f.probability * 100)}%</span>
              </div>
            `).join("")}
          </div>

          <div class="section">
            <div class="section-title">Risk Timeline</div>
            <div class="timeline">
              ${riskAnalysis.timeline.map(t => `
                <div class="timeline-item">
                  <div class="timeline-period">${t.period}</div>
                  <div class="timeline-prob" style="color: ${getRiskColor(t.probability * 100)}">${Math.round(t.probability * 100)}%</div>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Legal Analysis</div>
            <div class="legal-box">
              <strong>Direct Threat Criteria:</strong><br>
              Duration: ${riskAnalysis.legalAnalysis.directThreatCriteria.duration}/100 | 
              Severity: ${riskAnalysis.legalAnalysis.directThreatCriteria.severity}/100 | 
              Likelihood: ${riskAnalysis.legalAnalysis.directThreatCriteria.likelihood}/100 | 
              Imminence: ${riskAnalysis.legalAnalysis.directThreatCriteria.imminence}/100<br>
              <strong>Defensibility:</strong> ${riskAnalysis.legalAnalysis.defensibility}/100
            </div>
          </div>

          <div class="section">
            <div class="section-title">Recommendations</div>
            ${riskAnalysis.recommendations.slice(0, 3).map(r => `
              <div class="recommendation">${r}</div>
            `).join("")}
          </div>

          <div class="footer">
            <p><strong>SME Reviewer:</strong> ${caseData.reviewingSME} | <strong>Case Manager:</strong> ${caseData.caseManager}</p>
            <p style="margin-top: 8px; font-style: italic;">This report is a decision-support document. All findings require review by qualified professionals in accordance with applicable legal and regulatory requirements.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const downloadReport = () => {
    const html = buildExecutiveReport();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${caseData.caseId}-executive-report.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lbl: React.CSSProperties = {
    display: "block",
    fontSize: "0.6875rem",
    fontWeight: 600,
    color: "rgba(255,255,255,0.45)",
    marginBottom: "0.3rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const riskColor = getRiskColor(riskAnalysis.overallRiskScore);
  const riskLabel = getRiskLabel(riskAnalysis.overallRiskScore);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#fff", marginBottom: "0.125rem" }}>
            Executive Intelligence Report
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>
            Advanced risk visualization with legal and historical context
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <button
            className="glow-btn glow-btn-secondary"
            onClick={() => setShowReport(!showReport)}
            style={{ fontSize: "0.8125rem", padding: "0.5rem 0.875rem" }}
          >
            {showReport ? "Hide" : "Show"} Report
          </button>
          <button
            className="glow-btn"
            onClick={downloadReport}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", padding: "0.5rem 0.875rem" }}
          >
            <Download size={14} />
            Export HTML
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.875rem", marginBottom: "1.25rem" }}>
        <div className="glass-card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
            Overall Risk Score
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: riskColor, marginBottom: "0.25rem" }}>
            {riskAnalysis.overallRiskScore}%
          </div>
          <div style={{ fontSize: "0.75rem", color: riskColor, fontWeight: 600, textTransform: "uppercase" }}>
            {riskLabel}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
            Injury Probability
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#b4d7d0", marginBottom: "0.25rem" }}>
            {Math.round(riskAnalysis.injuryProbability * 100)}%
          </div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>
            Probability of injury
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
            Aggravation Risk
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f59e0b", marginBottom: "0.25rem" }}>
            {Math.round(riskAnalysis.aggravationProbability * 100)}%
          </div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>
            Existing condition aggravation
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
            Comparative Risk
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#d6c8aa", marginBottom: "0.25rem" }}>
            {comparativeRisk.relativeRisk.toFixed(1)}x
          </div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>
            vs. baseline occupational
          </div>
        </div>
      </div>

      {/* Risk Factors and Protective Factors */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginBottom: "1.25rem" }}>
        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#ef4444", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            <AlertTriangle size={14} style={{ display: "inline-block", marginRight: "0.5rem" }} />
            Risk Factors
          </div>
          {riskAnalysis.riskFactors.slice(0, 5).map((factor, i) => (
            <div key={i} style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#fff" }}>{factor.name}</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#ef4444" }}>{Math.round(factor.probability * 100)}%</span>
              </div>
              <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${factor.probability * 100}%`, background: "#ef4444", borderRadius: "2px" }} />
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#22c55e", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            <CheckCircle size={14} style={{ display: "inline-block", marginRight: "0.5rem" }} />
            Protective Factors
          </div>
          {riskAnalysis.protectiveFactors.slice(0, 5).map((factor, i) => (
            <div key={i} style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#fff" }}>{factor.name}</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#22c55e" }}>{Math.round(factor.probability * 100)}%</span>
              </div>
              <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${factor.probability * 100}%`, background: "#22c55e", borderRadius: "2px" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Timeline */}
      <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#00d4ff", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          <TrendingUp size={14} style={{ display: "inline-block", marginRight: "0.5rem" }} />
          Risk Timeline
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
          {riskAnalysis.timeline.map((period, i) => (
            <div key={i} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.5rem" }}>{period.period}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: getRiskColor(period.probability * 100) }}>
                {Math.round(period.probability * 100)}%
              </div>
              <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem", textTransform: "capitalize" }}>
                {period.severity} risk
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Analysis */}
      <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#d6c8aa", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          <Scale size={14} style={{ display: "inline-block", marginRight: "0.5rem" }} />
          Legal Analysis & Direct Threat Assessment
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
          <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.05)", borderRadius: "6px" }}>
            <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.25rem", textTransform: "uppercase" }}>Duration</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#b4d7d0" }}>
              {riskAnalysis.legalAnalysis.directThreatCriteria.duration}
            </div>
          </div>
          <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.05)", borderRadius: "6px" }}>
            <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.25rem", textTransform: "uppercase" }}>Severity</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f59e0b" }}>
              {riskAnalysis.legalAnalysis.directThreatCriteria.severity}
            </div>
          </div>
          <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.05)", borderRadius: "6px" }}>
            <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.25rem", textTransform: "uppercase" }}>Likelihood</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ef4444" }}>
              {riskAnalysis.legalAnalysis.directThreatCriteria.likelihood}
            </div>
          </div>
          <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.05)", borderRadius: "6px" }}>
            <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.25rem", textTransform: "uppercase" }}>Imminence</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#d6c8aa" }}>
              {riskAnalysis.legalAnalysis.directThreatCriteria.imminence}
            </div>
          </div>
        </div>
        <div style={{ padding: "0.75rem", background: "rgba(214,200,170,0.1)", borderRadius: "6px", border: "1px solid rgba(214,200,170,0.2)", marginBottom: "0.75rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#d6c8aa", marginBottom: "0.25rem" }}>Defensibility Score</div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#d6c8aa" }}>
              {riskAnalysis.legalAnalysis.defensibility}/100
            </div>
            <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${riskAnalysis.legalAnalysis.defensibility}%`, background: "#d6c8aa", borderRadius: "3px" }} />
            </div>
          </div>
        </div>
        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>
          <strong>Applicable Laws:</strong> {riskAnalysis.legalAnalysis.applicableLaws.join(", ")}
        </div>
      </div>

      {/* Recommendations */}
      <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#22c55e", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          <Zap size={14} style={{ display: "inline-block", marginRight: "0.5rem" }} />
          Clinical & Legal Recommendations
        </div>
        {riskAnalysis.recommendations.map((rec, i) => (
          <div key={i} style={{ marginBottom: "0.75rem", padding: "0.75rem", background: "rgba(34,197,94,0.1)", borderRadius: "6px", border: "1px solid rgba(34,197,94,0.2)", fontSize: "0.8125rem", color: "rgba(255,255,255,0.8)" }}>
            • {rec}
          </div>
        ))}
      </div>

      {/* Full Report Preview */}
      {showReport && (
        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.1)" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Full Report Preview
            </span>
            <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.1)" }} />
          </div>
          <div
            ref={reportRef}
            dangerouslySetInnerHTML={{ __html: buildExecutiveReport() }}
            style={{ maxHeight: "800px", overflowY: "auto", borderRadius: "12px", overflow: "hidden" }}
          />
        </div>
      )}
    </div>
  );
}
