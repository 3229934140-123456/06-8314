import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ClipboardList,
  FileCheck,
  MessageSquare,
  Play,
  Square,
  Eye,
  Plus,
} from "lucide-react";
import { useStore } from "@/store";
import { formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";
import { tagColors } from "@/data/mock";
import type { SurveyStatus } from "@/types";

const statusConfig: Record<SurveyStatus, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  active: { label: "进行中", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  closed: { label: "已结束", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
};

function StatusBadge({ status }: { status: SurveyStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}

function TagBadge({ tag }: { tag: string }) {
  const color = tagColors[tag] ?? "#6b7280";
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-gray-300">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {tag}
    </span>
  );
}

type FilterTab = "all" | "active" | "closed";

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "active", label: "进行中" },
  { key: "closed", label: "已结束" },
];

export default function Surveys() {
  const currentUser = useStore((s) => s.currentUser);
  const surveys = useStore((s) => s.surveys);
  const updateSurveyStatus = useStore((s) => s.updateSurveyStatus);
  const [filter, setFilter] = useState<FilterTab>("all");

  const isAdmin = currentUser?.role === "admin";

  const filteredSurveys = isAdmin
    ? surveys.filter((s) => {
        if (filter === "active") return s.status === "active";
        if (filter === "closed") return s.status === "closed";
        return true;
      })
    : surveys.filter((s) => s.status === "active");

  const activeCount = surveys.filter((s) => s.status === "active").length;
  const closedCount = surveys.filter((s) => s.status === "closed").length;
  const totalResponses = surveys.reduce((acc, s) => acc + s.responseCount, 0);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] px-4 py-8 text-gray-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">问卷调查</h1>
          {isAdmin && (
            <Link
              to="/surveys/create"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />
              创建调查
            </Link>
          )}
        </div>

        {isAdmin && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="flex items-center gap-4 rounded-xl border border-white/5 bg-[#0f0f23] p-5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-500/15">
                  <ClipboardList className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">进行中</p>
                  <p className="text-2xl font-semibold text-white">{activeCount}</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="flex items-center gap-4 rounded-xl border border-white/5 bg-[#0f0f23] p-5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-500/15">
                  <FileCheck className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">已结束</p>
                  <p className="text-2xl font-semibold text-white">{closedCount}</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="flex items-center gap-4 rounded-xl border border-white/5 bg-[#0f0f23] p-5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500/15">
                  <MessageSquare className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">总回复数</p>
                  <p className="text-2xl font-semibold text-white">{totalResponses}</p>
                </div>
              </motion.div>
            </div>

            <div className="mb-6 flex gap-1 rounded-lg bg-[#0f0f23] p-1">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                    filter === tab.key
                      ? "bg-amber-500 text-black"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </>
        )}

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {filteredSurveys.map((survey) => (
            <motion.div
              key={survey.id}
              variants={item}
              className="rounded-xl border border-white/5 bg-[#0f0f23] p-5 transition-colors hover:border-white/10"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-white">{survey.title}</h3>
                {isAdmin && <StatusBadge status={survey.status} />}
              </div>
              <p className="mb-4 line-clamp-2 text-sm text-gray-400">{survey.description}</p>

              <div className="mb-4 flex flex-wrap gap-1.5">
                {survey.tags.map((tag) => (
                  <TagBadge key={tag} tag={tag} />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  {isAdmin && (
                    <span>{survey.responseCount} 条回复</span>
                  )}
                  {!isAdmin && (
                    <span>{survey.questions.length} 道题目</span>
                  )}
                  <span>{formatDate(survey.createdAt)}</span>
                </div>

                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    {survey.status === "draft" && (
                      <button
                        onClick={() => updateSurveyStatus(survey.id, "active")}
                        className="inline-flex items-center gap-1 rounded-md bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/25"
                      >
                        <Play className="h-3 w-3" />
                        激活
                      </button>
                    )}
                    {survey.status === "active" && (
                      <button
                        onClick={() => updateSurveyStatus(survey.id, "closed")}
                        className="inline-flex items-center gap-1 rounded-md bg-gray-500/15 px-2.5 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-500/25"
                      >
                        <Square className="h-3 w-3" />
                        关闭
                      </button>
                    )}
                    {survey.status !== "draft" && (
                      <Link
                        to="/square"
                        className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/25"
                      >
                        <Eye className="h-3 w-3" />
                        查看回复
                      </Link>
                    )}
                  </div>
                ) : (
                  <Link
                    to={`/surveys/${survey.id}`}
                    className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/25"
                  >
                    参与调查
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredSurveys.length === 0 && (
          <div className="py-20 text-center text-gray-500">
            <ClipboardList className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p>暂无调查问卷</p>
          </div>
        )}
      </div>
    </div>
  );
}
