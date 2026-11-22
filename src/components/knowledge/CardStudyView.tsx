/**
* @license
* SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect} from 'react';
import { KnowledgeCard, ReviewRating, CARD_TYPE_LABELS} from '../../types';
import {
RotateCcw,
Check,
AlertCircle,
HelpCircle,
ArrowLeft,
BookOpen,
PenTool,
Calendar,
CheckCircle2,
} from 'lucide-react';

interface CardStudyViewProps {
cards: KnowledgeCard[];
onRecordReview: (cardId: string, rating: ReviewRating, missedTerms?: string[]) => Promise<void>;
onFinishStudy: () => void;
onOpenComprehensiveDraft?: (card: KnowledgeCard) => void;
}

export const CardStudyView: React.FC<CardStudyViewProps> = ({
cards,
onRecordReview,
onFinishStudy,
onOpenComprehensiveDraft,
}) => {
// セッション内の出題キュー。「あやしい／覚えていない」は末尾に1回だけ再出題する。
const [queue, setQueue] = useState<KnowledgeCard[]>(cards);
const [currentIndex, setCurrentIndex] = useState(0);
const [isFlipped, setIsFlipped] = useState(false);
const [isSaving, setIsSaving] = useState(false);
// 今セッションで既に記録済み（=再出題かどうか）の判定
const [recordedIds, setRecordedIds] = useState<Set<string>>(new Set());
const [requeuedIds, setRequeuedIds] = useState<Set<string>>(new Set());
// 完了画面の集計（初回の評価のみ）と再出題の結果
const [firstRatings, setFirstRatings] = useState<Record<string, ReviewRating>>({});
const [retryTotal, setRetryTotal] = useState(0);
const [retryRecovered, setRetryRecovered] = useState(0);
// 現在のカードで「言えなかった」必須キーワード
const [missedTerms, setMissedTerms] = useState<Set<string>>(new Set());

const currentCard = queue[currentIndex];
const isRetry = currentCard? recordedIds.has(currentCard.id): false;

const handleRate = async (rating: ReviewRating) => {
if (!currentCard || isSaving) return;
const card = currentCard;

if (!recordedIds.has(card.id)) {
// 初回：間隔反復の記録に残す
setIsSaving(true);
try {
await onRecordReview(card.id, rating, [...missedTerms]);
} finally {
setIsSaving(false);
}
setRecordedIds((prev) => new Set(prev).add(card.id));
setFirstRatings((prev) => ({...prev, [card.id]: rating}));

if (rating!== 'remembered' &&!requeuedIds.has(card.id)) {
// 弱いカードはこのセッションの最後にもう一度出す
setRequeuedIds((prev) => new Set(prev).add(card.id));
setQueue((prev) => [...prev, card]);
}
} else {
// 再出題：記録は更新しない（同じ日に言い直せても、間隔は初回の評価で決まる）
setRetryTotal((prev) => prev + 1);
if (rating === 'remembered') {
setRetryRecovered((prev) => prev + 1);
}
}

setMissedTerms(new Set());
setIsFlipped(false);
setCurrentIndex((prev) => prev + 1);
};

// Keyboard navigation
useEffect(() => {
const handleKeyDown = (e: KeyboardEvent) => {
// Don't trigger if in an input or textarea
if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

if (e.code === 'Space' || e.key === 'Enter') {
e.preventDefault();
setIsFlipped((prev) =>!prev);
} else if (isFlipped) {
if (e.key === '1') {
void handleRate('not_remembered');
} else if (e.key === '2') {
void handleRate('uncertain');
} else if (e.key === '3') {
void handleRate('remembered');
}
}
};

window.addEventListener('keydown', handleKeyDown);
return () => window.removeEventListener('keydown', handleKeyDown);
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [isFlipped, currentIndex, currentCard, missedTerms, recordedIds, requeuedIds]);

if (!cards || cards.length === 0) {
return (
<div className="p-12 text-center bg-white rounded-lg border border-slate-200">
<BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
<h3 className="text-base font-bold text-slate-700">復習対象のカードがありません</h3>
<p className="text-xs text-slate-500 mt-1">
今日の復習予定のカードはすべて完了しているか、まだカードが登録されていません。
</p>
<button
onClick={onFinishStudy}
className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded text-xs font-bold hover:bg-emerald-800 transition-colors"
>
教材一覧に戻る
</button>
</div>
);
}

const handleRestart = () => {
setQueue(cards);
setCurrentIndex(0);
setIsFlipped(false);
setRecordedIds(new Set());
setRequeuedIds(new Set());
setFirstRatings({});
setRetryTotal(0);
setRetryRecovered(0);
setMissedTerms(new Set());
};

// Completed session screen
if (currentIndex >= queue.length) {
const ratings = Object.values(firstRatings);
const rememberedCount = ratings.filter((r) => r === 'remembered').length;
const uncertainCount = ratings.filter((r) => r === 'uncertain').length;
const notRememberedCount = ratings.filter((r) => r === 'not_remembered').length;

return (
<div className="max-w-xl mx-auto p-8 bg-white rounded-lg border border-slate-200 shadow-sm text-center space-y-6">
<div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
<CheckCircle2 className="w-8 h-8" />
</div>

<div>
<h3 className="text-lg font-bold text-slate-800">今回の学習セッション完了！</h3>
<p className="text-xs text-slate-500 mt-1">
全 {ratings.length} 枚のカードの復習・自己評価を記録しました。
</p>
</div>

<div className="grid grid-cols-3 gap-3 text-center py-2">
<div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
<div className="text-xs text-emerald-800 font-semibold">覚えた</div>
<div className="text-xl font-bold text-emerald-900 mt-0.5">{rememberedCount}</div>
<div className="text-[10px] text-emerald-600 mt-0.5">間隔拡大</div>
</div>
<div className="p-3 bg-amber-50 border border-amber-200 rounded">
<div className="text-xs text-amber-800 font-semibold">あやしい</div>
<div className="text-xl font-bold text-amber-900 mt-0.5">{uncertainCount}</div>
<div className="text-[10px] text-amber-600 mt-0.5">近々再復習</div>
</div>
<div className="p-3 bg-red-50 border border-red-200 rounded">
<div className="text-xs text-red-800 font-semibold">覚えていない</div>
<div className="text-xl font-bold text-red-900 mt-0.5">{notRememberedCount}</div>
<div className="text-[10px] text-red-600 mt-0.5">明日再テスト</div>
</div>
</div>

{retryTotal > 0 && (
<p className="text-xs text-slate-600">
セッション内の再出題 {retryTotal} 枚中 {retryRecovered} 枚は、その場で言い直せました。
</p>
)}

<div className="flex justify-center gap-3 pt-2">
<button
onClick={handleRestart}
className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold"
>
<RotateCcw className="w-4 h-4" />
もう一度学習する
</button>
<button
onClick={onFinishStudy}
className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold shadow-xs"
>
一覧に戻る
</button>
</div>
</div>
);
}

const typeMeta = CARD_TYPE_LABELS[currentCard.type] || {
label: currentCard.type,
desc: '',
color: 'slate',
};

const toggleMissedTerm = (term: string) => {
setMissedTerms((prev) => {
const next = new Set(prev);
if (next.has(term)) {
next.delete(term);
} else {
next.add(term);
}
return next;
});
};

return (
<div className="max-w-3xl mx-auto space-y-4">
{/* Top Header & Progress */}
<div className="flex items-center justify-between bg-white px-5 py-3 rounded border border-slate-200 shadow-2xs">
<button
onClick={onFinishStudy}
className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium"
>
<ArrowLeft className="w-4 h-4" />
一覧へ戻る
</button>

