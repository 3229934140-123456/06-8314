import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import { useStore } from "@/store";
import { allTags, tagColors } from "@/data/mock";
import { cn } from "@/lib/utils";
import type { QuestionType } from "@/types";

interface QuestionForm {
  type: QuestionType;
  title: string;
  required: boolean;
  ratingMax: number;
}

function createEmptyQuestion(): QuestionForm {
  return { type: "free_text", title: "", required: false, ratingMax: 5 };
}

export default function CreateSurvey() {
  const navigate = useNavigate();
  const addSurvey = useStore((s) => s.addSurvey);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionForm[]>([createEmptyQuestion()]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ title?: string; questions?: string }>({});

  function handleAddQuestion() {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  }

  function handleRemoveQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleQuestionChange(index: number, field: keyof QuestionForm, value: string | number | boolean) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  }

  function handleToggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = "请输入调查标题";
    }

    const validQuestions = questions.filter((q) => q.title.trim());
    if (validQuestions.length === 0) {
      newErrors.questions = "至少需要一道题目";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    addSurvey({
      title: title.trim(),
      description: description.trim(),
      questions: validQuestions.map((q) => ({
        type: q.type,
        title: q.title.trim(),
        required: q.required,
        ...(q.type === "rating" ? { ratingMax: q.ratingMax } : {}),
      })),
      tags: selectedTags,
    });

    navigate("/surveys");
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] px-4 py-8 text-gray-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-4">
          <Link
            to="/surveys"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition-colors hover:border-white/20 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold text-white">创建调查</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-white/5 bg-[#0f0f23] p-6">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  调查标题 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="输入调查标题"
                  className={cn(
                    "w-full rounded-lg border bg-[#1a1a2e] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-amber-500",
                    errors.title ? "border-red-500" : "border-white/10"
                  )}
                />
                {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  调查描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="输入调查描述"
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-[#1a1a2e] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#0f0f23] p-6">
            <div className="mb-4 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                题目 <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/25"
              >
                <Plus className="h-3.5 w-3.5" />
                添加题目
              </button>
            </div>

            {errors.questions && (
              <p className="mb-3 text-xs text-red-400">{errors.questions}</p>
            )}

            <motion.div layout className="space-y-4">
              {questions.map((q, index) => (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="rounded-lg border border-white/5 bg-[#1a1a2e] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">题目 {index + 1}</span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(index)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-red-500/15 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <select
                        value={q.type}
                        onChange={(e) => handleQuestionChange(index, "type", e.target.value)}
                        className="rounded-lg border border-white/10 bg-[#0f0f23] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                      >
                        <option value="free_text">文本题</option>
                        <option value="rating">评分题</option>
                      </select>
                      <input
                        type="text"
                        value={q.title}
                        onChange={(e) => handleQuestionChange(index, "title", e.target.value)}
                        placeholder="输入题目内容"
                        className="flex-1 rounded-lg border border-white/10 bg-[#0f0f23] px-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-amber-500"
                      />
                    </div>

                    {q.type === "rating" && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">最高分</span>
                        <select
                          value={q.ratingMax}
                          onChange={(e) => handleQuestionChange(index, "ratingMax", Number(e.target.value))}
                          className="rounded-lg border border-white/10 bg-[#0f0f23] px-3 py-1.5 text-sm text-white outline-none focus:border-amber-500"
                        >
                          {[5, 7, 10].map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => handleQuestionChange(index, "required", e.target.checked)}
                        className="h-4 w-4 rounded border-white/20 bg-[#0f0f23] text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                      />
                      <span className="text-xs text-gray-400">必填</span>
                    </label>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#0f0f23] p-6">
            <label className="mb-3 block text-sm font-medium text-gray-300">标签</label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                const color = tagColors[tag] ?? "#6b7280";
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      isSelected
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-white/5 bg-white/[0.03] text-gray-400 hover:border-white/10 hover:text-gray-300"
                    )}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: isSelected ? color : "#6b7280" }}
                    />
                    {tag}
                    {isSelected && <X className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link
              to="/surveys"
              className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:border-white/20 hover:text-white"
            >
              取消
            </Link>
            <button
              type="submit"
              className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-amber-400"
            >
              创建调查
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
