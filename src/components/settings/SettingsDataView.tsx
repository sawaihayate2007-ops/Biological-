/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { AppSettings, DBExportData, TargetDifficulty, TARGET_DIFFICULTIES } from '../../types';
import { dbService } from '../../services/db';
import { TARGET_DIFFICULTY_PROFILES } from '../../services/promptGenerators';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Check,
  AlertTriangle,
  ExternalLink,
  Database,
  FileText,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Info,
} from 'lucide-react';

interface SettingsDataViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => Promise<void>;
  cardsCount: number;
  problemsCount: number;
  submissionsCount: number;
  onDataResetOrRestored: () => Promise<void>;
}

export const SettingsDataView: React.FC<SettingsDataViewProps> = ({
  settings,
  onUpdateSettings,
  cardsCount,
  problemsCount,
  submissionsCount,
  onDataResetOrRestored,
}) => {
  const [aiStudioUrl, setAiStudioUrl] = useState(settings.aiStudioUrl);
  const [targetDifficulty, setTargetDifficulty] = useState<TargetDifficulty>(
    settings.targetDifficulty || '北大前期'
  );
  const [dailyGoal, setDailyGoal] = useState(settings.dailyGoalCards || 15);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Modals & Action States
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<DBExportData | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDifficultySelect = async (diff: TargetDifficulty) => {
    setTargetDifficulty(diff);
    await onUpdateSettings({
      ...settings,
      targetDifficulty: diff,
    });
    setActionMessage(`想定難易度を「${diff}」に変更しました。全プロンプトに即座に反映されます。`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings({
      ...settings,
      targetDifficulty,
      aiStudioUrl: aiStudioUrl.trim() || 'https://aistudio.google.com/u/2/prompts/new_chat',
      dailyGoalCards: Number(dailyGoal) || 15,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // 1. JSON Backup Export
  const handleExportBackup = async () => {
    try {
      const data = await dbService.exportAllData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `biology_essay_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setActionMessage('バックアップファイル（JSON）を出力しました。');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert('エクスポートに失敗しました: ' + err.message);
    }
  };

  // 2. Markdown Export
  const handleExportMarkdown = async () => {
    try {
      const md = await dbService.exportKnowledgeCardsAsMarkdown();
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `biology_knowledge_cards_${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
      setActionMessage('教材Markdownファイルを出力しました。');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert('Markdownエクスポートに失敗しました: ' + err.message);
    }
  };

  // 3. JSON File Select for Restore
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.knowledgeCards || !parsed.standardProblems) {
          throw new Error('無効なバックアップデータです。必要なデータが含まれていません。');
        }
        setPendingRestoreData(parsed);
        setIsRestoreConfirmOpen(true);
      } catch (err: any) {
        alert('ファイルの読み込みに失敗しました: ' + err.message);
      }
    };
    reader.readAsText(file);
    // Clear input value so same file can be selected again
    e.target.value = '';
  };

  // Confirm Restore
  const handleConfirmRestore = async () => {
    if (!pendingRestoreData) return;
    try {
      const res = await dbService.importAllData(pendingRestoreData);
      setIsRestoreConfirmOpen(false);
      setPendingRestoreData(null);
      await onDataResetOrRestored();
      setActionMessage(`復元完了: カード ${res.cardsCount}枚、論述問題 ${res.problemsCount}問 を復元しました。`);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert('復元エラー: ' + err.message);
    }
  };

  // Reset to Sample Preset
  const handleConfirmReset = async () => {
    try {
      await dbService.resetToSampleData();
      setIsResetConfirmOpen(false);
      await onDataResetOrRestored();
      setActionMessage('東大・京大などの標準サンプル問題・知識カードにリセットしました。');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert('リセットエラー: ' + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" />
          設定・データ管理
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          IndexedDBによるブラウザ内完全永続化、バックアップエクスポート、外部AIの連携URL設定
        </p>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          {actionMessage}
        </div>
      )}

      {/* Storage Status Overview */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
          <Database className="w-4 h-4 text-emerald-600" />
          ブラウザ内保存状況 (IndexedDB)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 font-medium">知識論述カード</span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{cardsCount} 枚</div>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 font-medium">大学別論述問題</span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{problemsCount} 問</div>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 font-medium">作成答案・AI添削履歴</span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{submissionsCount} 件</div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 pt-1">
          ※すべてのデータはブラウザのIndexedDBに安全に保存されており、ページ再読み込み後も消えません。
        </p>
      </div>

      {/* Backup and Restore */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
          <Download className="w-4 h-4 text-emerald-600" />
          データバックアップ & 復元
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* JSON Export */}
          <div className="p-4 border border-slate-200 rounded-lg space-y-2">
            <div className="font-bold text-slate-800">全データ完全バックアップ (JSON)</div>
            <p className="text-slate-500 text-[11px]">
              すべての問題、カード、学習履歴、答案、設定を1つのJSONファイルとしてダウンロードします。
            </p>
            <button
              onClick={handleExportBackup}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              JSONバックアップをダウンロード
            </button>
          </div>

          {/* JSON Restore */}
          <div className="p-4 border border-slate-200 rounded-lg space-y-2">
            <div className="font-bold text-slate-800">バックアップから復元 (JSON)</div>
            <p className="text-slate-500 text-[11px]">
              以前ダウンロードしたJSONバックアップファイルを読み込み、データを復元します（確認画面あり）。
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-bold shadow-2xs transition-colors"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              JSONファイルを選択して復元
            </button>
          </div>
        </div>

        {/* Markdown Export */}
        <div className="p-4 border border-slate-200 rounded-lg space-y-2 text-xs">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-600" />
            知識論述カードのMarkdownエクスポート
          </div>
          <p className="text-slate-500 text-[11px]">
            全知識論述カードを標準見出し規格（分野・章・テーマ・カード）に則ったMarkdownファイルとして出力します。
          </p>
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            Markdown形式でダウンロード
          </button>
        </div>
      </div>

      {/* External AI Settings */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-emerald-600" />
            外部AI連携 & 想定難易度設定
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            すべての外部AI用プロンプト（作問・採点・教材生成）に共通して適用される想定難易度および連携先URLの設定
          </p>
        </div>

        {/* 1. Common Target Difficulty Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              <span>全プロンプト共通の「想定難易度」設定</span>
            </label>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              現在適用中: {targetDifficulty}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TARGET_DIFFICULTIES.map((diff) => {
              const isSelected = targetDifficulty === diff;
              const profile = TARGET_DIFFICULTY_PROFILES[diff];

              return (
                <div
                  key={diff}
                  onClick={() => handleDifficultySelect(diff)}
                  className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-200'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900">{diff}</span>
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-slate-300" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-emerald-800 leading-snug">
                      {profile.shortDesc}
                    </p>
                    <div className="space-y-1.5 pt-1 text-[11px] text-slate-600 leading-relaxed border-t border-slate-100">
                      <div>
                        <strong className="text-slate-800">要求水準: </strong>
                        {profile.requiredStandard}
                      </div>
                      <div>
                        <strong className="text-slate-800">論理・因果: </strong>
                        {profile.logicRequirement}
                      </div>
                      <div>
                        <strong className="text-slate-800">採点厳しさ: </strong>
                        {profile.rubricStrictness}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span>模範解答: {profile.modelAnswerQuality.slice(0, 24)}...</span>
                    {isSelected && (
                      <span className="font-bold text-emerald-700">選択中</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-700 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              <span>プロンプト埋め込みと採点についての注意事項</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-500 pl-1">
              <li>難易度を変更すると、通常論述問題・知識論述カードの作問・採点など、すべてのプロンプトに即座に反映されます。</li>
              <li>採点プロンプトでは実際の大学公式基準を偽らず、想定難易度に応じた学習用参考評価であることを明記します。</li>
              <li>出題自体の指定字数や条件を最優先とし、難易度設定のみを理由に条件を変更しないようAIに指示されます。</li>
            </ul>
          </div>
        </div>

        {/* 2. URL & Goal Form */}
        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Google AI Studio 遷移先URL</label>
            <input
              type="url"
              value={aiStudioUrl}
              onChange={(e) => setAiStudioUrl(e.target.value)}
              placeholder="https://aistudio.google.com/u/2/prompts/new_chat"
              className="w-full p-2.5 border border-slate-300 rounded text-slate-800 font-mono text-xs focus:border-emerald-600 focus:outline-none"
              required
            />
            <p className="text-[11px] text-slate-500">
              ※標準はGoogle AI Studioの新規チャットプロンプト画面です。必要に応じて変更可能です。
            </p>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">1日の学習目標カード数</label>
            <input
              type="number"
              min="1"
              max="100"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              className="w-32 p-2 border border-slate-300 rounded text-slate-800 font-mono text-xs focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              ※本アプリ内にAI APIキーや通信機能は一切存在しません。
            </span>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold shadow-xs transition-colors"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  設定保存完了！
                </>
              ) : (
                '設定を保存する'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Reset Preset Sample Data */}
      <div className="bg-white p-5 rounded-lg border border-red-200/60 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-red-600" />
          初期サンプル問題データへの復元
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          東京大学・京都大学の論述過去問や、ラクトースオペロン・光合成・神経などの知識論述カード（難関大標準セット）にリセットします。
          現在の追加データは上書きされますので、必要に応じて事前にバックアップ（JSON）を保存してください。
        </p>
        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 rounded text-xs font-bold transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          初期サンプルデータにリセット
        </button>
      </div>

      {/* Confirm Restore Modal */}
      <ConfirmModal
        isOpen={isRestoreConfirmOpen}
        title="バックアップデータの復元"
        message={`バックアップファイルからデータを復元しますか？\n（既存のデータは置き換えられます。カード数: ${pendingRestoreData?.knowledgeCards?.length || 0}枚、問題数: ${pendingRestoreData?.standardProblems?.length || 0}問）`}
        confirmLabel="復元を実行する"
        isDestructive={true}
        onConfirm={handleConfirmRestore}
        onCancel={() => {
          setIsRestoreConfirmOpen(false);
          setPendingRestoreData(null);
        }}
      />

      {/* Confirm Reset Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="初期サンプルデータへのリセット"
        message="すべてのデータを初期サンプルセット（東大・京大等の過去問・頻出知識カード）に戻しますか？現在のデータは上書きされます。"
        confirmLabel="リセットする"
        isDestructive={true}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
