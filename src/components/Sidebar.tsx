import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ClipboardList,
  MessageSquare,
  ShieldAlert,
  BarChart3,
  LogOut,
  X,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const adminNavItems: NavItem[] = [
  { to: "/surveys", icon: ClipboardList, label: "调查管理" },
  { to: "/square", icon: MessageSquare, label: "意见广场" },
  { to: "/review", icon: ShieldAlert, label: "内容审核" },
  { to: "/reports", icon: BarChart3, label: "统计报告" },
  { to: "/settings", icon: Settings, label: "数据管理" },
];

const employeeNavItems: NavItem[] = [
  { to: "/surveys", icon: ClipboardList, label: "参与调查" },
  { to: "/square", icon: MessageSquare, label: "意见广场" },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const currentUser = useStore((s) => s.currentUser);
  const logout = useStore((s) => s.logout);
  const navItems = currentUser?.role === "admin" ? adminNavItems : employeeNavItems;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "w-64 h-screen flex-shrink-0 bg-gradient-to-b from-[#1a1a2e] to-[#16213e] transition-transform duration-300 ease-in-out",
          "fixed inset-y-0 left-0 z-50 md:relative md:z-auto md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col h-full"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex items-center gap-3 px-6 py-6 border-b border-white/5"
          >
            <Shield className="text-[#f0a500]" size={28} />
            <h1 className="text-xl font-bold text-white tracking-wide">匿名之声</h1>
            <button
              onClick={onClose}
              className="ml-auto md:hidden text-white/60 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>

          <nav className="flex-1 py-4 space-y-1">
            {navItems.map((item, i) => (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.3 }}
              >
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "border-l-[3px] border-[#f0a500] text-[#f0a500] bg-[#f0a500]/10"
                        : "border-l-[3px] border-transparent text-white/60 hover:text-white hover:bg-white/5"
                    )
                  }
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              </motion.div>
            ))}
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="px-4 py-4 border-t border-white/5"
          >
            {currentUser && (
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="w-8 h-8 rounded-full bg-[#f0a500]/20 flex items-center justify-center text-[#f0a500] text-sm font-bold">
                  {currentUser.displayName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {currentUser.displayName}
                  </p>
                  <p className="text-xs text-white/40">
                    {currentUser.role === "admin" ? "管理员" : "员工"}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-white/40 hover:text-[#f0a500] hover:bg-white/5 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </aside>
    </>
  );
}
