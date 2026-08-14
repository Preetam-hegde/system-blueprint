import { useDesignStore } from '@/store/useDesignStore';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Undo2, Redo2,
  Download, Upload, Image, Link, Trash2, ChevronDown,
  Boxes, LayoutGrid, UserRound,
  Github, Globe2, NotebookPen,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { toast } from 'sonner';
import SettingsDialog from './SettingsDialog';
import CapacityPlannerDialog from './CapacityPlannerDialog';

const PORTFOLIO_URL = 'https://preetamhegde.in';
const INKWELL_URL = 'https://inkwell.preetamhegde.in';
const REPO_URL = 'https://github.com/Preetam-hegde/system-blueprint';

export default function Toolbar() {
  const {
  undo,
  redo,
  exportJSON,
  importJSON,
  clearCanvas,
  nodes,
  edges,
  autoLayout
} = useDesignStore(useShallow((state) => ({
  undo: state.undo,
  redo: state.redo,
  exportJSON: state.exportJSON,
  importJSON: state.importJSON,
  clearCanvas: state.clearCanvas,
  nodes: state.nodes,
  edges: state.edges,
  autoLayout: state.autoLayout
})));
  const [importText, setImportText] = useState('');
  const [importOpen, setImportOpen] = useState(false);

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

  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="border-b border-border glass flex shrink-0 flex-wrap items-center gap-2 px-3 py-2 z-20 sm:h-12 sm:flex-nowrap sm:gap-3 sm:px-4 sm:py-0">
      {/* Brand */}
      <div className="mr-auto flex min-w-0 items-center gap-2 border-r border-border pr-3 sm:mr-1">
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
      <div className="flex items-center gap-0.5 border-r border-border pr-2 sm:mr-1">
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

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Actions</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Import, export, and project links</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Design</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import JSON
            </DropdownMenuItem>
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
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Links</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => openExternalLink(REPO_URL)}>
              <Github className="mr-2 h-4 w-4" />
              GitHub Repository
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openExternalLink(INKWELL_URL)}>
              <NotebookPen className="mr-2 h-4 w-4" />
              Inkwell
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openExternalLink(PORTFOLIO_URL)}>
              <Globe2 className="mr-2 h-4 w-4" />
              Portfolio
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
