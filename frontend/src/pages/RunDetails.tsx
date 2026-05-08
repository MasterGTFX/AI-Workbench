import { useEffect, useState } from "react";
import {
  X,
  Copy,
  Download,
  Play,
  Loader2,
  Clock,
  Cpu,
  Thermometer,
  Hash,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { apiClient } from "@/api/client";
import { Run } from "@/types";
import {
  formatDate,
  formatDuration,
  copyToClipboard,
  downloadJson,
} from "@/utils/helpers";
import toast from "react-hot-toast";

interface RunDetailsProps {
  runId: number;
  open: boolean;
  onClose: () => void;
}

export default function RunDetails({ runId, open, onClose }: RunDetailsProps) {
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiClient
      .get<Run>(`/runs/${runId}`)
      .then((res) => setRun(res.data))
      .catch(() => toast.error("Failed to load run details"))
      .finally(() => setLoading(false));
  }, [runId, open]);

  if (!open) return null;

  function handleCopyInput() {
    if (!run?.input) return;
    copyToClipboard(run.input).then(() => toast.success("Input copied"));
  }

  function handleCopyResult() {
    if (!run?.output) return;
    copyToClipboard(run.output).then(() => toast.success("Result copied"));
  }

  function handleDownloadAll() {
    if (!run) return;
    const data = {
      run,
      input: run.input,
      output: run.output,
      raw_response: run.raw_response,
    };
    downloadJson(data, `run-${run.id}.json`);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 flex w-full max-w-2xl flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Run Details
            </h2>
            <p className="text-sm text-slate-500">
              {run?.preset?.name || "Preset"}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : !run ? (
          <div className="flex flex-1 items-center justify-center text-slate-500">
            Run not found.
          </div>
        ) : (
          <>
            <div className="border-b bg-slate-50 px-6 py-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3 w-3" /> Date
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {formatDate(run.created_at)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Cpu className="h-3 w-3" /> Model
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {run.model}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    Status
                  </div>
                  <Badge
                    variant={run.status === "success" ? "success" : "error"}
                  >
                    {run.status}
                  </Badge>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    Duration
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {formatDuration(run.duration_ms)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Hash className="h-3 w-3" /> Tokens
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {(run.tokens_prompt || 0) + (run.tokens_completion || 0)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Thermometer className="h-3 w-3" /> Temperature
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    —
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Layers className="h-3 w-3" /> Max Tokens
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    —
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    Top P
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    —
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto px-6 py-4">
              <Tabs defaultValue="input">
                <TabsList className="mb-4">
                  <TabsTrigger value="input">Input</TabsTrigger>
                  <TabsTrigger value="result">Result</TabsTrigger>
                  <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="input">
                  <div className="rounded-md border bg-slate-50 p-4">
                    <pre className="whitespace-pre-wrap text-sm text-slate-800">
                      {run.input}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="result">
                  {run.output ? (
                    <div className="rounded-md border bg-slate-50 p-4">
                      <pre className="whitespace-pre-wrap text-sm text-slate-800">
                        {(() => {
                          try {
                            return JSON.stringify(
                              JSON.parse(run.output),
                              null,
                              2
                            );
                          } catch {
                            return run.output;
                          }
                        })()}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-slate-500">No output available.</div>
                  )}
                </TabsContent>

                <TabsContent value="raw">
                  <div className="rounded-md border bg-slate-50 p-4">
                    <pre className="whitespace-pre-wrap text-sm text-slate-800">
                      {JSON.stringify(
                        {
                          id: run.id,
                          preset_id: run.preset_id,
                          input: run.input,
                          output: run.output,
                          raw_response: run.raw_response,
                          status: run.status,
                          model: run.model,
                          duration_ms: run.duration_ms,
                          tokens_prompt: run.tokens_prompt,
                          tokens_completion: run.tokens_completion,
                          error: run.error,
                          created_at: run.created_at,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="logs">
                  {run.error ? (
                    <div className="rounded-md border bg-red-50 p-4 text-sm text-red-700">
                      {run.error}
                    </div>
                  ) : (
                    <div className="text-slate-500">No logs available.</div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="border-t px-6 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleCopyInput}
                >
                  <Copy className="h-4 w-4" />
                  Copy Input
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleCopyResult}
                >
                  <Copy className="h-4 w-4" />
                  Copy Result
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleDownloadAll}
                >
                  <Download className="h-4 w-4" />
                  Download All
                </Button>
                <div className="flex-1" />
                <Button
                  size="sm"
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    window.location.href = `/presets/${run.preset_id}?tab=run`;
                  }}
                >
                  <Play className="h-4 w-4" />
                  Run Again
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
