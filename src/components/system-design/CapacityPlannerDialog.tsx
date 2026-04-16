import { useState } from 'react';
import { useDesignStore } from '@/store/useDesignStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart3 } from 'lucide-react';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

export default function CapacityPlannerDialog() {
  const [open, setOpen] = useState(false);
  const [growthFactor, setGrowthFactor] = useState(1.5);
  const [trafficSpikeMultiplier, setTrafficSpikeMultiplier] = useState(1.25);
  const { nodes, buildCapacityPlan } = useDesignStore();

  const plan = buildCapacityPlan(growthFactor, trafficSpikeMultiplier);

  const highRiskCount = plan.nodes.filter((node) => node.projectedUtilizationPct >= 90).length;
  const mediumRiskCount = plan.nodes.filter((node) => node.projectedUtilizationPct >= 70 && node.projectedUtilizationPct < 90).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={nodes.length === 0}>
              <BarChart3 className="w-4 h-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Capacity planner</TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Capacity Planner</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-border p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Long-term growth</span>
                <Badge variant="secondary">{growthFactor.toFixed(2)}x</Badge>
              </div>
              <Slider
                value={[growthFactor]}
                min={1}
                max={5}
                step={0.25}
                onValueChange={([v]) => setGrowthFactor(v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Traffic spike</span>
                <Badge variant="secondary">{trafficSpikeMultiplier.toFixed(2)}x</Badge>
              </div>
              <Slider
                value={[trafficSpikeMultiplier]}
                min={1}
                max={4}
                step={0.25}
                onValueChange={([v]) => setTrafficSpikeMultiplier(v)}
              />
            </div>

            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Combined what-if multiplier: <span className="font-semibold text-foreground">{plan.totalProjectedMultiplier.toFixed(2)}x</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="rounded-lg border border-border p-2">
                Current hourly cost: <span className="font-semibold text-foreground">{usd.format(plan.totalHourlyCost)}</span>
              </div>
              <div className="rounded-lg border border-border p-2">
                Projected hourly cost: <span className="font-semibold text-foreground">{usd.format(plan.projectedHourlyCost)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-12 gap-2 bg-muted/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <div className="col-span-3">Node</div>
              <div className="col-span-2">RPS now</div>
              <div className="col-span-2">RPS projected</div>
              <div className="col-span-1">Replicas</div>
              <div className="col-span-1">Needed</div>
              <div className="col-span-1">Risk</div>
              <div className="col-span-2">Projected $/h</div>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {plan.nodes.map((node) => (
                <div key={node.nodeId} className="grid grid-cols-12 gap-2 px-3 py-2 text-xs border-t border-border/60 items-center">
                  <div className="col-span-3 font-medium truncate">{node.label}</div>
                  <div className="col-span-2 font-mono">{Math.round(node.currentRps)}</div>
                  <div className="col-span-2 font-mono">{Math.round(node.projectedRps)}</div>
                  <div className="col-span-1">{node.replicas}</div>
                  <div className="col-span-1">
                    <Badge variant={node.requiredReplicas > node.replicas ? 'destructive' : 'secondary'}>
                      {node.requiredReplicas}
                    </Badge>
                  </div>
                  <div className="col-span-1">
                    <Badge
                      variant={node.projectedUtilizationPct >= 90 ? 'destructive' : 'secondary'}
                      className={node.projectedUtilizationPct >= 70 && node.projectedUtilizationPct < 90 ? 'text-amber-600 dark:text-amber-400' : undefined}
                    >
                      {node.projectedUtilizationPct >= 90 ? 'High' : node.projectedUtilizationPct >= 70 ? 'Med' : 'Low'}
                    </Badge>
                  </div>
                  <div className="col-span-2 font-mono">{usd.format(node.projectedHourlyCost)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Nodes needing scale-up: <span className="font-semibold text-foreground">{plan.nodes.filter((n) => n.requiredReplicas > n.replicas).length}</span>
            {' · '}
            Bottlenecks if unchanged: <span className="font-semibold text-foreground">{plan.projectedBottlenecks}</span>
            {' · '}
            High risk: <span className="font-semibold text-foreground">{highRiskCount}</span>
            {' · '}
            Medium risk: <span className="font-semibold text-foreground">{mediumRiskCount}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
