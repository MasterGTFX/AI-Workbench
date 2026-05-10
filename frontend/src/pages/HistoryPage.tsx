import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectItem } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiClient } from "@/api/client";
import { Run } from "@/types";
import { formatDate, formatDuration, truncate } from "@/utils/helpers";
import RunDetails from "@/pages/RunDetails";
import toast from "react-hot-toast";

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [presetFilter, setPresetFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [viewRunId, setViewRunId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRuns();
  }, []);

  async function fetchRuns() {
    setLoading(true);
    try {
      const res = await apiClient.get<Run[]>("/runs");
      setRuns(res.data);
    } catch {
      toast.error("Failed to load runs");
    } finally {
      setLoading(false);
    }
  }

  const presetNames = useMemo(() => {
    const map = new Map<number, string>();
    runs.forEach((r) => {
      if (r.preset) map.set(r.preset_id, r.preset.name);
    });
    return Array.from(map.entries());
  }, [runs]);

  const filtered = useMemo(() => {
    let data = [...runs];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.input.toLowerCase().includes(q) ||
          (r.preset && r.preset.name.toLowerCase().includes(q)) ||
          r.model.toLowerCase().includes(q)
      );
    }
    if (presetFilter) {
      data = data.filter((r) => String(r.preset_id) === presetFilter);
    }
    if (statusFilter) {
      data = data.filter((r) => r.status === statusFilter);
    }
    data.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return data;
  }, [runs, search, presetFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await apiClient.delete(`/runs/${deleteId}`);
      toast.success("Run deleted");
      setDeleteId(null);
      fetchRuns();
    } catch {
      toast.error("Failed to delete run");
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">History</h1>
        <p className="text-sm text-muted-foreground">View all past runs</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search runs..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={presetFilter}
          onValueChange={(v) => {
            setPresetFilter(v);
            setPage(1);
          }}
          placeholder="All Presets"
          className="w-48"
        >
          <SelectItem value="">All Presets</SelectItem>
          {presetNames.map(([id, name]) => (
            <SelectItem key={id} value={String(id)}>
              {name}
            </SelectItem>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          placeholder="All Status"
          className="w-40"
        >
          <SelectItem value="">All Status</SelectItem>
          <SelectItem value="success">Success</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </Select>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          No runs found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Preset</TableHead>
                <TableHead>Input</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((run) => (
                <TableRow
                  key={run.id}
                  className="cursor-pointer"
                  onClick={() => setViewRunId(run.id)}
                >
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(run.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {run.preset?.name || run.preset_id}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {truncate(run.input, 60)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={run.status === "success" ? "success" : "error"}
                    >
                      {run.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {run.model}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDuration(run.duration_ms)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {(run.tokens_prompt || 0) + (run.tokens_completion || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setViewRunId(run.id)}
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Dialog
                        open={deleteId === run.id}
                        onOpenChange={(o) => setDeleteId(o ? run.id : null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Run</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this run? This cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setDeleteId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleDelete}
                            >
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {viewRunId && (
        <RunDetails
          runId={viewRunId}
          open={true}
          onClose={() => setViewRunId(null)}
          onRunAgain={(run) => {
            navigate(`/presets/${run.preset_id}?tab=run`, { state: { run } });
          }}
        />
      )}
    </div>
  );
}
