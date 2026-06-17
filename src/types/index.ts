export type UserRole = "admin" | "employee";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
}

export type QuestionType = "free_text" | "rating";

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  ratingMax?: number;
}

export type SurveyStatus = "draft" | "active" | "closed";

export interface Survey {
  id: string;
  title: string;
  description: string;
  status: SurveyStatus;
  createdAt: string;
  closedAt?: string;
  questions: Question[];
  responseCount: number;
  tags: string[];
}

export type SubmissionStatus = "visible" | "pending_review" | "rejected";

export interface Answer {
  questionId: string;
  type: QuestionType;
  textValue?: string;
  ratingValue?: number;
}

export interface Submission {
  id: string;
  surveyId: string;
  answers: Answer[];
  tags: string[];
  submittedAt: string;
  status: SubmissionStatus;
  adminReply?: string;
  repliedAt?: string;
  matchedKeywords?: string[];
  auditLog: AuditLogEntry[];
}

export interface AuditLogEntry {
  action: "submitted" | "approved" | "rejected" | "replied";
  timestamp: string;
  detail?: string;
}

export interface BlockedKeyword {
  id: string;
  keyword: string;
  category: string;
}

export interface QuarterlyReport {
  quarter: string;
  totalSubmissions: number;
  reviewedSubmissions: number;
  rejectedSubmissions: number;
  pendingReviewSubmissions: number;
  categoryBreakdown: { tag: string; count: number }[];
  monthlyTrend: { month: string; count: number; byTag: Record<string, number> }[];
  topTags: { tag: string; count: number; percentage: number }[];
}

export interface EmployeeSubmissionRecord {
  id: string;
  employeeId: string;
  surveyId: string;
  submittedAt: string;
}

export interface ReportRecipient {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface SentReport {
  id: string;
  quarter: string;
  year: number;
  sentAt: string;
  sentBy: string;
  recipients: { name: string; email: string }[];
  reportData: QuarterlyReport;
  status: "sent" | "failed";
}

export interface ThemeTopic {
  id: string;
  tag: string;
  keywordGroup: string[];
  relatedSubmissionIds: string[];
  count: number;
  replyCount: number;
}
