import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, ShieldCheck, CheckCircle, XCircle, Clock, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useStore } from "@/store";
import { formatDate } from "@/utils/format";
import { tagColors } from "@/data/mock";
import type { Submission } from "@/types";

function TagBadge({ tag }: { tag: string }) {
  const color = tagColors[tag] ?? "#6b7280";
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-gray-300">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {tag}
    </span>
  );
}

function HighlightedText({ text, keywords }: { text: string; keywords: string[] }) {
  if (!keywords.length) return <>{text}</>;

  const regex = new RegExp(`(${keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = keywords.some((k) => k.toLowerCase() === part.toLowerCase());
        if (isMatch) {
          return (
            <span key={i} className="bg-yellow-400 text-red-600 font-bold px-0.5 rounded-sm">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function AnswerBlock({ answer, keywords }: { answer: Submission["answers"][number]; keywords: string[] }) {
  if (answer.type === "rating") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">评分</span>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className={`text-sm ${i < (answer.ratingValue ?? 0) ? "text-amber-400" : "text-gray-700"}`}
            >
              ★
            </span>
          ))}
          <span className="ml-1 text-sm font-medium text-amber-400">{answer.ratingValue}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-[#1a1a2e] p-3">
      <p className="text-sm leading-relaxed text-gray-300">
        <HighlightedText text={answer.textValue ?? ""} keywords={keywords} />
      </p>
    </div>
  );
}

export default function Review() {
  const currentUser = useStore((s) => s.currentUser);
  const submissions = useStore((s) => s.submissions);
  const reviewSubmission = useStore((s) => s.reviewSubmission);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a1a]">
        <div className="text-center">
          <ShieldAlert className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h2 className="mb-2 text-xl font-bold text-white">访问受限</h2>
          <p className="text-gray-400">仅管理员可访问内容审核页面</p>
        </div>
      </div>
    );
  }

  const pendingSubmissions = submissions.filter((s) => s.status === "pending_review");
  const reviewedSubmissions = submissions.filter((s) => s.status === "visible" || s.status === "rejected");
  const reviewedCount = submissions.filter((s) => s.status === "visible").length;
  const rejectedCount = submissions.filter((s) => s.status === "rejected").length;

  const handleReview = (id: string, action: "approve" | "reject") => {
    setExitingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      reviewSubmission(id, action);
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 400);
  };

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
        <div className="mb-8 flex items-center gap-3">
          <ShieldAlert className="h-7 w-7 text-amber-500" />
          <h1 className="text-2xl font-bold text-white">内容审核</h1>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="flex items-center gap-4 rounded-xl border border-amber-500/20 bg-[#0f0f23] p-5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500/15">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">待审核</p>
              <p className="text-2xl font-semibold text-amber-400">{pendingSubmissions.length}</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="flex items-center gap-4 rounded-xl border border-white/5 bg-[#0f0f23] p-5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-500/15">
              <Eye className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">已通过</p>
              <p className="text-2xl font-semibold text-white">{reviewedCount}</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="flex items-center gap-4 rounded-xl border border-white/5 bg-[#0f0f23] p-5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-500/15">
              <EyeOff className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">已拒绝</p>
              <p className="text-2xl font-semibold text-white">{rejectedCount}</p>
            </div>
          </motion.div>
        </div>

        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-white">待审核内容</h2>

          {pendingSubmissions.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-[#0f0f23] py-20 text-center">
              <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-green-500 opacity-60" />
              <p className="text-gray-400">暂无待审核内容</p>
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {pendingSubmissions.map((sub) => (
                  <motion.div
                    key={sub.id}
                    variants={item}
                    layout
                    exit={{ opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.35 } }}
                    className="rounded-xl border border-amber-500/30 bg-[#0f0f23] p-5 shadow-lg shadow-amber-500/5"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-semibold text-amber-400">{sub.id}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{formatDate(sub.submittedAt)}</p>
                      </div>
                      {sub.matchedKeywords && sub.matchedKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {sub.matchedKeywords.map((kw) => (
                            <span
                              key={kw}
                              className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mb-4 space-y-3">
                      {sub.answers.map((answer) => (
                        <AnswerBlock
                          key={answer.questionId}
                          answer={answer}
                          keywords={sub.matchedKeywords ?? []}
                        />
                      ))}
                    </div>

                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {sub.tags.map((tag) => (
                        <TagBadge key={tag} tag={tag} />
                      ))}
                    </div>

                    <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                      <button
                        onClick={() => handleReview(sub.id, "approve")}
                        disabled={exitingIds.has(sub.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-500/15 px-4 py-2 text-sm font-medium text-green-400 transition-colors hover:bg-green-500/25 disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        通过
                      </button>
                      <button
                        onClick={() => handleReview(sub.id, "reject")}
                        disabled={exitingIds.has(sub.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-500/15 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        拒绝
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {reviewedSubmissions.length > 0 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">最近审核记录</h2>
            <div className="space-y-3">
              {reviewedSubmissions.map((sub) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl border bg-[#0f0f23] p-4 ${
                    sub.status === "rejected"
                      ? "border-red-500/20"
                      : "border-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {sub.status === "rejected" ? (
                        <XCircle className="h-4 w-4 text-red-400" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      )}
                      <span className="text-sm text-gray-300">{sub.id}</span>
                      <span className="text-xs text-gray-500">{formatDate(sub.submittedAt)}</span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        sub.status === "rejected"
                          ? "bg-red-500/15 text-red-400"
                          : "bg-green-500/15 text-green-400"
                      }`}
                    >
                      {sub.status === "rejected" ? "已拒绝" : "已通过"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {sub.tags.map((tag) => (
                      <TagBadge key={tag} tag={tag} />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
