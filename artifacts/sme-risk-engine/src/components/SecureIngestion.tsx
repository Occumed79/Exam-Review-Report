import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle, Shield, Eye, EyeOff } from "lucide-react";
import { redactPHI, detectPHI, generatePHISummary, validateRedaction } from "@/lib/phiRedaction";

interface SecureIngestionProps {
  onExtract?: (redactedText: string, originalText: string) => void;
  onClose?: () => void;
}

export default function SecureIngestion({ onExtract, onClose }: SecureIngestionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [redactedText, setRedactedText] = useState<string>("");
  const [detectedPHI, setDetectedPHI] = useState<any[]>([]);
  const [phiSummary, setPhiSummary] = useState<{ [key: string]: number }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRedacted, setShowRedacted] = useState(true);
  const [redactionConfidence, setRedactionConfidence] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);

    try {
      // For now, we'll simulate PDF text extraction
      // In production, this would use OCR.space or Gemini Vision
      const text = await extractTextFromPDF(uploadedFile);
      setExtractedText(text);

      // Detect and redact PHI
      const phi = detectPHI(text);
      setDetectedPHI(phi);
      setPhiSummary(generatePHISummary(phi));

      const { redactedText: redacted } = redactPHI(text);
      setRedactedText(redacted);

      // Validate redaction
      const validation = validateRedaction(text, redacted);
      setRedactionConfidence(validation.confidence * 100);
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // Simulate PDF text extraction
    // In production, this would call OCR.space API or Gemini Vision
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Placeholder: In production, use actual PDF parsing
        resolve(`[PDF Content from ${file.name}]\n\nPlease upload a valid PDF file.`);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleExtract = () => {
    if (onExtract) {
      onExtract(redactedText, extractedText);
    }
  };

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
          <Shield size={24} style={{ color: "#b4d7d0" }} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f4efdc" }}>
            Secure Document Ingestion
          </h2>
        </div>

        {!extractedText ? (
          // Upload Area
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
              Drop your medical packet here
            </p>
            <p style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.5)" }}>
              PDF, images, or scanned documents with PHI will be automatically redacted
            </p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              style={{ display: "none" }}
              accept=".pdf,.jpg,.jpeg,.png,.tiff"
            />
          </div>
        ) : (
          // Processing Results
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* PHI Summary */}
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
                  PHI Detection Summary
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
                {Object.entries(phiSummary).map(([type, count]) => (
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

            {/* Redaction Confidence */}
            <div
              style={{
                background: "rgba(34, 197, 94, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
                borderRadius: "12px",
                padding: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <CheckCircle size={20} style={{ color: "#22c55e" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#22c55e" }}>
                  Redaction Confidence: {redactionConfidence.toFixed(0)}%
                </div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)" }}>
                  All detected PHI has been automatically masked
                </div>
              </div>
            </div>

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
                Redacted Version
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
                <EyeOff size={16} />
                Original (for reference)
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
              {showRedacted ? redactedText : extractedText}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setFile(null);
                  setExtractedText("");
                  setRedactedText("");
                  setDetectedPHI([]);
                  setPhiSummary({});
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
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "linear-gradient(135deg, #b4d7d0, #7f9d96)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#0a0f1e",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                }}
              >
                Extract & Populate Case
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
