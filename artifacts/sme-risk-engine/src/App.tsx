import { Switch, Route, Router as WouterRouter, useLocation, useParams } from "wouter";
import { useStore } from "@/lib/store";
import AppShell from "@/components/layout/AppShell";
import Dashboard from "@/pages/Dashboard";
import SecureIngestion from "@/components/SecureIngestion";
import { useState, useEffect } from "react";
import CaseIntake from "@/pages/CaseIntake";
import CaseHub from "@/pages/CaseHub";
import Guidelines from "@/pages/Guidelines";
import Sources from "@/pages/Sources";
import Settings from "@/pages/Settings";
import AORMonitor from "@/pages/AORMonitor";
import JobIntelligence from "@/pages/JobIntelligence";
import GuidelineLibrary from "@/pages/GuidelineLibrary";
import ClearanceMatrix from "@/pages/ClearanceMatrix";
import DrugChecker from "@/pages/DrugChecker";
import ClinicalCalculator from "@/pages/ClinicalCalculator";
import Citations from "@/pages/Citations";
import { createCaseFromExtraction } from "@/lib/extractedCaseMapper";

function CaseHubWrapper({ store }: { store: ReturnType<typeof useStore> }) {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const caseData = store.getCaseById(params.id);

  if (!caseData) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <div style={{ fontSize: "1.125rem", color: "rgba(255,255,255,0.5)", marginBottom: "1.25rem" }}>
          Case not found: {params.id}
        </div>
        <button className="glow-btn" onClick={() => setLocation("/")} data-testid="btn-go-home">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <CaseHub
      caseData={caseData}
      onSave={(c) => store.saveCase(c)}
    />
  );
}

function NewCaseWrapper({ store }: { store: ReturnType<typeof useStore> }) {
  const [, setLocation] = useLocation();
  return (
    <CaseIntake
      onSave={(c) => {
        store.saveCase(c);
        setLocation(`/case/${c.id}`);
      }}
    />
  );
}

function AppRouter() {
  const store = useStore();
  const [location, setLocation] = useLocation();
  const [showIngest, setShowIngest] = useState(false);
  const activeRouteCaseId = location.match(/^\/case\/([^/]+)/)?.[1];
  const activeRouteCase = activeRouteCaseId ? store.cases.find(c => c.id === activeRouteCaseId) : undefined;

  useEffect(() => {
    const handleOpen = () => setShowIngest(true);
    window.addEventListener('open-secure-ingest', handleOpen);
    return () => window.removeEventListener('open-secure-ingest', handleOpen);
  }, []);

  return (
    <AppShell cases={store.cases} activeCase={activeRouteCase}>
      {showIngest && (
        <SecureIngestion 
          onClose={() => setShowIngest(false)} 
          onExtract={(_, data) => {
            const ingestedCase = createCaseFromExtraction(data);
            store.saveCase(ingestedCase);
            setShowIngest(false);
            setLocation(`/case/${ingestedCase.id}`);
          }}
        />
      )}
      <Switch>
        <Route path="/">
          <Dashboard
            cases={store.cases}
            onDelete={store.deleteCase}
            onDuplicate={store.duplicateCase}
          />
        </Route>
        <Route path="/case/new">
          <NewCaseWrapper store={store} />
        </Route>
        <Route path="/case/:id">
          <CaseHubWrapper store={store} />
        </Route>
        <Route path="/aor">
          <AORMonitor />
        </Route>
        <Route path="/job-intelligence">
          <JobIntelligence />
        </Route>
        <Route path="/guidelines">
          <GuidelineLibrary />
        </Route>
        <Route path="/matrix">
          <ClearanceMatrix cases={store.cases} />
        </Route>
        <Route path="/drugs">
          <DrugChecker />
        </Route>
        <Route path="/calculator">
          <ClinicalCalculator />
        </Route>
        <Route path="/citations">
          <Citations />
        </Route>
        <Route path="/guideline-editor">
          <Guidelines
            guidelines={store.guidelines}
            onSave={store.saveGuideline}
            onDelete={store.deleteGuideline}
          />
        </Route>
        <Route path="/sources">
          <Sources
            sources={store.sources}
            onSave={store.saveSource}
            onDelete={store.deleteSource}
          />
        </Route>
        <Route path="/settings">
          <Settings
            caseCount={store.cases.length}
            guidelineCount={store.guidelines.length}
            sourceCount={store.sources.length}
            onExport={store.exportAll}
            onImport={store.importAll}
            onClearAll={store.clearAll}
          />
        </Route>
        <Route>
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>Page not found</div>
          </div>
        </Route>
      </Switch>
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
