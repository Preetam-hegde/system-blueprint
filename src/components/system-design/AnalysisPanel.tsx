import { useDesignStore } from '@/store/useDesignStore';
import { AlertTriangle, AlertCircle, Clock, CheckCircle2, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

const ICON_MAP = {
  bottleneck: AlertCircle,
  spof: AlertTriangle,
  latency: Clock,
};

export default function AnalysisPanel() {
  const { warnings, nodes, edges, simulation } = useDesignStore();
  const [expanded, setExpanded] = useState(false);

  const criticalCount = warnings.filter((w) => w.severity === 'critical').length;
  const warningCount = warnings.length - criticalCount;

  return (
    <div className="border-t border-border glass shrink-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full h-10 flex items-center px-4 hover:bg-accent/50"
      >
        <div className="flex items-center gap-2">
          {warnings.length === 0 ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-muted-foreground">No issues detected</span>
            </>
          ) : (
            <>
              {criticalCount > 0 && (
                <Badge variant="destructive" className="text-[10px] h-5 px-1.5 gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {criticalCount} critical
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 gap-1 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  {warningCount} warning{warningCount > 1 ? 's' : ''}
                </Badge>
              )}
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>{nodes.length} nodes</span>
          <span className="opacity-40">·</span>
          <span>{edges.length} connections</span>
          {simulation.running && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-1 text-emerald-500 border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </Badge>
          )}
          {warnings.length > 0 && (
            expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />
          )}
        </div>
      </button>
      {expanded && warnings.length > 0 && (
        <div className="max-h-40 overflow-y-auto px-3 pb-2 space-y-1 stagger-children animate-slide-up">
          {warnings.map((w) => {
            const Icon = ICON_MAP[w.type];
            return (
              <div
                key={w.id}
                className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${
                  w.severity === 'critical'
                    ? 'bg-destructive/10 text-destructive border border-destructive/20'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{w.message}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
