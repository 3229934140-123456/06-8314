import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  User,
  Survey,
  Submission,
  Question,
  SentReport,
  QuarterlyReport,
  ThemeTopic,
  AuditLogEntry,
} from "@/types";
import { mockUsers, mockSurveys, mockSubmissions, allTags } from "@/data/mock";
import { filterText } from "@/utils/keywordFilter";
import { generateId } from "@/utils/format";
import { markSurveySubmittedWithTime } from "@/utils/anonymousStorage";

interface PersistState {
  surveys: Survey[];
  submissions: Submission[];
  sentReports: SentReport[];
}

interface AppState extends PersistState {
  currentUser: User | null;

  login: (username: string, password: string) => boolean;
  logout: () => void;

  addSurvey: (data: {
    title: string;
    description: string;
    questions: Omit<Question, "id">[];
    tags: string[];
  }) => string;
  updateSurveyStatus: (id: string, status: Survey["status"]) => void;

  submitFeedback: (data: {
    surveyId: string;
    answers: Submission["answers"];
    tags: string[];
  }) => { success: boolean; flagged: boolean; matchedKeywords: string[] };

  reviewSubmission: (id: string, action: "approve" | "reject", reason?: string) => void;
  replyToSubmission: (id: string, reply: string) => void;

  generateQuarterlyReport: (year: number, quarter: number) => QuarterlyReport;
  sendReport: (data: {
    year: number;
    quarter: number;
    recipients: { name: string; email: string }[];
  }) => SentReport;

  computeThemeTopics: () => ThemeTopic[];

  resetToDemoData: () => void;
}

function getInitialDemoData(): PersistState {
  return {
    surveys: JSON.parse(JSON.stringify(mockSurveys)),
    submissions: JSON.parse(JSON.stringify(mockSubmissions)),
    sentReports: [],
  };
}

function getQuarterDateRange(year: number, quarter: number): { start: Date; end: Date } {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
  return { start, end };
}

function getQuarterMonths(quarter: number): string[] {
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  const startMonth = (quarter - 1) * 3;
  return [monthNames[startMonth], monthNames[startMonth + 1], monthNames[startMonth + 2]];
}

