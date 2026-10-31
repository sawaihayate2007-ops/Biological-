/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  StandardProblem,
  BiologyField,
  BIOLOGY_FIELDS,
} from '../../types';
import { StandardProblemEditor } from './StandardProblemEditor';
import { StandardImportModal } from './StandardImportModal';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Search,
  Plus,
  Sparkles,
  BookOpen,
  Filter,
  Trash2,
  Edit2,
  Clock,
  PenTool,
  Tag as TagIcon,
} from 'lucide-react';

interface StandardProblemListViewProps {
  problems: StandardProblem[];
  submissionsCountMap: Record<string, number>;
  onSelectProblem: (problem: StandardProblem) => void;
  onSaveProblem: (problem: StandardProblem) => Promise<void>;
  onDeleteProblem: (id: string) => Promise<void>;
  aiStudioUrl: string;
}

export const StandardProblemListView: React.FC<StandardProblemListViewProps> = ({
  problems,
  submissionsCountMap,
  onSelectProblem,
  onSaveProblem,
  onDeleteProblem,
  aiStudioUrl,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedField, setSelectedField] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<StandardProblem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // All available tags across all problems (university names, unit names, etc.)
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    problems.forEach((p) => {
      (p.tags || []).forEach((t) => set.add(t));
      if (p.university && p.university !== '作AI') set.add(p.university);
      if (p.unit) set.add(p.unit);
    });
    return Array.from(set).sort();
  }, [problems]);

  // Filtered problems
  const filtered = useMemo(() => {
    return problems.filter((p) => {
      if (selectedField !== 'all' && p.field !== selectedField) return false;

      const problemTags = p.tags || [];
      if (selectedTag !== 'all') {
        const hasTag =
          problemTags.includes(selectedTag) ||
          p.university === selectedTag ||
          p.unit === selectedTag;
        if (!hasTag) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = (p.title || '').toLowerCase().includes(q);
        const inField = (p.field || '').toLowerCase().includes(q);
        const inTheme = (p.theme || '').toLowerCase().includes(q);
        const inTags = problemTags.some((t) => t.toLowerCase().includes(q));
        const inBlocks = p.contentBlocks.some((b) => (b.content || '').toLowerCase().includes(q));
        if (!inTitle && !inField && !inTheme && !inTags && !inBlocks) {
          return false;
        }
      }

      return true;
    });
  }, [problems, selectedField, selectedTag, searchQuery]);

  const confirmDelete = async () => {
    if (deletingId) {
      await onDeleteProblem(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">通常の論述問題部門</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
              登録問題数: {problems.length}問
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            大学名や単元名はタグとして柔軟に整理。外部AI（作AI）による作問・採点連携対応
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* AI Generator / Import */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-bold transition-colors shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>外部AI作問 / Markdown取り込み</span>
          </button>

          {/* Add New */}
          <button
            onClick={() => {
              setEditingProblem(null);
              setIsEditorOpen(true);
            }}
            className="flex items-center justify-center gap-1 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>新規問題登録</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="タイトル、タグ（大学名・単元名）、問題文、テーマで検索..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-emerald-600 bg-slate-50/50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[11px] font-bold text-slate-500 mb-1 block">生物分野</label>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded bg-white text-slate-700 focus:border-emerald-600 focus:outline-none"
            >
              <option value="all">全分野 ({problems.length})</option>
              {BIOLOGY_FIELDS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 mb-1 block flex items-center gap-1">
              <TagIcon className="w-3 h-3 text-emerald-600" />
              <span>タグで絞り込み（大学名・単元名等）</span>
            </label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded bg-white text-slate-700 focus:border-emerald-600 focus:outline-none"
            >
              <option value="all">すべてのタグ ({availableTags.length}種類)</option>
              {availableTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Problem Cards List */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">該当する論述問題が見つかりません</h3>
          <p className="text-xs text-slate-500 mt-1">
            検索条件を調整するか、「新規問題登録」または「外部AI作問」から問題を追加してください。
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((prob) => {
            const submissionsCount = submissionsCountMap[prob.id] || 0;
            const displayTags = prob.tags && prob.tags.length > 0
              ? prob.tags
              : [prob.field];

            return (
              <div
                key={prob.id}
                className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div
                  className="space-y-2 flex-1 cursor-pointer"
                  onClick={() => onSelectProblem(prob)}
                >
                  {/* Tags Row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {prob.field}
                    </span>
                    {displayTags.map((t) => (
                      <span
                        key={t}
                        className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]"
                      >
                        {t}
                      </span>
                    ))}
                    {prob.charLimit && (
                      <span className="text-purple-700 font-bold font-mono text-[11px] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {prob.charLimit}字以内
                      </span>
                    )}
                  </div>

                  {/* Title & Theme */}
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-slate-900 hover:text-emerald-700 transition-colors">
                      {prob.title}
                    </h3>
                    {prob.theme && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        テーマ: {prob.theme}
                      </div>
                    )}
                  </div>

                  {/* Preview first text content */}
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {prob.contentBlocks.map((b) => b.content).join(' ')}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span>
                      コンテンツブロック: {prob.contentBlocks.length}個
                      {prob.commonMaterials ? ` (共通資料あり)` : ''}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-600">
                      <Clock className="w-3 h-3" />
                      答案履歴: {submissionsCount}回
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => onSelectProblem(prob)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition-colors shadow-xs"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    答案作成・演習
                  </button>

                  <button
                    onClick={() => {
                      setEditingProblem(prob);
                      setIsEditorOpen(true);
                    }}
                    title="問題を編集"
                    className="p-2 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeletingId(prob.id)}
                    title="問題を削除"
                    className="p-2 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      <StandardProblemEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingProblem(null);
        }}
        problem={editingProblem}
        onSave={onSaveProblem}
      />

      {/* Import Modal */}
      <StandardImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportProblem={async (prob) => {
          await onSaveProblem(prob);
          onSelectProblem(prob);
        }}
        aiStudioUrl={aiStudioUrl}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingId}
        title="論述問題の削除"
        message="この論述問題を削除してもよろしいですか？関連する答案履歴も削除されます。"
        confirmLabel="削除する"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