<div className="flex items-center gap-4 text-xs">
<span className="font-bold text-slate-700">
カード {currentIndex + 1} / {queue.length}
</span>
{isRetry && (
<span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
再出題
</span>
)}
<div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
<div
className="bg-emerald-600 h-full transition-all duration-300"
style={{ width: `${((currentIndex + 1) / queue.length) * 100}%`}}
/>
</div>
</div>

<div className="text-xs text-slate-500 flex items-center gap-1">
<Calendar className="w-3.5 h-3.5" />
現在の間隔: {currentCard.intervalDays || 1}日
</div>
</div>

{/* Main Flashcard Card */}
<div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[460px]">
{/* Card Hierarchy Header */}
<div className="px-6 py-3.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
<div className="flex items-center gap-2 text-slate-600">
<span className="font-semibold text-emerald-800">{currentCard.field}</span>
<span>›</span>
<span>{currentCard.chapter}</span>
<span>›</span>
<span className="text-slate-800 font-medium">{currentCard.theme}</span>
</div>

<div className="flex items-center gap-2">
<span className="text-[11px] font-bold text-slate-700 border border-slate-200 px-2 py-0.5 rounded bg-white">
{typeMeta.label}
</span>
<span className="text-[11px] text-slate-500">
難易度: {currentCard.difficulty}
</span>
{currentCard.charLimit && (
<span className="text-[11px] text-slate-500 font-mono">
{currentCard.charLimit}字以内
</span>
)}
</div>
</div>

