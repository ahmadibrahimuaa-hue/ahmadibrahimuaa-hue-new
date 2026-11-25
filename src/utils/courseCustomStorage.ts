import { doc, setDoc, collection, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Course, Unit, Lesson, CourseStatus, CourseLevel } from '../types';
import { SAKINAN_COURSE } from '../data/courses/sakinanCourse';
import { IDGHAM_COURSE } from '../data/courses/idghamCourse';
import { MAKHARIJ_COURSE, IJAZAH_COURSE } from '../data/courses/upcomingCourses';
import { FOUNDATIONAL_RULES_COURSE } from '../data/courses/foundationalLessonsCourse';

const DEFAULT_ALL_COURSES: Course[] = [
  FOUNDATIONAL_RULES_COURSE,
  SAKINAN_COURSE,
  IDGHAM_COURSE,
  MAKHARIJ_COURSE,
  IJAZAH_COURSE,
];

const CUSTOM_COURSES_STORAGE_KEY = 'tajweed_custom_courses_v2';
const COURSES_ORDER_KEY = 'tajweed_courses_order_v2';
const DELETED_COURSES_STORAGE_KEY = 'tajweed_deleted_courses_v2';
const DELETED_COURSES_ARCHIVE_KEY = 'tajweed_deleted_courses_archive_v2';
const COURSES_META_TS_KEY = 'tajweed_courses_meta_ts_v2';

let isCoursesSyncInitialized = false;

interface CourseOverrideMeta {
  status?: CourseStatus;
  pricing?: Course['pricing'];
  order?: number;
  parentCourseId?: string | null;
  title?: string;
  shortTitle?: string;
  subtitle?: string;
  badge?: string;
  description?: string;
  level?: CourseLevel;
  levelText?: string;
  author?: string;
  expectedDuration?: string;
}

interface CoursesMetaDoc {
  overrides: Record<string, CourseOverrideMeta>;
  courseOrder: string[];
  deletedIds: string[];
  updatedAt: number;
}

