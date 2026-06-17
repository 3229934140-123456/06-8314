import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#1a1a2e]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main
        className="flex-1 overflow-auto bg-[#0f0f23] relative"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-[#1a1a2e]/80 text-[#f0a500] backdrop-blur-sm md:hidden"
        >
          <Menu size={24} />
        </button>

        <Outlet />
      </main>
    </div>
  );
}
