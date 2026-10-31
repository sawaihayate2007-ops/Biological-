/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  KnowledgeCard,
  StandardProblem,
  ProblemSubmission,
  AppSettings,
  ReviewRating,
  AIFeedbackResult,
  BiologyField,
} from './types';
import { dbService } from './services/db';
import { Navbar, NavTab } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { KnowledgeListView } from './components/knowledge/KnowledgeListView';
import { CardStudyView } from './components/knowledge/CardStudyView';
import { ComprehensiveEssayView } from './components/knowledge/ComprehensiveEssayView';
import { StandardProblemListView } from './components/standard/StandardProblemListView';
import { StandardProblemDetailView } from './components/standard/StandardProblemDetailView';
import { StandardProblemEditor } from './components/standard/StandardProblemEditor';
import { StudyAnalyticsView } from './components/analytics/StudyAnalyticsView';
import { SettingsDataView } from './components/settings/SettingsDataView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [problems, setProblems] = useState<StandardProblem[]>([]);
  const [submissions, setSubmissions] = useState<ProblemSubmission[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    aiStudioUrl: 'https://aistudio.google.com/u/2/prompts/new_chat',
    autoSaveDrafts: true,
    dailyGoalCards: 15,
    enableSoundEffects: true,
    fontSize: 'normal',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Active Sub-Views
  const [studySessionCards, setStudySessionCards] = useState<KnowledgeCard[] | null>(null);
  const [comprehensiveCard, setComprehensiveCard] = useState<KnowledgeCard | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<StandardProblem | null>(null);
  const [editingProblem, setEditingProblem] = useState<StandardProblem | null>(null);
  const [isProblemEditorOpen, setIsProblemEditorOpen] = useState(false);

  // Load all data from IndexedDB
  const refreshData = useCallback(async () => {
    try {
      const [loadedCards, loadedProblems, loadedSubmissions, loadedSettings] = await Promise.all([
        dbService.getAllCards(),
        dbService.getAllProblems(),
        dbService.getAllSubmissions(),
        dbService.getSettings(),
      ]);
      setCards(loadedCards);
      setProblems(loadedProblems);
      setSubmissions(loadedSubmissions);
      setSettings(loadedSettings);
    } catch (err) {
      console.error('Failed to load data from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Submissions count map per problem
  const submissionsCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    submissions.forEach((s) => {
      map[s.problemId] = (map[s.problemId] || 0) + 1;
    });
    return map;
  }, [submissions]);

  // Due cards count
  const todayStr = new Date().toISOString().split('T')[0];
  const dueCardsCount = useMemo(() => {
    return cards.filter((c) => c.nextReviewDate <= todayStr).length;
  }, [cards, todayStr]);

  // ---- CARD HANDLERS ----
  const handleRecordReview = async (cardId: string, rating: ReviewRating) => {
    const updated = await dbService.recordCardReview(cardId, rating);
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleSaveCard = async (card: KnowledgeCard) => {
    await dbService.saveCard(card);
    setCards((prev) => {
      const idx = prev.findIndex((c) => c.id === card.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = card;
        return copy;
      }
      return [card, ...prev];
    });
  };

  const handleDeleteCard = async (id: string) => {
    await dbService.deleteCard(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleImportBatchCards = async (newCards: KnowledgeCard[]) => {
    await dbService.saveBatchCards(newCards);
    await refreshData();
  };

  const handleSaveComprehensiveAnswer = async (
    cardId: string,
    userAnswer: string,
    selfScore?: number,
    aiFeedback?: AIFeedbackResult
  ) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    // Treat as reviewed with rating based on self score
    const rating: ReviewRating = (selfScore ?? 70) >= 70 ? 'remembered' : 'uncertain';
    const updated = await dbService.recordCardReview(cardId, rating, userAnswer, selfScore);
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setComprehensiveCard(updated);
  };

  // ---- PROBLEM HANDLERS ----
  const handleSaveProblem = async (problem: StandardProblem) => {
    await dbService.saveProblem(problem);
    setProblems((prev) => {
      const idx = prev.findIndex((p) => p.id === problem.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = problem;
        return copy;
      }
      return [problem, ...prev];
    });
    if (selectedProblem?.id === problem.id) {
      setSelectedProblem(problem);
    }
  };

  const handleDeleteProblem = async (id: string) => {
    await dbService.deleteProblem(id);
    setProblems((prev) => prev.filter((p) => p.id !== id));
    if (selectedProblem?.id === id) {
      setSelectedProblem(null);
    }
  };

  const handleSaveSubmission = async (submission: ProblemSubmission) => {
    await dbService.saveSubmission(submission);
    setSubmissions((prev) => [submission, ...prev]);
  };

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    await dbService.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const handleExportMarkdown = async (field?: BiologyField) => {
    const md = await dbService.exportKnowledgeCardsAsMarkdown(field);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biology_cards_${field || 'all'}_${todayStr}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600">
          大学受験生物 論述学習システムを初期化中...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setStudySessionCards(null);
          setComprehensiveCard(null);
          setSelectedProblem(null);
        }}
        dueCardsCount={dueCardsCount}
        aiStudioUrl={settings.aiStudioUrl}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {/* TAB 1: HOME DASHBOARD */}
        {currentTab === 'home' && (
          <HomeDashboard
            cards={cards}
            problems={problems}
            submissions={submissions}
            onNavigate={(tab) => {
              setCurrentTab(tab);
              setStudySessionCards(null);
              setComprehensiveCard(null);
              setSelectedProblem(null);
            }}
            onStartDueReview={() => {
              const due = cards.filter((c) => c.nextReviewDate <= todayStr);
              setStudySessionCards(due.length > 0 ? due : cards);
              setCurrentTab('knowledge');
            }}
            onSelectProblem={(prob) => {
              setSelectedProblem(prob);
              setCurrentTab('standard');
            }}
          />
        )}

        {/* TAB 2: KNOWLEDGE BRANCH (知識論述部門) */}
        {currentTab === 'knowledge' && (
          <>
            {studySessionCards ? (
              <CardStudyView
                cards={studySessionCards}
                onRecordReview={handleRecordReview}
                onFinishStudy={() => setStudySessionCards(null)}
                onOpenComprehensiveDraft={(card) => {
                  setComprehensiveCard(card);
                  setStudySessionCards(null);
                }}
              />
            ) : comprehensiveCard ? (
              <ComprehensiveEssayView
                card={comprehensiveCard}
                onBack={() => setComprehensiveCard(null)}
                onSaveAnswer={handleSaveComprehensiveAnswer}
                aiStudioUrl={settings.aiStudioUrl}
              />
            ) : (
              <KnowledgeListView
                cards={cards}
                onSaveCard={handleSaveCard}
                onDeleteCard={handleDeleteCard}
                onImportBatch={handleImportBatchCards}
                onStartStudy={(targetCards) => setStudySessionCards(targetCards)}
                onOpenComprehensive={(card) => setComprehensiveCard(card)}
                onExportMarkdown={handleExportMarkdown}
                aiStudioUrl={settings.aiStudioUrl}
              />
            )}
          </>
        )}

        {/* TAB 3: STANDARD PROBLEMS BRANCH (通常の論述問題部門) */}
        {currentTab === 'standard' && (
          <>
            {selectedProblem ? (
              <StandardProblemDetailView
                problem={selectedProblem}
                submissions={submissions.filter((s) => s.problemId === selectedProblem.id)}
                onBack={() => setSelectedProblem(null)}
                onEdit={(prob) => {
                  setEditingProblem(prob);
                  setIsProblemEditorOpen(true);
                }}
                onSaveSubmission={handleSaveSubmission}
                aiStudioUrl={settings.aiStudioUrl}
              />
            ) : (
              <StandardProblemListView
                problems={problems}
                submissionsCountMap={submissionsCountMap}
                onSelectProblem={(prob) => setSelectedProblem(prob)}
                onSaveProblem={handleSaveProblem}
                onDeleteProblem={handleDeleteProblem}
                aiStudioUrl={settings.aiStudioUrl}
              />
            )}
          </>
        )}

        {/* TAB 4: STUDY ANALYTICS (学習分析) */}
        {currentTab === 'analytics' && (
          <StudyAnalyticsView
            cards={cards}
            problems={problems}
            submissions={submissions}
          />
        )}

        {/* TAB 5: SETTINGS & DATA MANAGEMENT (設定・データ管理) */}
        {currentTab === 'settings' && (
          <SettingsDataView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            cardsCount={cards.length}
            problemsCount={problems.length}
            submissionsCount={submissions.length}
            onDataResetOrRestored={refreshData}
          />
        )}
      </main>

      {/* Standalone Problem Editor Modal for Standard branch */}
      <StandardProblemEditor
        isOpen={isProblemEditorOpen}
        onClose={() => {
          setIsProblemEditorOpen(false);
          setEditingProblem(null);
        }}
        problem={editingProblem}
        onSave={handleSaveProblem}
      />

      {/* Global Compact Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>大学受験生物 論述学習システム — 難関大二次試験・記述対策</span>
          <span className="text-[11px] text-slate-400">
            データはブラウザ（IndexedDB）内に完全永続化・外部AI（Google AI Studio）手動連携方式
          </span>
        </div>
      </footer>
    </div>
  );
}
