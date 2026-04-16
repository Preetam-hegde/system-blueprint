import type { NodeCatalogItem } from '@/types/system-design';
import { Badge } from '@/components/ui/badge';

interface Props {
  item: NodeCatalogItem;
  compact?: boolean;
}

export default function NodeInfoContent({ item, compact = false }: Props) {
  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div>
        <div className="text-sm font-semibold text-foreground">{item.label}</div>
        <div className="text-xs text-muted-foreground leading-relaxed mt-1">{item.description}</div>
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">What It Does</div>
        <p className="text-xs text-foreground/90 leading-relaxed mt-1">{item.whatItDoes}</p>
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Where It Is Used</div>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {item.usedFor.map((useCase) => (
            <Badge
              key={useCase}
              variant="secondary"
              className={compact ? 'h-5 px-1.5 text-[10px] font-medium' : 'h-5 px-1.5 text-[10px]'}
            >
              {useCase}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
