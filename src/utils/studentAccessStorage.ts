import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Course } from '../types';
import { getStudentProfile, normalizeStudentNameForMatch } from './studentStorage';

export interface StudentCourseAccessMap {
  // studentName -> { [courseId: string]: boolean }
  [studentName: string]: {
    [courseId: string]: boolean; // true = unlocked/مفتوحة, false = locked/مقفلة
  };
}

const ACCESS_STORAGE_KEY = 'tajweed_student_granular_access_v1';
const BAG_ACCESS_MODES_KEY = 'tajweed_bag_access_modes_v1';
const BAG_ACCESS_MODES_TS_KEY = 'tajweed_bag_access_modes_ts_v1';

export type BagAccessMode = 'all_unlocked' | 'selective_locked' | 'all_locked';

let isStudentAccessSyncInitialized = false;
let isBagModesSyncInitialized = false;

const dispatchAccessEvents = (detail?: unknown) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('tajweed_student_access_updated', { detail }));
  window.dispatchEvent(new CustomEvent('tajweed_unlocked_updated', { detail }));
};

const dispatchBagModesEvents = (modes: Record<string, BagAccessMode>) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('tajweed_bag_access_modes_updated', { detail: modes }));
  window.dispatchEvent(new CustomEvent('tajweed_unlocked_updated', { detail: modes }));
};

export const initBagAccessModesFirestoreSync = (): void => {
  if (typeof window === 'undefined' || isBagModesSyncInitialized) return;
  isBagModesSyncInitialized = true;

  try {
    const docRef = doc(db, 'settings', 'bag_access_modes');
    onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as { modes?: Record<string, BagAccessMode>; updatedAt?: number };
        if (!data || !data.modes || typeof data.modes !== 'object') return;

        const localTs = Number(localStorage.getItem(BAG_ACCESS_MODES_TS_KEY) || '0');
        const remoteTs = Number(data.updatedAt || '0');

        if (remoteTs >= localTs || localTs === 0) {
          localStorage.setItem(BAG_ACCESS_MODES_KEY, JSON.stringify(data.modes));
          if (remoteTs > 0) {
            localStorage.setItem(BAG_ACCESS_MODES_TS_KEY, String(remoteTs));
          }
          dispatchBagModesEvents(data.modes);
        }
      },
      (err) => {
        console.warn('Firestore bag_access_modes sync error:', err);
      }
    );
  } catch (err) {
    console.warn('Failed to initialize bag_access_modes Firestore sync:', err);
  }
};

export const initStudentAccessFirestoreSync = (): void => {
  if (typeof window === 'undefined' || isStudentAccessSyncInitialized) return;
  isStudentAccessSyncInitialized = true;

  initBagAccessModesFirestoreSync();

  try {
    const colRef = collection(db, 'student_access');
    onSnapshot(
      colRef,
      (snapshot) => {
        const currentLocal = getStoredStudentAccessMap();
        const merged: StudentCourseAccessMap = { ...currentLocal };
        let hasChanges = false;

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as {
            studentName?: string;
            courses?: Record<string, boolean>;
            updatedAt?: number;
          };
          const sName = (data.studentName || docSnap.id || '').trim();
          if (sName && data.courses && typeof data.courses === 'object') {
            merged[sName] = { ...data.courses };
            hasChanges = true;
          }
        });

        if (hasChanges) {
          localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(merged));
          dispatchAccessEvents(merged);
        }
      },
      (err) => {
        console.warn('Firestore student_access sync error:', err);
      }
    );
  } catch (err) {
    console.warn('Failed to initialize student_access Firestore sync:', err);
  }
};

export const getStoredBagAccessModes = (): Record<string, BagAccessMode> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(BAG_ACCESS_MODES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const getBagAccessMode = (courseId: string, defaultMode: BagAccessMode = 'selective_locked'): BagAccessMode => {
  const modes = getStoredBagAccessModes();
  return modes[courseId] || defaultMode;
};

export const setBagAccessMode = (courseId: string, mode: BagAccessMode): void => {
  if (typeof window === 'undefined' || !courseId) return;
  try {
    const modes = getStoredBagAccessModes();
    modes[courseId] = mode;
    const now = Date.now();
    localStorage.setItem(BAG_ACCESS_MODES_KEY, JSON.stringify(modes));
    localStorage.setItem(BAG_ACCESS_MODES_TS_KEY, String(now));
    dispatchBagModesEvents(modes);

    // Sync to Firestore so all students on any device/browser immediately enforce this mode
    const docRef = doc(db, 'settings', 'bag_access_modes');
    setDoc(
      docRef,
      {
        modes,
        updatedAt: now,
      },
      { merge: true }
    ).catch((err) => {
      console.warn('Firestore bag access mode sync failed:', err);
    });
  } catch (err) {
    console.error('Failed to save bag access mode:', err);
  }
};

export const subscribeBagAccessModes = (
  callback: (modes: Record<string, BagAccessMode>) => void
): (() => void) => {
  initBagAccessModesFirestoreSync();

  const handler = () => {
    callback(getStoredBagAccessModes());
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('tajweed_bag_access_modes_updated', handler);
  }

  callback(getStoredBagAccessModes());

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('tajweed_bag_access_modes_updated', handler);
    }
  };
};

