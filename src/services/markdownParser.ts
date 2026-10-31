/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  KnowledgeCard,
  KnowledgeCardType,
  DifficultyLevel,
  BiologyField,
  BIOLOGY_FIELDS,
  StandardProblem,
  AIFeedbackResult,
  ContentBlock,
} from '../types';

export interface ParseResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  warnings: string[];
  rawText: string;
}

/**
 * 知識論述Markdownパーサー
 */
export function parseKnowledgeMarkdown(rawText: string): ParseResult<KnowledgeCard> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const cards: KnowledgeCard[] = [];

  if (!rawText || !rawText.trim()) {
    return {
      success: false,
      data: [],
      errors: ['Markdownテキストが空です。'],
      warnings: [],
      rawText,
    };
  }

  // Check for image references in raw markdown to alert user
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let imgMatch;
  while ((imgMatch = imageRegex.exec(rawText)) !== null) {
    warnings.push(`画像参照「${imgMatch[0]}」が見つかりました。ローカルまたは外部URLが有効か確認してください。`);
  }

  // Split by lines to track line numbers and hierarchy
  const lines = rawText.split('\n');

  let currentField: BiologyField = '分子生物学・遺伝情報';
  let currentChapter = '第1章：未分類';
  let currentTheme = 'テーマ01：未分類';
  let currentThemeId = 'theme-imported-1';

  // We can also split cards by "カード" or "---"
  // Let's iterate or chunk by Card markers
  interface RawCardChunk {
    headerLines: string[];
    sectionLines: Record<string, string[]>;
    startLine: number;
  }

  const rawChunks: RawCardChunk[] = [];
  let currentChunk: RawCardChunk | null = null;
  let currentSection = 'header';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for hierarchy changes
    if (trimmed.startsWith('分野：') || trimmed.startsWith('分野:')) {
      const fieldVal = trimmed.replace(/^分野[：:]\s*/, '').trim() as BiologyField;
      if (BIOLOGY_FIELDS.includes(fieldVal)) {
        currentField = fieldVal;
      } else {
        // Find best match or default
        const matched = BIOLOGY_FIELDS.find((f) => fieldVal.includes(f) || f.includes(fieldVal));
        currentField = matched || 'その他・融合';
        warnings.push(`行 ${i + 1}: 分野「${fieldVal}」を標準分野「${currentField}」にマッピングしました。`);
      }
      continue;
    }

    if (
      trimmed.startsWith('第') &&
      (trimmed.includes('章：') || trimmed.includes('章:'))
    ) {
      currentChapter = trimmed;
      continue;
    } else if (trimmed.startsWith('章：') || trimmed.startsWith('章:')) {
      currentChapter = trimmed;
      continue;
    }

    if (trimmed.startsWith('テーマ') && (trimmed.includes('：') || trimmed.includes(':'))) {
      currentTheme = trimmed;
      currentThemeId = `theme-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      continue;
    }

    // Check for card start (e.g., "カード1", "カード 2", "## カード1")
    const cardStartMatch = trimmed.match(/^(?:#+\s*)?カード\s*(\d+|[A-Za-z0-9]+)/);
    if (cardStartMatch) {
      if (currentChunk) {
        rawChunks.push(currentChunk);
      }
      currentChunk = {
        headerLines: [line],
        sectionLines: {},
        startLine: i + 1,
      };
      currentSection = 'header';
      continue;
    }

    // Check for delimiter between cards
    if (trimmed === '---' || trimmed === '***') {
      if (currentChunk) {
        rawChunks.push(currentChunk);
        currentChunk = null;
        currentSection = 'header';
      }
      continue;
    }

    if (!currentChunk) {
      // Content outside a card
      continue;
    }

    // Section headers inside a card
    const sectionNorm = trimmed.replace(/^#+\s*/, '').replace(/[:：]$/, '');
    if (
      sectionNorm === '問題' ||
      sectionNorm === '論述の骨組み' ||
      sectionNorm === '解答例' ||
      sectionNorm === '模範解答' ||
      sectionNorm === '重要語句' ||
      sectionNorm === '採点ポイント' ||
      sectionNorm === '採点基準' ||
      sectionNorm === '解説'
    ) {
      currentSection = sectionNorm;
      if (!currentChunk.sectionLines[currentSection]) {
        currentChunk.sectionLines[currentSection] = [];
      }
      continue;
    }

    if (currentSection === 'header') {
      currentChunk.headerLines.push(line);
    } else {
      if (!currentChunk.sectionLines[currentSection]) {
        currentChunk.sectionLines[currentSection] = [];
      }
      currentChunk.sectionLines[currentSection].push(line);
    }
  }

  if (currentChunk) {
    rawChunks.push(currentChunk);
  }

  if (rawChunks.length === 0) {
    errors.push('「カード1」「カード2」等のカード開始タグが見つかりませんでした。指定フォーマットをご確認ください。');
    return {
      success: false,
      data: [],
      errors,
      warnings,
      rawText,
    };
  }

  // Convert raw chunks into KnowledgeCard
  rawChunks.forEach((chunk, index) => {
    let type: KnowledgeCardType = 'basic';
    let difficulty: DifficultyLevel = '標準';
    let charLimit: number | undefined = undefined;
    let title = `カード ${index + 1}`;

    // Parse header lines
    chunk.headerLines.forEach((hLine) => {
      const clean = hLine.replace(/^[-*]\s*/, '').trim();

      if (clean.includes('種類：') || clean.includes('種類:')) {
        const val = clean.replace(/.*種類[：:]\s*/, '').trim().toLowerCase();
        if (val.includes('understanding') || val.includes('理解')) type = 'understanding';
        else if (val.includes('application') || val.includes('応用')) type = 'application';
        else if (val.includes('comprehensive') || val.includes('総合')) type = 'comprehensive';
        else type = 'basic';
      }

      if (clean.includes('難易度：') || clean.includes('難易度:')) {
        const val = clean.replace(/.*難易度[：:]\s*/, '').trim();
        if (val.includes('最難関')) difficulty = '最難関';
        else if (val.includes('難関')) difficulty = '難関';
        else if (val.includes('基礎')) difficulty = '基礎';
        else difficulty = '標準';
      }

      if (clean.includes('指定字数：') || clean.includes('指定字数:')) {
        const numMatch = clean.match(/(\d+)\s*字/);
        if (numMatch) {
          charLimit = parseInt(numMatch[1], 10);
        }
      }

      if (clean.includes('タイトル：') || clean.includes('タイトル:')) {
        title = clean.replace(/.*タイトル[：:]\s*/, '').trim() || title;
      }
    });

    // Extract Question
    const questionLines = chunk.sectionLines['問題'] || [];
    const question = questionLines.join('\n').trim();

    if (!question) {
      warnings.push(`カード ${index + 1} (行 ${chunk.startLine}): 問題文が空です。`);
    }

    // Extract Framework
    const fwLines = chunk.sectionLines['論述の骨組み'] || [];
    const framework = fwLines
      .map((l) => l.replace(/^[-*・]\s*/, '').trim())
      .filter((l) => l.length > 0);

    // Extract Model Answer
    const ansLines = chunk.sectionLines['解答例'] || chunk.sectionLines['模範解答'] || [];
    const modelAnswer = ansLines.join('\n').trim();

    if (!modelAnswer) {
      warnings.push(`カード ${index + 1} (行 ${chunk.startLine}): 解答例が空です。`);
    }

    // Extract Key Terms
    const ktLines = chunk.sectionLines['重要語句'] || [];
    const keyTerms = ktLines
      .map((l) => l.replace(/^[-*・]\s*/, '').trim())
      .filter((l) => l.length > 0);

    // Extract Rubric
    const rbLines = chunk.sectionLines['採点ポイント'] || chunk.sectionLines['採点基準'] || [];
    const rubric = rbLines
      .map((l) => l.replace(/^[-*・]\s*/, '').trim())
      .filter((l) => l.length > 0);

    // Extract Explanation
    const expLines = chunk.sectionLines['解説'] || [];
    const explanation = expLines.join('\n').trim();

    const todayStr = new Date().toISOString().split('T')[0];

    const card: KnowledgeCard = {
      id: `kc-import-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
      themeId: currentThemeId,
      type,
      title: title || `論述カード ${index + 1}`,
      question: question || '（問題文未設定）',
      charLimit,
      framework,
      modelAnswer: modelAnswer || '（解答例未設定）',
      keyTerms,
      rubric,
      explanation: explanation || undefined,
      field: currentField,
      chapter: currentChapter,
      theme: currentTheme,
      difficulty,
      tags: [currentField, type],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mastery: 'unlearned',
      intervalDays: 1,
      nextReviewDate: todayStr,
      reviewCount: 0,
      lapseCount: 0,
      history: [],
    };

    cards.push(card);
  });

  return {
    success: cards.length > 0,
    data: cards,
    errors,
    warnings,
    rawText,
  };
}

