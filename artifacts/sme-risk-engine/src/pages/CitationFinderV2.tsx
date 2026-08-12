import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Database, ExternalLink, Loader2, Search } from 'lucide-react';
import { generateId, useStore } from '@/lib/store';
import { fetchPubMedArticles } from '@/lib/directSourceIntelligence';
import './citation-finder.css';

type Article = { pmid: string; title: string; journal: string; year: string; url: string };

const OFFICIAL_SOURCES = [
  { name: 'PubMed', description: 'Biomedical literature', url: 'https://pubmed.ncbi.nlm.nih.gov/' },
  { name: 'OSHA', description: 'Standards, interpretations, enforcement resources', url: 'https://www.osha.gov/laws-regs' },
  { name: 'NIOSH', description: 'Occupational safety and health research', url: 'https://www.cdc.gov/niosh/' },
  { name: 'BLS IIF', description: 'Occupational injury and illness data', url: 'https://www.bls.gov/iif/' },
  { name: 'O*NET', description: 'Occupation descriptions and work context', url: 'https://www.onetonline.org/' },
  { name: 'FMCSA', description: 'Commercial-driver medical requirements', url: 'https://www.fmcsa.dot.gov/medical' },
  { name: 'FAA AME Guide', description: 'Aviation medical examiner guidance', url: 'https://www.faa.gov/ame_guide' },
  { name: 'NFPA', description: 'Fire-service standards and codes', url: 'https://www.nfpa.org/codes-and-standards' },
];

const EXAMPLE_QUERIES = [
  'seizure commercial driver fitness for duty',
  'firefighter shoulder injury return to work',
  'obstructive sleep apnea safety sensitive work',
  'occupational heat beta blocker',
];

export default function CitationFinderV2() {
  const { sources, saveSource } = useStore();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [savedPmid, setSavedPmid] = useState('');

  const savedMatches = useMemo(() => {
    const clean = submittedQuery.trim().toLowerCase();
    if (!clean) return sources.slice(0, 8);
    return sources.filter((source) => `${source.title} ${source.organization} ${source.summary} ${source.notes} ${source.relevantConditions} ${source.relevantJobs} ${source.relevantCountries}`.toLowerCase().includes(clean)).slice(0, 8);
  }, [sources, submittedQuery]);

  useEffect(() => {
    if (!submittedQuery) {
      setArticles([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setMessage('');
    fetchPubMedArticles(submittedQuery, 10, controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setArticles(items);
        if (!items.length) setMessage('No PubMed results returned. Try broader clinical or occupational terms.');
      })
      .catch(() => {
        if (!controller.signal.aborted) setMessage('PubMed lookup is unavailable right now. Official-source shortcuts and saved sources are still available.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [submittedQuery]);

  function search(value = query) {
    const clean = value.trim();
    if (!clean) return;
    setQuery(clean);
    setSubmittedQuery(clean);
  }

  function saveArticle(article: Article) {
    saveSource({ id: generateId(), title: article.title, organization: article.journal || 'PubMed', url: article.url, publicationDate: article.year ? `${article.year}-01-01` : '', lastReviewed: new Date().toISOString().slice(0, 10), reviewedBy: '', summary: `Scientific literature record. PMID ${article.pmid}.`, relevantConditions: '', relevantJobs: '', relevantCountries: '', sourceReliability: 'High', sourceCategory: 'Scientific Literature', notes: `Saved from Citation Finder · PMID ${article.pmid}`, createdAt: new Date().toISOString() });
    setSavedPmid(article.pmid);
  }

  return (
    <div className="citation-workbench" data-testid="citation-finder">
      <header className="citation-header">
        <div>
          <div className="citation-kicker">EVIDENCE / SOURCE FINDER</div>
          <h1>Citation Finder</h1>
          <p>Search PubMed directly, check your saved source library, or jump to the official occupational source you need.</p>
        </div>
      </header>

      <section className="citation-search-panel liquid-glass">
        <div className="citation-search-input"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') search(); }} placeholder="Condition + occupation + question…" autoFocus /><button onClick={() => search()} disabled={!query.trim()}>Search</button></div>
        <div className="citation-examples"><span>EXAMPLES</span>{EXAMPLE_QUERIES.map((example) => <button key={example} onClick={() => search(example)}>{example}</button>)}</div>
      </section>

      <div className="citation-layout">
        <main className="citation-results-panel">
          <div className="citation-panel-head"><div><span>LIVE PUBMED</span><h2>{submittedQuery ? `Results for “${submittedQuery}”` : 'Search the literature'}</h2></div>{loading && <Loader2 size={15} className="animate-spin" />}</div>
          {!submittedQuery && <div className="citation-empty"><BookOpen size={21} /><strong>Enter the question you are researching.</strong><p>The query goes directly to PubMed search. No case record is created.</p></div>}
          {message && <div className="citation-message">{message}</div>}
          <div className="citation-article-list">
            {articles.map((article, index) => <div className="citation-article-row" key={article.pmid}><a href={article.url} target="_blank" rel="noreferrer"><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{article.title}</strong><small>{article.journal}{article.year ? ` · ${article.year}` : ''} · PMID {article.pmid}</small></div><ExternalLink size={12} /></a><button onClick={() => saveArticle(article)}>{savedPmid === article.pmid ? 'Saved' : 'Save Source'}</button></div>)}
          </div>
        </main>

        <aside className="citation-side">
          <section>
            <div className="citation-side-head"><span>OFFICIAL SOURCES</span><small>{OFFICIAL_SOURCES.length}</small></div>
            <div className="citation-official-list">{OFFICIAL_SOURCES.map((source) => <a key={source.name} href={source.url} target="_blank" rel="noreferrer"><div><strong>{source.name}</strong><small>{source.description}</small></div><ExternalLink size={10} /></a>)}</div>
          </section>

          <section>
            <div className="citation-side-head"><span>SAVED SOURCE LIBRARY</span><small>{savedMatches.length}</small></div>
            {savedMatches.length === 0 ? <p className="citation-side-empty">No saved sources match this search.</p> : <div className="citation-saved-list">{savedMatches.map((source) => <div key={source.id}><Database size={11} /><div><strong>{source.title || 'Untitled source'}</strong><small>{source.organization || source.sourceReliability || 'Saved source'}</small>{source.url && <a href={source.url} target="_blank" rel="noreferrer">Open <ExternalLink size={9} /></a>}</div></div>)}</div>}
          </section>
        </aside>
      </div>
    </div>
  );
}
