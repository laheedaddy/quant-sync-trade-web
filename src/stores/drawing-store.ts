import { create } from 'zustand';
import type { UserChartDrawing, DrawingToolMode } from '@/types/chart';

interface DrawingState {
  drawings: UserChartDrawing[];
  toolMode: DrawingToolMode;
  refreshVersion: number;

  setDrawings: (drawings: UserChartDrawing[]) => void;
  addDrawing: (drawing: UserChartDrawing) => void;
  updateDrawing: (drawingNo: number, drawing: UserChartDrawing) => void;
  removeDrawing: (drawingNo: number) => void;
  setToolMode: (mode: DrawingToolMode) => void;
  resetTool: () => void;
  bumpRefreshVersion: () => void;
}

export const useDrawingStore = create<DrawingState>((set) => ({
  drawings: [],
  toolMode: 'none',
  refreshVersion: 0,

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
}));
