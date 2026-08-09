import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export default class ToolErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Reviewer tool crashed', error, info);
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          maxWidth: 760,
          margin: '8vh auto 0',
          border: '1px solid rgba(245,183,177,.22)',
          background: 'rgba(28,18,22,.72)',
          borderRadius: 14,
          padding: '1.25rem 1.35rem',
          boxShadow: '0 18px 60px rgba(0,0,0,.28)',
        }}
        role="alert"
      >
        <div style={{ display: 'flex', gap: '.7rem', alignItems: 'flex-start' }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(239,68,68,.08)',
              border: '1px solid rgba(239,68,68,.16)',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={17} style={{ color: '#f5b7b1' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 800 }}>This tool hit an unexpected error.</div>
            <div style={{ marginTop: '.35rem', color: 'rgba(255,255,255,.52)', fontSize: '.78rem', lineHeight: 1.55 }}>
              The rest of the reviewer workspace is still available. Retry this tool, or use another tool from the navigation while the failure is investigated.
            </div>
            <div
              style={{
                marginTop: '.75rem',
                padding: '.55rem .65rem',
                borderRadius: 8,
                background: 'rgba(0,0,0,.18)',
                color: 'rgba(255,255,255,.4)',
                fontFamily: 'var(--app-font-mono)',
                fontSize: '.68rem',
                overflowWrap: 'anywhere',
              }}
            >
              {this.state.error.message || 'Unknown rendering error'}
            </div>
            <button
              type="button"
              onClick={this.retry}
              style={{
                marginTop: '.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '.4rem',
                border: '1px solid rgba(180,215,208,.22)',
                background: 'rgba(180,215,208,.08)',
                color: '#b4d7d0',
                borderRadius: 8,
                padding: '.5rem .7rem',
                cursor: 'pointer',
                fontWeight: 750,
                fontSize: '.72rem',
              }}
            >
              <RotateCcw size={13} /> Retry tool
            </button>
          </div>
        </div>
      </div>
    );
  }
}
