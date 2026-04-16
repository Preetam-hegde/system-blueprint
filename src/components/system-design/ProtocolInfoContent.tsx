import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PROTOCOL_KNOWLEDGE, type ConnectionProtocol } from '@/types/system-design';
import ProtocolBadge from './ProtocolBadge';

interface Props {
  protocol: ConnectionProtocol;
  compact?: boolean;
}

export default function ProtocolInfoContent({ protocol, compact = false }: Props) {
  const info = PROTOCOL_KNOWLEDGE[protocol];

  return (
    <div className={compact ? 'space-y-2.5' : 'space-y-3'}>
      <div className="flex flex-wrap items-center gap-2">
        <ProtocolBadge protocol={protocol} />
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
          {info.mode}
        </Badge>
        <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-mono">
          ~{info.defaultLatency}ms
        </Badge>
      </div>

      <div>
        <div className="text-xs text-muted-foreground leading-relaxed">{info.description}</div>
        <div className="mt-2 text-[11px] text-foreground/85">
          <span className="font-semibold text-foreground">Best for:</span> {info.bestFor}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Used In</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {info.useCases.map((useCase) => (
            <Badge key={useCase} variant="secondary" className="h-5 px-1.5 text-[10px]">
              {useCase}
            </Badge>
          ))}
        </div>
      </div>

      <div className={compact ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-2 gap-2'}>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600">Pros</div>
          <ul className="mt-1 space-y-1">
            {info.pros.map((pro) => (
              <li key={pro} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-destructive">Cons</div>
          <ul className="mt-1 space-y-1">
            {info.cons.map((con) => (
              <li key={con} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                <X className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
