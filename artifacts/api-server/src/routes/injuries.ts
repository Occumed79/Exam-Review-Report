import { Router, type IRouter } from "express";
import { getOccupationInjuryEvidence } from "../services/blsOccupationInjuryService";
import { getOshaIndustrySevereInjuryContext } from "../services/oshaSevereInjuryService";

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

router.get("/injuries/osha-severe", async (req, res) => {
  const sectors = typeof req.query.sectors === "string"
    ? req.query.sectors.split(",").map((value) => value.trim()).filter(Boolean)
    : [];
  if (!sectors.length || sectors.some((sector) => !/^\d{2}$/.test(sector))) {
    res.status(400).json({ ok: false, error: "Provide one or more 2-digit NAICS sectors separated by commas." });
    return;
  }

  try {
    res.json(await getOshaIndustrySevereInjuryContext(sectors));
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unable to load OSHA severe injury context.",
    });
  }
});

export default router;
