import React, { Component, type ReactNode } from "react";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Optional name shown in error messages and console logs */
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * Error boundary that catches lazy-loading failures (chunk load errors) and
 * other render-time exceptions.
 *
 * Behaviour:
 * 1. On the **first** failure it silently retries by resetting its state
 *    (re-triggers the lazy import automatically).
 * 2. On subsequent failures it renders a user-friendly fallback with a
 *    "Retry" button and logs detailed diagnostics to the console.
 */
export default class LazyErrorBoundary extends Component<Props, State> {
  static MAX_AUTO_RETRIES = 1;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const label = this.props.name || "Unknown";
    const isChunkError =
      /loading chunk|failed to fetch dynamically imported module|error loading dynamically imported module/i.test(
        error.message
      );

    console.error(
      `[LazyErrorBoundary][${label}] ${isChunkError ? "Chunk load failure" : "Render error"}`,
      {
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
        retryCount: this.state.retryCount,
        timestamp: new Date().toISOString(),
      }
    );

    // Auto-retry once for chunk-load errors (network glitch, stale SW cache)
    if (isChunkError && this.state.retryCount < LazyErrorBoundary.MAX_AUTO_RETRIES) {
      console.info(
        `[LazyErrorBoundary][${label}] Auto-retrying (attempt ${this.state.retryCount + 1})…`
      );
      this.setState((prev) => ({
        hasError: false,
        error: null,
        retryCount: prev.retryCount + 1,
      }));
    }
  }

  handleManualRetry = () => {
    console.info(
      `[LazyErrorBoundary][${this.props.name || "Unknown"}] Manual retry triggered`
    );
    this.setState({ hasError: false, error: null, retryCount: 0 });
  };

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error &&
        /loading chunk|failed to fetch dynamically imported module|error loading dynamically imported module/i.test(
          this.state.error.message
        );

      return (
        <div className="flex-1 min-h-[50vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {isChunkError
                ? "Error al cargar el módulo"
                : "Algo salió mal"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              {isChunkError
                ? "No se pudo descargar un recurso necesario. Verifica tu conexión e intenta de nuevo."
                : "Ocurrió un error inesperado al mostrar esta sección."}
            </p>
          </div>
          <button
            onClick={this.handleManualRetry}
            className="mt-2 flex items-center gap-2 bg-sky-600 dark:bg-brand-600 hover:bg-sky-700 dark:hover:bg-brand-700 text-white font-bold text-sm py-2.5 px-5 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar</span>
          </button>
          {this.state.error && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-2 max-w-sm break-all">
              {this.state.error.message}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
