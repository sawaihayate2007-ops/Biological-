/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { KnowledgeCard, AIFeedbackResult, TargetDifficulty } from '../../types';
import { generateComprehensiveScoringPrompt } from '../../services/promptGenerators';
import { PromptCopyModal } from '../common/PromptCopyModal';
import { AIFeedbackModal } from '../common/AIFeedbackModal';
import {
  ArrowLeft,
  Save,
  Sparkles,
  ExternalLink,
  History,
  CheckCircle,
  Eye,
  EyeOff,
  Copy,
  PenTool,
  Clock,
  Award,
} from 'lucide-react';

interface ComprehensiveEssayViewProps {
  card: KnowledgeCard;
  onBack: () => void;
  onSaveAnswer: (
    cardId: string,
    userAnswer: string,
    selfScore?: number,
    aiFeedback?: AIFeedbackResult
  ) => Promise<void>;
  aiStudioUrl: string;
  targetDifficulty?: TargetDifficulty;
  onChangeDifficulty?: (difficulty: TargetDifficulty) => void;
}

export const ComprehensiveEssayView: React.FC<ComprehensiveEssayViewProps> = ({
  card,
  onBack,
  onSaveAnswer,
  aiStudioUrl,
  targetDifficulty = '北大前期',
  onChangeDifficulty,
}) => {
  // Check if draft exists in localStorage
  const draftKey = `bio_draft_kc_${card.id}`;
  const [userAnswer, setUserAnswer] = useState(() => {
    return localStorage.getItem(draftKey) || '';
  });
  const [selfScore, setSelfScore] = useState<number>(80);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'history'>('write');

  // Modals
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Auto-save draft to localStorage on change
  useEffect(() => {
    localStorage.setItem(draftKey, userAnswer);
  }, [userAnswer, draftKey]);

  const charLimit = card.charLimit || 120;
  const currentCharCount = userAnswer.length;
  const isOverLimit = currentCharCount > charLimit;

  // Handle manual save
  const handleSave = async (aiFeedback?: AIFeedbackResult) => {
    if (!userAnswer.trim()) return;

    setSaveStatus('saving');
    try {
      await onSaveAnswer(card.id, userAnswer, selfScore, aiFeedback);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('idle');
    }
  };

  const handleSaveFeedback = async (feedback: AIFeedbackResult) => {
    await handleSave(feedback);
  };

  const scoringPrompt = generateComprehensiveScoringPrompt({
    card,
    userAnswer,
    targetDifficulty,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top Navigation */}
      <div className="flex items-center justify-between bg-white px-5 py-3 rounded border border-slate-200 shadow-2xs">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          一覧へ戻る
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('write')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'write'
                ? 'bg-purple-50 text-purple-800 border border-purple-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            答案作成
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'history'
                ? 'bg-purple-50 text-purple-800 border border-purple-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            過去の答案・採点履歴 ({card.history?.length || 0})
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {saveStatus === 'saved' && (
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              保存完了
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="text-slate-400 font-mono">保存中...</span>
          )}
        </div>
      </div>

      {activeTab === 'write' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Problem Information & Question (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
              <div className="space-y-1">
                <div className="text-[11px] text-purple-800 font-bold uppercase tracking-wider">
                  総合論述演習
                </div>
                <h3 className="text-base font-bold text-slate-800">{card.title}</h3>
                <div className="text-xs text-slate-500">
                  {card.field} ＞ {card.chapter}
                </div>
              </div>

              {/* Question */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-700">【問題文】</span>
                <div className="text-sm text-slate-900 leading-relaxed font-sans bg-slate-50 p-3.5 rounded border border-slate-200 whitespace-pre-wrap">
                  {card.question}
                </div>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                <span className="font-semibold text-slate-700">指定字数:</span>
                <span className="font-mono font-bold text-purple-800">
                  {card.charLimit ? `${card.charLimit}字以内` : '指定なし'}
                </span>
                <span className="font-semibold text-slate-700 ml-2">難易度:</span>
                <span className="text-slate-700 font-medium">{card.difficulty}</span>
              </div>

              {/* Toggle Model Answer */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowModelAnswer(!showModelAnswer)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors"
                >
                  {showModelAnswer ? (
                    <>
                      <EyeOff className="w-4 h-4 text-slate-500" />
                      模範解答・採点基準を隠す
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 text-emerald-600" />
                      模範解答・採点基準を確認する
                    </>
                  )}
                </button>

                {showModelAnswer && (
                  <div className="mt-3 space-y-3 text-xs animate-in fade-in duration-150">
                    {/* Logical Framework */}
                    {card.framework && card.framework.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded border border-slate-200">
                        <div className="font-bold text-slate-700 mb-1">【論述の骨組み】</div>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                          {card.framework.map((f, fi) => (
                            <li key={fi}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Model Answer */}
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded">
                      <div className="font-bold text-emerald-950 mb-1 flex items-center justify-between">
                        <span>【模範解答】</span>
                        <span className="text-[10px] font-mono text-emerald-800">
                          {card.modelAnswer.length}字
                        </span>
                      </div>
                      <div className="text-emerald-900 leading-relaxed font-sans whitespace-pre-wrap">
                        {card.modelAnswer}
                      </div>
                    </div>

                    {/* Rubric */}
                    {card.rubric && card.rubric.length > 0 && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded text-amber-950">
                        <div className="font-bold text-amber-900 mb-1">【採点ポイント】</div>
                        <ul className="list-disc list-inside space-y-0.5">
                          {card.rubric.map((r, ri) => (
                            <li key={ri}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Writing Area & External AI Actions (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
              {/* Counter Header */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">あなたの答案を入力</label>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isOverLimit ? 'text-red-600' : 'text-slate-700'
                    }`}
                  >
                    {currentCharCount} / {charLimit} 字
                  </span>
                  {isOverLimit && (
                    <span className="text-[11px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                      字数超過!
                    </span>
                  )}
                </div>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="ここに解答を入力してください。因果関係や重要キーワードを意識して記述しましょう..."
                  className={`w-full h-56 p-4 border rounded-md text-sm font-sans leading-relaxed focus:outline-none transition-colors resize-none ${
                    isOverLimit
                      ? 'border-red-400 focus:ring-2 focus:ring-red-200 bg-red-50/20'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 bg-white'
                  }`}
                />
              </div>

              {/* Self Rating */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100 text-xs">
                <span className="text-slate-700 font-medium">自己評価スコア (0〜100点):</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={selfScore}
                    onChange={(e) => setSelfScore(parseInt(e.target.value, 10))}
                    className="w-28 accent-emerald-600 cursor-pointer"
                  />
                  <span className="font-mono font-bold text-slate-900 w-12 text-right">
                    {selfScore} 点
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => handleSave()}
                    disabled={!userAnswer.trim()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    答案を保存する
                  </button>

                  <button
                    onClick={() => setIsPromptModalOpen(true)}
                    disabled={!userAnswer.trim()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors shadow-xs"
                  >
                    <Sparkles className="w-4 h-4" />
                    採点依頼プロンプトをコピー
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() =>
                      window.open(aiStudioUrl || 'https://aistudio.google.com/u/2/prompts/new_chat', '_blank')
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold shadow-2xs"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                    Google AI Studioを開く
                  </button>

                  <button
                    onClick={() => setIsFeedbackModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold shadow-2xs"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    採点結果を取り込む
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Tab: Past Submissions History */
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-800">過去の答案と採点履歴</h4>
              <p className="text-xs text-slate-500">
                この問題に対する過去の答案と改善プロセスを確認できます
              </p>
            </div>
            <span className="text-xs font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded">
              計 {card.history?.length || 0} 件
            </span>
          </div>

          {!card.history || card.history.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              まだ保存された答案はありません。「答案作成」タブで答案を保存してください。
            </div>
          ) : (
            <div className="space-y-4">
              {card.history.map((item, idx) => (
                <div key={item.id || idx} className="p-4 border border-slate-200 rounded text-xs space-y-2 bg-slate-50/50">
                  <div className="flex items-center justify-between text-slate-500 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-semibold text-slate-700">
                        {new Date(item.date).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    {item.selfScore !== undefined && (
                      <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        自己評価: {item.selfScore} 点
                      </span>
                    )}
                  </div>

                  {item.userAnswer ? (
                    <div className="p-3 bg-white rounded border border-slate-100 text-slate-900 font-sans leading-relaxed whitespace-pre-wrap">
                      {item.userAnswer}
                    </div>
                  ) : (
                    <div className="text-slate-400 italic">（自己想起のみ）</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* External AI Prompt Modal */}
      <PromptCopyModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        title="外部AI採点依頼プロンプト"
        description="問題文・模範解答・採点基準・あなたの答案が自動挿入されています"
        promptText={scoringPrompt}
        aiStudioUrl={aiStudioUrl}
        targetDifficulty={targetDifficulty}
        onChangeDifficulty={onChangeDifficulty}
      />

      {/* AI Feedback Import Modal */}
      <AIFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSaveFeedback={handleSaveFeedback}
        problemTitle={card.title}
      />
    </div>
  );
};
