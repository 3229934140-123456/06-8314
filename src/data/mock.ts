import type { User, Survey, Submission, Question } from "@/types";

export const mockUsers: User[] = [
  { id: "u1", username: "admin", role: "admin", displayName: "HR 管理员" },
  { id: "u2", username: "employee1", role: "employee", displayName: "张三" },
  { id: "u3", username: "employee2", role: "employee", displayName: "李四" },
  { id: "u4", username: "employee3", role: "employee", displayName: "王五" },
];

const q1: Question[] = [
  { id: "q1", type: "free_text", title: "您对公司当前管理方式有什么建议？", description: "请畅所欲言，您的回答完全匿名", required: true },
  { id: "q2", type: "rating", title: "您对团队沟通效率的满意度", required: true, ratingMax: 5 },
  { id: "q3", type: "free_text", title: "您认为最需要改善的工作环节是什么？", required: false },
];

const q2: Question[] = [
  { id: "q4", type: "rating", title: "对公司福利制度的满意度", required: true, ratingMax: 10 },
  { id: "q5", type: "free_text", title: "您希望增加哪些福利项目？", required: true },
  { id: "q6", type: "rating", title: "对工作环境的安全感评分", required: true, ratingMax: 5 },
];

const q3: Question[] = [
  { id: "q7", type: "free_text", title: "请分享您在工作中遇到的最大困扰", required: true },
  { id: "q8", type: "rating", title: "对直属上级的信任度评分", required: true, ratingMax: 5 },
  { id: "q9", type: "free_text", title: "您认为公司文化最需要改变的方面？", required: false },
];

export const mockSurveys: Survey[] = [
  {
    id: "s1",
    title: "2026 Q2 员工满意度调查",
    description: "了解员工对公司管理、沟通和工作环境的真实看法，所有回答完全匿名。",
    status: "active",
    createdAt: "2026-04-01T09:00:00Z",
    questions: q1,
    responseCount: 12,
    tags: ["管理", "沟通", "工作环境"],
  },
  {
    id: "s2",
    title: "福利制度改进调查",
    description: "收集员工对现有福利制度的反馈，帮助我们优化福利方案。",
    status: "active",
    createdAt: "2026-05-15T10:00:00Z",
    questions: q2,
    responseCount: 8,
    tags: ["福利", "薪酬"],
  },
  {
    id: "s3",
    title: "2026 Q1 组织文化调查",
    description: "深入了解员工对公司文化和领导力的看法。",
    status: "closed",
    createdAt: "2026-01-10T08:00:00Z",
    closedAt: "2026-03-31T23:59:59Z",
    questions: q3,
    responseCount: 23,
    tags: ["文化", "领导力"],
  },
  {
    id: "s4",
    title: "办公环境改善调查",
    description: "收集对办公设施和环境改善的意见。",
    status: "draft",
    createdAt: "2026-06-01T14:00:00Z",
    questions: [
      { id: "q10", type: "free_text", title: "您对当前办公环境最不满意的地方？", required: true },
      { id: "q11", type: "rating", title: "对办公设备满意度的评分", required: true, ratingMax: 5 },
    ],
    responseCount: 0,
    tags: ["工作环境", "设施"],
  },
];

