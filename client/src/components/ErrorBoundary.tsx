import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  title?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl text-center space-y-3 max-w-md mx-auto mt-12">
          <p className="text-sm font-semibold text-rose-700">
            {this.props.title ?? 'Something went wrong loading this page.'}
          </p>
          <p className="text-xs text-rose-600">{this.state.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
