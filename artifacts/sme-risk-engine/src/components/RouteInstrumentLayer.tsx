import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import InstrumentStage, { type InstrumentVariant } from "./InstrumentStage";

type Snapshot = {
  variant: InstrumentVariant;
  eyebrow: string;
  title: string;
  primary?: string;
  secondary?: string;
  result?: string;
  nodes: string[];
  count?: number;
  status?: string;
  compact?: boolean;
};

const ROUTES: Record<string, { anchor: string; fallback: Snapshot }> = {
  "/drugs": {
    anchor: ".drug-header",
    fallback: {
      variant: "drug",
      eyebrow: "MOLECULAR INTELLIGENCE CHAMBER",
      title: "Medication field",
      primary: "Search or select a medication to materialize its reviewed occupational signals.",
      nodes: ["Alertness", "Balance", "Heat", "Monitoring", "Storage", "Safety-sensitive work"],
      status: "RxNorm linked",
    },
  },
  "/calculator": {
    anchor: ".clinical-header",
    fallback: {
      variant: "calculator",
      eyebrow: "MEDICAL INSTRUMENT CONSOLE",
      title: "BMI",
      primary: "The active equation drives the instrument trace and result chamber.",
      nodes: [],
      status: "Deterministic local calculation",
    },
  },
  "/guidelines": {
    anchor: ".condition-header",
    fallback: {
      variant: "condition",
      eyebrow: "CLINICAL NEURAL MAP",
      title: "Condition reference",
      primary: "Clinical review concepts organize around the selected condition.",
      nodes: ["History", "Stability", "Treatment", "Function", "Safety-sensitive exposure"],
      status: "Reference mode",
    },
  },
  "/citations": {
    anchor: ".citation-header",
    fallback: {
      variant: "evidence",
      eyebrow: "EVIDENCE OBSERVATORY",
      title: "Literature constellation",
      primary: "Search results become a live evidence field while saved sources remain distinct.",
      nodes: ["PubMed", "Scientific literature", "Official sources", "Saved evidence"],
      status: "PubMed direct search",
    },
  },
  "/sources": {
    anchor: '[data-testid="sources-page"] > div:first-child',
    fallback: {
      variant: "vault",
      eyebrow: "EVIDENCE VAULT",
      title: "Source archive",
      primary: "Saved evidence is organized as an inspectable local research vault.",
      nodes: ["Official", "Regulatory", "Public health", "Literature", "News"],
      status: "Local persistence",
    },
  },
  "/job-intelligence": {
    anchor: ".job-header",
    fallback: {
      variant: "job",
      eyebrow: "OCCUPATIONAL DIGITAL TWIN",
      title: "Occupation projection",
      primary: "Select an occupation to project physical, cognitive, environmental, and safety-sensitive demands.",
      nodes: ["Physical", "Cognitive", "Environmental", "Safety-sensitive"],
      status: "O*NET oriented",
    },
  },
  "/injury-intelligence": {
    anchor: ".injury-header",
    fallback: {
      variant: "injury",
      eyebrow: "ANATOMICAL PROJECTION ARRAY",
      title: "Injury intelligence",
      primary: "Occupation-linked surveillance and anatomy are projected without changing source meaning.",
      nodes: ["BLS", "OSHA", "O*NET", "Anatomy", "Finding match"],
      status: "Measured + derived layers",
    },
  },
  "/": {
    anchor: ".injury-header",
    fallback: {
      variant: "injury",
      eyebrow: "ANATOMICAL PROJECTION ARRAY",
      title: "Injury intelligence",
      primary: "Occupation-linked surveillance and anatomy are projected without changing source meaning.",
      nodes: ["BLS", "OSHA", "O*NET", "Anatomy", "Finding match"],
      status: "Measured + derived layers",
    },
  },
  "/aor": {
    anchor: ".aor-header",
    fallback: {
      variant: "aor",
      eyebrow: "GEOGRAPHIC COMMAND INSTRUMENT",
      title: "Combatant command picture",
      primary: "Selected public AOR geography and sourced health, operational, legislative, and regulatory signals.",
      nodes: ["Public health", "Security", "Infrastructure", "Policy", "Timeline"],
      status: "Live public sources",
    },
  },
  "/external-factors": {
    anchor: ".deployment-header",
    fallback: {
      variant: "aor",
      eyebrow: "DEPLOYMENT ENVIRONMENT CHAMBER",
      title: "Country medical environment",
      primary: "Country reference, WHO observations, and recent health/disaster/access signals share one field.",
      nodes: ["Climate", "Heat / cold", "Public health", "Medical access", "Logistics"],
      status: "Country-level context",
    },
  },
  "/matrix": {
    anchor: ".standards-header",
    fallback: {
      variant: "evidence",
      eyebrow: "STANDARDS LENS ARRAY",
      title: "Framework matrix",
      primary: "Occupational frameworks remain distinct while their review topics can be scanned together.",
      nodes: ["Fire", "Driving", "Aviation", "Law enforcement", "Deployment"],
      status: "Reference sources",
      compact: true,
    },
  },
  "/guideline-editor": {
    anchor: '[data-testid="guidelines-page"] > div:first-child',
    fallback: {
      variant: "vault",
      eyebrow: "GUIDANCE WORKBENCH",
      title: "Internal guidance archive",
      primary: "Reviewer-authored guidance stays separate from external evidence and standards.",
      nodes: ["Clinical", "Occupational", "Program", "Source-backed"],
      status: "Local persistence",
      compact: true,
    },
  },
};

