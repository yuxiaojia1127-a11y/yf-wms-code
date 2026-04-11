import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DrawerShell(props: {
  open: boolean;
  side?: "right" | "left";
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  widthClassName?: string;
}) {
  const side = props.side ?? "right";
  return (
    <div className={cn("fixed inset-0 z-40", props.open ? "" : "pointer-events-none")}>
      <div
        className={cn(
          "absolute inset-0 bg-black/20 transition-opacity",
          props.open ? "opacity-100" : "opacity-0",
        )}
        onClick={props.onClose}
      />
      <div
        className={cn(
          "absolute top-0 h-full bg-white shadow-xl transition-transform",
          props.widthClassName ?? "w-[380px]",
          side === "right" ? "right-0" : "left-0",
          props.open ? "translate-x-0" : side === "right" ? "translate-x-full" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="text-sm font-semibold text-zinc-900">{props.title}</div>
            <button
              type="button"
              onClick={props.onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-white text-zinc-600 hover:bg-zinc-50"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">{props.children}</div>
          {props.footer ? <div className="border-t p-3">{props.footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

