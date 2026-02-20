'use client';

import { useCallback, useRef } from 'react';
import { FlaskConical, Star, Radio } from 'lucide-react';
import { useBacktestStore } from '@/stores/backtest-store';
import { StrategyPanelContent } from '@/components/backtest/strategy-panel';
import { ChannelsPanelContent } from '@/components/signal-channel/channels-panel-content';
import { WatchlistPanel } from '@/components/watchlist/watchlist-panel';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type PanelType = 'strategy' | 'watchlist' | 'channels';

const ICON_ITEMS: { key: PanelType; icon: typeof FlaskConical; label: string }[] = [
  { key: 'strategy', icon: FlaskConical, label: 'Strategy Tester' },
  { key: 'watchlist', icon: Star, label: 'Watchlist' },
  { key: 'channels', icon: Radio, label: 'Signal Channels' },
];

function IconBar() {
  const { panelOpen, activePanel, setPanelOpen, setActivePanel } = useBacktestStore();

  const handleClick = (key: PanelType) => {
    if (panelOpen && activePanel === key) {
      // Same icon → toggle close
      setPanelOpen(false);
    } else {
      // Different icon or panel closed → switch/open
      setActivePanel(key);
      setPanelOpen(true);
    }
  };

  return (
    <TooltipProvider>
      <div className="w-10 flex-shrink-0 bg-[#131722] border-l border-[#2a2e39] flex flex-col items-center pt-2 gap-1">
        {ICON_ITEMS.map(({ key, icon: Icon, label }) => {
          const isActive = panelOpen && activePanel === key;
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleClick(key)}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                    isActive
                      ? 'bg-[#2962ff] text-white'
                      : 'text-[#787b86] hover:text-[#d1d4dc]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-[#1e222d] text-[#d1d4dc] border-[#2a2e39]">
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export function RightSidebar() {
  const { panelOpen, sidePanelWidth, setSidePanelWidth, activePanel } = useBacktestStore();

  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      resizeRef.current = { startX: e.clientX, startWidth: sidePanelWidth };

      const handleMouseMove = (ev: MouseEvent) => {
        if (!resizeRef.current) return;
        const delta = resizeRef.current.startX - ev.clientX;
        const newWidth = Math.min(800, Math.max(300, resizeRef.current.startWidth + delta));
        setSidePanelWidth(newWidth);
      };

      const handleMouseUp = () => {
        resizeRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [sidePanelWidth, setSidePanelWidth],
  );

  return (
    <div className="flex h-full">
      {panelOpen && (
        <>
          {/* Resize handle */}
          <div
            onMouseDown={handleResizeStart}
            className="w-1 cursor-col-resize hover:bg-[#2962ff] bg-[#2a2e39] flex-shrink-0 transition-colors"
          />

          {/* Panel content */}
          <div
            style={{ width: sidePanelWidth }}
            className="h-full border-l border-[#2a2e39] bg-[#131722] flex flex-col overflow-hidden"
          >
            {activePanel === 'strategy' && <StrategyPanelContent />}
            {activePanel === 'watchlist' && <WatchlistPanel />}
            {activePanel === 'channels' && <ChannelsPanelContent />}
          </div>
        </>
      )}

      {/* Icon bar — always visible */}
      <IconBar />
    </div>
  );
}
