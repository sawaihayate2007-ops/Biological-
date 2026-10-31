/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  KnowledgeCard,
  BiologyField,
  BIOLOGY_FIELDS,
  DifficultyLevel,
} from '../../types';
import { generateKnowledgeMaterialPrompt } from '../../services/promptGenerators';
import { parseKnowledgeMarkdown } from '../../services/markdownParser';
import {
  X,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Upload,
  AlertTriangle,
  CheckCircle,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface KnowledgeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCards: (cards: KnowledgeCard[]) => Promise<void>;
  existingCards: KnowledgeCard[];
  aiStudioUrl: string;
}

export const KnowledgeImportModal: React.FC<KnowledgeImportModalProps> = ({
  isOpen,
  onClose,
  onImportCards,
  existingCards,
  aiStudioUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'paste' | 'preview'>('prompt');

  // Prompt configuration
  const [promptField, setPromptField] = useState<BiologyField>('分子生物学・遺伝情報');
  const [promptChapter, setPromptChapter] = useState('第1章：原核生物の遺伝子発現調節');
  const [promptTheme, setPromptTheme] = useState('テーマ01：ラクトースオペロンの誘導機構');
  const [promptDifficulty, setPromptDifficulty] = useState('難関国公立大学二次試験レベル');
  const [numThemes, setNumThemes] = useState(2);
  const [promptExtra, setPromptExtra] = useState('');
  const [promptCopied, setPromptCopied] = useState(false);

  // Markdown paste
  const [rawMarkdown, setRawMarkdown] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [parsedCards, setParsedCards] = useState<KnowledgeCard[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  // Generated prompt preview
  const generatedPrompt = generateKnowledgeMaterialPrompt({
    field: promptField,
    chapter: promptChapter,
    theme: promptTheme,
    difficulty: promptDifficulty,
    numThemes,
    additionalConditions: promptExtra,
  });

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2500);
    } catch {
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2500);
    }
  };

  const handleOpenAIStudio = () => {
    window.open(aiStudioUrl || 'https://aistudio.google.com/u/2/prompts/new_chat', '_blank', 'noopener,noreferrer');
  };

  const handleParseMarkdown = () => {
    setParseErrors([]);
    setParseWarnings([]);

    const res = parseKnowledgeMarkdown(rawMarkdown);

    if (!res.success) {
      setParseErrors(res.errors);
      setParseWarnings(res.warnings);
      return;
    }

    setParseWarnings(res.warnings);
    setParsedCards(res.data);
    setSelectedCardIds(new Set(res.data.map((c) => c.id)));
    setActiveTab('preview');
  };

  const handleToggleCardSelection = (id: string) => {
    const next = new Set(selectedCardIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedCardIds(next);
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedCardIds(new Set(parsedCards.map((c) => c.id)));
    } else {
      setSelectedCardIds(new Set());
    }
  };

  const handleCommitImport = async () => {
    const cardsToCommit = parsedCards.filter((c) => selectedCardIds.has(c.id));
    if (cardsToCommit.length === 0) return;

    setIsImporting(true);
    try {
      await onImportCards(cardsToCommit);
      onClose();
      // Reset state
      setRawMarkdown('');
      setParsedCards([]);
      setActiveTab('prompt');
    } catch (e: any) {
      setParseErrors([e.message || 'インポート中にエラーが発生しました。']);
    } finally {
      setIsImporting(false);
    }
  };

  // Check for duplicate in existingCards
  const isDuplicate = (card: KnowledgeCard) => {
    return existingCards.some(
      (ec) =>
        ec.title.trim().toLowerCase() === card.title.trim().toLowerCase() ||
        ec.question.trim().slice(0, 30) === card.question.trim().slice(0, 30)
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              知識論述教材の取り込み & 外部AI教材生成
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Google AI Studio等の外部AIを活用して体系的な論述教材を生成・インポートします
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 px-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('prompt')}
            className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'prompt'
                ? 'border-emerald-700 text-emerald-800 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            ① 教材生成プロンプト作成
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'paste'
                ? 'border-emerald-700 text-emerald-800 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            ② Markdown貼り付け & 解析
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            disabled={parsedCards.length === 0}
            className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'preview'
                ? 'border-emerald-700 text-emerald-800 bg-white font-bold'
                : 'border-transparent text-slate-400 disabled:opacity-40'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            ③ カードプレビュー & 登録 ({parsedCards.length}枚)
          </button>
        </div>

        {/* Tab 1: Prompt Builder */}
        {activeTab === 'prompt' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">対象の生物分野</label>
                <select
                  value={promptField}
                  onChange={(e) => setPromptField(e.target.value as BiologyField)}
                  className="w-full p-2 border border-slate-300 rounded focus:border-emerald-600 focus:outline-none bg-white text-slate-800"
                >
                  {BIOLOGY_FIELDS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">想定難易度</label>
                <select
                  value={promptDifficulty}
                  onChange={(e) => setPromptDifficulty(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:border-emerald-600 focus:outline-none bg-white text-slate-800"
                >
                  <option value="難関国公立大学二次試験レベル（東京大学・京都大学等）">
                    難関国公立大学（東大・京大・旧帝・医学部）
                  </option>
                  <option value="国公立大学標準二次試験レベル">国公立大学標準レベル</option>
                  <option value="共通テスト〜二次試験基礎レベル">基礎〜標準レベル</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">対象の章名</label>
                <input
                  type="text"
                  value={promptChapter}
                  onChange={(e) => setPromptChapter(e.target.value)}
                  placeholder="例: 第1章：原核生物の遺伝子発現調節"
                  className="w-full p-2 border border-slate-300 rounded focus:border-emerald-600 focus:outline-none text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">対象テーマ名</label>
                <input
                  type="text"
                  value={promptTheme}
                  onChange={(e) => setPromptTheme(e.target.value)}
                  placeholder="例: テーマ01：ラクトースオペロンの誘導機構"
                  className="w-full p-2 border border-slate-300 rounded focus:border-emerald-600 focus:outline-none text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700">追加の作問条件・重点項目（任意）</label>
              <input
                type="text"
                value={promptExtra}
                onChange={(e) => setPromptExtra(e.target.value)}
                placeholder="例: 変異株の比較考察や、カタボライト抑制（cAMPとCAP）を含める"
                className="w-full p-2 border border-slate-300 rounded focus:border-emerald-600 focus:outline-none text-slate-800"
              />
            </div>

            {/* Prompt Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">生成されたプロンプト</span>
                <span className="text-slate-400">{generatedPrompt.length}文字</span>
              </div>
              <pre className="p-3.5 bg-slate-900 text-slate-100 rounded text-xs font-mono max-h-56 overflow-y-auto whitespace-pre-wrap select-all">
                {generatedPrompt}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 2: Paste & Parse */}
        {activeTab === 'paste' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  外部AI（Google AI Studio等）で出力されたMarkdownを貼り付け
                </label>
                <span className="text-xs text-slate-400">
                  ※見出し階層（分野、第○章、テーマ○○、カードX）に対応
                </span>
              </div>
              <textarea
                value={rawMarkdown}
                onChange={(e) => setRawMarkdown(e.target.value)}
                placeholder={`分野：分子生物学・遺伝情報\n\n第1章：原核生物の遺伝子発現調節\n\nテーマ01：ラクトースオペロンの誘導機構\n\nカード1\n- 種類：basic\n- 難易度：標準\n- タイトル：ラクトースオペロンの構成要素\n\n問題\n...\n\n解答例\n...`}
                className="w-full h-80 p-3.5 border border-slate-200 rounded text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none bg-slate-50/50 text-slate-800"
              />
            </div>

            {/* Parse Errors */}
            {parseErrors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  Markdown解析エラー
                </div>
                <ul className="list-disc list-inside">
                  {parseErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Parse Warnings */}
            {parseWarnings.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  解析警告・確認事項 ({parseWarnings.length}件)
                </div>
                <ul className="list-disc list-inside">
                  {parseWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Card Preview & Selection */}
        {activeTab === 'preview' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  解析完了: 全 {parsedCards.length} 枚のカード
                </h4>
                <p className="text-xs text-slate-500">
                  登録するカードを選択してください。重複カードには警告が表示されます。
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => handleSelectAll(true)}
                  className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 rounded"
                >
                  すべて選択
                </button>
                <button
                  onClick={() => handleSelectAll(false)}
                  className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded"
                >
                  選択解除
                </button>
                <span className="font-bold text-slate-700 ml-2">
                  {selectedCardIds.size} / {parsedCards.length} 枚 選択中
                </span>
              </div>
            </div>

            {/* List of parsed cards */}
            <div className="space-y-3">
              {parsedCards.map((card, idx) => {
                const isSelected = selectedCardIds.has(card.id);
                const isExpanded = expandedCardId === card.id;
                const duplicate = isDuplicate(card);

                return (
                  <div
                    key={card.id}
                    className={`border rounded transition-all text-xs ${
                      isSelected
                        ? 'border-emerald-300 bg-white shadow-2xs'
                        : 'border-slate-200 bg-slate-50/50 opacity-70'
                    }`}
                  >
                    <div className="p-3.5 flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleCardSelection(card.id)}
                        className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 rounded border-slate-300 cursor-pointer"
                      />

                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900">
                            カード {idx + 1}: {card.title}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600">
                            [{card.type}]
                          </span>
                          <span className="text-[11px] text-slate-500">
                            難易度: {card.difficulty}
                          </span>
                          {card.charLimit && (
                            <span className="text-[11px] text-slate-500">
                              指定: {card.charLimit}字
                            </span>
                          )}
                          {duplicate && (
                            <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                              ※既存カードと類似の可能性あり
                            </span>
                          )}
                        </div>

                        <div className="text-slate-500 text-[11px]">
                          {card.field} ＞ {card.chapter} ＞ {card.theme}
                        </div>

                        <div className="text-slate-800 line-clamp-2">
                          <span className="font-semibold text-slate-700">問: </span>
                          {card.question}
                        </div>

                        {/* Collapsible details */}
                        {isExpanded && (
                          <div className="pt-3 mt-2 border-t border-slate-100 space-y-2">
                            {card.framework && card.framework.length > 0 && (
                              <div className="p-2 bg-slate-50 rounded">
                                <span className="font-bold text-slate-700">論述の骨組み:</span>
                                <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600">
                                  {card.framework.map((f, fi) => (
                                    <li key={fi}>{f}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="p-2 bg-emerald-50/60 rounded border border-emerald-100">
                              <span className="font-bold text-emerald-950">解答例:</span>
                              <div className="text-emerald-900 mt-1 whitespace-pre-wrap">
                                {card.modelAnswer}
                              </div>
                            </div>

                            {card.keyTerms && card.keyTerms.length > 0 && (
                              <div>
                                <span className="font-bold text-slate-700">重要語句: </span>
                                <span className="text-slate-600">
                                  {card.keyTerms.join(', ')}
                                </span>
                              </div>
                            )}

                            {card.rubric && card.rubric.length > 0 && (
                              <div className="p-2 bg-amber-50/60 rounded border border-amber-100">
                                <span className="font-bold text-amber-900">採点ポイント:</span>
                                <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-900">
                                  {card.rubric.map((r, ri) => (
                                    <li key={ri}>{r}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {card.explanation && (
                              <div className="text-slate-600">
                                <span className="font-bold text-slate-700">解説: </span>
                                {card.explanation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {activeTab === 'prompt' && 'プロンプトをコピーしてGoogle AI Studioに渡してください'}
            {activeTab === 'paste' && 'AIからの出力を貼り付けて「解析」を押してください'}
            {activeTab === 'preview' && `選択した ${selectedCardIds.size} 枚をデータベースに登録します`}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {activeTab === 'prompt' && (
              <>
                <button
                  onClick={handleCopyPrompt}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded text-xs font-bold transition-colors ${
                    promptCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                  }`}
                >
                  {promptCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      プロンプトをコピー完了！
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      プロンプトをコピー
                    </>
                  )}
                </button>

                <button
                  onClick={handleOpenAIStudio}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 shadow-xs"
                >
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                  Google AI Studioを開く
                </button>

                <button
                  onClick={() => setActiveTab('paste')}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-bold"
                >
                  次へ（貼り付けへ）
                </button>
              </>
            )}

            {activeTab === 'paste' && (
              <>
                <button
                  onClick={() => setActiveTab('prompt')}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded"
                >
                  プロンプト画面に戻る
                </button>
                <button
                  onClick={handleParseMarkdown}
                  disabled={!rawMarkdown.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  Markdownを解析する
                </button>
              </>
            )}

            {activeTab === 'preview' && (
              <>
                <button
                  onClick={() => setActiveTab('paste')}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded"
                >
                  貼り付け画面に戻る
                </button>
                <button
                  onClick={handleCommitImport}
                  disabled={selectedCardIds.size === 0 || isImporting}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors shadow-xs"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isImporting ? '登録中...' : `選択した${selectedCardIds.size}枚のカードを登録する`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