const stripUndefined = <T,>(val: T): T => {
  if (Array.isArray(val)) {
    return val.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (val && typeof val === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return val;
};

const getDefaultCourseIds = (): Set<string> => new Set(DEFAULT_ALL_COURSES.map((c) => c.id));

const syncCoursesToFirestore = (courses: Course[], deletedIds: string[], timestamp: number): void => {
  if (typeof window === 'undefined') return;
  try {
    const defaultCourseIds = getDefaultCourseIds();
    const overrides: Record<string, CourseOverrideMeta> = {};
    courses.forEach((c, idx) => {
      overrides[c.id] = stripUndefined({
        status: c.status,
        pricing: c.pricing,
        order: c.order !== undefined ? c.order : idx,
        parentCourseId: c.parentCourseId !== undefined ? c.parentCourseId : null,
        title: c.title,
        shortTitle: c.shortTitle,
        subtitle: c.subtitle,
        badge: c.badge,
        description: c.description,
        level: c.level,
        levelText: c.levelText,
        author: c.author,
        expectedDuration: c.expectedDuration,
      });

      // Persist brand-new custom courses (not in defaults) in custom_courses collection
      if (!defaultCourseIds.has(c.id)) {
        const customDocRef = doc(db, 'custom_courses', c.id);
        setDoc(customDocRef, stripUndefined({ ...c, updatedAt: timestamp }), { merge: true }).catch((err) => {
          console.warn('Firestore custom course sync failed:', err);
        });
      }
    });

    // Remove deleted custom courses from custom_courses if any
    deletedIds.forEach((delId) => {
      if (!defaultCourseIds.has(delId)) {
        deleteDoc(doc(db, 'custom_courses', delId)).catch(() => {});
      }
    });

    const metaPayload: CoursesMetaDoc = {
      overrides,
      courseOrder: courses.map((c) => c.id),
      deletedIds,
      updatedAt: timestamp,
    };

    const metaRef = doc(db, 'settings', 'courses_meta');
    setDoc(metaRef, stripUndefined(metaPayload), { merge: true }).catch((err) => {
      console.warn('Firestore courses_meta sync failed:', err);
    });
  } catch (err) {
    console.warn('Error preparing Firestore courses sync:', err);
  }
};

export const initCoursesFirestoreSync = (): void => {
  if (typeof window === 'undefined' || isCoursesSyncInitialized) return;
  isCoursesSyncInitialized = true;

  let latestRemoteMeta: CoursesMetaDoc | null = null;
  let latestRemoteCustomCourses: Course[] = [];

  const applyRemoteToLocal = () => {
    if (!latestRemoteMeta && latestRemoteCustomCourses.length === 0) return;

    try {
      const localTs = Number(localStorage.getItem(COURSES_META_TS_KEY) || '0');
      const remoteTs = Number(latestRemoteMeta?.updatedAt || '0');

      if (latestRemoteMeta && remoteTs < localTs && localTs > 0) {
        return;
      }

      if (latestRemoteMeta?.deletedIds) {
        localStorage.setItem(DELETED_COURSES_STORAGE_KEY, JSON.stringify(latestRemoteMeta.deletedIds));
      }

      const deletedSet = new Set(latestRemoteMeta?.deletedIds || getDeletedCourseIds());
      const currentCourses = getCustomStoredCourses();
      const courseMap = new Map<string, Course>();

      currentCourses.forEach((c) => {
        if (!deletedSet.has(c.id)) {
          courseMap.set(c.id, c);
        }
      });

      // Add/update custom courses from Firestore
      latestRemoteCustomCourses.forEach((rc) => {
        if (!deletedSet.has(rc.id)) {
          courseMap.set(rc.id, rc);
        }
      });

      // Apply remote metadata overrides (status, pricing, order, parentCourseId, titles, etc.)
      if (latestRemoteMeta?.overrides) {
        Object.entries(latestRemoteMeta.overrides).forEach(([cId, ov]) => {
          if (deletedSet.has(cId)) return;
          const existing = courseMap.get(cId) || DEFAULT_ALL_COURSES.find((d) => d.id === cId);
          if (!existing) return;

          courseMap.set(cId, {
            ...existing,
            status: ov.status || existing.status,
            pricing: ov.pricing ? { ...existing.pricing, ...ov.pricing } : existing.pricing,
            order: ov.order !== undefined ? ov.order : existing.order,
            parentCourseId: ov.parentCourseId !== undefined ? ov.parentCourseId : existing.parentCourseId,
            title: ov.title || existing.title,
            shortTitle: ov.shortTitle || existing.shortTitle,
            subtitle: ov.subtitle || existing.subtitle,
            badge: ov.badge || existing.badge,
            description: ov.description || existing.description,
            level: ov.level || existing.level,
            levelText: ov.levelText || existing.levelText,
            author: ov.author || existing.author,
            expectedDuration: ov.expectedDuration || existing.expectedDuration,
          });
        });
      }

      let mergedList: Course[] = [];
      const orderIds = latestRemoteMeta?.courseOrder || [];
      if (orderIds.length > 0) {
        orderIds.forEach((id) => {
          const item = courseMap.get(id);
          if (item) {
            mergedList.push(item);
            courseMap.delete(id);
          }
        });
      }
      courseMap.forEach((item) => {
        mergedList.push(item);
      });

      localStorage.setItem(CUSTOM_COURSES_STORAGE_KEY, JSON.stringify(mergedList));
      if (remoteTs > 0) {
        localStorage.setItem(COURSES_META_TS_KEY, String(remoteTs));
      }

      window.dispatchEvent(new CustomEvent('tajweed_courses_updated', { detail: { courses: mergedList } }));
      window.dispatchEvent(new CustomEvent('tajweed_unlocked_updated', { detail: mergedList }));
    } catch (err) {
      console.warn('Failed to apply remote courses update:', err);
    }
  };

  try {
    const metaRef = doc(db, 'settings', 'courses_meta');
    onSnapshot(
      metaRef,
      (snap) => {
        if (snap.exists()) {
          latestRemoteMeta = snap.data() as CoursesMetaDoc;
          applyRemoteToLocal();
        }
      },
      (err) => {
        console.warn('Firestore courses_meta onSnapshot error:', err);
      }
    );

    const customColRef = collection(db, 'custom_courses');
    onSnapshot(
      customColRef,
      (snap) => {
        const list: Course[] = [];
        snap.forEach((d) => {
          list.push(d.data() as Course);
        });
        latestRemoteCustomCourses = list;
        if (list.length > 0 || latestRemoteMeta) {
          applyRemoteToLocal();
        }
      },
      (err) => {
        console.warn('Firestore custom_courses onSnapshot error:', err);
      }
    );
  } catch (err) {
    console.warn('Failed to init courses Firestore sync:', err);
  }
};

export const getDeletedCourseIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_COURSES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getDeletedCoursesArchive = (): Course[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_COURSES_ARCHIVE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getCustomStoredCourses = (): Course[] => {
  if (typeof window === 'undefined') return DEFAULT_ALL_COURSES;
  try {
    const deletedIds = getDeletedCourseIds();
    const raw = localStorage.getItem(CUSTOM_COURSES_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_ALL_COURSES.filter((c) => !deletedIds.includes(c.id));
    }
    const parsed: Course[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_ALL_COURSES.filter((c) => !deletedIds.includes(c.id));
    }

    // Merge default courses to ensure built-in methods and rich data are preserved if not explicitly modified
    const mergedCourses = parsed
      .filter((c) => !deletedIds.includes(c.id))
      .map((course) => {
        const defaultCourse = DEFAULT_ALL_COURSES.find((c) => c.id === course.id);
        if (defaultCourse) {
          // Use user's saved status strictly if present without any forced downgrades/upgrades
          const status = course.status || defaultCourse.status;
          return {
            ...defaultCourse,
            ...course,
            status,
            units: (() => {
              // Always prefer defaultCourse units if user has no units or default has more rich units
              const baseUnits = (course.units && course.units.length > 0) ? course.units : defaultCourse.units || [];
              if (baseUnits.length === 0 && (defaultCourse.units || []).length > 0) {
                return defaultCourse.units || [];
              }
              const mappedUnits = baseUnits.map((u) => {
                const defaultUnit = defaultCourse.units?.find((du) => du.id === u.id || du.unitNumber === u.unitNumber);
                if (!defaultUnit) return u;
                const defaultLessons = defaultUnit.lessons || [];
                const mergedLessons = (u.lessons && u.lessons.length > 0 ? u.lessons : defaultLessons).map((l) => {
                  const defaultLesson = defaultLessons.find((dl) => dl.id === l.id || dl.lessonNumber === l.lessonNumber);
                  if (!defaultLesson) return l;
                  return {
                    ...defaultLesson,
                    ...l,
                    discussionQuestions: (l.discussionQuestions && l.discussionQuestions.length > 0)
                      ? l.discussionQuestions
                      : (defaultLesson.discussionQuestions || []),
                    discussionAnswers: (l.discussionAnswers && l.discussionAnswers.length > 0)
                      ? l.discussionAnswers
                      : (defaultLesson.discussionAnswers || []),
                    homeworkTask: (l.homeworkTask && l.homeworkTask.trim()) ? l.homeworkTask : defaultLesson.homeworkTask,
                    homeworkSolution: (l.homeworkSolution && l.homeworkSolution.trim()) ? l.homeworkSolution : defaultLesson.homeworkSolution,
                    recitationTask: (l.recitationTask && l.recitationTask.trim()) ? l.recitationTask : defaultLesson.recitationTask,
                    recitationGuide: (l.recitationGuide && l.recitationGuide.trim()) ? l.recitationGuide : defaultLesson.recitationGuide,
                  };
                });
                return {
                  ...defaultUnit,
                  ...u,
                  lessons: mergedLessons,
                };
              });

              // Ensure newly added units in defaultCourse are included if missing in saved course
              const mappedIds = new Set(mappedUnits.map((u) => u.id));
              const missingDefaultUnits = (defaultCourse.units || []).filter((u) => !mappedIds.has(u.id));
              return [...mappedUnits, ...missingDefaultUnits];
            })(),
            summaryTable: (course.summaryTable && course.summaryTable.length > 0) ? course.summaryTable : defaultCourse.summaryTable,
            exceptionWords: (course.exceptionWords && course.exceptionWords.length > 0) ? course.exceptionWords : defaultCourse.exceptionWords,
            quranExamples: (course.quranExamples && course.quranExamples.length > 0) ? course.quranExamples : defaultCourse.quranExamples,
            comprehensiveExamBank: (course.comprehensiveExamBank && course.comprehensiveExamBank.length > 0) ? course.comprehensiveExamBank : defaultCourse.comprehensiveExamBank,
            books: (course.books && course.books.length > 0) ? course.books : (defaultCourse.books || []),
            pricing: {
              ...defaultCourse.pricing,
              ...course.pricing,
              isPaid: course.pricing?.isPaid !== undefined ? course.pricing.isPaid : (defaultCourse.pricing?.isPaid ?? false),
              priceText: course.pricing?.priceText || defaultCourse.pricing?.priceText || 'متاحة مجاناً ومفتوحة بالكامل',
              note: course.pricing?.note || defaultCourse.pricing?.note || '',
            },
          };
        }
        return course;
      });

    // Include any default courses that were not yet in parsed AND not in deletedIds
    const missingDefaults = DEFAULT_ALL_COURSES.filter(
      (defaultCourse) =>
        !parsed.some((p) => p.id === defaultCourse.id) &&
        !deletedIds.includes(defaultCourse.id)
    );

    // If foundational_rules was missing, ensure it is placed at the top (index 0), not at the bottom
    const allMerged = [...missingDefaults.filter((c) => c.id === 'foundational_rules'), ...mergedCourses, ...missingDefaults.filter((c) => c.id !== 'foundational_rules')];
    
    // Also ensure foundational_rules is first if sakinan is currently at index 0 and no explicit custom order was set
    const foundationalIdx = allMerged.findIndex((c) => c.id === 'foundational_rules');
    if (foundationalIdx > 0 && allMerged[0]?.id === 'sakinan') {
      const [foundationalCourse] = allMerged.splice(foundationalIdx, 1);
      allMerged.unshift(foundationalCourse);
    }

    // If any missing default courses were restored, persist the healed list to localStorage immediately
    // so any component reading the cache or localStorage gets all courses reliably
    if (missingDefaults.length > 0 && typeof window !== 'undefined') {
      try {
        localStorage.setItem(CUSTOM_COURSES_STORAGE_KEY, JSON.stringify(allMerged));
      } catch {
        // ignore localStorage errors
      }
    }

    return allMerged;
  } catch (e) {
    console.warn('Failed to load custom courses from localStorage, falling back to defaults:', e);
    return DEFAULT_ALL_COURSES.filter((c) => !getDeletedCourseIds().includes(c.id));
  }
};

export const saveAllCourses = (courses: Course[]): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const now = Date.now();
    localStorage.setItem(CUSTOM_COURSES_STORAGE_KEY, JSON.stringify(courses));
    localStorage.setItem(COURSES_META_TS_KEY, String(now));
    window.dispatchEvent(new CustomEvent('tajweed_courses_updated', { detail: { courses } }));
    window.dispatchEvent(new CustomEvent('tajweed_unlocked_updated', { detail: courses }));

    syncCoursesToFirestore(courses, getDeletedCourseIds(), now);
    return true;
  } catch (e) {
    console.error('Error saving custom courses:', e);
    return false;
  }
};

export const saveOrUpdateCourse = (course: Course): boolean => {
  // If restoring or updating an existing course that was deleted, remove it from deletedIds
  const deletedIds = getDeletedCourseIds();
  if (deletedIds.includes(course.id)) {
    const updatedDeleted = deletedIds.filter((id) => id !== course.id);
    localStorage.setItem(DELETED_COURSES_STORAGE_KEY, JSON.stringify(updatedDeleted));
  }

  const currentCourses = getCustomStoredCourses();
  const index = currentCourses.findIndex((c) => c.id === course.id);
  let updatedCourses: Course[];

  if (index >= 0) {
    updatedCourses = [...currentCourses];
    updatedCourses[index] = {
      ...updatedCourses[index],
      ...course,
    };
  } else {
    updatedCourses = [...currentCourses, course];
  }

  return saveAllCourses(updatedCourses);
};

export const deleteCourseById = (courseId: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    // 1. Get current active courses to find the course being deleted
    const currentCourses = getCustomStoredCourses();
    const targetCourse = currentCourses.find((c) => c.id === courseId) ||
      DEFAULT_ALL_COURSES.find((c) => c.id === courseId);

    // 2. Archive the course in deleted courses archive so it can be restored if desired
    if (targetCourse) {
      const currentArchive = getDeletedCoursesArchive();
      const existingIdx = currentArchive.findIndex((c) => c.id === courseId);
      let newArchive: Course[];
      if (existingIdx >= 0) {
        newArchive = [...currentArchive];
        newArchive[existingIdx] = targetCourse;
      } else {
        newArchive = [targetCourse, ...currentArchive];
      }
      localStorage.setItem(DELETED_COURSES_ARCHIVE_KEY, JSON.stringify(newArchive));
    }

    // 3. Add to deleted IDs list so it never resurfaces automatically
    const currentDeletedIds = getDeletedCourseIds();
    if (!currentDeletedIds.includes(courseId)) {
      const newDeletedIds = [...currentDeletedIds, courseId];
      localStorage.setItem(DELETED_COURSES_STORAGE_KEY, JSON.stringify(newDeletedIds));
    }

    // 4. Filter out from active courses and save
    const filtered = currentCourses.filter((c) => c.id !== courseId);
    return saveAllCourses(filtered);
  } catch (e) {
    console.error('Error deleting course:', e);
    return false;
  }
};

