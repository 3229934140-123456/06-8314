import type { BlockedKeyword } from "@/types";

export const blockedKeywords: BlockedKeyword[] = [
  { id: "kw1", keyword: "白痴", category: "人身攻击" },
  { id: "kw2", keyword: "蠢货", category: "人身攻击" },
  { id: "kw3", keyword: "废物", category: "人身攻击" },
  { id: "kw4", keyword: "垃圾人", category: "人身攻击" },
  { id: "kw5", keyword: "滚蛋", category: "人身攻击" },
  { id: "kw6", keyword: "去死", category: "暴力威胁" },
  { id: "kw7", keyword: "打死", category: "暴力威胁" },
  { id: "kw8", keyword: "杀", category: "暴力威胁" },
  { id: "kw9", keyword: "歧视", category: "歧视性语言" },
  { id: "kw10", keyword: "地域黑", category: "歧视性语言" },
  { id: "kw11", keyword: "乡下人", category: "歧视性语言" },
  { id: "kw12", keyword: "色情", category: "违规内容" },
  { id: "kw13", keyword: "赌博", category: "违规内容" },
  { id: "kw14", keyword: "毒品", category: "违规内容" },
];

export function filterText(text: string): { passed: boolean; matchedKeywords: string[] } {
  const matched: string[] = [];
  for (const kw of blockedKeywords) {
    if (text.includes(kw.keyword)) {
      matched.push(kw.keyword);
    }
  }
  return { passed: matched.length === 0, matchedKeywords: matched };
}
