# SME Control Layer & Hybrid Analysis Documentation
## Version 5.0 - "Best of Both Worlds"

**Status**: Production-Ready  
**Delivery Date**: May 8, 2026  
**Architecture**: Dual-Mode Intelligence Engine

---

## Executive Summary

The **SME Risk Intelligence Engine v5.0** introduces the **SME Control Layer**, which provides two distinct operational modes:

1.  **Autonomous Intelligence (v1)**: The engine operates with full autonomy, applying all integrated regulations, laws, and predictive models to generate a comprehensive, data-driven report.
2.  **SME-Guided Intelligence (v2)**: Subject Matter Experts can selectively enable/disable specific regulations and risk factors via an intuitive toggle interface, maintaining full transparency and control over the analysis.
3.  **Hybrid Consensus (v3)**: The engine combines machine intelligence with the SME's prior professional experience to reach a balanced, defensible verdict that leverages both data and human expertise.

This "best of both worlds" approach ensures the tool is neither purely algorithmic nor purely subjective—it's a sophisticated blend of machine precision and human wisdom.

---

## Part 1: SME Control Layer

### 1.1 Autonomous Mode (v1)

**Purpose**: Generate a fully independent, machine-driven analysis without human intervention.

**Characteristics**:
- All regulations enabled by default (MOD 18, POST, NFPA, FMCSA, DOT, ADA, EEOC, State Laws, International)
- All risk factors weighted according to evidence-based defaults
- No manual overrides or exclusions
- Produces a "baseline" risk score that serves as the reference point

**Use Cases**:
- Initial case screening
- Consistency checking across multiple cases
- Regulatory compliance verification
- Legal defensibility (showing what the algorithm independently determined)

**Output**:
```
AUTONOMOUS ANALYSIS REPORT
Mode: Autonomous (v1)
Baseline Risk Score: 72.5%
Applied Regulations: 15 (all enabled)
Applied Risk Factors: 7 (all enabled)
Confidence Level: 87%
```

### 1.2 SME-Guided Mode (v2)

**Purpose**: Allow the Subject Matter Expert to customize the analysis by selectively enabling/disabling regulations and risk factors.

**Key Features**:

#### A. Regulatory Toggles (15+ Options)
Each regulation can be independently enabled or disabled:

| Regulation | Category | Impact | Status |
| :--- | :--- | :--- | :--- |
| MOD 18 Cardiovascular Standards | Deployment | 25% | ✅ Enabled |
| MOD 18 Respiratory Standards | Deployment | 20% | ✅ Enabled |
| MOD 18 Metabolic Standards | Deployment | 18% | ✅ Enabled |
| POST Cardiovascular Fitness | Occupational | 20% | ✅ Enabled |
| NFPA 1582 Respiratory | Occupational | 22% | ❌ Disabled |
| DOT Vision Standards | Occupational | 20% | ✅ Enabled |
| ADA Direct Threat Assessment | Legal | 25% | ✅ Enabled |
| EEOC Compliance Standards | Legal | 15% | ✅ Enabled |
| State OSHA Requirements | State | 10% | ✅ Enabled |
| CENTCOM Theater Requirements | International | 20% | ✅ Enabled |

**Example**: An SME reviewing a firefighter case might disable NFPA 1582 if they believe the applicant's specific condition doesn't warrant that standard's strict requirements. The risk score would automatically adjust downward.

#### B. Risk Factor Toggles (7+ Options)
Each risk factor can be independently weighted:

| Risk Factor | Category | Default Weight | Custom Weight |
| :--- | :--- | :--- | :--- |
| Medical Conditions | Medical | 30% | 25% |
| Injury History | Medical | 20% | 20% |
| Functional Capacity | Occupational | 25% | 30% |
| Occupational Hazards | Occupational | 20% | 20% |
| Environmental Factors | Environmental | 15% | 10% |
| Social Determinants | Behavioral | 12% | 12% |
| Age Demographics | Demographic | 10% | 10% |

**Example**: An SME might increase the weight of "Functional Capacity" from 25% to 30% if they believe the applicant's physical ability is the primary determinant in this specific case.

#### C. Condition Filters
SMEs can explicitly exclude or include specific medical conditions:

**Exclude**: "I don't believe Condition X is relevant to this job"  
**Include**: "I specifically want Condition Y to be analyzed in detail"

