import { create } from "zustand";

interface GameState {
  score: number;
  currentLane: number;
  setLane: (lane: number) => void;
  incrementScore: () => void;
}

export const useStore = create<GameState>((set) => ({
  score: 0,
  currentLane: 0,
  setLane: (lane) => set({ currentLane: lane }),
  incrementScore: () => set((state) => ({ score: state.score + 1 })),
}));
