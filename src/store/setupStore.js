import { create } from 'zustand';
import { setupService } from '../services/setup';

export const useSetupStore = create((set) => ({
  items: [],
  loading: false,
  loaded: false,
  error: null,

  fetchStatus: async () => {
    set({ loading: true });
    const result = await setupService.getSetupStatus();
    set({
      items: result.success ? result.items : [],
      loading: false,
      loaded: true,
      error: result.success ? null : result.error
    });
    return result;
  }
}));