### 1.3 Regulatory Toggles Explained

#### MOD 18 Standards (Updated from MOD 17)
- **Cardiovascular**: Cardiac fitness for military deployment
- **Respiratory**: Asthma control and respiratory capacity
- **Metabolic**: Diabetes and metabolic disorder management
- **Neurological**: Seizure disorder and neurological fitness
- **Medication Stability**: Resupply and cold-chain requirements

**Impact**: Each regulation can reduce or increase risk by 15-25% if enabled/disabled.

#### POST Standards (Law Enforcement)
- **Cardiovascular Fitness**: Stress tolerance and cardiac capacity
- **Psychological Fitness**: Mental health and behavioral standards

#### NFPA 1582 (Firefighters)
- **Respiratory Standards**: Smoke and heat exposure tolerance
- **Cardiac Standards**: High-stress environment fitness

#### FMCSA/DOT (Commercial Drivers)
- **Vision Standards**: Visual acuity and field of vision
- **Seizure Standards**: Seizure disorder disqualification

#### ADA/EEOC (Legal Compliance)
- **Direct Threat Assessment**: EEOC's four-factor test
- **Reasonable Accommodation**: Feasibility of accommodations

#### State & International
- **State OSHA**: State-specific occupational safety laws
- **CENTCOM/AFRICOM**: International deployment fitness

### 1.4 SME Control Interface (UI Mockup)

```
┌─────────────────────────────────────────────────────────────┐
│  SME CONTROL PANEL - Case #2024-001                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  MODE:  ○ Autonomous (v1)  ● Guided (v2)  ○ Hybrid (v3)    │
│                                                              │
│  ┌─ REGULATORY TOGGLES ────────────────────────────────┐    │
│  │                                                     │    │
│  │  MOD 18 Cardiovascular     [✓] Impact: 25%         │    │
│  │  MOD 18 Respiratory        [✓] Impact: 20%         │    │
│  │  MOD 18 Metabolic          [✓] Impact: 18%         │    │
│  │  POST Cardiovascular       [✓] Impact: 20%         │    │
│  │  NFPA 1582 Respiratory     [ ] Impact: 22%         │    │
│  │  DOT Vision                [✓] Impact: 20%         │    │
│  │  ADA Direct Threat         [✓] Impact: 25%         │    │
│  │  EEOC Compliance           [✓] Impact: 15%         │    │
│  │  State OSHA                [✓] Impact: 10%         │    │
│  │  CENTCOM Theater           [✓] Impact: 20%         │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─ RISK FACTOR WEIGHTS ───────────────────────────────┐    │
│  │                                                     │    │
│  │  Medical Conditions        [████░░░░░] 40% (↑10%)   │    │
│  │  Injury History            [███░░░░░░] 30%          │    │
│  │  Functional Capacity       [█████░░░░] 50% (↑25%)   │    │
│  │  Occupational Hazards      [████░░░░░] 40%          │    │
│  │  Environmental Factors     [██░░░░░░░] 20% (↓5%)    │    │
│  │  Social Determinants       [███░░░░░░] 30%          │    │
│  │  Age Demographics          [██░░░░░░░] 20%          │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─ CONDITION FILTERS ─────────────────────────────────┐    │
│  │                                                     │    │
│  │  Exclude: [Mild Hypertension] [Remove]             │    │
│  │  Include: [Respiratory Condition] [Remove]         │    │
│  │                                                     │    │
│  │  [+ Add Exclusion]  [+ Add Inclusion]              │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  [Generate Report]  [Save Configuration]  [Export Audit]    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 2: Hybrid Consensus Analysis

### 2.1 SME Prior Experience Integration

**Purpose**: Combine machine intelligence with the SME's professional history to reach a balanced verdict.

**Key Metrics**:

#### A. SME Profile
```
Name: Dr. Sarah Chen
Title: Occupational Medicine Physician
Years of Experience: 18
Decision Accuracy: 92%
Conservatism Bias: +0.15 (slightly conservative)

Specializations:
- Commercial Driver Medical Certification
- Occupational Injury Prevention
- Disability Determination

Prior Cases Reviewed: 247
- Fit: 156 (63%)
- Conditional: 67 (27%)
- Unfit: 24 (10%)
```

#### B. Case Similarity Matching
The engine identifies prior cases similar to the current case:

```
Current Case: Commercial Bus Driver with Hypertension

