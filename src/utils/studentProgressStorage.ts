import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getStudentProfile, clearStudentProfile, clearAllSubmissions } from './studentStorage';
import { Course } from '../types';
import { getCourseById, getAllCourses } from '../data/courses';
import { getCourseBadges, notifyBadgeUnlocked } from './badgeSystem';
import { getExplicitStudentCourseAccess } from './studentAccessStorage';

export interface SingleCourseProgress {
  completedUnitNumbers: number[]; // e.g. [1, 2, 3]
  readSections: string[]; // e.g. ['exceptions', 'examples', 'summary', 'rules', 'books']
  examBestScore: number | null; // e.g. 95 (percentage)
  examCompleted: boolean;
  totalQuizzesPassed: number;
  lastUpdated: number;
}

export type StudentProgressData = SingleCourseProgress;

export interface MultiCourseProgressData {
  courses: Record<string, SingleCourseProgress>;
  lastUpdated: number;
}

const PROGRESS_KEY = 'tajweed_multi_student_progress_v2';
const OLD_PROGRESS_KEY = 'tajweed_student_progress_v1';

export const getDefaultSingleProgress = (): SingleCourseProgress => ({
  completedUnitNumbers: [],
  readSections: [],
  examBestScore: null,
  examCompleted: false,
  totalQuizzesPassed: 0,
  lastUpdated: Date.now(),
});

let currentMultiProgress: MultiCourseProgressData = {
  courses: {
    foundational_rules: getDefaultSingleProgress(),
    sakinan: getDefaultSingleProgress(),
    idgham: getDefaultSingleProgress(),
    makharij: getDefaultSingleProgress(),
    ijazah: getDefaultSingleProgress(),
  },
  lastUpdated: Date.now(),
};

let isInitialized = false;
const listeners: Array<() => void> = [];

export const subscribeStudentProgress = (callback: () => void): (() => void) => {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
};

const notifyListeners = () => {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (err) {
      console.error('Progress storage listener error:', err);
    }
  });
};

export const loadMultiProgress = (): MultiCourseProgressData => {
  if (typeof window !== 'undefined' && !isInitialized) {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      try {
        currentMultiProgress = JSON.parse(raw);
      } catch (e) {
        console.warn('Failed to parse multi progress from localStorage:', e);
      }
    } else {
      // Migrate old single progress if exists to sakinan course
      const oldRaw = localStorage.getItem(OLD_PROGRESS_KEY);
      if (oldRaw) {
        try {
          const oldData = JSON.parse(oldRaw);
          currentMultiProgress.courses.sakinan = {
            completedUnitNumbers: oldData.completedUnitNumbers || [],
            readSections: oldData.readSections || [],
            examBestScore: oldData.examBestScore ?? null,
            examCompleted: oldData.examCompleted || false,
            totalQuizzesPassed: oldData.totalQuizzesPassed || 0,
            lastUpdated: oldData.lastUpdated || Date.now(),
          };
        } catch (e) {
          console.warn('Failed to migrate old progress:', e);
        }
      }
    }
    isInitialized = true;
  }
  return currentMultiProgress;
};

export const getStudentProgress = (courseId: string = 'foundational_rules'): SingleCourseProgress => {
  const multi = loadMultiProgress();
  if (!multi.courses[courseId]) {
    multi.courses[courseId] = getDefaultSingleProgress();
  }
  return multi.courses[courseId];
};

const saveProgressLocally = (multiData: MultiCourseProgressData) => {
  currentMultiProgress = multiData;
  if (typeof window !== 'undefined') {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(multiData));
  }
  notifyListeners();
};

