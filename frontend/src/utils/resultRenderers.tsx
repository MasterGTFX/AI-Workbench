import { Copy } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  copyToClipboard,
  copyToClipboardRich,
  renderMarkdownToHtml,
} from "./helpers";

export function renderResultValue(value: unknown): React.ReactNode {
  if (value === null) return <span className="text-slate-400">null</span>;
  if (typeof value === "boolean")
    return <span className="text-blue-600 font-medium">{String(value)}</span>;
  if (typeof value === "number")
    return <span className="text-emerald-600 font-medium">{value}</span>;
  if (typeof value === "string")
    return (
      <div
        className="markdown-body text-sm text-slate-800"
        dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(value) }}
      />
    );
  if (Array.isArray(value)) {
    if (value.length === 0)
      return <span className="text-slate-400 italic">Empty list</span>;
    return (
      <div className="rounded-md border overflow-hidden bg-white">
        <div className="px-3 py-1.5 border-b bg-slate-50">
          <span className="text-xs font-medium text-slate-500">
            {value.length} {value.length === 1 ? "item" : "items"}
          </span>
        </div>
        <div className="divide-y">
          {value.map((item, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-2">
              <span className="mt-0.5 text-xs font-medium text-slate-400 select-none">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">{renderResultValue(item)}</div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0 text-slate-400 hover:text-slate-600"
                onClick={() => {
                  const text = getResultValueText(item);
                  const promise =
                    typeof item === "string"
                      ? copyToClipboardRich(text, renderMarkdownToHtml(text))
                      : copyToClipboard(text);
                  promise.then(() => toast.success(`Copied item ${i + 1}`));
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <pre className="whitespace-pre-wrap text-sm text-slate-700">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function getResultValueText(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "Empty list";
    return value
      .map((item) => {
        const itemText = getResultValueText(item);
        const lines = itemText.split("\n");
        if (lines.length === 1) {
          return `- ${itemText}`;
        }
        return `- ${lines[0]}\n` + lines.slice(1).map((l) => `  ${l}`).join("\n");
      })
      .join("\n");
  }
  return JSON.stringify(value, null, 2);
}
