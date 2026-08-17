import { Router, type IRouter } from "express";
import { searchCongress, getCongressStatus } from "../services/congressService";
import { searchRegulations, getRegulationsStatus } from "../services/regulationsService";
import { searchNews, getNewsStatus } from "../services/newsService";
import { getWhoIndicators, getWhoStatus } from "../services/whoService";
import { getProviderStatuses } from "../services/providerStatusService";

const router: IRouter = Router();
function query(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim().slice(0, 200) : fallback;
}
function limit(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.max(1, Math.min(parsed, 50)) : 20;
}
function failure(
  res: Parameters<Parameters<IRouter["get"]>[1]>[1],
  error: unknown,
) {
  const message =
    error instanceof Error ? error.message : "Upstream provider failed.";
  res
    .status(message.includes("not configured") ? 503 : 502)
    .json({ ok: false, error: message });
}

router.get("/intelligence/status", async (_req, res) => {
  try {
    const providers = await getProviderStatuses();
    const news = getNewsStatus();
    res.setHeader("Cache-Control", "no-store");
    res.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      providers,
      congress: getCongressStatus(),
      regulations: getRegulationsStatus(),
      newsData: news.newsData,
      apiTube: news.apiTube,
      who: getWhoStatus(),
    });
  } catch (error) {
    failure(res, error);
  }
});

router.get("/intelligence/congress", async (req, res) => {
  const q = query(
    req.query.q,
    "defense DoD NDAA appropriations occupational health",
  );
  try {
    res.json({
      ok: true,
      ...(await searchCongress(q, limit(req.query.limit))),
    });
  } catch (error) {
    failure(res, error);
  }
});
router.get("/intelligence/regulations", async (req, res) => {
  const q = query(
    req.query.q,
    "occupational medicine workplace safety respiratory protection medical screening",
  );
  try {
    res.json({
      ok: true,
      ...(await searchRegulations(
        q,
        query(req.query.agency),
        limit(req.query.limit),
      )),
    });
  } catch (error) {
    failure(res, error);
  }
});
router.get("/intelligence/news", async (req, res) => {
  const q = query(req.query.q);
  if (q.length < 2) {
    res
      .status(400)
      .json({ ok: false, error: "Enter at least two characters." });
    return;
  }
  try {
    res.json({
      ok: true,
      ...(await searchNews(q, query(req.query.country).toLowerCase())),
    });
  } catch (error) {
    failure(res, error);
  }
});
router.get("/intelligence/who", async (req, res) => {
  const country = query(req.query.country).toUpperCase();
  if (!/^[A-Z]{3}$/.test(country)) {
    res
      .status(400)
      .json({ ok: false, error: "WHO country must be an ISO alpha-3 code." });
    return;
  }
  const indicators = query(req.query.indicators)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  try {
    res.json({ ok: true, ...(await getWhoIndicators(country, indicators)) });
  } catch (error) {
    failure(res, error);
  }
});
export default router;
