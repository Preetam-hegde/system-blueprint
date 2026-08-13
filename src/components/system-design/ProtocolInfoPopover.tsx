import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Info } from "lucide-react";
import type { ConnectionProtocol } from "@/types/system-design";
import ProtocolInfoContent from "./ProtocolInfoContent";

interface Props {
  protocol: ConnectionProtocol;
}

export default function ProtocolInfoPopover({ protocol }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-0.5 rounded hover:bg-accent transition-colors">
          <Info className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" side="left" align="start">
        <ProtocolInfoContent protocol={protocol} />
      </PopoverContent>
    </Popover>
  );
}
