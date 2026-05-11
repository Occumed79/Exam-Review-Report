import React, { useMemo, useRef, useState } from "react";
import { Download, TrendingUp, AlertTriangle, CheckCircle, Scale, BarChart3, Zap, Shield, FileText, Activity } from "lucide-react";
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
          body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a2e; background: #f5f5f5; }
          .report { max-width: 8.5in; margin: 20px auto; background: white; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); line-height: 1.5; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 4px solid #0a0f1e; padding-bottom: 20px; }
          .header h1 { font-size: 28px; font-weight: 800; margin-bottom: 5px; color: #0a0f1e; }
          .header p { font-size: 14px; color: #666; font-weight: 500; }
          .risk-banner { display: flex; align-items: center; justify-content: space-between; padding: 20px; border-radius: 12px; margin-bottom: 25px; background: #f8fafc; border-left: 8px solid ${riskColor}; }
          .risk-score { font-size: 42px; font-weight: 800; color: ${riskColor}; }
          .risk-label { font-size: 16px; font-weight: 800; color: ${riskColor}; text-transform: uppercase; letter-spacing: 2px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 14px; font-weight: 800; color: #0a0f1e; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; display: flex; align-items: center; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .metric-box { background: #ffffff; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          .metric-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
          .metric-value { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 6px; }
          .probability-bar { width: 100%; height: 10px; background: #f1f5f9; border-radius: 5px; overflow: hidden; margin-top: 10px; }
          .probability-fill { height: 100%; background: ${riskColor}; border-radius: 5px; }
          .risk-factor { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .risk-factor-name { font-weight: 600; color: #334155; }
          .risk-factor-prob { font-weight: 800; color: ${riskColor}; }
          .regulatory-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
          .reg-box { padding: 10px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; }
          .reg-name { font-size: 10px; font-weight: 800; color: #64748b; margin-bottom: 5px; }
          .reg-status { font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
          .status-compliant { background: #dcfce7; color: #166534; }
          .status-non-compliant { background: #fee2e2; color: #991b1b; }
          .status-waiver { background: #fef3c7; color: #92400e; }
          .status-na { background: #f1f5f9; color: #475569; }
          .explain-box { background: #f8fafc; padding: 15px; border-radius: 10px; border-left: 4px solid #0f172a; margin-bottom: 20px; }
          .explain-item { font-size: 12px; margin-bottom: 8px; display: flex; align-items: flex-start; }
          .explain-bullet { width: 6px; height: 6px; border-radius: 50%; background: #0f172a; margin-top: 6px; margin-right: 10px; flex-shrink: 0; }
          .recommendation { padding: 12px; margin-bottom: 10px; background: #fffbeb; border-left: 5px solid #f59e0b; border-radius: 6px; font-size: 12px; font-weight: 600; color: #92400e; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
          .case-info { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; font-size: 12px; margin-bottom: 25px; background: #f8fafc; padding: 15px; border-radius: 10px; }
          .case-info-label { font-weight: 700; color: #64748b; display: block; margin-bottom: 2px; }
          .case-info-value { font-weight: 800; color: #0f172a; }
          @media print { body { background: white; } .report { box-shadow: none; margin: 0; width: 100%; } }
        </style>
      </head>
      <body>
        <div class="report">
          <div class="header">
            <h1>EXECUTIVE INTELLIGENCE REPORT</h1>
            <p>Advanced Occupational Health Analytics & Regulatory Compliance</p>
          </div>

          <div class="case-info">
            <div><span class="case-info-label">CASE ID</span><span class="case-info-value">${caseData.caseId}</span></div>
            <div><span class="case-info-label">EXAMINEE</span><span class="case-info-value">${caseData.examineeName}</span></div>
            <div><span class="case-info-label">POSITION</span><span class="case-info-value">${caseData.jobTitle}</span></div>
            <div><span class="case-info-label">DATE</span><span class="case-info-value">${today}</span></div>
          </div>

          <div class="risk-banner">
            <div>
              <div class="risk-label">${riskLabel}</div>
              <div style="font-size: 13px; color: #64748b; font-weight: 600; margin-top: 4px;">Composite Intelligence Risk Score</div>
            </div>
            <div class="risk-score">${riskAnalysis.overallRiskScore}%</div>
          </div>

          <div class="section">
            <div class="section-title">Regulatory Compliance Matrix</div>
            <div class="regulatory-grid">
              ${Object.entries(riskAnalysis.regulatoryCompliance).map(([key, val]) => `
                <div class="reg-box">
                  <div class="reg-name">${key.toUpperCase()}</div>
                  <div class="reg-status status-${val.status}">${val.status.replace("-", " ").toUpperCase()}</div>
                </div>
              `).join("")}
            </div>
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
              <div class="metric-label">Aggravation Risk</div>
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
              <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-top: 4px;">vs. Baseline Occupational Risk</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Intelligence Explainability</div>
            <div class="explain-box">
              ${riskAnalysis.explainability.map(e => `
                <div class="explain-item">
                  <div class="explain-bullet"></div>
                  <div><strong>${e.factor}:</strong> ${e.description}</div>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Primary Risk Drivers</div>
            ${riskAnalysis.riskFactors.sort((a, b) => b.probability - a.probability).slice(0, 5).map(f => `
              <div class="risk-factor">
                <span class="risk-factor-name">${f.name}</span>
                <span class="risk-factor-prob">${Math.round(f.probability * 100)}%</span>
              </div>
            `).join("")}
          </div>

          <div class="section">
            <div class="section-title">Clinical & Legal Recommendations</div>
            ${riskAnalysis.recommendations.map(r => `
              <div class="recommendation">${r}</div>
            `).join("")}
          </div>

          <div class="footer">
            <p><strong>SME REVIEWER:</strong> ${caseData.reviewingSME} | <strong>CASE MANAGER:</strong> ${caseData.caseManager}</p>
            <p style="margin-top: 10px;">This report is a high-precision intelligence document generated by the SME Risk Intelligence Engine. All findings are based on integrated clinical, occupational, and regulatory data models.</p>
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
    a.download = `${caseData.caseId}-executive-intelligence-report.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const riskColor = getRiskColor(riskAnalysis.overallRiskScore);
  const riskLabel = getRiskLabel(riskAnalysis.overallRiskScore);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-300" />
            Executive Intelligence Report
          </h2>
          <p className="text-white/60 text-sm mt-1">Advanced risk analytics and regulatory compliance matrix</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowReport(!showReport)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-2 border border-white/10"
          >
            <BarChart3 className="w-4 h-4" />
            {showReport ? "Hide Analysis" : "View Analysis"}
          </button>
          <button 
            onClick={downloadReport}
            className="px-4 py-2 bg-teal-700/90 hover:bg-teal-700/80 text-white rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-teal-900/20"
          >
            <Download className="w-4 h-4" />
            Export Intelligence Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Risk Score</span>
            <Activity className="w-4 h-4 text-white/40" />
          </div>
          <div className="text-4xl font-black" style={{ color: riskColor }}>{riskAnalysis.overallRiskScore}%</div>
          <div className="text-[10px] font-bold mt-1 uppercase tracking-widest" style={{ color: riskColor }}>{riskLabel}</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Injury Prob.</span>
            <TrendingUp className="w-4 h-4 text-white/40" />
          </div>
          <div className="text-4xl font-black text-white">{Math.round(riskAnalysis.injuryProbability * 100)}%</div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-teal-400 rounded-full" style={{ width: `${riskAnalysis.injuryProbability * 100}%` }} />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Direct Threat</span>
            <Shield className="w-4 h-4 text-white/40" />
          </div>
          <div className="text-4xl font-black text-white">{riskAnalysis.directThreatScore}</div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${riskAnalysis.directThreatScore}%` }} />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Comp. Risk</span>
            <Scale className="w-4 h-4 text-white/40" />
          </div>
          <div className="text-4xl font-black text-white">{comparativeRisk.relativeRisk.toFixed(1)}x</div>
          <div className="text-[10px] font-bold mt-1 text-white/40 uppercase tracking-widest">vs. Baseline</div>
        </div>
      </div>

      {showReport && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-300" />
                Regulatory Compliance Matrix
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(riskAnalysis.regulatoryCompliance).map(([key, val]) => (
                  <div key={key} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-[10px] font-bold text-white/40 uppercase mb-2">{key}</div>
                    <div className={`text-[10px] font-bold px-2 py-1 rounded-md inline-block ${
                      val.status === "compliant" ? "bg-green-500/20 text-green-400" :
                      val.status === "non-compliant" ? "bg-red-500/20 text-red-400" :
                      val.status === "waiver-required" ? "bg-yellow-500/20 text-amber-300" :
                      "bg-white/10 text-white/40"
                    }`}>
                      {val.status.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-300" />
                Intelligence Explainability
              </h3>
              <div className="space-y-3">
                {riskAnalysis.explainability.map((e, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${e.impact > 0 ? "bg-red-400" : "bg-green-400"}`} />
                    <div>
                      <div className="text-sm font-bold text-white">{e.factor}</div>
                      <div className="text-xs text-white/60">{e.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Primary Risk Drivers
              </h3>
              <div className="space-y-4">
                {riskAnalysis.riskFactors.sort((a, b) => b.probability - a.probability).slice(0, 5).map((f, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/80 font-medium">{f.name}</span>
                      <span className="text-white font-bold">{Math.round(f.probability * 100)}%</span>
                    </div>
                    <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${f.probability * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Recommendations
              </h3>
              <div className="space-y-3">
                {riskAnalysis.recommendations.map((r, idx) => (
                  <div key={idx} className="text-xs font-bold p-3 bg-amber-500/10 border-l-4 border-amber-500/60 text-amber-200 rounded-r-lg">
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
