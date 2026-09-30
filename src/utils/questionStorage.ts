import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ComprehensiveExamQuestion } from '../types';
import { COMPREHENSIVE_EXAM_BANK } from '../data/comprehensiveExamData';
import { CURRICULUM_UNITS } from '../data/curriculumData';
import { IDGHAM_UNITS, IDGHAM_COMPREHENSIVE_EXAM } from '../data/courses/idghamCourse';
import { MAKHARIJ_UNITS, MAKHARIJ_COMPREHENSIVE_EXAM_BANK } from '../data/courses/makharijCourse';
import { FOUNDATIONAL_RULES_COURSE } from '../data/courses/foundationalLessonsCourse';
import { IJAZAH_UNITS, IJAZAH_COMPREHENSIVE_EXAM_BANK } from '../data/courses/ijazahCourse';

export interface UnitQuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuestionsStorageSchema {
  // Backward compatibility fields
  unitQuizzes: Record<number, UnitQuizQuestion[]>;
  comprehensiveBank: ComprehensiveExamQuestion[];
  idghamUnitQuizzes?: Record<number, UnitQuizQuestion[]>;
  idghamComprehensiveBank?: ComprehensiveExamQuestion[];
  makharijUnitQuizzes?: Record<number, UnitQuizQuestion[]>;
  makharijComprehensiveBank?: ComprehensiveExamQuestion[];

  // Generalized multi-course structure: courseId -> { unitQuizzes, comprehensiveBank }
  courses?: Record<string, {
    unitQuizzes: Record<number, UnitQuizQuestion[]>;
    comprehensiveBank: ComprehensiveExamQuestion[];
  }>;

  updatedAt: number;
}

const STORAGE_KEY = 'tajweed_custom_question_bank_v5';
const FIRESTORE_DOC_PATH = ['question_banks', 'all_questions_v5'] as const;

// Helper to construct initial default schema from hardcoded data for all courses
export const getDefaultQuestionBank = (): QuestionsStorageSchema => {
  // 1. Foundational Rules
  const foundationalUnitQuizzes: Record<number, UnitQuizQuestion[]> = {};
  (FOUNDATIONAL_RULES_COURSE.units || []).forEach((unit) => {
    if (unit.quiz && unit.quiz.questions) {
      foundationalUnitQuizzes[unit.unitNumber] = unit.quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: [...q.options],
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      }));
    }
  });

  // 2. Sakinan defaults
  const sakinanUnitQuizzes: Record<number, UnitQuizQuestion[]> = {};
  CURRICULUM_UNITS.forEach((unit) => {
    if (unit.quiz && unit.quiz.questions) {
      sakinanUnitQuizzes[unit.unitNumber] = unit.quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: [...q.options],
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      }));
    }
  });

  // 3. Idgham defaults
  const idghamUnitQuizzes: Record<number, UnitQuizQuestion[]> = {};
  IDGHAM_UNITS.forEach((unit) => {
    if (unit.quiz && unit.quiz.questions) {
      idghamUnitQuizzes[unit.unitNumber] = unit.quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: [...q.options],
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      }));
    }
  });

  // 4. Makharij defaults
  const makharijUnitQuizzes: Record<number, UnitQuizQuestion[]> = {};
  MAKHARIJ_UNITS.forEach((unit) => {
    if (unit.quiz && unit.quiz.questions) {
      makharijUnitQuizzes[unit.unitNumber] = unit.quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: [...q.options],
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      }));
    }
  });

  // 5. Ijazah defaults
  const ijazahUnitQuizzes: Record<number, UnitQuizQuestion[]> = {};
  IJAZAH_UNITS.forEach((unit) => {
    if (unit.quiz && unit.quiz.questions) {
      ijazahUnitQuizzes[unit.unitNumber] = unit.quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: [...q.options],
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      }));
    }
  });

  return {
    unitQuizzes: sakinanUnitQuizzes,
    comprehensiveBank: COMPREHENSIVE_EXAM_BANK.map((q) => ({ ...q })),
    idghamUnitQuizzes,
    idghamComprehensiveBank: IDGHAM_COMPREHENSIVE_EXAM.map((q) => ({ ...q })),
    makharijUnitQuizzes,
    makharijComprehensiveBank: MAKHARIJ_COMPREHENSIVE_EXAM_BANK.map((q) => ({ ...q })),
    courses: {
      foundational_rules: {
        unitQuizzes: foundationalUnitQuizzes,
        comprehensiveBank: (FOUNDATIONAL_RULES_COURSE.comprehensiveExamBank || []).map((q) => ({ ...q })),
      },
      sakinan: {
        unitQuizzes: sakinanUnitQuizzes,
        comprehensiveBank: COMPREHENSIVE_EXAM_BANK.map((q) => ({ ...q })),
      },
      idgham: {
        unitQuizzes: idghamUnitQuizzes,
        comprehensiveBank: IDGHAM_COMPREHENSIVE_EXAM.map((q) => ({ ...q })),
      },
      makharij: {
        unitQuizzes: makharijUnitQuizzes,
        comprehensiveBank: MAKHARIJ_COMPREHENSIVE_EXAM_BANK.map((q) => ({ ...q })),
      },
      ijazah: {
        unitQuizzes: ijazahUnitQuizzes,
        comprehensiveBank: IJAZAH_COMPREHENSIVE_EXAM_BANK.map((q) => ({ ...q })),
      },
    },
    updatedAt: Date.now(),
  };
};

