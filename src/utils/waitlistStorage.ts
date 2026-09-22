import { collection, doc, setDoc, getDocs, onSnapshot, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { getStudentProfile } from './studentStorage';
import { grantCourseAccessToStudent, revokeCourseAccessFromStudent } from './studentProgressStorage';

export interface WaitlistEntry {
  id?: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  phone?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  paymentStatus: 'unpaid' | 'paid';
  registeredAt: string;
  timestamp: number;
  unlockedAt?: number;
  trainerName?: string;
}

const WAITLIST_KEY = 'tajweed_course_waitlist_v2';

export const getWaitlistEntries = (): WaitlistEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WAITLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getLocalWaitlistSubscriptions = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WAITLIST_KEY);
    if (!raw) return [];
    const entries: WaitlistEntry[] = JSON.parse(raw);
    return entries.map((e) => e.courseId);
  } catch (e) {
    return [];
  }
};

export const isStudentInWaitlist = (courseId: string): boolean => {
  const subs = getLocalWaitlistSubscriptions();
  return subs.includes(courseId);
};

// 1. Join Waitlist / Request Paid Course Enrollment
export const joinCourseWaitlist = async (
  courseId: string,
  courseTitle: string,
  phone?: string,
  notes?: string
): Promise<boolean> => {
  try {
    const profile = getStudentProfile();
    const studentName = profile?.name?.trim() || 'طالب المنصة';
    const now = Date.now();
    const dateFormatted = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const entryId = `${courseId}_${studentName.replace(/\s+/g, '_')}_${now}`;

    const newEntry: WaitlistEntry = {
      id: entryId,
      courseId,
      courseTitle,
      studentName,
      phone: phone || profile?.referralCode || '',
      notes: notes || 'طلب التحاق بقائمة الانتظار / اشتراك الحقيبة',
      status: 'pending',
      paymentStatus: 'unpaid',
      registeredAt: dateFormatted,
      timestamp: now,
      trainerName: profile?.trainerName || '',
    };

    // Save locally
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(WAITLIST_KEY);
      const entries: WaitlistEntry[] = raw ? JSON.parse(raw) : [];
      const existingIndex = entries.findIndex((e) => e.courseId === courseId);
      if (existingIndex >= 0) {
        entries[existingIndex] = newEntry;
      } else {
        entries.push(newEntry);
      }
      localStorage.setItem(WAITLIST_KEY, JSON.stringify(entries));
      window.dispatchEvent(new CustomEvent('tajweed_waitlist_updated', { detail: { courseId } }));
    }

    // Save to Firestore
    try {
      const docRef = doc(db, 'course_waitlist', entryId);
      await setDoc(docRef, newEntry, { merge: true });
    } catch (firestoreErr) {
      console.warn('Firestore waitlist save error (local saved successfully):', firestoreErr);
    }

    return true;
  } catch (e) {
    console.error('Failed to join waitlist:', e);
    return false;
  }
};

// 2. Real-time Subscription for Teacher Dashboard
export const subscribeWaitlistEntries = (callback: (entries: WaitlistEntry[]) => void): (() => void) => {
  let unsubscribeFirestore: (() => void) | null = null;

  const loadFromLocal = (): WaitlistEntry[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(WAITLIST_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  try {
    const q = collection(db, 'course_waitlist');
    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const list: WaitlistEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as WaitlistEntry;
          list.push({ ...data, id: docSnap.id });
        });
        
        // Merge with local if any missing
        const localList = loadFromLocal();
        localList.forEach((localItem) => {
          if (!list.some((it) => it.id === localItem.id || (it.courseId === localItem.courseId && it.studentName === localItem.studentName))) {
            list.push(localItem);
          }
        });

        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        callback(list);
      },
      (error) => {
        console.warn('Firestore onSnapshot waitlist error, falling back to local storage:', error);
        callback(loadFromLocal());
      }
    );
  } catch (e) {
    callback(loadFromLocal());
  }

  return () => {
    if (unsubscribeFirestore) unsubscribeFirestore();
  };
};

// 3. Teacher Action: Confirm Payment & Unlock Course for Student
export const approveAndUnlockStudent = async (
  entry: WaitlistEntry
): Promise<boolean> => {
  try {
    const entryId = entry.id || `${entry.courseId}_${entry.studentName.replace(/\s+/g, '_')}_${entry.timestamp}`;
    const now = Date.now();

    // 1. Grant student course access in local unlocked storage
    grantCourseAccessToStudent(entry.courseId);

    // 2. Update Firestore
    try {
      const docRef = doc(db, 'course_waitlist', entryId);
      await setDoc(
        docRef,
        {
          ...entry,
          status: 'approved',
          paymentStatus: 'paid',
          unlockedAt: now,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore waitlist approval error:', err);
    }

    // 3. Update Local Storage
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(WAITLIST_KEY);
      if (raw) {
        try {
          const entries: WaitlistEntry[] = JSON.parse(raw);
          const updated = entries.map((item) =>
            item.id === entryId || (item.courseId === entry.courseId && item.studentName === entry.studentName)
              ? { ...item, status: 'approved' as const, paymentStatus: 'paid' as const, unlockedAt: now }
              : item
          );
          localStorage.setItem(WAITLIST_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn('Local update error:', e);
        }
      }
      window.dispatchEvent(new CustomEvent('tajweed_waitlist_updated', { detail: { courseId: entry.courseId } }));
    }

    return true;
  } catch (e) {
    console.error('Failed to approve and unlock student:', e);
    return false;
  }
};

// 4. Teacher Action: Revoke/Relock course from Student
export const revokeAndRelockStudent = async (
  entry: WaitlistEntry
): Promise<boolean> => {
  try {
    const entryId = entry.id || `${entry.courseId}_${entry.studentName.replace(/\s+/g, '_')}_${entry.timestamp}`;
    
    // Revoke from local student access
    revokeCourseAccessFromStudent(entry.courseId);

    // Update Firestore
    try {
      const docRef = doc(db, 'course_waitlist', entryId);
      await setDoc(
        docRef,
        {
          ...entry,
          status: 'pending',
          paymentStatus: 'unpaid',
          unlockedAt: undefined,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore update error:', err);
    }

    return true;
  } catch (e) {
    console.error('Failed to revoke access:', e);
    return false;
  }
};

// 5. Delete Waitlist Entry
export const deleteWaitlistEntry = async (entryId: string): Promise<boolean> => {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(WAITLIST_KEY);
      if (raw) {
        const entries: WaitlistEntry[] = JSON.parse(raw);
        const filtered = entries.filter((e) => e.id !== entryId);
        localStorage.setItem(WAITLIST_KEY, JSON.stringify(filtered));
      }
    }

    try {
      await deleteDoc(doc(db, 'course_waitlist', entryId));
    } catch (e) {
      console.warn('Firestore delete error:', e);
    }

    return true;
  } catch (e) {
    console.error('Failed to delete waitlist entry:', e);
    return false;
  }
};