// Initial cohort of sample students so the teacher has immediate students to manage
export const DEFAULT_ENROLLED_STUDENTS = [
  { name: 'أحمد منصور الشناوي', email: 'ahmed.m@quran.edu', group: 'حلقة الإتقان المسائية' },
  { name: 'فاطمة الزهراء علي', email: 'fatima.z@quran.edu', group: 'دفعة الإجازة المتقدمة' },
  { name: 'عمر بن خالد الدوسري', email: 'omar.k@quran.edu', group: 'حلقة التأسيس الصباحية' },
  { name: 'سارة عبد الله القرني', email: 'sara.a@quran.edu', group: 'حلقة الروايات' },
  { name: 'يوسف محمود إبراهيم', email: 'yousef.m@quran.edu', group: 'حلقة المتميزين' },
  { name: 'مريم أحمد رضوان', email: 'maryam.r@quran.edu', group: 'دفعة الإجازة المتقدمة' },
];

export const getStoredStudentAccessMap = (): StudentCourseAccessMap => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ACCESS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Failed to parse student access map:', err);
    return {};
  }
};

export const saveStoredStudentAccessMap = (map: StudentCourseAccessMap): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(map));
    dispatchAccessEvents(map);
    return true;
  } catch (err) {
    console.error('Failed to save student access map:', err);
    return false;
  }
};

/**
 * Check whether a specific course is unlocked for a given student.
 * Checks exact trimmed name first, then Arabic-normalized match.
 * If explicitly set in access map: returns that explicit boolean.
 * Otherwise returns undefined so caller can fallback to course/bag policy.
 */
export const getExplicitStudentCourseAccess = (
  studentName: string,
  courseId: string
): boolean | undefined => {
  const cleanName = (studentName || '').trim();
  if (!cleanName || !courseId) return undefined;

  const map = getStoredStudentAccessMap();
  const exactStudentMap = map[cleanName];
  if (exactStudentMap && typeof exactStudentMap[courseId] === 'boolean') {
    return exactStudentMap[courseId];
  }

  const normTarget = normalizeStudentNameForMatch(cleanName);
  if (!normTarget) return undefined;

  for (const [key, studentMap] of Object.entries(map)) {
    if (normalizeStudentNameForMatch(key) === normTarget && studentMap && typeof studentMap[courseId] === 'boolean') {
      return studentMap[courseId];
    }
  }

  return undefined;
};

/**
 * Set lock/unlock state for a single student on a specific course.
 */
