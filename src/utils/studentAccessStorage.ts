import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Course } from '../types';
import { getStudentProfile } from './studentStorage';

export interface StudentCourseAccessMap {
  // studentName -> { [courseId: string]: boolean }
  [studentName: string]: {
    [courseId: string]: boolean; // true = unlocked/مفتوحة, false = locked/مقفلة
  };
}

const ACCESS_STORAGE_KEY = 'tajweed_student_granular_access_v1';

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
    window.dispatchEvent(new CustomEvent('tajweed_student_access_updated', { detail: map }));
    return true;
  } catch (err) {
    console.error('Failed to save student access map:', err);
    return false;
  }
};

/**
 * Check whether a specific course is unlocked for a given student.
 * If explicitly set in access map: returns that explicit boolean.
 * Otherwise returns undefined so caller can fallback to course default logic.
 */
export const getExplicitStudentCourseAccess = (
  studentName: string,
  courseId: string
): boolean | undefined => {
  const map = getStoredStudentAccessMap();
  const studentMap = map[studentName.trim()];
  if (studentMap && typeof studentMap[courseId] === 'boolean') {
    return studentMap[courseId];
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
 * Subscribes to student access updates.
 */
export const subscribeStudentAccess = (
  callback: (map: StudentCourseAccessMap) => void
): (() => void) => {
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
 * Resolves effective unlock state for the current active student session
 */
export const isCourseUnlockedForActiveStudent = (
  courseId: string,
  isTeacherMode: boolean = false,
  courseObj?: Course,
  fallbackUnlocked: boolean = false
): boolean => {
  if (isTeacherMode) return true;

  const profile = getStudentProfile();
  const studentName = profile?.name?.trim();

  if (studentName) {
    const explicit = getExplicitStudentCourseAccess(studentName, courseId);
    if (typeof explicit === 'boolean') {
      return explicit;
    }
  }

  return fallbackUnlocked;
};
