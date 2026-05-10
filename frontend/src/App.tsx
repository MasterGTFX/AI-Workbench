import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AppRoutes from "@/routes/AppRoutes";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ai-workbench-theme">
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" />
      </BrowserRouter>
    </ThemeProvider>
  );
}
