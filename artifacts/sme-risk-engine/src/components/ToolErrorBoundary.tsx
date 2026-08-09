import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ToolErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Reviewer tool crashed', error, info);
  }

  private retry = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="tool-error-panel" role="alert">
        <div className="tool-error-icon"><AlertTriangle size={17} /></div>
        <div>
          <div className="tool-error-title">This tool hit an unexpected error.</div>
          <div className="tool-error-copy">The workspace is still available. Retry the tool or choose another item from the navigation.</div>
          <div className="tool-error-detail">{this.state.error.message || 'Unknown rendering error'}</div>
          <button type="button" className="tool-error-retry" onClick={this.retry}><RotateCcw size={13} /> Retry tool</button>
        </div>
      </div>
    );
  }
}
