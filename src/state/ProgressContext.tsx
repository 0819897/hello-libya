import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { Progress } from '../types';
import { defaultProgress, loadProgress, saveProgress } from './progress';

type Ctx = { progress: Progress; update: (fn: (p: Progress) => Progress) => void };
const ProgressCtx = createContext<Ctx>({ progress: defaultProgress(), update: () => {} });

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const update = useCallback((fn: (p: Progress) => Progress) => {
    setProgress(prev => { const next = fn(prev); saveProgress(next); return next; });
  }, []);
  return <ProgressCtx.Provider value={{ progress, update }}>{children}</ProgressCtx.Provider>;
}

export const useProgress = () => useContext(ProgressCtx);
