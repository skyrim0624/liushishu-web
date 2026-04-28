import type { Category, TodayCounts } from "./types";

export const SUPABASE_URL = "https://ntzbtmnzwapgxwocffkc.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_AA3ce9gBNn7fRTyzGeOh1g_YcIF5TO_";

export const DAILY_TARGET = 6;
export const FULL_CIRCLE = 464.96;
export const REMINDER_LABELS = ["起床后", "上午", "午间", "下午", "傍晚", "睡前"];
export const DEFAULT_REMINDER_TIMES = ["07:00", "10:00", "12:30", "15:30", "18:30", "21:30"];

export const EMPTY_TODAY_COUNTS: TodayCounts = {
  wealth: 0,
  kindness: 0,
  health: 0,
  debug: 0
};

export const CATEGORY_LABELS: Record<Category, string> = {
  wealth: "财富种子",
  kindness: "关系种子",
  health: "健康种子",
  debug: "觉察 / 清理负面种子"
};

export const CATEGORY_ALIASES: Record<string, Category> = {
  money: "wealth",
  love: "kindness",
  clean: "debug"
};

export const TAGS_MAP: Record<Category, string[]> = {
  wealth: [
    "孝养父母",
    "布施金钱",
    "帮人赚钱",
    "分享机会",
    "成就他人",
    "支持他人",
    "公平交易",
    "不占便宜",
    "守信守约",
    "愿意付出",
    "尊重价值",
    "随喜他人"
  ],
  kindness: [
    "照顾老人",
    "促成姻缘",
    "陪伴孤独",
    "倾听他人",
    "安抚情绪",
    "给予温暖",
    "鼓励支持",
    "理解包容",
    "赞美他人",
    "守护关系",
    "化解冲突",
    "祝福爱情"
  ],
  health: [
    "助人就医",
    "赠人良药",
    "分享智慧",
    "引导康复",
    "安抚病苦",
    "陪伴病者",
    "供养医者",
    "布施食物",
    "放生护命",
    "发愿健康",
    "回向众生",
    "减轻痛苦"
  ],
  debug: [
    "嫉妒比较",
    "怨恨不平",
    "焦虑不安",
    "自我否定",
    "指责他人",
    "抱怨关系",
    "控制欲强",
    "拖延逃避",
    "推卸责任",
    "匮乏意识",
    "索取心重",
    "过度消费"
  ]
};
