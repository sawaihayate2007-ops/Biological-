/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  StandardProblem,
  ProblemSubmission,
  AIFeedbackResult,
  TargetDifficulty,
} from '../../types';
import { ContentBlockRenderer } from '../common/ContentBlockRenderer';
import { PromptCopyModal } from '../common/PromptCopyModal';
import { AIFeedbackModal } from '../common/AIFeedbackModal';
import { generateStandardProblemScoringPrompt } from '../../services/promptGenerators';
import {
  ArrowLeft,
  Save,
  Sparkles,
  ExternalLink,
  History,
  CheckCircle,
  Eye,
  EyeOff,
  Clock,
  Award,
  BookOpen,
  Edit,
  PenTool,
} from 'lucide-react';

interface StandardProblemDetailViewProps {
  problem: StandardProblem;
  submissions: ProblemSubmission[];
  onBack: () => void;
  onEdit: (problem: StandardProblem) => void;
  onSaveSubmission: (submission: ProblemSubmission) => Promise<void>;
  aiStudioUrl: string;
  targetDifficulty?: TargetDifficulty;
  onChangeDifficulty?: (difficulty: TargetDifficulty) => void;
}

export const StandardProblemDetailView: React.FC<StandardProblemDetailViewProps> = ({
  problem,
  submissions,
  onBack,
  onEdit,
  onSaveSubmission,
  aiStudioUrl,
  targetDifficulty = '北大前期',
  onChangeDifficulty,
}) => {
  const draftKey = `bio_draft_sp_${problem.id}`;
  const [answerText, setAnswerText] = useState(() => {
    return localStorage.getItem(draftKey) || '';
  });
  const [selfScore, setSelfScore] = useState<number>(8);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [activeTab, setActiveTab] = useState<'answer' | 'history'>('answer');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Modals
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Auto-save draft locally
  useEffect(() => {
    localStorage.setItem(draftKey, answerText);
  }, [answerText, draftKey]);

  const charLimit = problem.charLimit;
  const currentCharCount = answerText.length;
  const isOverLimit = charLimit ? currentCharCount > charLimit : false;

  const handleSaveAnswer = async (feedback?: AIFeedbackResult) => {
    if (!answerText.trim()) return;

    setSaveStatus('saving');
    try {
      const newSubmission: ProblemSubmission = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        problemId: problem.id,
        answerText: answerText.trim(),
        charCount: currentCharCount,
        createdAt: new Date().toISOString(),
        selfRating: selfScore,
        aiFeedback: feedback,
      };

      await onSaveSubmission(newSubmission);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('idle');
    }
  };

  const handleSaveFeedback = async (feedback: AIFeedbackResult) => {
    await handleSaveAnswer(feedback);
  };

  const scoringPrompt = generateStandardProblemScoringPrompt({
    problem,
    userAnswer: answerText,
    targetDifficulty,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white px-5 py-3 rounded border border-slate-200 shadow-2xs">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          問題一覧へ戻る
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('answer')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'answer'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
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
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            答案・採点履歴 ({submissions.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus === 'saved' && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              保存完了
            </span>
          )}
          <button
            onClick={() => onEdit(problem)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-medium"
          >
            <Edit className="w-3.5 h-3.5" />
            問題を編集
          </button>
        </div>
      </div>

      {activeTab === 'answer' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Problem Stimulus & Content Blocks (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-5">
              {/* Problem Metadata Header */}
              <div className="border-b border-slate-100 pb-3 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                    {problem.field}
                  </span>
                  {(problem.tags && problem.tags.length > 0 ? problem.tags : ['作AI']).map((t) => (
                    <span
                      key={t}
                      className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]"
                    >
                      {t}
                    </span>
                  ))}
                  {problem.charLimit && (
                    <span className="font-mono text-purple-700 font-bold bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-[11px]">
                      指定: {problem.charLimit}字以内
                    </span>
                  )}
                  {problem.pointsAllocated && (
                    <span className="text-slate-500 font-mono text-[11px]">
                      配点: {problem.pointsAllocated}点
                    </span>
                  )}
                </div>

                <h2 className="text-lg font-bold text-slate-900">{problem.title}</h2>

                {problem.theme && (
                  <div className="text-xs text-slate-500">
                    テーマ: {problem.theme}
                  </div>
                )}
              </div>

              {/* Common Materials for the overarching 大問 */}
              {problem.commonMaterials && problem.commonMaterials.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <ContentBlockRenderer
                    blocks={problem.commonMaterials}
                    title="【大問共通資料・実験背景】"
                  />
                </div>
              )}

              {/* Subquestion Content Blocks */}
              <div className="space-y-4">
                <ContentBlockRenderer
                  blocks={problem.contentBlocks}
                  title="【設問・実験条件】"
                />
              </div>

              {/* Model Answer Toggle */}
              <div className="pt-4 border-t border-slate-200">
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
                      模範解答・採点基準を表示する
                    </>
                  )}
                </button>

                {showModelAnswer && (
                  <div className="mt-3 space-y-3 text-xs animate-in fade-in duration-150">
                    {problem.framework && problem.framework.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded border border-slate-200">
                        <div className="font-bold text-slate-700 mb-1">【論述の骨組み】</div>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                          {problem.framework.map((f, fi) => (
                            <li key={fi}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded">
                      <div className="font-bold text-emerald-950 mb-1 flex items-center justify-between">
                        <span>【模範解答】</span>
                        <span className="text-[10px] font-mono text-emerald-800">
                          {problem.modelAnswer.length}字
                        </span>
                      </div>
                      <div className="text-emerald-900 leading-relaxed font-sans whitespace-pre-wrap">
                        {problem.modelAnswer}
                      </div>
                    </div>

                    {problem.gradingRubric && problem.gradingRubric.length > 0 && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded text-amber-950">
                        <div className="font-bold text-amber-900 mb-1">【採点基準・配点】</div>
                        <ul className="list-disc list-inside space-y-0.5">
                          {problem.gradingRubric.map((r, ri) => (
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

          {/* Right Column: Answer Sheet & External AI Grading (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4 sticky top-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">答案入力欄</label>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isOverLimit ? 'text-red-600' : 'text-slate-700'
                    }`}
                  >
                    {currentCharCount} {charLimit ? `/ ${charLimit}` : ''} 字
                  </span>
                  {isOverLimit && (
                    <span className="text-[11px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                      字数超過!
                    </span>
                  )}
                </div>
              </div>

              {/* Textarea */}
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="ここに解答を入力してください。大問共通資料および実験条件を踏まえ、指定語句・因果関係を正確に記述しましょう..."
                className={`w-full h-64 p-4 border rounded-md text-sm font-sans leading-relaxed focus:outline-none transition-colors resize-none ${
                  isOverLimit
                    ? 'border-red-400 focus:ring-2 focus:ring-red-200 bg-red-50/20'
                    : 'border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 bg-white'
                }`}
              />

              {/* Self Rating */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100 text-xs">
                <span className="text-slate-700 font-medium">
                  自己評価点 (満点 {problem.pointsAllocated || 10}点):
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max={problem.pointsAllocated || 10}
                    step="1"
                    value={selfScore}
                    onChange={(e) => setSelfScore(parseInt(e.target.value, 10))}
                    className="w-24 accent-emerald-600 cursor-pointer"
                  />
                  <span className="font-mono font-bold text-slate-900 w-10 text-right">
                    {selfScore} 点
                  </span>
                </div>
              </div>

              {/* Primary Actions */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => handleSaveAnswer()}
                    disabled={!answerText.trim()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    答案を履歴に保存
                  </button>

                  <button
                    onClick={() => setIsPromptModalOpen(true)}
                    disabled={!answerText.trim()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors shadow-xs"
                  >
                    <Sparkles className="w-4 h-4" />
                    採点依頼プロンプト生成
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
                    AI採点結果を取り込む
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Tab: Past Submissions */
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                過去の答案・AI採点履歴 ({submissions.length}件)
              </h4>
              <p className="text-xs text-slate-500">
                作成した答案と、外部AIから取り込んだ添削記録が時系列で保存されています
              </p>
            </div>
          </div>

          {submissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              まだ保存された答案がありません。「答案作成」タブで答案を保存してください。
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub, idx) => (
                <div
                  key={sub.id || idx}
                  className="p-5 border border-slate-200 rounded-lg text-xs space-y-3 bg-slate-50/50"
                >
                  <div className="flex items-center justify-between text-slate-500 border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-semibold text-slate-700">
                        {new Date(sub.createdAt).toLocaleString('ja-JP')}
                      </span>
                      <span className="text-slate-400">({sub.charCount}文字)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {sub.selfRating !== undefined && (
                        <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          自己評価: {sub.selfRating}点
                        </span>
                      )}
                      {sub.aiFeedback?.estimatedScore && (
                        <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          AI推定: {sub.aiFeedback.estimatedScore}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submission Answer */}
                  <div>
                    <div className="text-slate-600 font-bold mb-1">【提出答案】</div>
                    <div className="p-3.5 bg-white rounded border border-slate-200 text-slate-900 leading-relaxed font-sans whitespace-pre-wrap">
                      {sub.answerText}
                    </div>
                  </div>

                  {/* AI Feedback Details if present */}
                  {sub.aiFeedback && (
                    <div className="p-4 bg-emerald-50/50 rounded border border-emerald-200/80 space-y-2.5">
                      <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-700" />
                        AI採点・添削フィードバック
                      </div>

                      {sub.aiFeedback.reasons && (
                        <p className="text-slate-700 whitespace-pre-wrap">
                          {sub.aiFeedback.reasons}
                        </p>
                      )}

                      {sub.aiFeedback.pros && sub.aiFeedback.pros.length > 0 && (
                        <div className="text-blue-900">
                          <span className="font-bold">・良かった点: </span>
                          <span>{sub.aiFeedback.pros.join('； ')}</span>
                        </div>
                      )}

                      {sub.aiFeedback.cons && sub.aiFeedback.cons.length > 0 && (
                        <div className="text-amber-900">
                          <span className="font-bold">・不足点・減点: </span>
                          <span>{sub.aiFeedback.cons.join('； ')}</span>
                        </div>
                      )}

                      {sub.aiFeedback.improvedAnswer && (
                        <div className="mt-2 p-2.5 bg-white rounded border border-emerald-200 text-emerald-950">
                          <span className="font-bold">【改善模範答案】</span>
                          <p className="mt-1 font-sans">{sub.aiFeedback.improvedAnswer}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* External AI Scoring Prompt Modal */}
      <PromptCopyModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        title="生物論述問題 外部AI採点プロンプト (出題：作AI)"
        description="共通資料・設問文・採点基準・あなたの答案が自動挿入されています（※大学名は一切含まれません）"
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
        problemTitle={problem.title}
      />
    </div>
  );
};
