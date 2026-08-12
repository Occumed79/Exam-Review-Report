import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  Globe2,
  Info,
  LoaderCircle,
  RefreshCw,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import {
  fetchIntelligenceProviders,
  type ProviderStatusRecord,
} from "../lib/intelligenceApi";

interface Props {
  guidelineCount: number;
  sourceCount: number;
  onExport: () => void;
  onImport: (json: string) => boolean;
  onClearAll: () => void;
}

export default function Settings({
  guidelineCount,
  sourceCount,
  onExport,
  onImport,
  onClearAll,
}: Props) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [providers, setProviders] = useState<ProviderStatusRecord[]>([]);
  const [providerLoading, setProviderLoading] = useState(true);
  const [providerError, setProviderError] = useState("");
  const refreshProviders = useCallback(async (force = false) => {
    setProviderLoading(true);
    setProviderError("");
    try {
      const response = await fetchIntelligenceProviders(force);
      setProviders(response.providers);
    } catch (error) {
      setProviderError(
        error instanceof Error
          ? error.message
          : "Provider status could not be loaded.",
      );
    } finally {
      setProviderLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void fetchIntelligenceProviders(false, controller.signal)
      .then((response) => setProviders(response.providers))
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setProviderError(
          error instanceof Error
            ? error.message
            : "Provider status could not be loaded.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setProviderLoading(false);
      });
    return () => controller.abort();
  }, [refreshProviders]);

  function handleImport(text: string) {
    if (!text.trim()) return;
    const result = onImport(text);
    setImportMsg(
      result
        ? { type: "success", text: "Toolkit data imported successfully." }
        : {
            type: "error",
            text: "Import failed. The file is not a valid toolkit export.",
          },
    );
    if (result) setImportText("");
  }

  return (
    <div
      className="settings-workstation"
      data-testid="settings-page"
      style={{ maxWidth: 1240, margin: "0 auto" }}
    >
      <div style={{ marginBottom: "1.5rem" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "1.55rem",
            color: "#fff",
            fontWeight: 800,
          }}
        >
          Settings
        </h1>
        <p
          style={{
            margin: "0.35rem 0 0",
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.84rem",
          }}
        >
          Manage the small amount of reusable toolkit data saved in this
          browser.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0,1fr))",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div
          className="glass-card"
          style={{
            padding: "1.1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
          }}
        >
          <Database size={20} style={{ color: "#b4d7d0" }} />
          <div>
            <div
              style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}
            >
              Saved guideline entries
            </div>
            <div
              style={{ fontSize: "1.45rem", fontWeight: 800, color: "#fff" }}
            >
              {guidelineCount}
            </div>
          </div>
        </div>
        <div
          className="glass-card"
          style={{
            padding: "1.1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.85rem",
          }}
        >
          <Info size={20} style={{ color: "#b4d7d0" }} />
          <div>
            <div
              style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}
            >
              Saved source entries
            </div>
            <div
              style={{ fontSize: "1.45rem", fontWeight: 800, color: "#fff" }}
            >
              {sourceCount}
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section-label">Live Data Providers</div>
      <section
        className="glass-card"
        style={{ padding: "1.1rem", marginBottom: "1rem" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "center",
            marginBottom: ".8rem",
          }}
        >
          <div>
            <strong style={{ color: "#fff", fontSize: ".9rem" }}>
              Provider configuration and health
            </strong>
            <p
              style={{
                margin: ".25rem 0 0",
                color: "rgba(255,255,255,.42)",
                fontSize: ".7rem",
              }}
            >
              Server-side checks only. Credentials and account identifiers are
              never returned.
            </p>
          </div>
          <button
            className="glow-btn glow-btn-secondary"
            disabled={providerLoading}
            onClick={() => void refreshProviders(true)}
            style={{
              display: "inline-flex",
              gap: ".35rem",
              alignItems: "center",
              whiteSpace: "nowrap",
            }}
          >
            {providerLoading ? (
              <LoaderCircle className="provider-spin" size={13} />
            ) : (
              <RefreshCw size={13} />
            )}{" "}
            Refresh Status
          </button>
        </div>
        {providerError && (
          <div
            style={{
              display: "flex",
              gap: ".4rem",
              color: "#fca5a5",
              fontSize: ".72rem",
              padding: ".65rem",
              border: "1px solid rgba(239,68,68,.18)",
              borderRadius: 6,
            }}
          >
            <AlertTriangle size={14} />
            <span>
              <strong>Status endpoint unavailable.</strong> {providerError}
              {providers.length > 0
                ? " Previously loaded results remain visible."
                : ""}
            </span>
          </div>
        )}
        {providerLoading && providers.length === 0 ? (
          <div
            style={{
              color: "rgba(255,255,255,.4)",
              fontSize: ".75rem",
              padding: "1rem 0",
            }}
          >
            Checking providers independently…
          </div>
        ) : (
          <div className="provider-status-grid">
            {providers.map((provider) => (
              <ProviderStatusCard key={provider.id} provider={provider} />
            ))}
          </div>
        )}
      </section>

      <div className="settings-section-label">
        Data / Storage · Import / Export · Application Information
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0,1fr))",
          gap: "1rem",
        }}
      >
        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <div
            style={{ color: "#fff", fontWeight: 800, marginBottom: "0.45rem" }}
          >
            Export / backup
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.46)",
              fontSize: "0.78rem",
              lineHeight: 1.55,
              marginBottom: "1rem",
            }}
          >
            Download the reusable guideline and source library data stored by
            this browser.
          </div>
          <button
            className="glow-btn"
            onClick={onExport}
            style={{
              display: "inline-flex",
              gap: "0.45rem",
              alignItems: "center",
            }}
          >
            <Download size={14} /> Export toolkit data
          </button>
        </div>

        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <div
            style={{ color: "#fff", fontWeight: 800, marginBottom: "0.45rem" }}
          >
            Import
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.46)",
              fontSize: "0.78rem",
              lineHeight: 1.55,
              marginBottom: "0.8rem",
            }}
          >
            Restore a toolkit JSON export.
          </div>
          <label
            style={{
              display: "inline-flex",
              gap: "0.45rem",
              alignItems: "center",
              cursor: "pointer",
              color: "#b4d7d0",
              fontSize: "0.8rem",
              fontWeight: 700,
              marginBottom: "0.8rem",
            }}
          >
            <Upload size={14} /> Choose JSON file
            <input
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) =>
                  handleImport(String(event.target?.result || ""));
                reader.readAsText(file);
              }}
            />
          </label>
          <textarea
            className="glass-input"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Or paste toolkit JSON here…"
            style={{
              width: "100%",
              minHeight: 90,
              padding: "0.65rem 0.75rem",
              resize: "vertical",
            }}
          />
          {importText.trim() && (
            <button
              className="glow-btn glow-btn-secondary"
              onClick={() => handleImport(importText)}
              style={{ marginTop: "0.65rem" }}
            >
              Import pasted JSON
            </button>
          )}
          {importMsg && (
            <div
              style={{
                marginTop: "0.65rem",
                fontSize: "0.76rem",
                color: importMsg.type === "success" ? "#b4d7d0" : "#fca5a5",
              }}
            >
              {importMsg.text}
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <div
            style={{ color: "#fff", fontWeight: 800, marginBottom: "0.45rem" }}
          >
            Application information
          </div>
          <div style={{ display: "grid", gap: "0.45rem", fontSize: "0.77rem" }}>
            {[
              ["Persistence", "Browser localStorage"],
              ["Backend database", "Not connected by this frontend"],
              ["Authentication", "Not implemented by this frontend"],
              ["Audit log", "No server-side audit trail"],
              ["Compliance claim", "None made by the application"],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  paddingBottom: "0.4rem",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.38)" }}>{label}</span>
                <span
                  style={{ color: "rgba(255,255,255,0.7)", textAlign: "right" }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="glass-card"
          style={{ padding: "1.25rem", borderColor: "rgba(239,68,68,0.16)" }}
        >
          <div
            style={{ color: "#fff", fontWeight: 800, marginBottom: "0.45rem" }}
          >
            Clear local toolkit data
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.46)",
              fontSize: "0.78rem",
              lineHeight: 1.55,
              marginBottom: "1rem",
            }}
          >
            Removes saved guideline/source library data from this browser.
          </div>
          {!confirmClear ? (
            <button
              className="glow-btn glow-btn-danger"
              onClick={() => setConfirmClear(true)}
              style={{
                display: "inline-flex",
                gap: "0.45rem",
                alignItems: "center",
              }}
            >
              <Trash2 size={14} /> Clear local data
            </button>
          ) : (
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <button
                className="glow-btn glow-btn-danger"
                onClick={() => {
                  onClearAll();
                  setConfirmClear(false);
                }}
              >
                Confirm clear
              </button>
              <button
                className="glow-btn glow-btn-secondary"
                onClick={() => setConfirmClear(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const statusLabels: Record<ProviderStatusRecord["status"], string> = {
  connected: "Connected",
  public: "Public API",
  not_configured: "Not Configured",
  error: "Error",
  degraded: "Degraded",
};
function displayTime(value: string | null) {
  if (!value) return "Never observed";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Unavailable" : date.toLocaleString();
}
function ProviderStatusCard({ provider }: { provider: ProviderStatusRecord }) {
  const healthy =
    provider.status === "connected" || provider.status === "public";
  const Icon = healthy
    ? CheckCircle2
    : provider.status === "not_configured"
      ? Globe2
      : XCircle;
  return (
    <article className={`provider-status-card provider-${provider.status}`}>
      <header>
        <div>
          <strong>{provider.name}</strong>
          <small>
            {provider.authentication === "required"
              ? "Authentication required"
              : "No API key required"}
          </small>
        </div>
        <span>
          <Icon size={12} />
          {statusLabels[provider.status]}
        </span>
      </header>
      <dl>
        <div>
          <dt>Last checked</dt>
          <dd>{displayTime(provider.checkedAt)}</dd>
        </div>
        <div>
          <dt>Configuration</dt>
          <dd>
            {provider.authentication === "public"
              ? "Public / no credential"
              : provider.configured
                ? "Server credential configured"
                : "Server credential missing"}
          </dd>
        </div>
        <div>
          <dt>Last successful response</dt>
          <dd>{displayTime(provider.lastSuccessfulResponse)}</dd>
        </div>
      </dl>
      {provider.error && <p>{provider.error}</p>}
    </article>
  );
}
