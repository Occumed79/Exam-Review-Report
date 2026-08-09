import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "exam-review-report", awake: true });
});

app.head("/api/health", (_req, res) => {
  res.status(200).end();
});

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const frontendDir = path.resolve(import.meta.dirname, "../../sme-risk-engine/dist/public");
  app.use(express.static(frontendDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) {
      next();
      return;
    }
    res.sendFile(path.join(frontendDir, "index.html"), (error) => {
      if (error) next(error);
    });
  });
}

export default app;
