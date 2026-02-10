import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { ArticleDraft } from '../types/draft.js';
import { createLogger } from '../utils/index.js';

const logger = createLogger('draft-service');

// File paths for persistence
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const DRAFTS_FILE = path.join(DATA_DIR, 'drafts.json');
let persistInFlight: Promise<void> | null = null;

// In-memory storage with disk persistence
const drafts: Map<string, ArticleDraft> = new Map();

// Index for userId lookup
const userIndex: Map<string, Set<string>> = new Map(); // userId -> Set<draftId>

interface PersistedDraftData {
  drafts: ArticleDraft[];
  version: string;
}

/**
 * Flush draft data to disk
 * Handles concurrent calls by waiting for ongoing flush and ensuring
 * a new flush happens if data changed during the wait
 */
export const flushPersist = async () => {
  // Wait for any ongoing flush to complete first
  while (persistInFlight) {
    await persistInFlight;
  }

  // Check if another flush started while we were waiting
  if (persistInFlight) {
    await persistInFlight;
    return;
  }

  // Start a new flush operation
  const payload: PersistedDraftData = {
    version: '1.0',
    drafts: Array.from(drafts.values()),
  };

  const tempFile = `${DRAFTS_FILE}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`;

  const currentPersist = (async () => {
    try {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
      await fs.promises.writeFile(tempFile, JSON.stringify(payload, null, 2), 'utf-8');
      await fs.promises.rename(tempFile, DRAFTS_FILE);
      logger.debug('Draft data persisted to disk', { draftCount: drafts.size });
    } catch (error) {
      logger.error('Failed to persist draft data to disk', { error });
      try {
        if (fs.existsSync(tempFile)) {
          await fs.promises.unlink(tempFile);
        }
      } catch { /* ignore */ }
    }
  })();

  persistInFlight = currentPersist.finally(() => {
    if (persistInFlight === currentPersist) {
      persistInFlight = null;
    }
  });

  await persistInFlight;
};

/**
 * Schedule draft data persistence
 * @deprecated This function had a bug where it only saved the first change in a 2-second window.
 * Use flushPersist() directly instead for reliable persistence.
 */
const persistData = () => {
  // Call flushPersist directly to avoid debounce bug
  // The old implementation would ignore subsequent changes within 2 seconds
  void flushPersist();
};

/**
 * Load draft data from disk
 */
const loadData = async () => {
  try {
    try {
      await fs.promises.access(DRAFTS_FILE, fs.constants.F_OK);
    } catch {
      logger.info('No existing draft data file found, starting fresh');
      return;
    }

    const raw = await fs.promises.readFile(DRAFTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<PersistedDraftData>;
    
    if (typeof parsed !== 'object' || parsed === null || !Array.isArray(parsed.drafts)) {
      logger.warn('Draft data file malformed, skipping load');
      return;
    }

    let loadedCount = 0;
    parsed.drafts.forEach(d => {
      if (!d || !d.id || !d.userId) {
        return;
      }

      drafts.set(d.id, d);
      
      if (!userIndex.has(d.userId)) {
        userIndex.set(d.userId, new Set());
      }
      userIndex.get(d.userId)!.add(d.id);
      
      loadedCount++;
    });

    logger.info('Draft data loaded from disk', { draftCount: loadedCount });
  } catch (error) {
    logger.error('Failed to load draft data from disk', { error });
  }
};

/**
 * Initialize draft store
 */
export const initDraftStore = async (): Promise<void> => {
  await loadData();
};

/**
 * Save a draft (create or update)
 * For simplicity, we'll allow users to have multiple drafts, but typically we might just want one "current draft"
 * If id is provided, update; otherwise create.
 */
export const saveDraft = async (
  userId: string,
  data: Omit<ArticleDraft, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<ArticleDraft> => {
  const now = Date.now();
  let draft: ArticleDraft;

  if (data.id && drafts.has(data.id)) {
    // Update existing
    const existing = drafts.get(data.id)!;
    if (existing.userId !== userId) {
      throw new Error('Access denied');
    }
    draft = {
      ...existing,
      ...data,
      id: data.id, // Ensure ID is preserved
      updatedAt: now,
    };
  } else {
    // Create new
    const id = data.id || uuidv4();
    draft = {
      ...data,
      id,
      userId,
      createdAt: now,
      updatedAt: now,
    };
  }
  
  drafts.set(draft.id, draft);
  
  if (!userIndex.has(userId)) {
    userIndex.set(userId, new Set());
  }
  userIndex.get(userId)!.add(draft.id);
  
  persistData();
  logger.info('Draft saved', { draftId: draft.id, userId });
  
  return draft;
};

/**
 * Get drafts for a user
 */
export const getUserDrafts = (userId: string): ArticleDraft[] => {
  const draftIds = userIndex.get(userId);
  if (!draftIds) return [];
  
  return Array.from(draftIds)
    .map(id => drafts.get(id)!)
    .filter(Boolean)
    .sort((a, b) => b.updatedAt - a.updatedAt); // Most recently updated first
};

/**
 * Get draft by ID
 */
export const getDraftById = (draftId: string, userId: string): ArticleDraft | null => {
  const draft = drafts.get(draftId);
  if (!draft) return null;
  if (draft.userId !== userId) return null;
  return draft;
};

/**
 * Delete draft
 */
export const deleteDraft = (draftId: string, userId: string): boolean => {
  const draft = drafts.get(draftId);
  if (!draft) return false;
  if (draft.userId !== userId) return false;
  
  drafts.delete(draftId);
  
  const userDrafts = userIndex.get(userId);
  if (userDrafts) {
    userDrafts.delete(draftId);
  }
  
  persistData();
  logger.info('Draft deleted', { draftId, userId });
  return true;
};
