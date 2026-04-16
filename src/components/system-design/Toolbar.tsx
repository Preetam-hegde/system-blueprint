import { useDesignStore, type SystemNodeData } from '@/store/useDesignStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Play, Pause, Undo2, Redo2,
  Download, Upload, Image, Link, Trash2, ChevronDown,
  Boxes, LayoutGrid, SkipForward, RotateCcw, SlidersHorizontal, UserRound,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useState, useRef, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { toast } from 'sonner';
import type { SavedSimulationPreset, SimulationScenarioType } from '@/types/system-design';
import SettingsDialog from './SettingsDialog';
import CapacityPlannerDialog from './CapacityPlannerDialog';

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

export default function Toolbar() {
  const {
    simulation, setSimulation, updateNodeLoads, runAnalysis,
    undo, redo, exportJSON, importJSON, clearCanvas, nodes, edges, autoLayout,
    advanceSimulationStep, resetSimulationReplay, toggleNodeFailure,
  } = useDesignStore();
  const [importText, setImportText] = useState('');
  const [importOpen, setImportOpen] = useState(false);
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

  const handleExportJSON = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'system-design.json'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as JSON');
  };

  const handleExportPNG = async () => {
    const canvas = document.querySelector('.react-flow') as HTMLElement;
    if (!canvas) return;
    try {
      const isDark = document.documentElement.classList.contains('dark');
      const dataUrl = await toPng(canvas, { backgroundColor: isDark ? '#0c0e14' : '#f4f5f7' });
      const a = document.createElement('a');
      a.href = dataUrl; a.download = 'system-design.png'; a.click();
      toast.success('Exported as PNG');
    } catch { toast.error('Failed to export PNG'); }
  };

  const handleShareURL = () => {
    const json = exportJSON();
    const encoded = btoa(encodeURIComponent(json));
    navigator.clipboard.writeText(`${window.location.origin}?design=${encoded}`);
    toast.success('Shareable URL copied');
  };

  const handleImport = () => {
    importJSON(importText);
    setImportOpen(false); setImportText('');
    toast.success('Design imported');
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const simulationModeLabel = simulation.mode === 'replay' ? `Replay ${simulation.step}/${simulation.maxSteps}` : 'Live';
  const replayProgressPct = Math.round((simulation.step / Math.max(simulation.maxSteps, 1)) * 100);
  const activeScenarioLabel = getScenarioLabel(simulation.scenario.type);
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

  return (
    <div className="h-12 border-b border-border glass flex items-center px-4 gap-3 shrink-0 z-20">
      {/* Brand */}
      <div className="flex items-center gap-2 border-r border-border pr-3 mr-1">
        <RouterLink to="/" className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-primary/10">
            <Boxes className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground hidden sm:inline">System Designer</span>
        </RouterLink>
        <Tooltip>
          <TooltipTrigger asChild>
            <RouterLink
              to="/about"
              className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-full border border-border/80 px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
            >
              <UserRound className="h-3.5 w-3.5" />
              About
            </RouterLink>
          </TooltipTrigger>
          <TooltipContent>About Preetam Hegde and this project</TooltipContent>
        </Tooltip>
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5 border-r border-border pr-2 mr-1">
        <Tooltip><TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo}><Undo2 className="w-4 h-4" /></Button>
        </TooltipTrigger><TooltipContent>Undo (Ctrl+Z)</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo}><Redo2 className="w-4 h-4" /></Button>
        </TooltipTrigger><TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent></Tooltip>
      </div>

      {/* Layout */}
      <Tooltip><TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={autoLayout} disabled={nodes.length === 0}>
          <LayoutGrid className="w-4 h-4" />
        </Button>
      </TooltipTrigger><TooltipContent>Auto Layout</TooltipContent></Tooltip>

      {/* Simulation */}
      <div className="flex items-center gap-2 border-l border-border pl-3 ml-1">
        <div className="hidden sm:flex items-center rounded-lg border border-border bg-background p-0.5">
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={simulation.running ? 'destructive' : 'default'}
              size="sm"
              className="h-8 gap-1.5 text-xs font-semibold"
              onClick={toggleSimulation}
            >
              {simulation.running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {simulation.running ? 'Stop' : 'Simulate'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{simulation.running ? 'Stop simulation' : 'Start simulation'}</TooltipContent>
        </Tooltip>
          {simulation.running && (
          <span className="text-[10px] font-mono text-muted-foreground">{formatTime(elapsed)}</span>
        )}
        <Badge variant="outline" className="hidden md:inline-flex text-[10px] h-5 px-1.5">
          {simulationModeLabel}
        </Badge>
        {simulation.scenario.type !== 'none' && (
          <Badge variant="secondary" className="hidden lg:inline-flex text-[10px] h-5 px-1.5">
            {activeScenarioLabel}
          </Badge>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground whitespace-nowrap font-medium">RPS</span>
              <Input type="number" className="h-7 w-14 text-xs" value={simulation.rps}
                onChange={(e) => setSimulation({ rps: +e.target.value })} />
            </div>
          </TooltipTrigger>
          <TooltipContent>Requests per second for simulation load</TooltipContent>
        </Tooltip>
        {simulation.mode === 'replay' && (
          <div className="hidden lg:flex items-center gap-2 pl-1">
            <div className="w-24">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-200"
                  style={{ width: `${replayProgressPct}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground min-w-12">
              {simulation.step}/{simulation.maxSteps}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>Advance replay by one step</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[10px]"
                  onClick={() => { resetSimulationReplay(); setElapsed(0); }}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Reset
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset replay to the beginning</TooltipContent>
            </Tooltip>
            <Badge variant="outline" className="hidden xl:inline-flex h-5 text-[9px] px-1.5">
              {simulation.replayTrace.accumulatedLatencyMs}/{simulation.replayTrace.totalLatencyMs}ms
            </Badge>
            <Badge variant="outline" className="hidden xl:inline-flex h-5 text-[9px] px-1.5">
              {simulation.replayTrace.estimatedRetries} retries
            </Badge>
          </div>
        )}

        <Dialog open={simulationOpen} onOpenChange={setSimulationOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>Advanced simulation settings</TooltipContent>
          </Tooltip>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Advanced Simulation</DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">Current mode</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {simulation.mode === 'replay'
                        ? 'Replay state is controlled from the top bar so progress stays visible.'
                        : 'Live mode continuously recomputes loads while simulation is running.'}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <Badge variant="outline" className="text-[10px] h-5">
                      {simulationModeLabel}
                    </Badge>
                    {simulation.scenario.type !== 'none' && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {activeScenarioLabel}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Speed</span>
                  <Badge variant="secondary" className="text-[10px] h-5">{simulation.speed}x</Badge>
                </div>
                <Slider
                  value={[simulation.speed]}
                  min={0.5}
                  max={5}
                  step={0.5}
                  onValueChange={([v]) => applySimulationChanges({ speed: v })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Packet loss (%)</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="h-8 text-xs"
                    value={simulation.packetLossPct}
                    onChange={(e) => applySimulationChanges({ packetLossPct: Math.max(0, Math.min(100, +e.target.value || 0)) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Extra latency (ms)</span>
                  <Input
                    type="number"
                    min={0}
                    className="h-8 text-xs"
                    value={simulation.extraLatencyMs}
                    onChange={(e) => applySimulationChanges({ extraLatencyMs: Math.max(0, +e.target.value || 0) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Retry attempts</span>
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    className="h-8 text-xs"
                    value={simulation.retryAttempts}
                    onChange={(e) => applySimulationChanges({ retryAttempts: Math.max(0, Math.min(5, +e.target.value || 0)) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Retry backoff (ms)</span>
                  <Input
                    type="number"
                    min={0}
                    className="h-8 text-xs"
                    value={simulation.retryBackoffMs}
                    onChange={(e) => applySimulationChanges({ retryBackoffMs: Math.max(0, +e.target.value || 0) })}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                Replay estimate: <span className="font-semibold text-foreground">{simulation.replayTrace.estimatedRetries}</span> retries and
                <span className="font-semibold text-foreground"> {simulation.replayTrace.totalLatencyMs}ms</span> request latency.
              </div>

              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">Scenario injection</div>
                    <div className="text-xs text-muted-foreground">
                      Apply one typed failure or degradation scenario across the graph.
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] h-5">
                    {activeScenarioLabel}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Scenario type</span>
                  <Select value={simulation.scenario.type} onValueChange={(value) => updateScenarioType(value as SimulationScenarioType)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
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
                    <Select
                      value={simulation.scenario.region || regions[0] || 'us-east-1'}
                      onValueChange={(value) => applySimulationChanges({ scenario: { region: value } })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(regions.length > 0 ? regions : ['us-east-1']).map((region) => (
                          <SelectItem key={region} value={region}>{region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {simulation.scenario.type === 'regional-latency' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Affected region</span>
                      <Select
                        value={simulation.scenario.region || regions[0] || 'us-east-1'}
                        onValueChange={(value) => applySimulationChanges({ scenario: { region: value } })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(regions.length > 0 ? regions : ['us-east-1']).map((region) => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Added latency (ms)</span>
                      <Input
                        type="number"
                        min={0}
                        className="h-8 text-xs"
                        value={simulation.scenario.latencyMs ?? DEFAULT_SCENARIO_LATENCY_MS}
                        onChange={(e) => applySimulationChanges({ scenario: { latencyMs: Math.max(0, +e.target.value || 0) } })}
                      />
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
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder={messagingNodes.length === 0 ? 'No messaging nodes available' : 'Select target'} />
                        </SelectTrigger>
                        <SelectContent>
                          {messagingNodes.length === 0 ? (
                            <SelectItem value="none">No messaging nodes</SelectItem>
                          ) : (
                            messagingNodes.map((node) => {
                              const data = getNodeData(node);
                              return (
                                <SelectItem key={node.id} value={node.id}>
                                  {data.label}
                                </SelectItem>
                              );
                            })
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Backlog severity</span>
                        <Badge variant="secondary" className="text-[10px] h-5">
                          {simulation.scenario.backlogSeverity ?? DEFAULT_BACKLOG_SEVERITY}%
                        </Badge>
                      </div>
                      <Slider
                        value={[simulation.scenario.backlogSeverity ?? DEFAULT_BACKLOG_SEVERITY]}
                        min={20}
                        max={90}
                        step={5}
                        onValueChange={([value]) => applySimulationChanges({ scenario: { backlogSeverity: value } })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Manual node failures</span>
                  <div className="flex items-center gap-1.5">
                    {scenarioFailedSet.size > 0 && (
                      <Badge variant="outline" className="text-[10px] h-5">
                        {scenarioFailedSet.size} scenario
                      </Badge>
                    )}
                    {simulation.manualFailedNodeIds.length > 0 && (
                      <Badge variant="destructive" className="text-[10px] h-5">
                        {simulation.manualFailedNodeIds.length} manual
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="max-h-36 overflow-y-auto rounded-lg border border-border p-2 space-y-1.5">
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
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">Saved presets</div>
                    <div className="text-xs text-muted-foreground">
                      Save the current simulation tuning and scenario for reuse.
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] h-5">
                    {savedPresets.length} saved
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Input
                    className="h-8 text-xs"
                    placeholder="Preset name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                  />
                  <Button type="button" size="sm" className="h-8 text-xs" onClick={saveCurrentPreset}>
                    Save
                  </Button>
                </div>

                <div className="space-y-1.5">
                  {savedPresets.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
                      No presets saved yet.
                    </div>
                  ) : (
                    savedPresets.map((preset) => (
                      <div key={preset.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium text-foreground">{preset.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {getScenarioLabel(preset.simulation.scenario.type)} · {preset.simulation.rps} RPS · {preset.simulation.speed}x
                          </div>
                        </div>
                        <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={() => applyPreset(preset)}>
                          Apply
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          onClick={() => setSavedPresets((current) => current.filter((item) => item.id !== preset.id))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {nodes.length > 0 && (
        <div className="hidden md:flex items-center gap-2 text-[10px] text-muted-foreground border-l border-border pl-3 ml-1">
          <span>{nodes.length} nodes</span>
          <span className="opacity-40">·</span>
          <span>{edges.length} edges</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-0.5 ml-auto">
        <SettingsDialog />
        <CapacityPlannerDialog />

        <div className="w-px h-5 bg-border mx-1" />

        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Import Design</DialogTitle></DialogHeader>
            <Textarea placeholder="Paste JSON here..." className="min-h-[200px] text-xs font-mono"
              value={importText} onChange={(e) => setImportText(e.target.value)} />
            <Button onClick={handleImport}>Import</Button>
          </DialogContent>
        </Dialog>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Import JSON</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Export and share</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handleExportJSON}>
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPNG}>
              <Image className="mr-2 h-4 w-4" />
              Export PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShareURL}>
              <Link className="mr-2 h-4 w-4" />
              Copy share URL
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-5 bg-border mx-1" />

        <Tooltip><TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={clearCanvas}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </TooltipTrigger><TooltipContent>Clear canvas</TooltipContent></Tooltip>
      </div>
    </div>
  );
}
