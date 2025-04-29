import React, { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode | ((error: Error) => ReactNode);
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch JavaScript errors in child component trees,
 * log those errors, and display a fallback UI.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  // Reset error state when children change
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (prevProps.children !== this.props.children) {
      this.setState({
        hasError: false,
        error: null
      });
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI
      return typeof this.props.fallback === 'function'
        ? this.props.fallback(this.state.error as Error)
        : this.props.fallback;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;