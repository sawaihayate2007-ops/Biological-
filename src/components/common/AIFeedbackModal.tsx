/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AIFeedbackResult } from '../../types';
import { parseAIFeedbackMarkdown } from '../../services/markdownParser';
import { X, CheckCircle, AlertCircle, FileText, ArrowRight, Award, Lightbulb } from 'lucide-react';

interface AIFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveFeedback: (feedback: AIFeedbackResult) => void;
  problemTitle?: string;
}

export const AIFeedbackModal: React.FC<AIFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSaveFeedback,
  problemTitle,
}) => {
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<AIFeedbackResult | null>(null);
  const [previewTab, setPreviewTab] = useState<'parsed' | 'raw'>('parsed');

  if (!isOpen) return null;

  const handleParse = () => {
    if (!rawText.trim()) return;
    const result = parseAIFeedbackMarkdown(rawText);
    setParsed(result);
  };

  const handleConfirmSave = () => {
    if (!parsed) return;
    onSaveFeedback(parsed);
    onClose();
    setRawText('');
    setParsed(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
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
              外部AIの採点結果を取り込む
            </h3>
            {problemTitle && (
              <p className="text-xs text-slate-500 mt-0.5">対象問題: {problemTitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!parsed ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Google AI Studio等の出力を貼り付けてください
                </label>
                <span className="text-xs text-slate-400">Markdown形式</span>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Google AI Studioで生成された採点・添削Markdown全文をここに貼り付け..."
                className="w-full h-80 p-4 border border-slate-200 rounded text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none bg-slate-50/50"
              />
              <div className="bg-slate-50 p-3 rounded border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  推定得点、評価理由、良かった点、不足点・減点箇所、生物学的な誤り、改善答案などを自動認識して構造化プレビューします。
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewTab('parsed')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors ${
                      previewTab === 'parsed'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    解析プレビュー
                  </button>
                  <button
                    onClick={() => setPreviewTab('raw')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors ${
                      previewTab === 'raw'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    貼り付け原文 ({rawText.length}文字)
                  </button>
                </div>
                <button
                  onClick={() => setParsed(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  貼り付け直す
                </button>
              </div>

              {previewTab === 'parsed' ? (
                <div className="space-y-4 text-xs">
                  {/* Score badge */}
                  {parsed.estimatedScore && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-700" />
                        <span className="font-bold text-emerald-900 text-sm">
                          AI推定得点・評価
                        </span>
                      </div>
                      <span className="text-base font-extrabold text-emerald-800 bg-white px-3 py-1 rounded shadow-2xs border border-emerald-200">
                        {parsed.estimatedScore}
                      </span>
                    </div>
                  )}

                  {/* Reasons */}
                  {parsed.reasons && (
                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="font-bold text-slate-800 mb-1">【評価理由・総評】</div>
                      <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {parsed.reasons}
                      </div>
                    </div>
                  )}

                  {/* Pros */}
                  {parsed.pros && parsed.pros.length > 0 && (
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded">
                      <div className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        良かった点・加点ポイント
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-blue-950">
                        {parsed.pros.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Cons & Mistakes */}
                  {parsed.cons && parsed.cons.length > 0 && (
                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded">
                      <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        不足点・減点箇所
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-amber-950">
                        {parsed.cons.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Biological Errors */}
                  {parsed.mistakes && parsed.mistakes.length > 0 && (
                    <div className="p-3 bg-red-50/60 border border-red-200 rounded">
                      <div className="font-bold text-red-900 mb-1">
                        生物学的な誤り・誤認
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-red-950">
                        {parsed.mistakes.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improved Answer */}
                  {parsed.improvedAnswer && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded">
                      <div className="font-bold text-emerald-950 mb-1">【改善模範答案】</div>
                      <div className="text-emerald-900 leading-relaxed font-sans bg-white p-2.5 rounded border border-emerald-200 whitespace-pre-wrap">
                        {parsed.improvedAnswer}
                      </div>
                    </div>
                  )}

                  {/* Next Goals */}
                  {parsed.nextGoals && (
                    <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-700">
                      <div className="font-bold text-slate-800 mb-1">【次回の課題・アドバイス】</div>
                      <div className="whitespace-pre-wrap">{parsed.nextGoals}</div>
                    </div>
                  )}
                </div>
              ) : (
                <pre className="p-4 bg-slate-900 text-slate-100 rounded text-xs font-mono overflow-auto max-h-96 whitespace-pre-wrap">
                  {rawText}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            ※AIの採点は学習参考情報です。答案と一緒に履歴へ保存されます。
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded"
            >
              キャンセル
            </button>
            {!parsed ? (
              <button
                onClick={handleParse}
                disabled={!rawText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors shadow-xs"
              >
                <FileText className="w-4 h-4" />
                解析してプレビュー
              </button>
            ) : (
              <button
                onClick={handleConfirmSave}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition-colors shadow-xs"
              >
                <CheckCircle className="w-4 h-4" />
                この採点結果を答案履歴に保存
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