{/* Card Body */}
<div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
{/* FRONT: Question */}
<div className="space-y-4">
<div className="flex items-center justify-between">
<span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
Question
</span>
<span className="text-xs text-slate-700 font-bold">{currentCard.title}</span>
</div>

<div className="text-base md:text-lg font-medium text-slate-900 leading-relaxed font-sans whitespace-pre-wrap">
{currentCard.question}
</div>

{currentCard.charLimit && (
<div className="text-xs text-slate-400 font-mono">
※指定字数: {currentCard.charLimit}字以内
</div>
)}

{currentCard.keyTerms && currentCard.keyTerms.length > 0 && (
<div className="text-xs text-slate-500">
必須キーワード {currentCard.keyTerms.length} 個 — 全部言えるか確かめてから解答を開いてください
</div>
)}
</div>

{/* BACK: Model Answer & Rubric (Shown when flipped) */}
{isFlipped? (
<div className="pt-6 mt-6 border-t border-slate-200 space-y-4 animate-in fade-in duration-200">
<div className="flex items-center justify-between">
<span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
Answer & Key Points
</span>
{currentCard.type === 'comprehensive' && onOpenComprehensiveDraft && (
<button
onClick={() => onOpenComprehensiveDraft(currentCard)}
className="flex items-center gap-1 text-xs text-purple-700 font-bold hover:underline"
>
<PenTool className="w-3.5 h-3.5" />
答案作成・AI採点画面を開く
</button>
)}
</div>

{/* Logical Framework */}
{currentCard.framework && currentCard.framework.length > 0 && (
<div className="p-3.5 bg-slate-50 rounded border border-slate-200 text-xs">
<div className="font-bold text-slate-700 mb-1.5"></div>
<ul className="list-disc list-inside space-y-1 text-slate-600">
{currentCard.framework.map((fw, idx) => (
<li key={idx}>{fw}</li>
))}
</ul>
</div>
)}

{/* Model Answer */}
<div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded">
<div className="text-xs font-bold text-emerald-950 mb-1.5 flex items-center justify-between">
<span></span>
<span className="text-[11px] font-mono text-emerald-800">
{currentCard.modelAnswer.length}文字
</span>
</div>
<div className="text-sm font-medium text-emerald-950 leading-relaxed font-sans whitespace-pre-wrap">
{currentCard.modelAnswer}
</div>
</div>

{/* Key Terms: 言えなかったものをタップして記録する */}
{currentCard.keyTerms && currentCard.keyTerms.length > 0 && (
<div className="text-xs space-y-1.5">
<div className="flex flex-wrap items-center gap-1.5">
<span className="font-bold text-slate-700">重要語句:</span>
{currentCard.keyTerms.map((kt, idx) => {
const missed = missedTerms.has(kt);
return (
<button
key={idx}
type="button"
onClick={() => toggleMissedTerm(kt)}
className={
missed
? 'bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded text-[11px] font-bold'
: 'bg-slate-100 text-slate-800 border border-transparent px-2 py-0.5 rounded text-[11px] font-medium'
}
>
{kt}
</button>
);
})}
</div>
<p className="text-[11px] text-slate-400">
頭の中で言えなかった語句をタップすると赤くなり、復習記録に残ります。タップしなければ全部言えたものとして扱います。
</p>
</div>
)}

{/* Rubric */}
{currentCard.rubric && currentCard.rubric.length > 0 && (
<div className="p-3 bg-amber-50/60 border border-amber-200 rounded text-xs">
<div className="font-bold text-amber-900 mb-1"></div>
<ul className="list-disc list-inside space-y-0.5 text-amber-950">
{currentCard.rubric.map((rb, idx) => (
<li key={idx}>{rb}</li>
))}
</ul>
</div>
)}

{/* Explanation */}
{currentCard.explanation && (
<div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-100">
<span className="font-bold text-slate-700"></span>
<div className="mt-1 leading-relaxed whitespace-pre-wrap">
{currentCard.explanation}
</div>
</div>
)}
</div>
): (
<div className="py-12 flex flex-col items-center justify-center text-center">
<p className="text-xs text-slate-400 mb-3">
頭の中で論述の構成・重要語句を想起してください
</p>
<button
onClick={() => setIsFlipped(true)}
className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-sm font-bold shadow-xs transition-all flex items-center gap-2"
>
<span>解答を確認する</span>
<span className="text-[11px] text-slate-300 font-mono border-l border-slate-700 pl-2">
Space / Enter
</span>
</button>
</div>
)}
</div>

