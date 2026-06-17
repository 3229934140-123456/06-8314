import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Database,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw,
  Trash2,
  Clock,
  FileText,
  Check,
} from "lucide-react";
import { useStore } from "@/store";
import { formatDate } from "@/utils/format";

export default function Settings() {
  const currentUser = useStore((s) => s.currentUser);
  const surveys = useStore((s) => s.surveys);
  const submissions = useStore((s) => s.submissions);
  const sentReports = useStore((s) => s.sentReports);
  const resetToDemoData = useStore((s) => s.resetToDemoData);

  const [confirmed, setConfirmed] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" } | null>(null);

  const lastModified = useMemo(() => {
    const times: string[] = [];
    surveys.forEach((s) => {
      times.push(s.createdAt);
      if (s.closedAt) times.push(s.closedAt);
    });
    submissions.forEach((s) => {
      times.push(s.submittedAt);
      if (s.repliedAt) times.push(s.repliedAt);
    });
    sentReports.forEach((r) => times.push(r.sentAt));

    if (times.length === 0) return null;

    const dates = times.map((t) => new Date(t).getTime());
    const maxTime = Math.max(...dates);
    return new Date(maxTime).toISOString();
  }, [surveys, submissions, sentReports]);

  const stats = [
    { label: "调查问卷", value: surveys.length, icon: FileText, color: "text-blue-400", bg: "bg-blue-500/15" },
    { label: "提交反馈", value: submissions.length, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/15" },
    { label: "已发送报告", value: sentReports.length, icon: FileText, color: "text-purple-400", bg: "bg-purple-500/15" },
  ];

  const handleReset = () => {
    if (!confirmed) return;
    resetToDemoData();
    setConfirmed(false);
    setToast({ message: "演示数据已重置成功", type: "success" });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = () => {
    const state = useStore.getState();
    const exportData = {
      surveys: state.surveys,
      submissions: state.submissions,
      sentReports: state.sentReports,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-data-${formatDate(new Date().toISOString()).replace(/[:\s]/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast({ message: "数据导出成功", type: "success" });
    setTimeout(() => setToast(null), 3000);
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0a0a1a" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-6"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <ShieldAlert size={40} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">访问受限</h1>
          <p className="text-gray-400">此页面仅管理员可访问</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 text-gray-100 sm:px-6 lg:px-8" style={{ backgroundColor: "#0a0a1a" }}>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl text-sm font-medium"
          style={{
            backgroundColor: toast.type === "success" ? "#065f46" : "#78350f",
            color: toast.type === "success" ? "#6ee7b7" : "#fcd34d",
            border: `1px solid ${toast.type === "success" ? "#10b981" : "#f59e0b"}`,
          }}
        >
          {toast.message}
        </motion.div>
      )}

      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-3"
        >
          <Database size={28} className="text-amber-400" />
          <h1 className="text-2xl font-bold text-white">数据管理</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-white/5 p-6 mb-6"
          style={{ backgroundColor: "#0f0f23" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Database size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">数据持久化状态</h2>
              <p className="text-sm text-gray-400">所有数据保存在浏览器 localStorage 中</p>
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            本系统采用浏览器本地存储方案，所有数据包括调查问卷、用户提交的反馈、管理员回复以及已发送的统计报告均保存在当前浏览器的 localStorage 中。清除浏览器数据或更换设备会导致数据丢失，建议定期导出备份。
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="rounded-lg border border-white/5 p-4"
                  style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <Icon size={18} className={stat.color} />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
                      <Check size={14} className="text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="rounded-lg border border-white/5 p-4 flex items-center gap-3" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">最后修改时间</p>
              <p className="text-sm font-medium text-white">
                {lastModified ? formatDate(lastModified) : "暂无数据"}
              </p>
            </div>
            <div className="ml-auto w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <Check size={14} className="text-emerald-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-amber-500/20 p-6"
          style={{ backgroundColor: "rgba(245, 158, 11, 0.05)" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <AlertTriangle size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">重置演示数据</h2>
              <p className="text-sm text-gray-400">将所有数据恢复到初始演示状态</p>
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/20 p-4 mb-6" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-400 mt-0.5 shrink-0" />
              <div className="text-sm text-gray-300 leading-relaxed">
                <p className="font-medium text-amber-300 mb-1">此操作不可撤销</p>
                <p>
                  执行此操作将清空当前所有数据，包括：所有调查问卷及其回复、所有提交的反馈内容、所有管理员回复记录、所有已发送的报告记录，并恢复为系统初始的演示数据。建议在执行前先导出当前数据进行备份。
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 mb-6">
            <button
              type="button"
              onClick={() => setConfirmed(!confirmed)}
              className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                confirmed
                  ? "bg-red-500 border-red-500"
                  : "bg-transparent border-gray-600 hover:border-gray-500"
              }`}
            >
              {confirmed && <Check size={14} className="text-white" />}
            </button>
            <label
              onClick={() => setConfirmed(!confirmed)}
              className="text-sm text-gray-300 cursor-pointer select-none"
            >
              我确认要重置所有数据
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:bg-white/5"
            >
              <Download size={16} />
              导出当前数据
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={!confirmed}
              className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                confirmed
                  ? "hover:opacity-90 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
              style={{
                background: confirmed
                  ? "linear-gradient(135deg, #ef4444, #dc2626)"
                  : "linear-gradient(135deg, #7f1d1d, #7f1d1d)",
              }}
            >
              {confirmed ? (
                <>
                  <Trash2 size={16} />
                  一键清空并重置演示数据
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  请先确认重置操作
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
