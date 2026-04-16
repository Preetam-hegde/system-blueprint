import { useDesignStore } from '@/store/useDesignStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Play, Pause, Undo2, Redo2,
  Download, Upload, Image, Link, Trash2,
  Boxes, Sun, Moon, Maximize, LayoutGrid,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import TemplateDialog from './TemplateDialog';
import SettingsDialog from './SettingsDialog';


export default function Toolbar() {
  const {
    simulation, setSimulation, updateNodeLoads, runAnalysis,
    undo, redo, exportJSON, importJSON, clearCanvas, nodes, edges, autoLayout,
  } = useDesignStore();
  const [importText, setImportText] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const elapsedRef = useRef<number | null>(null);

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('sd-theme', next ? 'dark' : 'light');
    setIsDark(next);
  };

  const toggleSimulation = () => {
    if (simulation.running) {
      setSimulation({ running: false });
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null; }
    } else {
      setSimulation({ running: true });
      setElapsed(0);
      updateNodeLoads();
      runAnalysis();
      intervalRef.current = window.setInterval(() => {
        updateNodeLoads();
        runAnalysis();
      }, 1000 / simulation.speed);
      elapsedRef.current = window.setInterval(() => setElapsed((t) => t + 1), 1000);
    }
  };

  useEffect(() => {
    if (!simulation.running) {
      if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null; }
    }
  }, [simulation.running]);

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

  return (
    <div className="h-12 border-b border-border glass flex items-center px-4 gap-3 shrink-0 z-20">
      {/* Brand */}
      <div className="flex items-center gap-2 border-r border-border pr-3 mr-1">
        <div className="p-1 rounded-md bg-primary/10">
          <Boxes className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-bold tracking-tight text-foreground hidden sm:inline">System Designer</span>
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

      {/* Templates & Layout */}
      <TemplateDialog />
      <Tooltip><TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={autoLayout} disabled={nodes.length === 0}>
          <LayoutGrid className="w-4 h-4" />
        </Button>
      </TooltipTrigger><TooltipContent>Auto Layout</TooltipContent></Tooltip>

      {/* Simulation */}
      <div className="flex items-center gap-2 border-l border-border pl-3 ml-1">
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
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground whitespace-nowrap font-medium">RPS</span>
          <Input type="number" className="h-7 w-16 text-xs" value={simulation.rps}
            onChange={(e) => setSimulation({ rps: +e.target.value })} />
        </div>
        <div className="hidden lg:flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground whitespace-nowrap font-medium">Speed</span>
          <Slider value={[simulation.speed]} min={0.5} max={5} step={0.5} className="w-20"
            onValueChange={([v]) => setSimulation({ speed: v })} />
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{simulation.speed}x</Badge>
        </div>
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
        <Tooltip><TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </TooltipTrigger><TooltipContent>{isDark ? 'Light mode' : 'Dark mode'}</TooltipContent></Tooltip>

        <SettingsDialog />

        <div className="w-px h-5 bg-border mx-1" />

        <Tooltip><TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExportJSON}><Download className="w-4 h-4" /></Button>
        </TooltipTrigger><TooltipContent>Export JSON</TooltipContent></Tooltip>

        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <Tooltip><TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Upload className="w-4 h-4" /></Button>
            </DialogTrigger>
          </TooltipTrigger><TooltipContent>Import JSON</TooltipContent></Tooltip>
          <DialogContent>
            <DialogHeader><DialogTitle>Import Design</DialogTitle></DialogHeader>
            <Textarea placeholder="Paste JSON here..." className="min-h-[200px] text-xs font-mono"
              value={importText} onChange={(e) => setImportText(e.target.value)} />
            <Button onClick={handleImport}>Import</Button>
          </DialogContent>
        </Dialog>

        <Tooltip><TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExportPNG}><Image className="w-4 h-4" /></Button>
        </TooltipTrigger><TooltipContent>Export PNG</TooltipContent></Tooltip>

        <Tooltip><TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShareURL}><Link className="w-4 h-4" /></Button>
        </TooltipTrigger><TooltipContent>Share URL</TooltipContent></Tooltip>

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
