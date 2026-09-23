import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getStudentProfile } from './studentStorage';

export interface FavoriteLessonItem {
  id: string; // e.g. `${courseId}_u${unitNumber}_l${lessonNumber}`
  courseId: string;
  courseTitle: string;
  unitNumber: number;
  unitTitle: string;
  lessonNumber: number;
  lessonTitle: string;
  lessonSubtitle?: string;
  hasVideo?: boolean;
  videoUrl?: string;
  addedAt: number;
}

const FAVORITES_STORAGE_KEY = 'tajweed_favorite_lessons_v1';

type FavoritesListener = (favorites: FavoriteLessonItem[]) => void;
const listeners: FavoritesListener[] = [];

export const subscribeFavoriteLessons = (callback: FavoritesListener): (() => void) => {
  listeners.push(callback);
  // Initial fire
  try {
    callback(getFavoriteLessons());
  } catch (err) {
    console.error('Error firing initial favorites callback:', err);
  }

  const handleCustomEvent = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (Array.isArray(detail)) {
      callback(detail);
    } else {
      callback(getFavoriteLessons());
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === FAVORITES_STORAGE_KEY) {
      callback(getFavoriteLessons());
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('tajweed_favorites_updated', handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);
  }

  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
    if (typeof window !== 'undefined') {
      window.removeEventListener('tajweed_favorites_updated', handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    }
  };
};

const notifyListeners = (favorites: FavoriteLessonItem[]) => {
  listeners.forEach((cb) => {
    try {
      cb(favorites);
    } catch (e) {
      console.error('Favorites listener error:', e);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tajweed_favorites_updated', { detail: favorites }));
  }
};

export const getFavoriteLessons = (): FavoriteLessonItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to parse favorite lessons:', e);
    return [];
  }
};

export const saveFavoriteLessonsLocally = (favorites: FavoriteLessonItem[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    notifyListeners(favorites);
  } catch (e) {
    console.error('Failed to save favorite lessons locally:', e);
  }
};

export const makeLessonFavoriteId = (courseId: string, unitNumber: number, lessonNumber: number): string => {
  return `${courseId}_u${unitNumber}_l${lessonNumber}`;
};

export const isLessonFavorited = (courseId: string, unitNumber: number, lessonNumber: number): boolean => {
  const id = makeLessonFavoriteId(courseId, unitNumber, lessonNumber);
  const current = getFavoriteLessons();
  return current.some((item) => item.id === id);
};

export const toggleFavoriteLesson = async (
  itemData: Omit<FavoriteLessonItem, 'id' | 'addedAt'>
): Promise<{ isFavorited: boolean; favorites: FavoriteLessonItem[] }> => {
  const id = makeLessonFavoriteId(itemData.courseId, itemData.unitNumber, itemData.lessonNumber);
  const current = getFavoriteLessons();
  const existingIndex = current.findIndex((item) => item.id === id);

  let updated: FavoriteLessonItem[];
  let isFavorited: boolean;

  if (existingIndex >= 0) {
    // Remove from favorites
    updated = current.filter((item) => item.id !== id);
    isFavorited = false;
  } else {
    // Add to favorites (newest first)
    const newItem: FavoriteLessonItem = {
      ...itemData,
      id,
      addedAt: Date.now(),
    };
    updated = [newItem, ...current];
    isFavorited = true;
  }

  saveFavoriteLessonsLocally(updated);

  // Sync to Firestore for student profile if available
  try {
    const profile = getStudentProfile();
    if (profile?.name) {
      const studentDocId = profile.name.trim().replace(/[\/\s#?]+/g, '_');
      const docRef = doc(db, 'student_favorites', studentDocId);
      await setDoc(docRef, {
        studentName: profile.name,
        favorites: updated,
        lastUpdated: Date.now(),
      }, { merge: true });
    }
  } catch (err) {
    // Non-blocking Firestore sync
    console.debug('Favorites Firestore sync skipped or failed:', err);
  }

  return { isFavorited, favorites: updated };
};

export const removeFavoriteLesson = async (id: string): Promise<FavoriteLessonItem[]> => {
  const current = getFavoriteLessons();
  const updated = current.filter((item) => item.id !== id);
  saveFavoriteLessonsLocally(updated);

  try {
    const profile = getStudentProfile();
    if (profile?.name) {
      const studentDocId = profile.name.trim().replace(/[\/\s#?]+/g, '_');
      const docRef = doc(db, 'student_favorites', studentDocId);
      await setDoc(docRef, {
        studentName: profile.name,
        favorites: updated,
        lastUpdated: Date.now(),
      }, { merge: true });
    }
  } catch (err) {
    console.debug('Firestore remove favorite sync:', err);
  }

  return updated;
};

export const clearAllFavorites = async (): Promise<void> => {
  saveFavoriteLessonsLocally([]);

  try {
    const profile = getStudentProfile();
    if (profile?.name) {
      const studentDocId = profile.name.trim().replace(/[\/\s#?]+/g, '_');
      const docRef = doc(db, 'student_favorites', studentDocId);
      await setDoc(docRef, {
        studentName: profile.name,
        favorites: [],
        lastUpdated: Date.now(),
      }, { merge: true });
    }
  } catch (err) {
    console.debug('Firestore clear favorites sync:', err);
  }
};
