/**
 * GitHub Gist を使った端末間データ同期。
 * - 同期設定（トークン・Gist ID・最終同期時刻）は localStorage にのみ保存し、
 *   エクスポートデータには絶対に含めない（トークンを外部に出さないため）。
 * - 同期データ本体は DBExportData をそのまま包んだ SyncPayload を
 *   秘密Gistの1ファイル（biological-sync.json）に置く。
 */
import { DBExportData } from '../types';

export interface GistSyncConfig {
  token: string;
  gistId: string | null;
  /** 最後に送受信したペイロードの syncedAt */
  lastSyncedAt: string | null;
  /** 最後に確認したGistの updated_at（変化検出用） */
  lastRemoteUpdatedAt: string | null;
}

export interface SyncPayload {
  app: 'Biological-';
  version: 1;
  syncedAt: string;
  data: DBExportData;
}

const STORAGE_KEY = 'biological-gist-sync-v1';
export const SYNC_FILENAME = 'biological-sync.json';
const API_BASE = 'https://api.github.com';

export function loadSyncConfig(): GistSyncConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        token: typeof parsed.token === 'string' ? parsed.token : '',
        gistId: parsed.gistId ?? null,
        lastSyncedAt: parsed.lastSyncedAt ?? null,
        lastRemoteUpdatedAt: parsed.lastRemoteUpdatedAt ?? null,
      };
    }
  } catch {
    /* ignore */
  }
  return { token: '', gistId: null, lastSyncedAt: null, lastRemoteUpdatedAt: null };
}

export function saveSyncConfig(cfg: GistSyncConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    /* ignore */
  }
}

export function buildPayload(data: DBExportData): SyncPayload {
  return {
    app: 'Biological-',
    version: 1,
    syncedAt: new Date().toISOString(),
    data,
  };
}

async function gh<T>(
  token: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
  } catch {
    throw new Error('GitHubに接続できませんでした。通信環境を確認してください。');
  }
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('トークンが無効です。gist権限のあるトークンか確認してください。');
    }
    if (res.status === 404) {
      throw new Error('Gistが見つかりません。Gist IDを確認してください。');
    }
    if (res.status === 403) {
      throw new Error('GitHub側でアクセスが制限されました（権限不足か回数制限）。時間をおいて再試行してください。');
    }
    throw new Error(`GitHub APIエラー（${res.status}）`);
  }
  return (await res.json()) as T;
}

interface GistFile {
  content?: string;
  truncated?: boolean;
  raw_url?: string;
}

interface GistResponse {
  id: string;
  updated_at: string;
  files: Record<string, GistFile>;
}

/** トークンの確認。成功したらGitHubのユーザー名を返す。 */
export async function testToken(token: string): Promise<string> {
  const user = await gh<{ login: string }>(token, '/user');
  return user.login;
}

/** 同期用Gistを新規作成する。 */
export async function createSyncGist(
  token: string,
  payload: SyncPayload
): Promise<{ gistId: string; updatedAt: string }> {
  const gist = await gh<GistResponse>(token, '/gists', {
    method: 'POST',
    body: JSON.stringify({
      description: 'Biological- 論述学習システム 同期データ',
      public: false,
      files: {
        [SYNC_FILENAME]: { content: JSON.stringify(payload) },
      },
    }),
  });
  return { gistId: gist.id, updatedAt: gist.updated_at };
}

/** 既存の同期Gistを上書きする。 */
export async function updateSyncGist(
  token: string,
  gistId: string,
  payload: SyncPayload
): Promise<{ updatedAt: string }> {
  const gist = await gh<GistResponse>(token, `/gists/${gistId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      files: {
        [SYNC_FILENAME]: { content: JSON.stringify(payload) },
      },
    }),
  });
  return { updatedAt: gist.updated_at };
}

/** 同期Gistの現在の updated_at だけを確認する（変化検出用）。 */
export async function getRemoteUpdatedAt(
  token: string,
  gistId: string
): Promise<string> {
  const gist = await gh<GistResponse>(token, `/gists/${gistId}`);
  return gist.updated_at;
}

/** 同期Gistからペイロードを取得する。 */
export async function fetchSyncPayload(
  token: string,
  gistId: string
): Promise<{ payload: SyncPayload; updatedAt: string }> {
  const gist = await gh<GistResponse>(token, `/gists/${gistId}`);
  const file = gist.files[SYNC_FILENAME];
  if (!file) {
    throw new Error(`Gist内に同期ファイル（${SYNC_FILENAME}）が見つかりません。`);
  }
  let content = file.content ?? '';
  if (file.truncated) {
    // 大きいファイルはAPI応答で切り詰められるため raw を取り直す
    if (!file.raw_url) throw new Error('同期ファイルの取得に失敗しました。');
    const rawRes = await fetch(file.raw_url);
    if (!rawRes.ok) throw new Error('同期ファイルの取得に失敗しました。');
    content = await rawRes.text();
  }
  let payload: SyncPayload;
  try {
    payload = JSON.parse(content) as SyncPayload;
  } catch {
    throw new Error('同期ファイルの形式が正しくありません。');
  }
  if (
    payload.app !== 'Biological-' ||
    !payload.data ||
    !Array.isArray(payload.data.knowledgeCards) ||
    !Array.isArray(payload.data.standardProblems)
  ) {
    throw new Error('このGistはBiological-の同期データではありません。');
  }
  return { payload, updatedAt: gist.updated_at };
}
