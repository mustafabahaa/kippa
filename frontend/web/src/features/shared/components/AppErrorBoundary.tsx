import { Component, type ErrorInfo, type ReactNode } from 'react';
import { SystemStatusPage } from './SystemStatusPage';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled app rendering error', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <SystemStatusPage status="error" onRetry={() => window.location.reload()} />;
    }

    return this.props.children;
  }
}
