import { Course } from '../../types';
import { SAKINAN_COURSE } from './sakinanCourse';
import { IDGHAM_COURSE } from './idghamCourse';
import { MAKHARIJ_COURSE, IJAZAH_COURSE } from './upcomingCourses';
import { FOUNDATIONAL_RULES_COURSE } from './foundationalLessonsCourse';
import { getCustomStoredCourses } from '../../utils/courseCustomStorage';

export { SAKINAN_COURSE, IDGHAM_COURSE, MAKHARIJ_COURSE, IJAZAH_COURSE, FOUNDATIONAL_RULES_COURSE };

export const ALL_COURSES: Course[] = [
  SAKINAN_COURSE,
  IDGHAM_COURSE,
  MAKHARIJ_COURSE,
  FOUNDATIONAL_RULES_COURSE,
  IJAZAH_COURSE,
];

export const DEFAULT_COURSE_ID = 'sakinan';

export const getAllCourses = (): Course[] => {
  return getCustomStoredCourses();
};

export const getCourseById = (id?: string): Course => {
  const all = getCustomStoredCourses();
  if (!id) return all[0] || SAKINAN_COURSE;
  const found = all.find((c) => c.id === id);
  return found || all[0] || SAKINAN_COURSE;
};

export const getActiveCourses = (): Course[] => {
  return getCustomStoredCourses().filter((c) => (c.status || 'available') === 'available');
};

export const getUpcomingCourses = (): Course[] => {
  return getCustomStoredCourses().filter((c) => c.status === 'coming_soon');
};


