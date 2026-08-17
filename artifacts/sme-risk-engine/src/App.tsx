import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useStore } from "@/lib/store";
import AppShell from "@/components/layout/AppShell";
import ToolErrorBoundary from "@/components/ToolErrorBoundary";
import Guidelines from "@/pages/Guidelines";
import Settings from "@/pages/Settings";
import InjuriesMedicalConditions from "@/pages/InjuriesMedicalConditions";
import AORFactors from "@/pages/AORFactors";
import JobIntelligence from "@/pages/JobIntelligence";
import StandardsMatrix from "@/pages/StandardsMatrixV2";
import DrugChecker from "@/pages/DrugCheckerAdvanced";
import ClinicalCalculator from "@/pages/ClinicalCalculatorV3";
import "@/pages/injury-osha.css";

function AppRouter() {
  const store = useStore();
  const [location] = useLocation();

  return (
    <AppShell>
      <ToolErrorBoundary key={location}>
        <Switch>
          <Route path="/">
            <InjuriesMedicalConditions />
          </Route>
          <Route path="/injuries-medical-conditions">
            <InjuriesMedicalConditions />
          </Route>
          <Route path="/injury-intelligence">
            <InjuriesMedicalConditions />
          </Route>
          <Route path="/guidelines">
            <InjuriesMedicalConditions />
          </Route>
          <Route path="/aor-factors">
            <AORFactors />
          </Route>
          <Route path="/aor">
            <AORFactors />
          </Route>
          <Route path="/external-factors">
            <AORFactors />
          </Route>
          <Route path="/job-intelligence">
            <JobIntelligence />
          </Route>
          <Route path="/matrix">
            <StandardsMatrix />
          </Route>
          <Route path="/drugs">
            <DrugChecker />
          </Route>
          <Route path="/calculator">
            <ClinicalCalculator />
          </Route>
          <Route path="/guideline-editor">
            <Guidelines
              guidelines={store.guidelines}
              onSave={store.saveGuideline}
              onDelete={store.deleteGuideline}
            />
          </Route>
          <Route path="/settings">
            <Settings
              guidelineCount={store.guidelines.length}
              sourceCount={store.sources.length}
              onExport={store.exportAll}
              onImport={store.importAll}
              onClearAll={store.clearAll}
            />
          </Route>
          <Route>
            <div style={{ textAlign: "center", padding: "4rem" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>Tool not found</div>
            </div>
          </Route>
        </Switch>
      </ToolErrorBoundary>
    </AppShell>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <AppRouter />
    </WouterRouter>
  );
}

export default App;