Similar Prior Cases:
1. Case #2023-045: Bus Driver, Hypertension (Fit) ✓ Correct
2. Case #2023-102: Truck Driver, Hypertension (Conditional) ✓ Correct
3. Case #2023-178: Bus Driver, Diabetes (Unfit) ✓ Correct

Similarity Score: 78%
SME Accuracy on Similar Cases: 100% (3/3)
```

#### C. Experience Weighting Calculation

```
Similar Case Count: 3
Accuracy on Similar Cases: 100%
Years of Experience: 18
Relevance Score: 78%

Experience Weight = (3/10 × 0.4) + (1.0 × 0.4) + (18/30 × 0.2)
                  = 0.12 + 0.40 + 0.12
                  = 0.64 (64%)

Interpretation: The SME's experience carries 64% weight in this case.
```

### 2.2 Hybrid Consensus Calculation

**Machine Intelligence**:
- Risk Score: 68%
- Confidence: 85%
- Basis: Hypertension severity, DOT standards, occupational hazard analysis

**SME Experience**:
- Risk Score: 55%
- Confidence: 90%
- Reasoning: "Similar cases with well-controlled hypertension have been fit; DOT compliance achievable with monitoring"

**Hybrid Consensus**:
```
Final Risk Score = (Machine Weight × Machine Score) + (SME Weight × SME Score)
                 = (0.36 × 0.68) + (0.64 × 0.55)
                 = 0.245 + 0.352
                 = 0.597 (59.7%)

Machine Weight: 36%
SME Weight: 64%
Agreement Level: 87% (scores are close)

Recommendation: "CONDITIONAL EMPLOYMENT"
Basis: "Strong agreement between machine and SME. SME experience with similar cases supports conditional fitness with enhanced monitoring."
```

### 2.3 Disagreement Analysis

When machine and SME assessments diverge significantly:

```
Machine Risk Score: 78%
SME Risk Score: 45%
Agreement Level: 33% (SIGNIFICANT DISAGREEMENT)

Analysis:
- Machine emphasizes regulatory compliance risk
- SME emphasizes real-world case outcomes
- Possible reasons for disagreement:
  1. SME has unpublished case data not in algorithm
  2. Regulatory standards may be overly conservative
  3. Applicant's specific circumstances are unique
  
Recommendation: "Requires detailed deliberation panel review"
```

---

## Part 3: Three-Mode Operational Workflow

### 3.1 Workflow Diagram

```
CASE INPUT
    ↓
┌─────────────────────────────────────────────────────┐
│  SELECT OPERATIONAL MODE                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  v1: AUTONOMOUS          v2: SME-GUIDED   v3: HYBRID│
│  (Full Autonomy)         (SME Controls)   (Best of Both)
│                                                     │
└─────────────────────────────────────────────────────┘
    ↓                           ↓                    ↓
┌─────────────┐         ┌──────────────┐      ┌──────────────┐
│ Run All     │         │ SME Toggles  │      │ Machine +    │
│ Regulations │         │ Regulations  │      │ SME Experience
│ & Factors   │         │ & Factors    │      │              │
└─────────────┘         └──────────────┘      └──────────────┘
    ↓                           ↓                    ↓
┌─────────────┐         ┌──────────────┐      ┌──────────────┐
│ Baseline    │         │ Adjusted     │      │ Hybrid       │
│ Risk Score  │         │ Risk Score   │      │ Consensus    │
│ (Reference) │         │ (Customized) │      │ (Balanced)   │
└─────────────┘         └──────────────┘      └──────────────┘
    ↓                           ↓                    ↓
    └───────────────────────────┴────────────────────┘
                        ↓
            ┌─────────────────────────┐
            │  GENERATE MULTI-PAGE    │
            │  INTELLIGENCE DOSSIER   │
            │  (15+ pages)            │
            └─────────────────────────┘
                        ↓
            ┌─────────────────────────┐
            │  EXPORT & AUDIT TRAIL   │
            │  (HTML, PDF, JSON)      │
            └─────────────────────────┘
```

### 3.2 Audit Trail & Legal Defensibility

Every analysis generates a complete audit trail:

```
AUDIT TRAIL - Case #2024-001

Timestamp: 2026-05-08 14:23:47 UTC
Mode: SME-Guided (v2)
SME: Dr. Sarah Chen (ID: SME-001)