export const setStudentCourseAccess = async (
  studentName: string,
  courseId: string,
  isUnlocked: boolean
): Promise<boolean> => {
  const cleanName = studentName.trim();
  if (!cleanName || !courseId) return false;

  const currentMap = getStoredStudentAccessMap();
  const updatedStudentMap = {
    ...(currentMap[cleanName] || {}),
    [courseId]: isUnlocked,
  };

  const updatedMap: StudentCourseAccessMap = {
    ...currentMap,
    [cleanName]: updatedStudentMap,
  };

  const savedLocally = saveStoredStudentAccessMap(updatedMap);

  // Firestore asynchronous sync
  try {
    const accessDocRef = doc(db, 'student_access', cleanName);
    await setDoc(accessDocRef, {
      studentName: cleanName,
      courses: updatedStudentMap,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore student access sync failed (operating with local storage):', err);
  }

  return savedLocally;
};

/**
 * Bulk update: Set lock/unlock state for multiple students on a single course.
 */
export const bulkSetCourseAccessForStudents = async (
  studentNames: string[],
  courseId: string,
  isUnlocked: boolean
): Promise<boolean> => {
  if (!studentNames.length || !courseId) return false;

  const currentMap = getStoredStudentAccessMap();
  const updatedMap = { ...currentMap };

  studentNames.forEach((name) => {
    const clean = name.trim();
    if (clean) {
      updatedMap[clean] = {
        ...(updatedMap[clean] || {}),
        [courseId]: isUnlocked,
      };
    }
  });

  const savedLocally = saveStoredStudentAccessMap(updatedMap);

  // Firestore sync for each modified student
  try {
    const syncPromises = studentNames.map(async (name) => {
      const clean = name.trim();
      if (!clean) return;
      const accessDocRef = doc(db, 'student_access', clean);
      return setDoc(accessDocRef, {
        studentName: clean,
        courses: updatedMap[clean],
        updatedAt: Date.now(),
      }, { merge: true });
    });
    await Promise.all(syncPromises);
  } catch (err) {
    console.warn('Firestore bulk access sync failed:', err);
  }

  return savedLocally;
};

/**
 * Bulk update: Set lock/unlock state for a single student across all courses.
 */
export const bulkSetAllCoursesForStudent = async (
  studentName: string,
  courseIds: string[],
  isUnlocked: boolean
): Promise<boolean> => {
  const cleanName = studentName.trim();
  if (!cleanName || !courseIds.length) return false;

  const currentMap = getStoredStudentAccessMap();
  const studentMap = { ...(currentMap[cleanName] || {}) };

  courseIds.forEach((cId) => {
    studentMap[cId] = isUnlocked;
  });

  const updatedMap = {
    ...currentMap,
    [cleanName]: studentMap,
  };

  const savedLocally = saveStoredStudentAccessMap(updatedMap);

  try {
    const accessDocRef = doc(db, 'student_access', cleanName);
    await setDoc(accessDocRef, {
      studentName: cleanName,
      courses: studentMap,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore student all courses sync failed:', err);
  }

  return savedLocally;
};

/**
 * Subscribes to student access updates (local + Firestore real-time).
 */
export const subscribeStudentAccess = (
  callback: (map: StudentCourseAccessMap) => void
): (() => void) => {
  initStudentAccessFirestoreSync();

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<StudentCourseAccessMap>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    } else {
      callback(getStoredStudentAccessMap());
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('tajweed_student_access_updated', handler);
  }

  callback(getStoredStudentAccessMap());

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('tajweed_student_access_updated', handler);
    }
  };
};

/**
 * Resolves effective bag access mode for a course taking status and pricing into account.
 */
export const resolveEffectiveBagMode = (
  courseId: string,
  courseStatus: string = 'available',
  isPaid: boolean = false
): BagAccessMode => {
  const storedMode = getStoredBagAccessModes()[courseId];

  if (courseStatus === 'locked') {
    return storedMode === 'selective_locked' ? 'selective_locked' : 'all_locked';
  }

  if (isPaid) {
    // Paid courses must never be auto-unlocked for all students; require explicit grant unless locked for all
    return storedMode === 'all_locked' ? 'all_locked' : 'selective_locked';
  }

  return storedMode || 'all_unlocked';
};

/**
 * Resolves effective unlock state for the current active student session
 */
export const isCourseUnlockedForActiveStudent = (
  courseId: string,
  isTeacherMode: boolean = false,
  courseObj?: Course,
  _fallbackUnlocked: boolean = false
): boolean => {
  if (isTeacherMode) return true;

  const profile = getStudentProfile();
  const studentName = profile?.name?.trim() || '';
  return getStudentEffectiveCourseAccess(
    studentName,
    courseId,
    courseObj?.status || 'available',
    courseObj?.pricing?.isPaid ?? false
  ).isUnlocked;
};

/**
 * Returns access status for a student considering explicit setting, bag mode, course status, and paid status
 */
export const getStudentEffectiveCourseAccess = (
  studentName: string,
  courseId: string,
  courseStatus: string = 'available',
  isPaid: boolean = false
): {
  isUnlocked: boolean;
  reason: 'coming_soon' | 'explicit_grant' | 'explicit_revoke' | 'mode_all_unlocked' | 'mode_selective_locked' | 'mode_all_locked';
} => {
  if (courseStatus === 'coming_soon') {
    return { isUnlocked: false, reason: 'coming_soon' };
  }

  const mode = resolveEffectiveBagMode(courseId, courseStatus, isPaid);

  if (mode === 'all_locked') {
    return { isUnlocked: false, reason: 'mode_all_locked' };
  }

  const cleanName = (studentName || '').trim();
  const explicit = cleanName ? getExplicitStudentCourseAccess(cleanName, courseId) : undefined;

  if (mode === 'selective_locked') {
    if (explicit === true) {
      return { isUnlocked: true, reason: 'explicit_grant' };
    }
    return { isUnlocked: false, reason: 'mode_selective_locked' };
  }

  // mode === 'all_unlocked'
  if (explicit === false) {
    return { isUnlocked: false, reason: 'explicit_revoke' };
  }

  return { isUnlocked: true, reason: 'mode_all_unlocked' };
};


