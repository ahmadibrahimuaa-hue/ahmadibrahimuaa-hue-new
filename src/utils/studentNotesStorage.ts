export interface StudentNote {
  id: string;
  courseId: string;
  courseTitle?: string;
  unitNumber?: number;
  unitTitle?: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const NOTES_STORAGE_KEY = 'tajweed_student_notes_v1';

type NotesListener = (notes: StudentNote[]) => void;
const listeners: NotesListener[] = [];

export const subscribeStudentNotes = (callback: NotesListener): (() => void) => {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
};

const notifyListeners = (notes: StudentNote[]) => {
  listeners.forEach((cb) => {
    try {
      cb(notes);
    } catch (e) {
      console.error('Notes listener error:', e);
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tajweed_notes_updated', { detail: notes }));
  }
};

export const getStudentNotes = (courseId?: string): StudentNote[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    const allNotes: StudentNote[] = raw ? JSON.parse(raw) : [];
    if (courseId && courseId !== 'all') {
      return allNotes.filter((n) => n.courseId === courseId);
    }
    return allNotes;
  } catch {
    return [];
  }
};

export const saveStudentNote = (noteData: Omit<StudentNote, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): StudentNote => {
  const allNotes = getStudentNotes();
  const now = new Date().toLocaleDateString('ar-EG', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let savedNote: StudentNote;

  if (noteData.id) {
    // Update existing
    const existingIndex = allNotes.findIndex((n) => n.id === noteData.id);
    if (existingIndex !== -1) {
      savedNote = {
        ...allNotes[existingIndex],
        ...noteData,
        updatedAt: now,
      };
      allNotes[existingIndex] = savedNote;
    } else {
      savedNote = {
        id: noteData.id,
        courseId: noteData.courseId || 'general',
        courseTitle: noteData.courseTitle || 'ملاحظات عامة',
        unitNumber: noteData.unitNumber,
        unitTitle: noteData.unitTitle,
        title: noteData.title || 'ملاحظة جديدة',
        content: noteData.content || '',
        tags: noteData.tags || [],
        isPinned: noteData.isPinned ?? false,
        createdAt: now,
        updatedAt: now,
      };
      allNotes.unshift(savedNote);
    }
  } else {
    // Create new
    savedNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      courseId: noteData.courseId || 'general',
      courseTitle: noteData.courseTitle || 'ملاحظات عامة',
      unitNumber: noteData.unitNumber,
      unitTitle: noteData.unitTitle,
      title: noteData.title || 'ملاحظة جديدة',
      content: noteData.content || '',
      tags: noteData.tags || [],
      isPinned: noteData.isPinned ?? false,
      createdAt: now,
      updatedAt: now,
    };
    allNotes.unshift(savedNote);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(allNotes));
  }

  notifyListeners(allNotes);
  return savedNote;
};

export const deleteStudentNote = (id: string): void => {
  const allNotes = getStudentNotes().filter((n) => n.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(allNotes));
  }
  notifyListeners(allNotes);
};

export const togglePinStudentNote = (id: string): void => {
  const allNotes = getStudentNotes().map((n) => {
    if (n.id === id) {
      return { ...n, isPinned: !n.isPinned };
    }
    return n;
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(allNotes));
  }
  notifyListeners(allNotes);
};
