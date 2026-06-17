import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  MessageSquare,
  Eye,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
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
import { tagColors } from "@/data/mock";

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

  const quarters = useMemo(() => getRecentQuarters(4), []);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const selectedQuarter = quarters[selectedIdx];

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

  return (
    <div className="min-h-screen bg-[#0a0a1a] px-4 py-8 text-gray-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-amber-400" />
          <h1 className="text-2xl font-bold text-white">统计报告</h1>
        </div>

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
          className="rounded-xl border border-white/5 bg-[#0f0f23] p-5"
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
      </div>
    </div>
  );
}
