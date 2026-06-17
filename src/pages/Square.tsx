import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Search, Star, Send, X } from "lucide-react";
import { useStore } from "@/store";
import { tagColors } from "@/data/mock";
import { formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Square() {
  const submissions = useStore((s) => s.submissions);
  const currentUser = useStore((s) => s.currentUser);
  const replyToSubmission = useStore((s) => s.replyToSubmission);

  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("全部");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

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

  const handleReply = (id: string) => {
    if (!replyText.trim()) return;
    replyToSubmission(id, replyText.trim());
    setReplyText("");
    setReplyingId(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] px-4 py-8 text-gray-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <MessageSquare className="h-7 w-7 text-amber-500" />
          <h1 className="text-2xl font-bold text-white">意见广场</h1>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索提交内容..."
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
                  {visibleSubmissions.length}
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
                      {tagCounts[tag]}
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
          </div>
        </div>
      </div>
    </div>
  );
}
