import { create } from 'zustand';
import { ApiMuestra, ApiRegion, ApiMicrografia } from '../types';
import * as api from '../services/api';

type Updater<T> = T | ((prev: T) => T);

interface DataState {
  apiMuestras: ApiMuestra[];
  apiMateriales: api.ApiMaterial[];
  apiRegiones: ApiRegion[];
  apiMicrografias: ApiMicrografia[];
  expandedIds: Set<string>;
  selectedId: string | null;
  isLoading: boolean;
  
  setApiMuestras: (updater: Updater<ApiMuestra[]>) => void;
  setApiMateriales: (updater: Updater<api.ApiMaterial[]>) => void;
  setApiRegiones: (updater: Updater<ApiRegion[]>) => void;
  setApiMicrografias: (updater: Updater<ApiMicrografia[]>) => void;
  setExpandedIds: (updater: Updater<Set<string>>) => void;
  setSelectedId: (id: string | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useDataStore = create<DataState>((set) => ({
  apiMuestras: [],
  apiMateriales: [],
  apiRegiones: [],
  apiMicrografias: [],
  expandedIds: new Set(),
  selectedId: null,
  isLoading: false,

  setApiMuestras: (updater) => set((state) => ({ 
      apiMuestras: typeof updater === 'function' ? updater(state.apiMuestras) : updater 
  })),
  setApiMateriales: (updater) => set((state) => ({ 
      apiMateriales: typeof updater === 'function' ? updater(state.apiMateriales) : updater 
  })),
  setApiRegiones: (updater) => set((state) => ({ 
      apiRegiones: typeof updater === 'function' ? updater(state.apiRegiones) : updater 
  })),
  setApiMicrografias: (updater) => set((state) => ({ 
      apiMicrografias: typeof updater === 'function' ? updater(state.apiMicrografias) : updater 
  })),
  setExpandedIds: (updater) => set((state) => ({ 
      expandedIds: typeof updater === 'function' ? updater(state.expandedIds) : updater 
  })),
  setSelectedId: (id) => set({ selectedId: id }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
