import { format } from "date-fns";
import { marked } from "marked";

export function formatDate(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy HH:mm");
}

export function formatDuration(ms?: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function truncate(str: string, maxLength: number = 100): string {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}

export function parseTags(tags: string): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function tagColor(tag: string): string {
  const colors: Record<string, string> = {
    bugs: "bg-blue-100 text-blue-700 border-blue-200",
    bug: "bg-blue-100 text-blue-700 border-blue-200",
    email: "bg-purple-100 text-purple-700 border-purple-200",
    spec: "bg-orange-100 text-orange-700 border-orange-200",
    docs: "bg-green-100 text-green-700 border-green-200",
    feature: "bg-pink-100 text-pink-700 border-pink-200",
    test: "bg-yellow-100 text-yellow-700 border-yellow-200",
    review: "bg-indigo-100 text-indigo-700 border-indigo-200",
    data: "bg-cyan-100 text-cyan-700 border-cyan-200",
    support: "bg-teal-100 text-teal-700 border-teal-200",
  };
  const lower = tag.toLowerCase();
  return (
    colors[lower] || "bg-gray-100 text-gray-700 border-gray-200"
  );
}

interface FieldDef {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  example?: string;
  default_value?: string;
  enum_values?: string;
  properties?: string;
}

function buildFieldSchema(f: FieldDef): Record<string, any> {
  const prop: Record<string, any> = {};

  if (f.type === "enum") {
    prop.type = "string";
    if (f.enum_values) {
      prop.enum = f.enum_values.split(",").map((v) => v.trim()).filter(Boolean);
    }
  } else if (f.type === "list[string]") {
    prop.type = "array";
    prop.items = { type: "string" };
  } else if (f.type === "list[number]") {
    prop.type = "array";
    prop.items = { type: "number" };
  } else if (f.type === "object") {
    prop.type = "object";
    prop.additionalProperties = false;
    addNestedProperties(prop, f.properties);
  } else if (f.type === "list[object]") {
    prop.type = "array";
    prop.items = { type: "object", additionalProperties: false };
    addNestedProperties(prop.items, f.properties);
  } else {
    prop.type = f.type;
  }

  if (f.description) prop.description = f.description;
  if (f.example) prop.example = f.example;
  if (f.default_value) prop.default = f.default_value;
  return prop;
}

function addNestedProperties(target: Record<string, any>, properties?: string): void {
  if (!properties) return;
  try {
    const nested = JSON.parse(properties) as FieldDef[];
    const props: Record<string, any> = {};
    const req: string[] = [];
    for (const item of nested) {
      props[item.name] = buildFieldSchema(item);
      if (item.required) req.push(item.name);
    }
    if (Object.keys(props).length) target.properties = props;
    if (req.length) target.required = req;
  } catch { /* ignore invalid properties */ }
}

export function buildJsonSchema(fields: FieldDef[]) {
  const schema: Record<string, any> = {
    type: "object",
    properties: {},
    required: [],
  };
  for (const f of fields) {
    schema.properties[f.name] = buildFieldSchema(f);
    if (f.required) schema.required.push(f.name);
  }
  return schema;
}

export function downloadJson(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function renderMarkdownToHtml(text: string): string {
  return marked.parse(text, { async: false, breaks: true, gfm: true }) as string;
}

export async function copyToClipboardRich(plainText: string, htmlText: string): Promise<void> {
  if (typeof ClipboardItem !== "undefined") {
    try {
      const blobHtml = new Blob([htmlText], { type: "text/html" });
      const blobText = new Blob([plainText], { type: "text/plain" });
      const data = new ClipboardItem({
        "text/html": blobHtml,
        "text/plain": blobText,
      });
      await navigator.clipboard.write([data]);
      return;
    } catch {
      // Fallback to plain text
    }
  }
  await navigator.clipboard.writeText(plainText);
}