/**
 * 通常論述問題Markdownパーサー
 */
export function parseStandardProblemMarkdown(rawText: string): ParseResult<StandardProblem> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rawText || !rawText.trim()) {
    return {
      success: false,
      data: [],
      errors: ['Markdownテキストが空です。'],
      warnings: [],
      rawText,
    };
  }

  const lines = rawText.split('\n');

  let university = '大学入試予想問題';
  let year = new Date().getFullYear();
  let examType: StandardProblem['examType'] = '前期';
  let mainNumber = '第1問';
  let title = '生物論述問題';
  let field: BiologyField = '分子生物学・遺伝情報';
  let theme = '転写制御';
  let charLimit: number | undefined = undefined;
  let pointsAllocated: number | undefined = 10;
  const parsedTags: string[] = [];

  const commonMaterials: ContentBlock[] = [];
  const contentBlocks: ContentBlock[] = [];
  const framework: string[] = [];
  let modelAnswer = '';
  const gradingRubric: string[] = [];

  let currentSection = 'header';
  const sectionContent: Record<string, string[]> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('タグ：') || trimmed.startsWith('タグ:')) {
      const tagStr = trimmed.replace(/^タグ[：:]\s*/, '').trim();
      tagStr.split(/[,、\s]+/).forEach((t) => {
        const clean = t.trim();
        if (clean && !parsedTags.includes(clean)) parsedTags.push(clean);
      });
      continue;
    }
    if (trimmed.startsWith('出題：') || trimmed.startsWith('出題:')) {
      // Recognized as 作AI
      continue;
    }
    if (trimmed.startsWith('大学：') || trimmed.startsWith('大学:')) {
      const u = trimmed.replace(/^大学[：:]\s*/, '').trim();
      if (u && u !== '作AI' && !parsedTags.includes(u)) parsedTags.push(u);
      continue;
    }
    if (trimmed.startsWith('単元：') || trimmed.startsWith('単元:')) {
      const u = trimmed.replace(/^単元[：:]\s*/, '').trim();
      if (u && !parsedTags.includes(u)) parsedTags.push(u);
      continue;
    }
    if (trimmed.startsWith('問題タイトル：') || trimmed.startsWith('問題タイトル:')) {
      title = trimmed.replace(/^問題タイトル[：:]\s*/, '').trim();
      continue;
    }
    if (trimmed.startsWith('分野：') || trimmed.startsWith('分野:')) {
      const f = trimmed.replace(/^分野[：:]\s*/, '').trim() as BiologyField;
      if (BIOLOGY_FIELDS.includes(f)) field = f;
      continue;
    }
    if (trimmed.startsWith('テーマ：') || trimmed.startsWith('テーマ:')) {
      theme = trimmed.replace(/^テーマ[：:]\s*/, '').trim();
      continue;
    }
    if (trimmed.startsWith('指定字数：') || trimmed.startsWith('指定字数:')) {
      const match = trimmed.match(/(\d+)\s*字/);
      if (match) charLimit = parseInt(match[1], 10);
      continue;
    }
    if (trimmed.startsWith('配点：') || trimmed.startsWith('配点:')) {
      const p = parseInt(trimmed.replace(/^配点[：:]\s*/, '').trim(), 10);
      if (!isNaN(p)) pointsAllocated = p;
      continue;
    }

    // Section markers
    if (trimmed === '【大問共通資料】' || trimmed === '### 大問共通資料' || trimmed === '【共通資料】') {
      currentSection = 'common';
      sectionContent[currentSection] = [];
      continue;
    }
    if (trimmed === '【問題文】' || trimmed === '### 問題文' || trimmed === '【設問文】') {
      currentSection = 'question';
      sectionContent[currentSection] = [];
      continue;
    }
    if (trimmed === '【論述の骨組み】' || trimmed === '### 論述の骨組み') {
      currentSection = 'framework';
      sectionContent[currentSection] = [];
      continue;
    }
    if (trimmed === '【模範解答】' || trimmed === '### 模範解答' || trimmed === '【解答例】') {
      currentSection = 'answer';
      sectionContent[currentSection] = [];
      continue;
    }
    if (trimmed === '【採点基準】' || trimmed === '### 採点基準' || trimmed === '【採点ポイント】') {
      currentSection = 'rubric';
      sectionContent[currentSection] = [];
      continue;
    }

    if (currentSection !== 'header') {
      if (!sectionContent[currentSection]) sectionContent[currentSection] = [];
      sectionContent[currentSection].push(line);
    }
  }

  // Parse common materials into blocks
  const commonRaw = (sectionContent['common'] || []).join('\n').trim();
  if (commonRaw) {
    commonMaterials.push({
      id: `cm-${Date.now()}-1`,
      type: 'text',
      content: commonRaw,
    });
  }

  // Question blocks
  const questionRaw = (sectionContent['question'] || []).join('\n').trim();
  if (questionRaw) {
    contentBlocks.push({
      id: `cb-${Date.now()}-1`,
      type: 'text',
      content: questionRaw,
    });
  } else {
    warnings.push('問題文が見つかりませんでした。');
  }

  // Framework
  (sectionContent['framework'] || []).forEach((l) => {
    const clean = l.replace(/^[-*・]\s*/, '').trim();
    if (clean) framework.push(clean);
  });

  // Model answer
  modelAnswer = (sectionContent['answer'] || []).join('\n').trim();

  // Rubric
  (sectionContent['rubric'] || []).forEach((l) => {
    const clean = l.replace(/^[-*・]\s*/, '').trim();
    if (clean) gradingRubric.push(clean);
  });

  if (parsedTags.length === 0) {
    parsedTags.push(field);
    parsedTags.push('作AI');
  }

  const problem: StandardProblem = {
    id: `sp-import-${Date.now()}`,
    title,
    field,
    theme,
    tags: parsedTags,
    charLimit,
    pointsAllocated,
    source: '作AI',
    commonMaterials: commonMaterials.length > 0 ? commonMaterials : undefined,
    contentBlocks,
    framework: framework.length > 0 ? framework : undefined,
    modelAnswer: modelAnswer || '（模範解答未設定）',
    gradingRubric,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    success: true,
    data: [problem],
    errors,
    warnings,
    rawText,
  };
}

