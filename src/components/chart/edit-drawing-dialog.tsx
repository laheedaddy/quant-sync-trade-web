'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { UserChartDrawing, DrawingStyle } from '@/types/chart';

const LINE_WIDTH_OPTIONS = [1, 2, 3, 4];

interface EditDrawingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drawing: UserChartDrawing | null;
  onUpdate: (drawingNo: number, style: DrawingStyle) => Promise<void>;
}

export function EditDrawingDialog({ open, onOpenChange, drawing, onUpdate }: EditDrawingDialogProps) {
  const [lineColor, setLineColor] = useState('#2962ff');
  const [lineWidth, setLineWidth] = useState(2);
  const [fillColor, setFillColor] = useState('#2962ff');
  const [fillOpacity, setFillOpacity] = useState(0.1);
  const [extendRight, setExtendRight] = useState(true);
  const [extendLeft, setExtendLeft] = useState(false);
  const [dashed, setDashed] = useState(false);
  const [showPriceLabel, setShowPriceLabel] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !drawing) return;
    const s = drawing.style;
    setLineColor(s.lineColor ?? '#2962ff');
    setLineWidth(s.lineWidth ?? 2);
    setFillColor(s.fillColor ?? '#2962ff');
    setFillOpacity(s.fillOpacity ?? 0.1);
    setExtendRight(s.extendRight ?? true);
    setExtendLeft(s.extendLeft ?? false);
    setDashed(s.dashed ?? false);
    setShowPriceLabel(s.showPriceLabel ?? true);
  }, [open, drawing]);

  if (!drawing) return null;

  const isChannel = drawing.drawingType === 'PARALLEL_CHANNEL';
  const isHLine = drawing.drawingType === 'HORIZONTAL_LINE';

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const style: DrawingStyle = {
        lineColor,
        lineWidth,
        ...(isChannel && {
          fillColor,
          fillOpacity,
          extendRight,
          extendLeft,
        }),
        ...(isHLine && {
          dashed,
          showPriceLabel,
        }),
      };
      await onUpdate(drawing.userChartDrawingNo, style);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const drawingLabel = isChannel ? 'Channel' : isHLine ? 'H-Line' : 'Ray';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs bg-[#1e222d] border-[#2a2e39] text-[#d1d4dc]">
        <DialogHeader>
          <DialogTitle className="text-sm">{drawingLabel} Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {/* Line Color */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-[#787b86]">Line Color</Label>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded border border-[#2a2e39] cursor-pointer"
                style={{ backgroundColor: lineColor }}
              />
              <input
                type="color"
                value={lineColor}
                onChange={(e) => setLineColor(e.target.value)}
                className="w-6 h-6 cursor-pointer bg-transparent border-0 p-0"
              />
            </div>
          </div>

          {/* Line Width */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-[#787b86]">Line Width</Label>
            <Select value={String(lineWidth)} onValueChange={(v) => setLineWidth(Number(v))}>
              <SelectTrigger className="w-16 h-7 text-xs bg-[#131722] border-[#2a2e39]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e222d] border-[#2a2e39]">
                {LINE_WIDTH_OPTIONS.map((w) => (
                  <SelectItem key={w} value={String(w)} className="text-xs text-[#d1d4dc]">{w}px</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Channel-specific options */}
          {isChannel && (
            <>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#787b86]">Fill Color</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border border-[#2a2e39] cursor-pointer"
                    style={{ backgroundColor: fillColor, opacity: fillOpacity }}
                  />
                  <input
                    type="color"
                    value={fillColor}
                    onChange={(e) => setFillColor(e.target.value)}
                    className="w-6 h-6 cursor-pointer bg-transparent border-0 p-0"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#787b86]">Extend Right</Label>
                <Switch checked={extendRight} onCheckedChange={setExtendRight} />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#787b86]">Extend Left</Label>
                <Switch checked={extendLeft} onCheckedChange={setExtendLeft} />
              </div>
            </>
          )}

          {/* H-Line specific options */}
          {isHLine && (
            <>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#787b86]">Dashed</Label>
                <Switch checked={dashed} onCheckedChange={setDashed} />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#787b86]">Price Label</Label>
                <Switch checked={showPriceLabel} onCheckedChange={setShowPriceLabel} />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#2962ff] hover:bg-[#1e53e5] text-white text-xs"
          >
            {loading ? 'Saving...' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
