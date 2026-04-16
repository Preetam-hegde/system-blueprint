import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Settings, Sun, Moon, Monitor, Keyboard } from 'lucide-react';
import { useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

export default function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('sd-theme') as ThemeMode) || 'dark');
  const [showMinimap, setShowMinimap] = useState(() => localStorage.getItem('sd-minimap') !== 'false');
  const [showGrid, setShowGrid] = useState(() => localStorage.getItem('sd-grid') !== 'false');
  const [snapToGrid, setSnapToGrid] = useState(() => localStorage.getItem('sd-snap') === 'true');
  const [animationQuality, setAnimationQuality] = useState(() => localStorage.getItem('sd-anim-quality') || 'high');
  const [packetDensity, setPacketDensity] = useState(() => +(localStorage.getItem('sd-packet-density') || '50'));

  useEffect(() => {
    const applyTheme = (mode: ThemeMode) => {
      if (mode === 'system') {
        document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
      } else {
        document.documentElement.classList.toggle('dark', mode === 'dark');
      }
    };
    applyTheme(theme);
    localStorage.setItem('sd-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sd-minimap', String(showMinimap));
    localStorage.setItem('sd-grid', String(showGrid));
    localStorage.setItem('sd-snap', String(snapToGrid));
    localStorage.setItem('sd-anim-quality', animationQuality);
    localStorage.setItem('sd-packet-density', String(packetDensity));
    window.dispatchEvent(new CustomEvent('sd-settings-change', {
      detail: { showMinimap, showGrid, snapToGrid, animationQuality, packetDensity },
    }));
  }, [showMinimap, showGrid, snapToGrid, animationQuality, packetDensity]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Settings">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-2">
          {/* Theme */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Appearance</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { mode: 'light' as ThemeMode, icon: Sun, label: 'Light' },
                { mode: 'dark' as ThemeMode, icon: Moon, label: 'Dark' },
                { mode: 'system' as ThemeMode, icon: Monitor, label: 'System' },
              ]).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 ${
                    theme === mode
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Canvas */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Canvas</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Show minimap</Label>
                <Switch checked={showMinimap} onCheckedChange={setShowMinimap} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Show grid</Label>
                <Switch checked={showGrid} onCheckedChange={setShowGrid} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Snap to grid</Label>
                <Switch checked={snapToGrid} onCheckedChange={setSnapToGrid} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Simulation */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Simulation</Label>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Animation quality</Label>
                <Select value={animationQuality} onValueChange={setAnimationQuality}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (better performance)</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High (more particles)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Packet density</Label>
                  <span className="text-xs text-muted-foreground font-mono">{packetDensity}%</span>
                </div>
                <Slider value={[packetDensity]} min={10} max={100} step={5} onValueChange={([v]) => setPacketDensity(v)} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Shortcuts */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Keyboard Shortcuts</Label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Delete selected</span><span className="text-right font-mono">Del</span>
              <span>Undo</span><span className="text-right font-mono">Ctrl+Z</span>
              <span>Redo</span><span className="text-right font-mono">Ctrl+⇧+Z</span>
              <span>Help</span><span className="text-right font-mono">?</span>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>System Design Visualizer v1.0</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
