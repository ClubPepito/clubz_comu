import { create } from 'zustand';
import type { WidgetDefinition } from '@/types/widgetLibrary';
import { widgetLibraryService } from '@/services/api';
import toast from 'react-hot-toast';

interface WidgetLibraryState {
  definitions: WidgetDefinition[];
  isLoading: boolean;
  error: string | null;

  fetchMarketplace: () => Promise<void>;
  fetchMyWidgets: () => Promise<void>;

  getValidated: () => WidgetDefinition[];
  getPending: () => WidgetDefinition[];

  removeDraft: (id: string) => Promise<void>;
  submitForModeration: (id: string) => Promise<void>;
}

export const useWidgetLibraryStore = create<WidgetLibraryState>((set, get) => ({
  definitions: [],
  isLoading: false,
  error: null,

  fetchMarketplace: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await widgetLibraryService.getMarketplace();
      const widgets: WidgetDefinition[] = res.data || [];
      set((state) => {
        const merged = [...state.definitions];
        widgets.forEach((w) => {
          const idx = merged.findIndex((e) => e.id === w.id);
          if (idx >= 0) merged[idx] = w;
          else merged.push(w);
        });
        return { definitions: merged, isLoading: false };
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      toast.error('Impossible de charger la marketplace.');
    }
  },

  fetchMyWidgets: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await widgetLibraryService.getMyWidgets();
      const widgets: WidgetDefinition[] = res.data || [];
      set((state) => {
        const merged = [...state.definitions];
        widgets.forEach((w) => {
          const idx = merged.findIndex((e) => e.id === w.id);
          if (idx >= 0) merged[idx] = w;
          else merged.push(w);
        });
        return { definitions: merged, isLoading: false };
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      toast.error('Impossible de charger vos widgets.');
    }
  },

  getValidated: () =>
    get().definitions.filter((d) => d.status === 'validated' && !d.isKilled),

  getPending: () =>
    get().definitions.filter((d) => d.status === 'pending'),

  removeDraft: async (id) => {
    try {
      await widgetLibraryService.delete(id);
      set((state) => ({
        definitions: state.definitions.filter((d) => d.id !== id),
      }));
      toast.success('Widget supprimé.');
    } catch (err: any) {
      toast.error('Erreur lors de la suppression.');
    }
  },

  submitForModeration: async (id) => {
    try {
      const res = await widgetLibraryService.update(id, { status: 'pending' });
      set((state) => ({
        definitions: state.definitions.map((d) =>
          d.id === id ? { ...d, ...res.data } : d
        ),
      }));
      toast.success('Widget soumis à modération.');
    } catch (err: any) {
      toast.error('Erreur lors de la soumission.');
    }
  },
}));
