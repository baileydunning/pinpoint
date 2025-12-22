import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage?: string;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown) {
    // Surface the error in devtools; helps us debug issues that otherwise blank-screen.
    // eslint-disable-next-line no-console
    console.error("App crashed:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 space-y-4">
          <h1 className="font-display text-2xl text-foreground">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            The app hit a runtime error and couldn’t render this screen.
          </p>
          {this.state.errorMessage && (
            <pre className="text-xs whitespace-pre-wrap bg-muted text-muted-foreground rounded p-3 border border-border">
              {this.state.errorMessage}
            </pre>
          )}
          <div className="flex gap-3">
            <Button onClick={() => window.location.reload()} className="flex-1">
              Reload
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")} className="flex-1">
              Home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
