# SME Risk Intelligence Engine

## Overview

Occupational health intelligence web app for Subject Matter Expert (SME) review workflows. Dark macOS Tahoe / Liquid Glass aesthetic. All data is localStorage-only (v1 — no backend, no PHI in production).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **Framework**: React 19 + Vite + TypeScript
- **Routing**: wouter
- **Styling**: Tailwind CSS + custom glass CSS
- **Charts**: Recharts
- **Animation**: framer-motion
- **Icons**: lucide-react
- **Map**: react-simple-maps + world-atlas
- **Storage**: localStorage only

## Artifacts

| Artifact | Path | Purpose |
|---|---|---|
| `artifacts/sme-risk-engine` | `/` | Main SME app |
| `artifacts/api-server` | `/api` | Express API server (unused in v1) |
| `artifacts/mockup-sandbox` | `/mockup-sandbox` | Canvas component previews |

## Modules (18 total)

### Top-level pages
1. **Dashboard** (`/`) — Case overview, portfolio risk radar, stats
2. **AOR Intelligence Monitor** (`/aor`) — Live world map, pulse markers, event feed, 12 global AOR events
3. **Clearance Matrix** (`/matrix`) — Cross-case fitness grid (Firefighter, Aviation, LE, DOT, Deployment, Pre-Employment)
4. **Drug & Formulary Checker** (`/drugs`) — 12-drug DB, 8 interactions, AOR risk flags (cold-chain, heat, cardiac, sedation)
5. **Guideline Library** (`/guidelines`) — CRUD for occupational standards (NFPA 1582, FAA, MOD, etc.)
6. **Source Library** (`/sources`) — CRUD for reference sources
7. **Settings** (`/settings`) — Export/import/clear all, demo mode banner

### Case Hub tabs (opened via `/case/:id`)
8. **Case Intake** — New case form (18+ fields)
9. **Medical Profile** — Conditions, medications, history
10. **Injury History** — Musculoskeletal / injury records
11. **Job Duties** — Physical, cognitive, environmental demands
12. **Country Risk** — Deployment country risk profile
13. **Occupational Data** — BLS/NIOSH occupational risk data
14. **Health Equity** — Social determinants of health context
15. **Risk Scoring** — 5-domain risk matrix (0–3 / U scale)
16. **Documentation Gaps** — Auto-detected + custom gaps
17. **SME Report** — Structured findings and recommendations

## Key Files

```
artifacts/sme-risk-engine/src/
  App.tsx                         — Routes
  lib/types.ts                    — All shared TypeScript types
  lib/store.ts                    — localStorage CRUD hooks
  lib/sampleData.ts               — Demo cases, guidelines, sources
  types/react-simple-maps.d.ts    — Module declaration for react-simple-maps
  pages/
    Dashboard.tsx
    AORUpdates.tsx                — World map + event feed
    ClearanceMatrix.tsx           — Cross-case fitness matrix
    DrugChecker.tsx               — Drug interaction / AOR risk tool
    CaseIntake.tsx
    CaseHub.tsx                   — Tab shell for case review
    Guidelines.tsx
    Sources.tsx
    Settings.tsx
    case-tabs/
      MedicalProfile.tsx
      InjuryHistory.tsx
      JobDuties.tsx
      CountryRisk.tsx
      OccupationalData.tsx
      HealthEquity.tsx
      RiskScoring.tsx
      DocumentationGaps.tsx
      SMEReport.tsx
  components/layout/
    AppShell.tsx
    Sidebar.tsx
```

## Disclaimers (enforced in UI)

- DEMO MODE banner on every page — no PHI
- Decision-support only disclaimer — not a final medical determination
- AOR Monitor disclaimer on every event card
- Drug Checker disclaimer — not a substitute for pharmacist/Lexicomp review
- Clearance Matrix disclaimer — algorithmically derived, not a final clearance determination

## Notes

- `react-simple-maps` has no bundled types — handled by `src/types/react-simple-maps.d.ts`
- All risk scores are `RiskScore = 0 | 1 | 2 | 3 | "U"` per domain; max score drives matrix derivation
- pnpm workspace monorepo — do not run `pnpm dev` at root; use `restart_workflow` per artifact
