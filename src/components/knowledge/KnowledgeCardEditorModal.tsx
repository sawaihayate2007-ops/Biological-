/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  KnowledgeCard,
  KnowledgeCardType,
  DifficultyLevel,
  BiologyField,
  BIOLOGY_FIELDS,
  CARD_TYPE_LABELS,
} from '../../types';
import { X, Save, Plus, Trash2 } from 'lucide-react';

interface KnowledgeCardEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  card?: KnowledgeCard | null;
  onSave: (card: KnowledgeCard) => Promise<void>;
  defaultField?: BiologyField;
  defaultChapter?: string;
  defaultTheme?: string;
}

export const KnowledgeCardEditorModal: React.FC<KnowledgeCardEditorModalProps> = ({
  isOpen,
  onClose,
  card,
  onSave,
  defaultField = '分子生物学・遺伝情報',
  defaultChapter = '第1章：原核生物の遺伝子発現調節',
  defaultTheme = 'テーマ01：ラクトースオペロンの誘導機構',
}) => {
  const [type, setType] = useState<KnowledgeCardType>('basic');
  const [field, setField] = useState<BiologyField>(defaultField);
  const [chapter, setChapter] = useState(defaultChapter);
  const [theme, setTheme] = useState(defaultTheme);
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [charLimit, setCharLimit] = useState<string>('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('標準');

  // Multi-line list items
  const [frameworkText, setFrameworkText] = useState('');
  const [modelAnswer, setModelAnswer] = useState('');
  const [keyTermsText, setKeyTermsText] = useState('');
  const [rubricText, setRubricText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [tagsText, setTagsText] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (card) {
      setType(card.type);
      setField(card.field);
      setChapter(card.chapter);
      setTheme(card.theme);
      setTitle(card.title);
      setQuestion(card.question);
      setCharLimit(card.charLimit ? String(card.charLimit) : '');
      setDifficulty(card.difficulty);
      setFrameworkText((card.framework || []).join('\n'));
      setModelAnswer(card.modelAnswer || '');
      setKeyTermsText((card.keyTerms || []).join(', '));
      setRubricText((card.rubric || []).join('\n'));
      setExplanation(card.explanation || '');
      setTagsText((card.tags || []).join(', '));
    } else {
      setType('basic');
      setField(defaultField);
      setChapter(defaultChapter);
      setTheme(defaultTheme);
      setTitle('');
      setQuestion('');
      setCharLimit('');
      setDifficulty('標準');
      setFrameworkText('');
      setModelAnswer('');
      setKeyTermsText('');
      setRubricText('');
      setExplanation('');
      setTagsText('');
    }
  }, [card, defaultField, defaultChapter, defaultTheme, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !question.trim() || !modelAnswer.trim()) {
      alert('タイトル、問題文、解答例は必須項目です。');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedFramework = frameworkText
        .split('\n')
        .map((l) => l.replace(/^[-*・]\s*/, '').trim())
        .filter((l) => l.length > 0);

      const parsedKeyTerms = keyTermsText
        .split(/[,、\n]/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const parsedRubric = rubricText
        .split('\n')
        .map((r) => r.replace(/^[-*・]\s*/, '').trim())
        .filter((r) => r.length > 0);

      const parsedTags = tagsText
        .split(/[,、\n]/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const todayStr = new Date().toISOString().split('T')[0];

      const updatedCard: KnowledgeCard = {
        id: card ? card.id : `kc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        themeId: card ? card.themeId : `theme-${Date.now()}`,
        type,
        field,
        chapter,
        theme,
        title: title.trim(),
        question: question.trim(),
        charLimit: charLimit ? parseInt(charLimit, 10) : undefined,
        difficulty,
        framework: parsedFramework,
        modelAnswer: modelAnswer.trim(),
        keyTerms: parsedKeyTerms,
        rubric: parsedRubric,
        explanation: explanation.trim() || undefined,
        tags: parsedTags.length > 0 ? parsedTags : [field, type],
        createdAt: card ? card.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mastery: card ? card.mastery : 'unlearned',
        intervalDays: card ? card.intervalDays : 1,
        nextReviewDate: card ? card.nextReviewDate : todayStr,
        reviewCount: card ? card.reviewCount : 0,
        lapseCount: card ? card.lapseCount : 0,
        history: card ? card.history : [],
      };

      await onSave(updatedCard);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {card ? '知識論述カードの編集' : '新規知識論述カードの作成'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              分野・章・テーマに紐付けられた学習カードを登録・更新します
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Classification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded border border-slate-200">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">分野</label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value as BiologyField)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none"
              >
                {BIOLOGY_FIELDS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">章名</label>
              <input
                type="text"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="例: 第1章：原核生物の遺伝子発現調節"
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">テーマ名</label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="例: テーマ01：ラクトースオペロンの誘導機構"
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Type, Difficulty, Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">カード種類</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as KnowledgeCardType)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none"
              >
                <option value="basic">basic (基本 用語・定義)</option>
                <option value="understanding">understanding (理解 仕組み・原因)</option>
                <option value="application">application (応用 条件変化・比較)</option>
                <option value="comprehensive">comprehensive (総合論述 入試実戦)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">難易度</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none"
              >
                <option value="基礎">基礎</option>
                <option value="標準">標準</option>
                <option value="難関">難関</option>
                <option value="最難関">最難関</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">指定字数（任意）</label>
              <input
                type="number"
                value={charLimit}
                onChange={(e) => setCharLimit(e.target.value)}
                placeholder="例: 100"
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">カードタイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: ラクトースオペロンの構成要素とリプレッサーの結合"
              className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none"
              required
            />
          </div>

          {/* Question */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">問題文</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="論述問題の問い文を入力..."
              rows={3}
              className="w-full p-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none resize-none leading-relaxed"
              required
            />
          </div>

          {/* Logical Framework */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">論述の骨組み (1行1要点)</label>
            <textarea
              value={frameworkText}
              onChange={(e) => setFrameworkText(e.target.value)}
              placeholder="- 要点1: ラクトース添加によりアロラクトースがリプレッサーに結合&#10;- 要点2: リプレッサーがオペレーターから解離して転写進行"
              rows={3}
              className="w-full p-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none resize-none font-mono"
            />
          </div>

          {/* Model Answer */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">解答例・模範答案</label>
              <span className="text-[11px] font-mono text-slate-400">
                現在 {modelAnswer.length} 文字
              </span>
            </div>
            <textarea
              value={modelAnswer}
              onChange={(e) => setModelAnswer(e.target.value)}
              placeholder="模範答案を入力..."
              rows={3}
              className="w-full p-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none resize-none leading-relaxed"
              required
            />
          </div>

          {/* Key terms & Rubric */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">重要語句 (カンマ区切り)</label>
              <input
                type="text"
                value={keyTermsText}
                onChange={(e) => setKeyTermsText(e.target.value)}
                placeholder="例: プロモーター, オペレーター, リプレッサー"
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">採点ポイント (1行1項目)</label>
              <textarea
                value={rubricText}
                onChange={(e) => setRubricText(e.target.value)}
                placeholder="- リプレッサーの解離に触れているか&#10;- 因果関係が論理的か"
                rows={2}
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Explanation & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">解説・背景知識（任意）</label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="補足や入試頻出ポイント..."
                rows={2}
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">タグ (カンマ区切り)</label>
              <input
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="例: オペロン説, 転写調節, 東大過去問"
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-xs font-semibold"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? '保存中...' : 'カードを保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
