import { create } from "zustand";

interface SpatialSettingsState {
  tooltipEnabled: boolean;
  toggleTooltip: () => void;
  setTooltipEnabled: (enabled: boolean) => void;
}

export const useSpatialSettings = create<SpatialSettingsState>((set) => ({
  tooltipEnabled: true,
  toggleTooltip: () =>
    set((state) => ({ tooltipEnabled: !state.tooltipEnabled })),
  setTooltipEnabled: (enabled) => set({ tooltipEnabled: enabled }),
}));
