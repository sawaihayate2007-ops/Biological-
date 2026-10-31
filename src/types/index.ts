/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 生物の分野分類 (高校・大学入試標準)
export type BiologyField =
  | '分子生物学・遺伝情報'
  | '細胞・生体膜'
  | '代謝・エネルギー'
  | '生殖・発生'
  | '動物の反応と調節'
  | '植物の反応と調節'
  | '生態系と環境'
  | '進化と系統'
  | 'その他・融合';

export const BIOLOGY_FIELDS: BiologyField[] = [
  '分子生物学・遺伝情報',
  '細胞・生体膜',
  '代謝・エネルギー',
  '生殖・発生',
  '動物の反応と調節',
  '植物の反応と調節',
  '生態系と環境',
  '進化と系統',
  'その他・融合',
];

// 知識論述カードの種類
export type KnowledgeCardType = 'basic' | 'understanding' | 'application' | 'comprehensive';

export const CARD_TYPE_LABELS: Record<KnowledgeCardType, { label: string; desc: string; color: string }> = {
  basic: {
    label: '基本 (用語・定義)',
    desc: '用語・基本知識の確認。頭の中で想起して確認',
    color: 'emerald',
  },
  understanding: {
    label: '理解 (仕組み・原因)',
    desc: '現象の機序・因果関係の説明。因果連鎖を想起',
    color: 'blue',
  },
  application: {
    label: '応用 (条件変化・比較)',
    desc: '条件変化・実験考察・比較論述。思考プロセスを確認',
    color: 'amber',
  },
  comprehensive: {
    label: '総合論述 (入試本番型)',
    desc: '複数知識を統合した大学入試実戦問題。答案を作成して自己評価・AI採点',
    color: 'purple',
  },
};

export type DifficultyLevel = '基礎' | '標準' | '難関' | '最難関';

export type ReviewRating = 'not_remembered' | 'uncertain' | 'remembered';

// 知識論述カードデータ
export interface KnowledgeCard {
  id: string;
  themeId: string;
  type: KnowledgeCardType;
  title: string;
  question: string;
  charLimit?: number; // 総合論述や字数指定がある場合
  framework: string[]; // 論述の骨組み (要点リスト)
  modelAnswer: string; // 模範解答
  keyTerms: string[]; // 必須重要語句
  rubric: string[]; // 採点ポイント・減点回避要件
  explanation?: string; // 解説・背景知識
  field: BiologyField;
  chapter: string; // 例: "第1章：遺伝子の発現調節"
  theme: string; // 例: "テーマ01：原核生物のオペロン説"
  difficulty: DifficultyLevel;
  tags: string[];
  relatedCardIds?: string[];
  imageUrl?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;

  // 復習・習熟度データ
  mastery: 'unlearned' | 'learning' | 'mastered';
  intervalDays: number; // 次回復習までの間隔 (1, 3, 7, 14, 30...)
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewedDate?: string;
  reviewCount: number;
  lapseCount: number; // 忘れた回数
  history: CardReviewLog[];
}

export interface CardReviewLog {
  id: string;
  date: string; // ISO
  rating: ReviewRating;
  userAnswer?: string;
  selfScore?: number; // 総合論述時の自己評価 (0-100)
}

// 通常の論述問題・コンテンツブロック
export type ContentBlockType =
  | 'text'
  | 'heading'
  | 'image'
  | 'table'
  | 'graph'
  | 'formula'
  | 'note'
  | 'divider';

export interface TableContentData {
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface GraphContentData {
  title: string;
  type: 'bar' | 'line';
  xAxisLabel?: string;
  yAxisLabel?: string;
  labels: string[];
  series: {
    name: string;
    values: number[];
    color?: string;
  }[];
}

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content: string; // テキスト本文、数式、見出し、画像URLなど
  caption?: string;
  tableData?: TableContentData;
  graphData?: GraphContentData;
}

// 通常の論述問題
export interface StandardProblem {
  id: string;
  title: string;
  field: BiologyField;
  theme?: string;
  tags: string[]; // 大学名タグ・単元名タグ・自由タグ
  charLimit?: number; // 例: 80字以内
  source?: string;
  notes?: string;

  // 以前の項目（互換性のためのオプショナル定義）
  university?: string;
  faculty?: string;
  year?: number;
  examType?: '前期' | '後期' | '推薦・総合型' | '私大一般' | '独自予想';
  mainNumber?: string;
  subNumber?: string;
  unit?: string;
  difficulty?: DifficultyLevel;

  // 大問共通資料 (大問に属する共通実験文・図表など)
  commonMaterials?: ContentBlock[];

  // 設問固有のコンテンツブロック (実験結果、図表、問題文)
  contentBlocks: ContentBlock[];

  // 解答情報
  framework?: string[];
  modelAnswer: string;
  gradingRubric: string[];
  pointsAllocated?: number; // 配点 (例: 10点)

  createdAt: string;
  updatedAt: string;
}

// 答案・履歴
export interface ProblemSubmission {
  id: string;
  problemId: string;
  answerText: string;
  charCount: number;
  createdAt: string;
  selfRating?: number; // 0-100点 または 1-5評価
  aiFeedback?: AIFeedbackResult;
}

// 外部AI採点結果
export interface AIFeedbackResult {
  estimatedScore: string; // 例: "8 / 10点" または "A判定"
  reasons: string; // 評価理由
  pros: string[]; // 良かった点
  cons: string[]; // 不足点・減点箇所
  mistakes: string[]; // 誤った記述
  improvedAnswer: string; // 模範改善答案
  nextGoals: string; // 次回へのアドバイス
  rawMarkdown?: string; // AIから貼り付けられた原文
  importedAt: string;
}

// 全プロンプト共通の想定難易度
export type TargetDifficulty = '北大前期' | '北大後期' | '国公立大学標準レベル';

export const TARGET_DIFFICULTIES: TargetDifficulty[] = [
  '北大前期',
  '北大後期',
  '国公立大学標準レベル',
];

// 全体設定
export interface AppSettings {
  aiStudioUrl: string;
  targetDifficulty: TargetDifficulty;
  autoSaveDrafts: boolean;
  dailyGoalCards: number;
  enableSoundEffects: boolean;
  fontSize: 'normal' | 'large';
}

// データベースバックアップエクスポート
export interface DBExportData {
  version: number;
  exportedAt: string;
  knowledgeCards: KnowledgeCard[];
  standardProblems: StandardProblem[];
  submissions: ProblemSubmission[];
  settings: AppSettings;
}