export const restoreCourseById = (courseId: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    // 1. Remove from deleted IDs
    const currentDeletedIds = getDeletedCourseIds();
    const newDeletedIds = currentDeletedIds.filter((id) => id !== courseId);
    localStorage.setItem(DELETED_COURSES_STORAGE_KEY, JSON.stringify(newDeletedIds));

    // 2. Find course from archive or defaults
    const archive = getDeletedCoursesArchive();
    const archivedCourse = archive.find((c) => c.id === courseId);
    const defaultCourse = DEFAULT_ALL_COURSES.find((c) => c.id === courseId);
    const courseToRestore = archivedCourse || defaultCourse;

    // 3. Remove from archive
    const newArchive = archive.filter((c) => c.id !== courseId);
    localStorage.setItem(DELETED_COURSES_ARCHIVE_KEY, JSON.stringify(newArchive));

    // 4. Add back to active courses
    if (courseToRestore) {
      const currentCourses = getCustomStoredCourses();
      if (!currentCourses.some((c) => c.id === courseId)) {
        const updated = [...currentCourses, courseToRestore];
        return saveAllCourses(updated);
      }
    }
    
    // Trigger update
    window.dispatchEvent(new CustomEvent('tajweed_courses_updated', { detail: { courses: getCustomStoredCourses() } }));
    return true;
  } catch (e) {
    console.error('Error restoring course:', e);
    return false;
  }
};