/**
 * 外部AI採点結果Markdownパーサー
 */
export function parseAIFeedbackMarkdown(rawText: string): AIFeedbackResult {
  const result: AIFeedbackResult = {
    estimatedScore: '',
    reasons: '',
    pros: [],
    cons: [],
    mistakes: [],
    improvedAnswer: '',
    nextGoals: '',
    rawMarkdown: rawText,
    importedAt: new Date().toISOString(),
  };

  if (!rawText) return result;

  const lines = rawText.split('\n');
  let currentSection = '';
  const sections: Record<string, string[]> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('#')) {
      const heading = trimmed.replace(/^#+\s*/, '').trim();
      if (
        heading.includes('推定得点') ||
        heading.includes('得点') ||
        heading.includes('評価理由') ||
        heading.includes('良かった点') ||
        heading.includes('不足点') ||
        heading.includes('誤り') ||
        heading.includes('改善答案') ||
        heading.includes('次回')
      ) {
        currentSection = heading;
        sections[currentSection] = [];
        continue;
      }
    }

    if (currentSection) {
      if (!sections[currentSection]) sections[currentSection] = [];
      sections[currentSection].push(line);
    }
  }

  // Map extracted sections
  for (const [head, content] of Object.entries(sections)) {
    const joined = content.join('\n').trim();
    if (head.includes('推定得点') || head.includes('得点')) {
      result.estimatedScore = joined;
    } else if (head.includes('評価理由')) {
      result.reasons = joined;
    } else if (head.includes('良かった点')) {
      result.pros = content
        .map((l) => l.replace(/^[-*・]\s*/, '').trim())
        .filter((l) => l.length > 0);
    } else if (head.includes('不足点')) {
      result.cons = content
        .map((l) => l.replace(/^[-*・]\s*/, '').trim())
        .filter((l) => l.length > 0);
    } else if (head.includes('誤り')) {
      result.mistakes = content
        .map((l) => l.replace(/^[-*・]\s*/, '').trim())
        .filter((l) => l.length > 0);
    } else if (head.includes('改善答案')) {
      result.improvedAnswer = joined;
    } else if (head.includes('次回')) {
      result.nextGoals = joined;
    }
  }

  // Fallback if formatting was loose:
  if (!result.reasons && !result.improvedAnswer) {
    result.reasons = rawText.slice(0, 500);
    result.nextGoals = '（外部AIの回答全文を保存しました）';
  }

  return result;
}