let currentMemoryBank: QuestionsStorageSchema = getDefaultQuestionBank();
let isInitialized = false;
const listeners: Array<() => void> = [];

const notifyListeners = () => {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (err) {
      console.error('Question storage listener error:', err);
    }
  });
};

export const subscribeQuestionBank = (callback: () => void): (() => void) => {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
};

// Load from LocalStorage synchronously
const loadFromLocalStorage = (): QuestionsStorageSchema | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse questions from localStorage:', err);
  }
  return null;
};

// Save to LocalStorage synchronously
const saveToLocalStorage = (data: QuestionsStorageSchema) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save questions to localStorage:', err);
  }
};

// Save to Firestore asynchronously
const saveToFirestore = async (data: QuestionsStorageSchema) => {
  try {
    const docRef = doc(db, FIRESTORE_DOC_PATH[0], FIRESTORE_DOC_PATH[1]);
    await setDoc(docRef, data, { merge: true });
  } catch (err) {
    console.warn('Failed to sync question bank to Firestore:', err);
  }
};

const normalizeBankData = (data: QuestionsStorageSchema): QuestionsStorageSchema => {
  const defaults = getDefaultQuestionBank();
  const courses = { ...defaults.courses, ...(data.courses || {}) };

  // Ensure all standard courses exist
  ['foundational_rules', 'sakinan', 'idgham', 'makharij', 'ijazah'].forEach((cid) => {
    if (!courses[cid]) {
      courses[cid] = defaults.courses![cid];
    }
  });

  return {
    ...defaults,
    ...data,
    courses,
    unitQuizzes: courses.sakinan?.unitQuizzes || data.unitQuizzes || defaults.unitQuizzes,
    comprehensiveBank: courses.sakinan?.comprehensiveBank || data.comprehensiveBank || defaults.comprehensiveBank,
    idghamUnitQuizzes: courses.idgham?.unitQuizzes || data.idghamUnitQuizzes || defaults.idghamUnitQuizzes,
    idghamComprehensiveBank: courses.idgham?.comprehensiveBank || data.idghamComprehensiveBank || defaults.idghamComprehensiveBank,
    makharijUnitQuizzes: courses.makharij?.unitQuizzes || data.makharijUnitQuizzes || defaults.makharijUnitQuizzes,
    makharijComprehensiveBank: courses.makharij?.comprehensiveBank || data.makharijComprehensiveBank || defaults.makharijComprehensiveBank,
  };
};

export const initQuestionStorageSync = () => {
  if (isInitialized) return;
  const local = loadFromLocalStorage();
  if (local) {
    currentMemoryBank = normalizeBankData(local);
  } else {
    currentMemoryBank = getDefaultQuestionBank();
  }
  isInitialized = true;

  // Set up background Firestore real-time listener
  try {
    const docRef = doc(db, FIRESTORE_DOC_PATH[0], FIRESTORE_DOC_PATH[1]);
    onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data() as QuestionsStorageSchema;
          if (remoteData.updatedAt && remoteData.updatedAt > (currentMemoryBank.updatedAt || 0)) {
            currentMemoryBank = normalizeBankData(remoteData);
            saveToLocalStorage(currentMemoryBank);
            notifyListeners();
          }
        }
      },
      (err) => {
        console.warn('Firestore questions onSnapshot error:', err);
      }
    );
  } catch (err) {
    console.warn('Failed to setup Firestore question listener:', err);
  }
};