function text(selector: string) {
  return document.querySelector(selector)?.textContent?.trim() ?? "";
}
function texts(selector: string, limit = 10) {
  return Array.from(document.querySelectorAll(selector))
    .map((node) => node.textContent?.trim() ?? "")
    .filter(Boolean)
    .slice(0, limit);
}
function short(value: string, length = 36) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
}
function numberFrom(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

function deriveSnapshot(path: string, fallback: Snapshot): Snapshot {
  if (path === "/drugs") {
    const drugs = texts(".drug-card h3", 6);
    const flags = texts(".drug-flags span", 12);
    return {
      ...fallback,
      title: drugs[0] || "Medication field",
      primary: drugs.length ? `Selected: ${drugs.join(" · ")}` : fallback.primary,
      nodes: flags.length ? flags.map((item) => short(item, 28)) : fallback.nodes,
      count: drugs.length,
      secondary: drugs.length > 1 ? `${drugs.length} medications in chamber` : drugs.length ? "Reviewed medication selected" : "Awaiting medication",
    };
  }

  if (path === "/calculator") {
    const active = text(".clinical-panel-head h2") || fallback.title;
    const description = text(".clinical-panel-head p") || fallback.primary;
    const result = text(".clinical-result strong");
    return {
      ...fallback,
      title: active,
      primary: description,
      result: result || undefined,
      nodes: texts(".clinical-field > span", 6).map((item) => short(item, 26)),
      count: document.querySelectorAll(".clinical-field").length,
      secondary: result ? "Result materialized" : "Awaiting valid inputs",
    };
  }

  if (path === "/guidelines") {
    const condition = text(".condition-title-row h2") || fallback.title;
    const context = text(".condition-context p") || fallback.primary;
    const nodes = texts(".condition-limits span", 10);
    return {
      ...fallback,
      title: condition,
      primary: context,
      nodes: nodes.length ? nodes : fallback.nodes,
      count: document.querySelectorAll(".condition-article-list a").length,
      secondary: text(".condition-evidence") || "Reference lens",
    };
  }

  if (path === "/citations") {
    const resultHeading = text(".citation-panel-head h2");
    const articleTitles = texts(".citation-result-row strong", 10).map((item) => short(item, 34));
    return {
      ...fallback,
      title: resultHeading && !resultHeading.startsWith("Search") ? resultHeading : fallback.title,
      primary: articleTitles.length ? `${articleTitles.length} live literature record${articleTitles.length === 1 ? "" : "s"} in the field.` : fallback.primary,
      nodes: articleTitles.length ? articleTitles : fallback.nodes,
      count: articleTitles.length,
      secondary: `${document.querySelectorAll(".citation-saved-list > div").length} saved matches`,
    };
  }

  if (path === "/sources") {
    const cards = texts('[data-testid="sources-page"] [data-testid^="source-card-"] span', 12).map((item) => short(item, 28));
    const countText = text('[data-testid="sources-page"] .liquid-toolbar');
    const count = numberFrom(countText);
    return {
      ...fallback,
      title: count ? `${count} source${count === 1 ? "" : "s"} archived` : fallback.title,
      nodes: cards.length ? cards : fallback.nodes,
      count,
      secondary: text('[data-testid="sources-page"] .liquid-toolbar') ? "Searchable local evidence" : fallback.secondary,
    };
  }

  if (path === "/job-intelligence") {
    const occupation = text(".job-profile-strip h2");
    const demandNodes = texts(".job-profile-column > p", 10).map((item) => short(item, 31));
    const category = text(".job-profile-strip p");
    return {
      ...fallback,
      title: occupation || fallback.title,
      primary: occupation ? category || "Occupation demand projection" : fallback.primary,
      nodes: demandNodes.length ? demandNodes : fallback.nodes,
      count: document.querySelectorAll(".job-duty-row").length,
      secondary: occupation ? "Digital twin active" : "Awaiting occupation",
    };
  }

  if (path === "/injury-intelligence" || path === "/") {
    const occupation = text(".injury-occupation-strip h2");
    const ranking = texts(".injury-anatomy-ranking button", 10).map((item) => short(item, 28));
    const measured = document.querySelectorAll(".injury-measured-card").length;
    return {
      ...fallback,
      title: occupation || "Projected injury anatomy",
      primary: occupation ? text(".injury-occupation-strip p") || fallback.primary : fallback.primary,
      nodes: ranking.length ? ranking : fallback.nodes,
      count: measured,
      secondary: occupation ? "Occupation projection active" : "Awaiting occupation",
    };
  }

  if (path === "/aor") {
    const abbreviation = text(".inspector-head h2");
    const fullName = text(".inspector-card.overview > strong");
    const countries = text(".inspector-card.overview dd:last-child")
      .split("·")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 9);
    return {
      ...fallback,
      title: abbreviation || fallback.title,
      primary: fullName || fallback.primary,
      nodes: countries.length ? countries : fallback.nodes,
      count: document.querySelectorAll(".timeline .source-row").length,
      secondary: text(".aor-workbench footer span:nth-child(2)") || "Public AOR orientation",
    };
  }

  if (path === "/external-factors") {
    const country = text(".deployment-title h2");
    const nodes = texts(".deployment-chips span", 10);
    return {
      ...fallback,
      title: country || fallback.title,
      primary: country ? text(".deployment-title p") || fallback.primary : fallback.primary,
      nodes: nodes.length ? nodes : fallback.nodes,
      count: document.querySelectorAll(".deployment-indicators article").length + document.querySelectorAll(".deployment-events > a").length,
      secondary: country ? "Country drill-down active" : "Awaiting country",
    };
  }

  if (path === "/matrix") {
    const frameworks = texts(".standards-framework strong", 10);
    return { ...fallback, nodes: frameworks.length ? frameworks : fallback.nodes, count: frameworks.length };
  }

  if (path === "/guideline-editor") {
    const headerText = text('[data-testid="guidelines-page"]');
    const count = numberFrom(headerText);
    return { ...fallback, count, title: count ? `${count} guidance entr${count === 1 ? "y" : "ies"}` : fallback.title };
  }

  return fallback;
}

