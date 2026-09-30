import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getStudentProfile } from './studentStorage';

export interface LessonSelfReflection {
  id: string; // `${studentName}_${courseId}_u${unitNumber}_l${lessonNumber}`
  studentName: string;
  courseId: string;
  unitNumber: number;
  unitTitle: string;
  lessonNumber: number;
  lessonTitle: string;
  rating: number; // 1 to 5
  ratingLabel: string;
  note?: string;
  updatedAt: number;
}

const STORAGE_KEY = 'tajweed_lesson_self_reflections_v1';

export const REFLECTION_RATINGS = [
  { value: 1, stars: '⭐', label: 'فهم ضعيف', fullLabel: 'فهم ضعيف / يحتاج مراجعة مع المعلم ❓', color: 'text-rose-400', bg: 'bg-rose-950/60 border-rose-800' },
  { value: 2, stars: '⭐⭐', label: 'فهم أساسي', fullLabel: 'فهم أساسي غير مكتمل 📖', color: 'text-amber-500', bg: 'bg-amber-950/60 border-amber-800' },
  { value: 3, stars: '⭐⭐⭐', label: 'فهم متوسط', fullLabel: 'فهم متوسط ومقبول 👍', color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-700' },
  { value: 4, stars: '⭐⭐⭐⭐', label: 'فهم جيد جداً', fullLabel: 'فهم جيد جداً واستيعاب ممتاز ⚡', color: 'text-emerald-400', bg: 'bg-emerald-950/50 border-emerald-700' },
  { value: 5, stars: '⭐⭐⭐⭐⭐', label: 'إتقان تام', fullLabel: 'إتقان تام وفهم عميق بنسبة 100% 🏆', color: 'text-amber-300', bg: 'bg-amber-400/20 border-amber-400/60' },
];

export const getStoredReflections = (): Record<string, LessonSelfReflection> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveStoredReflections = (map: Record<string, LessonSelfReflection>): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('tajweed_reflections_updated', { detail: map }));
    return true;
  } catch (e) {
    console.error('Error saving self-reflections:', e);
    return false;
  }
};

export const getLessonReflection = (
  studentName: string,
  courseId: string,
  unitNumber: number,
  lessonNumber: number
): LessonSelfReflection | null => {
  const map = getStoredReflections();
  const id = `${studentName.trim()}_${courseId}_u${unitNumber}_l${lessonNumber}`;
  return map[id] || null;
};

export const saveLessonReflection = async (
  courseId: string,
  unitNumber: number,
  unitTitle: string,
  lessonNumber: number,
  lessonTitle: string,
  rating: number,
  note?: string,
  studentNameOverride?: string
): Promise<LessonSelfReflection | null> => {
  const profile = getStudentProfile();
  const studentName = (studentNameOverride || profile?.name || 'طالب مجهول').trim();
  if (!studentName) return null;

  const ratingInfo = REFLECTION_RATINGS.find((r) => r.value === rating) || REFLECTION_RATINGS[2];
  const id = `${studentName}_${courseId}_u${unitNumber}_l${lessonNumber}`;

  const reflection: LessonSelfReflection = {
    id,
    studentName,
    courseId,
    unitNumber,
    unitTitle,
    lessonNumber,
    lessonTitle,
    rating,
    ratingLabel: ratingInfo.fullLabel,
    note: note?.trim() || '',
    updatedAt: Date.now(),
  };

  const currentMap = getStoredReflections();
  currentMap[id] = reflection;
  saveStoredReflections(currentMap);

  // Firestore asynchronous sync
  try {
    const refDoc = doc(db, 'self_reflections', id);
    await setDoc(refDoc, reflection, { merge: true });
  } catch (err) {
    console.warn('Firestore self reflection sync failed (saved locally):', err);
  }

  return reflection;
};

export const getAllStudentReflectionsList = (): LessonSelfReflection[] => {
  const map = getStoredReflections();
  return Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt);
};

export const subscribeSelfReflections = (callback: (list: LessonSelfReflection[]) => void): (() => void) => {
  const handler = () => {
    callback(getAllStudentReflectionsList());
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('tajweed_reflections_updated', handler);
  }

  callback(getAllStudentReflectionsList());

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('tajweed_reflections_updated', handler);
    }
  };
};
