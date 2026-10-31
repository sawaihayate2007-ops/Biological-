/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  StandardProblem,
  BiologyField,
  BIOLOGY_FIELDS,
  TargetDifficulty,
  TARGET_DIFFICULTIES,
} from '../../types';
import {
  generateStandardProblemCreationPrompt,
  TARGET_DIFFICULTY_PROFILES,
} from '../../services/promptGenerators';
import { parseStandardProblemMarkdown } from '../../services/markdownParser';
import {
  X,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Upload,
  AlertTriangle,
  CheckCircle,
  Tag as TagIcon,
  GraduationCap,
} from 'lucide-react';

interface StandardImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProblem: (problem: StandardProblem) => Promise<void>;
  aiStudioUrl: string;
  targetDifficulty?: TargetDifficulty;
  onChangeDifficulty?: (difficulty: TargetDifficulty) => void;
}

export const StandardImportModal: React.FC<StandardImportModalProps> = ({
  isOpen,
  onClose,
  onImportProblem,
  aiStudioUrl,
  targetDifficulty = '北大前期',
  onChangeDifficulty,
}) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'paste' | 'preview'>('prompt');

  // Prompt Builder State (作AI & タグ対応)
  const [field, setField] = useState<BiologyField>('分子生物学・遺伝情報');
  const [topic, setTopic] = useState('真核生物のエピジェネティクスまたはスプライシング機構');
  const [tagsInput, setTagsInput] = useState('遺伝情報, 転写調節, 作AI');
  const [copied, setCopied] = useState(false);

  // Paste & Parse State
  const [rawMarkdown, setRawMarkdown] = useState('');
  const [parsedProblem, setParsedProblem] = useState<StandardProblem | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentTags = tagsInput
    .split(/[,、\s]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const generatedPrompt = generateStandardProblemCreationPrompt({
    field,
    topic,
    tags: currentTags,
    targetDifficulty,
  });

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenAIStudio = () => {
    window.open(aiStudioUrl || 'https://aistudio.google.com/u/2/prompts/new_chat', '_blank', 'noopener,noreferrer');
  };

  const handleParse = () => {
    setErrors([]);
    setWarnings([]);

    const res = parseStandardProblemMarkdown(rawMarkdown);
    if (!res.success || res.data.length === 0) {
      setErrors(res.errors.length > 0 ? res.errors : ['問題の解析に失敗しました。']);
      setWarnings(res.warnings);
      return;
    }

    setWarnings(res.warnings);
    setParsedProblem(res.data[0]);
    setActiveTab('preview');
  };

  const handleCommit = async () => {
    if (!parsedProblem) return;

    setIsSubmitting(true);
    try {
      await onImportProblem(parsedProblem);
      onClose();
      setRawMarkdown('');
      setParsedProblem(null);
      setActiveTab('prompt');
    } catch (e: any) {
      setErrors([e.message || '保存中にエラーが発生しました。']);
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
              通常の論述問題：外部AI作問 & Markdown取り込み (出題：作AI)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              大学名は一切含めず、「作AI」として本格的な生物論述問題を外部AIで作成・取り込みます
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Tabs */}
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
            ① 作問プロンプト作成 (作AI)
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
            disabled={!parsedProblem}
            className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'preview'
                ? 'border-emerald-700 text-emerald-800 bg-white font-bold'
                : 'border-transparent text-slate-400 disabled:opacity-40'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            ③ プレビュー & 登録
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'prompt' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  出題元は「作AI」として設定され、プロンプト内に大学名は一切出力されません。
                </span>
              </div>

              {/* Target Difficulty Selector */}
              <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    想定難易度（全プロンプト共通設定）
                  </span>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                    現在: {targetDifficulty}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {TARGET_DIFFICULTIES.map((diff) => {
                    const isSelected = targetDifficulty === diff;
                    return (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => onChangeDifficulty?.(diff)}
                        className={`py-1.5 px-1 rounded text-xs font-bold transition-all text-center border ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-300'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {diff}
                      </button>
                    );
                  })}
                </div>
                {TARGET_DIFFICULTY_PROFILES[targetDifficulty] && (
                  <p className="text-[10px] text-slate-500 pt-0.5 leading-tight">
                    {TARGET_DIFFICULTY_PROFILES[targetDifficulty].shortDesc}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">生物分野</label>
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
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <TagIcon className="w-3 h-3 text-emerald-600" />
                    <span>指定タグ（カンマ区切り）</span>
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="例: 遺伝情報, 転写調節, 難関"
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">テーマ・題材</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="例: ラクトースオペロンの変異株または転写制御"
                  className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">作問指示プロンプト（作AI形式）</label>
                  <span className="text-slate-400 font-mono">{generatedPrompt.length}文字</span>
                </div>
                <pre className="p-3.5 bg-slate-900 text-slate-100 rounded font-mono text-xs max-h-60 overflow-y-auto whitespace-pre-wrap select-all">
                  {generatedPrompt}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-bold text-slate-700">
                  外部AI（Google AI Studio等）で出力された論述問題Markdownを貼り付け
                </label>
                <textarea
                  value={rawMarkdown}
                  onChange={(e) => setRawMarkdown(e.target.value)}
                  placeholder={`出題：作AI\n問題タイトル：...\n分野：分子生物学・遺伝情報\nテーマ：...\n指定字数：90字以内\nタグ：遺伝情報, 転写調節\n配点：10\n\n【問題文】\n...\n\n【模範解答】\n...`}
                  className="w-full h-80 p-3.5 border border-slate-200 rounded font-mono text-xs resize-none bg-slate-50/50 text-slate-800 leading-relaxed focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {errors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    エラー
                  </div>
                  <ul className="list-disc list-inside">
                    {errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    警告
                  </div>
                  <ul className="list-disc list-inside">
                    {warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'preview' && parsedProblem && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                    {parsedProblem.field}
                  </span>
                  {(parsedProblem.tags || ['作AI']).map((t) => (
                    <span
                      key={t}
                      className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]"
                    >
                      {t}
                    </span>
                  ))}
                  {parsedProblem.charLimit && (
                    <span className="text-purple-700 font-bold font-mono text-[11px] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      指定: {parsedProblem.charLimit}字以内
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900">{parsedProblem.title}</h4>
                {parsedProblem.theme && (
                  <div className="text-xs text-slate-500">テーマ: {parsedProblem.theme}</div>
                )}
              </div>

              {/* Problem Content Preview */}
              <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">【問題文】</span>
                <div className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {parsedProblem.contentBlocks.map((b) => b.content).join('\n')}
                </div>
              </div>

              {/* Model Answer Preview */}
              <div className="p-3 bg-emerald-50/70 rounded border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-950">【模範解答】</span>
                <div className="text-emerald-900 whitespace-pre-wrap leading-relaxed font-sans">
                  {parsedProblem.modelAnswer}
                </div>
              </div>

              {parsedProblem.gradingRubric && parsedProblem.gradingRubric.length > 0 && (
                <div className="p-3 bg-amber-50/70 rounded border border-amber-200 text-amber-950">
                  <span className="font-bold text-amber-900">【採点基準】</span>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {parsedProblem.gradingRubric.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 text-xs">
          <div className="text-slate-500">
            {activeTab === 'prompt' && 'プロンプトをコピーしてGoogle AI Studioに渡してください'}
            {activeTab === 'paste' && 'AI出力を貼り付けて「解析」を押してください'}
            {activeTab === 'preview' && '内容を確認して登録してください'}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'prompt' && (
              <>
                <button
                  onClick={handleCopyPrompt}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded font-bold text-white transition-colors ${
                    copied ? 'bg-emerald-600' : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'コピー完了！' : 'プロンプトをコピー'}
                </button>
                <button
                  onClick={handleOpenAIStudio}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded font-semibold"
                >
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                  Google AI Studioを開く
                </button>
                <button
                  onClick={() => setActiveTab('paste')}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-bold"
                >
                  貼り付けへ
                </button>
              </>
            )}

            {activeTab === 'paste' && (
              <>
                <button
                  onClick={() => setActiveTab('prompt')}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-200 rounded"
                >
                  戻る
                </button>
                <button
                  onClick={handleParse}
                  disabled={!rawMarkdown.trim()}
                  className="flex items-center gap-1 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded font-bold"
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
                  className="px-3 py-2 text-slate-600 hover:bg-slate-200 rounded"
                >
                  修正する
                </button>
                <button
                  onClick={handleCommit}
                  disabled={isSubmitting}
                  className="flex items-center gap-1 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold shadow-xs"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isSubmitting ? '登録中...' : '問題を登録する'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
