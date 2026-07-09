import { useEffect, useState, type ReactNode } from "react";
import { Monitor, Moon, RotateCcw, Settings, Sun } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

type ThemeMode = "light" | "dark" | "system";
type AnimationQuality = "low" | "medium" | "high";

const DEFAULT_SETTINGS = {
  theme: "dark" as ThemeMode,
  showMinimap: true,
  showGrid: true,
  snapToGrid: false,
  animationQuality: "high" as AnimationQuality,
  packetDensity: 50,
};

const THEME_OPTIONS = [
  { value: "light" as ThemeMode, label: "Light", icon: Sun },
  { value: "dark" as ThemeMode, label: "Dark", icon: Moon },
  { value: "system" as ThemeMode, label: "System", icon: Monitor },
];

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle(
    "dark",
    mode === "system" ? prefersDark : mode === "dark",
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="rounded-xl border border-border bg-card">{children}</div>
    </section>
  );
}

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 space-y-1">
        <Label className="text-sm font-medium text-foreground">{title}</Label>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0 self-start sm:self-auto">{children}</div>
    </div>
  );
}

export default function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(
    () =>
      (localStorage.getItem("sd-theme") as ThemeMode) || DEFAULT_SETTINGS.theme,
  );
  const [showMinimap, setShowMinimap] = useState(
    () => localStorage.getItem("sd-minimap") !== "false",
  );
  const [showGrid, setShowGrid] = useState(
    () => localStorage.getItem("sd-grid") !== "false",
  );
  const [snapToGrid, setSnapToGrid] = useState(
    () => localStorage.getItem("sd-snap") === "true",
  );
  const [animationQuality, setAnimationQuality] = useState<AnimationQuality>(
    () =>
      (localStorage.getItem("sd-anim-quality") as AnimationQuality) ||
      DEFAULT_SETTINGS.animationQuality,
  );
  const [packetDensity, setPacketDensity] = useState(
    () =>
      +(
        localStorage.getItem("sd-packet-density") ||
        String(DEFAULT_SETTINGS.packetDensity)
      ),
  );

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("sd-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("sd-minimap", String(showMinimap));
    localStorage.setItem("sd-grid", String(showGrid));
    localStorage.setItem("sd-snap", String(snapToGrid));
    localStorage.setItem("sd-anim-quality", animationQuality);
    localStorage.setItem("sd-packet-density", String(packetDensity));
    window.dispatchEvent(
      new CustomEvent("sd-settings-change", {
        detail: {
          showMinimap,
          showGrid,
          snapToGrid,
          animationQuality,
          packetDensity,
        },
      }),
    );
  }, [showMinimap, showGrid, snapToGrid, animationQuality, packetDensity]);

  const resetDefaults = () => {
    setTheme(DEFAULT_SETTINGS.theme);
    setShowMinimap(DEFAULT_SETTINGS.showMinimap);
    setShowGrid(DEFAULT_SETTINGS.showGrid);
    setSnapToGrid(DEFAULT_SETTINGS.snapToGrid);
    setAnimationQuality(DEFAULT_SETTINGS.animationQuality);
    setPacketDensity(DEFAULT_SETTINGS.packetDensity);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="w-4 h-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Settings</TooltipContent>
      </Tooltip>

      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border px-4 py-4 pr-14 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-base font-semibold">
                Settings
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Workspace preferences for appearance, canvas behavior, and
                simulation.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 self-start px-2.5 text-xs"
              onClick={resetDefaults}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 px-4 py-5 sm:px-5">
            <Section
              title="Appearance"
              description="Set how the workspace should look while editing diagrams."
            >
              <div className="p-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTheme(value)}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        theme === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            <Section
              title="Canvas"
              description="Adjust navigation aids and placement behavior on the diagram canvas."
            >
              <Row
                title="Show minimap"
                description="Keep a small overview of large diagrams visible in the corner."
              >
                <Switch
                  checked={showMinimap}
                  onCheckedChange={setShowMinimap}
                />
              </Row>
              <Separator />
              <Row
                title="Show grid"
                description="Display background guides to help align nodes visually."
              >
                <Switch checked={showGrid} onCheckedChange={setShowGrid} />
              </Row>
              <Separator />
              <Row
                title="Snap to grid"
                description="Align dragged nodes to the grid for more consistent spacing."
              >
                <Switch checked={snapToGrid} onCheckedChange={setSnapToGrid} />
              </Row>
            </Section>

            <Section
              title="Simulation"
              description="Tune how much visual activity appears when the system is running."
            >
              <Row
                title="Animation quality"
                description="Use lower quality on dense diagrams for less visual overhead."
              >
                <Select
                  value={animationQuality}
                  onValueChange={(value) =>
                    setAnimationQuality(value as AnimationQuality)
                  }
                >
                  <SelectTrigger className="h-9 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </Row>
              <Separator />
              <div className="px-4 py-3">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground">
                      Packet density
                    </Label>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Control how full the traffic animation feels during
                      simulation.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {packetDensity}%
                  </span>
                </div>
                <Slider
                  value={[packetDensity]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={([value]) => setPacketDensity(value)}
                />
              </div>
            </Section>

            <Section
              title="Shortcuts"
              description="Quick reference for common actions."
            >
              <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 px-4 py-3 text-sm">
                <span className="text-foreground">Delete selection</span>
                <span className="font-mono text-xs text-muted-foreground">
                  Del
                </span>
                <span className="text-foreground">Undo</span>
                <span className="font-mono text-xs text-muted-foreground">
                  Ctrl+Z
                </span>
                <span className="text-foreground">Redo</span>
                <span className="font-mono text-xs text-muted-foreground">
                  Ctrl+Shift+Z
                </span>
                <span className="text-foreground">Help</span>
                <span className="font-mono text-xs text-muted-foreground">
                  ?
                </span>
              </div>
            </Section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
