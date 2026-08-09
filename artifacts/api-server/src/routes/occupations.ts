import { Router, type IRouter } from "express";
import { getOccupationProfile, getOnetStatus, searchOccupations } from "../services/onetService";
import { getBlsStatus } from "../services/blsService";

const router: IRouter = Router();

router.get("/intelligence/status", (_req, res) => {
  res.json({
    ok: true,
    onet: getOnetStatus(),
    bls: getBlsStatus(),
    osha: {
      importEnabled: ["true", "1", "yes", "on"].includes(String(process.env.OSHA_ITA_IMPORT_ENABLED ?? "").toLowerCase()),
      dataDirConfigured: Boolean(process.env.OSHA_DATA_DIR?.trim()),
      note: "OSHA public injury data is a dataset/import pipeline, not a reviewer-supplied credential.",
    },
  });
});

router.get("/occupations/search", async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (query.length < 2) {
    res.status(400).json({ ok: false, error: "Enter at least two characters." });
    return;
  }

  try {
    const results = await searchOccupations(query);
    res.json({ ok: true, source: "live-onet", results });
  } catch (error) {
    console.warn("O*NET occupation search failed", error);
    res.status(502).json({ ok: false, error: error instanceof Error ? error.message : "O*NET search failed." });
  }
});

router.get("/occupations/:code", async (req, res) => {
  try {
    const profile = await getOccupationProfile(req.params.code);
    res.json({ ok: true, source: "live-onet", profile });
  } catch (error) {
    console.warn("O*NET occupation profile failed", error);
    const message = error instanceof Error ? error.message : "O*NET profile lookup failed.";
    res.status(message.startsWith("Invalid") ? 400 : 502).json({ ok: false, error: message });
  }
});

export default router;
