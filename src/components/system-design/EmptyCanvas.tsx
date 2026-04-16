import { Boxes, MousePointerClick } from 'lucide-react';
import TemplateDialog from './TemplateDialog';

interface EmptyCanvasProps {
  mobile?: boolean;
}

export default function EmptyCanvas({ mobile = false }: EmptyCanvasProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto animate-fade-scale-in space-y-5 text-center">
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <Boxes className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground sm:text-xl">System Design Visualizer</h2>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-[18rem] sm:max-w-sm mx-auto">
            {mobile
              ? 'Open the component palette, tap a component to place it on the canvas, or load a template to get started.'
              : 'Drag components from the left palette onto the canvas, or load a template to get started.'}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <TemplateDialog />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>{mobile ? 'or tap to add' : 'or drag & drop'}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 justify-center text-[10px] text-muted-foreground/60 max-w-xs mx-auto">
          <span>⌫ Delete</span>
          <span>⌘Z Undo</span>
          <span>⌘⇧Z Redo</span>
          <span>? Help</span>
        </div>
      </div>
    </div>
  );
}