const syncProgressToFirestore = async (courseId: string, data: SingleCourseProgress) => {
  const profile = getStudentProfile();
  if (!profile || !profile.name) return;

  try {
    const docRef = doc(db, 'student_progress', `${profile.name}_${courseId}`);
    await setDoc(docRef, {
      ...data,
      courseId,
      studentName: profile.name,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore progress sync failed:', err);
  }
};

export const markUnitCompleted = async (unitNumber: number, completed: boolean = true, courseId: string = 'foundational_rules') => {
  const multi = { ...loadMultiProgress() };
  const prevProg = { ...getStudentProgress(courseId) };
  const prog = { ...prevProg };
  
  const wasAlreadyCompleted = prog.completedUnitNumbers.includes(unitNumber);
  let set = new Set(prog.completedUnitNumbers);
  if (completed) {
    set.add(unitNumber);
  } else {
    set.delete(unitNumber);
  }
  prog.completedUnitNumbers = Array.from(set).sort((a, b) => a - b);
  prog.lastUpdated = Date.now();
  
  multi.courses[courseId] = prog;
  multi.lastUpdated = Date.now();

  saveProgressLocally(multi);
  await syncProgressToFirestore(courseId, prog);

  // If newly completed, trigger celebratory badge toast
  if (completed && !wasAlreadyCompleted) {
    const badges = getCourseBadges(prog, courseId);
    const unitBadge = badges.find((b) => b.id === `unit_${courseId}_${unitNumber}` || (b.category === 'unit' && b.unitNumber === unitNumber));
    if (unitBadge && unitBadge.isUnlocked) {
      notifyBadgeUnlocked(unitBadge);
    }
    // Check if all units completed
    const course = getCourseById(courseId);
    const totalUnits = course?.units?.length || 5;
    const allUnitsBadge = badges.find((b) => b.id === `all_units_${courseId}`);
    if (allUnitsBadge && allUnitsBadge.isUnlocked && prog.completedUnitNumbers.length >= totalUnits && prevProg.completedUnitNumbers.length < totalUnits) {
      setTimeout(() => notifyBadgeUnlocked(allUnitsBadge), 1500);
    }
  }
};

export const markSectionRead = async (sectionId: string, courseId: string = 'foundational_rules') => {
  const multi = { ...loadMultiProgress() };
  const prog = { ...getStudentProgress(courseId) };

  let set = new Set(prog.readSections);
  set.add(sectionId);
  prog.readSections = Array.from(set);
  prog.lastUpdated = Date.now();

  multi.courses[courseId] = prog;
  multi.lastUpdated = Date.now();

  saveProgressLocally(multi);
  await syncProgressToFirestore(courseId, prog);
};

export const recordExamScore = async (scorePercentage: number, courseId: string = 'foundational_rules') => {
  const multi = { ...loadMultiProgress() };
  const prog = { ...getStudentProgress(courseId) };

  prog.examCompleted = true;
  if (prog.examBestScore === null || scorePercentage > prog.examBestScore) {
    prog.examBestScore = scorePercentage;
  }
  prog.lastUpdated = Date.now();

  multi.courses[courseId] = prog;
  multi.lastUpdated = Date.now();

  saveProgressLocally(multi);
  await syncProgressToFirestore(courseId, prog);

  // Check and trigger exam badges
  const badges = getCourseBadges(prog, courseId);
  if (scorePercentage >= 100) {
    const perfectBadge = badges.find((b) => b.id === `exam_perfect_${courseId}`);
    if (perfectBadge) {
      notifyBadgeUnlocked(perfectBadge);
    }
  } else if (scorePercentage >= 90) {
    const passedBadge = badges.find((b) => b.id === `exam_distinction_${courseId}`);
    if (passedBadge) {
      notifyBadgeUnlocked(passedBadge);
    }
  }
};

export const isCoursePassed = (courseId: string = 'foundational_rules'): boolean => {
  const prog = getStudentProgress(courseId);
  return Boolean(prog.examCompleted && prog.examBestScore !== null && prog.examBestScore >= 90);
};

const OPENED_COURSES_KEY = 'tajweed_student_opened_courses_v1';

export const markCourseOpened = (courseId: string): void => {
  if (typeof window === 'undefined' || !courseId) return;
  try {
    const raw = localStorage.getItem(OPENED_COURSES_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(courseId)) {
      list.push(courseId);
      localStorage.setItem(OPENED_COURSES_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('tajweed_opened_courses_updated', { detail: list }));
    }
  } catch (e) {
    console.warn('Error saving opened course:', e);
  }
};

export const recordCourseOpened = markCourseOpened;

export const getOpenedCourseIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OPENED_COURSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isCourseStudied = (courseId: string, prog?: SingleCourseProgress): boolean => {
  const p = prog || getStudentProgress(courseId);
  if (!p) return false;
  return (
    Boolean(p.completedUnitNumbers && p.completedUnitNumbers.length > 0) ||
    Boolean(p.readSections && p.readSections.length > 0) ||
    Boolean(p.examCompleted) ||
    Boolean(p.examBestScore !== null && p.examBestScore > 0) ||
    Boolean(p.totalQuizzesPassed !== undefined && p.totalQuizzesPassed > 0)
  );
};

export const getStrictlyStudiedCourses = (fallbackActiveId?: string): Course[] => {
  const all = getAllCourses();
  const multi = loadMultiProgress();
  const studied = all.filter((c) => isCourseStudied(c.id, multi.courses[c.id]));
  if (studied.length > 0) return studied;
  const fallback = all.find((c) => c.id === fallbackActiveId) || all[0];
  return fallback ? [fallback] : [];
};

/**
 * Returns strictly the courses the student has ACTUALLY studied (has progress).
 * If no course has been studied yet, falls back strictly to the activeCourseId.
 */
export const getStudentStudiedCourses = (activeCourseId?: string): Course[] => {
  const all = getAllCourses();
  const multi = loadMultiProgress();

  // Filter strictly by actual study progress (units, sections, quizzes, exam)
  const studied = all.filter((c) => isCourseStudied(c.id, multi.courses[c.id]));

  if (studied.length > 0) {
    return studied;
  }

  // Fallback strictly to current course if student has not studied any course yet
  const fallback = all.find((c) => c.id === activeCourseId) || all[0];
  return fallback ? [fallback] : [];
};

const UNLOCKED_COURSES_KEY = 'tajweed_unlocked_courses_list';

export const getStudentUnlockedCourses = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(UNLOCKED_COURSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const grantCourseAccessToStudent = (courseId: string): void => {
  const current = getStudentUnlockedCourses();
  if (!current.includes(courseId)) {
    const updated = [...current, courseId];
    localStorage.setItem(UNLOCKED_COURSES_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tajweed_unlocked_updated', { detail: updated }));
    }
  }
};

export const revokeCourseAccessFromStudent = (courseId: string): void => {
  const current = getStudentUnlockedCourses();
  const updated = current.filter((id) => id !== courseId);
  localStorage.setItem(UNLOCKED_COURSES_KEY, JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tajweed_unlocked_updated', { detail: updated }));
  }
};

export interface CourseLockStatus {
  isUnlocked: boolean;
  statusType: 'teacher_unlocked' | 'teacher_locked' | 'default_unlocked' | 'passed_prerequisite' | 'locked_prerequisite' | 'paid_locked' | 'coming_soon';
  badgeText: string;
  badgeClass: string;
  explanation: string;
  isExplicitTeacherAction: boolean;
}

export type CourseLockInfo = CourseLockStatus;

export interface CourseTimelineItem {
  id: string;
  unitIndex: number;
  unitNumber: number;
  lessonIndex: number;
  lessonNumber: number;
  lessonTitle: string;
  unitTitle: string;
  isCompleted: boolean;
  completedAt?: number;
  isCurrentNext: boolean;
  isLocked: boolean;
}

export const getCourseLockDetails = (
  courseId: string, 
  isTeacherMode: boolean = false,
  courseObj?: Course
): CourseLockInfo => {
  // 1. In teacher mode, always allow full preview and inspection
  if (isTeacherMode) {
    return {
      isUnlocked: true,
      statusType: 'teacher_unlocked',
      badgeText: 'معاينة المعلم 👁️',
      badgeClass: 'bg-indigo-950/90 text-indigo-300 border-indigo-400',
      explanation: 'أنت في وضع المعلم ولديك صلاحية معاينة وإدارة الحقيبة.',
      isExplicitTeacherAction: false,
    };
  }

  const course = courseObj || getCourseById(courseId);
  if (!course) {
    return {
      isUnlocked: false,
      statusType: 'teacher_locked',
      badgeText: 'مقفلة 🔒',
      badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
      explanation: 'الحقيبة غير متاحة حالياً.',
      isExplicitTeacherAction: false,
    };
  }

  // 2. ABSOLUTE SYSTEM LOCK: If course status is locked or coming_soon, it is locked for ALL students across platform
  if (course.status === 'locked') {
    return {
      isUnlocked: false,
      statusType: 'teacher_locked',
      badgeText: 'مقفلة من المعلم 🔒',
      badgeClass: 'bg-rose-950/90 text-rose-300 border-rose-500 font-bold',
      explanation: 'هذه الحقيبة مقفلة من المعلم عبر لوحة التحكم.',
      isExplicitTeacherAction: true,
    };
  }

  if (course.status === 'coming_soon') {
    return {
      isUnlocked: false,
      statusType: 'coming_soon',
      badgeText: 'قريباً - قيد الإعداد ⏳',
      badgeClass: 'bg-purple-950/90 text-purple-300 border-purple-500/50',
      explanation: 'هذه الحقيبة قيد المراجعة والإطلاق قريباً.',
      isExplicitTeacherAction: false,
    };
  }

  // 3. STUDENT-SPECIFIC OVERRIDE (From StudentAccessManagementPanel)
  const profile = getStudentProfile();
  const studentName = profile?.name?.trim();
  if (studentName) {
    const explicit = getExplicitStudentCourseAccess(studentName, courseId);
    if (explicit === false) {
      return {
        isUnlocked: false,
        statusType: 'teacher_locked',
        badgeText: 'مقفلة من قِبل المعلم 🔒',
        badgeClass: 'bg-rose-950/90 text-rose-300 border-rose-500 font-bold',
        explanation: `تم تقييد الوصول لهذه الحقيبة من قِبل المعلم مؤقتاً يا ${studentName}.`,
        isExplicitTeacherAction: true,
      };
    } else if (explicit === true) {
      return {
        isUnlocked: true,
        statusType: 'teacher_unlocked',
        badgeText: 'مفتوحة بقرار المعلم 🔑',
        badgeClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-400 font-bold',
        explanation: `تم منحك صلاحية فتح هذه الحقيبة خصيصاً من قِبل المعلم يا ${studentName}.`,
        isExplicitTeacherAction: true,
      };
    }
  }

  // 4. PAID / RESTRICTED CONTENT
  if (course.pricing?.isPaid) {
    const explicitlyUnlocked = getStudentUnlockedCourses();
    const isGranted = explicitlyUnlocked.includes(courseId);
    if (!isGranted) {
      return {
        isUnlocked: false,
        statusType: 'paid_locked',
        badgeText: `${course.pricing.priceText || 'محتوى مدفوع'} 🔒`,
        badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-500',
        explanation: 'هذه الحقيبة تتطلب اشتراكاً أو إذن المعلم المباشر.',
        isExplicitTeacherAction: false,
      };
    }
  }

  // 5. DEVICE LEVEL UNLOCK LIST (For courses that are paid/special)
  const explicitlyUnlocked = getStudentUnlockedCourses();
  if (explicitlyUnlocked.includes(courseId)) {
    return {
      isUnlocked: true,
      statusType: 'teacher_unlocked',
      badgeText: 'مفتوحة ومصرح بها 🔑',
      badgeClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-400',
      explanation: 'تم فتح هذه الحقيبة على هذا الجهاز.',
      isExplicitTeacherAction: true,
    };
  }

  // 6. DEFAULT FOR ACTIVE AVAILABLE COURSES
  const isAvail = course.status === 'available' && !course.pricing?.isPaid;
  return {
    isUnlocked: isAvail,
    statusType: isAvail ? 'default_unlocked' : 'teacher_locked',
    badgeText: isAvail ? 'مفتوحة ومتاحة 🟢' : 'مقفلة من المعلم 🔒',
    badgeClass: isAvail ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500' : 'bg-rose-950/90 text-rose-300 border-rose-500',
    explanation: isAvail ? 'الحقيبة متاحة للدراسة.' : 'الحقيبة مقفلة وتحتاج إذن المعلم.',
    isExplicitTeacherAction: !isAvail,
  };
};

/**
 * Generates an ordered chronological timeline of all lessons for the learning journey
 */
export const getCourseLessonsTimeline = (
  course: Course,
  prog: SingleCourseProgress,
  isUnlocked: boolean = true
): CourseTimelineItem[] => {
  const items: CourseTimelineItem[] = [];
  const completedUnits = new Set(prog.completedUnitNumbers || []);
  let foundFirstIncomplete = false;

  (course.units || []).forEach((unit, unitIdx) => {
    const isUnitDone = completedUnits.has(unit.unitNumber);
    (unit.lessons || []).forEach((lesson, lessonIdx) => {
      const isCompleted = isUnitDone;
      const isCurrentNext = !isCompleted && !foundFirstIncomplete && isUnlocked;
      if (isCurrentNext) {
        foundFirstIncomplete = true;
      }

      items.push({
        id: `u${unit.unitNumber}_l${lesson.lessonNumber}`,
        unitIndex: unitIdx,
        unitNumber: unit.unitNumber,
        lessonIndex: lessonIdx,
        lessonNumber: lesson.lessonNumber,
        lessonTitle: lesson.title,
        unitTitle: unit.title,
        isCompleted,
        completedAt: isCompleted ? prog.lastUpdated : undefined,
        isCurrentNext,
        isLocked: !isUnlocked,
      });
    });
  });

  return items;
};

export const isCourseUnlocked = (
  courseId: string, 
  isTeacherMode: boolean = false,
  courseObj?: Course
): boolean => {
  return getCourseLockDetails(courseId, isTeacherMode, courseObj).isUnlocked;
};

export const calculateProgressPercentage = (prog?: SingleCourseProgress, totalUnitsCount: number = 4): number => {
  const p = prog || getStudentProgress('foundational_rules');
  
  const unitWeight = (p.completedUnitNumbers.length / Math.max(1, totalUnitsCount)) * 50;
  
  const sectionsCount = p.readSections.length; // max 4
  const sectionWeight = Math.min(sectionsCount / 4, 1) * 20;

  let examWeight = 0;
  if (p.examCompleted && p.examBestScore !== null) {
    examWeight = Math.min((p.examBestScore / 100) * 30, 30);
  }

  const total = Math.round(unitWeight + sectionWeight + examWeight);
  return Math.min(100, Math.max(0, total));
};

export const getBadges = (prog: SingleCourseProgress = getStudentProgress('foundational_rules'), courseTitle: string = 'أصول التلاوة والتأسيس') => {
  const percent = calculateProgressPercentage(prog);
  const badges = [];

  if (prog.completedUnitNumbers.length >= 1) {
    badges.push({ title: 'بداية الممر', desc: 'إتمام الباب الأول بنجاح', icon: '🌱', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' });
  }
  if (prog.completedUnitNumbers.length >= 3) {
    badges.push({ title: 'قطع الشوط', desc: 'إتمام 3 أبواب تجويدية', icon: '🌿', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' });
  }
  if (prog.completedUnitNumbers.length >= 5) {
    badges.push({ title: 'حافظ الأبواب الخمسة', desc: 'إتقان جميع الأبواب المنهاجية', icon: '🏆', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' });
  }
  if (prog.readSections.length >= 3) {
    badges.push({ title: 'مستكشف المراجع', desc: 'دراسة الكلمات المستثناة والمختبر والجدول', icon: '📖', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' });
  }
  if (prog.examCompleted && (prog.examBestScore || 0) >= 80) {
    badges.push({ title: 'فارس التجويد والقراءات', desc: 'اجتياز الاختبار النهائي الشامل بدرجة ممتازة', icon: '👑', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' });
  }
  if (percent === 100) {
    badges.push({ title: `خبير ${courseTitle}`, desc: 'إكمال 100% من الحقيبة التدريبية', icon: '⭐', bg: 'bg-amber-400 text-slate-950 font-bold border-amber-300' });
  }

  return badges;
};

export const resetProgress = async (courseId?: string) => {
  const profile = getStudentProfile();
  const allCourses = getAllCourses();
  
  if (courseId) {
    currentMultiProgress.courses[courseId] = getDefaultSingleProgress();
    currentMultiProgress.lastUpdated = Date.now();
    saveProgressLocally(currentMultiProgress);

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(OPENED_COURSES_KEY);
        if (raw) {
          const list: string[] = JSON.parse(raw);
          const filtered = list.filter((id) => id !== courseId);
          localStorage.setItem(OPENED_COURSES_KEY, JSON.stringify(filtered));
        }
        localStorage.removeItem(`tajweed_exam_saved_result_${courseId}`);
        localStorage.removeItem(`tajweed_exam_result_${courseId}`);
        localStorage.removeItem(`tajweed_quiz_answers_${courseId}`);
      } catch (e) {
        console.warn('Reset course storage error:', e);
      }
    }

    if (profile && profile.name) {
      try {
        await deleteDoc(doc(db, 'student_progress', `${profile.name}_${courseId}`));
      } catch (err) {
        console.warn('Firestore progress doc delete failed:', err);
      }
    }
  } else {
    // Reset all courses across platform
    const newCourses: Record<string, SingleCourseProgress> = {};
    allCourses.forEach((c) => {
      newCourses[c.id] = getDefaultSingleProgress();
    });
    currentMultiProgress = {
      courses: newCourses,
      lastUpdated: Date.now(),
    };

    saveProgressLocally(currentMultiProgress);

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(OPENED_COURSES_KEY);
        localStorage.removeItem('tajweed_unit_quiz_answers_v3');
        localStorage.removeItem('tajweed_unit_quiz_submitted_v3');
        localStorage.removeItem('tajweed_exam_saved_result');
        localStorage.removeItem('tajweed_student_progress_v1');
        allCourses.forEach((c) => {
          localStorage.removeItem(`tajweed_exam_saved_result_${c.id}`);
          localStorage.removeItem(`tajweed_exam_result_${c.id}`);
          localStorage.removeItem(`tajweed_quiz_answers_${c.id}`);
        });
      } catch (e) {
        console.warn('localStorage clean error:', e);
      }
    }

    if (profile && profile.name) {
      try {
        for (const c of allCourses) {
          await deleteDoc(doc(db, 'student_progress', `${profile.name}_${c.id}`));
        }
        await deleteDoc(doc(db, 'student_progress', profile.name));
      } catch (err) {
        console.warn('Firestore progress doc delete failed:', err);
      }
    }
  }

  notifyListeners();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('tajweed_progress_reset'));
    window.dispatchEvent(new CustomEvent('tajweed_opened_courses_updated', { detail: [] }));
  }
};
