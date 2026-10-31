/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  StandardProblem,
  ContentBlock,
  ContentBlockType,
  BiologyField,
  BIOLOGY_FIELDS,
} from '../../types';
import {
  X,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Type,
  Heading,
  Table as TableIcon,
  BarChart2,
  AlertCircle,
  Tag as TagIcon,
  Check,
} from 'lucide-react';

interface StandardProblemEditorProps {
  isOpen: boolean;
  onClose: () => void;
  problem?: StandardProblem | null;
  onSave: (problem: StandardProblem) => Promise<void>;
}

const COMMON_TAG_SUGGESTIONS = [
  // 大学名・出題元タグ
  '東京大学',
  '京都大学',
  '東北大学',
  '大阪大学',
  '名古屋大学',
  '北海道大学',
  '九州大学',
  '国公立医学部',
  '難関私大',
  '作AI',
  // 単元名・テーマタグ
  '遺伝情報の発現',
  'エピジェネティクス',
  '光合成と炭酸固定',
  '呼吸と発酵',
  '細胞膜と輸送',
  '神経伝達と興奮',
  '免疫と生体防御',
  '初期発生と誘導',
  '植物の環境応答',
  '個体群と生態系',
  '進化と系統分類',
];

export const StandardProblemEditor: React.FC<StandardProblemEditorProps> = ({
  isOpen,
  onClose,
  problem,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [field, setField] = useState<BiologyField>('分子生物学・遺伝情報');
  const [theme, setTheme] = useState('');
  const [charLimit, setCharLimit] = useState<string>('');
  const [pointsAllocated, setPointsAllocated] = useState<number>(10);

  // Tags (大学名、単元名、自由タグ)
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Content Blocks
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

  // Solution
  const [frameworkText, setFrameworkText] = useState('');
  const [modelAnswer, setModelAnswer] = useState('');
  const [rubricText, setRubricText] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (problem) {
      setTitle(problem.title || '');
      setField(problem.field || '分子生物学・遺伝情報');
      setTheme(problem.theme || '');
      setCharLimit(problem.charLimit ? String(problem.charLimit) : '');
      setPointsAllocated(problem.pointsAllocated || 10);

      // Collect tags from problem (and merge legacy university/unit if present)
      const initialTags: string[] = [...(problem.tags || [])];
      if (problem.university && problem.university !== '作AI' && !initialTags.includes(problem.university)) {
        initialTags.unshift(problem.university);
      }
      if (problem.unit && !initialTags.includes(problem.unit)) {
        initialTags.push(problem.unit);
      }
      setTags(initialTags.length > 0 ? initialTags : ['作AI']);

      setContentBlocks(
        problem.contentBlocks && problem.contentBlocks.length > 0
          ? problem.contentBlocks
          : [{ id: `cb-${Date.now()}-1`, type: 'text', content: '' }]
      );
      setFrameworkText((problem.framework || []).join('\n'));
      setModelAnswer(problem.modelAnswer || '');
      setRubricText((problem.gradingRubric || []).join('\n'));
    } else {
      setTitle('');
      setField('分子生物学・遺伝情報');
      setTheme('');
      setCharLimit('');
      setPointsAllocated(10);
      setTags(['作AI']);
      setContentBlocks([{ id: `cb-${Date.now()}-1`, type: 'text', content: '' }]);
      setFrameworkText('');
      setModelAnswer('');
      setRubricText('');
    }
  }, [problem, isOpen]);

  if (!isOpen) return null;

  // Add Tag
  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTagInput('');
  };

  // Remove Tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddBlock = (type: ContentBlockType) => {
    let newBlock: ContentBlock = {
      id: `cb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      content: '',
    };

    if (type === 'table') {
      newBlock.tableData = {
        headers: ['条件', '処理内容', '測定結果'],
        rows: [
          ['条件A', '対照群', '100%'],
          ['条件B', '阻害剤添加', '12%'],
        ],
        caption: '実験結果一覧',
      };
      newBlock.content = '実験データ表';
    } else if (type === 'graph') {
      newBlock.graphData = {
        title: '時間経過に伴う変化',
        type: 'line',
        labels: ['0分', '30分', '60分', '90分'],
        series: [
          { name: '対照群', values: [10, 45, 80, 85], color: '#10b981' },
          { name: '変異株', values: [10, 15, 20, 22], color: '#ef4444' },
        ],
      };
      newBlock.content = '時間変化グラフ';
    } else if (type === 'note') {
      newBlock.content = '※指定字数および使用すべき指定語句に留意すること。';
    }

    setContentBlocks([...contentBlocks, newBlock]);
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === contentBlocks.length - 1)
    ) {
      return;
    }
    const target = direction === 'up' ? index - 1 : index + 1;
    const next = [...contentBlocks];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    setContentBlocks(next);
  };

  const handleDeleteBlock = (index: number) => {
    if (contentBlocks.length <= 1) {
      alert('最低1つのブロックが必要です。');
      return;
    }
    setContentBlocks(contentBlocks.filter((_, i) => i !== index));
  };

  const handleUpdateBlockContent = (index: number, content: string) => {
    const next = [...contentBlocks];
    next[index] = { ...next[index], content };
    setContentBlocks(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !modelAnswer.trim()) {
      alert('問題タイトルと模範解答は必須です。');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedFramework = frameworkText
        .split('\n')
        .map((l) => l.replace(/^[-*・]\s*/, '').trim())
        .filter((l) => l.length > 0);

      const parsedRubric = rubricText
        .split('\n')
        .map((l) => l.replace(/^[-*・]\s*/, '').trim())
        .filter((l) => l.length > 0);

      const updatedProblem: StandardProblem = {
        id: problem ? problem.id : `sp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: title.trim(),
        field,
        theme: theme.trim() || undefined,
        tags: tags.length > 0 ? tags : ['作AI'],
        charLimit: charLimit ? parseInt(charLimit, 10) : undefined,
        pointsAllocated,
        source: '作AI',
        commonMaterials: problem?.commonMaterials,
        contentBlocks,
        framework: parsedFramework,
        modelAnswer: modelAnswer.trim(),
        gradingRubric: parsedRubric,
        createdAt: problem ? problem.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(updatedProblem);
      onClose();
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
        className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {problem ? '論述問題の編集' : '新規論述問題の登録'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              大学名・単元名はタグとして自由に管理し、テキスト・表・グラフ等のブロックで問題を構成します
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Metadata Section (Excluding blue circled legacy fields) */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-700">【基本情報・分類】</h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-700 font-bold mb-1 block">生物分野</label>
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

              <div>
                <label className="text-slate-700 font-bold mb-1 block">テーマ名（任意）</label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="例: ラクトースオペロンの変異株考察"
                  className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-bold mb-1 block">指定字数</label>
                  <input
                    type="number"
                    value={charLimit}
                    onChange={(e) => setCharLimit(e.target.value)}
                    placeholder="例: 90"
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold mb-1 block">配点</label>
                  <input
                    type="number"
                    value={pointsAllocated}
                    onChange={(e) => setPointsAllocated(parseInt(e.target.value, 10) || 10)}
                    placeholder="10"
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-slate-700 font-bold mb-1 block">問題タイトル</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 真核生物における転写抑制因子とクロマチン構造の変化"
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm font-semibold focus:border-emerald-600 focus:outline-none"
                required
              />
            </div>

            {/* Tag Management: 大学名・単元名・自由タグ */}
            <div className="pt-2 border-t border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-bold flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>タグ（大学名・単元名・出題元・重要キーワード）</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  タグは自由に追加・削除できます
                </span>
              </div>

              {/* Active Tags list */}
              <div className="flex flex-wrap items-center gap-1.5 min-h-[32px] p-2 bg-white rounded border border-slate-200">
                {tags.length === 0 ? (
                  <span className="text-slate-400 text-[11px] italic">
                    タグがまだありません。下の入力欄または候補から追加してください。
                  </span>
                ) : (
                  tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded text-xs font-semibold"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="p-0.5 hover:bg-emerald-200/60 rounded-full text-emerald-700"
                        title="タグを削除"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Tag Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(newTagInput);
                    }
                  }}
                  placeholder="大学名（東京大学等）や単元名（遺伝情報等）を入力してEnterまたは追加..."
                  className="flex-1 p-1.5 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(newTagInput)}
                  disabled={!newTagInput.trim()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded font-bold transition-colors"
                >
                  + 追加
                </button>
              </div>

              {/* Quick Tag Suggestions */}
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  よく使われるタグ候補（クリックで即追加）：
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {COMMON_TAG_SUGGESTIONS.map((sug) => {
                    const isAdded = tags.includes(sug);
                    return (
                      <button
                        type="button"
                        key={sug}
                        onClick={() => (isAdded ? handleRemoveTag(sug) : handleAddTag(sug))}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                          isAdded
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isAdded && <Check className="w-3 h-3 text-emerald-700" />}
                        <span>{sug}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Content Blocks Section (Reorderable) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-700">
                  【問題本文・コンテンツブロック構成】
                </h4>
                <p className="text-[11px] text-slate-500">
                  リード文、図版、実験結果表、グラフ、注釈などを自由な順序で構成できます
                </p>
              </div>

              {/* Add block dropdown / buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAddBlock('text')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center gap-1 font-semibold"
                >
                  <Type className="w-3.5 h-3.5" />
                  +本文
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('heading')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center gap-1 font-semibold"
                >
                  <Heading className="w-3.5 h-3.5" />
                  +見出し
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('table')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center gap-1 font-semibold"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  +表
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('graph')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center gap-1 font-semibold"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  +グラフ
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBlock('note')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center gap-1 font-semibold"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  +注釈
                </button>
              </div>
            </div>

            {/* Block list */}
            <div className="space-y-3">
              {contentBlocks.map((block, idx) => (
                <div
                  key={block.id || idx}
                  className="p-3 border border-slate-200 rounded-lg bg-slate-50/60 space-y-2"
                >
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700">
                      ブロック {idx + 1} ({block.type})
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveBlock(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveBlock(idx, 'down')}
                        disabled={idx === contentBlocks.length - 1}
                        className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(idx)}
                        className="p-1 hover:bg-red-100 text-red-600 rounded ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={block.content}
                    onChange={(e) => handleUpdateBlockContent(idx, e.target.value)}
                    rows={block.type === 'text' ? 4 : 2}
                    placeholder={`${block.type}の内容を入力...`}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 leading-relaxed font-sans focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Model Answer & Rubric */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-700">【模範解答・採点基準】</h4>

            <div className="space-y-1">
              <label className="text-slate-600 font-medium">論述の骨組み (1行1要点)</label>
              <textarea
                value={frameworkText}
                onChange={(e) => setFrameworkText(e.target.value)}
                placeholder="- 要点1&#10;- 要点2"
                rows={2}
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-bold">模範解答</label>
                <span className="font-mono text-slate-400">現在 {modelAnswer.length} 字</span>
              </div>
              <textarea
                value={modelAnswer}
                onChange={(e) => setModelAnswer(e.target.value)}
                rows={3}
                placeholder="模範答案を入力..."
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 leading-relaxed font-sans focus:border-emerald-600 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-600 font-medium">採点基準・配点 (1行1項目)</label>
              <textarea
                value={rubricText}
                onChange={(e) => setRubricText(e.target.value)}
                placeholder="- 〇〇に言及（4点）&#10;- 因果関係の明記（4点）&#10;- 字数・論理（2点）"
                rows={3}
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-xs font-semibold"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? '保存中...' : '問題を保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