export const permanentlyDeleteFromArchive = (courseId: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const archive = getDeletedCoursesArchive();
    const newArchive = archive.filter((c) => c.id !== courseId);
    localStorage.setItem(DELETED_COURSES_ARCHIVE_KEY, JSON.stringify(newArchive));
    return true;
  } catch {
    return false;
  }
};

export const updateCourseStatus = (
  courseId: string, 
  status?: CourseStatus, 
  isPaid?: boolean, 
  priceText?: string
): boolean => {
  const currentCourses = getCustomStoredCourses();
  const index = currentCourses.findIndex((c) => c.id === courseId);
  if (index < 0) return false;

  const target = currentCourses[index];
  const newStatus = status !== undefined ? status : target.status;
  const newIsPaid = isPaid !== undefined ? isPaid : (target.pricing?.isPaid ?? false);
  const newPriceText = priceText !== undefined ? priceText : (
    newIsPaid 
      ? (target.pricing?.priceText && target.pricing?.priceText !== 'متاحة مجاناً ومفتوحة' && target.pricing?.priceText !== 'متاحة مجاناً' 
          ? target.pricing.priceText 
          : 'محتوى مدفوع') 
      : 'متاحة مجاناً ومفتوحة'
  );

  const updated: Course = {
    ...target,
    status: newStatus,
    pricing: {
      ...target.pricing,
      isPaid: newIsPaid,
      priceText: newPriceText,
    },
  };

  const updatedCourses = [...currentCourses];
  updatedCourses[index] = updated;
  return saveAllCourses(updatedCourses);
};

