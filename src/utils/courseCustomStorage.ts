import { Course, Unit, Lesson, CourseStatus, CourseLevel } from '../types';
import { ALL_COURSES as DEFAULT_ALL_COURSES, SAKINAN_COURSE } from '../data/courses';

const CUSTOM_COURSES_STORAGE_KEY = 'tajweed_custom_courses_v2';
const COURSES_ORDER_KEY = 'tajweed_courses_order_v2';
const DELETED_COURSES_STORAGE_KEY = 'tajweed_deleted_courses_v2';
const DELETED_COURSES_ARCHIVE_KEY = 'tajweed_deleted_courses_archive_v2';

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
          // Use user's saved status strictly if present, otherwise default
          const status = course.status !== undefined ? course.status : defaultCourse.status;
          return {
            ...defaultCourse,
            ...course,
            status,
            units: (() => {
              const baseUnits = course.units && course.units.length > 0 ? course.units : defaultCourse.units || [];
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
            summaryTable: course.summaryTable && course.summaryTable.length > 0 ? course.summaryTable : defaultCourse.summaryTable,
            exceptionWords: course.exceptionWords && course.exceptionWords.length > 0 ? course.exceptionWords : defaultCourse.exceptionWords,
            quranExamples: course.quranExamples && course.quranExamples.length > 0 ? course.quranExamples : defaultCourse.quranExamples,
            comprehensiveExamBank: course.comprehensiveExamBank && course.comprehensiveExamBank.length > 0 ? course.comprehensiveExamBank : defaultCourse.comprehensiveExamBank,
            pricing: {
              ...defaultCourse.pricing,
              ...course.pricing,
              isPaid: course.pricing?.isPaid !== undefined ? course.pricing.isPaid : (defaultCourse.pricing?.isPaid ?? false),
              priceText: course.pricing?.priceText !== undefined ? course.pricing.priceText : defaultCourse.pricing?.priceText,
              note: course.pricing?.note !== undefined ? course.pricing.note : defaultCourse.pricing?.note,
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

    return [...mergedCourses, ...missingDefaults];
  } catch (e) {
    console.warn('Failed to load custom courses from localStorage, falling back to defaults:', e);
    return DEFAULT_ALL_COURSES.filter((c) => !getDeletedCourseIds().includes(c.id));
  }
};

export const saveAllCourses = (courses: Course[]): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(CUSTOM_COURSES_STORAGE_KEY, JSON.stringify(courses));
    window.dispatchEvent(new CustomEvent('tajweed_courses_updated', { detail: { courses } }));
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
    localStorage.removeItem(CUSTOM_COURSES_STORAGE_KEY);
    localStorage.removeItem(DELETED_COURSES_STORAGE_KEY);
    localStorage.removeItem(DELETED_COURSES_ARCHIVE_KEY);
    window.dispatchEvent(new CustomEvent('tajweed_courses_updated', { detail: { courses: DEFAULT_ALL_COURSES } }));
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
