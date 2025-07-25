
import { createContext } from 'react';

export type GlobalLoadingContextType = {
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  addLoadingOperation: (id: string) => void;
  removeLoadingOperation: (id: string) => void;
};

export const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);
