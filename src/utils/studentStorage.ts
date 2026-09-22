import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { StudentSubmission, StudentProfile, ExamDifficultyLevel } from '../types';

const PROFILE_KEY = 'tajweed_student_profile';
const SUBMISSIONS_KEY = 'tajweed_student_submissions';

const profileListeners: Array<(profile: StudentProfile | null) => void> = [];

export const subscribeStudentProfile = (callback: (profile: StudentProfile | null) => void): (() => void) => {
  profileListeners.push(callback);
  return () => {
    const idx = profileListeners.indexOf(callback);
    if (idx !== -1) profileListeners.splice(idx, 1);
  };
};

const notifyProfileListeners = (profile: StudentProfile | null) => {
  profileListeners.forEach((cb) => {
    try {
      cb(profile);
    } catch (e) {
      console.error('Profile listener error:', e);
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tajweed_profile_updated', { detail: profile }));
  }
};

export const getStudentProfile = (): StudentProfile | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(PROFILE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const saveStudentProfile = async (
  name: string,
  trainerId?: string,
  trainerName?: string,
  referralCode?: string
): Promise<StudentProfile> => {
  const cleanName = name.trim() || 'طالب جديد';
  const profile: StudentProfile = {
    name: cleanName,
    registeredAt: new Date().toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    ...(trainerId ? { trainerId } : {}),
    ...(trainerName ? { trainerName } : {}),
    ...(referralCode ? { referralCode } : {}),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  notifyProfileListeners(profile);

  try {
    const studentRef = doc(db, 'students', cleanName);
    await setDoc(studentRef, {
      ...profile,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore profile save failed:', err);
  }

  return profile;
};

export const subscribeStudentSubmissions = (
  callback: (submissions: StudentSubmission[]) => void
): (() => void) => {
  try {
    const unsub = onSnapshot(
      collection(db, 'submissions'),
      (snapshot) => {
        const submissions: StudentSubmission[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          submissions.push({
            id: docSnap.id,
            studentName: data.studentName || 'طالب جديد',
            unitTitle: data.unitTitle || '',
            testType: data.testType || '',
            score: Number(data.score) || 0,
            totalQuestions: Number(data.totalQuestions) || 1,
            percentage: Number(data.percentage) || 0,
            date: data.date || '',
            timestamp: Number(data.timestamp) || 0,
            details: data.details || '',
            trainerId: data.trainerId || '',
            trainerName: data.trainerName || '',
            examLevel: data.examLevel || undefined,
          });
        });
        submissions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        if (typeof window !== 'undefined') {
          localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
        }
        callback(submissions);
      },
      (err) => {
        console.error('Submissions subscription error:', err);
        callback(getStudentSubmissions());
      }
    );
    return unsub;
  } catch (e) {
    console.error('Failed to subscribe submissions:', e);
    callback(getStudentSubmissions());
    return () => {};
  }
};

export const getStudentSubmissions = (): StudentSubmission[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(SUBMISSIONS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const getSubmissionsList = getStudentSubmissions;

export const getStudentSubmissionsAsync = async (): Promise<StudentSubmission[]> => {
  try {
    const colRef = collection(db, 'submissions');
    const snapshot = await getDocs(colRef);
    const submissions: StudentSubmission[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      submissions.push({
        id: docSnap.id,
        studentName: data.studentName || 'طالب جديد',
        unitTitle: data.unitTitle || '',
        testType: data.testType || '',
        score: Number(data.score) || 0,
        totalQuestions: Number(data.totalQuestions) || 1,
        percentage: Number(data.percentage) || 0,
        date: data.date || '',
        timestamp: Number(data.timestamp) || 0,
        details: data.details || '',
        trainerId: data.trainerId || '',
        trainerName: data.trainerName || '',
        examLevel: data.examLevel || undefined,
      });
    });

    submissions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (typeof window !== 'undefined') {
      localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
    }
    return submissions;
  } catch (err) {
    console.warn('Firestore fetch failed, using local storage fallback:', err);
    return getStudentSubmissions();
  }
};

export const saveSubmission = async (
  unitTitle: string,
  testType: string,
  score: number,
  totalQuestions: number,
  isTeacherMode: boolean = false,
  details?: string,
  examLevel?: ExamDifficultyLevel
): Promise<StudentSubmission | null> => {
  // Teachers do NOT register student quiz submissions
  if (isTeacherMode) {
    return null;
  }

  const profile = getStudentProfile();
  const studentName = profile?.name || 'طالب جديد';
  const timestamp = Date.now();

  const submissionData = {
    studentName,
    unitTitle,
    testType,
    score,
    totalQuestions,
    percentage: Math.round((score / totalQuestions) * 100),
    date: new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    timestamp,
    trainerId: profile?.trainerId || '',
    trainerName: profile?.trainerName || '',
    ...(details ? { details } : {}),
    ...(examLevel ? { examLevel } : {}),
  };

  const localSubmission: StudentSubmission = {
    id: 'sub_' + timestamp + '_' + Math.random().toString(36).substring(2, 6),
    ...submissionData,
  };

  const current = getStudentSubmissions();
  const updated = [localSubmission, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(updated));
  }

  try {
    const docRef = await addDoc(collection(db, 'submissions'), submissionData);
    localSubmission.id = docRef.id;
    console.log('Saved submission to Firestore with ID:', docRef.id);
  } catch (err) {
    console.error('Firestore saveSubmission failed:', err);
  }

  return localSubmission;
};

export const logoutStudent = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PROFILE_KEY);
  }
  notifyProfileListeners(null);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tajweed_student_logout'));
  }
};

export const clearStudentProfile = async (): Promise<void> => {
  const current = getStudentProfile();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PROFILE_KEY);
  }
  notifyProfileListeners(null);
  if (current?.name) {
    try {
      await deleteDoc(doc(db, 'students', current.name));
    } catch (err) {
      console.warn('Firestore profile clear failed:', err);
    }
  }
};

export const clearAllSubmissions = async (): Promise<void> => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SUBMISSIONS_KEY);
  }

  try {
    const snapshot = await getDocs(collection(db, 'submissions'));
    const deletePromises = snapshot.docs.map((d) => deleteDoc(doc(db, 'submissions', d.id)));
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn('Firestore clearAllSubmissions failed:', err);
  }
};

export const getRegisteredStudentsAsync = async (): Promise<StudentProfile[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'students'));
    const students: StudentProfile[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as StudentProfile;
      students.push({
        name: data.name || d.id,
        registeredAt: data.registeredAt || '',
        trainerId: data.trainerId || '',
        trainerName: data.trainerName || '',
        referralCode: data.referralCode || '',
      });
    });
    return students;
  } catch (e) {
    console.error('Failed to get students from firestore:', e);
    const prof = getStudentProfile();
    return prof ? [prof] : [];
  }
};

export const subscribeRegisteredStudents = (
  callback: (students: StudentProfile[]) => void
): (() => void) => {
  try {
    const unsub = onSnapshot(
      collection(db, 'students'),
      (snapshot) => {
        const students: StudentProfile[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as StudentProfile;
          students.push({
            name: data.name || d.id,
            registeredAt: data.registeredAt || '',
            trainerId: data.trainerId || '',
            trainerName: data.trainerName || '',
            referralCode: data.referralCode || '',
          });
        });
        callback(students);
      },
      (err) => {
        console.error('Students subscription error:', err);
      }
    );
    return unsub;
  } catch (e) {
    console.error('Failed to setup students subscription:', e);
    return () => {};
  }
};
