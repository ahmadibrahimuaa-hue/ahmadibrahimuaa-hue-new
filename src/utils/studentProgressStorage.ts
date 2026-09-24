import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getStudentProfile, clearStudentProfile, clearAllSubmissions } from './studentStorage';
import { Course } from '../types';
import { getCourseById } from '../data/courses';
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
    sakinan: getDefaultSingleProgress(),
    idgham: getDefaultSingleProgress(),
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

export const markSectionRead = async (sectionId: string, courseId: string = 'sakinan') => {
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

export const recordExamScore = async (scorePercentage: number, courseId: string = 'sakinan') => {
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

export const isCoursePassed = (courseId: string = 'sakinan'): boolean => {
  const prog = getStudentProgress(courseId);
  return Boolean(prog.examCompleted && prog.examBestScore !== null && prog.examBestScore >= 90);
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

export const getCourseLockDetails = (
  courseId: string,
  isTeacherMode: boolean = false,
  courseObj?: Course
): CourseLockStatus => {
  if (isTeacherMode) {
    return {
      isUnlocked: true,
      statusType: 'teacher_unlocked',
      badgeText: 'مفتوحة (وضع المعلم)',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50',
      explanation: 'وضع المعلم يتيح الوصول الكامل لكافة الحقائب.',
      isExplicitTeacherAction: false,
    };
  }

  const profile = getStudentProfile();
  const studentName = profile?.name?.trim();

  // 1. Check explicit per-student grant/lock from teacher
  if (studentName) {
    const explicit = getExplicitStudentCourseAccess(studentName, courseId);
    if (explicit === true) {
      return {
        isUnlocked: true,
        statusType: 'teacher_unlocked',
        badgeText: 'مفتوحة بقرار المعلم 🔑',
        badgeClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-400 font-bold',
        explanation: `تم منحك صلاحية فتح هذه الحقيبة خصيصاً من قِبل المعلم يا ${studentName}.`,
        isExplicitTeacherAction: true,
      };
    } else if (explicit === false) {
      return {
        isUnlocked: false,
        statusType: 'teacher_locked',
        badgeText: 'مقفلة من قِبل المعلم 🔒',
        badgeClass: 'bg-rose-950/90 text-rose-300 border-rose-500 font-bold',
        explanation: `تم تقييد الوصول لهذه الحقيبة من قِبل المعلم مؤقتاً. يمكنك طلب الفتح عبر واتساب.`,
        isExplicitTeacherAction: true,
      };
    }
  }

  // 2. Check device-level unlock list
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

  if (course.status === 'locked') {
    return {
      isUnlocked: false,
      statusType: 'teacher_locked',
      badgeText: 'مقفلة من المعلم 🔒',
      badgeClass: 'bg-rose-950/90 text-rose-300 border-rose-500 font-bold',
      explanation: 'هذه الحقيبة مقفلة من المعلم، تواصل لطلب فتحها.',
      isExplicitTeacherAction: true,
    };
  }

  if (course.pricing?.isPaid) {
    return {
      isUnlocked: false,
      statusType: 'paid_locked',
      badgeText: `${course.pricing.priceText || 'محتوى مدفوع'} 🔒`,
      badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-500',
      explanation: 'هذه الحقيبة تتطلب اشتراكاً أو إذن المعلم المباشر.',
      isExplicitTeacherAction: false,
    };
  }

  if (courseId === 'foundational_rules') {
    return {
      isUnlocked: true,
      statusType: 'default_unlocked',
      badgeText: 'الحقيبة التأسيسية الأولى (مفتوحة تلقائياً) 🟢',
      badgeClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-500',
      explanation: 'الحقيبة التأسيسية الأولى (أصول التلاوة) مفتوحة لجميع الطلاب تلقائياً.',
      isExplicitTeacherAction: false,
    };
  }

  if (courseId === 'sakinan') {
    return {
      isUnlocked: true,
      statusType: 'default_unlocked',
      badgeText: 'مفتوحة ومتاحة للجميع 🟢',
      badgeClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-500',
      explanation: 'حقيبة قواعد التقاء الساكنين مفتوحة ومتاحة للجميع.',
      isExplicitTeacherAction: false,
    };
  }

  if (courseId === 'idgham') {
    const sakinanPassed = isCoursePassed('sakinan');
    if (sakinanPassed) {
      return {
        isUnlocked: true,
        statusType: 'passed_prerequisite',
        badgeText: 'مفتوحة (تم اجتياز الأولى) ✨',
        badgeClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-400',
        explanation: 'فُتحت تلقائياً لاجتيازك الحقيبة السابقة بنسبة تفوق 90%.',
        isExplicitTeacherAction: false,
      };
    } else {
      return {
        isUnlocked: false,
        statusType: 'locked_prerequisite',
        badgeText: 'مقفلة (تتطلب اجتياز الأولى) 🔒',
        badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-500',
        explanation: 'تُفتح تلقائياً عند اجتياز حقيبة التقاء الساكنين بنسبة 90%، أو بإذن المعلم المباشر.',
        isExplicitTeacherAction: false,
      };
    }
  }

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
  
  if (courseId) {
    currentMultiProgress.courses[courseId] = getDefaultSingleProgress();
    currentMultiProgress.lastUpdated = Date.now();
    saveProgressLocally(currentMultiProgress);

    if (profile && profile.name) {
      try {
        await deleteDoc(doc(db, 'student_progress', `${profile.name}_${courseId}`));
      } catch (err) {
        console.warn('Firestore progress doc delete failed:', err);
      }
    }
  } else {
    currentMultiProgress = {
      courses: {
        sakinan: getDefaultSingleProgress(),
        idgham: getDefaultSingleProgress(),
      },
      lastUpdated: Date.now(),
    };

    saveProgressLocally(currentMultiProgress);

    if (profile && profile.name) {
      try {
        await deleteDoc(doc(db, 'student_progress', `${profile.name}_sakinan`));
        await deleteDoc(doc(db, 'student_progress', `${profile.name}_idgham`));
        await deleteDoc(doc(db, 'student_progress', profile.name));
      } catch (err) {
        console.warn('Firestore progress doc delete failed:', err);
      }
    }

    await clearStudentProfile();
    await clearAllSubmissions();

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('tajweed_unit_quiz_answers_v3');
        localStorage.removeItem('tajweed_unit_quiz_submitted_v3');
        localStorage.removeItem('tajweed_exam_saved_result');
        localStorage.removeItem('tajweed_student_profile');
        localStorage.removeItem('tajweed_student_submissions');
        localStorage.removeItem('tajweed_student_progress_v1');
        localStorage.removeItem(PROGRESS_KEY);
      } catch (e) {
        console.warn('localStorage clean error:', e);
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('tajweed_progress_reset'));
  }
};