function keywordSimilarity(text: string, keywords: string[]): number {
  let matches = 0;
  for (const kw of keywords) {
    if (text.toLowerCase().includes(kw.toLowerCase())) {
      matches++;
    }
  }
  return matches;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...getInitialDemoData(),
      currentUser: null,

      login: (username: string, _password: string) => {
        const user = mockUsers.find((u) => u.username === username);
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ currentUser: null });
      },

      addSurvey: (data) => {
        const id = "s" + generateId();
        const questions: Question[] = data.questions.map((q, i) => ({
          ...q,
          id: "q" + generateId() + i,
        }));
        const survey: Survey = {
          id,
          title: data.title,
          description: data.description,
          status: "draft",
          createdAt: new Date().toISOString(),
          questions,
          responseCount: 0,
          tags: data.tags,
        };
        set((state) => ({ surveys: [...state.surveys, survey] }));
        return id;
      },

      updateSurveyStatus: (id, status) => {
        set((state) => ({
          surveys: state.surveys.map((s) =>
            s.id === id
              ? { ...s, status, closedAt: status === "closed" ? new Date().toISOString() : s.closedAt }
              : s
          ),
        }));
      },

      submitFeedback: (data) => {
        let flagged = false;
        let matchedKeywords: string[] = [];

        for (const answer of data.answers) {
          if (answer.type === "free_text" && answer.textValue) {
            const result = filterText(answer.textValue);
            if (!result.passed) {
              flagged = true;
              matchedKeywords = [...matchedKeywords, ...result.matchedKeywords];
            }
          }
        }

        matchedKeywords = [...new Set(matchedKeywords)];

        const submission: Submission = {
          id: "sub" + generateId(),
          surveyId: data.surveyId,
          answers: data.answers,
          tags: data.tags,
          submittedAt: new Date().toISOString(),
          status: flagged ? "pending_review" : "visible",
          matchedKeywords: flagged ? matchedKeywords : undefined,
          auditLog: [{ action: "submitted", timestamp: new Date().toISOString() }],
        };

        const currentUser = get().currentUser;
        if (currentUser && currentUser.role === "employee") {
          markSurveySubmittedWithTime(currentUser.id, data.surveyId);
        }

        set((state) => ({
          submissions: [...state.submissions, submission],
          surveys: state.surveys.map((s) =>
            s.id === data.surveyId ? { ...s, responseCount: s.responseCount + 1 } : s
          ),
        }));

        return { success: true, flagged, matchedKeywords };
      },

      reviewSubmission: (id, action, _reason) => {
        const now = new Date().toISOString();
        const entry: AuditLogEntry = {
          action: action === "approve" ? "approved" : "rejected",
          timestamp: now,
          detail: action === "approve" ? "审核通过，已公开到意见广场" : "审核拒绝，内容已永久屏蔽",
        };
        set((state) => ({
          submissions: state.submissions.map((sub) =>
            sub.id === id
              ? {
                  ...sub,
                  status: action === "approve" ? "visible" : "rejected",
                  matchedKeywords: undefined,
                  auditLog: [...(sub.auditLog || []), entry],
                }
              : sub
          ),
        }));
      },

      replyToSubmission: (id, reply) => {
        const now = new Date().toISOString();
        const entry: AuditLogEntry = {
          action: "replied",
          timestamp: now,
          detail: "管理员公开回复",
        };
        set((state) => ({
          submissions: state.submissions.map((sub) =>
            sub.id === id
              ? {
                  ...sub,
                  adminReply: reply,
                  repliedAt: now,
                  auditLog: [...(sub.auditLog || []), entry],
                }
              : sub
          ),
        }));
      },

      generateQuarterlyReport: (year: number, quarter: number): QuarterlyReport => {
        const { start, end } = getQuarterDateRange(year, quarter);
        const submissions = get().submissions.filter((sub) => {
          const d = new Date(sub.submittedAt);
          return d >= start && d <= end;
        });

        const totalSubmissions = submissions.length;
        const reviewedSubmissions = submissions.filter((s) => s.status === "visible").length;
        const rejectedSubmissions = submissions.filter((s) => s.status === "rejected").length;
        const pendingReviewSubmissions = submissions.filter((s) => s.status === "pending_review").length;

        const categoryBreakdownMap: Record<string, number> = {};
        for (const sub of submissions) {
          for (const tag of sub.tags) {
            categoryBreakdownMap[tag] = (categoryBreakdownMap[tag] || 0) + 1;
          }
        }
        const categoryBreakdown = Object.entries(categoryBreakdownMap)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count);

        const months = getQuarterMonths(quarter);
        const startMonth = (quarter - 1) * 3;
        const monthlyTrend = months.map((month, i) => {
          const monthStart = new Date(year, startMonth + i, 1);
          const monthEnd = new Date(year, startMonth + i + 1, 0, 23, 59, 59, 999);
          const monthSubs = submissions.filter((sub) => {
            const d = new Date(sub.submittedAt);
            return d >= monthStart && d <= monthEnd;
          });

          const byTag: Record<string, number> = {};
          for (const sub of monthSubs) {
            for (const tag of sub.tags) {
              byTag[tag] = (byTag[tag] || 0) + 1;
            }
          }

          return { month, count: monthSubs.length, byTag };
        });

        const totalTags = categoryBreakdown.reduce((acc, item) => acc + item.count, 0);
        const topTags = categoryBreakdown.map((item) => ({
          ...item,
          percentage: totalTags > 0 ? Math.round((item.count / totalTags) * 100) : 0,
        }));

        return {
          quarter: `${year} Q${quarter}`,
          totalSubmissions,
          reviewedSubmissions,
          rejectedSubmissions,
          pendingReviewSubmissions,
          categoryBreakdown,
          monthlyTrend,
          topTags,
        };
      },

      sendReport: (data) => {
        const reportData = get().generateQuarterlyReport(data.year, data.quarter);
        const currentUser = get().currentUser;

        const sentReport: SentReport = {
          id: "rep" + generateId(),
          quarter: `Q${data.quarter}`,
          year: data.year,
          sentAt: new Date().toISOString(),
          sentBy: currentUser?.displayName || "未知",
          recipients: data.recipients,
          reportData,
          status: "sent",
        };

        set((state) => ({
          sentReports: [sentReport, ...state.sentReports],
        }));

        return sentReport;
      },

      computeThemeTopics: (): ThemeTopic[] => {
        const visibleSubs = get().submissions.filter((s) => s.status === "visible");
        const topics: ThemeTopic[] = [];

        const keywordGroups: Record<string, string[]> = {
          "管理": ["管理", "领导", "决策", "战略", "方向", "目标", "规划"],
          "沟通": ["沟通", "会议", "信息", "透明", "交流", "反馈", "邮件"],
          "工作环境": ["环境", "办公", "座位", "装修", "空气", "噪音", "设备"],
          "福利": ["福利", "假期", "年假", "体检", "保险", "补贴", "福利"],
          "薪酬": ["薪资", "工资", "奖金", "加薪", "绩效", "薪酬", "期权"],
          "文化": ["文化", "氛围", "创新", "容错", "包容", "价值观", "使命"],
          "领导力": ["领导力", "上级", "主管", "经理", "信任", "支持", "培养"],
          "设施": ["设备", "电脑", "显示器", "键盘", "网络", "会议室", "茶水间"],
        };

        for (const tag of allTags) {
          const tagSubs = visibleSubs.filter((s) => s.tags.includes(tag));
          if (tagSubs.length === 0) continue;

          const keywords = keywordGroups[tag] || [];

          const clusters: Map<string, { ids: string[]; count: number; keywords: string[] }> = new Map();
          clusters.set(tag, { ids: [], count: 0, keywords: keywords.slice(0, 3) });

          for (const sub of tagSubs) {
            const freeText = sub.answers
              .filter((a) => a.type === "free_text" && a.textValue)
              .map((a) => a.textValue)
              .join(" ");

            const sim = keywordSimilarity(freeText, keywords);
            const cluster = clusters.get(tag)!;
            cluster.ids.push(sub.id);
            cluster.count++;
            if (sim > 0) {
              for (const kw of keywords) {
                if (freeText.toLowerCase().includes(kw.toLowerCase()) && !cluster.keywords.includes(kw)) {
                  cluster.keywords.push(kw);
                }
              }
            }
          }

          for (const [_keywordGroup, cluster] of clusters.entries()) {
            if (cluster.count > 0) {
              const replyCount = cluster.ids.filter((id) => {
                const sub = visibleSubs.find((s) => s.id === id);
                return sub?.adminReply;
              }).length;

              topics.push({
                id: "topic" + generateId() + tag,
                tag,
                keywordGroup: cluster.keywords.slice(0, 5),
                relatedSubmissionIds: cluster.ids,
                count: cluster.count,
                replyCount,
              });
            }
          }
        }

        return topics.sort((a, b) => b.count - a.count);
      },

      resetToDemoData: () => {
        const demo = getInitialDemoData();
        set({
          surveys: demo.surveys,
          submissions: demo.submissions,
          sentReports: demo.sentReports,
        });
      },
    }),
    {
      name: "anonymous-feedback-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        surveys: state.surveys,
        submissions: state.submissions,
        sentReports: state.sentReports,
      }),
    }
  )
);
