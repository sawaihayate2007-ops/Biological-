/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  KnowledgeCard,
  StandardProblem,
  ProblemSubmission,
  AppSettings,
  ReviewRating,
  BiologyField,
} from '../types';
import { SAMPLE_KNOWLEDGE_CARDS, SAMPLE_STANDARD_PROBLEMS } from './seedData';

const DB_NAME = 'BiologyEssayMasterDB';
const DB_VERSION = 1;

export interface DBExportData {
  version: number;
  exportedAt: string;
  knowledgeCards: KnowledgeCard[];
  standardProblems: StandardProblem[];
  submissions: ProblemSubmission[];
  settings: AppSettings;
}

const DEFAULT_SETTINGS: AppSettings = {
  aiStudioUrl: 'https://aistudio.google.com/u/2/prompts/new_chat',
  autoSaveDrafts: true,
  dailyGoalCards: 15,
  enableSoundEffects: true,
  fontSize: 'normal',
};

class DatabaseService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment.'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('knowledge_cards')) {
          const cardStore = db.createObjectStore('knowledge_cards', { keyPath: 'id' });
          cardStore.createIndex('field', 'field', { unique: false });
          cardStore.createIndex('theme', 'theme', { unique: false });
          cardStore.createIndex('nextReviewDate', 'nextReviewDate', { unique: false });
          cardStore.createIndex('mastery', 'mastery', { unique: false });
          cardStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('standard_problems')) {
          const probStore = db.createObjectStore('standard_problems', { keyPath: 'id' });
          probStore.createIndex('university', 'university', { unique: false });
          probStore.createIndex('year', 'year', { unique: false });
          probStore.createIndex('field', 'field', { unique: false });
        }

        if (!db.objectStoreNames.contains('submissions')) {
          const subStore = db.createObjectStore('submissions', { keyPath: 'id' });
          subStore.createIndex('problemId', 'problemId', { unique: false });
          subStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('raw_imports')) {
          db.createObjectStore('raw_imports', { keyPath: 'id' });
        }
      };

      request.onsuccess = async () => {
        const db = request.result;
        // Check if DB is newly created; if empty, seed with sample data
        try {
          await this.initSeedIfEmpty(db);
        } catch (e) {
          console.warn('Seed initialization error:', e);
        }
        resolve(db);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to open IndexedDB'));
      };
    });

    return this.dbPromise;
  }

  private async initSeedIfEmpty(db: IDBDatabase): Promise<void> {
    return new Promise((resolve) => {
      const tx = db.transaction(['knowledge_cards', 'standard_problems', 'settings'], 'readwrite');
      const cardStore = tx.objectStore('knowledge_cards');
      const probStore = tx.objectStore('standard_problems');
      const setStore = tx.objectStore('settings');

      const countReq = cardStore.count();
      countReq.onsuccess = () => {
        if (countReq.result === 0) {
          SAMPLE_KNOWLEDGE_CARDS.forEach((card) => cardStore.put(card));
          SAMPLE_STANDARD_PROBLEMS.forEach((prob) => probStore.put(prob));
          setStore.put({ key: 'app_settings', value: DEFAULT_SETTINGS });
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve(); // Non-blocking
    });
  }

  // ---- KNOWLEDGE CARDS ----

  async getAllCards(): Promise<KnowledgeCard[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('knowledge_cards', 'readonly');
      const store = tx.objectStore('knowledge_cards');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getCardById(id: string): Promise<KnowledgeCard | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('knowledge_cards', 'readonly');
      const store = tx.objectStore('knowledge_cards');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveCard(card: KnowledgeCard): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('knowledge_cards', 'readwrite');
      const store = tx.objectStore('knowledge_cards');
      const request = store.put({
        ...card,
        updatedAt: new Date().toISOString(),
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveBatchCards(cards: KnowledgeCard[]): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('knowledge_cards', 'readwrite');
      const store = tx.objectStore('knowledge_cards');
      cards.forEach((c) => store.put(c));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteCard(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('knowledge_cards', 'readwrite');
      const store = tx.objectStore('knowledge_cards');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Spaced Repetition Rating Update (1日, 3日, 7日, 14日, 30日)
  async recordCardReview(
    cardId: string,
    rating: ReviewRating,
    userAnswer?: string,
    selfScore?: number
  ): Promise<KnowledgeCard> {
    const card = await this.getCardById(cardId);
    if (!card) throw new Error(`Card not found: ${cardId}`);

    const today = new Date();
    let newInterval = card.intervalDays || 1;
    let newMastery = card.mastery;
    let lapseCount = card.lapseCount || 0;

    if (rating === 'remembered') {
      // 覚えた: 間隔を拡大 (1 -> 3 -> 7 -> 14 -> 30)
      if (newInterval < 3) newInterval = 3;
      else if (newInterval < 7) newInterval = 7;
      else if (newInterval < 14) newInterval = 14;
      else if (newInterval < 30) newInterval = 30;
      else newInterval = Math.round(newInterval * 1.5);
      newMastery = newInterval >= 14 ? 'mastered' : 'learning';
    } else if (rating === 'uncertain') {
      // あやしい: 間隔維持または微調整
      newInterval = Math.max(1, Math.round(newInterval * 0.7));
      newMastery = 'learning';
    } else {
      // 覚えていない: リセット
      newInterval = 1;
      lapseCount += 1;
      newMastery = 'learning';
    }

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + newInterval);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    const newLog = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: today.toISOString(),
      rating,
      userAnswer,
      selfScore,
    };

    const updatedCard: KnowledgeCard = {
      ...card,
      intervalDays: newInterval,
      nextReviewDate: nextDateStr,
      lastReviewedDate: today.toISOString().split('T')[0],
      reviewCount: (card.reviewCount || 0) + 1,
      lapseCount,
      mastery: newMastery,
      history: [newLog, ...(card.history || [])],
      updatedAt: today.toISOString(),
    };

    await this.saveCard(updatedCard);
    return updatedCard;
  }

  // ---- STANDARD PROBLEMS ----

  async getAllProblems(): Promise<StandardProblem[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('standard_problems', 'readonly');
      const store = tx.objectStore('standard_problems');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getProblemById(id: string): Promise<StandardProblem | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('standard_problems', 'readonly');
      const store = tx.objectStore('standard_problems');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveProblem(problem: StandardProblem): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('standard_problems', 'readwrite');
      const store = tx.objectStore('standard_problems');
      const request = store.put({
        ...problem,
        updatedAt: new Date().toISOString(),
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProblem(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('standard_problems', 'readwrite');
      const store = tx.objectStore('standard_problems');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ---- SUBMISSIONS & REVISIONS ----

  async getSubmissionsByProblemId(problemId: string): Promise<ProblemSubmission[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('submissions', 'readonly');
      const store = tx.objectStore('submissions');
      const index = store.index('problemId');
      const request = index.getAll(problemId);
      request.onsuccess = () => {
        const sorted = (request.result || []).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        resolve(sorted);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSubmissions(): Promise<ProblemSubmission[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('submissions', 'readonly');
      const store = tx.objectStore('submissions');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveSubmission(submission: ProblemSubmission): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('submissions', 'readwrite');
      const store = tx.objectStore('submissions');
      const request = store.put(submission);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ---- SETTINGS ----

  async getSettings(): Promise<AppSettings> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('settings', 'readonly');
        const store = tx.objectStore('settings');
        const request = store.get('app_settings');
        request.onsuccess = () => {
          if (request.result && request.result.value) {
            const val = request.result.value;
            // If it had the old default without user account path, upgrade to the requested user link
            if (val.aiStudioUrl === 'https://aistudio.google.com/prompts/new_chat') {
              val.aiStudioUrl = 'https://aistudio.google.com/u/2/prompts/new_chat';
            }
            resolve({ ...DEFAULT_SETTINGS, ...val });
          } else {
            resolve(DEFAULT_SETTINGS);
          }
        };
        request.onerror = () => resolve(DEFAULT_SETTINGS);
      });
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const request = store.put({ key: 'app_settings', value: settings });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ---- BACKUP & RESTORE ----

  async exportAllData(): Promise<DBExportData> {
    const [knowledgeCards, standardProblems, submissions, settings] = await Promise.all([
      this.getAllCards(),
      this.getAllProblems(),
      this.getAllSubmissions(),
      this.getSettings(),
    ]);

    return {
      version: DB_VERSION,
      exportedAt: new Date().toISOString(),
      knowledgeCards,
      standardProblems,
      submissions,
      settings,
    };
  }

  async importAllData(data: DBExportData): Promise<{ cardsCount: number; problemsCount: number }> {
    if (!data || !Array.isArray(data.knowledgeCards) || !Array.isArray(data.standardProblems)) {
      throw new Error('無効なバックアップデータ形式です。必要なキーが見つかりません。');
    }

    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(
        ['knowledge_cards', 'standard_problems', 'submissions', 'settings'],
        'readwrite'
      );
      const cardStore = tx.objectStore('knowledge_cards');
      const probStore = tx.objectStore('standard_problems');
      const subStore = tx.objectStore('submissions');
      const setStore = tx.objectStore('settings');

      cardStore.clear();
      probStore.clear();
      subStore.clear();

      data.knowledgeCards.forEach((c) => cardStore.put(c));
      data.standardProblems.forEach((p) => probStore.put(p));
      if (Array.isArray(data.submissions)) {
        data.submissions.forEach((s) => subStore.put(s));
      }
      if (data.settings) {
        setStore.put({ key: 'app_settings', value: data.settings });
      }

      tx.oncomplete = () => {
        resolve({
          cardsCount: data.knowledgeCards.length,
          problemsCount: data.standardProblems.length,
        });
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  async resetToSampleData(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(
        ['knowledge_cards', 'standard_problems', 'submissions', 'settings'],
        'readwrite'
      );
      tx.objectStore('knowledge_cards').clear();
      tx.objectStore('standard_problems').clear();
      tx.objectStore('submissions').clear();

      SAMPLE_KNOWLEDGE_CARDS.forEach((c) => tx.objectStore('knowledge_cards').put(c));
      SAMPLE_STANDARD_PROBLEMS.forEach((p) => tx.objectStore('standard_problems').put(p));
      tx.objectStore('settings').put({ key: 'app_settings', value: DEFAULT_SETTINGS });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Markdown Export of all cards
  async exportKnowledgeCardsAsMarkdown(fieldFilter?: BiologyField): Promise<string> {
    const cards = await this.getAllCards();
    const targetCards = fieldFilter ? cards.filter((c) => c.field === fieldFilter) : cards;

    // Group by Field -> Chapter -> Theme
    const grouped: Record<string, Record<string, Record<string, KnowledgeCard[]>>> = {};

    targetCards.forEach((c) => {
      const f = c.field || 'その他';
      const ch = c.chapter || '未分類章';
      const th = c.theme || '未分類テーマ';
      if (!grouped[f]) grouped[f] = {};
      if (!grouped[f][ch]) grouped[f][ch] = {};
      if (!grouped[f][ch][th]) grouped[f][ch][th] = [];
      grouped[f][ch][th].push(c);
    });

    let md = `# 大学受験生物 知識論述教材 エクスポート\n\n生成日時: ${new Date().toLocaleString('ja-JP')}\nカード総数: ${targetCards.length}枚\n\n---\n\n`;

    for (const [field, chapters] of Object.entries(grouped)) {
      md += `分野：${field}\n\n`;
      for (const [chapter, themes] of Object.entries(chapters)) {
        md += `${chapter}\n\n`;
        for (const [theme, cardList] of Object.entries(themes)) {
          md += `${theme}\n\n`;
          cardList.forEach((c, idx) => {
            md += `カード${idx + 1}\n\n`;
            md += `- 種類：${c.type}\n`;
            md += `- 難易度：${c.difficulty}\n`;
            if (c.charLimit) md += `- 指定字数：${c.charLimit}字以内\n`;
            md += `- タイトル：${c.title}\n\n`;

            md += `問題\n\n${c.question}\n\n`;

            if (c.framework && c.framework.length > 0) {
              md += `論述の骨組み\n\n`;
              c.framework.forEach((fw) => {
                md += `- ${fw}\n`;
              });
              md += `\n`;
            }

            md += `解答例\n\n${c.modelAnswer}\n\n`;

            if (c.keyTerms && c.keyTerms.length > 0) {
              md += `重要語句\n\n`;
              c.keyTerms.forEach((kt) => {
                md += `- ${kt}\n`;
              });
              md += `\n`;
            }

            if (c.rubric && c.rubric.length > 0) {
              md += `採点ポイント\n\n`;
              c.rubric.forEach((rb) => {
                md += `- ${rb}\n`;
              });
              md += `\n`;
            }

            if (c.explanation) {
              md += `解説\n\n${c.explanation}\n\n`;
            }

            md += `---\n\n`;
          });
        }
      }
    }

    return md;
  }
}

export const dbService = new DatabaseService();
