import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Search, Star, Send, X, Layers, ChevronDown, ChevronUp, Tags, CheckCircle, Clock } from "lucide-react";
import { useStore } from "@/store";
import { tagColors } from "@/data/mock";
import { formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { Submission, AuditLogEntry } from "@/types";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const actionLabels: Record<AuditLogEntry["action"], string> = {
  submitted: "匿名提交",
  approved: "审核通过",
  rejected: "审核拒绝",
  replied: "官方回复",
};

const actionColors: Record<AuditLogEntry["action"], string> = {
  submitted: "#6b7280",
  approved: "#22c55e",
  rejected: "#ef4444",
  replied: "#f59e0b",
};

function AuditTimeline({ auditLog }: { auditLog: AuditLogEntry[] }) {
  const [expanded, setExpanded] = useState(false);

  if (auditLog.length <= 1) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-gray-300"
      >
        <Clock className="h-3 w-3" />
        操作记录 ({auditLog.length})
        {expanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 overflow-hidden"
          >
            <div className="relative pl-4">
              <div className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-white/10" />
              <div className="space-y-2">
                {auditLog.map((entry, i) => {
                  const color = actionColors[entry.action];
                  const isLast = i === auditLog.length - 1;
                  return (
                    <div key={i} className="relative flex items-start gap-2">
                      <span
                        className="absolute -left-4 top-1 h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: color, ...(isLast ? { boxShadow: `0 0 4px ${color}40` } : {}) }}
                      />
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium" style={{ color }}>
                          {actionLabels[entry.action]}
                        </span>
                        <span className="text-gray-500">
                          {formatDate(entry.timestamp)}
                        </span>
                        {entry.detail && (
                          <span className="text-gray-600">
                            · {entry.detail}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type ViewMode = "all" | "topics";

export default function Square() {
  const submissions = useStore((s) => s.submissions);
  const currentUser = useStore((s) => s.currentUser);
  const replyToSubmission = useStore((s) => s.replyToSubmission);
  const computeThemeTopics = useStore((s) => s.computeThemeTopics);

  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("全部");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === "admin";

  const visibleSubmissions = useMemo(
    () => submissions.filter((s) => s.status === "visible"),
    [submissions]
  );

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    visibleSubmissions.forEach((s) => {
      s.tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [visibleSubmissions]);

  const availableTags = useMemo(
    () => Object.keys(tagCounts).sort(),
    [tagCounts]
  );

  const filtered = useMemo(() => {
    let result = visibleSubmissions;
    if (selectedTag !== "全部") {
      result = result.filter((s) => s.tags.includes(selectedTag));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((s) =>
        s.answers.some(
          (a) => a.type === "free_text" && a.textValue?.toLowerCase().includes(q)
        )
      );
    }
    return result;
  }, [visibleSubmissions, selectedTag, search]);

  const topics = useMemo(() => computeThemeTopics(), [computeThemeTopics]);

  const filteredTopics = useMemo(() => {
    let result = topics;
    if (selectedTag !== "全部") {
      result = result.filter((t) => t.tag === selectedTag);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((t) => {
        const keywordMatch = t.keywordGroup.some((kw) => kw.toLowerCase().includes(q));
        const submissionMatch = t.relatedSubmissionIds.some((id) => {
          const sub = visibleSubmissions.find((s) => s.id === id);
          return sub?.answers.some(
            (a) => a.type === "free_text" && a.textValue?.toLowerCase().includes(q)
          );
        });
        return keywordMatch || submissionMatch;
      });
    }
    return result;
  }, [topics, selectedTag, search, visibleSubmissions]);

  const handleReply = (id: string) => {
    if (!replyText.trim()) return;
    replyToSubmission(id, replyText.trim());
    setReplyText("");
    setReplyingId(null);
  };

  const getSubmissionById = (id: string) => visibleSubmissions.find((s) => s.id === id);

  const getFirstAnswerText = (sub: Submission) => {
    const freeTextAnswer = sub.answers.find(
      (a) => a.type === "free_text" && a.textValue
    );
    return freeTextAnswer?.textValue || "";
  };

  const getRatingAnswer = (sub: Submission) => {
    return sub.answers.find((a) => a.type === "rating" && a.ratingValue != null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] px-4 py-8 text-gray-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <MessageSquare className="h-7 w-7 text-amber-500" />
          <h1 className="text-2xl font-bold text-white">意见广场</h1>
        </div>

        <div className="mb-6 inline-flex rounded-xl bg-[#0f0f23] p-1 border border-white/5">
          <button
            onClick={() => setViewMode("all")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              viewMode === "all"
                ? "bg-amber-500 text-black"
                : "text-gray-400 hover:text-white"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            全部意见
          </button>
          <button
            onClick={() => setViewMode("topics")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              viewMode === "topics"
                ? "bg-amber-500 text-black"
                : "text-gray-400 hover:text-white"
            )}
          >
            <Layers className="h-4 w-4" />
            主题聚合
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={viewMode === "all" ? "搜索提交内容..." : "搜索关键词或提交内容..."}
            className="w-full rounded-xl border border-white/5 bg-[#1a1a2e] py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/30"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-6">
          <aside className="hidden w-48 shrink-0 md:block">
            <div className="sticky top-8 space-y-1">
              <button
                onClick={() => setSelectedTag("全部")}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  selectedTag === "全部"
                    ? "bg-amber-500/15 text-amber-400"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <span>全部</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    selectedTag === "全部"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-white/5 text-gray-500"
                  )}
                >
                  {viewMode === "all" ? visibleSubmissions.length : topics.length}
                </span>
              </button>
              {availableTags.map((tag) => {
                const color = tagColors[tag] ?? "#6b7280";
                const isActive = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-amber-500/15 text-amber-400"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {tag}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        isActive
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-white/5 text-gray-500"
                      )}
                    >
                      {viewMode === "all" ? tagCounts[tag] : topics.filter(t => t.tag === tag).length}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="flex-1 md:hidden mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedTag("全部")}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedTag === "全部"
                    ? "bg-amber-500 text-black"
                    : "bg-white/5 text-gray-400"
                )}
              >
                全部
              </button>
              {availableTags.map((tag) => {
                const color = tagColors[tag] ?? "#6b7280";
                const isActive = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: isActive ? color : "rgba(255,255,255,0.05)",
                      color: isActive ? "#fff" : color,
                      border: `1px solid ${isActive ? color : "transparent"}`,
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              {viewMode === "all" ? (
                <motion.div
                  key="all-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AnimatePresence mode="wait">
                    {filtered.length === 0 ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-20 text-center"
                      >
                        <MessageSquare className="mx-auto mb-3 h-10 w-10 text-gray-600 opacity-40" />
                        <p className="text-gray-500">暂无匹配的意见</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="list"
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="space-y-4"
                      >
                        {filtered.map((submission) => {
                          const firstTagColor =
                            tagColors[submission.tags[0]] ?? "#6b7280";
                          const survey = useStore
                            .getState()
                            .surveys.find((s) => s.id === submission.surveyId);

                          return (
                            <motion.div
                              key={submission.id}
                              variants={cardVariant}
                              className="rounded-xl border border-white/5 bg-[#0f0f23] overflow-hidden transition-colors hover:border-white/10"
                              style={{ borderLeftWidth: 3, borderLeftColor: firstTagColor }}
                            >
                              <div className="p-5">
                                <div className="mb-3 flex flex-wrap gap-1.5">
                                  {submission.tags.map((tag) => {
                                    const color = tagColors[tag] ?? "#6b7280";
                                    return (
                                      <span
                                        key={tag}
                                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                                        style={{
                                          backgroundColor: `${color}18`,
                                          color,
                                          border: `1px solid ${color}30`,
                                        }}
                                      >
                                        <span
                                          className="h-1.5 w-1.5 rounded-full"
                                          style={{ backgroundColor: color }}
                                        />
                                        {tag}
                                      </span>
                                    );
                                  })}
                                </div>

                                <div className="space-y-3">
                                  {submission.answers.map((answer, i) => {
                                    const question = survey?.questions.find(
                                      (q) => q.id === answer.questionId
                                    );

                                    if (answer.type === "free_text" && answer.textValue) {
                                      return (
                                        <div key={answer.questionId}>
                                          {question && (
                                            <p className="text-xs text-gray-500 mb-1">
                                              Q{i + 1}. {question.title}
                                            </p>
                                          )}
                                          <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">
                                            {answer.textValue}
                                          </p>
                                        </div>
                                      );
                                    }

                                    if (answer.type === "rating" && answer.ratingValue != null) {
                                      const max = question?.ratingMax || 5;
                                      return (
                                        <div key={answer.questionId}>
                                          {question && (
                                            <p className="text-xs text-gray-500 mb-1">
                                              Q{i + 1}. {question.title}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-0.5">
                                            {Array.from({ length: max }, (_, si) => (
                                              <Star
                                                key={si}
                                                className={cn(
                                                  "h-4 w-4",
                                                  si < answer.ratingValue!
                                                    ? "text-amber-400 fill-amber-400"
                                                    : "text-gray-600"
                                                )}
                                              />
                                            ))}
                                            <span className="ml-2 text-xs text-amber-400 font-medium">
                                              {answer.ratingValue}/{max}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    }

                                    return null;
                                  })}
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    {formatDate(submission.submittedAt)}
                                  </span>
                                  {isAdmin && !submission.adminReply && (
                                    <button
                                      onClick={() =>
                                        setReplyingId(
                                          replyingId === submission.id
                                            ? null
                                            : submission.id
                                        )
                                      }
                                      className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/25"
                                    >
                                      <MessageSquare className="h-3 w-3" />
                                      回复
                                    </button>
                                  )}
                                </div>

                                {submission.adminReply && (
                                  <div
                                    className="mt-4 rounded-lg p-4"
                                    style={{
                                      backgroundColor: "rgba(240,165,0,0.05)",
                                      borderLeft: "3px solid #f0a500",
                                    }}
                                  >
                                    <div className="mb-2 flex items-center gap-2">
                                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                                        官方回复
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {formatDate(submission.repliedAt!)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                      {submission.adminReply}
                                    </p>
                                  </div>
                                )}

                                <AuditTimeline auditLog={submission.auditLog} />

                                {replyingId === submission.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4"
                                  >
                                    <textarea
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      placeholder="输入回复内容..."
                                      rows={3}
                                      className="w-full rounded-lg border border-white/5 bg-[#1a1a2e] px-4 py-3 text-sm text-white placeholder-gray-500 resize-none outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/30"
                                    />
                                    <div className="mt-2 flex justify-end gap-2">
                                      <button
                                        onClick={() => {
                                          setReplyingId(null);
                                          setReplyText("");
                                        }}
                                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-white/5"
                                      >
                                        取消
                                      </button>
                                      <button
                                        onClick={() => handleReply(submission.id)}
                                        disabled={!replyText.trim()}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
                                      >
                                        <Send className="h-3 w-3" />
                                        提交回复
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div
                  key="topics-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AnimatePresence mode="wait">
                    {filteredTopics.length === 0 ? (
                      <motion.div
                        key="empty-topics"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-20 text-center"
                      >
                        <Tags className="mx-auto mb-3 h-10 w-10 text-gray-600 opacity-40" />
                        <p className="text-gray-500">暂无匹配的主题</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="topics-grid"
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                      >
                        {filteredTopics.map((topic) => {
                          const color = tagColors[topic.tag] ?? "#6b7280";
                          const isExpanded = expandedTopicId === topic.id;
                          const relatedSubmissions = topic.relatedSubmissionIds
                            .map(getSubmissionById)
                            .filter(Boolean) as Submission[];

                          return (
                            <motion.div
                              key={topic.id}
                              variants={cardVariant}
                              className="rounded-xl border border-white/5 bg-[#0f0f23] overflow-hidden transition-colors hover:border-white/10"
                              style={{ borderLeftWidth: 3, borderLeftColor: color }}
                            >
                              <div className="p-5">
                                <div className="mb-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-2.5 w-2.5 rounded-full"
                                      style={{ backgroundColor: color }}
                                    />
                                    <h3 className="text-base font-semibold text-white">
                                      {topic.tag}
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    <span>
                                      {topic.count} 条意见 · {topic.replyCount} 条已回复
                                    </span>
                                  </div>
                                </div>

                                <div className="mb-4 flex flex-wrap gap-1.5">
                                  {topic.keywordGroup.map((kw) => (
                                    <span
                                      key={kw}
                                      className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-gray-400 border border-white/5"
                                    >
                                      {kw}
                                    </span>
                                  ))}
                                </div>

                                <button
                                  onClick={() =>
                                    setExpandedTopicId(isExpanded ? null : topic.id)
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/25"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-3.5 w-3.5" />
                                      收起详情
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3.5 w-3.5" />
                                      查看详情
                                    </>
                                  )}
                                </button>

                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="mt-4 pt-4 border-t border-white/5"
                                    >
                                      <div className="space-y-3">
                                        {relatedSubmissions.map((sub) => {
                                          const firstText = getFirstAnswerText(sub);
                                          const ratingAnswer = getRatingAnswer(sub);
                                          const hasReply = !!sub.adminReply;

                                          return (
                                            <motion.div
                                              key={sub.id}
                                              initial={{ opacity: 0, y: 10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              className="rounded-lg bg-[#1a1a2e] p-4"
                                            >
                                              <div className="mb-2 flex items-start justify-between gap-3">
                                                <p className="text-sm text-gray-300 line-clamp-2 flex-1">
                                                  {firstText || "无文本内容"}
                                                </p>
                                                {hasReply ? (
                                                  <span className="inline-flex items-center gap-1 shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
                                                    <CheckCircle className="h-3 w-3" />
                                                    已回复
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 shrink-0 rounded-md bg-white/5 px-2 py-0.5 text-xs font-medium text-gray-400">
                                                    <Clock className="h-3 w-3" />
                                                    待回复
                                                  </span>
                                                )}
                                              </div>

                                              {ratingAnswer && ratingAnswer.ratingValue != null && (
                                                <div className="mb-2 flex items-center gap-0.5">
                                                  {Array.from({ length: 5 }, (_, si) => (
                                                    <Star
                                                      key={si}
                                                      className={cn(
                                                        "h-3.5 w-3.5",
                                                        si < ratingAnswer.ratingValue!
                                                          ? "text-amber-400 fill-amber-400"
                                                          : "text-gray-600"
                                                      )}
                                                    />
                                                  ))}
                                                </div>
                                              )}

                                              <div className="mb-3 flex flex-wrap gap-1">
                                                {sub.tags.map((tag) => {
                                                  const tagColor = tagColors[tag] ?? "#6b7280";
                                                  return (
                                                    <span
                                                      key={tag}
                                                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                                      style={{
                                                        backgroundColor: `${tagColor}18`,
                                                        color: tagColor,
                                                      }}
                                                    >
                                                      {tag}
                                                    </span>
                                                  );
                                                })}
                                              </div>

                                              {sub.adminReply && (
                                                <div
                                                  className="mb-3 rounded-md p-3"
                                                  style={{
                                                    backgroundColor: "rgba(240,165,0,0.05)",
                                                    borderLeft: "2px solid #f0a500",
                                                  }}
                                                >
                                                  <p className="text-xs text-gray-400 mb-1">
                                                    官方回复
                                                  </p>
                                                  <p className="text-sm text-gray-300 line-clamp-2">
                                                    {sub.adminReply}
                                                  </p>
                                                </div>
                                              )}

                                              <AuditTimeline auditLog={sub.auditLog} />

                                              {isAdmin && !sub.adminReply && (
                                                <div>
                                                  {replyingId === sub.id ? (
                                                    <div>
                                                      <textarea
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        placeholder="输入回复内容..."
                                                        rows={2}
                                                        className="w-full rounded-lg border border-white/5 bg-[#0f0f23] px-3 py-2 text-sm text-white placeholder-gray-500 resize-none outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/30"
                                                      />
                                                      <div className="mt-2 flex justify-end gap-2">
                                                        <button
                                                          onClick={() => {
                                                            setReplyingId(null);
                                                            setReplyText("");
                                                          }}
                                                          className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-white/5"
                                                        >
                                                          取消
                                                        </button>
                                                        <button
                                                          onClick={() => handleReply(sub.id)}
                                                          disabled={!replyText.trim()}
                                                          className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2.5 py-1 text-xs font-medium text-black transition-colors hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                          <Send className="h-3 w-3" />
                                                          回复
                                                        </button>
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <button
                                                      onClick={() =>
                                                        setReplyingId(
                                                          replyingId === sub.id ? null : sub.id
                                                        )
                                                      }
                                                      className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/25"
                                                    >
                                                      <MessageSquare className="h-3 w-3" />
                                                      回复
                                                    </button>
                                                  )}
                                                </div>
                                              )}
                                            </motion.div>
                                          );
                                        })}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
