const fs = require('fs');
const content = `import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || <div className="p-4 text-xs text-rose-400 border border-rose-500/30 bg-rose-900/20 rounded">Terjadi kesalahan saat memuat grafik.</div>;
    }

    return this.props.children;
  }
}
`;
fs.writeFileSync('src/components/ErrorBoundary.tsx', content);