export const mockSubmissions: Submission[] = [
  {
    id: "sub1",
    surveyId: "s1",
    answers: [
      { questionId: "q1", type: "free_text", textValue: "希望管理层能更透明地传达公司战略方向，目前感觉信息沟通存在断层，基层员工对决策背景了解不足。" },
      { questionId: "q2", type: "rating", ratingValue: 3 },
      { questionId: "q3", type: "free_text", textValue: "跨部门协作流程需要优化，当前审批流程过长，影响项目进度。" },
    ],
    tags: ["管理", "沟通"],
    submittedAt: "2026-04-05T14:30:00Z",
    status: "visible",
    adminReply: "感谢您的反馈。我们正在推进信息透明化项目，计划下月起每月发布公司战略简报。关于跨部门协作，已安排流程优化小组跟进。",
    repliedAt: "2026-04-06T10:00:00Z",
  },
  {
    id: "sub2",
    surveyId: "s1",
    answers: [
      { questionId: "q1", type: "free_text", textValue: "建议减少不必要的会议，很多会议可以通过邮件或文档解决，节省的时间可以用于实际工作。" },
      { questionId: "q2", type: "rating", ratingValue: 2 },
      { questionId: "q3", type: "free_text", textValue: "绩效考核标准需要更加明确和公平。" },
    ],
    tags: ["管理", "工作环境"],
    submittedAt: "2026-04-08T09:15:00Z",
    status: "visible",
  },
  {
    id: "sub3",
    surveyId: "s1",
    answers: [
      { questionId: "q1", type: "free_text", textValue: "希望有更多职业发展培训机会，特别是技术类培训，目前公司内部培训资源较少。" },
      { questionId: "q2", type: "rating", ratingValue: 4 },
    ],
    tags: ["管理", "沟通"],
    submittedAt: "2026-04-10T16:45:00Z",
    status: "visible",
    adminReply: "已注意到培训需求，Q3将引入外部培训平台，提供更多技术课程选择。",
    repliedAt: "2026-04-12T11:30:00Z",
  },
  {
    id: "sub4",
    surveyId: "s2",
    answers: [
      { questionId: "q4", type: "rating", ratingValue: 5 },
      { questionId: "q5", type: "free_text", textValue: "希望能增加弹性工作制，以及更多的团建活动经费。" },
      { questionId: "q6", type: "rating", ratingValue: 4 },
    ],
    tags: ["福利", "工作环境"],
    submittedAt: "2026-05-20T11:20:00Z",
    status: "visible",
  },
  {
    id: "sub5",
    surveyId: "s2",
    answers: [
      { questionId: "q4", type: "rating", ratingValue: 3 },
      { questionId: "q5", type: "free_text", textValue: "体检项目可以更全面一些，另外建议增加子女教育补贴。" },
      { questionId: "q6", type: "rating", ratingValue: 4 },
    ],
    tags: ["福利", "薪酬"],
    submittedAt: "2026-05-22T15:00:00Z",
    status: "visible",
    adminReply: "已将体检升级和子女教育补贴纳入明年福利方案评估中。",
    repliedAt: "2026-05-24T09:00:00Z",
  },
  {
    id: "sub6",
    surveyId: "s3",
    answers: [
      { questionId: "q7", type: "free_text", textValue: "最大的困扰是工作分配不均，部分同事工作量明显偏大。" },
      { questionId: "q8", type: "rating", ratingValue: 4 },
      { questionId: "q9", type: "free_text", textValue: "需要更多的容错文化，鼓励创新而非惩罚失败。" },
    ],
    tags: ["文化", "工作环境"],
    submittedAt: "2026-01-15T10:30:00Z",
    status: "visible",
    adminReply: "我们正在推行工作负载均衡项目，并将在Q2开展创新文化建设试点。",
    repliedAt: "2026-01-18T14:00:00Z",
  },
  {
    id: "sub7",
    surveyId: "s3",
    answers: [
      { questionId: "q7", type: "free_text", textValue: "晋升通道不够清晰，不知道需要达到什么标准才能晋升。" },
      { questionId: "q8", type: "rating", ratingValue: 3 },
    ],
    tags: ["文化", "领导力"],
    submittedAt: "2026-02-10T13:00:00Z",
    status: "visible",
  },
  {
    id: "sub8",
    surveyId: "s1",
    answers: [
      { questionId: "q1", type: "free_text", textValue: "公司某些领导就是废物，什么都不懂还在那里指手画脚" },
      { questionId: "q2", type: "rating", ratingValue: 1 },
    ],
    tags: ["管理"],
    submittedAt: "2026-04-15T08:00:00Z",
    status: "pending_review",
    matchedKeywords: ["废物"],
  },
  {
    id: "sub9",
    surveyId: "s2",
    answers: [
      { questionId: "q4", type: "rating", ratingValue: 2 },
      { questionId: "q5", type: "free_text", textValue: "那些白痴领导根本不关心员工的实际需求" },
      { questionId: "q6", type: "rating", ratingValue: 2 },
    ],
    tags: ["福利"],
    submittedAt: "2026-05-28T16:00:00Z",
    status: "pending_review",
    matchedKeywords: ["白痴"],
  },
  {
    id: "sub10",
    surveyId: "s3",
    answers: [
      { questionId: "q7", type: "free_text", textValue: "希望能有更灵活的远程办公政策，提高工作效率的同时也改善工作生活平衡。" },
      { questionId: "q8", type: "rating", ratingValue: 4 },
      { questionId: "q9", type: "free_text", textValue: "公司应该更注重结果而非过程管理。" },
    ],
    tags: ["文化", "工作环境"],
    submittedAt: "2026-02-20T09:30:00Z",
    status: "visible",
  },
  {
    id: "sub11",
    surveyId: "s1",
    answers: [
      { questionId: "q1", type: "free_text", textValue: "建议设立匿名提问箱，让员工可以在全员会议上匿名提问。" },
      { questionId: "q2", type: "rating", ratingValue: 3 },
    ],
    tags: ["沟通"],
    submittedAt: "2026-04-18T11:00:00Z",
    status: "visible",
    adminReply: "很好的建议！我们将在下月全员大会引入匿名提问功能。",
    repliedAt: "2026-04-19T15:30:00Z",
  },
];

export const allTags = ["管理", "沟通", "工作环境", "福利", "薪酬", "文化", "领导力", "设施"];

export const tagColors: Record<string, string> = {
  "管理": "#f0a500",
  "沟通": "#3b82f6",
  "工作环境": "#10b981",
  "福利": "#8b5cf6",
  "薪酬": "#ec4899",
  "文化": "#f97316",
  "领导力": "#06b6d4",
  "设施": "#84cc16",
};

export const reportRecipients = [
  { id: "r1", name: "CEO 张明", email: "ceo@company.com", role: "管理层" },
  { id: "r2", name: "COO 李华", email: "coo@company.com", role: "管理层" },
  { id: "r3", name: "HRD 王芳", email: "hrd@company.com", role: "人力资源" },
  { id: "r4", name: "技术总监 陈强", email: "cto@company.com", role: "管理层" },
  { id: "r5", name: "运营总监 刘敏", email: "coo2@company.com", role: "管理层" },
  { id: "r6", name: "全体高管", email: "exec-team@company.com", role: "高管组" },
];
