import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ModalShell(props: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  widthClassName?: string;
}) {
  return (
    <div className={cn("fixed inset-0 z-50", props.open ? "" : "pointer-events-none invisible")}>
      <div
        className={cn(
          "absolute inset-0 bg-black/30 transition-opacity",
          props.open ? "opacity-100" : "opacity-0",
        )}
        onClick={props.onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={cn(
            "w-full overflow-hidden rounded-xl border bg-white shadow-xl transition-[transform,opacity]",
            props.widthClassName ?? "max-w-[640px]",
            props.open ? "scale-100 opacity-100" : "scale-95 opacity-0",
          )}
        >
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
          <div className="p-4">{props.children}</div>
          {props.footer ? <div className="border-t bg-zinc-50 px-4 py-3">{props.footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

