"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", background: "#000", color: "#FFF", gap: 16,
          minHeight: 200,
        }}>
          <div style={{
            fontFamily: "var(--font-mono), monospace", fontSize: 12,
            color: "#FF3030", letterSpacing: ".04em",
          }}>
            viewer error
          </div>
          <div style={{
            fontFamily: "var(--font-mono), monospace", fontSize: 10,
            color: "#666", maxWidth: 300, textAlign: "center",
          }}>
            {this.state.error?.message || "something went wrong"}
          </div>
          <button onClick={this.handleRetry} style={{
            fontFamily: "var(--font-mono), monospace", fontSize: 11,
            letterSpacing: ".08em", padding: "8px 20px",
            border: "1px solid #1A1A1A", background: "transparent",
            color: "#666", cursor: "pointer",
          }}>
            retry →
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