export default function RouteInstrumentLayer() {
  const [location] = useLocation();
  const route = ROUTES[location];
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(route?.fallback ?? null);

  const routeKey = useMemo(() => `${location}:${route?.anchor ?? "none"}`, [location, route?.anchor]);

  useEffect(() => {
    if (!route) {
      setMount(null);
      setSnapshot(null);
      return;
    }

    let stopped = false;
    let portal: HTMLDivElement | null = null;
    let observer: MutationObserver | null = null;
    let frame = 0;
    let previous = "";

    const capture = () => {
      frame = 0;
      if (stopped) return;
      const next = deriveSnapshot(location, route.fallback);
      const serialized = JSON.stringify(next);
      if (serialized !== previous) {
        previous = serialized;
        setSnapshot(next);
      }
    };

    const scheduleCapture = () => {
      if (!frame) frame = window.requestAnimationFrame(capture);
    };

    const attach = () => {
      if (stopped) return;
      const anchor = document.querySelector(route.anchor);
      if (!anchor || !anchor.parentElement) {
        window.setTimeout(attach, 50);
        return;
      }
      portal = document.createElement("div");
      portal.className = "route-instrument-portal";
      portal.dataset.instrumentRoute = location;
      anchor.insertAdjacentElement("afterend", portal);
      setMount(portal);
      capture();

      const root = document.querySelector(".reviewer-stage-content") ?? anchor.parentElement;
      observer = new MutationObserver((mutations) => {
        if (mutations.every((mutation) => portal?.contains(mutation.target as Node))) return;
        scheduleCapture();
      });
      observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true });
    };

    attach();
    return () => {
      stopped = true;
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      portal?.remove();
      setMount(null);
    };
  }, [routeKey]);

  if (!route || !mount || !snapshot) return null;
  return createPortal(<InstrumentStage {...snapshot} />, mount);
}
