import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useDesignStore } from '@/store/useDesignStore';
import type { SystemNodeData } from '@/store/useDesignStore';
import { CATEGORY_COLORS } from '@/types/system-design';
import SystemNodeComponent from '@/components/system-design/SystemNode';
import SystemEdgeComponent from '@/components/system-design/SystemEdge';
import ComponentPalette from '@/components/system-design/ComponentPalette';
import NodeConfigPanel from '@/components/system-design/NodeConfigPanel';
import Toolbar from '@/components/system-design/Toolbar';
import AnalysisPanel from '@/components/system-design/AnalysisPanel';
import AnimatedPackets from '@/components/system-design/AnimatedPackets';
import EmptyCanvas from '@/components/system-design/EmptyCanvas';
import KeyboardShortcuts from '@/components/system-design/KeyboardShortcuts';
import type { SystemNodeType } from '@/types/system-design';

const nodeTypes = { systemNode: SystemNodeComponent };
const edgeTypes = { systemEdge: SystemEdgeComponent };

export default function Index() {
  const {
    nodes, edges, onNodesChange, onEdgesChange, onConnect,
    addNode, selectNode, selectEdge, importJSON,
  } = useDesignStore();

  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [showMinimap, setShowMinimap] = useState(() => localStorage.getItem('sd-minimap') !== 'false');
  const [showGrid, setShowGrid] = useState(() => localStorage.getItem('sd-grid') !== 'false');
  const [snapToGrid, setSnapToGrid] = useState(() => localStorage.getItem('sd-snap') === 'true');
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Apply dark mode on mount
  useEffect(() => {
    const theme = localStorage.getItem('sd-theme') || 'dark';
    if (theme === 'system') {
      document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setShowMinimap(detail.showMinimap);
      setShowGrid(detail.showGrid);
      setSnapToGrid(detail.snapToGrid);
    };
    window.addEventListener('sd-settings-change', handler);
    return () => window.removeEventListener('sd-settings-change', handler);
  }, []);

  // Load from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const design = params.get('design');
    if (design) {
      try {
        const json = decodeURIComponent(atob(design));
        importJSON(json);
      } catch { /* ignore */ }
    }
  }, [importJSON]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        useDesignStore.getState().deleteSelected();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          useDesignStore.getState().redo();
        } else {
          useDesignStore.getState().undo();
        }
      }
      if (e.key === '?' && !(e.target as HTMLElement).matches('input, textarea')) {
        setShowShortcuts(true);
      }
      if (e.key === 'Escape') {
        useDesignStore.getState().selectNode(null);
        useDesignStore.getState().selectEdge(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow') as SystemNodeType;
      if (!type || !reactFlowRef.current) return;
      const position = reactFlowRef.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      addNode(type, position);
    },
    [addNode]
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <Toolbar />
      <div className="flex flex-1 min-h-0">
        <ComponentPalette collapsed={paletteCollapsed} onToggle={() => setPaletteCollapsed(!paletteCollapsed)} />
        <div className="flex-1 relative">
          {nodes.length === 0 && <EmptyCanvas />}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={(instance) => { reactFlowRef.current = instance; }}
            onNodeClick={(_, node) => selectNode(node.id)}
            onEdgeClick={(_, edge) => selectEdge(edge.id)}
            onPaneClick={() => { selectNode(null); selectEdge(null); }}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            snapToGrid={snapToGrid}
            snapGrid={[20, 20]}
            deleteKeyCode={null}
            className="bg-background"
            proOptions={{ hideAttribution: true }}
          >
            {showGrid && (
              <Background variant={BackgroundVariant.Dots} gap={24} size={1} className="!bg-background" color="hsl(var(--border))" />
            )}
            <Controls className="!bg-card/90 !backdrop-blur-md !border-border !shadow-lg !rounded-xl" />
            {showMinimap && (
              <MiniMap
                className="!bg-card/90 !backdrop-blur-md !border-border !rounded-xl !shadow-lg"
                maskColor="hsl(var(--background) / 0.7)"
                nodeColor={(node) => {
                  const data = node.data as unknown as SystemNodeData;
                  if (data?.isBottleneck) return 'hsl(0 84% 60%)';
                  const c = data?.category ? CATEGORY_COLORS[data.category] : undefined;
                  return c ? `hsl(${c})` : 'hsl(var(--primary))';
                }}
              />
            )}
            <AnimatedPackets />
          </ReactFlow>
        </div>
        <NodeConfigPanel />
      </div>
      <AnalysisPanel />
      <KeyboardShortcuts open={showShortcuts} onOpenChange={setShowShortcuts} />
    </div>
  );
}
