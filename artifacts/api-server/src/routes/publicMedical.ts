import { Router, type IRouter } from "express";
import { searchPubMed, searchRxNorm } from "../services/publicMedicalService";

const router: IRouter = Router();
const clean = (value: unknown) =>
  typeof value === "string" ? value.trim().slice(0, 300) : "";
const limit = (value: unknown) =>
  Math.min(20, Math.max(1, Number.parseInt(String(value), 10) || 8));
function fail(
  res: Parameters<Parameters<IRouter["get"]>[1]>[1],
  provider: string,
) {
  res
    .status(502)
    .json({ ok: false, error: `${provider} is temporarily unavailable.` });
}
router.get("/medical/pubmed", async (req, res) => {
  const q = clean(req.query.q);
  if (q.length < 2) {
    res
      .status(400)
      .json({ ok: false, error: "Enter at least two characters." });
    return;
  }
  try {
    res.json({
      ok: true,
      source: "PubMed",
      items: await searchPubMed(q, limit(req.query.limit)),
    });
  } catch {
    fail(res, "PubMed");
  }
});
router.get("/medical/rxnorm", async (req, res) => {
  const q = clean(req.query.q);
  if (q.length < 2) {
    res
      .status(400)
      .json({ ok: false, error: "Enter at least two characters." });
    return;
  }
  try {
    res.json({
      ok: true,
      source: "RxNorm",
      items: await searchRxNorm(q, limit(req.query.limit)),
    });
  } catch {
    fail(res, "RxNorm");
  }
});
export default router;
