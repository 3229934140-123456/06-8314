export interface AnonymousSubmissionRecord {
  surveyId: string;
  submittedAt: string;
}

function getStorageKey(userId: string): string {
  return `anon_sub_${userId}`;
}

function readAll(userId: string): AnonymousSubmissionRecord[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeAll(userId: string, records: AnonymousSubmissionRecord[]): void {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(records));
  } catch {
    // ignore
  }
}

export function markSurveySubmitted(userId: string, surveyId: string): void {
  if (typeof window === "undefined") return;
  const records = readAll(userId);
  if (records.some((r) => r.surveyId === surveyId)) return;
  records.push({
    surveyId,
    submittedAt: new Date().toISOString(),
  });
  writeAll(userId, records);
}

export function hasUserSubmittedSurvey(userId: string, surveyId: string): boolean {
  if (typeof window === "undefined") return false;
  const records = readAll(userId);
  return records.some((r) => r.surveyId === surveyId);
}

export function getUserSubmissionRecord(
  userId: string,
  surveyId: string
): AnonymousSubmissionRecord | undefined {
  if (typeof window === "undefined") return undefined;
  const records = readAll(userId);
  return records.find((r) => r.surveyId === surveyId);
}

export function clearUserAnonymousRecords(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getStorageKey(userId));
}
