import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { CourseLevel } from '../types';

export interface HomeCurriculumItemConfig {
  courseId: string;
  customTitle?: string;
  customBadge?: string;
  customDescription?: string;
  levelOverride?: CourseLevel;
  levelText?: string;
  isVisible?: boolean;
  isFeatured?: boolean;
  order?: number;
  teacherNote?: string;
}

export type HomeAnnouncementType = 'info' | 'success' | 'warning' | 'emerald';
export type HomeDefaultView = 'all' | 'by_level' | 'current_bag';

export interface HomeConfig {
  mainTitle: string;
  subtitle: string;
  authorText: string;
  platformBadgeText: string;
  introParagraph: string;
  announcementText: string;
  showAnnouncement: boolean;
  announcementType: HomeAnnouncementType;
  defaultViewMode: HomeDefaultView;
  featuredCourseId: string;
  showFavoritesStrip: boolean;
  showStatsCounter: boolean;
  allowStudentChangeActiveBag: boolean;
  curriculumConfigs: Record<string, HomeCurriculumItemConfig>;
  updatedAt: number;
  updatedBy?: string;
}

export const DEFAULT_HOME_CONFIG: HomeConfig = {
  mainTitle: 'المناهج التعليمية المقررة لمادة التجويد والقراءات',
  subtitle: 'منظومة تدريبية متدرجة من التأسيس إلى الإتقان والإجازة',
  authorText: 'جمع وإعداد: أحمد إبراهيم',
  platformBadgeText: 'المنصة التفاعلية الموحدة',
  introParagraph: 'منظومة منهجية متكاملة تبدأ بـ «حقيبة أصول التلاوة والتأسيس التجويدي»، وتتوالى سائر الحقائب التخصصية كـ «التقاء الساكنين» و«أحكام الإدغام» والمخارج والإجازة بالتدرج والإتقان المنهجي.',
  announcementText: 'أهلاً بكم في المنصة التفاعلية! تم تحديث وتصنيف الحقائب التعليمية لتبدأ بالحقيبة التأسيسية الشاملة لأصول التلاوة، مع إمكانية التمرير لكافة الحقائب.',
  showAnnouncement: false,
  announcementType: 'emerald',
  defaultViewMode: 'all',
  featuredCourseId: 'foundational_rules',
  showFavoritesStrip: true,
  showStatsCounter: true,
  allowStudentChangeActiveBag: true,
  curriculumConfigs: {
    foundational_rules: {
      courseId: 'foundational_rules',
      levelOverride: 'beginner',
      levelText: 'المستوى الأول: التأسيس الأول (أصول التلاوة والقواعد)',
      isVisible: true,
      order: 1,
      isFeatured: true,
    },
    sakinan: {
      courseId: 'sakinan',
      levelOverride: 'beginner',
      levelText: 'المستوى الأول: تطبيقات التجويد (التقاء الساكنين)',
      isVisible: true,
      order: 2,
    },
    idgham: {
      courseId: 'idgham',
      levelOverride: 'intermediate',
      levelText: 'المستوى الثاني: متوسط (أحكام الإدغام التخصصية)',
      isVisible: true,
      order: 3,
    },
    makharij: {
      courseId: 'makharij',
      levelOverride: 'advanced',
      levelText: 'المستوى الثالث: متقدم (مخارج الحروف وصفاتها)',
      isVisible: true,
      order: 4,
    },
    ijazah: {
      courseId: 'ijazah',
      levelOverride: 'master',
      levelText: 'المستوى الرابع: متميز (متقن)',
      isVisible: true,
      order: 5,
    },
  },
  updatedAt: Date.now(),
};

const HOME_CONFIG_STORAGE_KEY = 'tajweed_home_config_v1';
const FIRESTORE_SETTINGS_COLLECTION = 'settings';
const FIRESTORE_HOME_DOC_ID = 'home_config';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.warn('Firestore Error in homeConfigStorage:', JSON.stringify(errInfo));
}