export const addUnitToCourse = (courseId: string, unit: Unit): boolean => {
  const currentCourses = getCustomStoredCourses();
  const courseIndex = currentCourses.findIndex((c) => c.id === courseId);
  if (courseIndex < 0) return false;

  const targetCourse = currentCourses[courseIndex];
  const existingUnits = targetCourse.units || [];
  const unitIndex = existingUnits.findIndex((u) => u.id === unit.id);

  let newUnits: Unit[];
  if (unitIndex >= 0) {
    newUnits = [...existingUnits];
    newUnits[unitIndex] = unit;
  } else {
    newUnits = [...existingUnits, unit];
  }

  currentCourses[courseIndex] = {
    ...targetCourse,
    units: newUnits,
  };

  return saveAllCourses(currentCourses);
};

export const deleteUnitFromCourse = (courseId: string, unitId: string): boolean => {
  const currentCourses = getCustomStoredCourses();
  const courseIndex = currentCourses.findIndex((c) => c.id === courseId);
  if (courseIndex < 0) return false;

  const targetCourse = currentCourses[courseIndex];
  const updatedUnits = (targetCourse.units || []).filter((u) => u.id !== unitId);

  currentCourses[courseIndex] = {
    ...targetCourse,
    units: updatedUnits,
  };

  return saveAllCourses(currentCourses);
};

