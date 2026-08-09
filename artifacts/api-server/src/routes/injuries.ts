import { Router, type IRouter } from "express";
import { getOccupationInjuryEvidence } from "../services/blsOccupationInjuryService";

const router: IRouter = Router();

router.get("/injuries/occupation/:code", async (req, res) => {
  const code = String(req.params.code ?? "").trim();
  if (!/^\d{2}-\d{4}(?:\.\d{2})?$/.test(code)) {
    res.status(400).json({ ok: false, error: "Enter a valid SOC/O*NET-SOC code." });
    return;
  }

  try {
    res.json(await getOccupationInjuryEvidence(code));
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unable to load measured occupation injury evidence.",
    });
  }
});

export default router;
