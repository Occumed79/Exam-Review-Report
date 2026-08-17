import { useEffect, useRef } from 'react';
import type { StandardFinding, StandardId } from './standardsIntelligenceData';
import { STANDARD_SOURCES } from './standardsIntelligenceData';

const CYTOSCAPE_URL = 'https://esm.sh/cytoscape@3.33.4';

async function remoteImport(url: string): Promise<any> {
  return import(/* @vite-ignore */ url);
}

type Props = {
  frameworks: StandardId[];
  findings: StandardFinding[];
  activeFindingId?: string;
  onFindingSelect?: (id: string) => void;
};

export default function StandardsRelationshipMap({ frameworks, findings, activeFindingId, onFindingSelect }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cy: any = null;
    let pulseTimer = 0;
    let flowTimer = 0;

    const applyActiveRoute = () => {
      if (!cy) return;
      cy.nodes().removeClass('activeFinding activeStandard');
      cy.edges().removeClass('activeRoute');
      if (!activeFindingId) return;

      const finding = findings.find((item) => item.id === activeFindingId);
      if (!finding) return;

      const findingNode = cy.getElementById(`finding:${finding.id}`);
      const standardNode = cy.getElementById(`std:${finding.standardId}`);
      const findingEdge = cy.getElementById(`edge:${finding.standardId}:${finding.id}`);
      const sourceEdge = cy.getElementById(`edge:scenario:${finding.standardId}`);

      findingNode?.addClass('activeFinding');
      standardNode?.addClass('activeStandard');
      findingEdge?.addClass('activeRoute');
      sourceEdge?.addClass('activeRoute');
    };

    const boot = async () => {
      try {
        const mod = await remoteImport(CYTOSCAPE_URL);
        if (disposed) return;
        const cytoscape = mod.default ?? mod;
        const elements: any[] = [
          { data: { id: 'scenario', label: 'REVIEW\nSCENARIO', type: 'scenario' } },
        ];

        frameworks.forEach((standardId) => {
          const source = STANDARD_SOURCES[standardId];
          elements.push({ data: { id: `std:${standardId}`, label: source.shortLabel, type: 'standard', standardId, color: source.accent } });
          elements.push({ data: { id: `edge:scenario:${standardId}`, source: 'scenario', target: `std:${standardId}`, type: 'sourceEdge' } });
        });

        findings.slice(0, 16).forEach((finding) => {
          elements.push({ data: { id: `finding:${finding.id}`, findingId: finding.id, label: finding.title.length > 34 ? `${finding.title.slice(0, 31)}…` : finding.title, type: 'finding', level: finding.level, standardId: finding.standardId } });
          elements.push({ data: { id: `edge:${finding.standardId}:${finding.id}`, source: `std:${finding.standardId}`, target: `finding:${finding.id}`, type: 'findingEdge', level: finding.level } });
        });

        cy = cytoscape({
          container: host,
          elements,
          wheelSensitivity: 0.22,
          minZoom: 0.55,
          maxZoom: 1.65,
          selectionType: 'single',
          style: [
            { selector: 'node', style: { 'font-family': 'Inter, ui-sans-serif, system-ui', 'font-size': 9, color: '#dffaff', label: 'data(label)', 'text-wrap': 'wrap', 'text-max-width': 110, 'text-valign': 'center', 'text-halign': 'center', 'text-outline-color': '#04101b', 'text-outline-width': 2 } },
            { selector: 'node[type = "scenario"]', style: { width: 78, height: 78, 'background-color': '#091b28', 'border-width': 2, 'border-color': '#75ecff', 'shadow-blur': 28, 'shadow-color': '#39dfff', 'shadow-opacity': 0.28, 'shadow-offset-x': 0, 'shadow-offset-y': 0, 'font-size': 10, 'font-weight': 700 } },
            { selector: 'node[type = "standard"]', style: { width: 94, height: 44, shape: 'round-rectangle', 'background-color': '#0a1722', 'border-width': 1.6, 'border-color': 'data(color)', 'shadow-blur': 20, 'shadow-color': 'data(color)', 'shadow-opacity': 0.18, 'font-size': 10, 'font-weight': 700 } },
            { selector: 'node[type = "finding"]', style: { width: 116, height: 38, shape: 'round-rectangle', 'background-color': '#08141f', 'border-width': 1, 'border-color': '#2b6475', 'font-size': 8, color: '#b9d6df' } },
            { selector: 'node[level = "waiver"]', style: { 'border-color': '#ffb15f', 'shadow-color': '#ff9b42', 'shadow-opacity': 0.14 } },
            { selector: 'node[level = "strict"]', style: { 'border-color': '#ff6b7f', 'shadow-color': '#ff536e', 'shadow-opacity': 0.18 } },
            { selector: 'node[level = "review"]', style: { 'border-color': '#68dff4' } },
            { selector: 'edge', style: { width: 1.15, 'curve-style': 'bezier', 'line-style': 'dashed', 'line-dash-pattern': [4, 8], 'line-dash-offset': 0, 'line-color': '#24576a', 'target-arrow-color': '#24576a', 'target-arrow-shape': 'triangle', 'arrow-scale': 0.55, opacity: 0.52 } },
            { selector: 'edge[type = "sourceEdge"]', style: { width: 1.6, 'line-dash-pattern': [6, 9], 'line-color': '#4edff5', 'target-arrow-color': '#4edff5', opacity: 0.48 } },
            { selector: 'edge[level = "waiver"]', style: { 'line-color': '#8d613d', 'target-arrow-color': '#8d613d' } },
            { selector: 'edge[level = "strict"]', style: { 'line-color': '#84404d', 'target-arrow-color': '#84404d' } },
            { selector: '.activeFinding', style: { 'border-width': 2.2, 'border-color': '#ecfeff', 'shadow-blur': 28, 'shadow-color': '#79efff', 'shadow-opacity': 0.42, color: '#ffffff' } },
            { selector: '.activeStandard', style: { 'border-width': 2.2, 'shadow-blur': 30, 'shadow-opacity': 0.35, color: '#ffffff' } },
            { selector: 'edge.activeRoute', style: { width: 2.2, 'line-color': '#9af4ff', 'target-arrow-color': '#c8fbff', opacity: 0.92, 'line-dash-pattern': [8, 7], 'arrow-scale': 0.72 } },
          ],
          layout: { name: 'cose', animate: false, fit: true, padding: 38, nodeRepulsion: () => 12500, idealEdgeLength: () => 98, edgeElasticity: () => 90, gravity: 0.52, numIter: 900 },
        });
        (host as any).__cy = cy;
        applyActiveRoute();

        cy.on('tap', 'node[type = "finding"]', (event: any) => {
          const id = event.target.data('findingId');
          if (id) onFindingSelect?.(id);
        });

        let bright = false;
        pulseTimer = window.setInterval(() => {
          bright = !bright;
          const scenario = cy?.getElementById('scenario');
          scenario?.style('shadow-opacity', bright ? 0.34 : 0.18);
          scenario?.style('border-color', bright ? '#b9f8ff' : '#75ecff');
        }, 1700);

        let offset = 0;
        flowTimer = window.setInterval(() => {
          if (!cy) return;
          offset = (offset - 1.2) % 30;
          cy.edges().style('line-dash-offset', offset);
        }, 90);
      } catch (error) {
        console.warn('Standards relationship map unavailable', error);
      }
    };

    void boot();
    return () => {
      disposed = true;
      window.clearInterval(pulseTimer);
      window.clearInterval(flowTimer);
      cy?.destroy?.();
      delete (host as any).__cy;
      host.replaceChildren();
    };
  }, [frameworks, findings, onFindingSelect, activeFindingId]);

  useEffect(() => {
    const host = hostRef.current;
    const cy = (host as any)?.__cy;
    if (!cy) return;

    cy.nodes().removeClass('activeFinding activeStandard');
    cy.edges().removeClass('activeRoute');
    if (!activeFindingId) return;

    const finding = findings.find((item) => item.id === activeFindingId);
    if (!finding) return;
    cy.getElementById(`finding:${finding.id}`).addClass('activeFinding');
    cy.getElementById(`std:${finding.standardId}`).addClass('activeStandard');
    cy.getElementById(`edge:${finding.standardId}:${finding.id}`).addClass('activeRoute');
    cy.getElementById(`edge:scenario:${finding.standardId}`).addClass('activeRoute');
  }, [activeFindingId, findings]);

  return <div ref={hostRef} className="standards-network-map" aria-label="Interactive standards relationship map" />;
}