export const addLessonToUnit = (courseId: string, unitId: string, lesson: Lesson): boolean => {
  const currentCourses = getCustomStoredCourses();
  const courseIndex = currentCourses.findIndex((c) => c.id === courseId);
  if (courseIndex < 0) return false;

  const targetCourse = currentCourses[courseIndex];
  const units = targetCourse.units || [];
  const unitIndex = units.findIndex((u) => u.id === unitId);
  if (unitIndex < 0) return false;

  const targetUnit = units[unitIndex];
  const lessons = targetUnit.lessons || [];
  const lessonIndex = lessons.findIndex((l) => l.id === lesson.id);

  let newLessons: Lesson[];
  if (lessonIndex >= 0) {
    newLessons = [...lessons];
    newLessons[lessonIndex] = lesson;
  } else {
    newLessons = [...lessons, lesson];
  }

  const updatedUnit: Unit = {
    ...targetUnit,
    lessons: newLessons,
  };

  const updatedUnits = [...units];
  updatedUnits[unitIndex] = updatedUnit;

  currentCourses[courseIndex] = {
    ...targetCourse,
    units: updatedUnits,
  };

  return saveAllCourses(currentCourses);
};

export const deleteLessonFromUnit = (courseId: string, unitId: string, lessonId: string): boolean => {
  const currentCourses = getCustomStoredCourses();
  const courseIndex = currentCourses.findIndex((c) => c.id === courseId);
  if (courseIndex < 0) return false;

  const targetCourse = currentCourses[courseIndex];
  const units = targetCourse.units || [];
  const unitIndex = units.findIndex((u) => u.id === unitId);
  if (unitIndex < 0) return false;

  const targetUnit = units[unitIndex];
  const lessons = (targetUnit.lessons || []).filter((l) => l.id !== lessonId);

  const updatedUnit: Unit = {
    ...targetUnit,
    lessons,
  };

  const updatedUnits = [...units];
  updatedUnits[unitIndex] = updatedUnit;

  currentCourses[courseIndex] = {
    ...targetCourse,
    units: updatedUnits,
  };

  return saveAllCourses(currentCourses);
};

export const updateCourseLevel = (courseId: string, level: CourseLevel, levelText?: string): boolean => {
  const currentCourses = getCustomStoredCourses();
  const courseIndex = currentCourses.findIndex((c) => c.id === courseId);
  if (courseIndex < 0) return false;

  const targetCourse = currentCourses[courseIndex];
  currentCourses[courseIndex] = {
    ...targetCourse,
    level,
    levelText: levelText || targetCourse.levelText,
  };

  return saveAllCourses(currentCourses);
};

export interface MoveLessonParams {
  sourceCourseId: string;
  sourceUnitId: string;
  lessonId: string;
  targetCourseId: string;
  targetUnitId: string;
  targetLevel?: CourseLevel;
  targetLevelText?: string;
  newUnitTitle?: string;
}

