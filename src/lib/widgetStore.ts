import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Layout } from 'react-grid-layout';

export interface WidgetType {
  id: string;
  type: string;
  title: string;
  config?: any;
}

interface WidgetState {
  widgets: WidgetType[];
  layouts: { [key: string]: Layout[] };
  addWidget: (type: string, title: string, config?: any, layoutOverrides?: { x: number, y: number, w?: number, h?: number }) => void;
  removeWidget: (id: string) => void;
  updateLayouts: (currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => void;
}

const defaultWidgets: WidgetType[] = [
  { id: 'terminal_setup', type: 'traderSetup', title: 'TERMINAL CONFIGURATION' },
  { id: 'social_media', type: 'blank', title: 'SOCIAL MEDIA' },
  { id: 'trading_charts', type: 'tradingview', title: 'TRADING CHARTS', config: { symbol: 'BINANCE:BTCUSDT' } },
  { id: 'financial_media', type: 'blank', title: 'FINANCIAL MEDIA' },
  { id: 'political_news', type: 'blank', title: 'POLITICAL NEWS' },
  { id: 'breaking_news', type: 'blank', title: 'BREAKING NEWS' },
  { id: 'local_news', type: 'blank', title: 'LOCAL NEWS' },
  { id: 'public_broadcasting', type: 'blank', title: 'PUBLIC BROADCASTING' },
  { id: 'independent_media', type: 'blank', title: 'INDEPENDENT MEDIA' },
];

const defaultLayout = {
  lg: [
    { i: 'financial_media', x: 0, y: 0, w: 3, h: 8 },
    { i: 'political_news', x: 0, y: 8, w: 3, h: 8 },
    { i: 'breaking_news', x: 0, y: 16, w: 3, h: 8 },
    { i: 'local_news', x: 0, y: 24, w: 3, h: 8 },
    
    { i: 'terminal_setup', x: 3, y: 0, w: 5, h: 10 },
    { i: 'social_media', x: 3, y: 10, w: 5, h: 14 },
    { i: 'public_broadcasting', x: 3, y: 24, w: 5, h: 14 },
    
    { i: 'trading_charts', x: 8, y: 0, w: 4, h: 16 },
    { i: 'independent_media', x: 8, y: 16, w: 4, h: 16 },
  ]
};

export const useWidgetStore = create<WidgetState>()(
  persist(
    (set) => ({
      widgets: defaultWidgets,
      layouts: defaultLayout as any,
      addWidget: (type, title, config, layoutOverrides) => {
        set((state) => {
          const id = `${type}_${Date.now()}`;
          const newWidget = { id, type, title, config };
          
          // Add to layouts at the bottom
          const lgLayouts = state.layouts.lg || [];
          const maxY = lgLayouts.reduce((max, item: any) => Math.max(max, item.y + item.h), 0);
          
          const newLayouts = {
            ...state.layouts,
            lg: [...lgLayouts, { 
              i: id, 
              x: layoutOverrides?.x ?? 0, 
              y: layoutOverrides?.y ?? maxY, 
              w: layoutOverrides?.w ?? 6, 
              h: layoutOverrides?.h ?? 8 
            } as any]
          };
          
          return {
            widgets: [...state.widgets, newWidget],
            layouts: newLayouts
          };
        });
      },
      removeWidget: (id) => {
        // Prevent removing the static ones
        if (id === 'status' || id === 'feed') return;
        set((state) => ({
          widgets: state.widgets.filter((w) => w.id !== id),
        }));
      },
      updateLayouts: (currentLayout, allLayouts) => {
        set({ layouts: allLayouts as any });
      }
    }),
    {
      name: 'widget-storage-v15',
    }
  )
);
