/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  KnowledgeCard,
  KnowledgeCardType,
  BiologyField,
  BIOLOGY_FIELDS,
  DifficultyLevel,
  CARD_TYPE_LABELS,
} from '../../types';
import { KnowledgeImportModal } from './KnowledgeImportModal';
import { KnowledgeCardEditorModal } from './KnowledgeCardEditorModal';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Search,
  Plus,
  Sparkles,
  BookOpen,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  Download,
  Trash2,
  Edit2,
  Copy,
  PenTool,
  ChevronRight,
  FolderTree,
  RotateCw,
} from 'lucide-react';

interface KnowledgeListViewProps {
  cards: KnowledgeCard[];
  onSaveCard: (card: KnowledgeCard) => Promise<void>;
  onDeleteCard: (id: string) => Promise<void>;
  onImportBatch: (cards: KnowledgeCard[]) => Promise<void>;
  onStartStudy: (targetCards: KnowledgeCard[]) => void;
  onOpenComprehensive: (card: KnowledgeCard) => void;
  onExportMarkdown: (field?: BiologyField) => Promise<void>;
  aiStudioUrl: string;
}

export const KnowledgeListView: React.FC<KnowledgeListViewProps> = ({
  cards,
  onSaveCard,
  onDeleteCard,
  onImportBatch,
  onStartStudy,
  onOpenComprehensive,
  onExportMarkdown,
  aiStudioUrl,
}) => {
  // Filters
  const [selectedField, setSelectedField] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMastery, setSelectedMastery] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<KnowledgeCard | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (selectedField !== 'all' && card.field !== selectedField) return false;
      if (selectedType !== 'all' && card.type !== selectedType) return false;
      if (selectedDifficulty !== 'all' && card.difficulty !== selectedDifficulty) return false;

      if (selectedMastery === 'due') {
        return card.nextReviewDate <= todayStr;
      } else if (selectedMastery === 'mastered') {
        return card.mastery === 'mastered';
      } else if (selectedMastery === 'learning') {
        return card.mastery === 'learning';
      } else if (selectedMastery === 'unlearned') {
        return card.mastery === 'unlearned';
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = card.title.toLowerCase().includes(q);
        const inQuestion = card.question.toLowerCase().includes(q);
        const inChapter = card.chapter.toLowerCase().includes(q);
        const inTheme = card.theme.toLowerCase().includes(q);
        const inTerms = (card.keyTerms || []).some((t) => t.toLowerCase().includes(q));
        const inTags = (card.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inQuestion && !inChapter && !inTheme && !inTerms && !inTags) {
          return false;
        }
      }

      return true;
    });
  }, [cards, selectedField, selectedType, selectedMastery, selectedDifficulty, searchQuery, todayStr]);

  // Due count
  const dueCards = useMemo(() => {
    return cards.filter((c) => c.nextReviewDate <= todayStr);
  }, [cards, todayStr]);

  // Group filtered cards by Field -> Chapter -> Theme for structured display
  const groupedStructure = useMemo(() => {
    const map = new Map<string, Map<string, Map<string, KnowledgeCard[]>>>();

    filteredCards.forEach((c) => {
      const f = c.field;
      const ch = c.chapter || '未分類の章';
      const th = c.theme || '未分類のテーマ';

      if (!map.has(f)) map.set(f, new Map());
      const fMap = map.get(f)!;

      if (!fMap.has(ch)) fMap.set(ch, new Map());
      const chMap = fMap.get(ch)!;

      if (!chMap.has(th)) chMap.set(th, []);
      chMap.get(th)!.push(c);
    });

    return map;
  }, [filteredCards]);

  const handleDuplicateCard = async (card: KnowledgeCard) => {
    const duplicated: KnowledgeCard = {
      ...card,
      id: `kc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${card.title} (複製)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mastery: 'unlearned',
      intervalDays: 1,
      nextReviewDate: todayStr,
      reviewCount: 0,
      lapseCount: 0,
      history: [],
    };
    await onSaveCard(duplicated);
  };

  const confirmDelete = async () => {
    if (deletingCardId) {
      await onDeleteCard(deletingCardId);
      setDeletingCardId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Quick Actions */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">知識論述部門</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              全 {cards.length} 枚
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            基本・理解・応用・総合論述の4階層カードで、生物学の論理的知識を体系化
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Start Review Due */}
          <button
            onClick={() => onStartStudy(dueCards.length > 0 ? dueCards : cards)}
            disabled={cards.length === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition-colors shadow-xs"
          >
            <BookOpen className="w-4 h-4" />
            <span>
              今日の復習を開始 ({dueCards.length}枚)
            </span>
          </button>

          {/* AI Import & Prompt */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-bold transition-colors shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>外部AI教材作成 / 取り込み</span>
          </button>

          {/* Add Card */}
          <button
            onClick={() => {
              setEditingCard(null);
              setIsEditorOpen(true);
            }}
            className="flex items-center justify-center gap-1 px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>新規登録</span>
          </button>

          {/* Export Markdown */}
          <button
            onClick={() =>
              onExportMarkdown(selectedField !== 'all' ? (selectedField as BiologyField) : undefined)
            }
            title="Markdown形式でエクスポート"
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="タイトル、問題文、重要語句、タグ、章・テーマ名で検索..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-emerald-600 bg-slate-50/50"
          />
        </div>

        {/* Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div>
            <label className="text-[11px] font-bold text-slate-500 mb-1 block">生物分野</label>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="w-full p-1.5 border border-slate-300 rounded bg-white text-slate-700"
            >
              <option value="all">全分野 ({cards.length})</option>
              {BIOLOGY_FIELDS.map((f) => {
                const count = cards.filter((c) => c.field === f).length;
                return (
                  <option key={f} value={f}>
                    {f} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 mb-1 block">カード種類</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-1.5 border border-slate-300 rounded bg-white text-slate-700"
            >
              <option value="all">全種類</option>
              <option value="basic">basic (基本)</option>
              <option value="understanding">understanding (理解)</option>
              <option value="application">application (応用)</option>
              <option value="comprehensive">comprehensive (総合論述)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 mb-1 block">復習・習熟度</label>
            <select
              value={selectedMastery}
              onChange={(e) => setSelectedMastery(e.target.value)}
              className="w-full p-1.5 border border-slate-300 rounded bg-white text-slate-700"
            >
              <option value="all">すべて</option>
              <option value="due">今日の復習予定 ({dueCards.length})</option>
              <option value="mastered">習得済み</option>
              <option value="learning">学習中</option>
              <option value="unlearned">未学習</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 mb-1 block">難易度</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full p-1.5 border border-slate-300 rounded bg-white text-slate-700"
            >
              <option value="all">すべての難易度</option>
              <option value="基礎">基礎</option>
              <option value="標準">標準</option>
              <option value="難関">難関</option>
              <option value="最難関">最難関</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Hierarchical Content List */}
      {filteredCards.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">該当するカードがありません</h3>
          <p className="text-xs text-slate-500 mt-1">
            検索条件を変更するか、右上の「外部AI教材作成 / 取り込み」から新しい教材を追加してください。
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedStructure.entries()).map(([field, chapters]) => (
            <div key={field} className="space-y-4">
              {/* Field Header */}
              <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-1.5 pt-2">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-600 rounded-xs" />
                  {field}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {Array.from(chapters.values()).reduce(
                    (acc, thMap) =>
                      acc +
                      Array.from(thMap.values()).reduce((sum, list) => sum + list.length, 0),
                    0
                  )}{' '}
                  枚
                </span>
              </div>

              {/* Chapters */}
              {Array.from(chapters.entries()).map(([chapter, themes]) => (
                <div key={chapter} className="ml-2 sm:ml-4 space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <FolderTree className="w-4 h-4 text-emerald-700" />
                    {chapter}
                  </h4>

                  {/* Themes */}
                  {Array.from(themes.entries()).map(([theme, cardList]) => {
                    const masteredCount = cardList.filter((c) => c.mastery === 'mastered').length;
                    const percent = Math.round((masteredCount / cardList.length) * 100);

                    return (
                      <div
                        key={theme}
                        className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden"
                      >
                        {/* Theme Header with Aggregate Stats */}
                        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 font-bold text-slate-800">
                            <span>{theme}</span>
                            <span className="text-slate-400 font-normal">({cardList.length}枚)</span>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Mastery bar */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-500">
                                習熟度: {masteredCount}/{cardList.length} ({percent}%)
                              </span>
                              <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-600 h-full rounded-full"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => onStartStudy(cardList)}
                              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 hover:underline"
                            >
                              このテーマを学習
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Cards in this Theme */}
                        <div className="divide-y divide-slate-100">
                          {cardList.map((card) => {
                            const isDue = card.nextReviewDate <= todayStr;
                            const typeMeta = CARD_TYPE_LABELS[card.type];

                            return (
                              <div
                                key={card.id}
                                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                              >
                                <div className="space-y-1 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-slate-600">
                                      [{card.type}]
                                    </span>
                                    <span className="font-bold text-slate-900 text-sm">
                                      {card.title}
                                    </span>
                                    <span className="text-slate-500 text-[11px]">
                                      難易度: {card.difficulty}
                                    </span>
                                    {card.charLimit && (
                                      <span className="text-slate-500 text-[11px] font-mono">
                                        {card.charLimit}字
                                      </span>
                                    )}
                                    {isDue && (
                                      <span className="bg-red-50 text-red-700 font-bold px-1.5 py-0.2 rounded border border-red-200 text-[10px]">
                                        今日復習
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-slate-600 line-clamp-1 pr-4">
                                    {card.question}
                                  </p>

                                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                                    <span>復習間隔: {card.intervalDays}日</span>
                                    <span>次回復習: {card.nextReviewDate}</span>
                                    <span>復習回数: {card.reviewCount}回</span>
                                    {card.mastery === 'mastered' && (
                                      <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                        <CheckCircle2 className="w-3 h-3" />
                                        習得済
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Row Actions */}
                                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                  {card.type === 'comprehensive' ? (
                                    <button
                                      onClick={() => onOpenComprehensive(card)}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded text-xs font-bold transition-colors shadow-2xs"
                                    >
                                      <PenTool className="w-3.5 h-3.5" />
                                      答案作成演習
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => onStartStudy([card])}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-xs font-bold transition-colors shadow-2xs"
                                    >
                                      <BookOpen className="w-3.5 h-3.5" />
                                      学習する
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleDuplicateCard(card)}
                                    title="カードを複製"
                                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setEditingCard(card);
                                      setIsEditorOpen(true);
                                    }}
                                    title="カードを編集"
                                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => setDeletingCardId(card.id)}
                                    title="カードを削除"
                                    className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Import Modal */}
      <KnowledgeImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportCards={onImportBatch}
        existingCards={cards}
        aiStudioUrl={aiStudioUrl}
      />

      {/* Editor Modal */}
      <KnowledgeCardEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingCard(null);
        }}
        card={editingCard}
        onSave={onSaveCard}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingCardId}
        title="カードの削除"
        message="この知識論述カードを削除してもよろしいですか？学習履歴も一緒に削除されます。"
        confirmLabel="削除する"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingCardId(null)}
      />
    </div>
  );
};
