/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Check, ExternalLink, X, Sparkles } from 'lucide-react';

interface PromptCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  promptText: string;
  aiStudioUrl: string;
}

export const PromptCopyModal: React.FC<PromptCopyModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  promptText,
  aiStudioUrl,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = promptText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenAIStudio = () => {
    window.open(aiStudioUrl || 'https://aistudio.google.com/u/2/prompts/new_chat', '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>
            ①「プロンプトをコピー」を押す → ②「Google AI Studioを開く」で外部AIへ貼り付けて実行
          </span>
          <span className="text-[11px] text-emerald-700 font-medium">※AI API連携不要</span>
        </div>

        {/* Prompt Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              プロンプト全文プレビュー ({promptText.length}文字)
            </label>
            <span className="text-xs text-slate-400">ワンタップで全文クリップボードへコピー可能</span>
          </div>
          <div className="relative">
            <pre className="w-full h-80 p-4 bg-slate-900 text-slate-100 rounded text-xs font-mono leading-relaxed overflow-y-auto whitespace-pre-wrap select-all selection:bg-emerald-600 selection:text-white border border-slate-800">
              {promptText}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            コピー後、AIの出力結果（Markdown）をアプリ内の取り込み欄に貼り付けてください。
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded text-sm font-semibold transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  コピー完了！
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
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 rounded text-sm font-semibold transition-colors hover:bg-slate-50 shadow-xs"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              Google AI Studioを開く
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
