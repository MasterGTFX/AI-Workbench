import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  History,
  Settings,
  Plus,
  Cpu,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/api/client";
import { Provider } from "@/types";
import { cn } from "@/utils/cn";

const navItems = [
  { to: "/", label: "Presets", icon: LayoutDashboard },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient
      .get<Provider[]>("/providers")
      .then((res) => {
        const active = res.data.find((p) => p.active);
        setActiveProvider(active || null);
      })
      .catch(() => {});
  }, []);

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
        <div className="rounded-lg border bg-white p-3 shadow-sm">
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
          {activeProvider?.base_url && (
            <div className="mt-1 truncate text-xs text-slate-500">
              {activeProvider.base_url}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
