import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutGrid,
  List,
  Play,
  Pencil,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectItem,
} from "@/components/ui/select";
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
import { Preset } from "@/types";
import {
  formatDate,
  parseTags,
  tagColor,
} from "@/utils/helpers";
import toast from "react-hot-toast";

const PAGE_SIZE = 10;

export default function Dashboard() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sort, setSort] = useState("updated_desc");
  const [view, setView] = useState<"table" | "cards">("table");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPresets();
  }, []);

  async function fetchPresets() {
    setLoading(true);
    try {
      const res = await apiClient.get<Preset[]>("/presets");
      setPresets(res.data);
    } catch {
      toast.error("Failed to load presets");
    } finally {
      setLoading(false);
    }
  }

  const allTags = useMemo(() => {
    const set = new Set<string>();
    presets.forEach((p) => parseTags(p.tags).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [presets]);

  const filtered = useMemo(() => {
    let data = [...presets];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.model || "").toLowerCase().includes(q)
      );
    }
    if (tagFilter) {
      data = data.filter((p) =>
        parseTags(p.tags).some((t) => t === tagFilter)
      );
    }
    switch (sort) {
      case "updated_desc":
        data.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() -
            new Date(a.updated_at).getTime()
        );
        break;
      case "updated_asc":
        data.sort(
          (a, b) =>
            new Date(a.updated_at).getTime() -
            new Date(b.updated_at).getTime()
        );
        break;
      case "name_asc":
        data.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        data.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }
    return data;
  }, [presets, search, tagFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleDuplicate(id: number) {
    try {
      await apiClient.post(`/presets/${id}/duplicate`);
      toast.success("Preset duplicated");
      fetchPresets();
    } catch {
      toast.error("Failed to duplicate preset");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await apiClient.delete(`/presets/${deleteId}`);
      toast.success("Preset deleted");
      setDeleteId(null);
      fetchPresets();
    } catch {
      toast.error("Failed to delete preset");
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Presets</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "table" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("table")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "cards" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("cards")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search presets..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={tagFilter}
          onValueChange={(v) => {
            setTagFilter(v);
            setPage(1);
          }}
          placeholder="All Tags"
          className="w-40"
        >
          <SelectItem value="">All Tags</SelectItem>
          {allTags.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </Select>
        <Select
          value={sort}
          onValueChange={setSort}
          placeholder="Sort"
          className="w-48"
        >
          <SelectItem value="updated_desc">Updated (desc)</SelectItem>
          <SelectItem value="updated_asc">Updated (asc)</SelectItem>
          <SelectItem value="name_asc">Name (A–Z)</SelectItem>
          <SelectItem value="name_desc">Name (Z–A)</SelectItem>
        </Select>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-slate-500">
          No presets found.
        </div>
      ) : view === "table" ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((preset) => (
                <TableRow
                  key={preset.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/presets/${preset.id}?tab=configure`)}
                >
                  <TableCell className="font-medium">{preset.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-slate-600">
                    {preset.description || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {parseTags(preset.tags).map((t) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className={tagColor(t)}
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {preset.model || (
                      <span className="text-slate-400 italic">Active model</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {formatDate(preset.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/presets/${preset.id}?tab=run`);
                        }}
                      >
                        <Play className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/presets/${preset.id}?tab=configure`);
                        }}
                      >
                        <Pencil className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(preset.id);
                        }}
                      >
                        <Copy className="h-4 w-4 text-slate-600" />
                      </Button>
                      <Dialog
                        open={deleteId === preset.id}
                        onOpenChange={(o) =>
                          setDeleteId(o ? preset.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Preset</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete "{preset.name}"?
                              This cannot be undone.
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
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paged.map((preset) => (
            <div
              key={preset.id}
              className="rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
              onClick={() => navigate(`/presets/${preset.id}?tab=configure`)}
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{preset.name}</h3>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/presets/${preset.id}?tab=run`);
                    }}
                  >
                    <Play className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/presets/${preset.id}?tab=configure`);
                    }}
                  >
                    <Pencil className="h-4 w-4 text-blue-600" />
                  </Button>
                </div>
              </div>
              <p className="mb-3 text-sm text-slate-600 line-clamp-2">
                {preset.description || "No description"}
              </p>
              <div className="mb-3 flex flex-wrap gap-1">
                {parseTags(preset.tags).map((t) => (
                  <Badge key={t} variant="outline" className={tagColor(t)}>
                    {t}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{preset.model || "Active model"}</span>
                <span>{formatDate(preset.updated_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
