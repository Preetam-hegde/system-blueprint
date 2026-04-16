import { Boxes, LayoutTemplate, MousePointerClick } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import TemplateDialog from './TemplateDialog';

export default function EmptyCanvas() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="text-center space-y-6 pointer-events-auto animate-fade-scale-in">
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <Boxes className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">System Design Visualizer</h2>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
            Drag components from the left palette onto the canvas, or load a template to get started.
          </p>
        </div>
        <div className="flex items-center gap-3 justify-center">
          <TemplateDialog />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>or drag & drop</span>
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
