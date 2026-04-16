import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Info, Check, X } from 'lucide-react';
import type { ConnectionProtocol } from '@/types/system-design';
import { PROTOCOL_KNOWLEDGE } from '@/types/system-design';

interface Props {
  protocol: ConnectionProtocol;
}

export default function ProtocolInfoPopover({ protocol }: Props) {
  const info = PROTOCOL_KNOWLEDGE[protocol];
  if (!info) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-0.5 rounded hover:bg-accent transition-colors">
          <Info className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" side="left" align="start">
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Badge
              className="text-[10px] h-5 px-1.5"
              style={{
                backgroundColor: `hsl(${info.color} / 0.15)`,
                color: `hsl(${info.color})`,
                border: `1px solid hsl(${info.color} / 0.3)`,
              }}
            >
              {info.name}
            </Badge>
            <span className="text-[10px] text-muted-foreground">~{info.defaultLatency}ms latency</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{info.description}</p>
        </div>

        <div className="p-3 space-y-3">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Use Cases</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {info.useCases.map((uc) => (
                <Badge key={uc} variant="secondary" className="text-[10px] h-5 px-1.5">{uc}</Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">Pros</span>
              <ul className="mt-1 space-y-0.5">
                {info.pros.map((p) => (
                  <li key={p} className="flex items-start gap-1 text-[10px] text-muted-foreground">
                    <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive">Cons</span>
              <ul className="mt-1 space-y-0.5">
                {info.cons.map((c) => (
                  <li key={c} className="flex items-start gap-1 text-[10px] text-muted-foreground">
                    <X className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