{/* Bottom Review Action Bar */}
<div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
{!isFlipped? (
<div className="flex items-center justify-between text-xs text-slate-500">
<span>ショートカット: Spaceキーで解答を表示</span>
{currentCard.type === 'comprehensive' && onOpenComprehensiveDraft && (
<button
onClick={() => onOpenComprehensiveDraft(currentCard)}
className="flex items-center gap-1 text-purple-700 font-bold hover:underline"
>
<PenTool className="w-3.5 h-3.5" />
実際に答案を入力して解く
</button>
)}
</div>
): (
<div className="flex flex-col sm:flex-row items-center justify-between gap-3">
<div className="text-xs text-slate-500 hidden sm:block">
習熟度を自己評価してください (キー: 1, 2, 3)
</div>

<div className="flex items-center gap-3 w-full sm:w-auto">
{/* 覚えていない */}
<button
onClick={() => void handleRate('not_remembered')}
disabled={isSaving}
className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-xs font-bold transition-colors shadow-2xs"
>
<AlertCircle className="w-4 h-4" />
<span>覚えていない</span>
<span className="text-[10px] text-red-500 font-mono">[1]</span>
</button>

{/* あやしい */}
<button
onClick={() => void handleRate('uncertain')}
disabled={isSaving}
className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-xs font-bold transition-colors shadow-2xs"
>
<HelpCircle className="w-4 h-4" />
<span>あやしい</span>
<span className="text-[10px] text-amber-600 font-mono">[2]</span>
</button>

{/* 覚えた */}
<button
onClick={() => void handleRate('remembered')}
disabled={isSaving}
className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition-colors shadow-xs"
>
<Check className="w-4 h-4" />
<span>覚えた</span>
<span className="text-[10px] text-emerald-200 font-mono">[3]</span>
</button>
</div>
</div>
)}
</div>
</div>
</div>
);
};
