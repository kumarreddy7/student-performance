import type { ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';

/** Wraps Recharts trees so a chart bug does not blank the whole page. */
export default function SafeChart({
  children,
  height = 288,
}: {
  children: ReactNode;
  height?: number;
}) {
  return (
    <ErrorBoundary title="Chart failed to render">
      <div style={{ width: '100%', height, minHeight: height }}>{children}</div>
    </ErrorBoundary>
  );
}
