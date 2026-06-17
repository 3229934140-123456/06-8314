import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  MessageSquare,
  Eye,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  Mail,
  Users,
  CheckCircle,
  History,
  ChevronDown,
  ChevronUp,
  Send,
  FileText,
  Tag,
  BarChart2,
  AlertTriangle,
  Download,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useStore } from "@/store";
import { tagColors, reportRecipients } from "@/data/mock";
import { formatDate } from "@/utils/format";
import type { SentReport } from "@/types";

interface QuarterInfo {
  label: string;
  year: number;
  quarter: number;
  start: Date;
  end: Date;
}

function getRecentQuarters(count: number): QuarterInfo[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const quarters: QuarterInfo[] = [];

  let q = currentQuarter;
  let y = currentYear;

  for (let i = 0; i < count; i++) {
    const startMonth = (q - 1) * 3;
    const start = new Date(y, startMonth, 1);
    const end = new Date(y, startMonth + 3, 0, 23, 59, 59, 999);
    quarters.push({
      label: `${y} Q${q}`,
      year: y,
      quarter: q,
      start,
      end,
    });
    q--;
    if (q < 1) {
      q = 4;
      y--;
    }
  }

  return quarters;
}

function getQuarterMonths(quarter: number): string[] {
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  const startMonth = (quarter - 1) * 3;
  return [monthNames[startMonth], monthNames[startMonth + 1], monthNames[startMonth + 2]];
}

function calcPercentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export default function Reports() {
  const currentUser = useStore((s) => s.currentUser);
  const submissions = useStore((s) => s.submissions);
  const sentReports = useStore((s) => s.sentReports);
  const sendReport = useStore((s) => s.sendReport);

  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const quarters = useMemo(() => getRecentQuarters(4), []);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [sendQuarterIdx, setSendQuarterIdx] = useState(0);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [recipientDropdown, setRecipientDropdown] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  const selectedQuarter = quarters[selectedIdx];
  const sendQuarter = quarters[sendQuarterIdx];

  const quarterSubmissions = useMemo(
    () =>
      submissions.filter((sub) => {
        const d = new Date(sub.submittedAt);
        return d >= selectedQuarter.start && d <= selectedQuarter.end;
      }),
    [submissions, selectedQuarter]
  );

  const prevQuarter = selectedIdx < quarters.length - 1 ? quarters[selectedIdx + 1] : null;
  const prevQuarterSubmissions = useMemo(
    () =>
      prevQuarter
        ? submissions.filter((sub) => {
            const d = new Date(sub.submittedAt);
            return d >= prevQuarter.start && d <= prevQuarter.end;
          })
        : [],
    [submissions, prevQuarter]
  );

  const totalCount = quarterSubmissions.length;
  const visibleCount = quarterSubmissions.filter((s) => s.status === "visible").length;
  const pendingCount = quarterSubmissions.filter((s) => s.status === "pending_review").length;
  const rejectedCount = quarterSubmissions.filter((s) => s.status === "rejected").length;

  const prevTotal = prevQuarterSubmissions.length;
  const prevVisible = prevQuarterSubmissions.filter((s) => s.status === "visible").length;
  const prevPending = prevQuarterSubmissions.filter((s) => s.status === "pending_review").length;
  const prevRejected = prevQuarterSubmissions.filter((s) => s.status === "rejected").length;

  const monthlyTrend = useMemo(() => {
    const months = getQuarterMonths(selectedQuarter.quarter);
    const startMonth = (selectedQuarter.quarter - 1) * 3;

    return months.map((month, i) => {
      const monthStart = new Date(selectedQuarter.year, startMonth + i, 1);
      const monthEnd = new Date(selectedQuarter.year, startMonth + i + 1, 0, 23, 59, 59, 999);
      const monthSubs = quarterSubmissions.filter((sub) => {
        const d = new Date(sub.submittedAt);
        return d >= monthStart && d <= monthEnd;
      });

      const entry: Record<string, string | number> = { month };
      const tagCountMap: Record<string, number> = {};
      for (const sub of monthSubs) {
        for (const tag of sub.tags) {
          tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
        }
      }
      for (const tag of Object.keys(tagColors)) {
        entry[tag] = tagCountMap[tag] || 0;
      }
      return entry;
    });
  }, [quarterSubmissions, selectedQuarter]);

  const tagDistribution = useMemo(() => {
    const tagCountMap: Record<string, number> = {};
    for (const sub of quarterSubmissions) {
      for (const tag of sub.tags) {
        tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
      }
    }
    return Object.entries(tagCountMap)
      .map(([tag, count]) => ({
        tag,
        count,
        color: tagColors[tag] || "#6b7280",
      }))
      .sort((a, b) => b.count - a.count);
  }, [quarterSubmissions]);

  const topTags = useMemo(() => {
    const total = quarterSubmissions.reduce((acc, sub) => acc + sub.tags.length, 0);
    return tagDistribution.map((item) => ({
      ...item,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
    }));
  }, [tagDistribution, quarterSubmissions]);

  const statCards = [
    { label: "本季提交总数", count: totalCount, prev: prevTotal, icon: MessageSquare, color: "amber" },
    { label: "已公开", count: visibleCount, prev: prevVisible, icon: Eye, color: "green" },
    { label: "待审核", count: pendingCount, prev: prevPending, icon: Clock, color: "yellow" },
    { label: "已拒绝", count: rejectedCount, prev: prevRejected, icon: XCircle, color: "red" },
  ];

  const colorMap: Record<string, { iconBg: string; iconText: string; trendUp: string; trendDown: string }> = {
    amber: { iconBg: "bg-amber-500/15", iconText: "text-amber-400", trendUp: "text-green-400", trendDown: "text-red-400" },
    green: { iconBg: "bg-green-500/15", iconText: "text-green-400", trendUp: "text-green-400", trendDown: "text-red-400" },
    yellow: { iconBg: "bg-yellow-500/15", iconText: "text-yellow-400", trendUp: "text-green-400", trendDown: "text-red-400" },
    red: { iconBg: "bg-red-500/15", iconText: "text-red-400", trendUp: "text-green-400", trendDown: "text-red-400" },
  };

  if (currentUser?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const chartTags = Object.keys(tagColors);

  const handleToggleRecipient = (id: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRecipients.length === reportRecipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(reportRecipients.map((r) => r.id));
    }
  };

  const handleSendReport = () => {
    if (selectedRecipients.length === 0) {
      setToast({ show: true, message: "请至少选择一个收件人" });
      setTimeout(() => setToast({ show: false, message: "" }), 3000);
      return;
    }

    const recipients = reportRecipients
      .filter((r) => selectedRecipients.includes(r.id))
      .map(({ name, email }) => ({ name, email }));

    sendReport({
      year: sendQuarter.year,
      quarter: sendQuarter.quarter,
      recipients,
    });

    setToast({ show: true, message: "报告发送成功！" });
    setSelectedRecipients([]);
    setRecipientDropdown(false);
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [previewReport, setPreviewReport] = useState<SentReport | null>(null);

  const reportTrendTags = useMemo(() => {
    if (!previewReport) return [];
    const tags = new Set<string>();
    for (const entry of previewReport.reportData.monthlyTrend) {
      for (const tag of Object.keys(entry.byTag)) {
        tags.add(tag);
      }
    }
    return [...tags].sort((a, b) => {
      const aCount = previewReport.reportData.categoryBreakdown.find((c) => c.tag === a)?.count || 0;
      const bCount = previewReport.reportData.categoryBreakdown.find((c) => c.tag === b)?.count || 0;
      return bCount - aCount;
    });
  }, [previewReport]);

  const handleExportReport = (report: SentReport) => {
    const exportData = {
      quarter: `${report.year} ${report.quarter}`,
      sentAt: report.sentAt,
      sentBy: report.sentBy,
      recipients: report.recipients,
      statistics: {
        totalSubmissions: report.reportData.totalSubmissions,
        reviewedSubmissions: report.reportData.reviewedSubmissions,
        pendingReviewSubmissions: report.reportData.pendingReviewSubmissions,
        rejectedSubmissions: report.reportData.rejectedSubmissions,
      },
      categoryBreakdown: report.reportData.categoryBreakdown,
      monthlyTrend: report.reportData.monthlyTrend,
      topTags: report.reportData.topTags,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${report.year}_Q${report.quarter.replace("Q", "")}_${new Date(report.sentAt).toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderReportCard = (report: SentReport, index: number) => {
    const { reportData } = report;
    const recipientsText = report.recipients.map((r) => r.name).join(", ");
    const truncatedRecipients = recipientsText.length > 50
      ? recipientsText.substring(0, 50) + "..."
      : recipientsText;
    const trendTags = useMemo(() => {
      const tags = new Set<string>();
      for (const entry of reportData.monthlyTrend) {
        for (const tag of Object.keys(entry.byTag)) {
          tags.add(tag);
        }
      }
      return [...tags].sort((a, b) => {
        const aCount = reportData.categoryBreakdown.find((c) => c.tag === a)?.count || 0;
        const bCount = reportData.categoryBreakdown.find((c) => c.tag === b)?.count || 0;
        return bCount - aCount;
      });
    }, [reportData.monthlyTrend, reportData.categoryBreakdown]);

    const isExpanded = expandedReport === report.id;

    return (
      <motion.div
        key={report.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ delay: index * 0.08 }}
        className="rounded-xl border border-white/5 bg-[#0f0f23] p-5"
      >
        <div
          className="flex items-start justify-between cursor-pointer"
          onClick={() => setExpandedReport(isExpanded ? null : report.id)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-white">{report.year} {report.quarter}</h3>
              <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
                <CheckCircle className="h-3 w-3" />
                已发送
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{formatDate(report.sentAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setPreviewReport(report); }}
              className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 px-2.5 py-1 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/25"
            >
              <FileText className="h-3 w-3" />
              快照
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleExportReport(report); }}
              className="inline-flex items-center gap-1 rounded-md bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/25"
            >
              <Download className="h-3 w-3" />
              导出
            </button>
            <span className="text-xs text-gray-500">{isExpanded ? "收起" : "查看详情"}</span>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-2">
            <Users className="mt-0.5 h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">发送人</p>
              <p className="text-sm text-gray-300">{report.sentBy}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Mail className="mt-0.5 h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">收件人</p>
              <p className="text-sm text-gray-300">{truncatedRecipients}</p>
              <p className="text-xs text-gray-500">
                {report.recipients.map((r) => r.email).join(", ")}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-3 border-t border-white/5 pt-4">
            <div className="text-center">
              <p className="text-xl font-semibold text-white">{reportData.totalSubmissions}</p>
              <p className="text-xs text-gray-500">总提交</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-green-400">{reportData.reviewedSubmissions}</p>
              <p className="text-xs text-gray-500">已公开</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-yellow-400">{reportData.pendingReviewSubmissions}</p>
              <p className="text-xs text-gray-500">待审核</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-red-400">{reportData.rejectedSubmissions}</p>
              <p className="text-xs text-gray-500">已拒绝</p>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-5 space-y-5 border-t border-white/5 pt-5">
                <div className="rounded-lg bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-amber-400" />
                    <h4 className="text-sm font-semibold text-white">标签分布（Top 10）</h4>
                  </div>
                  {reportData.topTags.length === 0 ? (
                    <p className="py-4 text-center text-xs text-gray-500">暂无标签数据</p>
                  ) : (
                    <div className="space-y-2.5">
                      {reportData.topTags.slice(0, 10).map((item, i) => (
                        <div key={item.tag} className="flex items-center gap-3">
                          <span className="w-5 text-right text-xs font-medium text-gray-500">{i + 1}</span>
                          <span
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: tagColors[item.tag] || "#6b7280" }}
                          />
                          <span className="w-20 text-sm text-gray-300">{item.tag}</span>
                          <div className="relative h-5 flex-1 overflow-hidden rounded bg-white/5">
                            <div
                              className="absolute inset-y-0 left-0 rounded"
                              style={{
                                width: `${item.percentage}%`,
                                backgroundColor: tagColors[item.tag] || "#6b7280",
                                opacity: 0.6,
                              }}
                            />
                          </div>
                          <span className="w-8 text-right text-sm font-medium text-gray-300">{item.count}</span>
                          <span className="w-10 text-right text-xs text-gray-500">{item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-amber-400" />
                    <h4 className="text-sm font-semibold text-white">月度趋势</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">月份</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">总数</th>
                          {trendTags.map((tag) => (
                            <th key={tag} className="px-3 py-2 text-right text-xs font-medium" style={{ color: tagColors[tag] || "#6b7280" }}>
                              {tag}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.monthlyTrend.map((entry) => (
                          <tr key={entry.month} className="border-b border-white/5 last:border-0">
                            <td className="px-3 py-2 text-gray-300">{entry.month}</td>
                            <td className="px-3 py-2 text-right font-medium text-white">{entry.count}</td>
                            {trendTags.map((tag) => (
                              <td key={tag} className="px-3 py-2 text-right text-gray-400">
                                {entry.byTag[tag] || 0}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-400" />
                      <h4 className="text-sm font-semibold text-yellow-300">待审核内容</h4>
                    </div>
                    <p className="text-3xl font-bold text-yellow-400">{reportData.pendingReviewSubmissions}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {reportData.pendingReviewSubmissions > 0
                        ? "需管理员审核后公开到意见广场"
                        : "本季度无待审核内容"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <h4 className="text-sm font-semibold text-red-300">已拒绝内容</h4>
                    </div>
                    <p className="text-3xl font-bold text-red-400">{reportData.rejectedSubmissions}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {reportData.rejectedSubmissions > 0
                        ? "已被管理员判定为违规并永久屏蔽"
                        : "本季度无被拒绝的内容"}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-400" />
                    <h4 className="text-sm font-semibold text-green-300">标签数量明细</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {reportData.categoryBreakdown.length === 0 ? (
                      <span className="text-xs text-gray-500">暂无数据</span>
                    ) : (
                      reportData.categoryBreakdown.map((item) => (
                        <span
                          key={item.tag}
                          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
                          style={{
                            borderColor: tagColors[item.tag] || "#6b7280",
                            color: tagColors[item.tag] || "#6b7280",
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: tagColors[item.tag] || "#6b7280" }}
                          />
                          {item.tag} · {item.count}条
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] px-4 py-8 text-gray-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-amber-400" />
          <h1 className="text-2xl font-bold text-white">统计报告</h1>
        </div>

        <div className="mb-6 inline-flex gap-1 rounded-lg bg-[#0f0f23] p-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 rounded-md px-5 py-2 text-sm font-medium transition-colors ${
              activeTab === "overview"
                ? "bg-amber-500 text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            数据概览
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 rounded-md px-5 py-2 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "bg-amber-500 text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <History className="h-4 w-4" />
            发送历史
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6 flex gap-1 rounded-lg bg-[#0f0f23] p-1">
                {quarters.map((q, i) => (
                  <button
                    key={q.label}
                    onClick={() => setSelectedIdx(i)}
                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                      selectedIdx === i
                        ? "bg-amber-500 text-black"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card, i) => {
                  const colors = colorMap[card.color];
                  const change = calcPercentChange(card.count, card.prev);
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="rounded-xl border border-white/5 bg-[#0f0f23] p-5"
                    >
                      <div className="flex items-center justify-between">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.iconBg}`}>
                          <Icon className={`h-5 w-5 ${colors.iconText}`} />
                        </div>
                        {change !== null && (
                          <span className={`flex items-center gap-0.5 text-xs font-medium ${change >= 0 ? colors.trendUp : colors.trendDown}`}>
                            {change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {Math.abs(change)}%
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-sm text-gray-400">{card.label}</p>
                      <p className="text-2xl font-semibold text-white">{card.count}</p>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl border border-white/5 bg-[#0f0f23] p-5 lg:col-span-2"
                >
                  <h2 className="mb-4 text-base font-semibold text-white">月度趋势</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a3e",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          color: "#e5e7eb",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {chartTags.map((tag) => (
                        <Line
                          key={tag}
                          type="monotone"
                          dataKey={tag}
                          stroke={tagColors[tag]}
                          strokeWidth={2}
                          dot={{ r: 3, fill: tagColors[tag] }}
                          activeDot={{ r: 5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-xl border border-white/5 bg-[#0f0f23] p-5"
                >
                  <h2 className="mb-4 text-base font-semibold text-white">标签分布</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={tagDistribution}
                        dataKey="count"
                        nameKey="tag"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        label={({ tag, percent }) => `${tag} ${(percent * 100).toFixed(0)}%`}
                      >
                        {tagDistribution.map((entry) => (
                          <Cell key={entry.tag} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a3e",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          color: "#e5e7eb",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-6 rounded-xl border border-white/5 bg-[#0f0f23] p-5"
              >
                <h2 className="mb-4 text-base font-semibold text-white">热门标签排行</h2>
                {topTags.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">暂无数据</p>
                ) : (
                  <div className="space-y-3">
                    {topTags.map((item, i) => (
                      <div key={item.tag} className="flex items-center gap-3">
                        <span className="w-5 text-right text-xs font-medium text-gray-500">{i + 1}</span>
                        <span
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="w-16 text-sm text-gray-300">{item.tag}</span>
                        <div className="relative h-6 flex-1 overflow-hidden rounded bg-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ duration: 0.6, delay: 0.6 + i * 0.05 }}
                            className="absolute inset-y-0 left-0 rounded"
                            style={{ backgroundColor: item.color, opacity: 0.7 }}
                          />
                        </div>
                        <span className="w-8 text-right text-sm font-medium text-gray-300">{item.count}</span>
                        <span className="w-10 text-right text-xs text-gray-500">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-xl border border-white/5 bg-[#0f0f23] p-5"
              >
                <div className="mb-4 flex items-center gap-2">
                  <Send className="h-5 w-5 text-amber-400" />
                  <h2 className="text-base font-semibold text-white">发送季度报告</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-400">选择季度</label>
                    <div className="flex gap-1 rounded-lg bg-black/30 p-1">
                      {quarters.map((q, i) => (
                        <button
                          key={q.label}
                          onClick={() => setSendQuarterIdx(i)}
                          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                            sendQuarterIdx === i
                              ? "bg-amber-500 text-black"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-400">选择收件人</label>
                    <div className="relative">
                      <button
                        onClick={() => setRecipientDropdown(!recipientDropdown)}
                        className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-left text-sm text-gray-300 hover:border-white/20"
                      >
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          {selectedRecipients.length === 0
                            ? "请选择收件人"
                            : `已选择 ${selectedRecipients.length} 人`}
                        </span>
                        {recipientDropdown ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </button>

                      <AnimatePresence>
                        {recipientDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-white/10 bg-[#1a1a3e] p-2 shadow-xl"
                          >
                            <div className="mb-2 border-b border-white/10 pb-2">
                              <button
                                onClick={handleSelectAll}
                                className="w-full px-2 py-1.5 text-left text-xs text-gray-400 hover:bg-white/5 rounded"
                              >
                                {selectedRecipients.length === reportRecipients.length
                                  ? "取消全选"
                                  : "全选"}
                              </button>
                            </div>
                            {reportRecipients.map((recipient) => (
                              <label
                                key={recipient.id}
                                className="flex items-start gap-3 rounded-md px-2 py-2 cursor-pointer hover:bg-white/5"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedRecipients.includes(recipient.id)}
                                  onChange={() => handleToggleRecipient(recipient.id)}
                                  className="mt-1 h-4 w-4 rounded border-gray-600 bg-black/30 text-amber-500 focus:ring-amber-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-200">{recipient.name}</p>
                                  <p className="text-xs text-gray-500">{recipient.email}</p>
                                  <p className="text-xs text-gray-600">{recipient.role}</p>
                                </div>
                              </label>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <button
                    onClick={handleSendReport}
                    disabled={selectedRecipients.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-black transition-all hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                    发送报告
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {sentReports.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-white/5 bg-[#0f0f23] p-12 text-center"
                >
                  <History className="mx-auto h-12 w-12 text-gray-600" />
                  <h3 className="mt-4 text-lg font-medium text-gray-400">暂无发送历史</h3>
                  <p className="mt-2 text-sm text-gray-600">您发送的季度报告将显示在这里</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {sentReports.map((report, i) => renderReportCard(report, i))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {previewReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setPreviewReport(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0f0f23] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 pb-4 mb-5 bg-[#0f0f23]">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {previewReport.year} {previewReport.quarter} 季度报告快照
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    发送于 {formatDate(previewReport.sentAt)} · 发送人: {previewReport.sentBy}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewReport(null)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-amber-400" />
                    收件人
                  </h3>
                  <div className="space-y-1">
                    {previewReport.recipients.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="text-gray-300">{r.name}</span>
                        <span className="text-gray-500">{r.email}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">统计口径</h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-lg bg-black/30 p-3 text-center">
                      <p className="text-xl font-bold text-white">{previewReport.reportData.totalSubmissions}</p>
                      <p className="text-xs text-gray-500">总提交</p>
                    </div>
                    <div className="rounded-lg bg-black/30 p-3 text-center">
                      <p className="text-xl font-bold text-green-400">{previewReport.reportData.reviewedSubmissions}</p>
                      <p className="text-xs text-gray-500">已公开</p>
                    </div>
                    <div className="rounded-lg bg-black/30 p-3 text-center">
                      <p className="text-xl font-bold text-yellow-400">{previewReport.reportData.pendingReviewSubmissions}</p>
                      <p className="text-xs text-gray-500">待审核</p>
                    </div>
                    <div className="rounded-lg bg-black/30 p-3 text-center">
                      <p className="text-xl font-bold text-red-400">{previewReport.reportData.rejectedSubmissions}</p>
                      <p className="text-xs text-gray-500">已拒绝</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-amber-400" />
                    标签分布明细
                  </h3>
                  <div className="space-y-2">
                    {previewReport.reportData.topTags.map((item, i) => (
                      <div key={item.tag} className="flex items-center gap-3">
                        <span className="w-5 text-right text-xs text-gray-500">{i + 1}</span>
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tagColors[item.tag] || "#6b7280" }} />
                        <span className="w-20 text-sm text-gray-300">{item.tag}</span>
                        <div className="relative h-4 flex-1 overflow-hidden rounded bg-white/5">
                          <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${item.percentage}%`, backgroundColor: tagColors[item.tag] || "#6b7280", opacity: 0.6 }} />
                        </div>
                        <span className="w-8 text-right text-sm text-gray-300">{item.count}</span>
                        <span className="w-10 text-right text-xs text-gray-500">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-amber-400" />
                    月度趋势（按实际标签）
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">月份</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">总数</th>
                          {reportTrendTags.map((tag) => (
                            <th key={tag} className="px-3 py-2 text-right text-xs font-medium" style={{ color: tagColors[tag] || "#6b7280" }}>
                              {tag}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewReport.reportData.monthlyTrend.map((entry) => (
                          <tr key={entry.month} className="border-b border-white/5 last:border-0">
                            <td className="px-3 py-2 text-gray-300">{entry.month}</td>
                            <td className="px-3 py-2 text-right font-medium text-white">{entry.count}</td>
                            {reportTrendTags.map((tag) => (
                              <td key={tag} className="px-3 py-2 text-right text-gray-400">
                                {entry.byTag[tag] || 0}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-yellow-400" />
                      <h4 className="text-sm font-semibold text-yellow-300">待审核</h4>
                    </div>
                    <p className="text-2xl font-bold text-yellow-400">{previewReport.reportData.pendingReviewSubmissions}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {previewReport.reportData.pendingReviewSubmissions > 0
                        ? "需管理员审核后公开"
                        : "无待审核内容"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <h4 className="text-sm font-semibold text-red-300">已拒绝</h4>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{previewReport.reportData.rejectedSubmissions}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {previewReport.reportData.rejectedSubmissions > 0
                        ? "被判定违规已永久屏蔽"
                        : "无被拒绝内容"}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                  <button
                    onClick={() => handleExportReport(previewReport)}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-500/15 px-4 py-2 text-sm font-medium text-green-400 hover:bg-green-500/25 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    导出 JSON
                  </button>
                  <button
                    onClick={() => setPreviewReport(null)}
                    className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-green-500/90 px-4 py-3 text-sm font-medium text-white shadow-lg backdrop-blur"
          >
            <CheckCircle className="h-4 w-4" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
