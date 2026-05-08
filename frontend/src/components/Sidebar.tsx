import { useEffect, useState, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  History,
  Settings,
  Plus,
  Cpu,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiClient } from "@/api/client";
import { Provider, ModelItem } from "@/types";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

const navItems = [
  { to: "/", label: "Presets", icon: LayoutDashboard },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelValue, setModelValue] = useState("");
  const navigate = useNavigate();

  const fetchProviders = useCallback(async () => {
    try {
      const res = await apiClient.get<Provider[]>("/providers");
      setProviders(res.data);
      const active = res.data.find((p) => p.active) || null;
      setActiveProvider(active);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const fetchModels = useCallback(async (providerId: number) => {
    setModelsLoading(true);
    try {
      const res = await apiClient.get<ModelItem[]>(
        `/providers/${providerId}/models`
      );
      setModels(res.data);
    } catch {
      setModels([]);
    } finally {
      setModelsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dialogOpen && activeProvider) {
      fetchModels(activeProvider.id);
      setModelValue(activeProvider.default_model || "");
    }
  }, [dialogOpen, activeProvider, fetchModels]);

  async function activateProvider(id: number) {
    try {
      const res = await apiClient.post<Provider>(`/providers/${id}/activate`);
      await fetchProviders();
      fetchModels(id);
      setModelValue(res.data.default_model || "");
      toast.success("Provider activated");
    } catch {
      toast.error("Failed to switch provider");
    }
  }

  async function saveModel() {
    if (!activeProvider) return;
    try {
      await apiClient.put(`/providers/${activeProvider.id}`, {
        default_model: modelValue,
      });
      await fetchProviders();
      toast.success("Model updated");
    } catch {
      toast.error("Failed to update model");
    }
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-[#f8fafc]">
      <div className="flex items-center gap-2 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Cpu className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-slate-900">AI Presets</span>
      </div>

      <div className="px-4 pb-2">
        <Button
          onClick={() => navigate("/presets/new")}
          className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Preset
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-4">
        <button
          onClick={() => setDialogOpen(true)}
          className="w-full rounded-lg border bg-white p-3 shadow-sm text-left hover:bg-slate-50 transition-colors"
        >
          <div className="text-xs font-medium text-slate-500 mb-1">
            Active Provider
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-slate-900">
                {activeProvider?.name || "None"}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </div>
          {activeProvider?.default_model && (
            <div className="mt-1 truncate text-xs text-slate-600 font-medium">
              {activeProvider.default_model}
            </div>
          )}
          {activeProvider?.base_url && (
            <div className="mt-1 truncate text-xs text-slate-500">
              {activeProvider.base_url}
            </div>
          )}
        </button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Switch Provider &amp; Model</DialogTitle>
            <DialogDescription>
              Change the active provider and its model.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-1 block">Provider</Label>
              <div className="space-y-1 max-h-40 overflow-auto rounded-md border p-1">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => activateProvider(p.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
                      p.id === activeProvider?.id
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <span className="font-medium">{p.name}</span>
                    {p.id === activeProvider?.id && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                ))}
                {providers.length === 0 && (
                  <p className="px-2 py-1.5 text-sm text-slate-500">
                    No providers configured.
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label className="mb-1 block">Model</Label>
              <Input
                value={modelValue}
                onChange={(e) => setModelValue(e.target.value)}
                placeholder="Type or pick a model..."
              />
              {modelsLoading ? (
                <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading models...
                </div>
              ) : models.length > 0 ? (
                <div className="mt-1 max-h-40 overflow-auto rounded-md border">
                  {models
                    .filter((m) =>
                      m.id.toLowerCase().includes(modelValue.toLowerCase())
                    )
                    .map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setModelValue(m.id)}
                        className={cn(
                          "flex w-full items-center justify-between px-2 py-1.5 text-sm transition-colors hover:bg-slate-100",
                          modelValue === m.id
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-700"
                        )}
                      >
                        <span className="truncate">{m.id}</span>
                        {modelValue === m.id && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                        )}
                      </button>
                    ))}
                  {models.filter((m) =>
                    m.id.toLowerCase().includes(modelValue.toLowerCase())
                  ).length === 0 && (
                    <p className="px-2 py-1.5 text-xs text-slate-500">
                      No matches. "{modelValue}" will be used as a custom model.
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  No models loaded. Type a custom model name above.
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={saveModel} className="w-full">
              Save Model
            </Button>
            <button
              onClick={() => {
                setDialogOpen(false);
                navigate("/settings");
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Manage providers →
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
