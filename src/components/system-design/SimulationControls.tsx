import { useEffect, useRef, useState } from 'react';
import { useDesignStore, type SystemNodeData } from '@/store/useDesignStore';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Play, Pause, SkipForward, RotateCcw, SlidersHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SavedSimulationPreset, SimulationScenarioType } from '@/types/system-design';

const SIM_PRESET_STORAGE_KEY = 'sd-simulation-presets';
const DEFAULT_SCENARIO_LATENCY_MS = 180;
const DEFAULT_BACKLOG_SEVERITY = 65;

const getScenarioLabel = (type: SimulationScenarioType) => {
  switch (type) {
    case 'zone-outage':
      return 'Zone outage';
    case 'regional-latency':
      return 'High-latency region';
    case 'queue-backlog':
      return 'Queue backlog';
    default:
      return 'No scenario';
  }
};

const loadSavedPresets = (): SavedSimulationPreset[] => {
  try {
    const raw = localStorage.getItem(SIM_PRESET_STORAGE_KEY);
    return raw ? JSON.parse(raw) as SavedSimulationPreset[] : [];
  } catch {
    return [];
  }
};

export default function SimulationControls() {
  const {
    simulation, setSimulation, updateNodeLoads, runAnalysis,
    nodes, advanceSimulationStep, resetSimulationReplay, toggleNodeFailure,
  } = useDesignStore(useShallow(state => ({
    simulation: state.simulation,
    setSimulation: state.setSimulation,
    updateNodeLoads: state.updateNodeLoads,
    runAnalysis: state.runAnalysis,
    nodes: state.nodes,
    advanceSimulationStep: state.advanceSimulationStep,
    resetSimulationReplay: state.resetSimulationReplay,
    toggleNodeFailure: state.toggleNodeFailure,
  })));
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [savedPresets, setSavedPresets] = useState<SavedSimulationPreset[]>(loadSavedPresets);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const elapsedRef = useRef<number | null>(null);

  const getNodeData = (node: typeof nodes[number]) => node.data as unknown as SystemNodeData;
  const regions = [...new Set(nodes.map((node) => getNodeData(node).region).filter(Boolean))].sort();
  const messagingNodes = nodes.filter((node) => getNodeData(node).category === 'messaging');
  const manualFailedSet = new Set(simulation.manualFailedNodeIds);
  const scenarioFailedSet = new Set(simulation.failedNodeIds.filter((id) => !manualFailedSet.has(id)));
  const simulationModeLabel = simulation.mode === 'replay' ? `Replay ${simulation.step}/${simulation.maxSteps}` : 'Live';
  const replayProgressPct = Math.round((simulation.step / Math.max(simulation.maxSteps, 1)) * 100);
  const activeScenarioLabel = getScenarioLabel(simulation.scenario.type);
  const replayTrace = simulation.replayTrace;

  const clearTimers = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
  };

  useEffect(() => {
    localStorage.setItem(SIM_PRESET_STORAGE_KEY, JSON.stringify(savedPresets));
  }, [savedPresets]);

  useEffect(() => {
    if (!simulation.running) {
      clearTimers();
      return;
    }

    const tickMs = Math.max(100, 1000 / Math.max(simulation.speed, 0.5));
    intervalRef.current = window.setInterval(() => {
      const state = useDesignStore.getState();
      if (state.simulation.mode === 'replay') {
        state.advanceSimulationStep();
      } else {
        state.updateNodeLoads();
        state.runAnalysis();
      }
    }, tickMs);

    elapsedRef.current = window.setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearTimers();
  }, [simulation.running, simulation.speed, simulation.mode]);

  const applySimulationChanges = (changes: Parameters<typeof setSimulation>[0]) => {
    setSimulation(changes);
    updateNodeLoads();
    runAnalysis();
  };

  const toggleSimulation = () => {
    if (simulation.running) {
      setSimulation({ running: false });
      clearTimers();
      return;
    }

    const replayReset = simulation.mode === 'replay' && simulation.step >= simulation.maxSteps;
    setSimulation({ running: true, step: replayReset ? 0 : simulation.step });
    if (elapsed === 0 || replayReset) setElapsed(0);
    updateNodeLoads();
    runAnalysis();
  };

  const switchSimulationMode = (mode: 'live' | 'replay') => {
    if (mode === 'live') {
      setSimulation({ mode: 'live', running: false, step: 0 });
      clearTimers();
      return;
    }
    setSimulation({ mode: 'replay', running: false, step: 0 });
    clearTimers();
    setElapsed(0);
  };

  const updateScenarioType = (type: SimulationScenarioType) => {
    if (type === 'none') {
      applySimulationChanges({ scenario: { type: 'none' } });
      return;
    }

    if (type === 'zone-outage') {
      applySimulationChanges({
        scenario: {
          type,
          region: simulation.scenario.region || regions[0] || 'us-east-1',
        },
      });
      return;
    }

    if (type === 'regional-latency') {
      applySimulationChanges({
        scenario: {
          type,
          region: simulation.scenario.region || regions[0] || 'us-east-1',
          latencyMs: simulation.scenario.latencyMs || DEFAULT_SCENARIO_LATENCY_MS,
        },
      });
      return;
    }

    applySimulationChanges({
      scenario: {
        type,
        queueNodeIds: simulation.scenario.queueNodeIds?.length
          ? simulation.scenario.queueNodeIds
          : (messagingNodes[0] ? [messagingNodes[0].id] : []),
        backlogSeverity: simulation.scenario.backlogSeverity || DEFAULT_BACKLOG_SEVERITY,
      },
    });
  };

  const saveCurrentPreset = () => {
    const name = presetName.trim() || `Preset ${savedPresets.length + 1}`;
    const preset: SavedSimulationPreset = {
      id: `sim-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      simulation: {
        speed: simulation.speed,
        rps: simulation.rps,
        mode: simulation.mode,
        maxSteps: simulation.maxSteps,
        packetLossPct: simulation.packetLossPct,
        retryAttempts: simulation.retryAttempts,
        retryBackoffMs: simulation.retryBackoffMs,
        extraLatencyMs: simulation.extraLatencyMs,
        manualFailedNodeIds: simulation.manualFailedNodeIds,
        scenario: simulation.scenario,
      },
    };
    setSavedPresets((current) => [preset, ...current].slice(0, 8));
    setPresetName('');
    toast.success(`Saved preset: ${name}`);
  };

  const applyPreset = (preset: SavedSimulationPreset) => {
    clearTimers();
    setElapsed(0);
    setSimulation({
      ...preset.simulation,
      running: false,
      step: 0,
      failedNodeIds: preset.simulation.manualFailedNodeIds,
    });
    updateNodeLoads();
    runAnalysis();
    toast.success(`Applied preset: ${preset.name}`);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="border-t border-border/70 bg-muted/15 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
          <Button
            variant={simulation.mode === 'live' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2.5 text-[10px]"
            onClick={() => switchSimulationMode('live')}
          >
            Live
          </Button>
          <Button
            variant={simulation.mode === 'replay' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2.5 text-[10px]"
            onClick={() => switchSimulationMode('replay')}
          >
            Replay
          </Button>
        </div>
        <Button
          variant={simulation.running ? 'destructive' : 'default'}
          size="sm"
          className="h-8 gap-1.5 text-xs font-semibold"
          onClick={toggleSimulation}
        >
          {simulation.running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {simulation.running ? 'Stop' : 'Simulate'}
        </Button>
        {simulation.running && (
          <span className="text-[10px] font-mono text-muted-foreground">{formatTime(elapsed)}</span>
        )}
        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
          {simulationModeLabel}
        </Badge>
        {simulation.scenario.type !== 'none' && (
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
            {activeScenarioLabel}
          </Badge>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium whitespace-nowrap text-muted-foreground">RPS</span>
          <Input
            type="number"
            className="h-7 w-16 text-xs"
            value={simulation.rps}
            onChange={(e) => setSimulation({ rps: +e.target.value })}
          />
        </div>
        {simulation.mode === 'replay' && (
          <>
            <div className="w-24">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${replayProgressPct}%` }} />
              </div>
            </div>
            <span className="min-w-12 text-[10px] font-mono text-muted-foreground">
              {simulation.step}/{simulation.maxSteps}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[10px]"
              onClick={advanceSimulationStep}
              disabled={simulation.running || simulation.step >= simulation.maxSteps}
            >
              <SkipForward className="mr-1 h-3.5 w-3.5" />
              Step
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px]"
              onClick={() => { resetSimulationReplay(); setElapsed(0); }}
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Reset
            </Button>
            <Badge variant="outline" className="h-5 text-[9px]">
              Path {replayTrace.pathNodeIds.length || 0} nodes
            </Badge>
            <Badge variant="outline" className="h-5 text-[9px]">
              Latency {replayTrace.accumulatedLatencyMs}/{replayTrace.totalLatencyMs}ms
            </Badge>
            <Badge variant="outline" className="h-5 text-[9px]">
              Retries {replayTrace.estimatedRetries}
            </Badge>
            <Badge variant="outline" className="h-5 text-[9px]">
              Bottlenecks {replayTrace.bottleneckNodeIds.length}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {replayTrace.blockedReason ?? 'Replay path is highlighted directly on the diagram.'}
            </span>
          </>
        )}
        <Dialog open={simulationOpen} onOpenChange={setSimulationOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
            <DialogHeader className="border-b border-border px-4 py-4 pr-12 sm:px-5">
              <DialogTitle>Advanced Simulation</DialogTitle>
            </DialogHeader>
            <div className="max-h-[78vh] space-y-5 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">Current mode</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {simulation.mode === 'replay'
                        ? 'Replay state is controlled from the bottom bar so progress stays visible.'
                        : 'Live mode continuously recomputes loads while simulation is running.'}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <Badge variant="outline" className="text-[10px] h-5">{simulationModeLabel}</Badge>
                    {simulation.scenario.type !== 'none' && (
                      <Badge variant="secondary" className="text-[10px] h-5">{activeScenarioLabel}</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Speed</span>
                  <Badge variant="secondary" className="text-[10px] h-5">{simulation.speed}x</Badge>
                </div>
                <Slider value={[simulation.speed]} min={0.5} max={5} step={0.5} onValueChange={([v]) => applySimulationChanges({ speed: v })} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Packet loss (%)</span>
                  <Input type="number" min={0} max={100} className="h-8 text-xs" value={simulation.packetLossPct} onChange={(e) => applySimulationChanges({ packetLossPct: Math.max(0, Math.min(100, +e.target.value || 0)) })} />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Extra latency (ms)</span>
                  <Input type="number" min={0} className="h-8 text-xs" value={simulation.extraLatencyMs} onChange={(e) => applySimulationChanges({ extraLatencyMs: Math.max(0, +e.target.value || 0) })} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Retry attempts</span>
                  <Input type="number" min={0} max={5} className="h-8 text-xs" value={simulation.retryAttempts} onChange={(e) => applySimulationChanges({ retryAttempts: Math.max(0, Math.min(5, +e.target.value || 0)) })} />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Retry backoff (ms)</span>
                  <Input type="number" min={0} className="h-8 text-xs" value={simulation.retryBackoffMs} onChange={(e) => applySimulationChanges({ retryBackoffMs: Math.max(0, +e.target.value || 0) })} />
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                Replay estimate: <span className="font-semibold text-foreground">{simulation.replayTrace.estimatedRetries}</span> retries and
                <span className="font-semibold text-foreground"> {simulation.replayTrace.totalLatencyMs}ms</span> request latency.
              </div>

              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">Scenario injection</div>
                    <div className="text-xs text-muted-foreground">Apply one typed failure or degradation scenario across the graph.</div>
                  </div>
                  <Badge variant="outline" className="text-[10px] h-5">{activeScenarioLabel}</Badge>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Scenario type</span>
                  <Select value={simulation.scenario.type} onValueChange={(value) => updateScenarioType(value as SimulationScenarioType)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="zone-outage">Zone outage</SelectItem>
                      <SelectItem value="regional-latency">High-latency region</SelectItem>
                      <SelectItem value="queue-backlog">Queue backlog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {simulation.scenario.type === 'zone-outage' && (
                  <div className="space-y-1.5">
                    <span className="text-xs text-muted-foreground">Impacted region</span>
                    <Select value={simulation.scenario.region || regions[0] || 'us-east-1'} onValueChange={(value) => applySimulationChanges({ scenario: { region: value } })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(regions.length > 0 ? regions : ['us-east-1']).map((region) => (
                          <SelectItem key={region} value={region}>{region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {simulation.scenario.type === 'regional-latency' && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Affected region</span>
                      <Select value={simulation.scenario.region || regions[0] || 'us-east-1'} onValueChange={(value) => applySimulationChanges({ scenario: { region: value } })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(regions.length > 0 ? regions : ['us-east-1']).map((region) => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Added latency (ms)</span>
                      <Input type="number" min={0} className="h-8 text-xs" value={simulation.scenario.latencyMs ?? DEFAULT_SCENARIO_LATENCY_MS} onChange={(e) => applySimulationChanges({ scenario: { latencyMs: Math.max(0, +e.target.value || 0) } })} />
                    </div>
                  </div>
                )}

                {simulation.scenario.type === 'queue-backlog' && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Backlogged queue or bus</span>
                      <Select
                        value={simulation.scenario.queueNodeIds?.[0] || messagingNodes[0]?.id || 'none'}
                        onValueChange={(value) => applySimulationChanges({ scenario: { queueNodeIds: value === 'none' ? [] : [value] } })}
                        disabled={messagingNodes.length === 0}
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={messagingNodes.length === 0 ? 'No messaging nodes available' : 'Select target'} /></SelectTrigger>
                        <SelectContent>
                          {messagingNodes.length === 0 ? (
                            <SelectItem value="none">No messaging nodes</SelectItem>
                          ) : (
                            messagingNodes.map((node) => {
                              const data = getNodeData(node);
                              return <SelectItem key={node.id} value={node.id}>{data.label}</SelectItem>;
                            })
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Backlog severity</span>
                        <Badge variant="secondary" className="text-[10px] h-5">{simulation.scenario.backlogSeverity ?? DEFAULT_BACKLOG_SEVERITY}%</Badge>
                      </div>
                      <Slider value={[simulation.scenario.backlogSeverity ?? DEFAULT_BACKLOG_SEVERITY]} min={20} max={90} step={5} onValueChange={([value]) => applySimulationChanges({ scenario: { backlogSeverity: value } })} />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span>Manual node failures</span>
                  <div className="flex items-center gap-1.5">
                    {scenarioFailedSet.size > 0 && <Badge variant="outline" className="text-[10px] h-5">{scenarioFailedSet.size} scenario</Badge>}
                    {simulation.manualFailedNodeIds.length > 0 && <Badge variant="destructive" className="text-[10px] h-5">{simulation.manualFailedNodeIds.length} manual</Badge>}
                  </div>
                </div>
                <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-lg border border-border p-2">
                  {nodes.map((node) => {
                    const data = getNodeData(node);
                    const isManualFailed = manualFailedSet.has(node.id);
                    const isScenarioFailed = scenarioFailedSet.has(node.id);
                    return (
                      <button
                        key={node.id}
                        type="button"
                        disabled={isScenarioFailed && !isManualFailed}
                        className={`w-full rounded px-2 py-1.5 text-left text-xs transition-colors ${
                          isScenarioFailed
                            ? 'cursor-not-allowed bg-muted text-muted-foreground'
                            : isManualFailed
                              ? 'bg-destructive/10 text-destructive'
                              : 'hover:bg-accent'
                        }`}
                        onClick={() => toggleNodeFailure(node.id)}
                      >
                        {isScenarioFailed && !isManualFailed
                          ? `${data.label} · affected by ${activeScenarioLabel.toLowerCase()}`
                          : `${isManualFailed ? 'Unfail' : 'Fail'} ${data.label}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">Saved presets</div>
                    <div className="text-xs text-muted-foreground">Save the current simulation tuning and scenario for reuse.</div>
                  </div>
                  <Badge variant="outline" className="text-[10px] h-5">{savedPresets.length} saved</Badge>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input className="h-8 text-xs" placeholder="Preset name" value={presetName} onChange={(e) => setPresetName(e.target.value)} />
                  <Button type="button" size="sm" className="h-8 text-xs" onClick={saveCurrentPreset}>Save</Button>
                </div>
                <div className="space-y-1.5">
                  {savedPresets.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">No presets saved yet.</div>
                  ) : (
                    savedPresets.map((preset) => (
                      <div key={preset.id} className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium text-foreground">{preset.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {getScenarioLabel(preset.simulation.scenario.type)} · {preset.simulation.rps} RPS · {preset.simulation.speed}x
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={() => applyPreset(preset)}>Apply</Button>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setSavedPresets((current) => current.filter((item) => item.id !== preset.id))}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
