import { useEffect, useState } from "react";
import {
  Save,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/api/client";
import { Provider } from "@/types";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const emptyForm = {
    name: "",
    base_url: "",
    api_key: "",
    default_model: "",
    active: false,
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    setLoading(true);
    try {
      const res = await apiClient.get<Provider[]>("/providers");
      setProviders(res.data);
    } catch {
      toast.error("Failed to load providers");
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setForm(emptyForm);
    setEditingProvider(null);
    setIsAddOpen(true);
  }

  function openEdit(p: Provider) {
    setForm({
      name: p.name,
      base_url: p.base_url,
      api_key: p.api_key || "",
      default_model: p.default_model || "",
      active: p.active,
    });
    setEditingProvider(p);
    setIsAddOpen(true);
  }

  async function handleSave() {
    try {
      if (editingProvider) {
        await apiClient.put(`/providers/${editingProvider.id}`, form);
        toast.success("Provider updated");
      } else {
        await apiClient.post("/providers", form);
        toast.success("Provider added");
      }
      setIsAddOpen(false);
      fetchProviders();
    } catch {
      toast.error("Failed to save provider");
    }
  }

  async function handleDelete(id: number) {
    try {
      await apiClient.delete(`/providers/${id}`);
      toast.success("Provider deleted");
      fetchProviders();
    } catch {
      toast.error("Failed to delete provider");
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage app configuration</p>
      </div>

      <Tabs defaultValue="providers">
        <TabsList className="mb-6">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="apikeys">API Keys</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="importexport">Import/Export</TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Providers</h2>
            <Button onClick={openAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Provider
            </Button>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-600">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">
                      Base URL
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">
                      Default Model
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">
                      Active
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b transition-colors hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {p.base_url}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {p.default_model || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {p.active ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <Check className="h-4 w-4" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <X className="h-4 w-4" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(p)}
                          >
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(p.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {providers.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        No providers yet. Add one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="general">
          <div className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">General Settings</h2>
            <p className="text-slate-500">General settings coming soon.</p>
          </div>
        </TabsContent>

        <TabsContent value="apikeys">
          <div className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">API Keys</h2>
            <p className="text-slate-500">Manage API keys in the Providers tab.</p>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Templates</h2>
            <p className="text-slate-500">Templates coming soon.</p>
          </div>
        </TabsContent>

        <TabsContent value="importexport">
          <div className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Import / Export</h2>
            <p className="text-slate-500">Import and export functionality coming soon.</p>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? "Edit Provider" : "Add Provider"}
            </DialogTitle>
            <DialogDescription>
              Configure the provider details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-1 block">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="OpenAI"
              />
            </div>
            <div>
              <Label className="mb-1 block">Base URL</Label>
              <Input
                value={form.base_url}
                onChange={(e) =>
                  setForm({ ...form, base_url: e.target.value })
                }
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div>
              <Label className="mb-1 block">API Key</Label>
              <Input
                type="password"
                value={form.api_key}
                onChange={(e) =>
                  setForm({ ...form, api_key: e.target.value })
                }
                placeholder="sk-..."
              />
            </div>
            <div>
              <Label className="mb-1 block">Default Model</Label>
              <Input
                value={form.default_model}
                onChange={(e) =>
                  setForm({ ...form, default_model: e.target.value })
                }
                placeholder="gpt-4o"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
