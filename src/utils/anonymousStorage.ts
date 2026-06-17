const APP_SECRET = "anon_voice_2026";
const STORAGE_PREFIX = "av_";

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getStoredSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function writeSet(key: string, set: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

export async function markSurveySubmitted(userId: string, surveyId: string): Promise<void> {
  if (typeof window === "undefined") return;
  const hash = await sha256(APP_SECRET + userId);
  const storageKey = STORAGE_PREFIX + hash;
  const set = getStoredSet(storageKey);
  set.add(surveyId);
  writeSet(storageKey, set);
}

export async function hasUserSubmittedSurvey(userId: string, surveyId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const hash = await sha256(APP_SECRET + userId);
  const storageKey = STORAGE_PREFIX + hash;
  const set = getStoredSet(storageKey);
  return set.has(surveyId);
}

export async function getUserSubmissionTime(
  userId: string,
  surveyId: string
): Promise<string | undefined> {
  if (typeof window === "undefined") return undefined;
  const hash = await sha256(APP_SECRET + userId + surveyId);
  const timeKey = STORAGE_PREFIX + "t_" + hash;
  return localStorage.getItem(timeKey) || undefined;
}

export async function markSurveySubmittedWithTime(
  userId: string,
  surveyId: string
): Promise<void> {
  if (typeof window === "undefined") return;
  await markSurveySubmitted(userId, surveyId);
  const timeHash = await sha256(APP_SECRET + userId + surveyId);
  const timeKey = STORAGE_PREFIX + "t_" + timeHash;
  try {
    localStorage.setItem(timeKey, new Date().toISOString());
  } catch {
    // ignore
  }
}
