'use client';

import { MoreHorizontal, Play, Pause, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { GetUserStrategyDto } from '@/types/strategy';

interface StrategyCardProps {
  strategy: GetUserStrategyDto;
  onToggleActive: (userStrategyNo: number, isActive: boolean) => void;
  onDelete: (strategy: GetUserStrategyDto) => void;
}

export function StrategyCard({ strategy, onToggleActive, onDelete }: StrategyCardProps) {
  return (
    <Card className="bg-[#131722] border-[#2a2e39] hover:border-[#3a3e49] transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-sm text-[#d1d4dc] truncate">
              {strategy.name}
            </CardTitle>
            {strategy.description && (
              <CardDescription className="text-xs text-[#787b86] line-clamp-2">
                {strategy.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs" className="text-[#787b86] hover:text-[#d1d4dc] shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1e222d] border-[#2a2e39]">
              <DropdownMenuItem
                onClick={() => onToggleActive(strategy.userStrategyNo, strategy.isActive)}
                className="text-[#d1d4dc]"
              >
                {strategy.isActive ? (
                  <><Pause className="mr-2 h-4 w-4" /> Deactivate</>
                ) : (
                  <><Play className="mr-2 h-4 w-4" /> Activate</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-[#d1d4dc]">
                <Link href={`/strategy/${strategy.userStrategyNo}`}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#2a2e39]" />
              <DropdownMenuItem
                onClick={() => onDelete(strategy)}
                className="text-[#ef5350] focus:text-[#ef5350]"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={strategy.isActive ? 'default' : 'secondary'}
            className={
              strategy.isActive
                ? 'bg-[#26a69a]/20 text-[#26a69a] border-[#26a69a]/30'
                : 'bg-[#2a2e39] text-[#787b86] border-[#2a2e39]'
            }
          >
            {strategy.isActive ? 'Active' : 'Inactive'}
          </Badge>
          {strategy.symbols.map((s) => (
            <Badge key={s} variant="outline" className="text-[#787b86] border-[#2a2e39] text-xs">
              {s}
            </Badge>
          ))}
          <Badge variant="outline" className="text-[#787b86] border-[#2a2e39] text-xs">
            {strategy.timeframe}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