Regulatory Toggles Modified:
- NFPA 1582 Respiratory: DISABLED (Reason: Not applicable to job)
- DOT Vision: ENABLED (Default)

Risk Factor Weights Modified:
- Functional Capacity: 25% → 35% (SME adjustment)
- Environmental Factors: 15% → 10% (SME adjustment)

Conditions Excluded:
- Mild Hypertension (SME note: Well-controlled, not relevant)

Baseline Risk (Autonomous): 72.5%
Adjusted Risk (SME-Guided): 58.3%
Risk Adjustment: -14.2%

SME Confidence: 90%
Machine Confidence: 85%
Hybrid Agreement: 82%

Final Recommendation: CONDITIONAL EMPLOYMENT

Cryptographic Hash: a7f3e2c1b9d4e5f6a8c2b1d9e3f5a7c2
Audit Certificate: VALID ✓
```

---

## Part 4: Implementation Guide

### 4.1 Using Autonomous Mode (v1)

```typescript
import { analyzeRisk } from "./advancedRiskEngine";

const caseData = { /* ... */ };
const autonomousResult = analyzeRisk(caseData);

console.log(`Baseline Risk: ${autonomousResult.riskScore * 100}%`);
console.log(`Applied Regulations: ${autonomousResult.appliedRegulations.length}`);
```

### 4.2 Using SME-Guided Mode (v2)

```typescript
import { createDefaultConfiguration, applySMEControls } from "./smeControlLayer";

// Create configuration
const config = createDefaultConfiguration("guided");

// SME disables NFPA 1582
config.regulatoryToggles.find(t => t.id === "nfpa-respiratory").enabled = false;

// SME adjusts weights
config.customWeights["functional-capacity"] = 0.35;

// Apply controls
const guidedResult = applySMEControls(autonomousResult.riskScore, config, caseData);

console.log(`Adjusted Risk: ${guidedResult.adjustedRisk * 100}%`);
console.log(`SME Modifications: ${guidedResult.smeModifications.length}`);
```

### 4.3 Using Hybrid Mode (v3)

```typescript
import { integrateSMEExperience, createSMEProfile } from "./smePriorExperience";

// Create SME profile from prior cases
const smeProfile = createSMEProfile(
  "SME-001",
  "Dr. Sarah Chen",
  "Occupational Medicine Physician",
  18,
  ["Commercial Driver Certification", "Occupational Injury"],
  priorCases
);

// Get SME assessment
const smeAssessment = { riskScore: 0.55, confidence: 0.90, reasoning: [...] };

// Integrate with machine intelligence
const hybridResult = integrateSMEExperience(
  autonomousResult.riskScore,
  autonomousResult.confidence,
  smeProfile,
  caseData,
  smeAssessment
);

console.log(`Final Risk Score: ${hybridResult.hybridConsensus.finalRiskScore * 100}%`);
console.log(`Agreement Level: ${hybridResult.hybridConsensus.agreement * 100}%`);
```

---

## Part 5: Key Benefits

### 5.1 Avoids "Black Box" Criticism
- **v1 (Autonomous)**: Shows what the algorithm independently determined
- **v2 (SME-Guided)**: Shows SME's professional judgment and customizations
- **v3 (Hybrid)**: Shows both perspectives and how they were balanced

### 5.2 Legally Defensible
- Complete audit trail of all decisions
- Cryptographic verification of integrity
- Clear documentation of regulatory compliance
- SME reasoning recorded for legal review

### 5.3 Balances Precision & Judgment
- Machine provides data-driven baseline
- SME adds professional experience and context
- Hybrid mode prevents both over-reliance on algorithms and pure subjectivity

### 5.4 Transparent & Explainable
- Every regulation and risk factor is visible and adjustable
- SME can explain why they disabled a regulation
- Agreement/disagreement metrics show confidence levels

---

## Conclusion

The **SME Control Layer** transforms the engine from a "black box" algorithm into a transparent, collaborative tool that respects both machine intelligence and human expertise. This "best of both worlds" approach ensures the tool is defensible, explainable, and ultimately more effective at making complex occupational health decisions.

**Status**: ✅ Production-Ready  
**Version**: 5.0  
**Delivery Date**: May 8, 2026

---

*This documentation serves as the official specification for the SME Control Layer and Hybrid Analysis of the SME Risk Intelligence Engine.*
