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

        findings.slice(0, 14).forEach((finding) => {
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
            { selector: 'node[type = "scenario"]', style: { width: 76, height: 76, 'background-color': '#091b28', 'border-width': 2, 'border-color': '#75ecff', 'shadow-blur': 28, 'shadow-color': '#39dfff', 'shadow-opacity': 0.35, 'shadow-offset-x': 0, 'shadow-offset-y': 0, 'font-size': 10, 'font-weight': 700 } },
            { selector: 'node[type = "standard"]', style: { width: 90, height: 42, shape: 'round-rectangle', 'background-color': '#0a1722', 'border-width': 1.6, 'border-color': 'data(color)', 'shadow-blur': 20, 'shadow-color': 'data(color)', 'shadow-opacity': 0.22, 'font-size': 10, 'font-weight': 700 } },
            { selector: 'node[type = "finding"]', style: { width: 112, height: 36, shape: 'round-rectangle', 'background-color': '#08141f', 'border-width': 1, 'border-color': '#2b6475', 'font-size': 8, color: '#b9d6df' } },
            { selector: 'node[level = "waiver"]', style: { 'border-color': '#ffb15f', 'shadow-color': '#ff9b42', 'shadow-opacity': 0.2 } },
            { selector: 'node[level = "strict"]', style: { 'border-color': '#ff6b7f', 'shadow-color': '#ff536e', 'shadow-opacity': 0.25 } },
            { selector: 'node[level = "review"]', style: { 'border-color': '#68dff4' } },
            { selector: 'edge', style: { width: 1.1, 'curve-style': 'bezier', 'line-color': '#24576a', 'target-arrow-color': '#24576a', 'target-arrow-shape': 'triangle', 'arrow-scale': 0.55, opacity: 0.62 } },
            { selector: 'edge[type = "sourceEdge"]', style: { width: 1.5, 'line-style': 'dashed', 'line-dash-pattern': [5, 7], 'line-color': '#4edff5', 'target-arrow-color': '#4edff5', opacity: 0.52 } },
            { selector: 'edge[level = "waiver"]', style: { 'line-color': '#a86d3e', 'target-arrow-color': '#a86d3e' } },
            { selector: 'edge[level = "strict"]', style: { 'line-color': '#9a4455', 'target-arrow-color': '#9a4455' } },
            { selector: '.activeFinding', style: { 'border-width': 2.2, 'border-color': '#ecfeff', 'shadow-blur': 30, 'shadow-color': '#79efff', 'shadow-opacity': 0.55, color: '#ffffff' } },
          ],
          layout: { name: 'cose', animate: false, fit: true, padding: 34, nodeRepulsion: () => 12000, idealEdgeLength: () => 95, edgeElasticity: () => 90, gravity: 0.5, numIter: 900 },
        });
        (host as any).__cy = cy;

        if (activeFindingId) cy.getElementById(`finding:${activeFindingId}`).addClass('activeFinding');
        cy.on('tap', 'node[type = "finding"]', (event: any) => {
          const id = event.target.data('findingId');
          if (id) onFindingSelect?.(id);
        });

        let bright = false;
        pulseTimer = window.setInterval(() => {
          bright = !bright;
          const scenario = cy?.getElementById('scenario');
          scenario?.style('shadow-opacity', bright ? 0.45 : 0.2);
          scenario?.style('border-color', bright ? '#d5fbff' : '#75ecff');
        }, 1400);
      } catch (error) {
        console.warn('Standards relationship map unavailable', error);
      }
    };

    void boot();
    return () => {
      disposed = true;
      window.clearInterval(pulseTimer);
      cy?.destroy?.();
      delete (host as any).__cy;
      host.replaceChildren();
    };
  }, [frameworks, findings, onFindingSelect, activeFindingId]);

  useEffect(() => {
    const host = hostRef.current;
    const cy = (host as any)?.__cy;
    if (!cy) return;
    cy.nodes().removeClass('activeFinding');
    if (activeFindingId) cy.getElementById(`finding:${activeFindingId}`).addClass('activeFinding');
  }, [activeFindingId]);

  return <div ref={hostRef} className="standards-network-map" aria-label="Interactive standards relationship map" />;
}
