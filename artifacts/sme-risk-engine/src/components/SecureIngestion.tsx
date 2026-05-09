import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle, Shield, Eye, EyeOff, Lock } from "lucide-react";
import { processDocumentLocally, verifyScrubbed } from "@/lib/localPDFProcessor";

interface SecureIngestionProps {
  onExtract?: (scrubbedText: string, clinicalDataPoints: any[]) => void;
  onClose?: () => void;
}

export default function SecureIngestion({ onExtract, onClose }: SecureIngestionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processingResult, setProcessingResult] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRedacted, setShowRedacted] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);

    try {
      // Process entirely locally - no upload to any server
      const result = await processDocumentLocally(uploadedFile);
      setProcessingResult(result);

      // Verify that scrubbed text is safe
      const verification = verifyScrubbed(result.scrubbedText);
      setVerificationStatus(verification);
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtract = () => {
    if (processingResult && onExtract) {
      onExtract(processingResult.scrubbedText, processingResult.clinicalDataPoints);
    }
  };

  if (!processingResult) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10, 15, 30, 0.95)",
          backdropFilter: "blur(24px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
          padding: "1rem",
        }}
      >
        <div
          style={{
            background: "rgba(20, 25, 50, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
            padding: "2rem",
            maxWidth: "600px",
            width: "100%",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <Lock size={24} style={{ color: "#22c55e" }} />
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f4efdc" }}>
              Zero-Exposure Secure Ingestion
            </h2>
          </div>

          {/* Security Notice */}
          <div
            style={{
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "12px",
              padding: "1rem",
              marginBottom: "1.5rem",
              display: "flex",
              gap: "0.75rem",
            }}
          >
            <CheckCircle size={20} style={{ color: "#22c55e", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#22c55e" }}>
                100% Local Processing
              </div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.6)", marginTop: "0.25rem" }}>
                All PHI redaction happens in your browser. No data is sent to external servers until it's completely scrubbed.
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed rgba(180, 215, 208, 0.3)",
              borderRadius: "12px",
              padding: "3rem",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
              background: "rgba(180, 215, 208, 0.05)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(180, 215, 208, 0.6)";
              (e.currentTarget as HTMLElement).style.background = "rgba(180, 215, 208, 0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(180, 215, 208, 0.3)";
              (e.currentTarget as HTMLElement).style.background = "rgba(180, 215, 208, 0.05)";
            }}
          >
            <Upload size={48} style={{ color: "#b4d7d0", margin: "0 auto 1rem" }} />
            <p style={{ fontSize: "1.125rem", color: "#f4efdc", marginBottom: "0.5rem" }}>
              {isProcessing ? "Processing..." : "Drop your medical packet here"}
            </p>
            <p style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.5)" }}>
              Upload with full PHI. It will be redacted locally in your browser.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              style={{ display: "none" }}
              accept=".pdf,.jpg,.jpeg,.png,.tiff"
              disabled={isProcessing}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 15, 30, 0.95)",
        backdropFilter: "blur(24px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "rgba(20, 25, 50, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          padding: "2rem",
          maxWidth: "900px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <Lock size={24} style={{ color: "#22c55e" }} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f4efdc" }}>
            Document Processed Securely
          </h2>
        </div>

        {/* Processing Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* PHI Detection Summary */}
          <div
            style={{
              background: "rgba(180, 215, 208, 0.1)",
              border: "1px solid rgba(180, 215, 208, 0.2)",
              borderRadius: "12px",
              padding: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <AlertCircle size={18} style={{ color: "#fbbf24" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fbbf24" }}>
                PHI Detected & Redacted (Locally)
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
              {processingResult.detectedPHI.length > 0 ? (
                processingResult.detectedPHI.reduce((acc: any, item: any) => {
                  acc[item.type] = (acc[item.type] || 0) + 1;
                  return acc;
                }, {})
              ) : (
                {}
              )}
              {Object.entries(processingResult.detectedPHI.reduce((acc: any, item: any) => {
                acc[item.type] = (acc[item.type] || 0) + 1;
                return acc;
              }, {})).map(([type, count]) => (
                <div key={type} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#b4d7d0" }}>
                    {count}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>
                    {type}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scrubbed Verification */}
          {verificationStatus && (
            <div
              style={{
                background: verificationStatus.isSafe ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${verificationStatus.isSafe ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                borderRadius: "12px",
                padding: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <CheckCircle size={20} style={{ color: verificationStatus.isSafe ? "#22c55e" : "#ef4444" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: verificationStatus.isSafe ? "#22c55e" : "#ef4444" }}>
                  {verificationStatus.isSafe ? "✓ Safe for AI Analysis" : "⚠ Contains Suspicious Patterns"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)" }}>
                  {verificationStatus.isSafe
                    ? "No PHI detected in scrubbed version. Ready to send to AI."
                    : `Found: ${verificationStatus.suspiciousPatterns.join(", ")}`}
                </div>
              </div>
            </div>
          )}

          {/* Text Preview Toggle */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <button
              onClick={() => setShowRedacted(true)}
              style={{
                padding: "0.5rem 1rem",
                background: showRedacted ? "rgba(180, 215, 208, 0.2)" : "transparent",
                border: `1px solid ${showRedacted ? "rgba(180, 215, 208, 0.4)" : "rgba(255, 255, 255, 0.1)"}`,
                borderRadius: "8px",
                color: "#f4efdc",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Eye size={16} />
              Redacted (Browser Only)
            </button>
            <button
              onClick={() => setShowRedacted(false)}
              style={{
                padding: "0.5rem 1rem",
                background: !showRedacted ? "rgba(180, 215, 208, 0.2)" : "transparent",
                border: `1px solid ${!showRedacted ? "rgba(180, 215, 208, 0.4)" : "rgba(255, 255, 255, 0.1)"}`,
                borderRadius: "8px",
                color: "#f4efdc",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Eye size={16} />
              Scrubbed (Safe for AI)
            </button>
          </div>

          {/* Text Preview */}
          <div
            style={{
              background: "rgba(10, 15, 30, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "1rem",
              maxHeight: "300px",
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: "0.875rem",
              color: "rgba(255, 255, 255, 0.7)",
              lineHeight: 1.6,
            }}
          >
            {showRedacted ? processingResult.redactedText : processingResult.scrubbedText}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <button
              onClick={() => {
                setFile(null);
                setProcessingResult(null);
                setVerificationStatus(null);
                if (onClose) onClose();
              }}
              style={{
                padding: "0.75rem 1.5rem",
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                color: "#f4efdc",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleExtract}
              disabled={!verificationStatus?.isSafe}
              style={{
                padding: "0.75rem 1.5rem",
                background: verificationStatus?.isSafe ? "linear-gradient(135deg, #b4d7d0, #7f9d96)" : "rgba(180, 215, 208, 0.2)",
                border: "none",
                borderRadius: "8px",
                color: verificationStatus?.isSafe ? "#0a0f1e" : "rgba(255, 255, 255, 0.5)",
                cursor: verificationStatus?.isSafe ? "pointer" : "not-allowed",
                fontSize: "0.875rem",
                fontWeight: 700,
              }}
            >
              Extract & Populate Case
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