export const moveLessonBetweenBags = ({
  sourceCourseId,
  sourceUnitId,
  lessonId,
  targetCourseId,
  targetUnitId,
  targetLevel,
  targetLevelText,
  newUnitTitle,
}: MoveLessonParams): boolean => {
  const currentCourses = getCustomStoredCourses();

  // 1. Locate source course and unit and lesson
  const sourceCourse = currentCourses.find((c) => c.id === sourceCourseId);
  if (!sourceCourse) return false;
  const sourceUnit = (sourceCourse.units || []).find((u) => u.id === sourceUnitId);
  if (!sourceUnit) return false;
  const lessonToMove = (sourceUnit.lessons || []).find((l) => l.id === lessonId);
  if (!lessonToMove) return false;

  // 2. Locate target course
  const targetCourse = currentCourses.find((c) => c.id === targetCourseId);
  if (!targetCourse) return false;

  // 3. Remove lesson from source
  sourceUnit.lessons = (sourceUnit.lessons || []).filter((l) => l.id !== lessonId);

  // 4. If targetUnitId is '__new__' or unit doesn't exist, create a new unit
  let targetUnit = (targetCourse.units || []).find((u) => u.id === targetUnitId);
  if (!targetUnit || targetUnitId === '__new__') {
    const newUnitNum = (targetCourse.units || []).length + 1;
    targetUnit = {
      id: `unit-${Date.now()}`,
      unitNumber: newUnitNum,
      title: newUnitTitle || `الباب ${newUnitNum}: ${lessonToMove.title}`,
      subtitle: lessonToMove.subtitle || 'وحدة دراسية جديدة',
      description: `وحدة مستحدثة تضم ${lessonToMove.title}`,
      estimatedLectures: 'محاضرتان تدريبيتان',
      lessons: [],
      mindMap: {
        id: `mm-${Date.now()}`,
        label: lessonToMove.title,
        children: []
      },
      unitReviewMarkdown: `### ملخص الوحدة:\nدراسة مستفيضة لمبحث ${lessonToMove.title}`,
      quiz: {
        id: `quiz-${Date.now()}`,
        title: `اختبار ${lessonToMove.title}`,
        questions: []
      },
      commonMistakes: []
    };
    targetCourse.units = [...(targetCourse.units || []), targetUnit];
  }

  // 5. Add lesson to target unit with adjusted lessonNumber
  const newLessonNumber = (targetUnit.lessons || []).length + 1;
  const adjustedLesson: Lesson = {
    ...lessonToMove,
    lessonNumber: newLessonNumber,
  };
  targetUnit.lessons = [...(targetUnit.lessons || []).filter((l) => l.id !== lessonId), adjustedLesson];

  // 6. Update course level if requested
  if (targetLevel) {
    targetCourse.level = targetLevel;
    if (targetLevelText) {
      targetCourse.levelText = targetLevelText;
    }
  }

  return saveAllCourses(currentCourses);
};

export const createBagWithLesson = (
  bagData: {
    id?: string;
    title: string;
    shortTitle?: string;
    subtitle?: string;
    level: CourseLevel;
    levelText?: string;
    author?: string;
    badge?: string;
  },
  lesson: Lesson,
  unitTitle?: string
): boolean => {
  const currentCourses = getCustomStoredCourses();
  const newId = bagData.id || `course-${Date.now()}`;

  const newUnit: Unit = {
    id: `unit-${Date.now()}`,
    unitNumber: 1,
    title: unitTitle || `الباب الأول: ${lesson.title}`,
    subtitle: lesson.subtitle || 'وحدة تعليمية',
    description: `وحدة دراسية مخصصة لـ ${lesson.title}`,
    estimatedLectures: 'محاضرتان تدريبيتان',
    lessons: [{ ...lesson, lessonNumber: 1 }],
    mindMap: {
      id: `mm-${Date.now()}`,
      label: lesson.title,
      children: []
    },
    unitReviewMarkdown: `### ملخص الباب:\nتأصيل شامل لمبحث ${lesson.title}`,
    quiz: {
      id: `quiz-${Date.now()}`,
      title: `اختبار ${lesson.title}`,
      questions: []
    },
    commonMistakes: []
  };

  const newCourse: Course = {
    id: newId,
    title: bagData.title,
    shortTitle: bagData.shortTitle || bagData.title.slice(0, 20),
    subtitle: bagData.subtitle || 'حقيبة تجويدية مستقلة',
    badge: bagData.badge || 'حقيبة مخصصة',
    iconName: 'BookOpen',
    description: `حقيبة تدريبية تم إنشاؤها وتصنيفها من قبل المعلم، وتضم درس: ${lesson.title}`,
    author: bagData.author || 'إعداد وتصنيف المعلم',
    qualificationNote: `أتم بنجاح متطلبات دراسة ${bagData.title}`,
    status: 'available',
    level: bagData.level || 'beginner',
    levelText: bagData.levelText || (bagData.level === 'advanced' ? 'المستوى المتقدم' : 'المستوى التأسيسي'),
    expectedDuration: '4 ساعات تدريبية',
    targetAudience: 'دارسو التجويد ومعلمو الحلقات',
    pricing: {
      isPaid: false,
      priceText: 'متاحة مجاناً'
    },
    previewHighlights: [
      {
        title: lesson.title,
        description: lesson.subtitle || 'درس تجويدي متخصص',
        badge: 'درس رئيسي'
      }
    ],
    units: [newUnit],
    summaryTable: lesson.summaryTable || [],
    exceptionWords: [],
    quranExamples: lesson.examples || [],
    books: [],
    comprehensiveExamBank: []
  };

  const updatedCourses = [...currentCourses, newCourse];
  return saveAllCourses(updatedCourses);
};

