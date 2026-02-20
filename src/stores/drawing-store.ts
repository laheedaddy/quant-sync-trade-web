import { create } from 'zustand';
import type { UserChartDrawing, DrawingToolMode } from '@/types/chart';

interface DrawingState {
  drawings: UserChartDrawing[];
  toolMode: DrawingToolMode;
  refreshVersion: number;
  hiddenDrawingNos: number[];

  setDrawings: (drawings: UserChartDrawing[]) => void;
  addDrawing: (drawing: UserChartDrawing) => void;
  updateDrawing: (drawingNo: number, drawing: UserChartDrawing) => void;
  removeDrawing: (drawingNo: number) => void;
  setToolMode: (mode: DrawingToolMode) => void;
  resetTool: () => void;
  bumpRefreshVersion: () => void;
  toggleDrawingHidden: (drawingNo: number) => void;
}

export const useDrawingStore = create<DrawingState>((set) => ({
  drawings: [],
  toolMode: 'none',
  refreshVersion: 0,
  hiddenDrawingNos: [],

  setDrawings: (drawings) => set({ drawings }),
  addDrawing: (drawing) =>
    set((state) => ({
      drawings: [...state.drawings, drawing],
    })),
  updateDrawing: (drawingNo, drawing) =>
    set((state) => ({
      drawings: state.drawings.map((d) =>
        d.userChartDrawingNo === drawingNo ? drawing : d,
      ),
    })),
  removeDrawing: (drawingNo) =>
    set((state) => ({
      drawings: state.drawings.filter(
        (d) => d.userChartDrawingNo !== drawingNo,
      ),
    })),
  setToolMode: (toolMode) => set({ toolMode }),
  resetTool: () => set({ toolMode: 'none' }),
  bumpRefreshVersion: () => set((state) => ({ refreshVersion: state.refreshVersion + 1 })),
  toggleDrawingHidden: (drawingNo) =>
    set((state) => ({
      hiddenDrawingNos: state.hiddenDrawingNos.includes(drawingNo)
        ? state.hiddenDrawingNos.filter((n) => n !== drawingNo)
        : [...state.hiddenDrawingNos, drawingNo],
    })),
}));