// Execute sync initialization immediately
initQuestionStorageSync();

const resolveCourseKey = (courseId?: string): string => {
  if (!courseId) return 'foundational_rules';
  return courseId;
};

// --- GETTERS ---
export const getUnitQuizQuestions = (unitNumber: number, courseId: string = 'foundational_rules'): UnitQuizQuestion[] => {
  const cKey = resolveCourseKey(courseId);
  const defaults = getDefaultQuestionBank();

  if (currentMemoryBank.courses?.[cKey]?.unitQuizzes?.[unitNumber]) {
    return currentMemoryBank.courses[cKey].unitQuizzes[unitNumber];
  }

  if (defaults.courses?.[cKey]?.unitQuizzes?.[unitNumber]) {
    return defaults.courses[cKey].unitQuizzes[unitNumber];
  }

  // Fallback for sakinan
  if (cKey === 'sakinan' && currentMemoryBank.unitQuizzes?.[unitNumber]) {
    return currentMemoryBank.unitQuizzes[unitNumber];
  }

  return defaults.courses?.['foundational_rules']?.unitQuizzes?.[unitNumber] || [];
};

const ensureQuestionLevel = (q: ComprehensiveExamQuestion): ComprehensiveExamQuestion => {
  if (q.level) return q;
  const unit = q.unitNumber || 1;
  const level: 'beginner' | 'intermediate' | 'advanced' = unit <= 2 ? 'beginner' : unit <= 4 ? 'intermediate' : 'advanced';
  return { ...q, level };
};

export const getComprehensiveExamBank = (courseId: string = 'foundational_rules'): ComprehensiveExamQuestion[] => {
  const cKey = resolveCourseKey(courseId);
  const defaults = getDefaultQuestionBank();

  let rawList: ComprehensiveExamQuestion[] = [];
  if (currentMemoryBank.courses?.[cKey]?.comprehensiveBank && currentMemoryBank.courses[cKey].comprehensiveBank.length > 0) {
    rawList = currentMemoryBank.courses[cKey].comprehensiveBank;
  } else if (defaults.courses?.[cKey]?.comprehensiveBank && defaults.courses[cKey].comprehensiveBank.length > 0) {
    rawList = defaults.courses[cKey].comprehensiveBank;
  } else if (cKey === 'sakinan' && currentMemoryBank.comprehensiveBank && currentMemoryBank.comprehensiveBank.length > 0) {
    rawList = currentMemoryBank.comprehensiveBank;
  } else {
    rawList = defaults.courses?.['foundational_rules']?.comprehensiveBank || [];
  }

  return rawList.map(ensureQuestionLevel);
};

// --- MUTATORS (TEACHER ACTIONS) ---

export const saveUnitQuizQuestion = async (
  unitNumber: number,
  question: UnitQuizQuestion,
  courseId: string = 'foundational_rules'
) => {
  const cKey = resolveCourseKey(courseId);
  const bank = normalizeBankData(currentMemoryBank);
  if (!bank.courses![cKey]) {
    bank.courses![cKey] = { unitQuizzes: {}, comprehensiveBank: [] };
  }
  const courseBank = bank.courses![cKey];
  const unitList = courseBank.unitQuizzes[unitNumber] ? [...courseBank.unitQuizzes[unitNumber]] : [];

  const existingIdx = unitList.findIndex((q) => q.id === question.id);
  if (existingIdx !== -1) {
    unitList[existingIdx] = question;
  } else {
    const newId = question.id || Date.now();
    unitList.push({ ...question, id: newId });
  }

  courseBank.unitQuizzes[unitNumber] = unitList;

  if (cKey === 'sakinan') {
    bank.unitQuizzes = { ...courseBank.unitQuizzes };
  } else if (cKey === 'makharij') {
    bank.makharijUnitQuizzes = { ...courseBank.unitQuizzes };
  } else if (cKey === 'idgham') {
    bank.idghamUnitQuizzes = { ...courseBank.unitQuizzes };
  }

  bank.updatedAt = Date.now();
  currentMemoryBank = bank;
  saveToLocalStorage(bank);
  notifyListeners();
  await saveToFirestore(bank);
};

