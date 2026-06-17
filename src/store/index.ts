import { create } from "zustand";
import type { User, Survey, Submission, Question } from "@/types";
import { mockUsers, mockSurveys, mockSubmissions } from "@/data/mock";
import { filterText } from "@/utils/keywordFilter";
import { generateId } from "@/utils/format";

interface AppState {
  currentUser: User | null;
  surveys: Survey[];
  submissions: Submission[];

  login: (username: string, password: string) => boolean;
  logout: () => void;

  addSurvey: (data: { title: string; description: string; questions: Omit<Question, "id">[]; tags: string[] }) => string;
  updateSurveyStatus: (id: string, status: Survey["status"]) => void;

  submitFeedback: (data: { surveyId: string; answers: Submission["answers"]; tags: string[] }) => { success: boolean; flagged: boolean; matchedKeywords: string[] };

  reviewSubmission: (id: string, action: "approve" | "reject", reason?: string) => void;
  replyToSubmission: (id: string, reply: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  surveys: [...mockSurveys],
  submissions: [...mockSubmissions],

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
        s.id === id ? { ...s, status, closedAt: status === "closed" ? new Date().toISOString() : s.closedAt } : s
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
    };

    set((state) => ({
      submissions: [...state.submissions, submission],
      surveys: state.surveys.map((s) =>
        s.id === data.surveyId ? { ...s, responseCount: s.responseCount + 1 } : s
      ),
    }));

    return { success: true, flagged, matchedKeywords };
  },

  reviewSubmission: (id, action, _reason) => {
    set((state) => ({
      submissions: state.submissions.map((sub) =>
        sub.id === id ? { ...sub, status: action === "approve" ? "visible" : "rejected", matchedKeywords: undefined } : sub
      ),
    }));
  },

  replyToSubmission: (id, reply) => {
    set((state) => ({
      submissions: state.submissions.map((sub) =>
        sub.id === id ? { ...sub, adminReply: reply, repliedAt: new Date().toISOString() } : sub
      ),
    }));
  },
}));