export const resetCoursesToDefault = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const now = Date.now();
    localStorage.removeItem(CUSTOM_COURSES_STORAGE_KEY);
    localStorage.removeItem(DELETED_COURSES_STORAGE_KEY);
    localStorage.removeItem(DELETED_COURSES_ARCHIVE_KEY);
    localStorage.setItem(COURSES_META_TS_KEY, String(now));
    syncCoursesToFirestore(DEFAULT_ALL_COURSES, [], now);
    window.dispatchEvent(new CustomEvent('tajweed_courses_updated', { detail: { courses: DEFAULT_ALL_COURSES } }));
    window.dispatchEvent(new CustomEvent('tajweed_unlocked_updated', { detail: DEFAULT_ALL_COURSES }));
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Reorders courses according to an array of course IDs.
 */
export const reorderCourses = (orderedIds: string[]): boolean => {
  const currentCourses = getCustomStoredCourses();
  const idMap = new Map(currentCourses.map((c) => [c.id, c]));

  const reordered: Course[] = [];
  orderedIds.forEach((id, index) => {
    const course = idMap.get(id);
    if (course) {
      reordered.push({ ...course, order: index });
      idMap.delete(id);
    }
  });

  // Append any courses not in orderedIds to preserve data
  idMap.forEach((course) => {
    reordered.push({ ...course, order: reordered.length });
  });

  return saveAllCourses(reordered);
};

/**
 * Moves a course one step up or down in the same level.
 */
export const moveCourseOrder = (courseId: string, direction: 'up' | 'down'): boolean => {
  const currentCourses = getCustomStoredCourses();
  const index = currentCourses.findIndex((c) => c.id === courseId);
  if (index === -1) return false;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= currentCourses.length) return false;

  const updated = [...currentCourses];
  const [removed] = updated.splice(index, 1);
  updated.splice(targetIndex, 0, removed);

  // Update order property
  const withOrder = updated.map((c, idx) => ({ ...c, order: idx }));
  return saveAllCourses(withOrder);
};

/**
 * Nests a course as a sub-bag inside a parent bag.
 */
export const nestCourseInsideParent = (childCourseId: string, parentCourseId: string): boolean => {
  if (childCourseId === parentCourseId) return false;
  const currentCourses = getCustomStoredCourses();
  
  // Prevent circular nesting (cannot nest parent inside its own child)
  const childCourse = currentCourses.find((c) => c.id === childCourseId);
  const parentCourse = currentCourses.find((c) => c.id === parentCourseId);
  if (!childCourse || !parentCourse) return false;

  const updatedCourses = currentCourses.map((c) => {
    if (c.id === childCourseId) {
      return {
        ...c,
        parentCourseId,
      };
    }
    return c;
  });

  return saveAllCourses(updatedCourses);
};

/**
 * Removes a sub-bag from its parent, making it a top-level root bag.
 */
export const unnestCourseToRoot = (courseId: string): boolean => {
  const currentCourses = getCustomStoredCourses();
  const updatedCourses = currentCourses.map((c) => {
    if (c.id === courseId) {
      return {
        ...c,
        parentCourseId: null,
      };
    }
    return c;
  });

  return saveAllCourses(updatedCourses);
};

export const subscribeCourses = (callback: (courses: Course[]) => void) => {
  initCoursesFirestoreSync();

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<{ courses: Course[] }>;
    if (customEvent.detail && customEvent.detail.courses) {
      callback(customEvent.detail.courses);
    } else {
      callback(getCustomStoredCourses());
    }
  };

  window.addEventListener('tajweed_courses_updated', handler);
  // initial call
  callback(getCustomStoredCourses());

  return () => {
    window.removeEventListener('tajweed_courses_updated', handler);
  };
};
