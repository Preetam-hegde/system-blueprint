import type { ElementType } from "react";
import {
  ArrowLeftRight,
  Binary,
  GitBranch,
  Globe,
  Mail,
  Network,
  Radio,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  PROTOCOL_KNOWLEDGE,
  type ConnectionProtocol,
} from "@/types/system-design";
import { cn } from "@/lib/utils";

const PROTOCOL_ICON_MAP: Record<ConnectionProtocol, ElementType> = {
  HTTP: Globe,
  gRPC: Binary,
  WebSocket: Radio,
  TCP: Network,
  "Pub/Sub": ArrowLeftRight,
  GraphQL: GitBranch,
  MQTT: Wifi,
  AMQP: Mail,
};

interface Props {
  protocol: ConnectionProtocol;
  className?: string;
  compact?: boolean;
  showLabel?: boolean;
}

export function getProtocolIcon(protocol: ConnectionProtocol) {
  return PROTOCOL_ICON_MAP[protocol];
}

export default function ProtocolBadge({
  protocol,
  className,
  compact = false,
  showLabel = true,
}: Props) {
  const info = PROTOCOL_KNOWLEDGE[protocol];
  const Icon = getProtocolIcon(protocol);

  return (
    <Badge
      variant="outline"
      className={cn(
        compact ? "h-4 gap-1 px-1 text-[9px]" : "h-5 gap-1 px-1.5 text-[10px]",
        className,
      )}
      style={{
        borderColor: `hsl(${info.color} / 0.3)`,
        backgroundColor: `hsl(${info.color} / 0.08)`,
        color: `hsl(${info.color})`,
      }}
    >
      <Icon className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {showLabel && <span>{protocol}</span>}
    </Badge>
  );
}