let cachedHomeConfig: HomeConfig = { ...DEFAULT_HOME_CONFIG };
let isInitialized = false;
const listeners: Array<(config: HomeConfig) => void> = [];

export const getHomeConfig = (): HomeConfig => {
  if (typeof window === 'undefined') return DEFAULT_HOME_CONFIG;
  if (!isInitialized) {
    try {
      const local = localStorage.getItem(HOME_CONFIG_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        cachedHomeConfig = {
          ...DEFAULT_HOME_CONFIG,
          ...parsed,
          curriculumConfigs: {
            ...DEFAULT_HOME_CONFIG.curriculumConfigs,
            ...(parsed.curriculumConfigs || {}),
          },
        };
      }
    } catch (e) {
      console.warn('Failed to parse home config from localStorage:', e);
    }
    isInitialized = true;
  }
  return cachedHomeConfig;
};

const notifyListeners = (config: HomeConfig) => {
  listeners.forEach((cb) => {
    try {
      cb(config);
    } catch (e) {
      console.error('Home config listener error:', e);
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tajweed_home_config_updated', { detail: config }));
  }
};

export const subscribeHomeConfig = (callback: (config: HomeConfig) => void): (() => void) => {
  listeners.push(callback);
  callback(getHomeConfig());

  // Listen to Firestore updates
  const docRef = doc(db, FIRESTORE_SETTINGS_COLLECTION, FIRESTORE_HOME_DOC_ID);
  const unsubscribeSnapshot = onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const remoteData = snap.data() as Partial<HomeConfig>;
        const merged: HomeConfig = {
          ...DEFAULT_HOME_CONFIG,
          ...remoteData,
          curriculumConfigs: {
            ...DEFAULT_HOME_CONFIG.curriculumConfigs,
            ...(remoteData.curriculumConfigs || {}),
          },
        };
        cachedHomeConfig = merged;
        try {
          localStorage.setItem(HOME_CONFIG_STORAGE_KEY, JSON.stringify(merged));
        } catch {
          // ignore localStorage error
        }
        notifyListeners(merged);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `${FIRESTORE_SETTINGS_COLLECTION}/${FIRESTORE_HOME_DOC_ID}`);
    }
  );

  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
    unsubscribeSnapshot();
  };
};

export const saveHomeConfig = async (
  partialConfig: Partial<HomeConfig>,
  authorName?: string
): Promise<HomeConfig> => {
  const current = getHomeConfig();
  const updated: HomeConfig = {
    ...current,
    ...partialConfig,
    updatedAt: Date.now(),
    ...(authorName ? { updatedBy: authorName } : {}),
  };

  cachedHomeConfig = updated;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(HOME_CONFIG_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  notifyListeners(updated);

  // Sync to Firestore
  try {
    const docRef = doc(db, FIRESTORE_SETTINGS_COLLECTION, FIRESTORE_HOME_DOC_ID);
    await setDoc(docRef, updated, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${FIRESTORE_SETTINGS_COLLECTION}/${FIRESTORE_HOME_DOC_ID}`);
  }

  return updated;
};

export const resetHomeConfig = async (): Promise<HomeConfig> => {
  const resetConfig = { ...DEFAULT_HOME_CONFIG, updatedAt: Date.now() };
  cachedHomeConfig = resetConfig;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(HOME_CONFIG_STORAGE_KEY, JSON.stringify(resetConfig));
    } catch (e) {
      console.warn('LocalStorage reset error:', e);
    }
  }

  notifyListeners(resetConfig);

  try {
    const docRef = doc(db, FIRESTORE_SETTINGS_COLLECTION, FIRESTORE_HOME_DOC_ID);
    await setDoc(docRef, resetConfig);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${FIRESTORE_SETTINGS_COLLECTION}/${FIRESTORE_HOME_DOC_ID}`);
  }

  return resetConfig;
};