export const deleteUnitQuizQuestion = async (
  unitNumber: number,
  questionId: number,
  courseId: string = 'foundational_rules'
) => {
  const cKey = resolveCourseKey(courseId);
  const bank = normalizeBankData(currentMemoryBank);
  if (!bank.courses![cKey]) return;
  const courseBank = bank.courses![cKey];
  
  if (!courseBank.unitQuizzes[unitNumber]) return;

  courseBank.unitQuizzes[unitNumber] = courseBank.unitQuizzes[unitNumber].filter((q) => q.id !== questionId);
  
  if (cKey === 'sakinan') {
    bank.unitQuizzes = { ...courseBank.unitQuizzes };
  } else if (cKey === 'makharij') {
    bank.makharijUnitQuizzes = { ...courseBank.unitQuizzes };
  } else if (cKey === 'idgham') {
    bank.idghamUnitQuizzes = { ...courseBank.unitQuizzes };
  }

  bank.updatedAt = Date.now();
  currentMemoryBank = bank;
  saveToLocalStorage(bank);
  notifyListeners();
  await saveToFirestore(bank);
};

export const saveComprehensiveExamQuestion = async (
  question: ComprehensiveExamQuestion,
  courseId: string = 'foundational_rules'
) => {
  const cKey = resolveCourseKey(courseId);
  const bank = normalizeBankData(currentMemoryBank);
  if (!bank.courses![cKey]) {
    bank.courses![cKey] = { unitQuizzes: {}, comprehensiveBank: [] };
  }
  const courseBank = bank.courses![cKey];
  const examList = [...(courseBank.comprehensiveBank || [])];

  const existingIdx = examList.findIndex((q) => q.id === question.id);
  if (existingIdx !== -1) {
    examList[existingIdx] = question;
  } else {
    const newId = question.id || Date.now();
    examList.push({ ...question, id: newId });
  }

  courseBank.comprehensiveBank = examList;

  if (cKey === 'sakinan') {
    bank.comprehensiveBank = examList;
  } else if (cKey === 'makharij') {
    bank.makharijComprehensiveBank = examList;
  } else if (cKey === 'idgham') {
    bank.idghamComprehensiveBank = examList;
  }

  bank.updatedAt = Date.now();
  currentMemoryBank = bank;
  saveToLocalStorage(bank);
  notifyListeners();
  await saveToFirestore(bank);
};

export const deleteComprehensiveExamQuestion = async (
  questionId: number,
  courseId: string = 'foundational_rules'
) => {
  const cKey = resolveCourseKey(courseId);
  const bank = normalizeBankData(currentMemoryBank);
  if (!bank.courses![cKey]) return;
  const courseBank = bank.courses![cKey];
  
  courseBank.comprehensiveBank = (courseBank.comprehensiveBank || []).filter((q) => q.id !== questionId);

  if (cKey === 'sakinan') {
    bank.comprehensiveBank = courseBank.comprehensiveBank;
  } else if (cKey === 'makharij') {
    bank.makharijComprehensiveBank = courseBank.comprehensiveBank;
  } else if (cKey === 'idgham') {
    bank.idghamComprehensiveBank = courseBank.comprehensiveBank;
  }

  bank.updatedAt = Date.now();
  currentMemoryBank = bank;
  saveToLocalStorage(bank);
  notifyListeners();
  await saveToFirestore(bank);
};

export const resetQuestionsToDefault = async (courseId?: string) => {
  const defaults = getDefaultQuestionBank();
  
  if (!courseId) {
    currentMemoryBank = defaults;
  } else {
    const cKey = resolveCourseKey(courseId);
    const bank = normalizeBankData(currentMemoryBank);
    bank.courses![cKey] = defaults.courses![cKey];
    if (cKey === 'sakinan') {
      bank.unitQuizzes = defaults.unitQuizzes;
      bank.comprehensiveBank = defaults.comprehensiveBank;
    } else if (cKey === 'idgham') {
      bank.idghamUnitQuizzes = defaults.idghamUnitQuizzes;
      bank.idghamComprehensiveBank = defaults.idghamComprehensiveBank;
    }
    bank.updatedAt = Date.now();
    currentMemoryBank = bank;
  }

  saveToLocalStorage(currentMemoryBank);
  notifyListeners();
  await saveToFirestore(currentMemoryBank);
};
