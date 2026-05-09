import type { AppError, ErrorState } from "@shared/errorTypes";
import { newErrorId } from "@shared/errorId";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const MAX_HISTORY = 24;

type Ctx = {
  state: ErrorState;
  pushError: (e: AppError) => void;
  dismissActive: () => void;
  clearHistory: () => void;
  queueRetry: (id: string) => void;
  dequeueRetry: (id: string) => void;
  markDegraded: (v: boolean) => void;
  markSuccess: () => void;
};

const ErrorSurfaceContext = createContext<Ctx | null>(null);

const initial: ErrorState = {
  active: null,
  history: [],
  pendingRetryIds: [],
  isDegraded: false,
};

export function ErrorSurfaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ErrorState>(initial);

  const pushError = useCallback((e: AppError) => {
    const err = { ...e, id: e.id || newErrorId() };
    setState((prev) => ({
      ...prev,
      active: err,
      history: [err, ...prev.history].slice(0, MAX_HISTORY),
      lastFailureAt: new Date().toISOString(),
      isDegraded:
        prev.isDegraded ||
        err.severity === "warning" ||
        err.code === "DEGRADED_MODE",
    }));
  }, []);

  const dismissActive = useCallback(() => {
    setState((prev) => ({ ...prev, active: null }));
  }, []);

  const clearHistory = useCallback(() => {
    setState((prev) => ({ ...prev, history: [] }));
  }, []);

  const queueRetry = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      pendingRetryIds: prev.pendingRetryIds.includes(id)
        ? prev.pendingRetryIds
        : [...prev.pendingRetryIds, id],
    }));
  }, []);

  const dequeueRetry = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      pendingRetryIds: prev.pendingRetryIds.filter((x) => x !== id),
    }));
  }, []);

  const markDegraded = useCallback((v: boolean) => {
    setState((prev) => ({ ...prev, isDegraded: v }));
  }, []);

  const markSuccess = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lastSuccessAt: new Date().toISOString(),
    }));
  }, []);

  const value = useMemo(
    () => ({
      state,
      pushError,
      dismissActive,
      clearHistory,
      queueRetry,
      dequeueRetry,
      markDegraded,
      markSuccess,
    }),
    [
      state,
      pushError,
      dismissActive,
      clearHistory,
      queueRetry,
      dequeueRetry,
      markDegraded,
      markSuccess,
    ],
  );

  return (
    <ErrorSurfaceContext.Provider value={value}>
      {children}
    </ErrorSurfaceContext.Provider>
  );
}

export function useErrorSurface(): Ctx | null {
  return useContext(ErrorSurfaceContext);
}
