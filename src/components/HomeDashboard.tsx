/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  KnowledgeCard,
  StandardProblem,
  ProblemSubmission,
  BIOLOGY_FIELDS,
} from '../types';
import {
  BookOpen,
  PenTool,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Flame,
  Award,
  Layers,
} from 'lucide-react';

interface HomeDashboardProps {
  cards: KnowledgeCard[];
  problems: StandardProblem[];
  submissions: ProblemSubmission[];
  onNavigate: (tab: 'home' | 'knowledge' | 'standard' | 'analytics' | 'settings') => void;
  onStartDueReview: () => void;
  onSelectProblem: (problem: StandardProblem) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  cards,
  problems,
  submissions,
  onNavigate,
  onStartDueReview,
  onSelectProblem,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. 今日の復習予定カード数
  const dueCards = useMemo(() => {
    return cards.filter((c) => c.nextReviewDate <= todayStr);
  }, [cards, todayStr]);

  // 2. 復習期限超過カード数 (yesterday or earlier)
  const overdueCards = useMemo(() => {
    return cards.filter((c) => c.nextReviewDate < todayStr);
  }, [cards, todayStr]);

  // 3. 今日学習したカード数
  const studiedTodayCount = useMemo(() => {
    return cards.reduce((acc, c) => {
      const todayLogs = (c.history || []).filter((h) => h.date.startsWith(todayStr));
      return acc + todayLogs.length;
    }, 0);
  }, [cards, todayStr]);

  // 4. 分野別習熟度
  const fieldMastery = useMemo(() => {
    return BIOLOGY_FIELDS.map((field) => {
      const fieldCards = cards.filter((c) => c.field === field);
      const total = fieldCards.length;
      const mastered = fieldCards.filter((c) => c.mastery === 'mastered').length;
      const rate = total > 0 ? Math.round((mastered / total) * 100) : 0;
      return { field, total, mastered, rate };
    }).filter((f) => f.total > 0);
  }, [cards]);

  // Total mastered cards
  const totalMastered = cards.filter((c) => c.mastery === 'mastered').length;
  const overallMasteryRate = cards.length > 0 ? Math.round((totalMastered / cards.length) * 100) : 0;

  // Recent Submissions / Activities
  const recentSubmissions = useMemo(() => {
    return [...submissions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
  }, [submissions]);

  return (
    <div className="space-y-6">
      {/* Hero Welcome & Quick Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 text-white p-6 sm:p-7 rounded-xl shadow-sm border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Flame className="w-4 h-4 fill-emerald-400" />
            <span>難関大学受験生物・記述論述学習システム</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            大学受験生物 論述対策ダッシュボード
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            知識の定着から東大・京大・医学部レベルの答案作成・復習まで一元管理。
            外部AI（Google AI Studio）と連携し、添削と演習を反復しましょう。
          </p>
        </div>

        {/* Due review quick button */}
        <div className="w-full md:w-auto bg-slate-800/80 p-4 rounded-lg border border-slate-700/80 flex flex-col items-center justify-center gap-2.5 text-center min-w-[210px]">
          <div className="text-xs text-slate-300 font-medium">今日の復習予定</div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">
            {dueCards.length}
            <span className="text-xs font-normal text-slate-300 ml-1">枚</span>
          </div>
          <button
            onClick={onStartDueReview}
            disabled={cards.length === 0}
            className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" />
            <span>今すぐ復習を開始</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Today Studied */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>今日学習したカード</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {studiedTodayCount}
            <span className="text-xs font-normal text-slate-500 ml-1">枚</span>
          </div>
          <div className="text-[11px] text-slate-500">
            今日の復習済みログ
          </div>
        </div>

        {/* Total Knowledge Cards */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>登録知識論述カード</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {cards.length}
            <span className="text-xs font-normal text-slate-500 ml-1">枚</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">
            全習熟度: {overallMasteryRate}% ({totalMastered}枚習得)
          </div>
        </div>

        {/* Standard Problems */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>登録入試論述問題</span>
            <PenTool className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {problems.length}
            <span className="text-xs font-normal text-slate-500 ml-1">問</span>
          </div>
          <div className="text-[11px] text-slate-500">
            累計答案数: {submissions.length}件
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>復習期限超過カード</span>
            <AlertTriangle className={`w-4 h-4 ${overdueCards.length > 0 ? 'text-amber-500' : 'text-slate-300'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono ${overdueCards.length > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {overdueCards.length}
            <span className="text-xs font-normal text-slate-500 ml-1">枚</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {overdueCards.length > 0 ? '早めの再復習を推奨' : '遅延なし・順調'}
          </div>
        </div>
      </div>

      {/* Main Two Columns: Field Mastery & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Field Mastery Progress (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">生物分野別の習熟度</h3>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-0.5"
            >
              詳細分析
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {fieldMastery.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              まだカードが登録されていません。
            </div>
          ) : (
            <div className="space-y-3">
              {fieldMastery.map((item) => (
                <div key={item.field} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold text-slate-800">{item.field}</span>
                    <span className="text-slate-500 font-mono">
                      {item.mastered} / {item.total} 枚 ({item.rate}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick Entry & Recent Submissions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Jump Buttons */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              クイックアクセス
            </h3>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <button
                onClick={() => onNavigate('knowledge')}
                className="flex items-center justify-between p-3 rounded border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 group-hover:text-emerald-800">
                      知識論述部門
                    </div>
                    <div className="text-[11px] text-slate-500">
                      階層教材・フラッシュカード・総合論述
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </button>

              <button
                onClick={() => onNavigate('standard')}
                className="flex items-center justify-between p-3 rounded border border-slate-200 hover:border-blue-600 hover:bg-blue-50/40 transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-50 text-blue-800 rounded">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 group-hover:text-blue-800">
                      通常の論述問題部門
                    </div>
                    <div className="text-[11px] text-slate-500">
                      大学別大問・小問・図表考察・答案作成
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </button>
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                最近の答案作成履歴
              </h3>
              <span className="text-[11px] text-slate-400">最新4件</span>
            </div>

            {recentSubmissions.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                まだ保存された答案はありません。
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {recentSubmissions.map((sub) => {
                  const prob = problems.find((p) => p.id === sub.problemId);
                  return (
                    <div
                      key={sub.id}
                      onClick={() => prob && onSelectProblem(prob)}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 truncate max-w-[200px]">
                          {prob ? prob.title : '論述問題'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(sub.createdAt).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      <p className="text-slate-600 line-clamp-1 text-[11px]">
                        {sub.answerText}
                      </p>
                      {sub.aiFeedback?.estimatedScore && (
                        <div className="text-[10px] text-emerald-700 font-bold">
                          AI推定得点: {sub.aiFeedback.estimatedScore}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
