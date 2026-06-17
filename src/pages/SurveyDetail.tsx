import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Star, ArrowLeft, Send, CheckCircle, Eye } from "lucide-react";
import { useStore } from "@/store";
import { allTags, tagColors } from "@/data/mock";
import { formatDate } from "@/utils/format";
import { hasUserSubmittedSurvey, getUserSubmissionRecord } from "@/utils/anonymousStorage";
import type { Answer } from "@/types";

export default function SurveyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const surveys = useStore((s) => s.surveys);
  const submitFeedback = useStore((s) => s.submitFeedback);
  const survey = surveys.find((s) => s.id === id);

  const hasSubmitted =
    currentUser?.role === "employee" && id
      ? hasUserSubmittedSurvey(currentUser.id, id)
      : false;

  const submissionRecord = currentUser?.role === "employee" && id
    ? getUserSubmissionRecord(currentUser.id, id)
    : undefined;

  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0a0a1a" }}>
        <p className="text-gray-400 text-lg">未找到该问卷</p>
      </div>
    );
  }

  if (hasSubmitted && submissionRecord) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#0a0a1a" }}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate("/surveys")}
            className="flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors mb-6"
          >
            <ArrowLeft size={18} />
            <span>返回问卷列表</span>
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-start gap-3 mb-3">
              <Shield size={24} className="text-amber-400 mt-1 shrink-0" />
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">{survey.title}</h1>
                <p className="text-gray-400 leading-relaxed">{survey.description}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl p-8 mb-8 flex flex-col items-center justify-center text-center"
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">您已匿名提交</h2>
            <p className="text-emerald-300 text-sm mb-4 max-w-md">
              您的意见已成功提交，所有内容完全匿名，管理员无法追溯到您的个人身份。
              如果您有新的想法，可以通过其他调查继续反馈。
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-black/20 px-3 py-1.5 rounded-full">
              <Eye size={14} />
              <span>提交时间：{formatDate(submissionRecord.submittedAt)}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-5"
            style={{ backgroundColor: "#0f0f23", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield size={20} className="text-amber-400" />
              <h3 className="text-white font-medium">匿名性保障说明</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                提交数据与您的账号信息在数据库中完全隔离，没有任何关联字段
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                管理员仅能看到提交的内容和时间，无法查看提交者信息
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                此页面仅为您个人显示"已提交"状态，他人无法看到
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex gap-3"
          >
            <button
              onClick={() => navigate("/square")}
              className="flex-1 py-3 rounded-xl text-white font-semibold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              }}
            >
              <Eye size={18} />
              查看意见广场
            </button>
            <button
              onClick={() => navigate("/surveys")}
              className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 font-semibold text-base flex items-center justify-center gap-2 transition-all hover:bg-white/5"
            >
              返回调查列表
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { questionId, type: "free_text", textValue: value },
    }));
    if (errors[questionId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const handleRatingChange = (questionId: string, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { questionId, type: "rating", ratingValue: value },
    }));
    if (errors[questionId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const q of survey.questions) {
      if (!q.required) continue;
      const answer = answers[q.id];
      if (q.type === "free_text" && !answer?.textValue?.trim()) {
        newErrors[q.id] = "此题为必填项";
      }
      if (q.type === "rating" && !answer?.ratingValue) {
        newErrors[q.id] = "请选择评分";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const answerList = survey.questions.map((q) => {
      const existing = answers[q.id];
      return existing || { questionId: q.id, type: q.type as "free_text" | "rating" };
    });

    const result = submitFeedback({
      surveyId: survey.id,
      answers: answerList,
      tags: selectedTags,
    });

    if (result.flagged) {
      setToast({ message: "您的提交已收到，但因包含敏感内容需人工审核后公开", type: "warning" });
    } else {
      setToast({ message: "提交成功！感谢您的真实反馈", type: "success" });
    }

    setTimeout(() => {
      navigate("/surveys");
    }, 2000);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0a1a" }}>
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

      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/surveys")}
          className="flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          <span>返回问卷列表</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-start gap-3 mb-3">
            <Shield size={24} className="text-amber-400 mt-1 shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{survey.title}</h1>
              <p className="text-gray-400 leading-relaxed">{survey.description}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl p-4 mb-8 flex items-center gap-3"
          style={{ backgroundColor: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)" }}
        >
          <Shield size={18} className="text-emerald-400 shrink-0" />
          <span className="text-emerald-300 text-sm">您的回答完全匿名，无法追溯到个人</span>
        </motion.div>

        <div className="space-y-5">
          {survey.questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.1 }}
              className="rounded-xl p-5"
              style={{ backgroundColor: "#0f0f23", border: errors[question.id] ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="mb-3">
                <span className="text-gray-500 text-xs mr-2">Q{index + 1}</span>
                <span className="text-white font-medium">{question.title}</span>
                {question.required && <span className="text-red-400 ml-1">*</span>}
              </div>
              {question.description && (
                <p className="text-gray-500 text-sm mb-3">{question.description}</p>
              )}

              {question.type === "free_text" && (
                <div>
                  <textarea
                    value={answers[question.id]?.textValue || ""}
                    onChange={(e) => handleTextChange(question.id, e.target.value)}
                    placeholder="请输入您的回答..."
                    rows={4}
                    maxLength={1000}
                    className="w-full rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-shadow"
                    style={{ backgroundColor: "#1a1a2e" }}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors[question.id] && (
                      <span className="text-red-400 text-xs">{errors[question.id]}</span>
                    )}
                    <span className="text-gray-600 text-xs ml-auto">
                      {(answers[question.id]?.textValue || "").length}/1000
                    </span>
                  </div>
                </div>
              )}

              {question.type === "rating" && (
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {Array.from({ length: question.ratingMax || 5 }, (_, i) => i + 1).map((star) => {
                      const current = answers[question.id]?.ratingValue || 0;
                      const filled = star <= current;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(question.id, star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            size={28}
                            className={filled ? "text-amber-400 fill-amber-400" : "text-gray-600"}
                          />
                        </button>
                      );
                    })}
                    {answers[question.id]?.ratingValue && (
                      <span className="text-amber-400 text-sm font-medium ml-2">
                        {answers[question.id].ratingValue}/{question.ratingMax || 5}
                      </span>
                    )}
                  </div>
                  {errors[question.id] && (
                    <span className="text-red-400 text-xs mt-1 block">{errors[question.id]}</span>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + survey.questions.length * 0.1 }}
          className="rounded-xl p-5 mt-5"
          style={{ backgroundColor: "#0f0f23", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-white font-medium mb-3">选择标签</p>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              const color = tagColors[tag] || "#888";
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={{
                    backgroundColor: isSelected ? color : "transparent",
                    color: isSelected ? "#fff" : color,
                    border: `1.5px solid ${color}`,
                    opacity: isSelected ? 1 : 0.7,
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + survey.questions.length * 0.1 }}
          className="mt-8"
        >
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-base flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #f0a500, #d4940a)",
            }}
          >
            <Send size={18} />
            提交反馈
          </button>
        </motion.div>
      </div>
    </div>
  );
}
