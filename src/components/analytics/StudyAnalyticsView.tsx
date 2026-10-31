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
  CARD_TYPE_LABELS,
} from '../../types';
import {
  TrendingUp,
  BarChart2,
  Calendar,
  AlertTriangle,
  Award,
  BookOpen,
  PenTool,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

interface StudyAnalyticsViewProps {
  cards: KnowledgeCard[];
  problems: StandardProblem[];
  submissions: ProblemSubmission[];
}

export const StudyAnalyticsView: React.FC<StudyAnalyticsViewProps> = ({
  cards,
  problems,
  submissions,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. All unique study dates & total review sessions
  const { allSessions, uniqueDaysCount, dayCounts } = useMemo(() => {
    const sessions: { dateStr: string; rating: string; type: string }[] = [];
    const dateSet = new Set<string>();
    const counts: Record<string, number> = {};

    cards.forEach((c) => {
      (c.history || []).forEach((h) => {
        const dStr = h.date.split('T')[0];
        dateSet.add(dStr);
        counts[dStr] = (counts[dStr] || 0) + 1;
        sessions.push({ dateStr: dStr, rating: h.rating, type: c.type });
      });
    });

    submissions.forEach((s) => {
      const dStr = s.createdAt.split('T')[0];
      dateSet.add(dStr);
      counts[dStr] = (counts[dStr] || 0) + 1;
      sessions.push({ dateStr: dStr, rating: 'submission', type: 'standard' });
    });

    return {
      allSessions: sessions,
      uniqueDaysCount: dateSet.size,
      dayCounts: counts,
    };
  }, [cards, submissions]);

  // 2. Last 7 days activity chart
  const last7DaysData = useMemo(() => {
    const days: { label: string; date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const month = d.getMonth() + 1;
      const day = d.getDate();
      days.push({
        label: `${month}/${day}`,
        date: iso,
        count: dayCounts[iso] || 0,
      });
    }
    return days;
  }, [dayCounts]);

  // 3. Card Type breakdown (basic, understanding, application, comprehensive)
  const cardTypeStats = useMemo(() => {
    const types: ('basic' | 'understanding' | 'application' | 'comprehensive')[] = [
      'basic',
      'understanding',
      'application',
      'comprehensive',
    ];

    return types.map((t) => {
      const tCards = cards.filter((c) => c.type === t);
      const total = tCards.length;
      const mastered = tCards.filter((c) => c.mastery === 'mastered').length;
      const learning = tCards.filter((c) => c.mastery === 'learning').length;
      const unlearned = tCards.filter((c) => c.mastery === 'unlearned').length;
      const rate = total > 0 ? Math.round((mastered / total) * 100) : 0;
      return {
        type: t,
        meta: CARD_TYPE_LABELS[t],
        total,
        mastered,
        learning,
        unlearned,
        rate,
      };
    });
  }, [cards]);

  // 4. Field Mastery Stats
  const fieldStats = useMemo(() => {
    return BIOLOGY_FIELDS.map((field) => {
      const fCards = cards.filter((c) => c.field === field);
      const total = fCards.length;
      const mastered = fCards.filter((c) => c.mastery === 'mastered').length;
      const rate = total > 0 ? Math.round((mastered / total) * 100) : 0;
      return { field, total, mastered, rate };
    }).filter((f) => f.total > 0);
  }, [cards]);

  // 5. Weak Themes (苦手テーマ: cards with highest lapseCount or uncertain ratings)
  const weakCards = useMemo(() => {
    return [...cards]
      .filter((c) => (c.lapseCount && c.lapseCount > 0) || c.mastery === 'learning')
      .sort((a, b) => (b.lapseCount || 0) - (a.lapseCount || 0))
      .slice(0, 5);
  }, [cards]);

  // 6. Overdue / Due status
  const dueCount = cards.filter((c) => c.nextReviewDate <= todayStr).length;
  const overdueCount = cards.filter((c) => c.nextReviewDate < todayStr).length;

  const max7DayCount = Math.max(...last7DaysData.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          学習分析 & 習熟度レポート
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          実際の復習ログ・答案履歴から計算された正確な学習データです（推計ダミーデータなし）
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
            <span>累計学習日数</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {uniqueDaysCount}
            <span className="text-xs font-normal text-slate-500 ml-1">日</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">学習を記録した日数</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
            <span>累計復習・演習回数</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {allSessions.length}
            <span className="text-xs font-normal text-slate-500 ml-1">回</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">全カード復習＋答案作成</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
            <span>作成答案数</span>
            <PenTool className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {submissions.length}
            <span className="text-xs font-normal text-slate-500 ml-1">通</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">入試論述答案の保存数</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
            <span>今日復習予定 / 超過</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {dueCount}
            <span className="text-xs font-normal text-amber-700 ml-1">
              (超過 {overdueCount})
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">間隔反復復習管理</div>
        </div>
      </div>

      {/* Recent 7 Days Activity Graph */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-emerald-600" />
            直近7日間の学習推移
          </h3>
          <span className="text-xs text-slate-500">1日あたりの復習回数</span>
        </div>

        <div className="h-44 w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-l border-slate-300 relative bg-slate-50/50">
          {last7DaysData.map((d, idx) => {
            const heightPercent = Math.max(6, (d.count / max7DayCount) * 85);
            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center justify-end h-full gap-1 group relative"
              >
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[32px] rounded-t transition-all ${
                    d.count > 0 ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-200'
                  }`}
                  title={`${d.date}: ${d.count}回`}
                >
                  {d.count > 0 && (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-700 font-mono">
                      {d.count}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-600 mt-1 font-mono">{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Columns: Card Type Stats & Field Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Card Types (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            カード種類別の正答・習得状況
          </h3>

          <div className="space-y-3.5 text-xs">
            {cardTypeStats.map((item) => (
              <div key={item.type} className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{item.meta.label}</span>
                  <span className="font-mono text-slate-600">
                    {item.mastered} / {item.total} 枚習得 ({item.rate}%)
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${item.rate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>習得済: {item.mastered}</span>
                  <span>学習中: {item.learning}</span>
                  <span>未着手: {item.unlearned}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Weak Cards (苦手テーマ) (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            苦手テーマ・要復習カード
          </h3>

          {weakCards.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              現在、忘却回数の多い苦手カードはありません。順調です！
            </p>
          ) : (
            <div className="space-y-2.5 text-xs">
              {weakCards.map((card) => (
                <div
                  key={card.id}
                  className="p-3 bg-amber-50/50 rounded border border-amber-200/80 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{card.title}</span>
                    <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
                      忘却回数: {card.lapseCount || 0}回
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    {card.field} ＞ {card.theme}
                  </div>
                  <p className="text-slate-700 line-clamp-1">{card.question}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
